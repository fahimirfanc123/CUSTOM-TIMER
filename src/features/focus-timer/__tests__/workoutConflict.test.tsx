import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { App } from '../../../app/App';
import { FocusTimerController } from '../../../core/focus/focusTimerController';
import { WorkoutSessionController } from '../../workout-player/sessionController';
import { MockClock, ManualScheduler } from '../../../core/engine/clock';
import { MockFocusSoundEngine, MockFocusSpeechEngine } from '../../../core/focus/focusAudio';
import { MockSoundEngine } from '../../../core/audio/soundEngine';
import { MockSpeechEngine } from '../../../core/audio/voiceCoach';
import { demoWorkouts } from '../../workout-player/demoWorkouts';
import { IWorkoutRepository, SavedWorkout } from '../../../core/storage/workoutRepository';

class MockWorkoutRepo implements IWorkoutRepository {
  private items: SavedWorkout[] = [];
  async getAll(): Promise<SavedWorkout[]> { return [...this.items]; }
  async getById(id: string): Promise<SavedWorkout | null> { return this.items.find(i => i.id === id) ?? null; }
  async save(w: any): Promise<SavedWorkout> {
    const s: SavedWorkout = { id: w.id, workout: w, createdAt: Date.now(), updatedAt: Date.now() };
    this.items.push(s);
    return s;
  }
  async update(w: any): Promise<SavedWorkout> { return this.save(w); }
  async delete(id: string): Promise<void> { this.items = this.items.filter(i => i.id !== id); }
  async duplicate(id: string): Promise<SavedWorkout> {
    const target = this.items.find(i => i.id === id);
    return this.save({ ...target?.workout, id: `${id}-copy` });
  }
}

describe('Workout and Pomodoro Conflict Integration Tests (Module 7)', () => {
  let clock: MockClock;
  let scheduler: ManualScheduler;
  let focusSound: MockFocusSoundEngine;
  let focusSpeech: MockFocusSpeechEngine;
  let workoutSound: MockSoundEngine;
  let workoutSpeech: MockSpeechEngine;
  let focusController: FocusTimerController;
  let workoutController: WorkoutSessionController;
  let repo: MockWorkoutRepo;

  beforeEach(() => {
    clock = new MockClock(1000000);
    scheduler = new ManualScheduler();
    focusSound = new MockFocusSoundEngine();
    focusSpeech = new MockFocusSpeechEngine();
    workoutSound = new MockSoundEngine();
    workoutSpeech = new MockSpeechEngine();
    repo = new MockWorkoutRepo();

    focusController = new FocusTimerController({
      clock,
      scheduler,
      soundEngine: focusSound,
      speechEngine: focusSpeech,
      autoRestore: false,
    });

    workoutController = new WorkoutSessionController({
      clock,
      scheduler,
      soundEngine: workoutSound,
      speechEngine: workoutSpeech,
    });
  });

  afterEach(() => {
    focusController.dispose();
  });

  it('48. starting a workout while Focus runs prompts conflict dialog', async () => {
    await act(async () => {
      await focusController.startFocus();
    });
    expect(focusController.getSnapshot().status).toBe('RUNNING');

    await act(async () => {
      render(
        <App
          controller={workoutController}
          focusController={focusController}
          repository={repo}
          initialWorkouts={demoWorkouts}
        />
      );
    });

    const startBtns = screen.getAllByRole('button', { name: /start/i });
    const workoutStartBtn = startBtns.find(b => b.getAttribute('aria-label')?.includes('Start Quick Interval Timer') || b.textContent?.includes('Start'));
    expect(workoutStartBtn).toBeDefined();

    await act(async () => {
      fireEvent.click(workoutStartBtn!);
    });

    // Conflict dialog should appear
    expect(screen.getByRole('dialog', { name: /focus timer active/i })).toBeInTheDocument();
    expect(screen.getByText(/a focus timer is currently running/i)).toBeInTheDocument();
  });

  it('49. confirming conflict dialog pauses Focus and starts Workout', async () => {
    await act(async () => {
      await focusController.startFocus();
    });

    await act(async () => {
      render(
        <App
          controller={workoutController}
          focusController={focusController}
          repository={repo}
          initialWorkouts={demoWorkouts}
        />
      );
    });

    const startBtns = screen.getAllByRole('button', { name: /start/i });
    const workoutStartBtn = startBtns.find(b => b.getAttribute('aria-label')?.includes('Start Quick Interval Timer') || b.textContent?.includes('Start'));

    await act(async () => {
      fireEvent.click(workoutStartBtn!);
    });

    const confirmBtn = screen.getByRole('button', { name: /pause focus & start workout/i });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    // Focus must be PAUSED
    expect(focusController.getSnapshot().status).toBe('PAUSED');
    // Workout player is now active
    expect(workoutController.getSnapshot()?.status).toBe('RUNNING');
  });

  it('50. cancelling conflict dialog keeps Focus running without starting Workout', async () => {
    await act(async () => {
      await focusController.startFocus();
    });

    await act(async () => {
      render(
        <App
          controller={workoutController}
          focusController={focusController}
          repository={repo}
          initialWorkouts={demoWorkouts}
        />
      );
    });

    const startBtns = screen.getAllByRole('button', { name: /start/i });
    const workoutStartBtn = startBtns.find(b => b.getAttribute('aria-label')?.includes('Start Quick Interval Timer') || b.textContent?.includes('Start'));

    await act(async () => {
      fireEvent.click(workoutStartBtn!);
    });

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    await act(async () => {
      fireEvent.click(cancelBtn);
    });

    // Focus must remain RUNNING
    expect(focusController.getSnapshot().status).toBe('RUNNING');
    // Workout was NOT started
    expect(workoutController.getSnapshot()).toBeNull();
  });

  it('52. Pomodoro does not modify Workout TimerEngine state', async () => {
    await workoutController.startWorkout(demoWorkouts[0]);
    expect(workoutController.getSnapshot()?.status).toBe('RUNNING');

    // Manipulate focus controller
    focusController.updateConfig({ focusDurationSec: 50 * 60 });
    focusController.setLabel('Independent Task');

    // Workout engine remains unaffected
    expect(workoutController.getSnapshot()?.status).toBe('RUNNING');
    expect(workoutController.getWorkout()?.id).toBe(demoWorkouts[0].id);
  });

  it('53. Workout operations do not reset Pomodoro configuration', async () => {
    focusController.updateConfig({
      focusDurationSec: 50 * 60,
      shortBreakDurationSec: 10 * 60,
      sessionsBeforeLongBreak: 3,
    });

    await workoutController.startWorkout(demoWorkouts[0]);
    workoutController.pause();
    workoutController.resume();
    workoutController.endWorkout();

    const snapshot = focusController.getSnapshot();
    expect(snapshot.config.focusDurationSec).toBe(50 * 60);
    expect(snapshot.config.shortBreakDurationSec).toBe(10 * 60);
    expect(snapshot.config.sessionsBeforeLongBreak).toBe(3);
  });
});
