import { Clock, Scheduler, defaultClock, DefaultScheduler } from '../engine/clock';
import {
  FocusConfig,
  FocusEvent,
  FocusPhase,
  FocusPreset,
  FocusSnapshot,
  FocusStatus,
  PersistedDailyStats,
  PersistedFocusState,
  defaultFocusConfig,
  focusPresets,
} from './types';
import { FocusAudioCoordinator, IFocusSoundEngine, IFocusSpeechEngine } from './focusAudio';

export const FOCUS_STATE_STORAGE_KEY = 'ctr_focus_state';
export const FOCUS_CONFIG_STORAGE_KEY = 'ctr_focus_config';
export const FOCUS_DAILY_STORAGE_KEY = 'ctr_focus_daily';

export interface FocusTimerControllerOptions {
  clock?: Clock;
  scheduler?: Scheduler;
  soundEngine?: IFocusSoundEngine;
  speechEngine?: IFocusSpeechEngine;
  initialConfig?: Partial<FocusConfig>;
  storage?: Storage;
  autoRestore?: boolean;
}

export class FocusTimerController {
  private clock: Clock;
  private scheduler: Scheduler;
  private audioCoordinator: FocusAudioCoordinator;
  private storage: Storage | null = null;

  private phase: FocusPhase = 'IDLE';
  private status: FocusStatus = 'IDLE';
  private currentSession = 1;
  private totalDurationSec: number;
  private remainingSec: number;
  private remainingMs: number;
  private deadline: number | null = null;
  private remainingWhenPausedMs: number | null = null;
  private startTimestamp: number | null = null;
  private label = '';
  private isMinimized = false;
  private config: FocusConfig;
  private todayCompletedSessions = 0;
  private todayFocusTimeSec = 0;
  private lastCompletedPhase?: FocusPhase;
  private awaitingNextPhase?: FocusPhase;

  private listeners = new Set<(event: FocusEvent) => void>();

  constructor(options?: FocusTimerControllerOptions) {
    this.clock = options?.clock ?? defaultClock;
    this.scheduler = options?.scheduler ?? new DefaultScheduler();
    this.storage = options?.storage ?? (typeof window !== 'undefined' ? window.localStorage : null);

    // 1. Initialize Config (from storage or options or default)
    this.config = {
      ...defaultFocusConfig,
      ...this.loadPersistedConfig(),
      ...options?.initialConfig,
    };

    // 2. Initialize Audio Coordinator
    this.audioCoordinator = new FocusAudioCoordinator({
      soundEngine: options?.soundEngine,
      speechEngine: options?.speechEngine,
      soundEnabled: this.config.soundEnabled,
      voiceEnabled: this.config.voiceEnabled,
    });

    this.totalDurationSec = this.config.focusDurationSec;
    this.remainingSec = this.config.focusDurationSec;
    this.remainingMs = this.config.focusDurationSec * 1000;

    // 3. Load daily stats
    this.loadDailyStats();

    // 4. Auto restore if enabled (default true when storage is present)
    if (options?.autoRestore !== false) {
      this.restorePersistedState();
    }
  }

  // --- Public Getters ---

  public getSnapshot(): FocusSnapshot {
    const elapsedRatio =
      this.totalDurationSec > 0
        ? Math.min(1.0, Math.max(0.0, (this.totalDurationSec - this.remainingSec) / this.totalDurationSec))
        : 0.0;

    return {
      phase: this.phase,
      status: this.status,
      currentSession: this.currentSession,
      sessionsBeforeLongBreak: this.config.sessionsBeforeLongBreak,
      totalDurationSec: this.totalDurationSec,
      remainingSec: this.remainingSec,
      remainingMs: this.remainingMs,
      progress: elapsedRatio,
      label: this.label,
      config: { ...this.config },
      isMinimized: this.isMinimized,
      todayCompletedSessions: this.todayCompletedSessions,
      todayFocusTimeSec: this.todayFocusTimeSec,
      lastCompletedPhase: this.lastCompletedPhase,
      awaitingNextPhase: this.awaitingNextPhase,
    };
  }

  public getAudioCoordinator(): FocusAudioCoordinator {
    return this.audioCoordinator;
  }

  // --- Subscription ---

  public subscribe(listener: (event: FocusEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(type: FocusEvent['type']): void {
    const snapshot = this.getSnapshot();
    const event: FocusEvent = {
      type,
      phase: this.phase,
      snapshot,
      timestamp: this.clock.now(),
    };
    for (const listener of this.listeners) {
      listener(event);
    }
    this.persistState();
  }

  // --- Daily Stats Helper ---

  private getTodayDateKey(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private loadDailyStats(): void {
    if (!this.storage) return;
    try {
      const raw = this.storage.getItem(FOCUS_DAILY_STORAGE_KEY);
      if (raw) {
        const parsed: PersistedDailyStats = JSON.parse(raw);
        if (parsed.date === this.getTodayDateKey()) {
          this.todayCompletedSessions = parsed.completedSessions || 0;
          this.todayFocusTimeSec = parsed.focusTimeSec || 0;
          return;
        }
      }
    } catch {
      // Ignore
    }
    // Default to 0 for today
    this.todayCompletedSessions = 0;
    this.todayFocusTimeSec = 0;
  }

  private saveDailyStats(): void {
    if (!this.storage) return;
    try {
      const data: PersistedDailyStats = {
        date: this.getTodayDateKey(),
        completedSessions: this.todayCompletedSessions,
        focusTimeSec: this.todayFocusTimeSec,
      };
      this.storage.setItem(FOCUS_DAILY_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore
    }
  }

  // --- Actions ---

  public start(): void {
    if (this.status === 'PAUSED') {
      this.resume();
      return;
    }

    if (this.status === 'AWAITING_NEXT_PHASE' && this.awaitingNextPhase) {
      if (this.awaitingNextPhase === 'FOCUS') {
        this.startFocus();
      } else {
        this.startBreak(this.awaitingNextPhase === 'LONG_BREAK');
      }
      return;
    }

    if (this.phase === 'IDLE' || this.phase === 'COMPLETED') {
      this.startFocus();
    }
  }

  public async startFocus(): Promise<void> {
    await this.audioCoordinator.unlock();

    this.phase = 'FOCUS';
    this.status = 'RUNNING';
    this.awaitingNextPhase = undefined;
    this.totalDurationSec = this.config.focusDurationSec;
    this.remainingSec = this.config.focusDurationSec;
    this.remainingMs = this.config.focusDurationSec * 1000;
    this.remainingWhenPausedMs = null;

    const now = this.clock.now();
    this.startTimestamp = now;
    this.deadline = now + this.remainingMs;

    this.startScheduler();
    this.audioCoordinator.handleFocusStart();
    this.emit('PHASE_START');
  }

  public async startBreak(forceLongBreak?: boolean): Promise<void> {
    await this.audioCoordinator.unlock();

    const isLong = forceLongBreak ?? (this.currentSession >= this.config.sessionsBeforeLongBreak);
    this.phase = isLong ? 'LONG_BREAK' : 'SHORT_BREAK';
    this.status = 'RUNNING';
    this.awaitingNextPhase = undefined;

    const duration = isLong ? this.config.longBreakDurationSec : this.config.shortBreakDurationSec;
    this.totalDurationSec = duration;
    this.remainingSec = duration;
    this.remainingMs = duration * 1000;
    this.remainingWhenPausedMs = null;

    const now = this.clock.now();
    this.startTimestamp = now;
    this.deadline = now + this.remainingMs;

    this.startScheduler();
    this.audioCoordinator.handleBreakStart();
    this.emit('PHASE_START');
  }

  public pause(): void {
    if (this.status !== 'RUNNING') return;

    this.scheduler.stop();
    const now = this.clock.now();

    if (this.deadline !== null) {
      this.remainingWhenPausedMs = Math.max(0, this.deadline - now);
      this.remainingMs = this.remainingWhenPausedMs;
      this.remainingSec = Math.max(0, Math.ceil(this.remainingMs / 1000));
    }

    this.status = 'PAUSED';
    this.emit('PAUSE');
  }

  public resume(): void {
    if (this.status !== 'PAUSED') return;

    const now = this.clock.now();
    const durationMs = this.remainingWhenPausedMs ?? (this.remainingSec * 1000);
    this.deadline = now + durationMs;
    this.remainingWhenPausedMs = null;
    this.status = 'RUNNING';

    this.startScheduler();
    this.emit('RESUME');
  }

  public reset(): void {
    this.scheduler.stop();
    this.phase = 'IDLE';
    this.status = 'IDLE';
    this.currentSession = 1;
    this.totalDurationSec = this.config.focusDurationSec;
    this.remainingSec = this.config.focusDurationSec;
    this.remainingMs = this.config.focusDurationSec * 1000;
    this.deadline = null;
    this.remainingWhenPausedMs = null;
    this.startTimestamp = null;
    this.lastCompletedPhase = undefined;
    this.awaitingNextPhase = undefined;

    this.clearPersistedState();
    this.emit('RESET');
  }

  public skip(): void {
    this.scheduler.stop();
    this.remainingWhenPausedMs = null;
    this.deadline = null;

    if (this.phase === 'FOCUS' || (this.phase === 'IDLE' && this.status === 'IDLE')) {
      // Skip focus: do NOT increment today's count!
      const isLong = this.currentSession >= this.config.sessionsBeforeLongBreak;
      const nextPhase: FocusPhase = isLong ? 'LONG_BREAK' : 'SHORT_BREAK';
      const duration = isLong ? this.config.longBreakDurationSec : this.config.shortBreakDurationSec;

      this.totalDurationSec = duration;
      this.remainingSec = duration;
      this.remainingMs = duration * 1000;

      if (this.config.autoStartBreaks) {
        this.phase = nextPhase;
        this.status = 'RUNNING';
        this.awaitingNextPhase = undefined;
        const now = this.clock.now();
        this.startTimestamp = now;
        this.deadline = now + this.remainingMs;
        this.startScheduler();
        this.audioCoordinator.handleBreakStart();
        this.emit('SKIP');
      } else {
        this.phase = nextPhase;
        this.status = 'AWAITING_NEXT_PHASE';
        this.awaitingNextPhase = nextPhase;
        this.emit('SKIP');
      }
    } else if (this.phase === 'SHORT_BREAK' || this.phase === 'LONG_BREAK') {
      // Skip break: transition to next focus
      if (this.phase === 'LONG_BREAK') {
        this.currentSession = 1;
      } else {
        this.currentSession = this.currentSession + 1;
      }

      this.totalDurationSec = this.config.focusDurationSec;
      this.remainingSec = this.config.focusDurationSec;
      this.remainingMs = this.config.focusDurationSec * 1000;

      if (this.config.autoStartFocus) {
        this.phase = 'FOCUS';
        this.status = 'RUNNING';
        this.awaitingNextPhase = undefined;
        const now = this.clock.now();
        this.startTimestamp = now;
        this.deadline = now + this.remainingMs;
        this.startScheduler();
        this.audioCoordinator.handleFocusStart();
        this.emit('SKIP');
      } else {
        this.phase = 'FOCUS';
        this.status = 'AWAITING_NEXT_PHASE';
        this.awaitingNextPhase = 'FOCUS';
        this.emit('SKIP');
      }
    } else {
      this.reset();
    }
  }

  public minimize(): void {
    this.isMinimized = true;
    this.emit('MINIMIZE');
  }

  public expand(): void {
    this.isMinimized = false;
    this.emit('EXPAND');
  }

  public setLabel(label: string): void {
    this.label = label;
    this.emit('LABEL_CHANGE');
  }

  public updateConfig(newConfig: Partial<FocusConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.audioCoordinator.updateConfig(this.config.soundEnabled, this.config.voiceEnabled);

    // If IDLE, update duration representations
    if (this.phase === 'IDLE' && this.status === 'IDLE') {
      this.totalDurationSec = this.config.focusDurationSec;
      this.remainingSec = this.config.focusDurationSec;
      this.remainingMs = this.config.focusDurationSec * 1000;
    }

    this.persistConfig();
    this.emit('CONFIG_CHANGE');
  }

  public applyPreset(preset: FocusPreset): void {
    if (preset === 'CUSTOM') return;
    const values = focusPresets[preset];
    if (values) {
      this.updateConfig(values);
    }
  }

  // --- Clock & Scheduler Execution ---

  private startScheduler(): void {
    this.scheduler.stop();
    this.scheduler.start(() => {
      this.tick();
    }, 100);
  }

  public tick(): void {
    if (this.status !== 'RUNNING' || this.deadline === null) {
      return;
    }

    const now = this.clock.now();
    const remainingMs = Math.max(0, this.deadline - now);
    const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));

    this.remainingMs = remainingMs;
    this.remainingSec = remainingSec;

    if (remainingMs <= 0) {
      this.handlePhaseComplete();
      return;
    }

    this.emit('TICK');
  }

  private handlePhaseComplete(): void {
    this.scheduler.stop();
    this.deadline = null;
    this.remainingWhenPausedMs = null;

    if (this.phase === 'FOCUS') {
      // 1. Record completed focus
      this.todayCompletedSessions += 1;
      this.todayFocusTimeSec += this.config.focusDurationSec;
      this.saveDailyStats();

      const isLongBreak = this.currentSession >= this.config.sessionsBeforeLongBreak;
      const nextPhase: FocusPhase = isLongBreak ? 'LONG_BREAK' : 'SHORT_BREAK';
      const breakDuration = isLongBreak ? this.config.longBreakDurationSec : this.config.shortBreakDurationSec;
      const breakMin = Math.round(breakDuration / 60);

      this.lastCompletedPhase = 'FOCUS';
      this.audioCoordinator.handleFocusComplete(breakMin, isLongBreak);

      this.totalDurationSec = breakDuration;
      this.remainingSec = breakDuration;
      this.remainingMs = breakDuration * 1000;

      if (this.config.autoStartBreaks) {
        this.phase = nextPhase;
        this.status = 'RUNNING';
        this.awaitingNextPhase = undefined;
        const now = this.clock.now();
        this.startTimestamp = now;
        this.deadline = now + this.remainingMs;
        this.startScheduler();
        this.audioCoordinator.handleBreakStart();
        this.emit('PHASE_COMPLETE');
      } else {
        this.phase = nextPhase;
        this.status = 'AWAITING_NEXT_PHASE';
        this.awaitingNextPhase = nextPhase;
        this.emit('PHASE_COMPLETE');
      }
    } else if (this.phase === 'SHORT_BREAK' || this.phase === 'LONG_BREAK') {
      const wasLongBreak = this.phase === 'LONG_BREAK';

      if (wasLongBreak) {
        this.currentSession = 1;
      } else {
        this.currentSession = this.currentSession + 1;
      }

      this.lastCompletedPhase = this.phase;
      this.audioCoordinator.handleBreakComplete();

      this.totalDurationSec = this.config.focusDurationSec;
      this.remainingSec = this.config.focusDurationSec;
      this.remainingMs = this.config.focusDurationSec * 1000;

      if (this.config.autoStartFocus) {
        this.phase = 'FOCUS';
        this.status = 'RUNNING';
        this.awaitingNextPhase = undefined;
        const now = this.clock.now();
        this.startTimestamp = now;
        this.deadline = now + this.remainingMs;
        this.startScheduler();
        this.audioCoordinator.handleFocusStart();
        this.emit('PHASE_COMPLETE');
      } else {
        this.phase = 'FOCUS';
        this.status = 'AWAITING_NEXT_PHASE';
        this.awaitingNextPhase = 'FOCUS';
        this.emit('PHASE_COMPLETE');
      }
    }
  }

  // --- Persistence & Reload Recovery ---

  private persistState(): void {
    if (!this.storage) return;
    try {
      const state: PersistedFocusState = {
        version: 1,
        phase: this.phase,
        status: this.status,
        currentSession: this.currentSession,
        config: this.config,
        label: this.label,
        isMinimized: this.isMinimized,
        deadline: this.deadline,
        remainingWhenPausedMs: this.remainingWhenPausedMs,
        totalDurationSec: this.totalDurationSec,
        startTimestamp: this.startTimestamp,
        lastCompletedPhase: this.lastCompletedPhase,
        awaitingNextPhase: this.awaitingNextPhase,
      };
      this.storage.setItem(FOCUS_STATE_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore
    }
  }

  private clearPersistedState(): void {
    if (!this.storage) return;
    try {
      this.storage.removeItem(FOCUS_STATE_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }

  private persistConfig(): void {
    if (!this.storage) return;
    try {
      this.storage.setItem(FOCUS_CONFIG_STORAGE_KEY, JSON.stringify(this.config));
    } catch {
      // Ignore
    }
  }

  private loadPersistedConfig(): Partial<FocusConfig> {
    if (!this.storage) return {};
    try {
      const raw = this.storage.getItem(FOCUS_CONFIG_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // Ignore
    }
    return {};
  }

  public restorePersistedState(): boolean {
    if (!this.storage) return false;
    try {
      const raw = this.storage.getItem(FOCUS_STATE_STORAGE_KEY);
      if (!raw) return false;

      const state: PersistedFocusState = JSON.parse(raw);
      if (!state || typeof state !== 'object' || state.version !== 1) {
        return false;
      }

      this.currentSession = state.currentSession || 1;
      this.label = state.label || '';
      this.isMinimized = !!state.isMinimized;
      this.totalDurationSec = state.totalDurationSec || this.config.focusDurationSec;
      this.lastCompletedPhase = state.lastCompletedPhase;
      this.awaitingNextPhase = state.awaitingNextPhase;

      const now = this.clock.now();

      if (state.status === 'PAUSED' && state.remainingWhenPausedMs !== null) {
        this.phase = state.phase;
        this.status = 'PAUSED';
        this.remainingWhenPausedMs = state.remainingWhenPausedMs;
        this.remainingMs = state.remainingWhenPausedMs;
        this.remainingSec = Math.max(0, Math.ceil(this.remainingMs / 1000));
        this.deadline = null;
        return true;
      }

      if (state.status === 'AWAITING_NEXT_PHASE') {
        this.phase = state.phase;
        this.status = 'AWAITING_NEXT_PHASE';
        this.remainingSec = this.totalDurationSec;
        this.remainingMs = this.totalDurationSec * 1000;
        this.deadline = null;
        return true;
      }

      if (state.status === 'RUNNING' && state.deadline !== null) {
        if (state.deadline > now) {
          // Timer was running and deadline has not passed yet: restore accurately
          this.phase = state.phase;
          this.status = 'RUNNING';
          this.deadline = state.deadline;
          this.startTimestamp = state.startTimestamp;
          this.remainingMs = Math.max(0, state.deadline - now);
          this.remainingSec = Math.max(0, Math.ceil(this.remainingMs / 1000));
          this.startScheduler();
          return true;
        } else {
          // Conservative Recovery: Deadline passed while app was closed.
          // Mark phase as completed and transition to awaiting next phase (do not fabricate multiple hours of cycles).
          if (state.phase === 'FOCUS') {
            this.todayCompletedSessions += 1;
            this.todayFocusTimeSec += this.totalDurationSec;
            this.saveDailyStats();

            const isLong = this.currentSession >= this.config.sessionsBeforeLongBreak;
            const nextPhase: FocusPhase = isLong ? 'LONG_BREAK' : 'SHORT_BREAK';
            const breakDur = isLong ? this.config.longBreakDurationSec : this.config.shortBreakDurationSec;

            this.phase = nextPhase;
            this.status = 'AWAITING_NEXT_PHASE';
            this.awaitingNextPhase = nextPhase;
            this.totalDurationSec = breakDur;
            this.remainingSec = breakDur;
            this.remainingMs = breakDur * 1000;
            this.deadline = null;
            return true;
          } else {
            // Break completed while away
            if (state.phase === 'LONG_BREAK') {
              this.currentSession = 1;
            } else {
              this.currentSession = this.currentSession + 1;
            }

            this.phase = 'FOCUS';
            this.status = 'AWAITING_NEXT_PHASE';
            this.awaitingNextPhase = 'FOCUS';
            this.totalDurationSec = this.config.focusDurationSec;
            this.remainingSec = this.config.focusDurationSec;
            this.remainingMs = this.config.focusDurationSec * 1000;
            this.deadline = null;
            return true;
          }
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  public dispose(): void {
    this.scheduler.stop();
    this.listeners.clear();
    this.audioCoordinator.dispose();
  }
}
