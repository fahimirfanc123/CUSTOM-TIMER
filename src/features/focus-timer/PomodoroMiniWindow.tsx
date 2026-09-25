import { FC } from 'react';
import { Play, Pause, SkipForward, ExternalLink, Pin, PinOff, X } from 'lucide-react';
import { FocusSnapshot } from '../../core/focus/types';
import { formatDigitalTime } from '../../shared/utils/timeFormat';

export interface PomodoroMiniWindowProps {
  snapshot: FocusSnapshot;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onStartFocus: () => void;
  onStartBreak: () => void;
  onExpand: () => void;
  onHide: () => void;
  alwaysOnTop: boolean;
  onToggleAlwaysOnTop: () => void;
}

export const PomodoroMiniWindow: FC<PomodoroMiniWindowProps> = ({
  snapshot,
  onPause,
  onResume,
  onSkip,
  onStartFocus,
  onStartBreak,
  onExpand,
  onHide,
  alwaysOnTop,
  onToggleAlwaysOnTop,
}) => {
  const isPaused = snapshot.status === 'PAUSED';
  const isRunning = snapshot.status === 'RUNNING';
  const isAwaiting = snapshot.status === 'AWAITING_NEXT_PHASE';
  const isIdle = snapshot.status === 'IDLE';

  const phaseColor =
    isPaused
      ? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
      : snapshot.phase === 'FOCUS'
      ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
      : snapshot.phase === 'LONG_BREAK'
      ? 'border-purple-500/30 text-purple-400 bg-purple-500/10'
      : 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10';

  const progressGradient =
    isPaused
      ? 'from-amber-500 to-yellow-400'
      : snapshot.phase === 'FOCUS'
      ? 'from-emerald-500 to-teal-400'
      : snapshot.phase === 'LONG_BREAK'
      ? 'from-purple-500 to-indigo-400'
      : 'from-cyan-500 to-blue-400';

  const phaseLabel = isPaused
    ? 'PAUSED'
    : snapshot.phase === 'FOCUS'
    ? 'FOCUS'
    : snapshot.phase === 'LONG_BREAK'
    ? 'LONG BREAK'
    : snapshot.phase === 'SHORT_BREAK'
    ? 'BREAK'
    : 'READY';

  const progressPercent = Math.min(100, Math.max(0, snapshot.progress * 100));

  return (
    <div
      data-tauri-drag-region
      className="w-full h-full min-h-[110px] max-h-[140px] bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-700/60 rounded-xl p-3 flex flex-col justify-between select-none shadow-2xl overflow-hidden font-sans text-slate-100"
      role="region"
      aria-label="Pomodoro Desktop Mini Window"
    >
      {/* Top Header / Drag Handle */}
      <div data-tauri-drag-region className="flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`px-1.5 py-0.5 text-[10px] font-bold tracking-wider rounded border uppercase ${phaseColor}`}
          >
            {phaseLabel}
          </span>
          {snapshot.label && (
            <span
              className="text-[11px] font-medium text-slate-300 truncate max-w-[90px]"
              title={snapshot.label}
            >
              {snapshot.label}
            </span>
          )}
        </div>

        {/* Pin & Hide Window controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleAlwaysOnTop}
            className={`p-1 rounded transition-colors ${
              alwaysOnTop
                ? 'text-emerald-400 hover:bg-slate-800'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={alwaysOnTop ? 'Always on top: ON' : 'Always on top: OFF'}
            aria-label={alwaysOnTop ? 'Disable Always on Top' : 'Enable Always on Top'}
          >
            {alwaysOnTop ? <Pin className="w-3.5 h-3.5 fill-current" /> : <PinOff className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onHide}
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Hide Mini Timer"
            aria-label="Hide Mini Window"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Countdown & Quick Controls */}
      <div data-tauri-drag-region className="flex items-center justify-between gap-2 my-1">
        <div data-tauri-drag-region className="flex items-baseline gap-1">
          <span className="text-2xl font-black tracking-tight font-mono text-white tabular-nums drop-shadow-sm">
            {formatDigitalTime(snapshot.remainingSec)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            S{snapshot.currentSession}/{snapshot.sessionsBeforeLongBreak}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {isRunning && (
            <button
              type="button"
              onClick={onPause}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-colors shadow-sm"
              title="Pause"
              aria-label="Pause Timer"
            >
              <Pause className="w-4 h-4 fill-current" />
            </button>
          )}

          {isPaused && (
            <button
              type="button"
              onClick={onResume}
              className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors shadow-sm"
              title="Resume"
              aria-label="Resume Timer"
            >
              <Play className="w-4 h-4 fill-current" />
            </button>
          )}

          {(isIdle || isAwaiting) && (
            <button
              type="button"
              onClick={() => {
                if (snapshot.awaitingNextPhase === 'FOCUS' || isIdle) {
                  onStartFocus();
                } else {
                  onStartBreak();
                }
              }}
              className="px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-sm flex items-center gap-1"
              title="Start"
              aria-label="Start Session"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{isIdle ? 'Start' : 'Next'}</span>
            </button>
          )}

          {!isIdle && (
            <button
              type="button"
              onClick={onSkip}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Skip Phase"
              aria-label="Skip Phase"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onExpand}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Expand Full CTR"
            aria-label="Expand Full CTR Application"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div data-tauri-drag-region className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${progressGradient} transition-all duration-300 ease-out`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
