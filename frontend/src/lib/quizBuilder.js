export function validationForQuestion(question) {
  const questionText = String(question?.questionText || '').trim();
  const choices = Array.isArray(question?.choices) ? question.choices : [];

  if (!questionText) return 'missing question text';

  const filledChoices = choices.filter((choice) => String(choice?.text || '').trim());
  if (filledChoices.length < 2) return 'needs 2 choices';

  const hasCorrectAnswer = choices.some((choice) => choice?.isCorrect && String(choice.text || '').trim());
  if (!hasCorrectAnswer) return 'missing correct answer';

  return 'ready';
}

export function normalizeTrueFalseChoices(question) {
  const choices = Array.isArray(question.choices) ? question.choices : [];
  const correctText = choices.find((choice) => choice.isCorrect)?.text || 'True';

  question.choices = [
    { text: 'True', isCorrect: correctText === 'True' },
    { text: 'False', isCorrect: correctText === 'False' }
  ];

  if (!question.choices.some((choice) => choice.isCorrect)) {
    question.choices[0].isCorrect = true;
  }

  return question;
}

export function validateQuizData(details, questions) {
  if (!details.title || !details.topic) {
    return {
      valid: false,
      field: !details.title ? 'title' : 'topic',
      message: 'Add a quiz title and topic before saving.'
    };
  }

  const invalidQuestionIndex = questions.findIndex((question) => validationForQuestion(question) !== 'ready');
  if (invalidQuestionIndex >= 0) {
    return {
      valid: false,
      invalidQuestionIndex,
      message: `Question ${invalidQuestionIndex + 1} is ${validationForQuestion(questions[invalidQuestionIndex])}.`
    };
  }

  return { valid: true, details };
}

export function buildQuizPayload(details, questions) {
  return {
    ...details,
    source: 'user',
    questions: questions.map((question) => ({
      questionText: String(question.questionText || '').trim(),
      questionType: question.questionType,
      explanation: String(question.explanation || '').trim(),
      choices: question.choices
        .filter((choice) => String(choice.text || '').trim())
        .map((choice) => ({
          text: String(choice.text).trim(),
          isCorrect: choice.isCorrect
        }))
    }))
  };
}
