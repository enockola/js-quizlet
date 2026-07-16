import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildQuizPayload,
  normalizeTrueFalseChoices,
  validateQuizData,
  validationForQuestion
} from '../src/lib/quizBuilder.js';

function createQuestion(overrides = {}) {
  return {
    questionText: 'Which method adds an item to an array?',
    questionType: 'multipleChoice',
    explanation: '',
    choices: [
      { text: 'push', isCorrect: true },
      { text: 'pop', isCorrect: false }
    ],
    ...overrides
  };
}

test('question validation requires question text', () => {
  const question = createQuestion({ questionText: '   ' });

  assert.equal(validationForQuestion(question), 'missing question text');
});

test('question validation requires two completed choices', () => {
  const question = createQuestion({
    choices: [
      { text: 'push', isCorrect: true },
      { text: '   ', isCorrect: false }
    ]
  });

  assert.equal(validationForQuestion(question), 'needs 2 choices');
});

test('question validation requires a completed correct answer', () => {
  const question = createQuestion({
    choices: [
      { text: 'push', isCorrect: false },
      { text: 'pop', isCorrect: false }
    ]
  });

  assert.equal(validationForQuestion(question), 'missing correct answer');
});

test('a complete question is ready to save', () => {
  assert.equal(validationForQuestion(createQuestion()), 'ready');
});

test('true or false normalization preserves False as the correct answer', () => {
  const question = createQuestion({
    choices: [
      { text: 'True', isCorrect: false },
      { text: 'False', isCorrect: true },
      { text: 'Maybe', isCorrect: false }
    ]
  });

  normalizeTrueFalseChoices(question);

  assert.deepEqual(question.choices, [
    { text: 'True', isCorrect: false },
    { text: 'False', isCorrect: true }
  ]);
});

test('quiz validation identifies a missing title', () => {
  const details = { title: '', topic: 'JavaScript' };

  assert.deepEqual(validateQuizData(details, [createQuestion()]), {
    valid: false,
    field: 'title',
    message: 'Add a quiz title and topic before saving.'
  });
});

test('quiz validation identifies a missing topic', () => {
  const details = { title: 'Array Basics', topic: '' };

  assert.deepEqual(validateQuizData(details, [createQuestion()]), {
    valid: false,
    field: 'topic',
    message: 'Add a quiz title and topic before saving.'
  });
});

test('quiz validation identifies the first invalid question', () => {
  const details = { title: 'Array Basics', topic: 'JavaScript' };
  const questions = [createQuestion(), createQuestion({ questionText: '' })];

  assert.deepEqual(validateQuizData(details, questions), {
    valid: false,
    invalidQuestionIndex: 1,
    message: 'Question 2 is missing question text.'
  });
});

test('quiz payload trims text and removes blank choices', () => {
  const details = {
    title: 'Array Basics',
    description: 'Practice array methods',
    topic: 'JavaScript',
    difficulty: 'Beginner',
    isPublic: true
  };
  const questions = [createQuestion({
    questionText: '  Which method adds an item?  ',
    explanation: '  push adds to the end.  ',
    choices: [
      { text: '  push  ', isCorrect: true },
      { text: 'pop', isCorrect: false },
      { text: '   ', isCorrect: false }
    ]
  })];

  assert.deepEqual(buildQuizPayload(details, questions), {
    ...details,
    source: 'user',
    questions: [{
      questionText: 'Which method adds an item?',
      questionType: 'multipleChoice',
      explanation: 'push adds to the end.',
      choices: [
        { text: 'push', isCorrect: true },
        { text: 'pop', isCorrect: false }
      ]
    }]
  });
});
