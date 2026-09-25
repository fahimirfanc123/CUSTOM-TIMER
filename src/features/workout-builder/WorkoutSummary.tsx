import { useMemo } from 'react';
import { Clock, Layers, RotateCcw, Dumbbell } from 'lucide-react';
import { Workout } from '../../core/models/workout';
import { buildSegmentQueue } from '../../core/builder/segmentBuilder';
import { validateWorkout } from '../../core/builder/validator';
import { formatEstimatedDuration } from '../../core/audio/durationFormatter';

export interface WorkoutSummaryProps {
  workout: Workout;
  className?: string;
}

export function calculateWorkoutMetrics(workout: Workout): {
  totalExercises: number;
  totalSets: number;
  totalRounds: number;
  totalSteps: number;
  estimatedDurationSec: number | null;
  isValid: boolean;
} {
  const totalExercises = workout.exercises.length;
  const totalSets = workout.exercises.reduce((acc, ex) => acc + (ex.sets || 0), 0) * (workout.rounds || 1);
  const totalRounds = workout.rounds || 1;
  const totalSteps = totalExercises * totalRounds;

  let estimatedDurationSec: number | null = null;
  let isValid = false;

  try {
    validateWorkout(workout);
    isValid = true;
    const segments = buildSegmentQueue(workout);
    estimatedDurationSec = segments.reduce((acc, s) => acc + s.durationSec, 0);
  } catch {
    isValid = false;
    estimatedDurationSec = null;
  }

  return {
    totalExercises,
    totalSets,
    totalRounds,
    totalSteps,
    estimatedDurationSec,
    isValid,
  };
}

export function WorkoutSummary({ workout, className = '' }: WorkoutSummaryProps) {
  const metrics = useMemo(() => calculateWorkoutMetrics(workout), [workout]);

  return (
    <div
      aria-label="Workout summary"
      className={`bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-none backdrop-blur-md transition-colors ${className}`}
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        {/* Total Exercises */}
        <div className="bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-2.5 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
            <Dumbbell className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Exercises
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-zinc-900 dark:text-white tabular-nums">
            {metrics.totalExercises}
          </div>
        </div>

        {/* Total Sets */}
        <div className="bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-2.5 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
            <Layers className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            Total Sets
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-zinc-900 dark:text-white tabular-nums">
            {metrics.totalSets}
          </div>
        </div>

        {/* Rounds & Steps */}
        <div className="bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-2.5 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
            <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Rounds
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-zinc-900 dark:text-white tabular-nums">
            {metrics.totalRounds}
            <span className="text-xs text-zinc-500 font-normal ml-1">
              ({metrics.totalSteps} steps)
            </span>
          </div>
        </div>

        {/* Estimated Duration */}
        <div className="bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-2.5 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Est. Duration
          </div>
          <div className="text-sm sm:text-base font-black font-mono text-emerald-600 dark:text-emerald-400 tabular-nums truncate max-w-full">
            {metrics.estimatedDurationSec !== null
              ? formatEstimatedDuration(metrics.estimatedDurationSec)
              : 'Unavailable'}
          </div>
        </div>
      </div>
    </div>
  );
}
