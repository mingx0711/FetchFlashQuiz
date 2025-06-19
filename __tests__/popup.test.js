const { JSDOM } = require('jsdom');
const fs = require('fs');

// Setup DOM elements required by popup.js when loaded
const dom = new JSDOM(`<!DOCTYPE html><body>
<select id="selectLanguage"><option value="la">Latin</option></select>
<form id="addVocabForm"></form>
<input id="word"/><input id="definition"/>
<select id="bookSelector"></select>
<input id="pronounciation"/><input id="gender"/>
<div id="message"></div>
<div id="vocabInfo"></div>
<div id="vocabInfoInfs"></div>
<button id="addAuto"></button>
<button id="manageButton"></button>
<div id="tipsBox1"></div>
<div id="tipsBox0"></div>
<button id="hideTips1"></button>
<button id="hideTips0"></button>
<div id="newBookField"></div>
<button id="addBookButton"></button>
<input id="newBook"/>
</body>`);

global.document = dom.window.document;

// Minimal chrome mock
global.chrome = {
  storage: { local: { set: jest.fn(), get: jest.fn() } },
  tabs: { create: jest.fn() }
};

const popup = require('../popup/popup.js');

describe('popup helper functions', () => {
  test('removeDiacritics strips accents', () => {
    expect(popup.removeDiacritics('déjà vu')).toBe('deja vu');
  });

  test('getLanguageCharSetMapping returns script codes', () => {
    expect(popup.getLanguageCharSetMapping('ja')).toBe('Jpan');
    expect(popup.getLanguageCharSetMapping('zh')).toBe('Hani');
    expect(popup.getLanguageCharSetMapping('en')).toBe('Latn');
  });

  test('convertFromAbbr maps language codes', () => {
    expect(popup.convertFromAbbr('de')).toBe('German');
    expect(popup.convertFromAbbr('la')).toBe('Latin');
    expect(popup.convertFromAbbr('xx')).toBe('Unknown');
  });

  test('formatLanguage converts known codes', () => {
    expect(popup.formatLanguage('la')).toBe('Latin');
    expect(popup.formatLanguage('de')).toBe('German');
  });

  test('getChineseBaseText extracts title', () => {
    const html = `<b>see <span class="Hani"><a title="你好"></a></span></b>`;
    const doc = new JSDOM(html).window.document;
    expect(popup.getChineseBaseText(doc)).toBe('你好');
  });

  test('getJapaneseBaseText extracts title', () => {
    const html = `<span class="something Jpan"><a title="こんにちは" href="#"></a></span>`;
    const doc = new JSDOM(html).window.document;
    expect(popup.getJapaneseBaseText(doc)).toBe('こんにちは');
  });
});
