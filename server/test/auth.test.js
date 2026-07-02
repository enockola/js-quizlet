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

test('demo user can log in with the seeded password', async () => {
  resetStorage();
  seedData();
  const server = await startServer();
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@student.com', password: 'Password123' })
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.user.email, 'demo@student.com');
    assert.ok(body.token);
  } finally {
    server.close();
  }
});
