import { describe, it, expect, beforeEach } from 'vitest';
import { FocusTimerController } from '../../../core/focus/focusTimerController';
import { WebFallbackDesktopBridge } from '../../../core/focus/desktopBridge';
import { MockClock, ManualScheduler } from '../../../core/engine/clock';
import { FocusSnapshot } from '../../../core/focus/types';

describe('Desktop Cross-Window Shared State Tests (Section 39: Tests 9–18)', () => {
  let clock: MockClock;
  let scheduler: ManualScheduler;
  let bridge: WebFallbackDesktopBridge;
  let controller: FocusTimerController;
  let miniSnapshot: FocusSnapshot | null = null;

  beforeEach(() => {
    localStorage.clear();
    clock = new MockClock(1000000);
    scheduler = new ManualScheduler();
    bridge = new WebFallbackDesktopBridge();
    miniSnapshot = null;

    bridge.onSnapshotUpdate((snap) => {
      miniSnapshot = snap;
    });

    controller = new FocusTimerController({
      clock,
      scheduler,
      desktopBridge: bridge,
      autoRestore: false,
    });
  });

  it('9. Main and mini views reference identical logical Pomodoro state', async () => {
    await controller.startFocus();
    expect(miniSnapshot).not.toBeNull();
    expect(miniSnapshot!.phase).toBe('FOCUS');
    expect(miniSnapshot!.status).toBe('RUNNING');
    expect(miniSnapshot!.remainingSec).toBe(controller.getSnapshot().remainingSec);
  });

  it('10. Pause initiated from main controller is immediately reflected in mini view', async () => {
    await controller.startFocus();
    clock.advanceBy(60000);
    scheduler.triggerTick();

    controller.pause();
    expect(controller.getSnapshot().status).toBe('PAUSED');
    expect(miniSnapshot!.status).toBe('PAUSED');
    expect(miniSnapshot!.remainingSec).toBe(24 * 60);
  });

  it('11. Pause command sent from mini view pauses the main controller', async () => {
    await controller.startFocus();
    expect(controller.getSnapshot().status).toBe('RUNNING');

    // Simulate user clicking Pause on Mini Window
    await bridge.sendFocusCommand({ action: 'PAUSE' });

    expect(controller.getSnapshot().status).toBe('PAUSED');
    expect(miniSnapshot!.status).toBe('PAUSED');
  });

  it('12. Resume initiated from main controller is immediately reflected in mini view', async () => {
    await controller.startFocus();
    controller.pause();
    expect(miniSnapshot!.status).toBe('PAUSED');

    controller.resume();
    expect(controller.getSnapshot().status).toBe('RUNNING');
    expect(miniSnapshot!.status).toBe('RUNNING');
  });

  it('13. Resume command sent from mini view resumes the main controller', async () => {
    await controller.startFocus();
    controller.pause();
    expect(controller.getSnapshot().status).toBe('PAUSED');

    // Simulate user clicking Resume on Mini Window
    await bridge.sendFocusCommand({ action: 'RESUME' });

    expect(controller.getSnapshot().status).toBe('RUNNING');
    expect(miniSnapshot!.status).toBe('RUNNING');
  });

  it('14. Skip command sent from mini view transitions phase on main controller', async () => {
    await controller.startFocus();
    expect(controller.getSnapshot().phase).toBe('FOCUS');

    // Simulate user clicking Skip on Mini Window
    await bridge.sendFocusCommand({ action: 'SKIP' });

    expect(controller.getSnapshot().phase).toBe('SHORT_BREAK');
    expect(miniSnapshot!.phase).toBe('SHORT_BREAK');
  });

  it('15. Natural completion on main controller updates both views', async () => {
    controller.updateConfig({ focusDurationSec: 10, shortBreakDurationSec: 5, autoStartBreaks: true });
    await controller.startFocus();

    clock.advanceBy(10000);
    scheduler.triggerTick();

    expect(controller.getSnapshot().phase).toBe('SHORT_BREAK');
    expect(controller.getSnapshot().todayCompletedSessions).toBe(1);
    expect(miniSnapshot!.phase).toBe('SHORT_BREAK');
    expect(miniSnapshot!.todayCompletedSessions).toBe(1);
  });

  it('16. Reset from main or bridge resets state on both views', async () => {
    await controller.startFocus();
    clock.advanceBy(30000);
    scheduler.triggerTick();

    await bridge.sendFocusCommand({ action: 'RESET' });

    expect(controller.getSnapshot().status).toBe('IDLE');
    expect(controller.getSnapshot().phase).toBe('IDLE');
    expect(miniSnapshot!.status).toBe('IDLE');
    expect(miniSnapshot!.remainingSec).toBe(25 * 60);
  });

  it('17. Label updates from main controller are immediately synchronized to mini view', () => {
    controller.setLabel('Writing Technical Specification');
    expect(controller.getSnapshot().label).toBe('Writing Technical Specification');
    expect(miniSnapshot!.label).toBe('Writing Technical Specification');
  });

  it('18. Session counters across main and mini remain strictly identical through multiple cycles', async () => {
    controller.updateConfig({
      focusDurationSec: 10,
      shortBreakDurationSec: 5,
      sessionsBeforeLongBreak: 4,
      autoStartBreaks: true,
      autoStartFocus: true,
    });

    // Session 1
    await controller.startFocus();
    expect(miniSnapshot!.currentSession).toBe(1);

    // Complete focus session 1 -> break 1
    clock.advanceBy(10000);
    scheduler.triggerTick();
    expect(miniSnapshot!.currentSession).toBe(1);

    // Complete break 1 -> focus session 2
    clock.advanceBy(5000);
    scheduler.triggerTick();
    expect(controller.getSnapshot().currentSession).toBe(2);
    expect(miniSnapshot!.currentSession).toBe(2);
  });
});
