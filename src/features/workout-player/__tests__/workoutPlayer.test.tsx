import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../../app/App';
import { WorkoutSessionController } from '../sessionController';
import { MockClock, ManualScheduler } from '../../../core/engine/clock';
import { MockSoundEngine } from '../../../core/audio/soundEngine';
import { MockSpeechEngine } from '../../../core/audio/voiceCoach';
import { Workout } from '../../../core/models/workout';

describe('Module 4 — Workout Player Integration Tests', () => {
  let clock: MockClock;
  let scheduler: ManualScheduler;
  let soundEngine: MockSoundEngine;
  let speechEngine: MockSpeechEngine;
  let controller: WorkoutSessionController;

  const simpleTestWorkout: Workout = {
    id: 'test-workout',
    title: 'Test Workout',
    description: 'A test workout',
    type: 'SIMPLE',
    prepareDurationSec: 5,
    rounds: 2,
    restBetweenRoundsSec: 15,
    exercises: [
      {
        id: 'ex-1',
        name: 'Push-ups',
        sets: 2,
        workDurationSec: 20,
        restBetweenSetsSec: 10,
        restAfterExerciseSec: 15,
      },
      {
        id: 'ex-2',
        name: 'Squats',
        sets: 2,
        workDurationSec: 25,
        restBetweenSetsSec: 10,
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

  // 1. Home screen renders demo workouts
  it('1. Home screen renders title, subtitle, and demo workouts', () => {
    render(<App controller={controller} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('CTR');
    expect(screen.getByText('Custom Training Timer')).toBeInTheDocument();
    expect(screen.getByText('Quick Timer')).toBeInTheDocument();
    expect(screen.getByText('Boxing')).toBeInTheDocument();
    expect(screen.getByText('HIIT Circuit')).toBeInTheDocument();
    expect(screen.getByText('Strength Training')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /start workout/i })[0]).toBeInTheDocument();
  });

  // 2. Starting workout creates a valid segment queue
  it('2. Starting workout creates a valid segment queue', async () => {
    const snapshot = await controller.startWorkout(simpleTestWorkout);
    expect(snapshot).not.toBeNull();
    expect(snapshot.currentSegment).not.toBeNull();
    expect(snapshot.currentSegment?.phase).toBe('PREPARE');
    expect(snapshot.currentSegment?.durationSec).toBe(5);
    expect(snapshot.totalWorkoutDurationSec).toBeGreaterThan(0);
  });

  // 3. Start enters active workout
  it('3. Start enters active workout screen', async () => {
    render(<App controller={controller} initialWorkouts={[simpleTestWorkout]} />);

    const startBtn = screen.getByRole('button', { name: /start workout/i });
    await userEvent.click(startBtn);

    // Active workout screen should now display prepare phase and timer
    expect(screen.getByText('GET READY')).toBeInTheDocument();
    expect(screen.getByText('00:05')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pause workout/i })).toBeInTheDocument();
  });

  // 4. Timer snapshot updates UI
  it('4. Timer snapshot updates UI upon clock progression', async () => {
    render(<App controller={controller} initialWorkouts={[simpleTestWorkout]} />);
    await userEvent.click(screen.getByRole('button', { name: /start workout/i }));

    expect(screen.getByText('00:05')).toBeInTheDocument();

    act(() => {
      clock.advanceBy(2000);
      scheduler.triggerTick();
    });

    expect(screen.getByText('00:03')).toBeInTheDocument();
  });

  // 5. Pause freezes display
  it('5. Pause freezes display and updates state to PAUSED', async () => {
    render(<App controller={controller} initialWorkouts={[simpleTestWorkout]} />);
    await userEvent.click(screen.getByRole('button', { name: /start workout/i }));

    const pauseBtn = screen.getByRole('button', { name: /pause workout/i });
    await userEvent.click(pauseBtn);

    expect(screen.getByText('PAUSED')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /resume workout/i })).toBeInTheDocument();

    // Advancing clock while paused should not change remaining time
    act(() => {
      clock.advanceBy(3000);
      scheduler.triggerTick();
    });

    expect(screen.getByText('00:05')).toBeInTheDocument();
  });

  // 6. Resume continues
  it('6. Resume continues countdown', async () => {
    render(<App controller={controller} initialWorkouts={[simpleTestWorkout]} />);
    await userEvent.click(screen.getByRole('button', { name: /start workout/i }));

    // Pause
    await userEvent.click(screen.getByRole('button', { name: /pause workout/i }));
    expect(screen.getByText('PAUSED')).toBeInTheDocument();

    // Resume
    await userEvent.click(screen.getByRole('button', { name: /resume workout/i }));
    expect(screen.queryByText('PAUSED')).not.toBeInTheDocument();

    act(() => {
      clock.advanceBy(2000);
      scheduler.triggerTick();
    });

    expect(screen.getByText('00:03')).toBeInTheDocument();
  });

  // 7. Skip changes segment
  it('7. Skip changes segment to next in queue', async () => {
    render(<App controller={controller} initialWorkouts={[simpleTestWorkout]} />);
    await userEvent.click(screen.getByRole('button', { name: /start workout/i }));

    expect(screen.getByText('GET READY')).toBeInTheDocument();

    const skipBtn = screen.getByRole('button', { name: /skip to next segment/i });
    await userEvent.click(skipBtn);

    // After PREPARE (5s), skips to Push-ups Set 1 WORK (20s)
    expect(screen.getByText('WORK')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /push-ups/i })).toBeInTheDocument();
    expect(screen.getByText('00:20')).toBeInTheDocument();
  });

  // 8. Previous changes segment
  it('8. Previous changes segment to earlier in queue', async () => {
    render(<App controller={controller} initialWorkouts={[simpleTestWorkout]} />);
    await userEvent.click(screen.getByRole('button', { name: /start workout/i }));

    // Skip to Push-ups WORK
    await userEvent.click(screen.getByRole('button', { name: /skip to next segment/i }));
    expect(screen.getByRole('heading', { name: /push-ups/i })).toBeInTheDocument();
    expect(screen.getByText('00:20')).toBeInTheDocument();

    // Previous should go back to PREPARE
    const prevBtn = screen.getByRole('button', { name: /previous segment/i });
    await userEvent.click(prevBtn);

    expect(screen.getByText('GET READY')).toBeInTheDocument();
    expect(screen.getByText('00:05')).toBeInTheDocument();
  });

  // 9. Restart restores segment duration
  it('9. Restart restores segment duration', async () => {
    render(<App controller={controller} initialWorkouts={[simpleTestWorkout]} />);
    await userEvent.click(screen.getByRole('button', { name: /start workout/i }));

    act(() => {
      clock.advanceBy(3000);
      scheduler.triggerTick();
    });
    expect(screen.getByText('00:02')).toBeInTheDocument();

    const restartBtn = screen.getByRole('button', { name: /restart current segment/i });
    await userEvent.click(restartBtn);

    expect(screen.getByText('00:05')).toBeInTheDocument();
  });

  // 10. +10 updates timer
  it('10. +10 updates timer', async () => {
    render(<App controller={controller} initialWorkouts={[simpleTestWorkout]} />);
    await userEvent.click(screen.getByRole('button', { name: /start workout/i }));

    expect(screen.getByText('00:05')).toBeInTheDocument();

    const add10Btn = screen.getByRole('button', { name: /add 10 seconds/i });
    await userEvent.click(add10Btn);

    expect(screen.getByText('00:15')).toBeInTheDocument();
  });

  // 11. -10 updates timer
  it('11. -10 updates timer', async () => {
    render(<App controller={controller} initialWorkouts={[simpleTestWorkout]} />);
    await userEvent.click(screen.getByRole('button', { name: /start workout/i }));

    // Add 10s first so we have 15s
    await userEvent.click(screen.getByRole('button', { name: /add 10 seconds/i }));
    expect(screen.getByText('00:15')).toBeInTheDocument();

    // Subtract 10s
    const sub10Btn = screen.getByRole('button', { name: /subtract 10 seconds/i });
    await userEvent.click(sub10Btn);

    expect(screen.getByText('00:05')).toBeInTheDocument();
  });

  // 12. +30 updates timer
  it('12. +30 updates timer', async () => {
    render(<App controller={controller} initialWorkouts={[simpleTestWorkout]} />);
    await userEvent.click(screen.getByRole('button', { name: /start workout/i }));

    const add30Btn = screen.getByRole('button', { name: /add 30 seconds/i });
    await userEvent.click(add30Btn);

    expect(screen.getByText('00:35')).toBeInTheDocument();
  });

  // 13. Rest screen displays next target
  it('13. Rest screen displays next target and upcoming set', async () => {
    render(<App controller={controller} initialWorkouts={[simpleTestWorkout]} />);
    await userEvent.click(screen.getByRole('button', { name: /start workout/i }));

    // Skip PREPARE -> Push-ups Set 1 WORK
    await userEvent.click(screen.getByRole('button', { name: /skip to next segment/i }));
    // Skip Push-ups Set 1 WORK -> REST_SET (10s)
    await userEvent.click(screen.getByRole('button', { name: /skip to next segment/i }));

    // Now in REST phase
    expect(screen.getByText('REST')).toBeInTheDocument();
    expect(screen.getByText('00:10')).toBeInTheDocument();
    expect(screen.getByText('NEXT')).toBeInTheDocument();
    expect(screen.getAllByText(/push-ups/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/SET 2 \/ 2/i)).toBeInTheDocument();
  });

  // 14. Correct set displayed
  it('14. Correct set displayed in metrics', async () => {
    render(<App controller={controller} initialWorkouts={[simpleTestWorkout]} />);
    await userEvent.click(screen.getByRole('button', { name: /start workout/i }));

    // PREPARE is set 1 / 2 of first exercise
    expect(screen.getByLabelText(/set 1 of 2/i)).toBeInTheDocument();

    // Skip to Push-ups Set 1 WORK
    await userEvent.click(screen.getByRole('button', { name: /skip to next segment/i }));
    expect(screen.getByLabelText(/set 1 of 2/i)).toBeInTheDocument();

    // Skip to REST_SET -> then Set 2 WORK
    await userEvent.click(screen.getByRole('button', { name: /skip to next segment/i }));
    await userEvent.click(screen.getByRole('button', { name: /skip to next segment/i }));
    expect(screen.getByLabelText(/set 2 of 2/i)).toBeInTheDocument();
  });

  // 15. Correct round displayed
  it('15. Correct round displayed in metrics', async () => {
    render(<App controller={controller} initialWorkouts={[simpleTestWorkout]} />);
    await userEvent.click(screen.getByRole('button', { name: /start workout/i }));

    expect(screen.getByLabelText(/round 1 of 2/i)).toBeInTheDocument();
  });

  // 16. Correct step displayed
  it('16. Correct step displayed in metrics', async () => {
    render(<App controller={controller} initialWorkouts={[simpleTestWorkout]} />);
    await userEvent.click(screen.getByRole('button', { name: /start workout/i }));

    // 2 exercises * 2 rounds = 4 total steps
    expect(screen.getByLabelText(/step 1 of 4/i)).toBeInTheDocument();
  });

  // 17. Completion screen appears after natural completion
  it('17. Completion screen appears after natural completion', async () => {
    const quickWorkout: Workout = {
      id: 'quick-done',
      title: 'Quick Done',
      type: 'SIMPLE',
      prepareDurationSec: 0,
      rounds: 1,
      restBetweenRoundsSec: 0,
      exercises: [
        {
          id: 'q1',
          name: 'Plank',
          sets: 1,
          workDurationSec: 5,
          restBetweenSetsSec: 0,
          restAfterExerciseSec: 0,
        },
      ],
    };

    render(<App controller={controller} initialWorkouts={[quickWorkout]} />);
    await userEvent.click(screen.getByRole('button', { name: /start workout/i }));

    expect(screen.getByText('00:05')).toBeInTheDocument();

    // Advance past 5s
    act(() => {
      clock.advanceBy(5100);
      scheduler.triggerTick();
    });

    // WorkoutComplete screen should now show
    expect(screen.getByText('WORKOUT COMPLETE')).toBeInTheDocument();
    expect(screen.getByText('Quick Done')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /done with workout/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /restart workout/i })).toBeInTheDocument();
  });

  // 18. Manual End does not show natural completion incorrectly
  it('18. Manual End returns to home without showing natural completion', async () => {
    render(<App controller={controller} initialWorkouts={[simpleTestWorkout]} />);
    await userEvent.click(screen.getByRole('button', { name: /start workout/i }));

    // Click End Workout
    const endBtn = screen.getByRole('button', { name: /end workout/i });
    await userEvent.click(endBtn);

    // Dialog should appear
    expect(screen.getByText('End workout?')).toBeInTheDocument();

    // Confirm end
    const confirmBtn = screen.getByRole('button', { name: /confirm end workout/i });
    await userEvent.click(confirmBtn);

    // Should return to Home, not Workout Complete
    expect(screen.queryByText('WORKOUT COMPLETE')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start workout/i })).toBeInTheDocument();
  });

  // 19. End confirmation works (Cancel keeps active, Confirm ends)
  it('19. End confirmation dialog Cancel keeps session active', async () => {
    render(<App controller={controller} initialWorkouts={[simpleTestWorkout]} />);
    await userEvent.click(screen.getByRole('button', { name: /start workout/i }));

    // Click End Workout
    await userEvent.click(screen.getByRole('button', { name: /end workout/i }));
    expect(screen.getByText('End workout?')).toBeInTheDocument();

    // Click Cancel
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    // Dialog closes, active workout continues
    expect(screen.queryByText('End workout?')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pause workout/i })).toBeInTheDocument();
  });

  // 20. Voice toggle updates audio settings
  it('20. Voice toggle updates audio settings', async () => {
    render(<App controller={controller} initialWorkouts={[simpleTestWorkout]} />);
    await userEvent.click(screen.getByRole('button', { name: /start workout/i }));

    expect(controller.getAudioSettings().voiceEnabled).toBe(true);

    const voiceBtn = screen.getByRole('button', { name: /disable voice coach/i });
    await userEvent.click(voiceBtn);

    expect(controller.getAudioSettings().voiceEnabled).toBe(false);

    // Toggle back on
    const voiceOnBtn = screen.getByRole('button', { name: /enable voice coach/i });
    await userEvent.click(voiceOnBtn);
    expect(controller.getAudioSettings().voiceEnabled).toBe(true);
  });

  // 21. Sound toggle updates audio settings
  it('21. Sound toggle updates audio settings', async () => {
    render(<App controller={controller} initialWorkouts={[simpleTestWorkout]} />);
    await userEvent.click(screen.getByRole('button', { name: /start workout/i }));

    expect(controller.getAudioSettings().soundEnabled).toBe(true);

    const soundBtn = screen.getByRole('button', { name: /disable sound effects/i });
    await userEvent.click(soundBtn);

    expect(controller.getAudioSettings().soundEnabled).toBe(false);

    // Toggle back on
    const soundOnBtn = screen.getByRole('button', { name: /enable sound effects/i });
    await userEvent.click(soundOnBtn);
    expect(controller.getAudioSettings().soundEnabled).toBe(true);
  });

  // 22. Keyboard pause shortcut
  it('22. Keyboard Space shortcut pauses and resumes workout', async () => {
    render(<App controller={controller} initialWorkouts={[simpleTestWorkout]} />);
    await userEvent.click(screen.getByRole('button', { name: /start workout/i }));

    // Press Space to pause
    fireEvent.keyDown(window, { code: 'Space' });
    expect(screen.getByText('PAUSED')).toBeInTheDocument();

    // Press Space to resume
    fireEvent.keyDown(window, { code: 'Space' });
    expect(screen.queryByText('PAUSED')).not.toBeInTheDocument();
  });

  // 23. Keyboard next shortcut
  it('23. Keyboard ArrowRight shortcut skips to next segment', async () => {
    render(<App controller={controller} initialWorkouts={[simpleTestWorkout]} />);
    await userEvent.click(screen.getByRole('button', { name: /start workout/i }));

    expect(screen.getByText('GET READY')).toBeInTheDocument();

    fireEvent.keyDown(window, { code: 'ArrowRight' });
    expect(screen.getByText('WORK')).toBeInTheDocument();
  });

  // 24. Keyboard previous shortcut
  it('24. Keyboard ArrowLeft shortcut goes to previous segment', async () => {
    render(<App controller={controller} initialWorkouts={[simpleTestWorkout]} />);
    await userEvent.click(screen.getByRole('button', { name: /start workout/i }));

    // Skip to WORK
    fireEvent.keyDown(window, { code: 'ArrowRight' });
    expect(screen.getByText('WORK')).toBeInTheDocument();

    // Press ArrowLeft to go back to PREPARE
    fireEvent.keyDown(window, { code: 'ArrowLeft' });
    expect(screen.getByText('GET READY')).toBeInTheDocument();
  });

  // 25. Controller disposes subscriptions correctly
  it('25. Controller disposes subscriptions and state correctly', async () => {
    const listener = vi.fn();
    const unsub = controller.subscribe(listener);

    await controller.startWorkout(simpleTestWorkout);
    expect(listener).toHaveBeenCalled();

    unsub();
    listener.mockClear();

    controller.addTime(10);
    expect(listener).not.toHaveBeenCalled();

    controller.dispose();
    expect(controller.getSnapshot()).toBeNull();
  });

  // 26. Audio failure does not prevent workout
  it('26. Audio initialization failure does not prevent workout from starting', async () => {
    const failingSoundEngine = new MockSoundEngine();
    vi.spyOn(failingSoundEngine, 'unlock').mockRejectedValue(new Error('Audio permission denied'));

    const brokenAudioController = new WorkoutSessionController({
      clock,
      scheduler,
      soundEngine: failingSoundEngine,
      speechEngine,
    });

    const snapshot = await brokenAudioController.startWorkout(simpleTestWorkout);
    expect(snapshot).not.toBeNull();
    expect(snapshot.status).toBe('RUNNING');
    expect(snapshot.currentSegment?.phase).toBe('PREPARE');
  });

  // 27. Wake Lock unsupported does not prevent workout
  it('27. Wake Lock unsupported does not crash or prevent workout', async () => {
    // navigator.wakeLock is undefined in jsdom default
    expect(typeof navigator.wakeLock).toBe('undefined');

    render(<App controller={controller} initialWorkouts={[simpleTestWorkout]} />);
    await userEvent.click(screen.getByRole('button', { name: /start workout/i }));

    expect(screen.getByText('GET READY')).toBeInTheDocument();
    expect(screen.getByText('00:05')).toBeInTheDocument();
  });
});
