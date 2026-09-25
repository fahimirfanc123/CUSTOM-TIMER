import Dexie, { Table } from 'dexie';
import { Workout } from '../models/workout';

export interface SavedWorkout {
  id: string;
  workout: Workout;
  createdAt: number;
  updatedAt: number;
}

export class CTRDatabase extends Dexie {
  public workouts!: Table<SavedWorkout, string>;

  constructor(databaseName = 'CTRDatabase') {
    super(databaseName);
    this.version(1).stores({
      workouts: 'id, workout.title, updatedAt, createdAt',
    });
  }
}

export const defaultDb = new CTRDatabase();
