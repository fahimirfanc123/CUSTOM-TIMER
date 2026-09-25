import { ChangeEvent } from 'react';

export interface DurationInputProps {
  valueSec: number;
  minSec?: number;
  maxSec?: number;
  onChange: (seconds: number) => void;
  label: string;
  id?: string;
  error?: string;
  quickButtons?: number[];
  className?: string;
}

export function DurationInput({
  valueSec,
  minSec = 0,
  maxSec = 3599, // 59m 59s
  onChange,
  label,
  id,
  error,
  quickButtons = [-30, -10, -5, 5, 10, 30],
  className = '',
}: DurationInputProps) {
  const inputId = id ?? `duration-${label.toLowerCase().replace(/\s+/g, '-')}`;

  const minutes = Math.floor(valueSec / 60);
  const seconds = valueSec % 60;

  const handleMinutesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = parseInt(e.target.value, 10);
    const parsedMin = isNaN(raw) ? 0 : Math.max(0, raw);
    const total = parsedMin * 60 + seconds;
    const clamped = Math.max(minSec, Math.min(maxSec, total));
    onChange(clamped);
  };

  const handleSecondsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = parseInt(e.target.value, 10);
    const parsedSec = isNaN(raw) ? 0 : Math.max(0, raw);
    const total = minutes * 60 + parsedSec;
    const clamped = Math.max(minSec, Math.min(maxSec, total));
    onChange(clamped);
  };

  const handleQuickAdjust = (deltaSec: number) => {
    const total = valueSec + deltaSec;
    const clamped = Math.max(minSec, Math.min(maxSec, total));
    onChange(clamped);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="text-xs sm:text-sm font-bold text-zinc-300 uppercase tracking-wider">
          {label}
        </label>
        <span className="text-xs font-mono font-bold text-zinc-400 tabular-nums">
          {minutes > 0 ? `${minutes}m ` : ''}{seconds}s ({valueSec}s)
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Exact Minutes & Seconds Inputs */}
        <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 focus-within:border-zinc-500 transition-colors">
          <div className="flex items-center gap-1">
            <input
              id={inputId}
              type="number"
              min={0}
              max={59}
              value={minutes}
              onChange={handleMinutesChange}
              aria-label={`${label} minutes`}
              className="w-10 sm:w-12 bg-transparent text-center font-mono font-bold text-base sm:text-lg text-white tabular-nums outline-none focus:text-white"
            />
            <span className="text-xs text-zinc-500 font-semibold">m</span>
          </div>

          <span className="text-zinc-600 font-bold">:</span>

          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={59}
              value={seconds}
              onChange={handleSecondsChange}
              aria-label={`${label} seconds`}
              className="w-10 sm:w-12 bg-transparent text-center font-mono font-bold text-base sm:text-lg text-white tabular-nums outline-none focus:text-white"
            />
            <span className="text-xs text-zinc-500 font-semibold">s</span>
          </div>
        </div>

        {/* Quick Adjustment Chips */}
        <div className="flex flex-wrap items-center gap-1">
          {quickButtons.map((delta) => {
            const isNegative = delta < 0;
            const wouldBeInvalid = valueSec + delta < minSec || valueSec + delta > maxSec;
            return (
              <button
                key={delta}
                type="button"
                onClick={() => handleQuickAdjust(delta)}
                disabled={wouldBeInvalid}
                aria-label={`${isNegative ? 'Subtract' : 'Add'} ${Math.abs(delta)} seconds to ${label}`}
                className="px-2 py-1.5 rounded-lg text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {delta > 0 ? `+${delta}` : delta}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="text-xs text-rose-400 font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
