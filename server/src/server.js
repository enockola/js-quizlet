import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { seedInMemory } from './lib/seed.js';
import { seedData as seedLocalData } from './lib/seedData.js';
import { storage, resetStorage } from './lib/storage.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Get (or default) the frontend_url.  We only want to accept API calls from OUR frontend.
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4321';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true }
  },
  { timestamps: true }
);

const choiceSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    isCorrect: { type: Boolean, default: false }
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true, trim: true },
    questionType: { type: String, enum: ['multipleChoice', 'trueFalse'], required: true },
    choices: { type: [choiceSchema], required: true },
    explanation: { type: String, trim: true }
  },
  { _id: false }
);

questionSchema.pre('validate', function validateChoices(next) {
  if (!Array.isArray(this.choices) || this.choices.length < 2) {
    return next(new Error('Each question must have at least 2 choices'));
  }

  const correctCount = this.choices.filter((choice) => choice.isCorrect).length;
  if (correctCount !== 1) {
    return next(new Error('Each question must have exactly 1 correct choice'));
  }

  next();
});

const quizSchema = new mongoose.Schema(
  {
    publicId: { type: Number, unique: true, sparse: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    topic: { type: String, required: true, trim: true },
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
    source: { type: String, enum: ['freeCodeCamp', 'imported', 'user'], default: 'user' },
    importSource: { type: String, enum: ['freeCodeCamp', 'manual', 'generated'], default: 'manual' },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isPublic: { type: Boolean, default: true },
    questions: { type: [questionSchema], required: true }
  },
  { timestamps: true }
);

quizSchema.pre('validate', function validateQuiz(next) {
  if (!Array.isArray(this.questions) || this.questions.length < 1) {
    return next(new Error('Quiz must have at least 1 question'));
  }
  next();
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Quiz = mongoose.models.Quiz || mongoose.model('Quiz', quizSchema);

const app = express();

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());

const getAuthToken = (req) => {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
};

const getUserFromToken = async (req) => {
  const token = getAuthToken(req);
  if (!token) {
    return null;
  }

  try {
    if (isUsingMongo()) {
      const payload = jwt.verify(token, JWT_SECRET);
      return await User.findById(payload.userId);
    }

    const payload = jwt.decode(token);
    if (!payload?.userId) {
      return null;
    }

    const localUser = storage.users.find((user) => String(user.id) === String(payload.userId));
    if (!localUser) {
      return null;
    }

    return {
      _id: localUser.id,
      username: localUser.username,
      email: localUser.email
    };
  } catch {
    return null;
  }
};

const createToken = (user) => jwt.sign({ userId: String(user._id) }, JWT_SECRET, { expiresIn: '7d' });

const sanitizeUser = (user) => ({
  id: String(user._id ?? user.id),
  username: user.username ?? user.name,
  email: user.email
});

const requireAuth = async (req, res, next) => {
  const token = getAuthToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Authorization required' });
  }

  try {
    if (isUsingMongo()) {
      const payload = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(payload.userId);
      if (!user) {
        return res.status(401).json({ message: 'Authorization required' });
      }
      req.user = user;
      next();
      return;
    }

    const payload = jwt.decode(token);
    if (!payload?.userId) {
      return res.status(401).json({ message: 'Authorization required' });
    }

    const localUser = storage.users.find((user) => String(user.id) === String(payload.userId));
    if (!localUser) {
      return res.status(401).json({ message: 'Authorization required' });
    }

    req.user = {
      _id: localUser.id,
      username: localUser.username,
      email: localUser.email
    };
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const handleError = (error, req, res, _next) => {
  if (error.name === 'ValidationError') {
    return res.status(400).json({ message: error.message });
  }
  if (error.name === 'CastError') {
    return res.status(404).json({ message: 'Resource not found' });
  }
  console.error(error);
  res.status(500).json({ message: 'Server error' });
};

const toQuizResponse = (quiz) => ({
  id: String(quiz.publicId ?? quiz._id ?? quiz.id),
  publicId: quiz.publicId ?? null,
  title: quiz.title,
  description: quiz.description,
  topic: quiz.topic ?? quiz.category,
  difficulty: quiz.difficulty,
  source: quiz.source ?? 'user',
  ownerId: quiz.ownerId ? String(quiz.ownerId) : null,
  isPublic: quiz.isPublic ?? true,
  questions: quiz.questions ?? [],
  createdAt: quiz.createdAt,
  updatedAt: quiz.updatedAt
});

function nextNumericId(items) {
  const values = items.map((item) => Number(item.publicId ?? item.id ?? item._id ?? 0)).filter((value) => Number.isFinite(value));
  return values.length ? Math.max(...values) + 1 : 1;
}

async function nextMongoPublicId(model) {
  const latest = await model.findOne().sort({ publicId: -1 }).select('publicId').lean();
  return Number(latest?.publicId ?? 0) + 1;
}

function resolveStoredId(item) {
  return String(item.publicId ?? item.id ?? item._id ?? '');
}

function findStoredQuizById(id) {
  return storage.quizzes.find((item) => resolveStoredId(item) === String(id));
}

function createStoredQuiz(data) {
  if (isUsingMongo()) {
    return new Quiz(data);
  }
  const newQuiz = {
    ...data,
    id: String(nextNumericId(storage.quizzes)),
    publicId: nextNumericId(storage.quizzes),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  storage.quizzes.push(newQuiz);
  return newQuiz;
}

function normalizeQuizForStorage(quiz, ownerId = null) {
  const questions = (quiz.questions || []).map((question) => ({
    questionText: String(question.questionText || '').trim(),
    questionType: question.questionType || 'multipleChoice',
    explanation: question.explanation || '',
    choices: (question.choices || []).map((choice, index) => ({
      text: String(choice.text || choice).trim(),
      isCorrect: Boolean(choice.isCorrect) || index === 0 && !(question.choices || []).some((item) => item.isCorrect)
    }))
  })).filter((question) => question.questionText && question.choices.length >= 2);

  return {
    title: String(quiz.title || '').trim(),
    description: String(quiz.description || '').trim(),
    topic: String(quiz.topic || '').trim(),
    difficulty: quiz.difficulty || 'Beginner',
    source: quiz.source || 'user',
    importSource: quiz.importSource || 'manual',
    ownerId,
    isPublic: quiz.isPublic ?? true,
    questions
  };
}

async function persistQuizDocuments(quizDocs, ownerId = null) {
  const created = [];
  const saved = [];
  for (const quizDoc of quizDocs) {
    const normalized = normalizeQuizForStorage(quizDoc, ownerId ?? quizDoc.ownerId ?? null);
    if (!normalized.title || !normalized.topic || normalized.questions.length < 1) {
      continue;
    }

    if (isUsingMongo()) {
      const publicId = quizDoc.publicId ?? await nextMongoPublicId(Quiz);
      const existing = await Quiz.findOne({ title: normalized.title, topic: normalized.topic, source: normalized.source });
      if (existing) {
        saved.push(existing);
        continue;
      }
      const newQuiz = await Quiz.create({ ...normalized, publicId });
      created.push(newQuiz);
      saved.push(newQuiz);
      continue;
    }

    const existing = storage.quizzes.find((item) => item.title === normalized.title && item.topic === normalized.topic && item.source === normalized.source);
    if (existing) {
      saved.push(existing);
      continue;
    }
    const newQuiz = { id: String(nextNumericId(storage.quizzes)), publicId: nextNumericId(storage.quizzes), ...normalized };
    storage.quizzes.push(newQuiz);
    created.push(newQuiz);
    saved.push(newQuiz);
  }
  return { created, saved };
}

const isUsingMongo = () => Boolean(process.env.MONGODB_URI) && mongoose.connection.readyState === 1;

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Backend is running smoothly!' });
});

app.post('/api/seed', async (_req, res, next) => {
  try {
    if (isUsingMongo()) {
      await User.deleteMany({});
      await Quiz.deleteMany({});

      const user = await User.create({
        username: 'Demo Student',
        email: 'demo@student.com',
        passwordHash: await bcrypt.hash('Password123', 10)
      });

      const quizDocs = seedInMemory().quizzes.map((quiz) => ({ ...quiz, ownerId: user._id }));

      await Quiz.insertMany(quizDocs);

      return res.json({ message: 'Seeded database successfully' });
    }

    seedLocalData();
    return res.json({ message: 'Seeded local data successfully' });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    if (isUsingMongo()) {
      const normalizedEmail = String(email).toLowerCase();
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      const user = await User.create({
        username,
        email: normalizedEmail,
        passwordHash: await bcrypt.hash(password, 10)
      });

      return res.status(201).json({ user: sanitizeUser(user), token: createToken(user) });
    }

    const existing = storage.users.find((item) => item.email === String(email).toLowerCase());
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const user = {
      id: String(storage.users.length + 1),
      username,
      email: String(email).toLowerCase(),
      passwordHash: await bcrypt.hash(password, 10)
    };
    storage.users.push(user);
    return res.status(201).json({ user: sanitizeUser(user), token: createToken({ _id: user.id }) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (isUsingMongo()) {
      const user = await User.findOne({ email: String(email).toLowerCase() });
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      return res.json({ user: sanitizeUser(user), token: createToken(user) });
    }

    const user = storage.users.find((item) => item.email === String(email).toLowerCase());
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    return res.json({ user: sanitizeUser(user), token: createToken({ _id: user.id }) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

app.get('/api/quizzes', async (req, res, next) => {
  try {
    const { search, owner } = req.query;

    if (isUsingMongo()) {
      const query = {};
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { topic: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      if (owner === 'me') {
        const currentUser = await getUserFromToken(req);
        if (!currentUser) {
          return res.status(401).json({ message: 'Authorization required' });
        }
        query.ownerId = currentUser._id;
      }

      const quizzes = await Quiz.find(query).sort({ createdAt: -1 });
      return res.json(quizzes.map(toQuizResponse));
    }

    let quizzes = storage.quizzes.slice();
    if (search) {
      const lowered = String(search).toLowerCase();
      quizzes = quizzes.filter((quiz) =>
        [quiz.title, quiz.topic ?? quiz.category, quiz.description].some((value) =>
          String(value || '').toLowerCase().includes(lowered)
        )
      );
    }
    if (owner === 'me') {
      const currentUser = await getUserFromToken(req);
      if (!currentUser) {
        return res.status(401).json({ message: 'Authorization required' });
      }
      quizzes = quizzes.filter((quiz) => String(quiz.ownerId) === String(currentUser._id ?? currentUser.id));
    }
    return res.json(quizzes.map(toQuizResponse));
  } catch (error) {
    next(error);
  }
});

app.get('/api/quizzes/:id', async (req, res, next) => {
  try {
    if (isUsingMongo()) {
      const byPublicId = Number(req.params.id);
      const quiz = Number.isNaN(byPublicId) ? await Quiz.findById(req.params.id) : await Quiz.findOne({ publicId: byPublicId });
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found' });
      }
      return res.json(toQuizResponse(quiz));
    }

    const quiz = findStoredQuizById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    return res.json(toQuizResponse(quiz));
  } catch (error) {
    next(error);
  }
});

app.post('/api/quizzes', requireAuth, async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      ownerId: req.user._id ?? req.user.id,
      source: req.body.source || 'user',
      importSource: req.body.importSource || 'manual'
    };
    if (isUsingMongo()) {
      const quiz = await Quiz.create({ ...payload, publicId: await nextMongoPublicId(Quiz) });
      return res.status(201).json(toQuizResponse(quiz));
    }

    const quiz = {
      id: String(nextNumericId(storage.quizzes)),
      publicId: nextNumericId(storage.quizzes),
      ...payload,
      questions: payload.questions || []
    };
    storage.quizzes.push(quiz);
    return res.status(201).json(toQuizResponse(quiz));
  } catch (error) {
    next(error);
  }
});

app.put('/api/quizzes/:id', requireAuth, async (req, res, next) => {
  try {
    if (isUsingMongo()) {
      const byPublicId = Number(req.params.id);
      const quiz = Number.isNaN(byPublicId) ? await Quiz.findById(req.params.id) : await Quiz.findOne({ publicId: byPublicId });
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found' });
      }
      if (quiz.ownerId && String(quiz.ownerId) !== String(req.user._id)) {
        return res.status(403).json({ message: 'You do not own this quiz' });
      }
      Object.assign(quiz, req.body);
      await quiz.save();
      return res.json(toQuizResponse(quiz));
    }

    const quiz = findStoredQuizById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    if (String(quiz.ownerId) !== String(req.user._id ?? req.user.id)) {
      return res.status(403).json({ message: 'You do not own this quiz' });
    }
    Object.assign(quiz, req.body);
    return res.json(toQuizResponse(quiz));
  } catch (error) {
    next(error);
  }
});

app.delete('/api/quizzes/:id', requireAuth, async (req, res, next) => {
  try {
    if (isUsingMongo()) {
      const byPublicId = Number(req.params.id);
      const quiz = Number.isNaN(byPublicId) ? await Quiz.findById(req.params.id) : await Quiz.findOne({ publicId: byPublicId });
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found' });
      }
      if (quiz.ownerId && String(quiz.ownerId) !== String(req.user._id)) {
        return res.status(403).json({ message: 'You do not own this quiz' });
      }
      await quiz.deleteOne();
      return res.json({ message: 'Quiz deleted' });
    }

    const index = storage.quizzes.findIndex((item) => resolveStoredId(item) === String(req.params.id));
    if (index < 0) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    if (String(storage.quizzes[index].ownerId) !== String(req.user._id ?? req.user.id)) {
      return res.status(403).json({ message: 'You do not own this quiz' });
    }
    storage.quizzes.splice(index, 1);
    return res.json({ message: 'Quiz deleted' });
  } catch (error) {
    next(error);
  }
});


app.use(handleError);

async function connectMongo() {
  if (!process.env.MONGODB_URI) {
    return false;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    return true;
  } catch (error) {
    console.warn('MongoDB connection failed, using local fallback.', error.message);
    return false;
  }
}

async function bootstrap() {
  const connected = await connectMongo();
  
  if (connected) {
    try {
      
      // Find or create the default demo student to own the seeded quizzes
      let demoUser = await User.findOne({ email: 'demo@student.com' });
      if (!demoUser) {
        demoUser = await User.create({
          username: 'Demo Student',
          email: 'demo@student.com',
          passwordHash: await bcrypt.hash('Password123', 10)
        });
        console.log('Created default demo student for MongoDB.');
      }

      // Get the default seed quizzes
      const seedQuizzes = seedInMemory().quizzes;

      // Persist them. persistQuizDocuments automatically skips quizzes 
      // if matching title, topic, and source already exist in MongoDB.
      const { created } = await persistQuizDocuments(seedQuizzes, demoUser._id);
      
      if (created.length > 0) {
        console.log(`Successfully seeded ${created.length} new default quizzes into MongoDB.`);
      } else {
        console.log('All default quizzes already exist in MongoDB. Skipping seed.');
      }
    } catch (error) {
      console.error('Error during MongoDB default initialization:', error);
    }
  } else {
    // Local fallback when MongoDB URI is missing or fails
    seedLocalData();
  }

  if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

await bootstrap();

export { app, User, Quiz };
