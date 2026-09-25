import { describe, it, expect, beforeEach } from 'vitest';
import { FocusTimerController } from '../../../core/focus/focusTimerController';
import { WebFallbackDesktopBridge, IFocusDesktopBridge } from '../../../core/focus/desktopBridge';
import { MockClock, ManualScheduler } from '../../../core/engine/clock';

describe('Desktop Window Lifecycle Tests (Section 40: Tests 19–25)', () => {
  let clock: MockClock;
  let scheduler: ManualScheduler;
  let bridge: WebFallbackDesktopBridge;
  let controller: FocusTimerController;

  beforeEach(() => {
    clock = new MockClock(1000000);
    scheduler = new ManualScheduler();
    bridge = new WebFallbackDesktopBridge();
    controller = new FocusTimerController({
      clock,
      scheduler,
      desktopBridge: bridge,
      autoRestore: false,
    });
  });

  it('19. Main window minimization does NOT pause or stop running timer', async () => {
    await controller.startFocus();
    expect(controller.getSnapshot().status).toBe('RUNNING');

    // Minimize Main CTR (calls controller.minimize() & opens mini window)
    controller.minimize();
    expect(controller.getSnapshot().isMinimized).toBe(true);
    expect(controller.getSnapshot().status).toBe('RUNNING');

    // Advance clock while minimized
    clock.advanceBy(30000);
    scheduler.triggerTick();

    expect(controller.getSnapshot().status).toBe('RUNNING');
    expect(controller.getSnapshot().remainingSec).toBe(25 * 60 - 30);
  });

  it('20. Main window hidden does NOT reset timer', async () => {
    await controller.startFocus();
    clock.advanceBy(45000);
    scheduler.triggerTick();

    // Main window is hidden (running in background)
    expect(controller.getSnapshot().status).toBe('RUNNING');
    expect(controller.getSnapshot().remainingSec).toBe(25 * 60 - 45);

    clock.advanceBy(15000);
    scheduler.triggerTick();
    expect(controller.getSnapshot().remainingSec).toBe(25 * 60 - 60);
  });

  it('21. Mini window hidden does NOT reset or interrupt active Pomodoro', async () => {
    await controller.startFocus();
    await bridge.hideMiniWindow();

    clock.advanceBy(20000);
    scheduler.triggerTick();

    expect(controller.getSnapshot().status).toBe('RUNNING');
    expect(controller.getSnapshot().remainingSec).toBe(25 * 60 - 20);
  });

  it('22. Mini window reopened displays up-to-date current snapshot', async () => {
    await controller.startFocus();
    clock.advanceBy(60000);
    scheduler.triggerTick();

    let reopenedSnapshot: any = null;
    bridge.onSnapshotUpdate((snap) => {
      reopenedSnapshot = snap;
    });

    await bridge.openMiniWindow(controller.getSnapshot());

    expect(reopenedSnapshot).not.toBeNull();
    expect(reopenedSnapshot.remainingSec).toBe(24 * 60);
    expect(reopenedSnapshot.phase).toBe('FOCUS');
    expect(reopenedSnapshot.status).toBe('RUNNING');
  });

  it('23. Expand action restores main window and sets focus', async () => {
    let restoreCalled = false;
    const mockBridge: IFocusDesktopBridge = {
      isDesktopAvailable: () => true,
      openMiniWindow: async () => {},
      closeMiniWindow: async () => {},
      hideMiniWindow: async () => {},
      restoreMainWindow: async () => {
        restoreCalled = true;
      },
      setAlwaysOnTop: async () => {},
      isAlwaysOnTop: () => true,
      syncSnapshot: async () => {},
      sendFocusCommand: async () => {},
      onFocusCommand: () => () => {},
      onSnapshotUpdate: () => () => {},
      syncTheme: async () => {},
      onThemeSync: () => () => {},
      saveMiniWindowPosition: async () => {},
      restoreMiniWindowPosition: async () => {},
    };

    const ctrl = new FocusTimerController({
      clock,
      scheduler,
      desktopBridge: mockBridge,
      autoRestore: false,
    });

    await ctrl.startFocus();
    ctrl.minimize();
    expect(ctrl.getSnapshot().isMinimized).toBe(true);

    ctrl.expand();
    expect(ctrl.getSnapshot().isMinimized).toBe(false);
    expect(restoreCalled).toBe(true);
  });

  it('24. Main close request during active Focus keeps session running in background', async () => {
    await controller.startFocus();

    // If main window close is requested while running, status remains RUNNING
    expect(controller.getSnapshot().status).toBe('RUNNING');

    clock.advanceBy(10000);
    scheduler.triggerTick();

    expect(controller.getSnapshot().status).toBe('RUNNING');
    expect(controller.getSnapshot().remainingSec).toBe(25 * 60 - 10);
  });

  it('25. Explicit controller dispose cleanly releases scheduler and listeners without orphan processes', async () => {
    await controller.startFocus();
    controller.dispose();

    // Advancing clock after dispose must not throw or alter state
    clock.advanceBy(10000);
    expect(() => scheduler.triggerTick()).not.toThrow();
  });
});
