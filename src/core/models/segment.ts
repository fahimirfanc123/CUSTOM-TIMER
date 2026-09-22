import { PhaseType } from './phase';

export interface NextTarget {
  exerciseName: string;
  exerciseIndex: number;
  setNumber: number;
  totalSets: number;
  roundNumber: number;
  totalRounds: number;
  stepNumber: number;
  totalSteps: number;
  reps?: number;
}

export interface SegmentContext {
  // Current position
  round: number;
  totalRounds: number;
  step: number;                   // 1-based index of exercise occurrence across rounds
  totalSteps: number;             // totalExercises * totalRounds
  exerciseIndex: number;          // 0-based index in workout.exercises
  totalExercises: number;
  set: number;                    // 1-based set number
  totalSets: number;
  exerciseName: string;
  reps?: number;

  // Transition & preview metadata
  nextTarget?: NextTarget;
  isLastSetOfExercise: boolean;
  isLastExerciseOfRound: boolean;
  isLastSegmentOfWorkout: boolean;
}

export interface WorkoutSegment {
  id: string;                     // Deterministic ID (e.g. "prepare", "r1_e0_s1_work", "r1_e0_s1_rest_set")
  phase: PhaseType;
  durationSec: number;
  context: SegmentContext;
}
