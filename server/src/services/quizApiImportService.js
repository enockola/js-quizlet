const QUIZ_API_QUESTIONS_URL = 'https://quizapi.io/api/v1/questions';
const MAX_QUIZ_API_LIMIT = 50;
const MAX_QUIZ_API_PAGES_PER_DIFFICULTY = 20;

const difficultyLevels = [
  {
    apiDifficulty: 'easy',
    appDifficulty: 'Beginner',
    titleLabel: 'Easy'
  },
  {
    apiDifficulty: 'medium',
    appDifficulty: 'Intermediate',
    titleLabel: 'Medium'
  },
  {
    apiDifficulty: 'hard',
    appDifficulty: 'Advanced',
    titleLabel: 'Hard'
  }
];

const defaultQuestionTargets = {
  EASY: 50,
  MEDIUM: 50,
  HARD: 50
};

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function chunkArray(items, size) {
  const chunks = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
}

function removeDuplicateQuestions(questions) {
  const seen = new Set();

  return questions.filter((question) => {
    const key = question.questionText.toLowerCase();
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getCorrectValue(apiQuestion, answerKey, answer) {
  const correctAnswers = apiQuestion.correct_answers || {};
  const correctKey = `${answerKey}_correct`;
  return answer.isCorrect ?? answer.correct ?? correctAnswers[correctKey];
}

function normalizeBoolean(value) {
  return value === true || String(value).toLowerCase() === 'true';
}

function isMostlyAscii(value) {
  const text = cleanText(value);
  if (!text) {
    return false;
  }

  const asciiCharacters = [...text].filter((character) => character.charCodeAt(0) <= 127).length;
  return asciiCharacters / text.length >= 0.9;
}

function looksLikeJavaScriptQuestion(apiQuestion, questionText, choices) {
  const tags = Array.isArray(apiQuestion.tags)
    ? apiQuestion.tags.map((tag) => cleanText(tag).toLowerCase())
    : [];
  const searchableText = [questionText, ...choices.map((choice) => choice.text)]
    .join(' ')
    .toLowerCase();
  const javascriptTerms = [
    'javascript',
    'js',
    'let',
    'const',
    'var',
    'function',
    'arrow',
    'array',
    'object',
    'promise',
    'async',
    'await',
    'dom',
    'event',
    'callback',
    'closure',
    'scope',
    'hoist',
    'null',
    'undefined',
    'nan',
    'prototype',
    'class',
    'json',
    'map',
    'filter',
    'reduce',
    '==',
    '==='
  ];

  return isMostlyAscii(questionText) && (
    tags.includes('javascript') || tags.includes('js') ||
    javascriptTerms.some((term) => searchableText.includes(term))
  );
}

function normalizeAnswers(apiQuestion) {
  if (Array.isArray(apiQuestion.answers)) {
    return apiQuestion.answers
      .filter((answer) => cleanText(answer.text ?? answer.answer))
      .map((answer) => ({
        text: cleanText(answer.text ?? answer.answer),
        isCorrect: normalizeBoolean(answer.isCorrect ?? answer.correct)
      }));
  }

  return Object.entries(apiQuestion.answers || {})
    .filter(([, text]) => cleanText(text))
    .map(([answerKey, text]) => ({
      text: cleanText(text),
      isCorrect: normalizeBoolean(getCorrectValue(apiQuestion, answerKey, { text }))
    }));
}

function convertQuizApiQuestion(apiQuestion) {
  const questionText = cleanText(apiQuestion.text ?? apiQuestion.question);
  const choices = normalizeAnswers(apiQuestion);
  const correctCount = choices.filter((choice) => choice.isCorrect).length;

  if (!questionText || choices.length < 2 || correctCount !== 1 || !looksLikeJavaScriptQuestion(apiQuestion, questionText, choices)) {
    return null;
  }

  return {
    questionText,
    questionType: 'multipleChoice',
    choices,
    explanation: cleanText(apiQuestion.explanation ?? apiQuestion.tip)
  };
}

async function fetchQuestionPage({ apiDifficulty, limit, offset }) {
  const apiKey = process.env.QUIZ_API_KEY;

  if (!apiKey) {
    throw new Error('QUIZ_API_KEY is missing from server/.env');
  }

  const params = new URLSearchParams({
    apiKey,
    category: process.env.QUIZ_API_CATEGORY || 'JavaScript',
    difficulty: apiDifficulty,
    limit: String(limit),
    offset: String(offset)
  });
  if (process.env.QUIZ_API_TAGS) {
    params.set('tags', process.env.QUIZ_API_TAGS);
  }

  const response = await fetch(`${QUIZ_API_QUESTIONS_URL}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  });

  const payload = await response.json().catch(() => null);

  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After') || '60';
    throw new Error(`QuizAPI rate limit hit. Try again after ${retryAfter} seconds.`);
  }

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error || payload?.message || `QuizAPI request failed for ${apiDifficulty}`);
  }

  const questions = Array.isArray(payload) ? payload : payload?.data || [];
  return questions.map(convertQuizApiQuestion).filter(Boolean);
}

async function fetchQuestionsForDifficulty(apiDifficulty, targetCount) {
  let offset = 0;
  let pageCount = 0;
  let uniqueQuestions = [];

  while (uniqueQuestions.length < targetCount && pageCount < MAX_QUIZ_API_PAGES_PER_DIFFICULTY) {
    const previousCount = uniqueQuestions.length;
    const remaining = targetCount - uniqueQuestions.length;
    const limit = Math.min(Math.max(remaining, MAX_QUIZ_API_LIMIT), MAX_QUIZ_API_LIMIT);
    const pageQuestions = await fetchQuestionPage({ apiDifficulty, limit, offset });

    uniqueQuestions = removeDuplicateQuestions([...uniqueQuestions, ...pageQuestions]);
    offset += limit;
    pageCount += 1;

    if (pageQuestions.length > 0 && pageQuestions.length < limit && uniqueQuestions.length === previousCount) {
      break;
    }
  }

  return uniqueQuestions.slice(0, targetCount);
}

function normalizeQuestionTargets(questionTargets) {
  return Object.fromEntries(
    Object.entries(defaultQuestionTargets).map(([difficulty, defaultTarget]) => [
      difficulty,
      Math.max(0, Number(questionTargets?.[difficulty] ?? defaultTarget))
    ])
  );
}

export async function buildQuizApiSeedQuizzes({
  questionsPerQuiz = 10,
  questionTargets = defaultQuestionTargets
} = {}) {
  const quizDocuments = [];
  const normalizedTargets = normalizeQuestionTargets(questionTargets);
  const normalizedQuestionsPerQuiz = Math.max(2, Number(questionsPerQuiz || 10));

  for (const level of difficultyLevels) {
    const targetCount = normalizedTargets[level.apiDifficulty.toUpperCase()];
    const importedQuestions = await fetchQuestionsForDifficulty(level.apiDifficulty, targetCount);
    if (importedQuestions.length !== targetCount) {
      throw new Error(
        `QuizAPI returned only ${importedQuestions.length} usable English JavaScript questions for ${level.apiDifficulty}; ${targetCount} are required.`
      );
    }
    const quizChunks = chunkArray(importedQuestions, normalizedQuestionsPerQuiz)
      .filter((chunk) => chunk.length === normalizedQuestionsPerQuiz);

    quizChunks.forEach((questions, index) => {
      quizDocuments.push({
        title: `JavaScript ${level.titleLabel} Quiz ${index + 1}`,
        description: `A public ${level.titleLabel.toLowerCase()} JavaScript quiz imported from QuizAPI and saved into this app.`,
        topic: 'JavaScript',
        difficulty: level.appDifficulty,
        source: 'imported',
        importSource: 'quizApi',
        ownerId: null,
        isPublic: true,
        questions
      });
    });
  }

  return quizDocuments;
}
