// document.getElementById('addVocabForm').addEventListener('submit', function(e) {
//   e.preventDefault();
import * as utils from '../utils/index.js';

const CLOUD_SYNC_TOKEN_KEY = 'githubCloudSyncToken';
const GITHUB_VOCAB_JSON_URL_KEY = 'githubVocabJsonUrl';
const CLOUD_VOCAB_MODE_KEY = 'cloud_enabled';

chrome.storage.sync.getBytesInUse(null, function (bytesInUse) {
  console.log('Sync storage used: ' + bytesInUse + ' bytes');
});

chrome.storage.local.getBytesInUse(null, function (bytesInUse) {
  console.log('Local storage used: ' + bytesInUse + ' bytes');
});
//   const word = document.getElementById('word').value;
//   const definition = document.getElementById('definition').value;
//   const book = document.getElementById('bookSelector').value;
//   const pronounciation = document.getElementById('pronounciation').value;
//   const gender = document.getElementById('gender').value;
//   lastBook = book;
//   // Get existing vocab data from Chrome storage
//   chrome.storage.local.get('vocabList', function(data) {
//     let vocabList = data.vocabList || [];
//     //console.log(data.vocabList)
//     if(book === "add New Vocab collection"||book ==="addNew"){
//       book = "Default"
//     }
//     chrome.storage.local.set({ lastBook: book });
//     lastBook = book;
//     console.log(book)

//     populateBookSelector()
//     // Append the new word, definition, snoozed field, and seen field
//     vocabList.push({ word, definition, snoozed: false , book, gender,pronounciation,seen: 0, quizResults: ['n','n','n','n']});
//     // Save updated vocab list to Chrome storage
//     chrome.storage.local.set({ vocabList: vocabList }, function() {
//       updateVocabList(vocabList);
//       // Clear form fields
//       document.getElementById('addVocabForm').reset();
//     });
//   });
// });

// document.getElementById("importButton").addEventListener("click", function() {
//   chrome.tabs.create({ url: 'inflections/inflections.html' });
// });
document.getElementById('clearButton').addEventListener('click', function () {
  if (!confirm('Are you sure you want to clear all vocabulary data? A backup JSON of vocabList will be downloaded first.')) {
    return;
  }

  chrome.storage.local.get('vocabList', function (data) {
    const vocabBackup = { vocabList: data.vocabList || [] };

    utils.exportToJson(vocabBackup, function () {
      chrome.storage.local.remove('vocabList', function () {
        console.log('Chrome storage local vocabList cleared');
        clearDisplayFilters();
        renderBookFilters([]);
        updateVocabList([]);
      });
    }, 'vocabList-backup-');
  });
});
document.getElementById('searchEditVocabBtn').addEventListener('click', function () {
  const container = document.getElementById('searchEditVocabContainer');
  container.style.display = 'block';
  document.getElementById('searchEditVocabMsg').textContent = '';
});
function closeSearchEditContainer() {
  const container = document.getElementById('searchEditVocabContainer');
  if (container) {
    container.style.setProperty('display', 'none', 'important');
  }
  const editForm = document.getElementById('editVocabForm');
  if (editForm) {
    editForm.style.display = 'none';
  }
  const msg = document.getElementById('searchEditVocabMsg');
  if (msg) {
    msg.textContent = '';
  }
}
document.getElementById('closeSearchEditVocab').addEventListener('click', function (e) {
  e.preventDefault();
  e.stopPropagation();
  closeSearchEditContainer();
});

const bulkSearchContainer = document.getElementById('bulkSearchVocabContainer');
const bulkSearchMessage = document.getElementById('bulkSearchVocabMsg');

function populateBulkSearchCollections() {
  chrome.storage.local.get({ bookList: [], lastBook: '' }, ({ bookList, lastBook }) => {
    const selector = document.getElementById('bulkSearchCollection');
    selector.innerHTML = '';
    (bookList || []).forEach(book => {
      const option = document.createElement('option');
      option.value = book;
      option.textContent = book;
      selector.appendChild(option);
    });
    if (lastBook && [...selector.options].some(option => option.value === lastBook)) {
      selector.value = lastBook;
    }
  });
}

document.getElementById('bulkSearchVocabBtn').addEventListener('click', () => {
  populateBulkSearchCollections();
  bulkSearchContainer.style.display = 'block';
  bulkSearchMessage.textContent = '';
});

document.getElementById('closeBulkSearchVocab').addEventListener('click', () => {
  bulkSearchContainer.style.display = 'none';
  bulkSearchMessage.textContent = '';
});

function normaliseBulkSearchWord(word, language) {
  const cleaned = word.replace(/\(.*?\)/g, '').replace(/\/.*$/g, '').replace(/[!?]/g, '').trim();
  return ['de', 'fr'].includes(language)
    ? cleaned
    : cleaned.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function fetchBulkSearchVocab(word, language, book) {
  const lookupWord = normaliseBulkSearchWord(word, language);
  if (!lookupWord) return null;

  let vocab;
  try {
    const response = await fetch(`https://en.wiktionary.org/wiki/${encodeURIComponent(lookupWord)}`);
    if (response.ok) {
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      console.log('Fetching vocab for', lookupWord, 'in language', language, 'from book', book);
      if (language === 'la') {
        vocab = await utils.getLatinAttributes(doc, word, book);
        if (vocab && vocab.vocabResult) vocab = vocab.vocabResult;
      } else {
        vocab = await utils.getLinkedAttributes(doc, word, language, book);
      }
    }
  } catch (error) {
    console.warn('Wiktionary lookup failed; trying Google Translate for', word, error);
  }

  if (vocab && typeof vocab !== 'string' && vocab.word && vocab.definition) {
    if (language === 'zh') vocab.word = word;
    vocab.book = book;
    vocab.language = language;
    return vocab;
  }

  const translatedVocab = await utils.getGoogleTranslationVocab(word, language, book);
  if (!translatedVocab || typeof translatedVocab === 'string' ||
    !translatedVocab.word || !translatedVocab.definition) {
    return null;
  }
  translatedVocab.book = book;
  translatedVocab.language = language;
  utils.addType(translatedVocab);
  return translatedVocab;
}

function showBulkSearchResults(found, failed, additionsCount, skippedDuplicates) {
  const dialog = document.getElementById('bulkSearchResultsDialog');
  const summary = document.getElementById('bulkSearchResultsSummary');
  const results = document.getElementById('bulkSearchResultsList');
  const failures = document.getElementById('bulkSearchResultsFailures');

  summary.textContent = `Added ${additionsCount} word${additionsCount === 1 ? '' : 's'}.` +
    (skippedDuplicates ? ` Skipped ${skippedDuplicates} duplicate${skippedDuplicates === 1 ? '' : 's'}.` : '');
  results.replaceChildren();
  found.forEach(({ word, definition }) => {
    const item = document.createElement('li');
    const term = document.createElement('strong');
    const meaning = document.createElement('span');
    term.textContent = word;
    meaning.textContent = definition;
    item.append(term, meaning);
    results.appendChild(item);
  });
  if (!found.length) {
    const item = document.createElement('li');
    item.textContent = 'No definitions were found.';
    results.appendChild(item);
  }
  failures.textContent = failed.length ? `Could not find: ${failed.join(', ')}` : '';
  dialog.showModal();
}

document.getElementById('runBulkSearchVocab').addEventListener('click', async () => {
  const button = document.getElementById('runBulkSearchVocab');
  const words = [...new Set(document.getElementById('bulkSearchWords').value
    .split(/[\r\n,]+/)
    .map(word => word.trim())
    .filter(Boolean))];
  const language = document.getElementById('bulkSearchLanguage').value;
  const book = document.getElementById('bulkSearchCollection').value;

  if (!words.length) {
    bulkSearchMessage.textContent = 'Paste at least one word to search.';
    return;
  }
  if (!book) {
    bulkSearchMessage.textContent = 'Choose a collection before searching.';
    return;
  }

  button.disabled = true;
  const failed = [];
  const found = [];
  try {
    for (let index = 0; index < words.length; index += 1) {
      const word = words[index];
      bulkSearchMessage.textContent = `Searching ${index + 1} of ${words.length}: ${word}`;
      try {
        const vocab = await fetchBulkSearchVocab(word, language, book);
        if (vocab) found.push(vocab);
        else failed.push(word);
      } catch (error) {
        console.error('Bulk vocabulary lookup failed for', word, error);
        failed.push(word);
      }
    }

    const { vocabList = [] } = await chrome.storage.local.get({ vocabList: [] });
    const existingKeys = new Set(vocabList.map(item => `${item.word}|${item.language || ''}|${item.book || ''}`));
    const additions = found.filter(item => {
      const key = `${item.word}|${item.language}|${item.book}`;
      if (existingKeys.has(key)) return false;
      existingKeys.add(key);
      return true;
    });
    await chrome.storage.local.set({ vocabList: [...vocabList, ...additions], lastBook: book });
    refreshVocabList([...vocabList, ...additions]);

    const skippedDuplicates = found.length - additions.length;
    bulkSearchMessage.textContent = `Added ${additions.length} word${additions.length === 1 ? '' : 's'}.` +
      (skippedDuplicates ? ` Skipped ${skippedDuplicates} duplicate${skippedDuplicates === 1 ? '' : 's'}.` : '') +
      (failed.length ? ` Could not find: ${failed.join(', ')}` : '');
    showBulkSearchResults(found, failed, additions.length, skippedDuplicates);
  } finally {
    button.disabled = false;
  }
});

document.addEventListener('click', function (e) {
  if (e.target && e.target.id === 'closeSearchEditVocab') {
    e.preventDefault();
    e.stopPropagation();
    closeSearchEditContainer();
  }
});
const searchBox = document.getElementById("searchVocabInput");
const searchOptions = document.getElementById("searchOptions");
searchBox.addEventListener("input", () => {
  const query = searchBox.value.toLowerCase();
  if (!query || query.length < 3) {
    searchOptions.style.display = "none";
    return;
  }
  searchOptions.innerHTML = ""; // clear previous
  chrome.storage.local.get('vocabList', function (data) {
    let vocabList = data.vocabList || [];
    const matches = vocabList.filter(v => v.word && v.word.toLowerCase().includes(query));
    if (matches.length === 0) {
      searchOptions.style.display = "none";
      return;
    }
    matches.forEach(match => {
      const option = document.createElement("option");
      option.value = match.word;
      option.textContent = match.word;
      searchOptions.appendChild(option);
    });
    searchOptions.style.display = "block";
  });
});
searchOptions.addEventListener("change", () => {
  const selected = searchOptions.value;
  searchBox.value = selected;
  searchOptions.innerHTML = "";
  searchOptions.style.display = "none";
});
document.getElementById('doSearchVocabBtn').addEventListener('click', function () {
  const searchWord = document.getElementById('searchVocabInput').value.trim();
  const msgDiv = document.getElementById('searchEditVocabMsg');
  if (!searchWord) {
    msgDiv.textContent = 'Please enter a word to search.';
    return;
  }
  chrome.storage.local.get('vocabList', function (data) {
    const vocabList = data.vocabList || [];
    const vocab = vocabList.find(item => item.word === searchWord);
    if (!vocab) {
      msgDiv.textContent = 'Word not found.';
      return;
    }
    // Populate form
    document.getElementById('editWord').innerHTML = "Word: " + vocab.word || '';
    document.getElementById('editDefinition').value = vocab.definition || '';
    chrome.storage.local.get({ bookList: [] }, (result) => {
      const bookList = result.bookList || [];
      const editCollection = document.getElementById('editCollection');
      editCollection.innerHTML = '';
      bookList.forEach(book => {
        const option = document.createElement("option");
        option.value = book;
        option.textContent = book;
        editCollection.appendChild(option);
      });
      document.getElementById('editCollection').value = vocab.book || '';
    });
    document.getElementById('editGender').value = vocab.gender || '';
    document.getElementById('editPronounciation').value = vocab.pronounciation || '';
    document.getElementById('editEtym').value = vocab.etym || '';
    document.getElementById('editHasChecked').checked = vocab.hasChecked || false;
    document.getElementById('editFocus').checked = vocab.focus || false;
    document.getElementById('editVocabForm').style.display = 'block';
    msgDiv.textContent = '';
    // Store original word for update
    document.getElementById('editVocabForm').dataset.originalWord = vocab.word;
  });
});

document.getElementById('editVocabForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const originalWord = e.target.dataset.originalWord;
  const newDefinition = document.getElementById('editDefinition').value.trim();
  const newBook = document.getElementById('editCollection').value.trim();
  const newPronounciation = document.getElementById('editPronounciation').value.trim();
  const newGender = document.getElementById('editGender').value.trim();
  const newEtym = document.getElementById('editEtym').value.trim();
  const newChecked = document.getElementById('editHasChecked').checked;
  const newFocus = document.getElementById('editFocus').checked;
  chrome.storage.local.get('vocabList', function (data) {
    let vocabList = data.vocabList || [];
    const idx = vocabList.findIndex(item => item.word === originalWord);
    if (idx === -1) {
      document.getElementById('searchEditVocabMsg').textContent = 'Original word not found.';
      return;
    }
    vocabList[idx].definition = newDefinition;
    vocabList[idx].book = newBook;
    vocabList[idx].pronounciation = newPronounciation;
    vocabList[idx].gender = newGender;
    vocabList[idx].etym = newEtym;
    vocabList[idx].hasChecked = newChecked;
    vocabList[idx].focus = newFocus;
    chrome.storage.local.set({ vocabList: vocabList }, function () {
      document.getElementById('searchEditVocabMsg').textContent = 'Changes saved.';
      refreshVocabList(vocabList);
    });
  });
});
let selectedVocab;
let currentSortOption = '';
let isTestModeEnabled = false;
const filterState = {
  books: new Set(),
  statuses: new Set()
};
const STATUS_FILTERS = [
  { id: 'lastWrong', label: 'Last attempt wrong' },
  { id: 'moreThan2Wrong', label: 'More than 2 wrong' },
  { id: 'focused', label: 'Focused' },
  { id: 'snoozed', label: 'Snoozed' },
  { id: 'learned', label: 'Learned' },
  { id: 'notLearned', label: 'Not learned' },
  { id: 'revised', label: 'Revised (learned >= 2)' },
  { id: 'allCorrect', label: 'All quiz results correct' }
];
const STATUS_CONFLICTS = {
  learned: ['notLearned'],
  revised: ['notLearned'],
  notLearned: ['learned', 'revised'],
  allCorrect: ['lastWrong', 'moreThan2Wrong'],
  lastWrong: ['allCorrect'],
  moreThan2Wrong: ['allCorrect']
};

function getQuizResults(entry) {
  return Array.isArray(entry.quizResults) ? entry.quizResults : [];
}

function matchesStatusFilter(entry, statusId) {
  const results = getQuizResults(entry);
  switch (statusId) {
    case 'lastWrong':
      return results[0] === 'f';
    case 'moreThan2Wrong':
      return results.filter(result => result === 'f').length > 2;
    case 'focused':
      return entry.focus === true;
    case 'snoozed':
      return entry.snoozed === true;
    case 'learned':
      return (entry.learnedTime || 0) > 0;
    case 'notLearned':
      return (entry.learnedTime || 0) <= 0;
    case 'revised':
      return (entry.learnedTime || 0) > 1;
    case 'allCorrect':
      return results.length === 4 && results.every(result => result === 't');
    default:
      return false;
  }
}

function getDisabledStatusFilters() {
  const disabled = new Set();
  filterState.statuses.forEach(statusId => {
    (STATUS_CONFLICTS[statusId] || []).forEach(conflictId => {
      if (!filterState.statuses.has(conflictId)) {
        disabled.add(conflictId);
      }
    });
  });
  return disabled;
}

function matchesActiveFilters(entry) {
  const bookMatch = filterState.books.size === 0 || filterState.books.has(entry.book);
  const statusMatch = filterState.statuses.size === 0 ||
    Array.from(filterState.statuses).every(statusId => matchesStatusFilter(entry, statusId));
  return bookMatch && statusMatch;
}

function getFilteredVocabList(vocabList) {
  return vocabList.filter(matchesActiveFilters);
}

function getVisibleVocabList(vocabList) {
  return sortVocabList(getFilteredVocabList(vocabList), currentSortOption);
}

function refreshVocabList(vocabList) {
  updateVocabList(getVisibleVocabList(vocabList));
}

function updateTestModeUI() {
  const toggleTestModeButton = document.getElementById('toggleTestModeButton');
  const enableCloudVocabSyncButton = document.getElementById('enableCloudVocabSyncButton');
  const removeDuplicateWordsButton = document.getElementById('removeDuplicateWordsButton');
  const deleteCheckedDataButton = document.getElementById('deleteCheckedDataButton');
  const clearDownloadedDataButton = document.getElementById('clearDownloadedDataButton');
  if (toggleTestModeButton) {
    toggleTestModeButton.textContent = isTestModeEnabled ? 'Dev Mode: On' : 'Dev Mode: Off';
  }
  if (enableCloudVocabSyncButton) {
    enableCloudVocabSyncButton.style.display = isTestModeEnabled ? 'inline' : 'none';
  }
  if (removeDuplicateWordsButton) {
    removeDuplicateWordsButton.style.display = isTestModeEnabled ? 'inline' : 'none';
  }
  if (deleteCheckedDataButton) {
    deleteCheckedDataButton.style.display = isTestModeEnabled ? 'inline' : 'none';
  }
  if (clearDownloadedDataButton) {
    clearDownloadedDataButton.style.display = isTestModeEnabled ? 'inline' : 'none';
  }
}

function updateFilterButtonStyles(containerSelector, activeSet) {
  document.querySelectorAll(containerSelector).forEach(button => {
    const isActive = activeSet.has(button.dataset.filterValue);
    button.classList.toggle('is-active', isActive);
  });
}

function updateStatusFilterButtonStyles() {
  const disabledStatuses = getDisabledStatusFilters();
  document.querySelectorAll('#statusFilterList .filter-chip').forEach(button => {
    const filterId = button.dataset.filterValue;
    const isActive = filterState.statuses.has(filterId);
    const isDisabled = disabledStatuses.has(filterId);
    button.classList.toggle('is-active', isActive);
    button.classList.toggle('is-muted', isDisabled);
    button.disabled = isDisabled;
    button.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
  });
}

function renderBookFilters(bookList = []) {
  const displayBookList = document.getElementById('displayBookList');
  if (!displayBookList) {
    return;
  }
  displayBookList.innerHTML = '';

  bookList.filter(Boolean).forEach(book => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'filter-chip';
    button.dataset.filterValue = book;
    button.textContent = book;
    if (filterState.books.has(book)) {
      button.classList.add('is-active');
    }
    button.addEventListener('click', () => {
      if (filterState.books.has(book)) {
        filterState.books.delete(book);
      } else {
        filterState.books.add(book);
      }
      updateFilterButtonStyles('#displayBookList .filter-chip', filterState.books);
      chrome.storage.local.get('vocabList', function (data) {
        refreshVocabList(data.vocabList || []);
      });
    });
    displayBookList.appendChild(button);
  });
}

function renderStatusFilters() {
  const statusFilterList = document.getElementById('statusFilterList');
  if (!statusFilterList) {
    return;
  }
  statusFilterList.innerHTML = '';

  STATUS_FILTERS.forEach(filter => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'filter-chip';
    button.dataset.filterValue = filter.id;
    button.textContent = filter.label;
    button.addEventListener('click', () => {
      if (button.disabled) {
        return;
      }
      if (filterState.statuses.has(filter.id)) {
        filterState.statuses.delete(filter.id);
      } else {
        filterState.statuses.add(filter.id);
      }
      updateStatusFilterButtonStyles();
      chrome.storage.local.get('vocabList', function (data) {
        refreshVocabList(data.vocabList || []);
      });
    });
    statusFilterList.appendChild(button);
  });

  updateStatusFilterButtonStyles();
}

function clearDisplayFilters() {
  filterState.books.clear();
  filterState.statuses.clear();
  updateFilterButtonStyles('#displayBookList .filter-chip', filterState.books);
  updateStatusFilterButtonStyles();
}

function updateVocabList(vocabList) {
  const vocabListContainer = document.getElementById('vocabList');
  vocabListContainer.innerHTML = '';
  selectedVocab = vocabList;
  var count = 1;
  selectedVocab.forEach((entry, index) => {
    if (entry.word && entry.definition) {
      const vocabDiv = document.createElement('div');
      vocabDiv.className = 'flashcard';
      const wordDiv = document.createElement('div');
      const vocabDivDiv = document.createElement('div');
      wordDiv.textContent = ` ${entry.word}`;
      wordDiv.style.width = '20vw';
      wordDiv.style.fontSize = '3vh';
      wordDiv.style.marginRight = '10px';
      const countDiv = document.createElement('div');
      countDiv.textContent = `${count++}.`;
      countDiv.style.width = '2vw';
      countDiv.style.fontSize = '2vh';
      countDiv.style.marginRight = '10px';
      vocabDiv.appendChild(countDiv);
      if (entry.pronounciation != "" && entry.pronounciation != undefined) {
        const pronounciationDiv = document.createElement('div');
        pronounciationDiv.textContent = `${entry.pronounciation}`;
        pronounciationDiv.style.fontSize = '2.5vh';
        wordDiv.appendChild(pronounciationDiv);
      }
      if (entry.gender != "" && entry.gender != undefined) {
        const genderDiv = document.createElement('div');
        genderDiv.textContent = `${entry.gender}`;
        genderDiv.style.fontSize = '2vh';
        wordDiv.appendChild(genderDiv);
      }
      const definitionDiv = document.createElement('div');
      definitionDiv.textContent = `${entry.definition}`;
      definitionDiv.style.width = '20vw';
      definitionDiv.style.fontSize = '3vh';
      definitionDiv.style.marginRight = '10px';

      const bookDiv = document.createElement('div');
      bookDiv.textContent = `${entry.book}`;
      bookDiv.style.width = '10vw';
      bookDiv.style.fontSize = '3vh';
      bookDiv.style.marginRight = '10px';

      const quizResultsDiv = document.createElement('div');
      quizResultsDiv.className = 'quiz-results';
      quizResultsDiv.textContent = '';
      const results = entry.quizResults || [];
      for (let i = 0; i < 4; i++) {
        let resultEmoji = String.fromCodePoint(0x02754);
        if (results[i] === 't') {
          resultEmoji = String.fromCodePoint(0x02705);
        } else if (results[i] === 'f') {
          resultEmoji = String.fromCodePoint(0x0274C);
        }
        quizResultsDiv.textContent += resultEmoji;
      }
      quizResultsDiv.style.width = '25vw';

      const deleteButton = document.createElement('button');
      deleteButton.classList.add("ui", "button");
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', function () {
        console.log(entry.word)
        chrome.storage.local.get('vocabList', function (data) {
          const fullVocabList = (data.vocabList || []).filter(item => item.word !== entry.word);
          chrome.storage.local.set({ vocabList: fullVocabList }, function () {
            refreshVocabList(fullVocabList);
          });
        });
      });

      const snoozeButton = document.createElement('button');
      snoozeButton.classList.add("ui", "button");
      snoozeButton.style.width = '100px'
      snoozeButton.textContent = entry.snoozed ? 'Unsnooze' : 'Snooze';
      snoozeButton.addEventListener('click', function () {
        chrome.storage.local.get('vocabList', function (data) {
          const fullVocabList = data.vocabList || [];
          const match = fullVocabList.find(item => item.word === entry.word);
          if (!match) {
            return;
          }
          match.snoozed = !match.snoozed;

          chrome.storage.local.set({ vocabList: fullVocabList }, function () {
            refreshVocabList(fullVocabList);
          });
        });
      });

      const importantButton = document.createElement('button');
      importantButton.classList.add("ui", "button");
      importantButton.style.width = '100px'
      importantButton.textContent = entry.focus ? 'Unfocus' : 'Focus';
      importantButton.addEventListener('click', function () {
        chrome.storage.local.get('vocabList', function (data) {
          const fullVocabList = data.vocabList || [];
          const match = fullVocabList.find(item => item.word === entry.word);
          if (!match) {
            return;
          }
          match.focus = match.focus ? false : true;
          chrome.storage.local.set({ vocabList: fullVocabList }, function () {
            refreshVocabList(fullVocabList);
          });
        });
      });
      snoozeButton.style.fontSize = '2vh';
      deleteButton.style.fontSize = '2vh';
      importantButton.style.fontSize = '2vh';

      vocabDiv.appendChild(wordDiv);
      vocabDiv.appendChild(definitionDiv);
      vocabDiv.appendChild(bookDiv);
      vocabDiv.appendChild(quizResultsDiv);
      vocabDiv.appendChild(importantButton);
      vocabDiv.appendChild(deleteButton);
      vocabDiv.appendChild(snoozeButton);
      vocabDiv.style.backgroundColor = 'white';
      const etymContainerDiv = document.createElement('div');
      if (entry.etym != undefined && entry.etym != "") {
        const etymDiv = document.createElement('div');
        etymDiv.textContent = `-${entry.etym}`;
        etymDiv.style.fontSize = '2vh';
        etymDiv.style.left = '5%';
        etymDiv.style.marginTop = '10px';
        etymContainerDiv.appendChild(etymDiv);
      }

      vocabDivDiv.style.borderBottom = '1px dashed'
      vocabDivDiv.style.padding = '10px';
      vocabDivDiv.appendChild(vocabDiv);
      vocabDivDiv.appendChild(etymContainerDiv);
      if (entry.usage != undefined && entry.usage != "") {
        const usageDiv = document.createElement('div');
        usageDiv.innerHTML = "-" + entry.usage;
        usageDiv.style.fontSize = '2vh';
        usageDiv.style.left = '5%';
        usageDiv.style.marginTop = '10px';
        usageDiv.style.backgroundColor = '#f9f9f9';
        vocabDivDiv.appendChild(usageDiv);

      }

      vocabListContainer.appendChild(vocabDivDiv);
    }
  });
}
function sortVocabList(vocabList, sortBy) {
  if (sortBy === '') {
    return vocabList;
  }
  else if (sortBy === 'newest') {
    return vocabList.slice().reverse();
  }
  else {
    return vocabList.slice().sort((a, b) => {
      if (sortBy === 'incorrect') {
        const aIncorrectCount = (a.quizResults || []).filter(result => result === 'f').length;
        const bIncorrectCount = (b.quizResults || []).filter(result => result === 'f').length;
        return bIncorrectCount - aIncorrectCount;
      } else if (sortBy === 'seen') {
        return a.seen - b.seen;
      }
    });

  }
}
function populateBookSelector2() {
  chrome.storage.local.get({ bookList: [] }, (result) => {

    const bookList = result.bookList;
    document.getElementById('bookSelector2').innerHTML = ""
    // Clear existing options except for the default option
    // Add books as options
    bookList.forEach(book => {
      let option = document.createElement('option');
      option.innerHTML = `<option value='${book}'>${book}</option>`;
      document.getElementById('bookSelector2').add(option);
    });
  });
}
// function populateBookSelector() {
//   chrome.storage.local.get({ bookList: [] }, (result) => {
//     const bookList = result.bookList||"Default";
//     chrome.storage.local.get('lastBook', function(data) {
//       const lastBook = data.lastBook||"Default";
//       console.log(lastBook)
//     if(lastBook){
//         document.getElementById('bookSelector').innerHTML = ""
//     if(lastBook!=""||lastBook==="addNew"){
//       optionNewSelected = document.createElement('option');
//       optionNewSelected.textContent  = lastBook;
//       optionNewSelected.value = lastBook;
//       optionNewSelected.selected = true;

//       document.getElementById('bookSelector').add(optionNewSelected)
//     }
//     // Clear existing options except for the default option
//     // Add books as options
//     bookList.forEach(book => {
//         let option = document.createElement('option');
//         if(book === data.lastBook){
//         }else{
//           option.textContent  = book;
//           option.value = book;

//           document.getElementById('bookSelector').add(option);
//         }
//       });
//       optionNew = document.createElement('option');
//       optionNew.textContent = "add New Vocab collection";
//       optionNew.value = "addNew";

//       document.getElementById('bookSelector').add(optionNew)
//       }
//     });

//   });
// }
function convertToCSV() {
  chrome.storage.local.get('vocabList', function (data) {
    const headers = Object.keys(data.vocabList[0]);
    const rows = data.vocabList.map(obj =>
      headers.map(header =>
        Array.isArray(obj[header]) ? obj[header].join(';') : obj[header]
      )
    );

    return [
      headers.join(','), // header row first
      ...rows.map(row => row.join(','))
    ].join('\n');
  });
}

document.addEventListener('DOMContentLoaded', function () {
  const clearDisplayFiltersButton = document.getElementById('clearDisplayFiltersButton');

  function loadVocabularyManager() {
    chrome.storage.local.get('vocabList', function (data) {
      if (data.vocabList) {
        refreshVocabList(data.vocabList);
      }
      console.log(data.vocabList)

      chrome.storage.local.get({ bookList: [] }, (result) => {
        const bookList = result.bookList;
        console.log(bookList)
        renderBookFilters(bookList);
        renderStatusFilters();
      });
    });
  }

  if (clearDisplayFiltersButton) {
    clearDisplayFiltersButton.addEventListener('click', function () {
      clearDisplayFilters();
      chrome.storage.local.get('vocabList', function (data) {
        refreshVocabList(data.vocabList || []);
      });
    });
  }
  // chrome.storage.local.get('autoBackup', function (data) {
  //   const autoBackupBtn = document.getElementById('autoBackupBtn');
  //   let isOn = data.autoBackup === true;
  //   if (autoBackupBtn) {
  //     autoBackupBtn.textContent = isOn ? "Autobackup is ON" : "Autobackup is OFF";
  //     autoBackupBtn.addEventListener('click', function () {
  //       isOn = !isOn;
  //       chrome.storage.local.set({ autoBackup: isOn }, function () {
  //         autoBackupBtn.textContent = isOn ? "Autobackup is ON" : "Autobackup is OFF";
  //       });
  //     });
  //   }
  // });

  // const importVocabButton = document.getElementById('importVocabButton');
  const popup = document.getElementById('popup');
  const popupOverlay = document.getElementById('popup-overlay');
  const submitBulkListButton = document.getElementById('submitVocabButton');
  // importVocabButton.addEventListener('click', () => {

  //   populateBookSelector2()
  //   if (popup.style.display === 'block') {
  //     // If the popup is already displayed, hide it
  //     popup.style.display = 'none';
  //     popupOverlay.style.display = 'none';
  //   } else {
  //     // Otherwise, show the popup
  //     popup.style.display = 'block';
  //     popupOverlay.style.display = 'block';
  //   }
  // });

  popupOverlay.addEventListener('click', () => {
    popup.style.display = 'none';
    popupOverlay.style.display = 'none';
  });
  submitBulkListButton.addEventListener('click', () => {
    vocabList = []
    const vocabInput = document.getElementById('vocabInput').value;
    const vocabPairs = vocabInput.split('|');
    const book = document.getElementById('bookSelector2').value;
    chrome.storage.local.get('vocabList', function (data) {
      let vocabList = data.vocabList || [];
      vocabPairs.forEach(pair => {
        const [word, definition, gender, pronounciation] = pair.split(':');
        if (word && definition) {
          console.log(`Word: ${word.trim()}, Definition: ${definition.trim()}, book: ${book.trim()}`);
          chrome.storage.local.set({ lastBook: book.trim() });

          vocabList.push({ word, definition, book, snoozed: false, gender, pronounciation, seen: 0, quizResults: ['n', 'n', 'n', 'n'] });
          chrome.storage.local.get({ bookList: [] }, (result) => {
            const bookList = result.bookList;
            if (!bookList.includes(book)) {
              bookList.push(book);
              chrome.storage.local.set({ bookList }, () => { });
            }
          });
        } else {
          console.log('Invalid vocab pair:', pair);
        }
      });


      chrome.storage.local.set({ vocabList: vocabList });
      location.reload()
    });

  });
  // Add your code here to handle the submitted vocabulary
  document.getElementById('sortOptions').addEventListener('change', function () {
    chrome.storage.local.get('vocabList', function (data) {
      if (data.vocabList) {
        currentSortOption = document.getElementById('sortOptions').value;
        refreshVocabList(data.vocabList);
      }
    });
  });
  const manageBookButton = document.getElementById('manageBookButton');
  const removeDuplicateWordsButton = document.getElementById('removeDuplicateWordsButton');
  const toggleTestModeButton = document.getElementById('toggleTestModeButton');
  const enableCloudVocabSyncButton = document.getElementById('enableCloudVocabSyncButton');
  const deleteCheckedDataButton = document.getElementById('deleteCheckedDataButton');
  const clearDownloadedDataButton = document.getElementById('clearDownloadedDataButton');
  const floatingContainer = document.getElementById('floatingContainer');
  const closeButton = document.getElementById('closeButton');
  const resetCheckedCollectionContainer = document.getElementById('resetCheckedCollectionContainer');
  const closeResetCheckedContainer = document.getElementById('closeResetCheckedContainer');
  const resetCheckedCollectionList = document.getElementById('resetCheckedCollectionList');
  const clearDownloadedDataContainer = document.getElementById('clearDownloadedDataContainer');
  const closeClearDownloadedDataContainer = document.getElementById('closeClearDownloadedDataContainer');
  const clearDownloadedDataList = document.getElementById('clearDownloadedDataList');
  const bookListContainer = document.getElementById('bookListContainer');
  const newBookInContainer = document.getElementById('newBookInContainer');
  const addBookInContainerButton = document.getElementById('addBookInContainerButton');

  toggleTestModeButton.disabled = true;
  toggleTestModeButton.textContent = 'Loading Dev Mode...';
  chrome.storage.local.get({ isTestModeEnabled: false }, (result) => {
    if (chrome.runtime.lastError) {
      console.error('Could not load Dev Mode setting:', chrome.runtime.lastError);
      toggleTestModeButton.title = 'Could not load the saved Dev Mode setting.';
    }
    isTestModeEnabled = result && result.isTestModeEnabled === true;
    updateTestModeUI();
    toggleTestModeButton.disabled = false;
    loadVocabularyManager();
  });
  // bookSelector.addEventListener('change', () => {
  //   if (bookSelector.value === 'add New Vocab collection') {
  //     newBookField.style.display = 'block';
  //   } else {
  //     newBookField.style.display = 'none';
  //   }
  // });
  // addBookButton.addEventListener('click', () => {
  //   const newBook = newBookInput.value.trim();
  //   if (newBook) {
  //       chrome.storage.local.get({ bookList: [] }, (result) => {
  //           const bookList = result.bookList;
  //           if (!bookList.includes(newBook)) {
  //               bookList.push(newBook);
  //               chrome.storage.local.set({ bookList }, () => {
  //                   alert(`"${newBook}" has been added to the book list.`);
  //                   newBookInput.value = '';
  //                   populateBookSelector()
  //               });
  //           } else {
  //               alert(`"${newBook}" is already in the book list.`);
  //           }
  //       });
  //   }
  // });
  //populateBookSelector()
  function showFloatingContainer() {
    chrome.storage.local.get({ bookList: [] }, (result) => {
      const bookList = result.bookList;
      bookListContainer.innerHTML = '';
      bookList.forEach((book, index) => {
        let bookItem = document.createElement('div');
        bookItem.style.fontSize = "15px";
        bookItem.innerHTML = `${book} 
            <button class="ui button delete-all-button" style = "display: flex;margin-left: auto;padding: 10px;" data-index="${index}">Delete Collection and its vocabs</button>`;
        let bookItem2 = document.createElement('div');
        bookItem2.innerHTML = '<div class="ui horizontal divider">...'
        bookListContainer.appendChild(bookItem);
        bookListContainer.appendChild(bookItem2);

      });
      // Add event listeners to delete buttons
      document.querySelectorAll('.delete-all-button').forEach(button => {
        button.addEventListener('click', (event) => {
          const confirmDeletion = confirm('Are you sure you want to delete this collection and its vocabs?');
          if (confirmDeletion) {
            chrome.storage.local.get('vocabList', function (data) {
              console.log(bookList)
              let vocabList = data.vocabList || [];
              const index = event.target.getAttribute('data-index');
              const collectionToBeDeleted = bookList[index]
              console.log("bookList", bookList);
              console.log("collectionToBeDeleted", collectionToBeDeleted);
              vocabList = vocabList.filter(item => item.book !== collectionToBeDeleted);
              console.log(console.length)
              chrome.storage.local.set({ vocabList: vocabList }, function () {
                filterState.books.delete(collectionToBeDeleted);
                refreshVocabList(vocabList);
              });
              bookList.splice(index, 1);
              chrome.storage.local.set({ bookList }, () => {
                renderBookFilters(bookList);
                populateBookSelector2();
                showFloatingContainer(); // Refresh the list
              });
            });

          }
        });
      });

      floatingContainer.style.display = 'block';
    });
  }

  function hideResetCheckedCollectionContainer() {
    resetCheckedCollectionContainer.style.display = 'none';
  }

  function hideClearDownloadedDataContainer() {
    clearDownloadedDataContainer.style.display = 'none';
  }

  function normalizeWordTypeLabel(wordType) {
    if (typeof wordType !== 'string' || wordType.trim() === '') {
      return null;
    }
    return wordType.trim().toLowerCase();
  }

  function formatWordTypeLabel(wordType) {
    return wordType
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  function resetCheckedDataForCollection(collectionName, wordTypeFilter, buttonLabel) {
    const proceed = confirm(
      'With 1.9.7.3 update, FLIZ can fetch usage and quotation data from wiktionary. ' +
      `By proceeding, FLIZ will add usage and quotation data to ${buttonLabel.toLowerCase()} vocab entries in "${collectionName}" one by one. ` +
      'All other data will not be lost.\n\nProceed?'
    );
    if (!proceed) {
      return;
    }

    chrome.storage.local.get('vocabList', function (data) {
      const vocabList = data.vocabList || [];
      vocabList.forEach(vocab => {
        const normalizedWordType = normalizeWordTypeLabel(vocab.wordType);
        const matchesWordType = wordTypeFilter === '__OTHER_TYPES__'
          ? normalizedWordType === null || normalizedWordType === 'other' || normalizedWordType === 'tbd'
          : normalizedWordType === wordTypeFilter;
        if (vocab.book === collectionName && matchesWordType) {
          vocab.hasChecked = false;
        }
      });
      chrome.storage.local.set({ vocabList }, function () {
        refreshVocabList(vocabList);
        hideResetCheckedCollectionContainer();
      });
    });
  }

  function clearDownloadedDataForCollection(collectionName, wordTypeFilter, buttonLabel) {
    const proceed = confirm(
      `This will clear downloaded conjugation data for ${buttonLabel.toLowerCase()} vocab entries in "${collectionName}" ` +
      'and mark them as unchecked.\n\nProceed?'
    );
    if (!proceed) {
      return;
    }

    chrome.storage.local.get('vocabList', function (data) {
      const vocabList = data.vocabList || [];
      vocabList.forEach(vocab => {
        const normalizedWordType = normalizeWordTypeLabel(vocab.wordType);
        const matchesWordType = wordTypeFilter === '__OTHER_TYPES__'
          ? normalizedWordType === null || normalizedWordType === 'other' || normalizedWordType === 'tbd'
          : normalizedWordType === wordTypeFilter;
        if (vocab.book === collectionName && matchesWordType) {
          if (vocab.conjugation) vocab.conjugation = "";
          if (vocab.conjugations) vocab.conjugations = "";
          vocab.hasChecked = false;
        }
      });
      chrome.storage.local.set({ vocabList }, function () {
        refreshVocabList(vocabList);
        hideClearDownloadedDataContainer();
      });
    });
  }

  function showResetCheckedCollectionContainer() {
    chrome.storage.local.get({ bookList: [], vocabList: [] }, (result) => {
      const bookList = (result.bookList || []).filter(Boolean);
      const vocabList = result.vocabList || [];
      resetCheckedCollectionList.innerHTML = '';

      if (bookList.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.textContent = 'No collections available.';
        resetCheckedCollectionList.appendChild(emptyState);
      } else {
        bookList.forEach(book => {
          const collectionEntries = vocabList.filter(vocab => vocab.book === book);
          if (collectionEntries.length === 0) {
            return;
          }

          const selectionGroup = document.createElement('div');
          selectionGroup.className = 'selection-group';

          const title = document.createElement('h4');
          title.className = 'selection-group-title';
          title.textContent = book;
          selectionGroup.appendChild(title);

          const buttonsContainer = document.createElement('div');
          buttonsContainer.className = 'selection-group-buttons';

          const distinctWordTypes = Array.from(new Set(
            collectionEntries
              .map(vocab => normalizeWordTypeLabel(vocab.wordType))
              .filter(wordType => wordType && wordType !== 'other' && wordType !== 'tbd')
          ));

          distinctWordTypes.forEach(wordType => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'ui button';
            const label = formatWordTypeLabel(wordType);
            button.textContent = label;
            button.addEventListener('click', () => {
              resetCheckedDataForCollection(book, wordType, label);
            });
            buttonsContainer.appendChild(button);
          });

          const hasOtherTypes = collectionEntries.some(vocab => {
            const normalizedWordType = normalizeWordTypeLabel(vocab.wordType);
            return normalizedWordType === null || normalizedWordType === 'other' || normalizedWordType === 'tbd';
          });

          if (hasOtherTypes) {
            const otherTypesButton = document.createElement('button');
            otherTypesButton.type = 'button';
            otherTypesButton.className = 'ui button';
            otherTypesButton.textContent = 'All Other Types';
            otherTypesButton.addEventListener('click', () => {
              resetCheckedDataForCollection(book, '__OTHER_TYPES__', 'all other types');
            });
            buttonsContainer.appendChild(otherTypesButton);
          }

          selectionGroup.appendChild(buttonsContainer);
          resetCheckedCollectionList.appendChild(selectionGroup);
        });

        if (!resetCheckedCollectionList.hasChildNodes()) {
          const emptyState = document.createElement('div');
          emptyState.textContent = 'No collections with vocabulary entries available.';
          resetCheckedCollectionList.appendChild(emptyState);
        }
      }

      resetCheckedCollectionContainer.style.display = 'block';
    });
  }

  function showClearDownloadedDataContainer() {
    chrome.storage.local.get({ bookList: [], vocabList: [] }, (result) => {
      const bookList = (result.bookList || []).filter(Boolean);
      const vocabList = result.vocabList || [];
      clearDownloadedDataList.innerHTML = '';

      if (bookList.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.textContent = 'No collections available.';
        clearDownloadedDataList.appendChild(emptyState);
      } else {
        bookList.forEach(book => {
          const collectionEntries = vocabList.filter(vocab => vocab.book === book);
          if (collectionEntries.length === 0) {
            return;
          }

          const selectionGroup = document.createElement('div');
          selectionGroup.className = 'selection-group';

          const title = document.createElement('h4');
          title.className = 'selection-group-title';
          title.textContent = book;
          selectionGroup.appendChild(title);

          const buttonsContainer = document.createElement('div');
          buttonsContainer.className = 'selection-group-buttons';

          const distinctWordTypes = Array.from(new Set(
            collectionEntries
              .map(vocab => normalizeWordTypeLabel(vocab.wordType))
              .filter(wordType => wordType && wordType !== 'other' && wordType !== 'tbd')
          ));

          distinctWordTypes.forEach(wordType => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'ui button';
            const label = formatWordTypeLabel(wordType);
            button.textContent = label;
            button.addEventListener('click', () => {
              clearDownloadedDataForCollection(book, wordType, label);
            });
            buttonsContainer.appendChild(button);
          });

          const hasOtherTypes = collectionEntries.some(vocab => {
            const normalizedWordType = normalizeWordTypeLabel(vocab.wordType);
            return normalizedWordType === null || normalizedWordType === 'other' || normalizedWordType === 'tbd';
          });

          if (hasOtherTypes) {
            const otherTypesButton = document.createElement('button');
            otherTypesButton.type = 'button';
            otherTypesButton.className = 'ui button';
            otherTypesButton.textContent = 'All Other Types';
            otherTypesButton.addEventListener('click', () => {
              clearDownloadedDataForCollection(book, '__OTHER_TYPES__', 'all other types');
            });
            buttonsContainer.appendChild(otherTypesButton);
          }

          selectionGroup.appendChild(buttonsContainer);
          clearDownloadedDataList.appendChild(selectionGroup);
        });

        if (!clearDownloadedDataList.hasChildNodes()) {
          const emptyState = document.createElement('div');
          emptyState.textContent = 'No collections with vocabulary entries available.';
          clearDownloadedDataList.appendChild(emptyState);
        }
      }

      clearDownloadedDataContainer.style.display = 'block';
    });
  }

  // Add new book to the bookList from floating container
  addBookInContainerButton.addEventListener('click', () => {
    const newBook = newBookInContainer.value.trim();
    if (newBook) {
      chrome.storage.local.get({ bookList: [] }, (result) => {
        const bookList = result.bookList;
        if (!bookList.includes(newBook)) {
          bookList.push(newBook);
          chrome.storage.local.set({ bookList }, () => {
            alert(`"${newBook}" has been added to the book list.`);
            newBookInContainer.value = '';
            renderBookFilters(bookList);
            populateBookSelector2();
            showFloatingContainer(); // Refresh the list
          });
        } else {
          alert(`"${newBook}" is already in the book list.`);
        }
      });
    }
  });

  removeDuplicateWordsButton.addEventListener('click', () => {
    chrome.storage.local.get('vocabList', function (data) {
      const vocabList = data.vocabList || [];
      const seenWords = new Set();
      const duplicateWords = new Set();
      const dedupedVocabList = [];

      vocabList.forEach(vocab => {
        const normalizedWord = (vocab.word || '').trim();
        if (!normalizedWord) {
          dedupedVocabList.push(vocab);
          return;
        }
        if (seenWords.has(normalizedWord)) {
          duplicateWords.add(vocab.word);
          return;
        }
        seenWords.add(normalizedWord);
        dedupedVocabList.push(vocab);
      });

      if (duplicateWords.size === 0) {
        console.log('No duplicate words found in vocabList.');
        alert('No duplicate words found.');
        return;
      }

      const duplicateWordList = Array.from(duplicateWords);
      console.log('Duplicate words found:', duplicateWordList);

      const proceed = confirm(
        `Found ${duplicateWordList.length} duplicate word(s): ${duplicateWordList.join(', ')}.\n\n` +
        'Proceed to remove repeated entries and keep the first occurrence of each word?'
      );
      if (!proceed) {
        return;
      }

      chrome.storage.local.set({ vocabList: dedupedVocabList }, function () {
        refreshVocabList(dedupedVocabList);
        alert(`Removed duplicate entries for: ${duplicateWordList.join(', ')}`);
      });
    });
  });

  deleteCheckedDataButton.addEventListener('click', () => {
    showResetCheckedCollectionContainer();
  });

  clearDownloadedDataButton.addEventListener('click', () => {
    showClearDownloadedDataContainer();
  });

  toggleTestModeButton.addEventListener('click', () => {
    const nextTestModeState = !isTestModeEnabled;
    toggleTestModeButton.disabled = true;
    chrome.storage.local.set({ isTestModeEnabled: nextTestModeState }, () => {
      if (chrome.runtime.lastError) {
        console.error('Could not save Dev Mode setting:', chrome.runtime.lastError);
        alert('Could not save the Dev Mode setting. Please try again.');
        toggleTestModeButton.disabled = false;
        return;
      }
      isTestModeEnabled = nextTestModeState;
      updateTestModeUI();
      toggleTestModeButton.disabled = false;
    });
  });

  const cloudVocabSyncDialog = document.getElementById('cloudVocabSyncDialog');
  const cloudVocabSyncForm = document.getElementById('cloudVocabSyncForm');
  const cloudVocabSyncToken = document.getElementById('cloudVocabSyncToken');
  const cloudVocabSyncStatus = document.getElementById('cloudVocabSyncStatus');
  const saveCloudVocabSyncTokenButton = document.getElementById('saveCloudVocabSyncToken');
  const githubLinkForm = document.getElementById('githubLinkForm');
  const githubLinkInput = document.getElementById('Githublink');
  const githubLinkStatus = document.getElementById('githubLinkStatus');
  const saveGithubLinkButton = document.getElementById('saveGithubLink');
  const cloudVocabModeStatus = document.getElementById('cloudVocabModeStatus');
  const verifyAndEnableCloudModeButton = document.getElementById('verifyAndEnableCloudMode');

  enableCloudVocabSyncButton.addEventListener('click', () => {
    if (!isTestModeEnabled) {
      return;
    }
    cloudVocabSyncForm.reset();
    githubLinkForm.reset();
    cloudVocabSyncStatus.textContent = 'Checking for a saved token...';
    githubLinkStatus.textContent = 'Checking for a saved link...';
    cloudVocabSyncDialog.showModal();
    chrome.storage.sync.get([CLOUD_SYNC_TOKEN_KEY, GITHUB_VOCAB_JSON_URL_KEY], result => {
      if (chrome.runtime.lastError) {
        console.error('Could not check saved GitHub sync settings:', chrome.runtime.lastError);
        cloudVocabSyncStatus.textContent = 'Could not check Chrome Sync storage. Please try again.';
        githubLinkStatus.textContent = 'Could not check Chrome Sync storage. Please try again.';
        cloudVocabModeStatus.textContent = '';
        return;
      }
      cloudVocabSyncStatus.textContent = result[CLOUD_SYNC_TOKEN_KEY]
        ? 'A token is already saved. Saving a new token will replace it.'
        : '';
      githubLinkInput.value = result[GITHUB_VOCAB_JSON_URL_KEY] || '';
      githubLinkStatus.textContent = result[GITHUB_VOCAB_JSON_URL_KEY]
        ? 'A vocabulary link is already saved. Saving a new link will replace it.'
        : '';
      chrome.storage.local.get(CLOUD_VOCAB_MODE_KEY, localResult => {
        if (chrome.runtime.lastError) {
          console.error('Could not load cloud_enabled setting:', chrome.runtime.lastError);
          cloudVocabModeStatus.textContent = 'Could not load Cloud Mode status.';
          return;
        }
        cloudVocabModeStatus.textContent = localResult[CLOUD_VOCAB_MODE_KEY] === true
          ? 'Cloud Mode is on. Vocabulary changes are being saved to GitHub.'
          : 'Cloud Mode is off. Vocabulary is being saved in Chrome storage.';
      });
    });
  });

  document.getElementById('cancelCloudVocabSync').addEventListener('click', () => {
    cloudVocabSyncDialog.close();
  });

  cloudVocabSyncDialog.addEventListener('close', () => {
    cloudVocabSyncToken.value = '';
  });

  githubLinkForm.addEventListener('submit', event => {
    event.preventDefault();
    const url = githubLinkInput.value.trim();
    if (!url || !githubLinkInput.validity.valid) {
      githubLinkStatus.textContent = 'Enter a valid vocabulary JSON URL.';
      githubLinkInput.focus();
      return;
    }

    saveGithubLinkButton.disabled = true;
    chrome.storage.sync.set({ [GITHUB_VOCAB_JSON_URL_KEY]: url }, () => {
      saveGithubLinkButton.disabled = false;
      if (chrome.runtime.lastError) {
        console.error('Could not save the GitHub vocabulary link:', chrome.runtime.lastError);
        githubLinkStatus.textContent = 'Could not save the link to Chrome Sync storage. Please try again.';
        return;
      }
      githubLinkStatus.textContent = 'Vocabulary link saved to Chrome Sync storage.';
      checkSavedGitHubAccess();
    });
  });

  cloudVocabSyncForm.addEventListener('submit', event => {
    event.preventDefault();
    const token = cloudVocabSyncToken.value.trim();
    if (!token) {
      cloudVocabSyncStatus.textContent = 'Enter a GitHub token before saving.';
      cloudVocabSyncToken.focus();
      return;
    }

    saveCloudVocabSyncTokenButton.disabled = true;
    chrome.storage.sync.set({ [CLOUD_SYNC_TOKEN_KEY]: token }, () => {
      saveCloudVocabSyncTokenButton.disabled = false;
      if (chrome.runtime.lastError) {
        console.error('Could not save the GitHub token:', chrome.runtime.lastError);
        cloudVocabSyncStatus.textContent = 'Could not save the token to Chrome Sync storage. Please try again.';
        return;
      }
      cloudVocabSyncToken.value = '';
      cloudVocabSyncStatus.textContent = 'Token saved to Chrome Sync storage.';
      checkSavedGitHubAccess();
    });
  });

  verifyAndEnableCloudModeButton.addEventListener('click', async () => {
    await checkSavedGitHubAccess();
  });

  async function checkSavedGitHubAccess() {
    verifyAndEnableCloudModeButton.disabled = true;
    cloudVocabModeStatus.textContent = 'Settings saved. Checking GitHub read/write access...';
    try {
      await window.flizCloudVocabStorage.verifyAndEnableCloudMode();
      cloudVocabModeStatus.textContent =
        'GitHub read/write check succeeded. Cloud Mode is on.';
    } catch (error) {
      console.error('GitHub access check failed:', error);
      cloudVocabModeStatus.textContent = `GitHub access check failed: ${error.message}`;
    } finally {
      verifyAndEnableCloudModeButton.disabled = false;
    }
  }

  // Show floating container on button click
  manageBookButton.addEventListener('click', () => {
    showFloatingContainer();
  });

  // Close floating container
  closeButton.addEventListener('click', () => {
    floatingContainer.style.display = 'none';
  });

  closeResetCheckedContainer.addEventListener('click', () => {
    hideResetCheckedCollectionContainer();
  });

  closeClearDownloadedDataContainer.addEventListener('click', () => {
    hideClearDownloadedDataContainer();
  });

  document.getElementById('exportToJson').addEventListener('click', function () {
    utils.exportToJson();
  });
  document.getElementById('importFromJson').addEventListener('click', function () {
    const fileInput = document.getElementById('fileInput');
    const output = document.getElementById('output');
    const uploadBtn = document.getElementById('importFromJson');

    const fileInputContainer = document.getElementById('fileInputContainer');
    fileInputContainer.style.display = 'block';

    fileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file && file.type === "application/json") {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const jsonData = JSON.parse(e.target.result);
            if (jsonData.vocabList && Array.isArray(jsonData.vocabList)) {
              chrome.storage.local.get('vocabList', function (data) {
                let currentData = data.vocabList || [];
                currentData = [...currentData, ...jsonData.vocabList]
                chrome.storage.local.set({ vocabList: currentData }, () => {
                  if (chrome.runtime.lastError) {
                    console.error("Error saving merged data:", chrome.runtime.lastError);
                  } else {
                    console.log("Merged data saved to chrome.storage.local");
                    refreshVocabList(currentData);
                  }
                });
              })
            }
            output.textContent = JSON.stringify(jsonData, null, 2); // Display the JSON
            // Hide the file input after successful upload
            fileInputContainer.style.display = 'none';
            fileInput.value = ""; // Reset file input
            const vocablistRaw = jsonData.vocabList
            console.log(vocablistRaw)
            const distinctBooks = [...new Set(vocablistRaw.map(x => x.book))];
            chrome.storage.local.get({ bookList: [] }, (result) => {
              let bookList = result.bookList;
              bookList.push(...distinctBooks);
              bookList = Array.from(new Set(bookList));
              bookList = bookList.filter(Boolean)
              console.log(bookList)
              chrome.storage.local.set({ bookList: bookList }, () => {
                if (chrome.runtime.lastError) {
                  console.error("Error saving bookList:", chrome.runtime.lastError);
                } else {
                  console.log("bookList saved:", bookList);
                  renderBookFilters(bookList);
                  populateBookSelector2();
                }
              });
            });

          } catch (err) {
            output.textContent = "Error parsing JSON file.";
            console.error("Error parsing JSON", err);
          }
        };
        reader.readAsText(file);
      } else {
        alert("Please upload a valid JSON file.");
      }
    });
  });

});
