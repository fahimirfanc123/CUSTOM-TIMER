import { AlertTriangle, X } from 'lucide-react';

export interface EndWorkoutDialogProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirmEnd: () => void;
}

export function EndWorkoutDialog({
  isOpen,
  onCancel,
  onConfirmEnd,
}: EndWorkoutDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="end-dialog-title"
      aria-describedby="end-dialog-description"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none"
    >
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close dialog"
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <h2 id="end-dialog-title" className="text-xl font-bold text-white tracking-tight">
            End workout?
          </h2>
          <p id="end-dialog-description" className="text-sm text-zinc-400">
            Your current session will stop.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-200 font-bold text-sm tracking-wide transition-colors cursor-pointer"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={onConfirmEnd}
            aria-label="Confirm end workout"
            className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-rose-950/40 transition-colors cursor-pointer"
          >
            END WORKOUT
          </button>
        </div>
      </div>
    </div>
  );
}
