
document.getElementById('addVocabForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const word = document.getElementById('word').value;
  const definition = document.getElementById('definition').value;
  const book = document.getElementById('bookSelector').value;
  const pronounciation = document.getElementById('pronounciation').value;
  const gender = document.getElementById('gender').value;
  lastBook = book;
  // Get existing vocab data from Chrome storage
  chrome.storage.local.get('vocabList', function(data) {
    let vocabList = data.vocabList || [];
    //console.log(data.vocabList)
    if(book === "add New Vocab collection"||book ==="addNew"){
      book = "Default"
    }
    chrome.storage.local.set({ lastBook: book });
    lastBook = book;
    console.log(book)
    
    populateBookSelector()
    // Append the new word, definition, snoozed field, and seen field
    vocabList.push({ word, definition, snoozed: false , book, gender,pronounciation,seen: 0, quizResults: ['n','n','n','n']});
    // Save updated vocab list to Chrome storage
    chrome.storage.local.set({ vocabList: vocabList }, function() {
      updateVocabList(vocabList);
      // Clear form fields
      document.getElementById('addVocabForm').reset();
    });
  });
});
document.getElementById('testConj').addEventListener('click', function() {
  chrome.tabs.create({ url: 'conjTest/conjTest.html' });
});

document.getElementById("importButton").addEventListener("click", function() {
  chrome.tabs.create({ url: 'inflections/inflections.html' });
});
document.getElementById('clearButton').addEventListener('click', function() {
  chrome.storage.local.clear(function() {
    console.log('Chrome storage local data cleared');
    updateVocabList([]);  // Clear the displayed list
  });
});
document.getElementById('startTestButton').addEventListener('click', function() {
  chrome.tabs.create({ url: 'test/test.html' });
});


function updateVocabList(vocabList, collection = ["all"]) {
  const vocabListContainer = document.getElementById('vocabList');
  vocabListContainer.innerHTML = '';
  if (collection[0]!="all"){
    selectedVocab = vocabList.filter(item => collection.includes(item.book) );
  }else{
    selectedVocab = vocabList
  }
  
  console.log(selectedVocab);
  selectedVocab.forEach((entry, index) => {
    if (entry.word && entry.definition) {
      const vocabDiv  = document.createElement('div');
      vocabDiv .className = 'flashcard';
      //vocabDiv .textContent = `${entry.word}: ${entry.definition} (Seen: ${entry.seen}, Snoozed: ${entry.snoozed})`;
 
      const wordDiv = document.createElement('div');
      wordDiv.textContent = ` ${entry.word}`;
      wordDiv.style.width = '20vw';
      wordDiv.style.fontSize = '160%';
      wordDiv.style.marginRight  = '10px';
      
      if(entry.pronounciation!=""&&entry.pronounciation!=undefined){
        const pronounciationDiv = document.createElement('div');
        pronounciationDiv.textContent =  `${entry.pronounciation}`;
        pronounciationDiv.style.fontSize = '70%';
        wordDiv.appendChild(pronounciationDiv);
      }
      if(entry.gender!=""&&entry.gender!=undefined){
        const genderDiv = document.createElement('div');
        genderDiv.textContent =  `${entry.gender}`;
        genderDiv.style.fontSize = '60%';
        wordDiv.appendChild(genderDiv);
      }


 
      const definitionDiv = document.createElement('div');
      definitionDiv.textContent = `${entry.definition}`;
      definitionDiv.style.width = '20vw';
      definitionDiv.style.fontSize = '160%';
      definitionDiv.style.marginRight  = '10px';

      const bookDiv = document.createElement('div');
      bookDiv.textContent = `${entry.book}`;
      bookDiv.style.width = '10vw';
      bookDiv.style.fontSize = '100%';
      bookDiv.style.marginRight  = '10px';
  
      const quizResultsDiv = document.createElement('div');
      quizResultsDiv.className = 'quiz-results';
      quizResultsDiv.textContent = '';
      const results = entry.quizResults || [];
      for (let i = 0; i < 4; i++) {
        let resultEmoji = String.fromCodePoint(0x02754);
        if (results[i] === 't') {
          resultEmoji = String.fromCodePoint(0x02705);
        } else if (results[i] === 'f') {
          resultEmoji = String.fromCodePoint(0x0274C);
        }
        quizResultsDiv.textContent += resultEmoji;
      }
      quizResultsDiv.style.width = '25vw';

      const deleteButton = document.createElement('button');
      deleteButton.classList.add("ui","button");
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', function() {
        console.log(entry.word)
        vocabList = vocabList.filter(item => item.word !== entry.word);
        chrome.storage.local.set({ vocabList: vocabList }, function() {
          updateVocabList(vocabList,collection);  // Update the displayed list
        });
      });

      const snoozeButton = document.createElement('button');
      snoozeButton.classList.add("ui","button");
      snoozeButton.style.width = '100px'
      snoozeButton.textContent = entry.snoozed ? 'Unsnooze' : 'Snooze';
      snoozeButton.addEventListener('click', function() {
        const match = vocabList.find(item => item.word === vocabList[index].word)
        match.snoozed = !match.snoozed;
        chrome.storage.local.set({ vocabList: vocabList }, function() {
          updateVocabList(vocabList);  // Update the displayed list
        });
      });
      vocabDiv.appendChild(wordDiv);
      vocabDiv.appendChild(definitionDiv);
      vocabDiv.appendChild(bookDiv);

      vocabDiv.appendChild(quizResultsDiv);
      vocabDiv.appendChild(deleteButton);
      vocabDiv.appendChild(snoozeButton);
      vocabListContainer.appendChild(vocabDiv);
    }
  });
}
function getCheckedBooks(){
  checkedBooks = [];
  document.querySelectorAll('#displayBookList input[type="checkbox"]').forEach(checkbox => {
      if (checkbox.checked) {
          checkedBooks.push(checkbox.id);
      }
  });
  return checkedBooks;
}
function updateCheckedBooks() {
  
  chrome.storage.local.get('vocabList', function(data) {
    vocabList = data.vocabList || [];
    updateVocabList(vocabList,getCheckedBooks());
  })
}
function sortVocabList(vocabList, sortBy) {
  if (sortBy === ''){
    return vocabList;
  }
  else if (sortBy === 'newest') {
    return vocabList.slice().reverse();
  }
  else {
    return vocabList.slice().sort((a, b) => {
      if (sortBy === 'incorrect') {
        const aIncorrectCount = (a.quizResults || []).filter(result => result === 'f').length;
        const bIncorrectCount = (b.quizResults || []).filter(result => result === 'f').length;
        return bIncorrectCount - aIncorrectCount;
      } else if (sortBy === 'seen') {
        return a.seen - b.seen;
      } 
    });

  }
}
function populateBookSelector2() {
  chrome.storage.sync.get({ bookList: [] }, (result) => {
    
    const bookList = result.bookList;
    document.getElementById('bookSelector2').innerHTML = ""
    // Clear existing options except for the default option
    // Add books as options
    bookList.forEach(book => {
        let option = document.createElement('option');
        option.innerHTML = `<option value='${book}'>${book}</option>`;
        document.getElementById('bookSelector2').add(option);
      });
  });
}
function populateBookSelector() {
  chrome.storage.sync.get({ bookList: [] }, (result) => {
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
      optionNew = document.createElement('option');
      optionNew.textContent = "add New Vocab collection";
      optionNew.value = "addNew";

      document.getElementById('bookSelector').add(optionNew)
      }
    });
    
  });
}
function convertToCSV() {
  chrome.storage.local.get('vocabList', function(data) {
  const headers = Object.keys(data.vocabList[0]);
  const rows = data.vocabList.map(obj => 
      headers.map(header => 
          Array.isArray(obj[header]) ? obj[header].join(';') : obj[header]
      )
  );

  return [
      headers.join(','), // header row first
      ...rows.map(row => row.join(','))
  ].join('\n');
  });
}

document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.local.get('vocabList', function(data) {
    if (data.vocabList) {
      updateVocabList(data.vocabList);
    }
    chrome.storage.sync.get({ bookList: [] }, (result) => {
        const bookList = result.bookList;
        console.log(bookList)
        displayBookList.innerHTML = '';
        bookList.forEach(book => {
            let checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'checkbox-container';
            let checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = book;
            checkbox.checked = true; // All books are checked by default
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
    
    
    // Function to handle the display toggle
    
  });
  const importVocabButton = document.getElementById('importVocabButton');
  const popup = document.getElementById('popup');
  const popupOverlay = document.getElementById('popup-overlay');
  const submitBulkListButton = document.getElementById('submitVocabButton');
  importVocabButton.addEventListener('click', () => {
    
    populateBookSelector2()
    if (popup.style.display === 'block') {
      // If the popup is already displayed, hide it
      popup.style.display = 'none';
      popupOverlay.style.display = 'none';
    } else {
      // Otherwise, show the popup
      popup.style.display = 'block';
      popupOverlay.style.display = 'block';
    }
  });

  popupOverlay.addEventListener('click', () => {
    popup.style.display = 'none';
    popupOverlay.style.display = 'none';
  });
  submitBulkListButton.addEventListener('click', () => {
    vocabList = []
    const vocabInput = document.getElementById('vocabInput').value;
    const vocabPairs = vocabInput.split('|');
    const book = document.getElementById('bookSelector2').value;
    chrome.storage.local.get('vocabList', function(data) {
      let vocabList = data.vocabList || [];
      vocabPairs.forEach(pair => {
        const [word, definition, gender,pronounciation] = pair.split(':');
        if (word && definition) {
          console.log(`Word: ${word.trim()}, Definition: ${definition.trim()}, book: ${book.trim()}`);
          chrome.storage.local.set({ lastBook: book.trim() });

          vocabList.push({ word, definition,book, snoozed: false, gender, pronounciation,seen: 0, quizResults:['n','n','n','n'] });
          chrome.storage.sync.get({ bookList: [] }, (result) => {
            const bookList = result.bookList;
            if (!bookList.includes(book)) {
                bookList.push(book);
                chrome.storage.sync.set({ bookList }, () => {});
            }
        });
        } else {
          console.log('Invalid vocab pair:', pair);
        }
      });

      
      chrome.storage.local.set({ vocabList: vocabList });
      location.reload()
    });

  });
    // Add your code here to handle the submitted vocabulary
  document.getElementById('sortOptions').addEventListener('change', function() {
    chrome.storage.local.get('vocabList', function(data) {
      if (data.vocabList) {
        const vocabList = data.vocabList
        const sortBy = document.getElementById('sortOptions').value;
        const sortedVocabList = sortVocabList(vocabList, sortBy);
        updateVocabList(sortedVocabList,getCheckedBooks());
      }
    });
  });
  const displayBookList = document.getElementById('displayBookList');
  const manageBookButton = document.getElementById('manageBookButton');
  const floatingContainer = document.getElementById('floatingContainer');
  const closeButton = document.getElementById('closeButton');
  const bookListContainer = document.getElementById('bookListContainer');
  const newBookInContainer = document.getElementById('newBookInContainer');
  const addBookInContainerButton = document.getElementById('addBookInContainerButton');
  const bookSelector = document.getElementById('bookSelector');
  const newBookField = document.getElementById('newBookField');
  const addBookButton = document.getElementById('addBookButton');
  const newBookInput = document.getElementById('newBook');
  bookSelector.addEventListener('change', () => {
    if (bookSelector.value === 'add New Vocab collection') {
      newBookField.style.display = 'block';
    } else {
      newBookField.style.display = 'none';
    }
  });
  addBookButton.addEventListener('click', () => {
    const newBook = newBookInput.value.trim();
    if (newBook) {
        chrome.storage.sync.get({ bookList: [] }, (result) => {
            const bookList = result.bookList;
            if (!bookList.includes(newBook)) {
                bookList.push(newBook);
                chrome.storage.sync.set({ bookList }, () => {
                    alert(`"${newBook}" has been added to the book list.`);
                    newBookInput.value = '';
                    populateBookSelector()
                });
            } else {
                alert(`"${newBook}" is already in the book list.`);
            }
        });
    }
  });
  populateBookSelector()
  function showFloatingContainer() {
    chrome.storage.sync.get({ bookList: [] }, (result) => {
        const bookList = result.bookList;
        bookListContainer.innerHTML = '';
        bookList.forEach((book, index) => {
            let bookItem = document.createElement('div');
            bookItem.style.fontSize = "15px";
            bookItem.innerHTML = `${book} 
            <button class="ui button delete-button" style = "display: flex;margin-left: auto;padding: 10px;" data-index="${index}">Delete Collection</button>
            <button class="ui button delete-all-button" style = "display: flex;margin-left: auto;padding: 10px;" data-index="${index}">Delete Collection and its vocabs</button>`;
            let bookItem2 = document.createElement('div');
            bookItem2.innerHTML = '<div class="ui horizontal divider">...'
            bookListContainer.appendChild(bookItem);
            bookListContainer.appendChild(bookItem2);

        });

        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', (event) => {
              const confirmDeletion = confirm('Are you sure you want to delete this collection?');
              if (confirmDeletion) {
                const index = event.target.getAttribute('data-index');
                bookList.splice(index, 1);
                chrome.storage.sync.set({ bookList }, () => {
                    showFloatingContainer(); // Refresh the list
                    populateBookSelector(); // Update the book selector
                });
              }
            });
        });
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-all-button').forEach(button => {
          button.addEventListener('click', (event) => {
            const confirmDeletion = confirm('Are you sure you want to delete this collection and its vocabs?');
            if (confirmDeletion) {
              chrome.storage.local.get('vocabList', function(data) {
                console.log(bookList)
                let vocabList = data.vocabList || [];
                const index = event.target.getAttribute('data-index');
                const collectionToBeDeleted = bookList[index]
                console.log("collectionToBeDeleted",collectionToBeDeleted);
                vocabList = vocabList.filter(item => item.book !== collectionToBeDeleted);
                chrome.storage.local.set({ vocabList: vocabList }, function() {
                updateVocabList(vocabList);  // Update the displayed list
                });
              });
              const index = event.target.getAttribute('data-index');
              bookList.splice(index, 1);
              chrome.storage.sync.set({ bookList }, () => {
                  showFloatingContainer(); // Refresh the list
                  populateBookSelector(); // Update the book selector
              });
          }});
      });

        floatingContainer.style.display = 'block';
    });
  }

// Add new book to the bookList from floating container
  addBookInContainerButton.addEventListener('click', () => {
    const newBook = newBookInContainer.value.trim();
    if (newBook) {
        chrome.storage.sync.get({ bookList: [] }, (result) => {
            const bookList = result.bookList;
            if (!bookList.includes(newBook)) {
                bookList.push(newBook);
                chrome.storage.sync.set({ bookList }, () => {
                    alert(`"${newBook}" has been added to the book list.`);
                    newBookInContainer.value = '';
                    showFloatingContainer(); // Refresh the list
                    populateBookSelector(); // Update the book selector
                });
            } else {
                alert(`"${newBook}" is already in the book list.`);
            }
        });
    }
  });

// Show floating container on button click
  manageBookButton.addEventListener('click', () => {
      showFloatingContainer();
  });

  // Close floating container
  closeButton.addEventListener('click', () => {
      floatingContainer.style.display = 'none';
  });

  document.getElementById('exportToExcel').addEventListener('click', function() {
    chrome.storage.local.get('vocabList', function(data) {
    const worksheet = XLSX.utils.json_to_sheet(data.vocabList);

            // Create a new workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    var date = new Date();
    const filename = date.toJSON().slice(0, 10) + ".xlsx";
    XLSX.writeFile(workbook, filename);
    });
  });

  document.getElementById('exportTotxt').addEventListener('click', function() {
    console.log("click")
    chrome.storage.local.get('vocabList', function(data) {
      const groupedData = data.vocabList.reduce((acc, item) => {
        let pronoun = ""
        let itemGender = ""
        if (!acc[item.book]) {
            acc[item.book] = [];
        }
        if(item.pronounciation){
          pronoun = item.pronounciation
        }
        if(item.gender){
          itemGender = item.gender
        }
        acc[item.book].push(`${item.word}:${item.definition}:${itemGender}:${pronoun}|`);
        return acc;
    }, {});

    let textContent = '';
    for (const book in groupedData) {
        textContent += `<---Collection: ${book}--->\n`;
        textContent += groupedData[book].join('\n') + '\n';
    }

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    var date = new Date();
    const filename = date.toJSON().slice(0, 10) + ".xlsx";
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    });
  });
  
});
