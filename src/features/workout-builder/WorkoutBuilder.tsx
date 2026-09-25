import { useState, useReducer, useEffect, ChangeEvent } from 'react';
import {
  ArrowLeft,
  Save,
  Play,
  Eye,
  Plus,
  AlertCircle,
  Dumbbell,
  Check,
} from 'lucide-react';
import { Workout } from '../../core/models/workout';
import { validateWorkout } from '../../core/builder/validator';
import { IWorkoutRepository, defaultWorkoutRepository, SavedWorkout } from '../../core/storage/workoutRepository';
import { builderReducer, initialBuilderState } from './builderReducer';
import { ExerciseCard } from './ExerciseCard';
import { WorkoutSummary } from './WorkoutSummary';
import { WorkoutPreviewModal } from './WorkoutPreviewModal';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { Stepper } from '../../shared/components/Stepper';
import { DurationInput } from '../../shared/components/DurationInput';

export interface WorkoutBuilderProps {
  initialWorkout?: Workout;
  savedId?: string;
  createdAt?: number;
  repository?: IWorkoutRepository;
  onBack: () => void;
  onSaved?: (saved: SavedWorkout) => void;
  onStart?: (workout: Workout) => void;
}

export function WorkoutBuilder({
  initialWorkout,
  savedId,
  createdAt,
  repository = defaultWorkoutRepository,
  onBack,
  onSaved,
  onStart,
}: WorkoutBuilderProps) {
  const [state, dispatch] = useReducer(builderReducer, initialBuilderState, (init) => {
    if (initialWorkout) {
      return {
        workout: {
          ...initialWorkout,
          exercises: initialWorkout.exercises.map((e) => ({ ...e })),
        },
        isDirty: false,
        editingSavedId: savedId ?? null,
        createdAt,
      };
    }
    return init;
  });

  const { workout, isDirty, editingSavedId } = state;

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUnsavedDialogOpen, setIsUnsavedDialogOpen] = useState(false);
  const [deleteExerciseIndex, setDeleteExerciseIndex] = useState<number | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Clear save success message after 3 seconds
  useEffect(() => {
    if (saveSuccessMessage) {
      const timer = setTimeout(() => setSaveSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccessMessage]);

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_TITLE', payload: e.target.value });
    if (validationError) setValidationError(null);
  };

  const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    dispatch({ type: 'SET_DESCRIPTION', payload: e.target.value });
  };

  const handleBack = () => {
    if (isDirty) {
      setIsUnsavedDialogOpen(true);
    } else {
      onBack();
    }
  };

  const validateCurrentWorkout = (): boolean => {
    try {
      validateWorkout(workout);
      setValidationError(null);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid workout configuration';
      setValidationError(msg);
      return false;
    }
  };

  const handleSave = async (): Promise<SavedWorkout | null> => {
    if (!validateCurrentWorkout()) {
      return null;
    }

    try {
      let saved: SavedWorkout;
      if (editingSavedId) {
        saved = await repository.update(workout);
      } else {
        saved = await repository.save(workout);
      }

      setSaveSuccessMessage('Workout saved successfully!');
      dispatch({
        type: 'LOAD_WORKOUT',
        payload: {
          workout: saved.workout,
          savedId: saved.id,
          createdAt: saved.createdAt,
        },
      });

      if (onSaved) {
        onSaved(saved);
      }
      return saved;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save workout to database';
      setValidationError(msg);
      return null;
    }
  };

  const handlePreview = () => {
    if (validateCurrentWorkout()) {
      setIsPreviewOpen(true);
    }
  };

  const handleStart = async () => {
    if (!validateCurrentWorkout()) {
      return;
    }

    try {
      if (editingSavedId || isDirty) {
        await handleSave();
      }
      if (onStart) {
        onStart(workout);
      }
    } catch {
      if (onStart) {
        onStart(workout);
      }
    }
  };

  const isTitleEmpty = workout.title.trim() === '';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-white pb-24 md:pb-12 transition-colors duration-200">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-200 dark:border-zinc-800/80 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Back to home"
            className="p-2 -ml-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              {editingSavedId ? 'Edit Workout' : 'Create Workout'}
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium hidden sm:block">
              {isDirty ? 'Draft modified' : 'All changes saved'}
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePreview}
            aria-label="Preview workout"
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm dark:shadow-none"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Preview</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            aria-label="Save workout"
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-950/40 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>

          {onStart && (
            <button
              type="button"
              onClick={handleStart}
              aria-label="Start workout"
              className="hidden sm:flex px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-black text-xs uppercase tracking-wider items-center gap-1.5 transition-all shadow-lg cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Success Toast Banner */}
        {saveSuccessMessage && (
          <div
            role="status"
            className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2"
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>{saveSuccessMessage}</span>
          </div>
        )}

        {/* Validation Alert */}
        {validationError && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-sm font-semibold flex items-start gap-3 animate-in fade-in"
          >
            <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold uppercase tracking-wide text-xs block text-rose-600 dark:text-rose-400 mb-0.5">
                Validation Error
              </span>
              <span>{validationError}</span>
            </div>
          </div>
        )}

        {/* Live Summary Bar */}
        <WorkoutSummary workout={workout} />

        {/* Workout Info & Settings Card */}
        <section
          aria-label="Workout settings"
          className="bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-7 space-y-6 shadow-sm dark:shadow-xl dark:shadow-black/20"
        >
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label
                htmlFor="workout-title"
                className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center justify-between"
              >
                <span>Workout Title</span>
                <span className="text-[10px] text-rose-500 dark:text-rose-400 font-bold uppercase">Required</span>
              </label>
              <input
                id="workout-title"
                type="text"
                value={workout.title}
                onChange={handleTitleChange}
                placeholder="e.g. Full Body HIIT & Core"
                aria-required="true"
                aria-invalid={isTitleEmpty}
                className={`w-full bg-zinc-50 dark:bg-zinc-950/60 border rounded-2xl px-4 py-3 text-lg sm:text-xl font-black text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none transition-colors ${
                  isTitleEmpty && validationError
                    ? 'border-rose-500 focus:border-rose-400'
                    : 'border-zinc-200 dark:border-zinc-800 focus:border-emerald-500'
                }`}
              />
              {isTitleEmpty && validationError && (
                <p className="text-xs text-rose-500 dark:text-rose-400 font-medium">Workout title is required</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label
                htmlFor="workout-desc"
                className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block"
              >
                Description <span className="text-zinc-400 dark:text-zinc-500 lowercase">(optional)</span>
              </label>
              <textarea
                id="workout-desc"
                value={workout.description ?? ''}
                onChange={handleDescriptionChange}
                placeholder="Add instructions, target muscle groups, or notes..."
                rows={2}
                className="w-full bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2.5 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus:border-emerald-500 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Global Timers & Rounds Settings */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Prepare Countdown */}
            <DurationInput
              valueSec={workout.prepareDurationSec}
              minSec={0}
              maxSec={120}
              onChange={(val) => dispatch({ type: 'SET_PREPARE_DURATION', payload: val })}
              label="Prepare Countdown"
              id="workout-prepare-duration"
            />

            {/* Total Rounds */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                Total Rounds
              </span>
              <Stepper
                value={workout.rounds}
                min={1}
                max={99}
                onChange={(val) => dispatch({ type: 'SET_ROUNDS', payload: val })}
                label="Workout rounds"
              />
            </div>

            {/* Rest Between Rounds */}
            <DurationInput
              valueSec={workout.restBetweenRoundsSec}
              minSec={0}
              maxSec={600}
              onChange={(val) => dispatch({ type: 'SET_REST_BETWEEN_ROUNDS', payload: val })}
              label="Rest Between Rounds"
              id="workout-round-rest"
            />
          </div>
        </section>

        {/* Exercises Section */}
        <section aria-label="Exercises list" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-white">
              Exercises ({workout.exercises.length})
            </h2>
            <button
              type="button"
              onClick={() => dispatch({ type: 'ADD_EXERCISE' })}
              aria-label="Add new exercise"
              className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Exercise</span>
            </button>
          </div>

          {workout.exercises.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900/40 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 text-center space-y-3 shadow-sm dark:shadow-none">
              <Dumbbell className="w-10 h-10 text-zinc-400 dark:text-zinc-600 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No exercises added yet</p>
                <p className="text-xs text-zinc-500">
                  Add at least one exercise to complete this workout.
                </p>
              </div>
              <button
                type="button"
                onClick={() => dispatch({ type: 'ADD_EXERCISE' })}
                className="mt-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-emerald-950/40"
              >
                <Plus className="w-4 h-4" /> Add First Exercise
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {workout.exercises.map((exercise, idx) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  index={idx}
                  totalExercises={workout.exercises.length}
                  onUpdate={(updated) =>
                    dispatch({
                      type: 'UPDATE_EXERCISE',
                      payload: { index: idx, exercise: updated },
                    })
                  }
                  onDuplicate={() => dispatch({ type: 'DUPLICATE_EXERCISE', payload: idx })}
                  onDeleteRequest={() => setDeleteExerciseIndex(idx)}
                  onMoveUp={() => dispatch({ type: 'MOVE_EXERCISE_UP', payload: idx })}
                  onMoveDown={() => dispatch({ type: 'MOVE_EXERCISE_DOWN', payload: idx })}
                />
              ))}
            </div>
          )}

          {/* Add Exercise Bottom Trigger */}
          {workout.exercises.length > 0 && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'ADD_EXERCISE' })}
              aria-label="Add exercise at bottom"
              className="w-full py-4 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-white/60 dark:bg-zinc-900/30 hover:bg-white dark:hover:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Another Exercise
            </button>
          )}
        </section>
      </main>

      {/* Mobile Sticky Bottom Bar */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-200 dark:border-zinc-800/80 p-3 flex items-center gap-2 z-30">
        <button
          type="button"
          onClick={handlePreview}
          aria-label="Preview (mobile)"
          className="flex-1 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
        >
          <Eye className="w-4 h-4" />
          <span>Preview</span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          aria-label="Save (mobile)"
          className="flex-1 py-3 rounded-xl bg-emerald-500 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40"
        >
          <Save className="w-4 h-4" />
          <span>Save</span>
        </button>

        {onStart && (
          <button
            type="button"
            onClick={handleStart}
            aria-label="Start (mobile)"
            className="flex-1 py-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start</span>
          </button>
        )}
      </div>

      {/* Workout Preview Modal */}
      <WorkoutPreviewModal
        workout={workout}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onStart={
          onStart
            ? () => {
                setIsPreviewOpen(false);
                handleStart();
              }
            : undefined
        }
      />

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        isOpen={isUnsavedDialogOpen}
        onDiscard={() => {
          setIsUnsavedDialogOpen(false);
          onBack();
        }}
        onKeepEditing={() => setIsUnsavedDialogOpen(false)}
      />

      {/* Delete Exercise Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteExerciseIndex !== null}
        workoutTitle={
          deleteExerciseIndex !== null
            ? workout.exercises[deleteExerciseIndex]?.name || `Exercise ${deleteExerciseIndex + 1}`
            : ''
        }
        onConfirm={() => {
          if (deleteExerciseIndex !== null) {
            dispatch({ type: 'DELETE_EXERCISE', payload: deleteExerciseIndex });
            setDeleteExerciseIndex(null);
          }
        }}
        onCancel={() => setDeleteExerciseIndex(null)}
      />
    </div>
  );
}
