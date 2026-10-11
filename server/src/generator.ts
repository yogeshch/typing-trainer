import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const wordsPath = path.resolve(__dirname, '..', 'data', 'words.txt');

// ── Load corpus once on startup ──
const allWords: string[] = readFileSync(wordsPath, 'utf-8')
  .split('\n')
  .map((w) => w.trim().toLowerCase())
  .filter((w) => w.length > 0 && /^[a-z]+$/.test(w));

// ── Inverted character index: char → words containing it ──
const charIndex = new Map<string, string[]>();
for (const word of allWords) {
  const seen = new Set<string>();
  for (const ch of word) {
    if (!seen.has(ch)) {
      seen.add(ch);
      if (!charIndex.has(ch)) charIndex.set(ch, []);
      charIndex.get(ch)!.push(word);
    }
  }
}

// ── Bigram transition map: word → next-words that follow it in the corpus ──
const bigramMap = new Map<string, string[]>();
for (let i = 0; i < allWords.length - 1; i++) {
  const current = allWords[i];
  const next = allWords[i + 1];
  if (!bigramMap.has(current)) bigramMap.set(current, []);
  bigramMap.get(current)!.push(next);
}

// ── Top-frequency filler words (first 500 in frequency-ordered list) ──
const fillerPool: string[] = allWords.slice(0, 500);

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function containsAny(word: string, keys: string[]): boolean {
  for (const k of keys) {
    if (word.includes(k)) return true;
  }
  return false;
}

/**
 * Generate a paragraph of `wordCount` words biased towards `targetKeys`.
 * ~65% of words contain at least one target key; ~35% are natural filler.
 * Bigram transitions are used when available for natural flow.
 */
export function generate(targetKeys: string[], wordCount: number = 75): string {
  // Sanitize target keys
  const keys = [...new Set(
    targetKeys
      .map((k) => k.toLowerCase().trim())
      .filter((k) => k.length === 1 && /^[a-z]$/.test(k))
  )];

  if (keys.length === 0) {
    throw new Error('No valid target keys provided');
  }

  // Build candidate pool: union of all words containing any target key
  const candidateSet = new Set<string>();
  for (const key of keys) {
    const words = charIndex.get(key);
    if (words) {
      for (const w of words) candidateSet.add(w);
    }
  }
  const candidates = Array.from(candidateSet);

  if (candidates.length === 0) {
    throw new Error('No words found containing the target keys');
  }

  // Build filler list excluding candidates (for variety)
  const fillers = fillerPool.filter((w) => !candidateSet.has(w));
  const fallbackFillers = fillers.length > 0 ? fillers : fillerPool;

  // ── Word selection ──
  const result: string[] = [];
  const targetRatio = 0.65;

  for (let i = 0; i < wordCount; i++) {
    const wantTarget = Math.random() < targetRatio;
    let chosen: string | null = null;

    // Try bigram transition from previous word
    if (i > 0) {
      const prev = result[i - 1];
      const transitions = bigramMap.get(prev);
      if (transitions && transitions.length > 0) {
        // Filter transitions matching desired type
        const matching = wantTarget
          ? transitions.filter((w) => containsAny(w, keys))
          : transitions.filter((w) => !containsAny(w, keys));
        if (matching.length > 0) {
          chosen = pickRandom(matching);
        }
      }
    }

    // Fallback to random sampling from appropriate pool
    if (!chosen) {
      chosen = wantTarget
        ? pickRandom(candidates)
        : pickRandom(fallbackFillers);
    }

    result.push(chosen);
  }

  // ── Format into sentences (8–14 words each) ──
  const sentences: string[] = [];
  let idx = 0;

  while (idx < result.length) {
    const sentenceLen = Math.min(
      8 + Math.floor(Math.random() * 7), // 8 to 14
      result.length - idx
    );
    const sentenceWords = result.slice(idx, idx + sentenceLen);
    // Capitalize first word
    sentenceWords[0] = sentenceWords[0].charAt(0).toUpperCase() + sentenceWords[0].slice(1);
    sentences.push(sentenceWords.join(' ') + '.');
    idx += sentenceLen;
  }

  return sentences.join(' ');
}
