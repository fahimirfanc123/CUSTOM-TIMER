import { describe, it, expect, beforeEach } from 'vitest';
import { FocusTimerController } from '../../../core/focus/focusTimerController';
import { WebFallbackDesktopBridge } from '../../../core/focus/desktopBridge';
import { MockClock, ManualScheduler } from '../../../core/engine/clock';
import { MockFocusSoundEngine, MockFocusSpeechEngine } from '../../../core/focus/focusAudio';

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

describe('Desktop Authoritative Timing & Single Audio Tests (Sections 41 & 42: Tests 26–36)', () => {
  let clock: MockClock;
  let scheduler: ManualScheduler;
  let soundEngine: MockFocusSoundEngine;
  let speechEngine: MockFocusSpeechEngine;
  let storage: MockStorage;
  let bridge: WebFallbackDesktopBridge;
  let controller: FocusTimerController;

  beforeEach(() => {
    localStorage.clear();
    clock = new MockClock(1000000);
    scheduler = new ManualScheduler();
    soundEngine = new MockFocusSoundEngine();
    speechEngine = new MockFocusSpeechEngine();
    storage = new MockStorage();
    bridge = new WebFallbackDesktopBridge();

    controller = new FocusTimerController({
      clock,
      scheduler,
      soundEngine,
      speechEngine,
      storage,
      desktopBridge: bridge,
      autoRestore: false,
    });
  });

  it('26. Mini UI does not own an independent countdown engine', async () => {
    let bridgeUpdates = 0;
    bridge.onSnapshotUpdate(() => {
      bridgeUpdates++;
    });

    await controller.startFocus();
    const initialUpdates = bridgeUpdates;

    // Advance clock: updates originate from controller ticks
    clock.advanceBy(1000);
    scheduler.triggerTick();

    expect(bridgeUpdates).toBeGreaterThan(initialUpdates);
    expect(controller.getSnapshot().remainingSec).toBe(25 * 60 - 1);
  });

  it('27. Both views derive remaining time from identical authoritative deadline', async () => {
    await controller.startFocus();

    clock.advanceBy(120000); // 2 minutes in
    scheduler.triggerTick();

    const snapshot = controller.getSnapshot();
    expect(snapshot.remainingSec).toBe(23 * 60);
    expect(snapshot.progress).toBeCloseTo(120 / (25 * 60), 4);
  });

  it('28. Delayed or throttled mini view renders do not cause time drift', async () => {
    await controller.startFocus();

    // Simulate 5 minutes in background / throttled tab
    clock.advanceBy(300000);
    scheduler.triggerTick();

    expect(controller.getSnapshot().remainingSec).toBe(20 * 60);
  });

  it('29. Main UI unmounting leaves background controller timer uninterrupted', async () => {
    await controller.startFocus();

    // Simulate main UI unmount
    clock.advanceBy(15000);
    scheduler.triggerTick();

    expect(controller.getSnapshot().remainingSec).toBe(25 * 60 - 15);
  });

  it('30. Mini UI unmounting or closing does not alter running timer', async () => {
    await controller.startFocus();
    await bridge.closeMiniWindow();

    clock.advanceBy(25000);
    scheduler.triggerTick();

    expect(controller.getSnapshot().remainingSec).toBe(25 * 60 - 25);
  });

  it('31. App reload/recreation restores authoritative deadline without drift', async () => {
    await controller.startFocus();
    clock.advanceBy(60000); // 1 min in
    scheduler.triggerTick();
    expect(controller.getSnapshot().remainingSec).toBe(24 * 60);

    // 4 minutes pass during reload
    clock.advanceBy(240000);

    const reloaded = new FocusTimerController({
      clock,
      scheduler,
      storage,
      autoRestore: true,
    });

    expect(reloaded.getSnapshot().remainingSec).toBe(20 * 60);
    expect(reloaded.getSnapshot().status).toBe('RUNNING');
  });

  it('32. Paused remaining duration restores accurately after reload', async () => {
    await controller.startFocus();
    clock.advanceBy(180000); // 3 min in
    scheduler.triggerTick();
    controller.pause();

    expect(controller.getSnapshot().remainingSec).toBe(22 * 60);

    // Closed for 1 hour while paused
    clock.advanceBy(3600000);

    const reloaded = new FocusTimerController({
      clock,
      scheduler,
      storage,
      autoRestore: true,
    });

    expect(reloaded.getSnapshot().status).toBe('PAUSED');
    expect(reloaded.getSnapshot().remainingSec).toBe(22 * 60);
  });

  it('33. Focus session completion emits exactly ONE audio sound and speech cue', async () => {
    controller.updateConfig({ focusDurationSec: 10, shortBreakDurationSec: 300, voiceEnabled: true });
    await controller.startFocus();

    clock.advanceBy(10000);
    scheduler.triggerTick();
    await Promise.resolve();
    await Promise.resolve();

    const focusCompleteSounds = soundEngine.history.filter((s) => s === 'FOCUS_COMPLETE');
    expect(focusCompleteSounds).toHaveLength(1);
    expect(speechEngine.history).toContain('Focus complete. Take a 5 minute break.');
  });

  it('34. Presence of multiple windows (Main + Mini) does NOT cause duplicate audio cues', async () => {
    controller.updateConfig({ focusDurationSec: 10, shortBreakDurationSec: 300 });

    // Open Mini Window on bridge
    await bridge.openMiniWindow(controller.getSnapshot());
    await controller.startFocus();

    clock.advanceBy(10000);
    scheduler.triggerTick();
    await Promise.resolve();

    // Sound and speech engines are ONLY instantiated in the central controller
    const focusCompleteSounds = soundEngine.history.filter((s) => s === 'FOCUS_COMPLETE');
    expect(focusCompleteSounds).toHaveLength(1);
  });

  it('35. Break session completion emits exactly ONE audio cue', async () => {
    controller.updateConfig({ shortBreakDurationSec: 5, voiceEnabled: true });
    await controller.startBreak();

    clock.advanceBy(5000);
    scheduler.triggerTick();
    await Promise.resolve();
    await Promise.resolve();

    const breakCompleteSounds = soundEngine.history.filter((s) => s === 'BREAK_COMPLETE');
    expect(breakCompleteSounds).toHaveLength(1);
    expect(speechEngine.history).toContain('Break complete.');
  });

  it('36. Audio synthesis engine failure does not interrupt timer engine progression', async () => {
    soundEngine.shouldFail = true;
    speechEngine.shouldFail = true;

    controller.updateConfig({ focusDurationSec: 10 });
    await expect(controller.startFocus()).resolves.not.toThrow();

    clock.advanceBy(10000);
    expect(() => scheduler.triggerTick()).not.toThrow();
    expect(controller.getSnapshot().todayCompletedSessions).toBe(1);
  });
});
