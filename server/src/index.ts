import express from 'express';
import cors from 'cors';
import { generate } from './generator.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json());

// ── Health check ──
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  });
});

// ── Text generation ──
app.get('/api/generate', (req, res) => {
  const keysParam = req.query.keys as string | undefined;
  if (!keysParam) {
    res.status(400).json({ error: 'Missing required "keys" query parameter' });
    return;
  }

  const keys = keysParam
    .split(',')
    .map((k) => k.trim().toLowerCase())
    .filter((k) => /^[a-z]$/.test(k));

  if (keys.length === 0 || keys.length > 10) {
    res.status(400).json({
      error: '"keys" must contain 1 to 10 valid alphabetic characters',
    });
    return;
  }

  let wordCount = parseInt((req.query.words as string) || '75', 10);
  if (isNaN(wordCount)) wordCount = 75;
  wordCount = Math.max(30, Math.min(150, wordCount));

  try {
    const text = generate(keys, wordCount);
    const actualWordCount = text.split(/\s+/).filter(Boolean).length;
    res.json({ text, targetKeys: keys, wordCount: actualWordCount });
  } catch (err) {
    console.error('Generation error:', err);
    res.status(500).json({ error: 'Text generation failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Typing API server running on port ${PORT}`);
});
