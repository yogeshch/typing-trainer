export interface TypingResult {
  rawWpm: number;
  netWpm: number;
  accuracy: number;
  elapsedSeconds: number;
  totalChars: number;
  totalErrors: number;
  errorsByChar: Record<string, number>;
}

/**
 * Calculate standardized typing metrics.
 * Uses the convention: 5 characters = 1 word.
 */
export function calculateMetrics(
  totalChars: number,
  totalErrors: number,
  startTime: number,
  endTime: number,
  errorsByChar: Record<string, number>
): TypingResult {
  const elapsedMs = endTime - startTime;
  const elapsedMinutes = elapsedMs / 60000;
  const elapsedSeconds = elapsedMs / 1000;

  const rawWpm = elapsedMinutes > 0 ? totalChars / 5 / elapsedMinutes : 0;
  const netWpm = Math.max(
    0,
    elapsedMinutes > 0 ? (totalChars / 5 - totalErrors) / elapsedMinutes : 0
  );
  const accuracy =
    totalChars > 0 ? ((totalChars - totalErrors) / totalChars) * 100 : 100;

  return {
    rawWpm: Math.round(rawWpm * 10) / 10,
    netWpm: Math.round(netWpm * 10) / 10,
    accuracy: Math.round(accuracy * 10) / 10,
    elapsedSeconds: Math.round(elapsedSeconds * 10) / 10,
    totalChars,
    totalErrors,
    errorsByChar,
  };
}
