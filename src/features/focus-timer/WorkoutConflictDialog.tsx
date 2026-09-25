import { Dumbbell, AlertCircle, Pause } from 'lucide-react';

export interface WorkoutConflictDialogProps {
  isOpen: boolean;
  onPauseFocusAndStartWorkout: () => void;
  onCancel: () => void;
}

export function WorkoutConflictDialog({
  isOpen,
  onPauseFocusAndStartWorkout,
  onCancel,
}: WorkoutConflictDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-scale-up">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h3 id="conflict-dialog-title" className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight">
              Focus Timer Active
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              A focus timer is currently running. Would you like to pause focus and begin your workout session?
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onPauseFocusAndStartWorkout}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/30 cursor-pointer"
          >
            <Pause className="w-4 h-4 fill-current" />
            <Dumbbell className="w-4 h-4" />
            <span>Pause Focus & Start Workout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
