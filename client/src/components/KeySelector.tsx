import { useState } from 'preact/hooks';
import { computeHistoricWeakKeys } from '../lib/storage';

interface Props {
  onStart: (keys: string[]) => void;
}

const KEYBOARD_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

const PRESETS: { label: string; keys: string[] | null }[] = [
  { label: 'Left Pinky', keys: ['q', 'a', 'z'] },
  { label: 'Right Pinky', keys: ['p', 'l'] },
  { label: 'Rare Keys', keys: ['x', 'j', 'q', 'z'] },
  { label: 'Bottom Row', keys: ['z', 'x', 'c', 'v', 'b'] },
  { label: 'My Worst Keys', keys: null },
];

const MAX_KEYS = 5;

export default function KeySelector({ onStart }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [worstKeysMsg, setWorstKeysMsg] = useState<string | null>(null);

  const toggleKey = (key: string) => {
    setWorstKeysMsg(null);
    setSelected((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= MAX_KEYS) return prev;
      return [...prev, key];
    });
  };

  const applyPreset = (preset: typeof PRESETS[number]) => {
    setWorstKeysMsg(null);
    if (preset.keys === null) {
      const worst = computeHistoricWeakKeys();
      if (worst.length === 0) {
        setWorstKeysMsg('Complete some sessions first!');
        return;
      }
      setSelected(worst.slice(0, MAX_KEYS));
    } else {
      setSelected(preset.keys.slice(0, MAX_KEYS));
    }
  };

  return (
    <div class="flex flex-col items-center gap-8">
      {/* Header */}
      <div class="text-center">
        <h1 class="text-4xl font-bold text-text mb-2">
          Weak<span class="text-accent">Key</span> Typer
        </h1>
        <p class="text-subtext text-lg">Select up to {MAX_KEYS} characters to practice</p>
      </div>

      {/* Presets */}
      <div class="flex flex-wrap justify-center gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => applyPreset(preset)}
            class="px-4 py-2 rounded-lg bg-surface text-text text-sm font-medium
                   hover:bg-overlay transition-colors border border-overlay"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {worstKeysMsg && (
        <p class="text-incorrect text-sm -mt-4">{worstKeysMsg}</p>
      )}

      {/* Keyboard Layout */}
      <div class="flex flex-col items-center gap-2">
        {KEYBOARD_ROWS.map((row, rowIdx) => (
          <div
            key={rowIdx}
            class="flex gap-1.5"
            style={{ paddingLeft: rowIdx === 1 ? '20px' : rowIdx === 2 ? '44px' : '0' }}
          >
            {row.map((key) => {
              const isSelected = selected.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleKey(key)}
                  class={`w-12 h-12 rounded-lg font-semibold text-lg uppercase transition-all
                    ${
                      isSelected
                        ? 'bg-accent text-white shadow-lg shadow-accent/30 scale-105'
                        : 'bg-surface text-subtext hover:bg-overlay hover:text-text'
                    }
                    ${!isSelected && selected.length >= MAX_KEYS ? 'opacity-40 cursor-not-allowed' : ''}
                  `}
                  disabled={!isSelected && selected.length >= MAX_KEYS}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Selected Keys Display */}
      {selected.length > 0 && (
        <div class="flex items-center gap-2">
          <span class="text-subtext text-sm">Selected:</span>
          <div class="flex gap-1.5">
            {selected.map((key) => (
              <span
                key={key}
                class="px-3 py-1 rounded-full bg-accent/20 text-accent font-semibold text-sm uppercase"
              >
                {key}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Start Button */}
      <button
        onClick={() => onStart(selected)}
        disabled={selected.length === 0}
        class={`px-8 py-3 rounded-xl font-bold text-lg transition-all
          ${
            selected.length > 0
              ? 'bg-accent text-white hover:bg-accent-light shadow-lg shadow-accent/25 hover:scale-105'
              : 'bg-surface text-subtext cursor-not-allowed'
          }
        `}
      >
        Start Practice
      </button>
    </div>
  );
}
