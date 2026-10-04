(function () {
  const TOKEN_KEY = 'githubCloudSyncToken';
  const LINK_KEY = 'githubVocabJsonUrl';
  const ENABLED_KEY = 'cloud_enabled';
  const ORIGINAL_LOCAL_GET = chrome.storage.local.get.bind(chrome.storage.local);
  const ORIGINAL_LOCAL_SET = chrome.storage.local.set.bind(chrome.storage.local);
  const ORIGINAL_LOCAL_REMOVE = chrome.storage.local.remove.bind(chrome.storage.local);
  let settingsPromise;
  let statePromise;
  let cloudConfig = { token: '', link: '', enabled: false };
  let recoveryPromptOpen = false;

  function getSyncSettings() {
    if (!settingsPromise) {
      settingsPromise = new Promise((resolve, reject) => {
        chrome.storage.sync.get([TOKEN_KEY, LINK_KEY], result => {
          if (chrome.runtime.lastError) {
            settingsPromise = null;
            reject(chrome.runtime.lastError);
            return;
          }
          cloudConfig.token = result[TOKEN_KEY] || '';
          cloudConfig.link = result[LINK_KEY] || '';
          resolve();
        });
      });
    }
    return settingsPromise;
  }

  function setCloudEnabled(enabled) {
    cloudConfig.enabled = enabled;
    return new Promise((resolve, reject) => {
      ORIGINAL_LOCAL_SET({ [ENABLED_KEY]: enabled }, () => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve();
      });
    });
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes[ENABLED_KEY]) {
      const enabled = changes[ENABLED_KEY].newValue === true;
      if (enabled !== cloudConfig.enabled) {
        cloudConfig.enabled = enabled;
        statePromise = Promise.resolve(enabled);
      }
      return;
    }
    if (areaName === 'sync' && (changes[TOKEN_KEY] || changes[LINK_KEY])) {
      if (changes[TOKEN_KEY]) cloudConfig.token = changes[TOKEN_KEY].newValue || '';
      if (changes[LINK_KEY]) cloudConfig.link = changes[LINK_KEY].newValue || '';
      settingsPromise = Promise.resolve();
      statePromise = setCloudEnabled(false).then(
        () => false,
        error => {
          console.error('Could not disable cloud mode after GitHub settings changed:', error);
          return false;
        }
      );
    }
  });

  function resolveContentsEndpoint(link) {
    let url;
    try {
      url = new URL(link);
    } catch {
      throw new Error('Enter a valid GitHub link to the vocab.json file.');
    }
    if (url.protocol !== 'https:' || !url.pathname.endsWith('/vocab.json')) {
      throw new Error('The GitHub link must use HTTPS and point directly to a file ending in vocab.json.');
    }

    const parts = url.pathname.split('/').filter(Boolean);
    const encodePathPart = part => encodeURIComponent(decodeURIComponent(part));
    const normalizeBranchRef = branch => {
      const decodedBranch = decodeURIComponent(branch);
      return decodedBranch.startsWith('refs/heads/')
        ? decodedBranch.slice('refs/heads/'.length)
        : decodedBranch;
    };
    const getBranchAndPath = (rawBranch, rawPath) => {
      let branch = decodeURIComponent(rawBranch);
      const path = [...rawPath];
      if (branch === 'refs' && path[0] === 'heads' && path.length > 2) {
        path.shift();
        branch = decodeURIComponent(path.shift());
      }
      return { branch: normalizeBranchRef(branch), path };
    };
    if (url.hostname === 'github.com' && parts.length >= 5 && parts[2] === 'blob') {
      const [owner, repo, , rawBranch, ...rawPath] = parts;
      const { branch, path } = getBranchAndPath(rawBranch, rawPath);
      return {
        endpoint: `https://api.github.com/repos/${encodePathPart(owner)}/${encodePathPart(repo)}/contents/${path.map(encodePathPart).join('/')}`,
        branch
      };
    }
    if (url.hostname === 'raw.githubusercontent.com' && parts.length >= 4) {
      const [owner, repo, rawBranch, ...rawPath] = parts;
      const { branch, path } = getBranchAndPath(rawBranch, rawPath);
      return {
        endpoint: `https://api.github.com/repos/${encodePathPart(owner)}/${encodePathPart(repo)}/contents/${path.map(encodePathPart).join('/')}`,
        branch
      };
    }
    if (url.hostname === 'api.github.com' && parts.length >= 5 &&
      parts[0] === 'repos' && parts[3] === 'contents') {
      const [, owner, repo, , ...path] = parts;
      return {
        endpoint: `https://api.github.com/repos/${encodePathPart(owner)}/${encodePathPart(repo)}/contents/${path.map(encodePathPart).join('/')}`,
        branch: url.searchParams.get('ref') || undefined
      };
    }
    throw new Error('Use a github.com blob link, a raw.githubusercontent.com link, or a GitHub contents API link.');
  }

  function buildApiUrl(file) {
    return file.branch
      ? `${file.endpoint}?ref=${encodeURIComponent(file.branch)}`
      : file.endpoint;
  }

  function decodeContent(content) {
    const binary = atob(content.replace(/\s/g, ''));
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function encodeContent(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
    }
    return btoa(binary);
  }

  function extractVocabList(jsonText) {
    //console.log(jsonText);
    let document;
    try {
      document = JSON.parse(jsonText);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('GitHub returned empty or invalid JSON for vocab.json. Check that the file is valid JSON.');
      }
      throw error;
    }
    if (Array.isArray(document)) return { document, vocabList: document };
    if (document && typeof document === 'object' && Array.isArray(document.vocabList)) {
      return { document, vocabList: document.vocabList };
    }
    throw new Error('The linked JSON must contain a vocabList array or be a vocabulary array.');
  }

  async function requestGitHub(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${cloudConfig.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(options.headers || {})
      }
    });
    if (!response.ok) {
      let detail = '';
      try {
        const body = await response.json();
        detail = body.message ? `: ${body.message}` : '';
      } catch {
        // Keep the HTTP status as the error when GitHub does not return JSON.
      }
      throw new Error(`GitHub API request failed (${response.status})${detail}`);
    }
    return response.json();
  }

  async function requestGitHubRaw(path) {
    const response = await fetch(path, {
      headers: {
        Accept: 'application/vnd.github.raw+json',
        Authorization: `Bearer ${cloudConfig.token}`,
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    if (!response.ok) {
      throw new Error(`Could not download vocab.json from GitHub API (${response.status}).`);
    }
    return response.text();
  }

  async function requestDownloadUrl(downloadUrl) {
    const url = new URL(downloadUrl);
    if (url.protocol !== 'https:' || url.hostname !== 'raw.githubusercontent.com') {
      throw new Error('GitHub returned an unexpected download URL for vocab.json.');
    }
    const response = await fetch(url.href, {
      headers: {
        Accept: 'text/plain'
      }
    });
    if (!response.ok) {
      throw new Error(`Could not download vocab.json from GitHub (${response.status}).`);
    }
    return response.text();
  }

  function looksLikeContentsMetadata(text) {
    try {
      const value = JSON.parse(text);
      return value && typeof value === 'object' &&
        value.type === 'file' &&
        typeof value.download_url === 'string' &&
        Object.prototype.hasOwnProperty.call(value, 'content');
    } catch {
      return false;
    }
  }

  async function readRemoteFile() {
    const file = resolveContentsEndpoint(cloudConfig.link);
    const response = await requestGitHub(buildApiUrl(file));
    let jsonText;
    if (response.encoding === 'base64' && typeof response.content === 'string' && response.content.trim()) {
      jsonText = decodeContent(response.content);
    } else if (response.download_url) {
      try {
        jsonText = await requestDownloadUrl(response.download_url);
      } catch (downloadError) {
        console.warn('GitHub download URL failed; trying the Contents API raw response.', downloadError);
        jsonText = await requestGitHubRaw(buildApiUrl(file));
      }
      if (looksLikeContentsMetadata(jsonText)) {
        throw new Error('GitHub returned file metadata instead of vocab.json content. The raw file download did not succeed.');
      }
    } else {
      throw new Error('GitHub did not return vocab.json content or a downloadable file URL.');
    }
    if (looksLikeContentsMetadata(jsonText)) {
      throw new Error('GitHub returned file metadata instead of vocab.json content. The raw file download did not succeed.');
    }
    const { document, vocabList } = extractVocabList(jsonText);
    return { file, response, document, vocabList };
  }

  async function writeRemoteFile(file, response, document, message) {
    const payload = {
      message: `FLIZ ${message} - ${new Date().toISOString()}`,
      content: encodeContent(JSON.stringify(document, null, 2)),
      sha: response.sha
    };
    if (file.branch) payload.branch = file.branch;
    await requestGitHub(file.endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  async function writeGitHubVocab(vocabList, message = 'automatically saved vocabulary') {
    const { file, response, document } = await readRemoteFile();
    const updatedDocument = Array.isArray(document)
      ? vocabList
      : { ...document, vocabList };
    await writeRemoteFile(file, response, updatedDocument, message);
  }

  function showRecoveryDialog(error) {
    if (recoveryPromptOpen) return;
    recoveryPromptOpen = true;
    const managerDialog = document.getElementById('cloudVocabSyncDialog');
    if (managerDialog && typeof managerDialog.showModal === 'function') {
      const status = document.getElementById('cloudVocabModeStatus');
      if (status) status.textContent = `GitHub access failed. Vocabulary is using Chrome storage. Update your GitHub settings and check access again. (${error.message})`;
      if (!managerDialog.open) managerDialog.showModal();
      managerDialog.addEventListener('close', () => { recoveryPromptOpen = false; }, { once: true });
      return;
    }

    const dialog = document.createElement('dialog');
    dialog.setAttribute('aria-labelledby', 'cloudRecoveryTitle');
    dialog.style.cssText = 'width:min(520px,calc(100vw - 32px));padding:24px;border:1px solid #aaa;border-radius:16px;background:#fff;color:#222;';
    const title = document.createElement('h2');
    title.id = 'cloudRecoveryTitle';
    title.textContent = 'GitHub Cloud Sync Needs Attention';
    const message = document.createElement('p');
    message.textContent = `GitHub access failed. Vocabulary is using Chrome storage for now. ${error.message}`;
    const form = document.createElement('form');
    const tokenLabel = document.createElement('label');
    tokenLabel.htmlFor = 'cloudRecoveryToken';
    tokenLabel.textContent = 'GitHub token';
    const token = document.createElement('input');
    token.id = 'cloudRecoveryToken';
    token.type = 'password';
    token.autocomplete = 'new-password';
    token.required = true;
    token.style.cssText = 'display:block;width:100%;margin:8px 0 14px;padding:10px;';
    const linkLabel = document.createElement('label');
    linkLabel.htmlFor = 'cloudRecoveryLink';
    linkLabel.textContent = 'Link to vocab.json';
    const link = document.createElement('input');
    link.id = 'cloudRecoveryLink';
    link.type = 'url';
    link.required = true;
    link.style.cssText = 'display:block;width:100%;margin:8px 0 14px;padding:10px;';
    const status = document.createElement('p');
    status.setAttribute('role', 'status');
    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;';
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Close';
    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.textContent = 'Save & Check GitHub';
    actions.append(close, submit);
    form.append(tokenLabel, token, linkLabel, link, status, actions);
    dialog.append(title, message, form);
    document.body.appendChild(dialog);

    chrome.storage.sync.get([TOKEN_KEY, LINK_KEY], settings => {
      if (chrome.runtime.lastError) {
        status.textContent = 'Could not load saved GitHub settings.';
        console.error('Could not load GitHub settings for recovery:', chrome.runtime.lastError);
      } else {
        link.value = settings[LINK_KEY] || '';
      }
    });
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      recoveryPromptOpen = false;
      dialog.remove();
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      submit.disabled = true;
      status.textContent = 'Saving settings and checking GitHub access...';
      try {
        await new Promise((resolve, reject) => {
          chrome.storage.sync.set({ [TOKEN_KEY]: token.value.trim(), [LINK_KEY]: link.value.trim() }, () => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else resolve();
          });
        });
        settingsPromise = Promise.resolve();
        await verifyAndEnableCloudMode();
        status.textContent = 'GitHub read/write check succeeded. Cloud Mode is enabled.';
        token.value = '';
      } catch (checkError) {
        console.error('GitHub access check failed:', checkError);
        status.textContent = `GitHub access check failed: ${checkError.message}`;
      } finally {
        submit.disabled = false;
      }
    });
    dialog.showModal();
  }

  async function disableAfterFailure(error) {
    console.error('Cloud vocabulary operation failed; falling back to Chrome storage:', error);
    try {
      await setCloudEnabled(false);
    } catch (storageError) {
      console.error('Could not disable cloud mode after GitHub failure:', storageError);
    }
    cloudConfig.enabled = false;
    statePromise = Promise.resolve(false);
    showRecoveryDialog(error);
  }

  async function checkGitHubAccess() {
    settingsPromise = null;
    await getSyncSettings();
    if (!cloudConfig.token) throw new Error('Enter a GitHub personal access token.');
    if (!cloudConfig.link) throw new Error('Enter a link to the GitHub vocab.json file.');
    const { file, response, document: jsonDocument } = await readRemoteFile();
    await writeRemoteFile(
      file,
      response,
      jsonDocument,
      'cloud access read/write verification'
    );
  }

  async function verifyAndEnableCloudMode() {
    try {
      await checkGitHubAccess();
      await setCloudEnabled(true);
      statePromise = Promise.resolve(true);
      return true;
    } catch (error) {
      await setCloudEnabled(false).catch(storageError => {
        console.error('Could not save cloud_enabled=false after access check failed:', storageError);
      });
      statePromise = Promise.resolve(false);
      throw error;
    }
  }

  function ensureCloudMode() {
    if (!statePromise) {
      statePromise = new Promise((resolve, reject) => {
        ORIGINAL_LOCAL_GET(ENABLED_KEY, async result => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }
          if (typeof result[ENABLED_KEY] === 'boolean') {
            cloudConfig.enabled = result[ENABLED_KEY];
            if (cloudConfig.enabled) {
              try {
                await getSyncSettings();
              } catch (error) {
                await disableAfterFailure(error);
                resolve(false);
                return;
              }
              if (!cloudConfig.token || !cloudConfig.link) {
                const error = new Error('Cloud Mode is enabled but the GitHub token or vocab.json link is missing.');
                await disableAfterFailure(error);
                resolve(false);
                return;
              }
            }
            resolve(cloudConfig.enabled);
            return;
          }
          try {
            await setCloudEnabled(false);
            await verifyAndEnableCloudMode();
            resolve(true);
          } catch (error) {
            await setCloudEnabled(false).catch(storageError => {
              console.error('Could not save cloud_enabled=false:', storageError);
            });
            statePromise = Promise.resolve(false);
            showRecoveryDialog(error);
            resolve(false);
          }
        });
      });
    }
    return statePromise;
  }

  function wantsVocabList(keys) {
    if (keys === null || keys === undefined || keys === 'vocabList') return true;
    if (Array.isArray(keys)) return keys.includes('vocabList');
    return typeof keys === 'object' && Object.prototype.hasOwnProperty.call(keys, 'vocabList');
  }

  function withoutVocabList(keys) {
    if (keys === null || keys === undefined) return keys;
    if (Array.isArray(keys)) return keys.filter(key => key !== 'vocabList');
    if (typeof keys === 'string') return keys === 'vocabList' ? [] : keys;
    if (typeof keys === 'object') {
      const remaining = { ...keys };
      delete remaining.vocabList;
      return remaining;
    }
    return keys;
  }

  function hasKeys(keys) {
    return keys === null || keys === undefined ||
      (Array.isArray(keys) && keys.length > 0) ||
      (typeof keys === 'string' && keys.length > 0) ||
      (typeof keys === 'object' && Object.keys(keys).length > 0);
  }

  function runWithCallback(operation, callback) {
    if (typeof callback === 'function') {
      operation.then(callback, error => {
        console.error('Cloud vocabulary storage operation failed:', error);
        callback({});
      });
      return undefined;
    }
    return operation;
  }

  chrome.storage.local.get = function (keys, callback) {
    if (typeof keys === 'function') {
      callback = keys;
      keys = null;
    }
    if (!wantsVocabList(keys)) return ORIGINAL_LOCAL_GET(keys, callback);

    const operation = (async () => {
      const enabled = await ensureCloudMode();
      if (!enabled) return new Promise(resolve => ORIGINAL_LOCAL_GET(keys, resolve));
      try {
        const otherKeys = withoutVocabList(keys);
        const localDataPromise = hasKeys(otherKeys)
          ? new Promise(resolve => ORIGINAL_LOCAL_GET(otherKeys, resolve))
          : Promise.resolve({});
        const [localData, { vocabList }] = await Promise.all([localDataPromise, readRemoteFile()]);
        return { ...localData, vocabList };
      } catch (error) {
        await disableAfterFailure(error);
        return new Promise(resolve => ORIGINAL_LOCAL_GET(keys, resolve));
      }
    })();
    return runWithCallback(operation, callback);
  };

  chrome.storage.local.set = function (items, callback) {
    if (!items || !Object.prototype.hasOwnProperty.call(items, 'vocabList')) {
      return ORIGINAL_LOCAL_SET(items, callback);
    }

    const operation = (async () => {
      const enabled = await ensureCloudMode();
      if (!enabled) return new Promise(resolve => ORIGINAL_LOCAL_SET(items, resolve));
      try {
        await writeGitHubVocab(items.vocabList);
        const remainingItems = { ...items };
        delete remainingItems.vocabList;
        if (Object.keys(remainingItems).length) {
          await new Promise(resolve => ORIGINAL_LOCAL_SET(remainingItems, resolve));
        }
      } catch (error) {
        await disableAfterFailure(error);
        await new Promise(resolve => ORIGINAL_LOCAL_SET(items, resolve));
      }
    })();
    return runWithCallback(operation, callback);
  };

  chrome.storage.local.remove = function (keys, callback) {
    const removesVocabList = keys === 'vocabList' ||
      (Array.isArray(keys) && keys.includes('vocabList'));
    if (!removesVocabList) return ORIGINAL_LOCAL_REMOVE(keys, callback);

    const operation = (async () => {
      const enabled = await ensureCloudMode();
      if (!enabled) return new Promise(resolve => ORIGINAL_LOCAL_REMOVE(keys, resolve));
      try {
        await writeGitHubVocab([], 'automatically cleared vocabulary');
        const remainingKeys = Array.isArray(keys) ? keys.filter(key => key !== 'vocabList') : [];
        if (remainingKeys.length) {
          await new Promise(resolve => ORIGINAL_LOCAL_REMOVE(remainingKeys, resolve));
        }
      } catch (error) {
        await disableAfterFailure(error);
        await new Promise(resolve => ORIGINAL_LOCAL_REMOVE(keys, resolve));
      }
    })();
    return runWithCallback(operation, callback);
  };

  window.flizCloudVocabStorage = { verifyAndEnableCloudMode };
})();
