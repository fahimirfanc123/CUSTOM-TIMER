import { SegmentContext } from '../models/segment';
import { formatDurationSpeech } from './durationFormatter';
import { AudioSettings, SpeechPriority } from './types';

export interface SpeechOptions {
  priority?: SpeechPriority;
  rate?: number;
  pitch?: number;
  volume?: number;
  voiceName?: string;
}

export interface ISpeechEngine {
  speak(text: string, options?: SpeechOptions): Promise<void>;
  speakQueue(phrases: string[], options?: SpeechOptions): Promise<void>;
  cancel(): void;
  isSpeaking(): boolean;
  unlock(): Promise<void>;
  onSpeechStart(callback: () => void): () => void;
  onSpeechEnd(callback: () => void): () => void;
}

export class WebSpeechEngine implements ISpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private startListeners = new Set<() => void>();
  private endListeners = new Set<() => void>();

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public async unlock(): Promise<void> {
    if (this.synth) {
      if (this.synth.paused) {
        this.synth.resume();
      }
    }
  }

  public onSpeechStart(callback: () => void): () => void {
    this.startListeners.add(callback);
    return () => this.startListeners.delete(callback);
  }

  public onSpeechEnd(callback: () => void): () => void {
    this.endListeners.add(callback);
    return () => this.endListeners.delete(callback);
  }

  public isSpeaking(): boolean {
    return this.synth?.speaking ?? false;
  }

  public cancel(): void {
    if (this.synth) {
      this.synth.cancel();
    }
    this.notifyEnd();
  }

  public async speak(text: string, options?: SpeechOptions): Promise<void> {
    return this.speakQueue([text], options);
  }

  public async speakQueue(phrases: string[], options?: SpeechOptions): Promise<void> {
    if (!this.synth || phrases.length === 0) return;

    const fullText = phrases.filter((p) => p.trim() !== '').join('. ');
    if (!fullText) return;

    if (options?.priority === 'HIGH') {
      this.cancel();
    }

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(fullText);
      utterance.rate = options?.rate ?? 1.0;
      utterance.pitch = options?.pitch ?? 1.0;
      utterance.volume = options?.volume ?? 1.0;

      if (options?.voiceName && this.synth) {
        const voices = this.synth.getVoices();
        const found = voices.find((v) => v.name === options.voiceName);
        if (found) {
          utterance.voice = found;
        }
      }

      utterance.onstart = () => {
        this.notifyStart();
      };

      utterance.onend = () => {
        this.notifyEnd();
        resolve();
      };

      utterance.onerror = () => {
        this.notifyEnd();
        resolve();
      };

      this.synth?.speak(utterance);
    });
  }

  private notifyStart(): void {
    for (const listener of this.startListeners) {
      try {
        listener();
      } catch (e) {
        console.error('Speech start listener error:', e);
      }
    }
  }

  private notifyEnd(): void {
    for (const listener of this.endListeners) {
      try {
        listener();
      } catch (e) {
        console.error('Speech end listener error:', e);
      }
    }
  }
}

export class MockSpeechEngine implements ISpeechEngine {
  public history: string[] = [];
  public queuedPhrases: string[] = [];
  public cancelCount = 0;
  public speaking = false;
  public shouldFail = false;
  public lastOptions?: SpeechOptions;

  private startListeners = new Set<() => void>();
  private endListeners = new Set<() => void>();

  public onSpeechStart(callback: () => void): () => void {
    this.startListeners.add(callback);
    return () => this.startListeners.delete(callback);
  }

  public onSpeechEnd(callback: () => void): () => void {
    this.endListeners.add(callback);
    return () => this.endListeners.delete(callback);
  }

  public isSpeaking(): boolean {
    return this.speaking;
  }

  public cancel(): void {
    this.cancelCount++;
    this.speaking = false;
    this.queuedPhrases = [];
    for (const cb of this.endListeners) cb();
  }

  public async unlock(): Promise<void> {}

  public async speak(text: string, options?: SpeechOptions): Promise<void> {
    return this.speakQueue([text], options);
  }

  public async speakQueue(phrases: string[], options?: SpeechOptions): Promise<void> {
    if (this.shouldFail) {
      throw new Error('MockSpeechEngine speech failure');
    }
    this.lastOptions = options;
    const combined = phrases.filter((p) => p.trim() !== '').join('. ');
    if (!combined) return;

    this.speaking = true;
    for (const cb of this.startListeners) cb();

    this.history.push(combined);
    this.queuedPhrases.push(...phrases);

    this.speaking = false;
    for (const cb of this.endListeners) cb();
  }

  public clear(): void {
    this.history = [];
    this.queuedPhrases = [];
    this.cancelCount = 0;
    this.speaking = false;
  }
}

export class VoiceCoach {
  private readonly speechEngine: ISpeechEngine;

  constructor(speechEngine: ISpeechEngine) {
    this.speechEngine = speechEngine;
  }

  public async announcePrepare(context: SegmentContext, settings: AudioSettings): Promise<void> {
    if (!settings.voiceEnabled) return;

    const phrases: string[] = ['Get ready', context.exerciseName, `Set ${context.set} of ${context.totalSets}`];
    if (context.reps) {
      phrases.push(`${context.reps} reps`);
    }

    await this.speak(phrases, 'HIGH', settings);
  }

  public async announceWorkStart(context: SegmentContext, settings: AudioSettings): Promise<void> {
    if (!settings.voiceEnabled) return;

    const phrases: string[] = [];
    // If first set of the exercise, announce exercise name + set
    if (context.set === 1) {
      phrases.push(context.exerciseName, `Set ${context.set} of ${context.totalSets}`);
      if (context.reps) {
        phrases.push(`${context.reps} reps`);
      }
    } else {
      phrases.push(`Set ${context.set} of ${context.totalSets}`);
      if (context.reps) {
        phrases.push(`${context.reps} reps`);
      }
    }

    await this.speak(phrases, 'HIGH', settings);
  }

  public async announceRestSet(
    context: SegmentContext,
    durationSec: number,
    settings: AudioSettings
  ): Promise<void> {
    if (!settings.voiceEnabled) return;

    const phrases: string[] = [
      `Set ${context.set} complete`,
      `${formatDurationSpeech(durationSec)} rest`,
    ];

    if (context.nextTarget) {
      phrases.push(`Next: Set ${context.nextTarget.setNumber} of ${context.nextTarget.totalSets}`);
    }

    await this.speak(phrases, 'MEDIUM', settings);
  }

  public async announceRestExercise(
    context: SegmentContext,
    durationSec: number,
    settings: AudioSettings
  ): Promise<void> {
    if (!settings.voiceEnabled) return;

    const phrases: string[] = [
      `${context.exerciseName} complete`,
      `${formatDurationSpeech(durationSec)} rest`,
    ];

    if (context.nextTarget) {
      phrases.push(`Next exercise: ${context.nextTarget.exerciseName}`);
      phrases.push(
        `${context.nextTarget.totalSets} ${context.nextTarget.totalSets === 1 ? 'set' : 'sets'}`
      );
    }

    await this.speak(phrases, 'MEDIUM', settings);
  }

  public async announceRestRound(
    context: SegmentContext,
    durationSec: number,
    settings: AudioSettings
  ): Promise<void> {
    if (!settings.voiceEnabled) return;

    const phrases: string[] = [
      `Round ${context.round} complete`,
      `${formatDurationSpeech(durationSec)} rest`,
    ];

    if (context.nextTarget) {
      phrases.push(
        `Next: Round ${context.nextTarget.roundNumber} of ${context.nextTarget.totalRounds}`,
        context.nextTarget.exerciseName
      );
    }

    await this.speak(phrases, 'MEDIUM', settings);
  }

  public async announceTenSeconds(settings: AudioSettings): Promise<void> {
    if (!settings.voiceEnabled || !settings.announceTenSeconds) return;
    await this.speak(['10 seconds'], 'HIGH', settings);
  }

  public async announceWorkoutComplete(settings: AudioSettings): Promise<void> {
    if (!settings.voiceEnabled) return;
    await this.speak(['Workout complete'], 'HIGH', settings);
  }

  public async announcePaused(settings: AudioSettings): Promise<void> {
    if (!settings.voiceEnabled) return;
    await this.speak(['Paused'], 'HIGH', settings);
  }

  public async announceResumed(settings: AudioSettings): Promise<void> {
    if (!settings.voiceEnabled) return;
    await this.speak(['Resuming'], 'HIGH', settings);
  }

  public async announceRestart(context: SegmentContext, settings: AudioSettings): Promise<void> {
    if (!settings.voiceEnabled) return;
    const phrases: string[] = ['Restarting set', context.exerciseName, `Set ${context.set} of ${context.totalSets}`];
    await this.speak(phrases, 'HIGH', settings);
  }

  public async announceSkip(nextContext: SegmentContext, settings: AudioSettings): Promise<void> {
    if (!settings.voiceEnabled) return;
    const phrases: string[] = [nextContext.exerciseName, `Set ${nextContext.set} of ${nextContext.totalSets}`];
    await this.speak(phrases, 'HIGH', settings);
  }

  public cancel(): void {
    this.speechEngine.cancel();
  }

  private async speak(
    phrases: string[],
    priority: SpeechPriority,
    settings: AudioSettings
  ): Promise<void> {
    try {
      await this.speechEngine.speakQueue(phrases, {
        priority,
        rate: settings.speechRate,
        pitch: settings.speechPitch,
        volume: settings.voiceVolume,
        voiceName: settings.selectedVoiceName,
      });
    } catch (err) {
      console.warn('VoiceCoach speech failed:', err);
    }
  }
}
