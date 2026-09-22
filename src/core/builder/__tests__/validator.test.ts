import { describe, it, expect } from 'vitest';
import { validateWorkout, ValidationError } from '../validator';
import { Workout } from '../../models/workout';

describe('Workout Validator', () => {
  const baseValidWorkout: Workout = {
    id: 'workout_1',
    title: 'Morning Push',
    description: 'Basic chest workout',
    type: 'CUSTOM',
    prepareDurationSec: 5,
    rounds: 2,
    restBetweenRoundsSec: 60,
    exercises: [
      {
        id: 'ex_1',
        name: 'Push-ups',
        sets: 3,
        workDurationSec: 40,
        restBetweenSetsSec: 30,
        restAfterExerciseSec: 45,
        reps: 15,
      },
    ],
  };

  it('accepts a valid workout configuration', () => {
    expect(() => validateWorkout(baseValidWorkout)).not.toThrow();
  });

  it('accepts a valid workout with 0 rest and 0 prepare durations', () => {
    const zeroRestWorkout: Workout = {
      ...baseValidWorkout,
      prepareDurationSec: 0,
      restBetweenRoundsSec: 0,
      exercises: [
        {
          id: 'ex_1',
          name: 'Sprint',
          sets: 1,
          workDurationSec: 30,
          restBetweenSetsSec: 0,
          restAfterExerciseSec: 0,
        },
      ],
    };
    expect(() => validateWorkout(zeroRestWorkout)).not.toThrow();
  });

  it('rejects an undefined or null workout', () => {
    expect(() => validateWorkout(null as unknown as Workout)).toThrow(ValidationError);
    expect(() => validateWorkout(undefined as unknown as Workout)).toThrow(ValidationError);
  });

  it('rejects empty or whitespace-only workout ID', () => {
    expect(() => validateWorkout({ ...baseValidWorkout, id: '' })).toThrow(ValidationError);
    expect(() => validateWorkout({ ...baseValidWorkout, id: '   ' })).toThrow(ValidationError);
  });

  it('rejects empty or whitespace-only workout title', () => {
    expect(() => validateWorkout({ ...baseValidWorkout, title: '' })).toThrow(ValidationError);
    expect(() => validateWorkout({ ...baseValidWorkout, title: '   ' })).toThrow(ValidationError);
  });

  it('rejects non-integer or less than 1 workout rounds', () => {
    expect(() => validateWorkout({ ...baseValidWorkout, rounds: 0 })).toThrow(ValidationError);
    expect(() => validateWorkout({ ...baseValidWorkout, rounds: -1 })).toThrow(ValidationError);
    expect(() => validateWorkout({ ...baseValidWorkout, rounds: 1.5 })).toThrow(ValidationError);
  });

  it('rejects negative prepareDurationSec', () => {
    expect(() => validateWorkout({ ...baseValidWorkout, prepareDurationSec: -1 })).toThrow(ValidationError);
    expect(() => validateWorkout({ ...baseValidWorkout, prepareDurationSec: 2.5 })).toThrow(ValidationError);
  });

  it('rejects negative restBetweenRoundsSec', () => {
    expect(() => validateWorkout({ ...baseValidWorkout, restBetweenRoundsSec: -5 })).toThrow(ValidationError);
  });

  it('rejects empty exercise list', () => {
    expect(() => validateWorkout({ ...baseValidWorkout, exercises: [] })).toThrow(ValidationError);
  });

  it('rejects empty or whitespace-only exercise ID and name', () => {
    const invalidExerciseId: Workout = {
      ...baseValidWorkout,
      exercises: [{ ...baseValidWorkout.exercises[0], id: '' }],
    };
    expect(() => validateWorkout(invalidExerciseId)).toThrow(ValidationError);

    const invalidExerciseName: Workout = {
      ...baseValidWorkout,
      exercises: [{ ...baseValidWorkout.exercises[0], name: '   ' }],
    };
    expect(() => validateWorkout(invalidExerciseName)).toThrow(ValidationError);
  });

  it('rejects non-integer or less than 1 exercise sets', () => {
    const invalidSets: Workout = {
      ...baseValidWorkout,
      exercises: [{ ...baseValidWorkout.exercises[0], sets: 0 }],
    };
    expect(() => validateWorkout(invalidSets)).toThrow(ValidationError);
  });

  it('rejects non-integer or less than 1 exercise workDurationSec', () => {
    const invalidWorkDuration: Workout = {
      ...baseValidWorkout,
      exercises: [{ ...baseValidWorkout.exercises[0], workDurationSec: 0 }],
    };
    expect(() => validateWorkout(invalidWorkDuration)).toThrow(ValidationError);

    const negativeWorkDuration: Workout = {
      ...baseValidWorkout,
      exercises: [{ ...baseValidWorkout.exercises[0], workDurationSec: -10 }],
    };
    expect(() => validateWorkout(negativeWorkDuration)).toThrow(ValidationError);
  });

  it('rejects negative rest durations for exercise', () => {
    const negativeSetRest: Workout = {
      ...baseValidWorkout,
      exercises: [{ ...baseValidWorkout.exercises[0], restBetweenSetsSec: -1 }],
    };
    expect(() => validateWorkout(negativeSetRest)).toThrow(ValidationError);

    const negativeExerciseRest: Workout = {
      ...baseValidWorkout,
      exercises: [{ ...baseValidWorkout.exercises[0], restAfterExerciseSec: -1 }],
    };
    expect(() => validateWorkout(negativeExerciseRest)).toThrow(ValidationError);
  });

  it('rejects invalid reps when specified', () => {
    const zeroReps: Workout = {
      ...baseValidWorkout,
      exercises: [{ ...baseValidWorkout.exercises[0], reps: 0 }],
    };
    expect(() => validateWorkout(zeroReps)).toThrow(ValidationError);

    const floatReps: Workout = {
      ...baseValidWorkout,
      exercises: [{ ...baseValidWorkout.exercises[0], reps: 10.5 }],
    };
    expect(() => validateWorkout(floatReps)).toThrow(ValidationError);
  });
});
