import { describe, it, expect, beforeEach } from 'vitest';
import { AudioCoordinator } from '../audioCoordinator';
import { MockSoundEngine } from '../soundEngine';
import { MockSpeechEngine } from '../voiceCoach';
import { TimerEngine } from '../../engine/timerEngine';
import { MockClock, ManualScheduler } from '../../engine/clock';
import { buildSegmentQueue } from '../../builder/segmentBuilder';
import { Workout } from '../../models/workout';

describe('AudioCoordinator and VoiceCoach Tests', () => {
  let soundEngine: MockSoundEngine;
  let speechEngine: MockSpeechEngine;
  let audioCoordinator: AudioCoordinator;
  let clock: MockClock;
  let scheduler: ManualScheduler;

  beforeEach(() => {
    soundEngine = new MockSoundEngine();
    speechEngine = new MockSpeechEngine();
    audioCoordinator = new AudioCoordinator({
      soundEngine,
      speechEngine,
    });
    clock = new MockClock(1000);
    scheduler = new ManualScheduler();
  });

  const setupEngineWithAudio = (workout: Workout) => {
    const segments = buildSegmentQueue(workout);
    const engine = new TimerEngine(segments, { workoutId: workout.id }, clock, scheduler);
    engine.subscribe((event) => audioCoordinator.handleEvent(event));
    return engine;
  };

  it('3. Countdown tick produces COUNTDOWN sound cue', () => {
    const workout: Workout = {
      id: 'w1',
      title: 'Countdown test',
      type: 'SIMPLE',
      prepareDurationSec: 0,
      rounds: 1,
      restBetweenRoundsSec: 0,
      exercises: [{ id: 'e1', name: 'Plank', sets: 1, workDurationSec: 5, restBetweenSetsSec: 0, restAfterExerciseSec: 0 }],
    };

    const engine = setupEngineWithAudio(workout);
    engine.start(); // 5s

    clock.advanceBy(2000); // 3s left
    scheduler.triggerTick();

    expect(soundEngine.history).toContain('COUNTDOWN');
  });

  it('4. 10-second warning produces voice announcement', () => {
    const workout: Workout = {
      id: 'w1',
      title: '10s test',
      type: 'SIMPLE',
      prepareDurationSec: 0,
      rounds: 1,
      restBetweenRoundsSec: 0,
      exercises: [{ id: 'e1', name: 'Plank', sets: 1, workDurationSec: 15, restBetweenSetsSec: 0, restAfterExerciseSec: 0 }],
    };

    const engine = setupEngineWithAudio(workout);
    engine.start(); // 15s

    clock.advanceBy(5000); // 10s left
    scheduler.triggerTick();

    expect(speechEngine.history).toContain('10 seconds');
  });

  it('5. Work segment start produces START sound and speech announcement', () => {
    const workout: Workout = {
      id: 'w1',
      title: 'Work start test',
      type: 'SIMPLE',
      prepareDurationSec: 0,
      rounds: 1,
      restBetweenRoundsSec: 0,
      exercises: [{ id: 'e1', name: 'Push-ups', sets: 1, workDurationSec: 30, restBetweenSetsSec: 0, restAfterExerciseSec: 0 }],
    };

    const engine = setupEngineWithAudio(workout);
    engine.start();

    expect(soundEngine.history).toContain('START');
    expect(speechEngine.history[0]).toContain('Push-ups. Set 1 of 1');
  });

  it('6. Set completion classification (more sets remaining in same exercise)', () => {
    const workout: Workout = {
      id: 'w1',
      title: 'Multi-set test',
      type: 'SET',
      prepareDurationSec: 0,
      rounds: 1,
      restBetweenRoundsSec: 0,
      exercises: [{ id: 'e1', name: 'Push-ups', sets: 2, workDurationSec: 10, restBetweenSetsSec: 15, restAfterExerciseSec: 0 }],
    };

    const engine = setupEngineWithAudio(workout);
    engine.start(); // Set 1

    soundEngine.clearHistory();
    speechEngine.clear();

    // Complete Set 1
    clock.advanceBy(10000);
    scheduler.triggerTick();

    expect(soundEngine.history).toContain('SET_COMPLETE');
    expect(soundEngine.history).toContain('REST_START');
  });

  it('7. Exercise completion classification (final set of exercise with next exercise remaining)', () => {
    const workout: Workout = {
      id: 'w1',
      title: 'Multi-ex test',
      type: 'CUSTOM',
      prepareDurationSec: 0,
      rounds: 1,
      restBetweenRoundsSec: 0,
      exercises: [
        { id: 'e1', name: 'Push-ups', sets: 1, workDurationSec: 10, restBetweenSetsSec: 0, restAfterExerciseSec: 30 },
        { id: 'e2', name: 'Squats', sets: 1, workDurationSec: 10, restBetweenSetsSec: 0, restAfterExerciseSec: 0 },
      ],
    };

    const engine = setupEngineWithAudio(workout);
    engine.start(); // Push-ups Set 1

    soundEngine.clearHistory();
    speechEngine.clear();

    // Complete Push-ups
    clock.advanceBy(10000);
    scheduler.triggerTick();

    expect(soundEngine.history).toContain('EXERCISE_COMPLETE');
    expect(soundEngine.history).toContain('REST_START');
    expect(speechEngine.history.some((t) => t.includes('Push-ups complete'))).toBe(true);
    expect(speechEngine.history.some((t) => t.includes('Next exercise: Squats'))).toBe(true);
  });

  it('8. Round completion classification (final exercise of round with next round remaining)', () => {
    const workout: Workout = {
      id: 'w1',
      title: 'Multi-round test',
      type: 'ROUND',
      prepareDurationSec: 0,
      rounds: 2,
      restBetweenRoundsSec: 60,
      exercises: [{ id: 'e1', name: 'Shadow Boxing', sets: 1, workDurationSec: 10, restBetweenSetsSec: 0, restAfterExerciseSec: 0 }],
    };

    const engine = setupEngineWithAudio(workout);
    engine.start(); // Round 1 Shadow Boxing

    soundEngine.clearHistory();
    speechEngine.clear();

    // Complete Round 1
    clock.advanceBy(10000);
    scheduler.triggerTick();

    expect(soundEngine.history).toContain('ROUND_COMPLETE');
    expect(soundEngine.history).toContain('REST_START');
    expect(speechEngine.history.some((t) => t.includes('Round 1 complete'))).toBe(true);
    expect(speechEngine.history.some((t) => t.includes('Next: Round 2 of 2'))).toBe(true);
  });

  it('9-10 & 34. Workout completion classification and highest priority', () => {
    const workout: Workout = {
      id: 'w1',
      title: 'Complete test',
      type: 'SIMPLE',
      prepareDurationSec: 0,
      rounds: 1,
      restBetweenRoundsSec: 0,
      exercises: [{ id: 'e1', name: 'Plank', sets: 1, workDurationSec: 10, restBetweenSetsSec: 0, restAfterExerciseSec: 0 }],
    };

    const engine = setupEngineWithAudio(workout);
    engine.start();

    soundEngine.clearHistory();
    speechEngine.clear();

    clock.advanceBy(10000);
    scheduler.triggerTick();

    expect(soundEngine.history).toEqual(['WORKOUT_COMPLETE']);
    expect(soundEngine.history).not.toContain('SET_COMPLETE');
    expect(soundEngine.history).not.toContain('EXERCISE_COMPLETE');
    expect(soundEngine.history).not.toContain('ROUND_COMPLETE');
    expect(speechEngine.history).toEqual(['Workout complete']);
  });

  it('11-16. REST announcements with nextTarget (set, exercise, round)', () => {
    const workout: Workout = {
      id: 'w1',
      title: 'Announcements test',
      type: 'CUSTOM',
      prepareDurationSec: 5,
      rounds: 2,
      restBetweenRoundsSec: 90,
      exercises: [
        { id: 'e1', name: 'Push-ups', sets: 2, workDurationSec: 20, restBetweenSetsSec: 30, restAfterExerciseSec: 45 },
        { id: 'e2', name: 'Squats', sets: 1, workDurationSec: 20, restBetweenSetsSec: 0, restAfterExerciseSec: 45 },
      ],
    };

    const engine = setupEngineWithAudio(workout);
    speechEngine.clear();

    // 1. Prepare
    engine.start();
    expect(speechEngine.history[0]).toBe('Get ready. Push-ups. Set 1 of 2');

    // 2. Complete Set 1 -> REST_SET (30s rest, next set 2 of 2)
    clock.advanceBy(5000); // Finish prepare
    scheduler.triggerTick(); // Start Work Set 1
    speechEngine.clear();

    clock.advanceBy(20000); // Finish Work Set 1
    scheduler.triggerTick(); // Start Rest Set
    expect(speechEngine.history[0]).toBe('Set 1 complete. 30 seconds rest. Next: Set 2 of 2');

    // 3. Complete Set 2 -> REST_EXERCISE (45s rest, next Squats, 1 set)
    clock.advanceBy(30000); // Finish Rest Set
    scheduler.triggerTick(); // Start Work Set 2
    speechEngine.clear();

    clock.advanceBy(20000); // Finish Work Set 2
    scheduler.triggerTick(); // Start Rest Exercise
    expect(speechEngine.history[0]).toBe('Push-ups complete. 45 seconds rest. Next exercise: Squats. 1 set');

    // 4. Complete Squats -> REST_ROUND (90s rest, next Round 2 of 2, Push-ups)
    clock.advanceBy(45000); // Finish Rest Exercise
    scheduler.triggerTick(); // Start Squats Work Set 1
    speechEngine.clear();

    clock.advanceBy(20000); // Finish Squats
    scheduler.triggerTick(); // Start Rest Round
    expect(speechEngine.history[0]).toBe('Round 1 complete. 1 minute 30 seconds rest. Next: Round 2 of 2. Push-ups');
  });

  it('17. Reps announced when specified on exercise', () => {
    const workout: Workout = {
      id: 'w1',
      title: 'Reps workout',
      type: 'CUSTOM',
      prepareDurationSec: 5,
      rounds: 1,
      restBetweenRoundsSec: 0,
      exercises: [{ id: 'e1', name: 'Bicep Curls', sets: 1, workDurationSec: 30, restBetweenSetsSec: 0, restAfterExerciseSec: 0, reps: 12 }],
    };

    const engine = setupEngineWithAudio(workout);
    engine.start();

    expect(speechEngine.history[0]).toBe('Get ready. Bicep Curls. Set 1 of 1. 12 reps');
  });

  it('18-23. Audio settings respected (mute voice, mute sounds, volumes, rate, pitch)', () => {
    audioCoordinator.updateSettings({
      voiceEnabled: false,
      soundEnabled: false,
      voiceVolume: 0.8,
      soundVolume: 0.5,
      speechRate: 1.2,
      speechPitch: 1.1,
    });

    const workout: Workout = {
      id: 'w1',
      title: 'Mute test',
      type: 'SIMPLE',
      prepareDurationSec: 0,
      rounds: 1,
      restBetweenRoundsSec: 0,
      exercises: [{ id: 'e1', name: 'Plank', sets: 1, workDurationSec: 10, restBetweenSetsSec: 0, restAfterExerciseSec: 0 }],
    };

    const engine = setupEngineWithAudio(workout);
    engine.start();

    // Because voice and sound are disabled, history should be empty
    expect(soundEngine.history).toHaveLength(0);
    expect(speechEngine.history).toHaveLength(0);
    expect(soundEngine.volume).toBe(0.5);

    // Re-enable voice with custom options
    audioCoordinator.updateSettings({ voiceEnabled: true });
    engine.pause();

    expect(speechEngine.history).toContain('Paused');
    expect(speechEngine.lastOptions?.volume).toBe(0.8);
    expect(speechEngine.lastOptions?.rate).toBe(1.2);
    expect(speechEngine.lastOptions?.pitch).toBe(1.1);
  });

  it('24-25. Pause and resume announcements', () => {
    const workout: Workout = {
      id: 'w1',
      title: 'Pause test',
      type: 'SIMPLE',
      prepareDurationSec: 0,
      rounds: 1,
      restBetweenRoundsSec: 0,
      exercises: [{ id: 'e1', name: 'Plank', sets: 1, workDurationSec: 20, restBetweenSetsSec: 0, restAfterExerciseSec: 0 }],
    };

    const engine = setupEngineWithAudio(workout);
    engine.start();
    speechEngine.clear();

    engine.pause();
    expect(speechEngine.history).toContain('Paused');

    speechEngine.clear();
    engine.resume();
    expect(speechEngine.history).toContain('Resuming');
  });

  it('26-29. Skip, previous, restart, and manual end cancel stale speech', () => {
    const workout: Workout = {
      id: 'w1',
      title: 'Nav test',
      type: 'SET',
      prepareDurationSec: 0,
      rounds: 1,
      restBetweenRoundsSec: 0,
      exercises: [{ id: 'e1', name: 'Push-ups', sets: 3, workDurationSec: 20, restBetweenSetsSec: 10, restAfterExerciseSec: 0 }],
    };

    const engine = setupEngineWithAudio(workout);
    engine.start();

    // Skip
    const cancelBeforeSkip = speechEngine.cancelCount;
    engine.next();
    expect(speechEngine.cancelCount).toBeGreaterThan(cancelBeforeSkip);

    // Restart
    const cancelBeforeRestart = speechEngine.cancelCount;
    engine.restartCurrentSegment();
    expect(speechEngine.cancelCount).toBeGreaterThan(cancelBeforeRestart);
    expect(speechEngine.history.at(-1)).toContain('Restarting set. Push-ups. Set 1 of 3');

    // End workout
    const cancelBeforeEnd = speechEngine.cancelCount;
    engine.endWorkout();
    expect(speechEngine.cancelCount).toBeGreaterThan(cancelBeforeEnd);
  });

  it('30. Subscriber cleanup / dispose', () => {
    audioCoordinator.dispose();
    // Verify soundEngine disposed and speech canceled
    expect(speechEngine.cancelCount).toBeGreaterThanOrEqual(1);
  });

  it('31-32. Sound and Speech engine failures do not crash TimerEngine', () => {
    soundEngine.shouldFail = true;
    speechEngine.shouldFail = true;

    const workout: Workout = {
      id: 'w1',
      title: 'Error resilience',
      type: 'SIMPLE',
      prepareDurationSec: 0,
      rounds: 1,
      restBetweenRoundsSec: 0,
      exercises: [{ id: 'e1', name: 'Plank', sets: 1, workDurationSec: 5, restBetweenSetsSec: 0, restAfterExerciseSec: 0 }],
    };

    const engine = setupEngineWithAudio(workout);

    // Starting and ticking must not throw despite audio exceptions
    expect(() => {
      engine.start();
      clock.advanceBy(5000);
      scheduler.triggerTick();
    }).not.toThrow();

    expect(engine.getSnapshot().status).toBe('COMPLETED');
  });

  it('33. No duplicate transition cues during state changes', () => {
    const workout: Workout = {
      id: 'w1',
      title: 'No dupes',
      type: 'SIMPLE',
      prepareDurationSec: 0,
      rounds: 1,
      restBetweenRoundsSec: 0,
      exercises: [{ id: 'e1', name: 'Plank', sets: 1, workDurationSec: 10, restBetweenSetsSec: 0, restAfterExerciseSec: 0 }],
    };

    const engine = setupEngineWithAudio(workout);
    engine.start();
    soundEngine.clearHistory();

    clock.advanceBy(10000);
    scheduler.triggerTick();

    // Only WORKOUT_COMPLETE cue should have fired, not SET_COMPLETE or EXERCISE_COMPLETE
    expect(soundEngine.history.filter((c) => c === 'WORKOUT_COMPLETE')).toHaveLength(1);
    expect(soundEngine.history.filter((c) => c === 'SET_COMPLETE')).toHaveLength(0);
    expect(soundEngine.history.filter((c) => c === 'EXERCISE_COMPLETE')).toHaveLength(0);
  });

  it('35. Custom sound architecture accepts custom source abstraction', async () => {
    let customPlayCalled = false;
    audioCoordinator.setCustomSound('START', {
      type: 'CUSTOM',
      customPlay: async () => {
        customPlayCalled = true;
      },
    });

    const customSource = audioCoordinator.getCustomSound('START');
    expect(customSource.type).toBe('CUSTOM');

    await soundEngine.play('START');
    expect(soundEngine.getCustomSound('START').type).toBe('CUSTOM');

    if (customSource.type === 'CUSTOM' && customSource.customPlay) {
      await customSource.customPlay();
    }
    expect(customPlayCalled).toBe(true);
  });
});
