import * as Hints from '/LatinConjugationHints.js';

const QuizType = Object.freeze({
  DEFINITION: 'definition',
  WORD: 'word',
  TRUE_FALSE: 'truefalse',
  PRONOUNCIATION: 'pronounciation',
  GENDER: 'gender',
  INFLECTION: 'inflection',
  GROUP: 'groupTest'
});
export const GenderType = Object.freeze({
  FEMININE: 'feminine',
  MASCULINE: 'masculine',
  NEUTER: 'neuter',
  COMMON: 'common'
});
let lastLang = '';
export const LanguageGenderMap = {
  "de": [GenderType.MASCULINE, GenderType.FEMININE, GenderType.NEUTER], // German
  "it": [GenderType.MASCULINE, GenderType.FEMININE], // Italian
  "fr": [GenderType.MASCULINE, GenderType.FEMININE], // French
  "nl": [GenderType.COMMON, GenderType.NEUTER],      // Dutch
  "sv": [GenderType.COMMON, GenderType.NEUTER],      // Swedish
  "ru": [GenderType.MASCULINE, GenderType.FEMININE, GenderType.NEUTER], // Russian
  "la": [GenderType.MASCULINE, GenderType.FEMININE, GenderType.NEUTER], // Latin
  "es": [GenderType.MASCULINE, GenderType.FEMININE], // Spanish
  "pt": [GenderType.MASCULINE, GenderType.FEMININE], // Portuguese
};
export const germanNounRules = [
  { ending: "ung", gender: GenderType.FEMININE },
  { ending: "heit", gender: GenderType.FEMININE },
  { ending: "keit", gender: GenderType.FEMININE },
  { ending: "schaft", gender: GenderType.FEMININE },
  { ending: "ion", gender: GenderType.FEMININE },
  { ending: "tät", gender: GenderType.FEMININE },
  { ending: "ik", gender: GenderType.FEMININE },
  { ending: "ei", gender: GenderType.FEMININE },  // Bäckerei, Polizei
  { ending: "ie", gender: GenderType.FEMININE },   // Philosophie, Melodie
  { ending: "ur", gender: GenderType.FEMININE },   // Kultur, Natur
  { ending: "ade", gender: GenderType.FEMININE },  // Marmelade, Fassade
  { ending: "age", gender: GenderType.FEMININE },  // Garage, Etage
  { ending: "anz", gender: GenderType.FEMININE },  // Distanz, Toleranz
  { ending: "enz", gender: GenderType.FEMININE },
  { ending: "e", gender: GenderType.FEMININE },

  { ending: "chen", gender: GenderType.NEUTER },
  { ending: "lein", gender: GenderType.NEUTER },
  { ending: "ment", gender: GenderType.NEUTER },
  { ending: "um", gender: GenderType.NEUTER },
  { ending: "ma", gender: GenderType.NEUTER },
  { ending: "o", gender: GenderType.NEUTER },      // Auto, Büro
  { ending: "nis", gender: GenderType.NEUTER },    // Ergebnis, Zeugnis
  { ending: "tum", gender: GenderType.NEUTER },
  { ending: "tel", gender: GenderType.NEUTER },
  { ending: "sal", gender: GenderType.NEUTER },

  { starting: "Ge", gender: GenderType.NEUTER }, // Gebäude, Geschenk

  { ending: "er", gender: GenderType.MASCULINE }, // often for people/professions, e.g. Arbeiter
  { ending: "ling", gender: GenderType.MASCULINE },
  { ending: "ismus", gender: GenderType.MASCULINE },
  { ending: "ist", gender: GenderType.MASCULINE },
  { ending: "or", gender: GenderType.MASCULINE },
  { ending: "us", gender: GenderType.MASCULINE },  // Rhythmus, Zirkus
  { ending: "ant", gender: GenderType.MASCULINE }, // Diamant, Demonstrant
  { ending: "ent", gender: GenderType.MASCULINE }, // Student, Präsident
  { ending: "ich", gender: GenderType.MASCULINE }, // Teppich
  { ending: "ig", gender: GenderType.MASCULINE },  // Käfig, König
  { ending: "ismus", gender: GenderType.MASCULINE }
];

export const latinNounRules = [
  { ending: "a", gender: GenderType.FEMININE },
  { ending: "heit", gender: GenderType.FEMININE },
  { ending: "keit", gender: GenderType.FEMININE },
  { ending: "schaft", gender: GenderType.FEMININE },
  { ending: "ion", gender: GenderType.FEMININE },
  { ending: "tät", gender: GenderType.FEMININE },
  { ending: "ik", gender: GenderType.FEMININE },
  { ending: "ei", gender: GenderType.FEMININE },  // Bäckerei, Polizei
  { ending: "ie", gender: GenderType.FEMININE },   // Philosophie, Melodie
  { ending: "ur", gender: GenderType.FEMININE },   // Kultur, Natur
  { ending: "ade", gender: GenderType.FEMININE },  // Marmelade, Fassade
  { ending: "age", gender: GenderType.FEMININE },  // Garage, Etage
  { ending: "anz", gender: GenderType.FEMININE },  // Distanz, Toleranz
  { ending: "enz", gender: GenderType.FEMININE },
  { ending: "e", gender: GenderType.FEMININE },

  { ending: "chen", gender: GenderType.NEUTER },
  { ending: "lein", gender: GenderType.NEUTER },
  { ending: "ment", gender: GenderType.NEUTER },
  { ending: "um", gender: GenderType.NEUTER },
  { ending: "ma", gender: GenderType.NEUTER },
  { ending: "o", gender: GenderType.NEUTER },      // Auto, Büro
  { ending: "nis", gender: GenderType.NEUTER },    // Ergebnis, Zeugnis
  { ending: "tum", gender: GenderType.NEUTER },
  { ending: "tel", gender: GenderType.NEUTER },
  { ending: "sal", gender: GenderType.NEUTER },

  { starting: "Ge", gender: GenderType.NEUTER }, // Gebäude, Geschenk

  { ending: "er", gender: GenderType.MASCULINE }, // often for people/professions, e.g. Arbeiter
  { ending: "ling", gender: GenderType.MASCULINE },
  { ending: "ismus", gender: GenderType.MASCULINE },
  { ending: "ist", gender: GenderType.MASCULINE },
  { ending: "or", gender: GenderType.MASCULINE },
  { ending: "us", gender: GenderType.MASCULINE },  // Rhythmus, Zirkus
  { ending: "ant", gender: GenderType.MASCULINE }, // Diamant, Demonstrant
  { ending: "ent", gender: GenderType.MASCULINE }, // Student, Präsident
  { ending: "ich", gender: GenderType.MASCULINE }, // Teppich
  { ending: "ig", gender: GenderType.MASCULINE },  // Käfig, König
  { ending: "ismus", gender: GenderType.MASCULINE }
];

function extractLatinConjugationGroup(navHeadElement) {
  if (!navHeadElement) return '';

  const navHeadText = navHeadElement.textContent?.replace(/\s+/g, ' ').trim() || '';
  const normalizedText = navHeadText.toLowerCase();
  const patterns = [
    { regex: /\bfirst\s*(?:&|and)\s*second\s+conjugation\b/i, group: 'first&second' },
    { regex: /\bthird[- ]io\s+conjugation\b/i, group: 'third_io' },
    { regex: /\birregular\s+conjugation\b/i, group: 'irregular' },
    { regex: /\bfirst\s+conjugation\b/i, group: 'first' },
    { regex: /\bsecond\s+conjugation\b/i, group: 'second' },
    { regex: /\bthird\s+conjugation\b/i, group: 'third' },
    { regex: /\bfourth\s+conjugation\b/i, group: 'fourth' },
    { regex: /\bfifth\s+conjugation\b/i, group: 'fifth' }
  ];

  for (const pattern of patterns) {
    if (pattern.regex.test(normalizedText)) {
      return pattern.group;
    }
  }

  return '';
}
export const wordTypes = Object.freeze({
  NOUN: 'noun',
  VERB: 'verb',
  ADJECTIVE: 'adjective',
  ADVERB: 'adverb',
  PRONOUN: 'pronoun',
  PREPOSITION: 'preposition',
  CONJUNCTION: 'conjunction',
  INTERJECTION: 'interjection',
  OTHER: 'other',
  TBD: 'tbd'
});
export function addType(word) {
  let language = word.language || convertToAbbr(word.book);
  switch (language) {
    case 'de':
      if (word.word[0] === word.word[0].toUpperCase()) {
        word.wordType = wordTypes.NOUN;
      } else if (word.word.endsWith("en")) {
        word.wordType = wordTypes.VERB;
      } else {
        word.wordType = wordTypes.OTHER;
      }
      break;
    case 'la':
      if (word.conjugations && word.conjugations.pos && word.conjugations.pos === 'verb') {
        word.wordType = wordTypes.VERB;
      } else if (word.gender && word.gender !== null) {
        word.wordType = wordTypes.NOUN;
      } else if (word.conjugations) {
        word.wordType = wordTypes.ADJECTIVE;
      }
      break;
    case 'zh':
      word.wordType = Math.max(1, (word.pronounciation.match(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g) || []).length, (word.pronounciation.match(/\s/g) || []).length + 1)
      break;
    default:
      if (word.gender) { word.wordType = wordTypes.NOUN; break; }
      else if (word.definition && (word.definition.startsWith("to"))) {
        word.wordType = wordTypes.VERB; break;
      } else {
        word.wordType = wordTypes.TBD; break;
      }
  }
}
export function getLanguageTips(word, inflection = "") {
  if (word.language === "de" && hasGender(word) && word.word !== "") {
    return getGermanLanguageTips(word);
  }
  if (word.language === "la") {
    return getLatinLanguageTips(word, inflection);
  }
}
export const latinDeclensions = {
  firstDeclension: {
    gender: "feminine",
    singular_nominative: "a",
    singular_genitive: "ae",
    singular_dative: "ae",
    singular_accusative: "am",
    singular_ablative: "ā",
    singular_vocative: "a",

    plural_nominative: "ae",
    plural_genitive: "ārum",
    plural_dative: "īs",
    plural_accusative: "ās",
    plural_ablative: "īs",
    plural_vocative: "ae"
  },

  secondDeclension: {
    masculine: {
      singular_nominative: ["us"],
      singular_genitive: "ī",
      singular_dative: "ō",
      singular_accusative: "um",
      singular_ablative: "ō",
      singular_vocative: "e",

      plural_nominative: "ī",
      plural_genitive: "ōrum",
      plural_dative: "īs",
      plural_accusative: "ōs",
      plural_ablative: "īs",
      plural_vocative: "ī"
    },
    neuter: {
      singular_nominative: ["um"],
      singular_genitive: "ī",
      singular_dative: "ō",
      singular_accusative: "um",
      singular_ablative: "ō",
      singular_vocative: "um",

      plural_nominative: "a",
      plural_genitive: "ōrum",
      plural_dative: "īs",
      plural_accusative: "a",
      plural_ablative: "īs",
      plural_vocative: "a"
    }
  },

  thirdDeclension: {
    masculine_feminine: {
      singular_nominative: ["s", "(modified stem)"],
      singular_genitive: "is",
      singular_dative: "ī",
      singular_accusative: ["em", "im"],
      singular_ablative: ["e", "ī"],
      singular_vocative: ["s", "(modified stem)"],

      plural_nominative: "ēs",
      plural_genitive: ["um", "ium"],
      plural_dative: "ibus",
      plural_accusative: ["ēs", "īs"],
      plural_ablative: "ibus",
      plural_vocative: "ēs"
    },
    neuter: {
      singular_nominative: "(modified stem)",
      singular_genitive: "is",
      singular_dative: "ī",
      singular_accusative: "(like Nom.)",
      singular_ablative: ["e", "ī"],
      singular_vocative: "(like Nom.)",

      plural_nominative: ["a", "ia"],
      plural_genitive: ["um", "ium"],
      plural_dative: "ibus",
      plural_accusative: ["a", "ia"],
      plural_ablative: "ibus",
      plural_vocative: ["a", "ia"]
    }
  },

  fourthDeclension: {
    masculine: {
      singular_nominative: "us",
      singular_genitive: "ūs",
      singular_dative: ["uī", "ū"],
      singular_accusative: "um",
      singular_ablative: "ū",
      singular_vocative: "us",

      plural_nominative: "ūs",
      plural_genitive: "uum",
      plural_dative: ["ibus", "ubus"],
      plural_accusative: "ūs",
      plural_ablative: ["ibus", "ubus"],
      plural_vocative: "ūs"
    },
    neuter: {
      singular_nominative: "ū",
      singular_genitive: "ūs",
      singular_dative: "ū",
      singular_accusative: "ū",
      singular_ablative: "ū",
      singular_vocative: "ū",

      plural_nominative: "ua",
      plural_genitive: "uum",
      plural_dative: ["ibus", "ubus"],
      plural_accusative: "ua",
      plural_ablative: ["ibus", "ubus"],
      plural_vocative: "ua"
    }
  },

  fifthDeclension: {
    gender: "feminine",
    singular_nominative: "ēs",
    singular_genitive: ["eī", "ē"],
    singular_dative: ["eī", "ē"],
    singular_accusative: "em",
    singular_ablative: "ē",
    singular_vocative: "ēs",

    plural_nominative: "ēs",
    plural_genitive: "ērum",
    plural_dative: "ēbus",
    plural_accusative: "ēs",
    plural_ablative: "ēbus",
    plural_vocative: "ēs"
  }
};
export const latinVerbGroups = {
  first: { infinitive: "āre", present: "ō", example: "amō" },
  second: { infinitive: "ēre", present: "eō", example: "moneō" },
  third: { infinitive: "ere", present: "ō", example: "regō" },
  fourth: { infinitive: "īre", present: "iō", example: "audiō" },
  third_io: { infinitive: "ere", present: "iō", example: "capiō" }
};

export function getLatinLanguageTips(word, inflection = "") {
  if (word.wordType == wordTypes.NOUN) {
    ////console.log(inflection)
    const group = word.conjugations.group?.toLowerCase();
    const gender = word.gender?.toLowerCase();
    const baseForm = word.conjugations.inflections.singular_nominative?.[0] || "";
    if (!group || !baseForm) return "";

    const decl = latinDeclensions[`${group}Declension`];
    if (!decl) return "";
    ////console.log()
    // Pick possible gender tables
    let candidates = [];
    if (decl.masculine_feminine) {
      candidates.push(decl.masculine_feminine, decl.neuter);
    } else if (decl.masculine && decl.neuter) {
      if (gender.startsWith("m")) candidates.push(decl.masculine);
      else if (gender.startsWith("n")) candidates.push(decl.neuter);
      else candidates.push(decl.feminine || decl.masculine);
    } else {
      candidates.push(decl);
    }
    ////console.log(candidates);
    for (const table of candidates) {
      const rule = table.singular_nominative;
      if (!rule) continue;

      const endings = Array.isArray(rule) ? rule : [rule];

      for (const ending of endings) {
        // Ignore "(modified stem)" or "(none)"
        if (
          !ending ||
          ending.includes("modified") ||
          ending.includes("none") ||
          ending.includes("(")
        )
          continue;
        if (baseForm.endsWith(ending)) {
          return `${group} declension ${gender} nouns like ${word.word} ends in “${ending}”.`;
        }
      }
    }

    return "";
  }
}
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getActualEnding(word, len) {
  return word.slice(-len);
}
export function getGermanLanguageTips(word) {
  const lowerWord = word.word.toLowerCase();
  const gender = word.gender;

  for (const { ending, gender: expected } of germanNounRules) {
    if (lowerWord.endsWith(ending)) {
      if (gender === expected) {
        ////console.log("matched")
        return ` ${word.word} ends with "${ending}", a common ${expected} ending.`;

      } else {

        return `⚠️ Careful: ${word.word} ends with "${ending}", which is usually ${expected}, but here it's ${gender}.`;
      }
    }
  }
  for (const { starting, gender: expected } of germanNounRules) {
    if (lowerWord.startsWith(starting)) {
      ////console.log(gender, expected);
      if (gender === expected) {
        return ` ${word.word} starts with "${starting}", a common ${expected} starting.`;
      } else {
        return `⚠️ Careful: ${word.word} starts with "${starting}", which is usually ${expected}, but here it's ${gender}.`;
      }
    }
  }
  return null;
}

export function chopEtym(text) {
  if (text.length <= 200) return text;

  // Take substring up to maxLength
  let chunk = text.slice(0, 200);

  // Find the last comma or period within the chunk
  let lastPunct = Math.max(chunk.lastIndexOf(","), chunk.lastIndexOf("."));

  if (lastPunct !== -1) {
    return chunk.slice(0, lastPunct + 1).trim();
  }

  // fallback: just return the chunk trimmed
  return chunk.trim() + "...";
}
export const LANGUAGES = Object.freeze({
  GERMAN: "de",
  LATIN: "la",
  FRENCH: "fr",
  ITALIAN: "it",
  SPANISH: "es",
  ENGLISH: "en",
  PORTUGUESE: "pt",
  RUSSIAN: "ru",
  CHINESE: "zh",
  JAPANESE: "ja",
  KOREAN: "ko",
  ARABIC: "ar",
  DUTCH: "nl",
  SWEDISH: "sv",
  NORWEGIAN: "no",
  DANISH: "da",
  FINNISH: "fi",
  POLISH: "pl",
  TURKISH: "tr",
  GREEK: "el",
  HEBREW: "he",
  HINDI: "hi",
  BENGALI: "bn",
  VIETNAMESE: "vi",
  INDONESIAN: "id",
  MALAY: "ms",
  THAI: "th",
  ROMANIAN: "ro",
  CZECH: "cs",
  HUNGARIAN: "hu",
  SLOVAK: "sk",
  BULGARIAN: "bg",
  UKRAINIAN: "uk",
  PERSIAN: "fa",
  SWAHILI: "sw"
});
export function convertFromAbbr(lang) {
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

function getLanguageCharSetMapping(lang) {
  switch (lang) {
    case "ja":
      return "Jpan"
    case "zh":
      return "Hani"
    default:
      return "Latn"
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
export async function getLatinAttributes(doc, word, book) {
  let conjugations = {};
  let verbInflectionTable;
  let verbInflectionTableNew;
  let isVerb = false;
  let pronounciation;
  let gender;
  let usage;
  const spanElement = doc.querySelector('span.Latn.form-of.lang-la[lang="la"]');
  //////////console.log(word);
  if (spanElement) {
    // Get its parent element
    const parentElement = spanElement.parentElement.parentElement.parentElement.parentElement;

    if (parentElement) {
      //////////console.log(parentElement)
      verbInflectionTableNew = parentElement
      if (verbInflectionTableNew.classList.contains("roa-inflection-table")) {
        isVerb = true
      }
    }

  }

  let iTableLocator = doc.querySelector('.inflection-table.vsSwitcher tbody tr th i[lang="la"]');
  if (iTableLocator) {
    let th = iTableLocator.parentElement;
    let tr = th.parentElement;
    let tbody = tr.parentElement;
    verbInflectionTable = tbody.parentElement;
  }

  if (verbInflectionTable || isVerb) {
    let anchorElement = verbInflectionTableNew.querySelector('a');
    if (anchorElement) {
      if (anchorElement) {
        const conjugationLink = doc.querySelector('div.NavHead a[href^="/wiki/Appendix:Latin_"]');
        const href = conjugationLink?.getAttribute('href') || '';
        const text = conjugationLink?.textContent?.trim().toLowerCase() || '';

        const group =
          href.match(/Latin_(first|second|third|fourth|fifth|irregular)(?:_|$)/i)?.[1]?.toLowerCase() ||
          text.match(/^(first|second|third|fourth|fifth|irregular)\s+conjugation$/i)?.[1]?.toLowerCase() ||
          '';

        conjugations.group = group;
      }

    }

    let definition = ""
    let lastOl = null;
    const parentParagraph = verbInflectionTableNew.parentElement.parentElement;
    let currentElement = parentParagraph;

    while (currentElement) {
      currentElement = currentElement.previousElementSibling;
      if (currentElement && currentElement.tagName === "OL") {
        lastOl = currentElement;
        break;
      }
    }
    if (lastOl) {
      //console.log(lastOl);
      const ListItems = lastOl.querySelectorAll('ol > li');
      let firstListItem;
      for (let i = 0; i < ListItems.length; i++) {
        if (ListItems[i].textContent.trim() !== "") {
          firstListItem = ListItems[i]
          break;
        }
      }

      if (firstListItem.querySelector('div.wiktQuote') || firstListItem.querySelector('div.h-usage-example') || firstListItem.querySelector('span.h-usage-example')) {
        usage = firstListItem.querySelector('div.wiktQuote') || firstListItem.querySelector('div.h-usage-example') || firstListItem.querySelector('span.h-usage-example');
        usage = usage.innerHTML.replace(/<\/?dl>/g, '').replace(/<br>/, '');
      } else {
        if (lastOl.querySelector('div.wiktQuote') || lastOl.querySelector('div.h-usage-example') || lastOl.querySelector('span.h-usage-example')) {
          usage = lastOl.querySelector('div.wiktQuote') || lastOl.querySelector('div.h-usage-example') || lastOl.querySelector('span.h-usage-example');
          usage = usage.innerHTML.replace(/<\/?dl>/g, '').replace(/<br>/, '');
        }
      }
      if (usage) {
        usage = usage.replace(/<dd>.*?<small>[\s\S]*?<\/small>.*?<\/dd>/g, '');
        usage = usage.replace(/<dd>.*?<small>[\s\S]*?<\/small>.*?<\/dd>/g, '');
      }

      firstListItem.querySelectorAll('span, dl,ul').forEach(el => el.remove());
      var rawDef = firstListItem.textContent.trim();
      if (rawDef.includes('.mw')) {
        definition = rawDef.replace(/\.mw[\s\S]*$/, '');

      } else {
        definition = rawDef.trim();
      }

    }
    // Select the <span> element
    let spanElements = doc.querySelectorAll('span.Latn.form-of.lang-la');
    conjugations.pos = 'verb'
    conjugations.number = { singular: [], plural: [] }
    conjugations.person = { first: [], second: [], third: [] }
    conjugations.tense = { present: [], imperfect: [], perfect: [], future: [], pluperfect: [], futurePerfect: [], sigmaticFuture: [], aorist: [] }
    conjugations.voice = { active: [], passive: [] }
    conjugations.mood = { indicative: [], subjunctive: [], imperative: [] }
    conjugations.form = { infinitive: [], participle: [] }
    conjugations.noun = { gerundive: [], supine: [] }
    conjugations.case = { genitive: [], ablative: [], accusative: [], dative: [] }
    spanElements.forEach((spanElement) => {
      let childText = spanElement.firstElementChild.textContent;
      if (spanElement.className.includes('1')) { conjugations.person.first.push(childText); }
      if (spanElement.className.includes('2')) { conjugations.person.second.push(childText); }
      if (spanElement.className.includes('3')) { conjugations.person.third.push(childText); }
      if (spanElement.className.includes('|s|')) {
        conjugations.number.singular.push(childText);
      } if (spanElement.className.includes('|p|')) {
        conjugations.number.plural.push(childText);
      } if (spanElement.className.includes('pres')) {
        conjugations.tense.present.push(childText);
      } if (spanElement.className.includes('impf')) {
        conjugations.tense.imperfect.push(childText);
      } if (spanElement.className.includes('fut|')) {
        conjugations.tense.future.push(childText);
      } if (spanElement.className.includes('perf')) {
        conjugations.tense.perfect.push(childText);
      } if (spanElement.className.includes('plup')) {
        conjugations.tense.pluperfect.push(childText);
      } if (spanElement.className.includes('futp')) {
        conjugations.tense.futurePerfect.push(childText);
      } if (spanElement.className.includes('sigm')) {
        conjugations.tense.sigmaticFuture.push(childText);
      } if (spanElement.className.includes('aor')) {
        conjugations.tense.aorist.push(childText);
      } if (spanElement.className.includes('act')) {
        conjugations.voice.active.push(childText);
      } if (spanElement.className.includes('pass')) {
        conjugations.voice.passive.push(childText);
      } if (spanElement.className.includes('ind')) {
        conjugations.mood.indicative.push(childText);
      } if (spanElement.className.includes('sub')) {
        conjugations.mood.subjunctive.push(childText);
      } if (spanElement.className.includes('imp-form-of')) {
        conjugations.mood.imperative.push(childText);
      } if (spanElement.className.includes('inf')) {
        conjugations.form.infinitive.push(childText);
      } if (spanElement.className.includes('part')) {
        conjugations.form.participle.push(childText);
      } if (spanElement.className.includes('gen')) {
        conjugations.case.genitive.push(childText);
      } if (spanElement.className.includes('ger')) {
        conjugations.noun.gerundive.push(childText);
      } if (spanElement.className.includes('dat')) {
        conjugations.case.dative.push(childText);
      } if (spanElement.className.includes('acc')) {
        conjugations.case.accusative.push(childText);
      } if (spanElement.className.includes('sup')) {
        conjugations.noun.supine.push(childText);
      } if (spanElement.className.includes('abl')) {
        conjugations.case.ablative.push(childText);
      }
    });
    var h2 = doc.getElementById('Latin');
    var h2Parent = h2.parentElement;
    var hasEytm = true;
    while (true) {
      if (h2Parent && h2Parent.firstChild && h2Parent.firstChild.id && h2Parent.firstChild.id.includes('Etymology')) {
        break;
      } else {
        if (h2Parent.nextElementSibling) {
          h2Parent = h2Parent.nextElementSibling;
        } else {
          hasEytm = false;
          break;
        }
      }
    }
    var etym;
    if (!hasEytm) { etym = "" } else {
      const nextElem = h2Parent.nextElementSibling;
      etym = nextElem.innerText;
      etym = etym.replace(/\.mw[\s\S]*\}/, '');
    }
    ////////console.log(etym);
    let vocab = { word, definition, snoozed: false, book, pronounciation, language: "la", gender, conjugations, seen: 0, type: "verb", quizResults: ['n', 'n', 'n', 'n'], hasChecked: true, etym: hasEytm ? etym : "", usage: usage || "" };
    addType(vocab);
    //console.log(vocab, vocab.usage);
    vocab.conjugations.type = 'latin';
    return vocab
  }
  else {
    const nounInflectionTable = doc.querySelector('table.inflection-table-la');
    if (nounInflectionTable) {
      const conjugations = {}
      let declension = ""
      const declensionElements = doc.querySelectorAll('a[href^="/wiki/Appendix:Latin_"][href*="declension"]');

      if (declensionElements) {
        const declensionElementsLength = declensionElements.length / 2
        for (let i = 0; i < declensionElementsLength; i++) {
          declension += declensionElements[i].textContent
        }
        declension = declension.replaceAll("firstsecond", "first&second").replaceAll("-", " ")
        declension = declension.slice(0, declension.indexOf(' ')).trim();
        conjugations.group = declension
      }
      const queryWord = 'strong.Latn.headword[lang="la"]'
      const isWord = doc.querySelector(queryWord);
      let autoGender = ''
      if (isWord) {
        const grannyElement = isWord.parentElement.parentElement;
        const genderSpan = grannyElement.querySelector("span.gender");
        if (genderSpan) {
          const genderDef = genderSpan.firstChild.textContent;
          switch (genderDef) {
            case 'f':
              autoGender = GenderType.FEMININE
              break;
            case 'm':
              autoGender = GenderType.MASCULINE
              break;
            case 'n':
              autoGender = GenderType.NEUTER
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
      for (let i = 0; i < ListItems.length; i++) {
        if (ListItems[i].textContent.trim() !== "") {
          var firstListItem = ListItems[i]
          break;
        }
      }
      firstListItem.querySelectorAll('dl,ul').forEach(el => el.remove());
      var definition = firstListItem.textContent.trim();
      conjugations.inflections = {
        singular_nominative: [],
        plural_nominative: [], singular_genitive: [],
        plural_genitive: [], singular_dative: [],
        plural_dative: [], singular_accusative: [],
        plural_accusative: [], singular_ablative: [],
        plural_ablative: [], singular_vocative: [],
        plural_vocative: [],

      }
      let spanElements = doc.querySelectorAll('span.Latn.form-of.lang-la');
      spanElements.forEach((spanElement) => {
        let childText = spanElement.firstElementChild.textContent;
        if (spanElement.className.includes('s-') && spanElement.className.includes('nom')) { conjugations.inflections.singular_nominative.push(childText); }
        if (spanElement.className.includes('p-') && spanElement.className.includes('nom')) { conjugations.inflections.plural_nominative.push(childText); }
        if (spanElement.className.includes('s-') && spanElement.className.includes('acc')) { conjugations.inflections.singular_accusative.push(childText); }
        if (spanElement.className.includes('p-') && spanElement.className.includes('acc')) { conjugations.inflections.plural_accusative.push(childText); }
        if (spanElement.className.includes('s-') && spanElement.className.includes('dat')) { conjugations.inflections.singular_dative.push(childText); }
        if (spanElement.className.includes('p-') && spanElement.className.includes('dat')) { conjugations.inflections.plural_dative.push(childText); }
        if (spanElement.className.includes('s-') && spanElement.className.includes('gen')) { conjugations.inflections.singular_genitive.push(childText); }
        if (spanElement.className.includes('p-') && spanElement.className.includes('gen')) { conjugations.inflections.plural_genitive.push(childText); }
        if (spanElement.className.includes('s-') && spanElement.className.includes('voc')) { conjugations.inflections.singular_vocative.push(childText); }
        if (spanElement.className.includes('p-') && spanElement.className.includes('voc')) { conjugations.inflections.plural_vocative.push(childText); }
        if (spanElement.className.includes('s-') && spanElement.className.includes('abl')) { conjugations.inflections.singular_ablative.push(childText); }
        if (spanElement.className.includes('p-') && spanElement.className.includes('abl')) { conjugations.inflections.plural_ablative.push(childText); }

      });
      let hasEytm = true;
      conjugations.type = 'latin';
      var h2 = doc.getElementById('Latin');
      var h2Parent = h2.parentElement;
      while (true) {
        if (h2Parent && h2Parent.firstChild && h2Parent.firstChild.id && h2Parent.firstChild.id.includes('Etymology')) {
          break;
        } else {
          if (h2Parent.nextElementSibling) {
            h2Parent = h2Parent.nextElementSibling;
          } else {
            hasEytm = false;
            break;
          }
        }
      }

      var etym;
      if (!hasEytm) { etym = "" } else {
        while (h2Parent.nextElementSibling) {
          if (h2Parent.nextElementSibling.tagName === 'P') {
            break;
          }
          h2Parent = h2Parent.nextElementSibling
        }
        const nextElem = h2Parent.nextElementSibling;
        etym = nextElem.innerText;
        etym = etym.replace(/\.mw[\s\S]*\}/, '');
      }
      if (sibling.querySelector('div.wiktQuote')) {
        usage = sibling.querySelector('div.wiktQuote').innerHTML;
        usage = usage.replace(/<\/?dl>/g, '').replace(/<br>/, '');
      }

      let vocab = { word, definition, snoozed: false, book, pronounciation, language: "la", gender: autoGender ? autoGender : gender, conjugations, hasChecked: true, seen: 0, quizResults: ['n', 'n', 'n', 'n'], etym: hasEytm ? etym : "", usage: usage ? usage : "" }
      //console.log(vocab.word, vocab.usage);
      addType(vocab);
      return vocab
    } else {
      const latinElement = doc.querySelector('span.form-of-definition-link i.Latn.mention[lang="la"]');
      if (latinElement) {
        const anchorTag = latinElement.querySelector('a');
        if (anchorTag) {
          const linkText = anchorTag.textContent; // Get the text content of the <a>
          const spanElement = latinElement.parentElement;
          const spanElement1 = spanElement.parentElement;
          const liElement = spanElement1.parentElement;
          let currentInflection = ""
          if (liElement) {
            const headerSpan = liElement.querySelector('.form-of-definition.use-with-mention');
            let headerText = headerSpan.textContent.trim();
            headerText = headerText.replace(/:$/, '').trim();  // remove trailing colon

            // 2. Extract and join the OL list items
            let listText = Array.from(liElement.querySelectorAll('ol > li'))
              .map(li => li.textContent.trim())
              .join(' OR ');
            if (listText.length > 1) {
              listText = "✨" + listText + "✨";
            } else {
              headerText = "✨" + headerText + "✨";
            }
            // 3. Combine them into final string
            currentInflection = `${listText}${headerText}`;
          }
          currentInflection.replace("")
          let noramlizedWord = word.normalize('NFD');
          let noDiacritics = noramlizedWord.replace(/[\u0300-\u036f]/g, "");
          let finalStr = noDiacritics.replace(/-/g, "");
          let finallinkText = processWordByLanguage(LANGUAGES.LATIN, linkText)
          if (finalStr.trim() != finallinkText.trim()) {
            var url = `https://en.wiktionary.org/wiki/${finallinkText}`
            const res = await fetch(url);
            const html = await res.text();
            const parser = new DOMParser();
            const baseDoc = parser.parseFromString(html, 'text/html');
            let vocabResult = await getLatinAttributes(baseDoc, linkText, book);
            return { currentInflection, vocabResult };
          } else {
            return "invalid"
          }
        }
      } else {
        const isLatinWord = doc.querySelector('strong.Latn.headword[lang="la"]');
        if (isLatinWord) {
          return getEasyAttributes(doc, word, "la", book)
        } else {
          ////////console.log("No latin word found")
          return "invalid"
        }
      }
    }
  }
}
export async function getLinkedAttributes(doc, word, lang, book) {
  let autoGender = ''
  let gender = null
  var mention = getLanguageCharSetMapping(lang)
  const baseFormQuery = 'span.form-of-definition-link i[class="' + mention + ' mention"][lang="' + lang + '"]'
  const hasBaseForm = doc.querySelector(baseFormQuery);
  const queryWord = 'strong.' + mention + '.headword[lang="' + lang + '"]'
  let isWord = doc.querySelector(queryWord);
  let title = null;
  if (word.length === 1) {
    let res = await getEasyAttributes(doc, word, lang, book)
    if (typeof res !== "string" || res !== "invalid") {
      return res;
    }
  }
  if (mention === 'Jpan') {
    title = getJapaneseBaseText(doc);
  } else if (lang === 'zh') {
    title = getChineseBaseText(doc);
  }
  if (hasBaseForm) {
    const anchorTag = hasBaseForm.querySelector('a');
    if (anchorTag) {
      const linkText = anchorTag.textContent;
      const spanElement = hasBaseForm.parentElement;
      const spanElement1 = spanElement.parentElement;
      const liElement = spanElement1.parentElement;
      let definition = ""
      if (liElement) {
        const firstInflection = liElement.querySelector('ol')
        if (firstInflection) {
          const inflectionDescription = firstInflection.querySelector('li')
          definition += inflectionDescription.textContent.trim()
        } else {
          definition = liElement.textContent.trim()
        }
      }
      let noramlizedWord = word.normalize('NFD');
      let noDiacritics = noramlizedWord.replace(/[\u0300-\u036f]/g, "");
      let finalStr = noDiacritics.replace(/-/g, "");
      let baseDoc;
      let finallinkText = processWordByLanguage(lang, linkText)
      if (finalStr.trim() != linkText.trim()) {
        var url = `https://en.wiktionary.org/wiki/${finallinkText}`;
        try {
          await fetch(url)
          var url = `https://en.wiktionary.org/wiki/${finallinkText}`
          ////////console.log(url)
          const res = await fetch(url);
          const html = await res.text();
          const parser = new DOMParser();
          const baseDoc = parser.parseFromString(html, 'text/html');
          //console.log(book)
          return await getEasyAttributes(baseDoc, linkText, lang, book);
        }
        catch (error) {
          if (lang === 'de' && word.length > 0) {
            const firstChar = word.charAt(0);
            if (firstChar === firstChar.toLowerCase()) {
              word = firstChar.toUpperCase() + word.slice(1);
              return await getLinkedAttributes(baseDoc, word, lang, book);
            }
          } else {
            if (title) {
              var url = `https://en.wiktionary.org/wiki/${title}`;
              console.log(title)
              try {
                await fetch(url)
                const res = await fetch(url);
                const html = await res.text();
                const parser = new DOMParser();
                const baseDoc = parser.parseFromString(html, 'text/html');
                return await getEasyAttributes(baseDoc, title, lang, book);
              } catch (error) {
                return "invalid";
              }
            }
          }
          return "invalid";
        }
      }

    } else {
      return getEasyAttributes(doc, word, lang, book)

    }
    //definition = document.getElementById("vocabInfo").textContent+","+definition
    //vocab = {word,definition,snoozed: false,book,pronounciation,gender,hasChecked:true,seen:0,quizResults: ['n','n','n','n']}
  } else {
    if (title) {
      var url = `https://en.wiktionary.org/wiki/${title}`;
      try {
        await fetch(url)
        const res = await fetch(url);
        const html = await res.text();
        const parser = new DOMParser();
        const baseDoc = parser.parseFromString(html, 'text/html');
        return await getEasyAttributes(baseDoc, title, lang, book);
      } catch (error) {
        return "invalid";
      }
    }
    return getEasyAttributes(doc, word, lang, book)
  }
}
export const invalidWord = "Word can not be found in wiktionary. This could be because this is a combined word, the word does not exist in your selected language, mispelling, or capitalization issues."

function getGermanConjugationAttributes(doc) {
  const navFrames = doc.querySelectorAll('.NavFrame');

  for (const navFrame of navFrames) {
    const navHeadText = navFrame.querySelector('.NavHead')?.textContent?.toLowerCase() || '';
    if (!navHeadText.includes('conjugation of')) {
      continue;
    }

    const rows = navFrame.querySelectorAll('table.inflection-table tr');
    const conjugation = {};

    rows.forEach((row) => {
      const headerText = row.querySelector('th')?.textContent?.trim().toLowerCase();
      const valueCell = row.querySelector('td');
      const valueText = valueCell?.textContent?.replace(/\s+/g, ' ').trim();

      if (!headerText || !valueText) {
        return;
      }

      if (headerText === 'past participle') {
        const firstLinkedForm =
          valueCell?.querySelector('a')?.textContent?.trim() ||
          valueCell?.querySelector('strong')?.textContent?.trim() ||
          '';
        conjugation.past_participle = (firstLinkedForm || valueText)
          .replace(/\d+/g, '')
          .trim()
          .split(/\s+/)[0];
      }

      if (headerText === 'auxiliary') {
        conjugation.auxiliary = valueText;
      }
    });
    if (Object.keys(conjugation).length > 0) {
      return conjugation;
    }
  }

  return null;
}

export async function getEasyAttributes(doc, word, lang, book) {
  let mention = getLanguageCharSetMapping(lang)
  let pronounciationText = null
  let autoGender = ''
  let gender = null
  let pronounciation = null
  let definition = ""

  const queryWord = 'strong.' + mention + '.headword[lang="' + lang + '"]'
  let isWord = doc.querySelector(queryWord);
  if (lang === "zh" && !isWord) {
    isWord = doc.querySelector('strong.Hant.headword[lang="zh"]')
    if (!isWord) {
      isWord = doc.querySelector('strong.Hans.headword[lang="zh"]');
      if (!isWord) {
        isWord = doc.querySelector('strong.Hani.headword[lang="zh"]');
        mention = "Hani"
      } else {
        mention = "Hans"
      }
    } else {
      mention = "Hant"
    }
  }
  if (isWord) {
    const grannyElement = isWord.parentElement.parentElement;
    const closestOl = grannyElement.nextElementSibling;
    var usage;
    const liElement = closestOl.querySelector("li");
    let liElementCopy = liElement.cloneNode(true);
    if (liElement) {
      if (liElement.querySelector('div.h-usage-example') || liElement.querySelector('span.h-usage-example.collocation')) {
        usage = liElementCopy.querySelector('div.h-usage-example') || liElementCopy.querySelector('span.h-usage-example.collocation');
        usage = usage.innerHTML.replace(/<\/?dl>/g, '').replace(/<br>/, '');
      } else {
        if (mention === "Hans" || mention === "Jpan" || mention === "Hant" || mention === "Hani") {
          usage = extractFirstDdTextFromLi(liElementCopy);
        }
      }
      if (usage) {
        usage = usage.replace(/(<dd>\s*<small>\s*\([^<]*?\)\s*<\/small>\s*<\/dd>)(?![\s\S]*<dd>)/, '');
        usage = usage.replace(/<dd>.*?<small>[\s\S]*?<\/small>.*?<\/dd>/g, '');
      }
    }
    liElement.querySelectorAll('dl,u,span,ul').forEach(el => el.remove());
    definition = liElement.textContent.trim()
    definition = definition.replace(/ *\([^)]*\) */g, "");
    const spanElement = doc.querySelector('span.' + mention + '.form-of.lang-' + lang + '[lang="' + lang + '"]');
    let isVerb = false;
    let verbInflectionTableNew;
    if (spanElement) {
      // Get its parent element
      const parentElement = spanElement.parentElement.parentElement.parentElement.parentElement;
      if (parentElement) {
        verbInflectionTableNew = parentElement
        if (verbInflectionTableNew.classList.contains("roa-inflection-table")) {
          isVerb = true
        }
        if (isVerb) {
          switch (lang) {
            case 'fr':
              vocab.conjugations = getFrenchVerbInflections(verbInflectionTableNew)
              break;
            // case 'es':
            //   vocab.conjugations = getSpanishVerbInflections(verbInflectionTableNew)
          }
        }
      }
    }
    const genderSpan = grannyElement.querySelector("span.gender");
    if (genderSpan) {
      const genderDef = genderSpan.firstChild.textContent;
      switch (genderDef) {
        case 'f':
          autoGender = GenderType.FEMININE
          break;
        case 'm':
          autoGender = GenderType.MASCULINE
          break;
        case 'n':
          autoGender = GenderType.NEUTER
          break;
        case 'c':
          autoGender = GenderType.COMMON;
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
    while (true) {
      if (h2Parent && h2Parent.firstChild && h2Parent.firstChild.id && h2Parent.firstChild.id.includes('Etymology')) {
        break;
      } else {
        if (h2Parent.nextElementSibling) {
          h2Parent = h2Parent.nextElementSibling;
        } else {
          hasEytm = false;
          break;
        }
      }
    }
    var etym;
    if (!hasEytm) { etym = "" } else {
      while (h2Parent.nextElementSibling) {
        if (h2Parent.nextElementSibling.tagName === 'P') {
          break;
        }
        h2Parent = h2Parent.nextElementSibling
      }
      let nextElem = h2Parent.nextElementSibling;
      if (lang === 'ja' || lang === 'zh') {
        while (nextElem.tagName === 'P') {
          if (nextElem.innerText !== undefined && nextElem.innerText !== "") {
            etym += nextElem.innerText;
          }
          nextElem = nextElem.nextElementSibling;
        }
      } else {
        etym = nextElem.innerText;
      }
      if (etym.includes("This etymology is missing or incomplete")) {
        etym = ""
      } else {
        etym = etym.replace(/\.mw[\s\S]*\}/, '');
        etym = etym.replace('undefined', '');
      }
    }
    if (lang === 'ja') {
      let jpPronounciation = doc.querySelector('[title="w:Tokyo dialect"]');
      if (jpPronounciation) {
        let jpPronounciationParent = jpPronounciation.parentElement.parentElement
        pronounciationText = jpPronounciationParent.nextElementSibling.innerText;
      }
    } else if (lang === 'zh') {
      let zhPronounciation = doc.querySelector('[title="w:Pinyin"]');
      if (zhPronounciation) {
        let zhPronounciationParent = zhPronounciation.parentElement.parentElement
        pronounciationText = zhPronounciationParent.nextElementSibling.innerText;
        pronounciationText = pronounciationText.split(',')[0].split('（')[0];
      }
    }
    const germanConjugation = lang === 'de' ? getGermanConjugationAttributes(doc) : null;
    let vocab = { word, definition, snoozed: false, book, language: lang, pronounciation: pronounciationText, gender: autoGender ? autoGender : gender, hasChecked: true, seen: 0, quizResults: ['n', 'n', 'n', 'n'], etym: hasEytm ? etym : "", usage: usage ? usage : "" }
    if (germanConjugation) {
      vocab.conjugation = germanConjugation;
    }
    console.log(vocab.word, vocab.conjugation ? vocab.conjugation : "no conjugation");
    addType(vocab);
    return vocab;
  } else {
    return "invalid"
  }
}
function getFrenchVerbInflections(doc) {
  let conjugations = {}
  let spanElements = doc.querySelectorAll('span.Latn.form-of.lang-fr');
  conjugations.pos = 'verb'
  conjugations.number = { singular: [], plural: [] }
  conjugations.person = { first: [], second: [], third: [] }
  conjugations.tense = { present: [], imperfect: [], past_historic: [], future: [], conditional: [] }
  conjugations.mood = { indicative: [], subjunctive: [], imperative: [] }
  conjugations.form = { past_participle: [], present_participle: [] }
  spanElements.forEach((spanElement) => {
    let childText = spanElement.firstElementChild.textContent;
    if (spanElement.className.includes('1')) { conjugations.person.first.push(childText); }
    if (spanElement.className.includes('2')) { conjugations.person.second.push(childText); }
    if (spanElement.className.includes('3')) { conjugations.person.third.push(childText); }
    if (spanElement.className.includes('|s|')) {
      conjugations.number.singular.push(childText);
    } if (spanElement.className.includes('|p|')) {
      conjugations.number.plural.push(childText);
    } if (spanElement.className.includes('pres')) {
      conjugations.tense.present.push(childText);
    } if (spanElement.className.includes('impf')) {
      conjugations.tense.imperfect.push(childText);
    } if (spanElement.className.includes('phis')) {
      conjugations.tense.past_historic.push(childText);
    } if (spanElement.className.includes('cond')) {
      conjugations.tense.conditional.push(childText);
    } if (spanElement.className.includes('fut|')) {
      conjugations.tense.future.push(childText);
    } if (spanElement.className.includes('cond')) {
      conjugations.tense.conditional.push(childText);
    } if (spanElement.className.includes('ppr')) {
      conjugations.form.present_participle.push(childText);
    } if (spanElement.className.includes('pp-form-of')) {
      conjugations.form.past_participle.push(childText);
    } if (spanElement.className.includes('ind')) {
      conjugations.mood.indicative.push(childText);
    } if (spanElement.className.includes('subj-form-of')) {
      conjugations.mood.subjunctive.push(childText);
    } if (spanElement.className.includes('impr-form-of')) {
      conjugations.mood.imperative.push(childText);
    } if (spanElement.className.includes('inf')) {
      conjugations.form.infinitive.push(childText);
    } if (spanElement.className.includes('part')) {
      conjugations.form.participle.push(childText);
    } if (spanElement.className.includes('ger')) {
      conjugations.noun.gerundive.push(childText);
    }
  });
  return conjugations;

}
export function getChineseBaseText(doc) {
  const bolds = doc.querySelectorAll('b');
  for (const b of bolds) {
    if (b.textContent.includes('see')) {
      const span = b.querySelector('span[class*="Han"]');
      if (span) {
        const link = span.querySelector('a');
        if (link) {
          return link.getAttribute('title')
        } else {
        }
      } else {
      }
    }
  }

  const seeAlsoDiv = doc.querySelector('.disambig-see-also');
  const result = seeAlsoDiv ? seeAlsoDiv.querySelector('a')?.textContent.trim() : null;
  if (result) {
    return result;
  }
}
export function getJapaneseBaseText(doc) {
  const table = doc.querySelectorAll('span[class*="Jpan"]');
  for (const t of table) {
    let a = t.querySelector('a[title][href]');
    if (a) {
      return a.getAttribute('title');
    }
  }
}
export function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function extractFirstDdTextFromLi(li) {
  if (!li) return null;
  const nymsSpan = li.querySelector('span.nyms');
  if (nymsSpan) {
    const dd = nymsSpan.closest('dd');
    if (dd) {
      dd.remove();
    }
    nymsSpan.remove();
  }
  li.querySelectorAll('a[href*="/wiki"]').forEach(a => {
    a.replaceWith(document.createTextNode(a.textContent));
  });

  const inQuote = li.querySelector("ul");
  const firstDd = li.querySelector("dd");
  if (inQuote) {
    const quoteDl = li.querySelector("dd") || li.querySelector("dl");
    console.log(quoteDl);
    if (quoteDl) return extractFromZhusexDl(quoteDl);
  }
  if (!firstDd) {
    if (inQuote) {
      const quoteDl = li.querySelector("dl");
      if (quoteDl) return extractFromZhusexDl(quoteDl);
    } else {
      return null
    }
  };
  const scope = firstDd.querySelector("dl.zhusex") || firstDd;
  return extractFromZhusexDl(scope);
}

function extractFromZhusexDl(zhusexDl) {
  const scope = zhusexDl.cloneNode(true);
  scope.querySelectorAll('span[style*="forestgreen"]').forEach(span => {
    const t = span.textContent;
    if (t.includes("MSC") || t.includes("Classical Chinese")) span.remove();
  });

  const hant = scope.querySelector('span.Hant');
  const hans = scope.querySelector('span.Hans');

  if (hant && hans) {
    // remove the Hani separator (／) between them, if present
    const hani = hant.nextElementSibling;
    if (hani && hani.matches('span.Hani')) hani.remove();

    // remove Hant itself
    hant.remove();

    // if there is leftover whitespace-only text before Hans, clean it
    const prev = hans.previousSibling;
    if (prev && prev.nodeType === Node.TEXT_NODE && !prev.textContent.trim()) prev.remove();
  }
  return scope.innerHTML
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
export function getRandomSubfield(obj) {
  const keys = Object.keys(obj);
  const validKeys = keys.filter(field => (field !== 'pos') && (field !== 'type'));
  const randomKey = validKeys[Math.floor(Math.random() * keys.length)];
  return randomKey;
}
export function removeSnooze() {
  const snoozeButton = document.getElementById('snoozeButton');
  if (snoozeButton) {
    snoozeButton.style.display = 'none';
  }
}
export function showSnooze() {
  const snoozeButton = document.getElementById('snoozeButton');
  if (snoozeButton) {
    snoozeButton.style.display = '';
  }
}
// Helper function to find common word across multiple lists
function findCommonWordAcrossLists(lists) {
  const res = lists.reduce((a, b) => a.filter(c => b.includes(c))); // Get first common word or undefined
  return res;
}

export function findSubfieldsForWord(word, conjugations) {
  let wordSubfields = [];

  for (const field in conjugations) {
    if ((field !== 'pos') && (field !== 'type')) {
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
      combinedSubfields[field] += "/" + subfield;
    } else {
      // Otherwise, just set the subfield for this field
      combinedSubfields[field] = subfield;
    }
  });

  return combinedSubfields;
}
export function showNextAndAutoplay() {


  if (document.getElementById('autoplayButton')) {
    document.getElementById('nextButton').style.display = '';
    document.getElementById('autoplayButton').style.display = '';

  }
}
export function expandWord(input) {
  return input
    .split(',')
    .map(part => {
      const trimmed = part.trim();
      const match = trimmed.match(/^(.*)\(([^)]+)\)$/);
      if (match) {
        const base = match[1];
        const inside = match[2];
        return `${base}, ${base}${inside}`;
      }
      return trimmed;
    })
    .join(', ');
}


export function prepareOptionsForQuiz6(correctVocab) {
  const conjugations = correctVocab.conjugations;
  let conjToTest = [];
  let numberOfFields = 1;
  let selectedField;
  let options = [];
  let correctAnswer = "";
  let currentQuizWord = "";
  let currentQuizDefinition = "";
  let quizType = "";
  let questionText = "";
  if ((getRandomNumber(1, 9)) >= 9) {
    if (conjugations.group && conjugations.group != "") {
      quizType = 'groupTest';
      questionText = "what is the group of \r\n" + correctVocab.word
      correctAnswer = conjugations.group;
      // //////////console.log.log(correctAnswer)
      options = [correctAnswer];
      currentQuizWord = correctVocab.word;
      if (Array.isArray(correctAnswer)) {
        correctAnswer = correctAnswer[0]
      }
      let wrongAnswers = []
      if (conjugations.pos == "verb") {
        wrongAnswers = ["first", "second", "third", "fourth", "irregular", "first&second"]
      } else {
        wrongAnswers = ["first", "second", "third", "fourth", "fifth", "irregular"]
      }
      for (let i = 0; i < 3; i++) {
        //////console.log(options)
        const index = getRandomNumber(0, wrongAnswers.length - 1)
        if (!options.includes(wrongAnswers[index])) {
          options.push(wrongAnswers[index]);
        } else {
          i--
        }
      }
    }
  } else {
    quizType = '6';
    if (conjugations.pos == "verb") {
      const typeOfVerbToTest = getRandomNumber(1, 10)
      numberOfFields = getRandomNumber(1, 5);
      const verbFields1 = ['mood', 'person', 'number', 'voice', 'tense'];
      const verbFields2 = ['voice', 'tense', 'form'];
      const verbFields3 = ['noun', 'case'];

      if (typeOfVerbToTest <= 8) {
        selectedField = verbFields1
      } else if (typeOfVerbToTest <= 9) {
        selectedField = verbFields2
      } else if (typeOfVerbToTest <= 10) {
        selectedField = verbFields3
      }
    } else {
      // //////////console.log.log("not a verb")
      if (conjugations.inflections) {
        numberOfFields = 1;
        selectedField = ['inflections'];
      } else {
        // //////////console.log.log(correctVocab.word + "data format outdatted ")
        showNextItem();
      }
    }

    let selectedKeys = getRandomKeysFromArray(selectedField, numberOfFields);
    let conjugationLists = [];
    selectedKeys.forEach(field => {
      const subfield = getRandomSubfield(conjugations[field]);
      // //////////console.log.log(subfield)
      conjToTest.push(subfield);
      conjugationLists.push(conjugations[field][subfield]);
    });
    const commonWordsList = findCommonWordAcrossLists(conjugationLists);
    const commonWord = commonWordsList[getRandomNumber(0, commonWordsList.length)];
    if (!commonWord) {
      // //////////console.log.log("No common word found, retrying...");
      return prepareOptionsForQuiz6(correctVocab); // Restart quiz if no common word is found
    }
    ////////console.log("Common word found:", commonWord);
    correctAnswer = commonWord;
    let wrongAnswers = [];
    while (wrongAnswers.length < 3) {
      const wrongWord = getRandomWordFromConjugations(conjugations, commonWordsList);
      if (!wrongAnswers.includes(wrongWord) && !(wrongWord == commonWord)) {
        wrongAnswers.push(wrongWord);
      }
    }
    // //////////console.log.log(wrongAnswers)
    currentQuizWord = correctVocab.word;
    currentQuizDefinition = correctAnswer;
    quizType = '6';
    options = [correctAnswer];
    // //////////console.log.log(options);
    for (let i = 0; i < 3; i++) {
      if (!options.includes(wrongAnswers)) {
        options.push(wrongAnswers[i]);
      } else {
        i--;
      }
    }
    let correctConj = correctAnswer;
    shuffleArray(options);

    let names = conjToTest.toString();
    names = makeStringReadable(names)
    questionText = `What is one ${names} form of the word "${correctVocab.word}"?`
  }

  ////////console.log(correctAnswer)
  return [options, correctAnswer, conjToTest, currentQuizWord, quizType, questionText];
}
export function makeStringReadable(names) {
  names = names.replace("futurePerfect", 'future perfect');
  names = names.replaceAll("_", ' ');
  return names
}
function getPrimarySubfieldLabel(subfield = "") {
  return String(subfield).split("/")[0];
}

function formatConjugationDescriptor(subfields = {}) {
  const orderedParts = [];
  const person = getPrimarySubfieldLabel(subfields.person);
  const number = getPrimarySubfieldLabel(subfields.number);
  const tense = getPrimarySubfieldLabel(subfields.tense);
  const voice = getPrimarySubfieldLabel(subfields.voice);
  const mood = getPrimarySubfieldLabel(subfields.mood);
  const form = getPrimarySubfieldLabel(subfields.form);
  const noun = getPrimarySubfieldLabel(subfields.noun);
  const grammaticalCase = getPrimarySubfieldLabel(subfields.case);

  if (person) {
    orderedParts.push(`${makeStringReadable(person)}-person`);
  }
  if (number) {
    orderedParts.push(makeStringReadable(number));
  }
  if (tense) {
    orderedParts.push(makeStringReadable(tense));
  }
  if (voice) {
    orderedParts.push(makeStringReadable(voice));
  }
  if (mood) {
    orderedParts.push(makeStringReadable(mood));
  }
  if (form) {
    orderedParts.push(makeStringReadable(form));
  }
  if (noun) {
    orderedParts.push(makeStringReadable(noun));
  }
  if (grammaticalCase) {
    orderedParts.push(makeStringReadable(grammaticalCase));
  }

  return orderedParts.join(' ').trim();
}
function formatLatinInflectionDescriptor(inflectionKey = "") {
  if (!inflectionKey) {
    return "";
  }
  const [number = "", grammaticalCase = ""] = String(inflectionKey).split("_");
  const parts = [];
  if (number) {
    parts.push(makeStringReadable(number));
  }
  if (grammaticalCase) {
    parts.push(makeStringReadable(grammaticalCase));
  }
  return parts.join(' ').trim();
}
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
function getQuizFeedbackElements() {
  return {
    quizContainer: document.getElementById('quizContainer'),
    trueFalseContainer: document.getElementById('trueFalseContainer'),
    spellingContainer: document.getElementById('SpellingContainer'),
    nextButton: document.getElementById('nextButton'),
    nextAfterIncorrectButton: document.getElementById('nextAfterIncorrectButton'),
    correctDefinition: document.getElementById('correctDefinition'),
    correctMessage: document.getElementById('correctMessage'),
    incorrectMessage: document.getElementById('incorrectMessage'),
  };
}
function computeSpellingAlignment(userAnswer = "", correctAnswer = "") {
  const userChars = Array.from(String(userAnswer ?? ""));
  const correctChars = Array.from(String(correctAnswer ?? ""));
  const rows = userChars.length + 1;
  const cols = correctChars.length + 1;
  const dp = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i++) dp[i][0] = i;
  for (let j = 0; j < cols; j++) dp[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const substitutionCost = userChars[i - 1] === correctChars[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + substitutionCost
      );
    }
  }

  const alignment = [];
  let i = userChars.length;
  let j = correctChars.length;

  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      dp[i][j] === dp[i - 1][j - 1] + (userChars[i - 1] === correctChars[j - 1] ? 0 : 1)
    ) {
      alignment.push({
        type: userChars[i - 1] === correctChars[j - 1] ? 'match' : 'replace',
        userChar: userChars[i - 1],
        correctChar: correctChars[j - 1],
      });
      i -= 1;
      j -= 1;
      continue;
    }
    if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      alignment.push({
        type: 'delete',
        userChar: userChars[i - 1],
        correctChar: '',
      });
      i -= 1;
      continue;
    }
    alignment.push({
      type: 'insert',
      userChar: '',
      correctChar: correctChars[j - 1],
    });
    j -= 1;
  }

  alignment.reverse();
  return alignment;
}
function formatSpellingDiff(userAnswer = "", correctAnswer = "") {
  const alignment = computeSpellingAlignment(userAnswer, correctAnswer);
  const userMarkup = [];
  const correctMarkup = [];

  alignment.forEach(({ type, userChar, correctChar }) => {
    if (type === 'match') {
      const safeChar = escapeHtml(userChar);
      userMarkup.push(`<span>${safeChar}</span>`);
      correctMarkup.push(`<span>${escapeHtml(correctChar)}</span>`);
      return;
    }
    if (type === 'replace') {
      userMarkup.push(`<span style="color: #b04233;">${escapeHtml(userChar)}</span>`);
      correctMarkup.push(`<span style="color: #149d5f;">${escapeHtml(correctChar)}</span>`);
      return;
    }
    if (type === 'delete') {
      userMarkup.push(`<span style="color: #b04233;">${escapeHtml(userChar)}</span>`);
      return;
    }
    correctMarkup.push(`<span style="color: #149d5f;">${escapeHtml(correctChar)}</span>`);
  });

  return {
    userMarkup: userMarkup.join("") || `<span style="color: #b04233;">&nbsp;</span>`,
    correctMarkup: correctMarkup.join("") || `<span style="color: #149d5f;">&nbsp;</span>`,
  };
}
export function renderCorrectAnswerReview(context = {}) {
  const {
    currentQuizWord = "",
    currentQuizDefinition = "",
    quizType = "",
    wordToTest = "",
    conjToTest = "",
    currentSpellingReview = "",
    userAnswer = "",
    correctAnswer = "",
    vocabList = [],
    isSpellingQuiz = false,
  } = context;
  const {
    quizContainer,
    trueFalseContainer,
    spellingContainer,
    nextButton,
    nextAfterIncorrectButton,
    correctDefinition,
  } = getQuizFeedbackElements();

  if (quizContainer) quizContainer.style.display = 'none';
  if (trueFalseContainer) trueFalseContainer.style.display = 'none';
  if (spellingContainer) spellingContainer.style.display = 'none';
  if (nextButton) nextButton.style.display = 'none';
  if (nextAfterIncorrectButton) nextAfterIncorrectButton.style.display = 'block';
  if (!correctDefinition) return;

  correctDefinition.style.display = 'block';
  const correctVocab = vocabList.find(entry => entry.word === currentQuizWord);
  const spellingDiff = isSpellingQuiz ? formatSpellingDiff(userAnswer, correctAnswer) : null;
  if (!correctVocab) {
    correctDefinition.innerHTML = [
      `<div>${isSpellingQuiz ? 'Your spelling:' : 'Your answer:'}</div>`,
      `<div><b>${isSpellingQuiz ? spellingDiff.userMarkup : escapeHtml(userAnswer)}</b></div>`,
      `<div>${isSpellingQuiz ? 'Correct spelling:' : 'Correct answer:'}</div>`,
      `<div><b>${isSpellingQuiz ? spellingDiff.correctMarkup : `<span style="color: #149d5f;">${escapeHtml(correctAnswer)}</span>`}</b></div>`,
    ].join("");
    return;
  }

  const reviewParts = [
    `<div>${isSpellingQuiz ? 'Your spelling:' : 'Your answer:'}</div>`,
    `<div>${isSpellingQuiz ? `<b>${spellingDiff.userMarkup}</b>` : `<span style="color: #b04233;"><b>${escapeHtml(userAnswer)}</b></span>`}</div>`,
    `<div>${isSpellingQuiz ? 'Correct spelling:' : 'Correct answer:'}</div>`,
  ];

  if (isSpellingQuiz) {
    reviewParts.push(`<div><b>${spellingDiff.correctMarkup}</b></div>`);
  }

  reviewParts.push(`<div style="color: #149d5f;"><b>${escapeHtml(correctVocab.word)}: ${escapeHtml(correctVocab.definition)}</b></div>`);

  if (correctVocab.gender) {
    reviewParts.push(`<div style="color: #3f6252;">${String.fromCodePoint(0x1F4A0)} gender: ${escapeHtml(correctVocab.gender)}</div>`);
  }
  if (correctVocab.pronounciation) {
    reviewParts.push(`<div style="color: #3f6252;">${String.fromCodePoint(0x1F4A0)} pronounciation: ${escapeHtml(correctVocab.pronounciation)}</div>`);
  }
  if (quizType == "6") {
    reviewParts.push(
      `<div style="color: #3f6252;">${String.fromCodePoint(0x1F4A0)} ${escapeHtml(currentQuizDefinition)} is one of the ${escapeHtml(makeStringReadable(String(conjToTest)))} form of ${escapeHtml(correctVocab.word)}</div>`
    );
  }
  if (quizType == "7") {
    reviewParts.push(
      `<div style="color: #3f6252;">${String.fromCodePoint(0x1F4A0)} ${escapeHtml(wordToTest)} is one of the ${escapeHtml(makeStringReadable(String(conjToTest)))} form of ${escapeHtml(correctVocab.word)}</div>`
    );
  }
  if (quizType == "groupTest" && correctVocab?.conjugations?.group) {
    reviewParts.push(
      `<div style="color: #3f6252;">${String.fromCodePoint(0x1F4A0)} group: ${escapeHtml(correctVocab.conjugations.group)}</div>`
    );
  }
  if (quizType == "germanPerfekt" || quizType == "latinConjugationSpelling") {
    reviewParts.push(
      `<div style="color: #3f6252;">${String.fromCodePoint(0x1F4A0)} correct form: ${escapeHtml(currentQuizDefinition)}</div>`
    );
    if (currentSpellingReview) {
      reviewParts.push(
        `<div style="color: #3f6252;">${String.fromCodePoint(0x1F4A0)} ${escapeHtml(currentSpellingReview)}</div>`
      );
    }
  }

  correctDefinition.innerHTML = reviewParts.join("");
}
export function handleMultipleChoiceAnswer(context = {}) {
  const {
    button,
    correctAnswer = "",
    speakWord,
    onCorrect,
    onIncorrect,
    reviewState,
    successDelay = 500,
  } = context;
  const { correctMessage, incorrectMessage } = getQuizFeedbackElements();
  const userAnswer = button?.textContent || "";
  const isCorrect = userAnswer === correctAnswer;

  if (isCorrect) {
    speakWord?.();
    button?.classList.add('correct');
    if (correctMessage) correctMessage.style.display = 'block';
    setTimeout(() => {
      button?.classList.remove('correct');
      if (correctMessage) correctMessage.style.display = 'none';
      onCorrect?.();
    }, successDelay);
    return true;
  }

  if (incorrectMessage) incorrectMessage.style.display = 'block';
  onIncorrect?.();
  renderCorrectAnswerReview({
    ...reviewState,
    userAnswer,
    correctAnswer,
  });
  return false;
}
export function handleTrueFalseAnswer(context = {}) {
  const {
    isTrue,
    isPairCorrect,
    onCorrect,
    onIncorrect,
    reviewState,
    successDelay = 500,
  } = context;
  const { trueFalseContainer, correctMessage, incorrectMessage } = getQuizFeedbackElements();
  const isCorrect = isTrue === isPairCorrect;

  if (trueFalseContainer) trueFalseContainer.style.display = 'none';

  if (isCorrect) {
    if (correctMessage) correctMessage.style.display = 'block';
    setTimeout(() => {
      if (correctMessage) correctMessage.style.display = 'none';
      onCorrect?.();
    }, successDelay);
    return true;
  }

  if (incorrectMessage) incorrectMessage.style.display = 'block';
  onIncorrect?.();
  renderCorrectAnswerReview({
    ...reviewState,
    userAnswer: isTrue ? "True" : "False",
    correctAnswer: isPairCorrect ? "True" : "False",
  });
  return false;
}
export function handleSpellingAnswer(context = {}) {
  const {
    currentLanguage,
    rawCorrect = "",
    inputValue = "",
    displayUserAnswer = inputValue,
    speakWord,
    onCorrect,
    onIncorrect,
    reviewState,
    successDelay = 500,
  } = context;
  const { spellingContainer, correctMessage, incorrectMessage } = getQuizFeedbackElements();
  const normalizedUserAnswer = normalizeSpelling(inputValue, currentLanguage);
  const isCorrect = normalizeSpelling(rawCorrect, currentLanguage) === normalizedUserAnswer;

  if (isCorrect) {
    speakWord?.();
    if (correctMessage) correctMessage.style.display = 'block';
    setTimeout(() => {
      if (correctMessage) correctMessage.style.display = 'none';
      onCorrect?.();
    }, successDelay);
    return true;
  }

  if (incorrectMessage) incorrectMessage.style.display = 'block';
  if (spellingContainer) spellingContainer.style.display = 'none';
  onIncorrect?.();
  renderCorrectAnswerReview({
    ...reviewState,
    userAnswer: displayUserAnswer,
    correctAnswer: rawCorrect,
    isSpellingQuiz: true,
  });
  return false;
}
export function checkVocabIndex(currentVocabIndex, vocabList, eligibleVocab) {

  if (currentVocabIndex === null || currentVocabIndex >= vocabList.length - 1) {
    currentVocabIndex = 0;
  } else {
    currentVocabIndex = Math.floor(Math.random() * eligibleVocab.length);
  }
  return currentVocabIndex;
}
export function prepareQuiz6(options, answer, questionText) {
  document.getElementById('quizQuestion').textContent = questionText;
  // Show quiz and hide vocab card
  document.getElementById('quizContainer').style.display = 'block';
  if (document.getElementById('quiz')) {
    document.getElementById('quiz').style.display = '';
  }

  document.getElementById('vocabFlashcard').style.display = 'none';
  document.getElementById('correctMessage').style.display = 'none';
  document.getElementById('incorrectMessage').style.display = 'none';
  document.getElementById('correctDefinition').style.display = 'none';
  document.getElementById('nextAfterIncorrectButton').style.display = 'none';
  prepareOptions(options, answer);
}
export function exportToJson(dataOverride = null, onComplete = null, filenamePrefix = "") {
  const finishExport = (data) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    var date = new Date();
    const filename = `${filenamePrefix}${date.toJSON().slice(0, 10)}.json`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (typeof onComplete === "function") {
      onComplete();
    }
  };

  if (dataOverride !== null) {
    finishExport(dataOverride);
    return;
  }

  chrome.storage.local.get('vocabList', function (data) {
    finishExport(data);
  });
}
export function prepareOptions(options, answer) {

  document.getElementById('option1').textContent = options[0];
  document.getElementById('option2').textContent = options[1];
  document.getElementById('option3').textContent = options[2];
  document.getElementById('option4').textContent = options[3];
  document.getElementById('nextButton').style.display = '';

  document.getElementById('quizContainer').dataset.correctAnswer = answer;
}
export function getRandomWordFromConjugations(conjugations, commonWordsList = []) {
  let fields = Object.keys(conjugations);
  const filteredFields = fields.filter(field => (field !== 'pos') && (field !== 'type') && (field !== 'group') && (field !== 'group'));
  const randomField = filteredFields[Math.floor(Math.random() * filteredFields.length)];
  const subfields = Object.keys(conjugations[randomField]);
  let randomSubfield = subfields[Math.floor(Math.random() * subfields.length)];
  const words = conjugations[randomField][randomSubfield];
  const randomWord = words[Math.floor(Math.random() * words.length)];
  // //////////console.log.log(randomField+":"+randomSubfield+":"+randomWord)
  if (randomWord == undefined) {
    return getRandomWordFromConjugations(conjugations, commonWordsList);
  }
  const isInAllSubfields = commonWordsList.includes(randomWord)
  if (randomWord.length <= 1 || randomWord == null || isInAllSubfields) {
    // //////////console.log.log(randomWord+" is not not a wrong answer")
    return getRandomWordFromConjugations(conjugations, commonWordsList);
  } else {
    return randomWord;
  }
}
const dontRemoveDiacritics = [LANGUAGES.GERMAN];
// ...existing code...
export function hasConjugations(vocab) {
  return vocab && vocab.conjugations && vocab.conjugations !== undefined && vocab.conjugations.type != "";
}
export function hasGermanPerfekt(vocab) {
  const language = (vocab?.language || "").toLowerCase();
  const book = (vocab?.book || "").toLowerCase();
  const pastParticiple = vocab?.conjugation?.past_participle;
  const pass = ((language === "de" || book === "german") &&
    vocab?.wordType === wordTypes.VERB &&
    typeof pastParticiple === "string" &&
    pastParticiple.trim() !== "");
  //console.log(vocab.word, "hasGermanPerfekt:", pass);
  return pass;
}
function isNonEmptyConjugationList(value) {
  return Array.isArray(value) && value.length > 0;
}

function getLatinVerbFormSamples(correctVocab) {
  const conjugations = correctVocab?.conjugations;
  if (!conjugations || conjugations.pos !== 'verb') {
    return [];
  }

  const seenWords = new Set();
  const samples = [];

  for (const field of Object.keys(conjugations)) {
    if (field === 'pos' || field === 'type' || field === 'group') {
      continue;
    }
    const fieldValue = conjugations[field];
    if (!fieldValue || typeof fieldValue !== 'object') {
      continue;
    }
    for (const subfield of Object.keys(fieldValue)) {
      const forms = fieldValue[subfield];
      if (!isNonEmptyConjugationList(forms)) {
        continue;
      }
      for (const correctAnswer of forms) {
        if (!correctAnswer || seenWords.has(correctAnswer)) {
          continue;
        }
        const fullSubfields = findSubfieldsForWord(correctAnswer, conjugations);
        const readableConjugation = formatConjugationDescriptor(fullSubfields);
        if (!readableConjugation) {
          continue;
        }
        seenWords.add(correctAnswer);
        samples.push({
          correctAnswer,
          conjToTest: fullSubfields,
          reviewText: `${correctAnswer} is the ${readableConjugation} form of ${correctVocab.word}`,
          questionText: `Spell the ${readableConjugation} form of <b>"${correctVocab.word}"</b>.`
        });
      }
    }
  }

  return samples;
}
function getRandomLatinConjugationSample(correctVocab) {
  const samples = getLatinVerbFormSamples(correctVocab);
  if (samples.length === 0) {
    return null;
  }
  return samples[getRandomNumber(0, samples.length - 1)];
}
function getLatinNounInflectionSamples(correctVocab) {
  const inflections = correctVocab?.conjugations?.inflections;
  if (!inflections || typeof inflections !== 'object') {
    return [];
  }

  const availableInflections = Object.keys(inflections).filter(key =>
    isNonEmptyConjugationList(inflections[key])
  );
  if (availableInflections.length === 0) {
    return [];
  }

  const samples = [];
  for (const inflectionKey of availableInflections) {
    const forms = inflections[inflectionKey];
    const readableInflection = formatLatinInflectionDescriptor(inflectionKey);
    if (!readableInflection) {
      continue;
    }
    for (const correctAnswer of forms) {
      if (!correctAnswer) {
        continue;
      }
      samples.push({
        correctAnswer,
        conjToTest: inflectionKey,
        reviewText: `${correctAnswer} is the ${readableInflection} form of ${correctVocab.word}`,
        questionText: `Spell the ${readableInflection} form of <b>"${correctVocab.word}"</b>.`
      });
    }
  }

  return samples;
}
function getRandomLatinNounInflectionSample(correctVocab) {
  const samples = getLatinNounInflectionSamples(correctVocab);
  if (samples.length === 0) {
    return null;
  }
  return samples[getRandomNumber(0, samples.length - 1)];
}

export function hasLatinConjugationSpelling(vocab) {
  const language = (vocab?.language || "").toLowerCase();
  const book = (vocab?.book || "").toLowerCase();
  const isLatin = language === "la" || book === "latin";
  if (!isLatin) {
    return false;
  }
  if (vocab?.wordType === wordTypes.VERB) {
    return getLatinVerbFormSamples(vocab).length > 0;
  }
  if (vocab?.wordType === wordTypes.NOUN) {
    return getLatinNounInflectionSamples(vocab).length > 0;
  }
  return false;
}

export function hasVerbFormSpelling(vocab) {
  return hasGermanPerfekt(vocab) || hasLatinConjugationSpelling(vocab);
}

export function prepareVerbFormSpellingQuiz(correctVocab) {
  if (hasGermanPerfekt(correctVocab)) {
    const germanQuiz = prepareGermanPerfektQuiz(correctVocab);
    return {
      ...germanQuiz,
      hintText: correctVocab?.conjugations?.group || "",
      testLabel: "German Perfekt Tense"
    };
  }

  const latinQuiz = getRandomLatinConjugationSample(correctVocab);

  if (latinQuiz) {
    return {
      correctAnswer: latinQuiz.correctAnswer,
      questionText: latinQuiz.questionText,
      quizType: 'latinConjugationSpelling',
      reviewText: latinQuiz.reviewText,
      hintText: correctVocab?.conjugations?.group || "",
      testLabel: "Latin Form Spelling"
    };
  }

  const latinNounQuiz = getRandomLatinNounInflectionSample(correctVocab);
  if (latinNounQuiz) {
    return {
      correctAnswer: latinNounQuiz.correctAnswer,
      questionText: latinNounQuiz.questionText,
      quizType: 'latinConjugationSpelling',
      reviewText: latinNounQuiz.reviewText,
      hintText: correctVocab?.conjugations?.group || "",
      testLabel: "Latin Form Spelling"
    };
  }

  return null;
}
// ...existing code...
export function processWordByLanguage(language, word) {
  if (dontRemoveDiacritics.includes(language)) {
    return word;
  } else {
    return removeDiacritics(word);
  }
}

// Existing function
function removeDiacritics(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function hasGender(wordObj) {
  return !!(wordObj.gender && wordObj.gender !== undefined && wordObj.gender !== null && wordObj.gender !== "")
}
export function hasPronounciation(wordObj) {
  return !!(wordObj.pronounciation && wordObj.pronounciation !== "undefined" && wordObj.pronounciation !== "");
}
const GERMAN_SEPARABLE_PREFIXES = [
  'ab', 'an', 'auf', 'aus', 'bei', 'dar', 'ein', 'empor', 'entgegen', 'fehl',
  'fern', 'fest', 'fort', 'frei', 'gegenueber', 'gegenüber', 'gleich', 'heim',
  'her', 'hin', 'los', 'mit', 'nach', 'nieder', 'preis', 'statt', 'teil',
  'ueber', 'über', 'um', 'unter', 'vor', 'weg', 'weiter', 'wieder', 'zu', 'zurueck', 'zurück'
];

function normalizeGermanVerb(word = '') {
  return word.trim().toLowerCase();
}

function getGermanVerbStem(word = '') {
  const normalized = normalizeGermanVerb(word);
  if (normalized.endsWith('en') && normalized.length > 3) {
    return normalized.slice(0, -2);
  }
  if (normalized.endsWith('n') && normalized.length > 2) {
    return normalized.slice(0, -1);
  }
  return normalized;
}

function getGermanSeparablePrefix(word = '') {
  const normalized = normalizeGermanVerb(word);
  return GERMAN_SEPARABLE_PREFIXES.find(prefix =>
    normalized.startsWith(prefix) && normalized.length > prefix.length + 2
  ) || null;
}

function addGermanCandidate(set, candidate, correctAnswer) {
  if (typeof candidate !== 'string') {
    return;
  }
  const cleaned = candidate.replace(/\s+/g, ' ').trim().toLowerCase();
  if (!cleaned || cleaned === correctAnswer) {
    return;
  }
  set.add(cleaned);
}

function buildGermanPerfektDistractors(word, correctAnswer) {
  const normalizedWord = normalizeGermanVerb(word);
  const correct = normalizeGermanVerb(correctAnswer);
  const candidates = new Set();
  const prefix = getGermanSeparablePrefix(normalizedWord);
  const baseVerb = prefix ? normalizedWord.slice(prefix.length) : normalizedWord;
  const stem = getGermanVerbStem(baseVerb);

  addGermanCandidate(candidates, normalizedWord, correct);
  addGermanCandidate(candidates, `ge${normalizedWord}`, correct);
  addGermanCandidate(candidates, `${stem}t`, correct);
  addGermanCandidate(candidates, `${stem}en`, correct);
  addGermanCandidate(candidates, `ge${stem}t`, correct);
  addGermanCandidate(candidates, `ge${stem}en`, correct);
  addGermanCandidate(candidates, `ge${stem}et`, correct);

  if (prefix) {
    addGermanCandidate(candidates, `${prefix}${stem}t`, correct);
    addGermanCandidate(candidates, `${prefix}${stem}en`, correct);
    addGermanCandidate(candidates, `${prefix}ge${baseVerb}`, correct);
    addGermanCandidate(candidates, `ge${prefix}${baseVerb}`, correct);
    addGermanCandidate(candidates, `${prefix}ge${stem}t`, correct);
    addGermanCandidate(candidates, `${prefix}ge${stem}en`, correct);
    addGermanCandidate(candidates, `${prefix}${baseVerb}`, correct);
  }

  if (correct.startsWith('ge')) {
    addGermanCandidate(candidates, correct.slice(2), correct);
  } else {
    addGermanCandidate(candidates, `ge${correct}`, correct);
  }
  if (correct.endsWith('en')) {
    addGermanCandidate(candidates, `${correct.slice(0, -2)}t`, correct);
  }
  if (correct.endsWith('t')) {
    addGermanCandidate(candidates, `${correct}en`, correct);
  }

  const fallbackBase = stem || normalizedWord || correct;
  const fallbackCandidates = [
    `${fallbackBase}te`,
    `${fallbackBase}tet`,
    `${fallbackBase}end`,
    `${fallbackBase}${fallbackBase.endsWith('t') ? '' : 't'}`,
    `${fallbackBase}${fallbackBase.endsWith('en') ? '' : 'en'}`
  ];
  fallbackCandidates.forEach(candidate => addGermanCandidate(candidates, candidate, correct));

  return Array.from(candidates).slice(0, 12);
}

export function prepareGermanPerfektQuiz(correctVocab) {
  const correctAnswer = normalizeGermanVerb(correctVocab?.conjugation?.past_participle || '');
  const wrongAnswers = buildGermanPerfektDistractors(correctVocab?.word || '', correctAnswer);
  const options = [correctAnswer];
  for (const wrongAnswer of wrongAnswers) {
    if (options.length >= 4) {
      break;
    }
    if (!options.includes(wrongAnswer)) {
      options.push(wrongAnswer);
    }
  }

  let fallbackIndex = 1;
  while (options.length < 4) {
    const fallbackCandidate = `${getGermanVerbStem(correctVocab?.word || 'verb')}${fallbackIndex}`;
    if (!options.includes(fallbackCandidate) && fallbackCandidate !== correctAnswer) {
      options.push(fallbackCandidate);
    }
    fallbackIndex += 1;
  }

  shuffleArray(options);
  return {
    options,
    correctAnswer,
    questionText: `Which is the correct German Perfekt past participle for "${correctVocab.word}"?`,
    quizType: 'germanPerfekt',
    reviewText: correctVocab?.conjugation?.auxiliary
      ? `Perfekt: ${correctVocab.conjugation.auxiliary} + ${correctAnswer}`
      : `Perfekt: ${correctAnswer}`
  };
}

export function setupGermanPerfektQuiz(quizData) {
  ClearPageForQuizContainer();
  document.getElementById('quizQuestion').textContent = quizData.questionText;
  document.getElementById('quizContainer').style.display = 'block';
  document.getElementById('vocabFlashcard').style.display = 'none';
  document.getElementById('correctMessage').style.display = 'none';
  document.getElementById('incorrectMessage').style.display = 'none';
  document.getElementById('correctDefinition').style.display = 'none';
  document.getElementById('nextAfterIncorrectButton').style.display = 'none';
  prepareOptions(quizData.options, quizData.correctAnswer);
}
export function generateDefOptions(correctVocab, filteredVocabList) {
  const options = [correctVocab.definition];
  const wordType = correctVocab.wordType;
  let eligibleOptions = filteredVocabList.filter(item => item.wordType === wordType);
  if (eligibleOptions.length < 4) {
    eligibleOptions = filteredVocabList;
  }
  //////console.log(eligibleOptions)
  for (let i = 0; i < 3; i++) {
    let randomIndex = Math.floor(Math.random() * eligibleOptions.length);
    let candidate = eligibleOptions[randomIndex];

    // Retry if not the same book or if duplicate
    while (
      candidate.book !== correctVocab.book ||
      options.includes(candidate.definition)
    ) {
      randomIndex = Math.floor(Math.random() * eligibleOptions.length);
      candidate = eligibleOptions[randomIndex];
    }

    options.push(candidate.definition);
  }

  return options;
}
export function generateWordOptions(correctVocab, filteredVocabList) {
  const options = [correctVocab.word];
  const wordType = correctVocab.wordType;
  let eligibleOptions = filteredVocabList.filter(item => item.wordType === wordType);
  if (eligibleOptions.length < 4) {
    eligibleOptions = filteredVocabList;
  }
  //////console.log(eligibleOptions)
  for (let i = 0; i < 3; i++) {
    let randomIndex = Math.floor(Math.random() * eligibleOptions.length);
    let candidate = eligibleOptions[randomIndex];

    // Retry if not the same book or if duplicate
    while (
      candidate.book !== correctVocab.book ||
      options.includes(candidate.word)
    ) {
      randomIndex = Math.floor(Math.random() * eligibleOptions.length);
      candidate = eligibleOptions[randomIndex];
    }

    options.push(candidate.word);
  }

  return options;
}
export function ClearPageForQuizContainer() {
  const autoplayButton = document.getElementById('autoplayButton');
  const spellingContainer = document.getElementById('SpellingContainer');
  if (autoplayButton) {
    autoplayButton.style.display = 'none';
  }
  if (spellingContainer) {
    spellingContainer.style.display = 'none';
  }
  document.getElementById('trueFalseContainer').style.display = 'none';
  document.getElementById('incorrectMessage').style.display = 'none';
  document.getElementById('speakQuiz').style.display = "none"
}

export function ClearPageForTFContainer() {
  const autoplayButton = document.getElementById('autoplayButton');
  const spellingContainer = document.getElementById('SpellingContainer');
  if (autoplayButton) {
    autoplayButton.style.display = 'none';
  }
  if (spellingContainer) {
    spellingContainer.style.display = 'none';
  }
  document.getElementById('trueFalseContainer').style.display = 'none';
  document.getElementById('incorrectMessage').style.display = 'none';
  document.getElementById('speakQuiz').style.display = "none"
}
export function prepareOptionsForQuizStyle7(correctVocab) {
  const conjugations = correctVocab.conjugations;

  let correctAnswer;
  let questionText = ""
  let options = []

  let wordToTest = getRandomWordFromConjugations(conjugations)
  const subFields = findSubfieldsForWord(wordToTest, conjugations)
  let conjToTest = Object.values(subFields);
  // //////////console.log.log(conjToTest)
  correctAnswer = conjToTest.toString();
  correctAnswer = makeStringReadable(correctAnswer);

  let wrongAnswers = [];
  while (wrongAnswers.length < 3) {
    const wrongWord = getRandomWordFromConjugations(conjugations);
    // //////////console.log.log(wrongWord)
    const wrongConj = makeStringReadable(Object.values(findSubfieldsForWord(wrongWord, conjugations)).toString());
    if (!wrongAnswers.includes(wrongConj) && !(wrongConj == correctAnswer)) {
      wrongAnswers.push(wrongConj);
    }
  }
  options.push(correctAnswer);
  for (let i = 0; i < 3; i++) {
    if (!options.includes(wrongAnswers)) {
      options.push(wrongAnswers[i]);
    } else {
      i--;
    }
  }
  questionText = `What type of conjugation does the word "${wordToTest}" belong to?`
  shuffleArray(options)
  return [options, correctAnswer, questionText, conjToTest, wordToTest];
}

export function setupQuiz7(options, correctAnswer, questionText) {
  ClearPageForQuizContainer();
  document.getElementById('quizQuestion').textContent = questionText;

  document.getElementById('quizContainer').style.display = 'block';

  prepareOptions(options, correctAnswer);
  if (document.getElementById('quiz')) {
    document.getElementById('quiz').style.display = '';
  }

  // Show quiz and hide vocab card
  document.getElementById('quizContainer').style.display = 'block';
  document.getElementById('vocabFlashcard').style.display = 'none';
  document.getElementById('correctMessage').style.display = 'none';
  document.getElementById('incorrectMessage').style.display = 'none';
  document.getElementById('correctDefinition').style.display = 'none';
  document.getElementById('nextAfterIncorrectButton').style.display = 'none';
}
export function checkEligible(word, func = () => false, needSeen = true, desirableLength = 0) {
  return (!(needSeen && word.seen <= 3) && func(word) && word.word.length > 0 && word.definition.length > 0);
}
export function getEligibleVocabs(vocabList, func = () => false, needSeen = false) {
  const eligibleVocab = vocabList.filter(entry => {
    const seenCondition = needSeen ? entry.seen > 3 : true;
    return (seenCondition || func(entry)) && entry.word.length > 0 && entry.definition.length > 0;
  });
  return eligibleVocab;
}
export function setupTFQuiz(correctVocab, currentQuizWord, currentQuizDefinition) {
  document.getElementById('quizQuestion').textContent = `What is the definition of \r\n "${correctVocab.word}"?`;
  document.getElementById('trueFalseQuestion').textContent = `Is "${currentQuizWord}" \r\n "${currentQuizDefinition}"?`;

  // Show true/false quiz and hide vocab card
  document.getElementById('trueFalseContainer').style.display = 'block';
  if (document.getElementById('tf')) {
    document.getElementById('tf').style.display = '';
  }
  document.getElementById('quizContainer').style.display = 'none';
  document.getElementById('vocabFlashcard').style.display = 'none';
  showSnooze();
  document.getElementById('correctMessage').style.display = 'none';
  document.getElementById('incorrectMessage').style.display = 'none';
  document.getElementById('correctDefinition').style.display = 'none';
  document.getElementById('nextAfterIncorrectButton').style.display = 'none';
}
export function setupWordQuiz(correctVocab, eligibleVocab) {
  const options = generateWordOptions(correctVocab, eligibleVocab);
  shuffleArray(options);
  prepareWordQuizQuestions(correctVocab);
  prepareQuiz(options);
}

export function setupDefQuiz(correctVocab, eligibleVocab) {
  const options = generateDefOptions(correctVocab, eligibleVocab);
  shuffleArray(options);
  //////console.log(options)
  prepareDefQuizQuestions(correctVocab);
  prepareQuiz(options);
}
export function getTestWord(eligibleVocab) {
  let quizIndex = Math.floor(Math.random() * eligibleVocab.length);
  return eligibleVocab[quizIndex];
}

export function setUpPronounciationQuiz(correctVocab, eligibleOptions) {
  const options = generatePronounciationOptions(correctVocab, eligibleOptions);
  shuffleArray(options);
  preparePronounciationQuizQuestions(correctVocab);
  prepareQuiz(options);
}
export function generatePronounciationOptions(correctVocab, eligibleOptions) {
  let syllables = correctVocab.word.length;
  const options = [correctVocab.pronounciation];
  let sameLengthWords = eligibleOptions.filter(item => item.word.length === syllables);
  if (sameLengthWords.length < 4) {
    sameLengthWords = eligibleOptions;
  }
  for (let i = 0; i < 3; i++) {
    let randomIndex = Math.floor(Math.random() * sameLengthWords.length);
    while (sameLengthWords[randomIndex].book != correctVocab.book) {
      randomIndex = Math.floor(Math.random() * eligibleOptions.length);
    }
    const randomPronounciation = sameLengthWords[randomIndex].pronounciation;
    if (!options.includes(randomPronounciation)) {
      options.push(randomPronounciation);
    } else {
      i--;
    }
  }
  return options;

}

export function detectLanguage(filteredVocabList) {
  if (!Array.isArray(filteredVocabList) || filteredVocabList.length === 0) {
    return null;
  }

  // Find the first item that actually has a 'language' field
  const itemWithLang = filteredVocabList.find(item => item && item.language);

  if (itemWithLang) {
    return itemWithLang.language;
  }

  // Otherwise fallback
  return utils.nameToAbbr[filteredVocabList[0].book];
}
export function setUp8Quiz(correctVocab, eligibleVocab, medievalLatin = false) {
  // Add to the .quiz-container
  document.getElementById('speakQuiz').style.display = ""
  if (correctVocab.language === null || correctVocab.language === undefined) {
    correctVocab.language = detectLanguage(eligibleVocab);
  }
  document.getElementById('speakQuiz').addEventListener('click', async function () {
    speakWord(correctVocab.language, correctVocab.word, medievalLatin)
  });
  const options = generateDefOptions(correctVocab, eligibleVocab)
  shuffleArray(options);
  prepare8QuizQuestions(correctVocab)
  prepareQuiz(options, correctVocab)
}
export function preparePronounciationQuizQuestions(correctVocab) {
  document.getElementById('quizQuestion').textContent = `What is the pronounciation of \r\n"${correctVocab.word}"?`;
  document.getElementById('quizContainer').dataset.correctAnswer = correctVocab.pronounciation;
  document.getElementById('quizContainer').dataset.correctWord = correctVocab.word;
}
export function prepareWordQuizQuestions(correctVocab) {
  document.getElementById('quizQuestion').textContent = `What is the word for \r\n"${correctVocab.definition}" ? `
  document.getElementById('quizContainer').dataset.correctAnswer = correctVocab.word;
}
export function prepareDefQuizQuestions(correctVocab) {
  document.getElementById('quizQuestion').textContent = `What is the definition of \r\n"${correctVocab.word}" ? `;
  document.getElementById('quizContainer').dataset.correctAnswer = correctVocab.definition;
  document.getElementById('quizContainer').dataset.correctWord = correctVocab.word;
}
export function prepare8QuizQuestions(correctVocab) {
  document.getElementById('quizQuestion').textContent = `What is the definition of this word ? \r\n`;
  document.getElementById('quizContainer').dataset.correctAnswer = correctVocab.definition;
  document.getElementById('quizContainer').dataset.correctWord = correctVocab.word;
}
export function prepareQuiz(options) {

  document.getElementById('option1').textContent = options[0];
  document.getElementById('option2').textContent = options[1];
  document.getElementById('option3').textContent = options[2];
  document.getElementById('option4').textContent = options[3];

  // Show quiz and hide vocab card
  document.getElementById('quizContainer').style.display = 'block';
  if (document.getElementById('quiz')) {
    document.getElementById('quiz').style.display = '';
  }

  document.getElementById('vocabFlashcard').style.display = 'none';
  document.getElementById('correctMessage').style.display = 'none';
  document.getElementById('incorrectMessage').style.display = 'none';
  document.getElementById('correctDefinition').style.display = 'none';

  document.getElementById('nextAfterIncorrectButton').style.display = 'none';
}

export function shuffleArray(array) {
  //////console.log(array)
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function changeBG(palette) {
  const BG = {
    cat: "url(/bg/bg2.png) center/cover no-repeat fixed",
    bear: "url(/bg/bg3.png) center/cover no-repeat fixed",
    cow: "url(/bg/bg4.png) center/cover no-repeat fixed",
    sky: "url(/bg/bg6.png) center/cover no-repeat fixed",
    sushi: "url(/bg/bg5.png) center/cover no-repeat fixed",
    shore: "url(/bg/bg9.png) center/cover no-repeat fixed",
    pasta: "url(/bg/bg7.png) center/cover no-repeat fixed",
    chinese: "url(/bg/bg8.png) center/cover no-repeat fixed",
    seal: "url(/bg/bg10.png) center/cover no-repeat fixed",
    wave: "url(/bg/bg11.png) center/cover no-repeat fixed",
    night: "url(/bg/bg12.png) center/cover no-repeat fixed",
    sweet: "url(/bg/bg14.png) center/cover no-repeat fixed",
    snack: "url(/bg/bg13.png) center/cover no-repeat fixed",
    fruity: "url(/bg/bg17.png) center/cover no-repeat fixed",
    default: "00% 0% / cover no-repeat fixed",
  };
  document.body.style.background = BG[palette] || BG['default'];
  chrome.storage.local.set({ selectedBG: palette }, function () {
    // //////console.log.log('Palette saved:', palette);
  });
}
function latinForTTS(text) {
  const map = {
    // Latin macrons – adjust to taste
    'ā': 'aa', 'Ā': 'Aa',
    'ē': 'ee', 'Ē': 'Ee',
    'ī': 'ii', 'Ī': 'Ii',
    'ō': 'oo', 'Ō': 'Oo',
    'ū': 'uu', 'Ū': 'Uu',
    'ȳ': 'yy', 'Ȳ': 'Yy',

    // Ligatures often seen in Latin
    'æ': 'ae', 'Æ': 'Ae',
    'œ': 'oe', 'Œ': 'Oe',

    // Just in case you have these in your data
    'ȧ': 'a', 'Ȧ': 'A',
    'ǣ': 'ae', 'Ǣ': 'Ae'
  };

  // 1) Replace known characters with “spoken” forms
  let result = text.replace(/./g, ch => map[ch] ?? ch);

  // 2) Strip any remaining diacritics (á, é, ñ, etc.)
  //    Requires modern JS (Chrome is fine)
  result = result
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

  return result;
}

export const langMap = {
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
export const nameToAbbr = Object
  .entries(langMap)                      // [[ 'de','German'], …]
  .reduce((acc, [k, v]) => {
    acc[v.toLowerCase()] = k;
    return acc;
  }, {});
export function loadVoices() {
  return new Promise(resolve => {
    let voices = speechSynthesis.getVoices();
    if (voices.length) return resolve(voices);
    speechSynthesis.onvoiceschanged = () => resolve(speechSynthesis.getVoices());
  });
}
export function convertToAbbr(name) {
  return nameToAbbr[name.toLowerCase()] || name;
}
export function getSpeechLang(code) {
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

export async function speakWord(lang, word, medieval = false) {
  speechSynthesis.cancel();
  var language = lang;

  ////console.log(language)
  ////console.log(word)
  language = convertToAbbr(language);
  if (language === "la") {
    word = latinForTTS(word);
    // Classical Latin pronunciation: replace 'c' with 'k' (except 'ch')
    if (typeof word === 'string' && !medieval) {
      word = word.replace(/c(?!h)/gi, (m) => (m === m.toUpperCase() ? 'K' : 'k'));
    }
  }
  const currentLang = getSpeechLang(language);
  word = expandWord(word);
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = currentLang;
  const voices = await loadVoices();
  const voice = voices.find(v => v.lang === currentLang);
  if (voice) utterance.voice = voice;
  speechSynthesis.speak(utterance);
}

export function getNRandomElements(arr, n) {
  const shuffled = [...arr]; // create a copy
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, n);
}
function showCorrectAnswer(currentQuizWord) {
  // //////////console.log.log(quizType)
  const quizContainer = document.querySelector('.quiz-container');
  quizContainer.style.display = "none";
  const tfContainer = document.querySelector('.true-false-container');
  tfContainer.style.display = "none";
  document.getElementById('nextButton').style.display = 'none';
  const nextButton = document.getElementById('nextAfterIncorrectButton');
  nextButton.style.display = 'block';

  const vocabFlashcard = document.getElementById('correctDefinition');
  vocabFlashcard.style.display = 'block';
  const correctVocab = vocabList.find(entry => entry.word === currentQuizWord);
  if (correctVocab) {
    vocabFlashcard.innerHTML += String.fromCodePoint(0x1F4A0);

    vocabFlashcard.textContent = `${correctVocab.word}: ${correctVocab.definition}`;
    if (correctVocab.gender && correctVocab.gender != "") {
      vocabFlashcard.innerHTML += String.fromCodePoint(0x1F4A0);
      vocabFlashcard.textContent += " gender:"
      vocabFlashcard.textContent += correctVocab.gender
    }
    if (correctVocab.pronounciation && correctVocab.pronounciation != "") {
      vocabFlashcard.innerHTML += String.fromCodePoint(0x1F4A0);
      vocabFlashcard.textContent += " pronounciation:"
      vocabFlashcard.textContent += correctVocab.pronounciation
    }
    if ((conjToTest || false) && conjToTest.length > 0 && quizType == "6") {
      vocabFlashcard.innerHTML += String.fromCodePoint(0x1F4A0);
      vocabFlashcard.textContent += correctConj
      vocabFlashcard.textContent += " is one of the "
      vocabFlashcard.textContent += makeStringReadable(conjToTest.toString())
      vocabFlashcard.textContent += " form of "
      vocabFlashcard.textContent += correctVocab.word
    } if ((conjToTest || false) && conjToTest.length > 0 && quizType == "7") {
      vocabFlashcard.innerHTML += String.fromCodePoint(0x1F4A0);
      vocabFlashcard.textContent += wordToTest
      vocabFlashcard.textContent += " is one of the "
      vocabFlashcard.textContent += makeStringReadable(conjToTest.toString())
      vocabFlashcard.textContent += " form of "
      vocabFlashcard.textContent += correctVocab.word
    } if (quizType == "groupTest") {
      vocabFlashcard.innerHTML += String.fromCodePoint(0x1F4A0);
      vocabFlashcard.textContent += " group: "
      vocabFlashcard.textContent += correctVocab.conjugations.group
    }
    document.getElementById('quizContainer').style.display = 'none';
    vocabFlashcard.style.display = 'block';
  }
}
export function showUsage(word, latinMedieval = false) {


}
export function setupSpellingQuiz(correctVocab, config = {}) {
  const spellingContainer = document.getElementById('SpellingContainer');
  const quizContainer = document.getElementById('quizContainer');
  const tfContainer = document.getElementById('trueFalseContainer');
  const vocabFlashcard = document.getElementById('vocabFlashcard');
  const correctMessage = document.getElementById('correctMessage');
  const incorrectMessage = document.getElementById('incorrectMessage');
  const correctDefinition = document.getElementById('correctDefinition');
  const nextAfterIncorrectButton = document.getElementById('nextAfterIncorrectButton');
  const nextButton = document.getElementById('nextButton');
  const speakQuiz = document.getElementById('speakQuiz');
  const answerInput = document.getElementById('answer');
  const checkButton = document.getElementById('checkButton');
  const hintButton = document.getElementById('hintButton');
  const spellingHintText = document.getElementById('spellingHintText');

  if (quizContainer) quizContainer.style.display = 'none';
  if (tfContainer) tfContainer.style.display = 'none';
  if (vocabFlashcard) vocabFlashcard.style.display = 'none';
  if (correctMessage) correctMessage.style.display = 'none';
  if (incorrectMessage) incorrectMessage.style.display = 'none';
  if (correctDefinition) correctDefinition.style.display = 'none';
  if (nextAfterIncorrectButton) nextAfterIncorrectButton.style.display = 'none';
  if (nextButton) nextButton.style.display = 'none';
  if (speakQuiz) speakQuiz.style.display = 'none';

  if (!spellingContainer) return;

  const questionEl = spellingContainer.querySelector('#spellingQuestion');
  const prompt = config.prompt || `Spell the word for \r\n "${correctVocab.definition}"?`;
  const correctAnswer = config.correctAnswer || correctVocab.word;
  if (questionEl) {
    questionEl.innerHTML = prompt;
  }

  const hintText = correctVocab.conjugations?.group ? correctVocab.conjugations.group : "";
  spellingContainer.dataset.correctAnswer = correctAnswer;
  spellingContainer.style.display = 'block';

  if (answerInput) {
    answerInput.value = '';
  }
  if (checkButton) {
    checkButton.disabled = false;
  }
  if (spellingHintText) {
    spellingHintText.style.display = 'none';
    spellingHintText.textContent = '';
  }
  if (hintButton) {
    hintButton.style.display = (!prompt.includes("Spell the word for")) ? 'inline-block' : 'none';
    hintButton.onclick = () => {
      if (!hintText || !spellingHintText) {
        return;
      }
      console.log(correctVocab.conjugations.group, correctVocab.wordType);
      const descriptions = correctVocab.wordType === wordTypes.VERB ? Hints.LatinVerbConjugationDescriptions[correctVocab.conjugations.group] : correctVocab.wordType === wordTypes.NOUN ? Hints.LatinNounConjugationDescriptions[correctVocab.conjugations.group] : "No descriptions available";
      const hints = correctVocab.wordType === wordTypes.VERB ? Hints.LatinVerbConjugationHints[correctVocab.conjugations.group] : correctVocab.wordType === wordTypes.NOUN ? Hints.LatinNounConjugationHints[correctVocab.conjugations.group] : "No hints available";
      spellingHintText.innerHTML = descriptions + "<br>" + hints;
      spellingHintText.style.display = 'block';
    };
  }
}

export function normalizeSpelling(value, language = null) {
  switch (language) {
    case LANGUAGES.GERMAN:
      value = value.replaceAll("ss", "ß");
      value = value.replaceAll("oe", "ö");
      value = value.replaceAll("ae", "ä");
      value = value.replaceAll("ue", "ü");
      return value.trim().toLowerCase();
  }
  return (value || "").trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
