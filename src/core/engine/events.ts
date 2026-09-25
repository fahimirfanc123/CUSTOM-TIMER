import { WorkoutSegment } from '../models/segment';
import { EngineSnapshot } from './types';

export type EngineEventType =
  | 'WORKOUT_STARTED'
  | 'SEGMENT_STARTED'
  | 'TICK'
  | 'TEN_SECONDS_REMAINING'
  | 'COUNTDOWN_TICK'
  | 'SEGMENT_COMPLETED'
  | 'WORKOUT_COMPLETED'
  | 'WORKOUT_PAUSED'
  | 'WORKOUT_RESUMED'
  | 'SEGMENT_SKIPPED'
  | 'SEGMENT_RESTARTED'
  | 'WORKOUT_ENDED'
  | 'TIME_ADJUSTED';

export interface WorkoutStartedEvent {
  type: 'WORKOUT_STARTED';
  workoutId: string | null;
  totalSegments: number;
  totalDurationMs: number;
  timestamp: number;
}

export interface SegmentStartedEvent {
  type: 'SEGMENT_STARTED';
  segment: WorkoutSegment;
  segmentIndex: number;
  totalSegments: number;
  durationMs: number;
  timestamp: number;
}

export interface TickEvent {
  type: 'TICK';
  snapshot: EngineSnapshot;
  timestamp: number;
}

export interface TenSecondsRemainingEvent {
  type: 'TEN_SECONDS_REMAINING';
  segment: WorkoutSegment;
  segmentIndex: number;
  remainingMs: number;
  timestamp: number;
}

export interface CountdownTickEvent {
  type: 'COUNTDOWN_TICK';
  seconds: 1 | 2 | 3;
  segment: WorkoutSegment;
  segmentIndex: number;
  timestamp: number;
}

export interface SegmentCompletedEvent {
  type: 'SEGMENT_COMPLETED';
  segment: WorkoutSegment;
  segmentIndex: number;
  totalSegments: number;
  timestamp: number;
}

export interface WorkoutCompletedEvent {
  type: 'WORKOUT_COMPLETED';
  workoutId: string | null;
  totalElapsedMs: number;
  completedSegmentsCount: number;
  timestamp: number;
}

export interface WorkoutPausedEvent {
  type: 'WORKOUT_PAUSED';
  segment: WorkoutSegment | null;
  remainingTimeMs: number;
  timestamp: number;
}

export interface WorkoutResumedEvent {
  type: 'WORKOUT_RESUMED';
  segment: WorkoutSegment | null;
  remainingTimeMs: number;
  timestamp: number;
}

export interface SegmentSkippedEvent {
  type: 'SEGMENT_SKIPPED';
  segment: WorkoutSegment;
  segmentIndex: number;
  timestamp: number;
}

export interface SegmentRestartedEvent {
  type: 'SEGMENT_RESTARTED';
  segment: WorkoutSegment;
  segmentIndex: number;
  durationMs: number;
  timestamp: number;
}

export interface WorkoutEndedEvent {
  type: 'WORKOUT_ENDED';
  workoutId: string | null;
  currentSegmentIndex: number;
  elapsedMs: number;
  timestamp: number;
}

export interface TimeAdjustedEvent {
  type: 'TIME_ADJUSTED';
  amountMs: number;
  previousRemainingMs: number;
  newRemainingMs: number;
  segment: WorkoutSegment;
  segmentIndex: number;
  timestamp: number;
}

export type EngineEvent =
  | WorkoutStartedEvent
  | SegmentStartedEvent
  | TickEvent
  | TenSecondsRemainingEvent
  | CountdownTickEvent
  | SegmentCompletedEvent
  | WorkoutCompletedEvent
  | WorkoutPausedEvent
  | WorkoutResumedEvent
  | SegmentSkippedEvent
  | SegmentRestartedEvent
  | WorkoutEndedEvent
  | TimeAdjustedEvent;

export type EngineListener = (event: EngineEvent) => void;
