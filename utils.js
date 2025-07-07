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
  document.getElementById('trueFalseContainer').style.display = 'none';
  document.getElementById('matchContainer').style.display = 'none';
  document.getElementById('incorrectMessage').style.display = 'none';
  document.getElementById('speakQuiz').style.display = "none"
}

export function ClearPageForTFContainer() {
  document.getElementById('trueFalseContainer').style.display = 'none';
  document.getElementById('matchContainer').style.display = 'none';
  document.getElementById('incorrectMessage').style.display = 'none';
  document.getElementById('speakQuiz').style.display = "none"
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
  document.getElementById('snoozeButton').style.display = ''
  document.getElementById('snoozeButton').style.display = ''
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