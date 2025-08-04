// Example: QuizType Enum
const QuizType = Object.freeze({
  DEFINITION: 'definition',
  WORD: 'word',
  TRUE_FALSE: 'truefalse',
  PRONOUNCIATION: 'pronounciation',
  GENDER: 'gender',
  INFLECTION: 'inflection',
  GROUP: 'groupTest'
});
export const GenderType = Object.freeze({
  FEMININE: 'feminine',
  MASCULINE: 'masculine',
  NEUTER: 'neuter',
  COMMON: 'common'
});
export const LanguageGenderMap = {
  "de": [GenderType.MASCULINE, GenderType.FEMININE, GenderType.NEUTER], // German
  "it": [GenderType.MASCULINE, GenderType.FEMININE], // Italian
  "fr": [GenderType.MASCULINE, GenderType.FEMININE], // French
  "nl": [GenderType.COMMON, GenderType.NEUTER],      // Dutch
  "sv": [GenderType.COMMON, GenderType.NEUTER],      // Swedish
  "ru": [GenderType.MASCULINE, GenderType.FEMININE, GenderType.NEUTER], // Russian
  "la": [GenderType.MASCULINE, GenderType.FEMININE, GenderType.NEUTER], // Latin
  "es": [GenderType.MASCULINE, GenderType.FEMININE], // Spanish
  "pt": [GenderType.MASCULINE, GenderType.FEMININE], // Portuguese
};
export const LANGUAGES = Object.freeze({
  GERMAN: "de",
  LATIN: "la",
  FRENCH: "fr",
  ITALIAN: "it",
  SPANISH: "es",
  ENGLISH: "en",
  PORTUGUESE: "pt",
  RUSSIAN: "ru",
  CHINESE: "zh",
  JAPANESE: "ja",
  KOREAN: "ko",
  ARABIC: "ar",
  DUTCH: "nl",
  SWEDISH: "sv",
  NORWEGIAN: "no",
  DANISH: "da",
  FINNISH: "fi",
  POLISH: "pl",
  TURKISH: "tr",
  GREEK: "el",
  HEBREW: "he",
  HINDI: "hi",
  BENGALI: "bn",
  VIETNAMESE: "vi",
  INDONESIAN: "id",
  MALAY: "ms",
  THAI: "th",
  ROMANIAN: "ro",
  CZECH: "cs",
  HUNGARIAN: "hu",
  SLOVAK: "sk",
  BULGARIAN: "bg",
  UKRAINIAN: "uk",
  PERSIAN: "fa",
  SWAHILI: "sw"
});

function getRandomKeys(obj, count) {
  let keys = Object.keys(obj);
  let selectedKeys = [];
  for (let i = 0; i < count; i++) {
    let randomKey = keys[Math.floor(Math.random() * keys.length)];
    selectedKeys.push(randomKey);
  }
  return selectedKeys;
}


export function getRandomElement(arr) {
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
export function removeSnooze() {
  const snoozeButton = document.getElementById('snoozeButton');
  if (snoozeButton) {
    snoozeButton.style.display = 'none';
  }
}
export function showSnooze() {
  const snoozeButton = document.getElementById('snoozeButton');
  if (snoozeButton) {
    snoozeButton.style.display = '';
  }
}
// Helper function to find common word across multiple lists
function findCommonWordAcrossLists(lists) {
  const res = lists.reduce((a, b) => a.filter(c => b.includes(c))); // Get first common word or undefined
  return res;
}

export function findSubfieldsForWord(word, conjugations) {
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
export function showNextAndAutoplay() {

  document.getElementById('nextButton').style.display = '';
  document.getElementById('autoplayButton').style.display = '';
}
export function expandWord(input) {
  return input
    .split(',')
    .map(part => {
      const trimmed = part.trim();
      const match = trimmed.match(/^(.*)\(([^)]+)\)$/);
      if (match) {
        const base = match[1];
        const inside = match[2];
        return `${base}, ${base}${inside}`;
      }
      return trimmed;
    })
    .join(', ');
}


export function prepareOptionsForQuiz6(correctVocab) {
  const conjugations = correctVocab.conjugations;
  let conjToTest = [];
  let numberOfFields = 1;
  let selectedField;
  let options = [];
  let correctAnswer = "";
  let currentQuizWord = "";
  let currentQuizDefinition = "";
  let quizType = "";
  let questionText = "";
  if ((getRandomNumber(1, 9)) >= 9) {
    if (conjugations.group && conjugations.group != "") {
      quizType = 'groupTest';
      questionText = "what is the group of " + correctVocab.word
      correctAnswer = conjugations.group;
      // //console.log.log(correctAnswer)
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
        // //console.log.log(options)
        const index = getRandomNumber(0, wrongAnswers.length - 1)
        if (!options.includes(wrongAnswers[index])) {
          options.push(wrongAnswers[index]);
        } else {
          i--
        }
      }
    }
  } else {
    quizType = '6';
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
      // //console.log.log("not a verb")
      if (conjugations.inflections) {
        numberOfFields = 1;
        selectedField = ['inflections'];
      } else {
        // //console.log.log(correctVocab.word + "data format outdatted ")
        showNextItem();
      }
    }

    let selectedKeys = getRandomKeysFromArray(selectedField, numberOfFields);
    let conjugationLists = [];
    selectedKeys.forEach(field => {
      const subfield = getRandomSubfield(conjugations[field]);
      // //console.log.log(subfield)
      conjToTest.push(subfield);
      conjugationLists.push(conjugations[field][subfield]);
    });
    const commonWordsList = findCommonWordAcrossLists(conjugationLists);
    const commonWord = commonWordsList[getRandomNumber(0, commonWordsList.length)];
    if (!commonWord) {
      // //console.log.log("No common word found, retrying...");
      return prepareOptionsForQuiz6(correctVocab); // Restart quiz if no common word is found
    }
    console.log("Common word found:", commonWord);
    correctAnswer = commonWord;
    let wrongAnswers = [];
    while (wrongAnswers.length < 3) {
      const wrongWord = getRandomWordFromConjugations(conjugations, commonWordsList);
      if (!wrongAnswers.includes(wrongWord) && !(wrongWord == commonWord)) {
        wrongAnswers.push(wrongWord);
      }
    }
    // //console.log.log(wrongAnswers)
    currentQuizWord = correctVocab.word;
    currentQuizDefinition = correctAnswer;
    quizType = '6';
    options = [correctAnswer];
    // //console.log.log(options);
    for (let i = 0; i < 3; i++) {
      if (!options.includes(wrongAnswers)) {
        options.push(wrongAnswers[i]);
      } else {
        i--;
      }
    }
    let correctConj = correctAnswer;
    shuffleArray(options);

    let names = conjToTest.toString();
    names = makeStringReadable(names)
    questionText = `What is one ${names} form of the word "${correctVocab.word}"?`
  }

  console.log(correctAnswer)
  return [options, correctAnswer, conjToTest, currentQuizWord, quizType, questionText];
}
function makeStringReadable(names) {
  names = names.replace("futurePerfect", 'future perfect');
  names = names.replaceAll("_", ' ');
  return names
}
export function checkVocabIndex(currentVocabIndex, vocabList, eligibleVocab) {

  if (currentVocabIndex === null || currentVocabIndex >= vocabList.length - 1) {
    currentVocabIndex = 0;
  } else {
    currentVocabIndex = Math.floor(Math.random() * eligibleVocab.length);
  }
  return currentVocabIndex;
}
export function prepareQuiz6(options, answer, questionText) {
  document.getElementById('quizQuestion').textContent = questionText;
  // Show quiz and hide vocab card
  document.getElementById('quizContainer').style.display = 'block';
  document.getElementById('vocabFlashcard').style.display = 'none';
  document.getElementById('correctMessage').style.display = 'none';
  document.getElementById('incorrectMessage').style.display = 'none';
  document.getElementById('correctDefinition').style.display = 'none';
  document.getElementById('nextAfterIncorrectButton').style.display = 'none';
  prepareOptions(options, answer);
}
export function prepareOptions(options, answer) {

  document.getElementById('option1').textContent = options[0];
  document.getElementById('option2').textContent = options[1];
  document.getElementById('option3').textContent = options[2];
  document.getElementById('option4').textContent = options[3];
  document.getElementById('nextButton').style.display = '';

  document.getElementById('quizContainer').dataset.correctAnswer = answer;
}
export function getRandomWordFromConjugations(conjugations, commonWordsList = []) {
  let fields = Object.keys(conjugations);
  const filteredFields = fields.filter(field => (field !== 'pos') && (field !== 'type') && (field !== 'group') && (field !== 'group'));
  const randomField = filteredFields[Math.floor(Math.random() * filteredFields.length)];
  const subfields = Object.keys(conjugations[randomField]);
  let randomSubfield = subfields[Math.floor(Math.random() * subfields.length)];
  const words = conjugations[randomField][randomSubfield];
  const randomWord = words[Math.floor(Math.random() * words.length)];
  // //console.log.log(randomField+":"+randomSubfield+":"+randomWord)
  if (randomWord == undefined) {
    return getRandomWordFromConjugations(conjugations, commonWordsList);
  }
  const isInAllSubfields = commonWordsList.includes(randomWord)
  if (randomWord.length <= 1 || randomWord == null || isInAllSubfields) {
    // //console.log.log(randomWord+" is not not a wrong answer")
    return getRandomWordFromConjugations(conjugations, commonWordsList);
  } else {
    return randomWord;
  }
}
const dontRemoveDiacritics = [LANGUAGES.GERMAN];
// ...existing code...
export function hasConjugations(vocab) {
  return vocab.conjugations && vocab.conjugations.type != "";
}
// ...existing code...
export function processWordByLanguage(language, word) {
  if (dontRemoveDiacritics.includes(language)) {
    return word;
  } else {
    return removeDiacritics(word);
  }
}

// Existing function
function removeDiacritics(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function hasGender(wordObj) {
  return !!(wordObj.gender && wordObj.gender !== undefined && wordObj.gender !== null && wordObj.gender !== "")
}
export function hasPronounciation(wordObj) {
  return !!(wordObj.pronounciation && wordObj.pronounciation !== "undefined" && wordObj.pronounciation !== "");
}
export function generateDefOptions(correctVocab, filteredVocabList) {
  const options = [correctVocab.definition];

  for (let i = 0; i < 3; i++) {
    let randomIndex = Math.floor(Math.random() * filteredVocabList.length);
    let candidate = filteredVocabList[randomIndex];

    // Retry if not the same book or if duplicate
    while (
      candidate.book !== correctVocab.book ||
      options.includes(candidate.definition)
    ) {
      randomIndex = Math.floor(Math.random() * filteredVocabList.length);
      candidate = filteredVocabList[randomIndex];
    }

    options.push(candidate.definition);
  }

  return options;
}
export function generateWordOptions(correctVocab, filteredVocabList) {
  const options = [correctVocab.word];

  for (let i = 0; i < 3; i++) {
    let randomIndex = Math.floor(Math.random() * filteredVocabList.length);
    let candidate = filteredVocabList[randomIndex];

    // Retry if not the same book or if duplicate
    while (
      candidate.book !== correctVocab.book ||
      options.includes(candidate.word)
    ) {
      randomIndex = Math.floor(Math.random() * filteredVocabList.length);
      candidate = filteredVocabList[randomIndex];
    }

    options.push(candidate.word);
  }

  return options;
}
export function ClearPageForQuizContainer() {
  const autoplayButton = document.getElementById('autoplayButton');
  if (autoplayButton) {
    autoplayButton.style.display = 'none';
  }
  document.getElementById('trueFalseContainer').style.display = 'none';
  document.getElementById('incorrectMessage').style.display = 'none';
  document.getElementById('speakQuiz').style.display = "none"
}

export function ClearPageForTFContainer() {
  const autoplayButton = document.getElementById('autoplayButton');
  if (autoplayButton) {
    autoplayButton.style.display = 'none';
  }
  document.getElementById('trueFalseContainer').style.display = 'none';
  document.getElementById('incorrectMessage').style.display = 'none';
  document.getElementById('speakQuiz').style.display = "none"
}
export function prepareOptionsForQuizStyle7(correctVocab) {
  const conjugations = correctVocab.conjugations;

  let correctAnswer;
  let questionText = ""
  let options = []

  let wordToTest = getRandomWordFromConjugations(conjugations)
  const subFields = findSubfieldsForWord(wordToTest, conjugations)
  let conjToTest = Object.values(subFields);
  // //console.log.log(conjToTest)
  correctAnswer = conjToTest.toString();
  correctAnswer = makeStringReadable(correctAnswer);

  let wrongAnswers = [];
  while (wrongAnswers.length < 3) {
    const wrongWord = getRandomWordFromConjugations(conjugations);
    // //console.log.log(wrongWord)
    const wrongConj = makeStringReadable(Object.values(findSubfieldsForWord(wrongWord, conjugations)).toString());
    if (!wrongAnswers.includes(wrongConj) && !(wrongConj == correctAnswer)) {
      wrongAnswers.push(wrongConj);
    }
  }
  options.push(correctAnswer);
  for (let i = 0; i < 3; i++) {
    if (!options.includes(wrongAnswers)) {
      options.push(wrongAnswers[i]);
    } else {
      i--;
    }
  }
  questionText = `What type of conjugation does the word "${wordToTest}" belong to?`
  shuffleArray(options)
  return [options, correctAnswer, questionText, conjToTest, wordToTest];
}
export function setupQuiz7(options, correctAnswer, questionText) {
  ClearPageForQuizContainer();
  document.getElementById('quizQuestion').textContent = questionText;

  document.getElementById('quizContainer').style.display = 'block';

  prepareOptions(options, correctAnswer);

  // Show quiz and hide vocab card
  document.getElementById('quizContainer').style.display = 'block';
  document.getElementById('vocabFlashcard').style.display = 'none';
  document.getElementById('correctMessage').style.display = 'none';
  document.getElementById('incorrectMessage').style.display = 'none';
  document.getElementById('correctDefinition').style.display = 'none';
  document.getElementById('nextAfterIncorrectButton').style.display = 'none';
}

export function getEligibleVocabs(vocabList, func = () => false, needSeen = true) {
  const eligibleVocab = vocabList.filter(entry => {
    const seenCondition = needSeen ? entry.seen > 3 : true;
    return seenCondition || func(entry);
  });
  if (eligibleVocab.length < 1) {
    showNextVocab();
    return;
  }
  return eligibleVocab;
}
export function setupTFQuiz(correctVocab, currentQuizWord, currentQuizDefinition) {
  document.getElementById('quizQuestion').textContent = `What is the definition of "${correctVocab.word}"?`;
  document.getElementById('trueFalseQuestion').textContent = `Is the definition of "${currentQuizWord}" "${currentQuizDefinition}"?`;

  // Show true/false quiz and hide vocab card
  document.getElementById('trueFalseContainer').style.display = 'block';
  document.getElementById('quizContainer').style.display = 'none';
  document.getElementById('vocabFlashcard').style.display = 'none';
  showSnooze();
  document.getElementById('correctMessage').style.display = 'none';
  document.getElementById('incorrectMessage').style.display = 'none';
  document.getElementById('correctDefinition').style.display = 'none';
  document.getElementById('nextAfterIncorrectButton').style.display = 'none';
}
export function setupWordQuiz(correctVocab, eligibleVocab) {
  const options = generateWordOptions(correctVocab, eligibleVocab);
  shuffleArray(options);
  prepareWordQuizQuestions(correctVocab);
  prepareQuiz(options);
}

export function setupDefQuiz(correctVocab, eligibleVocab) {
  const options = generateDefOptions(correctVocab, eligibleVocab);
  shuffleArray(options);
  prepareDefQuizQuestions(correctVocab);
  prepareQuiz(options);
}
export function getTestWord(eligibleVocab) {
  let quizIndex = Math.floor(Math.random() * eligibleVocab.length);
  return eligibleVocab[quizIndex];
}

export function setUpPronounciationQuiz(correctVocab, eligibleOptions) {
  const options = generatePronounciationOptions(correctVocab, eligibleOptions);
  shuffleArray(options);
  preparePronounciationQuizQuestions(correctVocab);
  prepareQuiz(options);
}
export function generatePronounciationOptions(correctVocab, eligibleOptions) {
  const options = [correctVocab.pronounciation];
  for (let i = 0; i < 3; i++) {
    let randomIndex = Math.floor(Math.random() * eligibleOptions.length);
    while (eligibleOptions[randomIndex].book != correctVocab.book) {
      randomIndex = Math.floor(Math.random() * eligibleOptions.length);
    }
    const randomPronounciation = eligibleOptions[randomIndex].pronounciation;
    if (!options.includes(randomPronounciation)) {
      options.push(randomPronounciation);
    } else {
      i--;
    }
  }
  return options;

}
export function setUp8Quiz(correctVocab, eligibleVocab) {
  // Add to the .quiz-container
  document.getElementById('speakQuiz').style.display = ""
  document.getElementById('speakQuiz').addEventListener('click', async function () {
    speakWord(correctVocab.language, correctVocab.word)
  });
  const options = generateDefOptions(correctVocab, eligibleVocab)
  shuffleArray(options);
  prepare8QuizQuestions(correctVocab)
  prepareQuiz(options, correctVocab)
}
export function preparePronounciationQuizQuestions(correctVocab) {
  document.getElementById('quizQuestion').textContent = `What is the pronounciation of "${correctVocab.word}"?`;
  document.getElementById('quizContainer').dataset.correctAnswer = correctVocab.pronounciation;
  document.getElementById('quizContainer').dataset.correctWord = correctVocab.word;
}
export function prepareWordQuizQuestions(correctVocab) {
  document.getElementById('quizQuestion').textContent = `What is the word for "${correctVocab.definition}" ? `
  document.getElementById('quizContainer').dataset.correctAnswer = correctVocab.word;
}
export function prepareDefQuizQuestions(correctVocab) {
  document.getElementById('quizQuestion').textContent = `What is the definition of "${correctVocab.word}" ? `;
  document.getElementById('quizContainer').dataset.correctAnswer = correctVocab.definition;
  document.getElementById('quizContainer').dataset.correctWord = correctVocab.word;
}
export function prepare8QuizQuestions(correctVocab) {
  document.getElementById('quizQuestion').textContent = `What is the definition of this word ? `;
  document.getElementById('quizContainer').dataset.correctAnswer = correctVocab.definition;
  document.getElementById('quizContainer').dataset.correctWord = correctVocab.word;
}
export function prepareQuiz(options) {

  document.getElementById('option1').textContent = options[0];
  document.getElementById('option2').textContent = options[1];
  document.getElementById('option3').textContent = options[2];
  document.getElementById('option4').textContent = options[3];

  // Show quiz and hide vocab card
  document.getElementById('quizContainer').style.display = 'block';
  document.getElementById('vocabFlashcard').style.display = 'none';
  document.getElementById('correctMessage').style.display = 'none';
  document.getElementById('incorrectMessage').style.display = 'none';
  document.getElementById('correctDefinition').style.display = 'none';
  document.getElementById('nextAfterIncorrectButton').style.display = 'none';
}

export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
export const langMap = {
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
export const nameToAbbr = Object
  .entries(langMap)                      // [[ 'de','German'], …]
  .reduce((acc, [k, v]) => {
    acc[v.toLowerCase()] = k;
    return acc;
  }, {});
export function loadVoices() {
  return new Promise(resolve => {
    let voices = speechSynthesis.getVoices();
    if (voices.length) return resolve(voices);
    speechSynthesis.onvoiceschanged = () => resolve(speechSynthesis.getVoices());
  });
}
export function convertToAbbr(name) {
  return nameToAbbr[name.toLowerCase()] || name;
}
export function getSpeechLang(code) {
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

export async function speakWord(lang, word) {
  speechSynthesis.cancel();
  var language = lang
  language = convertToAbbr(language)
  const currentLang = getSpeechLang(language);
  word = expandWord(word);
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = currentLang;
  const voices = await loadVoices();
  const voice = voices.find(v => v.lang === currentLang);
  if (voice) utterance.voice = voice;
  speechSynthesis.speak(utterance);
}

export function getNRandomElements(arr, n) {
  const shuffled = [...arr]; // create a copy
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, n);
}
export function allEligible(arr, func) {

}
function showCorrectAnswer(currentQuizWord) {
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
      vocabFlashcard.textContent += correctConj
      vocabFlashcard.textContent += " is one of the "
      vocabFlashcard.textContent += makeStringReadable(conjToTest.toString())
      vocabFlashcard.textContent += " form of "
      vocabFlashcard.textContent += correctVocab.word
    } if ((conjToTest || false) && conjToTest.length > 0 && quizType == "7") {
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