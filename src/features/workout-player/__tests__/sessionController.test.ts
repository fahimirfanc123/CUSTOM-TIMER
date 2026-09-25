import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkoutSessionController } from '../sessionController';
import { MockClock, ManualScheduler } from '../../../core/engine/clock';
import { MockSoundEngine } from '../../../core/audio/soundEngine';
import { MockSpeechEngine } from '../../../core/audio/voiceCoach';
import { Workout } from '../../../core/models/workout';

describe('WorkoutSessionController Unit Tests', () => {
  let clock: MockClock;
  let scheduler: ManualScheduler;
  let soundEngine: MockSoundEngine;
  let speechEngine: MockSpeechEngine;
  let controller: WorkoutSessionController;

  const testWorkout: Workout = {
    id: 'w-controller-test',
    title: 'Controller Test',
    type: 'SIMPLE',
    prepareDurationSec: 5,
    rounds: 1,
    restBetweenRoundsSec: 0,
    exercises: [
      {
        id: 'e1',
        name: 'Plank',
        sets: 1,
        workDurationSec: 30,
        restBetweenSetsSec: 0,
        restAfterExerciseSec: 0,
      },
    ],
  };

  beforeEach(() => {
    clock = new MockClock(1000);
    scheduler = new ManualScheduler();
    soundEngine = new MockSoundEngine();
    speechEngine = new MockSpeechEngine();
    controller = new WorkoutSessionController({
      clock,
      scheduler,
      soundEngine,
      speechEngine,
    });
  });

  it('initializes with null workout and null snapshot', () => {
    expect(controller.getWorkout()).toBeNull();
    expect(controller.getSnapshot()).toBeNull();
  });

  it('starts workout, initializes audio, and emits initial snapshot', async () => {
    const unlockSpy = vi.spyOn(soundEngine, 'unlock');
    const snapshot = await controller.startWorkout(testWorkout);

    expect(unlockSpy).toHaveBeenCalled();
    expect(controller.getWorkout()?.id).toBe('w-controller-test');
    expect(snapshot.status).toBe('RUNNING');
    expect(snapshot.currentSegment?.phase).toBe('PREPARE');
    expect(snapshot.remainingTimeSec).toBe(5);
  });

  it('pauses and resumes through controller', async () => {
    await controller.startWorkout(testWorkout);

    controller.pause();
    expect(controller.getSnapshot()?.status).toBe('PAUSED');

    controller.resume();
    expect(controller.getSnapshot()?.status).toBe('RUNNING');
  });

  it('skips, goes previous, and restarts segment through controller', async () => {
    await controller.startWorkout(testWorkout);
    expect(controller.getSnapshot()?.currentSegment?.phase).toBe('PREPARE');

    controller.next();
    expect(controller.getSnapshot()?.currentSegment?.phase).toBe('WORK');

    controller.previous();
    expect(controller.getSnapshot()?.currentSegment?.phase).toBe('PREPARE');

    clock.advanceBy(2000);
    scheduler.triggerTick();
    expect(controller.getSnapshot()?.remainingTimeSec).toBe(3);

    controller.restartCurrentSegment();
    expect(controller.getSnapshot()?.remainingTimeSec).toBe(5);
  });

  it('adjusts time via addTime', async () => {
    await controller.startWorkout(testWorkout);
    expect(controller.getSnapshot()?.remainingTimeSec).toBe(5);

    controller.addTime(10);
    expect(controller.getSnapshot()?.remainingTimeSec).toBe(15);

    controller.addTime(-5);
    expect(controller.getSnapshot()?.remainingTimeSec).toBe(10);
  });

  it('toggles audio settings and notifies subscribers', () => {
    const audioSubscriber = vi.fn();
    controller.subscribeAudio(audioSubscriber);

    expect(audioSubscriber).toHaveBeenCalledWith(expect.objectContaining({ voiceEnabled: true }));

    const voiceRes = controller.toggleVoice();
    expect(voiceRes).toBe(false);
    expect(controller.getAudioSettings().voiceEnabled).toBe(false);

    const soundRes = controller.toggleSound();
    expect(soundRes).toBe(false);
    expect(controller.getAudioSettings().soundEnabled).toBe(false);
  });

  it('restarts workout resets and starts same workout', async () => {
    await controller.startWorkout(testWorkout);
    controller.next(); // Go to WORK

    expect(controller.getSnapshot()?.currentSegment?.phase).toBe('WORK');

    await controller.restartWorkout();
    expect(controller.getSnapshot()?.currentSegment?.phase).toBe('PREPARE');
  });

  it('reset clears current workout and snapshot', async () => {
    await controller.startWorkout(testWorkout);
    expect(controller.getWorkout()).not.toBeNull();

    controller.reset();
    expect(controller.getWorkout()).toBeNull();
    expect(controller.getSnapshot()).toBeNull();
  });
});
