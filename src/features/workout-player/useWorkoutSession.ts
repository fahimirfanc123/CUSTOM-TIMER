import { useSyncExternalStore, useCallback } from 'react';
import { WorkoutSessionController } from './sessionController';
import { Workout } from '../../core/models/workout';
import { EngineSnapshot } from '../../core/engine/types';
import { AudioSettings } from '../../core/audio/types';

export interface UseWorkoutSessionReturn {
  snapshot: EngineSnapshot | null;
  workout: Workout | null;
  audioSettings: AudioSettings;
  startWorkout: (workout: Workout) => Promise<EngineSnapshot>;
  restartWorkout: () => Promise<EngineSnapshot | null>;
  reset: () => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  previous: () => void;
  restartCurrentSegment: () => void;
  addTime: (seconds: number) => void;
  endWorkout: () => void;
  toggleVoice: () => boolean;
  toggleSound: () => boolean;
}

export function useWorkoutSession(controller: WorkoutSessionController): UseWorkoutSessionReturn {
  const subscribeSnapshot = useCallback(
    (onStoreChange: () => void) => controller.subscribe(() => onStoreChange()),
    [controller]
  );

  const getSnapshot = useCallback(() => controller.getSnapshot(), [controller]);

  const snapshot = useSyncExternalStore(subscribeSnapshot, getSnapshot);

  const subscribeAudio = useCallback(
    (onStoreChange: () => void) => controller.subscribeAudio(() => onStoreChange()),
    [controller]
  );

  const getAudioSettings = useCallback(() => controller.getAudioSettings(), [controller]);

  const audioSettings = useSyncExternalStore(subscribeAudio, getAudioSettings);

  const startWorkout = useCallback(
    (workout: Workout) => controller.startWorkout(workout),
    [controller]
  );

  const restartWorkout = useCallback(
    () => controller.restartWorkout(),
    [controller]
  );

  const reset = useCallback(
    () => controller.reset(),
    [controller]
  );

  const pause = useCallback(
    () => controller.pause(),
    [controller]
  );

  const resume = useCallback(
    () => controller.resume(),
    [controller]
  );

  const next = useCallback(
    () => controller.next(),
    [controller]
  );

  const previous = useCallback(
    () => controller.previous(),
    [controller]
  );

  const restartCurrentSegment = useCallback(
    () => controller.restartCurrentSegment(),
    [controller]
  );

  const addTime = useCallback(
    (seconds: number) => controller.addTime(seconds),
    [controller]
  );

  const endWorkout = useCallback(
    () => controller.endWorkout(),
    [controller]
  );

  const toggleVoice = useCallback(
    () => controller.toggleVoice(),
    [controller]
  );

  const toggleSound = useCallback(
    () => controller.toggleSound(),
    [controller]
  );

  return {
    snapshot,
    workout: controller.getWorkout(),
    audioSettings,
    startWorkout,
    restartWorkout,
    reset,
    pause,
    resume,
    next,
    previous,
    restartCurrentSegment,
    addTime,
    endWorkout,
    toggleVoice,
    toggleSound,
  };
}
