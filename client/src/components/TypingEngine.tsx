import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { calculateMetrics } from '../lib/typingMetrics';
import type { TypingResult } from '../lib/typingMetrics';

interface Props {
  text: string;
  targetKeys: string[];
  onComplete: (result: TypingResult) => void;
}

type CharState = 'pending' | 'correct' | 'incorrect';

export default function TypingEngine({ text, targetKeys, onComplete }: Props) {
  const [charStates, setCharStates] = useState<CharState[]>(() =>
    Array(text.length).fill('pending')
  );
  const [position, setPosition] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [errorsByChar, setErrorsByChar] = useState<Record<string, number>>({});
  const [totalErrors, setTotalErrors] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const caretRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetKeySet = useRef(new Set(targetKeys.map((k) => k.toLowerCase())));

  // Focus container on mount
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // Timer for elapsed display
  useEffect(() => {
    if (startTime && !isComplete) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTime, isComplete]);

  // Update caret position
  useEffect(() => {
    if (caretRef.current && charRefs.current[position]) {
      const charEl = charRefs.current[position];
      const containerEl = containerRef.current;
      if (charEl && containerEl) {
        const containerRect = containerEl.getBoundingClientRect();
        const charRect = charEl.getBoundingClientRect();
        caretRef.current.style.left = `${charRect.left - containerRect.left}px`;
        caretRef.current.style.top = `${charRect.top - containerRect.top}px`;
        caretRef.current.style.height = `${charRect.height}px`;
      }
    }
  }, [position]);

  // Auto-scroll to keep active character visible
  useEffect(() => {
    const charEl = charRefs.current[position];
    if (charEl) {
      charEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [position]);

  // Compute live metrics
  const liveWpm = useCallback(() => {
    if (!startTime || position === 0) return 0;
    const minutes = (Date.now() - startTime) / 60000;
    if (minutes <= 0) return 0;
    const rawWpm = position / 5 / minutes;
    return Math.round(rawWpm);
  }, [startTime, position]);

  const liveAccuracy = useCallback(() => {
    if (position === 0) return 100;
    return Math.round(((position - totalErrors) / position) * 100);
  }, [position, totalErrors]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isComplete) return;

      // Prevent default for Space and Backspace
      if (e.key === ' ' || e.key === 'Backspace') {
        e.preventDefault();
      }

      // Ignore modifier keys
      if (
        e.key === 'Shift' ||
        e.key === 'Control' ||
        e.key === 'Alt' ||
        e.key === 'Meta' ||
        e.key === 'Tab' ||
        e.key === 'Escape' ||
        e.key === 'CapsLock' ||
        e.key === 'Enter' ||
        e.ctrlKey ||
        e.altKey ||
        e.metaKey
      ) {
        return;
      }

      // Handle Backspace
      if (e.key === 'Backspace') {
        if (position > 0) {
          const newPos = position - 1;
          setCharStates((prev) => {
            const next = [...prev];
            next[newPos] = 'pending';
            return next;
          });
          setPosition(newPos);
        }
        return;
      }

      // Start timer on first keystroke
      if (startTime === null) {
        setStartTime(Date.now());
      }

      // Only handle printable characters
      const typed = e.key === ' ' ? ' ' : e.key;
      if (typed.length !== 1) return;

      const expected = text[position];
      const isCorrect = typed === expected;

      setCharStates((prev) => {
        const next = [...prev];
        next[position] = isCorrect ? 'correct' : 'incorrect';
        return next;
      });

      if (!isCorrect) {
        setTotalErrors((prev) => prev + 1);
        setErrorsByChar((prev) => {
          const char = expected.toLowerCase();
          return { ...prev, [char]: (prev[char] || 0) + 1 };
        });
      }

      const newPos = position + 1;
      setPosition(newPos);

      // Check completion
      if (newPos >= text.length) {
        setIsComplete(true);
        const endTime = Date.now();
        const currentErrors = totalErrors + (isCorrect ? 0 : 1);
        const currentErrorsByChar = { ...errorsByChar };
        if (!isCorrect) {
          const char = expected.toLowerCase();
          currentErrorsByChar[char] = (currentErrorsByChar[char] || 0) + 1;
        }
        const result = calculateMetrics(
          text.length,
          currentErrors,
          startTime ?? endTime,
          endTime,
          currentErrorsByChar
        );
        onComplete(result);
      }
    },
    [position, startTime, text, isComplete, totalErrors, errorsByChar, onComplete]
  );

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div class="flex flex-col gap-6">
      {/* Live Stats Bar */}
      <div class="flex items-center justify-center gap-8 text-sm">
        <div class="flex flex-col items-center">
          <span class="text-slate-500 dark:text-subtext text-xs uppercase tracking-wider">WPM</span>
          <span class="text-2xl font-bold text-indigo-600 dark:text-accent">{liveWpm()}</span>
        </div>
        <div class="flex flex-col items-center">
          <span class="text-slate-500 dark:text-subtext text-xs uppercase tracking-wider">Accuracy</span>
          <span class="text-2xl font-bold text-slate-800 dark:text-text">{liveAccuracy()}%</span>
        </div>
        <div class="flex flex-col items-center">
          <span class="text-slate-500 dark:text-subtext text-xs uppercase tracking-wider">Time</span>
          <span class="text-2xl font-bold text-slate-800 dark:text-text">{formatTime(elapsed)}</span>
        </div>
        <div class="flex flex-col items-center">
          <span class="text-slate-500 dark:text-subtext text-xs uppercase tracking-wider">Remaining</span>
          <span class="text-2xl font-bold text-slate-500 dark:text-subtext">{text.length - position}</span>
        </div>
      </div>

      {/* Typing Area */}
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        class="relative p-8 rounded-xl bg-white dark:bg-surface text-lg leading-10 font-mono
               max-h-[400px] overflow-y-auto outline-none cursor-default
               border border-slate-200 dark:border-overlay focus:border-indigo-600 dark:focus:border-accent shadow-sm transition-colors"
        style={{ caretColor: 'transparent' }}
      >
        {/* Caret */}
        <div
          ref={caretRef}
          class={`absolute w-0.5 bg-indigo-600 dark:bg-accent rounded-full transition-all duration-75 pointer-events-none
            ${!startTime || isComplete ? 'animate-pulse' : ''}`}
          style={{ zIndex: 10 }}
        />

        {/* Characters */}
        <div class="relative select-none">
          {text.split('').map((char, idx) => {
            const state = charStates[idx];
            const isTarget = targetKeySet.current.has(char.toLowerCase());

            let className = 'relative inline ';
            if (state === 'pending') {
              // High contrast before typing: text-slate-200 in dark mode, text-slate-600 in light mode
              className += 'text-slate-600 dark:text-slate-200 ';
            } else if (state === 'correct') {
              // Dulled typed state: text-slate-400 in light mode, text-slate-500 / text-subtext in dark mode
              className += 'text-slate-400 dark:text-slate-500 ';
            } else {
              className += 'text-red-500 dark:text-incorrect bg-red-500/15 dark:bg-incorrect/15 rounded-sm font-semibold ';
            }

            return (
              <span
                key={idx}
                ref={(el) => {
                  charRefs.current[idx] = el;
                }}
                class={className}
              >
                {char}
                {state === 'pending' && isTarget && (
                  <span class="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600/50 dark:bg-accent/50 rounded" />
                )}
              </span>
            );
          })}
        </div>
      </div>

      {/* Hint */}
      {!startTime && (
        <p class="text-center text-subtext text-sm animate-pulse">
          Start typing to begin...
        </p>
      )}
    </div>
  );
}
