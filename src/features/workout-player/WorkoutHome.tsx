import { useState, useEffect, useCallback } from 'react';
import { Workout } from '../../core/models/workout';
import { demoWorkouts } from './demoWorkouts';
import {
  Play,
  Timer,
  Flame,
  Dumbbell,
  Zap,
  Plus,
  Edit3,
  Copy,
  Trash2,
  Sliders,
  Clock,
  Layers,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { formatEstimatedDuration, formatDigitalTime } from '../../core/audio/durationFormatter';
import { buildSegmentQueue } from '../../core/builder/segmentBuilder';
import { IWorkoutRepository, defaultWorkoutRepository, SavedWorkout } from '../../core/storage/workoutRepository';
import { DeleteConfirmDialog } from '../workout-builder/DeleteConfirmDialog';
import { ThemeToggle } from '../../shared/theme/ThemeToggle';

export interface WorkoutHomeProps {
  onStartWorkout: (workout: Workout) => void;
  onCreateWorkout?: () => void;
  onEditWorkout?: (saved: SavedWorkout) => void;
  onCustomizePreset?: (preset: Workout) => void;
  repository?: IWorkoutRepository;
  workouts?: Workout[];
}

export function WorkoutHome({
  onStartWorkout,
  onCreateWorkout,
  onEditWorkout,
  onCustomizePreset,
  repository = defaultWorkoutRepository,
  workouts = demoWorkouts,
}: WorkoutHomeProps) {
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<SavedWorkout | null>(null);

  const loadSavedWorkouts = useCallback(async () => {
    try {
      setIsLoadingSaved(true);
      const list = await repository.getAll();
      setSavedWorkouts(list);
    } catch {
      setSavedWorkouts([]);
    } finally {
      setIsLoadingSaved(false);
    }
  }, [repository]);

  useEffect(() => {
    loadSavedWorkouts();
  }, [loadSavedWorkouts]);

  const handleDuplicateSaved = async (id: string) => {
    try {
      await repository.duplicate(id);
      await loadSavedWorkouts();
    } catch {
      // Failed to duplicate
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    try {
      await repository.delete(deleteTarget.id);
      setDeleteTarget(null);
      await loadSavedWorkouts();
    } catch {
      // Failed to delete
    }
  };

  const getWorkoutDurationSec = (workout: Workout): number => {
    try {
      const segments = buildSegmentQueue(workout);
      return segments.reduce((acc, s) => acc + s.durationSec, 0);
    } catch {
      return 0;
    }
  };

  const getWorkoutIcon = (workout: Workout) => {
    switch (workout.id) {
      case 'quick-timer':
        return <Zap className="w-5 h-5 text-amber-500 dark:text-amber-400" />;
      case 'boxing-rounds':
        return <Flame className="w-5 h-5 text-rose-500 dark:text-rose-400" />;
      case 'hiit-circuit':
        return <Timer className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />;
      case 'strength-training':
        return <Dumbbell className="w-5 h-5 text-sky-500 dark:text-sky-400" />;
      default:
        return <Dumbbell className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between max-w-4xl mx-auto p-4 sm:p-6 select-none transition-colors duration-200">
      {/* App Top Bar */}
      <header className="pt-2 pb-6 border-b border-zinc-200 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-xl shadow-lg shadow-emerald-950/20">
            CTR
          </div>
          <div>
            <h1
              aria-label="CTR Custom Training Timer"
              className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2"
            >
              CTR
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
              <span>Custom Training Timer</span> • Voice-Coached Interval & Circuit Training
            </p>
          </div>
        </div>

        {/* Theme Mode & Status Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            Ready
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 space-y-8 my-6">
        {/* Hero Create Action Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-zinc-50 dark:from-emerald-950/50 dark:via-zinc-900 dark:to-zinc-900/90 border border-emerald-500/30 p-6 sm:p-8 shadow-xl dark:shadow-2xl dark:shadow-emerald-950/20 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> Custom Workout Builder
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">
              Design Your Workout
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 max-w-lg leading-relaxed">
              Build custom interval circuits, adjust work/rest times, target reps, and organize rounds with precise countdown audio.
            </p>
          </div>

          <button
            type="button"
            onClick={onCreateWorkout}
            aria-label="Create new workout"
            className="w-full sm:w-auto shrink-0 px-6 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-zinc-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-emerald-950/40 cursor-pointer active:scale-98"
          >
            <Plus className="w-5 h-5" />
            <span>Create Workout</span>
          </button>
        </div>

        {/* Section: My Workouts (IndexedDB Persisted) */}
        <section aria-label="My custom workouts" className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                My Workouts
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold">
                {savedWorkouts.length}
              </span>
            </div>
          </div>

          {isLoadingSaved ? (
            <div className="p-8 text-center text-zinc-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-wider">
              Loading saved workouts...
            </div>
          ) : savedWorkouts.length === 0 ? (
            /* Empty State */
            <div className="bg-white dark:bg-zinc-900/40 border border-dashed border-zinc-200 dark:border-zinc-800/90 rounded-3xl p-8 text-center space-y-3.5 shadow-sm dark:shadow-none">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mx-auto text-zinc-400 dark:text-zinc-500">
                <Dumbbell className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No custom workouts yet</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                  Create your first workout or customize a preset to save it to your local library.
                </p>
              </div>
              <button
                type="button"
                onClick={onCreateWorkout}
                className="mt-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create Workout
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedWorkouts.map((saved) => {
                const totalDuration = getWorkoutDurationSec(saved.workout);
                const totalSets = saved.workout.exercises.reduce((acc: number, e) => acc + (e.sets || 0), 0) * (saved.workout.rounds || 1);

                return (
                  <article
                    key={saved.id}
                    aria-label={`Saved workout: ${saved.workout.title}`}
                    className="bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700/80 rounded-2xl p-5 shadow-sm dark:shadow-lg dark:shadow-black/20 flex flex-col justify-between gap-4 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white tracking-tight leading-snug">
                          {saved.workout.title || 'Untitled Workout'}
                        </h3>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                          Custom
                        </span>
                      </div>

                      {saved.workout.description && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                          {saved.workout.description}
                        </p>
                      )}

                      {/* Workout Metrics Chips */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-2 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          {formatEstimatedDuration(totalDuration)} ({formatDigitalTime(totalDuration)})
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <RotateCcw className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                          {saved.workout.rounds} {saved.workout.rounds === 1 ? 'round' : 'rounds'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                          {saved.workout.exercises.length} ex ({totalSets} sets)
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        {onEditWorkout && (
                          <button
                            type="button"
                            onClick={() => onEditWorkout(saved)}
                            aria-label={`Edit ${saved.workout.title}`}
                            className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Edit workout"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDuplicateSaved(saved.id)}
                          aria-label={`Duplicate ${saved.workout.title}`}
                          className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Duplicate workout"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(saved)}
                          aria-label={`Delete ${saved.workout.title}`}
                          className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Delete workout"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onStartWorkout(saved.workout)}
                        aria-label={`Start ${saved.workout.title} - Start Workout`}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/30 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Section: Presets (Built-in Demo Workouts) */}
        <section aria-label="Built-in preset workouts" className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                Preset Workouts
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold">
                {workouts.length}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workouts.map((preset) => {
              const totalDuration = getWorkoutDurationSec(preset);
              const totalSets = preset.exercises.reduce((acc, e) => acc + e.sets, 0) * preset.rounds;

              return (
                <article
                  key={preset.id}
                  aria-label={`Preset: ${preset.title}`}
                  className="bg-white/90 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700/80 rounded-2xl p-5 shadow-sm dark:shadow-lg dark:shadow-black/20 flex flex-col justify-between gap-4 transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shrink-0">
                        {getWorkoutIcon(preset)}
                      </div>
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white tracking-tight truncate">
                            {preset.title}
                          </h3>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                          {preset.description}
                        </p>
                      </div>
                    </div>

                    {/* Preset Metrics Chips */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1 font-mono text-zinc-700 dark:text-zinc-300">
                        <Clock className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                        {formatEstimatedDuration(totalDuration)} ({formatDigitalTime(totalDuration)})
                      </span>
                      <span>•</span>
                      <span>
                        {preset.rounds} {preset.rounds === 1 ? 'round' : 'rounds'}
                      </span>
                      <span>•</span>
                      <span>
                        {preset.exercises.length} ex ({totalSets} sets)
                      </span>
                    </div>
                  </div>

                  {/* Actions: Customize & Start */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                    {onCustomizePreset ? (
                      <button
                        type="button"
                        onClick={() => onCustomizePreset(preset)}
                        aria-label={`Customize ${preset.title}`}
                        className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                        <span>Customize</span>
                      </button>
                    ) : (
                      <div />
                    )}

                    <button
                      type="button"
                      onClick={() => onStartWorkout(preset)}
                      aria-label={`Start ${preset.title} - Start Workout`}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/30 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteTarget !== null}
        workoutTitle={deleteTarget?.workout.title || 'Untitled Workout'}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
