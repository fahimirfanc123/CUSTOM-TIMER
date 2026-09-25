export interface Clock {
  now(): number;
}

export const defaultClock: Clock = {
  now: () => performance.now(),
};

export class MockClock implements Clock {
  private currentTime: number;

  constructor(initialTime = 0) {
    this.currentTime = initialTime;
  }

  now(): number {
    return this.currentTime;
  }

  set(timeMs: number): void {
    this.currentTime = timeMs;
  }

  advanceBy(durationMs: number): void {
    if (durationMs < 0) {
      throw new Error('Cannot advance clock by a negative duration');
    }
    this.currentTime += durationMs;
  }
}

export interface Scheduler {
  start(tickCallback: () => void, intervalMs?: number): void;
  stop(): void;
  isRunning(): boolean;
}

export class DefaultScheduler implements Scheduler {
  private timerId: ReturnType<typeof setInterval> | null = null;

  start(tickCallback: () => void, intervalMs = 100): void {
    this.stop();
    this.timerId = setInterval(() => {
      tickCallback();
    }, intervalMs);
  }

  stop(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  isRunning(): boolean {
    return this.timerId !== null;
  }
}

export class ManualScheduler implements Scheduler {
  private running = false;
  private tickCallback: (() => void) | null = null;

  start(tickCallback: () => void): void {
    this.running = true;
    this.tickCallback = tickCallback;
  }

  stop(): void {
    this.running = false;
    this.tickCallback = null;
  }

  isRunning(): boolean {
    return this.running;
  }

  triggerTick(): void {
    if (this.running && this.tickCallback) {
      this.tickCallback();
    }
  }
}
