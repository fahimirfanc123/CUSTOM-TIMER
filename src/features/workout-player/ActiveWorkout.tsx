import { useState, useEffect } from 'react';
import { EngineSnapshot } from '../../core/engine/types';
import { AudioSettings } from '../../core/audio/types';
import { Workout } from '../../core/models/workout';
import { PhaseType } from '../../core/models/phase';
import { formatDigitalTime } from '../../shared/utils/timeFormat';
import { useWakeLock } from '../../shared/hooks/useWakeLock';
import { useKeyboardShortcuts } from '../../shared/hooks/useKeyboardShortcuts';
import { ProgressDisplay } from './ProgressDisplay';
import { WorkoutControls } from './WorkoutControls';
import { EndWorkoutDialog } from './EndWorkoutDialog';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Pause as PauseIcon,
  Flame,
  ArrowRight,
} from 'lucide-react';

export interface ActiveWorkoutProps {
  workout: Workout | null;
  snapshot: EngineSnapshot;
  audioSettings: AudioSettings;
  onPause: () => void;
  onResume: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onRestartSegment: () => void;
  onAddTime: (seconds: number) => void;
  onEndWorkout: () => void;
  onToggleVoice: () => void;
  onToggleSound: () => void;
  onVisibilityReconcile?: () => void;
}

export function ActiveWorkout({
  workout,
  snapshot,
  audioSettings,
  onPause,
  onResume,
  onPrevious,
  onNext,
  onRestartSegment,
  onAddTime,
  onEndWorkout,
  onToggleVoice,
  onToggleSound,
  onVisibilityReconcile,
}: ActiveWorkoutProps) {
  const [showEndDialog, setShowEndDialog] = useState(false);

  // Screen Wake Lock while workout is active
  const isSessionActive = snapshot.status === 'RUNNING' || snapshot.status === 'PAUSED';
  useWakeLock(isSessionActive);

  // Visibility reconcile handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isSessionActive) {
        onVisibilityReconcile?.();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSessionActive, onVisibilityReconcile]);

  // Keyboard shortcuts
  useKeyboardShortcuts(isSessionActive, {
    onPauseResume: () => {
      if (snapshot.status === 'PAUSED') {
        onResume();
      } else if (snapshot.status === 'RUNNING') {
        onPause();
      }
    },
    onNext,
    onPrevious,
    onAddTime,
  });

  const segment = snapshot.currentSegment;
  const context = segment?.context;
  const phase: PhaseType = segment?.phase ?? 'WORK';
  const isPaused = snapshot.status === 'PAUSED';
  const isRestPhase =
    phase === 'REST_SET' || phase === 'REST_EXERCISE' || phase === 'REST_ROUND';

  const getPhaseDisplay = () => {
    switch (phase) {
      case 'PREPARE':
        return {
          title: 'GET READY',
          subtitle: 'Prepare for first set',
          badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          timerClass: 'text-amber-400',
        };
      case 'WORK':
        return {
          title: 'WORK',
          subtitle: context?.exerciseName ?? 'Work',
          badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          timerClass: 'text-emerald-400',
        };
      case 'REST_SET':
        return {
          title: 'REST',
          subtitle: 'Between Sets',
          badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
          timerClass: 'text-sky-400',
        };
      case 'REST_EXERCISE':
        return {
          title: 'REST',
          subtitle: 'Next Exercise',
          badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
          timerClass: 'text-sky-400',
        };
      case 'REST_ROUND':
        return {
          title: 'REST',
          subtitle: 'Between Rounds',
          badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
          timerClass: 'text-sky-400',
        };
      default:
        return {
          title: 'WORK',
          subtitle: 'Active',
          badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          timerClass: 'text-emerald-400',
        };
    }
  };

  const phaseConfig = getPhaseDisplay();

  const getNextActionText = () => {
    if (context?.isLastSegmentOfWorkout) {
      return 'Workout Complete';
    }
    if (phase === 'PREPARE') {
      return `${context?.exerciseName ?? 'First Exercise'} — Set 1 of ${context?.totalSets ?? 1}`;
    }
    if (phase === 'WORK') {
      if (context?.nextTarget) {
        if (context.isLastSetOfExercise) {
          return `Rest, then ${context.nextTarget.exerciseName}`;
        }
        return `Rest, then Set ${context.nextTarget.setNumber} of ${context.nextTarget.totalSets}`;
      }
      return 'Rest';
    }
    if (isRestPhase && context?.nextTarget) {
      return `${context.nextTarget.exerciseName} — Set ${context.nextTarget.setNumber} / ${context.nextTarget.totalSets}`;
    }
    return 'Next segment';
  };

  return (
    <div
      role="region"
      aria-label="Active workout"
      className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between max-w-xl mx-auto p-4 sm:p-6 select-none"
    >
      {/* Top Header Bar */}
      <header className="flex items-center justify-between gap-2 pb-2">
        <button
          type="button"
          onClick={() => setShowEndDialog(true)}
          aria-label="Exit workout"
          className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span className="hidden xs:inline">End</span>
        </button>

        <div className="text-center px-2">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest truncate max-w-[180px] sm:max-w-[240px]">
            {workout?.title ?? 'CTR Timer'}
          </div>
        </div>

        {/* Audio Quick Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleVoice}
            aria-label={audioSettings.voiceEnabled ? 'Disable voice coach' : 'Enable voice coach'}
            title={audioSettings.voiceEnabled ? 'Voice Coach: ON' : 'Voice Coach: OFF'}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
              audioSettings.voiceEnabled
                ? 'bg-zinc-900 border-zinc-700 text-emerald-400 hover:bg-zinc-800'
                : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-600 hover:text-zinc-400'
            }`}
          >
            {audioSettings.voiceEnabled ? (
              <Mic className="w-4 h-4" />
            ) : (
              <MicOff className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={onToggleSound}
            aria-label={audioSettings.soundEnabled ? 'Disable sound effects' : 'Enable sound effects'}
            title={audioSettings.soundEnabled ? 'Sound Effects: ON' : 'Sound Effects: OFF'}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
              audioSettings.soundEnabled
                ? 'bg-zinc-900 border-zinc-700 text-emerald-400 hover:bg-zinc-800'
                : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-600 hover:text-zinc-400'
            }`}
          >
            {audioSettings.soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* Main Workout Display */}
      <main className="flex-1 flex flex-col justify-center items-center text-center my-2 space-y-4">
        {/* Status / Phase Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {isPaused ? (
            <div className="px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs sm:text-sm font-black tracking-widest uppercase flex items-center gap-2 animate-pulse">
              <PauseIcon className="w-4 h-4 fill-current" />
              PAUSED
            </div>
          ) : (
            <div
              className={`px-4 py-1.5 rounded-full border text-xs sm:text-sm font-black tracking-widest uppercase flex items-center gap-2 ${phaseConfig.badgeClass}`}
            >
              {phase === 'WORK' && <Flame className="w-4 h-4 fill-current text-emerald-400" />}
              {phaseConfig.title}
              {phaseConfig.subtitle && phaseConfig.title !== phaseConfig.subtitle && (
                <span className="text-[10px] font-bold text-zinc-400 opacity-90">
                  • {phaseConfig.subtitle}
                </span>
              )}
            </div>
          )}
        </div>

        {/* REST PHASE DEDICATED VIEW (Section 7) */}
        {isRestPhase ? (
          <div className="w-full space-y-4 animate-in fade-in duration-200">
            {/* Giant Countdown */}
            <div
              className="text-7xl sm:text-9xl font-black font-mono tracking-tight text-sky-400 tabular-nums my-1"
              aria-live="polite"
              aria-label={`Time remaining: ${formatDigitalTime(snapshot.remainingTimeSec)}`}
            >
              {formatDigitalTime(snapshot.remainingTimeSec)}
            </div>

            {/* Next Exercise Prominent Box */}
            <div className="bg-zinc-900/80 border border-sky-500/30 rounded-2xl p-4 sm:p-5 shadow-xl shadow-sky-950/20 max-w-md mx-auto space-y-1.5">
              <div className="text-[11px] font-black uppercase tracking-widest text-sky-400 flex items-center justify-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5" />
                NEXT
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase">
                {context?.nextTarget?.exerciseName ?? context?.exerciseName ?? 'Next Exercise'}
              </div>
              <div className="text-xs sm:text-sm font-bold text-zinc-400">
                SET {context?.nextTarget?.setNumber ?? 1} / {context?.nextTarget?.totalSets ?? 1}
              </div>
            </div>
          </div>
        ) : (
          /* WORK & PREPARE PHASE VIEW */
          <div className="w-full space-y-3">
            {/* Current Exercise Title */}
            <div className="space-y-1 px-2">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase line-clamp-2">
                {context?.exerciseName ?? 'Exercise'}
              </h2>
            </div>

            {/* Giant Timer Countdown */}
            <div
              className={`text-7xl sm:text-9xl font-black font-mono tracking-tight tabular-nums my-2 ${
                isPaused ? 'text-zinc-400 opacity-80' : phaseConfig.timerClass
              }`}
              aria-live="polite"
              aria-label={`Time remaining: ${formatDigitalTime(snapshot.remainingTimeSec)}`}
            >
              {formatDigitalTime(snapshot.remainingTimeSec)}
            </div>

            {/* Next Action Banner */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs sm:text-sm font-medium text-zinc-400">
              <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
                Next:
              </span>
              <span className="text-zinc-300 font-semibold">{getNextActionText()}</span>
            </div>
          </div>
        )}

        {/* Progress Display */}
        <div className="w-full pt-2">
          <ProgressDisplay snapshot={snapshot} />
        </div>
      </main>

      {/* Controls Footer */}
      <footer className="pt-2 pb-1">
        <WorkoutControls
          status={snapshot.status}
          onPause={onPause}
          onResume={onResume}
          onPrevious={onPrevious}
          onNext={onNext}
          onRestartSegment={onRestartSegment}
          onAddTime={onAddTime}
          onRequestEnd={() => setShowEndDialog(true)}
        />
      </footer>

      {/* End Workout Confirmation Dialog */}
      <EndWorkoutDialog
        isOpen={showEndDialog}
        onCancel={() => setShowEndDialog(false)}
        onConfirmEnd={() => {
          setShowEndDialog(false);
          onEndWorkout();
        }}
      />
    </div>
  );
}
