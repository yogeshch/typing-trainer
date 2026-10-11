export interface SessionRecord {
  timestamp: number;
  targetKeys: string[];
  rawWpm: number;
  netWpm: number;
  accuracy: number;
  errorsByChar: Record<string, number>;
}

const STORAGE_KEY = 'typing_drill_history_v1';
const MAX_SESSIONS = 100;

export function saveSession(session: SessionRecord): void {
  const history = getHistory();
  history.push(session);
  while (history.length > MAX_SESSIONS) history.shift();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function getHistory(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Returns the top 3 most frequently missed characters across all sessions.
 */
export function computeHistoricWeakKeys(): string[] {
  const history = getHistory();
  const errorCounts: Record<string, number> = {};

  for (const session of history) {
    for (const [char, count] of Object.entries(session.errorsByChar)) {
      errorCounts[char] = (errorCounts[char] || 0) + count;
    }
  }

  return Object.entries(errorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([char]) => char);
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
