import { useState, ChangeEvent } from 'react';
import { ChevronUp, ChevronDown, Copy, Trash2, ChevronRight } from 'lucide-react';
import { Exercise } from '../../core/models/workout';
import { Stepper } from '../../shared/components/Stepper';
import { DurationInput } from '../../shared/components/DurationInput';

export interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
  totalExercises: number;
  onUpdate: (exercise: Partial<Exercise>) => void;
  onDuplicate: () => void;
  onDeleteRequest: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function ExerciseCard({
  exercise,
  index,
  totalExercises,
  onUpdate,
  onDuplicate,
  onDeleteRequest,
  onMoveUp,
  onMoveDown,
}: ExerciseCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const isNameInvalid = exercise.name.trim() === '';
  const isWorkInvalid = exercise.workDurationSec < 1;
  const isSetsInvalid = exercise.sets < 1;

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    onUpdate({ name: e.target.value });
  };

  const handleRepsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    if (val === '') {
      onUpdate({ reps: undefined });
    } else {
      const num = parseInt(val, 10);
      if (!isNaN(num) && num > 0) {
        onUpdate({ reps: num });
      }
    }
  };

  const handleNotesChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    onUpdate({ notes: val === '' ? undefined : val });
  };

  return (
    <article
      aria-label={`Exercise ${index + 1}: ${exercise.name || 'Untitled'}`}
      className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-lg dark:shadow-black/20 space-y-4 transition-all"
    >
      {/* Exercise Card Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Collapse exercise details' : 'Expand exercise details'}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-transform cursor-pointer"
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform duration-200 ${
                isExpanded ? 'rotate-90' : ''
              }`}
            />
          </button>

          <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-black flex items-center justify-center shrink-0">
            {index + 1}
          </span>

          <input
            type="text"
            value={exercise.name}
            onChange={handleNameChange}
            placeholder="Exercise Name (e.g. Push-ups)"
            aria-label={`Exercise ${index + 1} name`}
            aria-invalid={isNameInvalid}
            className={`flex-1 min-w-0 bg-transparent text-base sm:text-lg font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none border-b py-1 transition-colors ${
              isNameInvalid
                ? 'border-rose-500 focus:border-rose-400'
                : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-emerald-500'
            }`}
          />
        </div>

        {/* Action Controls: Move Up, Move Down, Duplicate, Delete */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            aria-label={`Move exercise ${index + 1} up`}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronUp className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === totalExercises - 1}
            aria-label={`Move exercise ${index + 1} down`}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronDown className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onDuplicate}
            aria-label={`Duplicate exercise ${index + 1}`}
            className="p-2 rounded-xl text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onDeleteRequest}
            aria-label={`Delete exercise ${index + 1}`}
            className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isNameInvalid && (
        <p className="text-xs text-rose-500 dark:text-rose-400 font-medium pl-8" role="alert">
          Exercise name is required
        </p>
      )}

      {isExpanded && (
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-4">
          {/* Sets and Reps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                Sets
              </span>
              <Stepper
                value={exercise.sets}
                min={1}
                max={99}
                onChange={(sets) => onUpdate({ sets })}
                label={`Exercise ${index + 1} sets`}
              />
              {isSetsInvalid && (
                <p className="text-xs text-rose-500 dark:text-rose-400 font-medium" role="alert">
                  Sets must be at least 1
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor={`exercise-${exercise.id}-reps`}
                className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block"
              >
                Target Reps <span className="text-zinc-400 dark:text-zinc-500 lowercase">(optional)</span>
              </label>
              <input
                id={`exercise-${exercise.id}-reps`}
                type="number"
                min={1}
                max={999}
                value={exercise.reps ?? ''}
                onChange={handleRepsChange}
                placeholder="e.g. 12"
                aria-label={`Exercise ${index + 1} target reps`}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-base font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Work Duration */}
          <DurationInput
            valueSec={exercise.workDurationSec}
            minSec={1}
            maxSec={3599}
            onChange={(workDurationSec) => onUpdate({ workDurationSec })}
            label="Work Duration"
            id={`exercise-${exercise.id}-work`}
            error={isWorkInvalid ? 'Work duration must be at least 1 second' : undefined}
          />

          {/* Rest Times */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DurationInput
              valueSec={exercise.restBetweenSetsSec}
              minSec={0}
              maxSec={3599}
              onChange={(restBetweenSetsSec) => onUpdate({ restBetweenSetsSec })}
              label="Rest Between Sets"
              id={`exercise-${exercise.id}-rest-set`}
            />

            <DurationInput
              valueSec={exercise.restAfterExerciseSec}
              minSec={0}
              maxSec={3599}
              onChange={(restAfterExerciseSec) => onUpdate({ restAfterExerciseSec })}
              label="Rest After Exercise"
              id={`exercise-${exercise.id}-rest-exercise`}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label
              htmlFor={`exercise-${exercise.id}-notes`}
              className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block"
            >
              Notes <span className="text-zinc-400 dark:text-zinc-500 lowercase">(optional)</span>
            </label>
            <input
              id={`exercise-${exercise.id}-notes`}
              type="text"
              value={exercise.notes ?? ''}
              onChange={handleNotesChange}
              placeholder="e.g. Controlled tempo, explosive push"
              aria-label={`Exercise ${index + 1} notes`}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>
      )}
    </article>
  );
}
