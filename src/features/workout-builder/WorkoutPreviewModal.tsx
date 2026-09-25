import { X, Play, Clock, Flame, Moon, Bell } from 'lucide-react';
import { Workout } from '../../core/models/workout';
import { buildSegmentQueue } from '../../core/builder/segmentBuilder';
import { formatEstimatedDuration, formatDigitalTime } from '../../core/audio/durationFormatter';
import { WorkoutSegment } from '../../core/models/segment';

export interface WorkoutPreviewModalProps {
  workout: Workout;
  isOpen: boolean;
  onClose: () => void;
  onStart?: () => void;
}

export function WorkoutPreviewModal({
  workout,
  isOpen,
  onClose,
  onStart,
}: WorkoutPreviewModalProps) {
  if (!isOpen) return null;

  let segments: WorkoutSegment[] = [];
  let totalDurationSec = 0;
  let error: string | null = null;

  try {
    segments = buildSegmentQueue(workout);
    totalDurationSec = segments.reduce((acc, s) => acc + s.durationSec, 0);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Invalid workout configuration';
  }

  const getPhaseBadge = (phase: WorkoutSegment['phase']) => {
    switch (phase) {
      case 'PREPARE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Bell className="w-3 h-3" /> Prepare
          </span>
        );
      case 'WORK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Flame className="w-3 h-3" /> Work
          </span>
        );
      case 'REST_SET':
      case 'REST_EXERCISE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/30">
            <Moon className="w-3 h-3" /> Rest
          </span>
        );
      case 'REST_ROUND':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            <Moon className="w-3 h-3" /> Round Rest
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-900/90">
          <div>
            <h2 id="preview-title" className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              Workout Preview
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-zinc-400">
              {workout.title || 'Untitled Workout'} — {segments.length} segments
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Estimated Duration Header Banner */}
        {!error && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Clock className="w-4 h-4" />
              Estimated Duration
            </div>
            <div className="font-mono font-black text-emerald-400 text-sm sm:text-base">
              {formatEstimatedDuration(totalDurationSec)} ({formatDigitalTime(totalDurationSec)})
            </div>
          </div>
        )}

        {/* Scrollable Segments List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5 divide-y divide-zinc-800/40">
          {error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-semibold text-center">
              {error}
            </div>
          ) : (
            segments.map((seg, idx) => {
              const isFirstOfRound = seg.phase === 'WORK' && seg.context.step === 1 && seg.context.set === 1;
              return (
                <div key={idx} className="pt-2.5 first:pt-0">
                  {isFirstOfRound && (
                    <div className="text-[11px] font-black uppercase tracking-widest text-zinc-500 py-1 flex items-center gap-2">
                      <span>ROUND {seg.context.round} OF {seg.context.totalRounds}</span>
                      <div className="flex-1 h-px bg-zinc-800" />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-zinc-800/40 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs font-bold text-zinc-500 w-6 text-right shrink-0">
                        {idx + 1}
                      </span>

                      {getPhaseBadge(seg.phase)}

                      <div className="min-w-0">
                        <div className="text-sm font-bold text-zinc-100 truncate">
                          {seg.phase === 'PREPARE'
                            ? 'Get Ready'
                            : seg.context.exerciseName ?? 'Rest'}
                        </div>
                        {seg.phase === 'WORK' && (
                          <div className="text-[11px] font-semibold text-zinc-400">
                            Set {seg.context.set} / {seg.context.totalSets}
                            {seg.context.reps && ` • ${seg.context.reps} reps`}
                          </div>
                        )}
                        {seg.phase.startsWith('REST') && seg.context.nextTarget && (
                          <div className="text-[11px] font-semibold text-zinc-500 truncate">
                            Next: {seg.context.nextTarget.exerciseName} (Set {seg.context.nextTarget.setNumber})
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="font-mono font-bold text-xs sm:text-sm text-zinc-300 tabular-nums shrink-0">
                      {formatDigitalTime(seg.durationSec)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-zinc-800 bg-zinc-900/90 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Close
          </button>

          {onStart && !error && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onStart();
              }}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/40 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              Start Workout
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
