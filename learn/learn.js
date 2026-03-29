import * as utils from '../utils.js';
let currentVocabIndex = null;
let vocabList = [];
let firstbook = "";
let currentQuizWord = null;
let sortedNewWordsByLang = {};
let currentLanguage;
let wordToSpeak;
let latinMedieval = false;
let wordsToRevise;
let currentQuizDefinition = null;
let quizType = null;
let newWordsCount = 0;
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
let currentGermanPerfektReview = null;
const FOCUS_EMPTY = '&#9734';
const FOCUS_FILLED = '&#11088';
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

        //////console.log(sortedResult);
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

    const newWordsData = await getNewWordsData();
    newWordsCount = newWordsData[utils.nameToAbbr[selector.value.toLowerCase()]] || 0;

    if (newWordsCount > 4) {
      //console.log(newWordsCount)
      document.getElementById('newLastCard').style.display = '';
      newLastOptionLabel.style.display = '';
      document.getElementById('newLastOption').style.display = '';
      newLastOption.checked = true;
      document.getElementById('newFirstOption').checked = false;
      document.getElementById('newLastLabel').innerHTML = `You have added <strong>${newWordsCount}</strong> new vocabs to this deck since you last learned, learn them`
    } else {
      document.getElementById('newLastCard').style.display = 'none';
      newLastOptionLabel.style.display = 'none';
      document.getElementById('newLastOption').style.display = 'none';
      newLastOption.checked = false;
      document.getElementById('newFirstOption').checked = true;
      updateWordsToLearnVisibility()
    }
    updateWordsToLearnVisibility();
    updateTotalWords()
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
          if (learnedCount <= 6) {
            document.getElementById("wordsToRevise").style.display = 'none';
            document.getElementById("learnedVocabCount").value = 0;
            updateTotalWords();
          } else {
            document.getElementById("wordsToRevise").style.display = '';
            document.getElementById("learnedVocabCount").value = 6;
            updateTotalWords();
          }
          //console.log(counts)
          let revisedCount = 0;
          for (let i = 2; i <= 8; i++) {
            revisedCount += parseInt(counts[i]) || 0;
          }
          const percentage = learnedCount / filteredVocabList.length * 100;
          const count = "learned & revised: " + revisedCount + " / learned: " + learnedCount + " / total: " + filteredVocabList.length;
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
  selector.addEventListener("change", updateWordsToLearnVisibility);

  chrome.storage.local.get('vocabList', function (data) {
    if (data.vocabList) {
      vocabList = data.vocabList;

    }
  });

  updateProgress()
  updateWordsToLearnVisibility();

  document.getElementById('start').addEventListener('click', () => {
    learnCount = Math.max(document.getElementById('vocabCount').value, 4);
    focusOption = document.querySelector('input[name="focusOption"]:checked').value;
    let selectedCollection = document.getElementById('bookSelector').value;
    wordsToRevise = document.getElementById('learnedVocabCount').value;

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
    ////////console.log(filteredVocabList)
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

  document.getElementById('focusButton').addEventListener('click', function () {
    toggleCurrentWordFocus();
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

  const checkButton = document.getElementById('checkButton');
  const answerInput = document.getElementById('answer');
  if (checkButton && answerInput) {
    checkButton.addEventListener('click', function () {
      checkSpelling();
    });
    answerInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        checkSpelling();
      }
    });
  }

  document.getElementById('learnedVocabCount').addEventListener('change', function () {
    updateTotalWords();
  });

  document.getElementById('wordsToLearn').addEventListener('change', function () {
    updateTotalWords();
  });

  function updateWordsToLearnVisibility() {
    const selected = document.querySelector('input[name="focusOption"]:checked')?.value;
    const wordsToLearn = document.getElementById('wordsToLearn');
    if (selected === 'newLast') {
      wordsToLearn.style.display = 'none';
    } else {
      wordsToLearn.style.display = '';
    }
  }

  function updateTotalWords() {
    let toLearn = parseInt(document.getElementById('vocabCount')?.value || 0) + parseInt(document.getElementById('learnedVocabCount').value || 0);
    const selected = document.querySelector('input[name="focusOption"]:checked')?.value;
    if (selected === 'newLast') {
      toLearn = newWordsCount + parseInt(document.getElementById('learnedVocabCount').value || 0);
    }
    document.getElementById('totalWords').innerHTML = "<b style='font-size:2.5vh; color: #41625f;'>" + toLearn + "</b>";
  }

  updateWordsToLearnVisibility();
  updateTotalWords();

  // update whenever user changes focus option
  document.querySelectorAll('input[name="focusOption"]').forEach(radio => {
    radio.addEventListener('change', updateWordsToLearnVisibility);
    radio.addEventListener('change', updateTotalWords);
  });
}
);
let currentFocus;

function getWordMatchIndex(arr, wordObj) {
  if (!Array.isArray(arr) || !wordObj) return -1;
  let index = arr.findIndex(item =>
    item.word === wordObj.word &&
    item.book === wordObj.book &&
    item.definition === wordObj.definition
  );
  if (index === -1) {
    index = arr.findIndex(item =>
      item.word === wordObj.word &&
      item.book === wordObj.book
    );
  }
  return index;
}

function updateFocusButtonForWord(wordObj) {
  const focusButton = document.getElementById('focusButton');
  if (!focusButton) return;
  focusButton.innerHTML = wordObj?.focus === true ? FOCUS_FILLED : FOCUS_EMPTY;
}

function toggleCurrentWordFocus() {
  const currentWordObj = learningQueue[currentStep]?.word;
  if (!currentWordObj) return;

  const nextFocusValue = (currentWordObj.focus != null) ? (!currentWordObj.focus) : true;
  console.log("Toggling focus for word:", currentWordObj.word, "New focus value:", nextFocusValue);
  currentWordObj.focus = nextFocusValue;
  updateFocusButtonForWord(currentWordObj);

  const inMemoryIndex = getWordMatchIndex(vocabList, currentWordObj);
  if (inMemoryIndex !== -1) {
    vocabList[inMemoryIndex].focus = nextFocusValue;
  }

  chrome.storage.local.get('vocabList', function (data) {
    if (!data.vocabList) return;
    let storedList = data.vocabList;
    const storedIndex = getWordMatchIndex(storedList, currentWordObj);
    if (storedIndex === -1) return;
    storedList[storedIndex].focus = nextFocusValue;
    chrome.storage.local.set({ vocabList: storedList }, function () { });
  });
}

function getLeastLearnedAmount(arr) {
  let leastLearned = Math.min(...filteredVocabList.map(item => item.learnedTime ?? 0));
  let res = [];
  //console.log("Focus option selected: " + focusOption);
  const maxEntry = arr.slice().reduce((max, entry) =>
    (entry.learnedTime > (max?.learnedTime ?? -Infinity)) ? entry : max
    , null);
  if (wordsToRevise > 0) {
    res = getLearnedWords(arr, wordsToRevise);
  }
  if (focusOption === "random") {
    shuffleArray(arr);
    res = res.concat(arr
      .slice() // make a copy
      .sort((a, b) => {
        const aTime = a.learnedTime ?? -Infinity;
        const bTime = b.learnedTime ?? -Infinity;
        return aTime - bTime;
      })
      .slice(0, learnCount));
  } else if (focusOption === "newLast") {
    const reversedList = arr.slice().reverse();
    const firstLearnedIdx = reversedList.findIndex(vocab => vocab.hasOwnProperty('learnedTime'));
    //////console.log(firstLearnedIdx)
    res = res.concat(reversedList.slice(0, firstLearnedIdx));
  } else if (focusOption === "revise") {
    if (wordsToRevise > 0) {
      learnCount += parseInt(wordsToRevise);
    }
    return getLearnedWords(arr, learnCount);
  } else {
    //console.log("Newest")
    res = res.concat(arr.slice().reverse()
      .filter(item => !('learnedTime' in item) || item.learnedTime === leastLearned)
      .slice(0, learnCount))
  }
  shuffleArray(res);
  return res;
}

function getLearnedWords(arr, learnCount) {
  let leastLearned = Math.min(...filteredVocabList.map(item => item.learnedTime ?? 0));
  let learnedWords = arr.slice().filter(item => item.learnedTime === leastLearned + 1);
  shuffleArray(learnedWords);
  return learnedWords.slice(0, learnCount);
}
async function generateLearningQueue(bookSelected) {
  const wordQuizCounts = {};
  const wordQuizTypeCounts = {};
  learningQueue = [];
  learnedWords = [];

  function addQuizToQueue(targetQueue, type, wordObj) {
    const word = wordObj.word;
    const maxQuizAppearances = 5;
    if ((wordQuizCounts[word] || 0) < maxQuizAppearances) {
      targetQueue.push({ type, word: wordObj });
      wordQuizCounts[word] = (wordQuizCounts[word] || 0) + 1;
      if (!wordQuizTypeCounts[word]) {
        wordQuizTypeCounts[word] = {};
      }
      wordQuizTypeCounts[word][type] = (wordQuizTypeCounts[word][type] || 0) + 1;
      return true;
    }
    return false;
  }

  function getEligibleQuizTypes(wordObj) {
    const quizTypes = ['quiz1', 'quiz2', 'quiz3', 'quiz8', 'quiz9'];

    if (utils.hasPronounciation(wordObj)) {
      quizTypes.push('quiz4');
    }
    if (utils.hasGender(wordObj)) {
      quizTypes.push('quiz5');
    }
    if (utils.hasGermanPerfekt(wordObj)) {
      quizTypes.push('quiz10');
    }

    return quizTypes;
  }

  function pickQuizTypeForWord(wordObj) {
    const word = wordObj.word;
    const eligibleQuizTypes = getEligibleQuizTypes(wordObj);
    const quizCounts = wordQuizTypeCounts[word] || {};
    const lowestUsage = Math.min(...eligibleQuizTypes.map(type => quizCounts[type] || 0));
    const leastUsedTypes = eligibleQuizTypes.filter(type => (quizCounts[type] || 0) === lowestUsage);

    return leastUsedTypes[Math.floor(Math.random() * leastUsedTypes.length)];
  }

  function getFlashcardBatches(words) {
    const batches = [];
    let index = 0;

    while (index < words.length) {
      const batchSize = Math.min(4, words.length - index);
      batches.push(words.slice(index, index + batchSize));
      index += batchSize;
    }

    return batches;
  }

  function buildQuizQueueForBatch(batchWords) {
    const batchQuizQueue = [];
    const minimumQuizzesPerWord = 2;
    const targetQuizCount = batchWords.length === 4 ? 10 : batchWords.length * minimumQuizzesPerWord;

    batchWords.forEach(wordObj => {
      for (let i = 0; i < minimumQuizzesPerWord; i++) {
        addQuizToQueue(batchQuizQueue, pickQuizTypeForWord(wordObj), wordObj);
      }
    });

    const extraWords = batchWords.slice();
    shuffleArray(extraWords);
    let extraIndex = 0;
    while (batchQuizQueue.length < targetQuizCount && extraWords.length > 0) {
      const wordObj = extraWords[extraIndex % extraWords.length];
      const added = addQuizToQueue(batchQuizQueue, pickQuizTypeForWord(wordObj), wordObj);
      extraIndex++;

      if (!added && extraIndex > extraWords.length * 2) {
        break;
      }
    }

    shuffleArray(batchQuizQueue);
    return batchQuizQueue;
  }

  function buildFinalQuizQueue(words) {
    const finalQuizQueue = [];

    words.forEach(wordObj => {
      for (let i = 0; i < 2; i++) {
        addQuizToQueue(finalQuizQueue, pickQuizTypeForWord(wordObj), wordObj);
      }
    });

    shuffleArray(finalQuizQueue);
    return finalQuizQueue;
  }

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
      ////console.log(filteredVocabList)
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
      currentLanguage = utils.detectLanguage(filteredVocabList);

      filteredVocabList.forEach(wordObj => {
        wordQuizCounts[wordObj.word] = 0;
        wordQuizTypeCounts[wordObj.word] = {};
      });
      const flashcardBatches = getFlashcardBatches(filteredVocabList);

      flashcardBatches.forEach(batchWords => {
        batchWords.forEach(wordObj => {
          learningQueue.push({ type: 'flashcard', word: wordObj });
          learnedWords.push(wordObj);
        });

        const batchQuizQueue = buildQuizQueueForBatch(batchWords);
        learningQueue.push(...batchQuizQueue);
      });

      const finalQuizQueue = buildFinalQuizQueue(filteredVocabList);
      learningQueue.push(...finalQuizQueue);
    }
    currentStep = 0;
    showNextLearningStep();
    console.log("Generated learning queue:", learningQueue);
  });
}
function showNextLearningStep() {
  updateStepCounter();
  document.getElementById('nextButton').style.display = 'none';
  document.getElementById('speakQuiz').style.display = 'none'
  document.getElementById('SpellingContainer').style.display = 'none'

  // If queue is empty, finish
  ////////console.log("CurrentStep is" + currentStep)
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
    case "quiz9":
      quizStyle9()
      break;
    case "quiz10":
      quizStyle10()
      break;
    case "flashcard":
      showNextVocab()
      break;

    default:
      // handle unknown step type
      //////console.warn("Unknown step type:", step.type);
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
  let infoDiv = document.getElementById('infoDiv');
  let infoDivTwo = document.getElementById('infoDivTwo');

  let etymDiv = document.getElementById('etymDiv');
  let tipsDiv = document.getElementById('tipsDiv');
  let usageDiv = document.getElementById('usageDiv');
  let word;
  let definition;
  let wordObj = learningQueue[currentStep].word;
  infoDiv.textContent = "";
  infoDivTwo.textContent = "";
  updateFocusButtonForWord(wordObj);
  ////////console.log(wordObj)
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
  if (wordObj.language) {
    switch (wordObj.language) {
      case 'de':
        if (wordObj.conjugation) {
          console.log(wordObj.conjugation)
          infoDiv.textContent = "past participle:  " + wordObj.conjugation.past_participle ?? '';
          infoDivTwo.textContent = "auxiliary:  " + wordObj.conjugation.auxiliary ?? '';
        }
        break;
      case 'la':
        console.log(wordObj.conjugations)
        if (wordObj.conjugations && wordObj.conjugations.group) {
          infoDiv.textContent = "group:" + wordObj.conjugations.group
        }
    }
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

  usageDiv.innerHTML = '';
  if (wordObj.usage) {
    usageDiv.style.backgroundColor = '#f0f0f0';
    usageDiv.innerHTML = wordObj.usage;
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
      definition: [quizStyle1, quizStyle2, quizStyle3, quizStyle8, quizStyle9]
    };
    const allQuizStyles = [quizStyle1, quizStyle2, quizStyle3, quizStyle4, quizStyle5, quizStyle6, quizStyle7, quizStyle8, quizStyle9];
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
  currentGermanPerfektReview = null;
  shouldSpeak = true;
  const correctVocab = learningQueue[currentStep].word;
  currentQuizWord = correctVocab.word;
  wordToSpeak = correctVocab.word;
  utils.setupDefQuiz(correctVocab, filteredVocabList)
  currentTest = { quizStyle: "Ask for definition", vocab: correctVocab.word, book: correctVocab.book };
}
function quizStyle2() {
  currentGermanPerfektReview = null;
  shouldSpeak = true;
  const correctVocab = learningQueue[currentStep].word;
  currentQuizWord = correctVocab.word;
  wordToSpeak = correctVocab.word;

  currentQuizDefinition = correctVocab.definition;
  utils.setupWordQuiz(correctVocab, filteredVocabList)
  currentTest = { quizStyle: "Ask for word", vocab: correctVocab.word, book: correctVocab.book };
}

function quizStyle3() {
  currentGermanPerfektReview = null;
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
  currentGermanPerfektReview = null;
  ////////console.log("4, ask for pronounciation")
  quizType = "pronounciation"

  const correctVocab = learningQueue[currentStep].word;
  shouldSpeak = true;
  if (!utils.checkEligible(correctVocab, utils.hasPronounciation, false)) {
    currentVocabIndex--;
    return showNextItem();
  }
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
  currentGermanPerfektReview = null;
  quizType = "gender"
  ////////console.log("5, ask for gender")
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
    var incorrectVocab = utils.LanguageGenderMap[correctVocab.language || correctVocab.book || currentLanguage].filter(item => item !== currentQuizDefinition);
    //////console.log(incorrectVocab)
    currentQuizDefinition = utils.getRandomElement(incorrectVocab);
  }
  utils.setupTFQuiz(correctVocab, currentQuizWord, currentQuizDefinition)
}

function quizStyle9() {
  currentGermanPerfektReview = null;
  shouldSpeak = true;
  const correctVocab = learningQueue[currentStep].word;
  currentQuizWord = correctVocab.word;
  wordToSpeak = correctVocab.word;
  utils.setupSpellingQuiz(correctVocab)
  currentTest = { quizStyle: "Ask for spelling", vocab: correctVocab.word, book: correctVocab.book };
}

function getRandomWordFromConjugations(conjugations, commonWordsList = []) {
  let fields = Object.keys(conjugations);
  const filteredFields = fields.filter(field => (field !== 'pos') && (field !== 'type') && (field !== 'group') && (field !== 'group'));
  const randomField = filteredFields[Math.floor(Math.random() * filteredFields.length)];
  const subfields = Object.keys(conjugations[randomField]);
  let randomSubfield = subfields[Math.floor(Math.random() * subfields.length)];
  const words = conjugations[randomField][randomSubfield];
  const randomWord = words[Math.floor(Math.random() * words.length)];
  ////////console.log(randomField + ":" + randomSubfield + ":" + randomWord)
  if (randomWord == undefined) {
    return getRandomWordFromConjugations(conjugations, commonWordsList);
  }
  const isInAllSubfields = commonWordsList.includes(randomWord)
  if (randomWord.length <= 1 || randomWord == null || isInAllSubfields) {
    ////////console.log(randomWord + " is not not a wrong answer")
    return getRandomWordFromConjugations(conjugations, commonWordsList);
  } else {
    return randomWord;
  }
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
  currentGermanPerfektReview = null;
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
  currentGermanPerfektReview = null;
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
function quizStyle10() {
  currentGermanPerfektReview = null;
  shouldSpeak = true;
  nextButton.style.display = 'none';
  const correctVocab = learningQueue[currentStep].word;
  if (!utils.checkEligible(correctVocab, utils.hasGermanPerfekt, false)) {
    return quizStyle2();
  }
  currentQuizWord = correctVocab.word;
  currentQuizDefinition = correctVocab.conjugation.past_participle;
  currentGermanPerfektReview = correctVocab?.conjugation?.auxiliary
    ? `Perfekt: ${correctVocab.conjugation.auxiliary} + ${currentQuizDefinition}`
    : `Perfekt: ${currentQuizDefinition}`;
  quizType = 'germanPerfekt';
  wordToSpeak = currentQuizDefinition;
  utils.setupSpellingQuiz(correctVocab, {
    prompt: `Spell the past participle of "${correctVocab.word}".`,
    correctAnswer: currentQuizDefinition
  });
  currentTest = { quizStyle: "German Perfekt Tense", vocab: correctVocab.word, book: correctVocab.book };
}
function checkAnswer(button) {
  const correctAnswer = document.getElementById('quizContainer').dataset.correctAnswer;
  utils.handleMultipleChoiceAnswer({
    button,
    correctAnswer,
    speakWord: () => utils.speakWord(currentLanguage, currentQuizWord, latinMedieval),
    onCorrect: () => {
      currentStep += 1;
      showNextLearningStep();
    },
    onIncorrect: () => {
      wrongVocabs.push(currentQuizWord);
    },
    reviewState: getAnswerReviewState(),
  });
}

function showCorrectAnswer(userAnswer = "", correctAnswer = "") {
  utils.renderCorrectAnswerReview({
    ...getAnswerReviewState(),
    userAnswer,
    correctAnswer,
  });
}
function checkTrueFalse(isTrue) {
  utils.handleTrueFalseAnswer({
    isTrue,
    isPairCorrect,
    onCorrect: () => {
      currentStep += 1;
      showNextLearningStep();
    },
    onIncorrect: () => {
      wrongVocabs.push(currentQuizWord);
    },
    reviewState: getAnswerReviewState(),
  });
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
        ////////console.log("Updated vocabList saved to storage.");
      });
    }
  });

  if (wrongVocabs.length >= 4) {
    document.getElementById("redo").style.display = '';
  } else {
    document.getElementById("redo").style.display = 'None';
  }
  document.getElementById("donzo").style.display = 'block';
}

function checkSpelling() {
  const spellingContainer = document.getElementById('SpellingContainer');
  const answerInput = document.getElementById('answer');
  const rawCorrect = spellingContainer?.dataset.correctAnswer || currentQuizWord || "";
  const inputValue = answerInput?.value || "";
  const displayUserAnswer = utils.normalizeSpelling(inputValue, currentLanguage);

  utils.handleSpellingAnswer({
    currentLanguage,
    rawCorrect,
    inputValue,
    displayUserAnswer,
    speakWord: () => utils.speakWord(currentLanguage, wordToSpeak || currentQuizWord, latinMedieval),
    onCorrect: () => {
      currentStep += 1;
      showNextLearningStep();
    },
    onIncorrect: () => {
      wrongVocabs.push(currentQuizWord);
    },
    reviewState: getAnswerReviewState(),
  });
}
function getAnswerReviewState() {
  return {
    currentQuizWord,
    currentQuizDefinition,
    quizType,
    wordToTest,
    conjToTest,
    currentGermanPerfektReview,
    vocabList,
  };
}
