import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { FocusTimerController } from '../../core/focus/focusTimerController';
import { FocusConfig, FocusEvent, FocusPreset, FocusSnapshot } from '../../core/focus/types';
import { formatDigitalTime } from '../../shared/utils/timeFormat';

export interface FocusContextValue {
  controller: FocusTimerController;
  snapshot: FocusSnapshot;
  start: () => void;
  startFocus: () => Promise<void>;
  startBreak: (forceLongBreak?: boolean) => Promise<void>;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  skip: () => void;
  minimize: () => void;
  expand: () => void;
  setLabel: (label: string) => void;
  updateConfig: (config: Partial<FocusConfig>) => void;
  applyPreset: (preset: FocusPreset) => void;
}

const FocusContext = createContext<FocusContextValue | null>(null);

export interface FocusProviderProps {
  children: React.ReactNode;
  controller?: FocusTimerController;
}

export function FocusProvider({ children, controller: injectedController }: FocusProviderProps) {
  const controller = useMemo(
    () => injectedController ?? new FocusTimerController(),
    [injectedController]
  );

  const [snapshot, setSnapshot] = useState<FocusSnapshot>(() => controller.getSnapshot());

  useEffect(() => {
    // Initial snapshot update
    setSnapshot(controller.getSnapshot());

    const unsubscribe = controller.subscribe((event: FocusEvent) => {
      setSnapshot(event.snapshot);
    });

    return () => {
      unsubscribe();
    };
  }, [controller]);

  // Update browser document title based on Pomodoro state
  useEffect(() => {
    const originalTitle = document.title || 'CTR — Custom Training Timer';

    if (snapshot.status === 'RUNNING') {
      const timeStr = formatDigitalTime(snapshot.remainingSec);
      const phaseName =
        snapshot.phase === 'FOCUS'
          ? 'Focus'
          : snapshot.phase === 'LONG_BREAK'
          ? 'Long Break'
          : 'Break';
      document.title = `${timeStr} • ${phaseName} — CTR`;
    } else if (snapshot.status === 'PAUSED') {
      const timeStr = formatDigitalTime(snapshot.remainingSec);
      const phaseName =
        snapshot.phase === 'FOCUS'
          ? 'Focus'
          : snapshot.phase === 'LONG_BREAK'
          ? 'Long Break'
          : 'Break';
      document.title = `⏸ ${timeStr} • ${phaseName} — CTR`;
    } else {
      document.title = 'CTR — Custom Training Timer';
    }

    return () => {
      document.title = originalTitle;
    };
  }, [snapshot.status, snapshot.phase, snapshot.remainingSec]);

  const value: FocusContextValue = useMemo(
    () => ({
      controller,
      snapshot,
      start: () => controller.start(),
      startFocus: () => controller.startFocus(),
      startBreak: (forceLongBreak?: boolean) => controller.startBreak(forceLongBreak),
      pause: () => controller.pause(),
      resume: () => controller.resume(),
      reset: () => controller.reset(),
      skip: () => controller.skip(),
      minimize: () => controller.minimize(),
      expand: () => controller.expand(),
      setLabel: (label: string) => controller.setLabel(label),
      updateConfig: (cfg: Partial<FocusConfig>) => controller.updateConfig(cfg),
      applyPreset: (preset: FocusPreset) => controller.applyPreset(preset),
    }),
    [controller, snapshot]
  );

  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
}

export function useOptionalFocusTimer(): FocusContextValue | null {
  return useContext(FocusContext);
}

export function useFocusTimer(): FocusContextValue {
  const ctx = useContext(FocusContext);
  if (!ctx) {
    throw new Error('useFocusTimer must be used within a FocusProvider');
  }
  return ctx;
}
