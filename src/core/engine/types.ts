import { EngineStatus } from '../models/phase';
import { WorkoutSegment } from '../models/segment';

export interface EngineSnapshot {
  readonly status: EngineStatus;
  readonly workoutId: string | null;
  readonly currentSegmentIndex: number;
  readonly currentSegment: WorkoutSegment | null;
  readonly remainingTimeMs: number;
  readonly remainingTimeSec: number;
  readonly elapsedWorkoutTimeMs: number;
  readonly elapsedWorkoutTimeSec: number;
  readonly totalWorkoutDurationMs: number;
  readonly totalWorkoutDurationSec: number;
  readonly progress: number; // 0.0 to 1.0
}

export interface EngineOptions {
  workoutId?: string;
  tickIntervalMs?: number; // default 100ms
}
