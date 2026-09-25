import { useState, useMemo } from 'react';
import { WorkoutSessionController } from '../features/workout-player/sessionController';
import { useWorkoutSession } from '../features/workout-player/useWorkoutSession';
import { WorkoutHome } from '../features/workout-player/WorkoutHome';
import { ActiveWorkout } from '../features/workout-player/ActiveWorkout';
import { WorkoutComplete } from '../features/workout-player/WorkoutComplete';
import { WorkoutBuilder } from '../features/workout-builder/WorkoutBuilder';
import { FocusScreen } from '../features/focus-timer/FocusScreen';
import { FloatingPomodoro } from '../features/focus-timer/FloatingPomodoro';
import { FocusProvider, useOptionalFocusTimer } from '../features/focus-timer/FocusContext';
import { WorkoutConflictDialog } from '../features/focus-timer/WorkoutConflictDialog';
import { FocusTimerController } from '../core/focus/focusTimerController';
import { Workout } from '../core/models/workout';
import { IWorkoutRepository, defaultWorkoutRepository, SavedWorkout, generateId } from '../core/storage/workoutRepository';
import { ThemeProvider } from '../shared/theme/ThemeProvider';

export interface AppProps {
  controller?: WorkoutSessionController;
  focusController?: FocusTimerController;
  initialWorkouts?: Workout[];
  repository?: IWorkoutRepository;
}

export function AppContent({
  controller: injectedController,
  initialWorkouts,
  repository = defaultWorkoutRepository,
}: AppProps) {
  const controller = useMemo(
    () => injectedController ?? new WorkoutSessionController(),
    [injectedController]
  );

  const focusCtx = useOptionalFocusTimer();

  const {
    snapshot,
    workout,
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
  } = useWorkoutSession(controller);

  const [activeView, setActiveView] = useState<'home' | 'builder' | 'focus'>('home');
  const [builderWorkout, setBuilderWorkout] = useState<Workout | undefined>(undefined);
  const [builderSavedId, setBuilderSavedId] = useState<string | undefined>(undefined);
  const [builderCreatedAt, setBuilderCreatedAt] = useState<number | undefined>(undefined);
  const [pendingWorkout, setPendingWorkout] = useState<Workout | null>(null);

  // Switch to player when a workout is started, checking for Focus timer conflict
  const handleStartWorkout = (w: Workout) => {
    if (focusCtx && focusCtx.snapshot.status === 'RUNNING') {
      // Focus is running: prompt user to pause focus & start workout
      setPendingWorkout(w);
      return;
    }

    setActiveView('home');
    startWorkout(w);
  };

  const handleConfirmConflictAndStartWorkout = () => {
    if (pendingWorkout) {
      if (focusCtx && focusCtx.snapshot.status === 'RUNNING') {
        focusCtx.pause();
      }
      const target = pendingWorkout;
      setPendingWorkout(null);
      setActiveView('home');
      startWorkout(target);
    }
  };

  const handleCancelConflict = () => {
    setPendingWorkout(null);
  };

  const handleCreateWorkout = () => {
    setBuilderWorkout(undefined);
    setBuilderSavedId(undefined);
    setBuilderCreatedAt(undefined);
    setActiveView('builder');
  };

  const handleEditWorkout = (saved: SavedWorkout) => {
    setBuilderWorkout(saved.workout);
    setBuilderSavedId(saved.id);
    setBuilderCreatedAt(saved.createdAt);
    setActiveView('builder');
  };

  const handleCustomizePreset = (preset: Workout) => {
    const cloned: Workout = {
      ...preset,
      id: generateId(),
      title: `${preset.title} (Custom)`,
      type: 'CUSTOM',
      exercises: preset.exercises.map((e) => ({
        ...e,
        id: generateId(),
      })),
    };
    setBuilderWorkout(cloned);
    setBuilderSavedId(undefined);
    setBuilderCreatedAt(undefined);
    setActiveView('builder');
  };

  const handleOpenFocus = () => {
    setActiveView('focus');
  };

  // Determine current screen state based on EngineSnapshot
  if (snapshot?.status === 'COMPLETED') {
    return (
      <>
        <WorkoutComplete
          workout={workout}
          snapshot={snapshot}
          onDone={reset}
          onRestartWorkout={restartWorkout}
        />
        {/* Floating Pomodoro on completion screen if running/paused */}
        <FloatingPomodoro onExpand={handleOpenFocus} />
      </>
    );
  }

  if (snapshot?.status === 'RUNNING' || snapshot?.status === 'PAUSED') {
    return (
      <>
        <ActiveWorkout
          workout={workout}
          snapshot={snapshot}
          audioSettings={audioSettings}
          onPause={pause}
          onResume={resume}
          onPrevious={previous}
          onNext={next}
          onRestartSegment={restartCurrentSegment}
          onAddTime={addTime}
          onEndWorkout={endWorkout}
          onToggleVoice={toggleVoice}
          onToggleSound={toggleSound}
          onVisibilityReconcile={() => controller.handleVisibilityReconcile()}
        />
        {/* Workout Conflict Dialog if triggered */}
        <WorkoutConflictDialog
          isOpen={pendingWorkout !== null}
          onPauseFocusAndStartWorkout={handleConfirmConflictAndStartWorkout}
          onCancel={handleCancelConflict}
        />
      </>
    );
  }

  if (activeView === 'focus') {
    return <FocusScreen onBack={() => setActiveView('home')} />;
  }

  if (activeView === 'builder') {
    return (
      <>
        <WorkoutBuilder
          initialWorkout={builderWorkout}
          savedId={builderSavedId}
          createdAt={builderCreatedAt}
          repository={repository}
          onBack={() => setActiveView('home')}
          onStart={handleStartWorkout}
          onSaved={() => {
            // Keep builder open or update
          }}
        />
        {/* Floating Mini Timer when navigating to Builder */}
        <FloatingPomodoro onExpand={handleOpenFocus} />
        {/* Workout Conflict Dialog */}
        <WorkoutConflictDialog
          isOpen={pendingWorkout !== null}
          onPauseFocusAndStartWorkout={handleConfirmConflictAndStartWorkout}
          onCancel={handleCancelConflict}
        />
      </>
    );
  }

  return (
    <>
      <WorkoutHome
        onStartWorkout={handleStartWorkout}
        onCreateWorkout={handleCreateWorkout}
        onEditWorkout={handleEditWorkout}
        onCustomizePreset={handleCustomizePreset}
        onOpenFocus={handleOpenFocus}
        repository={repository}
        workouts={initialWorkouts}
      />
      {/* Floating Mini Timer when on Home */}
      <FloatingPomodoro onExpand={handleOpenFocus} />
      {/* Workout Conflict Dialog */}
      <WorkoutConflictDialog
        isOpen={pendingWorkout !== null}
        onPauseFocusAndStartWorkout={handleConfirmConflictAndStartWorkout}
        onCancel={handleCancelConflict}
      />
    </>
  );
}

export function App({ focusController, ...props }: AppProps) {
  return (
    <ThemeProvider>
      <FocusProvider controller={focusController}>
        <AppContent {...props} />
      </FocusProvider>
    </ThemeProvider>
  );
}
