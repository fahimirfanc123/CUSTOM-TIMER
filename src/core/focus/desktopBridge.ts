import { FocusSnapshot } from './types';

export interface IFocusDesktopBridge {
  isDesktopAvailable(): boolean;
  openMiniWindow(snapshot: FocusSnapshot): Promise<void>;
  closeMiniWindow(): Promise<void>;
  restoreMainWindow(): Promise<void>;
  setAlwaysOnTop(alwaysOnTop: boolean): Promise<void>;
  syncSnapshot(snapshot: FocusSnapshot): Promise<void>;
}

export class WebFallbackDesktopBridge implements IFocusDesktopBridge {
  public isDesktopAvailable(): boolean {
    return false;
  }

  public async openMiniWindow(_snapshot: FocusSnapshot): Promise<void> {
    // In pure browser mode, in-app floating mini timer is used.
  }

  public async closeMiniWindow(): Promise<void> {
    // In pure browser mode, no separate desktop window to close.
  }

  public async restoreMainWindow(): Promise<void> {
    if (typeof window !== 'undefined') {
      window.focus();
    }
  }

  public async setAlwaysOnTop(_alwaysOnTop: boolean): Promise<void> {
    // Web browsers cannot guarantee OS-level always-on-top without desktop shell.
  }

  public async syncSnapshot(_snapshot: FocusSnapshot): Promise<void> {
    // Snapshot is already shared in-memory via FocusTimerController singleton.
  }
}

export const defaultDesktopBridge: IFocusDesktopBridge = new WebFallbackDesktopBridge();
