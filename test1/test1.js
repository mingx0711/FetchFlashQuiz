import { hasGender, hasPronounciation, LanguageGenderMap } from '../utils.js';
import * as utils from '../utils.js';
let currentVocabIndex = null;
let vocabList = [];
let currentQuizWord = null;
let currentQuizDefinition = null;
let quizType = null;
let isPairCorrect = null;
let filteredVocabList = []
let totalNoCount = null;
let currentQuizNo = 0;
let wordToTest = "";
let recordHistory = [];
let correctCount = 0;
let correctConj;
let totalCountYet = 0;
let currentTest;
let wrongVocabs = [];
let conjToTest;
let correctVocab;
let quizChartInstance = null; // Add this at the top of your file (or outside the function)
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('wrongCountDiv').style.display = 'none';
  document.getElementById('vocabFlashcard').style.display = 'none';
  document.getElementById('quizContainer').style.display = 'none';
  document.getElementById('trueFalseContainer').style.display = 'none';
  populateBookSelector();
  const allCheckbox = document.querySelector('input[name="coverage"][value="all"]');
  const otherCheckboxes = Array.from(document.querySelectorAll('input[name="coverage"]:not([value="all"])'));

  // When any other checkbox is checked, uncheck "All"
  otherCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) {
        allCheckbox.checked = false;
      }

      // If none of the other checkboxes are checked, check "All"
      const anyChecked = otherCheckboxes.some(cb => cb.checked);
      if (!anyChecked) {
        allCheckbox.checked = true;
      }
    });
  });

  // Optional: When "All" is checked, uncheck others
  allCheckbox.addEventListener('change', () => {
    if (allCheckbox.checked) {
      otherCheckboxes.forEach(cb => cb.checked = false);
    }
  });
  document.getElementById('testCollectionBtn').addEventListener('click', () => {
    // Get the selected collection from the dropdown
    const selectedCollection = document.getElementById('bookSelector').value;
    // Call the function to display vocab
    displayTests(selectedCollection);

  });

  document.getElementById('end').addEventListener('click', function () {

    endTest();
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
function displayTests(bookSelected) {
  chrome.storage.local.get('vocabList', function (data) {
    if (data.vocabList) {
      vocabList = data.vocabList;
      currentVocabIndex = -1;
      if (vocabList.length < 4) {
        document.getElementById('vocabFlashcard').textContent = "Come back after there's more vocabs";
        return;
      }

      // Filter by book
      if (bookSelected === "All collections") {
        filteredVocabList = vocabList;
      } else {
        filteredVocabList = vocabList.filter(vocab => vocab.book === bookSelected);
      }

      // Focus selector logic
      const focus = document.querySelector('input[name="focusOption"]:checked').value;
      currentFocus = focus;
      //console.log(focus)
      if (focus === "gender") {
        filteredVocabList = filteredVocabList.filter(vocab => hasGender(vocab));
        if (filteredVocabList.length < 4) {
          alert("Not enough entries with gender to make the test.");
          return;
        }
      } else if (focus === "pronunciation") {
        filteredVocabList = filteredVocabList.filter(vocab => hasPronounciation(vocab));
        if (filteredVocabList.length < 4) {
          alert("Not enough entries with pronunciation to make the test.");
          return;
        }
      } else if (focus === "inflection") {
        filteredVocabList = filteredVocabList.filter(vocab => vocab.conjugations && vocab.conjugations.type && vocab.conjugations.type !== "");
        if (filteredVocabList.length < 4) {
          alert("Not enough entries with inflection to make the test.");
          return;
        }
      } else if (focus === "listening") {
        chrome.tabs.create({ url: 'ListeningTest/test2.html' });
        window.close();
        return;
      }
      const selectedFilters = Array.from(
        document.querySelectorAll('input[name="coverage"]:checked')
      ).map(cb => cb.value);
      if (selectedFilters.includes("all")) {
      } else {
        filteredVocabList = filteredVocabList.filter(item => {
          let match = false;

          if (selectedFilters.includes("learned")) {
            match = match || item.learnedTime > 0;
          }

          if (selectedFilters.includes("freq")) {
            match = match || (
              item.quizResults &&
              item.quizResults.filter(r => r === 'f').length > 1
            );
          }

          if (selectedFilters.includes("focus")) {
            match = match || item.focus === true;
          }
          return match;
        });
      }
      console.log(filteredVocabList)

      document.getElementById('wrongCountDiv').style.display = '';
      document.getElementById('testCollectionBtn').style.display = 'none';
      document.getElementById('initContainer').style.display = 'none';
      document.getElementById('bookSelector').style.display = 'none';
      document.getElementById('quizContainer').style.display = '';
      totalNoCount = filteredVocabList.length;
      document.getElementById('wrongCountDiv').textContent = `"${currentQuizNo}" / ${totalNoCount}"`;
      document.getElementById('end').style.display = '';
      if (filteredVocabList.length < 4) {
        document.getElementById('vocabFlashcard').textContent = "No vocabulary to test.";
        return;
      }
      showNextItem();
    }
  });
}

function populateBookSelector() {
  chrome.storage.local.get({ bookList: [] }, (result) => {
    const bookList = result.bookList || "Default";
    document.getElementById('bookSelector').innerHTML = ""
    chrome.storage.local.get('lastBook', function (data) {
      const lastBook = data.lastBook;
      ////console.log(lastBook)
      if (lastBook && lastBook != null) {
        if (lastBook != "" || lastBook === "addNew" || lastBook === "Default") {
          let optionNewSelected = document.createElement('option');
          optionNewSelected.textContent = lastBook;
          optionNewSelected.value = lastBook;
          optionNewSelected.selected = true;

          document.getElementById('bookSelector').add(optionNewSelected)
        }
      }
      // Clear existing options except for the default option
      // Add books as options
      bookList.forEach(book => {
        let option = document.createElement('option');
        if (book === data.lastBook) {
        } else {
          option.textContent = book;
          option.value = book;

          document.getElementById('bookSelector').add(option);
        }
      });
    });

  });
}

function showNextItem() {
  document.getElementById('wrongCountDiv').textContent = `${currentQuizNo} / ${totalNoCount}`;
  if (currentQuizNo >= filteredVocabList.length) {
    document.getElementById("donzo").style.display = 'block';
    document.getElementById("quizContainer").style.display = 'none';
    document.getElementById('trueFalseContainer').style.display = 'none';
  } else {
    document.getElementById('quizContainer').style.display = 'none';
    document.getElementById('trueFalseContainer').style.display = 'none';
    const focusQuizMap = {
      gender: [quizStyle5],
      pronunciation: [quizStyle4],
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
      // No focus: pick any quiz style at random
      const randomIndex = Math.floor(Math.random() * allQuizStyles.length);
      allQuizStyles[randomIndex]();
    }
  }
}

function quizStyle1() {
  utils.ClearPageForQuizContainer();
  utils.removeSnooze();
  const eligibleVocab = utils.getEligibleVocabs(filteredVocabList, () => false, false);
  const correctVocab = utils.getTestWord(eligibleVocab);
  currentQuizWord = correctVocab.word;
  utils.setupDefQuiz(correctVocab, eligibleVocab)
  currentVocabIndex = filteredVocabList.indexOf(correctVocab);

  currentTest = { quizStyle: "Ask for definition", vocab: correctVocab.word, book: correctVocab.book };

}
function quizStyle2() {
  utils.ClearPageForQuizContainer();
  utils.removeSnooze();

  const eligibleVocab = utils.getEligibleVocabs(filteredVocabList, () => false, false);
  const correctVocab = utils.getTestWord(eligibleVocab);
  currentQuizWord = correctVocab.word;
  currentQuizDefinition = correctVocab.definition;
  quizType = 'word';
  currentVocabIndex = filteredVocabList.indexOf(correctVocab);

  // //console.log.log(currentQuizWord);
  utils.setupWordQuiz(correctVocab, eligibleVocab)
  currentTest = { quizStyle: "Ask for word", vocab: correctVocab.word, book: correctVocab.book };
}

function quizStyle3() {
  // Quiz Style 3: True or False
  const eligibleVocab = utils.getEligibleVocabs(filteredVocabList, () => false, false);
  const correctVocab = utils.getTestWord(eligibleVocab);
  currentQuizWord = correctVocab.word;
  currentQuizDefinition = correctVocab.definition;
  quizType = 'truefalse';

  isPairCorrect = Math.random() < 0.5;
  currentVocabIndex = filteredVocabList.indexOf(correctVocab);

  if (!isPairCorrect) {
    let incorrectVocab;
    do {
      const randomIndex = Math.floor(Math.random() * filteredVocabList.length);
      incorrectVocab = filteredVocabList[randomIndex];
    } while (incorrectVocab.word === currentQuizWord);
    currentQuizDefinition = incorrectVocab.definition;
  }
  utils.setupTFQuiz(correctVocab, currentQuizWord, currentQuizDefinition)
  currentTest = { quizStyle: "True or False - definition", vocab: correctVocab.word, book: correctVocab.book };

}
function quizStyle4() {

  utils.ClearPageForQuizContainer();
  utils.removeSnooze()

  // //console.log.log("4, ask for pronounciation")
  const eligibleVocab = filteredVocabList.filter(entry => utils.hasPronounciation(entry));
  const numberOfDifferentTypes = new Set(eligibleVocab.map(item => item.pronounciation)).size;
  if (eligibleVocab.length < 1 || numberOfDifferentTypes < 3) {
    quizStyle3();
    return;
  }

  const correctVocab = utils.getTestWord(eligibleVocab);
  currentQuizWord = correctVocab.word;
  currentQuizDefinition = correctVocab.pronounciation;
  if (currentQuizDefinition == "") {
    quizStyle1();
  } else {
    utils.setUpPronounciationQuiz(correctVocab, eligibleVocab)
  }
  currentVocabIndex = filteredVocabList.indexOf(correctVocab);

  currentTest = { quizStyle: "Ask for pronounciation", vocab: correctVocab.word, book: correctVocab.book };

}
function quizStyle5() {

  utils.ClearPageForQuizContainer();
  utils.removeSnooze();
  const eligibleVocab = filteredVocabList.filter(entry => utils.hasGender(entry));
  const quizIndex = Math.floor(Math.random() * eligibleVocab.length);
  const correctVocab = eligibleVocab[quizIndex];
  const eligibleOptions = utils.LanguageGenderMap[correctVocab.language] || [];
  const numberOfDifferentTypes = eligibleOptions.size;

  if (eligibleVocab.length < 1 || numberOfDifferentTypes < 3 || eligibleOptions.length < 3) {
    quizStyle2();
    return;
  }
  currentQuizWord = correctVocab.word;
  currentQuizDefinition = correctVocab.gender;
  quizType = 'truefalse';
  currentVocabIndex = filteredVocabList.indexOf(correctVocab);
  isPairCorrect = Math.random() < 0.5;

  if (!isPairCorrect) {
    var incorrectVocab = eligibleOptions.filter(item => item !== currentQuizDefinition);
    currentQuizDefinition = utils.getRandomElement(incorrectVocab);
  }
  utils.setupTFQuiz(correctVocab, currentQuizWord, currentQuizDefinition)
  currentVocabIndex = filteredVocabList.indexOf(correctVocab);

  currentTest = { quizStyle: "Ask for gender", vocab: correctVocab.word, book: correctVocab.book };
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
  ////console.log(obj)
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
  ////console.log(randomField+":"+randomSubfield+":"+randomWord)
  if (randomWord == undefined) {
    return getRandomWordFromConjugations(conjugations, commonWordsList);
  }
  const isInAllSubfields = commonWordsList.includes(randomWord)
  if (randomWord.length <= 1 || randomWord == null || isInAllSubfields) {
    ////console.log(randomWord+" is not not a wrong answer")
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

  utils.ClearPageForQuizContainer();
  utils.removeSnooze()

  const eligibleVocab = filteredVocabList.filter(entry => utils.hasConjugations(entry));
  if (eligibleVocab.length < 1) {
    return quizStyle3();
  }
  currentVocabIndex = utils.checkVocabIndex(currentVocabIndex, filteredVocabList, eligibleVocab);
  const correctVocab = eligibleVocab[currentVocabIndex];
  let result = utils.prepareOptionsForQuiz6(correctVocab);
  currentVocabIndex = filteredVocabList.indexOf(correctVocab);
  currentQuizWord = correctVocab.word;
  currentQuizDefinition = result[1];
  conjToTest = result[2];
  correctConj = currentQuizDefinition
  quizType = result[4];
  utils.prepareQuiz6(result[0], result[1], result[5]);
  currentTest = { quizStyle: (quizType == "6") ? "Give inflection, ask type of inflection" : "Ask for word group", vocab: correctVocab.word, book: correctVocab.book };
  currentVocabIndex = filteredVocabList.indexOf(correctVocab);

}
function quizStyle7() {
  utils.removeSnooze()

  utils.ClearPageForQuizContainer();
  const eligibleVocab = filteredVocabList.filter(entry => utils.hasConjugations(entry));
  if (eligibleVocab.length < 1) {
    return quizStyle1();
  }
  currentVocabIndex = utils.checkVocabIndex(currentVocabIndex, filteredVocabList, eligibleVocab);

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
  currentTest = { quizStyle: "Give type of inflection, ask inflection", vocab: correctVocab.word, book: correctVocab.book };
  currentVocabIndex = filteredVocabList.indexOf(correctVocab);

}
function quizStyle8() {
  utils.removeSnooze()
  if (currentVocabIndex === null || currentVocabIndex >= filteredVocabList.length - 1) {
    currentVocabIndex = 0;
  } else {
    currentVocabIndex = Math.floor(Math.random() * filteredVocabList.length);
    ////console.log(filteredVocabList[currentVocabIndex]);
  }
  //console.log(filteredVocabList[currentVocabIndex])
  const correctVocab = filteredVocabList[currentVocabIndex];
  currentQuizWord = correctVocab.word;
  quizType = 'Listening';
  // Add to the .quiz-container
  document.getElementById('speakQuiz').style.display = 'inline-block'
  document.getElementById('speakQuiz').addEventListener('click', async function () {
    utils.speakWord(correctVocab.language, currentQuizWord)
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
function checkAnswer(button) {
  const correctAnswer = document.getElementById('quizContainer').dataset.correctAnswer;
  const correctMessage = document.getElementById('correctMessage');
  const incorrectMessage = document.getElementById('incorrectMessage');
  const correctDefinition = document.getElementById('correctDefinition');
  const result = button.textContent === correctAnswer ? 't' : 'f';
  updateQuizResults(result);

  if (button.textContent === correctAnswer) {
    button.classList.add('correct');
    correctMessage.style.display = 'block';
    setTimeout(() => {
      button.classList.remove('correct');
      correctMessage.style.display = 'none';
      showNextItem();
    }, 500);
  } else {
    incorrectMessage.style.display = 'block';
    showCorrectAnswer();
    wrongVocabs.push(currentQuizWord);
    document.getElementById('nextAfterIncorrectButton').style.display = 'Block';
  }
}

function showCorrectAnswer() {
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

  if (isTrue === isPairCorrect) {
    updateQuizResults('t');
    correctMessage.style.display = 'block';
    setTimeout(() => {
      correctMessage.style.display = 'none';
      showNextItem();
    }, 500);
  } else {
    updateQuizResults('f');
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
function updateQuizResults(result) {
  currentTest.correct = result;
  ////console.log(currentVocabIndex);
  totalCountYet += 1;
  if (currentVocabIndex !== null && filteredVocabList[currentVocabIndex].quizResults) {
    chrome.storage.local.get('vocabList', function (data) {
      vocabList = data.vocabList;
      const match = vocabList.find(item => item.word === filteredVocabList[currentVocabIndex].word);
      let quizResults = filteredVocabList[currentVocabIndex].quizResults;
      quizResults.unshift(result);
      if (quizResults.length > 4) {
        quizResults.pop(); // Remove the oldest result to keep only the last 4
      }
      ////console.log(match.word)
      if (match) {
        match.quizResults = quizResults;
      }
      chrome.storage.local.set({ vocabList: vocabList }, function () {
        ////console.log(`Updated quiz results for "${match.word}": ${quizResults}`);
      });
    });
  }
  if (result === 't') {
    currentQuizNo += 1;
    correctCount += 1;
  }
  recordHistory.push(currentTest);
  ////console.log("currentTest",currentTest);
  ////console.log("recordHistory",recordHistory);
  const correctRate = (correctCount / totalCountYet) * 100;
  document.getElementById('correctCountDiv').innerHTML = `<span style="color: green;">${currentQuizNo}</span> / ${totalCountYet}  CorrectRate: ${correctRate.toFixed(2)}%`;
}

function removeCurrentVocab() {
  if (currentVocabIndex !== null) {
    filteredVocabList.splice(currentVocabIndex, 1);

    chrome.storage.local.set({ filteredVocabList: vocabList }, function () {
      ////console.log(`Removed "${currentQuizWord}" from the filtered vocab list.`);
    });
  }
}
function endTest() {
  currentQuizNo = 0;
  totalNoCount = 0;
  document.getElementById("incorrectMessage").style.display = 'none';
  document.getElementById("end").style.display = 'none';
  document.getElementById("correctCountDiv").style.display = 'none';
  document.getElementById("donzo").style.display = 'none';
  document.getElementById("quizContainer").style.display = 'none';
  document.getElementById('trueFalseContainer').style.display = 'none';
  document.getElementById('correctDefinition').style.display = 'none';
  const showTestResult = document.getElementById('showTestResult');
  showTestResult.style.display = '';
  let quizStats = analyzeByQuizStyle(recordHistory);
  buildChartPerQuiz(quizStats);
  if (wrongVocabs.length >= 4) {
    document.getElementById("redo").style.display = '';
  } else {
    document.getElementById("redo").style.display = 'None';
  }
  chrome.storage.local.get('recordHistories', function (result) {
    let histories = result.recordHistories || [];
    // Get the current book (from your UI or state)
    const currentBook = document.getElementById('bookSelector').value;
    buildChartPerQuiz(quizStats, histories, currentBook);
    drawCorrectnessTrend(histories, recordHistory);
    histories.push(recordHistory);
    chrome.storage.local.set({ recordHistories: histories }, function () {
      ////console.log('Record history saved successfully.');
    });
  });
}
function analyzeByQuizStyle(data) {
  const stats = {};

  // First, count totals
  for (const item of data) {
    const style = item.quizStyle;
    const isCorrect = item.correct === "t";

    if (!stats[style]) {
      stats[style] = { correct: 0, incorrect: 0, total: 0 };
    }

    if (isCorrect) stats[style].correct++;
    else stats[style].incorrect++;
    stats[style].total++;
  }

  // Now, convert to percentages
  Object.keys(stats).forEach(style => {
    const s = stats[style];
    stats[style] = {
      correct: s.total ? (s.correct / s.total) * 100 : 0,
      incorrect: s.total ? (s.incorrect / s.total) * 100 : 0
    };
  });

  return stats;
}
function buildChartPerQuiz(quizStats, recordHistories = [], currentBook = "") {
  const styles = Object.keys(quizStats);
  const correctCounts = styles.map(style => quizStats[style].correct);

  // Calculate average correctness for each style from history
  let avgCorrectness = [];
  if (recordHistories.length && currentBook) {
    const avgByStyle = getAverageCorrectnessByStyle(recordHistories, currentBook);
    avgCorrectness = styles.map(style => avgByStyle[style] !== undefined ? avgByStyle[style] : 0);
  }

  const datasets = [
    {
      label: 'Current Correct (%)',
      data: correctCounts,
      barPercentage: 0.4,
      backgroundColor: '#9FC87E'
    }
  ];

  if (avgCorrectness.length) {
    datasets.push({
      label: 'History Avg Correct (%)',
      data: avgCorrectness,
      barPercentage: 0.4,
      backgroundColor: '#2196f3'
    });
  }

  // Destroy previous chart instance if it exists
  if (quizChartInstance) {
    quizChartInstance.destroy();
  }

  quizChartInstance = new Chart(document.getElementById("quizChart1"), {
    type: 'bar',
    data: {
      labels: styles,
      datasets: datasets
    },
    options: {
      responsive: false,
      plugins: {
        title: {
          display: true,
          text: 'Quiz Results by Style (Current & History Avg for this collection)'
        }
      },
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 0,
          max: 100,
          title: { display: true, text: 'Correctness (%)' }
        }
      }
    }
  });
}
function getAverageCorrectnessByStyle(recordHistories, book) {
  const styleTotals = {};
  const styleCounts = {};

  recordHistories.forEach(history => {
    history.forEach(item => {
      if (book && item.book !== book) return;
      const style = item.quizStyle;
      if (!styleTotals[style]) {
        styleTotals[style] = 0;
        styleCounts[style] = 0;
      }
      if (item.correct === 't') styleTotals[style]++;
      styleCounts[style]++;
    });
  });

  const averages = {};
  Object.keys(styleTotals).forEach(style => {
    averages[style] = styleCounts[style] ? (styleTotals[style] / styleCounts[style]) * 100 : 0;
  });
  return averages;
}
function drawCorrectnessTrend(recordHistories, currentRecord) {
  // Only use the last 7 histories (so with currentRecord, you get 8 points)
  const recentHistories = recordHistories.slice(-7);

  // Calculate correctness for each history
  const correctnessList = recentHistories.map(history => {
    const total = history.length;
    const correct = history.filter(item => item.correct === 't').length;
    return total ? (correct / total) * 100 : 0;
  });

  // Calculate current test correctness
  const currentTotal = currentRecord.length;
  const currentCorrect = currentRecord.filter(item => item.correct === 't').length;
  const currentCorrectness = currentTotal ? (currentCorrect / currentTotal) * 100 : 0;

  // Calculate average of previous histories
  const prevAvg = correctnessList.length
    ? correctnessList.reduce((a, b) => a + b, 0) / correctnessList.length
    : 0;

  // Prepare data for chart
  const labels = correctnessList.map((_, i) => `Test ${recordHistories.length - correctnessList.length + i + 1}`);
  labels.push('Current Test');

  const data = [...correctnessList, currentCorrectness];

  // Draw chart
  const ctx = document.getElementById('trendChart').getContext('2d');
  if (window.trendChartInstance) window.trendChartInstance.destroy(); // Prevent overlap

  window.trendChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Correctness (%)',
        data: data,
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: true,
        tension: 0.2,
        pointBackgroundColor: labels.map((l, i) =>
          i === data.length - 1
            ? (currentCorrectness >= prevAvg ? '#2196f3' : '#e91e63')
            : '#4caf50'
        ),
        pointRadius: labels.map((l, i) => i === data.length - 1 ? 7 : 4)
      }]
    },
    options: {
      responsive: false,
      plugins: {
        title: {
          display: true,
          text: `Correctness Trend (Current: ${currentCorrectness.toFixed(2)}%, History Avg: ${prevAvg.toFixed(2)}%)`
        },
        legend: { display: false }
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          title: { display: true, text: 'Correctness (%)' }
        }
      }
    }
  });
}

