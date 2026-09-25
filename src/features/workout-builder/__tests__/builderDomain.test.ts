import { describe, it, expect } from 'vitest';
import { builderReducer, createInitialWorkout } from '../builderReducer';
import { calculateWorkoutMetrics } from '../WorkoutSummary';
import { buildSegmentQueue } from '../../../core/builder/segmentBuilder';
import { BuilderState } from '../types';

describe('Workout Builder Domain & Reducer', () => {
  const initialState: BuilderState = {
    workout: createInitialWorkout(),
    isDirty: false,
    editingSavedId: null,
  };

  it('updates title and description and sets isDirty to true', () => {
    let state = builderReducer(initialState, { type: 'SET_TITLE', payload: 'HIIT Blast' });
    expect(state.workout.title).toBe('HIIT Blast');
    expect(state.isDirty).toBe(true);

    state = builderReducer(state, { type: 'SET_DESCRIPTION', payload: 'Intense 20 min burner' });
    expect(state.workout.description).toBe('Intense 20 min burner');
  });

  it('updates prepare duration, rounds, and rest between rounds', () => {
    let state = builderReducer(initialState, { type: 'SET_PREPARE_DURATION', payload: 10 });
    expect(state.workout.prepareDurationSec).toBe(10);
    expect(state.isDirty).toBe(true);

    state = builderReducer(state, { type: 'SET_ROUNDS', payload: 3 });
    expect(state.workout.rounds).toBe(3);

    state = builderReducer(state, { type: 'SET_REST_BETWEEN_ROUNDS', payload: 90 });
    expect(state.workout.restBetweenRoundsSec).toBe(90);
  });

  it('adds exercises and appends with default values', () => {
    expect(initialState.workout.exercises).toHaveLength(1);

    const state = builderReducer(initialState, { type: 'ADD_EXERCISE' });
    expect(state.workout.exercises).toHaveLength(2);
    expect(state.workout.exercises[1].name).toBe('Exercise 2');
    expect(state.workout.exercises[1].sets).toBe(3);
    expect(state.workout.exercises[1].workDurationSec).toBe(30);
    expect(state.isDirty).toBe(true);
  });

  it('updates an exercise by index', () => {
    const state = builderReducer(initialState, {
      type: 'UPDATE_EXERCISE',
      payload: {
        index: 0,
        exercise: { name: 'Burpees', workDurationSec: 45, sets: 4, reps: 15 },
      },
    });

    expect(state.workout.exercises[0].name).toBe('Burpees');
    expect(state.workout.exercises[0].workDurationSec).toBe(45);
    expect(state.workout.exercises[0].sets).toBe(4);
    expect(state.workout.exercises[0].reps).toBe(15);
    expect(state.isDirty).toBe(true);
  });

  it('duplicates an exercise at index and inserts directly below', () => {
    let state = builderReducer(initialState, {
      type: 'UPDATE_EXERCISE',
      payload: { index: 0, exercise: { name: 'Squats', workDurationSec: 40 } },
    });

    state = builderReducer(state, { type: 'DUPLICATE_EXERCISE', payload: 0 });

    expect(state.workout.exercises).toHaveLength(2);
    expect(state.workout.exercises[0].name).toBe('Squats');
    expect(state.workout.exercises[1].name).toBe('Squats Copy');
    expect(state.workout.exercises[1].workDurationSec).toBe(40);
    expect(state.workout.exercises[1].id).not.toBe(state.workout.exercises[0].id);
  });

  it('deletes an exercise by index', () => {
    let state = builderReducer(initialState, { type: 'ADD_EXERCISE' });
    expect(state.workout.exercises).toHaveLength(2);

    state = builderReducer(state, { type: 'DELETE_EXERCISE', payload: 0 });
    expect(state.workout.exercises).toHaveLength(1);
    expect(state.workout.exercises[0].name).toBe('Exercise 2');
  });

  it('moves exercises up and down in the list', () => {
    let state = builderReducer(initialState, { type: 'ADD_EXERCISE' });
    state = builderReducer(state, {
      type: 'UPDATE_EXERCISE',
      payload: { index: 0, exercise: { name: 'Ex A' } },
    });
    state = builderReducer(state, {
      type: 'UPDATE_EXERCISE',
      payload: { index: 1, exercise: { name: 'Ex B' } },
    });

    // Move Ex B up (index 1 -> 0)
    state = builderReducer(state, { type: 'MOVE_EXERCISE_UP', payload: 1 });
    expect(state.workout.exercises[0].name).toBe('Ex B');
    expect(state.workout.exercises[1].name).toBe('Ex A');

    // Move Ex B down (index 0 -> 1)
    state = builderReducer(state, { type: 'MOVE_EXERCISE_DOWN', payload: 0 });
    expect(state.workout.exercises[0].name).toBe('Ex A');
    expect(state.workout.exercises[1].name).toBe('Ex B');
  });

  it('loads an existing saved workout with clean dirty flag', () => {
    const customWorkout = {
      ...createInitialWorkout(),
      title: 'Loaded Circuit',
      rounds: 3,
    };

    const state = builderReducer(initialState, {
      type: 'LOAD_WORKOUT',
      payload: { workout: customWorkout, savedId: 'saved-123', createdAt: 1000 },
    });

    expect(state.workout.title).toBe('Loaded Circuit');
    expect(state.workout.rounds).toBe(3);
    expect(state.editingSavedId).toBe('saved-123');
    expect(state.createdAt).toBe(1000);
    expect(state.isDirty).toBe(false);
  });

  it('calculates workout metrics accurately matching SegmentBuilder output', () => {
    const workout = {
      ...createInitialWorkout(),
      title: 'Metrics Test',
      prepareDurationSec: 5,
      rounds: 2,
      restBetweenRoundsSec: 60,
      exercises: [
        {
          id: '1',
          name: 'Push-ups',
          sets: 2,
          workDurationSec: 30,
          restBetweenSetsSec: 20,
          restAfterExerciseSec: 30,
        },
        {
          id: '2',
          name: 'Squats',
          sets: 2,
          workDurationSec: 40,
          restBetweenSetsSec: 20,
          restAfterExerciseSec: 30,
        },
      ],
    };

    const metrics = calculateWorkoutMetrics(workout);
    expect(metrics.totalExercises).toBe(2);
    expect(metrics.totalRounds).toBe(2);
    expect(metrics.totalSteps).toBe(4); // 2 exercises * 2 rounds
    expect(metrics.totalSets).toBe(8); // (2 sets + 2 sets) * 2 rounds
    expect(metrics.isValid).toBe(true);

    // Verify estimated duration matches actual buildSegmentQueue sum
    const segments = buildSegmentQueue(workout);
    const expectedDuration = segments.reduce((sum, s) => sum + s.durationSec, 0);
    expect(metrics.estimatedDurationSec).toBe(expectedDuration);
  });
});
