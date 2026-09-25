import { Play, Pause, StepBack, StepForward, RotateCcw, Square } from 'lucide-react';
import { EngineStatus } from '../../core/models/phase';

export interface WorkoutControlsProps {
  status: EngineStatus;
  onPause: () => void;
  onResume: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onRestartSegment: () => void;
  onAddTime: (seconds: number) => void;
  onRequestEnd: () => void;
}

export function WorkoutControls({
  status,
  onPause,
  onResume,
  onPrevious,
  onNext,
  onRestartSegment,
  onAddTime,
  onRequestEnd,
}: WorkoutControlsProps) {
  const isPaused = status === 'PAUSED';

  return (
    <div className="w-full space-y-3 select-none" role="region" aria-label="Workout Controls">
      {/* Primary Transport Controls Row */}
      <div className="grid grid-cols-3 gap-3 items-center">
        <button
          type="button"
          onClick={onPrevious}
          aria-label="Previous segment"
          className="h-16 rounded-2xl bg-zinc-900 border border-zinc-800/80 hover:bg-zinc-800 active:bg-zinc-700 text-zinc-300 hover:text-white flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
        >
          <StepBack className="w-6 h-6" />
          <span className="text-[11px] font-bold tracking-wider uppercase">Previous</span>
        </button>

        <button
          type="button"
          onClick={isPaused ? onResume : onPause}
          aria-label={isPaused ? 'Resume workout' : 'Pause workout'}
          className={`h-20 rounded-3xl font-black flex flex-col items-center justify-center gap-1 shadow-xl transition-all active:scale-95 cursor-pointer ${
            isPaused
              ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-950/40 ring-2 ring-emerald-400/50'
              : 'bg-white hover:bg-zinc-200 text-zinc-950 shadow-zinc-950/40'
          }`}
        >
          {isPaused ? (
            <>
              <Play className="w-8 h-8 fill-current translate-x-0.5" />
              <span className="text-xs font-black tracking-widest uppercase">Resume</span>
            </>
          ) : (
            <>
              <Pause className="w-8 h-8 fill-current" />
              <span className="text-xs font-black tracking-widest uppercase">Pause</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onNext}
          aria-label="Skip to next segment"
          className="h-16 rounded-2xl bg-zinc-900 border border-zinc-800/80 hover:bg-zinc-800 active:bg-zinc-700 text-zinc-300 hover:text-white flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
        >
          <StepForward className="w-6 h-6" />
          <span className="text-[11px] font-bold tracking-wider uppercase">Skip</span>
        </button>
      </div>

      {/* Time Adjustments Row */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onAddTime(-10)}
          aria-label="Subtract 10 seconds"
          className="py-2.5 px-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white font-mono font-bold text-sm transition-colors active:scale-95 cursor-pointer"
        >
          -10s
        </button>
        <button
          type="button"
          onClick={() => onAddTime(10)}
          aria-label="Add 10 seconds"
          className="py-2.5 px-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white font-mono font-bold text-sm transition-colors active:scale-95 cursor-pointer"
        >
          +10s
        </button>
        <button
          type="button"
          onClick={() => onAddTime(30)}
          aria-label="Add 30 seconds"
          className="py-2.5 px-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white font-mono font-bold text-sm transition-colors active:scale-95 cursor-pointer"
        >
          +30s
        </button>
      </div>

      {/* Secondary Actions Row */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={onRestartSegment}
          aria-label="Restart current segment"
          className="py-3 px-3 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-zinc-400" />
          <span>Restart Set</span>
        </button>

        <button
          type="button"
          onClick={onRequestEnd}
          aria-label="End workout"
          className="py-3 px-3 rounded-xl bg-zinc-900/80 border border-rose-950/60 hover:bg-rose-950/40 text-rose-300 hover:text-rose-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors active:scale-95 cursor-pointer"
        >
          <Square className="w-4 h-4 text-rose-400 fill-current" />
          <span>End Workout</span>
        </button>
      </div>
    </div>
  );
}
