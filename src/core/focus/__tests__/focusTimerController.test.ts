import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FocusTimerController, FOCUS_STATE_STORAGE_KEY, FOCUS_DAILY_STORAGE_KEY } from '../focusTimerController';
import { MockClock, ManualScheduler } from '../../engine/clock';
import { MockFocusSoundEngine, MockFocusSpeechEngine } from '../focusAudio';

class MockStorage implements Storage {
  private store: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.store).length;
  }

  clear(): void {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  key(index: number): string | null {
    return Object.keys(this.store)[index] ?? null;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
}

describe('FocusTimerController — Core Timer Tests (Module 7)', () => {
  let clock: MockClock;
  let scheduler: ManualScheduler;
  let soundEngine: MockFocusSoundEngine;
  let speechEngine: MockFocusSpeechEngine;
  let storage: MockStorage;
  let controller: FocusTimerController;

  beforeEach(() => {
    clock = new MockClock(1000000);
    scheduler = new ManualScheduler();
    soundEngine = new MockFocusSoundEngine();
    speechEngine = new MockFocusSpeechEngine();
    storage = new MockStorage();

    controller = new FocusTimerController({
      clock,
      scheduler,
      soundEngine,
      speechEngine,
      storage,
      autoRestore: false,
    });
  });

  afterEach(() => {
    controller.dispose();
  });

  it('1. initializes with default configuration', () => {
    const snapshot = controller.getSnapshot();
    expect(snapshot.phase).toBe('IDLE');
    expect(snapshot.status).toBe('IDLE');
    expect(snapshot.currentSession).toBe(1);
    expect(snapshot.sessionsBeforeLongBreak).toBe(4);
    expect(snapshot.config.focusDurationSec).toBe(25 * 60);
    expect(snapshot.config.shortBreakDurationSec).toBe(5 * 60);
    expect(snapshot.config.longBreakDurationSec).toBe(15 * 60);
    expect(snapshot.config.autoStartBreaks).toBe(false);
    expect(snapshot.config.autoStartFocus).toBe(false);
    expect(snapshot.config.soundEnabled).toBe(true);
    expect(snapshot.config.voiceEnabled).toBe(false);
    expect(snapshot.remainingSec).toBe(25 * 60);
    expect(snapshot.progress).toBe(0);
  });

  it('2. starts focus session and transitions to RUNNING', async () => {
    await controller.startFocus();
    const snapshot = controller.getSnapshot();

    expect(snapshot.phase).toBe('FOCUS');
    expect(snapshot.status).toBe('RUNNING');
    expect(snapshot.remainingSec).toBe(25 * 60);
    expect(soundEngine.history).toContain('FOCUS_START');
  });

  it('3. derives remaining time from timestamp/deadline', async () => {
    await controller.startFocus();
    // Advance clock by 10 seconds (10000ms)
    clock.advanceBy(10000);
    scheduler.triggerTick();

    const snapshot = controller.getSnapshot();
    expect(snapshot.remainingSec).toBe(25 * 60 - 10);
    expect(snapshot.progress).toBeCloseTo(10 / (25 * 60), 4);
  });

  it('4. progresses smoothly on ordinary ticks', async () => {
    await controller.startFocus();

    clock.advanceBy(1000);
    scheduler.triggerTick();
    expect(controller.getSnapshot().remainingSec).toBe(25 * 60 - 1);

    clock.advanceBy(1000);
    scheduler.triggerTick();
    expect(controller.getSnapshot().remainingSec).toBe(25 * 60 - 2);
  });

  it('5. catches up accurately without drift when ticks are delayed / background throttled', async () => {
    await controller.startFocus();

    // Simulate tab in background for 5 minutes (300,000ms)
    clock.advanceBy(300000);
    scheduler.triggerTick();

    const snapshot = controller.getSnapshot();
    expect(snapshot.remainingSec).toBe(25 * 60 - 300);
    expect(snapshot.remainingSec).toBe(20 * 60);
  });

  it('6. pauses session and freezes remaining duration', async () => {
    await controller.startFocus();
    clock.advanceBy(60000); // 1 min in
    scheduler.triggerTick();

    controller.pause();
    const snapshot = controller.getSnapshot();
    expect(snapshot.status).toBe('PAUSED');
    expect(snapshot.remainingSec).toBe(24 * 60);

    // Further clock advancement while paused must NOT decrease remaining time
    clock.advanceBy(50000);
    scheduler.triggerTick();
    expect(controller.getSnapshot().remainingSec).toBe(24 * 60);
  });

  it('7. resumes session with new deadline calculated from frozen remaining duration', async () => {
    await controller.startFocus();
    clock.advanceBy(60000); // 1 min in
    scheduler.triggerTick();

    controller.pause();
    expect(controller.getSnapshot().remainingSec).toBe(24 * 60);

    // Pause for 10 minutes
    clock.advanceBy(600000);

    controller.resume();
    expect(controller.getSnapshot().status).toBe('RUNNING');
    expect(controller.getSnapshot().remainingSec).toBe(24 * 60);

    // Advance 10 seconds after resume
    clock.advanceBy(10000);
    scheduler.triggerTick();
    expect(controller.getSnapshot().remainingSec).toBe(24 * 60 - 10);
  });

  it('8. resets timer back to IDLE and session 1', async () => {
    await controller.startFocus();
    clock.advanceBy(30000);
    scheduler.triggerTick();

    controller.reset();
    const snapshot = controller.getSnapshot();
    expect(snapshot.phase).toBe('IDLE');
    expect(snapshot.status).toBe('IDLE');
    expect(snapshot.currentSession).toBe(1);
    expect(snapshot.remainingSec).toBe(25 * 60);
    expect(snapshot.progress).toBe(0);
  });

  it('9. skips focus to break and does NOT count as completed session', async () => {
    await controller.startFocus();
    clock.advanceBy(30000);
    scheduler.triggerTick();

    controller.skip();
    const snapshot = controller.getSnapshot();
    expect(snapshot.phase).toBe('SHORT_BREAK');
    expect(snapshot.todayCompletedSessions).toBe(0);
    expect(snapshot.totalDurationSec).toBe(5 * 60);
  });

  it('10. skips break to next focus session and advances session counter', async () => {
    await controller.startBreak();
    expect(controller.getSnapshot().phase).toBe('SHORT_BREAK');

    controller.skip();
    const snapshot = controller.getSnapshot();
    expect(snapshot.phase).toBe('FOCUS');
    expect(snapshot.currentSession).toBe(2);
    expect(snapshot.totalDurationSec).toBe(25 * 60);
  });

  it('11. naturally completes focus and increments today completed sessions count', async () => {
    controller.updateConfig({ focusDurationSec: 10, shortBreakDurationSec: 5 });
    await controller.startFocus();

    clock.advanceBy(10000);
    scheduler.triggerTick();

    const snapshot = controller.getSnapshot();
    expect(snapshot.todayCompletedSessions).toBe(1);
    expect(snapshot.todayFocusTimeSec).toBe(10);
    expect(soundEngine.history).toContain('FOCUS_COMPLETE');
  });

  it('12. selects short break correctly for sessions before threshold', async () => {
    controller.updateConfig({ focusDurationSec: 10, shortBreakDurationSec: 5, sessionsBeforeLongBreak: 4 });
    await controller.startFocus();

    clock.advanceBy(10000);
    scheduler.triggerTick();

    const snapshot = controller.getSnapshot();
    expect(snapshot.phase).toBe('SHORT_BREAK');
    expect(snapshot.totalDurationSec).toBe(5);
  });

  it('13. selects long break after reaching configured session count', async () => {
    controller.updateConfig({
      focusDurationSec: 10,
      shortBreakDurationSec: 5,
      longBreakDurationSec: 15,
      sessionsBeforeLongBreak: 2,
      autoStartBreaks: true,
      autoStartFocus: true,
    });

    // Session 1
    await controller.startFocus();
    clock.advanceBy(10000);
    scheduler.triggerTick();
    expect(controller.getSnapshot().phase).toBe('SHORT_BREAK');

    // Complete Break 1 -> moves to Session 2
    clock.advanceBy(5000);
    scheduler.triggerTick();
    expect(controller.getSnapshot().phase).toBe('FOCUS');
    expect(controller.getSnapshot().currentSession).toBe(2);

    // Complete Session 2 (threshold reached) -> should be LONG_BREAK
    clock.advanceBy(10000);
    scheduler.triggerTick();
    expect(controller.getSnapshot().phase).toBe('LONG_BREAK');
    expect(controller.getSnapshot().totalDurationSec).toBe(15);
  });

  it('14. starts new cycle (session 1) after long break completes', async () => {
    controller.updateConfig({
      focusDurationSec: 10,
      shortBreakDurationSec: 5,
      longBreakDurationSec: 15,
      sessionsBeforeLongBreak: 1,
      autoStartBreaks: true,
      autoStartFocus: true,
    });

    // Session 1
    await controller.startFocus();
    clock.advanceBy(10000);
    scheduler.triggerTick();
    expect(controller.getSnapshot().phase).toBe('LONG_BREAK');

    // Complete Long Break
    clock.advanceBy(15000);
    scheduler.triggerTick();
    expect(controller.getSnapshot().phase).toBe('FOCUS');
    expect(controller.getSnapshot().currentSession).toBe(1);
  });

  it('15. auto-starts break when autoStartBreaks is ON', async () => {
    controller.updateConfig({
      focusDurationSec: 10,
      shortBreakDurationSec: 5,
      autoStartBreaks: true,
    });
    await controller.startFocus();

    clock.advanceBy(10000);
    scheduler.triggerTick();

    const snapshot = controller.getSnapshot();
    expect(snapshot.phase).toBe('SHORT_BREAK');
    expect(snapshot.status).toBe('RUNNING');
    expect(soundEngine.history).toContain('BREAK_START');
  });

  it('16. pauses and awaits user start when autoStartBreaks is OFF', async () => {
    controller.updateConfig({
      focusDurationSec: 10,
      shortBreakDurationSec: 5,
      autoStartBreaks: false,
    });
    await controller.startFocus();

    clock.advanceBy(10000);
    scheduler.triggerTick();

    const snapshot = controller.getSnapshot();
    expect(snapshot.phase).toBe('SHORT_BREAK');
    expect(snapshot.status).toBe('AWAITING_NEXT_PHASE');
    expect(snapshot.awaitingNextPhase).toBe('SHORT_BREAK');
  });

  it('17. auto-starts focus when autoStartFocus is ON', async () => {
    controller.updateConfig({
      focusDurationSec: 10,
      shortBreakDurationSec: 5,
      autoStartFocus: true,
    });
    await controller.startBreak();

    clock.advanceBy(5000);
    scheduler.triggerTick();

    const snapshot = controller.getSnapshot();
    expect(snapshot.phase).toBe('FOCUS');
    expect(snapshot.status).toBe('RUNNING');
  });

  it('18. pauses and awaits user start when autoStartFocus is OFF', async () => {
    controller.updateConfig({
      focusDurationSec: 10,
      shortBreakDurationSec: 5,
      autoStartFocus: false,
    });
    await controller.startBreak();

    clock.advanceBy(5000);
    scheduler.triggerTick();

    const snapshot = controller.getSnapshot();
    expect(snapshot.phase).toBe('FOCUS');
    expect(snapshot.status).toBe('AWAITING_NEXT_PHASE');
    expect(snapshot.awaitingNextPhase).toBe('FOCUS');
  });
});

describe('FocusTimerController — Persistence & Reload Recovery Tests (Module 7)', () => {
  let clock: MockClock;
  let scheduler: ManualScheduler;
  let storage: MockStorage;

  beforeEach(() => {
    clock = new MockClock(1000000);
    scheduler = new ManualScheduler();
    storage = new MockStorage();
  });

  it('35-36. restores running session and calculates correct deadline after reload', async () => {
    const controller1 = new FocusTimerController({
      clock,
      scheduler,
      storage,
      autoRestore: false,
    });

    await controller1.startFocus();
    clock.advanceBy(60000); // 1 minute in
    scheduler.triggerTick();
    expect(controller1.getSnapshot().remainingSec).toBe(24 * 60);

    // Simulate page reload after 4 more minutes away (total 5 minutes from start)
    clock.advanceBy(240000);

    const controller2 = new FocusTimerController({
      clock,
      scheduler,
      storage,
      autoRestore: true,
    });

    const snapshot = controller2.getSnapshot();
    expect(snapshot.phase).toBe('FOCUS');
    expect(snapshot.status).toBe('RUNNING');
    expect(snapshot.remainingSec).toBe(20 * 60); // 25 - 5 = 20 minutes remaining
  });

  it('37. restores paused session and frozen remaining duration', async () => {
    const controller1 = new FocusTimerController({
      clock,
      scheduler,
      storage,
      autoRestore: false,
    });

    await controller1.startFocus();
    clock.advanceBy(300000); // 5 min in
    scheduler.triggerTick();
    controller1.pause();

    expect(controller1.getSnapshot().remainingSec).toBe(20 * 60);

    // Simulate reload while paused
    const controller2 = new FocusTimerController({
      clock,
      scheduler,
      storage,
      autoRestore: true,
    });

    const snapshot = controller2.getSnapshot();
    expect(snapshot.status).toBe('PAUSED');
    expect(snapshot.remainingSec).toBe(20 * 60);
  });

  it('38. restores session counter and custom label', async () => {
    const controller1 = new FocusTimerController({
      clock,
      scheduler,
      storage,
      autoRestore: false,
    });

    controller1.setLabel('Deep Algorithm Practice');
    controller1.skip(); // Session 1 skipped -> Break
    controller1.skip(); // Break skipped -> Session 2
    expect(controller1.getSnapshot().currentSession).toBe(2);

    const controller2 = new FocusTimerController({
      clock,
      scheduler,
      storage,
      autoRestore: true,
    });

    expect(controller2.getSnapshot().currentSession).toBe(2);
    expect(controller2.getSnapshot().label).toBe('Deep Algorithm Practice');
  });

  it('39. handles expired session conservatively without fabricating multiple cycles', async () => {
    const controller1 = new FocusTimerController({
      clock,
      scheduler,
      storage,
      autoRestore: false,
    });

    await controller1.startFocus();
    // Simulate app closed for 2 hours (7,200,000ms)
    clock.advanceBy(7200000);

    const controller2 = new FocusTimerController({
      clock,
      scheduler,
      storage,
      autoRestore: true,
    });

    const snapshot = controller2.getSnapshot();
    // It should award only 1 session that expired while away, and wait at Break
    expect(snapshot.todayCompletedSessions).toBe(1);
    expect(snapshot.status).toBe('AWAITING_NEXT_PHASE');
    expect(snapshot.phase).toBe('SHORT_BREAK');
  });

  it('40. falls back safely if persisted state in storage is corrupted', () => {
    storage.setItem(FOCUS_STATE_STORAGE_KEY, '{ invalid corrupted json');

    const controller = new FocusTimerController({
      clock,
      scheduler,
      storage,
      autoRestore: true,
    });

    const snapshot = controller.getSnapshot();
    expect(snapshot.phase).toBe('IDLE');
    expect(snapshot.status).toBe('IDLE');
    expect(snapshot.currentSession).toBe(1);
  });
});

describe('FocusTimerController — Daily Count Tests (Module 7)', () => {
  let clock: MockClock;
  let scheduler: ManualScheduler;
  let storage: MockStorage;

  beforeEach(() => {
    clock = new MockClock(1000000);
    scheduler = new ManualScheduler();
    storage = new MockStorage();
  });

  it('54. naturally completed Focus increments daily count and focus time', async () => {
    const controller = new FocusTimerController({
      clock,
      scheduler,
      storage,
      initialConfig: { focusDurationSec: 10, shortBreakDurationSec: 5 },
      autoRestore: false,
    });

    await controller.startFocus();
    clock.advanceBy(10000);
    scheduler.triggerTick();

    expect(controller.getSnapshot().todayCompletedSessions).toBe(1);
    expect(controller.getSnapshot().todayFocusTimeSec).toBe(10);
  });

  it('55. skipped Focus does NOT increment daily count', async () => {
    const controller = new FocusTimerController({
      clock,
      scheduler,
      storage,
      autoRestore: false,
    });

    await controller.startFocus();
    controller.skip();

    expect(controller.getSnapshot().todayCompletedSessions).toBe(0);
    expect(controller.getSnapshot().todayFocusTimeSec).toBe(0);
  });

  it('56. Break completion does NOT increment focus session count', async () => {
    const controller = new FocusTimerController({
      clock,
      scheduler,
      storage,
      initialConfig: { shortBreakDurationSec: 5 },
      autoRestore: false,
    });

    await controller.startBreak();
    clock.advanceBy(5000);
    scheduler.triggerTick();

    expect(controller.getSnapshot().todayCompletedSessions).toBe(0);
  });

  it('57. new local day resets today count to 0', () => {
    // Store daily stats under an older date
    storage.setItem(
      FOCUS_DAILY_STORAGE_KEY,
      JSON.stringify({
        date: '2020-01-01',
        completedSessions: 8,
        focusTimeSec: 12000,
      })
    );

    const controller = new FocusTimerController({
      clock,
      scheduler,
      storage,
      autoRestore: true,
    });

    expect(controller.getSnapshot().todayCompletedSessions).toBe(0);
    expect(controller.getSnapshot().todayFocusTimeSec).toBe(0);
  });
});
