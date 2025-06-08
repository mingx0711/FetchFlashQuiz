let vocab = {}
let def;
let usingLocal = false;

document.getElementById('selectLanguage').addEventListener('change', function() {
  let selectedLanguage = this.value;  // Get the selected value
  let word = document.getElementById('word').value.trim();
  const selectedOption = this.options[this.selectedIndex];  
  for (let option of this.options) {
    option.removeAttribute('selected');
  }
  chrome.storage.local.set({lastLang:selectedLanguage});
    selectedOption.setAttribute('selected', 'true');
});
document.getElementById('addVocabForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const language = document.getElementById('selectLanguage').value;
  let word = document.getElementById('word').value.trim();
  const definition = document.getElementById('definition').value.trim();
  const book = document.getElementById('bookSelector').value;
  const pronounciation = document.getElementById('pronounciation').value;
  const gender = document.getElementById('gender').value;
  chrome.storage.local.set({ lastBook: book }, function() {});

  if(definition && definition!=""){
    chrome.storage.local.get('vocabList', function(data) {
      let vocabList = data.vocabList || [];
      // Append the new word, definition, and snoozed field
      vocabList.push({ word, definition, snoozed: false , book, gender,pronounciation,seen: 0, quizResults: ['n','n','n','n']});
      chrome.storage.local.set({ lastBook: book }, function() {});
      // Save updated vocab list to Chrome storage
      chrome.storage.local.set({ vocabList: vocabList }, function() {
        chrome.storage.local.get('bookList', function(data) {
          let bookList = data.bookList || [];
          if(!bookList.includes(book)){
            bookList.push(book);
          }
          chrome.storage.local.set({ vocabList: vocabList }, function(data) {})
    
        })
        // Show a message indicating the word was added
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = `The word "${word}" has been added to the list.`;
  
        // Clear form fields
        document.getElementById('addVocabForm').reset();
  
        // Clear the message after a few seconds
        setTimeout(() => {
          messageDiv.textContent = '';
        }, 3000);
      });
    });
  }else{
    if(language!="de"){
      word = removeDiacritics(word)
    }
    var url = usingLocal?`http://localhost:3000/fetch/${word}`:`https://en.wiktionary.org/wiki/${word}`
    fetch(url)
    .then(response => response.text())
    .then(html => {
      // Parse the returned HTML and extract the inflection table
       const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            if (language == "latin"){
              getLatinAttributes(doc,word);
            } else if(language == 'de'){
              getGermanAttributes(doc,word);
            } else{
              getLinkedAttributes(doc,word,language)
            }
    })
    updateLanguageList(language);
  }
  populateBookSelector();


});
function updateLanguageList(lang){
  chrome.storage.local.get({ languageList: {}}, (data) => {

    let languageList = data.languageList|| {};
    if(languageList[lang]){
      languageList[lang]+=1
    }else{
      languageList[lang]=1
    }
    chrome.storage.local.set({languageList:languageList }, function() {
    });
  });
}
function removeDiacritics(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function initializeConjugations(conjugations){
    conjugations.pos = 'verb'
    conjugations.number = {singular:[],plural:[]}
    conjugations.person = {first:[],second:[],third:[]}
    conjugations.tense = {present:[],imperfect:[],perfect:[],future:[],pluperfect:[],futurePerfect:[],sigmaticFuture:[],aorist:[]}
    conjugations.voice = {active:[],passive:[]}
    conjugations.mood = {indicative:[],subjunctive:[],imperative:[]}
    conjugations.form = {infinitive:[],participle:[]}
    conjugations.noun = {gerundive:[],supine:[]}
    conjugations.case = {genitive:[],ablative:[],accusative:[],dative:[]}

}
async function getLatinAttributes(doc,word){
  const book = document.getElementById('bookSelector').value;
  const pronounciation = document.getElementById('pronounciation').value;
  const gender = document.getElementById('gender').value;
  let conjugations = {};
  document.getElementById('vocabInfo').innerHTML=""
  vocab = {}
  let verbInflectionTable;
  let verbInflectionTableNew;
  let isVerb = false;
  const spanElement = doc.querySelector('span.Latn.form-of.lang-la[lang="la"]');

  if (spanElement) {
      // Get its parent element
      const parentElement = spanElement.parentElement.parentElement.parentElement.parentElement;
      
      if (parentElement) {
        console.log(parentElement)
        verbInflectionTableNew = parentElement
        if(verbInflectionTableNew.classList.contains("roa-inflection-table")){
          isVerb = true
        }
      }
    
    }

  let iTableLocator = doc.querySelector('.inflection-table.vsSwitcher tbody tr th i[lang="la"]');
  if(iTableLocator){
    let th = iTableLocator.parentElement;
    let tr = th.parentElement;
    let tbody = tr.parentElement;
    verbInflectionTable=tbody.parentElement;
  }

  if (verbInflectionTable||isVerb) {
    let anchorElement = verbInflectionTableNew.querySelector('a');
    if(anchorElement){conjugations.group=anchorElement.textContent};
    let definition = ""
    let lastOl = null;
    const parentParagraph = verbInflectionTableNew.parentElement.parentElement;
    let currentElement = parentParagraph;

    while (currentElement) {
        currentElement = currentElement.previousElementSibling ;
        if (currentElement && currentElement.tagName === "OL") {
            lastOl = currentElement;
            break;
        }
    }
    if (lastOl) {
      const ListItems = lastOl.querySelectorAll('ol > li');
      let firstListItem;
      for(let i = 0;i<ListItems.length;i++){
        if (ListItems[i].textContent.trim()!==""){
          firstListItem = ListItems[i]
          break;
        }
      }
      firstListItem.querySelectorAll('span, dl,ul').forEach(el => el.remove());
      var rawDef = firstListItem.textContent.trim();
      if(rawDef.includes('.mw')){
        definition= rawDef.slice(0, definition.indexOf('.mw')).trim();
      }else{
        definition= rawDef.trim();
      }
    }
  
    let conjugationText = conjugations.group;
    // Select the <span> element
    let spanElements = doc.querySelectorAll('span.Latn.form-of.lang-la');
    conjugations.pos = 'verb'
    conjugations.number = {singular:[],plural:[]}
    conjugations.person = {first:[],second:[],third:[]}
    conjugations.tense = {present:[],imperfect:[],perfect:[],future:[],pluperfect:[],futurePerfect:[],sigmaticFuture:[],aorist:[]}
    conjugations.voice = {active:[],passive:[]}
    conjugations.mood = {indicative:[],subjunctive:[],imperative:[]}
    conjugations.form = {infinitive:[],participle:[]}
    conjugations.noun = {gerundive:[],supine:[]}
    conjugations.case = {genitive:[],ablative:[],accusative:[],dative:[]}
    spanElements.forEach((spanElement) => {
      let childText = spanElement.firstElementChild.textContent;
      if(spanElement.className.includes('1')){conjugations.person.first.push(childText);}
      if(spanElement.className.includes('2')){conjugations.person.second.push(childText);}
      if(spanElement.className.includes('3')){conjugations.person.third.push(childText);}
      if(spanElement.className.includes('|s|')){conjugations.number.singular.push(childText);
      }if(spanElement.className.includes('|p|')){conjugations.number.plural.push(childText);
      }if(spanElement.className.includes('pres')){ conjugations.tense.present.push(childText);
      }if(spanElement.className.includes('impf')){conjugations.tense.imperfect.push(childText);
      }if(spanElement.className.includes('fut|')){conjugations.tense.future.push(childText);
      }if(spanElement.className.includes('perf')){conjugations.tense.perfect.push(childText);
      }if(spanElement.className.includes('plup')){conjugations.tense.pluperfect.push(childText);
      }if(spanElement.className.includes('futp')){conjugations.tense.futurePerfect.push(childText);
      }if(spanElement.className.includes('sigm')){conjugations.tense.sigmaticFuture.push(childText);
      }if(spanElement.className.includes('aor')){conjugations.tense.aorist.push(childText);
      }if(spanElement.className.includes('act')){conjugations.voice.active.push(childText);
      }if(spanElement.className.includes('pass')){conjugations.voice.passive.push(childText);
      }if(spanElement.className.includes('ind')){conjugations.mood.indicative.push(childText);
      }if(spanElement.className.includes('sub')){conjugations.mood.subjunctive.push(childText);
      }if(spanElement.className.includes('imp-form-of')){conjugations.mood.imperative.push(childText);
      }if(spanElement.className.includes('inf')){conjugations.form.infinitive.push(childText);
      }if(spanElement.className.includes('part')){conjugations.form.participle.push(childText);
      }if(spanElement.className.includes('gen')){conjugations.case.genitive.push(childText);
      }if(spanElement.className.includes('ger')){conjugations.noun.gerundive.push(childText);
      }if(spanElement.className.includes('dat')){conjugations.case.dative.push(childText);
      }if(spanElement.className.includes('acc')){conjugations.case.accusative.push(childText);
      }if(spanElement.className.includes('sup')){conjugations.noun.supine.push(childText);
      }if(spanElement.className.includes('abl')){conjugations.case.ablative.push(childText);
      }
    });
    const vocabInfo = document.getElementById('vocabInfo');
    var h2 = doc.getElementById('Latin');
    var h2Parent = h2.parentElement;
    var hasEytm = true;
    while(true){
      if(h2Parent&&h2Parent.firstChild&&h2Parent.firstChild.id&&h2Parent.firstChild.id.includes('Etymology')){
        break;
      }else{
        if(h2Parent.nextElementSibling){
          h2Parent = h2Parent.nextElementSibling;
        }else{
          hasEytm = false;
          break;
        }
      }
    }
    var etym;
    if(!hasEytm){etym = ""}else{
    const nextElem = h2Parent.nextElementSibling;
    etym = nextElem.innerText;
    }
    console.log(etym);
    vocab = {word,definition,snoozed: false,book,pronounciation,gender,conjugations,seen:0,quizResults: ['n','n','n','n'],etym:hasEytm?etym:""}
    vocabInfo.innerHTML=""
    vocabInfo.innerHTML+=' word: <span style="font-weight: bold;">'+vocab.word + '</span>'
    vocabInfo.innerHTML+='<br>| \n definition: <span style="font-weight: bold;">'+vocab.definition+ '</span>'
    vocabInfo.innerHTML+="<br>|\n group: "+vocab.conjugations.group
    vocabInfo.innerHTML+="<br>| \n collection: "+vocab.book
    vocabInfo.innerHTML+="<br>| \n eytmology: "+vocab.etym
    conjugations.type = 'latin';
    document.getElementById("addAuto").style.display = 'block'
    }
  else {
    const nounInflectionTable = doc.querySelector('table.inflection-table-la');
    if(nounInflectionTable){
      const conjugations = {}
      let declension = ""
      const declensionElements = doc.querySelectorAll('a[href^="/wiki/Appendix:Latin_"][href*="declension"]');
     
      if(declensionElements){
        const declensionElementsLength = declensionElements.length/2
        for(let i = 0;i<declensionElementsLength;i++){
          declension+=declensionElements[i].textContent
        }
        declension = declension.replaceAll("firstsecond","first&second").replaceAll("-"," ")
        declension= declension.slice(0, declension.indexOf(' ')).trim();        
        conjugations.group = declension
      }
      const queryWord = 'strong.Latn.headword[lang="la"]'
      const isWord = doc.querySelector(queryWord);
      let autoGender = ''
      if(isWord){
        const grannyElement = isWord.parentElement.parentElement;
        const genderSpan = grannyElement.querySelector("span.gender");
        if(genderSpan){
          const genderDef = genderSpan.firstChild.textContent;
          switch(genderDef){
            case 'f':
              autoGender = 'feminine'
              break;
            case 'm':
              autoGender = 'masculine'
              break;
            case 'n':
              autoGender = 'neuter'
              break;
            default:
              break;
          }
        }
      }
      let closestOl = null;
      const latinHeading = doc.querySelector('h2#Latin');
      const closestDiv = latinHeading.closest('div');
      let sibling = closestDiv.nextElementSibling;
      while (sibling) {
        // If an <ol> is found, assign it to closestOl and break out of the loop
        if (sibling.tagName.toLowerCase() === 'ol') {
            closestOl = sibling;
            break;
        }
        sibling = sibling.nextElementSibling; // Move to the next sibling
      }
      
      const ListItems = sibling.querySelectorAll('li');
      for(let i = 0;i<ListItems.length;i++){
        if (ListItems[i].textContent.trim()!==""){
          var firstListItem = ListItems[i]
          break;
        }
      }
      firstListItem.querySelectorAll('dl,ul').forEach(el => el.remove());
      var definition = firstListItem.textContent.trim();
      conjugations.inflections = {singular_nominative:[],
        plural_nominative:[],singular_genitive:[],
        plural_genitive:[],singular_dative:[],
        plural_dative:[],singular_accusative:[],
        plural_accusative:[],singular_ablative:[],
        plural_ablative:[],singular_vocative:[],
        plural_vocative:[],
      
      }
      let spanElements = doc.querySelectorAll('span.Latn.form-of.lang-la');
      spanElements.forEach((spanElement) => {
        let childText = spanElement.firstElementChild.textContent;
        if(spanElement.className.includes('s-')&&spanElement.className.includes('nom')){conjugations.inflections.singular_nominative.push(childText);}
        if(spanElement.className.includes('p-')&&spanElement.className.includes('nom')){conjugations.inflections.plural_nominative.push(childText);}
        if(spanElement.className.includes('s-')&&spanElement.className.includes('acc')){conjugations.inflections.singular_accusative.push(childText);}
        if(spanElement.className.includes('p-')&&spanElement.className.includes('acc')){conjugations.inflections.plural_accusative.push(childText);}
        if(spanElement.className.includes('s-')&&spanElement.className.includes('dat')){conjugations.inflections.singular_dative.push(childText);}
        if(spanElement.className.includes('p-')&&spanElement.className.includes('dat')){conjugations.inflections.plural_dative.push(childText);}
        if(spanElement.className.includes('s-')&&spanElement.className.includes('gen')){conjugations.inflections.singular_genitive.push(childText);}
        if(spanElement.className.includes('p-')&&spanElement.className.includes('gen')){conjugations.inflections.plural_genitive.push(childText);}
        if(spanElement.className.includes('s-')&&spanElement.className.includes('voc')){conjugations.inflections.singular_vocative.push(childText);}
        if(spanElement.className.includes('p-')&&spanElement.className.includes('voc')){conjugations.inflections.plural_vocative.push(childText);}
        if(spanElement.className.includes('s-')&&spanElement.className.includes('abl')){conjugations.inflections.singular_ablative.push(childText);}
        if(spanElement.className.includes('p-')&&spanElement.className.includes('abl')){conjugations.inflections.plural_ablative.push(childText);}

      });
      let hasEytm = true;
      conjugations.type = 'latin';
      const vocabInfo = document.getElementById('vocabInfo');
      var h2 = doc.getElementById('Latin');
      var h2Parent = h2.parentElement;
      while(true){
        if(h2Parent&&h2Parent.firstChild&&h2Parent.firstChild.id&&h2Parent.firstChild.id.includes('Etymology')){
          break;
        }else{
          if(h2Parent.nextElementSibling){
            h2Parent = h2Parent.nextElementSibling;
          }else{
            hasEytm = false;
            break;
          }
        }
      }
      
    var etym;
    if(!hasEytm){etym = ""}else{
    const nextElem = h2Parent.nextElementSibling;
    etym = nextElem.innerText;
    }
      console.log(etym);
      vocab = {word,definition,snoozed: false,book,pronounciation,gender:autoGender?autoGender:gender,conjugations,seen:0,quizResults: ['n','n','n','n'],etym:hasEytm?etym:""}
      vocabInfo.innerHTML=""
      vocabInfo.innerHTML+=' word: <span style="font-weight: bold;">'+vocab.word + '</span>'
      vocabInfo.innerHTML+='<br> \n definition: <span style="font-weight: bold;">'+vocab.definition+ '</span>'
      if(autoGender){
      vocabInfo.innerHTML+="<br> \n gender: "+autoGender
      }
      vocabInfo.innerHTML+="<br>\n group: "+vocab.conjugations.group
      vocabInfo.innerHTML+="<br> \n collection: "+vocab.book
      vocabInfo.innerHTML+="<br> \n eytmology: "+vocab.etym
      conjugations.type = 'latin';
      document.getElementById("addAuto").style.display = 'block'
     }else{
      const latinElement = doc.querySelector('span.form-of-definition-link i.Latn.mention[lang="la"]');
      if(latinElement){
        const anchorTag = latinElement.querySelector('a');
        if (anchorTag) {
          const linkText = anchorTag.textContent; // Get the text content of the <a>
          const spanElement = latinElement.parentElement;
          const spanElement1 = spanElement.parentElement;
          const liElement = spanElement1.parentElement;
          let definition = ""
          if(liElement){
            definition = liElement.textContent.trim()
          }
          definition+=","
        let noramlizedWord = word.normalize('NFD');
        let noDiacritics = noramlizedWord.replace(/[\u0300-\u036f]/g, "");
        let finalStr = noDiacritics.replace(/-/g, "");
        let finallinkText = removeDiacritics(linkText)
        if(finalStr.trim()!=finallinkText.trim())  {
          var url = usingLocal?`http://localhost:3000/fetch/${linkText}`:`https://en.wiktionary.org/wiki/${finallinkText}`
          await fetch(url)
          .then(response => response.text())
          .then(html => {
            // Parse the returned HTML and extract the inflection table
            const parser = new DOMParser();
            const baseDoc = parser.parseFromString(html, 'text/html');
            getLatinAttributes(baseDoc,linkText);
          })
        }else{
          document.getElementById('vocabInfo').style.display = 'block'
      document.getElementById('vocabInfo').innerHTML = 'invalid word(either is one of the special words, does not exist in latin or does not have a normal conjugation table or is not in base form.)'
        }
      }
    }else{
      const isLatinWord = doc.querySelector('strong.Latn.headword[lang="la"]');
      if(isLatinWord){
       getEasyAttributes(doc,word,"la")
      }else{
        document.getElementById('vocabInfo').style.display = 'block'
        document.getElementById('vocabInfo').innerHTML = 'invalid word(either does not exist in latin or does not have a normal conjugation table or is not in base form.)'
      }
      
      }
    }
  }
}
async function getLinkedAttributes(doc,word,lang){
  document.getElementById('vocabInfo').innerHTML = ""
  document.getElementById('vocabInfoInfs').innerHTML = ""
  const book = document.getElementById('bookSelector').value;
  const pronounciation = document.getElementById('pronounciation').value;
  const gender = document.getElementById('gender').value;
  const baseFormQuery = 'span.form-of-definition-link i[class="Latn mention"][lang="'+lang+'"]'
  const hasBaseForm = doc.querySelector(baseFormQuery);
  if(hasBaseForm){
    const anchorTag = hasBaseForm.querySelector('a');
    if (anchorTag) {
      const linkText = anchorTag.textContent; // Get the text content of the <a>
      document.getElementById('vocabInfoInfs').style.display = 'block'
      const spanElement = hasBaseForm.parentElement;
      const spanElement1 = spanElement.parentElement;
      const liElement = spanElement1.parentElement;
      let definition = ""
      if(liElement){
        const firstInflection = liElement.querySelector('ol')
        if(firstInflection){
          const inflectionDescription = firstInflection.querySelector('li')
          definition+=inflectionDescription.textContent.trim()
        }else{
          definition = liElement.textContent.trim()
        }
      }
      document.getElementById('vocabInfoInfs').innerHTML += definition
      document.getElementById('vocabInfoInfs').innerHTML+= String.fromCodePoint(0x1F4A0);
    let noramlizedWord = word.normalize('NFD');
    let noDiacritics = noramlizedWord.replace(/[\u0300-\u036f]/g, "");
    let finalStr = noDiacritics.replace(/-/g, "");
    let baseDoc;        
    let finallinkText = removeDiacritics(linkText)

    if(finalStr.trim()!=linkText.trim())  {
      var url = usingLocal?`http://localhost:3000/fetch/${linkText}`:`https://en.wiktionary.org/wiki/${finallinkText}`
      await fetch(url)
      .then(response => response.text())
      .then(html => {
        // Parse the returned HTML and extract the inflection table
        const parser = new DOMParser();
        baseDoc = parser.parseFromString(html, 'text/html');
        getEasyAttributes(baseDoc,linkText,lang);
      })
        document.getElementById("vocabInfo").textContent+","+definition
        definition = document.getElementById("vocabInfo").textContent+","+definition
        vocab = {word,definition,snoozed: false,book,pronounciation,gender,seen:0,quizResults: ['n','n','n','n']}
    }
   
  }
  }else{ 
    getEasyAttributes(doc,word,lang)
  }
}
async function getEasyAttributes(doc,word,lang){
  
  document.getElementById('vocabInfo').innerHTML = ''
  document.getElementById('vocabInfo').style.display = ""
  const book = document.getElementById('bookSelector').value;
  const pronounciation = document.getElementById('pronounciation').value;
  const gender = document.getElementById('gender').value;
  const queryWord = 'strong.Latn.headword[lang="'+lang+'"]'
  const isWord = doc.querySelector(queryWord);
  if(isWord){
    const grannyElement = isWord.parentElement.parentElement;
    const closestOl = grannyElement.nextElementSibling;
    const liElement = closestOl.querySelector("li"); // Get the text content of the <a>
    document.getElementById('vocabInfo').style.display = 'block'
    let definition = ""
    if(liElement){
      liElement.querySelectorAll('dl,u,span,ul').forEach(el => el.remove());
      definition = liElement.textContent.trim()
      definition = definition.replace(/ *\([^)]*\) */g, "");
    }
    const spanElement = doc.querySelector('span.Latn.form-of.lang-'+lang+'[lang="'+lang+'"]');
    let isVerb = false;
    let verbInflectionTableNew;
    if (spanElement) {
        // Get its parent element
        const parentElement = spanElement.parentElement.parentElement.parentElement.parentElement;
        
        if (parentElement) {
          verbInflectionTableNew = parentElement
          if(verbInflectionTableNew.classList.contains("roa-inflection-table")){
            isVerb = true
          }
        }
      
      }
    let autoGender = ''
    const genderSpan = grannyElement.querySelector("span.gender");
    if(genderSpan){
      const genderDef = genderSpan.firstChild.textContent;
      switch(genderDef){
        case 'f':
          autoGender = 'feminine'
          break;
        case 'm':
          autoGender = 'masculine'
          break;
        case 'n':
          autoGender = 'neuter'
          break;
        default:
          break;
      }
    }
    var hasEytm = true;
    var baseDef = definition
    definition = definition.split(".mw")[0]
    definition = definition.split(";")[0];
    const language = convertFromAbbr(lang);
    var h2 = doc.getElementById(language);
    var h2Parent = h2.parentElement;
    while(true){
        if(h2Parent&&h2Parent.firstChild&&h2Parent.firstChild.id&&h2Parent.firstChild.id.includes('Etymology')){
          break;
        }else{
          if(h2Parent.nextElementSibling){
            h2Parent = h2Parent.nextElementSibling;
          }else{
            hasEytm = false;
            break;
          }
        }
    }
    var etym;
    if(!hasEytm){etym = ""}else{
    const nextElem = h2Parent.nextElementSibling;
    etym = nextElem.innerText;
    }
    console.log("Eytm?" + hasEytm)
    document.getElementById('vocabInfo').innerHTML += '<span style="font-weight: bold;">'+definition+'</span>'
    document.getElementById('vocabInfo').innerHTML += autoGender?("|gender:"+autoGender):""
    document.getElementById('vocabInfo').innerHTML += "<br>" + etym
    console.log(book)
    vocab = {word,definition,snoozed: false,book,pronounciation,gender:autoGender?autoGender:gender,seen:0,quizResults: ['n','n','n','n'],etym:hasEytm?etym:""}
    if(isVerb){
      switch(lang){
        case 'fr':
          vocab.conjugations = getFrenchVerbInflections(verbInflectionTableNew)
          break;
        // case 'es':
        //   vocab.conjugations = getSpanishVerbInflections(verbInflectionTableNew)
      }
    }
    document.getElementById("addAuto").style.display = 'block'
  }else{
    document.getElementById('vocabInfo').style.display = 'block'
    document.getElementById('vocabInfo').innerHTML = "word could need correct capitalizations, be a special word, or doesnot exist in the language"
  }
}
function convertFromAbbr(lang){
switch (lang) {
  case 'de':
    return 'German';
  case 'es':
    return 'Spanish';
  case 'fr':
    return 'French';
  case 'it':
    return 'Italian';
  case 'en':
    return 'English';
  case 'pt':
    return 'Portuguese';
  case 'ru':
    return 'Russian';
  case 'zh':
    return 'Chinese';
  case 'ja':
    return 'Japanese';
  case 'ko':
    return 'Korean';
  case 'ar':
    return 'Arabic';
  case 'nl':
    return 'Dutch';
  case 'sv':
    return 'Swedish';
  case 'no':
    return 'Norwegian';
  case 'da':
    return 'Danish';
  case 'fi':
    return 'Finnish';
  case 'pl':
    return 'Polish';
  case 'tr':
    return 'Turkish';
  case 'el':
    return 'Greek';
  case 'he':
    return 'Hebrew';
  case 'hi':
    return 'Hindi';
  case 'bn':
    return 'Bengali';
  case 'la':
    return 'Latin';
  case 'vi':
    return 'Vietnamese';
  case 'id':
    return 'Indonesian';
  case 'ms':
    return 'Malay';
  case 'th':
    return 'Thai';
  case 'ro':
    return 'Romanian';
  case 'cs':
    return 'Czech';
  case 'hu':
    return 'Hungarian';
  case 'sk':
    return 'Slovak';
  case 'bg':
    return 'Bulgarian';
  case 'uk':
    return 'Ukrainian';
  case 'fa':
    return 'Persian';
  case 'sw':
    return 'Swahili';

  default:
    return 'Unknown';
}

}
function getFrenchVerbInflections(doc){
  conjugations = {}
    let spanElements = doc.querySelectorAll('span.Latn.form-of.lang-fr');
    conjugations.pos = 'verb'
    conjugations.number = {singular:[],plural:[]}
    conjugations.person = {first:[],second:[],third:[]}
    conjugations.tense = {present:[],imperfect:[],past_historic:[],future:[],conditional:[]}
    conjugations.mood = {indicative:[],subjunctive:[],imperative:[]}
    conjugations.form = {past_participle:[],present_participle:[]}
    spanElements.forEach((spanElement) => {
      let childText = spanElement.firstElementChild.textContent;
      if(spanElement.className.includes('1')){conjugations.person.first.push(childText);}
      if(spanElement.className.includes('2')){conjugations.person.second.push(childText);}
      if(spanElement.className.includes('3')){conjugations.person.third.push(childText);}
      if(spanElement.className.includes('|s|')){conjugations.number.singular.push(childText);
      }if(spanElement.className.includes('|p|')){conjugations.number.plural.push(childText);
      }if(spanElement.className.includes('pres')){ conjugations.tense.present.push(childText);
      }if(spanElement.className.includes('impf')){conjugations.tense.imperfect.push(childText);
      }if(spanElement.className.includes('phis')){conjugations.tense.past_historic.push(childText);
      }if(spanElement.className.includes('cond')){conjugations.tense.conditional.push(childText);
      }if(spanElement.className.includes('fut|')){conjugations.tense.future.push(childText);
      }if(spanElement.className.includes('cond')){conjugations.tense.conditional.push(childText);
      }if(spanElement.className.includes('ppr')){conjugations.form.present_participle.push(childText);
      }if(spanElement.className.includes('pp-form-of')){conjugations.form.past_participle.push(childText);
      }if(spanElement.className.includes('ind')){conjugations.mood.indicative.push(childText);
      }if(spanElement.className.includes('subj-form-of')){conjugations.mood.subjunctive.push(childText);
      }if(spanElement.className.includes('impr-form-of')){conjugations.mood.imperative.push(childText);
      }if(spanElement.className.includes('inf')){conjugations.form.infinitive.push(childText);
      }if(spanElement.className.includes('part')){conjugations.form.participle.push(childText);
      }if(spanElement.className.includes('ger')){conjugations.noun.gerundive.push(childText);
      }
    });
    return conjugations;

}
function getSpanishVerbInflections(doc){
    conjugations = {}
    let spanElements = doc.querySelectorAll('span.Latn.form-of.lang-es');
    conjugations.pos = 'verb'
    conjugations.number = {singular:[],plural:[]}
    conjugations.person = {first:[],second:[],third:[]}
    conjugations.tense = {present:[],imperfect:[],preterite:[],future:[],conditional:[]}
    conjugations.mood = {indicative:[],subjunctive:[],imperative:[]}
    conjugations.form = {gerund:[]}
    conjugations.past_participle = {masculine_singular:[],feminine_singular:[],masculine_plural:[],feminine_plural:[]}

    spanElements.forEach((spanElement) => {
      let childText = spanElement.firstElementChild.textContent;
      if(spanElement.className.includes('1')){conjugations.person.first.push(childText);}
      if(spanElement.className.includes('2')){conjugations.person.second.push(childText);}
      if(spanElement.className.includes('3')){conjugations.person.third.push(childText);}
      if(spanElement.className.includes('|s|')){conjugations.number.singular.push(childText);
      }if(spanElement.className.includes('|p|')){conjugations.number.plural.push(childText);
      }if(spanElement.className.includes('pres')){ conjugations.tense.present.push(childText);
      }if(spanElement.className.includes('impf')){conjugations.tense.imperfect.push(childText);
      }if(spanElement.className.includes('phis')){conjugations.tense.preterite.push(childText);
      }if(spanElement.className.includes('cond')){conjugations.tense.conditional.push(childText);
      }if(spanElement.className.includes('fut|')){conjugations.tense.future.push(childText);
      }if(spanElement.className.includes('cond')){conjugations.tense.conditional.push(childText);
      }if(spanElement.className.includes('ppr')){conjugations.form.present_participle.push(childText);
      }if(spanElement.className.includes('pp-form-of')){conjugations.form.past_participle.push(childText);
      }if(spanElement.className.includes('ind')){conjugations.mood.indicative.push(childText);
      }if(spanElement.className.includes('subj-form-of')){conjugations.mood.subjunctive.push(childText);
      }if(spanElement.className.includes('impr-form-of')){conjugations.mood.imperative.push(childText);
      }if(spanElement.className.includes('pp￰ms')){conjugations.past_participle.masculine_singular.push(childText);
      }if(spanElement.className.includes('ppfs')){conjugations.past_participle.feminine_singular.push(childText);
      }if(spanElement.className.includes('ppmp')){conjugations.past_participle.masculine_plural.push(childText);
      }if(spanElement.className.includes('ppfp')){conjugations.past_participle.feminine_plural.push(childText);
      }if(spanElement.className.includes('gerund')){conjugations.form.form.push(childText);

      }
    });
    return conjugations;

}
document.getElementById('manageButton').addEventListener('click', function() {
  chrome.tabs.create({ url: 'manageVocab/manageVocab.html' });
});
function formatLanguage(str){
  switch (str) {
    case "la":
      return "Latin"
    case "de":
      return "German"
  }
}
function getGermanAttributes(doc,word){
  getLinkedAttributes(doc,word,"de")
  }
function populateBookSelector() {
  chrome.storage.local.get({ bookList: [] }, (result) => {
    const bookList = result.bookList||"Default";
    chrome.storage.local.get('lastBook', function(data) {
      const lastBook = data.lastBook?data.lastBook:(result.bookList?result.bookList[0]:"Default");
      console.log(data.lastBook)
    if(lastBook){
        document.getElementById('bookSelector').innerHTML = ""
    if(lastBook!=""||lastBook==="addNew"){
      var optionNewSelected = document.createElement('option');
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
document.addEventListener('DOMContentLoaded', (event) => {
  syncBook()
  const selectLanguage = document.getElementById('selectLanguage');
  chrome.storage.local.get('languageList',function(data){
    if(data.languageList){
      console.log(data.languageList)
      let optionsArray = Array.from(selectLanguage.options);
      optionsArray.sort((a, b) => {
        const valueA = data.languageList[a.value] || 0;  // default to 0 if not in the dictionary
        const valueB = data.languageList[b.value] || 0;  // default to 0 if not in the dictionary
        return valueB - valueA;  // Descending order
      });
      selectLanguage.innerHTML = '';
      console.log(optionsArray)
      optionsArray.forEach(option => {
        selectLanguage.add(option);
      });
    }

  });
  chrome.storage.local.get('lastLang',function(data){
    const lastLang = data.lastLang||"latin"
    for (let i = 0; i < selectLanguage.options.length; i++) {
      if (selectLanguage.options[i].value === lastLang) {
        selectLanguage.options[i].selected = true;  // Mark as selected
        break;  // Exit the loop once the correct option is found
      }
    }
  });
  chrome.storage.local.get('hideBox1',function(data){
    if (!data.hideBox1||typeof(data.hideBox1)===undefined||data.hideBox1 == null){
      document.getElementById('tipsBox1').style.display='block';
    }else{
      document.getElementById('tipsBox1').style.display='none';
    }      
    console.log(data.hideBox1)

  });
  chrome.storage.local.get('hideBox0',function(data){
    if (!data.hideBox0||typeof(data.hideBox0)===undefined||data.hideBox0 == null){
      document.getElementById('tipsBox0').style.display='block';
    }else{
      document.getElementById('tipsBox0').style.display='none';
    } 
    console.log(data.hideBox0)

  });
  document.getElementById('hideTips1').addEventListener('click', function(e) {
    document.getElementById('tipsBox1').style.display='none';
    chrome.storage.local.set({ hideBox1: true }, function(data) {})
  })
  document.getElementById('hideTips0').addEventListener('click', function(e) {
    document.getElementById('tipsBox0').style.display='none';
    chrome.storage.local.set({ hideBox0: true }, function(data) {})
  })


  
  const bookSelector = document.getElementById('bookSelector');
  const newBookField = document.getElementById('newBookField');
  const addBookButton = document.getElementById('addBookButton');
  const newBookInput = document.getElementById('newBook');
  bookSelector.addEventListener('change', () => {
    if (bookSelector.value === 'addNew') {
      newBookField.style.display = 'block';
    } else {
      newBookField.style.display = 'none';
    }
  });
  addBookButton.addEventListener('click', () => {
    const newBook = newBookInput.value.trim();
    if (newBook) {
        chrome.storage.local.get({ bookList: [] }, (result) => {
            const bookList = result.bookList;
            if (!bookList.includes(newBook)) {
                bookList.push(newBook);
                chrome.storage.local.set({ bookList }, () => {
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
});
function syncBook(){
  chrome.storage.local.get('vocabList', function(data) {
  let vocabList = data.vocabList || []
  const distinctBooks = [...new Set(vocabList.map(x => x.book))];
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
  ;})
  
}
document.getElementById('addAuto').addEventListener('click', function(e) {
  const book = document.getElementById('bookSelector').value;
  chrome.storage.local.get('vocabList', function(data) {
    let vocabList = data.vocabList || [];
    if (vocabList.some(item=>item.word === vocab.word&&item.book === vocab.book)){
    }else{
      vocabList.push(vocab);
    }
    // Append the new word, definition, and snoozed field
    chrome.storage.local.set({ lastBook: book }, function() {});
    // Save updated vocab list to Chrome storage
    chrome.storage.local.set({ vocabList: vocabList }, function() {
      chrome.storage.local.get('bookList', function(data) {
        let bookList = data.bookList || [];
        if(!bookList.includes(book)){
          bookList.push(book);
        }
        chrome.storage.local.set({ vocabList: vocabList }, function(data) {})
      })
      // Show a message indicating the word was added
      const messageDiv = document.getElementById('message');
      messageDiv.textContent = `The word has been added to the list.`;

      // Clear form fields
      //document.getElementById('addVocabForm').reset();

      // Clear the message after a few seconds
      setTimeout(() => {
        messageDiv.textContent = '';
      }, 3000);
    });
  });
});
