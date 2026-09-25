import { useState, useMemo } from 'react';
import { WorkoutSessionController } from '../features/workout-player/sessionController';
import { useWorkoutSession } from '../features/workout-player/useWorkoutSession';
import { WorkoutHome } from '../features/workout-player/WorkoutHome';
import { ActiveWorkout } from '../features/workout-player/ActiveWorkout';
import { WorkoutComplete } from '../features/workout-player/WorkoutComplete';
import { WorkoutBuilder } from '../features/workout-builder/WorkoutBuilder';
import { Workout } from '../core/models/workout';
import { IWorkoutRepository, defaultWorkoutRepository, SavedWorkout, generateId } from '../core/storage/workoutRepository';
import { ThemeProvider } from '../shared/theme/ThemeProvider';

export interface AppProps {
  controller?: WorkoutSessionController;
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

  const [activeView, setActiveView] = useState<'home' | 'builder'>('home');
  const [builderWorkout, setBuilderWorkout] = useState<Workout | undefined>(undefined);
  const [builderSavedId, setBuilderSavedId] = useState<string | undefined>(undefined);
  const [builderCreatedAt, setBuilderCreatedAt] = useState<number | undefined>(undefined);

  // Switch to player when a workout is started
  const handleStartWorkout = (w: Workout) => {
    setActiveView('home');
    startWorkout(w);
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

  // Determine current screen state based on EngineSnapshot
  if (snapshot?.status === 'COMPLETED') {
    return (
      <WorkoutComplete
        workout={workout}
        snapshot={snapshot}
        onDone={reset}
        onRestartWorkout={restartWorkout}
      />
    );
  }

  if (snapshot?.status === 'RUNNING' || snapshot?.status === 'PAUSED') {
    return (
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
    );
  }

  if (activeView === 'builder') {
    return (
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
    );
  }

  return (
    <WorkoutHome
      onStartWorkout={handleStartWorkout}
      onCreateWorkout={handleCreateWorkout}
      onEditWorkout={handleEditWorkout}
      onCustomizePreset={handleCustomizePreset}
      repository={repository}
      workouts={initialWorkouts}
    />
  );
}

export function App(props: AppProps) {
  return (
    <ThemeProvider>
      <AppContent {...props} />
    </ThemeProvider>
  );
}
