import { describe, it, expect } from 'vitest';
import { buildSegmentQueue } from '../segmentBuilder';
import { ValidationError } from '../validator';
import { Workout } from '../../models/workout';

describe('Segment Builder', () => {
  it('throws ValidationError for invalid workout configurations', () => {
    const invalidWorkout = {
      id: '',
      title: 'Bad Workout',
      type: 'CUSTOM',
      prepareDurationSec: 5,
      rounds: 1,
      restBetweenRoundsSec: 0,
      exercises: [],
    } as unknown as Workout;

    expect(() => buildSegmentQueue(invalidWorkout)).toThrow(ValidationError);
  });

  describe('1. Single Exercise / Single Set / Single Round', () => {
    it('generates PREPARE and a single WORK segment with no trailing rest', () => {
      const workout: Workout = {
        id: 'w1',
        title: 'Simple Workout',
        type: 'SIMPLE',
        prepareDurationSec: 5,
        rounds: 1,
        restBetweenRoundsSec: 60,
        exercises: [
          {
            id: 'e1',
            name: 'Push-ups',
            sets: 1,
            workDurationSec: 40,
            restBetweenSetsSec: 30,
            restAfterExerciseSec: 45,
          },
        ],
      };

      const segments = buildSegmentQueue(workout);

      expect(segments).toHaveLength(2);

      // 1. Prepare segment
      expect(segments[0]).toEqual({
        id: 'prepare',
        phase: 'PREPARE',
        durationSec: 5,
        context: {
          round: 1,
          totalRounds: 1,
          step: 1,
          totalSteps: 1,
          exerciseIndex: 0,
          totalExercises: 1,
          set: 1,
          totalSets: 1,
          exerciseName: 'Push-ups',
          reps: undefined,
          nextTarget: {
            exerciseName: 'Push-ups',
            exerciseIndex: 0,
            setNumber: 1,
            totalSets: 1,
            roundNumber: 1,
            totalRounds: 1,
            stepNumber: 1,
            totalSteps: 1,
            reps: undefined,
          },
          isLastSetOfExercise: true,
          isLastExerciseOfRound: true,
          isLastSegmentOfWorkout: false,
        },
      });

      // 2. Work segment
      expect(segments[1]).toEqual({
        id: 'r1_e0_s1_work',
        phase: 'WORK',
        durationSec: 40,
        context: {
          round: 1,
          totalRounds: 1,
          step: 1,
          totalSteps: 1,
          exerciseIndex: 0,
          totalExercises: 1,
          set: 1,
          totalSets: 1,
          exerciseName: 'Push-ups',
          reps: undefined,
          nextTarget: undefined,
          isLastSetOfExercise: true,
          isLastExerciseOfRound: true,
          isLastSegmentOfWorkout: true,
        },
      });
    });

    it('omits PREPARE segment when prepareDurationSec is 0', () => {
      const workout: Workout = {
        id: 'w1',
        title: 'No Prepare',
        type: 'SIMPLE',
        prepareDurationSec: 0,
        rounds: 1,
        restBetweenRoundsSec: 0,
        exercises: [
          {
            id: 'e1',
            name: 'Plank',
            sets: 1,
            workDurationSec: 60,
            restBetweenSetsSec: 0,
            restAfterExerciseSec: 0,
          },
        ],
      };

      const segments = buildSegmentQueue(workout);
      expect(segments).toHaveLength(1);
      expect(segments[0].id).toBe('r1_e0_s1_work');
      expect(segments[0].context.isLastSegmentOfWorkout).toBe(true);
      expect(segments[0].context.nextTarget).toBeUndefined();
    });
  });

  describe('2. Multiple Sets (Same Exercise)', () => {
    it('generates WORK -> REST_SET -> WORK sequence without trailing rest', () => {
      const workout: Workout = {
        id: 'w2',
        title: '3 Sets of Push-ups',
        type: 'SET',
        prepareDurationSec: 0,
        rounds: 1,
        restBetweenRoundsSec: 0,
        exercises: [
          {
            id: 'e1',
            name: 'Push-ups',
            sets: 3,
            workDurationSec: 30,
            restBetweenSetsSec: 15,
            restAfterExerciseSec: 60,
          },
        ],
      };

      const segments = buildSegmentQueue(workout);

      // Expected: s1_work -> s1_rest_set -> s2_work -> s2_rest_set -> s3_work (5 total)
      expect(segments).toHaveLength(5);
      expect(segments.map((s) => s.id)).toEqual([
        'r1_e0_s1_work',
        'r1_e0_s1_rest_set',
        'r1_e0_s2_work',
        'r1_e0_s2_rest_set',
        'r1_e0_s3_work',
      ]);

      expect(segments.map((s) => s.phase)).toEqual([
        'WORK',
        'REST_SET',
        'WORK',
        'REST_SET',
        'WORK',
      ]);

      // Verify Set 1 NextTarget
      expect(segments[0].context.nextTarget).toEqual({
        exerciseName: 'Push-ups',
        exerciseIndex: 0,
        setNumber: 2,
        totalSets: 3,
        roundNumber: 1,
        totalRounds: 1,
        stepNumber: 1,
        totalSteps: 1,
        reps: undefined,
      });

      // Verify Rest 1 NextTarget
      expect(segments[1].context.nextTarget).toEqual({
        exerciseName: 'Push-ups',
        exerciseIndex: 0,
        setNumber: 2,
        totalSets: 3,
        roundNumber: 1,
        totalRounds: 1,
        stepNumber: 1,
        totalSteps: 1,
        reps: undefined,
      });

      // Final Set (Set 3) should have no nextTarget and isLastSegmentOfWorkout: true
      expect(segments[4].context.nextTarget).toBeUndefined();
      expect(segments[4].context.isLastSegmentOfWorkout).toBe(true);
    });
  });

  describe('3. Multiple Exercises (Single Round)', () => {
    it('generates REST_EXERCISE between different exercises in the same round', () => {
      const workout: Workout = {
        id: 'w3',
        title: 'Chest & Legs',
        type: 'CUSTOM',
        prepareDurationSec: 0,
        rounds: 1,
        restBetweenRoundsSec: 0,
        exercises: [
          {
            id: 'e1',
            name: 'Push-ups',
            sets: 2,
            workDurationSec: 40,
            restBetweenSetsSec: 20,
            restAfterExerciseSec: 45,
          },
          {
            id: 'e2',
            name: 'Squats',
            sets: 2,
            workDurationSec: 50,
            restBetweenSetsSec: 25,
            restAfterExerciseSec: 60,
          },
        ],
      };

      const segments = buildSegmentQueue(workout);

      // Expected IDs:
      // Ex0 (Push-ups): r1_e0_s1_work -> r1_e0_s1_rest_set -> r1_e0_s2_work -> r1_e0_rest_exercise
      // Ex1 (Squats):   r1_e1_s1_work -> r1_e1_s1_rest_set -> r1_e1_s2_work (no trailing rest)
      expect(segments.map((s) => s.id)).toEqual([
        'r1_e0_s1_work',
        'r1_e0_s1_rest_set',
        'r1_e0_s2_work',
        'r1_e0_rest_exercise',
        'r1_e1_s1_work',
        'r1_e1_s1_rest_set',
        'r1_e1_s2_work',
      ]);

      // Check transition from Exercise 1 to Exercise 2
      const ex1Rest = segments[3];
      expect(ex1Rest.phase).toBe('REST_EXERCISE');
      expect(ex1Rest.durationSec).toBe(45);
      expect(ex1Rest.context.nextTarget).toEqual({
        exerciseName: 'Squats',
        exerciseIndex: 1,
        setNumber: 1,
        totalSets: 2,
        roundNumber: 1,
        totalRounds: 1,
        stepNumber: 2,
        totalSteps: 2,
        reps: undefined,
      });

      // Step verification
      expect(segments[0].context.step).toBe(1); // Push-ups
      expect(segments[2].context.step).toBe(1); // Push-ups
      expect(segments[4].context.step).toBe(2); // Squats
      expect(segments[6].context.step).toBe(2); // Squats
    });
  });

  describe('4. Multiple Rounds & Rest Priority Rule', () => {
    it('enforces rest priority: uses REST_ROUND (not REST_EXERCISE) between rounds', () => {
      const workout: Workout = {
        id: 'w4',
        title: 'Boxing Conditioning',
        type: 'CUSTOM',
        prepareDurationSec: 0,
        rounds: 2,
        restBetweenRoundsSec: 90,
        exercises: [
          {
            id: 'e1',
            name: 'Push-ups',
            sets: 1,
            workDurationSec: 40,
            restBetweenSetsSec: 20,
            restAfterExerciseSec: 30, // Should be ignored at the end of Round 1
          },
          {
            id: 'e2',
            name: 'Shadow Boxing',
            sets: 1,
            workDurationSec: 60,
            restBetweenSetsSec: 20,
            restAfterExerciseSec: 45, // Should be ignored at the end of Round 1 in favor of restBetweenRoundsSec
          },
        ],
      };

      const segments = buildSegmentQueue(workout);

      // Expected IDs:
      // Round 1: r1_e0_s1_work -> r1_e0_rest_exercise -> r1_e1_s1_work -> r1_rest_round
      // Round 2: r2_e0_s1_work -> r2_e0_rest_exercise -> r2_e1_s1_work
      expect(segments.map((s) => s.id)).toEqual([
        'r1_e0_s1_work',
        'r1_e0_rest_exercise',
        'r1_e1_s1_work',
        'r1_rest_round',
        'r2_e0_s1_work',
        'r2_e0_rest_exercise',
        'r2_e1_s1_work',
      ]);

      // Verify Round 1 between-round rest
      const roundRest = segments[3];
      expect(roundRest.id).toBe('r1_rest_round');
      expect(roundRest.phase).toBe('REST_ROUND');
      expect(roundRest.durationSec).toBe(90);
      expect(roundRest.context.nextTarget).toEqual({
        exerciseName: 'Push-ups',
        exerciseIndex: 0,
        setNumber: 1,
        totalSets: 1,
        roundNumber: 2,
        totalRounds: 2,
        stepNumber: 3,
        totalSteps: 4,
        reps: undefined,
      });

      // Step indexing across rounds (2 exercises * 2 rounds = 4 total steps)
      expect(segments[0].context.step).toBe(1); // R1, Ex1 -> Step 1 / 4
      expect(segments[2].context.step).toBe(2); // R1, Ex2 -> Step 2 / 4
      expect(segments[4].context.step).toBe(3); // R2, Ex1 -> Step 3 / 4
      expect(segments[6].context.step).toBe(4); // R2, Ex2 -> Step 4 / 4

      // Ensure no trailing rest after Round 2 final exercise
      expect(segments[6].phase).toBe('WORK');
      expect(segments[6].context.isLastSegmentOfWorkout).toBe(true);
      expect(segments[6].context.nextTarget).toBeUndefined();
    });
  });

  describe('5. Zero Rest Handling', () => {
    it('omits all rest segments when rest durations are 0 without creating dummy zero-duration segments', () => {
      const workout: Workout = {
        id: 'w5',
        title: 'Non-Stop Circuit',
        type: 'CUSTOM',
        prepareDurationSec: 0,
        rounds: 2,
        restBetweenRoundsSec: 0,
        exercises: [
          {
            id: 'e1',
            name: 'Burpees',
            sets: 2,
            workDurationSec: 30,
            restBetweenSetsSec: 0,
            restAfterExerciseSec: 0,
          },
          {
            id: 'e2',
            name: 'Mountain Climbers',
            sets: 2,
            workDurationSec: 30,
            restBetweenSetsSec: 0,
            restAfterExerciseSec: 0,
          },
        ],
      };

      const segments = buildSegmentQueue(workout);

      // Should have ONLY WORK segments: 2 rounds * 2 exercises * 2 sets = 8 WORK segments
      expect(segments).toHaveLength(8);
      expect(segments.every((s) => s.phase === 'WORK')).toBe(true);
      expect(segments.every((s) => s.durationSec > 0)).toBe(true);

      // Verify nextTarget chains seamlessly
      expect(segments[0].context.nextTarget?.setNumber).toBe(2);
      expect(segments[0].context.nextTarget?.exerciseName).toBe('Burpees');

      expect(segments[1].context.nextTarget?.exerciseName).toBe('Mountain Climbers');
      expect(segments[1].context.nextTarget?.setNumber).toBe(1);

      expect(segments[3].context.nextTarget?.roundNumber).toBe(2);
      expect(segments[3].context.nextTarget?.exerciseName).toBe('Burpees');

      expect(segments[7].context.isLastSegmentOfWorkout).toBe(true);
      expect(segments[7].context.nextTarget).toBeUndefined();
    });
  });

  describe('6. NextTarget Structured Data Accuracy', () => {
    it('correctly populates nextTarget with optional reps', () => {
      const workout: Workout = {
        id: 'w6',
        title: 'Hypertrophy Sets',
        type: 'CUSTOM',
        prepareDurationSec: 5,
        rounds: 1,
        restBetweenRoundsSec: 0,
        exercises: [
          {
            id: 'e1',
            name: 'Dumbbell Bench Press',
            sets: 2,
            workDurationSec: 45,
            restBetweenSetsSec: 60,
            restAfterExerciseSec: 90,
            reps: 12,
          },
          {
            id: 'e2',
            name: 'Incline Dumbbell Fly',
            sets: 1,
            workDurationSec: 45,
            restBetweenSetsSec: 60,
            restAfterExerciseSec: 90,
            reps: 15,
          },
        ],
      };

      const segments = buildSegmentQueue(workout);

      // Prepare next target
      expect(segments[0].context.nextTarget?.reps).toBe(12);

      // Set 1 next target (same exercise set 2)
      expect(segments[1].context.nextTarget?.reps).toBe(12);
      expect(segments[1].context.nextTarget?.setNumber).toBe(2);

      // Set 2 next target (next exercise)
      expect(segments[3].context.nextTarget?.exerciseName).toBe('Incline Dumbbell Fly');
      expect(segments[3].context.nextTarget?.reps).toBe(15);
      expect(segments[3].context.nextTarget?.setNumber).toBe(1);

      // Final exercise has no next target
      expect(segments[5].context.nextTarget).toBeUndefined();
    });
  });
});
