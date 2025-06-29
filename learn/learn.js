let currentVocabIndex = null;
let vocabList = [];
let currentQuizWord = null;
let currentQuizDefinition = null;
let quizType = null;
let isPairCorrect = null;
let filteredVocabList =[]
let currentStep = null;
let currentQuizNo = 0;
let wordToTest = "";
let recordHistory = [];
let correctCount = 0;
let totalCountYet = 0;
let currentTest;
let totalVocabList = []
let wrongVocabs = [];
let learningQueue = [];
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('vocabFlashcard').style.display = 'none';
  document.getElementById('quizContainer').style.display = 'none';
  document.getElementById('trueFalseContainer').style.display = 'none';
  document.getElementById('snoozeButton').style.display = 'none';
  document.getElementById('nextButton').style.display = 'none';
  populateBookSelector();
  document.getElementById('start').addEventListener('click', () => {
    // Get the selected collection from the dropdown
    const selectedCollection = document.getElementById('bookSelector').value;
    // Call the function to display vocab
    generateLearningQueue(selectedCollection);
  });

  document.getElementById('nextButton').addEventListener('click', function() {
    showNextItem();
  });

  document.getElementById('end').addEventListener('click', function() {

    endTest();
  });
  
  document.getElementById('redo').addEventListener('click', function() {
    document.getElementById('nextAfterIncorrectButton').style.display = "None"
    document.getElementById('showTestResult').style.display = "None"

    filteredVocabList = filteredVocabList.filter(item => wrongVocabs.includes(item.word));
    console.log(filteredVocabList)
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

  document.getElementById('nextAfterIncorrectButton').addEventListener('click', function() {
    document.getElementById('incorrectMessage').style.display = 'none';
    document.getElementById('correctDefinition').style.display = 'none';
    document.getElementById('nextAfterIncorrectButton').style.display = 'none';
    showNextItem();
  });

  document.querySelectorAll('.quiz-option').forEach(button => {
    button.addEventListener('click', function() {
      checkAnswer(button);
    });
  });
  document.getElementById('correctDefinition').style.display = 'none';
  document.getElementById('trueButton').addEventListener('click', function() {
    checkTrueFalse(true);
  });

  document.getElementById('falseButton').addEventListener('click', function() {
    checkTrueFalse(false);
  });
  }
);
let currentFocus;
function getLeastLearnedTen(arr) {
  return arr
    .slice() // make a copy
    .sort((a, b) => {
      const aTime = a.learnedTime ?? -Infinity;
      const bTime = b.learnedTime ?? -Infinity;
      return aTime - bTime;
    })
    .slice(0, 10);
}
function generateLearningQueue(bookSelected) {
  chrome.storage.local.get('vocabList', function(data) {
    if (data.vocabList) {
      vocabList = data.vocabList;
      currentVocabIndex = -1;
      if (vocabList.length < 10) {
        document.getElementById('vocabFlashcard').textContent = "Come back after there's more vocabs";
        return;
      }
      filteredVocabList = vocabList.filter(vocab => vocab.book === bookSelected);
      totalVocabList = filteredVocabList;
      filteredVocabList = getLeastLearnedTen(filteredVocabList);
      console.log(filteredVocabList)
      document.getElementById('containerLine').style.display = 'none';
      document.getElementById('start').style.display = 'none';
      document.getElementById('snoozeButton').style.display = '';
      document.getElementById('nextButton').style.display = '';
      document.getElementById('initContainer').style.display = 'none';
      document.getElementById('bookSelector').style.display = 'none';
      document.getElementById('quizContainer').style.display = '';
      document.getElementById('nextButton').style.display = 'none';
      totalNoCount = filteredVocabList.length;
      document.getElementById('end').style.display = '';
      if (filteredVocabList.length === 0) {
        document.getElementById('vocabFlashcard').textContent = "No vocabulary to test.";
        document.getElementById('nextButton').style.display = 'none';
        return;
      }
      filteredVocabList.forEach(wordObj => {
      // 1. Flashcard
      learningQueue.push({ type: 'flashcard', word: wordObj });

      // 2. True/False quiz (quizStyle3), with wrong definition from totalVocabList

      // 3. Randomly quizStyle1 or quizStyle2
      const quizType = Math.random() < 0.5 ? 'quiz1' : 'quiz2';
      learningQueue.push({ type: quizType, word: wordObj });

      if(Math.random() < 0.5){
        if(wordObj.gender){
          learningQueue.push({ type: 'quiz5', word: wordObj });
        }
        if(wordObj.pronounciation){
          learningQueue.push({ type: 'quiz4', word: wordObj });
        }
      }else{
        learningQueue.push({ type: 'quiz3', word: wordObj });
      }
      if(Math.random() < 0.5){
        learningQueue.push({ type: 'quiz8', word: wordObj });
        }
      });
    }
    const quizTypes = ['quiz1', 'quiz2', 'quiz3', 'quiz4', 'quiz5', 'quiz8'];
    let randomWords = filteredVocabList.slice();
    shuffleArray(randomWords);
    randomWords.slice(0, 8).forEach(wordObj => {
      const randomQuizType = quizTypes[Math.floor(Math.random() * quizTypes.length)];
      if(randomQuizType==='quiz4'&&wordObj.pronounciation){
        learningQueue.push({ type: randomQuizType, word: wordObj });
      }else{
        learningQueue.push({ type: 'quiz1', word: wordObj });
      }
      if(randomQuizType==='quiz5'&&wordObj.gender){
        learningQueue.push({ type: randomQuizType, word: wordObj });
      }else{
        learningQueue.push({ type: 'quiz2', word: wordObj });
      }
    });
  });
    currentStep = 0;
  console.log(learningQueue);
  showNextLearningStep();
}
function showNextLearningStep() {
  // If queue is empty, finish
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
      quizStyle1()
      break;

    default:
      // handle unknown step type
      console.warn("Unknown step type:", step.type);
      break;
  }
}
function showNextVocab() {
  document.getElementById('quizContainer').style.display = 'none';
  document.getElementById('trueFalseContainer').style.display = 'none';
  document.getElementById('matchContainer').style.display = 'none';
  document.getElementById('incorrectMessage').style.display = 'none';
  document.getElementById('snoozeButton').style.display = '';
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
  let definition
  if (Math.random()<=0.5){
    const wordObject = steps;
    if(wordObject.conjugations&&wordObject.conjugations.group!=""){
      word = getRandomWordFromConjugations(wordObject.conjugations)
      definition =wordObject.definition+ String.fromCodePoint(0x1F4A0)+"| \n"+makeStringReadable( Object.values(findSubfieldsForWord(word,wordObject.conjugations)).toString())+" for "+wordObject.word; 
    }else{
      word = wordObject.word
      definition = currentCollection[currentVocabIndex].definition;
    }
  }else{
    word = currentCollection[currentVocabIndex].word;
    definition = currentCollection[currentVocabIndex].definition;
  }
    document.getElementById('speak').addEventListener('click',async function () {
    speechSynthesis.cancel();
    const currentWord = word;
    var language = currentCollection[currentVocabIndex].language|| currentCollection[currentVocabIndex].book
    language = convertToAbbr(language)
    const currentLang = getSpeechLang(language);
    const utterance = new SpeechSynthesisUtterance(currentWord);
    utterance.lang = currentLang;
    const voices = await loadVoices();
    const voice = voices.find(v => v.lang === currentLang);
    if (voice) utterance.voice = voice;
    speechSynthesis.speak(utterance);
  });
  const maxSize = 3
  const minSize = 1
  const clamped = Math.min(definition.length, 200);
    const size =
    maxSize - ( (maxSize - minSize) * (clamped / 200) );
  defDiv.style.fontSize = size.toFixed(1) + 'vw';
  const book = currentCollection[currentVocabIndex].book || '';
  if(currentCollection[currentVocabIndex].gender){
    const gender = currentCollection[currentVocabIndex].gender;
    genderDiv.textContent = gender
  }else{
    genderDiv.textContent = ""
  }
  if(currentCollection[currentVocabIndex].pronounciation){
    const pronoun = currentCollection[currentVocabIndex].pronounciation;
    pronounDiv.textContent = pronoun;
  }else{
    pronounDiv.textContent = ""
  }
  wordDiv.innerHTML = word.bold();
  defDiv.textContent =definition;
  bookDiv.textContent = book;
  if(currentCollection[currentVocabIndex].etym){
    const etymText = currentCollection[currentVocabIndex].etym;
    const etymSize =
    maxSize - ( (maxSize - minSize) * ( Math.min(etymText.length, 300) / 300) );
    etymDiv.textContent = etymText.replace(/\.mw[\s\S]*\}/, '');
    etymDiv.textContent = etymDiv.textContent.replace('undefined', '');
    etymDiv.style.fontSize = etymSize.toFixed(1) + 'vw';
  }else{
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
function quizStyle8(){
  console.log("TBI")
}
// Example flashcard display
function showFlashcard(wordObj) {
  document.getElementById('vocabFlashcard').style.display = 'block';
  document.getElementById('quizContainer').style.display = 'none';
  document.getElementById('trueFalseContainer').style.display = 'none';
  document.getElementById('wordDiv').textContent = wordObj.word;
  document.getElementById('defDiv').textContent = wordObj.definition;
  // After user clicks "Next", queue quizzes for this word
  document.getElementById('nextButton').onclick = function() {
    queueQuizzesForWord(wordObj);
    currentStep++;
    showNextLearningStep();
  };
}
function populateBookSelector() {
  chrome.storage.local.get({ bookList: [] }, (result) => {
    const bookList = result.bookList||"Default";
    chrome.storage.local.get('lastBook', function(data) {
      const lastBook = data.lastBook||"Default";
      console.log(lastBook)
    if(lastBook){
        document.getElementById('bookSelector').innerHTML = ""
    if(lastBook!=""||lastBook==="addNew"){
      optionNewSelected = document.createElement('option');
      optionNewSelected.textContent  = lastBook;
      optionNewSelected.value = lastBook;
      optionNewSelected.selected = true;

      document.getElementById('bookSelector').add(optionNewSelected)
    }
    // Clear existing options except for the default option
    // Add books as options
    bookList.forEach(book => {
        let option = document.createElement('option');
        if(book === data.lastBook){
        }else{
          option.textContent  = book;
          option.value = book;

          document.getElementById('bookSelector').add(option);
        }
      });
      }
    });
    
  });
}

function showNextItem() {
  document.getElementById('wrongCountDiv').textContent = `${currentQuizNo} / ${totalNoCount}`;
  if(currentQuizNo >= filteredVocabList.length ) {
    document.getElementById("donzo").style.display = 'block';
    document.getElementById("quizContainer").style.display = 'none';
    document.getElementById('trueFalseContainer').style.display = 'none';
  }else{
    document.getElementById('snoozeButton').style.display = 'none';
    document.getElementById('nextButton').style.display = 'none';
    document.getElementById('quizContainer').style.display = 'none';
    document.getElementById('trueFalseContainer').style.display = 'none';
    const focusQuizMap = {
    gender:   [quizStyle5],
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
      // No focus: pick any quiz style at random
      const randomIndex = Math.floor(Math.random() * allQuizStyles.length);
      allQuizStyles[randomIndex]();
    }
  }
}

function quizStyle1() {
  // Quiz Style 1: Ask for the definition of a word
  if (currentVocabIndex === null || currentVocabIndex >= filteredVocabList.length - 1) {
    currentVocabIndex = 0;
  } else {
    currentVocabIndex = Math.floor(Math.random() * filteredVocabList.length);
    console.log(filteredVocabList[currentVocabIndex]);
  }
  const correctVocab = filteredVocabList[currentVocabIndex];
  currentQuizWord = correctVocab.word;
  currentQuizDefinition = correctVocab.definition;
  quizType = 'definition';
  const options = [correctVocab.definition];
  console.log(options);
  for (let i = 0; i<3;i++) {    
    const randomIndex = Math.floor(Math.random() * filteredVocabList.length);
    const randomDefinition = filteredVocabList[randomIndex].definition;
    if (!options.includes(randomDefinition)) {
      options.push(randomDefinition);
    }else{
      i--;
    }
  }
  currentTest = {quizStyle:"Ask for definition", vocab: correctVocab.word, book: correctVocab.book};
  shuffleArray(options);
  console.log(filteredVocabList[currentVocabIndex].word);

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
    // Quiz Style 2: Ask for the word given a definition
    if (currentVocabIndex === null || currentVocabIndex >= filteredVocabList.length - 1) {
      currentVocabIndex = 0;
    } else {
      currentVocabIndex = Math.floor(Math.random() * filteredVocabList.length);
      console.log(filteredVocabList[currentVocabIndex]);
    }
  
    const correctVocab = filteredVocabList[currentVocabIndex];
    currentQuizWord = correctVocab.word;
    currentQuizDefinition = correctVocab.definition;
    quizType = 'word';
  
    const options = [correctVocab.word];
    for (let i = 0; i<3;i++) {    
      const randomIndex = Math.floor(Math.random() * filteredVocabList.length);
      const randomWord = filteredVocabList[randomIndex].word;
      if (!options.includes(randomWord)) {
        options.push(randomWord);
      }else{
        i--;
      }
    }
    currentTest = {quizStyle:"Ask for word", vocab: correctVocab.word, book: correctVocab.book};

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
    // Quiz Style 3: True or False
    if (currentVocabIndex === null || currentVocabIndex >= filteredVocabList.length - 1) {
      currentVocabIndex = 0;
    } else {
      currentVocabIndex = Math.floor(Math.random() * filteredVocabList.length);
      console.log(filteredVocabList[currentVocabIndex]);
    }
  
    const correctVocab = filteredVocabList[currentVocabIndex];
    currentQuizWord = correctVocab.word;
    currentQuizDefinition = correctVocab.definition;
    quizType = 'truefalse';
  
    isPairCorrect = Math.random() < 0.5;
      currentTest = {quizStyle:"True or False - definition", vocab: correctVocab.word, book: correctVocab.book};
    if (!isPairCorrect) {
      let incorrectVocab;
      do {
        const randomIndex = Math.floor(Math.random() * filteredVocabList.length);
        incorrectVocab = filteredVocabList[randomIndex];
      } while (incorrectVocab.word === currentQuizWord);
      currentQuizDefinition = incorrectVocab.definition;
    }
  
    document.getElementById('trueFalseQuestion').textContent = `Is the definition of "${currentQuizWord}" "${currentQuizDefinition}"?`;
  
    // Show true/false quiz and hide vocab card
    document.getElementById('trueFalseContainer').style.display = 'block';
    document.getElementById('quizContainer').style.display = 'none';
    document.getElementById('vocabFlashcard').style.display = 'none';
    document.getElementById('correctMessage').style.display = 'none';
    document.getElementById('incorrectMessage').style.display = 'none';
    document.getElementById('correctDefinition').style.display = 'none';
    document.getElementById('nextAfterIncorrectButton').style.display = 'none';
  }
  function quizStyle4(){
    console.log("4, ask for pronounciation")
    quizType="pronounciation"

    const eligibleVocab = filteredVocabList.filter(entry =>entry.pronounciation&& entry.pronounciation!="");
    const eligibleOptions = filteredVocabList.filter(entry => entry.pronounciation&& entry.pronounciation!="");
    const numberOfDifferentTypes = new Set(eligibleOptions.map(item => item.pronounciation)).size;
    console.log("numberOfDifferentTypesQuiz4",numberOfDifferentTypes)
  
    console.log(eligibleOptions)
    if (eligibleVocab.length < 1 || numberOfDifferentTypes <3 || eligibleOptions.length<3) {
      quizStyle1();
      return;
    }
    currentTest = {quizStyle:"Ask for pronounciation", vocab: correctVocab.word, book: correctVocab.book};

    const correctVocab = eligibleVocab[currentVocabIndex];
    currentQuizWord = correctVocab.word;
    console.log(currentQuizWord);
    currentQuizDefinition = correctVocab.pronounciation;
    if (currentVocabIndex === null || currentVocabIndex >= filteredVocabList.length - 1) {
      currentVocabIndex = 0;
    } else {
      currentVocabIndex = Math.floor(Math.random() * eligibleVocab.length);
      console.log(filteredVocabList[eligibleVocab]);
    }
    if(currentQuizDefinition==""){
      quizStyle1();
    }else{
      const options = [correctVocab.pronounciation];
    for (let i = 0; i<3;i++) {    
      const randomIndex = Math.floor(Math.random() * eligibleOptions.length);
      const randomPronounciation = eligibleOptions[randomIndex].pronounciation;
      console.log(randomPronounciation)
      if (!options.includes(randomPronounciation)) {
        options.push(randomPronounciation);
      }else{
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
  function quizStyle5(){
    quizType="gender"
    console.log("5, ask for gender")
    const eligibleVocab = filteredVocabList.filter(entry => entry.gender&& entry.gender!=""&&entry.gender!="undefined");
    const gendersInTheCollection =[...new Set(
      eligibleVocab
        .filter(item => item.gender && item.gender !== "" && item.gender !== "undefined") // Filter out items without "book" or where "book" is "a"
        .map(item => item.gender) 
    )];
    if (eligibleVocab.length <= 1 || gendersInTheCollection.size <2) {
      quizStyle2();
      return;
    }else{
      eligibleVocabIndex = Math.floor(Math.random() * eligibleVocab.length);
    const correctVocab = eligibleVocab[eligibleVocabIndex];
    currentVocabIndex =  filteredVocabList.findIndex(listItem => 
      listItem.word === correctVocab.word && listItem.definition === correctVocab.definition
    );
    currentQuizWord = correctVocab.word;
    currentQuizDefinition = correctVocab.gender;
    quizType = 'truefalse';
    console.log(currentQuizDefinition);
    isPairCorrect = Math.random() < 0.5;
    if(!isPairCorrect){
      currentQuizDefinition = gendersInTheCollection[Math.floor(Math.random()*gendersInTheCollection.length)];
      while(currentQuizDefinition===correctVocab.gender){
        currentQuizDefinition = gendersInTheCollection[Math.floor(Math.random()*gendersInTheCollection.length)];
      }
    }
        currentTest = {quizStyle:"Ask for gender", vocab: correctVocab.word, book: correctVocab.book};

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
  function getRandomSubfield(obj) {
      let keys = Object.keys(obj);
      let randomKey = keys[Math.floor(Math.random() * keys.length)];
      return randomKey;
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
    const validKeys = keys.filter(field => (field !== 'pos')&&(field !== 'type'));
    const randomKey = validKeys[Math.floor(Math.random() * keys.length)];
    return randomKey;
  }
  
  // Helper function to find common word across multiple lists
  function findCommonWordAcrossLists(lists) {
    const res = lists.reduce((a, b) => a.filter(c => b.includes(c))); // Get first common word or undefined
    return res;
  }

  function getRandomWordFromConjugations(conjugations,commonWordsList=[]) {
    let fields = Object.keys(conjugations);
    const filteredFields = fields.filter(field => (field !== 'pos')&&(field !== 'type')&&(field !== 'group')&&(field !== 'group'));
    const randomField = filteredFields[Math.floor(Math.random() * filteredFields.length)];
    const subfields = Object.keys(conjugations[randomField]);
    let randomSubfield = subfields[Math.floor(Math.random() * subfields.length)];
    const words = conjugations[randomField][randomSubfield];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    console.log(randomField+":"+randomSubfield+":"+randomWord)
    if(randomWord==undefined){
      return getRandomWordFromConjugations(conjugations,commonWordsList);
    }
    const isInAllSubfields = commonWordsList.includes(randomWord)
    if(randomWord.length<=1||randomWord==null||isInAllSubfields){
      console.log(randomWord+" is not not a wrong answer")
        return getRandomWordFromConjugations(conjugations,commonWordsList);
    }else{    
        return randomWord;}
  }
  function makeStringReadable(names){
    names = names.replace("futurePerfect", 'future perfect');
    names = names.replaceAll("_", ' ');

    return names
  }
  function findSubfieldsForWord(word, conjugations) {
    let wordSubfields = [];
    
    for (const field in conjugations) {
      if((field !== 'pos')&&(field !== 'type') ){
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
        combinedSubfields[field] +="/"+subfield;
      } else {
        // Otherwise, just set the subfield for this field
        combinedSubfields[field] = subfield;
      }
    });
    
    return combinedSubfields;
  }
      
  function quizStyle6()
  {
    const eligibleVocab = filteredVocabList.filter(entry => entry.conjugations&& entry.conjugations.type!="");
    if(eligibleVocab.length<1){
      return quizStyle3();
    }
    if (currentVocabIndex === null || currentVocabIndex >= filteredVocabList.length - 1) {
      currentVocabIndex = 0;
    } else {
      currentVocabIndex = Math.floor(Math.random() * eligibleVocab.length);
      console.log(eligibleVocab[currentVocabIndex]);
    }
    const correctVocab = eligibleVocab[currentVocabIndex];
    const conjugations = correctVocab.conjugations;
    conjToTest=[]
    let correctAnswer;
    let numberOfFields=1;
    let selectedField;
    let questionText = ""
    let options = []
    console.log(correctVocab.word)
    if((getRandomNumber(1,9))>=9){
      if(conjugations.group&&conjugations.group!=""){
            currentTest = {quizStyle:"Ask for word group", vocab: correctVocab.word, book: correctVocab.book};
        questionText = "what is the group of " + correctVocab.word
        correctAnswer =  conjugations.group;
        console.log(correctAnswer)
        options = [correctAnswer];
        currentQuizWord = correctVocab.word;
        if(Array.isArray(correctAnswer)){
          correctAnswer = correctAnswer[0]
        }
        let wrongAnswers = []
        if(conjugations.pos=="verb"){
          wrongAnswers = ["first conjugation","second conjugation","third conjugation","fourth conjugation","irregular","first&second conjugation"]
        }else{
          wrongAnswers = ["first declension","second declension","third declension","fourth declension","fifth declension","irregular"]
        }
        for (let i = 0; i<3;i++) {
          console.log(options)
            const index = getRandomNumber(1,wrongAnswers.length)
            if (!options.includes(wrongAnswers[index])) {
              options.push(wrongAnswers[index]);
            }else{
              i--
            }
        }
        shuffleArray(options)

        quizType="groupTest"
      }
    }else{
      quizType = "6"
      currentTest = {quizStyle:"Give inflection, ask type of inflection", vocab: correctVocab.word, book: correctVocab.book};
      if(conjugations.pos=="verb"){
        const typeOfVerbToTest = getRandomNumber(1,10)
        numberOfFields = getRandomNumber(1, 5);
        const verbFields1 = ['mood','person','number', 'voice', 'tense'];
        const verbFields2 = ['voice', 'tense','form'];
        const verbFields3 = ['noun', 'case'];
    
        if(typeOfVerbToTest<=8){
            selectedField = verbFields1
        }else if(typeOfVerbToTest<=9){
            selectedField = verbFields2
        }else if(typeOfVerbToTest<=10){
            selectedField = verbFields3
        }    
        }else{
            console.log("not a verb")
            if(conjugations.inflections){
              numberOfFields = 1;
              selectedField = ['inflections'];
            }else{
              console.log(correctVocab.word + "data format outdatted ")
              showNextItem();
            }
        }
    
        let selectedKeys = getRandomKeysFromArray(selectedField, numberOfFields);
        let conjugationLists = [];
        selectedKeys.forEach(field => {
            const subfield = getRandomSubfield(conjugations[field]);
            console.log(subfield)
            conjToTest.push(subfield);
            conjugationLists.push(conjugations[field][subfield]);
          });
        const commonWordsList = findCommonWordAcrossLists(conjugationLists);
        const commonWord = commonWordsList[getRandomNumber(0,commonWordsList.length)];
        if (!commonWord) {
            console.log("No common word found, retrying...");
            return quizStyle6(); // Restart quiz if no common word is found
          } 
        correctAnswer = commonWord; 
        let wrongAnswers = [];
        while (wrongAnswers.length < 3) {
            const wrongWord = getRandomWordFromConjugations(conjugations,commonWordsList);
            if(!wrongAnswers.includes(wrongWord)&&!(wrongWord==commonWord)){
                wrongAnswers.push(wrongWord);
                }
            }
        console.log(wrongAnswers)
        currentQuizWord = correctVocab.word;
        currentQuizDefinition = correctAnswer;
        quizType = '6';
        options = [correctAnswer];

        console.log(options);
        for (let i = 0; i<3;i++) {
            if (!options.includes(wrongAnswers)) {
            options.push(wrongAnswers[i]);
            }else{
            i--;
            }
        }
        correctConj=correctAnswer;
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
  
      document.getElementById('quizContainer').dataset.correctAnswer =correctAnswer;
  
      // Show quiz and hide vocab card
      document.getElementById('quizContainer').style.display = 'block';
      document.getElementById('vocabFlashcard').style.display = 'none';
      document.getElementById('correctMessage').style.display = 'none';
      document.getElementById('incorrectMessage').style.display = 'none';
      document.getElementById('correctDefinition').style.display = 'none';
      document.getElementById('nextAfterIncorrectButton').style.display = 'none';
  }
  function quizStyle7(){
    wordToTest=""
    const eligibleVocab = filteredVocabList.filter(entry => entry.conjugations&& entry.conjugations.type!="");
    if(eligibleVocab.length<1){
      return quizStyle1();
    }
    if (currentVocabIndex === null || currentVocabIndex >= filteredVocabList.length - 1) {
      currentVocabIndex = 0;
    } else {
      currentVocabIndex = Math.floor(Math.random() * eligibleVocab.length);
      console.log(eligibleVocab[currentVocabIndex]);
    }
    const correctVocab = eligibleVocab[currentVocabIndex];
    const conjugations = correctVocab.conjugations;
    conjToTest=[]
    let correctAnswer;
    let questionText = ""
    let options = []
    currentTest = {quizStyle:"Give type of inflection, ask inflection", vocab: correctVocab.word, book: correctVocab.book};
    wordToTest = getRandomWordFromConjugations(conjugations)
    const subFields = findSubfieldsForWord(wordToTest,conjugations)
    conjToTest = Object.values(subFields);
    console.log(conjToTest)
    correctAnswer = conjToTest.toString(); 
    correctAnswer = makeStringReadable(correctAnswer);
    let wrongAnswers = [];
    while (wrongAnswers.length < 3) {
      const wrongWord = getRandomWordFromConjugations(conjugations);
      console.log(wrongWord)
      const wrongConj = makeStringReadable( Object.values(findSubfieldsForWord(wrongWord,conjugations)).toString()); 
      if(!wrongAnswers.includes(wrongConj)&&!(wrongConj==correctAnswer)){
          wrongAnswers.push(wrongConj);
          }
      }
    console.log(wrongAnswers)
    currentQuizWord = correctVocab.word;
    currentQuizDefinition = correctAnswer;
    quizType = '7';
    options = [correctAnswer];
    console.log(options);
    currentVocabIndex = filteredVocabList.indexOf(correctVocab);
    for (let i = 0; i<3;i++) {
        if (!options.includes(wrongAnswers)) {
        options.push(wrongAnswers[i]);
        }else{
        i--;
        }
    }
    correctConj=correctAnswer;
    shuffleArray(options);
   
    questionText = `What type conjugation doe  the word "${wordToTest}" belong to?`
  
  
  
    document.getElementById('quizQuestion').textContent = questionText;
    document.getElementById('option1').textContent = options[0];
    document.getElementById('option2').textContent = options[1];
    document.getElementById('option3').textContent = options[2];
    document.getElementById('option4').textContent = options[3];
  
    document.getElementById('quizContainer').dataset.correctAnswer =correctAnswer;
  
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
    console.log(quizType)
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
      vocabFlashcard.innerHTML+= String.fromCodePoint(0x1F4A0);

      vocabFlashcard.textContent = `${correctVocab.word}: ${correctVocab.definition}`;
      if(correctVocab.gender && correctVocab.gender!=""){
        vocabFlashcard.innerHTML+= String.fromCodePoint(0x1F4A0);

        vocabFlashcard.textContent+= " gender:"
        vocabFlashcard.textContent+= correctVocab.gender
      }
      if(correctVocab.pronounciation && correctVocab.pronounciation!=""){
        vocabFlashcard.innerHTML+= String.fromCodePoint(0x1F4A0);

        vocabFlashcard.textContent+= " pronounciation:"
        vocabFlashcard.textContent+= correctVocab.pronounciation
      } 
      if(quizType=="6"){
        vocabFlashcard.innerHTML+= String.fromCodePoint(0x1F4A0);
        vocabFlashcard.textContent+= currentQuizDefinition
        vocabFlashcard.textContent+= " is one of the "
        vocabFlashcard.textContent+= makeStringReadable(conjToTest.toString())
        vocabFlashcard.textContent+= "form of "
        vocabFlashcard.textContent+= correctVocab.word
      }if(quizType=="7"){
        vocabFlashcard.innerHTML+= String.fromCodePoint(0x1F4A0);
        vocabFlashcard.textContent+= wordToTest
        vocabFlashcard.textContent+= " is one of the "
        vocabFlashcard.textContent+= makeStringReadable(conjToTest.toString())
        vocabFlashcard.textContent+= " form of "
        vocabFlashcard.textContent+= correctVocab.word
      }if(quizType=="groupTest"){
        vocabFlashcard.innerHTML+= String.fromCodePoint(0x1F4A0);
        vocabFlashcard.textContent+= " group: "
        vocabFlashcard.textContent+= correctVocab.conjugations.group
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
    console.log(currentVocabIndex);
    totalCountYet+= 1;
    if (currentVocabIndex !== null && filteredVocabList[currentVocabIndex].quizResults) {
      chrome.storage.local.get('vocabList', function(data) {
      vocabList = data.vocabList; 
      const match = vocabList.find(item => item.word === filteredVocabList[currentVocabIndex].word);
      let quizResults =  filteredVocabList[currentVocabIndex].quizResults;
      quizResults.unshift(result);
        if (quizResults.length > 4) {
        quizResults.pop(); // Remove the oldest result to keep only the last 4
        }  
        console.log(match.word)
          if(match){
            match.quizResults =quizResults;
          }
        chrome.storage.local.set({ vocabList: vocabList }, function() {
          console.log(`Updated quiz results for "${match.word}": ${quizResults}`);
        });
      });
    }
    if (result === 't'){
      currentQuizNo += 1;
      correctCount += 1;
    }
    recordHistory.push(currentTest);
    console.log("currentTest",currentTest);
    console.log("recordHistory",recordHistory);
    const correctRate = (correctCount / totalCountYet) * 100;
    document.getElementById('correctCountDiv').innerHTML = `<span style="color: green;">${currentQuizNo}</span> / ${totalCountYet}  CorrectRate: ${correctRate.toFixed(2)}%`;
  }
  
  function removeCurrentVocab() {
    if (currentVocabIndex !== null) {
      filteredVocabList.splice(currentVocabIndex, 1);
  
      chrome.storage.local.set({ filteredVocabList: vocabList }, function() {
        console.log(`Removed "${currentQuizWord}" from the filtered vocab list.`);
      });
    }
  }
  function endTest(){
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
    if (wrongVocabs.length>=4){
      document.getElementById("redo").style.display = '';
    }else{
      document.getElementById("redo").style.display = 'None';
    }
    chrome.storage.local.get('recordHistories', function(result) {
      let histories = result.recordHistories || [];
      // Get the current book (from your UI or state)
      const currentBook = document.getElementById('bookSelector').value;
      buildChartPerQuiz(quizStats, histories, currentBook);
      drawCorrectnessTrend(histories, recordHistory);
      histories.push(recordHistory);
      chrome.storage.local.set({ recordHistories: histories }, function() {
      console.log('Record history saved successfully.');
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

