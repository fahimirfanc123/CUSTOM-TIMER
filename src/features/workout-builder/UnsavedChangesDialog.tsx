import { AlertTriangle } from 'lucide-react';

export interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onDiscard: () => void;
  onKeepEditing: () => void;
}

export function UnsavedChangesDialog({
  isOpen,
  onDiscard,
  onKeepEditing,
}: UnsavedChangesDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="unsaved-title"
      aria-describedby="unsaved-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 transition-colors">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 id="unsaved-title" className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight">
              Unsaved Changes
            </h2>
            <p id="unsaved-desc" className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Leaving now will discard all your modifications.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onKeepEditing}
            className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Keep Editing
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-rose-950/40 cursor-pointer"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}
