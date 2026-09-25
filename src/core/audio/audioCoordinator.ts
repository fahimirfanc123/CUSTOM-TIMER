import { EngineEvent } from '../engine/events';
import { ISoundEngine, WebAudioSoundEngine } from './soundEngine';
import { ISpeechEngine, VoiceCoach, WebSpeechEngine } from './voiceCoach';
import { AudioSettings, defaultAudioSettings, SoundCue, SoundSource } from './types';

export interface AudioCoordinatorOptions {
  soundEngine?: ISoundEngine;
  speechEngine?: ISpeechEngine;
  initialSettings?: Partial<AudioSettings>;
}

export class AudioCoordinator {
  private readonly soundEngine: ISoundEngine;
  private readonly speechEngine: ISpeechEngine;
  private readonly voiceCoach: VoiceCoach;
  private settings: AudioSettings;
  private cleanupDucking: (() => void)[] = [];

  constructor(options: AudioCoordinatorOptions = {}) {
    this.soundEngine = options.soundEngine ?? new WebAudioSoundEngine();
    this.speechEngine = options.speechEngine ?? new WebSpeechEngine();
    this.voiceCoach = new VoiceCoach(this.speechEngine);
    this.settings = { ...defaultAudioSettings, ...options.initialSettings };

    this.applySettingsToEngines();
    this.setupDucking();
  }

  // ==========================================
  // Public Lifecycle & Configuration
  // ==========================================
  public async initialize(): Promise<void> {
    await this.unlockAudio();
  }

  public async unlockAudio(): Promise<void> {
    try {
      await Promise.all([this.soundEngine.unlock(), this.speechEngine.unlock()]);
    } catch (err) {
      console.warn('Audio unlock warning:', err);
    }
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.applySettingsToEngines();
  }

  public setCustomSound(cue: SoundCue, source: SoundSource): void {
    this.soundEngine.setCustomSound(cue, source);
  }

  public getCustomSound(cue: SoundCue): SoundSource {
    return this.soundEngine.getCustomSound(cue);
  }

  public dispose(): void {
    this.cleanupDucking.forEach((cleanup) => cleanup());
    this.cleanupDucking = [];
    this.soundEngine.dispose();
    this.speechEngine.cancel();
  }

  // ==========================================
  // Event Consumer from TimerEngine
  // ==========================================
  public handleEvent(event: EngineEvent): void {
    try {
      this.processEvent(event);
    } catch (error) {
      // Audio / speech failures must never crash the TimerEngine
      console.error('AudioCoordinator error processing event:', event.type, error);
    }
  }

  private processEvent(event: EngineEvent): void {
    switch (event.type) {
      case 'WORKOUT_STARTED': {
        // Initial setup if needed
        break;
      }

      case 'SEGMENT_STARTED': {
        const { segment } = event;
        const { phase, context } = segment;

        if (phase === 'PREPARE') {
          this.voiceCoach.announcePrepare(context, this.settings);
        } else if (phase === 'WORK') {
          if (this.settings.soundEnabled) {
            this.playSound('START');
          }
          this.voiceCoach.announceWorkStart(context, this.settings);
        } else if (phase === 'REST_SET') {
          if (this.settings.soundEnabled) {
            this.playSound('REST_START');
          }
          this.voiceCoach.announceRestSet(context, segment.durationSec, this.settings);
        } else if (phase === 'REST_EXERCISE') {
          if (this.settings.soundEnabled) {
            this.playSound('REST_START');
          }
          this.voiceCoach.announceRestExercise(context, segment.durationSec, this.settings);
        } else if (phase === 'REST_ROUND') {
          if (this.settings.soundEnabled) {
            this.playSound('REST_START');
          }
          this.voiceCoach.announceRestRound(context, segment.durationSec, this.settings);
        }
        break;
      }

      case 'SEGMENT_COMPLETED': {
        const { segment } = event;
        if (segment.phase === 'WORK') {
          // Determine the most specific transition cue
          if (segment.context.isLastSegmentOfWorkout) {
            // WORKOUT_COMPLETED event handles final completion sound & announcement
            break;
          }

          if (segment.context.isLastExerciseOfRound && segment.context.isLastSetOfExercise) {
            if (this.settings.soundEnabled) {
              this.playSound('ROUND_COMPLETE');
            }
          } else if (segment.context.isLastSetOfExercise) {
            if (this.settings.soundEnabled) {
              this.playSound('EXERCISE_COMPLETE');
            }
          } else {
            if (this.settings.soundEnabled) {
              this.playSound('SET_COMPLETE');
            }
          }
        }
        break;
      }

      case 'TEN_SECONDS_REMAINING': {
        this.voiceCoach.announceTenSeconds(this.settings);
        break;
      }

      case 'COUNTDOWN_TICK': {
        if (this.settings.soundEnabled) {
          if (event.seconds === 3 || event.seconds === 2 || event.seconds === 1) {
            this.soundEngine.playCountdown(event.seconds as 3 | 2 | 1).catch((err) => {
              console.warn('SoundEngine countdown failed:', err);
            });
          } else {
            this.playSound('COUNTDOWN');
          }
        }
        if (this.settings.voiceEnabled && this.settings.announceCountdown) {
          this.speechEngine
            .speak(`${event.seconds}`, {
              priority: 'HIGH',
              volume: this.settings.voiceVolume,
              rate: this.settings.speechRate,
              pitch: this.settings.speechPitch,
            })
            .catch((err) => {
              console.warn('Countdown speech failed:', err);
            });
        }
        break;
      }

      case 'WORKOUT_COMPLETED': {
        if (this.settings.soundEnabled) {
          this.playSound('WORKOUT_COMPLETE');
        }
        this.voiceCoach.announceWorkoutComplete(this.settings);
        break;
      }

      case 'WORKOUT_PAUSED': {
        this.voiceCoach.announcePaused(this.settings);
        break;
      }

      case 'WORKOUT_RESUMED': {
        this.voiceCoach.announceResumed(this.settings);
        break;
      }

      case 'SEGMENT_SKIPPED': {
        this.voiceCoach.cancel();
        break;
      }

      case 'SEGMENT_RESTARTED': {
        this.voiceCoach.cancel();
        this.voiceCoach.announceRestart(event.segment.context, this.settings);
        break;
      }

      case 'WORKOUT_ENDED': {
        this.voiceCoach.cancel();
        break;
      }
    }
  }

  private playSound(cue: SoundCue): void {
    if (!this.settings.soundEnabled) return;
    this.soundEngine.play(cue).catch((err) => {
      console.warn(`SoundEngine failed to play cue [${cue}]:`, err);
    });
  }

  private applySettingsToEngines(): void {
    this.soundEngine.setVolume(this.settings.soundVolume);
  }

  private setupDucking(): void {
    const unsubStart = this.speechEngine.onSpeechStart(() => {
      this.soundEngine.setDucking(true, this.settings.duckingFactor);
    });
    const unsubEnd = this.speechEngine.onSpeechEnd(() => {
      this.soundEngine.setDucking(false);
    });
    this.cleanupDucking.push(unsubStart, unsubEnd);
  }
}
