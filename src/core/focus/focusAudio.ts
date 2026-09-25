import { FocusSoundCue } from './types';

export interface IFocusSoundEngine {
  play(cue: FocusSoundCue): Promise<void>;
  setVolume(volume: number): void;
  unlock(): Promise<void>;
  dispose(): void;
}

export interface IFocusSpeechEngine {
  speak(text: string): Promise<void>;
  cancel(): void;
}

export class WebAudioFocusSoundEngine implements IFocusSoundEngine {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume = 1.0;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext(): void {
    if (typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window)) {
      try {
        const AudioCtxClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioCtxClass();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.value = this.volume;
        this.masterGain.connect(this.audioCtx.destination);
      } catch (e) {
        console.warn('Web Audio API unavailable for FocusSoundEngine:', e);
      }
    }
  }

  public async unlock(): Promise<void> {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
      } catch (e) {
        console.warn('FocusSoundEngine AudioContext resume failed:', e);
      }
    }
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
  }

  public async play(cue: FocusSoundCue): Promise<void> {
    if (!this.audioCtx || !this.masterGain) return;
    await this.unlock();

    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    switch (cue) {
      case 'FOCUS_START': {
        // Calm, subtle ascending 2-tone chime (523.25Hz -> 659.25Hz, sine wave, 200ms)
        this.playTone(523.25, now, 0.12, 'sine', 0.25);
        this.playTone(659.25, now + 0.1, 0.18, 'sine', 0.25);
        break;
      }
      case 'FOCUS_COMPLETE': {
        // Noticeable, pleasant 3-tone chime (659.25Hz -> 783.99Hz -> 880Hz, 450ms)
        this.playTone(659.25, now, 0.14, 'sine', 0.35);
        this.playTone(783.99, now + 0.13, 0.14, 'sine', 0.35);
        this.playTone(880.0, now + 0.26, 0.3, 'sine', 0.4);
        break;
      }
      case 'BREAK_START': {
        // Calm mellow descending chime (587.33Hz -> 440Hz, sine wave)
        this.playTone(587.33, now, 0.15, 'sine', 0.2);
        this.playTone(440.0, now + 0.12, 0.25, 'sine', 0.2);
        break;
      }
      case 'BREAK_COMPLETE': {
        // Distinct 3-tone awakening chime (440Hz -> 587.33Hz -> 659.25Hz)
        this.playTone(440.0, now, 0.12, 'triangle', 0.25);
        this.playTone(587.33, now + 0.11, 0.12, 'triangle', 0.25);
        this.playTone(659.25, now + 0.22, 0.25, 'triangle', 0.3);
        break;
      }
    }
  }

  public dispose(): void {
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
      this.masterGain = null;
    }
  }

  private playTone(
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType = 'sine',
    peakGain = 0.3
  ): void {
    if (!this.audioCtx || !this.masterGain) return;
    const osc = this.audioCtx.createOscillator();
    const toneGain = this.audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    toneGain.gain.setValueAtTime(peakGain, startTime);
    toneGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(toneGain);
    toneGain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }
}

export class WebAudioFocusSpeechEngine implements IFocusSpeechEngine {
  public async speak(text: string): Promise<void> {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    return new Promise((resolve) => {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);
      } catch {
        resolve();
      }
    });
  }

  public cancel(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
  }
}

export class MockFocusSoundEngine implements IFocusSoundEngine {
  public history: FocusSoundCue[] = [];
  public volume = 1.0;
  public shouldFail = false;

  public async play(cue: FocusSoundCue): Promise<void> {
    if (this.shouldFail) {
      throw new Error('MockFocusSoundEngine error');
    }
    this.history.push(cue);
  }

  public setVolume(volume: number): void {
    this.volume = volume;
  }

  public async unlock(): Promise<void> {}

  public dispose(): void {}

  public clear(): void {
    this.history = [];
  }
}

export class MockFocusSpeechEngine implements IFocusSpeechEngine {
  public history: string[] = [];
  public shouldFail = false;

  public async speak(text: string): Promise<void> {
    if (this.shouldFail) {
      throw new Error('MockFocusSpeechEngine error');
    }
    this.history.push(text);
  }

  public cancel(): void {}

  public clear(): void {
    this.history = [];
  }
}

export interface FocusAudioCoordinatorOptions {
  soundEngine?: IFocusSoundEngine;
  speechEngine?: IFocusSpeechEngine;
  soundEnabled?: boolean;
  voiceEnabled?: boolean;
  volume?: number;
}

export class FocusAudioCoordinator {
  private soundEngine: IFocusSoundEngine;
  private speechEngine: IFocusSpeechEngine;
  private soundEnabled: boolean;
  private voiceEnabled: boolean;

  constructor(options?: FocusAudioCoordinatorOptions) {
    this.soundEngine = options?.soundEngine ?? new WebAudioFocusSoundEngine();
    this.speechEngine = options?.speechEngine ?? new WebAudioFocusSpeechEngine();
    this.soundEnabled = options?.soundEnabled ?? true;
    this.voiceEnabled = options?.voiceEnabled ?? false;
    if (options?.volume !== undefined) {
      this.soundEngine.setVolume(options.volume);
    }
  }

  public updateConfig(soundEnabled: boolean, voiceEnabled: boolean, volume = 1.0): void {
    this.soundEnabled = soundEnabled;
    this.voiceEnabled = voiceEnabled;
    this.soundEngine.setVolume(volume);
  }

  public async handleFocusStart(): Promise<void> {
    if (this.soundEnabled) {
      try {
        await this.soundEngine.play('FOCUS_START');
      } catch (e) {
        console.warn('Focus audio play failed:', e);
      }
    }
    if (this.voiceEnabled) {
      try {
        await this.speechEngine.speak('Focus session started.');
      } catch (e) {
        console.warn('Focus speech failed:', e);
      }
    }
  }

  public async handleFocusComplete(shortBreakMin: number, isLongBreak = false): Promise<void> {
    if (this.soundEnabled) {
      try {
        await this.soundEngine.play('FOCUS_COMPLETE');
      } catch (e) {
        console.warn('Focus audio play failed:', e);
      }
    }
    if (this.voiceEnabled) {
      try {
        const breakName = isLongBreak ? `${shortBreakMin} minute long break` : `${shortBreakMin} minute break`;
        await this.speechEngine.speak(`Focus complete. Take a ${breakName}.`);
      } catch (e) {
        console.warn('Focus speech failed:', e);
      }
    }
  }

  public async handleBreakStart(): Promise<void> {
    if (this.soundEnabled) {
      try {
        await this.soundEngine.play('BREAK_START');
      } catch (e) {
        console.warn('Focus audio play failed:', e);
      }
    }
    if (this.voiceEnabled) {
      try {
        await this.speechEngine.speak('Break started.');
      } catch (e) {
        console.warn('Focus speech failed:', e);
      }
    }
  }

  public async handleBreakComplete(): Promise<void> {
    if (this.soundEnabled) {
      try {
        await this.soundEngine.play('BREAK_COMPLETE');
      } catch (e) {
        console.warn('Focus audio play failed:', e);
      }
    }
    if (this.voiceEnabled) {
      try {
        await this.speechEngine.speak('Break complete.');
      } catch (e) {
        console.warn('Focus speech failed:', e);
      }
    }
  }

  public async unlock(): Promise<void> {
    try {
      await this.soundEngine.unlock();
    } catch {
      // Ignore
    }
  }

  public dispose(): void {
    this.soundEngine.dispose();
  }
}
