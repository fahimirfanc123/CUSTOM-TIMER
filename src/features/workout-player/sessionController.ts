import { Workout } from '../../core/models/workout';
import { buildSegmentQueue } from '../../core/builder/segmentBuilder';
import { TimerEngine } from '../../core/engine/timerEngine';
import { EngineSnapshot } from '../../core/engine/types';
import { AudioCoordinator } from '../../core/audio/audioCoordinator';
import { AudioSettings } from '../../core/audio/types';
import { ISoundEngine } from '../../core/audio/soundEngine';
import { ISpeechEngine } from '../../core/audio/voiceCoach';
import { Clock, Scheduler, defaultClock, DefaultScheduler } from '../../core/engine/clock';

export interface WorkoutSessionControllerOptions {
  soundEngine?: ISoundEngine;
  speechEngine?: ISpeechEngine;
  initialAudioSettings?: Partial<AudioSettings>;
  clock?: Clock;
  scheduler?: Scheduler;
}

export class WorkoutSessionController {
  private workout: Workout | null = null;
  private engine: TimerEngine | null = null;
  private audioCoordinator: AudioCoordinator;
  private unsubscribeEngine: (() => void) | null = null;
  private stateListeners = new Set<(snapshot: EngineSnapshot | null) => void>();
  private audioListeners = new Set<(settings: AudioSettings) => void>();
  private lastSnapshot: EngineSnapshot | null = null;
  private currentAudioSettings: AudioSettings;
  private readonly options?: WorkoutSessionControllerOptions;

  constructor(options?: WorkoutSessionControllerOptions) {
    this.options = options;
    this.audioCoordinator = new AudioCoordinator({
      soundEngine: options?.soundEngine,
      speechEngine: options?.speechEngine,
      initialSettings: options?.initialAudioSettings,
    });
    this.currentAudioSettings = this.audioCoordinator.getSettings();
  }

  public getWorkout(): Workout | null {
    return this.workout;
  }

  public getSnapshot(): EngineSnapshot | null {
    return this.lastSnapshot;
  }

  public getAudioSettings(): AudioSettings {
    return this.currentAudioSettings;
  }

  public updateAudioSettings(settings: Partial<AudioSettings>): void {
    this.audioCoordinator.updateSettings(settings);
    this.currentAudioSettings = this.audioCoordinator.getSettings();
    this.notifyAudioListeners(this.currentAudioSettings);
  }

  public toggleVoice(): boolean {
    const current = this.currentAudioSettings.voiceEnabled;
    const next = !current;
    this.updateAudioSettings({ voiceEnabled: next });
    return next;
  }

  public toggleSound(): boolean {
    const current = this.currentAudioSettings.soundEnabled;
    const next = !current;
    this.updateAudioSettings({ soundEnabled: next });
    return next;
  }

  public async startWorkout(workout: Workout): Promise<EngineSnapshot> {
    this.cleanupCurrentSession();
    this.workout = workout;

    // 1. Initialize audio context on user gesture (safe fallback if unsupported)
    try {
      await this.audioCoordinator.initialize();
    } catch (e) {
      console.warn('Audio initialization warning:', e);
    }

    // 2. Build segments queue from domain model
    const segments = buildSegmentQueue(workout);

    // 3. Create engine instance
    this.engine = new TimerEngine(
      segments,
      { workoutId: workout.id },
      this.options?.clock ?? defaultClock,
      this.options?.scheduler ?? new DefaultScheduler()
    );

    // 4. Connect AudioCoordinator and UI listeners
    this.unsubscribeEngine = this.engine.subscribe((event) => {
      // Forward event to AudioCoordinator
      this.audioCoordinator.handleEvent(event);

      // Notify UI of snapshot updates
      if (this.engine) {
        const snap = this.engine.getSnapshot();
        this.lastSnapshot = snap;
        this.notifyListeners(snap);
      }
    });

    // 5. Start engine
    this.engine.start();
    const initialSnapshot = this.engine.getSnapshot();
    this.lastSnapshot = initialSnapshot;
    this.notifyListeners(initialSnapshot);

    return initialSnapshot;
  }

  public async restartWorkout(): Promise<EngineSnapshot | null> {
    if (!this.workout) return null;
    return this.startWorkout(this.workout);
  }

  public reset(): void {
    this.cleanupCurrentSession();
    this.workout = null;
    this.notifyListeners(null);
  }

  public subscribe(listener: (snapshot: EngineSnapshot | null) => void): () => void {
    this.stateListeners.add(listener);
    listener(this.lastSnapshot);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  public subscribeAudio(listener: (settings: AudioSettings) => void): () => void {
    this.audioListeners.add(listener);
    listener(this.currentAudioSettings);
    return () => {
      this.audioListeners.delete(listener);
    };
  }

  // ==========================================
  // Controls forwarding to TimerEngine
  // ==========================================
  public pause(): void {
    this.engine?.pause();
  }

  public resume(): void {
    this.engine?.resume();
  }

  public next(): void {
    this.engine?.next();
  }

  public previous(): void {
    this.engine?.previous();
  }

  public restartCurrentSegment(): void {
    this.engine?.restartCurrentSegment();
  }

  public addTime(seconds: number): void {
    this.engine?.addTime(seconds);
  }

  public endWorkout(): void {
    if (this.engine) {
      this.engine.endWorkout();
    }
  }

  public handleVisibilityReconcile(): void {
    if (this.engine) {
      const snap = this.engine.getSnapshot();
      this.lastSnapshot = snap;
      this.notifyListeners(snap);
    }
  }

  public dispose(): void {
    this.cleanupCurrentSession();
    this.audioCoordinator.dispose();
    this.notifyListeners(null);
  }

  private cleanupCurrentSession(): void {
    if (this.unsubscribeEngine) {
      this.unsubscribeEngine();
      this.unsubscribeEngine = null;
    }
    this.engine = null;
    this.lastSnapshot = null;
  }

  private notifyListeners(snapshot: EngineSnapshot | null): void {
    for (const listener of this.stateListeners) {
      try {
        listener(snapshot);
      } catch (err) {
        console.error('SessionController listener error:', err);
      }
    }
  }

  private notifyAudioListeners(settings: AudioSettings): void {
    for (const listener of this.audioListeners) {
      try {
        listener(settings);
      } catch (err) {
        console.error('SessionController audio listener error:', err);
      }
    }
  }
}
