export type SoundCue =
  | 'COUNTDOWN'
  | 'START'
  | 'SET_COMPLETE'
  | 'REST_START'
  | 'EXERCISE_COMPLETE'
  | 'ROUND_COMPLETE'
  | 'WORKOUT_COMPLETE';

export type SpeechPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface AudioSettings {
  voiceEnabled: boolean;
  soundEnabled: boolean;
  voiceVolume: number; // 0.0 to 1.0
  soundVolume: number; // 0.0 to 1.0
  speechRate: number; // 0.5 to 2.0
  speechPitch: number; // 0.5 to 2.0
  selectedVoiceName?: string;
  announceTenSeconds: boolean;
  announceCountdown: boolean; // default false (beeps used)
  duckingFactor: number; // 0.0 to 1.0 (default 0.35)
}

export const defaultAudioSettings: AudioSettings = {
  voiceEnabled: true,
  soundEnabled: true,
  voiceVolume: 1.0,
  soundVolume: 1.0,
  speechRate: 1.0,
  speechPitch: 1.0,
  announceTenSeconds: true,
  announceCountdown: false,
  duckingFactor: 0.35,
};

export type SoundSource =
  | { type: 'BUILT_IN' }
  | {
      type: 'CUSTOM';
      buffer?: AudioBuffer;
      blobUri?: string;
      customPlay?: () => Promise<void>;
    };

export type SoundCueMap = Record<SoundCue, SoundSource>;

export const defaultSoundCueMap: SoundCueMap = {
  COUNTDOWN: { type: 'BUILT_IN' },
  START: { type: 'BUILT_IN' },
  SET_COMPLETE: { type: 'BUILT_IN' },
  REST_START: { type: 'BUILT_IN' },
  EXERCISE_COMPLETE: { type: 'BUILT_IN' },
  ROUND_COMPLETE: { type: 'BUILT_IN' },
  WORKOUT_COMPLETE: { type: 'BUILT_IN' },
};
