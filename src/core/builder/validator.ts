import { Workout } from '../models/workout';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateWorkout(workout: Workout): void {
  if (!workout) {
    throw new ValidationError('Workout must be defined');
  }

  if (typeof workout.id !== 'string' || workout.id.trim() === '') {
    throw new ValidationError('Workout ID must be a non-empty string');
  }

  if (typeof workout.title !== 'string' || workout.title.trim() === '') {
    throw new ValidationError('Workout title cannot be blank');
  }

  if (!Number.isInteger(workout.rounds) || workout.rounds < 1) {
    throw new ValidationError('Workout rounds must be an integer greater than or equal to 1');
  }

  if (!Number.isInteger(workout.prepareDurationSec) || workout.prepareDurationSec < 0) {
    throw new ValidationError('Workout prepareDurationSec must be a non-negative integer');
  }

  if (!Number.isInteger(workout.restBetweenRoundsSec) || workout.restBetweenRoundsSec < 0) {
    throw new ValidationError('Workout restBetweenRoundsSec must be a non-negative integer');
  }

  if (!Array.isArray(workout.exercises) || workout.exercises.length === 0) {
    throw new ValidationError('Workout must contain at least one exercise');
  }

  workout.exercises.forEach((exercise, index) => {
    const prefix = `Exercise at index ${index}`;

    if (!exercise) {
      throw new ValidationError(`${prefix} must be defined`);
    }

    if (typeof exercise.id !== 'string' || exercise.id.trim() === '') {
      throw new ValidationError(`${prefix} ID must be a non-empty string`);
    }

    if (typeof exercise.name !== 'string' || exercise.name.trim() === '') {
      throw new ValidationError(`${prefix} name must be a non-empty string`);
    }

    if (!Number.isInteger(exercise.sets) || exercise.sets < 1) {
      throw new ValidationError(`${prefix} sets must be an integer greater than or equal to 1`);
    }

    if (!Number.isInteger(exercise.workDurationSec) || exercise.workDurationSec < 1) {
      throw new ValidationError(`${prefix} workDurationSec must be an integer greater than or equal to 1`);
    }

    if (!Number.isInteger(exercise.restBetweenSetsSec) || exercise.restBetweenSetsSec < 0) {
      throw new ValidationError(`${prefix} restBetweenSetsSec must be a non-negative integer`);
    }

    if (!Number.isInteger(exercise.restAfterExerciseSec) || exercise.restAfterExerciseSec < 0) {
      throw new ValidationError(`${prefix} restAfterExerciseSec must be a non-negative integer`);
    }

    if (exercise.reps !== undefined && (!Number.isInteger(exercise.reps) || exercise.reps < 1)) {
      throw new ValidationError(`${prefix} reps must be an integer greater than or equal to 1 if specified`);
    }
  });
}
