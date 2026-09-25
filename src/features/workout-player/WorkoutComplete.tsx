import { Workout } from '../../core/models/workout';
import { EngineSnapshot } from '../../core/engine/types';
import { Trophy, RotateCcw, Check, Timer, Flame, Layers } from 'lucide-react';
import { formatDigitalTime } from '../../shared/utils/timeFormat';

export interface WorkoutCompleteProps {
  workout: Workout | null;
  snapshot: EngineSnapshot;
  onDone: () => void;
  onRestartWorkout: () => void;
}

export function WorkoutComplete({
  workout,
  snapshot,
  onDone,
  onRestartWorkout,
}: WorkoutCompleteProps) {
  const durationSec =
    snapshot.elapsedWorkoutTimeSec > 0
      ? snapshot.elapsedWorkoutTimeSec
      : snapshot.totalWorkoutDurationSec;

  const totalExercises = workout?.exercises.length ?? 1;
  const totalRounds = workout?.rounds ?? 1;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between max-w-xl mx-auto p-4 sm:p-6 select-none animate-in fade-in zoom-in-95 duration-200 transition-colors">
      {/* Header */}
      <header className="pt-6 pb-2 text-center space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-xl shadow-emerald-950/10 dark:shadow-emerald-950/30">
          <Trophy className="w-10 h-10" />
        </div>

        <div className="space-y-1">
          <div className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Great Work!
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight uppercase">
            WORKOUT COMPLETE
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            {workout?.title ?? 'Custom Training Session'}
          </p>
        </div>
      </header>

      {/* Summary Stats Cards */}
      <main className="flex-1 flex flex-col justify-center my-4 space-y-3">
        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 space-y-4 shadow-sm dark:shadow-none">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 text-center">
            Workout Summary
          </h2>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
            {/* Duration */}
            <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-3">
              <Timer className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
              <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Duration
              </div>
              <div className="text-base sm:text-lg font-black text-zinc-900 dark:text-white font-mono mt-0.5">
                {formatDigitalTime(durationSec)}
              </div>
            </div>

            {/* Exercises Completed */}
            <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-3">
              <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
              <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Exercises
              </div>
              <div className="text-base sm:text-lg font-black text-zinc-900 dark:text-white font-mono mt-0.5">
                {totalExercises}
              </div>
            </div>

            {/* Rounds Completed */}
            <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-3">
              <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400 mx-auto mb-1" />
              <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Rounds
              </div>
              <div className="text-base sm:text-lg font-black text-zinc-900 dark:text-white font-mono mt-0.5">
                {totalRounds}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Actions Footer */}
      <footer className="pt-2 pb-2 space-y-3">
        <button
          type="button"
          onClick={onRestartWorkout}
          aria-label="Restart workout"
          className="w-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 active:bg-zinc-300 dark:active:bg-zinc-700 text-zinc-800 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700/80 font-bold text-base sm:text-lg py-4 px-6 rounded-2xl shadow-sm dark:shadow-lg transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <RotateCcw className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          <span>RESTART WORKOUT</span>
        </button>

        <button
          type="button"
          onClick={onDone}
          aria-label="Done with workout"
          className="w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-zinc-950 font-black text-base sm:text-lg py-4 px-6 rounded-2xl shadow-xl shadow-emerald-950/20 dark:shadow-emerald-950/40 transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <Check className="w-6 h-6 stroke-[3]" />
          <span>DONE</span>
        </button>
      </footer>
    </div>
  );
}
