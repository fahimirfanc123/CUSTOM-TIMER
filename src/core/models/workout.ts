export type WorkoutType =
  | 'SIMPLE'
  | 'SET'
  | 'ROUND'
  | 'CUSTOM';

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  workDurationSec: number;
  restBetweenSetsSec: number;     // Rest between sets of the same exercise
  restAfterExerciseSec: number;   // Rest after the final set of this exercise (within the round)
  reps?: number;                  // Optional target reps (display or audio cues)
  notes?: string;
}

export interface Workout {
  id: string;
  title: string;
  description?: string;
  type: WorkoutType;
  prepareDurationSec: number;     // Initial countdown before Round 1 (0 to skip)
  rounds: number;                 // Total number of times all exercises repeat
  restBetweenRoundsSec: number;   // Rest after last exercise of a round (except final round)
  exercises: Exercise[];
}
