import { hasGender, hasPronounciation } from '../utils.js';
import * as utils from '../utils.js';
let currentVocabIndex = null;
let vocabList = [];
let firstbook = "";
let currentQuizWord = null;
let sortedNewWordsByLang = {};
let currentLanguage;
let wordToSpeak;
let latinMedieval = false;

let currentQuizDefinition = null;
let quizType = null;
let isPairCorrect = null;
let filteredVocabList = []
let currentStep = null;
let currentQuizNo = 0;
let wordToTest = "";
let recordHistory = [];
let correctCount = 0;
let totalCountYet = 0;
let totalNoCount = 0;
let currentTest;
let focusOption;
let conjToTest;
let shouldSpeak = false;
let correctConj;
let totalVocabList = []
let wrongVocabs = [];
let learningQueue = [];
let learnedWords = []
const langMap = {
  de: 'German',
  es: 'Spanish',
  fr: 'French',
  it: 'Italian',
  en: 'English',
  pt: 'Portuguese',
  ru: 'Russian',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
  nl: 'Dutch',
  sv: 'Swedish',
  no: 'Norwegian',
  da: 'Danish',
  fi: 'Finnish',
  pl: 'Polish',
  tr: 'Turkish',
  el: 'Greek',
  he: 'Hebrew',
  hi: 'Hindi',
  bn: 'Bengali',
  la: 'Latin',
  vi: 'Vietnamese',
  id: 'Indonesian',
  ms: 'Malay',
  th: 'Thai',
  ro: 'Romanian',
  cs: 'Czech',
  hu: 'Hungarian',
  sk: 'Slovak',
  bg: 'Bulgarian',
  uk: 'Ukrainian',
  fa: 'Persian',
  sw: 'Swahili',
};
const nameToAbbr = Object
  .entries(langMap)                      // [[ 'de','German'], …]
  .reduce((acc, [k, v]) => {
    acc[v.toLowerCase()] = k;
    return acc;
  }, {});
function loadVoices() {
  return new Promise(resolve => {
    let voices = speechSynthesis.getVoices();
    if (voices.length) return resolve(voices);
    speechSynthesis.onvoiceschanged = () => resolve(speechSynthesis.getVoices());
  });
}
function convertToAbbr(name) {
  return nameToAbbr[name.toLowerCase()] || name;
}
function getSpeechLang(code) {
  const langMap = {
    "de": "de-DE",     // German
    "fr": "fr-FR",     // French
    "it": "it-IT",     // Italian
    "es": "es-ES",     // Spanish
    "en": "en-US",     // English (US)
    "en-gb": "en-GB",  // English (UK)
    "zh": "zh-CN",     // Chinese (Simplified)
    "zh-tw": "zh-TW",  // Chinese (Traditional)
    "ja": "ja-JP",     // Japanese
    "ko": "ko-KR",     // Korean
    "ru": "ru-RU",     // Russian
    "la": "it-IT"      // Latin fallback (to Italian)
  };
  return langMap[code.toLowerCase()] || "en-US"; // Default fallback
}
function getNewWordsData() {
  let newLastOptionLabel = document.getElementById('newLastLabel');
  let sortedNewWordsByLang = {};
  return new Promise(resolve => {
    chrome.storage.local.get('vocabList', function (data) {
      if (data.vocabList) {
        let vocabList = data.vocabList;
        // Group vocab by language
        const grouped = {};
        vocabList.forEach(vocab => {
          const lang = vocab.language || utils.nameToAbbr[vocab.book] || 'unknown';
          if (!grouped[lang]) grouped[lang] = [];
          grouped[lang].push(vocab);
        });

        // For each language, find first learned index and count new words
        Object.entries(grouped).forEach(([lang, words]) => {
          const reversed = words.slice().reverse();
          const firstLearnedIdx = reversed.findIndex(vocab => vocab.hasOwnProperty('learnedTime'));
          if (firstLearnedIdx === -1 || firstLearnedIdx === 0) {
            sortedNewWordsByLang[lang] = 0;
          } else {
            sortedNewWordsByLang[lang] = firstLearnedIdx;
          }
        });

        // Sort by language name (alphabetically)
        const sortedLangs = Object.keys(sortedNewWordsByLang).sort();
        const sortedResult = {};
        sortedLangs.forEach(lang => {
          sortedResult[lang] = sortedNewWordsByLang[lang];
        });

        //console.log(sortedResult);
        resolve(sortedResult);
      } else {
        resolve({});
      }
    });
  });
}
document.getElementById('vocabCount').addEventListener('input', function () {
  if (this.value < 4) this.value = 4;
});
let learnCount = 0;
document.addEventListener('DOMContentLoaded', async function () {
  document.getElementById('vocabFlashcard').style.display = 'none';
  document.getElementById('quizContainer').style.display = 'none';
  document.getElementById('trueFalseContainer').style.display = 'none';
  document.getElementById('nextButton').style.display = 'none';
  const newLastOption = document.getElementById('newLastOption');
  const newLastOptionLabel = document.getElementById('newLastLabel');

  chrome.storage.local.get(['selectedBG'], function (result) {
    if (result.selectedBG) {
      utils.changeBG(result.selectedBG);
    }
  });
  chrome.storage.sync.get("medievalPronunciation", (data) => {
    if (data.medievalPronunciation === undefined) {
      data.medievalPronunciation = false; // Default to medieval
    }
    latinMedieval = data.medievalPronunciation;
  });
  await populateBookSelector();
  const selector = document.getElementById("bookSelector");
  const container = document.querySelector(".progress-container");
  const bar = document.querySelector(".progress-bar");
  const label = document.querySelector(".progress-label");
  async function updateProgress() {
    const book = selector.value || selector
    //console.log(book)

    const newWordsData = await getNewWordsData();
    const newWordsCount = newWordsData[utils.nameToAbbr[selector.value.toLowerCase()]] || 0;
    //console.log(newWordsData)

    if (newWordsCount > 4) {
      newLastOptionLabel.style.display = '';
      document.getElementById('newLastOption').style.display = '';
      document.getElementById('or').style.display = '';
      newLastOption.checked = true;
      document.getElementById('newFirstOption').checked = false;
      document.getElementById('newLastLabel').innerHTML = `You have added <strong>${newWordsCount}</strong> new vocabs to this deck since you last learned, learn them`
    } else {
      newLastOptionLabel.style.display = 'none';
      document.getElementById('newLastOption').style.display = 'none';
      document.getElementById('or').style.display = 'none';
      newLastOption.checked = false;
      document.getElementById('newFirstOption').checked = true;
    }
    //console.log(book)

    if (book) {
      chrome.storage.local.get('vocabList', function (data) {
        if (data.vocabList) {
          let vocabList = data.vocabList;
          let filteredVocabList = vocabList.filter(vocab => vocab.book === selector.value);

          const total = filteredVocabList.length;
          if (total === 0) return;

          // Define your colors for levels
          const levelColors = [
            '#cccccc', // 0 - unseen
            '#f9b0cfff', // 1 - red
            '#fbe2b6ff', // 2 - orange
            '#fffbc7ff', // 3 - yellow
            '#aeffaeff', // 4 - green
            '#bddeffff', // 5 - blue
            '#b691c9ff', // 6 - purple
            '#f1cd00ff'  // 7 - gold
          ];

          // Clear previous bars
          const container = document.getElementById("progressContainer");
          container.querySelectorAll('.progressSegment').forEach(el => el.remove());

          // Count how many words are at or above each level
          const counts = Array(8).fill(0);
          filteredVocabList.forEach(vocab => {
            const level = Math.min(vocab.learnedTime, 7);
            for (let i = 1; i <= level; i++) counts[i]++;
          });

          // Draw stacked progress bars
          for (let i = 1; i < counts.length; i++) {
            const percent = (counts[i] / total) * 100;
            const bar = document.createElement("div");
            bar.className = "progressSegment";
            bar.style.position = "absolute";
            bar.style.left = "0";
            bar.style.top = "0";
            bar.style.height = "100%";
            bar.style.width = percent + "%";
            bar.style.backgroundColor = levelColors[i];
            bar.style.zIndex = i;
            bar.style.opacity = 0.9;
            container.appendChild(bar);
          }
          const minTime = Math.min(...filteredVocabList.map(item => item.learnedTime ?? 0));

          let learnedCount = filteredVocabList.filter(vocab => vocab.learnedTime > minTime).length;
          const percentage = learnedCount / filteredVocabList.length * 100;
          const count = learnedCount + " / " + filteredVocabList.length;
          document.getElementById("progressLabel").textContent = count + " ";
          for (let i = 0; i < minTime; i++) {
            document.getElementById("progressLabel").textContent += '⭐';
          }
        }
      });
    }
    else {
      container.style.display = "none";
    }
  }

  selector.addEventListener("change", updateProgress);

  chrome.storage.local.get('vocabList', function (data) {
    if (data.vocabList) {
      vocabList = data.vocabList;

    }
  });

  updateProgress()

  document.getElementById('start').addEventListener('click', () => {
    learnCount = Math.max(document.getElementById('vocabCount').value, 4);
    focusOption = document.querySelector('input[name="focusOption"]:checked').value;
    const selectedCollection = document.getElementById('bookSelector').value;
    // Call the function to display vocab
    generateLearningQueue(selectedCollection);
  });

  document.getElementById('nextButton').addEventListener('click', function () {
    currentStep += 1;
    updateStepCounter()
    showNextLearningStep();
  });

  document.getElementById('redo').addEventListener('click', function () {
    document.getElementById('nextAfterIncorrectButton').style.display = "None"
    document.getElementById('showTestResult').style.display = "None"

    filteredVocabList = filteredVocabList.filter(item => wrongVocabs.includes(item.word));
    ////console.log(filteredVocabList)
    currentQuizNo = 0;
    wordToTest = "";
    recordHistory = [];
    correctCount = 0;
    totalNoCount = filteredVocabList.length;
    totalCountYet = 0;
    currentTest;
    wrongVocabs = [];
    showNextItem();
  });

  document.getElementById('nextAfterIncorrectButton').addEventListener('click', function () {
    document.getElementById('incorrectMessage').style.display = 'none';
    document.getElementById('correctDefinition').style.display = 'none';
    document.getElementById('nextAfterIncorrectButton').style.display = 'none';
    showNextLearningStep();
  });

  document.querySelectorAll('.quiz-option').forEach(button => {
    button.addEventListener('click', function () {
      checkAnswer(button);
    });
  });
  document.getElementById('correctDefinition').style.display = 'none';
  document.getElementById('trueButton').addEventListener('click', function () {
    checkTrueFalse(true);
  });

  document.getElementById('falseButton').addEventListener('click', function () {
    checkTrueFalse(false);
  });
}
);
let currentFocus;
function getLeastLearnedAmount(arr) {
  const maxEntry = arr.reduce((max, entry) =>
    (entry.learnedTime > (max?.learnedTime ?? -Infinity)) ? entry : max
    , null);
  if (focusOption === "random") {
    shuffleArray(arr);
    return arr
      .slice() // make a copy
      .sort((a, b) => {
        const aTime = a.learnedTime ?? -Infinity;
        const bTime = b.learnedTime ?? -Infinity;
        return aTime - bTime;
      })
      .slice(0, learnCount);
  } else if (focusOption === "newLast") {
    const reversedList = arr.slice().reverse();
    const firstLearnedIdx = reversedList.findIndex(vocab => vocab.hasOwnProperty('learnedTime'));
    //console.log(firstLearnedIdx)
    return reversedList.slice(0, firstLearnedIdx);
  } else if (focusOption === "revise") {
    let leastLearned = Math.min(...filteredVocabList.map(item => item.learnedTime ?? 0));
    let learnedWords = arr.filter(item => item.learnedTime === leastLearned + 1);
    shuffleArray(learnedWords);
    return learnedWords.slice(0, learnCount);
  } else { //newest
    return arr.slice().reverse()
      .filter(item => !('learnedTime' in item)) // keep only items without learnedTime
      .slice(0, learnCount)
  }
}
async function generateLearningQueue(bookSelected) {
  await chrome.storage.local.get('vocabList', function (data) {
    if (data.vocabList) {
      vocabList = data.vocabList;
      currentVocabIndex = -1;
      if (vocabList.length < 10) {
        document.getElementById('vocabFlashcard').textContent = "Come back after there's more vocabs";
        return;
      }
      filteredVocabList = vocabList.filter(vocab => vocab.book === bookSelected);
      totalVocabList = filteredVocabList;
      filteredVocabList = getLeastLearnedAmount(filteredVocabList);
      //console.log(filteredVocabList)
      document.getElementById('start').style.display = 'none';
      document.getElementById('nextButton').style.display = '';
      document.getElementById('stepCounter').style.display = '';
      document.getElementById('initContainer').style.display = 'none';
      document.getElementById('bookSelector').style.display = 'none';
      document.getElementById('quizContainer').style.display = '';
      document.getElementById('nextButton').style.display = 'none';
      totalNoCount = filteredVocabList.length;
      if (filteredVocabList.length === 0) {
        document.getElementById('vocabFlashcard').textContent = "No vocabulary to test.";
        document.getElementById('nextButton').style.display = 'none';
        return;
      }
      const wordAppearances = {};
      currentLanguage = filteredVocabList[0].language;

      filteredVocabList.forEach(wordObj => {
        const word = wordObj.word;
        wordAppearances[word] = 0;
      });

      // Helper to add to queue only if under max
      function addToQueue(type, wordObj) {
        const word = wordObj.word;
        const maxAppearances = 6; // set your max here
        if (wordAppearances[word] < maxAppearances) {
          learningQueue.push({ type, word: wordObj });
          wordAppearances[word]++;
        }
      }

      filteredVocabList.forEach(wordObj => {
        // 1. Flashcard
        addToQueue('flashcard', wordObj);
        learnedWords.push(wordObj);

        // 2. True/False quiz (quizStyle3), with wrong definition from totalVocabList

        // 3. Randomly quizStyle1 or quizStyle2
        const quizType = Math.random() < 0.5 ? 'quiz1' : 'quiz2';
        addToQueue(quizType, wordObj);

        const randomQuizWord = (learnedWords.length > 1) ? utils.getNRandomElements(learnedWords, 1)[0] : wordObj;

        if (hasGender(randomQuizWord)) {
          addToQueue('quiz5', randomQuizWord);
        }
        if (hasPronounciation(randomQuizWord)) {
          addToQueue('quiz4', randomQuizWord);
        }
        if (Math.random() < 0.5) {
          addToQueue('quiz8', randomQuizWord);
        } else {
          addToQueue('quiz3', randomQuizWord);
        }
      });
    }
    let quizTypes = ['quiz1', 'quiz2', 'quiz3', 'quiz4', 'quiz5', 'quiz8'];
    let randomWords = filteredVocabList.slice();
    shuffleArray(randomWords);
    randomWords.slice(0, 8).forEach(wordObj => {
      var randomIndex = Math.random()
      //console.log(randomIndex < 0.25 ? 8 : randomIndex < 0.5 ? 1 : randomIndex < 0.75 ? 2 : 3)
      if (randomIndex < 0.25) {
        learningQueue.push({ type: 'quiz8', word: wordObj });
      } else if (randomIndex < 0.5) {
        learningQueue.push({ type: 'quiz1', word: wordObj });
      } else if (randomIndex < 0.75) {
        learningQueue.push({ type: 'quiz2', word: wordObj });
      } else {
        learningQueue.push({ type: 'quiz3', word: wordObj });
      }
      if (hasGender(wordObj) && Math.random() < 0.5) {
        learningQueue.push({ type: 'quiz5', word: wordObj });
      }
    });
    shuffleArray(randomWords);
    randomWords.slice(0, 8).forEach(wordObj => {
      var randomIndex = Math.random()
      //console.log(randomIndex < 0.25 ? 8 : randomIndex < 0.5 ? 1 : randomIndex < 0.75 ? 2 : 3)
      if (randomIndex < 0.25) {
        learningQueue.push({ type: 'quiz8', word: wordObj });
      } else if (randomIndex < 0.5) {
        learningQueue.push({ type: 'quiz1', word: wordObj });
      } else if (randomIndex < 0.75) {
        learningQueue.push({ type: 'quiz2', word: wordObj });
      } else {
        learningQueue.push({ type: 'quiz3', word: wordObj });
      }
      if (hasPronounciation(wordObj) && Math.random() < 0.5) {
        learningQueue.push({ type: 'quiz4', word: wordObj });
      }
    });
    console.log(learningQueue)
    currentStep = 0;
    showNextLearningStep();
  });
}
function showNextLearningStep() {
  updateStepCounter();
  document.getElementById('nextButton').style.display = 'none';
  document.getElementById('speakQuiz').style.display = 'none'
  // If queue is empty, finish
  ////console.log("CurrentStep is" + currentStep)
  if (currentStep >= learningQueue.length) {
    endTest();
    return;
  }
  const step = learningQueue[currentStep];
  switch (step.type) {
    case "quiz1":
      quizStyle1()
      break;

    case "quiz2":
      quizStyle2()
      break;

    case "quiz3":
      quizStyle3()
      break;

    case "quiz5":
      quizStyle5()
      break;

    case "quiz4":
      quizStyle4()
      break;

    case "quiz6":
      quizStyle6()
      break;
    case "quiz7":
      quizStyle7()
      break;
    case "quiz8":
      quizStyle8()
      break;
    case "flashcard":
      showNextVocab()
      break;

    default:
      // handle unknown step type
      ////console.warn("Unknown step type:", step.type);
      break;
  }
}
function showNextVocab() {
  document.getElementById('quizContainer').style.display = 'none';
  document.getElementById('trueFalseContainer').style.display = 'none';
  document.getElementById('incorrectMessage').style.display = 'none';
  document.getElementById('nextAfterIncorrectButton').style.display = 'none';
  document.getElementById('nextButton').style.display = '';
  correctDefinition.style.display = 'None';

  const vocabFlashcard = document.getElementById('vocabFlashcard');
  let wordDiv = document.getElementById('wordDiv');
  let defDiv = document.getElementById('defDiv');
  let bookDiv = document.getElementById('bookDiv');
  let pronounDiv = document.getElementById('pronounDiv');
  let genderDiv = document.getElementById('genderDiv');
  let etymDiv = document.getElementById('etymDiv');
  let groupDiv = document.getElementById('groupDiv');
  let tipsDiv = document.getElementById('tipsDiv');

  let word;
  let definition;
  let wordObj = learningQueue[currentStep].word;
  ////console.log(wordObj)
  document.getElementById('speak').addEventListener('click', async function () {
    utils.speakWord(currentLanguage, wordObj.word, latinMedieval);
  });
  word = wordObj.word
  definition = wordObj.definition;
  const maxSize = 3
  const minSize = 1
  const clamped = Math.min(definition.length, 200);
  const size =
    maxSize - ((maxSize - minSize) * (clamped / 200));
  defDiv.style.fontSize = size.toFixed(1) + 'vw';
  const book = wordObj.book || '';
  if (wordObj.gender) {
    const gender = wordObj.gender;
    genderDiv.textContent = gender
    if (gender == utils.GenderType.masculine) { genderDiv.style.color = 'blue'; }
    if (gender == utils.GenderType.FEMININE) { genderDiv.style.color = "#BD4028"; }
    if (gender == utils.GenderType.neuter) { genderDiv.style.color = 'green'; }


  } else {
    genderDiv.textContent = ""
  }
  if (wordObj.conjugations && wordObj.conjugations.group) {
    groupDiv.textContent = "group:" + wordObj.conjugations.group
  }
  if (wordObj.pronounciation) {
    const pronoun = wordObj.pronounciation;
    pronounDiv.textContent = pronoun;
  } else {
    pronounDiv.textContent = ""
  }
  wordDiv.innerHTML = word.bold();
  defDiv.textContent = definition;
  bookDiv.textContent = book;
  if (wordObj.etym) {
    const etymText = wordObj.etym;
    const etymSize =
      maxSize - ((maxSize - minSize) * (Math.min(etymText.length, 300) / 300));
    etymDiv.textContent = etymText.replace(/\.mw[\s\S]*\}/, '');
    etymDiv.textContent = etymDiv.textContent.replace('undefined', '');
    etymDiv.style.fontSize = etymSize.toFixed(1) + 'vw';
  } else {
    etymDiv.textContent = ""
  }
  if (utils.getLanguageTips(wordObj)) {
    tipsDiv.style.display = '';
    tipsDiv.textContent = utils.getLanguageTips(wordObj);
  } else {
    tipsDiv.textContent = "";

  }
  document.getElementById('quizContainer').style.display = 'none';
  vocabFlashcard.style.display = 'block';
}
function queueQuizzesForWord(wordObj) {
  const quizTypes = vocabQuizMap[wordObj.word];
  quizTypes.forEach(qtype => {
    learningQueue.push({ type: qtype, word: wordObj });
  });
}
function quizStyle8() {
  const correctVocab = learningQueue[currentStep].word;
  utils.ClearPageForQuizContainer();
  utils.showNextAndAutoplay()

  document.getElementById('speakQuiz').style.display = "block"
  const eligibleVocab = utils.getEligibleVocabs(filteredVocabList);
  if (eligibleVocab.length < 1) {
    showNextVocab();
    return;
  }
  currentQuizWord = correctVocab.word;
  wordToSpeak = currentQuizWord;

  quizType = 'Listening';
  utils.setUp8Quiz(correctVocab, eligibleVocab, latinMedieval);
  currentTest = { quizStyle: "Pronounciation", vocab: correctVocab.word, book: correctVocab.book };
}
async function populateBookSelector() {
  return new Promise(resolve => {

    var first = true;
    chrome.storage.local.get({ bookList: [] }, (result) => {
      const bookList = result.bookList ? result.bookList : "Default";
      // Clear existing options except for the default option
      // Add books as options
      bookList.forEach(book => {
        if (first) { firstbook = book; first = false; }
        let option = document.createElement('option');

        option.textContent = book;
        option.value = book;

        document.getElementById('bookSelector').add(option);
      });
      resolve(firstbook);
      return firstbook;
    });
  });
}

function showNextItem() {
  if (currentQuizNo >= filteredVocabList.length) {
    document.getElementById("donzo").style.display = 'block';
    document.getElementById("quizContainer").style.display = 'none';
    document.getElementById('trueFalseContainer').style.display = 'none';
  } else {
    document.getElementById('nextButton').style.display = 'none';
    document.getElementById('quizContainer').style.display = 'none';
    document.getElementById('trueFalseContainer').style.display = 'none';
    const focusQuizMap = {
      gender: [quizStyle5],
      pronounciation: [quizStyle4],
      inflection: [quizStyle6, quizStyle7],
      definition: [quizStyle1, quizStyle2, quizStyle3, quizStyle8]
    };
    const allQuizStyles = [quizStyle1, quizStyle2, quizStyle3, quizStyle4, quizStyle5, quizStyle6, quizStyle7, quizStyle8];
    if (focusQuizMap[currentFocus]) {
      const quizStyles = focusQuizMap[currentFocus];
      // Pick one at random if multiple styles
      const randomIndex = Math.floor(Math.random() * quizStyles.length);
      quizStyles[randomIndex]();
    } else {
      // No focus: pick any quiz stypeat random
      const randomIndex = Math.floor(Math.random() * allQuizStyles.length);
      allQuizStyles[randomIndex]();
    }
  }
}
function updateStepCounter() {
  document.getElementById('currentStepNum').textContent = currentStep + 1;
  document.getElementById('totalStepNum').textContent = learningQueue.length;
}
function quizStyle1() {
  shouldSpeak = true;
  const correctVocab = learningQueue[currentStep].word;
  currentQuizWord = correctVocab.word;
  wordToSpeak = correctVocab.word;
  utils.setupDefQuiz(correctVocab, filteredVocabList)
  currentTest = { quizStyle: "Ask for definition", vocab: correctVocab.word, book: correctVocab.book };
}
function quizStyle2() {
  shouldSpeak = true;
  const correctVocab = learningQueue[currentStep].word;
  currentQuizWord = correctVocab.word;
  wordToSpeak = correctVocab.word;

  currentQuizDefinition = correctVocab.definition;
  utils.setupWordQuiz(correctVocab, filteredVocabList)
  currentTest = { quizStyle: "Ask for word", vocab: correctVocab.word, book: correctVocab.book };
}

function quizStyle3() {
  const correctVocab = learningQueue[currentStep].word;
  shouldSpeak = false;
  currentQuizWord = correctVocab.word;
  currentQuizDefinition = correctVocab.definition;
  quizType = 'truefalse';

  isPairCorrect = Math.random() < 0.5;

  if (!isPairCorrect) {
    let incorrectVocab;
    do {
      const randomIndex = Math.floor(Math.random() * filteredVocabList.length);
      incorrectVocab = filteredVocabList[randomIndex];
    } while (incorrectVocab.word === currentQuizWord);
    currentQuizDefinition = incorrectVocab.definition;
  }
  utils.setupTFQuiz(correctVocab, currentQuizWord, currentQuizDefinition)
}
function quizStyle4() {
  ////console.log("4, ask for pronounciation")
  quizType = "pronounciation"

  const correctVocab = learningQueue[currentStep].word;
  shouldSpeak = true;
  if (!utils.checkEligible(correctVocab, utils.hasPronounciation, false)) {
    currentVocabIndex--;
    return showNextItem();
  }
  //console.log("quizStyle4 called for " + correctVocab.word);


  currentQuizWord = correctVocab.word;
  wordToSpeak = correctVocab.word;

  currentQuizDefinition = correctVocab.pronounciation;
  if (currentQuizDefinition == "") {
    if (learningQueue[currentStep - 1].type === 'quiz2') {
      quizStyle1();
      return;
    } else if (learningQueue[currentStep - 1].type === 'quiz1') {
      quizStyle3();
      return;
    } else if (learningQueue[currentStep - 1].type === 'quiz3') {
      quizStyle2();
      return;
    } else {
      quizStyle3();
      return;
    }
  } else {
    utils.setUpPronounciationQuiz(correctVocab, utils.getEligibleVocabs(filteredVocabList, utils.hasPronounciation, false, correctVocab.word.length))
  }


}
function quizStyle5() {
  quizType = "gender"
  ////console.log("5, ask for gender")
  const correctVocab = learningQueue[currentStep].word;
  shouldSpeak = false;
  if (!utils.checkEligible(correctVocab, utils.hasGender, false)) {
    if (learningQueue[currentStep - 1].type === 'quiz2') {
      quizStyle1();
      return;
    } else if (learningQueue[currentStep - 1].type === 'quiz1') {
      quizStyle3();
      return;
    } else if (learningQueue[currentStep - 1].type === 'quiz3') {
      quizStyle2();
      return;
    } else {
      quizStyle2();
      return;
    }
  }
  currentQuizWord = correctVocab.word;
  currentQuizDefinition = correctVocab.gender;
  quizType = 'truefalse';
  isPairCorrect = Math.random() < 0.5;

  if (!isPairCorrect) {
    var incorrectVocab = utils.LanguageGenderMap[correctVocab.language || correctVocab.book].filter(item => item !== currentQuizDefinition);
    //console.log(incorrectVocab)
    currentQuizDefinition = utils.getRandomElement(incorrectVocab);
  }
  utils.setupTFQuiz(correctVocab, currentQuizWord, currentQuizDefinition)
}
function getRandomKeys(obj, count) {
  let keys = Object.keys(obj);
  let selectedKeys = [];
  for (let i = 0; i < count; i++) {
    let randomKey = keys[Math.floor(Math.random() * keys.length)];
    selectedKeys.push(randomKey);
  }
  return selectedKeys;
}
function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
// Helper function to get random keys from an array
function getRandomKeysFromArray(array, count) {
  let shuffled = array.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Helper function to get random subfield from an object
function getRandomSubfield(obj) {
  const keys = Object.keys(obj);
  const validKeys = keys.filter(field => (field !== 'pos') && (field !== 'type'));
  const randomKey = validKeys[Math.floor(Math.random() * keys.length)];
  return randomKey;
}

// Helper function to find common word across multiple lists
function findCommonWordAcrossLists(lists) {
  const res = lists.reduce((a, b) => a.filter(c => b.includes(c))); // Get first common word or undefined
  return res;
}

function getRandomWordFromConjugations(conjugations, commonWordsList = []) {
  let fields = Object.keys(conjugations);
  const filteredFields = fields.filter(field => (field !== 'pos') && (field !== 'type') && (field !== 'group') && (field !== 'group'));
  const randomField = filteredFields[Math.floor(Math.random() * filteredFields.length)];
  const subfields = Object.keys(conjugations[randomField]);
  let randomSubfield = subfields[Math.floor(Math.random() * subfields.length)];
  const words = conjugations[randomField][randomSubfield];
  const randomWord = words[Math.floor(Math.random() * words.length)];
  ////console.log(randomField + ":" + randomSubfield + ":" + randomWord)
  if (randomWord == undefined) {
    return getRandomWordFromConjugations(conjugations, commonWordsList);
  }
  const isInAllSubfields = commonWordsList.includes(randomWord)
  if (randomWord.length <= 1 || randomWord == null || isInAllSubfields) {
    ////console.log(randomWord + " is not not a wrong answer")
    return getRandomWordFromConjugations(conjugations, commonWordsList);
  } else {
    return randomWord;
  }
}
function makeStringReadable(names) {
  names = names.replace("futurePerfect", 'future perfect');
  names = names.replaceAll("_", ' ');

  return names
}
function findSubfieldsForWord(word, conjugations) {
  let wordSubfields = [];

  for (const field in conjugations) {
    if ((field !== 'pos') && (field !== 'type')) {
      for (const subfield in conjugations[field]) {
        if (conjugations[field][subfield].includes(word)) {
          wordSubfields.push({ field, subfield });
        }
      }
    }
  }
  let combinedSubfields = {};

  wordSubfields.forEach(item => {
    const field = item.field;
    const subfield = item.subfield;

    // Check if the field already exists in the object
    if (combinedSubfields[field]) {
      // If it exists, concatenate the subfields with "/"
      combinedSubfields[field] += "/" + subfield;
    } else {
      // Otherwise, just set the subfield for this field
      combinedSubfields[field] = subfield;
    }
  });

  return combinedSubfields;
}

function quizStyle6() {
  shouldSpeak = false;

  const correctVocab = learningQueue[currentStep].word;
  if (!utils.checkEligible(correctVocab, utils.hasConjugations, false)) {
    return quizStyle2();
  }
  let result = utils.prepareOptionsForQuiz6(correctVocab);
  currentQuizWord = correctVocab.word;
  currentQuizDefinition = result[1];
  conjToTest = result[2];
  correctConj = currentQuizDefinition
  quizType = result[4];
  utils.prepareQuiz6(result[0], result[1], result[5]);
  wordToSpeak = currentQuizWord;

  currentTest = { quizStyle: (quizType == "6") ? "Give inflection, ask type of inflection" : "Ask for word group", vocab: correctVocab.word, book: correctVocab.book };

}
function quizStyle7() {
  const correctVocab = learningQueue[currentStep].word;
  if (!utils.checkEligible(correctVocab, utils.hasConjugations, false)) {
    return quizStyle1();
  }
  const result = utils.prepareOptionsForQuizStyle7(correctVocab);
  currentQuizWord = correctVocab.word;
  currentQuizDefinition = result[1];
  quizType = '7';
  wordToTest = result[4];
  conjToTest = result[3];
  let options = result[0];
  correctConj = currentQuizDefinition;
  wordToSpeak = wordToTest;

  utils.setupQuiz7(options, currentQuizDefinition, result[2]);
}
function checkAnswer(button) {
  const correctAnswer = document.getElementById('quizContainer').dataset.correctAnswer;
  const correctMessage = document.getElementById('correctMessage');
  const incorrectMessage = document.getElementById('incorrectMessage');
  const correctDefinition = document.getElementById('correctDefinition');
  const result = button.textContent === correctAnswer ? 't' : 'f';

  if (button.textContent === correctAnswer) {
    utils.speakWord(currentLanguage, currentQuizWord, latinMedieval);

    currentStep += 1;
    button.classList.add('correct');
    correctMessage.style.display = 'block';
    setTimeout(() => {
      button.classList.remove('correct');
      correctMessage.style.display = 'none';
      ////console.log("correct")
      showNextLearningStep();
    }, 500);
  } else {
    incorrectMessage.style.display = 'block';
    showCorrectAnswer();
    wrongVocabs.push(currentQuizWord);
    document.getElementById('nextAfterIncorrectButton').style.display = 'Block';
  }
}

function showCorrectAnswer() {
  ////console.log(quizType)
  const quizContainer = document.querySelector('.quiz-container');
  quizContainer.style.display = "none";
  const tfContainer = document.querySelector('.true-false-container');
  tfContainer.style.display = "none";
  const vocabFlashcard = document.getElementById('correctDefinition');
  vocabFlashcard.style.display = 'block';
  const nextButton = document.getElementById('nextAfterIncorrectButton');
  nextButton.style.display = 'block';
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
    if (quizType == "6") {
      vocabFlashcard.innerHTML += String.fromCodePoint(0x1F4A0);
      vocabFlashcard.textContent += currentQuizDefinition
      vocabFlashcard.textContent += " is one of the "
      vocabFlashcard.textContent += makeStringReadable(conjToTest.toString())
      vocabFlashcard.textContent += "form of "
      vocabFlashcard.textContent += correctVocab.word
    } if (quizType == "7") {
      vocabFlashcard.innerHTML += String.fromCodePoint(0x1F4A0);
      vocabFlashcard.textContent += wordToTest
      vocabFlashcard.textContent += " is one of the "
      vocabFlashcard.textContent += makeStringReadable(conjToTest.toString())
      vocabFlashcard.textContent += " form of "
      vocabFlashcard.textContent += correctVocab.word
    } if (quizType == "groupTest") {
      vocabFlashcard.innerHTML += String.fromCodePoint(0x1F4A0);
      vocabFlashcard.textContent += " group: "
      vocabFlashcard.textContent += correctVocab.conjugations.group
    }
    document.getElementById('quizContainer').style.display = 'none';
    vocabFlashcard.style.display = 'block';
  }
}
function checkTrueFalse(isTrue) {
  const correctMessage = document.getElementById('correctMessage');
  const incorrectMessage = document.getElementById('incorrectMessage');
  const correctDefinition = document.getElementById('correctDefinition');

  if (isTrue === isPairCorrect) {
    currentStep += 1;
    correctMessage.style.display = 'block';
    setTimeout(() => {
      correctMessage.style.display = 'none';
      showNextLearningStep();
    }, 500);
  } else {
    incorrectMessage.style.display = 'block';
    document.getElementById('nextButton').style.display = 'none';
    showCorrectAnswer();
    document.getElementById('nextAfterIncorrectButton').style.display = 'block';
    wrongVocabs.push(currentQuizWord);
  }
  document.getElementById('trueFalseContainer').style.display = 'none';
}
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
function endTest() {
  document.getElementById("stepCounter").style.display = 'none'
  document.getElementById("quizContainer").style.display = 'none'
  document.getElementById("trueFalseContainer").style.display = 'none'
  // Mark all words in learningQueue as learned
  const seenWords = new Set();
  learningQueue.forEach(item => {
    if (item.word && !seenWords.has(item.word.word)) {
      seenWords.add(item.word.word);
    }
  });
  chrome.storage.local.get('vocabList', function (data) {
    if (data.vocabList) {
      // Update learnedTime for words in seenWords
      data.vocabList.forEach(vocab => {
        if (seenWords.has(vocab.word)) {
          vocab.learnedTime = (vocab.learnedTime || 0) + 1;
        }
      });
      // Save updated vocabList back to storage
      chrome.storage.local.set({ vocabList: data.vocabList }, function () {
        ////console.log("Updated vocabList saved to storage.");
      });
    }
  });

  if (wrongVocabs.length >= 4) {
    document.getElementById("redo").style.display = '';
  } else {
    document.getElementById("redo").style.display = 'None';
  }
  let congrats = document.getElementById("congratsMessage");
  if (!congrats) {
    congrats = document.createElement("div");
    congrats.id = "congratsMessage";
    congrats.style.fontSize = "2vw";
    congrats.style.color = "#2e7d32";
    congrats.style.fontWeight = "bold";
    congrats.style.margin = "32px auto";
    congrats.style.background = "#e6f7e6";
    congrats.style.borderRadius = "12px";
    congrats.style.padding = "24px";
    congrats.style.maxWidth = "600px";
    congrats.style.textAlign = "center";
    congrats.innerHTML = "Congratulations! You have finished this round of learning! Refresh to start another round.";
    document.body.appendChild(congrats);
  } else {
    congrats.style.display = "block";
  }
}

