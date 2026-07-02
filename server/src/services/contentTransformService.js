const freeCodeCampTopicCatalog = [
  {
    title: 'Variables Basics',
    description: 'Practice declaring and using JavaScript variables.',
    topic: 'Variables',
    difficulty: 'Beginner',
    questions: [
      {
        questionText: 'Which keyword declares a block-scoped variable?',
        choices: ['var', 'let', 'function', 'class'],
        correctIndex: 1,
        explanation: 'let creates a block-scoped variable.'
      },
      {
        questionText: 'Which statement creates a constant variable?',
        choices: ['var age = 10;', 'let age = 10;', 'const age = 10;', 'if (age) { }'],
        correctIndex: 2,
        explanation: 'const is used for values that should not be reassigned.'
      },
      {
        questionText: 'True or false: const variables can be reassigned.',
        choices: ['True', 'False'],
        correctIndex: 1,
        explanation: 'const variables cannot be reassigned after they are initialized.'
      },
      {
        questionText: 'What is the correct way to declare a variable named total?',
        choices: ['variable total;', 'let total;', 'make total;', 'set total;'],
        correctIndex: 1,
        explanation: 'let total; is the standard variable declaration.'
      },
      {
        questionText: 'Which value can be stored in a variable?',
        choices: ['A string', 'A number', 'A boolean', 'All of the above'],
        correctIndex: 3,
        explanation: 'Variables can store many JavaScript value types.'
      }
    ]
  },
  {
    title: 'Functions in Practice',
    description: 'Understand function declarations and parameters.',
    topic: 'Functions',
    difficulty: 'Beginner',
    questions: [
      {
        questionText: 'Which syntax defines a function declaration?',
        choices: ['function greet() {}', 'const greet = () => {}', 'let greet = {}', 'class greet {}'],
        correctIndex: 0,
        explanation: 'Function declarations use the function keyword.'
      },
      {
        questionText: 'A function can receive arguments.',
        choices: ['True', 'False'],
        correctIndex: 0,
        explanation: 'Arguments let functions work with input values.'
      },
      {
        questionText: 'What does a return statement do?',
        choices: ['Stops the program', 'Returns a value from a function', 'Creates a loop', 'Defines a class'],
        correctIndex: 1,
        explanation: 'return sends a value back to the caller.'
      },
      {
        questionText: 'Which is an arrow function?',
        choices: ['function add() {}', 'const add = () => {}', 'for (let i = 0; i < 2; i++) {}', 'if (x) {}'],
        correctIndex: 1,
        explanation: 'Arrow functions use the => syntax.'
      },
      {
        questionText: 'A function without a return statement returns undefined.',
        choices: ['True', 'False'],
        correctIndex: 0,
        explanation: 'JavaScript returns undefined when no explicit return exists.'
      }
    ]
  },
  {
    title: 'Array Essentials',
    description: 'Explore how arrays store and organize values.',
    topic: 'Arrays',
    difficulty: 'Beginner',
    questions: [
      {
        questionText: 'Which syntax creates an array?',
        choices: ['[]', '{}', '()', '<>'],
        correctIndex: 0,
        explanation: 'Square brackets create array literals.'
      },
      {
        questionText: 'Arrays are indexed starting at 0.',
        choices: ['True', 'False'],
        correctIndex: 0,
        explanation: 'The first element in an array is at index 0.'
      },
      {
        questionText: 'Which method adds an item to the end of an array?',
        choices: ['push()', 'pop()', 'shift()', 'slice()'],
        correctIndex: 0,
        explanation: 'push appends values to the end of an array.'
      },
      {
        questionText: 'Which method removes the last element?',
        choices: ['pop()', 'push()', 'concat()', 'join()'],
        correctIndex: 0,
        explanation: 'pop removes the final item and returns it.'
      },
      {
        questionText: 'Array length can be read with .length.',
        choices: ['True', 'False'],
        correctIndex: 0,
        explanation: 'length is the standard way to check the number of items.'
      }
    ]
  },
  {
    title: 'Objects and Properties',
    description: 'Practice reading and updating object values.',
    topic: 'Objects',
    difficulty: 'Intermediate',
    questions: [
      {
        questionText: 'Objects are stored as key-value pairs.',
        choices: ['True', 'False'],
        correctIndex: 0,
        explanation: 'Object properties pair keys with values.'
      },
      {
        questionText: 'Which syntax creates an object?',
        choices: ['{}', '[]', '()', '""'],
        correctIndex: 0,
        explanation: 'Object literals use curly braces.'
      },
      {
        questionText: 'How do you access a property named name?',
        choices: ['person.name', 'person[name]', 'person->name', 'person:name'],
        correctIndex: 0,
        explanation: 'Dot notation is common when the property name is known.'
      },
      {
        questionText: 'Which bracket notation is valid?',
        choices: ['person["name"]', 'person.name', 'person=>name', 'person:name'],
        correctIndex: 0,
        explanation: 'Bracket notation uses a quoted property key.'
      },
      {
        questionText: 'Object properties can hold functions.',
        choices: ['True', 'False'],
        correctIndex: 0,
        explanation: 'Methods are functions stored as object properties.'
      }
    ]
  },
  {
    title: 'Looping Logic',
    description: 'Practice for and while loops.',
    topic: 'Loops',
    difficulty: 'Intermediate',
    questions: [
      {
        questionText: 'A for loop repeats while a condition is true.',
        choices: ['True', 'False'],
        correctIndex: 0,
        explanation: 'for loops continue until their condition becomes false.'
      },
      {
        questionText: 'Which loop is commonly used for arrays?',
        choices: ['for loop', 'if statement', 'switch statement', 'function declaration'],
        correctIndex: 0,
        explanation: 'for loops are often used to iterate over arrays.'
      },
      {
        questionText: 'What does break do in a loop?',
        choices: ['Skips the next iteration', 'Ends the loop', 'Creates a variable', 'Returns a string'],
        correctIndex: 1,
        explanation: 'break exits a loop immediately.'
      },
      {
        questionText: 'While loops run while the condition is true.',
        choices: ['True', 'False'],
        correctIndex: 0,
        explanation: 'while repeats until the condition becomes false.'
      },
      {
        questionText: 'Which statement is used to skip one loop iteration?',
        choices: ['break', 'continue', 'return', 'throw'],
        correctIndex: 1,
        explanation: 'continue jumps to the next iteration of the loop.'
      }
    ]
  }
];


function createQuestion(question, topic) {
  return {
    questionText: question.questionText,
    questionType: 'multipleChoice',
    choices: question.choices.map((text, index) => ({ text, isCorrect: index === question.correctIndex })),
    explanation: question.explanation || `This question reinforces ${topic.toLowerCase()}.`
  };
}

export function buildQuizDocument(topicBlueprint, source = 'imported', importSource = 'freeCodeCamp') {
  return {
    title: topicBlueprint.title,
    description: topicBlueprint.description,
    topic: topicBlueprint.topic,
    difficulty: topicBlueprint.difficulty,
    source,
    importSource,
    isPublic: true,
    questions: topicBlueprint.questions.map((question) => createQuestion(question, topicBlueprint.topic))
  };
}

export function buildFreeCodeCampQuizzes() {
  return freeCodeCampTopicCatalog.map((topic) => buildQuizDocument(topic, 'imported', 'freeCodeCamp'));
}

export function buildExerciseFromMetadata(metadata, source = metadata.source || 'generated') {
  const relatedConcepts = Array.from(new Set([metadata.topic, ...(metadata.tags || [])].filter(Boolean)));
  const title = metadata.title;
  const topic = metadata.topic;
  const prompt = `Build an in-site solution for ${title} using JavaScript. Focus on ${topic.toLowerCase()} without leaving this app.`;
  const starterCode = `function solve() {\n  // write your solution here\n}`;
  const expectedOutput = `A correct solution for the ${topic.toLowerCase()} practice task.`;
  const hints = [
    `Think about the ${topic.toLowerCase()} concept first.`,
    `Use array, object, or function methods that match the topic.`
  ];

  return {
    title,
    topic,
    difficulty: metadata.difficulty,
    source,
    importSourceId: metadata.id || slugify(title),
    originalSourceUrl: metadata.url || null,
    prompt,
    starterCode,
    expectedOutput,
    hints,
    solutionExplanation: `This exercise is inspired by ${title} and rewritten as an original in-site practice prompt.`,
    relatedConcepts,
    tags: metadata.tags || []
  };
}

export function buildExerciseDocuments(metadataList, source = 'generated') {
  return metadataList.map((metadata) => buildExerciseFromMetadata(metadata, source));
}

export function buildFallbackSeedContent() {
  return {
    quizzes: buildFreeCodeCampQuizzes()
  };
}
