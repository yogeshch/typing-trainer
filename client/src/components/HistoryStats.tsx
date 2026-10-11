import { useState } from 'preact/hooks';
import { getHistory, clearHistory, type SessionRecord } from '../lib/storage';

export default function HistoryStats() {
  const [expanded, setExpanded] = useState(false);
  const [history, setHistory] = useState<SessionRecord[]>(() => getHistory());

  const refresh = () => setHistory(getHistory());

  const handleClear = () => {
    if (confirm('Clear all typing history? This cannot be undone.')) {
      clearHistory();
      setHistory([]);
    }
  };

  if (history.length === 0 && !expanded) {
    return null;
  }

  // Compute aggregate stats
  const totalSessions = history.length;
  const avgWpm =
    totalSessions > 0
      ? Math.round(
          (history.reduce((sum, s) => sum + s.netWpm, 0) / totalSessions) * 10
        ) / 10
      : 0;
  const avgAccuracy =
    totalSessions > 0
      ? Math.round(
          (history.reduce((sum, s) => sum + s.accuracy, 0) / totalSessions) * 10
        ) / 10
      : 0;

  // Aggregate error counts
  const errorCounts: Record<string, number> = {};
  for (const session of history) {
    for (const [char, count] of Object.entries(session.errorsByChar)) {
      errorCounts[char] = (errorCounts[char] || 0) + count;
    }
  }
  const sortedErrors = Object.entries(errorCounts).sort((a, b) => b[1] - a[1]);
  const maxErrors = sortedErrors.length > 0 ? sortedErrors[0][1] : 1;

  const recentSessions = [...history].reverse().slice(0, 5);

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  };

  const getHeatColor = (count: number) => {
    const intensity = Math.min(count / maxErrors, 1);
    if (intensity > 0.7) return 'bg-incorrect/30 text-incorrect border-incorrect/40';
    if (intensity > 0.4) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25';
  };

  return (
    <div class="mt-8 border-t border-slate-200 dark:border-overlay pt-6">
      <button
        onClick={() => {
          refresh();
          setExpanded(!expanded);
        }}
        class="flex items-center gap-2 text-slate-500 dark:text-subtext hover:text-slate-800 dark:hover:text-text transition-colors text-sm w-full"
      >
        <span class={`transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
        <span class="font-semibold">Your Weak Key History</span>
        {totalSessions > 0 && (
          <span class="text-xs bg-slate-200 dark:bg-surface text-slate-700 dark:text-text px-2 py-0.5 rounded-full">{totalSessions} sessions</span>
        )}
      </button>

      {expanded && history.length === 0 && (
        <p class="text-slate-500 dark:text-subtext text-sm mt-4">
          No history yet. Complete a typing session to see your stats here.
        </p>
      )}

      {expanded && history.length > 0 && (
        <div class="mt-4 flex flex-col gap-6">
          {/* Aggregate Stats */}
          <div class="flex gap-6">
            <div>
              <span class="text-slate-500 dark:text-subtext text-xs uppercase tracking-wider">Avg WPM</span>
              <p class="text-xl font-bold text-indigo-600 dark:text-accent">{avgWpm}</p>
            </div>
            <div>
              <span class="text-slate-500 dark:text-subtext text-xs uppercase tracking-wider">Avg Accuracy</span>
              <p class="text-xl font-bold text-slate-800 dark:text-text">{avgAccuracy}%</p>
            </div>
            <div>
              <span class="text-slate-500 dark:text-subtext text-xs uppercase tracking-wider">Sessions</span>
              <p class="text-xl font-bold text-slate-800 dark:text-text">{totalSessions}</p>
            </div>
          </div>

          {/* Heat List */}
          {sortedErrors.length > 0 && (
            <div>
              <h4 class="text-sm font-semibold text-slate-800 dark:text-text mb-2">Weak Key Heat Map</h4>
              <div class="flex flex-wrap gap-1.5">
                {sortedErrors.map(([char, count]) => (
                  <span
                    key={char}
                    class={`px-2.5 py-1 rounded-md text-xs font-bold uppercase border ${getHeatColor(count)}`}
                  >
                    {char === ' ' ? '␣' : char}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent Sessions Table */}
          <div>
            <h4 class="text-sm font-semibold text-slate-800 dark:text-text mb-2">Recent Sessions</h4>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-slate-500 dark:text-subtext text-xs uppercase">
                    <th class="text-left py-2 pr-4">Date</th>
                    <th class="text-left py-2 pr-4">Keys</th>
                    <th class="text-right py-2 pr-4">WPM</th>
                    <th class="text-right py-2">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSessions.map((session, i) => (
                    <tr key={i} class="border-t border-slate-200 dark:border-overlay/50">
                      <td class="py-2 pr-4 text-slate-500 dark:text-subtext">{formatDate(session.timestamp)}</td>
                      <td class="py-2 pr-4">
                        {session.targetKeys.map((k) => (
                          <span
                            key={k}
                            class="inline-block px-1.5 py-0.5 mr-1 rounded bg-indigo-50 dark:bg-accent/15 text-indigo-600 dark:text-accent border border-indigo-200 dark:border-transparent text-xs uppercase font-medium"
                          >
                            {k}
                          </span>
                        ))}
                      </td>
                      <td class="py-2 pr-4 text-right font-semibold text-indigo-600 dark:text-accent">
                        {session.netWpm}
                      </td>
                      <td class="py-2 text-right text-slate-700 dark:text-text">{session.accuracy}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Clear History */}
          <button
            onClick={handleClear}
            class="text-red-500/80 hover:text-red-600 dark:text-incorrect/70 dark:hover:text-incorrect text-xs self-start transition-colors"
          >
            Clear All History
          </button>
        </div>
      )}
    </div>
  );
}
