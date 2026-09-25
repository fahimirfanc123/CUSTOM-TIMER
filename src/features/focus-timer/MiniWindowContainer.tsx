import { FC, useEffect, useState, useRef, useCallback } from 'react';
import { FocusSnapshot, defaultFocusConfig } from '../../core/focus/types';
import { IFocusDesktopBridge, defaultDesktopBridge } from '../../core/focus/desktopBridge';
import { PomodoroMiniWindow } from './PomodoroMiniWindow';

export interface MiniWindowContainerProps {
  bridge?: IFocusDesktopBridge;
}

const defaultInitialSnapshot: FocusSnapshot = {
  phase: 'IDLE',
  status: 'IDLE',
  currentSession: 1,
  sessionsBeforeLongBreak: 4,
  totalDurationSec: 25 * 60,
  remainingSec: 25 * 60,
  remainingMs: 25 * 60 * 1000,
  progress: 0,
  label: '',
  config: { ...defaultFocusConfig },
  isMinimized: true,
  todayCompletedSessions: 0,
  todayFocusTimeSec: 0,
};

export const MiniWindowContainer: FC<MiniWindowContainerProps> = ({
  bridge = defaultDesktopBridge,
}) => {
  const [snapshot, setSnapshot] = useState<FocusSnapshot>(defaultInitialSnapshot);
  const [displayRemainingSec, setDisplayRemainingSec] = useState<number>(defaultInitialSnapshot.remainingSec);
  const [alwaysOnTop, setAlwaysOnTop] = useState<boolean>(() => bridge.isAlwaysOnTop());

  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

  // 1. Subscribe to snapshot updates from the authoritative main controller
  useEffect(() => {
    const unlistenSnapshot = bridge.onSnapshotUpdate((updatedSnapshot) => {
      setSnapshot(updatedSnapshot);
      setDisplayRemainingSec(updatedSnapshot.remainingSec);
    });

    const unlistenTheme = bridge.onThemeSync((theme) => {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', prefersDark);
      }
    });

    // Request initial snapshot from main window
    bridge.sendFocusCommand({ action: 'REQUEST_SYNC' });

    return () => {
      unlistenSnapshot();
      unlistenTheme();
    };
  }, [bridge]);

  // 2. High-frequency UI tick derivation (250ms) to ensure smooth display between 1s controller ticks
  useEffect(() => {
    if (snapshot.status !== 'RUNNING') {
      setDisplayRemainingSec(snapshot.remainingSec);
      return;
    }

    const interval = setInterval(() => {
      const snap = snapshotRef.current;
      if (snap.status === 'RUNNING') {
        setDisplayRemainingSec(snap.remainingSec);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [snapshot.status, snapshot.remainingSec]);

  // 3. Command Dispatches
  const handlePause = useCallback(() => {
    bridge.sendFocusCommand({ action: 'PAUSE' });
  }, [bridge]);

  const handleResume = useCallback(() => {
    bridge.sendFocusCommand({ action: 'RESUME' });
  }, [bridge]);

  const handleSkip = useCallback(() => {
    bridge.sendFocusCommand({ action: 'SKIP' });
  }, [bridge]);

  const handleStartFocus = useCallback(() => {
    bridge.sendFocusCommand({ action: 'START_FOCUS' });
  }, [bridge]);

  const handleStartBreak = useCallback(() => {
    bridge.sendFocusCommand({ action: 'START_BREAK' });
  }, [bridge]);

  const handleExpand = useCallback(() => {
    bridge.sendFocusCommand({ action: 'EXPAND' });
    bridge.restoreMainWindow();
  }, [bridge]);

  const handleHide = useCallback(() => {
    bridge.sendFocusCommand({ action: 'HIDE_MINI' });
    bridge.hideMiniWindow();
  }, [bridge]);

  const handleToggleAlwaysOnTop = useCallback(() => {
    const nextState = !alwaysOnTop;
    setAlwaysOnTop(nextState);
    bridge.setAlwaysOnTop(nextState);
  }, [alwaysOnTop, bridge]);

  // Merge dynamic remaining time into display snapshot
  const activeSnapshot: FocusSnapshot = {
    ...snapshot,
    remainingSec: displayRemainingSec,
    progress:
      snapshot.totalDurationSec > 0
        ? Math.min(1.0, Math.max(0.0, (snapshot.totalDurationSec - displayRemainingSec) / snapshot.totalDurationSec))
        : 0,
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center p-1 bg-transparent overflow-hidden">
      <PomodoroMiniWindow
        snapshot={activeSnapshot}
        onPause={handlePause}
        onResume={handleResume}
        onSkip={handleSkip}
        onStartFocus={handleStartFocus}
        onStartBreak={handleStartBreak}
        onExpand={handleExpand}
        onHide={handleHide}
        alwaysOnTop={alwaysOnTop}
        onToggleAlwaysOnTop={handleToggleAlwaysOnTop}
      />
    </div>
  );
};
