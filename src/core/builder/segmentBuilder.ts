import { Workout } from '../models/workout';
import { WorkoutSegment, NextTarget } from '../models/segment';
import { validateWorkout } from './validator';

export function buildSegmentQueue(workout: Workout): WorkoutSegment[] {
  validateWorkout(workout);

  const segments: WorkoutSegment[] = [];
  const totalRounds = workout.rounds;
  const totalExercises = workout.exercises.length;
  const totalSteps = totalExercises * totalRounds;

  // 1. Initial PREPARE segment if duration > 0
  if (workout.prepareDurationSec > 0) {
    const firstExercise = workout.exercises[0];
    const initialTarget: NextTarget = {
      exerciseName: firstExercise.name,
      exerciseIndex: 0,
      setNumber: 1,
      totalSets: firstExercise.sets,
      roundNumber: 1,
      totalRounds,
      stepNumber: 1,
      totalSteps,
      reps: firstExercise.reps,
    };

    segments.push({
      id: 'prepare',
      phase: 'PREPARE',
      durationSec: workout.prepareDurationSec,
      context: {
        round: 1,
        totalRounds,
        step: 1,
        totalSteps,
        exerciseIndex: 0,
        totalExercises,
        set: 1,
        totalSets: firstExercise.sets,
        exerciseName: firstExercise.name,
        reps: firstExercise.reps,
        nextTarget: initialTarget,
        isLastSetOfExercise: firstExercise.sets === 1,
        isLastExerciseOfRound: totalExercises === 1,
        isLastSegmentOfWorkout: false,
      },
    });
  }

  // 2. Iterate through Rounds -> Exercises -> Sets
  for (let r = 1; r <= totalRounds; r++) {
    for (let e = 0; e < totalExercises; e++) {
      const exercise = workout.exercises[e];
      const step = (r - 1) * totalExercises + (e + 1);

      for (let s = 1; s <= exercise.sets; s++) {
        const isLastSet = s === exercise.sets;
        const isLastExercise = e === totalExercises - 1;
        const isLastRound = r === totalRounds;
        const isFinalWork = isLastSet && isLastExercise && isLastRound;

        // Determine nextTarget
        let nextTarget: NextTarget | undefined = undefined;
        if (!isLastSet) {
          nextTarget = {
            exerciseName: exercise.name,
            exerciseIndex: e,
            setNumber: s + 1,
            totalSets: exercise.sets,
            roundNumber: r,
            totalRounds,
            stepNumber: step,
            totalSteps,
            reps: exercise.reps,
          };
        } else if (!isLastExercise) {
          const nextEx = workout.exercises[e + 1];
          nextTarget = {
            exerciseName: nextEx.name,
            exerciseIndex: e + 1,
            setNumber: 1,
            totalSets: nextEx.sets,
            roundNumber: r,
            totalRounds,
            stepNumber: step + 1,
            totalSteps,
            reps: nextEx.reps,
          };
        } else if (!isLastRound) {
          const firstEx = workout.exercises[0];
          nextTarget = {
            exerciseName: firstEx.name,
            exerciseIndex: 0,
            setNumber: 1,
            totalSets: firstEx.sets,
            roundNumber: r + 1,
            totalRounds,
            stepNumber: step + 1,
            totalSteps,
            reps: firstEx.reps,
          };
        }

        // WORK Segment
        segments.push({
          id: `r${r}_e${e}_s${s}_work`,
          phase: 'WORK',
          durationSec: exercise.workDurationSec,
          context: {
            round: r,
            totalRounds,
            step,
            totalSteps,
            exerciseIndex: e,
            totalExercises,
            set: s,
            totalSets: exercise.sets,
            exerciseName: exercise.name,
            reps: exercise.reps,
            nextTarget,
            isLastSetOfExercise: isLastSet,
            isLastExerciseOfRound: isLastExercise,
            isLastSegmentOfWorkout: isFinalWork,
          },
        });

        // Determine Rest Transition based on priority
        if (!isLastSet) {
          if (exercise.restBetweenSetsSec > 0) {
            segments.push({
              id: `r${r}_e${e}_s${s}_rest_set`,
              phase: 'REST_SET',
              durationSec: exercise.restBetweenSetsSec,
              context: {
                round: r,
                totalRounds,
                step,
                totalSteps,
                exerciseIndex: e,
                totalExercises,
                set: s,
                totalSets: exercise.sets,
                exerciseName: exercise.name,
                reps: exercise.reps,
                nextTarget,
                isLastSetOfExercise: false,
                isLastExerciseOfRound: false,
                isLastSegmentOfWorkout: false,
              },
            });
          }
        } else if (!isLastExercise) {
          if (exercise.restAfterExerciseSec > 0) {
            segments.push({
              id: `r${r}_e${e}_rest_exercise`,
              phase: 'REST_EXERCISE',
              durationSec: exercise.restAfterExerciseSec,
              context: {
                round: r,
                totalRounds,
                step,
                totalSteps,
                exerciseIndex: e,
                totalExercises,
                set: s,
                totalSets: exercise.sets,
                exerciseName: exercise.name,
                reps: exercise.reps,
                nextTarget,
                isLastSetOfExercise: true,
                isLastExerciseOfRound: false,
                isLastSegmentOfWorkout: false,
              },
            });
          }
        } else if (!isLastRound) {
          if (workout.restBetweenRoundsSec > 0) {
            segments.push({
              id: `r${r}_rest_round`,
              phase: 'REST_ROUND',
              durationSec: workout.restBetweenRoundsSec,
              context: {
                round: r,
                totalRounds,
                step,
                totalSteps,
                exerciseIndex: e,
                totalExercises,
                set: s,
                totalSets: exercise.sets,
                exerciseName: exercise.name,
                reps: exercise.reps,
                nextTarget,
                isLastSetOfExercise: true,
                isLastExerciseOfRound: true,
                isLastSegmentOfWorkout: false,
              },
            });
          }
        }
        // Final set of final round: no trailing rest is emitted.
      }
    }
  }

  // Ensure the very last segment in the entire queue has isLastSegmentOfWorkout: true
  if (segments.length > 0) {
    segments[segments.length - 1].context.isLastSegmentOfWorkout = true;
  }

  return segments;
}
