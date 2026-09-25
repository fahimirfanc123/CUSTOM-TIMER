import { describe, it, expect } from 'vitest';
import { WebFallbackDesktopBridge, defaultDesktopBridge, IFocusDesktopBridge } from '../desktopBridge';
import { FocusTimerController } from '../focusTimerController';
import { MockClock, ManualScheduler } from '../../engine/clock';

describe('Desktop Architecture & Tauri Bridge Tests (Critical Requirement)', () => {
  it('1. Web fallback bridge correctly reports desktop unavailability in browser', () => {
    const bridge = new WebFallbackDesktopBridge();
    expect(bridge.isDesktopAvailable()).toBe(false);
  });

  it('2. Default desktop bridge is initialized and conforms to IFocusDesktopBridge', () => {
    expect(defaultDesktopBridge).toBeDefined();
    expect(typeof defaultDesktopBridge.isDesktopAvailable).toBe('function');
    expect(typeof defaultDesktopBridge.openMiniWindow).toBe('function');
    expect(typeof defaultDesktopBridge.closeMiniWindow).toBe('function');
    expect(typeof defaultDesktopBridge.restoreMainWindow).toBe('function');
    expect(typeof defaultDesktopBridge.setAlwaysOnTop).toBe('function');
    expect(typeof defaultDesktopBridge.syncSnapshot).toBe('function');
  });

  it('3. Timer controller state is independent of browser DOM / React lifecycle', async () => {
    const clock = new MockClock(1000000);
    const scheduler = new ManualScheduler();
    const controller = new FocusTimerController({ clock, scheduler, autoRestore: false });

    // Start timer outside any React component
    await controller.startFocus();
    clock.advanceBy(10000);
    scheduler.triggerTick();

    const snapshot = controller.getSnapshot();
    expect(snapshot.phase).toBe('FOCUS');
    expect(snapshot.remainingSec).toBe(25 * 60 - 10);

    // Snapshot can be serialized cleanly for future Tauri IPC
    const serialized = JSON.stringify(snapshot);
    expect(serialized).toContain('"phase":"FOCUS"');
  });

  it('4. Mock desktop bridge can receive synchronized snapshots without modifying timer engine', async () => {
    const snapshotsReceived: any[] = [];

    const mockTauriBridge: IFocusDesktopBridge = {
      isDesktopAvailable: () => true,
      openMiniWindow: async (snap) => {
        snapshotsReceived.push(snap);
      },
      closeMiniWindow: async () => {},
      restoreMainWindow: async () => {},
      setAlwaysOnTop: async () => {},
      syncSnapshot: async (snap) => {
        snapshotsReceived.push(snap);
      },
    };

    expect(mockTauriBridge.isDesktopAvailable()).toBe(true);

    const clock = new MockClock(1000000);
    const scheduler = new ManualScheduler();
    const controller = new FocusTimerController({ clock, scheduler, autoRestore: false });

    await controller.startFocus();
    await mockTauriBridge.openMiniWindow(controller.getSnapshot());

    expect(snapshotsReceived).toHaveLength(1);
    expect(snapshotsReceived[0].phase).toBe('FOCUS');
  });
});
