import { buildFreeCodeCampQuizzes, getFreeCodeCampFallbackTopics } from './contentTransformService.js';

export async function importFreeCodeCampCurriculum() {
  const topics = getFreeCodeCampFallbackTopics();
  const quizzes = buildFreeCodeCampQuizzes(topics);
  return { topics, quizzes };
}
