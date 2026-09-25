import { Workout, Exercise } from '../../core/models/workout';
import { generateId } from '../../core/storage/workoutRepository';
import { BuilderState, BuilderAction } from './types';

export function createDefaultExercise(name = 'New Exercise'): Exercise {
  return {
    id: generateId(),
    name,
    sets: 3,
    workDurationSec: 30,
    restBetweenSetsSec: 30,
    restAfterExerciseSec: 30,
  };
}

export function createInitialWorkout(): Workout {
  return {
    id: generateId(),
    title: '',
    description: '',
    type: 'CUSTOM',
    prepareDurationSec: 5,
    rounds: 1,
    restBetweenRoundsSec: 60,
    exercises: [createDefaultExercise('Exercise 1')],
  };
}

export const initialBuilderState: BuilderState = {
  workout: createInitialWorkout(),
  isDirty: false,
  editingSavedId: null,
};

export function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case 'SET_TITLE':
      return {
        ...state,
        isDirty: true,
        workout: {
          ...state.workout,
          title: action.payload,
        },
      };

    case 'SET_DESCRIPTION':
      return {
        ...state,
        isDirty: true,
        workout: {
          ...state.workout,
          description: action.payload,
        },
      };

    case 'SET_PREPARE_DURATION':
      return {
        ...state,
        isDirty: true,
        workout: {
          ...state.workout,
          prepareDurationSec: action.payload,
        },
      };

    case 'SET_ROUNDS':
      return {
        ...state,
        isDirty: true,
        workout: {
          ...state.workout,
          rounds: action.payload,
        },
      };

    case 'SET_REST_BETWEEN_ROUNDS':
      return {
        ...state,
        isDirty: true,
        workout: {
          ...state.workout,
          restBetweenRoundsSec: action.payload,
        },
      };

    case 'ADD_EXERCISE': {
      const newEx = createDefaultExercise(`Exercise ${state.workout.exercises.length + 1}`);
      return {
        ...state,
        isDirty: true,
        workout: {
          ...state.workout,
          exercises: [...state.workout.exercises, newEx],
        },
      };
    }

    case 'UPDATE_EXERCISE': {
      const { index, exercise } = action.payload;
      if (index < 0 || index >= state.workout.exercises.length) return state;

      const newExercises = [...state.workout.exercises];
      newExercises[index] = {
        ...newExercises[index],
        ...exercise,
      };

      return {
        ...state,
        isDirty: true,
        workout: {
          ...state.workout,
          exercises: newExercises,
        },
      };
    }

    case 'DELETE_EXERCISE': {
      const index = action.payload;
      if (index < 0 || index >= state.workout.exercises.length) return state;

      const newExercises = state.workout.exercises.filter((_, i) => i !== index);

      return {
        ...state,
        isDirty: true,
        workout: {
          ...state.workout,
          exercises: newExercises,
        },
      };
    }

    case 'DUPLICATE_EXERCISE': {
      const index = action.payload;
      if (index < 0 || index >= state.workout.exercises.length) return state;

      const source = state.workout.exercises[index];
      const duplicated: Exercise = {
        ...source,
        id: generateId(),
        name: `${source.name} Copy`,
      };

      const newExercises = [...state.workout.exercises];
      newExercises.splice(index + 1, 0, duplicated);

      return {
        ...state,
        isDirty: true,
        workout: {
          ...state.workout,
          exercises: newExercises,
        },
      };
    }

    case 'MOVE_EXERCISE_UP': {
      const index = action.payload;
      if (index <= 0 || index >= state.workout.exercises.length) return state;

      const newExercises = [...state.workout.exercises];
      const temp = newExercises[index - 1];
      newExercises[index - 1] = newExercises[index];
      newExercises[index] = temp;

      return {
        ...state,
        isDirty: true,
        workout: {
          ...state.workout,
          exercises: newExercises,
        },
      };
    }

    case 'MOVE_EXERCISE_DOWN': {
      const index = action.payload;
      if (index < 0 || index >= state.workout.exercises.length - 1) return state;

      const newExercises = [...state.workout.exercises];
      const temp = newExercises[index + 1];
      newExercises[index + 1] = newExercises[index];
      newExercises[index] = temp;

      return {
        ...state,
        isDirty: true,
        workout: {
          ...state.workout,
          exercises: newExercises,
        },
      };
    }

    case 'LOAD_WORKOUT': {
      const { workout, savedId, createdAt } = action.payload;
      return {
        workout: {
          ...workout,
          exercises: workout.exercises.map((e) => ({ ...e })),
        },
        isDirty: false,
        editingSavedId: savedId ?? null,
        createdAt,
      };
    }

    case 'RESET':
      return {
        workout: createInitialWorkout(),
        isDirty: false,
        editingSavedId: null,
        createdAt: undefined,
      };

    default:
      return state;
  }
}
