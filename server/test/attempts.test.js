import test from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage } from '../src/lib/storage.js';
import { seedData } from '../src/lib/seedData.js';

process.env.NODE_ENV = 'test';

const { app } = await import('../src/server.js');

function startServer() {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

async function login(server) {
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@student.com', password: 'Password123' })
  });

  assert.equal(response.status, 200);
  return response.json();
}

test('saved attempts can be created and filtered by quiz name', async () => {
  resetStorage();
  seedData();
  const server = await startServer();
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  try {
    const loginBody = await login(server);

    const submitResponse = await fetch(`http://127.0.0.1:${port}/api/attempts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${loginBody.token}`
      },
      body: JSON.stringify({
        quizId: '1',
        quizTitle: 'Practice Quiz',
        topic: 'JavaScript',
        difficulty: 'Beginner',
        totalQuestions: 5,
        correctCount: 4,
        incorrectCount: 1
      })
    });

    assert.equal(submitResponse.status, 201);
    const createdAttempt = await submitResponse.json();
    assert.equal(createdAttempt.quizTitle, 'Practice Quiz');
    assert.equal(createdAttempt.scorePercentage, 80);

    const attemptsResponse = await fetch(`http://127.0.0.1:${port}/api/attempts?search=practice`, {
      headers: { Authorization: `Bearer ${loginBody.token}` }
    });

    assert.equal(attemptsResponse.status, 200);
    const attempts = await attemptsResponse.json();
    assert.equal(attempts.length, 1);
    assert.equal(attempts[0].quizTitle, 'Practice Quiz');
  } finally {
    server.close();
  }
});