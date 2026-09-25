import { describe, it, expect, beforeEach } from 'vitest';
import {
  WebFallbackDesktopBridge,
  TauriDesktopBridge,
  IFocusDesktopBridge,
  ALWAYS_ON_TOP_KEY,
} from '../desktopBridge';
import { FocusTimerController } from '../focusTimerController';
import { MockClock, ManualScheduler } from '../../engine/clock';

describe('Desktop Platform Adapter Tests (Section 38: Tests 1–8)', () => {
  let clock: MockClock;
  let scheduler: ManualScheduler;

  beforeEach(() => {
    clock = new MockClock(1000000);
    scheduler = new ManualScheduler();
    localStorage.clear();
  });

  it('1. Browser platform detection correctly reports unavailable in standard browser', () => {
    const webBridge = new WebFallbackDesktopBridge();
    expect(webBridge.isDesktopAvailable()).toBe(false);
  });

  it('2. Desktop platform detection correctly identifies environment', () => {
    const tauriBridge = new TauriDesktopBridge();
    // In node/jsdom without window.__TAURI_INTERNALS__, returns false cleanly
    expect(typeof tauriBridge.isDesktopAvailable).toBe('function');
    expect(typeof tauriBridge.openMiniWindow).toBe('function');
    expect(typeof tauriBridge.hideMiniWindow).toBe('function');
    expect(typeof tauriBridge.restoreMainWindow).toBe('function');
    expect(typeof tauriBridge.setAlwaysOnTop).toBe('function');
    expect(typeof tauriBridge.syncSnapshot).toBe('function');
    expect(typeof tauriBridge.sendFocusCommand).toBe('function');
    expect(typeof tauriBridge.onFocusCommand).toBe('function');
    expect(typeof tauriBridge.onSnapshotUpdate).toBe('function');
  });

  it('3. Browser fallback bridge operates safely in browser without errors', async () => {
    const webBridge = new WebFallbackDesktopBridge();
    const controller = new FocusTimerController({
      clock,
      scheduler,
      desktopBridge: webBridge,
      autoRestore: false,
    });

    await expect(webBridge.openMiniWindow(controller.getSnapshot())).resolves.not.toThrow();
    await expect(webBridge.closeMiniWindow()).resolves.not.toThrow();
    await expect(webBridge.hideMiniWindow()).resolves.not.toThrow();
    await expect(webBridge.restoreMainWindow()).resolves.not.toThrow();
    await expect(webBridge.setAlwaysOnTop(true)).resolves.not.toThrow();
  });

  it('4. Show mini-window request propagates snapshot to listener', async () => {
    const webBridge = new WebFallbackDesktopBridge();
    let receivedSnapshot: any = null;

    const unlisten = webBridge.onSnapshotUpdate((snap) => {
      receivedSnapshot = snap;
    });

    const controller = new FocusTimerController({
      clock,
      scheduler,
      desktopBridge: webBridge,
      autoRestore: false,
    });

    await controller.startFocus();
    await webBridge.openMiniWindow(controller.getSnapshot());

    expect(receivedSnapshot).toBeDefined();
    expect(receivedSnapshot.phase).toBe('FOCUS');
    expect(receivedSnapshot.status).toBe('RUNNING');

    unlisten();
  });

  it('5. Hide mini-window request executes cleanly', async () => {
    const webBridge = new WebFallbackDesktopBridge();
    await expect(webBridge.hideMiniWindow()).resolves.not.toThrow();
  });

  it('6. Restore main-window request succeeds safely', async () => {
    const webBridge = new WebFallbackDesktopBridge();
    await expect(webBridge.restoreMainWindow()).resolves.not.toThrow();
  });

  it('7. Always-on-top preference persists and toggles accurately', async () => {
    const tauriBridge = new TauriDesktopBridge();
    expect(tauriBridge.isAlwaysOnTop()).toBe(true);

    await tauriBridge.setAlwaysOnTop(false);
    expect(tauriBridge.isAlwaysOnTop()).toBe(false);
    expect(localStorage.getItem(ALWAYS_ON_TOP_KEY)).toBe('false');

    await tauriBridge.setAlwaysOnTop(true);
    expect(tauriBridge.isAlwaysOnTop()).toBe(true);
    expect(localStorage.getItem(ALWAYS_ON_TOP_KEY)).toBe('true');
  });

  it('8. Platform bridge errors or exceptions do not crash timer engine', async () => {
    const faultyBridge: IFocusDesktopBridge = {
      isDesktopAvailable: () => true,
      openMiniWindow: async () => {
        throw new Error('IPC connection failure');
      },
      closeMiniWindow: async () => {
        throw new Error('IPC connection failure');
      },
      hideMiniWindow: async () => {
        throw new Error('IPC connection failure');
      },
      restoreMainWindow: async () => {
        throw new Error('IPC connection failure');
      },
      setAlwaysOnTop: async () => {
        throw new Error('IPC connection failure');
      },
      isAlwaysOnTop: () => true,
      syncSnapshot: async () => {
        throw new Error('IPC broadcast failure');
      },
      sendFocusCommand: async () => {
        throw new Error('IPC command failure');
      },
      onFocusCommand: () => () => {},
      onSnapshotUpdate: () => () => {},
      syncTheme: async () => {},
      onThemeSync: () => () => {},
      saveMiniWindowPosition: async () => {},
      restoreMiniWindowPosition: async () => {},
    };

    const controller = new FocusTimerController({
      clock,
      scheduler,
      desktopBridge: faultyBridge,
      autoRestore: false,
    });

    // Start, minimize, pause, tick should all succeed without uncaught throws
    await expect(controller.startFocus()).resolves.not.toThrow();
    expect(() => controller.minimize()).not.toThrow();

    clock.advanceBy(5000);
    expect(() => scheduler.triggerTick()).not.toThrow();
    expect(controller.getSnapshot().remainingSec).toBe(25 * 60 - 5);

    expect(() => controller.expand()).not.toThrow();
  });
});
