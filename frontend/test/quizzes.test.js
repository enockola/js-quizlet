import test from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage } from '../src/lib/storage.js';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = '';
process.env.MONGO_URI = '';

const { app } = await import('../src/server.js');

function startServer() {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

function stopServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

test('a guest cannot create a quiz', async () => {
  resetStorage();

  const server = await startServer();
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/quizzes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Guest Quiz',
        topic: 'JavaScript',
        difficulty: 'Beginner',
        isPublic: true,
        questions: [
          {
            questionText: 'What does const create?',
            questionType: 'multipleChoice',
            explanation: '',
            choices: [
              { text: 'A block-scoped variable', isCorrect: true },
              { text: 'A loop', isCorrect: false }
            ]
          }
        ]
      })
    });

    assert.equal(response.status, 401);

    const body = await response.json();
    assert.equal(body.message, 'Authorization required');
  } finally {
    await stopServer(server);
  }
});