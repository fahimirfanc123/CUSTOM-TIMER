import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CTRDatabase } from '../db';
import { WorkoutRepository } from '../workoutRepository';
import { Workout } from '../../models/workout';

describe('WorkoutRepository (IndexedDB Persistence)', () => {
  let db: CTRDatabase;
  let repo: WorkoutRepository;

  const sampleWorkout: Workout = {
    id: 'test-w1',
    title: 'Strength Endurance',
    description: 'A tough test circuit',
    type: 'CUSTOM',
    prepareDurationSec: 5,
    rounds: 2,
    restBetweenRoundsSec: 60,
    exercises: [
      {
        id: 'ex-1',
        name: 'Push-ups',
        sets: 3,
        workDurationSec: 40,
        restBetweenSetsSec: 30,
        restAfterExerciseSec: 30,
      },
      {
        id: 'ex-2',
        name: 'Pull-ups',
        sets: 3,
        workDurationSec: 30,
        restBetweenSetsSec: 30,
        restAfterExerciseSec: 45,
      },
    ],
  };

  beforeEach(async () => {
    db = new CTRDatabase(`test-db-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    repo = new WorkoutRepository(db);
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  it('saves a new workout and returns SavedWorkout record with timestamps', async () => {
    const saved = await repo.save(sampleWorkout);

    expect(saved.id).toBeDefined();
    expect(saved.workout.title).toBe('Strength Endurance');
    expect(saved.createdAt).toBeTypeOf('number');
    expect(saved.updatedAt).toBeTypeOf('number');
    expect(saved.createdAt).toBe(saved.updatedAt);
  });

  it('retrieves all saved workouts ordered by updatedAt desc', async () => {
    const w1 = { ...sampleWorkout, id: 'w1', title: 'First Workout' };
    const w2 = { ...sampleWorkout, id: 'w2', title: 'Second Workout' };

    await repo.save(w1);
    // slight delay for timestamp ordering
    await new Promise((r) => setTimeout(r, 10));
    await repo.save(w2);

    const all = await repo.getAll();
    expect(all).toHaveLength(2);
    expect(all[0].workout.title).toBe('Second Workout');
    expect(all[1].workout.title).toBe('First Workout');
  });

  it('retrieves a saved workout by ID', async () => {
    const saved = await repo.save(sampleWorkout);
    const retrieved = await repo.getById(saved.id);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(saved.id);
    expect(retrieved?.workout.title).toBe('Strength Endurance');
  });

  it('returns null when retrieving a non-existent ID', async () => {
    const retrieved = await repo.getById('non-existent-id');
    expect(retrieved).toBeNull();
  });

  it('updates an existing workout and updates updatedAt timestamp', async () => {
    const saved = await repo.save(sampleWorkout);
    const originalCreatedAt = saved.createdAt;

    await new Promise((r) => setTimeout(r, 15));

    const updatedWorkout: Workout = {
      ...saved.workout,
      title: 'Updated Strength Circuit',
      rounds: 4,
    };

    const updated = await repo.update(updatedWorkout);
    expect(updated.workout.title).toBe('Updated Strength Circuit');
    expect(updated.workout.rounds).toBe(4);
    expect(updated.createdAt).toBe(originalCreatedAt);
    expect(updated.updatedAt).toBeGreaterThan(originalCreatedAt);

    const fetched = await repo.getById(saved.id);
    expect(fetched?.workout.title).toBe('Updated Strength Circuit');
  });

  it('deletes a saved workout by ID', async () => {
    const saved = await repo.save(sampleWorkout);
    expect(await repo.getById(saved.id)).not.toBeNull();

    await repo.delete(saved.id);
    expect(await repo.getById(saved.id)).toBeNull();
  });

  it('duplicates a saved workout with new UUIDs and (Copy) in title', async () => {
    const original = await repo.save(sampleWorkout);
    const duplicated = await repo.duplicate(original.id);

    expect(duplicated.id).not.toBe(original.id);
    expect(duplicated.workout.id).not.toBe(original.workout.id);
    expect(duplicated.workout.title).toBe('Strength Endurance (Copy)');
    expect(duplicated.workout.exercises).toHaveLength(2);
    expect(duplicated.workout.exercises[0].id).not.toBe(original.workout.exercises[0].id);
    expect(duplicated.workout.exercises[1].id).not.toBe(original.workout.exercises[1].id);
    expect(duplicated.workout.exercises[0].name).toBe('Push-ups');

    const all = await repo.getAll();
    expect(all).toHaveLength(2);
  });

  it('throws error when duplicating non-existent workout', async () => {
    await expect(repo.duplicate('non-existent')).rejects.toThrow(
      'Workout with id non-existent not found'
    );
  });
});
