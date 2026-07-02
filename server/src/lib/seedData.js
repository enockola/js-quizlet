import { seedInMemory } from './seed.js';
import { storage, resetStorage } from './storage.js';

export function seedData() {
	resetStorage();
	const seeded = seedInMemory();
	storage.users.push(...seeded.users);
	storage.quizzes.push(...seeded.quizzes);
	return seeded;
}