import { describe, it, expect } from 'vitest';
import { MockSoundEngine, WebAudioSoundEngine } from '../soundEngine';
import { AudioCoordinator } from '../audioCoordinator';
import { MockSpeechEngine } from '../voiceCoach';
import { EngineEvent } from '../../engine/events';
import { WorkoutSegment } from '../../models/segment';

describe('Progressive Countdown Audio', () => {
  const dummySegment: WorkoutSegment = {
    id: 'seg-1',
    phase: 'WORK',
    durationSec: 30,
    context: {
      step: 1,
      totalSteps: 1,
      round: 1,
      totalRounds: 1,
      set: 1,
      totalSets: 1,
      exerciseIndex: 0,
      totalExercises: 1,
      exerciseName: 'Push-ups',
      isLastSetOfExercise: true,
      isLastExerciseOfRound: true,
      isLastSegmentOfWorkout: true,
    },
  };

  it('MockSoundEngine tracks countdownHistory for 3s, 2s, and 1s ticks', async () => {
    const sound = new MockSoundEngine();

    await sound.playCountdown(3);
    await sound.playCountdown(2);
    await sound.playCountdown(1);

    expect(sound.countdownHistory).toEqual([3, 2, 1]);
    expect(sound.history).toEqual(['COUNTDOWN', 'COUNTDOWN', 'COUNTDOWN']);
  });

  it('AudioCoordinator delegates COUNTDOWN_TICK events to soundEngine.playCountdown', async () => {
    const sound = new MockSoundEngine();
    const voice = new MockSpeechEngine();
    const coordinator = new AudioCoordinator({ soundEngine: sound, speechEngine: voice });

    const tick3: EngineEvent = {
      type: 'COUNTDOWN_TICK',
      timestamp: 1000,
      segment: dummySegment,
      segmentIndex: 0,
      seconds: 3,
    };
    const tick2: EngineEvent = {
      type: 'COUNTDOWN_TICK',
      timestamp: 2000,
      segment: dummySegment,
      segmentIndex: 0,
      seconds: 2,
    };
    const tick1: EngineEvent = {
      type: 'COUNTDOWN_TICK',
      timestamp: 3000,
      segment: dummySegment,
      segmentIndex: 0,
      seconds: 1,
    };

    await coordinator.handleEvent(tick3);
    await coordinator.handleEvent(tick2);
    await coordinator.handleEvent(tick1);

    expect(sound.countdownHistory).toEqual([3, 2, 1]);
  });

  it('WebAudioSoundEngine playCountdown synthesizes progressive duration beeps', async () => {
    const sound = new WebAudioSoundEngine();

    // Calling playCountdown should resolve without error
    await expect(sound.playCountdown(3)).resolves.toBeUndefined();
    await expect(sound.playCountdown(2)).resolves.toBeUndefined();
    await expect(sound.playCountdown(1)).resolves.toBeUndefined();

    sound.dispose();
  });
});
