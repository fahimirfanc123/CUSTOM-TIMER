import { SoundCue, SoundCueMap, SoundSource, defaultSoundCueMap } from './types';

export interface ISoundEngine {
  play(cue: SoundCue): Promise<void>;
  playCountdown(secondsRemaining: 3 | 2 | 1): Promise<void>;
  setVolume(volume: number): void;
  setDucking(isDucking: boolean, duckingFactor?: number): void;
  setCustomSound(cue: SoundCue, source: SoundSource): void;
  getCustomSound(cue: SoundCue): SoundSource;
  unlock(): Promise<void>;
  dispose(): void;
}

export class WebAudioSoundEngine implements ISoundEngine {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private soundMap: SoundCueMap = { ...defaultSoundCueMap };
  private volume = 1.0;
  private isDucking = false;
  private duckingFactor = 0.35;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext(): void {
    if (typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window)) {
      try {
        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioCtxClass();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.value = this.computeEffectiveVolume();
        this.masterGain.connect(this.audioCtx.destination);
      } catch (e) {
        console.warn('Web Audio API unavailable or failed to initialize:', e);
      }
    }
  }

  public async unlock(): Promise<void> {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
      } catch (e) {
        console.warn('AudioContext resume failed:', e);
      }
    }
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.updateGain();
  }

  public setDucking(isDucking: boolean, duckingFactor = 0.35): void {
    this.isDucking = isDucking;
    this.duckingFactor = Math.max(0, Math.min(1, duckingFactor));
    this.updateGain();
  }

  public setCustomSound(cue: SoundCue, source: SoundSource): void {
    this.soundMap[cue] = source;
  }

  public getCustomSound(cue: SoundCue): SoundSource {
    return this.soundMap[cue] ?? { type: 'BUILT_IN' };
  }

  public async play(cue: SoundCue): Promise<void> {
    const source = this.soundMap[cue];

    if (source && source.type === 'CUSTOM') {
      if (source.customPlay) {
        await source.customPlay();
        return;
      }
      if (source.buffer && this.audioCtx && this.masterGain) {
        await this.playAudioBuffer(source.buffer);
        return;
      }
      if (source.blobUri && typeof Audio !== 'undefined') {
        const audio = new Audio(source.blobUri);
        audio.volume = this.computeEffectiveVolume();
        await audio.play();
        return;
      }
    }

    // Default built-in procedural synthesis
    await this.playBuiltInSynth(cue);
  }

  public async playCountdown(secondsRemaining: 3 | 2 | 1): Promise<void> {
    const source = this.soundMap['COUNTDOWN'];
    if (source && source.type === 'CUSTOM') {
      await this.play('COUNTDOWN');
      return;
    }

    if (!this.audioCtx || !this.masterGain) return;
    await this.unlock();

    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    // Progressive countdown durations:
    // 3s: short beep (~120ms)
    // 2s: medium beep (~300ms)
    // 1s: long, strong beep (~600ms)
    let duration = 0.12;
    if (secondsRemaining === 2) {
      duration = 0.30;
    } else if (secondsRemaining === 1) {
      duration = 0.60;
    }

    this.playTone(880, now, duration, 'sine');
  }

  public dispose(): void {
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
      this.masterGain = null;
    }
  }

  private computeEffectiveVolume(): number {
    const multiplier = this.isDucking ? this.duckingFactor : 1.0;
    return this.volume * multiplier;
  }

  private updateGain(): void {
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(
        this.computeEffectiveVolume(),
        this.audioCtx.currentTime
      );
    }
  }

  private async playAudioBuffer(buffer: AudioBuffer): Promise<void> {
    if (!this.audioCtx || !this.masterGain) return;
    await this.unlock();
    const sourceNode = this.audioCtx.createBufferSource();
    sourceNode.buffer = buffer;
    sourceNode.connect(this.masterGain);
    sourceNode.start();
  }

  private async playBuiltInSynth(cue: SoundCue): Promise<void> {
    if (!this.audioCtx || !this.masterGain) return;
    await this.unlock();

    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    switch (cue) {
      case 'COUNTDOWN': {
        // Short crisp beep (880Hz, 80ms)
        this.playTone(880, now, 0.08, 'sine');
        break;
      }
      case 'START': {
        // High energetic start tone (880Hz -> 1174Hz, 250ms)
        this.playTone(880, now, 0.25, 'triangle', 1174);
        break;
      }
      case 'SET_COMPLETE': {
        // Double beep (660Hz 80ms, pause, 880Hz 120ms)
        this.playTone(660, now, 0.08, 'sine');
        this.playTone(880, now + 0.12, 0.12, 'sine');
        break;
      }
      case 'REST_START': {
        // Soft chime (440Hz, decaying 200ms)
        this.playTone(440, now, 0.2, 'sine');
        break;
      }
      case 'EXERCISE_COMPLETE': {
        // Ascending two-tone (523Hz -> 659Hz)
        this.playTone(523.25, now, 0.15, 'sine');
        this.playTone(659.25, now + 0.15, 0.2, 'sine');
        break;
      }
      case 'ROUND_COMPLETE': {
        // Energetic tri-tone fanfare (523Hz -> 659Hz -> 784Hz)
        this.playTone(523.25, now, 0.12, 'triangle');
        this.playTone(659.25, now + 0.12, 0.12, 'triangle');
        this.playTone(784.0, now + 0.24, 0.25, 'triangle');
        break;
      }
      case 'WORKOUT_COMPLETE': {
        // Grand victory chord sequence (523Hz -> 659Hz -> 784Hz -> 1046Hz)
        this.playTone(523.25, now, 0.15, 'triangle');
        this.playTone(659.25, now + 0.15, 0.15, 'triangle');
        this.playTone(784.0, now + 0.3, 0.18, 'triangle');
        this.playTone(1046.5, now + 0.48, 0.5, 'triangle');
        break;
      }
    }
  }

  private playTone(
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType = 'sine',
    endFreq?: number
  ): void {
    if (!this.audioCtx || !this.masterGain) return;
    const osc = this.audioCtx.createOscillator();
    const toneGain = this.audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);
    }

    toneGain.gain.setValueAtTime(0.5, startTime);
    toneGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(toneGain);
    toneGain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }
}

export class MockSoundEngine implements ISoundEngine {
  public history: SoundCue[] = [];
  public countdownHistory: (3 | 2 | 1)[] = [];
  public volume = 1.0;
  public isDucking = false;
  public duckingFactor = 0.35;
  public shouldFail = false;
  private soundMap: SoundCueMap = { ...defaultSoundCueMap };

  public async play(cue: SoundCue): Promise<void> {
    if (this.shouldFail) {
      throw new Error('MockSoundEngine playback failure');
    }
    this.history.push(cue);
  }

  public async playCountdown(secondsRemaining: 3 | 2 | 1): Promise<void> {
    if (this.shouldFail) {
      throw new Error('MockSoundEngine playback failure');
    }
    this.history.push('COUNTDOWN');
    this.countdownHistory.push(secondsRemaining);
  }

  public setVolume(volume: number): void {
    this.volume = volume;
  }

  public setDucking(isDucking: boolean, duckingFactor = 0.35): void {
    this.isDucking = isDucking;
    this.duckingFactor = duckingFactor;
  }

  public setCustomSound(cue: SoundCue, source: SoundSource): void {
    this.soundMap[cue] = source;
  }

  public getCustomSound(cue: SoundCue): SoundSource {
    return this.soundMap[cue] ?? { type: 'BUILT_IN' };
  }

  public async unlock(): Promise<void> {}

  public dispose(): void {}

  public clearHistory(): void {
    this.history = [];
    this.countdownHistory = [];
  }
}
