import type { TypingResult } from '../lib/typingMetrics';

interface Props {
  result: TypingResult;
  targetKeys: string[];
  onRetry: () => void;
  onNewKeys: () => void;
  onDrillWorst: () => void;
}

export default function ResultsModal({
  result,
  targetKeys,
  onRetry,
  onNewKeys,
  onDrillWorst,
}: Props) {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const sortedErrors = Object.entries(result.errorsByChar).sort(
    (a, b) => b[1] - a[1]
  );

  const targetKeySet = new Set(targetKeys);

  return (
    <div class="flex flex-col items-center gap-8">
      {/* Header */}
      <div class="text-center">
        <h2 class="text-3xl font-bold text-slate-800 dark:text-text mb-1">Nice Work! 🎯</h2>
        <p class="text-slate-500 dark:text-subtext">Session complete — here's how you did</p>
      </div>

      {/* Stats Grid */}
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
        <div class="bg-white dark:bg-surface rounded-xl p-5 text-center border border-slate-200 dark:border-overlay shadow-sm">
          <p class="text-slate-500 dark:text-subtext text-xs uppercase tracking-wider mb-1">Net WPM</p>
          <p class="text-3xl font-bold text-indigo-600 dark:text-accent">{result.netWpm}</p>
        </div>
        <div class="bg-white dark:bg-surface rounded-xl p-5 text-center border border-slate-200 dark:border-overlay shadow-sm">
          <p class="text-slate-500 dark:text-subtext text-xs uppercase tracking-wider mb-1">Raw WPM</p>
          <p class="text-3xl font-bold text-slate-800 dark:text-text">{result.rawWpm}</p>
        </div>
        <div class="bg-white dark:bg-surface rounded-xl p-5 text-center border border-slate-200 dark:border-overlay shadow-sm">
          <p class="text-slate-500 dark:text-subtext text-xs uppercase tracking-wider mb-1">Accuracy</p>
          <p class="text-3xl font-bold text-slate-800 dark:text-text">{result.accuracy}%</p>
        </div>
        <div class="bg-white dark:bg-surface rounded-xl p-5 text-center border border-slate-200 dark:border-overlay shadow-sm">
          <p class="text-slate-500 dark:text-subtext text-xs uppercase tracking-wider mb-1">Time</p>
          <p class="text-3xl font-bold text-slate-800 dark:text-text">{formatTime(result.elapsedSeconds)}</p>
        </div>
      </div>

      {/* Error Breakdown */}
      {sortedErrors.length > 0 && (
        <div class="w-full max-w-2xl">
          <h3 class="text-lg font-semibold text-slate-800 dark:text-text mb-3">Error Breakdown</h3>
          <div class="flex flex-wrap gap-2">
            {sortedErrors.map(([char, count]) => (
              <span
                key={char}
                class={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5
                  ${
                    targetKeySet.has(char)
                      ? 'bg-red-500/15 dark:bg-incorrect/20 text-red-600 dark:text-incorrect border border-red-500/30 dark:border-incorrect/30'
                      : 'bg-white dark:bg-surface text-slate-600 dark:text-subtext border border-slate-200 dark:border-overlay shadow-sm'
                  }`}
              >
                <span class="uppercase font-mono">{char === ' ' ? '␣' : char}</span>
                <span class="text-xs opacity-70">×{count}</span>
              </span>
            ))}
          </div>
          {sortedErrors.length > 0 && (
            <p class="text-slate-500 dark:text-subtext text-xs mt-2">
              Target keys highlighted in red
            </p>
          )}
        </div>
      )}

      {sortedErrors.length === 0 && (
        <div class="bg-green-500/10 dark:bg-correct/10 border border-green-500/30 dark:border-correct/30 rounded-xl px-6 py-4 text-center">
          <p class="text-green-600 dark:text-correct font-semibold">Perfect accuracy! No errors. 🏆</p>
        </div>
      )}

      {/* Action Buttons */}
      <div class="flex flex-wrap justify-center gap-3">
        <button
          onClick={onRetry}
          class="px-6 py-3 rounded-xl bg-indigo-600 dark:bg-accent text-white font-semibold
                 hover:bg-indigo-700 dark:hover:bg-accent-light transition-colors shadow-lg shadow-indigo-600/25 dark:shadow-accent/25"
        >
          Practice Again
        </button>
        <button
          onClick={onNewKeys}
          class="px-6 py-3 rounded-xl bg-white dark:bg-surface text-slate-700 dark:text-text font-semibold
                 border border-slate-200 dark:border-overlay hover:bg-slate-100 dark:hover:bg-overlay shadow-sm transition-colors"
        >
          New Keys
        </button>
        <button
          onClick={onDrillWorst}
          class="px-6 py-3 rounded-xl bg-white dark:bg-surface text-indigo-600 dark:text-accent font-semibold
                 border border-indigo-200 dark:border-accent/30 hover:bg-indigo-50 dark:hover:bg-accent/10 shadow-sm transition-colors"
        >
          Drill Worst Keys
        </button>
      </div>
    </div>
  );
}
