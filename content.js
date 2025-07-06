chrome.storage.sync.get(['vocabList'], function (result) {
  const vocabList = result.vocabList || [];
  if (vocabList.length > 0) {
    const randomIndex = Math.floor(Math.random() * vocabList.length);
    const word = vocabList[randomIndex].word;
    const definition = vocabList[randomIndex].definition;

    const flashcard = document.createElement('div');
    flashcard.style.position = 'fixed';
    flashcard.style.top = '120px';
    flashcard.style.right = '10px';
    flashcard.style.padding = '20px';
    flashcard.style.backgroundColor = 'white';
    flashcard.style.border = '3px solid black';
    flashcard.style.zIndex = '10000';
    flashcard.style.fontSize = 'xx-large';
    flashcard.innerHTML = `<strong>${word}</strong>: ${definition}`;

    document.body.appendChild(flashcard);

    setTimeout(() => {
      flashcard.remove();
    }, 5000);
  }
});