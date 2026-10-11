import { useState } from 'preact/hooks';
import KeySelector from './KeySelector';
import TypingEngine from './TypingEngine';
import ResultsModal from './ResultsModal';
import HistoryStats from './HistoryStats';
import ThemeToggle from './ThemeToggle';
import { saveSession } from '../lib/storage';
import { computeHistoricWeakKeys } from '../lib/storage';
import type { TypingResult } from '../lib/typingMetrics';

type View = 'select' | 'typing' | 'results';

const API_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.PUBLIC_API_URL) || 'http://localhost:3001';

export default function App() {
  const [view, setView] = useState<View>('select');
  const [targetKeys, setTargetKeys] = useState<string[]>([]);
  const [generatedText, setGeneratedText] = useState('');
  const [typingResult, setTypingResult] = useState<TypingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchText = async (keys: string[]): Promise<string> => {
    const res = await fetch(
      `${API_URL}/api/generate?keys=${keys.join(',')}&words=75`
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Failed to generate text');
    }
    const data = await res.json();
    return data.text;
  };

  const handleStart = async (keys: string[]) => {
    setError(null);
    setLoading(true);
    try {
      const text = await fetchText(keys);
      setTargetKeys(keys);
      setGeneratedText(text);
      setView('typing');
    } catch (err: any) {
      setError(err.message || 'Failed to connect to the API server');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = (result: TypingResult) => {
    setTypingResult(result);
    saveSession({
      timestamp: Date.now(),
      targetKeys,
      rawWpm: result.rawWpm,
      netWpm: result.netWpm,
      accuracy: result.accuracy,
      errorsByChar: result.errorsByChar,
    });
    setView('results');
  };

  const handleRetry = async () => {
    setError(null);
    setLoading(true);
    try {
      const text = await fetchText(targetKeys);
      setGeneratedText(text);
      setTypingResult(null);
      setView('typing');
    } catch (err: any) {
      setError(err.message || 'Failed to generate new text');
    } finally {
      setLoading(false);
    }
  };

  const handleNewKeys = () => {
    setTypingResult(null);
    setGeneratedText('');
    setView('select');
  };

  const handleDrillWorst = async () => {
    const worstKeys = computeHistoricWeakKeys();
    if (worstKeys.length === 0) {
      setError('No history yet — complete some sessions first!');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const text = await fetchText(worstKeys);
      setTargetKeys(worstKeys);
      setGeneratedText(text);
      setTypingResult(null);
      setView('typing');
    } catch (err: any) {
      setError(err.message || 'Failed to generate text');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="flex flex-col gap-6">
      {/* Top Header Controls */}
      <div class="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-overlay/40">
        <div class="flex items-center gap-2">
          {view !== 'select' && (
            <button
              onClick={handleNewKeys}
              class="text-xs text-slate-500 hover:text-slate-900 dark:text-subtext dark:hover:text-text transition-colors flex items-center gap-1"
            >
              ← Back to Keys
            </button>
          )}
        </div>
        <ThemeToggle />
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div class="fixed inset-0 bg-slate-900/30 dark:bg-base/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div class="flex flex-col items-center gap-3 bg-white dark:bg-surface p-6 rounded-xl border border-slate-200 dark:border-overlay shadow-xl">
            <div class="w-8 h-8 border-2 border-indigo-600 dark:border-accent border-t-transparent rounded-full animate-spin" />
            <p class="text-slate-800 dark:text-text text-sm font-medium">Generating practice text...</p>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div class="bg-red-50 dark:bg-incorrect/15 border border-red-200 dark:border-incorrect/30 rounded-xl px-5 py-3 flex items-center justify-between">
          <p class="text-red-600 dark:text-incorrect text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            class="text-red-400 hover:text-red-600 dark:text-incorrect/60 dark:hover:text-incorrect ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Views */}
      {view === 'select' && <KeySelector onStart={handleStart} />}

      {view === 'typing' && generatedText && (
        <TypingEngine
          text={generatedText}
          targetKeys={targetKeys}
          onComplete={handleComplete}
        />
      )}

      {view === 'results' && typingResult && (
        <ResultsModal
          result={typingResult}
          targetKeys={targetKeys}
          onRetry={handleRetry}
          onNewKeys={handleNewKeys}
          onDrillWorst={handleDrillWorst}
        />
      )}

      {/* History (always visible) */}
      <HistoryStats />
    </div>
  );
}
