import { EngineStatus } from './phase';
import { WorkoutSegment } from './segment';

export interface EngineState {
  status: EngineStatus;
  workoutId: string | null;
  currentSegmentIndex: number;
  segments: WorkoutSegment[];
  timeRemainingInSegmentSec: number;
  elapsedWorkoutTimeSec: number;
  totalWorkoutDurationSec: number;
}
