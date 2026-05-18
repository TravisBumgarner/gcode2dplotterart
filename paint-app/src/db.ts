import Dexie, { type Table } from 'dexie';
import type { AppState, Plotter } from './types';

export type Project = {
  id: string;
  name: string;
  state: AppState;
  createdAt: number;
  updatedAt: number;
};

class PaintDB extends Dexie {
  projects!: Table<Project, string>;
  plotters!: Table<Plotter, string>;

  constructor() {
    super('paint-app');
    this.version(1).stores({
      projects: 'id, name, updatedAt',
    });
    this.version(2).stores({
      projects: 'id, name, updatedAt',
      plotters: 'id, name, createdAt',
    });
  }
}

export const db = new PaintDB();
