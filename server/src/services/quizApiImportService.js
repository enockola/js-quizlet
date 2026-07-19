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

const quizTopicCatalog = [
  {
    label: 'Variables and Data Types',
    titlePart: 'Variables & Types',
    pattern: /\b(variable|var|let|const|type|typeof|string|number|boolean|null|undefined|nan|symbol|bigint|coercion)\b/gi,
    summary: 'variables, data types, and type conversion'
  },
  {
    label: 'Functions, Scope, and Closures',
    titlePart: 'Functions & Scope',
    pattern: /\b(function|arrow|callback|closure|scope|hoist|parameter|argument|return|this)\b/gi,
    summary: 'functions, scope, callbacks, and closures'
  },
  {
    label: 'Arrays and Collections',
    titlePart: 'Arrays & Collections',
    pattern: /\b(array|map|filter|reduce|foreach|find|slice|splice|push|pop|set|collection|iterat)\w*/gi,
    summary: 'arrays, collection methods, and iteration'
  },
  {
    label: 'Objects and Classes',
    titlePart: 'Objects & Classes',
    pattern: /\b(object|class|prototype|property|method|constructor|inherit|encapsulation)\w*/gi,
    summary: 'objects, classes, prototypes, and inheritance'
  },
  {
    label: 'Asynchronous Programming',
    titlePart: 'Async Programming',
    pattern: /\b(async|await|promise|asynchronous|callback|event loop|timeout|fetch|then|catch)\b/gi,
    summary: 'promises, async/await, and asynchronous execution'
  },
  {
    label: 'DOM and Browser Events',
    titlePart: 'DOM & Events',
    pattern: /\b(dom|document|window|browser|element|selector|event|listener|click|html|node)\b/gi,
    summary: 'DOM manipulation, browser APIs, and events'
  },
  {
    label: 'Operators and Control Flow',
    titlePart: 'Control Flow',
    pattern: /\b(operator|condition|if|else|switch|loop|while|for|comparison|equality|logical|ternary)\b/gi,
    summary: 'operators, conditions, loops, and control flow'
  },
  {
    label: 'Modern JavaScript',
    titlePart: 'Modern Syntax',
    pattern: /\b(module|import|export|destructur|spread|rest|template literal|optional chaining|es6|ecmascript)\w*/gi,
    summary: 'modern syntax, modules, and language features'
  }
];

function buildQuizMetadata(questions, titleCounts) {
  const content = questions
    .flatMap((question) => [question.questionText, ...question.choices.map((choice) => choice.text)])
    .join(' ');
  const rankedTopics = quizTopicCatalog
    .map((topic) => ({ ...topic, score: (content.match(topic.pattern) || []).length }))
    .filter((topic) => topic.score > 0)
    .sort((left, right) => right.score - left.score);
  const titleTopics = rankedTopics.filter((topic) => topic.label !== 'Asynchronous Programming');
  const primary = titleTopics[0] || {
    label: 'JavaScript Fundamentals',
    titlePart: 'Essentials',
    summary: 'core JavaScript concepts and everyday language behavior'
  };
  const secondary = titleTopics[1];
  const baseTitle = secondary?.titlePart || primary.titlePart || primary.label;
  const duplicateNumber = (titleCounts.get(baseTitle) || 0) + 1;
  titleCounts.set(baseTitle, duplicateNumber);
  const title = duplicateNumber === 1 ? baseTitle : `${baseTitle} Practice ${duplicateNumber}`;
  const summaries = titleTopics.slice(0, 2).map((topic) => topic.summary);
  const description = summaries.length > 1
    ? `Practice ${summaries[0]} in 10 focused questions. Also review ${summaries[1]}.`
    : `Practice ${summaries[0] || primary.summary} in 10 focused questions.`;

  return {
    title,
    description
  };
}

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

function fillQuestionTarget(questions, targetCount, questionsPerQuiz) {
  if (questions.length < questionsPerQuiz) {
    return questions;
  }

  const filled = [...questions];
  let sourceIndex = 0;
  while (filled.length < targetCount) {
    filled.push(questions[sourceIndex % questions.length]);
    sourceIndex += 1;
  }
  return filled;
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

    if (pageQuestions.length < limit || uniqueQuestions.length === previousCount) {
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
    const titleCounts = new Map();
    const targetCount = normalizedTargets[level.apiDifficulty.toUpperCase()];
    const importedQuestions = await fetchQuestionsForDifficulty(level.apiDifficulty, targetCount);
    if (importedQuestions.length < normalizedQuestionsPerQuiz) {
      throw new Error(
        `QuizAPI returned only ${importedQuestions.length} usable English JavaScript questions for ${level.apiDifficulty}; at least ${normalizedQuestionsPerQuiz} are required.`
      );
    }
    const questionPool = fillQuestionTarget(importedQuestions, targetCount, normalizedQuestionsPerQuiz);
    const quizChunks = chunkArray(questionPool, normalizedQuestionsPerQuiz)
      .filter((chunk) => chunk.length === normalizedQuestionsPerQuiz);

    quizChunks.forEach((questions, index) => {
      const metadata = buildQuizMetadata(questions, titleCounts);
      quizDocuments.push({
        ...metadata,
        legacyTitle: `JavaScript ${level.titleLabel} Quiz ${index + 1}`,
        importSlot: `${level.apiDifficulty}-${index + 1}`,
        importOrder: quizDocuments.length,
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
