export interface ServiceItem {
  id?: string;
  title: string;
  time: string;
  fields: Record<string, string>;
  notes?: string;
}

export interface DayProgramme {
  day: string;
  date: string;
  dayOfWeek?: number;
  services: ServiceItem[];
  note?: string;
}

export interface WeeklyProgramme {
  id?: string;
  weekId?: string;
  weekTitle: string;
  weekStartDate: string;
  weekEndDate: string;
  theme?: string;
  verse?: string;
  days: DayProgramme[];
  updatedAt?: string;
  updatedBy?: string;
}

export interface ArchivedProgramme extends WeeklyProgramme {
  id: string;
  archivedAt: string;
  archivedBy?: string;
  archiveNotes?: string;
}
