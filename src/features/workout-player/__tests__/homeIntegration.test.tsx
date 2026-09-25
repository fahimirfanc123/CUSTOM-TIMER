import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from '../../../app/App';
import { CTRDatabase } from '../../../core/storage/db';
import { WorkoutRepository } from '../../../core/storage/workoutRepository';
import { WorkoutSessionController } from '../sessionController';
import { MockSoundEngine } from '../../../core/audio/soundEngine';
import { MockSpeechEngine } from '../../../core/audio/voiceCoach';
import { Workout } from '../../../core/models/workout';

describe('Home & Builder Integration (Module 5)', () => {
  let db: CTRDatabase;
  let repo: WorkoutRepository;
  let controller: WorkoutSessionController;
  let sound: MockSoundEngine;
  let voice: MockSpeechEngine;

  const testWorkout: Workout = {
    id: 'test-custom-1',
    title: 'Morning Flow',
    description: 'Quick morning mobility and activation',
    type: 'CUSTOM',
    prepareDurationSec: 5,
    rounds: 1,
    restBetweenRoundsSec: 0,
    exercises: [
      {
        id: 'e1',
        name: 'Cat Cow',
        sets: 1,
        workDurationSec: 30,
        restBetweenSetsSec: 0,
        restAfterExerciseSec: 10,
      },
    ],
  };

  beforeEach(async () => {
    db = new CTRDatabase(`test-home-db-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    repo = new WorkoutRepository(db);
    await db.open();

    sound = new MockSoundEngine();
    voice = new MockSpeechEngine();
    controller = new WorkoutSessionController({ soundEngine: sound, speechEngine: voice });
  });

  it('renders home screen with empty state when no workouts are saved', async () => {
    render(
      <App
        controller={controller}
        repository={repo}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/no custom workouts yet/i)).toBeDefined();
    });

    expect(screen.getByRole('heading', { name: /custom training timer/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /create new workout/i })).toBeDefined();
    expect(screen.getByText(/preset workouts/i)).toBeDefined();
  });

  it('navigates to WorkoutBuilder when Create Workout is clicked', async () => {
    render(
      <App
        controller={controller}
        repository={repo}
      />
    );

    const createBtn = screen.getByRole('button', { name: /create new workout/i });
    fireEvent.click(createBtn);

    expect(screen.getByRole('heading', { name: /create workout/i })).toBeDefined();
    expect(screen.getByLabelText(/workout title/i)).toBeDefined();
  });

  it('creates, saves a workout in builder, and shows it in My Workouts on Home', async () => {
    render(
      <App
        controller={controller}
        repository={repo}
      />
    );

    // Click Create Workout
    fireEvent.click(screen.getByRole('button', { name: /create new workout/i }));

    // Fill title
    const titleInput = screen.getByLabelText(/workout title/i);
    fireEvent.change(titleInput, { target: { value: 'Tabata Blast' } });

    // Save workout
    fireEvent.click(screen.getByRole('button', { name: /save workout/i }));

    await waitFor(() => {
      expect(screen.getByText(/workout saved successfully!/i)).toBeDefined();
    });

    // Back to home
    fireEvent.click(screen.getByRole('button', { name: /back to home/i }));

    // Verify it is displayed in My Workouts
    await waitFor(() => {
      expect(screen.getByText('Tabata Blast')).toBeDefined();
      expect(screen.queryByText(/no custom workouts yet/i)).toBeNull();
    });
  });

  it('loads saved workout into Builder when Edit button is clicked', async () => {
    await repo.save(testWorkout);

    render(
      <App
        controller={controller}
        repository={repo}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Morning Flow')).toBeDefined();
    });

    // Click Edit button
    const editBtn = screen.getByRole('button', { name: /edit morning flow/i });
    fireEvent.click(editBtn);

    expect(screen.getByRole('heading', { name: /edit workout/i })).toBeDefined();
    const titleInput = screen.getByLabelText(/workout title/i) as HTMLInputElement;
    expect(titleInput.value).toBe('Morning Flow');
  });

  it('duplicates saved workout from Home screen', async () => {
    await repo.save(testWorkout);

    render(
      <App
        controller={controller}
        repository={repo}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Morning Flow')).toBeDefined();
    });

    const duplicateBtn = screen.getByRole('button', { name: /duplicate morning flow/i });
    fireEvent.click(duplicateBtn);

    await waitFor(() => {
      expect(screen.getByText('Morning Flow (Copy)')).toBeDefined();
    });

    const allInDb = await repo.getAll();
    expect(allInDb).toHaveLength(2);
  });

  it('deletes saved workout from Home screen after confirmation', async () => {
    await repo.save(testWorkout);

    render(
      <App
        controller={controller}
        repository={repo}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Morning Flow')).toBeDefined();
    });

    const deleteBtn = screen.getByRole('button', { name: /delete morning flow/i });
    fireEvent.click(deleteBtn);

    // Confirm dialog
    expect(screen.getByRole('alertdialog')).toBeDefined();
    const confirmBtn = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.queryByText('Morning Flow')).toBeNull();
      expect(screen.getByText(/no custom workouts yet/i)).toBeDefined();
    });

    const allInDb = await repo.getAll();
    expect(allInDb).toHaveLength(0);
  });

  it('customizes preset workout by cloning into Builder', async () => {
    render(
      <App
        controller={controller}
        repository={repo}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('HIIT Circuit')).toBeDefined();
    });

    const customizeBtn = screen.getByRole('button', { name: /customize hiit circuit/i });
    fireEvent.click(customizeBtn);

    expect(screen.getByRole('heading', { name: /create workout/i })).toBeDefined();
    const titleInput = screen.getByLabelText(/workout title/i) as HTMLInputElement;
    expect(titleInput.value).toBe('HIIT Circuit (Custom)');
  });

  it('starts saved workout directly in active workout player', async () => {
    await repo.save(testWorkout);

    render(
      <App
        controller={controller}
        repository={repo}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Morning Flow')).toBeDefined();
    });

    const startBtn = screen.getByRole('button', { name: /start morning flow/i });
    fireEvent.click(startBtn);

    // Active workout player should now be mounted
    await waitFor(() => {
      expect(screen.getByRole('region', { name: /active workout/i })).toBeDefined();
      expect(screen.getByText(/get ready/i)).toBeDefined();
    });
  });
});
