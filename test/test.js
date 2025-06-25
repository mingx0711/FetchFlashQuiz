let currentVocabIndex = null;
let vocabList = [];
let currentQuizWord = null;
let currentQuizDefinition = null;
let quizType = null;
let isPairCorrect = null;
let filteredVocabList =[]
let totalNoCount = null;
let currentQuizNo = 0;
let correctCount = 0;
let totalCount = 0;
document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.local.get('vocabList', function(data) {
    if (data.vocabList) {
      vocabList = data.vocabList;
      currentVocabIndex = -1;
      
      if(vocabList.length<4){
        //console.log("novocab1");
        document.getElementById('vocabFlashcard').textContent = "Come back after theres more vocabs";
      }else{
        filteredVocabList = vocabList.filter(vocab => {
          const results = vocab.quizResults || [];
          return results.filter(result => result === 'f').length > 1;
        });
        //console.log(filteredVocabList.length)
        const focusedWords = vocabList.filter(w => w.focus === true);
        filteredVocabList = [...new Set([...filteredVocabList, ...focusedWords])];
        //console.log(filteredVocabList.length)
        totalNoCount = filteredVocabList.length;
        //console.log(filteredVocabList)
        document.getElementById('wrongCountDiv').textContent = `"${currentQuizNo}" / ${totalNoCount}"`;
        //console.log(filteredVocabList)
        if (filteredVocabList.length === 0) {
          document.getElementById('vocabFlashcard').textContent = "No vocabulary to test.";
          document.getElementById('nextButton').style.display = 'none';
          return;
        }
      }
      showNextItem();
    }
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
    //console.log("vocabList");

    const quizStyle = Math.floor(Math.random() * 5);
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
    }
  }
}

function quizStyle1() {
  // Quiz Style 1: Ask for the definition of a word
  if (currentVocabIndex === null || currentVocabIndex >= filteredVocabList.length - 1) {
    currentVocabIndex = 0;
  } else {
    currentVocabIndex++;
  }
  //console.log(filteredVocabList[currentVocabIndex].word);

  const correctVocab = filteredVocabList[currentVocabIndex];
  currentQuizWord = correctVocab.word;
  currentQuizDefinition = correctVocab.definition;
  quizType = 'definition';

  const options = [correctVocab.definition];
  
  //console.log(filteredVocabList[currentVocabIndex].word);
  //console.log(options);
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
  //console.log(filteredVocabList[currentVocabIndex].word);

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
      currentVocabIndex++;
    }
  
    const correctVocab = filteredVocabList[currentVocabIndex];
    currentQuizWord = correctVocab.word;
    currentQuizDefinition = correctVocab.definition;
    quizType = 'word';
  
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
      currentVocabIndex++;
    }
  
    const correctVocab = filteredVocabList[currentVocabIndex];
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
      }, 2000);
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
    if (correctVocab) {
      vocabFlashcard.textContent = `${correctVocab.word}: ${correctVocab.definition}`;
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
      }, 300);
    } else {
      updateQuizResults('f');
  
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
  function updateQuizResults(result) {
    totalCount += 1;
    if (currentVocabIndex !== null && filteredVocabList[currentVocabIndex].quizResults) {
      let quizResults =  filteredVocabList[currentVocabIndex].quizResults;
      quizResults.unshift(result);
      if (quizResults.length > 4) {
        quizResults.pop(); // Remove the oldest result to keep only the last 4
      }
      const match = vocabList.find(item => item.word === filteredVocabList[currentVocabIndex].word);
      //console.log(match.word)
      if(match){
        match.quizResults =quizResults;
      }
      chrome.storage.local.set({ vocabList: vocabList }, function() {
        //console.log(`Updated quiz results for "${match.word}": ${quizResults}`);
      });
    }
    if (result === 't'){
      correctCount += 1;
      currentQuizNo += 1;
      //removeCurrentVocab();
    }
  }
  
  function removeCurrentVocab() {
    if (currentVocabIndex !== null) {
      filteredVocabList.splice(currentVocabIndex, 1);
  
      chrome.storage.local.set({ filteredVocabList: vocabList }, function() {
        //console.log(`Removed "${currentQuizWord}" from the filtered vocab list.`);
      });
    }
  }