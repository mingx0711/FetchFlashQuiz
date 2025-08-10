// document.getElementById('addVocabForm').addEventListener('submit', function(e) {
//   e.preventDefault();
import * as utils from '../utils.js';

chrome.storage.sync.getBytesInUse(null, function (bytesInUse) {
  console.log('Sync storage used: ' + bytesInUse + ' bytes');
});

chrome.storage.local.getBytesInUse(null, function (bytesInUse) {
  console.log('Local storage used: ' + bytesInUse + ' bytes');
});
//   const word = document.getElementById('word').value;
//   const definition = document.getElementById('definition').value;
//   const book = document.getElementById('bookSelector').value;
//   const pronounciation = document.getElementById('pronounciation').value;
//   const gender = document.getElementById('gender').value;
//   lastBook = book;
//   // Get existing vocab data from Chrome storage
//   chrome.storage.local.get('vocabList', function(data) {
//     let vocabList = data.vocabList || [];
//     //console.log(data.vocabList)
//     if(book === "add New Vocab collection"||book ==="addNew"){
//       book = "Default"
//     }
//     chrome.storage.local.set({ lastBook: book });
//     lastBook = book;
//     console.log(book)

//     populateBookSelector()
//     // Append the new word, definition, snoozed field, and seen field
//     vocabList.push({ word, definition, snoozed: false , book, gender,pronounciation,seen: 0, quizResults: ['n','n','n','n']});
//     // Save updated vocab list to Chrome storage
//     chrome.storage.local.set({ vocabList: vocabList }, function() {
//       updateVocabList(vocabList);
//       // Clear form fields
//       document.getElementById('addVocabForm').reset();
//     });
//   });
// });

// document.getElementById("importButton").addEventListener("click", function() {
//   chrome.tabs.create({ url: 'inflections/inflections.html' });
// });
document.getElementById('clearButton').addEventListener('click', function () {
  chrome.storage.local.clear(function () {
    console.log('Chrome storage local data cleared');
    updateVocabList([]);  // Clear the displayed list
  });
});
document.getElementById('searchEditVocabBtn').addEventListener('click', function () {
  const container = document.getElementById('searchEditVocabContainer');
  container.style.display = container.style.display === 'none' ? 'block' : 'none';
  document.getElementById('editVocabForm').style.display = 'none';
  document.getElementById('searchEditVocabMsg').textContent = '';
  document.getElementById('searchVocabInput').value = '';
});
const searchBox = document.getElementById("searchVocabInput");
const searchOptions = document.getElementById("searchOptions");
searchBox.addEventListener("input", () => {
  const query = searchBox.value.toLowerCase();
  if (!query || query.length < 3) {
    searchOptions.style.display = "none";
    return;
  }
  searchOptions.innerHTML = ""; // clear previous
  chrome.storage.local.get('vocabList', function (data) {
    let vocabList = data.vocabList || [];
    const matches = vocabList.filter(v => v.word && v.word.toLowerCase().includes(query));
    if (matches.length === 0) {
      searchOptions.style.display = "none";
      return;
    }
    matches.forEach(match => {
      const option = document.createElement("option");
      option.value = match.word;
      option.textContent = match.word;
      searchOptions.appendChild(option);
    });
    searchOptions.style.display = "block";
  });
});
searchOptions.addEventListener("change", () => {
  const selected = searchOptions.value;
  searchBox.value = selected;
  searchOptions.innerHTML = "";
  searchOptions.style.display = "none";
});
document.getElementById('doSearchVocabBtn').addEventListener('click', function () {
  const searchWord = document.getElementById('searchVocabInput').value.trim();
  const msgDiv = document.getElementById('searchEditVocabMsg');
  if (!searchWord) {
    msgDiv.textContent = 'Please enter a word to search.';
    return;
  }
  chrome.storage.local.get('vocabList', function (data) {
    const vocabList = data.vocabList || [];
    const vocab = vocabList.find(item => item.word === searchWord);
    if (!vocab) {
      msgDiv.textContent = 'Word not found.';
      document.getElementById('editVocabForm').style.display = 'none';
      return;
    }
    // Populate form
    document.getElementById('editWord').innerHTML = "Word: " + vocab.word || '';
    document.getElementById('editDefinition').value = vocab.definition || '';
    console.log(vocab.book)
    chrome.storage.local.get({ bookList: [] }, (result) => {
      const bookList = result.bookList || [];
      bookList.forEach(book => {
        const option = document.createElement("option");
        option.value = book;
        option.textContent = book;
        document.getElementById('editCollection').appendChild(option);
      });
      document.getElementById('editCollection').value = vocab.book || '';
    });
    document.getElementById('editGender').value = vocab.gender || '';
    document.getElementById('editPronounciation').value = vocab.pronounciation || '';
    document.getElementById('editEtym').value = vocab.etym || '';
    document.getElementById('editHasChecked').checked = vocab.hasChecked || false;
    document.getElementById('editFocus').checked = vocab.focus || false;
    document.getElementById('editVocabForm').style.display = 'block';
    msgDiv.textContent = '';
    // Store original word for update
    document.getElementById('editVocabForm').dataset.originalWord = vocab.word;
  });
});

document.getElementById('editVocabForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const originalWord = e.target.dataset.originalWord;
  const newDefinition = document.getElementById('editDefinition').value.trim();
  const newBook = document.getElementById('editCollection').value.trim();
  const newPronounciation = document.getElementById('editGender').value.trim();
  const newGender = document.getElementById('editPronounciation').value.trim();
  const newEtym = document.getElementById('editEtym').value.trim();
  const newChecked = document.getElementById('editHasChecked').checked;
  chrome.storage.local.get('vocabList', function (data) {
    let vocabList = data.vocabList || [];
    const idx = vocabList.findIndex(item => item.word === originalWord);
    if (idx === -1) {
      document.getElementById('searchEditVocabMsg').textContent = 'Original word not found.';
      return;
    }
    vocabList[idx].definition = newDefinition;
    vocabList[idx].book = newBook;
    vocabList[idx].pronounciation = newPronounciation;
    vocabList[idx].gender = newGender;
    vocabList[idx].etym = newEtym;
    vocabList[idx].hasChecked = newChecked;
    chrome.storage.local.set({ vocabList }, function () {
      document.getElementById('searchEditVocabMsg').textContent = 'Vocab updated!';
      updateVocabList(vocabList);
    });
  });
});
let selectedVocab;
function updateVocabList(vocabList, collection = ["all"]) {
  const vocabListContainer = document.getElementById('vocabList');
  vocabListContainer.innerHTML = '';
  if (collection[0] != "all") {
    selectedVocab = vocabList.filter(item => collection.includes(item.book));
  } else {
    selectedVocab = vocabList
  }

  console.log(selectedVocab);
  selectedVocab.forEach((entry, index) => {
    if (entry.word && entry.definition) {
      const vocabDiv = document.createElement('div');
      vocabDiv.className = 'flashcard';
      const wordDiv = document.createElement('div');
      const vocabDivDiv = document.createElement('div');
      wordDiv.textContent = ` ${entry.word}`;
      wordDiv.style.width = '20vw';
      wordDiv.style.fontSize = '3vh';
      wordDiv.style.marginRight = '10px';

      if (entry.pronounciation != "" && entry.pronounciation != undefined) {
        const pronounciationDiv = document.createElement('div');
        pronounciationDiv.textContent = `${entry.pronounciation}`;
        pronounciationDiv.style.fontSize = '2.5vh';
        wordDiv.appendChild(pronounciationDiv);
      }
      if (entry.gender != "" && entry.gender != undefined) {
        const genderDiv = document.createElement('div');
        genderDiv.textContent = `${entry.gender}`;
        genderDiv.style.fontSize = '2vh';
        wordDiv.appendChild(genderDiv);
      }
      const definitionDiv = document.createElement('div');
      definitionDiv.textContent = `${entry.definition}`;
      definitionDiv.style.width = '20vw';
      definitionDiv.style.fontSize = '3vh';
      definitionDiv.style.marginRight = '10px';

      const bookDiv = document.createElement('div');
      bookDiv.textContent = `${entry.book}`;
      bookDiv.style.width = '10vw';
      bookDiv.style.fontSize = '3vh';
      bookDiv.style.marginRight = '10px';

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
      deleteButton.classList.add("ui", "button");
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', function () {
        console.log(entry.word)
        vocabList = vocabList.filter(item => item.word !== entry.word);
        chrome.storage.local.set({ vocabList: vocabList }, function () {
          updateVocabList(vocabList, collection);  // Update the displayed list
        });
      });

      const snoozeButton = document.createElement('button');
      snoozeButton.classList.add("ui", "button");
      snoozeButton.style.width = '100px'
      snoozeButton.textContent = entry.snoozed ? 'Unsnooze' : 'Snooze';
      snoozeButton.addEventListener('click', function () {
        const match = vocabList.find(item => item.word === vocabList[index].word)
        match.snoozed = !match.snoozed;
        chrome.storage.local.set({ vocabList: vocabList }, function () {
          updateVocabList(vocabList);  // Update the displayed list
        });
      });

      const importantButton = document.createElement('button');
      importantButton.classList.add("ui", "button");
      importantButton.style.width = '100px'
      importantButton.textContent = entry.focus ? 'Unfocus' : 'Focus';
      importantButton.addEventListener('click', function () {
        const match = vocabList.find(item => item.word === vocabList[index].word)
        match.focus = match.focus ? false : true;
        chrome.storage.local.set({ vocabList: vocabList }, function () {
          updateVocabList(vocabList);  // Update the displayed list
        });
      });
      snoozeButton.style.fontSize = '2vh';
      deleteButton.style.fontSize = '2vh';
      importantButton.style.fontSize = '2vh';

      vocabDiv.appendChild(wordDiv);
      vocabDiv.appendChild(definitionDiv);
      vocabDiv.appendChild(bookDiv);
      vocabDiv.appendChild(quizResultsDiv);
      vocabDiv.appendChild(importantButton);
      vocabDiv.appendChild(deleteButton);
      vocabDiv.appendChild(snoozeButton);
      vocabDiv.style.backgroundColor = 'white';
      const etymContainerDiv = document.createElement('div');
      if (entry.etym != undefined && entry.etym != "") {
        const etymDiv = document.createElement('div');
        etymDiv.textContent = `-${entry.etym}`;
        etymDiv.style.fontSize = '2vh';
        etymDiv.style.left = '5%';
        etymDiv.style.marginTop = '10px';
        etymContainerDiv.appendChild(etymDiv);
      }
      vocabDivDiv.style.borderBottom = '1px dashed'
      vocabDivDiv.style.padding = '10px';
      vocabDivDiv.appendChild(vocabDiv);
      vocabDivDiv.appendChild(etymContainerDiv);

      vocabListContainer.appendChild(vocabDivDiv);
    }
  });
}
function getCheckedBooks() {
  let checkedBooks = [];
  document.querySelectorAll('#displayBookList input[type="checkbox"]').forEach(checkbox => {
    if (checkbox.checked) {
      checkedBooks.push(checkbox.id);
    }
  });
  return checkedBooks;
}
function updateCheckedBooks() {

  chrome.storage.local.get('vocabList', function (data) {
    let vocabList = data.vocabList || [];
    updateVocabList(vocabList, getCheckedBooks());
  })
}
function sortVocabList(vocabList, sortBy) {
  if (sortBy === '') {
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
  chrome.storage.local.get({ bookList: [] }, (result) => {

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
// function populateBookSelector() {
//   chrome.storage.local.get({ bookList: [] }, (result) => {
//     const bookList = result.bookList||"Default";
//     chrome.storage.local.get('lastBook', function(data) {
//       const lastBook = data.lastBook||"Default";
//       console.log(lastBook)
//     if(lastBook){
//         document.getElementById('bookSelector').innerHTML = ""
//     if(lastBook!=""||lastBook==="addNew"){
//       optionNewSelected = document.createElement('option');
//       optionNewSelected.textContent  = lastBook;
//       optionNewSelected.value = lastBook;
//       optionNewSelected.selected = true;

//       document.getElementById('bookSelector').add(optionNewSelected)
//     }
//     // Clear existing options except for the default option
//     // Add books as options
//     bookList.forEach(book => {
//         let option = document.createElement('option');
//         if(book === data.lastBook){
//         }else{
//           option.textContent  = book;
//           option.value = book;

//           document.getElementById('bookSelector').add(option);
//         }
//       });
//       optionNew = document.createElement('option');
//       optionNew.textContent = "add New Vocab collection";
//       optionNew.value = "addNew";

//       document.getElementById('bookSelector').add(optionNew)
//       }
//     });

//   });
// }
function convertToCSV() {
  chrome.storage.local.get('vocabList', function (data) {
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

document.addEventListener('DOMContentLoaded', function () {
  chrome.storage.local.get('vocabList', function (data) {
    if (data.vocabList) {
      updateVocabList(data.vocabList);
    }
    chrome.storage.local.get({ bookList: [] }, (result) => {
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
        checkboxContainer.classList.add("ui", "checkbox")
        displayBookList.appendChild(checkboxContainer);
      });
    });


    // Function to handle the display toggle

  });
  // chrome.storage.local.get('autoBackup', function (data) {
  //   const autoBackupBtn = document.getElementById('autoBackupBtn');
  //   let isOn = data.autoBackup === true;
  //   if (autoBackupBtn) {
  //     autoBackupBtn.textContent = isOn ? "Autobackup is ON" : "Autobackup is OFF";
  //     autoBackupBtn.addEventListener('click', function () {
  //       isOn = !isOn;
  //       chrome.storage.local.set({ autoBackup: isOn }, function () {
  //         autoBackupBtn.textContent = isOn ? "Autobackup is ON" : "Autobackup is OFF";
  //       });
  //     });
  //   }
  // });

  // const importVocabButton = document.getElementById('importVocabButton');
  const popup = document.getElementById('popup');
  const popupOverlay = document.getElementById('popup-overlay');
  const submitBulkListButton = document.getElementById('submitVocabButton');
  // importVocabButton.addEventListener('click', () => {

  //   populateBookSelector2()
  //   if (popup.style.display === 'block') {
  //     // If the popup is already displayed, hide it
  //     popup.style.display = 'none';
  //     popupOverlay.style.display = 'none';
  //   } else {
  //     // Otherwise, show the popup
  //     popup.style.display = 'block';
  //     popupOverlay.style.display = 'block';
  //   }
  // });

  popupOverlay.addEventListener('click', () => {
    popup.style.display = 'none';
    popupOverlay.style.display = 'none';
  });
  submitBulkListButton.addEventListener('click', () => {
    vocabList = []
    const vocabInput = document.getElementById('vocabInput').value;
    const vocabPairs = vocabInput.split('|');
    const book = document.getElementById('bookSelector2').value;
    chrome.storage.local.get('vocabList', function (data) {
      let vocabList = data.vocabList || [];
      vocabPairs.forEach(pair => {
        const [word, definition, gender, pronounciation] = pair.split(':');
        if (word && definition) {
          console.log(`Word: ${word.trim()}, Definition: ${definition.trim()}, book: ${book.trim()}`);
          chrome.storage.local.set({ lastBook: book.trim() });

          vocabList.push({ word, definition, book, snoozed: false, gender, pronounciation, seen: 0, quizResults: ['n', 'n', 'n', 'n'] });
          chrome.storage.local.get({ bookList: [] }, (result) => {
            const bookList = result.bookList;
            if (!bookList.includes(book)) {
              bookList.push(book);
              chrome.storage.local.set({ bookList }, () => { });
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
  document.getElementById('sortOptions').addEventListener('change', function () {
    chrome.storage.local.get('vocabList', function (data) {
      if (data.vocabList) {
        const vocabList = data.vocabList
        const sortBy = document.getElementById('sortOptions').value;
        const sortedVocabList = sortVocabList(vocabList, sortBy);
        updateVocabList(sortedVocabList, getCheckedBooks());
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
  //const addBookButton = document.getElementById('addBookButton');
  const newBookInput = document.getElementById('newBook');
  // bookSelector.addEventListener('change', () => {
  //   if (bookSelector.value === 'add New Vocab collection') {
  //     newBookField.style.display = 'block';
  //   } else {
  //     newBookField.style.display = 'none';
  //   }
  // });
  // addBookButton.addEventListener('click', () => {
  //   const newBook = newBookInput.value.trim();
  //   if (newBook) {
  //       chrome.storage.local.get({ bookList: [] }, (result) => {
  //           const bookList = result.bookList;
  //           if (!bookList.includes(newBook)) {
  //               bookList.push(newBook);
  //               chrome.storage.local.set({ bookList }, () => {
  //                   alert(`"${newBook}" has been added to the book list.`);
  //                   newBookInput.value = '';
  //                   populateBookSelector()
  //               });
  //           } else {
  //               alert(`"${newBook}" is already in the book list.`);
  //           }
  //       });
  //   }
  // });
  //populateBookSelector()
  function showFloatingContainer() {
    chrome.storage.local.get({ bookList: [] }, (result) => {
      const bookList = result.bookList;
      bookListContainer.innerHTML = '';
      bookList.forEach((book, index) => {
        let bookItem = document.createElement('div');
        bookItem.style.fontSize = "15px";
        bookItem.innerHTML = `${book} 
            <button class="ui button delete-all-button" style = "display: flex;margin-left: auto;padding: 10px;" data-index="${index}">Delete Collection and its vocabs</button>`;
        let bookItem2 = document.createElement('div');
        bookItem2.innerHTML = '<div class="ui horizontal divider">...'
        bookListContainer.appendChild(bookItem);
        bookListContainer.appendChild(bookItem2);

      });
      // Add event listeners to delete buttons
      document.querySelectorAll('.delete-all-button').forEach(button => {
        button.addEventListener('click', (event) => {
          const confirmDeletion = confirm('Are you sure you want to delete this collection and its vocabs?');
          if (confirmDeletion) {
            chrome.storage.local.get('vocabList', function (data) {
              console.log(bookList)
              let vocabList = data.vocabList || [];
              const index = event.target.getAttribute('data-index');
              const collectionToBeDeleted = bookList[index]
              console.log("bookList", bookList);
              console.log("collectionToBeDeleted", collectionToBeDeleted);
              vocabList = vocabList.filter(item => item.book !== collectionToBeDeleted);
              console.log(console.length)
              chrome.storage.local.set({ vocabList: vocabList }, function () {
                updateVocabList(vocabList);  // Update the displayed list
              });
              bookList.splice(index, 1);
              chrome.storage.local.set({ bookList }, () => {
                showFloatingContainer(); // Refresh the list
              });
            });

          }
        });
      });

      floatingContainer.style.display = 'block';
    });
  }

  // Add new book to the bookList from floating container
  addBookInContainerButton.addEventListener('click', () => {
    const newBook = newBookInContainer.value.trim();
    if (newBook) {
      chrome.storage.local.get({ bookList: [] }, (result) => {
        const bookList = result.bookList;
        if (!bookList.includes(newBook)) {
          bookList.push(newBook);
          chrome.storage.local.set({ bookList }, () => {
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

  document.getElementById('exportToJson').addEventListener('click', function () {
    utils.exportToJson();
  });
  document.getElementById('importFromJson').addEventListener('click', function () {
    const fileInput = document.getElementById('fileInput');
    const output = document.getElementById('output');
    const uploadBtn = document.getElementById('importFromJson');

    const fileInputContainer = document.getElementById('fileInputContainer');
    fileInputContainer.style.display = 'block';

    fileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file && file.type === "application/json") {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const jsonData = JSON.parse(e.target.result);
            if (jsonData.vocabList && Array.isArray(jsonData.vocabList)) {
              chrome.storage.local.get('vocabList', function (data) {
                let currentData = data.vocabList || [];
                currentData = [...currentData, ...jsonData.vocabList]
                chrome.storage.local.set({ vocabList: currentData }, () => {
                  if (chrome.runtime.lastError) {
                    console.error("Error saving merged data:", chrome.runtime.lastError);
                  } else {
                    console.log("Merged data saved to chrome.storage.local");
                  }
                });
              })
            }
            output.textContent = JSON.stringify(jsonData, null, 2); // Display the JSON
            // Hide the file input after successful upload
            fileInputContainer.style.display = 'none';
            fileInput.value = ""; // Reset file input
            const vocablistRaw = jsonData.vocabList
            console.log(vocablistRaw)
            const distinctBooks = [...new Set(vocablistRaw.map(x => x.book))];
            chrome.storage.local.get({ bookList: [] }, (result) => {
              let bookList = result.bookList;
              bookList.push(...distinctBooks);
              bookList = Array.from(new Set(bookList));
              bookList = bookList.filter(Boolean)
              console.log(bookList)
              chrome.storage.local.set({ bookList: bookList }, () => {
                if (chrome.runtime.lastError) {
                  console.error("Error saving bookList:", chrome.runtime.lastError);
                } else {
                  console.log("bookList saved:", bookList);
                }
              });
            });

          } catch (err) {
            output.textContent = "Error parsing JSON file.";
            console.error("Error parsing JSON", err);
          }
        };
        reader.readAsText(file);
      } else {
        alert("Please upload a valid JSON file.");
      }
    });
  });

});
document.addEventListener('click', function (event) {
  const form = document.getElementById('searchEditVocabContainer');
  const searchBtn = document.getElementById('searchEditVocabBtn');
  const searchContainer = document.getElementById('searchEditVocabContainer');
  const searchOptions = document.getElementById('searchOptions');
  if (!form || form.style.display === 'none') return;
  // If the click is outside the form and not on the search button or inside the search container
  if (!form.contains(event.target) && !searchOptions.contains(event.target) && !searchBtn.contains(event.target) && !searchContainer.contains(event.target)) {
    form.style.display = 'none';
  }
});
