import { isTauri } from '@tauri-apps/api/core';
import { emit, listen, UnlistenFn } from '@tauri-apps/api/event';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { FocusSnapshot } from './types';

export type FocusBridgeCommand =
  | { action: 'PAUSE' }
  | { action: 'RESUME' }
  | { action: 'TOGGLE_PAUSE' }
  | { action: 'SKIP' }
  | { action: 'RESET' }
  | { action: 'START_FOCUS' }
  | { action: 'START_BREAK'; forceLongBreak?: boolean }
  | { action: 'EXPAND' }
  | { action: 'HIDE_MINI' }
  | { action: 'SET_ALWAYS_ON_TOP'; value: boolean }
  | { action: 'REQUEST_SYNC' };

export const MINI_WINDOW_POS_KEY = 'ctr_mini_window_pos';
export const ALWAYS_ON_TOP_KEY = 'ctr_always_on_top_pref';

export interface IFocusDesktopBridge {
  isDesktopAvailable(): boolean;

  openMiniWindow(snapshot: FocusSnapshot): Promise<void>;
  closeMiniWindow(): Promise<void>;
  hideMiniWindow(): Promise<void>;

  restoreMainWindow(): Promise<void>;

  setAlwaysOnTop(alwaysOnTop: boolean): Promise<void>;
  isAlwaysOnTop(): boolean;

  syncSnapshot(snapshot: FocusSnapshot): Promise<void>;

  sendFocusCommand(command: FocusBridgeCommand): Promise<void>;
  onFocusCommand(handler: (cmd: FocusBridgeCommand) => void): () => void;

  onSnapshotUpdate(
    handler: (snapshot: FocusSnapshot) => void
  ): () => void;

  syncTheme(theme: string): Promise<void>;
  onThemeSync(handler: (theme: string) => void): () => void;

  saveMiniWindowPosition(x: number, y: number): Promise<void>;
  restoreMiniWindowPosition(): Promise<void>;
}

/* ============================================================
 * Browser fallback
 * ============================================================
 */

export class WebFallbackDesktopBridge implements IFocusDesktopBridge {
  private commandHandlers = new Set<
    (cmd: FocusBridgeCommand) => void
  >();

  private snapshotHandlers = new Set<
    (snapshot: FocusSnapshot) => void
  >();

  private themeHandlers = new Set<
    (theme: string) => void
  >();

  private alwaysOnTopState = true;

  public isDesktopAvailable(): boolean {
    return false;
  }

  public async openMiniWindow(
    snapshot: FocusSnapshot
  ): Promise<void> {
    this.snapshotHandlers.forEach((handler) => {
      handler(snapshot);
    });
  }

  public async closeMiniWindow(): Promise<void> {
    // Browser fallback:
    // handled by the in-app floating Pomodoro component.
  }

  public async hideMiniWindow(): Promise<void> {
    // No native mini window in browser mode.
  }

  public async restoreMainWindow(): Promise<void> {
    if (typeof window !== 'undefined') {
      window.focus();
    }
  }

  public async setAlwaysOnTop(
    alwaysOnTop: boolean
  ): Promise<void> {
    this.alwaysOnTopState = alwaysOnTop;
  }

  public isAlwaysOnTop(): boolean {
    return this.alwaysOnTopState;
  }

  public async syncSnapshot(
    snapshot: FocusSnapshot
  ): Promise<void> {
    this.snapshotHandlers.forEach((handler) => {
      handler(snapshot);
    });
  }

  public async sendFocusCommand(
    command: FocusBridgeCommand
  ): Promise<void> {
    this.commandHandlers.forEach((handler) => {
      handler(command);
    });
  }

  public onFocusCommand(
    handler: (cmd: FocusBridgeCommand) => void
  ): () => void {
    this.commandHandlers.add(handler);

    return () => {
      this.commandHandlers.delete(handler);
    };
  }

  public onSnapshotUpdate(
    handler: (snapshot: FocusSnapshot) => void
  ): () => void {
    this.snapshotHandlers.add(handler);

    return () => {
      this.snapshotHandlers.delete(handler);
    };
  }

  public async syncTheme(theme: string): Promise<void> {
    this.themeHandlers.forEach((handler) => {
      handler(theme);
    });
  }

  public onThemeSync(
    handler: (theme: string) => void
  ): () => void {
    this.themeHandlers.add(handler);

    return () => {
      this.themeHandlers.delete(handler);
    };
  }

  public async saveMiniWindowPosition(
    _x: number,
    _y: number
  ): Promise<void> {
    // No-op in browser mode.
  }

  public async restoreMiniWindowPosition(): Promise<void> {
    // No-op in browser mode.
  }
}

/* ============================================================
 * Tauri desktop bridge
 * ============================================================
 */

export class TauriDesktopBridge implements IFocusDesktopBridge {
  private alwaysOnTopState = true;
  private storage: Storage | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.storage = window.localStorage;

      const savedPref =
        this.storage.getItem(ALWAYS_ON_TOP_KEY);

      if (savedPref !== null) {
        this.alwaysOnTopState = savedPref === 'true';
      }
    }
  }

  public isDesktopAvailable(): boolean {
    try {
      return isTauri();
    } catch {
      return false;
    }
  }

  /* ----------------------------------------------------------
   * MINI WINDOW
   *
   * IMPORTANT:
   * pomodoro-mini is created ONLY by tauri.conf.json.
   *
   * Do NOT create another WebviewWindow here.
   * ----------------------------------------------------------
   */

  public async openMiniWindow(
    snapshot: FocusSnapshot
  ): Promise<void> {
    if (!this.isDesktopAvailable()) {
      return;
    }

    try {
      const miniWindow =
        await WebviewWindow.getByLabel('pomodoro-mini');

      if (!miniWindow) {
        console.warn(
          'CTR: pomodoro-mini window was not found. ' +
          'It must be defined in tauri.conf.json.'
        );

        return;
      }

      /*
       * For the X11 stability test we intentionally do NOT:
       *
       * - dynamically create the window
       * - restore its position
       * - call setPosition()
       * - change decorations
       * - change transparency
       * - change skipTaskbar
       *
       * We only show the existing native window and make
       * it always-on-top.
       */

      await miniWindow.show();

      await miniWindow.setAlwaysOnTop(
        this.alwaysOnTopState
      );

      await this.syncSnapshot(snapshot);
    } catch (err) {
      console.warn(
        'Tauri openMiniWindow warning:',
        err
      );
    }
  }

  public async closeMiniWindow(): Promise<void> {
    await this.hideMiniWindow();
  }

  public async hideMiniWindow(): Promise<void> {
    if (!this.isDesktopAvailable()) {
      return;
    }

    try {
      const miniWindow =
        await WebviewWindow.getByLabel('pomodoro-mini');

      if (miniWindow) {
        await miniWindow.hide();
      }
    } catch (err) {
      console.warn(
        'Tauri hideMiniWindow warning:',
        err
      );
    }
  }

  /* ----------------------------------------------------------
   * MAIN WINDOW
   * ----------------------------------------------------------
   */

  public async restoreMainWindow(): Promise<void> {
    if (!this.isDesktopAvailable()) {
      if (typeof window !== 'undefined') {
        window.focus();
      }

      return;
    }

    try {
      const mainWindow =
        await WebviewWindow.getByLabel('main');

      if (!mainWindow) {
        console.warn(
          'CTR: main Tauri window was not found.'
        );

        return;
      }

      await mainWindow.unminimize();
      await mainWindow.show();
      await mainWindow.setFocus();
    } catch (err) {
      console.warn(
        'Tauri restoreMainWindow warning:',
        err
      );
    }
  }

  /* ----------------------------------------------------------
   * ALWAYS ON TOP
   * ----------------------------------------------------------
   */

  public async setAlwaysOnTop(
    alwaysOnTop: boolean
  ): Promise<void> {
    this.alwaysOnTopState = alwaysOnTop;

    this.storage?.setItem(
      ALWAYS_ON_TOP_KEY,
      String(alwaysOnTop)
    );

    if (!this.isDesktopAvailable()) {
      return;
    }

    try {
      const miniWindow =
        await WebviewWindow.getByLabel('pomodoro-mini');

      if (miniWindow) {
        await miniWindow.setAlwaysOnTop(
          alwaysOnTop
        );
      }
    } catch (err) {
      console.warn(
        'Tauri setAlwaysOnTop warning:',
        err
      );
    }
  }

  public isAlwaysOnTop(): boolean {
    return this.alwaysOnTopState;
  }

  /* ----------------------------------------------------------
   * SNAPSHOT SYNCHRONIZATION
   * ----------------------------------------------------------
   */

  public async syncSnapshot(
    snapshot: FocusSnapshot
  ): Promise<void> {
    if (!this.isDesktopAvailable()) {
      return;
    }

    try {
      await emit(
        'focus:state-update',
        snapshot
      );
    } catch (err) {
      console.warn(
        'Tauri syncSnapshot warning:',
        err
      );
    }
  }

  public onSnapshotUpdate(
    handler: (snapshot: FocusSnapshot) => void
  ): () => void {
    if (!this.isDesktopAvailable()) {
      return () => {};
    }

    let unlisten: UnlistenFn | null = null;
    let cancelled = false;

    listen<FocusSnapshot>(
      'focus:state-update',
      (event) => {
        if (!cancelled) {
          handler(event.payload);
        }
      }
    )
      .then((unlistenFn) => {
        if (cancelled) {
          unlistenFn();
        } else {
          unlisten = unlistenFn;
        }
      })
      .catch((err) => {
        console.warn(
          'Tauri onSnapshotUpdate listen error:',
          err
        );
      });

    return () => {
      cancelled = true;

      if (unlisten) {
        unlisten();
      }
    };
  }

  /* ----------------------------------------------------------
   * COMMAND SYNCHRONIZATION
   * ----------------------------------------------------------
   */

  public async sendFocusCommand(
    command: FocusBridgeCommand
  ): Promise<void> {
    if (!this.isDesktopAvailable()) {
      return;
    }

    try {
      await emit(
        'focus:command',
        command
      );
    } catch (err) {
      console.warn(
        'Tauri sendFocusCommand warning:',
        err
      );
    }
  }

  public onFocusCommand(
    handler: (cmd: FocusBridgeCommand) => void
  ): () => void {
    if (!this.isDesktopAvailable()) {
      return () => {};
    }

    let unlisten: UnlistenFn | null = null;
    let cancelled = false;

    listen<FocusBridgeCommand>(
      'focus:command',
      (event) => {
        if (!cancelled) {
          handler(event.payload);
        }
      }
    )
      .then((unlistenFn) => {
        if (cancelled) {
          unlistenFn();
        } else {
          unlisten = unlistenFn;
        }
      })
      .catch((err) => {
        console.warn(
          'Tauri onFocusCommand listen error:',
          err
        );
      });

    return () => {
      cancelled = true;

      if (unlisten) {
        unlisten();
      }
    };
  }

  /* ----------------------------------------------------------
   * THEME SYNCHRONIZATION
   * ----------------------------------------------------------
   */

  public async syncTheme(
    theme: string
  ): Promise<void> {
    if (!this.isDesktopAvailable()) {
      return;
    }

    try {
      await emit(
        'theme:sync',
        { theme }
      );
    } catch (err) {
      console.warn(
        'Tauri syncTheme warning:',
        err
      );
    }
  }

  public onThemeSync(
    handler: (theme: string) => void
  ): () => void {
    if (!this.isDesktopAvailable()) {
      return () => {};
    }

    let unlisten: UnlistenFn | null = null;
    let cancelled = false;

    listen<{ theme: string }>(
      'theme:sync',
      (event) => {
        if (!cancelled) {
          handler(event.payload.theme);
        }
      }
    )
      .then((unlistenFn) => {
        if (cancelled) {
          unlistenFn();
        } else {
          unlisten = unlistenFn;
        }
      })
      .catch((err) => {
        console.warn(
          'Tauri onThemeSync listen error:',
          err
        );
      });

    return () => {
      cancelled = true;

      if (unlisten) {
        unlisten();
      }
    };
  }

  /* ----------------------------------------------------------
   * WINDOW POSITION
   *
   * TEMPORARILY DISABLED FOR X11 STABILITY TEST.
   *
   * Keep these methods so callers/tests don't break.
   * We'll restore safe position persistence after the basic
   * always-on-top window works.
   * ----------------------------------------------------------
   */

  public async saveMiniWindowPosition(
    x: number,
    y: number
  ): Promise<void> {
    this.storage?.setItem(
      MINI_WINDOW_POS_KEY,
      JSON.stringify({ x, y })
    );
  }

  public async restoreMiniWindowPosition(): Promise<void> {
    /*
     * Intentionally disabled.
     *
     * Previously this method used:
     *
     * availableMonitors()
     * primaryMonitor()
     * PhysicalPosition
     * setPosition()
     *
     * Those native X11 operations are removed while we isolate
     * the XCB crash.
     */
    return;
  }
}

/* ============================================================
 * BRIDGE FACTORY
 * ============================================================
 */

export function createDesktopBridge(): IFocusDesktopBridge {
  if (typeof window !== 'undefined') {
    try {
      if (isTauri()) {
        return new TauriDesktopBridge();
      }
    } catch {
      // Fall through to browser implementation.
    }
  }

  return new WebFallbackDesktopBridge();
}

export const defaultDesktopBridge: IFocusDesktopBridge =
  createDesktopBridge();
