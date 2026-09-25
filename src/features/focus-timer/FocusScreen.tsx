import React, { useState, useEffect } from 'react';
import { useFocusTimer } from './FocusContext';
import { ProgressRing } from './ProgressRing';
import { FocusSettingsModal } from './FocusSettingsModal';
import { ResetConfirmDialog } from './ResetConfirmDialog';
import { ThemeToggle } from '../../shared/theme/ThemeToggle';
import { formatDigitalTime } from '../../shared/utils/timeFormat';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Sliders,
  Minimize2,
  ArrowLeft,
  CheckCircle2,
  Coffee,
  Brain,
  Tag,
} from 'lucide-react';

export interface FocusScreenProps {
  onBack?: () => void;
}

export function FocusScreen({ onBack }: FocusScreenProps) {
  const {
    snapshot,
    start,
    startFocus,
    pause,
    resume,
    reset,
    skip,
    minimize,
    setLabel,
    updateConfig,
    applyPreset,
  } = useFocusTimer();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [labelText, setLabelText] = useState(snapshot.label);
  const [isEditingLabel, setIsEditingLabel] = useState(false);

  // Sync label if updated externally
  useEffect(() => {
    setLabelText(snapshot.label);
  }, [snapshot.label]);

  const handleMinimize = () => {
    minimize();
    onBack?.();
  };

  const handleResetClick = () => {
    if (snapshot.status === 'RUNNING' || snapshot.status === 'PAUSED') {
      setIsResetConfirmOpen(true);
    } else {
      reset();
    }
  };

  const handleConfirmReset = () => {
    setIsResetConfirmOpen(false);
    reset();
  };

  const handleLabelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLabel(labelText.trim());
    setIsEditingLabel(false);
  };

  // Keyboard shortcuts (Space: pause/resume, R: reset, S: skip, M: minimize)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (snapshot.status === 'RUNNING') {
          pause();
        } else if (snapshot.status === 'PAUSED') {
          resume();
        } else {
          start();
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleResetClick();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        skip();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleMinimize();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const isRunning = snapshot.status === 'RUNNING';
  const isPaused = snapshot.status === 'PAUSED';
  const isAwaiting = snapshot.status === 'AWAITING_NEXT_PHASE';
  const isIdle = snapshot.status === 'IDLE';

  const timeFormatted = formatDigitalTime(snapshot.remainingSec);

  const getPhaseBadge = () => {
    if (isPaused) {
      return {
        text: 'PAUSED',
        color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        icon: <Pause className="w-3.5 h-3.5 fill-current" />,
      };
    }
    if (snapshot.phase === 'FOCUS') {
      return {
        text: isAwaiting ? 'FOCUS COMPLETE' : 'FOCUS SESSION',
        color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        icon: <Brain className="w-3.5 h-3.5" />,
      };
    }
    if (snapshot.phase === 'LONG_BREAK') {
      return {
        text: isAwaiting ? 'LONG BREAK COMPLETE' : 'LONG BREAK',
        color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        icon: <Coffee className="w-3.5 h-3.5" />,
      };
    }
    if (snapshot.phase === 'SHORT_BREAK') {
      return {
        text: isAwaiting ? 'BREAK COMPLETE' : 'SHORT BREAK',
        color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
        icon: <Coffee className="w-3.5 h-3.5" />,
      };
    }
    return {
      text: 'READY',
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      icon: <Brain className="w-3.5 h-3.5" />,
    };
  };

  const badge = getPhaseBadge();
  const todayMinutes = Math.round(snapshot.todayFocusTimeSec / 60);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between max-w-4xl mx-auto p-4 sm:p-6 select-none transition-colors duration-200">
      {/* Top Header Bar */}
      <header className="pt-2 pb-4 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to Workouts"
              className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              title="Back to workouts"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-lg shadow-lg shadow-emerald-950/20">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                Pomodoro Focus
              </h1>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold">
                Calm • Distraction-free interval focus
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleMinimize}
            aria-label="Minimize timer"
            className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
            title="Minimize to floating timer (M)"
          >
            <Minimize2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Pomodoro settings"
            className="p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
            title="Configure intervals"
          >
            <Sliders className="w-4 h-4" />
          </button>

          <ThemeToggle />
        </div>
      </header>

      {/* Main Focus Area */}
      <main className="flex-1 flex flex-col items-center justify-center py-6 sm:py-10 space-y-8 max-w-lg mx-auto w-full">
        {/* Focus Label Pill / Input */}
        <div className="w-full text-center">
          {isEditingLabel ? (
            <form onSubmit={handleLabelSubmit} className="inline-flex items-center gap-2">
              <input
                type="text"
                autoFocus
                value={labelText}
                onChange={(e) => setLabelText(e.target.value)}
                onBlur={() => {
                  setLabel(labelText.trim());
                  setIsEditingLabel(false);
                }}
                placeholder="What are you working on?"
                maxLength={40}
                className="px-4 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-emerald-500 text-xs font-bold text-zinc-900 dark:text-white text-center focus:outline-none w-64 shadow-sm"
              />
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingLabel(true)}
              aria-label="Set what you are working on"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>{snapshot.label || 'What are you working on?'}</span>
            </button>
          )}
        </div>

        {/* Circular Progress Ring & Timer */}
        <div className="relative flex flex-col items-center justify-center my-2">
          <ProgressRing
            progress={snapshot.progress}
            phase={snapshot.phase}
            status={snapshot.status}
            size={300}
            strokeWidth={10}
          >
            {/* Phase Badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border mb-2 ${badge.color}`}>
              {badge.icon}
              <span>{badge.text}</span>
            </div>

            {/* Numeric Digital Clock Display */}
            <div
              aria-label={`Time remaining: ${timeFormatted}`}
              className="font-mono text-5xl sm:text-6xl font-black tracking-tight text-zinc-900 dark:text-white my-1 tabular-nums"
            >
              {timeFormatted}
            </div>

            {/* Session Indicator */}
            <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">
              Session {snapshot.currentSession} of {snapshot.sessionsBeforeLongBreak}
            </div>
          </ProgressRing>
        </div>

        {/* Presets Row when IDLE */}
        {isIdle && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => applyPreset('CLASSIC')}
              className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              Classic (25/5)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('DEEP_FOCUS')}
              className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              Deep Focus (50/10)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('SPRINT')}
              className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              Sprint (15/3)
            </button>
          </div>
        )}

        {/* Primary Controls */}
        <div className="flex items-center justify-center gap-4 w-full pt-2">
          {isIdle ? (
            <button
              type="button"
              onClick={() => startFocus()}
              aria-label="Start Focus"
              className="w-full sm:w-64 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-zinc-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-emerald-950/30 cursor-pointer active:scale-98"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Start Focus</span>
            </button>
          ) : isAwaiting ? (
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => start()}
                aria-label={`Start ${snapshot.phase === 'FOCUS' ? 'Focus' : 'Break'}`}
                className="w-full sm:w-64 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-zinc-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-emerald-950/30 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>
                  {snapshot.phase === 'FOCUS'
                    ? 'Start Focus'
                    : snapshot.phase === 'LONG_BREAK'
                    ? `Start ${Math.round(snapshot.config.longBreakDurationSec / 60)} Min Break`
                    : `Start ${Math.round(snapshot.config.shortBreakDurationSec / 60)} Min Break`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleResetClick()}
                aria-label="Reset Timer"
                className="p-3.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Reset session (R)"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {isRunning ? (
                <button
                  type="button"
                  onClick={() => pause()}
                  aria-label="Pause Focus"
                  className="px-8 py-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-black text-sm uppercase tracking-wider flex items-center gap-2.5 transition-all shadow-lg cursor-pointer active:scale-98"
                >
                  <Pause className="w-5 h-5 fill-current" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => resume()}
                  aria-label="Resume Focus"
                  className="px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-zinc-950 font-black text-sm uppercase tracking-wider flex items-center gap-2.5 transition-all shadow-xl shadow-emerald-950/30 cursor-pointer active:scale-98"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Resume</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => skip()}
                aria-label="Skip phase"
                className="p-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer"
                title="Skip to next phase (S)"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => handleResetClick()}
                aria-label="Reset Timer"
                className="p-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer"
                title="Reset session (R)"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer Stats: Today's Focus */}
      <footer className="pt-4 border-t border-zinc-200 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>
            Today's Focus: <strong className="text-zinc-900 dark:text-white">{snapshot.todayCompletedSessions}</strong> {snapshot.todayCompletedSessions === 1 ? 'session' : 'sessions'}
            {todayMinutes > 0 && <span> ({todayMinutes} min)</span>}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-zinc-400">
          <span>Space: Pause/Play</span>
          <span>•</span>
          <span>S: Skip</span>
          <span>•</span>
          <span>R: Reset</span>
          <span>•</span>
          <span>M: Minimize</span>
        </div>
      </footer>

      {/* Settings Modal */}
      <FocusSettingsModal
        isOpen={isSettingsOpen}
        config={snapshot.config}
        onSave={(cfg) => updateConfig(cfg)}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Reset Confirmation Dialog */}
      <ResetConfirmDialog
        isOpen={isResetConfirmOpen}
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
}
