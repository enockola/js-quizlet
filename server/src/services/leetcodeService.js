import { buildExerciseDocuments, getLeetCodeFallbackMetadata } from './contentTransformService.js';

export async function importLeetCodeExercises() {
  const metadata = getLeetCodeFallbackMetadata();
  const exercises = buildExerciseDocuments(metadata, 'LeetCode');
  return { metadata, exercises };
}
