import { Workout, Exercise } from '../../core/models/workout';

export interface BuilderState {
  workout: Workout;
  isDirty: boolean;
  editingSavedId: string | null; // null if creating a new workout
  createdAt?: number;
}

export type BuilderAction =
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_DESCRIPTION'; payload: string }
  | { type: 'SET_PREPARE_DURATION'; payload: number }
  | { type: 'SET_ROUNDS'; payload: number }
  | { type: 'SET_REST_BETWEEN_ROUNDS'; payload: number }
  | { type: 'ADD_EXERCISE' }
  | { type: 'UPDATE_EXERCISE'; payload: { index: number; exercise: Partial<Exercise> } }
  | { type: 'DELETE_EXERCISE'; payload: number }
  | { type: 'DUPLICATE_EXERCISE'; payload: number }
  | { type: 'MOVE_EXERCISE_UP'; payload: number }
  | { type: 'MOVE_EXERCISE_DOWN'; payload: number }
  | { type: 'LOAD_WORKOUT'; payload: { workout: Workout; savedId?: string; createdAt?: number } }
  | { type: 'RESET' };
