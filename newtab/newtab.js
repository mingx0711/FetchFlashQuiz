const fetchTip = document.getElementById('fetchTip');
const fetchInfo = document.getElementById('fetchInfo');
var missingCount;
document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.local.get('currentCollectionSelection', function(data){
    currentCollectionSelection = data.currentCollectionSelection || []
  });
  chrome.storage.local.get(['selectedPalette'], function(result) {
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
      missingCount = vocabList
      .filter(item => !item.hasOwnProperty('hasChecked'))
      .length;
      if(missingCount>0){
        fetchInfo.textContent = missingCount + ' words may be missing etymology, inflection, or gender. Click here to fetch their info in the background from Wiktionary.'
      }else{
        fetchInfo.style.display = 'None'
      }
    }
    showNextItem(currentCollectionSelection);
  });

  document.getElementById('snoozeButton').addEventListener('click', function() {
    snoozeCurrentVocab();
  });
  document.getElementById('autoplayButton').addEventListener('click', function() {
    enterAutoPlay();
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
const intervalInput = document.getElementById('interval');
intervalInput.addEventListener('input', (e) => {
  const parsed = parseInt(e.target.value, 10);

  if (!isNaN(parsed)&&parsed>1) {
    chrome.storage.local.get(
      { intervalHistory: [] },
      ({ intervalHistory }) => {
        intervalHistory.push({
          value: parsed
        });
        chrome.storage.local.set(
          { intervalHistory },
          () => {
           // console.log('Saved new interval', parsed);
          }
        );
      }
    );
  }
});
fetchInfo.addEventListener('mouseenter',() => {
    fetchTip.style.display = ''
});
fetchInfo.addEventListener('mouseleave', () => {
    fetchTip.style.display = 'none'
});
var keepGoing = true;
fetchInfo.addEventListener('click', async () => {
  if(fetchInfo.textContent.includes('fetching')){
    fetchInfo.textContent = missingCount + ' words may be missing etymology, inflection, or gender. Click here to fetch their info in the background from Wiktionary.'
    keepGoing = false;
  }else{
    for (const item of vocabList) {
      if(!keepGoing){break;}
      if(!item.hasChecked||item.hasChecked!=true){
        console.log(new Date().toLocaleTimeString());        
        fetchInfoFromWik(item);
        missingCount --;
        fetchInfo.textContent = 'fetching...' + missingCount + " words left"
        await sleep(30000,300000)
      }
    };
  }
});
function sleep(maxMs, minMs) {
  var sleepMs = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, sleepMs));
}
async function fetchInfoFromWik(vocab){
  var language = vocab.book
  var word = vocab.word
  if(language!="de"){
      word = removeDiacritics(word)
  }
  var url = `https://en.wiktionary.org/wiki/${word}`
    fetch(url)
    .then(response => {return response.text();})
    .then(html => {
      // Parse the returned HTML and extract the inflection table
       const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            if (language == "Latin"){
              getLatinAttributes(doc,vocab);
            }else{
              language = convertToAbbr(language)
              getEasyAttributes(doc,vocab,language)
            }
        })
    .catch(err => {
     vocab.hasChecked = true;
      vocabList = vocabList.map(item =>
      item.word === vocab.word
      ? vocab      
      : item         
      );
    chrome.storage.local.set({ vocabList: vocabList }, function(data) {})
    })
}

async function getLatinAttributes(doc,vocab){
  let conjugations = {};
  let verbInflectionTable;
  let verbInflectionTableNew;
  let isVerb = false;
  const spanElement = doc.querySelector('span.Latn.form-of.lang-la[lang="la"]');
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
    var h2 = doc.getElementById('Latin');
    console.log(h2)
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
    if(typeof (vocab) == 'string'){
    }
    console.log(etym);
    vocab.hasChecked = true;
    if(!vocab.etym&&hasEytm){vocab.etym = etym;}
    if(!vocab.conjugations){vocab.conjugations = conjugations;}
    vocabList = vocabList.map(item =>
    item.word === vocab.word
      ? vocab      // replace the entire object
      : item         // leave everything else alone
    );
    console.log(vocab)
    chrome.storage.local.set({ vocabList: vocabList }, function(data) {})
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
    if(!vocab.etym&&hasEytm){vocab.etym = etym;}
    if(!vocab.gender){vocab.gender = autoGender;}
    if(!vocab.conjugations){vocab.conjugations = conjugations;}
    vocabList = vocabList.map(item =>
    item.word === vocab.word
      ? vocab      // replace the entire object
      : item         // leave everything else alone
    );
    chrome.storage.local.set({ vocabList: vocabList }, function(data) {})
     }else{
      const isLatinWord = doc.querySelector('strong.Latn.headword[lang="la"]');
      if(isLatinWord){
       getEasyAttributes(doc,vocab,"la")
      }else{
        vocab.hasChecked = true;
        vocabList = vocabList.map(item =>
      item.word === vocab.word
      ? vocab      // replace the entire object
      : item         // leave everything else alone
    );
    console.log(vocab)
    chrome.storage.local.set({ vocabList: vocabList }, function(data) {})
      }
    }
  }
}
function removeDiacritics(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
async function getEasyAttributes(doc,vocab,lang){
  const queryWord = 'strong.Latn.headword[lang="'+lang+'"]'
  const isWord = doc.querySelector(queryWord);
  if(isWord){
    const grannyElement = isWord.parentElement.parentElement;
    const closestOl = grannyElement.nextElementSibling;
    const liElement = closestOl.querySelector("li"); // Get the text content of the <a>
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
    vocab.hasChecked = true;
    if(!vocab.etym&&hasEytm){vocab.etym = etym;}
    if(!vocab.gender){vocab.gender = autoGender;}
    if(isVerb){
      switch(lang){
        case 'fr':
          vocab.conjugations = getFrenchVerbInflections(verbInflectionTableNew)
          break;
        // case 'es':
        //   vocab.conjugations = getSpanishVerbInflections(verbInflectionTableNew)
      }
    }
    vocabList = vocabList.map(item =>
    item.word === vocab.word
      ? vocab      // replace the entire object
      : item         // leave everything else alone
    );
    chrome.storage.local.set({ vocabList: vocabList }, function(data) {})
    console.log(vocab)
  }else{
    vocab.hasChecked = true;
    console.log(vocab + " does not exist in wiktionary")
    chrome.storage.local.set({ vocabList: vocabList }, function(data) {})
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
const langMap = {
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

// same as your convertFromAbbr:
function convertFromAbbr(lang) {
  return langMap[lang] || 'Unknown';
}

// now build a reverse map (value → key):
const nameToAbbr = Object
  .entries(langMap)                      // [[ 'de','German'], …]
  .reduce((acc, [k, v]) => {
    acc[v.toLowerCase()] = k;
    return acc;
  }, {});

// reverse converter:
function convertToAbbr(name) {
  // case‐insensitive lookup
  return nameToAbbr[name.toLowerCase()] || 'unknown';
}
window.addEventListener('resize', adjustFontSize);
adjustFontSize();
changeIntervalBtn.addEventListener('click', () => {
      // Toggle visibility of Auto Play
      if (intervalInput.style.display === 'none' || intervalInput.style.display === '') {
        intervalInput.style.display = 'inline';
      } else {
        intervalInput.style.display = 'none';
      }
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
  chrome.storage.local.get({ bookList: [] }, (result) => {
    chrome.storage.local.get({ currentCollectionSelection}, (data)=> {
    selectedbooks = data.currentCollectionSelection || ""
   // console.log(selectedbooks)
    const bookList = result.bookList;
   // console.log(bookList)
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
let timerId;
const changeIntervalBtn = document.getElementById('changeInterval');
const autoPlayBtn = document.getElementById('autoplayButton');
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
  //document.getElementById('autoplayButton').style.backgroundColor = selectedPalette.Snooze;
  //document.getElementById('autoplayButton').style.boxShadow = selectedPalette.buttonShadow;



  chrome.storage.local.set({selectedPalette: palette}, function() {
   // console.log('Palette saved:', palette);
});

}
function showNextVocab(collection = currentCollectionSelection) {
 // console.log("current collection", collection)
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
 // console.log("current collection",currentCollection.length)
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
       // console.log("le word has been snoozy shouldnt show up ")
      }
      if(currentCollection[currentVocabIndex].seen>=200){
        if(Math.random()<0.9){
         // console.log(currentCollection[currentVocabIndex].word + "has been seen too many times therefore skipped")
          currentVocabIndex = Math.floor(Math.random()*vocabList.length);
        }
      }
      if(currentCollection[currentVocabIndex].seen>=100){
        if(Math.random()<0.75){
         // console.log(currentCollection[currentVocabIndex].word + "has been seen too many times therefore skipped")
          currentVocabIndex = Math.floor(Math.random()*vocabList.length);
        }
      }
      if(currentCollection[currentVocabIndex].seen>=50){
        if(Math.random()<0.5){
         // console.log(currentCollection[currentVocabIndex].word + "has been seen too many times therefore skipped")
          currentVocabIndex = Math.floor(Math.random()*vocabList.length);
        }
      }
      
     // console.log(currentCollection[currentVocabIndex]);
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
      if(currentCollection[currentVocabIndex].etym){
        const eytmText = currentCollection[currentVocabIndex].etym;
        etymDiv.textContent += eytmText
      }else{
        etymDiv.textContent = ""
      }
      // Increment the seen count
      const match = vocabList.find(item => item.word === currentCollection[currentVocabIndex].word);
      match.seen += 1;
      chrome.storage.local.set({ vocabList: vocabList }, function() {
       // console.log(`Incremented seen count for "${word}".`);
      });
  
      // Show vocab card and hide quiz
      document.getElementById('quizContainer').style.display = 'none';
      vocabFlashcard.style.display = 'block';
    }
  } 
}

function adjustFontSize(){
  const screenWidth = window.innerWidth;
  let fontSize1 = screenWidth / 29;
  document.getElementById('defDiv').style.fontSize = fontSize1 + 'px';
  const options = document.querySelectorAll('.quiz-option');
  options.forEach(option => {
    option.style.fontSize = fontSize1;  // Set font size to 24px
  });
}
function enterAutoPlay(){
  if(autoPlayBtn.textContent === "\u25B6"){
    autoPlayBtn.innerText = String.fromCodePoint(0x23F8)
     chrome.storage.local.get({ intervalHistory: [] }, (result) => {
    let intervalSeconds;
    const history = result.intervalHistory;

    if (!Array.isArray(history) || history.length === 0) {
      // 2a. No history found → default to 6 seconds and save that back into storage
      intervalSeconds = 6;
      const now = Date.now();
      const newHistory = [{ value: intervalSeconds, timestamp: now }];

      chrome.storage.local.set(
        { intervalHistory: newHistory },
        () => {
         // console.log('No previous interval found. Defaulted to 6 and saved into history.');
        }
      );
    } else {
      // 2b. Use the last-recorded interval value
      intervalSeconds = history[history.length - 1].value;
     // console.log('Loaded interval from history:', intervalSeconds);
    }

    timerId = setInterval(() => {
      showNextVocab();
    }, intervalSeconds * 1000);
  }); 
  }else{
    autoPlayBtn.innerText = String.fromCodePoint(0x25B6);
    clearInterval(timerId)
  }

}
function snoozeCurrentVocab() {
  if (currentVocabIndex !== null && currentVocabIndex !== -1) {
    vocabList[currentVocabIndex].snoozed = true;

    // Save updated vocab list to Chrome storage
    chrome.storage.local.set({ vocabList: vocabList }, function() {
     // console.log(`Snoozed "${vocabList[currentVocabIndex].word}".`);
      showNextItem();  // Show the next item (vocab or quiz)
    });
  }
}

function showQuiz() {
  const quizStyle = Math.floor(Math.random() * 10);
 // console.log(quizStyle);
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
 // console.log(result,word)
  for (const item of vocabList) {
    if (item.word === word) {
     // console.log(item)
      let quizResults = item.quizResults;
      quizResults.unshift(result);
      if (quizResults.length > 4) {
        quizResults.pop(); // Remove the oldest result to keep only the first 4
      }
      chrome.storage.local.set({ vocabList: vocabList }, function() {
     // console.log(`Updated quiz results for "${item.word}": ${quizResults}`);
    });
    }
}
}
function quizStyle1(){
 // console.log("quiz style 1")
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
// console.log("Quiz Style 2: Ask for the word given a definition");
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
// console.log(currentQuizWord);

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
 // console.log("4, ask for pronounciation")
  const eligibleVocab = vocabList.filter(entry => entry.seen > 3 && entry.pronounciation&& entry.pronounciation!="");
  const eligibleOptions = vocabList.filter(entry => entry.pronounciation&& entry.pronounciation!="");
  const numberOfDifferentTypes = new Set(eligibleOptions.map(item => item.pronounciation)).size;
 // console.log("numberOfDifferentTypesQuiz4",numberOfDifferentTypes)

 // console.log(eligibleOptions)
  if (eligibleVocab.length < 1 || numberOfDifferentTypes <3 || eligibleOptions.length<3) {
    showNextVocab();
    return;
  }

  const quizIndex = Math.floor(Math.random() * eligibleVocab.length);
  const correctVocab = eligibleVocab[quizIndex];
  currentQuizWord = correctVocab.word;
 // console.log(currentQuizWord);
  currentQuizDefinition = correctVocab.pronounciation;
  if(currentQuizDefinition==""){
    quizStyle1();
  }else{
    const options = [correctVocab.pronounciation];
  for (let i = 0; i<3;i++) {    
    const randomIndex = Math.floor(Math.random() * eligibleOptions.length);
    const randomPronounciation = eligibleOptions[randomIndex].pronounciation;
   // console.log(randomPronounciation)
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
 // console.log("5, ask for gender")
  const eligibleVocab = vocabList.filter(entry => entry.seen > 3 && entry.gender&& entry.gender!=""&&entry.gender!="undefined");
  const numberOfDifferentTypes = new Set(vocabList.map(item => item.gender)).size;
 // console.log("numberOfDifferentTypes",numberOfDifferentTypes)
 // console.log(eligibleVocab)
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
 // console.log(randomField+":"+randomSubfield+":"+randomWord)
  if(randomWord==undefined){
    return getRandomWordFromConjugations(conjugations,commonWordsList);
  }
  const isInAllSubfields = commonWordsList.includes(randomWord)
  if(randomWord.length<=1||randomWord==null||isInAllSubfields){
   // console.log(randomWord+" is not not a wrong answer")
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
 // console.log("type 6, given word, find inflection")
  const eligibleVocab = vocabList.filter(entry => entry.conjugations&& entry.conjugations.type!="");
  if(eligibleVocab.length<1){
    return quizStyle3();
  }
  if (currentVocabIndex === null || currentVocabIndex >= vocabList.length - 1) {
    currentVocabIndex = 0;
  } else {
    currentVocabIndex = Math.floor(Math.random() * eligibleVocab.length);
   // console.log(eligibleVocab[currentVocabIndex]);
  }
  const correctVocab = eligibleVocab[currentVocabIndex];
  const conjugations = correctVocab.conjugations;
  conjToTest=[]
  let correctAnswer;
  let numberOfFields=1;
  let selectedField;
  let questionText = ""
  let options = []
 // console.log(correctVocab.word)
  if((getRandomNumber(1,9))>=8){
    if(conjugations.group&&conjugations.group!=""){

      questionText = "what is the group of " + correctVocab.word
      correctAnswer =  conjugations.group;
     // console.log(correctAnswer)
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
       // console.log(options)
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
       // console.log("not a verb")
        if(conjugations.inflections){
          numberOfFields = 1;
          selectedField = ['inflections'];
        }else{
         // console.log(correctVocab.word + "data format outdatted ")
          showNextItem();
        }
      }
  
      let selectedKeys = getRandomKeysFromArray(selectedField, numberOfFields);
      let conjugationLists = [];
      selectedKeys.forEach(field => {
          const subfield = getRandomSubfield(conjugations[field]);
         // console.log(subfield)
          conjToTest.push(subfield);
          conjugationLists.push(conjugations[field][subfield]);
        });
      const commonWordsList = findCommonWordAcrossLists(conjugationLists);
      const commonWord = commonWordsList[getRandomNumber(0,commonWordsList.length)];
      if (!commonWord) {
         // console.log("No common word found, retrying...");
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
     // console.log(wrongAnswers)
      currentQuizWord = correctVocab.word;
      currentQuizDefinition = correctAnswer;
      quizType = '6';
      options = [correctAnswer];
     // console.log(options);
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
 // console.log("type 7, given inflection, find word")
  wordToTest=""
  const eligibleVocab = vocabList.filter(entry => entry.conjugations&& entry.conjugations.type!="");
  if(eligibleVocab.length<1){
    return quizStyle1();
  }
  if (currentVocabIndex === null || currentVocabIndex >= vocabList.length - 1) {
    currentVocabIndex = 0;
  } else {
    currentVocabIndex = Math.floor(Math.random() * eligibleVocab.length);
   // console.log(eligibleVocab[currentVocabIndex]);
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
 // console.log(conjToTest)
  correctAnswer = conjToTest.toString(); 
  correctAnswer = makeStringReadable(correctAnswer);
  let wrongAnswers = [];
  while (wrongAnswers.length < 3) {
    const wrongWord = getRandomWordFromConjugations(conjugations);
   // console.log(wrongWord)
    const wrongConj = makeStringReadable( Object.values(findSubfieldsForWord(wrongWord,conjugations)).toString()); 
    if(!wrongAnswers.includes(wrongConj)&&!(wrongConj==correctAnswer)){
        wrongAnswers.push(wrongConj);
        }
    }
 // console.log(wrongAnswers)
  currentQuizWord = correctVocab.word;
  currentQuizDefinition = correctAnswer;
  quizType = '7';
  options = [correctAnswer];
 // console.log(options);
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
 // console.log(quizType)
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
  chrome.storage.local.get({ bookList: [] }, (result) => {
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
