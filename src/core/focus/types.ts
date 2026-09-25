export type FocusPhase =
  | 'IDLE'
  | 'FOCUS'
  | 'SHORT_BREAK'
  | 'LONG_BREAK'
  | 'PAUSED'
  | 'COMPLETED';

export type FocusStatus =
  | 'IDLE'
  | 'RUNNING'
  | 'PAUSED'
  | 'AWAITING_NEXT_PHASE'
  | 'COMPLETED';

export type FocusPreset = 'CLASSIC' | 'DEEP_FOCUS' | 'SPRINT' | 'CUSTOM';

export interface FocusConfig {
  focusDurationSec: number;
  shortBreakDurationSec: number;
  longBreakDurationSec: number;
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundEnabled: boolean;
  voiceEnabled: boolean;
}

export const defaultFocusConfig: FocusConfig = {
  focusDurationSec: 25 * 60,       // 25 min
  shortBreakDurationSec: 5 * 60,    // 5 min
  longBreakDurationSec: 15 * 60,    // 15 min
  sessionsBeforeLongBreak: 4,       // 4 focus sessions before long break
  autoStartBreaks: false,
  autoStartFocus: false,
  soundEnabled: true,
  voiceEnabled: false,
};

export const focusPresets: Record<Exclude<FocusPreset, 'CUSTOM'>, Omit<FocusConfig, 'soundEnabled' | 'voiceEnabled' | 'autoStartBreaks' | 'autoStartFocus'>> = {
  CLASSIC: {
    focusDurationSec: 25 * 60,
    shortBreakDurationSec: 5 * 60,
    longBreakDurationSec: 15 * 60,
    sessionsBeforeLongBreak: 4,
  },
  DEEP_FOCUS: {
    focusDurationSec: 50 * 60,
    shortBreakDurationSec: 10 * 60,
    longBreakDurationSec: 20 * 60,
    sessionsBeforeLongBreak: 4,
  },
  SPRINT: {
    focusDurationSec: 15 * 60,
    shortBreakDurationSec: 3 * 60,
    longBreakDurationSec: 10 * 60,
    sessionsBeforeLongBreak: 4,
  },
};

export interface FocusSnapshot {
  phase: FocusPhase;
  status: FocusStatus;
  currentSession: number;
  sessionsBeforeLongBreak: number;
  totalDurationSec: number;
  remainingSec: number;
  remainingMs: number;
  progress: number; // 0.0 to 1.0 (elapsed ratio)
  label: string;
  config: FocusConfig;
  isMinimized: boolean;
  todayCompletedSessions: number;
  todayFocusTimeSec: number;
  lastCompletedPhase?: FocusPhase;
  awaitingNextPhase?: FocusPhase;
}

export type FocusEventType =
  | 'TICK'
  | 'PHASE_START'
  | 'PHASE_COMPLETE'
  | 'PAUSE'
  | 'RESUME'
  | 'RESET'
  | 'SKIP'
  | 'CONFIG_CHANGE'
  | 'LABEL_CHANGE'
  | 'MINIMIZE'
  | 'EXPAND'
  | 'AWAITING_NEXT_PHASE';

export interface FocusEvent {
  type: FocusEventType;
  phase: FocusPhase;
  snapshot: FocusSnapshot;
  timestamp: number;
}

export type FocusSoundCue =
  | 'FOCUS_START'
  | 'FOCUS_COMPLETE'
  | 'BREAK_START'
  | 'BREAK_COMPLETE';

export interface PersistedFocusState {
  version: number;
  phase: FocusPhase;
  status: FocusStatus;
  currentSession: number;
  config: FocusConfig;
  label: string;
  isMinimized: boolean;
  deadline: number | null;
  remainingWhenPausedMs: number | null;
  totalDurationSec: number;
  startTimestamp: number | null;
  lastCompletedPhase?: FocusPhase;
  awaitingNextPhase?: FocusPhase;
}

export interface PersistedDailyStats {
  date: string; // YYYY-MM-DD
  completedSessions: number;
  focusTimeSec: number;
}
