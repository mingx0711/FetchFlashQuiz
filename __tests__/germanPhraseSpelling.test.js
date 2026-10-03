import { prepareGermanPhraseSpellingQuiz } from '../utils/core.js';

describe('prepareGermanPhraseSpellingQuiz', () => {
    test('skips personal pronouns and articles when selecting the blank word', () => {
        const quiz = prepareGermanPhraseSpellingQuiz({
            word: 'ich habe mich entschieden',
            definition: 'to decide',
            language: 'de',
            book: 'German'
        });

        expect(quiz).not.toBeNull();
        expect(quiz.correctAnswer).toBe('habe');
        expect(quiz.questionText).toContain('ich');
        expect(quiz.questionText).toContain('mich');
        expect(quiz.questionText).not.toContain('___ ich');
    });

    test('skips articles and pronouns when a phrase includes them', () => {
        const quiz = prepareGermanPhraseSpellingQuiz({
            word: 'du hast einen Plan',
            definition: 'to have a plan',
            language: 'de',
            book: 'German'
        });

        expect(quiz).not.toBeNull();
        expect(quiz.correctAnswer).toBe('hast');
        expect(quiz.questionText).toContain('einen');
        expect(quiz.questionText).toContain('Plan');
    });
});
