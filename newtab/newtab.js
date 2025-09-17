import * as utils from '../utils.js';
import { GenderType, LANGUAGES } from '../utils.js';
const fetchTip = document.getElementById('fetchTip');
const fetchInfo = document.getElementById('fetchInfo');
let conjToTest = [];
let isQuiz = false;
var missingCount;
let needDiatricts = ["de", "fr"]
let correctConj;

document.addEventListener('DOMContentLoaded', function () {

  chrome.storage.local.get('currentCollectionSelection', function (data) {
    currentCollectionSelection = data.currentCollectionSelection || []
  });
  chrome.storage.local.get(['selectedPalette'], function (result) {
    if (result.selectedPalette) {
      changeColor(result.selectedPalette);
    } else {
      changeColor('Basic'); // Default to palette1 if no previous selection
    }
  });
  chrome.storage.local.get(['selectedBG'], function (result) {
    if (result.selectedBG) {
      utils.changeBG(result.selectedBG);
    }
  });
  const toggleBtn = document.getElementById('toggleThemeOptions');
  const themeOptions = document.getElementById('themeOptions');
  const bgOptions = document.getElementById('bgOptions');
  let themeOpen = false;
  let bgOpen = false
  toggleBtn.addEventListener('click', function () {
    themeOpen = !themeOpen;
    if (themeOpen) {
      themeOptions.style.maxHeight = '120px';
      themeOptions.style.opacity = '1';
    } else {
      themeOptions.style.maxHeight = '0';
      themeOptions.style.opacity = '0';
    }
    bgOpen = !bgOpen;
    if (bgOpen) {
      bgOptions.style.maxHeight = '120px';
      bgOptions.style.opacity = '1';
    } else {
      bgOptions.style.maxHeight = '0';
      bgOptions.style.opacity = '0';
    }
  });
  const reminderDiv = document.getElementById('backupReminder');
  const reminderText = document.getElementById('backupReminderText');
  const backupNowLink = document.getElementById('backupNowLink');
  const backupRemindLater = document.getElementById('backupRemindLater');
  const backupRemindMonth = document.getElementById('backupRemindMonth');
  const backupReminderClose = document.getElementById('backupReminderClose');

  // Helper to get days since a date string
  function daysSince(dateStr) {
    if (!dateStr) return null;
    const last = new Date(dateStr);
    const now = new Date();
    return Math.floor((now - last) / (1000 * 60 * 60 * 24));
  }
  chrome.storage.local.get(['installDate', 'lastBackupDate', 'backupRemindUntil', 'backupRemindEveryValue'], function (data) {
    let installDate = data.installDate;
    if (!installDate) {
      installDate = new Date().toISOString().slice(0, 10);
      chrome.storage.local.set({ installDate });
      console.log('Install date set to:', installDate);
    }
    const daysInstalled = daysSince(installDate);
    if (daysInstalled !== null && daysInstalled > 7) {
      const today = new Date();
      const lastBackup = data.lastBackupDate;
      const remindUntil = data.backupRemindUntil ? new Date(data.backupRemindUntil) : null;
      const days = daysSince(lastBackup);

      // Only show if not snoozed
      const remindEvery = parseInt(data.backupRemindEveryValue || "7", 10); // default 7 days
      // ...existing code...
      if (!remindUntil || today > remindUntil) {
        if (!lastBackup || days > remindEvery) { // Use selected interval
          reminderText.textContent = `It has been ${days !== null ? days : 'many'} days since you backed up your vocab list.`;
          reminderDiv.style.display = '';
        }
      }
    }
    // Backup now
    backupNowLink.addEventListener('click', function (e) {
      e.preventDefault();
      utils.exportToJson();
      document.getElementById('backupReminder').style.display = 'none';
      chrome.storage.local.set({ lastBackupDate: new Date().toISOString().slice(0, 10) });
    });

    // Remind next week
    backupRemindLater.addEventListener('click', function (e) {
      e.preventDefault();
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      console.log('Next week reminder set to:', nextWeek.toISOString().slice(0, 10));
      chrome.storage.local.set({ backupRemindUntil: nextWeek.toISOString().slice(0, 10) });
      reminderDiv.style.display = 'none';
    });

    // Remind next month
    backupRemindMonth.addEventListener('click', function (e) {
      e.preventDefault();
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      console.log('Next month reminder set to:', nextMonth.toISOString().slice(0, 10));
      chrome.storage.local.set({ backupRemindUntil: nextMonth.toISOString().slice(0, 10) });
      reminderDiv.style.display = 'none';
    });

    // Close reminder: Remind next year
    backupReminderClose.addEventListener('click', function () {
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      console.log('Next year reminder set to:', nextYear.toISOString().slice(0, 10));
      chrome.storage.local.set({ backupRemindUntil: nextYear.toISOString().slice(0, 10) });
      reminderDiv.style.display = 'none';
    });

    const backupRemindEvery = document.getElementById('backupRemindEvery');

    // Load saved interval if present
    chrome.storage.local.get(['backupRemindEveryValue'], function (data) {
      if (data.backupRemindEveryValue) {
        backupRemindEvery.value = data.backupRemindEveryValue;
      }
    });

    // Save interval when changed
    backupRemindEvery.addEventListener('change', function () {
      chrome.storage.local.set({ backupRemindEveryValue: backupRemindEvery.value });
    });
  });

  // Optional: Hide theme options if user clicks outside
  document.addEventListener('click', function (e) {
    if (
      themeOpen &&
      !themeOptions.contains(e.target) &&
      e.target !== toggleBtn
    ) {
      themeOptions.style.maxHeight = '0';
      themeOptions.style.opacity = '0';
      themeOpen = false;
    }
    if (
      bgOpen &&
      !bgOptions.contains(e.target) &&
      e.target !== toggleBtn
    ) {
      bgOptions.style.maxHeight = '0';
      bgOptions.style.opacity = '0';
      bgOpen = false;
    }
  });
  chrome.storage.local.get('vocabList', function (data) {
    if (data.vocabList) {
      vocabList = data.vocabList;
      currentVocabIndex = -1;
      missingCount = vocabList
        .filter(item => !item.hasOwnProperty('hasChecked') || item.hasChecked !== true)
        .length;
      if (missingCount > 0) {
        fetchInfo.textContent = missingCount + ' words may be missing etymology, inflection, or gender. Click here to fetch their info in the background from Wiktionary.'
      } else {
        fetchInfo.style.display = 'None'
      }
    }
    showNextItem(currentCollectionSelection);
  });
  document.getElementById('snoozeButton').addEventListener('click', function () {
    snoozeCurrentVocab();
  });
  document.getElementById('autoplayButton').addEventListener('click', function () {
    enterAutoPlay();
  });
  document.getElementById('nextButton').addEventListener('click', function () {
    showNextItem(currentCollectionSelection);
  });
  document.getElementById('nextAfterIncorrectButton').addEventListener('click', function () {
    document.getElementById('incorrectMessage').style.display = 'none';
    document.getElementById('correctDefinition').style.display = 'none';
    document.getElementById('nextAfterIncorrectButton').style.display = 'none';
    showNextItem();
  });
  document.querySelectorAll('.ui.color-option.button').forEach(button => {
    button.addEventListener('click', function () {
      const palette = this.getAttribute('data-palette');
      changeColor(palette);
    });
  });
  document.querySelectorAll('.ui.bg-option.button').forEach(button => {
    button.addEventListener('click', function () {
      const palette = this.getAttribute('data-palette');
      utils.changeBG(palette);
    });
  });
  document.querySelectorAll('.quiz-option').forEach(button => {
    button.addEventListener('click', function () {
      checkAnswer(button);
    });
  });
  const intervalInput = document.getElementById('interval');
  intervalInput.addEventListener('input', (e) => {
    const parsed = parseInt(e.target.value, 10);

    if (!isNaN(parsed) && parsed > 1) {
      chrome.storage.local.get(
        { intervalHistory: [] },
        ({ intervalHistory }) => {
          intervalHistory.push({
            value: parsed
          });
          chrome.storage.local.set(
            { intervalHistory },
            () => {
              // //console.log.log('Saved new interval', parsed);
            }
          );
        }
      );
    }
  });
  const focusButton = document.getElementById('focusButton');
  const focusTip = document.getElementById('focusTip');
  focusButton.addEventListener('mouseenter', () => {
    focusTip.style.display = ''
  });
  focusButton.addEventListener('mouseleave', () => {
    focusTip.style.display = 'none'
  });
  focusButton.addEventListener('click', () => {
    if (focusButton.innerHTML.includes('\u2B50')) {
      focusButton.innerHTML = '&#9734';
      chrome.storage.local.get('vocabList', function (data) {
        if (data.vocabList) {
          vocabList = data.vocabList;
          if (currentVocabIndex >= 0 && currentVocabIndex < vocabList.length) {
            const currentItem = vocabList[currentVocabIndex];
            currentItem.focus = false;
            ////console.log.log(currentItem+" unfocused");
            vocabList = vocabList.map(item =>
              item.word === currentItem.word
                ? currentItem      // replace the entire object
                : item         // leave everything else alone
            );
            chrome.storage.local.set({ vocabList: vocabList }, function (data) { })
          }
        }
      });
    } else {
      focusButton.innerHTML = '&#11088'
      chrome.storage.local.get('vocabList', function (data) {
        if (data.vocabList) {
          vocabList = data.vocabList;
          if (currentVocabIndex >= 0 && currentVocabIndex < vocabList.length) {
            const currentItem = vocabList[currentVocabIndex];
            currentItem.focus = true;
            ////console.log.log(currentItem.word +" is focused");
            vocabList = vocabList.map(item =>
              item.word === currentItem.word
                ? currentItem      // replace the entire object
                : item         // leave everything else alone
            );
            chrome.storage.local.set({ vocabList: vocabList }, function (data) { })
          }
        }
      });
    }
  });
  fetchInfo.addEventListener('mouseenter', () => {
    fetchTip.style.display = ''
  });
  fetchInfo.addEventListener('mouseleave', () => {
    fetchTip.style.display = 'none'
  });
  var keepGoing = true;
  fetchInfo.addEventListener('click', async () => {
    if (fetchInfo.textContent.includes('fetching')) {
      fetchInfo.textContent = missingCount + ' words may be missing etymology, inflection, or gender. Click here to fetch their info in the background from Wiktionary.'
      keepGoing = false;
    } else {
      keepGoing = true;
      while (keepGoing) {
        // Always get the latest vocabList from storage
        const data = await new Promise(resolve => chrome.storage.local.get('vocabList', resolve));
        vocabList = data.vocabList || [];
        // Find the next word that needs to be fetched
        const item = vocabList.find(item => !item.hasChecked || item.hasChecked !== true);
        if (!item) break; // No more items to fetch
        //console.log.log(new Date().toLocaleTimeString());
        await fetchInfoFromWik(item);
        missingCount--;
        fetchInfo.textContent = 'fetching...' + missingCount + " words left";
        await sleep(60000, 300000);
      }
    }
  });
  function sleep(maxMs, minMs) {
    var sleepMs = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return new Promise(resolve => setTimeout(resolve, sleepMs));
  }
  async function fetchInfoFromWik(vocab) {
    //console.log.log(vocabList.length)
    var language = vocab.language ? vocab.language : vocab.book
    language = utils.convertToAbbr(language)
    var word = vocab.word.replace(/\(.*?\)/g, "").replace(/\/.*/g, "").replace(/[!?]/g, "").trim();
    if (!needDiatricts.includes(language)) {
      word = removeDiacritics(word)
    }
    //console.log.log(vocab.word+"-----"+word+"-----"+language );
    var url = `https://en.wiktionary.org/wiki/${word}`
    fetch(url)
      .then(response => { return response.text(); })
      .then(async html => {
        // Parse the returned HTML and extract the inflection table
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        var newVocab;
        if (language == "la") {
          var newVocab = await utils.getLatinAttributes(doc, vocab.word, vocab.book);
        } else {
          var newVocab = await utils.getEasyAttributes(doc, vocab.word, language, vocab.book);
        }
        if (typeof newVocab === 'string') {

        } else {
          let def = vocab.definition;
          vocab = newVocab;
          vocab.definition = def;
        }
        vocab.hasChecked = true;
        vocabList = vocabList.map(item =>
          item.word === vocab.word
            ? vocab
            : item
        );
        chrome.storage.local.set({ vocabList: vocabList }, function (data) { })

        console.log(vocab);
      })
      .catch(err => {
        vocab.hasChecked = true;
        vocabList = vocabList.map(item =>
          item.word === vocab.word
            ? vocab
            : item
        );

        chrome.storage.local.set({ vocabList: vocabList }, function (data) { })
      })
  }
  function getLanguageCharSetMapping(lang) {
    switch (lang) {
      case "ja":
        return "Jpan"
      case "zh":
        return "Hani"
      default:
        return "Latn"
    }
  }
  function removeDiacritics(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  window.addEventListener('resize', adjustFontSize);
  adjustFontSize();
  changeIntervalBtn.addEventListener('click', () => {
    // Toggle visibility of Auto Play
    if (intervalInput.style.display === 'none' || intervalInput.style.display === '') {
      intervalInput.style.display = 'inline';
    } else {
      intervalInput.style.display = 'none';
    }
  });
  document.getElementById('trueButton').addEventListener('click', function () {
    checkTrueFalse(true);
  });
  document.getElementById('testButton').addEventListener('click', function () {
    chrome.tabs.create({ url: 'test1/test1.html' });
  });
  document.getElementById('learnButton').addEventListener('click', function () {
    chrome.tabs.create({ url: 'learn/learn.html' });
  });
  document.getElementById('falseButton').addEventListener('click', function () {
    checkTrueFalse(false);
  });
  let selectedbooks;
  chrome.storage.local.get({ bookList: [] }, (result) => {
    chrome.storage.local.get({ currentCollectionSelection }, (data) => {
      selectedbooks = data.currentCollectionSelection || ""
      // //console.log.log(selectedbooks)
      const bookList = result.bookList;
      // //console.log.log(bookList)
      displayBookList.innerHTML = '';
      bookList.forEach(book => {
        let checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'checkbox-container';
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = book;
        if (selectedbooks.includes(book)) {
          checkbox.checked = true;
        } else {
          checkbox.checked = false;
        }
        // All books are checked by default
        checkbox.addEventListener('change', updateCheckedBooks);
        let label = document.createElement('label');
        label.htmlFor = book;
        label.textContent = book;
        label.style.fontSize = '2vh';
        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(label);
        checkboxContainer.classList.add("ui", "checkbox")
        displayBookList.appendChild(checkboxContainer);
      });
    });
  });
});

let currentVocabIndex = null;
let vocabList = [];
let currentQuizWord = null;
let currentQuizDefinition = null;
let quizType = null;
let isPairCorrect = null;
let newtab = true;
let currentCollectionSelection = [];
let totalNoCount = null;
let currentQuizNo = 0;
let wordToTest = "";
let timerId;
const changeIntervalBtn = document.getElementById('changeInterval');
const autoPlayBtn = document.getElementById('autoplayButton');
function showNextItem(checkBooks = ["all"]) {

  if (newtab) {
    //to avoid err
    newtab = false;
    showNextVocab(currentCollectionSelection);
  } else {
    const eligibleForQuiz = vocabList.length >= 4 && vocabList.some(entry => entry.seen > 3);
    const probs = (vocabList.filter(entry => entry.seen > 3).length) / (vocabList.length);
    //const shouldShowQuiz = true
    const shouldShowQuiz = (Math.random() < Math.min(probs, 0.3)) && eligibleForQuiz;

    if (shouldShowQuiz) {
      isQuiz = true;
      showQuiz();
    } else {
      isQuiz = false
      showNextVocab(currentCollectionSelection);
    }
  }
}

function changeColor(palette) {
  const colors = {
    Orange: {
      vocabFlashcardBg: '#ffffff',
      wordDivColor: '#3c180e',
      defDivColor: '#8a3b22',
      Snooze: '#edab84',
      borderColor: '#d05f26',
      shadow: '12px 12px 2px 0px #f7d9b1',
      buttonShadow: '4px 4px 1px 0px #7d1e11'

    },
    Yellow: {
      vocabFlashcardBg: '#fbfbee',
      wordDivColor: '#343c2b',
      defDivColor: '#d39600',
      Snooze: '#f4c200',
      borderColor: '#cd8e01',
      shadow: '12px 12px 2px 0px #f4c200',
      buttonShadow: '4px 4px 1px 0px #a86a00'

    },
    Green: {
      vocabFlashcardBg: '#ffffff',
      wordDivColor: '#432705',
      defDivColor: '#638b57',
      Snooze: '#c0e175',
      borderColor: '#25943a',
      shadow: '12px 12px 2px 0px #6dbb72',
      buttonShadow: '4px 4px 1px 0px #155710'

    },
    Teal: {
      vocabFlashcardBg: '#F1F6FF',
      wordDivColor: '#0E1E38',
      defDivColor: '#0E1E38',
      Snooze: '#B6D2FF',
      borderColor: '#12479D',
      shadow: '12px 12px 2px 0px #102850',
      buttonShadow: '4px 4px 1px 0px #2F599D'

    },
    Violet: {
      vocabFlashcardBg: '#f3f7fa',
      wordDivColor: '#292d3d',
      defDivColor: '#474e68',
      Snooze: '#b6c2dd',
      borderColor: '#636c9f',
      shadow: '12px 12px 2px 0px #96a5e3',
      buttonShadow: '4px 4px 1px 0px #636c9f'

    },
    Purple: {
      vocabFlashcardBg: '#f7f6fc',
      wordDivColor: '#37284d',
      defDivColor: '#573e74',
      Snooze: '#c1b0e3',
      borderColor: '#8f65c2',
      shadow: '12px 12px 2px 0px #ae82ca',
      buttonShadow: '4px 4px 1px 0px #6b498e'
    },
    Pink: {
      vocabFlashcardBg: '#fcf4f6',
      wordDivColor: '#3b1625',
      defDivColor: '#6c2f4a',
      Snooze: '#e8b9c5',
      borderColor: '#b24c6f',
      shadow: '12px 12px 2px 0px #e18ba2',
      buttonShadow: '4px 4px 1px 0px #933d5f'
    },
    Basic: {
      vocabFlashcardBg: '#f8f8f8',
      wordDivColor: '#292929',
      defDivColor: '#3d3d3d',
      Snooze: '#dcdcdc',
      borderColor: '#525252',
      shadow: '12px 12px 2px 0px #656565',
      buttonShadow: '4px 4px 1px 0px #464646'
    },
    y2k: {
      vocabFlashcardBg: '#f8efc9',
      wordDivColor: '#7f1c48',
      defDivColor: '#368efb',
      Snooze: '#aeffb9',
      borderColor: '#fea9f3',
      shadow: '12px 12px 2px 0px #174fde',
      buttonShadow: '4px 4px 1px 0px #c20e3b'
    },
    bear: {
      vocabFlashcardBg: '#f9f7f3',
      wordDivColor: '#2e231c',
      defDivColor: '#574537',
      Snooze: '#bdaa89',
      borderColor: '#82664c',
      shadow: '12px 12px 2px 0px #6a5342',
      buttonShadow: '4px 4px 1px 0px #82664c'
    },
    calico: {
      vocabFlashcardBg: '#ffffff',
      wordDivColor: '#291b05',
      defDivColor: '#8b4521',
      Snooze: '#e1882e',
      borderColor: '#3d1c0d',
      shadow: '12px 12px 2px 0px #e1882e',
      buttonShadow: '4px 4px 1px 0px #3d1c0d'
    },
    lemon: {
      vocabFlashcardBg: '#fcfbf7',
      wordDivColor: '#291b05',
      defDivColor: '#166b0e',
      Snooze: '#FFF9A2',
      borderColor: '#E3BB0A',
      shadow: '12px 12px 2px 0px rgb(255, 246, 196)',
      buttonShadow: '4px 4px 1px 0px rgb(245, 232, 167)'
    },
    cake: {
      vocabFlashcardBg: '#fffbeb',
      wordDivColor: '#260102',
      defDivColor: '#b55e74',
      Snooze: '#ffdeee',
      borderColor: '#cf5372',
      shadow: '12px 12px 2px 0px rgb(249, 211, 159)',
      buttonShadow: '4px 4px 1px 0px rgb(223, 212, 161)'
    }
  };
  const selectedPalette = colors[palette];
  document.querySelectorAll('.flashcard').forEach(element => {
    element.style.borderColor = selectedPalette.borderColor;
    element.style.backgroundColor = selectedPalette.vocabFlashcardBg;
    element.style.boxShadow = selectedPalette.shadow;
  });
  document.getElementById('wordDiv').style.color = selectedPalette.wordDivColor;
  document.getElementById('defDiv').style.color = selectedPalette.defDivColor;
  document.getElementById('pronounDiv').style.color = selectedPalette.defDivColor;
  document.getElementById('genderDiv').style.color = selectedPalette.defDivColor;

  document.getElementById('quizContainer').style.borderColor = selectedPalette.borderColor;
  document.getElementById('quizContainer').style.backgroundColor = selectedPalette.vocabFlashcardBg;
  document.getElementById('quizContainer').style.boxShadow = selectedPalette.shadow;

  document.getElementById('trueFalseContainer').style.borderColor = selectedPalette.borderColor;
  document.getElementById('trueFalseContainer').style.backgroundColor = selectedPalette.vocabFlashcardBg;
  document.getElementById('trueFalseContainer').style.boxShadow = selectedPalette.shadow;

  document.querySelectorAll('trueFalseContainer').forEach(element => {
    element.style.borderColor = selectedPalette.borderColor;
    element.style.backgroundColor = selectedPalette.vocabFlashcardBg;
    element.style.boxShadow = selectedPalette.shadow;
  });
  document.querySelectorAll('.quiz-option').forEach(element => {
    element.style.color = selectedPalette.defDivColor;
    element.style.backgroundColor = selectedPalette.Snooze;
  });
  document.getElementById('trueButton').style.color = selectedPalette.Snooze;
  document.getElementById('trueButton').style.boxShadow = selectedPalette.shadow;

  document.getElementById('falseButton').style.color = selectedPalette.Snooze;
  document.getElementById('falseButton').style.boxShadow = selectedPalette.shadow;

  document.getElementById('testButton').style.backgroundColor = selectedPalette.Snooze;
  document.getElementById('testButton').style.boxShadow = selectedPalette.buttonShadow;

  document.getElementById('snoozeButton').style.backgroundColor = selectedPalette.Snooze;
  document.getElementById('learnButton').style.backgroundColor = selectedPalette.Snooze;
  document.getElementById('learnButton').style.boxShadow = selectedPalette.buttonShadow;
  document.getElementById('divider').style.backgroundColor = selectedPalette.Snooze;
  document.getElementById('nextButton').style.backgroundColor = selectedPalette.Snooze;
  document.getElementById('nextButton').style.boxShadow = selectedPalette.buttonShadow;
  document.getElementById('nextAfterIncorrectButton').style.backgroundColor = selectedPalette.Snooze;
  document.getElementById('nextAfterIncorrectButton').style.boxShadow = selectedPalette.buttonShadow;
  //document.getElementById('autoplayButton').style.backgroundColor = selectedPalette.Snooze;
  //document.getElementById('autoplayButton').style.boxShadow = selectedPalette.buttonShadow;



  chrome.storage.local.set({ selectedPalette: palette }, function () {
    // //console.log.log('Palette saved:', palette);
  });

}
function showNextVocab(collection = currentCollectionSelection) {
  let currentCollection = [];
  document.getElementById('quizContainer').style.display = 'none';
  document.getElementById('trueFalseContainer').style.display = 'none';
  document.getElementById('matchContainer').style.display = 'none';
  document.getElementById('incorrectMessage').style.display = 'none';
  document.getElementById('snoozeButton').style.display = '';
  document.getElementById('autoplayButton').style.display = '';
  document.getElementById('nextAfterIncorrectButton').style.display = 'none';
  document.getElementById('nextButton').style.display = '';
  correctDefinition.style.display = 'None';
  if (collection[0] === "all" || collection.length == 0) {
    currentCollection = vocabList;
  } else {
    currentCollection = vocabList.filter(item => collection.includes(item.book));
  }
  const startIndex = currentVocabIndex === null ? -1 : currentVocabIndex;
  let nextIndex = (startIndex + 1) % currentCollection.length;
  // //console.log.log("current collection",currentCollection.length)
  if (currentCollection.length == 0) {
    let wordDiv = document.getElementById('wordDiv');
    wordDiv.innerHTML = "No available words yet"
    document.getElementById('vocabFlashcard').style.display = 'block';
    let defDiv = document.getElementById('defDiv');
    defDiv.innerHTML = "No available vocabs under current collection selection"
    let bookDiv = document.getElementById('bookDiv');
    bookDiv.textContent = "";

  } else {
    if (nextIndex === startIndex) {
      // All items are snoozed or there are no items left
      const vocabFlashcard = document.getElementById('vocabFlashcard');
      currentVocabIndex = null;
    } else {
      currentVocabIndex = Math.floor(Math.random() * currentCollection.length);
      const currentFocusedWords = currentCollection.filter(word => word.focus);
      const focusedWordRatio = 10 * (currentFocusedWords.length / currentCollection.length);
      const displayFocused = (currentCollection.length > 500) ? 0.15 : focusedWordRatio;
      const displayProb = Math.max(displayFocused, 0.15); // Ensure at least a 10% chance
      if ((Math.random() < displayProb) && currentFocusedWords.length > 0) {
        //console.log.log("displaying focused word")
        const randomIndex = Math.floor(Math.random() * currentFocusedWords.length);
        const randomFocusedWord = currentFocusedWords[randomIndex];
        currentVocabIndex = currentCollection.findIndex(item => item === randomFocusedWord);
      }
      if (currentCollection[currentVocabIndex].focus) {
        focusButton.innerHTML = '\u2B50'
      } else {
        focusButton.innerHTML = '&#9734;';
      }
      while (nextIndex !== startIndex && currentCollection[currentVocabIndex].snoozed) {
        currentVocabIndex = (nextIndex + 1) % currentCollection.length;
        // //console.log.log("le word has been snoozy shouldnt show up ")
      }
      if (currentCollection[currentVocabIndex].seen >= 200) {
        if (Math.random() < 0.9) {
          // //console.log.log(currentCollection[currentVocabIndex].word + "has been seen too many times therefore skipped")
          currentVocabIndex = Math.floor(Math.random() * vocabList.length);
        }
      }
      if (currentCollection[currentVocabIndex].seen >= 100) {
        if (Math.random() < 0.75) {
          // //console.log.log(currentCollection[currentVocabIndex].word + "has been seen too many times therefore skipped")
          currentVocabIndex = Math.floor(Math.random() * vocabList.length);
        }
      }
      if (currentCollection[currentVocabIndex] && currentCollection[currentVocabIndex].seen >= 50) {
        if (Math.random() < 0.5) {
          // //console.log.log(currentCollection[currentVocabIndex].word + "has been seen too many times therefore skipped")
          currentVocabIndex = Math.floor(Math.random() * vocabList.length);
        }
      }
      // //console.log.log(currentCollection[currentVocabIndex]);
      const vocabFlashcard = document.getElementById('vocabFlashcard');
      let wordDiv = document.getElementById('wordDiv');
      let defDiv = document.getElementById('defDiv');
      let bookDiv = document.getElementById('bookDiv');
      let pronounDiv = document.getElementById('pronounDiv');
      let genderDiv = document.getElementById('genderDiv');
      let etymDiv = document.getElementById('etymDiv');
      let word;
      let definition
      if (Math.random() <= 0.5) {
        const wordObject = currentCollection[currentVocabIndex];
        if (wordObject && wordObject.conjugations && wordObject.conjugations.group != "") {
          word = utils.getRandomWordFromConjugations(wordObject.conjugations)
          definition = wordObject.definition + String.fromCodePoint(0x1F4A0) + "| \n" + makeStringReadable(Object.values(utils.findSubfieldsForWord(word, wordObject.conjugations)).toString()) + " for " + wordObject.word;
        } else {
          word = wordObject.word
          definition = wordObject.definition;
        }
      } else {
        word = currentCollection[currentVocabIndex].word;
        definition = currentCollection[currentVocabIndex].definition;
      }
      document.getElementById('speak').addEventListener('click', async function () {
        await utils.speakWord(currentCollection[currentVocabIndex].language, word)
      });
      const maxSize = 3
      const minSize = 1
      const clamped = Math.min(definition.length, 200);
      const size =
        maxSize - ((maxSize - minSize) * (clamped / 200));
      defDiv.style.fontSize = size.toFixed(1) + 'vw';
      const book = currentCollection[currentVocabIndex].book || '';
      if (currentCollection[currentVocabIndex].gender) {
        const gender = currentCollection[currentVocabIndex].gender;
        genderDiv.textContent = gender
        if (gender === GenderType.FEMININE) genderDiv.style.color = "#BD4028";
        else if (gender === GenderType.MASCULINE) genderDiv.style.color = "#629FD1";
        else if (gender === GenderType.NEUTER) genderDiv.style.color = "#5E965A";
      } else {
        genderDiv.textContent = ""
      }
      if (currentCollection[currentVocabIndex].pronounciation) {
        const pronoun = currentCollection[currentVocabIndex].pronounciation;
        pronounDiv.textContent = pronoun;
      } else {
        pronounDiv.textContent = ""
      }
      wordDiv.innerHTML = word.bold();
      defDiv.textContent = definition;
      bookDiv.textContent = book;
      if (currentCollection[currentVocabIndex].etym) {
        const etymText = currentCollection[currentVocabIndex].etym;
        const etymSize =
          maxSize - ((maxSize - minSize) * (Math.min(etymText.length, 300) / 300));
        etymDiv.textContent = etymText.replace(/\.mw[\s\S]*\}/, '');
        etymDiv.textContent = etymDiv.textContent.replace('undefined', '');
        etymDiv.style.fontSize = etymSize.toFixed(1) + 'vw';
      } else {
        etymDiv.textContent = ""
      }
      // Increment the seen count
      chrome.storage.local.get('vocabList', function (data) {
        vocabList = data.vocabList;
        const match = vocabList.find(item => item.word === currentCollection[currentVocabIndex].word);
        if (match.seen <= 5) {
          match.seen += 1;
          chrome.storage.local.set({ vocabList: vocabList }, function () {
          });

        }
        // //console.log.log(`Incremented seen count for "${word}".`);
      });

      // Show vocab card and hide quiz
      document.getElementById('quizContainer').style.display = 'none';
      vocabFlashcard.style.display = 'block';
    }
  }
}

function adjustFontSize() {
  const screenWidth = window.innerWidth;
  let fontSize1 = screenWidth / 29;
  document.getElementById('defDiv').style.fontSize = fontSize1 + 'px';
  const options = document.querySelectorAll('.quiz-option');
  options.forEach(option => {
    option.style.fontSize = fontSize1;  // Set font size to 24px
  });
}
function enterAutoPlay() {
  if (autoPlayBtn.textContent === "\u25B6") {
    autoPlayBtn.innerText = String.fromCodePoint(0x23F8)
    chrome.storage.local.get({ intervalHistory: [] }, (result) => {
      let intervalSeconds;
      const history = result.intervalHistory;

      if (!Array.isArray(history) || history.length === 0) {
        // 2a. No history found → default to 6 seconds and save that back into storage
        intervalSeconds = 6;
        const now = Date.now();
        const newHistory = [{ value: intervalSeconds, timestamp: now }];

        chrome.storage.local.set(
          { intervalHistory: newHistory },
          () => {
            // //console.log.log('No previous interval found. Defaulted to 6 and saved into history.');
          }
        );
      } else {
        intervalSeconds = history[history.length - 1].value;
        // //console.log.log('Loaded interval from history:', intervalSeconds);
      }
      timerId = setInterval(() => {
        showNextItem();
      }, intervalSeconds * 1000);
    });
  } else {
    autoPlayBtn.innerText = String.fromCodePoint(0x25B6);
    clearInterval(timerId)
  }
}
function snoozeCurrentVocab() {

  // Save updated vocab list to Chrome storage
  chrome.storage.local.get('vocabList', function (data) {
    vocabList = data.vocabList;
    if (currentVocabIndex !== null && currentVocabIndex !== -1) {
      vocabList[currentVocabIndex].snoozed = true;
    }
    chrome.storage.local.set({ vocabList: vocabList }, function () {
    });
    // //console.log.log(`Snoozed "${vocabList[currentVocabIndex].word}".`);
    showNextItem();  // Show the next item (vocab or quiz)
  });
}
function showQuiz() {
  const quizStyle = Math.floor(Math.random() * 11);
  // //console.log.log(quizStyle);
  switch (quizStyle) {
    case 0:
      quizStyle1();
      break;
    case 1:
      quizStyle2();
      break;
    case 2:
      quizStyle3();
      break;
    case 3:
      quizStyle4();
      break;
    case 4:
      quizStyle5();
      break;
    case 5:
      quizStyle6();
      break;
    case 6:
      quizStyle7();
      break;
    case 7:
      quizStyle1();
      break;
    case 8:
      quizStyle2();
      break;
    case 9:
      quizStyle3();
      break
    case 10:
      quizStyle8();
      break
  }
}
function updateQuizResults(result, word) {
  // //console.log.log(result,word)
  for (const item of vocabList) {
    if (item.word === word) {
      // //console.log.log(item)
      let quizResults = item.quizResults;
      quizResults.unshift(result);
      if (quizResults.length > 4) {
        quizResults.pop(); // Remove the oldest result to keep only the first 4
      }
      chrome.storage.local.get('vocabList', function (data) {
        vocabList = data.vocabList;
        chrome.storage.local.set({ vocabList: vocabList }, function () { });
      });
    }
  }
}
function quizStyle1() {
  console.log("quizStyle1 called");
  utils.ClearPageForQuizContainer();
  const eligibleVocab = utils.getEligibleVocabs(vocabList);
  const correctVocab = utils.getTestWord(eligibleVocab);
  currentQuizWord = correctVocab.word;
  utils.showNextAndAutoplay()
  utils.setupDefQuiz(correctVocab, eligibleVocab)
}

function quizStyle2() {
  utils.ClearPageForQuizContainer();
  utils.showNextAndAutoplay()

  const eligibleVocab = utils.getEligibleVocabs(vocabList);
  const correctVocab = utils.getTestWord(eligibleVocab);
  currentQuizWord = correctVocab.word;
  currentQuizDefinition = correctVocab.definition;
  quizType = 'word';
  // //console.log.log(currentQuizWord);
  utils.setupWordQuiz(correctVocab, eligibleVocab)
}

function quizStyle3() {
  // Quiz Style 3: True or False
  const eligibleVocab = utils.getEligibleVocabs(vocabList);
  const correctVocab = utils.getTestWord(eligibleVocab);
  utils.showNextAndAutoplay()

  currentQuizWord = correctVocab.word;
  currentQuizDefinition = correctVocab.definition;
  quizType = 'truefalse';

  isPairCorrect = Math.random() < 0.5;

  if (!isPairCorrect) {
    let incorrectVocab;
    do {
      const randomIndex = Math.floor(Math.random() * vocabList.length);
      incorrectVocab = vocabList[randomIndex];
    } while (incorrectVocab.word === currentQuizWord);
    currentQuizDefinition = incorrectVocab.definition;
  }
  utils.setupTFQuiz(correctVocab, currentQuizWord, currentQuizDefinition)
}
function quizStyle4() {
  utils.ClearPageForQuizContainer();
  // //console.log.log("4, ask for pronounciation")
  utils.showNextAndAutoplay()

  const eligibleVocab = vocabList.filter(entry => utils.hasPronounciation(entry));
  const eligibleOptions = vocabList.filter(entry => utils.hasPronounciation(entry));
  const numberOfDifferentTypes = new Set(eligibleOptions.map(item => item.pronounciation)).size;
  if (eligibleVocab.length < 1 || numberOfDifferentTypes < 3 || eligibleOptions.length < 3) {
    showNextVocab();
    return;
  }
  const correctVocab = utils.getTestWord(eligibleVocab);
  currentQuizWord = correctVocab.word;
  currentQuizDefinition = correctVocab.pronounciation;
  if (currentQuizDefinition == "") {
    quizStyle1();
  } else {
    utils.setUpPronounciationQuiz(correctVocab, eligibleOptions)
  }

}
function quizStyle5() {
  utils.ClearPageForQuizContainer();
  const eligibleVocab = vocabList.filter(entry => entry.seen > 3 && utils.hasGender(entry));
  const quizIndex = Math.floor(Math.random() * eligibleVocab.length);
  const correctVocab = eligibleVocab[quizIndex];
  utils.showNextAndAutoplay()

  const eligibleOptions = utils.LanguageGenderMap[correctVocab.language] || [];
  const numberOfDifferentTypes = eligibleOptions.size;
  if (eligibleVocab.length < 1 || numberOfDifferentTypes < 2) {
    showNextVocab();
    return;
  }
  currentQuizWord = correctVocab.word;
  currentQuizDefinition = correctVocab.gender;
  quizType = 'truefalse';

  isPairCorrect = Math.random() < 0.5;

  if (!isPairCorrect) {
    var incorrectVocab = eligibleOptions.filter(item => item !== currentQuizDefinition);
    currentQuizDefinition = utils.getRandomElement(incorrectVocab);
  }
  utils.setupTFQuiz(correctVocab, currentQuizWord, currentQuizDefinition)

}

function makeStringReadable(names) {
  names = names.replace("futurePerfect", 'future perfect');
  names = names.replaceAll("_", ' ');
  return names
}

function quizStyle6() {
  utils.ClearPageForQuizContainer();
  const eligibleVocab = vocabList.filter(entry => utils.hasConjugations(entry));
  if (eligibleVocab.length < 1) {
    return quizStyle3();
  }
  utils.showNextAndAutoplay()

  currentVocabIndex = utils.checkVocabIndex(currentVocabIndex, vocabList, eligibleVocab);
  const correctVocab = eligibleVocab[currentVocabIndex];
  let result = utils.prepareOptionsForQuiz6(correctVocab);
  currentVocabIndex = vocabList.indexOf(correctVocab);
  currentQuizWord = correctVocab.word;
  currentQuizDefinition = result[1];
  conjToTest = result[2];
  correctConj = currentQuizDefinition
  quizType = result[4];
  utils.prepareQuiz6(result[0], result[1], result[5]);
}
function quizStyle7() {
  utils.showNextAndAutoplay()

  utils.ClearPageForQuizContainer();
  const eligibleVocab = vocabList.filter(entry => utils.hasConjugations(entry));
  if (eligibleVocab.length < 1) {
    return quizStyle1();
  }
  currentVocabIndex = utils.checkVocabIndex(currentVocabIndex, vocabList, eligibleVocab);

  const correctVocab = eligibleVocab[currentVocabIndex];
  const result = utils.prepareOptionsForQuizStyle7(correctVocab);
  currentQuizWord = correctVocab.word;
  currentQuizDefinition = result[1];
  quizType = '7';
  wordToTest = result[4];
  conjToTest = result[3];
  let options = result[0];
  correctConj = currentQuizDefinition;
  utils.setupQuiz7(options, currentQuizDefinition, result[2]);
}
function quizStyle8() {
  console.log("quiz style 8, listening quiz")
  utils.ClearPageForQuizContainer();
  utils.showNextAndAutoplay()

  document.getElementById('speakQuiz').style.display = "block"
  const eligibleVocab = utils.getEligibleVocabs(vocabList);
  if (eligibleVocab.length < 1) {
    showNextVocab();
    return;
  }
  const correctVocab = utils.getTestWord(eligibleVocab);
  currentQuizWord = correctVocab.word;
  quizType = 'Listening';
  utils.setUp8Quiz(correctVocab, eligibleVocab);
}
function checkAnswer(button) {
  document.getElementById('speakQuiz').style.display = "none"
  const correctAnswer = document.getElementById('quizContainer').dataset.correctAnswer;
  const correctWord = document.getElementById('quizContainer').dataset.correctWord;
  const correctMessage = document.getElementById('correctMessage');
  const incorrectMessage = document.getElementById('incorrectMessage');
  const correctDefinition = document.getElementById('correctDefinition');
  const result = button.textContent === correctAnswer ? 't' : 'f';
  updateQuizResults(result, correctWord);

  if (button.textContent === correctAnswer) {
    button.classList.add('correct');
    document.getElementById('snoozeButton').style.display = 'none';
    document.getElementById('nextButton').style.display = 'none';
    correctMessage.style.display = 'block';
    setTimeout(() => {
      button.classList.remove('correct');
      correctMessage.style.display = 'none';
      showNextItem();
    }, 300);
  } else {
    document.getElementById('snoozeButton').style.display = 'none';
    document.getElementById('nextButton').style.display = 'none';
    incorrectMessage.style.display = 'block';
    showCorrectAnswer();
    document.getElementById('nextAfterIncorrectButton').style.display = 'Block';
  }
}

function showCorrectAnswer() {
  // //console.log.log(quizType)
  const quizContainer = document.querySelector('.quiz-container');
  quizContainer.style.display = "none";
  const tfContainer = document.querySelector('.true-false-container');
  tfContainer.style.display = "none";
  const nextButton = document.getElementById('nextAfterIncorrectButton');
  nextButton.style.display = 'block';

  const vocabFlashcard = document.getElementById('correctDefinition');
  vocabFlashcard.style.display = 'block';
  const correctVocab = vocabList.find(entry => entry.word === currentQuizWord);
  if (correctVocab) {
    vocabFlashcard.innerHTML += String.fromCodePoint(0x1F4A0);

    vocabFlashcard.textContent = `${correctVocab.word}: ${correctVocab.definition}`;
    if (correctVocab.gender && correctVocab.gender != "") {
      vocabFlashcard.innerHTML += String.fromCodePoint(0x1F4A0);
      vocabFlashcard.textContent += " gender:"
      vocabFlashcard.textContent += correctVocab.gender
    }
    if (correctVocab.pronounciation && correctVocab.pronounciation != "") {
      vocabFlashcard.innerHTML += String.fromCodePoint(0x1F4A0);
      vocabFlashcard.textContent += " pronounciation:"
      vocabFlashcard.textContent += correctVocab.pronounciation
    }
    if ((conjToTest || false) && conjToTest.length > 0 && quizType == "6") {
      vocabFlashcard.innerHTML += String.fromCodePoint(0x1F4A0);
      vocabFlashcard.innerHTML += `<br><b>${correctConj}</b> is one of the ${makeStringReadable(conjToTest.toString())} form of <b>${correctVocab.word}</b>`;
    }
    if ((conjToTest || false) && conjToTest.length > 0 && quizType == "7") {
      vocabFlashcard.innerHTML += String.fromCodePoint(0x1F4A0);
      vocabFlashcard.innerHTML += `<br><b>${wordToTest}</b> is one of the ${makeStringReadable(conjToTest.toString())} form of <b>${correctVocab.word}</b>`;
    }
    if (quizType == "groupTest") {
      vocabFlashcard.innerHTML += String.fromCodePoint(0x1F4A0);
      vocabFlashcard.innerHTML += ` group: <b>${correctVocab.conjugations.group}</b>`;
    }
    document.getElementById('quizContainer').style.display = 'none';
    vocabFlashcard.style.display = 'block';
  }
}
function checkTrueFalse(isTrue) {
  const correctMessage = document.getElementById('correctMessage');
  const incorrectMessage = document.getElementById('incorrectMessage');
  const correctDefinition = document.getElementById('correctDefinition');

  document.getElementById('snoozeButton').style.display = 'none';
  document.getElementById('nextButton').style.display = 'none';
  if (isTrue === isPairCorrect) {
    updateQuizResults('t', currentQuizWord);
    correctMessage.style.display = 'block';
    setTimeout(() => {
      correctMessage.style.display = 'none';
      showNextItem();
    }, 1000);
  } else {
    updateQuizResults('f', currentQuizWord);

    incorrectMessage.style.display = 'block';
    showCorrectAnswer();
    document.getElementById('nextAfterIncorrectButton').style.display = 'block';

  }
  document.getElementById('trueFalseContainer').style.display = 'none';

}

function getCheckedBooks() {
  let checkedBooks = [];
  let bookList = [];
  chrome.storage.local.get({ bookList: [] }, (result) => {
    bookList = result.bookList;
  });
  document.querySelectorAll('#displayBookList input[type="checkbox"]').forEach(checkbox => {
    if (checkbox.checked) {
      checkedBooks.push(checkbox.id);
    }
  });
  return checkedBooks;
}
function updateCheckedBooks() {
  currentCollectionSelection = getCheckedBooks()
  chrome.storage.local.set({ currentCollectionSelection: currentCollectionSelection }, function () {
  });
  showNextItem(getCheckedBooks());
}
