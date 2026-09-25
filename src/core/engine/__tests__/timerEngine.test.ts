import { describe, it, expect, beforeEach } from 'vitest';
import { TimerEngine } from '../timerEngine';
import { MockClock, ManualScheduler } from '../clock';
import { EngineEvent } from '../events';
import { buildSegmentQueue } from '../../builder/segmentBuilder';
import { Workout } from '../../models/workout';

describe('TimerEngine Unit Tests', () => {
  let clock: MockClock;
  let scheduler: ManualScheduler;
  let sampleWorkout: Workout;

  beforeEach(() => {
    clock = new MockClock(1000); // start clock at t=1000ms
    scheduler = new ManualScheduler();

    sampleWorkout = {
      id: 'w_test',
      title: 'Test Workout',
      type: 'CUSTOM',
      prepareDurationSec: 5,
      rounds: 1,
      restBetweenRoundsSec: 0,
      exercises: [
        {
          id: 'ex_1',
          name: 'Push-ups',
          sets: 2,
          workDurationSec: 20,
          restBetweenSetsSec: 10,
          restAfterExerciseSec: 0,
        },
      ],
    };
  });

  const createEngine = (workout = sampleWorkout) => {
    const segments = buildSegmentQueue(workout);
    return new TimerEngine(segments, { workoutId: workout.id }, clock, scheduler);
  };

  it('1. Engine initial state is IDLE with correct snapshot', () => {
    const engine = createEngine();
    const snapshot = engine.getSnapshot();

    expect(snapshot.status).toBe('IDLE');
    expect(snapshot.workoutId).toBe('w_test');
    expect(snapshot.currentSegmentIndex).toBe(0);
    expect(snapshot.currentSegment?.phase).toBe('PREPARE');
    expect(snapshot.remainingTimeMs).toBe(5000);
    expect(snapshot.remainingTimeSec).toBe(5);
    expect(snapshot.elapsedWorkoutTimeMs).toBe(0);
    expect(snapshot.totalWorkoutDurationSec).toBe(55); // 5 + 20 + 10 + 20 = 55s
    expect(snapshot.progress).toBe(0);
    expect(scheduler.isRunning()).toBe(false);
  });

  it('2. Start begins the workout and emits WORKOUT_STARTED and SEGMENT_STARTED', () => {
    const engine = createEngine();
    const events: EngineEvent[] = [];
    engine.subscribe((e) => events.push(e));

    engine.start();

    expect(engine.getSnapshot().status).toBe('RUNNING');
    expect(scheduler.isRunning()).toBe(true);
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe('WORKOUT_STARTED');
    expect(events[1].type).toBe('SEGMENT_STARTED');
    expect((events[1] as any).segment.phase).toBe('PREPARE');
  });

  it('3. Automatic segment transition when deadline is reached', () => {
    const engine = createEngine();
    const events: EngineEvent[] = [];
    engine.subscribe((e) => events.push(e));

    engine.start(); // Prepare (5s) starts at t=1000, deadline=6000

    // Advance 5 seconds to t=6000
    clock.advanceBy(5000);
    scheduler.triggerTick();

    const snapshot = engine.getSnapshot();
    expect(snapshot.currentSegmentIndex).toBe(1);
    expect(snapshot.currentSegment?.id).toBe('r1_e0_s1_work');
    expect(snapshot.remainingTimeMs).toBe(20000);

    const eventTypes = events.map((e) => e.type);
    expect(eventTypes).toContain('SEGMENT_COMPLETED');
    expect(eventTypes).toContain('SEGMENT_STARTED');
  });

  it('4. Automatic workout completion after final segment', () => {
    const shortWorkout: Workout = {
      id: 'w_short',
      title: 'Short',
      type: 'SIMPLE',
      prepareDurationSec: 0,
      rounds: 1,
      restBetweenRoundsSec: 0,
      exercises: [
        {
          id: 'ex_1',
          name: 'Jumps',
          sets: 1,
          workDurationSec: 5,
          restBetweenSetsSec: 0,
          restAfterExerciseSec: 0,
        },
      ],
    };

    const engine = createEngine(shortWorkout);
    const events: EngineEvent[] = [];
    engine.subscribe((e) => events.push(e));

    engine.start(); // 5s work
    clock.advanceBy(5000);
    scheduler.triggerTick();

    expect(engine.getSnapshot().status).toBe('COMPLETED');
    expect(engine.getSnapshot().progress).toBe(1.0);
    expect(scheduler.isRunning()).toBe(false);

    const eventTypes = events.map((e) => e.type);
    expect(eventTypes).toEqual(['WORKOUT_STARTED', 'SEGMENT_STARTED', 'SEGMENT_COMPLETED', 'WORKOUT_COMPLETED']);
  });

  it('5. Pause freezes timer and stops scheduler', () => {
    const engine = createEngine();
    const events: EngineEvent[] = [];
    engine.subscribe((e) => events.push(e));

    engine.start(); // Prepare 5s
    clock.advanceBy(2000); // 3s remaining
    engine.pause();

    expect(engine.getSnapshot().status).toBe('PAUSED');
    expect(engine.getSnapshot().remainingTimeMs).toBe(3000);
    expect(scheduler.isRunning()).toBe(false);
    expect(events.at(-1)?.type).toBe('WORKOUT_PAUSED');

    // Ticks while paused do nothing
    clock.advanceBy(10000);
    scheduler.triggerTick();
    expect(engine.getSnapshot().status).toBe('PAUSED');
    expect(engine.getSnapshot().remainingTimeMs).toBe(3000);
  });

  it('6. Resume restarts timing with correct remaining duration', () => {
    const engine = createEngine();
    const events: EngineEvent[] = [];
    engine.subscribe((e) => events.push(e));

    engine.start();
    clock.advanceBy(2000); // 3s left
    engine.pause();

    clock.advanceBy(5000); // 5 seconds of pause wall-clock time passes
    engine.resume();

    expect(engine.getSnapshot().status).toBe('RUNNING');
    expect(scheduler.isRunning()).toBe(true);
    expect(events.at(-1)?.type).toBe('WORKOUT_RESUMED');

    // Advance 3s remaining
    clock.advanceBy(3000);
    scheduler.triggerTick();

    // Should transition to Push-ups Set 1 WORK
    expect(engine.getSnapshot().currentSegmentIndex).toBe(1);
    expect(engine.getSnapshot().currentSegment?.phase).toBe('WORK');
  });

  it('7. Pause does not consume workout elapsed time', () => {
    const engine = createEngine();
    engine.start(); // t=1000

    clock.advanceBy(2000); // t=3000, 2s active work
    engine.pause();

    const elapsedAtPause = engine.getSnapshot().elapsedWorkoutTimeMs;
    expect(elapsedAtPause).toBe(2000);

    // Wall clock passes 1 hour while paused
    clock.advanceBy(3600000);
    expect(engine.getSnapshot().elapsedWorkoutTimeMs).toBe(2000);

    engine.resume();
    expect(engine.getSnapshot().elapsedWorkoutTimeMs).toBe(2000);

    // Advance 1s active time
    clock.advanceBy(1000);
    expect(engine.getSnapshot().elapsedWorkoutTimeMs).toBe(3000);
  });

  it('8. Next/skip immediately skips current segment without emitting SEGMENT_COMPLETED', () => {
    const engine = createEngine();
    const events: EngineEvent[] = [];
    engine.subscribe((e) => events.push(e));

    engine.start(); // on Prepare (idx 0)
    engine.next();

    expect(engine.getSnapshot().currentSegmentIndex).toBe(1);
    expect(engine.getSnapshot().currentSegment?.id).toBe('r1_e0_s1_work');

    const eventTypes = events.map((e) => e.type);
    expect(eventTypes).toContain('SEGMENT_SKIPPED');
    expect(eventTypes).not.toContain('SEGMENT_COMPLETED');
  });

  it('9. Next on final segment completes the workout', () => {
    const shortWorkout: Workout = {
      id: 'w_one',
      title: 'One',
      type: 'SIMPLE',
      prepareDurationSec: 0,
      rounds: 1,
      restBetweenRoundsSec: 0,
      exercises: [{ id: 'e1', name: 'Ex', sets: 1, workDurationSec: 10, restBetweenSetsSec: 0, restAfterExerciseSec: 0 }],
    };
    const engine = createEngine(shortWorkout);
    const events: EngineEvent[] = [];
    engine.subscribe((e) => events.push(e));

    engine.start();
    engine.next(); // Skip final segment

    expect(engine.getSnapshot().status).toBe('COMPLETED');
    expect(events.at(-1)?.type).toBe('WORKOUT_COMPLETED');
  });

  it('10. Previous moves back to previous segment with full duration', () => {
    const engine = createEngine();
    engine.start(); // Prepare (5s)
    clock.advanceBy(5000);
    scheduler.triggerTick(); // Now at Push-ups Set 1 (20s)

    clock.advanceBy(8000); // 12s remaining
    expect(engine.getSnapshot().currentSegmentIndex).toBe(1);
    expect(engine.getSnapshot().remainingTimeMs).toBe(12000);

    engine.previous();

    expect(engine.getSnapshot().currentSegmentIndex).toBe(0);
    expect(engine.getSnapshot().currentSegment?.phase).toBe('PREPARE');
    expect(engine.getSnapshot().remainingTimeMs).toBe(5000);
  });

  it('11. Previous on first segment restarts the first segment', () => {
    const engine = createEngine();
    const events: EngineEvent[] = [];
    engine.subscribe((e) => events.push(e));

    engine.start(); // Prepare (5s)
    clock.advanceBy(3000); // 2s remaining
    engine.previous();

    expect(engine.getSnapshot().currentSegmentIndex).toBe(0);
    expect(engine.getSnapshot().remainingTimeMs).toBe(5000);
    expect(events.at(-1)?.type).toBe('SEGMENT_RESTARTED');
  });

  it('12. Restart current segment resets to full duration', () => {
    const engine = createEngine();
    const events: EngineEvent[] = [];
    engine.subscribe((e) => events.push(e));

    engine.start();
    clock.advanceBy(4000); // 1s left in prepare
    expect(engine.getSnapshot().remainingTimeMs).toBe(1000);

    engine.restartCurrentSegment();

    expect(engine.getSnapshot().remainingTimeMs).toBe(5000);
    expect(events.at(-1)?.type).toBe('SEGMENT_RESTARTED');
  });

  it('13. +10 sec and +30 sec time adjustments', () => {
    const engine = createEngine();
    const events: EngineEvent[] = [];
    engine.subscribe((e) => events.push(e));

    engine.start(); // 5000ms
    engine.addTime(10); // +10s -> 15000ms

    expect(engine.getSnapshot().remainingTimeMs).toBe(15000);
    expect(events.at(-1)).toMatchObject({
      type: 'TIME_ADJUSTED',
      amountMs: 10000,
      previousRemainingMs: 5000,
      newRemainingMs: 15000,
    });

    engine.addTime(30); // +30s -> 45000ms
    expect(engine.getSnapshot().remainingTimeMs).toBe(45000);
  });

  it('14. -10 sec time adjustment reduces remaining time', () => {
    const engine = createEngine();
    engine.start();
    engine.addTime(10); // 15000ms
    engine.addTime(-10); // 5000ms

    expect(engine.getSnapshot().remainingTimeMs).toBe(5000);
  });

  it('15. Time cannot become negative and completes segment if subtracted to 0', () => {
    const engine = createEngine();
    const events: EngineEvent[] = [];
    engine.subscribe((e) => events.push(e));

    engine.start(); // Prepare (5s)
    engine.addTime(-20); // Subtracted beyond 0

    // Should complete Prepare and advance to Push-ups Set 1
    expect(engine.getSnapshot().currentSegmentIndex).toBe(1);
    expect(engine.getSnapshot().currentSegment?.phase).toBe('WORK');
    expect(events.map((e) => e.type)).toContain('SEGMENT_COMPLETED');
  });

  it('16. Manual workout end transitions to STOPPED and emits WORKOUT_ENDED', () => {
    const engine = createEngine();
    const events: EngineEvent[] = [];
    engine.subscribe((e) => events.push(e));

    engine.start();
    clock.advanceBy(2000);
    engine.endWorkout();

    expect(engine.getSnapshot().status).toBe('STOPPED');
    expect(scheduler.isRunning()).toBe(false);
    expect(events.at(-1)?.type).toBe('WORKOUT_ENDED');
  });

  it('17. Manual end does NOT emit WORKOUT_COMPLETED', () => {
    const engine = createEngine();
    const events: EngineEvent[] = [];
    engine.subscribe((e) => events.push(e));

    engine.start();
    engine.endWorkout();

    const eventTypes = events.map((e) => e.type);
    expect(eventTypes).toContain('WORKOUT_ENDED');
    expect(eventTypes).not.toContain('WORKOUT_COMPLETED');
  });

  describe('Countdown & Warning Events', () => {
    it('18-21. TEN_SECONDS_REMAINING and COUNTDOWN_TICK (3, 2, 1) fire exactly once per segment', () => {
      const workout: Workout = {
        id: 'w_warn',
        title: 'Warning Test',
        type: 'SIMPLE',
        prepareDurationSec: 0,
        rounds: 1,
        restBetweenRoundsSec: 0,
        exercises: [{ id: 'e1', name: 'Plank', sets: 1, workDurationSec: 15, restBetweenSetsSec: 0, restAfterExerciseSec: 0 }],
      };
      const engine = createEngine(workout);
      const events: EngineEvent[] = [];
      engine.subscribe((e) => events.push(e));

      engine.start(); // 15s remaining

      // Tick at 12s remaining: no warnings
      clock.advanceBy(3000);
      scheduler.triggerTick();
      expect(events.filter((e) => e.type === 'TEN_SECONDS_REMAINING')).toHaveLength(0);

      // Tick at 10s remaining: TEN_SECONDS_REMAINING fires
      clock.advanceBy(2000);
      scheduler.triggerTick();
      expect(events.filter((e) => e.type === 'TEN_SECONDS_REMAINING')).toHaveLength(1);

      // Subsequent tick at 9s: TEN_SECONDS_REMAINING does NOT duplicate
      clock.advanceBy(1000);
      scheduler.triggerTick();
      expect(events.filter((e) => e.type === 'TEN_SECONDS_REMAINING')).toHaveLength(1);

      // Tick at 3s remaining: COUNTDOWN_TICK { seconds: 3 }
      clock.advanceBy(6000);
      scheduler.triggerTick();
      const count3 = events.filter((e) => e.type === 'COUNTDOWN_TICK' && (e as any).seconds === 3);
      expect(count3).toHaveLength(1);

      // Tick at 2s remaining: COUNTDOWN_TICK { seconds: 2 }
      clock.advanceBy(1000);
      scheduler.triggerTick();
      const count2 = events.filter((e) => e.type === 'COUNTDOWN_TICK' && (e as any).seconds === 2);
      expect(count2).toHaveLength(1);

      // Tick at 1s remaining: COUNTDOWN_TICK { seconds: 1 }
      clock.advanceBy(1000);
      scheduler.triggerTick();
      const count1 = events.filter((e) => e.type === 'COUNTDOWN_TICK' && (e as any).seconds === 1);
      expect(count1).toHaveLength(1);
    });

    it('22. Warnings reset correctly for a new segment', () => {
      const workout: Workout = {
        id: 'w_multi',
        title: 'Two Segments',
        type: 'SET',
        prepareDurationSec: 0,
        rounds: 1,
        restBetweenRoundsSec: 0,
        exercises: [{ id: 'e1', name: 'Work', sets: 2, workDurationSec: 5, restBetweenSetsSec: 5, restAfterExerciseSec: 0 }],
      };
      const engine = createEngine(workout);
      const events: EngineEvent[] = [];
      engine.subscribe((e) => events.push(e));

      engine.start(); // Set 1 (5s)

      // Tick through Set 1 countdown
      clock.advanceBy(2000); // 3s left
      scheduler.triggerTick();
      clock.advanceBy(1000); // 2s left
      scheduler.triggerTick();
      clock.advanceBy(1000); // 1s left
      scheduler.triggerTick();

      // Complete Set 1
      clock.advanceBy(1000);
      scheduler.triggerTick();

      // Now on Rest Set (5s), advance to 3s remaining
      clock.advanceBy(2000); // 3s left in Rest Set
      scheduler.triggerTick();

      const countdownTicks = events.filter((e) => e.type === 'COUNTDOWN_TICK');
      // Should have 3, 2, 1 from Set 1, and 3 from Rest Set (4 total)
      expect(countdownTicks).toHaveLength(4);
    });
  });

  it('23-24. No events continue after completion or manual end', () => {
    const engine = createEngine();
    const events: EngineEvent[] = [];
    engine.subscribe((e) => events.push(e));

    engine.start();
    engine.endWorkout();
    const countBefore = events.length;

    clock.advanceBy(10000);
    scheduler.triggerTick();

    expect(events.length).toBe(countBefore);
  });

  it('25. Delayed scheduler tick arrives after segment deadline', () => {
    const engine = createEngine();
    const events: EngineEvent[] = [];
    engine.subscribe((e) => events.push(e));

    engine.start(); // Prepare 5s, deadline at t=6000

    // Scheduler delayed: wakes at t=8000 (3s into Push-ups Set 1)
    clock.advanceBy(7000);
    scheduler.triggerTick();

    expect(engine.getSnapshot().currentSegmentIndex).toBe(1);
    expect(engine.getSnapshot().currentSegment?.id).toBe('r1_e0_s1_work');
    expect(engine.getSnapshot().remainingTimeMs).toBe(18000); // 20s - 2s overshoot
    expect(events.map((e) => e.type)).toContain('SEGMENT_COMPLETED');
    expect(events.map((e) => e.type)).toContain('SEGMENT_STARTED');
  });

  it('26. Multi-segment catch-up when large delay crosses multiple segments', () => {
    const workout: Workout = {
      id: 'w_fast',
      title: 'Fast',
      type: 'SET',
      prepareDurationSec: 2,
      rounds: 1,
      restBetweenRoundsSec: 0,
      exercises: [
        {
          id: 'e1',
          name: 'Ex',
          sets: 2,
          workDurationSec: 3,
          restBetweenSetsSec: 2,
          restAfterExerciseSec: 0,
        },
      ],
    };
    // Segments: Prepare 2s, Set1 Work 3s, Set1 Rest 2s, Set2 Work 3s = 10s total
    const engine = createEngine(workout);
    const events: EngineEvent[] = [];
    engine.subscribe((e) => events.push(e));

    engine.start(); // t=1000, on Prepare (2s)

    // Delay of 6 seconds: should cross Prepare (2s), Set1 Work (3s), and land 1s into Set1 Rest (2s)
    clock.advanceBy(6000);
    scheduler.triggerTick();

    expect(engine.getSnapshot().currentSegmentIndex).toBe(2);
    expect(engine.getSnapshot().currentSegment?.phase).toBe('REST_SET');
    expect(engine.getSnapshot().remainingTimeMs).toBe(1000);

    const startedSegments = events.filter((e) => e.type === 'SEGMENT_STARTED');
    const completedSegments = events.filter((e) => e.type === 'SEGMENT_COMPLETED');
    expect(startedSegments).toHaveLength(3); // Prepare, Set1 Work, Set1 Rest
    expect(completedSegments).toHaveLength(2); // Prepare, Set1 Work
  });

  it('27. Multiple subscribers receive events', () => {
    const engine = createEngine();
    const events1: EngineEvent[] = [];
    const events2: EngineEvent[] = [];

    engine.subscribe((e) => events1.push(e));
    engine.subscribe((e) => events2.push(e));

    engine.start();

    expect(events1.length).toBe(2);
    expect(events2.length).toBe(2);
  });

  it('28. Unsubscribe stops receiving events', () => {
    const engine = createEngine();
    const events: EngineEvent[] = [];

    const unsubscribe = engine.subscribe((e) => events.push(e));
    engine.start();
    expect(events.length).toBe(2);

    unsubscribe();
    engine.pause();
    expect(events.length).toBe(2);
  });

  it('29. Invalid / redundant commands are safely ignored', () => {
    const engine = createEngine();
    engine.start();
    engine.start(); // redundant start
    expect(engine.getSnapshot().status).toBe('RUNNING');

    engine.pause();
    engine.pause(); // redundant pause
    expect(engine.getSnapshot().status).toBe('PAUSED');

    engine.resume();
    engine.resume(); // redundant resume
    expect(engine.getSnapshot().status).toBe('RUNNING');
  });

  it('30. Snapshot correctness across entire lifecycle', () => {
    const engine = createEngine();
    engine.start();

    const snap = engine.getSnapshot();
    expect(snap.totalWorkoutDurationMs).toBe(55000);
    expect(snap.totalWorkoutDurationSec).toBe(55);
    expect(snap.currentSegment?.phase).toBe('PREPARE');
    expect(snap.progress).toBeCloseTo(0);
  });
});
