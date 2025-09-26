import Dexie, { type Table } from "dexie";

export interface TimelineEvent {
  id?: number;
  year: string;
  yearNumber: number; // ソート用の元の数値を保存
  label: string;
  note?: string;
  createdAt?: Date;
}

export class TimelineDatabase extends Dexie {
  events!: Table<TimelineEvent>;

  constructor() {
    super("TimelineDatabase");
    this.version(1).stores({
      events: "++id, year, label, note, createdAt",
    });
    this.version(2).stores({
      events: "++id, year, yearNumber, label, note, createdAt",
    });
  }
}

export const db = new TimelineDatabase();
