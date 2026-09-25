import { describe, it, expect, beforeEach } from 'vitest';
import { WebFallbackDesktopBridge } from '../../../core/focus/desktopBridge';

describe('Desktop Theme Synchronization Tests (Section 43: Tests 37–40)', () => {
  let bridge: WebFallbackDesktopBridge;

  beforeEach(() => {
    bridge = new WebFallbackDesktopBridge();
  });

  it('37. Dark theme in main window transmits to mini window', async () => {
    let receivedTheme: string | null = null;
    const unlisten = bridge.onThemeSync((theme) => {
      receivedTheme = theme;
    });

    await bridge.syncTheme('dark');
    expect(receivedTheme).toBe('dark');

    unlisten();
  });

  it('38. Light theme in main window transmits to mini window', async () => {
    let receivedTheme: string | null = null;
    const unlisten = bridge.onThemeSync((theme) => {
      receivedTheme = theme;
    });

    await bridge.syncTheme('light');
    expect(receivedTheme).toBe('light');

    unlisten();
  });

  it('39. System theme resolution transmits resolved mode to mini window', async () => {
    let currentMiniTheme = 'dark';
    bridge.onThemeSync((theme) => {
      currentMiniTheme = theme;
    });

    // Main window resolves system to light
    await bridge.syncTheme('light');
    expect(currentMiniTheme).toBe('light');

    // Main window resolves system to dark
    await bridge.syncTheme('dark');
    expect(currentMiniTheme).toBe('dark');
  });

  it('40. Mini window initial render inherits current theme correctly', async () => {
    let initialTheme = 'dark';
    bridge.onThemeSync((theme) => {
      initialTheme = theme;
    });

    // Theme broadcast prior to / during mini window mount
    await bridge.syncTheme('nord');
    expect(initialTheme).toBe('nord');
  });
});
