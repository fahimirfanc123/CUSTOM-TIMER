import { EngineStatus } from '../models/phase';
import { WorkoutSegment } from '../models/segment';
import { Clock, Scheduler, defaultClock, DefaultScheduler } from './clock';
import { EngineEvent, EngineListener } from './events';
import { EngineSnapshot, EngineOptions } from './types';

export class TimerEngine {
  private readonly segments: readonly WorkoutSegment[];
  private readonly workoutId: string | null;
  private readonly clock: Clock;
  private readonly scheduler: Scheduler;
  private readonly tickIntervalMs: number;
  private readonly totalWorkoutDurationMs: number;

  private status: EngineStatus = 'IDLE';
  private currentSegmentIndex = 0;
  private remainingTimeMs = 0;
  private segmentDeadlineMs = 0;

  // Warning thresholds flags per segment
  private firedTenSecondWarning = false;
  private firedThreeSecondWarning = false;
  private firedTwoSecondWarning = false;
  private firedOneSecondWarning = false;

  private readonly listeners = new Set<EngineListener>();

  constructor(
    segments: WorkoutSegment[],
    options: EngineOptions = {},
    clock: Clock = defaultClock,
    scheduler: Scheduler = new DefaultScheduler()
  ) {
    this.segments = Object.freeze([...segments]);
    this.workoutId = options.workoutId ?? null;
    this.clock = clock;
    this.scheduler = scheduler;
    this.tickIntervalMs = options.tickIntervalMs ?? 100;
    this.totalWorkoutDurationMs = this.segments.reduce(
      (total, seg) => total + seg.durationSec * 1000,
      0
    );

    if (this.segments.length > 0) {
      this.remainingTimeMs = this.segments[0].durationSec * 1000;
    }
  }

  // ==========================================
  // Subscription API
  // ==========================================
  public subscribe(listener: EngineListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ==========================================
  // Snapshot / State Inspection
  // ==========================================
  public getSnapshot(): EngineSnapshot {
    const currentRemainingMs = this.calculateCurrentRemainingMs();
    const currentSegment = this.segments[this.currentSegmentIndex] ?? null;
    const elapsedWorkoutTimeMs = this.calculateElapsedMs(currentRemainingMs);

    const progress =
      this.totalWorkoutDurationMs > 0
        ? Math.min(1.0, Math.max(0.0, elapsedWorkoutTimeMs / this.totalWorkoutDurationMs))
        : this.status === 'COMPLETED'
        ? 1.0
        : 0.0;

    return {
      status: this.status,
      workoutId: this.workoutId,
      currentSegmentIndex: this.currentSegmentIndex,
      currentSegment,
      remainingTimeMs: currentRemainingMs,
      remainingTimeSec: Math.ceil(currentRemainingMs / 1000),
      elapsedWorkoutTimeMs,
      elapsedWorkoutTimeSec: Math.floor(elapsedWorkoutTimeMs / 1000),
      totalWorkoutDurationMs: this.totalWorkoutDurationMs,
      totalWorkoutDurationSec: Math.round(this.totalWorkoutDurationMs / 1000),
      progress,
    };
  }

  public getState(): EngineSnapshot {
    return this.getSnapshot();
  }

  // ==========================================
  // Lifecycle & Control Commands
  // ==========================================
  public start(): void {
    if (this.status !== 'IDLE') {
      return;
    }

    const now = this.clock.now();

    if (this.segments.length === 0) {
      this.status = 'COMPLETED';
      this.emit({
        type: 'WORKOUT_STARTED',
        workoutId: this.workoutId,
        totalSegments: 0,
        totalDurationMs: 0,
        timestamp: now,
      });
      this.emit({
        type: 'WORKOUT_COMPLETED',
        workoutId: this.workoutId,
        totalElapsedMs: 0,
        completedSegmentsCount: 0,
        timestamp: now,
      });
      return;
    }

    this.status = 'RUNNING';
    this.currentSegmentIndex = 0;
    const firstSegment = this.segments[0];
    const durationMs = firstSegment.durationSec * 1000;
    this.remainingTimeMs = durationMs;
    this.segmentDeadlineMs = now + durationMs;
    this.resetWarnings();

    this.emit({
      type: 'WORKOUT_STARTED',
      workoutId: this.workoutId,
      totalSegments: this.segments.length,
      totalDurationMs: this.totalWorkoutDurationMs,
      timestamp: now,
    });

    this.emit({
      type: 'SEGMENT_STARTED',
      segment: firstSegment,
      segmentIndex: 0,
      totalSegments: this.segments.length,
      durationMs,
      timestamp: now,
    });

    this.scheduler.start(() => this.tick(), this.tickIntervalMs);
  }

  public pause(): void {
    if (this.status !== 'RUNNING') {
      return;
    }

    const now = this.clock.now();
    this.remainingTimeMs = Math.max(0, this.segmentDeadlineMs - now);
    this.status = 'PAUSED';
    this.scheduler.stop();

    this.emit({
      type: 'WORKOUT_PAUSED',
      segment: this.segments[this.currentSegmentIndex] ?? null,
      remainingTimeMs: this.remainingTimeMs,
      timestamp: now,
    });
  }

  public resume(): void {
    if (this.status !== 'PAUSED') {
      return;
    }

    const now = this.clock.now();
    this.status = 'RUNNING';
    this.segmentDeadlineMs = now + this.remainingTimeMs;
    this.scheduler.start(() => this.tick(), this.tickIntervalMs);

    this.emit({
      type: 'WORKOUT_RESUMED',
      segment: this.segments[this.currentSegmentIndex] ?? null,
      remainingTimeMs: this.remainingTimeMs,
      timestamp: now,
    });
  }

  public next(): void {
    if (this.status !== 'RUNNING' && this.status !== 'PAUSED') {
      return;
    }

    const now = this.clock.now();
    const skippedSegment = this.segments[this.currentSegmentIndex];

    this.emit({
      type: 'SEGMENT_SKIPPED',
      segment: skippedSegment,
      segmentIndex: this.currentSegmentIndex,
      timestamp: now,
    });

    this.currentSegmentIndex++;

    if (this.currentSegmentIndex >= this.segments.length) {
      this.status = 'COMPLETED';
      this.remainingTimeMs = 0;
      this.scheduler.stop();

      this.emit({
        type: 'WORKOUT_COMPLETED',
        workoutId: this.workoutId,
        totalElapsedMs: this.totalWorkoutDurationMs,
        completedSegmentsCount: this.segments.length,
        timestamp: now,
      });
      return;
    }

    const nextSegment = this.segments[this.currentSegmentIndex];
    const durationMs = nextSegment.durationSec * 1000;
    this.remainingTimeMs = durationMs;
    this.resetWarnings();

    if (this.status === 'RUNNING') {
      this.segmentDeadlineMs = now + durationMs;
    }

    this.emit({
      type: 'SEGMENT_STARTED',
      segment: nextSegment,
      segmentIndex: this.currentSegmentIndex,
      totalSegments: this.segments.length,
      durationMs,
      timestamp: now,
    });
  }

  public previous(): void {
    if (this.status !== 'RUNNING' && this.status !== 'PAUSED') {
      return;
    }

    if (this.currentSegmentIndex === 0) {
      this.restartCurrentSegment();
      return;
    }

    const now = this.clock.now();
    this.currentSegmentIndex--;

    const prevSegment = this.segments[this.currentSegmentIndex];
    const durationMs = prevSegment.durationSec * 1000;
    this.remainingTimeMs = durationMs;
    this.resetWarnings();

    if (this.status === 'RUNNING') {
      this.segmentDeadlineMs = now + durationMs;
    }

    this.emit({
      type: 'SEGMENT_STARTED',
      segment: prevSegment,
      segmentIndex: this.currentSegmentIndex,
      totalSegments: this.segments.length,
      durationMs,
      timestamp: now,
    });
  }

  public restartCurrentSegment(): void {
    if (this.status !== 'RUNNING' && this.status !== 'PAUSED') {
      return;
    }

    const now = this.clock.now();
    const currentSegment = this.segments[this.currentSegmentIndex];
    const durationMs = currentSegment.durationSec * 1000;
    this.remainingTimeMs = durationMs;
    this.resetWarnings();

    if (this.status === 'RUNNING') {
      this.segmentDeadlineMs = now + durationMs;
    }

    this.emit({
      type: 'SEGMENT_RESTARTED',
      segment: currentSegment,
      segmentIndex: this.currentSegmentIndex,
      durationMs,
      timestamp: now,
    });
  }

  public addTime(seconds: number): void {
    if (this.status !== 'RUNNING' && this.status !== 'PAUSED') {
      return;
    }

    const now = this.clock.now();
    const amountMs = Math.round(seconds * 1000);
    const previousRemainingMs = this.calculateCurrentRemainingMs();
    const newRemainingMs = Math.max(0, previousRemainingMs + amountMs);
    const currentSegment = this.segments[this.currentSegmentIndex];

    if (newRemainingMs === 0) {
      this.emit({
        type: 'TIME_ADJUSTED',
        amountMs,
        previousRemainingMs,
        newRemainingMs,
        segment: currentSegment,
        segmentIndex: this.currentSegmentIndex,
        timestamp: now,
      });
      this.completeCurrentSegment();
      return;
    }

    this.remainingTimeMs = newRemainingMs;
    if (this.status === 'RUNNING') {
      this.segmentDeadlineMs = now + newRemainingMs;
    }
    this.adjustWarningFlags(newRemainingMs);

    this.emit({
      type: 'TIME_ADJUSTED',
      amountMs,
      previousRemainingMs,
      newRemainingMs,
      segment: currentSegment,
      segmentIndex: this.currentSegmentIndex,
      timestamp: now,
    });
  }

  public endWorkout(): void {
    if (this.status === 'IDLE' || this.status === 'COMPLETED' || this.status === 'STOPPED') {
      return;
    }

    const now = this.clock.now();
    const currentRemainingMs = this.calculateCurrentRemainingMs();
    const elapsedMs = this.calculateElapsedMs(currentRemainingMs);

    this.status = 'STOPPED';
    this.scheduler.stop();

    this.emit({
      type: 'WORKOUT_ENDED',
      workoutId: this.workoutId,
      currentSegmentIndex: this.currentSegmentIndex,
      elapsedMs,
      timestamp: now,
    });
  }

  // ==========================================
  // Timing & Tick Execution Engine
  // ==========================================
  public tick(): void {
    if (this.status !== 'RUNNING') {
      return;
    }

    const now = this.clock.now();

    while (this.status === 'RUNNING') {
      const diff = this.segmentDeadlineMs - now;

      if (diff > 0) {
        // Active segment is still in progress
        this.remainingTimeMs = diff;
        this.checkWarnings(diff, now);

        this.emit({
          type: 'TICK',
          snapshot: this.getSnapshot(),
          timestamp: now,
        });
        break;
      } else {
        // Active segment has reached or passed its deadline
        const overshootMs = -diff;
        const completedSegment = this.segments[this.currentSegmentIndex];

        this.emit({
          type: 'SEGMENT_COMPLETED',
          segment: completedSegment,
          segmentIndex: this.currentSegmentIndex,
          totalSegments: this.segments.length,
          timestamp: now,
        });

        this.currentSegmentIndex++;

        if (this.currentSegmentIndex >= this.segments.length) {
          this.status = 'COMPLETED';
          this.remainingTimeMs = 0;
          this.scheduler.stop();

          this.emit({
            type: 'WORKOUT_COMPLETED',
            workoutId: this.workoutId,
            totalElapsedMs: this.totalWorkoutDurationMs,
            completedSegmentsCount: this.segments.length,
            timestamp: now,
          });
          break;
        } else {
          const nextSegment = this.segments[this.currentSegmentIndex];
          const nextDurationMs = nextSegment.durationSec * 1000;
          this.resetWarnings();

          this.emit({
            type: 'SEGMENT_STARTED',
            segment: nextSegment,
            segmentIndex: this.currentSegmentIndex,
            totalSegments: this.segments.length,
            durationMs: nextDurationMs,
            timestamp: now,
          });

          // Carry over any overshoot time into next segment deadline
          this.segmentDeadlineMs = now + (nextDurationMs - overshootMs);
          this.remainingTimeMs = nextDurationMs - overshootMs;
          // Continue while loop to immediately process next segment if overshoot >= nextDurationMs
        }
      }
    }
  }

  // ==========================================
  // Internal Helpers
  // ==========================================
  private calculateCurrentRemainingMs(): number {
    if (this.status === 'RUNNING') {
      return Math.max(0, this.segmentDeadlineMs - this.clock.now());
    }
    return this.remainingTimeMs;
  }

  private calculateElapsedMs(currentRemainingMs: number): number {
    if (this.status === 'IDLE') {
      return 0;
    }
    if (this.status === 'COMPLETED') {
      return this.totalWorkoutDurationMs;
    }

    let priorCompletedDurationMs = 0;
    for (let i = 0; i < this.currentSegmentIndex; i++) {
      priorCompletedDurationMs += this.segments[i].durationSec * 1000;
    }

    const currentSegment = this.segments[this.currentSegmentIndex];
    if (!currentSegment) {
      return priorCompletedDurationMs;
    }

    const currentSegmentDurationMs = currentSegment.durationSec * 1000;
    const currentSegmentActiveElapsedMs = Math.max(
      0,
      currentSegmentDurationMs - currentRemainingMs
    );

    return priorCompletedDurationMs + currentSegmentActiveElapsedMs;
  }

  private completeCurrentSegment(): void {
    const now = this.clock.now();
    const completedSegment = this.segments[this.currentSegmentIndex];

    this.emit({
      type: 'SEGMENT_COMPLETED',
      segment: completedSegment,
      segmentIndex: this.currentSegmentIndex,
      totalSegments: this.segments.length,
      timestamp: now,
    });

    this.currentSegmentIndex++;

    if (this.currentSegmentIndex >= this.segments.length) {
      this.status = 'COMPLETED';
      this.remainingTimeMs = 0;
      this.scheduler.stop();

      this.emit({
        type: 'WORKOUT_COMPLETED',
        workoutId: this.workoutId,
        totalElapsedMs: this.totalWorkoutDurationMs,
        completedSegmentsCount: this.segments.length,
        timestamp: now,
      });
      return;
    }

    const nextSegment = this.segments[this.currentSegmentIndex];
    const durationMs = nextSegment.durationSec * 1000;
    this.remainingTimeMs = durationMs;
    this.resetWarnings();

    if (this.status === 'RUNNING') {
      this.segmentDeadlineMs = now + durationMs;
    }

    this.emit({
      type: 'SEGMENT_STARTED',
      segment: nextSegment,
      segmentIndex: this.currentSegmentIndex,
      totalSegments: this.segments.length,
      durationMs,
      timestamp: now,
    });
  }

  private checkWarnings(remainingMs: number, now: number): void {
    const currentSegment = this.segments[this.currentSegmentIndex];
    if (!currentSegment) return;

    if (remainingMs <= 10000 && !this.firedTenSecondWarning) {
      this.firedTenSecondWarning = true;
      this.emit({
        type: 'TEN_SECONDS_REMAINING',
        segment: currentSegment,
        segmentIndex: this.currentSegmentIndex,
        remainingMs,
        timestamp: now,
      });
    }

    if (remainingMs <= 3000 && !this.firedThreeSecondWarning) {
      this.firedThreeSecondWarning = true;
      this.emit({
        type: 'COUNTDOWN_TICK',
        seconds: 3,
        segment: currentSegment,
        segmentIndex: this.currentSegmentIndex,
        timestamp: now,
      });
    }

    if (remainingMs <= 2000 && !this.firedTwoSecondWarning) {
      this.firedTwoSecondWarning = true;
      this.emit({
        type: 'COUNTDOWN_TICK',
        seconds: 2,
        segment: currentSegment,
        segmentIndex: this.currentSegmentIndex,
        timestamp: now,
      });
    }

    if (remainingMs <= 1000 && !this.firedOneSecondWarning) {
      this.firedOneSecondWarning = true;
      this.emit({
        type: 'COUNTDOWN_TICK',
        seconds: 1,
        segment: currentSegment,
        segmentIndex: this.currentSegmentIndex,
        timestamp: now,
      });
    }
  }

  private resetWarnings(): void {
    this.firedTenSecondWarning = false;
    this.firedThreeSecondWarning = false;
    this.firedTwoSecondWarning = false;
    this.firedOneSecondWarning = false;
  }

  private adjustWarningFlags(newRemainingMs: number): void {
    if (newRemainingMs > 10000) {
      this.firedTenSecondWarning = false;
    }
    if (newRemainingMs > 3000) {
      this.firedThreeSecondWarning = false;
    }
    if (newRemainingMs > 2000) {
      this.firedTwoSecondWarning = false;
    }
    if (newRemainingMs > 1000) {
      this.firedOneSecondWarning = false;
    }
  }

  private emit(event: EngineEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('TimerEngine listener error:', error);
      }
    }
  }
}
