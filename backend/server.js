import express from 'express';

const app = express();
const PORT = process.env.PORT || 5000;

const quizzes = [
  {
    id: '1',
    title: 'JavaScript Variables',
    description: 'Practice declaring variables and using let, const, and var.',
    category: 'Basics',
    difficulty: 'Beginner',
    tags: ['variables', 'syntax'],
    isPublic: true,
    questions: [
      {
        prompt: 'Which keyword creates a block-scoped variable?',
        options: ['var', 'let', 'function', 'class'],
        answer: 'let',
        explanation: 'let creates a block-scoped variable.'
      },
      {
        prompt: 'Which declaration should be used for values that should not change?',
        options: ['var', 'let', 'const', 'if'],
        answer: 'const',
        explanation: 'const prevents reassignment after initialization.'
      }
    ]
  },
  {
    id: '2',
    title: 'Functions Review',
    description: 'Review arrow functions, parameters, and return values.',
    category: 'Functions',
    difficulty: 'Intermediate',
    tags: ['functions', 'arrays'],
    isPublic: true,
    questions: [
      {
        prompt: 'What is the correct syntax for an arrow function?',
        options: ['function test() {}', '=>', 'const add = () => {}', 'for (const x of y) {}'],
        answer: 'const add = () => {}',
        explanation: 'Arrow functions use the => syntax.'
      }
    ]
  }
];

const users = [
  {
    id: '1',
    name: 'Demo Student',
    email: 'demo@student.com',
    password: 'Password123'
  }
];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Backend is running smoothly!' });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Backend is running smoothly!' });
});

app.get('/api/quizzes', (_req, res) => {
  res.json(quizzes);
});

app.get('/api/quizzes/:id', (req, res) => {
  const quiz = quizzes.find((item) => item.id === req.params.id);
  if (!quiz) {
    return res.status(404).json({ message: 'Quiz not found' });
  }
  res.json(quiz);
});

app.post('/api/quizzes', (req, res) => {
  const quiz = {
    id: String(quizzes.length + 1),
    ...req.body,
    questions: req.body.questions || [],
    tags: req.body.tags || [],
    isPublic: req.body.isPublic ?? true
  };
  quizzes.push(quiz);
  res.status(201).json(quiz);
});

app.put('/api/quizzes/:id', (req, res) => {
  const index = quizzes.findIndex((item) => item.id === req.params.id);
  if (index < 0) {
    return res.status(404).json({ message: 'Quiz not found' });
  }
  quizzes[index] = { ...quizzes[index], ...req.body };
  res.json(quizzes[index]);
});

app.delete('/api/quizzes/:id', (req, res) => {
  const index = quizzes.findIndex((item) => item.id === req.params.id);
  if (index < 0) {
    return res.status(404).json({ message: 'Quiz not found' });
  }
  quizzes.splice(index, 1);
  res.status(204).send();
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide name, email, and password.' });
  }

  if (users.some((user) => user.email === email)) {
    return res.status(409).json({ message: 'Email already exists.' });
  }

  const user = { id: String(users.length + 1), name, email, password };
  users.push(user);
  res.status(201).json({ token: 'demo-token', user: { id: user.id, name: user.name, email: user.email } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find((item) => item.email === email);
  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }
  res.json({ token: 'demo-token', user: { id: user.id, name: user.name, email: user.email } });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server listening on http://localhost:${PORT}`);
});
