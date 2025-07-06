let currentVocabIndex = null;
let vocabList = [];
let currentQuizWord = null;
let currentQuizDefinition = null;
let quizType = null;
let isPairCorrect = null;
let filteredVocabList = []
let currentQuizNo = 0;
let wordToTest = "";
let correctCount = 0;
let totalCountYet = 0;
let wordAmount = 3;
let playbackSpeed = 1;
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('wrongCountDiv').style.display = 'none';
  document.getElementById('quizContainer').style.display = 'none';
  document.getElementById('nextButton').style.display = 'none';
  populateBookSelector();
  document.getElementById('testCollectionBtn').addEventListener('click', () => {
    // Get the selected collection from the dropdown
    const selectedCollection = document.getElementById('bookSelector').value;
    wordAmount = document.querySelector('input[name="wordAmount"]:checked').value;
    playbackSpeed = document.querySelector('input[name="playbackSpeed"]:checked').value;
    document.getElementById('containerLine').style.display = 'none';
    document.getElementById('testCollectionBtn').style.display = 'none';
    document.getElementById('nextButton').style.display = '';
    document.getElementById('initContainer').style.display = 'none';
    document.getElementById('bookSelector').style.display = 'none';
    document.getElementById('quizContainer').style.display = '';
    document.getElementById('nextButton').style.display = 'none';
    displayTests(selectedCollection);
  });
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

  document.getElementById('nextButton').addEventListener('click', function () {
    showNextItem();
  });
}
);

function displayTests(bookSelected) {
  chrome.storage.local.get('vocabList', function (data) {
    if (data.vocabList) {
      vocabList = data.vocabList;
      currentVocabIndex = -1;
      if (vocabList.length < 4) {
        console.log("novocab1");
        document.getElementById('vocabFlashcard').textContent = "Come back after theres more vocabs";
      } else {
        if (bookSelected === "All collections") {
          filteredVocabList = vocabList;
        } else {
          filteredVocabList = vocabList.filter(vocab => vocab.book === bookSelected && vocab.language);
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

        if (filteredVocabList.length < 4) {
          alert("Not enough eligible entries to make the test.");
          return;
        }
        totalNoCount = filteredVocabList.length;
        document.getElementById('wrongCountDiv').textContent = `"${currentQuizNo}" / ${totalNoCount}"`;
        //document.getElementById('end').style.display = '';
        if (filteredVocabList.length === 0 || filteredVocabList.length < wordAmount) {
          document.getElementById('quizContainer').textContent = "No eligible vocabulary to test. If you are using a custom made deck, make sure to add language field to each vocab. check https://mingx0711.github.io/";
          document.getElementById('nextButton').style.display = 'none';
          return;
        }
      }
      showNextItem();
    }
  });
}
function loadVoices() {
  return new Promise(resolve => {
    let voices = speechSynthesis.getVoices();
    if (voices.length) return resolve(voices);
    speechSynthesis.onvoiceschanged = () => resolve(speechSynthesis.getVoices());
  });
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
function populateBookSelector() {
  chrome.storage.local.get({ bookList: [] }, (result) => {
    const bookList = result.bookList || "Default";
    chrome.storage.local.get('lastBook', function (data) {
      const lastBook = data.lastBook || "Default";
      console.log(lastBook)
      if (lastBook) {
        document.getElementById('bookSelector').innerHTML = ""
        if (lastBook != "" || lastBook === "addNew") {
          optionNewSelected = document.createElement('option');
          optionNewSelected.textContent = lastBook;
          optionNewSelected.value = lastBook;
          optionNewSelected.selected = true;

          document.getElementById('bookSelector').add(optionNewSelected)
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
      }
    });

  });
}

function showNextItem() {
  if (filteredVocabList.length < 3) {
    document.getElementById("quizContainer").style.display = 'none';
  } else {
    listeningTest()
  }
}
const quizContainer = document.getElementById('quizContainer');
const revealedWords = document.getElementById('revealedWords');
const enterWords = document.getElementById('enterWords');
function listeningTest() {
  revealedWords.style.display = 'none';
  quizContainer.style.display = 'block';
  nextButton.style.display = 'block';
  enterWords.value = "";
  let quizWords = getRandomUniqueItemsSameLanguage(filteredVocabList, wordAmount);
  let wordString = quizWords.map(item => item.word).join(",");
  let defString = quizWords.map(item => item.definition).join("&#11045;	");
  let wordStringToDisplay = quizWords.map(item => item.word).join("&#11045;	");
  document.getElementById('speak').addEventListener('click', async function () {
    speechSynthesis.cancel();
    var language = quizWords[0].language;
    const currentLang = getSpeechLang(language);
    const utterance = new SpeechSynthesisUtterance(wordString);
    utterance.lang = currentLang;
    const voices = await loadVoices();
    const voice = voices.find(v => v.lang === currentLang);
    if (voice) utterance.voice = voice;
    utterance.rate = playbackSpeed;
    speechSynthesis.speak(utterance);
  });

  revealedWords.innerHTML = wordStringToDisplay + '<div class = "ui divider"></div>' + defString;
}
document.getElementById('revealWordsBtn').addEventListener('click', function () {
  revealedWords.style.display = 'block';
});
const nextButton = document.getElementById('nextButton');
nextButton.addEventListener('click', showNextItem());
function getRandomUniqueItemsSameLanguage(arr, x) {
  // Group items by language
  const grouped = {};
  for (const item of arr) {
    if (!grouped[item.language]) {
      grouped[item.language] = [];
    }
    grouped[item.language].push(item);
  }

  // Filter out groups smaller than x
  const validLanguages = Object.keys(grouped).filter(lang => grouped[lang].length >= x);
  if (validLanguages.length === 0) {
    throw new Error("No language group has enough items");
  }

  // Pick one random language group
  const chosenLang = validLanguages[Math.floor(Math.random() * validLanguages.length)];
  const chosenGroup = grouped[chosenLang];

  // Shuffle and return x items
  const shuffled = [...chosenGroup];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, x);
}