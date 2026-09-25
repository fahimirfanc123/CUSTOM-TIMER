import { Minus, Plus } from 'lucide-react';

export interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  label: string;
  unit?: string;
  className?: string;
}

export function Stepper({
  value,
  min = 1,
  max = 999,
  step = 1,
  onChange,
  label,
  unit,
  className = '',
}: StepperProps) {
  const handleDecrement = () => {
    const next = Math.max(min, value - step);
    onChange(next);
  };

  const handleIncrement = () => {
    const next = Math.min(max, value + step);
    onChange(next);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= min}
        aria-label={`Decrease ${label}`}
        className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer select-none"
      >
        <Minus className="w-4 h-4" />
      </button>

      <div
        className="min-w-[48px] sm:min-w-[56px] text-center font-mono font-bold text-lg sm:text-xl text-zinc-900 dark:text-zinc-100 tabular-nums select-none"
        aria-label={`${label}: ${value}${unit ? ` ${unit}` : ''}`}
      >
        {value}
        {unit && <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-1 font-sans">{unit}</span>}
      </div>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={value >= max}
        aria-label={`Increase ${label}`}
        className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer select-none"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
