import bcrypt from 'bcryptjs';
import { buildFallbackSeedContent } from '../services/contentTransformService.js';

export function seedInMemory() {
  const content = buildFallbackSeedContent();
  return {
    users: [
      {
        id: '1',
        username: 'Demo Student',
        email: 'demo@student.com',
        passwordHash: bcrypt.hashSync('Password123', 10)
      }
    ],
    quizzes: content.quizzes.map((quiz, index) => ({
      id: String(index + 1),
      publicId: index + 1,
      ...quiz,
      ownerId: '1'
    }))
  };
}