import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON payloads
app.use(express.json());

// Sample API route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running smoothly!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
