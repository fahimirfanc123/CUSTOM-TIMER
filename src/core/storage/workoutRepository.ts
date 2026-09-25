import { Workout } from '../models/workout';
import { validateWorkout } from '../builder/validator';
import { CTRDatabase, defaultDb, SavedWorkout } from './db';

export type { SavedWorkout } from './db';

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface IWorkoutRepository {
  getAll(): Promise<SavedWorkout[]>;
  getById(id: string): Promise<SavedWorkout | null>;
  save(workout: Workout): Promise<SavedWorkout>;
  update(workout: Workout): Promise<SavedWorkout>;
  delete(id: string): Promise<void>;
  duplicate(id: string): Promise<SavedWorkout>;
}

export class DexieWorkoutRepository implements IWorkoutRepository {
  private db: CTRDatabase;

  constructor(db: CTRDatabase = defaultDb) {
    this.db = db;
  }

  public async getAll(): Promise<SavedWorkout[]> {
    try {
      const records = await this.db.workouts.toArray();
      // Return sorted by updatedAt descending (newest first)
      return records.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (err) {
      console.error('DexieWorkoutRepository.getAll error:', err);
      return [];
    }
  }

  public async getById(id: string): Promise<SavedWorkout | null> {
    try {
      const record = await this.db.workouts.get(id);
      return record ?? null;
    } catch (err) {
      console.error(`DexieWorkoutRepository.getById(${id}) error:`, err);
      return null;
    }
  }

  public async save(workout: Workout): Promise<SavedWorkout> {
    validateWorkout(workout);
    const now = Date.now();

    const record: SavedWorkout = {
      id: workout.id,
      workout: {
        ...workout,
        exercises: workout.exercises.map((e) => ({ ...e })),
      },
      createdAt: now,
      updatedAt: now,
    };

    await this.db.workouts.put(record);
    return record;
  }

  public async update(workout: Workout): Promise<SavedWorkout> {
    validateWorkout(workout);
    const existing = await this.getById(workout.id);
    const now = Date.now();

    const record: SavedWorkout = {
      id: workout.id,
      workout: {
        ...workout,
        exercises: workout.exercises.map((e) => ({ ...e })),
      },
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    await this.db.workouts.put(record);
    return record;
  }

  public async delete(id: string): Promise<void> {
    try {
      await this.db.workouts.delete(id);
    } catch (err) {
      console.error(`DexieWorkoutRepository.delete(${id}) error:`, err);
      throw err;
    }
  }

  public async duplicate(id: string): Promise<SavedWorkout> {
    const original = await this.getById(id);
    if (!original) {
      throw new Error(`Cannot duplicate workout: Workout with id ${id} not found`);
    }

    const newWorkoutId = generateId();
    const duplicatedWorkout: Workout = {
      ...original.workout,
      id: newWorkoutId,
      title: `${original.workout.title} (Copy)`,
      exercises: original.workout.exercises.map((ex) => ({
        ...ex,
        id: generateId(),
      })),
    };

    return this.save(duplicatedWorkout);
  }
}

export { DexieWorkoutRepository as WorkoutRepository };
export const defaultWorkoutRepository = new DexieWorkoutRepository();
