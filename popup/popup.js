let vocab = {}
let def;
let wordSearched;
import { GenderType, LANGUAGES } from '../utils/index.js';
import * as utils from '../utils/index.js';
chrome.runtime.onInstalled.addListener(function () {
  chrome.tabs.create({ url: "https://mingx0711.github.io/" });
});
let usingLocal = false;
let lastClick = new Date(2025, 5, 12);
document.getElementById('selectLanguage').addEventListener('change', function () {
  let selectedLanguage = this.value;  // Get the selected value
  let word = document.getElementById('word').value.trim();
  const selectedOption = this.options[this.selectedIndex];
  for (let option of this.options) {
    option.removeAttribute('selected');
  }
  chrome.storage.local.set({ lastLang: selectedLanguage });
  selectedOption.setAttribute('selected', 'true');
});
let needDiatricts = ["de", "fr"]
document.getElementById('addVocabForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const language = document.getElementById('selectLanguage').value;
  let word = document.getElementById('word').value.trim();
  word = word.replaceAll("|", "");
  const definition = document.getElementById('definition').value.trim();
  const book = document.getElementById('bookSelector').value;
  const pronounciation = document.getElementById('pronounciation').value;
  const gender = document.getElementById('gender').value;
  chrome.storage.local.set({ lastBook: book }, function () { });
  if (definition && definition != "") {
    chrome.storage.local.get('vocabList', function (data) {
      let vocabList = data.vocabList || [];
      // Append the new word, definition, and snoozed field
      vocab = { word, definition, snoozed: false, book, gender, pronounciation, hasChecked: true, seen: 0, quizResults: ['n', 'n', 'n', 'n'] }
      utils.addType(vocab);
      //console.log(vocab)
      vocabList.push(vocab);
      chrome.storage.local.set({ lastBook: book }, function () { });
      // Save updated vocab list to Chrome storage
      chrome.storage.local.set({ vocabList: vocabList }, function () {
        chrome.storage.local.get('bookList', function (data) {
          let bookList = data.bookList || [];
          if (!bookList.includes(book)) {
            bookList.push(book);
          }
          chrome.storage.local.set({ vocabList: vocabList }, function (data) { })

        })
        // Show a message indicating the word was added
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = `The word "${word}" has been added to the list.`;

        // Clear form fields
        document.getElementById('addVocabForm').reset();

        // Clear the message after a few seconds
        setTimeout(() => {
          messageDiv.textContent = '';
        }, 3000);
      });
    });
  } else {
    if (!needDiatricts.includes(language)) {
      word = removeDiacritics(word)
    }
    var url = usingLocal ? `http://localhost:3000/fetch/${word}` : `https://en.wiktionary.org/wiki/${word}`
    fetch(url)
      .then(response => {
        if (response.status === 404) {
          return utils.getGoogleTranslationVocab(word, language, book)
            .then(showGoogleTranslationResult);
        }
        if (!response.ok) {
          throw new Error(`Wiktionary request failed with status ${response.status}`);
        }
        return response.text();
      })
      .then(html => {
        if (typeof html !== 'string') return;
        // Parse the returned HTML and extract the inflection table
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        if (language == "latin") {
          getLatinAttributes(doc, word);
        } else if (language == 'de') {
          getGermanAttributes(doc, word);
        } else {
          getLinkedAttributes(doc, word, language);
        }
      })
      .catch(async () => {
        console.log("Error fetching from Wiktionary, trying Google Translate API...");
        vocab = await utils.getGoogleTranslationVocab(word, language, book);
        showGoogleTranslationResult(vocab);
      });
    updateLanguageList(language);
  }
  populateBookSelector();


});
function showGoogleTranslationResult(googleVocab) {
  vocab = googleVocab;
  const vocabInfo = document.getElementById('vocabInfo');
  document.getElementById('vocabInfoInfInfs').style.display = 'block';
  vocabInfo.style.display = 'block';

  if (typeof googleVocab === 'string') {
    document.getElementById('addAuto').style.display = 'none';
    vocabInfo.innerHTML = utils.invalidWord;
    return;
  }

  vocabInfo.innerHTML =
    `word: <span style="font-weight: bold;">${googleVocab.word}</span><br>\n definition: <span style="font-weight: bold;">${googleVocab.definition}</span>`;
  document.getElementById('addAuto').style.display = 'block';
}
function updateLanguageList(lang) {
  chrome.storage.local.get({ languageList: {} }, (data) => {

    let languageList = data.languageList || {};
    if (languageList[lang]) {
      languageList[lang] += 1
    } else {
      languageList[lang] = 1
    }
    chrome.storage.local.set({ languageList: languageList }, function () {
    });
  });
}
function removeDiacritics(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function initializeConjugations(conjugations) {
  conjugations.pos = 'verb'
  conjugations.number = { singular: [], plural: [] }
  conjugations.person = { first: [], second: [], third: [] }
  conjugations.tense = { present: [], imperfect: [], perfect: [], future: [], pluperfect: [], futurePerfect: [], sigmaticFuture: [], aorist: [] }
  conjugations.voice = { active: [], passive: [] }
  conjugations.mood = { indicative: [], subjunctive: [], imperative: [] }
  conjugations.form = { infinitive: [], participle: [] }
  conjugations.noun = { gerundive: [], supine: [] }
  conjugations.case = { genitive: [], ablative: [], accusative: [], dative: [] }

}
async function getLatinAttributes(doc, word) {
  const book = document.getElementById('bookSelector').value;
  // Call the shared utils function
  let vocabResult = (await utils.getLatinAttributes(doc, word, book));
  if (vocabResult.currentInflection) {
    vocab = vocabResult.vocabResult;
  } else {
    vocab = vocabResult
  }
  if (typeof vocab === 'string') {
    vocab = await utils.getGoogleTranslationVocab(word, 'la', book);
  }
  if (typeof vocab === 'string') {
    document.getElementById("vocabInfoInfInfs").style.display = 'block'
    document.getElementById('addAuto').style.display = 'none'
    document.getElementById('vocabInfo').style.display = 'block'
    document.getElementById('vocabInfo').innerHTML = utils.invalidWord;
    return;
  }
  const vocabInfo = document.getElementById('vocabInfo');
  vocabInfo.innerHTML = '';
  if (vocabResult.currentInflection) {
    vocabInfo.innerHTML += `<span style="color:#629FD1;">${word} is ${vocabResult.currentInflection}</span><br>\n`;
  }
  vocabInfo.innerHTML += `word: <span style="font-weight: bold;">${vocab.word}</span>`;
  vocabInfo.innerHTML += `<br>\n definition: <span style="font-weight: bold;">${vocab.definition}</span>`;
  if (vocab.gender) {
    let genderColor = "";
    if (vocab.gender === utils.GenderType.FEMININE) genderColor = "#BD4028";
    else if (vocab.gender === utils.GenderType.MASCULINE) genderColor = "#629FD1";
    else if (vocab.gender === utils.GenderType.NEUTER) genderColor = "#5E965A";
    else if (vocab.gender === utils.GenderType.COMMON) genderColor = "#8A6D3B";
    vocabInfo.innerHTML += `<br>\n gender: <span style="color:${genderColor};font-weight:bold;">${vocab.gender}</span>`;
  }
  vocabInfo.innerHTML += `<br>\n group: ${vocab.conjugations ? vocab.conjugations.group : ""}`;
  vocabInfo.innerHTML += `<br>\n collection: ${vocab.book}`;
  vocabInfo.innerHTML += `<br>\n eytmology: ${vocab.etym ? vocab.etym : ""}`;

  document.getElementById("vocabInfoInfInfs").style.display = 'block';
  document.getElementById("addAuto").style.display = 'block';
  return vocab;
}
async function getLinkedAttributes(doc, word, lang) {
  const book = document.getElementById('bookSelector').value;
  // Call the shared utils function
  const wordSearched = word;
  vocab = await utils.getLinkedAttributes(doc, word, lang, book)
  console.log(vocab)
  if (typeof vocab === 'string') {
    vocab = await utils.getGoogleTranslationVocab(wordSearched, lang, book);
  }
  if (typeof vocab === 'string') {
    document.getElementById("vocabInfoInfInfs").style.display = 'block'
    document.getElementById('addAuto').style.display = 'none'
    document.getElementById('vocabInfo').style.display = 'block'
    document.getElementById('vocabInfo').innerHTML = utils.invalidWord;
    return;
  }
  if (lang === 'zh') {
    vocab.word = wordSearched;
  }
  if (vocab && vocab.word != "" && vocab.definition !== "") {
    vocabInfo.innerHTML = '';
    vocabInfo.innerHTML += `word: <span style="font-weight: bold;">${vocab.word}</span>`;
    vocabInfo.innerHTML += `<br>\n definition: <span style="font-weight: bold;">${vocab.definition}</span>`;
    if (vocab.gender) {
      let genderColor = "";
      if (vocab.gender === GenderType.FEMININE) genderColor = "#BD4028";
      else if (vocab.gender === GenderType.MASCULINE) genderColor = "#629FD1";
      else if (vocab.gender === GenderType.NEUTER) genderColor = "#5E965A";
      else if (vocab.gender === GenderType.COMMON) genderColor = "#8A6D3B";
      vocabInfo.innerHTML += `<br>\n gender: <span style="color:${genderColor};font-weight:bold;">${vocab.gender}</span>`;
    }
    vocabInfo.innerHTML += `<br>\n collection: ${vocab.book}`;
    if (vocab.pronounciation) {
      vocabInfo.innerHTML += `<br>\n pronounciation: ${vocab.pronounciation}`;
    }
    vocabInfo.innerHTML += `<br>\n eytmology: ${vocab.etym || ""}`;

    document.getElementById("vocabInfoInfInfs").style.display = 'block';
    document.getElementById("addAuto").style.display = 'block';
  } else {
    document.getElementById("vocabInfoInfInfs").style.display = 'block'
    document.getElementById('addAuto').style.display = 'none'
    document.getElementById('vocabInfo').style.display = 'block'
    document.getElementById('vocabInfo').innerHTML = utils.invalidWord;
    return;
  }
}
async function getEasyAttributes(doc, word, lang) {
  // Get book, pronounciation, gender from the form
  const book = document.getElementById('bookSelector').value;
  // Call the shared utils function
  vocab = await utils.getEasyAttributes(doc, word, lang, book);

  if (typeof vocab === 'string') {
    vocab = await utils.getGoogleTranslationVocab(word, lang, book);
  }

  if (typeof vocab === 'string') {
    document.getElementById('vocabInfoInfInfs').style.display = 'block';
    document.getElementById('addAuto').style.display = 'none';
    document.getElementById('vocabInfo').style.display = 'block';
    document.getElementById('vocabInfo').innerHTML = utils.invalidWord;
    return;
  }

  // Display vocab info in popup
  const vocabInfo = document.getElementById('vocabInfo');
  vocabInfo.innerHTML = '';
  vocabInfo.innerHTML += `word: <span style="font-weight: bold;">${vocab.word}</span>`;
  vocabInfo.innerHTML += `<br>\n definition: <span style="font-weight: bold;">${vocab.definition}</span>`;
  if (vocab.gender) {
    let genderColor = "";
    if (vocab.gender === GenderType.FEMININE) genderColor = "#BD4028";
    else if (vocab.gender === GenderType.MASCULINE) genderColor = "#629FD1";
    else if (vocab.gender === GenderType.NEUTER) genderColor = "#5E965A";
    else if (vocab.gender === GenderType.COMMON) genderColor = "#8A6D3B";
    vocabInfo.innerHTML += `<br>\n gender: <span style="color:${genderColor};font-weight:bold;">${vocab.gender}</span>`;
  }
  vocabInfo.innerHTML += `<br>\n collection: ${vocab.book}`;
  if (vocab.pronounciation) {
    vocabInfo.innerHTML += `<br>\n pronounciation: ${vocab.pronounciation}`;
  }
  vocabInfo.innerHTML += `<br>\n eytmology: ${vocab.etym || ""}`;

  document.getElementById("vocabInfoInfInfs").style.display = 'block';
  document.getElementById("addAuto").style.display = 'block';
  // Optionally, update the global vocab variable
  window.vocab = vocab;
}
function getFrenchVerbInflections(doc) {
  let conjugations = {}
  let spanElements = doc.querySelectorAll('span.Latn.form-of.lang-fr');
  conjugations.pos = 'verb'
  conjugations.number = { singular: [], plural: [] }
  conjugations.person = { first: [], second: [], third: [] }
  conjugations.tense = { present: [], imperfect: [], past_historic: [], future: [], conditional: [] }
  conjugations.mood = { indicative: [], subjunctive: [], imperative: [] }
  conjugations.form = { past_participle: [], present_participle: [] }
  spanElements.forEach((spanElement) => {
    let childText = spanElement.firstElementChild.textContent;
    if (spanElement.className.includes('1')) { conjugations.person.first.push(childText); }
    if (spanElement.className.includes('2')) { conjugations.person.second.push(childText); }
    if (spanElement.className.includes('3')) { conjugations.person.third.push(childText); }
    if (spanElement.className.includes('|s|')) {
      conjugations.number.singular.push(childText);
    } if (spanElement.className.includes('|p|')) {
      conjugations.number.plural.push(childText);
    } if (spanElement.className.includes('pres')) {
      conjugations.tense.present.push(childText);
    } if (spanElement.className.includes('impf')) {
      conjugations.tense.imperfect.push(childText);
    } if (spanElement.className.includes('phis')) {
      conjugations.tense.past_historic.push(childText);
    } if (spanElement.className.includes('cond')) {
      conjugations.tense.conditional.push(childText);
    } if (spanElement.className.includes('fut|')) {
      conjugations.tense.future.push(childText);
    } if (spanElement.className.includes('cond')) {
      conjugations.tense.conditional.push(childText);
    } if (spanElement.className.includes('ppr')) {
      conjugations.form.present_participle.push(childText);
    } if (spanElement.className.includes('pp-form-of')) {
      conjugations.form.past_participle.push(childText);
    } if (spanElement.className.includes('ind')) {
      conjugations.mood.indicative.push(childText);
    } if (spanElement.className.includes('subj-form-of')) {
      conjugations.mood.subjunctive.push(childText);
    } if (spanElement.className.includes('impr-form-of')) {
      conjugations.mood.imperative.push(childText);
    } if (spanElement.className.includes('inf')) {
      conjugations.form.infinitive.push(childText);
    } if (spanElement.className.includes('part')) {
      conjugations.form.participle.push(childText);
    } if (spanElement.className.includes('ger')) {
      conjugations.noun.gerundive.push(childText);
    }
  });
  return conjugations;

}
function getSpanishVerbInflections(doc) {
  conjugations = {}
  let spanElements = doc.querySelectorAll('span.Latn.form-of.lang-es');
  conjugations.pos = 'verb'
  conjugations.number = { singular: [], plural: [] }
  conjugations.person = { first: [], second: [], third: [] }
  conjugations.tense = { present: [], imperfect: [], preterite: [], future: [], conditional: [] }
  conjugations.mood = { indicative: [], subjunctive: [], imperative: [] }
  conjugations.form = { gerund: [] }
  conjugations.past_participle = { masculine_singular: [], feminine_singular: [], masculine_plural: [], feminine_plural: [] }

  spanElements.forEach((spanElement) => {
    let childText = spanElement.firstElementChild.textContent;
    if (spanElement.className.includes('1')) { conjugations.person.first.push(childText); }
    if (spanElement.className.includes('2')) { conjugations.person.second.push(childText); }
    if (spanElement.className.includes('3')) { conjugations.person.third.push(childText); }
    if (spanElement.className.includes('|s|')) {
      conjugations.number.singular.push(childText);
    } if (spanElement.className.includes('|p|')) {
      conjugations.number.plural.push(childText);
    } if (spanElement.className.includes('pres')) {
      conjugations.tense.present.push(childText);
    } if (spanElement.className.includes('impf')) {
      conjugations.tense.imperfect.push(childText);
    } if (spanElement.className.includes('phis')) {
      conjugations.tense.preterite.push(childText);
    } if (spanElement.className.includes('cond')) {
      conjugations.tense.conditional.push(childText);
    } if (spanElement.className.includes('fut|')) {
      conjugations.tense.future.push(childText);
    } if (spanElement.className.includes('cond')) {
      conjugations.tense.conditional.push(childText);
    } if (spanElement.className.includes('ppr')) {
      conjugations.form.present_participle.push(childText);
    } if (spanElement.className.includes('pp-form-of')) {
      conjugations.form.past_participle.push(childText);
    } if (spanElement.className.includes('ind')) {
      conjugations.mood.indicative.push(childText);
    } if (spanElement.className.includes('subj-form-of')) {
      conjugations.mood.subjunctive.push(childText);
    } if (spanElement.className.includes('impr-form-of')) {
      conjugations.mood.imperative.push(childText);
    } if (spanElement.className.includes('pp￰ms')) {
      conjugations.past_participle.masculine_singular.push(childText);
    } if (spanElement.className.includes('ppfs')) {
      conjugations.past_participle.feminine_singular.push(childText);
    } if (spanElement.className.includes('ppmp')) {
      conjugations.past_participle.masculine_plural.push(childText);
    } if (spanElement.className.includes('ppfp')) {
      conjugations.past_participle.feminine_plural.push(childText);
    } if (spanElement.className.includes('gerund')) {
      conjugations.form.form.push(childText);

    }
  });
  return conjugations;

}
document.getElementById('manageButton').addEventListener('click', function () {
  chrome.tabs.create({ url: 'manageVocab/manageVocab.html' });
});
document.getElementById('googleApiKeyButton').addEventListener('click', async function () {
  const panel = document.getElementById('googleApiKeyPanel');
  panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
  if (panel.style.display === 'block') {
    await renderGoogleApiKeyPanel();
  }
});
async function renderGoogleApiKeyPanel() {
  const result = await chrome.storage.local.get('googleTranslateApiKey');
  const hasKey = Boolean(result.googleTranslateApiKey);
  document.getElementById('getGoogleMeaning').hidden = !hasKey;
  document.getElementById('googleApiKeyInput').style.display = hasKey ? 'none' : '';
  document.getElementById('saveGoogleApiKey').style.display = hasKey ? 'none' : '';
  document.getElementById('googleApiKeyStatus').textContent = hasKey
    ? 'A key is saved locally.'
    : 'No key saved.';
}
document.getElementById('saveGoogleApiKey').addEventListener('click', async function () {
  const input = document.getElementById('googleApiKeyInput');
  const status = document.getElementById('googleApiKeyStatus');
  const apiKey = input.value.trim();
  if (!apiKey) {
    status.textContent = 'Enter an API key first.';
    return;
  }
  await chrome.storage.local.set({ googleTranslateApiKey: apiKey });
  input.value = '';
  await renderGoogleApiKeyPanel();
});
document.getElementById('clearGoogleApiKey').addEventListener('click', async function () {
  await chrome.storage.local.remove('googleTranslateApiKey');
  document.getElementById('googleApiKeyInput').value = '';
  await renderGoogleApiKeyPanel();
});

async function showGoogleMeaning() {
  const word = document.getElementById('word').value.trim();
  const language = document.getElementById('selectLanguage').value;
  const book = document.getElementById('bookSelector').value;
  const googleButton = document.getElementById('getGoogleMeaning');
  const vocabInfo = document.getElementById('vocabInfo');

  if (!word) return;

  googleButton.disabled = true;
  vocabInfo.textContent = 'Getting meaning from Google...';
  try {
    const googleVocab = await utils.getGoogleTranslationVocab(word, language, book);
    vocabInfo.innerHTML = '';
    if (typeof googleVocab === 'string') {
      vocab = {};
      vocabInfo.textContent = utils.invalidWord;
      document.getElementById('addAuto').style.display = 'none';
      return;
    }

    vocab = googleVocab;
    vocabInfo.innerHTML = `word: <span style="font-weight: bold;">${vocab.word}</span>` +
      `<br>\n definition: <span style="font-weight: bold;">${vocab.definition}</span>`;
    document.getElementById('addAuto').style.display = 'block';
  } catch (error) {
    console.error('Failed to get Google meaning:', error);
    vocabInfo.textContent = utils.invalidWord;
    document.getElementById('addAuto').style.display = 'none';
  } finally {
    googleButton.disabled = false;
  }
}

document.getElementById('getGoogleMeaning').addEventListener('click', showGoogleMeaning);

chrome.storage.local.get('googleTranslateApiKey').then(result => {
  document.getElementById('getGoogleMeaning').hidden = !result.googleTranslateApiKey;
});
function setAutoSearchFieldsVisible(isVisible) {
  document.getElementById('addVocabForm').classList.toggle('auto-search', !isVisible);
}
function initializeAutoSearchMode() {
  const control = document.getElementById('autoSearchMode');
  control.disabled = true;
  chrome.storage.local.get({ autoSearchMode: false }, result => {
    const autoSearchMode = result.autoSearchMode === true;
    control.checked = autoSearchMode;
    setAutoSearchFieldsVisible(!autoSearchMode);
    control.disabled = false;
  });
}
document.getElementById('autoSearchMode').addEventListener('change', async function () {
  await chrome.storage.local.set({ autoSearchMode: this.checked });
  if (this.checked) {
    document.getElementById('definition').value = '';
    document.getElementById('gender').value = '';
    document.getElementById('pronounciation').value = '';
  }
  setAutoSearchFieldsVisible(!this.checked);
});
initializeAutoSearchMode();
function formatLanguage(str) {
  switch (str) {
    case "la":
      return "Latin"
    case "de":
      return "German"
  }
}
function getGermanAttributes(doc, word) {
  getLinkedAttributes(doc, word, "de")
}
function populateBookSelector() {
  chrome.storage.local.get({ bookList: [] }, (result) => {
    const bookList = result.bookList || ["Default"];
    //console.log(bookList)
    chrome.storage.local.get('lastBook', function (data) {
      const lastBook = data.lastBook ? data.lastBook : (bookList ? bookList[0] : "Default");
      //console.log(lastBook)
      if (lastBook) {
        document.getElementById('bookSelector').innerHTML = ""
        if (lastBook != "" || lastBook === "addNew") {
        }
        // Clear existing options except for the default option
        // Add books as options
        bookList.forEach(book => {
          let option = document.createElement('option');
          //console.log(book + "   " + lastBook)
          if (book === data.lastBook) {

            var optionNewSelected = document.createElement('option');
            optionNewSelected.textContent = lastBook;
            optionNewSelected.value = lastBook;
            optionNewSelected.selected = true;

            document.getElementById('bookSelector').add(optionNewSelected)
          } else {
            option.textContent = book;
            option.value = book;
            document.getElementById('bookSelector').add(option);
          }
        });
      }
    });

  });
}
document.addEventListener('DOMContentLoaded', (event) => {
  syncBook()
  const selectLanguage = document.getElementById('selectLanguage');
  chrome.storage.local.get('languageList', function (data) {
    if (data.languageList) {
      ////console.log(data.languageList)
      let optionsArray = Array.from(selectLanguage.options);
      optionsArray.sort((a, b) => {
        const valueA = data.languageList[a.value] || 0;  // default to 0 if not in the dictionary
        const valueB = data.languageList[b.value] || 0;  // default to 0 if not in the dictionary
        return valueB - valueA;  // Descending order
      });
      selectLanguage.innerHTML = '';
      ////console.log(optionsArray)
      optionsArray.forEach(option => {
        selectLanguage.add(option);
      });
    }

  });
  chrome.storage.local.get('lastLang', function (data) {
    const lastLang = data.lastLang || "latin"
    for (let i = 0; i < selectLanguage.options.length; i++) {
      if (selectLanguage.options[i].value === lastLang) {
        selectLanguage.options[i].selected = true;  // Mark as selected
        break;  // Exit the loop once the correct option is found
      }
    }
  });


  document.getElementById('closeQuickStart').addEventListener('click', function (e) {
    document.getElementById('quickstart').style.display = 'none';
  })

  const showQuickStart = document.getElementById('showQuickStart')
  const bookSelector = document.getElementById('bookSelector');
  const newBookField = document.getElementById('newBookField');
  const addBookButton = document.getElementById('addBookButton');
  const newBookInput = document.getElementById('newBook');
  showQuickStart.addEventListener('click', () => {
    document.getElementById('quickstart').style.display = 'block';
  });
  bookSelector.addEventListener('change', () => {
    if (bookSelector.value === 'addNew') {
      newBookField.style.display = 'block';
    } else {
      newBookField.style.display = 'none';
    }
  });
  addBookButton.addEventListener('click', () => {
    const newBook = newBookInput.value.trim();
    if (newBook) {
      chrome.storage.local.get({ bookList: [] }, (result) => {
        const bookList = result.bookList;
        if (!bookList.includes(newBook)) {
          bookList.push(newBook);
          chrome.storage.local.set({ bookList }, () => {
            alert(`"${newBook}" has been added to the book list.`);
            newBookInput.value = '';
            populateBookSelector()
          });
        } else {
          alert(`"${newBook}" is already in the book list.`);
        }
      });
    }
  });
  populateBookSelector()
  chrome.storage.local.get('hasQuickStarted', function (data) {
    if (!data.hasQuickStarted) {
      document.getElementById('quickstart').style.display = 'block';
      document.getElementById('addVocabForm').style.display = 'none';
    } else {
      document.getElementById('quickstart').style.display = 'none';
      document.getElementById('addVocabForm').style.display = 'block';
    }
    //chrome.storage.local.set({hasQuickStarted:true});
  });
  document.querySelectorAll('#quickstart button[data-deck]').forEach(btn => {
    btn.addEventListener('click', async function () {
      const deck = this.getAttribute('data-deck');
      const url = `https://mingx0711.github.io/Language%20learning/${deck}.json`;
      const quickstartMsg = document.getElementById('quickstartMessage');
      quickstartMsg.textContent = "Importing deck...";
      await fetch(url)
        .then(res => res.json())
        .then(deckData => {
          chrome.storage.local.get('vocabList', function (data) {
            let vocabList = data.vocabList || [];
            // Avoid duplicates by word+book
            deckData.vocabList.forEach(newVocab => {
              if (!vocabList.some(v => v.word === newVocab.word && v.book === newVocab.book)) {
                vocabList.push(newVocab);
              }
              vocabList = vocabList.filter(item => item.word && item.word.trim() !== "" && item.definition && item.definition.trim() !== "");
            });

            chrome.storage.local.set({ vocabList: vocabList }, function () {
              syncBook()
              // Countdown logic
              let countdown = 5;
              quickstartMsg.textContent = `Importing deck  ${countdown}...`;
              const interval = setInterval(() => {
                countdown--;
                if (countdown > 0) {
                  quickstartMsg.textContent = `Importing deck  ${countdown}...`;
                } else {
                  clearInterval(interval);
                  quickstartMsg.textContent = "Deck imported! You can now start using your flashcards.";
                  chrome.tabs.create({ url: 'manageVocab/manageVocab.html' });
                  // Set flag so quickstart doesn't show again
                  chrome.storage.local.set({ hasQuickStarted: true }, function () { });
                }
              }, 1000);
            });

          });
        })
        .catch(() => {
          quickstartMsg.textContent = "Failed to import deck. Please try again.";
        });
    });
  });
});
function syncBook() {
  chrome.storage.local.get('vocabList', function (data) {
    let vocabList = data.vocabList || []
    const distinctBooks = [...new Set(vocabList.map(x => x.book))];
    chrome.storage.local.get({ bookList: [] }, (result) => {
      let bookList = result.bookList;
      bookList.push(...distinctBooks);
      bookList = Array.from(new Set(bookList));
      bookList = bookList.filter(Boolean)
      ////console.log(bookList)
      chrome.storage.local.set({ bookList: bookList }, () => {
        if (chrome.runtime.lastError) {
          //console.error("Error saving bookList:", chrome.runtime.lastError);
        } else {
          ////console.log("bookList saved:", bookList);
        }
      });
      //console.log(bookList)
    });
    ;
  })

}
document.getElementById('addAuto').addEventListener('click', function (e) {
  const currentVocab = vocab;
  const book = document.getElementById('bookSelector').value;
  //console.log(vocab)
  chrome.storage.local.get('vocabList', function (data) {
    //console.log(currentVocab);
    let vocabList = data.vocabList || [];
    const index = vocabList.findIndex(item => item.word === currentVocab.word && item.book === currentVocab.book);
    if (index !== -1) {
      vocabList.splice(index, 1);
      currentVocab.quizResults.unshift('f');
      if (currentVocab.quizResults.length > 4) {
        currentVocab.quizResults.pop(); // Remove the oldest result to keep only the last 4
      }
      vocabList.push(currentVocab);
    } else {
      vocabList.push(currentVocab);
    }
    // Append the new word, definition, and snoozed field
    chrome.storage.local.set({ lastBook: book }, function () { });
    // Save updated vocab list to Chrome storage
    chrome.storage.local.set({ vocabList: vocabList }, function () {
      chrome.storage.local.get('bookList', function (data) {
        let bookList = data.bookList || [];
        if (!bookList.includes(book)) {
          bookList.push(book);
        }
        chrome.storage.local.set({ vocabList: vocabList }, function (data) { })
      })
      // Show a message indicating the word was added
      const messageDiv = document.getElementById('message');
      messageDiv.textContent = `The word has been added to the list.`;

      // Clear form fields
      //document.getElementById('addVocabForm').reset();

      // Clear the message after a few seconds
      setTimeout(() => {
        messageDiv.textContent = '';
      }, 3000);
    });
  });
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    removeDiacritics,
    getLanguageCharSetMapping,
    convertFromAbbr,
    formatLanguage,
    getChineseBaseText,
    getJapaneseBaseText
  };
}
