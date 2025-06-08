
let currentVocabIndex = null;
let vocabList = [];
let currentQuizWord = null;
let currentQuizDefinition = null;
let quizType = null;
let isPairCorrect = null;
let filteredVocabList =[]
let totalNoCount = null;
let currentQuizNo = 0;
let conjToTest = []
let correctConj = ""
let wordToTest=""
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('wrongCountDiv').style.display = 'none';
  document.getElementById('vocabFlashcard').style.display = 'none';
  document.getElementById('quizContainer').style.display = 'none';
  document.getElementById('trueFalseContainer').style.display = 'none';
  document.getElementById('snoozeButton').style.display = 'none';
  document.getElementById('nextButton').style.display = 'none';
  populateBookSelector();
  document.getElementById('testCollectionBtn').addEventListener('click', () => {
    // Get the selected collection from the dropdown
    const selectedCollection = document.getElementById('bookSelector').value;
    // Call the function to display vocab
    displayTests(selectedCollection);
    document.getElementById('containerLine').style.display = 'none';
    document.getElementById('wrongCountDiv').style.display = '';
    document.getElementById('testCollectionBtn').style.display = 'none';
    document.getElementById('snoozeButton').style.display = '';
    document.getElementById('nextButton').style.display = '';
    document.getElementById('initContainer').style.display = 'none';
    document.getElementById('bookSelector').style.display = 'none';
    document.getElementById('quizContainer').style.display = '';
    document.getElementById('nextButton').style.display = 'none';

  });

  document.getElementById('nextButton').addEventListener('click', function() {
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

function displayTests(bookSelected){
  chrome.storage.local.get('vocabList', function(data) {
    if (data.vocabList) {
      vocabList = data.vocabList;
      currentVocabIndex = -1;
      
      if(vocabList.length<4){
        console.log("novocab1");
        document.getElementById('vocabFlashcard').textContent = "Come back after theres more vocabs";
      }else{
        if(bookSelected === "All collections"){
          filteredVocabList = vocabList;
        }else{
          filteredVocabList = vocabList.filter(vocab =>( vocab.book === bookSelected && vocab.conjugations))
        }
        totalNoCount = filteredVocabList.length;
        document.getElementById('wrongCountDiv').textContent = `"${currentQuizNo}" / ${totalNoCount}"`;
        console.log(filteredVocabList)
        if (filteredVocabList.length === 0) {
          document.getElementById('vocabFlashcard').textContent = "No vocabulary to test.";
          document.getElementById('nextButton').style.display = 'none';
          return;
        }
      }
      showNextItem();
    }
  });
}

function populateBookSelector() {
  chrome.storage.local.get({ bookList: [] }, (result) => {
    const bookList = result.bookList||["Default"];
    chrome.storage.local.get('lastBook', function(data) {
      const lastBook = data.lastBook||"Default";
      console.log(lastBook)
    if(lastBook){
        document.getElementById('bookSelector').innerHTML = ""
    if(lastBook!=""||lastBook==="addNew"){
      optionNewSelected = document.createElement('option');
      optionNewSelected.innerHTML = `<option value=${lastBook} selected = selected>${lastBook}</option>`;
      document.getElementById('bookSelector').add(optionNewSelected)
    }
    let option = document.createElement('option');
    option.innerHTML = `<option value='All'> All collections </option>`;
    document.getElementById('bookSelector').add(option);
    // Clear existing options except for the default option
    // Add books as options
    bookList.forEach(book => {
        let option = document.createElement('option');
        if(book === data.lastBook){
        }else{
          option.innerHTML = `<option value='${book}'>${book}</option>`;
          document.getElementById('bookSelector').add(option);
        }
      });
      }
    });
    
  });

}

function showNextItem() {
  document.getElementById('wrongCountDiv').textContent = `${currentQuizNo} / ${totalNoCount}`;
  if(currentQuizNo >= totalNoCount){
    document.getElementById("donzo").style.display = 'block';
    document.getElementById("quizContainer").style.display = 'none';
    document.getElementById('trueFalseContainer').style.display = 'none';
  }else{
    document.getElementById('snoozeButton').style.display = 'none';
    document.getElementById('nextButton').style.display = 'none';
    document.getElementById('quizContainer').style.display = 'none';
    document.getElementById('trueFalseContainer').style.display = 'none';
    const quizStyle = getRandomNumber(0,1)
    console.log(quizStyle);
    switch(quizStyle){
      case 0:
        quizStyle6();
        break;
      case 1:
        quizStyle7();
        break;
    }
  }
}

  function quizStyle5(){
    console.log("5, ask for gender")
    const eligibleVocab = filteredVocabList.filter(entry => entry.gender&& entry.gender!=""&&entry.gender!="undefined");
    const gendersInTheCollection =[...new Set(
      eligibleVocab
        .filter(item => item.gender && item.gender !== "" && item.gender !== "undefined") // Filter out items without "book" or where "book" is "a"
        .map(item => item.gender) 
    )];
    console.log("gendersInTheCollection",gendersInTheCollection);
    console.log(eligibleVocab)
    if (eligibleVocab.length <= 1 || gendersInTheCollection.size <2) {
      quizStyle2();
      return;
    }else{
      let eligibleVocabIndex = Math.floor(Math.random() * eligibleVocab.length);
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
    console.log(obj)
    const keys = Object.keys(obj);
    console.log(keys)
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
  function makeStringReadable(names){
    names = names.replaceAll("_", ' ');
    return names
  }
function quizStyle6(){
  console.log("quizStyle6")
  wordToTest = ""
    const eligibleVocab = filteredVocabList.filter(entry => entry.conjugations&& entry.conjugations.type!="");
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
  let conjugationLists = [];
  console.log(correctVocab.word)
  if((getRandomNumber(1,9))>=8){
    questionText = "what is the group of " + correctVocab.word
    if( conjugations.group &&  conjugations.group!=""){
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
    quizType="groupTest"

    }
  }else{
    quizType="conjTest1"
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
      selectedKeys.forEach(field => {
          const subfield = getRandomSubfield(conjugations[field]);
          console.log(conjToTest)
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
      options = [correctAnswer];
      console.log(options);
      for (let i = 0; i<3;i++) {
          if (!options.includes(wrongAnswers)) {
          options.push(wrongAnswers[i]);
          }else{
          i--;
          }
      }
      wordToTest = commonWord
      correctConj=correctAnswer;
      shuffleArray(options);
      let names = conjToTest.toString();
      names = makeStringReadable(names)
      questionText = `What is one ${names} form of the word "${correctVocab.word}"?`
  }
 

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
  quizType="conjTest2"
  wordToTest=""
  const eligibleVocab = filteredVocabList.filter(entry => entry.conjugations&& entry.conjugations.type!="");
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
  console.log(correctVocab.word)
  wordToTest = getRandomWordFromConjugations(conjugations)
  const subFields = findSubfieldsForWord(wordToTest,conjugations)
  conjToTest = Object.values(subFields);
  correctAnswer = conjToTest.toString(); 
  correctAnswer = makeStringReadable(correctAnswer);
  let wrongAnswers = [];
  while (wrongAnswers.length < 3) {
    const wrongWord = getRandomWordFromConjugations(conjugations);
    console.log(wrongWord)
    const wrongConj = makeStringReadable(Object.values(findSubfieldsForWord(wrongWord,conjugations)).toString()); 
    if(!wrongAnswers.includes(wrongConj)&&!(wrongConj==correctAnswer)){
        wrongAnswers.push(wrongConj);
        }
    }
  currentQuizWord = correctVocab.word;
  currentQuizDefinition = correctAnswer;
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
 
  questionText = `What type of conjugation doe  the word "${wordToTest}" belong to?`



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
    console.log()
  
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
      document.getElementById('nextAfterIncorrectButton').style.display = 'Block';
    }
  }
  
  function showCorrectAnswer() {
    const vocabFlashcard = document.getElementById('correctDefinition');
    vocabFlashcard.style.display = 'block';
    const correctVocab = vocabList.find(entry => entry.word === currentQuizWord);
    console.log(correctVocab)
    if (correctVocab) {
      vocabFlashcard.innerHTML+= String.fromCodePoint(0x1F4A0);
      vocabFlashcard.textContent = `${correctVocab.word}: ${correctVocab.definition}`;
      if(correctVocab.gender && correctVocab.gender!=""){
        vocabFlashcard.textContent+= String.fromCodePoint(0x1F4A0);
        vocabFlashcard.textContent+= "gender:"
        vocabFlashcard.textContent+= correctVocab.gender
      }
      if(correctVocab.pronounciation && correctVocab.pronounciation!=""){
        vocabFlashcard.textContent+= String.fromCodePoint(0x1F4A0);
        vocabFlashcard.textContent+= "pronounciation:"
        vocabFlashcard.textContent+= correctVocab.pronounciation
      }
      
      if(correctVocab.conjugations.group){
        console.log()
        vocabFlashcard.innerHTML+=String.fromCodePoint(0x1F4A0);
        vocabFlashcard.textContent+= "group: "
        vocabFlashcard.textContent+= correctVocab.conjugations.group
      } if(conjToTest.length>0&&quizType=="conjTest1"){
        vocabFlashcard.innerHTML+= String.fromCodePoint(0x1F4A0);
        vocabFlashcard.textContent+= correctConj
        vocabFlashcard.textContent+= " is one of the "
        vocabFlashcard.textContent+= makeStringReadable(conjToTest.toString())
        vocabFlashcard.textContent+= " form of "
        vocabFlashcard.textContent+= correctVocab.word
      }if(conjToTest.length>0&&quizType=="conjTest2"){
        vocabFlashcard.innerHTML+= String.fromCodePoint(0x1F4A0);
        vocabFlashcard.textContent+= wordToTest
        vocabFlashcard.textContent+= " is one of the "
        vocabFlashcard.textContent+= makeStringReadable(conjToTest.toString())
        vocabFlashcard.textContent+= " form of "
        vocabFlashcard.textContent+= correctVocab.word
      }
      vocabFlashcard.innerHTML+= String.fromCodePoint(0x1F4A0);
      document.getElementById('quizContainer').style.display = 'none';
      vocabFlashcard.style.display = 'block';
    }
  }
  function checkTrueFalse(isTrue) {
    const correctMessage = document.getElementById('correctMessage');
    const incorrectMessage = document.getElementById('incorrectMessage');
    const correctDefinition = document.getElementById('correctDefinition');
   
    if (isTrue === isPairCorrect) {
      
      correctMessage.style.display = 'block';
      setTimeout(() => {
        correctMessage.style.display = 'none';
        showNextItem();
      }, 500);
    } else {
      incorrectMessage.style.display = 'block';
      showCorrectAnswer();
      document.getElementById('nextAfterIncorrectButton').style.display = 'block';
  
    }
    document.getElementById('trueFalseContainer').style.display = 'none';
  
  }
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  function removeCurrentVocab() {
    if (currentVocabIndex !== null) {
      filteredVocabList.splice(currentVocabIndex, 1);
  
      chrome.storage.local.set({ filteredVocabList: vocabList }, function() {
        console.log(`Removed "${currentQuizWord}" from the filtered vocab list.`);
      });
    }
  }