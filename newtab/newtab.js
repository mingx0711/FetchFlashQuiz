
document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.local.get('currentCollectionSelection', function(data){
    currentCollectionSelection = data.currentCollectionSelection || []
  });
  chrome.storage.sync.get(['selectedPalette'], function(result) {
    if (result.selectedPalette) {
        changeColor(result.selectedPalette);
    } else {
        changeColor('Basic'); // Default to palette1 if no previous selection
    }
});
  chrome.storage.local.get('vocabList', function(data) {
    if (data.vocabList) {
      vocabList = data.vocabList;
      currentVocabIndex = -1;
    }
    showNextItem(currentCollectionSelection);
  });

  document.getElementById('snoozeButton').addEventListener('click', function() {
    snoozeCurrentVocab();
  });

  document.getElementById('nextButton').addEventListener('click', function() {
    showNextItem(currentCollectionSelection);
  });

  document.getElementById('nextAfterIncorrectButton').addEventListener('click', function() {
    document.getElementById('incorrectMessage').style.display = 'none';
    document.getElementById('correctDefinition').style.display = 'none';
    document.getElementById('nextAfterIncorrectButton').style.display = 'none';
    showNextItem();
  });
  document.querySelectorAll('.ui.color-option.button').forEach(button => {
    button.addEventListener('click', function() {
        const palette = this.getAttribute('data-palette');
        changeColor(palette);
    });
});
  document.querySelectorAll('.quiz-option').forEach(button => {
    button.addEventListener('click', function() {
      checkAnswer(button);
    });
  });

  document.getElementById('trueButton').addEventListener('click', function() {
    checkTrueFalse(true);
  });
  document.getElementById('testButton').addEventListener('click', function() {
    chrome.tabs.create({ url: 'test1/test1.html' });
  });
  document.getElementById('falseButton').addEventListener('click', function() {
    checkTrueFalse(false);
  });
  chrome.storage.sync.get({ bookList: [] }, (result) => {
    chrome.storage.sync.get({ currentCollectionSelection}, (data)=> {
    selectedbooks = data.currentCollectionSelection || ""
    console.log(selectedbooks)
    const bookList = result.bookList;
    console.log(bookList)
    displayBookList.innerHTML = '';
    bookList.forEach(book => {
        let checkboxContainer = document.createElement('div');
        checkboxContainer.className = 'checkbox-container';
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = book;
        if(selectedbooks.includes(book)){
          checkbox.checked = true;
        }else{
          checkbox.checked = false;
        }
         // All books are checked by default
        checkbox.addEventListener('change', updateCheckedBooks);
        let label = document.createElement('label');
        label.htmlFor = book;
        label.textContent = book;
        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(label);
        checkboxContainer.classList.add("ui","checkbox")
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
function showNextItem(checkBooks = ["all"]) {

  if (newtab){
    //to avoid err
    newtab = false;
    showNextVocab(currentCollectionSelection);
  }else{
    const eligibleForQuiz = vocabList.length>=4 && vocabList.some(entry => entry.seen > 3);
    const probs =  (vocabList.filter(entry => entry.seen > 3).length) / (vocabList.length);
    //const shouldShowQuiz = true
    const shouldShowQuiz = (Math.random() < Math.min(probs, 0.3)) && eligibleForQuiz;
  
    if (shouldShowQuiz) {
      showQuiz();
    } else {
      showNextVocab(currentCollectionSelection);
    }
  }
}

function changeColor(palette){
  const colors = {
    Orange: {
      vocabFlashcardBg: '#ffffff',
      wordDivColor: '#3c180e',
      defDivColor: '#8a3b22',
      Snooze:'#edab84',
      borderColor:'#d05f26',
      shadow: '12px 12px 2px 0px #f7d9b1',
      buttonShadow: '4px 4px 1px 0px #7d1e11'

    },
    Yellow: {
      vocabFlashcardBg: '#fbfbee',
      wordDivColor: '#343c2b',
      defDivColor: '#d39600',
      Snooze:'#f4c200',
      borderColor:'#cd8e01',
      shadow: '12px 12px 2px 0px #f4c200',
      buttonShadow: '4px 4px 1px 0px #a86a00'

    },
    Green: {
      vocabFlashcardBg: '#ffffff',
      wordDivColor: '#432705',
      defDivColor: '#638b57',
      Snooze:'#c0e175',
      borderColor:'#25943a',
      shadow: '12px 12px 2px 0px #6dbb72',
      buttonShadow: '4px 4px 1px 0px #155710'

    },
    Teal: {
      vocabFlashcardBg: '#effefb',
      wordDivColor: '#0e1f20',
      defDivColor: '#1b3939',
      Snooze:'#a3c8bf',
      borderColor:'#225a55',
      shadow: '12px 12px 2px 0px #4b8176',
      buttonShadow: '4px 4px 1px 0px #2b4440'

    },
    Violet: {
      vocabFlashcardBg: '#f3f7fa',
      wordDivColor: '#292d3d',
      defDivColor: '#474e68',
      Snooze:'#b6c2dd',
      borderColor:'#636c9f',
      shadow: '12px 12px 2px 0px #96a5e3',
      buttonShadow: '4px 4px 1px 0px #636c9f'

    },
    Purple: {
      vocabFlashcardBg: '#f7f6fc',
      wordDivColor: '#37284d',
      defDivColor: '#573e74',
      Snooze:'#c1b0e3',
      borderColor:'#8f65c2',
      shadow: '12px 12px 2px 0px #ae82ca',
      buttonShadow: '4px 4px 1px 0px #6b498e'
    },
    Pink: {
      vocabFlashcardBg: '#fcf4f6',
      wordDivColor: '#3b1625',
      defDivColor: '#6c2f4a',
      Snooze:'#e8b9c5',
      borderColor:'#b24c6f',
      shadow: '12px 12px 2px 0px #e18ba2',
      buttonShadow: '4px 4px 1px 0px #933d5f'
    },
    Basic: {
      vocabFlashcardBg: '#f8f8f8',
      wordDivColor: '#292929',
      defDivColor: '#3d3d3d',
      Snooze:'#dcdcdc',
      borderColor:'#525252',
      shadow: '12px 12px 2px 0px #656565',
      buttonShadow: '4px 4px 1px 0px #464646'
    },
    y2k: {
      vocabFlashcardBg: '#f8efc9',
      wordDivColor: '#7f1c48',
      defDivColor: '#368efb',
      Snooze:'#aeffb9',
      borderColor:'#fea9f3',
      shadow: '12px 12px 2px 0px #174fde',
      buttonShadow: '4px 4px 1px 0px #c20e3b'
    },
    bear: {
      vocabFlashcardBg: '#f9f7f3',
      wordDivColor: '#2e231c',
      defDivColor: '#574537',
      Snooze:'#bdaa89',
      borderColor:'#82664c',
      shadow: '12px 12px 2px 0px #6a5342',
      buttonShadow: '4px 4px 1px 0px #82664c'
    },
    calico: {
      vocabFlashcardBg: '#ffffff',
      wordDivColor: '#291b05',
      defDivColor: '#8b4521',
      Snooze:'#e1882e',
      borderColor:'#3d1c0d',
      shadow: '12px 12px 2px 0px #e1882e',
      buttonShadow: '4px 4px 1px 0px #3d1c0d'
    }
  };
  const selectedPalette = colors[palette];
  document.querySelectorAll('.flashcard').forEach(element => {
    element.style.borderColor  = selectedPalette.borderColor;
    element.style.backgroundColor = selectedPalette.vocabFlashcardBg;
    element.style.boxShadow = selectedPalette.shadow;
  });
  document.getElementById('wordDiv').style.color = selectedPalette.wordDivColor;
  document.getElementById('defDiv').style.color = selectedPalette.defDivColor;
  document.getElementById('pronounDiv').style.color = selectedPalette.defDivColor;
  document.getElementById('genderDiv').style.color = selectedPalette.defDivColor;

  document.getElementById('quizContainer').style.borderColor= selectedPalette.borderColor;
  document.getElementById('quizContainer').style.backgroundColor= selectedPalette.vocabFlashcardBg;
  document.getElementById('quizContainer').style.boxShadow= selectedPalette.shadow;

  document.getElementById('trueFalseContainer').style.borderColor= selectedPalette.borderColor;
  document.getElementById('trueFalseContainer').style.backgroundColor= selectedPalette.vocabFlashcardBg;
  document.getElementById('trueFalseContainer').style.boxShadow= selectedPalette.shadow;

  document.querySelectorAll('trueFalseContainer').forEach(element => {
    element.style.borderColor  = selectedPalette.borderColor;
    element.style.backgroundColor = selectedPalette.vocabFlashcardBg;
    element.style.boxShadow = selectedPalette.shadow;
  });
  document.querySelectorAll('.quiz-option').forEach(element => {
    element.style.color = selectedPalette.defDivColor;
    element.style.backgroundColor = selectedPalette.Snooze;
  });
  document.getElementById('trueButton').style.color= selectedPalette.Snooze;
  document.getElementById('trueButton').style.boxShadow= selectedPalette.shadow;
  
  document.getElementById('falseButton').style.color= selectedPalette.Snooze;
  document.getElementById('falseButton').style.boxShadow= selectedPalette.shadow;

  document.getElementById('testButton').style.backgroundColor = selectedPalette.Snooze;
  document.getElementById('testButton').style.boxShadow = selectedPalette.buttonShadow;

  document.getElementById('snoozeButton').style.backgroundColor = selectedPalette.Snooze;
  document.getElementById('snoozeButton').style.boxShadow = selectedPalette.buttonShadow;
  document.getElementById('divider').style.backgroundColor = selectedPalette.Snooze;
  document.getElementById('nextButton').style.backgroundColor = selectedPalette.Snooze;
  document.getElementById('nextButton').style.boxShadow = selectedPalette.buttonShadow;
  document.getElementById('nextAfterIncorrectButton').style.backgroundColor = selectedPalette.Snooze;
  document.getElementById('nextAfterIncorrectButton').style.boxShadow = selectedPalette.buttonShadow;



  chrome.storage.sync.set({selectedPalette: palette}, function() {
    console.log('Palette saved:', palette);
});

}
function showNextVocab(collection = currentCollectionSelection) {
  console.log("current collection", collection)
  let currentCollection = [];
  document.getElementById('quizContainer').style.display = 'none';
  document.getElementById('trueFalseContainer').style.display = 'none';
  document.getElementById('matchContainer').style.display = 'none';

  document.getElementById('snoozeButton').style.display = '';
  document.getElementById('nextButton').style.display = '';
  correctDefinition.style.display = 'None';
  if (collection[0]==="all"||collection.length == 0){
    currentCollection = vocabList;
  }else{
    currentCollection = vocabList.filter(item => collection.includes(item.book) );
  }
  const startIndex = currentVocabIndex === null ? -1 : currentVocabIndex;
  let nextIndex = (startIndex + 1) % currentCollection.length;
  console.log("current collection",currentCollection.length)
  if(currentCollection.length == 0){
    let wordDiv = document.getElementById('wordDiv');
    wordDiv.innerHTML = "No available words yet"
    document.getElementById('vocabFlashcard').style.display = 'block';
    let defDiv = document.getElementById('defDiv');
    defDiv.innerHTML = "No available vocabs under current collection selection"
    let bookDiv = document.getElementById('bookDiv');
    bookDiv.textContent = "";

  }else{
    if (nextIndex === startIndex) {
      // All items are snoozed or there are no items left
      const vocabFlashcard = document.getElementById('vocabFlashcard');
      currentVocabIndex = null;
    } else {
      currentVocabIndex = Math.floor(Math.random()*currentCollection.length);
      while (nextIndex !== startIndex && currentCollection[currentVocabIndex].snoozed) {
        currentVocabIndex = (nextIndex + 1) % currentCollection.length;
        console.log("le word has been snoozy shouldnt show up ")
      }
      if(currentCollection[currentVocabIndex].seen>=200){
        if(Math.random()<0.9){
          console.log(currentCollection[currentVocabIndex].word + "has been seen too many times therefore skipped")
          currentVocabIndex = Math.floor(Math.random()*vocabList.length);
        }
      }
      if(currentCollection[currentVocabIndex].seen>=100){
        if(Math.random()<0.75){
          console.log(currentCollection[currentVocabIndex].word + "has been seen too many times therefore skipped")
          currentVocabIndex = Math.floor(Math.random()*vocabList.length);
        }
      }
      if(currentCollection[currentVocabIndex].seen>=50){
        if(Math.random()<0.5){
          console.log(currentCollection[currentVocabIndex].word + "has been seen too many times therefore skipped")
          currentVocabIndex = Math.floor(Math.random()*vocabList.length);
        }
      }
      
      console.log(currentCollection[currentVocabIndex]);
      const vocabFlashcard = document.getElementById('vocabFlashcard');
      let wordDiv = document.getElementById('wordDiv');
      let defDiv = document.getElementById('defDiv');
      let bookDiv = document.getElementById('bookDiv');
      let pronounDiv = document.getElementById('pronounDiv');
      let genderDiv = document.getElementById('genderDiv');
      let word;
      let definition
      if (Math.random()<=0.5){
        const wordObject = currentCollection[currentVocabIndex];
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
      // Increment the seen count
      const match = vocabList.find(item => item.word === currentCollection[currentVocabIndex].word);
      match.seen += 1;
      chrome.storage.local.set({ vocabList: vocabList }, function() {
        console.log(`Incremented seen count for "${word}".`);
      });
  
      // Show vocab card and hide quiz
      document.getElementById('quizContainer').style.display = 'none';
      vocabFlashcard.style.display = 'block';
    }
  } 
}
window.addEventListener('resize', adjustFontSize);
adjustFontSize();

function adjustFontSize(){
  const screenWidth = window.innerWidth;
  let fontSize1 = screenWidth / 29;
  document.getElementById('defDiv').style.fontSize = fontSize1 + 'px';
  const options = document.querySelectorAll('.quiz-option');
  options.forEach(option => {
    option.style.fontSize = fontSize1;  // Set font size to 24px
  });
}

function snoozeCurrentVocab() {
  if (currentVocabIndex !== null && currentVocabIndex !== -1) {
    vocabList[currentVocabIndex].snoozed = true;

    // Save updated vocab list to Chrome storage
    chrome.storage.local.set({ vocabList: vocabList }, function() {
      console.log(`Snoozed "${vocabList[currentVocabIndex].word}".`);
      showNextItem();  // Show the next item (vocab or quiz)
    });
  }
}

function showQuiz() {
  const quizStyle = Math.floor(Math.random() * 10);
  console.log(quizStyle);
  switch(quizStyle){
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
  }
}
function updateQuizResults(result,word) {
  console.log(result,word)
  for (const item of vocabList) {
    if (item.word === word) {
      console.log(item)
      let quizResults = item.quizResults;
      quizResults.unshift(result);
      if (quizResults.length > 4) {
        quizResults.pop(); // Remove the oldest result to keep only the first 4
      }
      chrome.storage.local.set({ vocabList: vocabList }, function() {
      console.log(`Updated quiz results for "${item.word}": ${quizResults}`);
    });
    }
}
}
function quizStyle1(){
  console.log("quiz style 1")
  const eligibleVocab = vocabList.filter(entry => entry.seen > 3);
  if (eligibleVocab.length < 1) {
    showNextVocab();
    return;
  }
  const quizIndex = Math.floor(Math.random() * eligibleVocab.length);
  const correctVocab = eligibleVocab[quizIndex];
  currentQuizWord = correctVocab.word;
  const options = [correctVocab.definition];
  for (let i = 0; i<3;i++) {    
    const randomIndex = Math.floor(Math.random() * vocabList.length);
    const randomDefinition = vocabList[randomIndex].definition;
    if (!options.includes(randomDefinition)) {
      options.push(randomDefinition);
    }else{
      i--;
    }
  }

  shuffleArray(options);

  document.getElementById('quizQuestion').textContent = `What is the definition of "${correctVocab.word}"?`;
  document.getElementById('option1').textContent = options[0];
  document.getElementById('option2').textContent = options[1];
  document.getElementById('option3').textContent = options[2];
  document.getElementById('option4').textContent = options[3];

  document.getElementById('quizContainer').dataset.correctAnswer = correctVocab.definition;
  document.getElementById('quizContainer').dataset.correctWord = correctVocab.word;

  // Show quiz and hide vocab card
  document.getElementById('quizContainer').style.display = 'block';
  document.getElementById('vocabFlashcard').style.display = 'none';
  document.getElementById('correctMessage').style.display = 'none';
  document.getElementById('incorrectMessage').style.display = 'none';
  document.getElementById('correctDefinition').style.display = 'none';
  document.getElementById('nextAfterIncorrectButton').style.display = 'none';
}
function quizStyle2(){
 console.log("Quiz Style 2: Ask for the word given a definition");
 const eligibleVocab = vocabList.filter(entry => entry.seen > 3);
 if (eligibleVocab.length < 1) {
   showNextVocab();
   return;
 }

 const quizIndex = Math.floor(Math.random() * eligibleVocab.length);
 const correctVocab = eligibleVocab[quizIndex];
 currentQuizWord = correctVocab.word;
 currentQuizDefinition = correctVocab.definition;
 quizType = 'word';
 console.log(currentQuizWord);

 const options = [correctVocab.word];
 for (let i = 0; i<3;i++) {    
  const randomIndex = Math.floor(Math.random() * vocabList.length);
   const randomWord = vocabList[randomIndex].word;
   if (!options.includes(randomWord)) {
     options.push(randomWord);
   }else{
    i--;
   }
 }

 shuffleArray(options);

 document.getElementById('quizQuestion').textContent = `What is the word for "${correctVocab.definition}"?`;
 document.getElementById('option1').textContent = options[0];
 document.getElementById('option2').textContent = options[1];
 document.getElementById('option3').textContent = options[2];
 document.getElementById('option4').textContent = options[3];

 document.getElementById('quizContainer').dataset.correctAnswer = correctVocab.word;
 document.getElementById('quizContainer').dataset.correctWord = correctVocab.word;

 // Show quiz and hide vocab card
 document.getElementById('quizContainer').style.display = 'block';
 document.getElementById('vocabFlashcard').style.display = 'none';
 document.getElementById('correctMessage').style.display = 'none';
 document.getElementById('incorrectMessage').style.display = 'none';
 document.getElementById('correctDefinition').style.display = 'none';
 document.getElementById('nextAfterIncorrectButton').style.display = 'none';

}
function quizStyle3(){
// Quiz Style 3: True or False
const eligibleVocab = vocabList.filter(entry => entry.seen > 3);
if (eligibleVocab.length < 1) {
  showNextVocab();
  return;
}

const quizIndex = Math.floor(Math.random() * eligibleVocab.length);
const correctVocab = eligibleVocab[quizIndex];
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
function quizStyle4(){
  console.log("4, ask for pronounciation")
  const eligibleVocab = vocabList.filter(entry => entry.seen > 3 && entry.pronounciation&& entry.pronounciation!="");
  const eligibleOptions = vocabList.filter(entry => entry.pronounciation&& entry.pronounciation!="");
  const numberOfDifferentTypes = new Set(eligibleOptions.map(item => item.pronounciation)).size;
  console.log("numberOfDifferentTypesQuiz4",numberOfDifferentTypes)

  console.log(eligibleOptions)
  if (eligibleVocab.length < 1 || numberOfDifferentTypes <3 || eligibleOptions.length<3) {
    showNextVocab();
    return;
  }

  const quizIndex = Math.floor(Math.random() * eligibleVocab.length);
  const correctVocab = eligibleVocab[quizIndex];
  currentQuizWord = correctVocab.word;
  console.log(currentQuizWord);
  currentQuizDefinition = correctVocab.pronounciation;
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
  console.log("5, ask for gender")
  const eligibleVocab = vocabList.filter(entry => entry.seen > 3 && entry.gender&& entry.gender!=""&&entry.gender!="undefined");
  const numberOfDifferentTypes = new Set(vocabList.map(item => item.gender)).size;
  console.log("numberOfDifferentTypes",numberOfDifferentTypes)
  console.log(eligibleVocab)
  const eligibleOptions = vocabList.filter(entry => entry.gender&& entry.gender!=""&&entry.gender!="undefined");

  if (eligibleVocab.length < 1 || numberOfDifferentTypes <2) {
    showNextVocab();
    return;
  }
  const quizIndex = Math.floor(Math.random() * eligibleVocab.length);
  const correctVocab = eligibleVocab[quizIndex];
  currentQuizWord = correctVocab.word;
  currentQuizDefinition = correctVocab.gender.toLowerCase();
  quizType = 'truefalse';
  
  isPairCorrect = Math.random() < 0.5;
  
  if (!isPairCorrect) {
    let incorrectVocab;
    do {
      const randomIndex = Math.floor(Math.random() * eligibleOptions.length);
      incorrectVocab = eligibleOptions[randomIndex];
    } 
    while (incorrectVocab.word === currentQuizWord);
    do {
      const randomIndex = Math.floor(Math.random() * eligibleOptions.length);
      incorrectVocab = eligibleOptions[randomIndex];
    } 
    while (incorrectVocab.gender.toLowerCase() === currentQuizWord.gender.toLowerCase());
    
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
  //given word, find inflection
  console.log("type 6, given word, find inflection")
  const eligibleVocab = vocabList.filter(entry => entry.conjugations&& entry.conjugations.type!="");
  if(eligibleVocab.length<1){
    return quizStyle3();
  }
  if (currentVocabIndex === null || currentVocabIndex >= vocabList.length - 1) {
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
  if((getRandomNumber(1,9))>=8){
    if(conjugations.group&&conjugations.group!=""){

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
      quizType="6"
    }
  }else{
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
  currentVocabIndex = vocabList.indexOf(correctVocab);
  currentQuizWord = correctVocab.word;
  currentQuizDefinition = correctAnswer;

    document.getElementById('quizQuestion').textContent = questionText;
    document.getElementById('option1').textContent = options[0];
    document.getElementById('option2').textContent = options[1];
    document.getElementById('option3').textContent = options[2];
    document.getElementById('option4').textContent = options[3];

    document.getElementById('quizContainer').dataset.correctAnswer =correctAnswer;
    document.getElementById('quizContainer').dataset.correctWord =correctVocab.word;
    // Show quiz and hide vocab card
    document.getElementById('quizContainer').style.display = 'block';
    document.getElementById('vocabFlashcard').style.display = 'none';
    document.getElementById('correctMessage').style.display = 'none';
    document.getElementById('incorrectMessage').style.display = 'none';
    document.getElementById('correctDefinition').style.display = 'none';
    document.getElementById('nextAfterIncorrectButton').style.display = 'none';
}
function quizStyle7(){
  //given inflection, find word
  console.log("type 7, given inflection, find word")
  wordToTest=""
  const eligibleVocab = vocabList.filter(entry => entry.conjugations&& entry.conjugations.type!="");
  if(eligibleVocab.length<1){
    return quizStyle1();
  }
  if (currentVocabIndex === null || currentVocabIndex >= vocabList.length - 1) {
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
  currentVocabIndex = vocabList.indexOf(correctVocab);
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
  document.getElementById('quizContainer').dataset.correctWord =correctVocab.word;

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
  const correctWord = document.getElementById('quizContainer').dataset.correctWord;
  const correctMessage = document.getElementById('correctMessage');
  const incorrectMessage = document.getElementById('incorrectMessage');
  const correctDefinition = document.getElementById('correctDefinition');
  const result = button.textContent === correctAnswer ? 't' : 'f';
  updateQuizResults(result,correctWord);

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
  console.log(quizType)
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
    if(conjToTest.length>0&&quizType=="6"){
      vocabFlashcard.innerHTML+= String.fromCodePoint(0x1F4A0);
      vocabFlashcard.textContent+= correctConj
      vocabFlashcard.textContent+= " is one of the "
      vocabFlashcard.textContent+= makeStringReadable(conjToTest.toString())
      vocabFlashcard.textContent+= "form of "
      vocabFlashcard.textContent+= correctVocab.word
    }if(conjToTest.length>0&&quizType=="7"){
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
 
  document.getElementById('snoozeButton').style.display = 'none';
  document.getElementById('nextButton').style.display = 'none';
  if (isTrue === isPairCorrect) {
    updateQuizResults('t',currentQuizWord);
    correctMessage.style.display = 'block';
    setTimeout(() => {
      correctMessage.style.display = 'none';
      showNextItem();
    }, 1000);
  } else {
    updateQuizResults('f',currentQuizWord);

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
function getCheckedBooks(){
  let checkedBooks = [];
  let bookList = [];
  chrome.storage.sync.get({ bookList: [] }, (result) => {
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
  chrome.storage.local.set({ currentCollectionSelection:  currentCollectionSelection}, function() {
  });
  showNextItem(getCheckedBooks());
}
