import { hasGender, hasPronounciation } from '../utils.js';
import * as utils from '../utils.js';
let currentVocabIndex = null;
let vocabList = [];
let currentQuizWord = null;
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
document.getElementById('vocabCount').addEventListener('input', function () {
  if (this.value < 4) this.value = 4;
});
let learnCount = 0;
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('vocabFlashcard').style.display = 'none';
  document.getElementById('quizContainer').style.display = 'none';
  document.getElementById('trueFalseContainer').style.display = 'none';
  document.getElementById('nextButton').style.display = 'none';
  populateBookSelector();
  document.getElementById('start').addEventListener('click', () => {
    learnCount = Math.max(document.getElementById('vocabCount').value, 4);
    const selectedCollection = document.getElementById('bookSelector').value;
    // Call the function to display vocab
    generateLearningQueue(selectedCollection);
  });

  document.getElementById('nextButton').addEventListener('click', function () {
    currentStep += 1;
    updateStepCounter()
    showNextItem();
  });

  document.getElementById('redo').addEventListener('click', function () {
    document.getElementById('nextAfterIncorrectButton').style.display = "None"
    document.getElementById('showTestResult').style.display = "None"

    filteredVocabList = filteredVocabList.filter(item => wrongVocabs.includes(item.word));
    //console.log(filteredVocabList)
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
    showNextItem();
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
  shuffleArray(arr);
  return arr
    .slice() // make a copy
    .sort((a, b) => {
      const aTime = a.learnedTime ?? -Infinity;
      const bTime = b.learnedTime ?? -Infinity;
      return aTime - bTime;
    })
    .slice(0, learnCount);
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
      document.getElementById('containerLine').style.display = 'none';
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
      filteredVocabList.forEach(wordObj => {
        // 1. Flashcard
        learningQueue.push({ type: 'flashcard', word: wordObj });
        learnedWords.push(wordObj)
        // 2. True/False quiz (quizStyle3), with wrong definition from totalVocabList

        // 3. Randomly quizStyle1 or quizStyle2
        const quizType = Math.random() < 0.5 ? 'quiz1' : 'quiz2';
        learningQueue.push({ type: quizType, word: wordObj });
        //console.log(learnedWords)
        const randomQuizWord = (learnedWords.length > 1) ? utils.getNRandomElements(learnedWords, 1)[0] : wordObj
        if (hasGender(randomQuizWord)) {
          learningQueue.push({ type: 'quiz5', word: randomQuizWord });
        }
        if (hasPronounciation(randomQuizWord)) {
          learningQueue.push({ type: 'quiz4', word: randomQuizWord });
        }
        if (Math.random() < 0.5) {
          learningQueue.push({ type: 'quiz8', word: randomQuizWord });
        } else {
          learningQueue.push({ type: 'quiz3', word: randomQuizWord });
        }
      });
    }
    const quizTypes = ['quiz1', 'quiz2', 'quiz3', 'quiz4', 'quiz5', 'quiz8'];
    let randomWords = filteredVocabList.slice();
    shuffleArray(randomWords);
    randomWords.slice(0, 8).forEach(wordObj => {
      var randomIndex = Math.random()
      if (randomIndex < 0.25) {
        learningQueue.push({ type: 'quiz8', word: wordObj });
      } else if (randomIndex < 0.5) {
        learningQueue.push({ type: 'quiz1', word: wordObj });
      } else if (randomIndex < 0.75) {
        learningQueue.push({ type: 'quiz2', word: wordObj });
      } else {
        learningQueue.push({ type: 'quiz3', word: wordObj });
      }
      if (hasGender(wordObj)) {
        learningQueue.push({ type: 'quiz5', word: wordObj });
      }
    });
    shuffleArray(randomWords);
    randomWords.slice(0, 8).forEach(wordObj => {
      var randomIndex = Math.random()
      if (randomIndex < 0.25) {
        learningQueue.push({ type: 'quiz8', word: wordObj });
      } else if (randomIndex < 0.5) {
        learningQueue.push({ type: 'quiz1', word: wordObj });
      } else if (randomIndex < 0.75) {
        learningQueue.push({ type: 'quiz2', word: wordObj });
      } else {
        learningQueue.push({ type: 'quiz3', word: wordObj });
      }
      if (hasPronounciation(wordObj)) {
        learningQueue.push({ type: 'quiz4', word: wordObj });
      }
    });
    //console.log(learningQueue)
    currentStep = 0;
    showNextLearningStep();
  });
}
function showNextLearningStep() {
  updateStepCounter();
  document.getElementById('speakQuiz').style.display = 'none'
  // If queue is empty, finish
  //console.log("CurrentStep is" + currentStep)
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
      quizStyle4()
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
      //console.warn("Unknown step type:", step.type);
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
  let word;
  let definition;
  let wordObj = learningQueue[currentStep].word;
  //console.log(wordObj)
  document.getElementById('speak').addEventListener('click', async function () {
    speechSynthesis.cancel();
    const currentWord = word.split('/')[0];;
    var language = wordObj.language || wordObj.book
    language = convertToAbbr(language)
    const currentLang = getSpeechLang(language);
    const utterance = new SpeechSynthesisUtterance(currentWord);
    utterance.lang = currentLang;
    const voices = await loadVoices();
    const voice = voices.find(v => v.lang === currentLang);
    if (voice) utterance.voice = voice;
    speechSynthesis.speak(utterance);
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
  } else {
    genderDiv.textContent = ""
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

  currentQuizWord = correctVocab.word;
  quizType = 'Listening';
  // Add to the .quiz-container
  document.getElementById('speakQuiz').style.display = 'inline-block'
  document.getElementById('speakQuiz').addEventListener('click', async function () {
    speechSynthesis.cancel();
    const currentWord = correctVocab.word;
    var language = correctVocab.language || correctVocab.book
    language = convertToAbbr(language)
    const currentLang = getSpeechLang(language);
    const utterance = new SpeechSynthesisUtterance(currentWord);
    utterance.lang = currentLang;
    const voices = await loadVoices();
    const voice = voices.find(v => v.lang === currentLang);
    if (voice) utterance.voice = voice;
    speechSynthesis.speak(utterance);
  });
  const options = [correctVocab.definition];
  for (let i = 0; i < 3; i++) {
    const randomIndex = Math.floor(Math.random() * filteredVocabList.length);
    const randomWord = filteredVocabList[randomIndex].definition;
    if (!options.includes(randomWord)) {
      options.push(randomWord);
    } else {
      i--;
    }
  }
  currentTest = { quizStyle: "Ask for pron", vocab: correctVocab.word, book: correctVocab.book };

  shuffleArray(options);

  document.getElementById('quizQuestion').textContent = `What is the definition for this?`;
  document.getElementById('option1').textContent = options[0];
  document.getElementById('option2').textContent = options[1];
  document.getElementById('option3').textContent = options[2];
  document.getElementById('option4').textContent = options[3];

  document.getElementById('quizContainer').dataset.correctAnswer = correctVocab.definition;

  // Show quiz and hide vocab card
  document.getElementById('quizContainer').style.display = 'block';
  document.getElementById('vocabFlashcard').style.display = 'none';
  document.getElementById('correctMessage').style.display = 'none';
  document.getElementById('incorrectMessage').style.display = 'none';
  document.getElementById('correctDefinition').style.display = 'none';
  document.getElementById('nextAfterIncorrectButton').style.display = 'none';
}
function populateBookSelector() {
  chrome.storage.local.get({ bookList: [] }, (result) => {
    const bookList = result.bookList || "Default";
    // Clear existing options except for the default option
    // Add books as options
    bookList.forEach(book => {
      let option = document.createElement('option');

      option.textContent = book;
      option.value = book;

      document.getElementById('bookSelector').add(option);
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
      definition: [quizStyle1, quizStyle2, quizStyle3]
    };
    const allQuizStyles = [quizStyle1, quizStyle2, quizStyle3, quizStyle4, quizStyle5, quizStyle6, quizStyle7];
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
  const correctVocab = learningQueue[currentStep].word;
  currentQuizWord = correctVocab.word;
  currentQuizDefinition = correctVocab.definition;
  quizType = 'definition';
  const options = [correctVocab.definition];
  //console.log(options);
  for (let i = 0; i < 3; i++) {
    const randomIndex = Math.floor(Math.random() * filteredVocabList.length);
    const randomDefinition = filteredVocabList[randomIndex].definition;
    if (!options.includes(randomDefinition)) {
      options.push(randomDefinition);
    } else {
      i--;
    }
  }
  currentTest = { quizStyle: "Ask for definition", vocab: correctVocab.word, book: correctVocab.book };
  shuffleArray(options);

  document.getElementById('quizQuestion').textContent = `What is the definition of "${correctVocab.word}"?`;
  document.getElementById('option1').textContent = options[0];
  document.getElementById('option2').textContent = options[1];
  document.getElementById('option3').textContent = options[2];
  document.getElementById('option4').textContent = options[3];

  document.getElementById('quizContainer').dataset.correctAnswer = correctVocab.definition;

  // Show quiz and hide vocab card
  document.getElementById('quizContainer').style.display = 'block';
  document.getElementById('vocabFlashcard').style.display = 'none';
  document.getElementById('correctMessage').style.display = 'none';
  document.getElementById('incorrectMessage').style.display = 'none';
  document.getElementById('correctDefinition').style.display = 'none';
  document.getElementById('nextAfterIncorrectButton').style.display = 'none';
}
function quizStyle2() {
  const correctVocab = learningQueue[currentStep].word;

  currentQuizWord = correctVocab.word;
  currentQuizDefinition = correctVocab.definition;
  quizType = 'word';

  const options = [correctVocab.word];
  for (let i = 0; i < 3; i++) {
    const randomIndex = Math.floor(Math.random() * filteredVocabList.length);
    const randomWord = filteredVocabList[randomIndex].word;
    if (!options.includes(randomWord)) {
      options.push(randomWord);
    } else {
      i--;
    }
  }
  currentTest = { quizStyle: "Ask for word", vocab: correctVocab.word, book: correctVocab.book };

  shuffleArray(options);

  document.getElementById('quizQuestion').textContent = `What is the word for "${correctVocab.definition}"?`;
  document.getElementById('option1').textContent = options[0];
  document.getElementById('option2').textContent = options[1];
  document.getElementById('option3').textContent = options[2];
  document.getElementById('option4').textContent = options[3];

  document.getElementById('quizContainer').dataset.correctAnswer = correctVocab.word;

  // Show quiz and hide vocab card
  document.getElementById('quizContainer').style.display = 'block';
  document.getElementById('vocabFlashcard').style.display = 'none';
  document.getElementById('correctMessage').style.display = 'none';
  document.getElementById('incorrectMessage').style.display = 'none';
  document.getElementById('correctDefinition').style.display = 'none';
  document.getElementById('nextAfterIncorrectButton').style.display = 'none';
}

function quizStyle3() {
  const correctVocab = learningQueue[currentStep].word;
  currentQuizWord = correctVocab.word;
  currentQuizDefinition = correctVocab.definition;
  quizType = 'truefalse';

  isPairCorrect = Math.random() < 0.5;
  currentTest = { quizStyle: "True or False - definition", vocab: correctVocab.word, book: correctVocab.book };
  if (!isPairCorrect) {
    let incorrectVocab;
    do {
      const randomIndex = Math.floor(Math.random() * filteredVocabList.length);
      incorrectVocab = filteredVocabList[randomIndex];
    } while (incorrectVocab.word === currentQuizWord);
    currentQuizDefinition = incorrectVocab.definition;
  }

  const definitionLines = currentQuizDefinition
    .split(";")
    .map(line => `<span style="font-weight:normal;">- ${line.trim()}</span>`);
  document.getElementById('trueFalseQuestion').innerHTML =
    `Is the definition of "${currentQuizWord}"<br>${definitionLines.join("<br>")}`;
  // Show true/false quiz and hide vocab card
  document.getElementById('trueFalseContainer').style.display = 'block';
  document.getElementById('quizContainer').style.display = 'none';
  document.getElementById('vocabFlashcard').style.display = 'none';
  document.getElementById('correctMessage').style.display = 'none';
  document.getElementById('incorrectMessage').style.display = 'none';
  document.getElementById('correctDefinition').style.display = 'none';
  document.getElementById('nextAfterIncorrectButton').style.display = 'none';
}
function quizStyle4() {
  //console.log("4, ask for pronounciation")
  quizType = "pronounciation"

  const correctVocab = learningQueue[currentStep].word;
  const eligibleentries = totalVocabList.filter(
    item => item.pronounciation && item.pronounciation !== "" && item.pronounciation !== "undefined"
  );
  const eligibleVocab = eligibleentries.map(item => item.word);
  const numberOfDifferentTypes = [
    ...new Set(
      eligibleVocab
        .map(item => item.word && item.word.pronounciation)
        .filter(pronounciation => pronounciation && pronounciation !== "" && pronounciation !== "undefined")
    )
  ];
  const eligibleOptions = filteredVocabList.filter(entry => entry.pronounciation && entry.pronounciation != "");
  //console.log("numberOfDifferentTypesQuiz4", numberOfDifferentTypes)

  //console.log(learningQueue[currentStep - 1].type)
  if (!correctVocab.pronounciation || numberOfDifferentTypes < 3 || eligibleOptions.length < 3) {
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
  }
  currentTest = { quizStyle: "Ask for pronounciation", vocab: correctVocab.word, book: correctVocab.book };

  currentQuizWord = correctVocab.word;
  //console.log(currentQuizWord);
  currentQuizDefinition = correctVocab.pronounciation;
  if (currentQuizDefinition == "") {
    quizStyle1();
  } else {
    const options = [correctVocab.pronounciation];
    for (let i = 0; i < 3; i++) {
      const randomIndex = Math.floor(Math.random() * eligibleOptions.length);
      const randomPronounciation = eligibleOptions[randomIndex].pronounciation;
      if (!options.includes(randomPronounciation)) {
        options.push(randomPronounciation);
      } else {
        i--;
      }
    }

    shuffleArray(options);

    document.getElementById('quizQuestion').textContent = `What is the pronounciation of "${correctVocab.word}"?`;
    document.getElementById('option1').textContent = options[0];
    document.getElementById('option2').textContent = options[1];
    document.getElementById('option3').textContent = options[2];
    document.getElementById('option4').textContent = options[3];

    document.getElementById('quizContainer').dataset.correctAnswer = correctVocab.pronounciation;
    document.getElementById('quizContainer').dataset.correctWord = correctVocab.word;

    // Show quiz and hide vocab card
    document.getElementById('quizContainer').style.display = 'block';
    document.getElementById('vocabFlashcard').style.display = 'none';
    document.getElementById('correctMessage').style.display = 'none';
    document.getElementById('incorrectMessage').style.display = 'none';
    document.getElementById('correctDefinition').style.display = 'none';
    document.getElementById('nextAfterIncorrectButton').style.display = 'none';
  }

}
function quizStyle5() {
  quizType = "gender"
  //console.log("5, ask for gender")
  const correctVocab = learningQueue[currentStep].word;
  const eligibleentries = totalVocabList.filter(
    item => item.gender && item.gender !== "" && item.gender !== "undefined"
  );
  const eligibleVocab = eligibleentries.map(item => item.word);
  const gendersInTheCollection = [
    ...new Set(
      eligibleentries
        .map(item => item && item.gender)
        .filter(gender => gender && gender !== "" && gender !== "undefined" && gender !== undefined)
    )
  ];
  //console.log(gendersInTheCollection)

  if (!correctVocab.gender || eligibleVocab.length <= 1 || gendersInTheCollection.size < 2) {
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
    let eligibleVocabIndex = Math.floor(Math.random() * eligibleVocab.length);
    currentVocabIndex = filteredVocabList.findIndex(listItem =>
      listItem.word === correctVocab.word && listItem.definition === correctVocab.definition
    );
    currentQuizWord = correctVocab.word;
    currentQuizDefinition = correctVocab.gender;
    quizType = 'truefalse';
    //console.log(currentQuizDefinition);
    isPairCorrect = Math.random() < 0.5;
    if (!isPairCorrect) {
      currentQuizDefinition = gendersInTheCollection[Math.floor(Math.random() * gendersInTheCollection.length)];
      while (currentQuizDefinition === correctVocab.gender) {
        currentQuizDefinition = gendersInTheCollection[Math.floor(Math.random() * gendersInTheCollection.length)];
      }
    }
    currentTest = { quizStyle: "Ask for gender", vocab: correctVocab.word, book: correctVocab.book };

    document.getElementById('quizQuestion').textContent = `What is the gender of "${correctVocab.word}"?`;

    document.getElementById('trueFalseQuestion').textContent = `Is the gender of "${currentQuizWord}" "${currentQuizDefinition}"?`;

    // Show true/false quiz and hide vocab card
    document.getElementById('trueFalseContainer').style.display = 'block';
    document.getElementById('quizContainer').style.display = 'none';
    document.getElementById('vocabFlashcard').style.display = 'none';
    document.getElementById('correctMessage').style.display = 'none';
    document.getElementById('incorrectMessage').style.display = 'none';
    document.getElementById('correctDefinition').style.display = 'none';
    document.getElementById('nextAfterIncorrectButton').style.display = 'none';
  }

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
  //console.log(randomField + ":" + randomSubfield + ":" + randomWord)
  if (randomWord == undefined) {
    return getRandomWordFromConjugations(conjugations, commonWordsList);
  }
  const isInAllSubfields = commonWordsList.includes(randomWord)
  if (randomWord.length <= 1 || randomWord == null || isInAllSubfields) {
    //console.log(randomWord + " is not not a wrong answer")
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
  const eligibleVocab = filteredVocabList.filter(entry => entry.conjugations && entry.conjugations.type != "");
  if (eligibleVocab.length < 1) {
    return quizStyle3();
  }
  if (currentVocabIndex === null || currentVocabIndex >= filteredVocabList.length - 1) {
    currentVocabIndex = 0;
  } else {
    currentVocabIndex = Math.floor(Math.random() * eligibleVocab.length);
    //console.log(eligibleVocab[currentVocabIndex]);
  }
  const correctVocab = eligibleVocab[currentVocabIndex];
  const conjugations = correctVocab.conjugations;
  conjToTest = []
  let correctAnswer;
  let numberOfFields = 1;
  let selectedField;
  let questionText = ""
  let options = []
  //console.log(correctVocab.word)
  if ((getRandomNumber(1, 9)) >= 9) {
    if (conjugations.group && conjugations.group != "") {
      currentTest = { quizStyle: "Ask for word group", vocab: correctVocab.word, book: correctVocab.book };
      questionText = "what is the group of " + correctVocab.word
      correctAnswer = conjugations.group;
      //console.log(correctAnswer)
      options = [correctAnswer];
      currentQuizWord = correctVocab.word;
      if (Array.isArray(correctAnswer)) {
        correctAnswer = correctAnswer[0]
      }
      let wrongAnswers = []
      if (conjugations.pos == "verb") {
        wrongAnswers = ["first conjugation", "second conjugation", "third conjugation", "fourth conjugation", "irregular", "first&second conjugation"]
      } else {
        wrongAnswers = ["first declension", "second declension", "third declension", "fourth declension", "fifth declension", "irregular"]
      }
      for (let i = 0; i < 3; i++) {
        //console.log(options)
        const index = getRandomNumber(1, wrongAnswers.length)
        if (!options.includes(wrongAnswers[index])) {
          options.push(wrongAnswers[index]);
        } else {
          i--
        }
      }
      shuffleArray(options)

      quizType = "groupTest"
    }
  } else {
    quizType = "6"
    currentTest = { quizStyle: "Give inflection, ask type of inflection", vocab: correctVocab.word, book: correctVocab.book };
    if (conjugations.pos == "verb") {
      const typeOfVerbToTest = getRandomNumber(1, 10)
      numberOfFields = getRandomNumber(1, 5);
      const verbFields1 = ['mood', 'person', 'number', 'voice', 'tense'];
      const verbFields2 = ['voice', 'tense', 'form'];
      const verbFields3 = ['noun', 'case'];

      if (typeOfVerbToTest <= 8) {
        selectedField = verbFields1
      } else if (typeOfVerbToTest <= 9) {
        selectedField = verbFields2
      } else if (typeOfVerbToTest <= 10) {
        selectedField = verbFields3
      }
    } else {
      //console.log("not a verb")
      if (conjugations.inflections) {
        numberOfFields = 1;
        selectedField = ['inflections'];
      } else {
        //console.log(correctVocab.word + "data format outdatted ")
        showNextItem();
      }
    }

    let selectedKeys = getRandomKeysFromArray(selectedField, numberOfFields);
    let conjugationLists = [];
    selectedKeys.forEach(field => {
      const subfield = getRandomSubfield(conjugations[field]);
      //console.log(subfield)
      conjToTest.push(subfield);
      conjugationLists.push(conjugations[field][subfield]);
    });
    const commonWordsList = findCommonWordAcrossLists(conjugationLists);
    const commonWord = commonWordsList[getRandomNumber(0, commonWordsList.length)];
    if (!commonWord) {
      //console.log("No common word found, retrying...");
      return quizStyle6(); // Restart quiz if no common word is found
    }
    correctAnswer = commonWord;
    let wrongAnswers = [];
    while (wrongAnswers.length < 3) {
      const wrongWord = getRandomWordFromConjugations(conjugations, commonWordsList);
      if (!wrongAnswers.includes(wrongWord) && !(wrongWord == commonWord)) {
        wrongAnswers.push(wrongWord);
      }
    }
    //console.log(wrongAnswers)
    currentQuizWord = correctVocab.word;
    currentQuizDefinition = correctAnswer;
    quizType = '6';
    options = [correctAnswer];

    //console.log(options);
    for (let i = 0; i < 3; i++) {
      if (!options.includes(wrongAnswers)) {
        options.push(wrongAnswers[i]);
      } else {
        i--;
      }
    }
    correctConj = correctAnswer;
    shuffleArray(options);
    let names = conjToTest.toString();
    names = makeStringReadable(names)
    questionText = `What is one ${names} form of the word "${correctVocab.word}"?`
  }
  currentVocabIndex = filteredVocabList.indexOf(correctVocab);
  currentQuizWord = correctVocab.word;
  currentQuizDefinition = correctAnswer;

  document.getElementById('quizQuestion').textContent = questionText;
  document.getElementById('option1').textContent = options[0];
  document.getElementById('option2').textContent = options[1];
  document.getElementById('option3').textContent = options[2];
  document.getElementById('option4').textContent = options[3];

  document.getElementById('quizContainer').dataset.correctAnswer = correctAnswer;

  // Show quiz and hide vocab card
  document.getElementById('quizContainer').style.display = 'block';
  document.getElementById('vocabFlashcard').style.display = 'none';
  document.getElementById('correctMessage').style.display = 'none';
  document.getElementById('incorrectMessage').style.display = 'none';
  document.getElementById('correctDefinition').style.display = 'none';
  document.getElementById('nextAfterIncorrectButton').style.display = 'none';
}
function quizStyle7() {
  wordToTest = ""
  const eligibleVocab = filteredVocabList.filter(entry => entry.conjugations && entry.conjugations.type != "");
  if (eligibleVocab.length < 1) {
    return quizStyle1();
  }
  if (currentVocabIndex === null || currentVocabIndex >= filteredVocabList.length - 1) {
    currentVocabIndex = 0;
  } else {
    currentVocabIndex = Math.floor(Math.random() * eligibleVocab.length);
    //console.log(eligibleVocab[currentVocabIndex]);
  }
  const correctVocab = eligibleVocab[currentVocabIndex];
  const conjugations = correctVocab.conjugations;
  conjToTest = []
  let correctAnswer;
  let questionText = ""
  let options = []
  currentTest = { quizStyle: "Give type of inflection, ask inflection", vocab: correctVocab.word, book: correctVocab.book };
  wordToTest = getRandomWordFromConjugations(conjugations)
  const subFields = findSubfieldsForWord(wordToTest, conjugations)
  conjToTest = Object.values(subFields);
  //console.log(conjToTest)
  correctAnswer = conjToTest.toString();
  correctAnswer = makeStringReadable(correctAnswer);
  let wrongAnswers = [];
  while (wrongAnswers.length < 3) {
    const wrongWord = getRandomWordFromConjugations(conjugations);
    //console.log(wrongWord)
    const wrongConj = makeStringReadable(Object.values(findSubfieldsForWord(wrongWord, conjugations)).toString());
    if (!wrongAnswers.includes(wrongConj) && !(wrongConj == correctAnswer)) {
      wrongAnswers.push(wrongConj);
    }
  }
  //console.log(wrongAnswers)
  currentQuizWord = correctVocab.word;
  currentQuizDefinition = correctAnswer;
  quizType = '7';
  options = [correctAnswer];
  //console.log(options);
  currentVocabIndex = filteredVocabList.indexOf(correctVocab);
  for (let i = 0; i < 3; i++) {
    if (!options.includes(wrongAnswers)) {
      options.push(wrongAnswers[i]);
    } else {
      i--;
    }
  }
  correctConj = correctAnswer;
  shuffleArray(options);

  questionText = `What type conjugation doe  the word "${wordToTest}" belong to?`



  document.getElementById('quizQuestion').textContent = questionText;
  document.getElementById('option1').textContent = options[0];
  document.getElementById('option2').textContent = options[1];
  document.getElementById('option3').textContent = options[2];
  document.getElementById('option4').textContent = options[3];

  document.getElementById('quizContainer').dataset.correctAnswer = correctAnswer;

  // Show quiz and hide vocab card
  document.getElementById('quizContainer').style.display = 'block';
  document.getElementById('vocabFlashcard').style.display = 'none';
  document.getElementById('correctMessage').style.display = 'none';
  document.getElementById('incorrectMessage').style.display = 'none';
  document.getElementById('correctDefinition').style.display = 'none';
  document.getElementById('nextAfterIncorrectButton').style.display = 'none';
}
function checkAnswer(button) {
  const correctAnswer = document.getElementById('quizContainer').dataset.correctAnswer;
  const correctMessage = document.getElementById('correctMessage');
  const incorrectMessage = document.getElementById('incorrectMessage');
  const correctDefinition = document.getElementById('correctDefinition');
  const result = button.textContent === correctAnswer ? 't' : 'f';

  if (button.textContent === correctAnswer) {
    currentStep += 1;
    button.classList.add('correct');
    correctMessage.style.display = 'block';
    setTimeout(() => {
      button.classList.remove('correct');
      correctMessage.style.display = 'none';
      //console.log("correct")
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
  //console.log(quizType)
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
        //console.log("Updated vocabList saved to storage.");
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

