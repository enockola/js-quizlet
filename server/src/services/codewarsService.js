import { buildExerciseDocuments, getCodewarsFallbackMetadata, normalizeImportedCodewarsMetadata } from './contentTransformService.js';

const CODEWARS_API_BASE = process.env.CODEWARS_API_BASE || 'https://www.codewars.com/api/v1';

async function fetchCodewarsMetadata() {
  try {
    const response = await fetch(`${CODEWARS_API_BASE}/code-challenges?language=javascript`);
    if (!response.ok) {
      throw new Error(`Codewars API unavailable: ${response.status}`);
    }
    const data = await response.json();
    const items = data.data || data || [];
    return normalizeImportedCodewarsMetadata(items);
  } catch (error) {
    console.warn('Codewars import failed, using fallback metadata:', error.message || error);
    return getCodewarsFallbackMetadata();
  }
}

export async function importCodewarsExercises() {
  const metadata = await fetchCodewarsMetadata();
  const exercises = buildExerciseDocuments(metadata, 'Codewars');
  return { metadata, exercises };
}
