import { DayProgramme, WeeklyProgramme, ArchivedProgramme } from '../types/programme';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * Format a Date object to YYYY-MM-DD string
 */
export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses YYYY-MM-DD into a Date in local time
 */
export function parseISODate(isoString: string): Date {
  if (!isoString) return new Date();
  const parts = isoString.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(isoString);
}

/**
 * Gets Sunday of the current week (or reference date)
 */
export function getSundayOfWeek(refDate = new Date()): Date {
  const d = new Date(refDate);
  const day = d.getDay(); // 0 is Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Gets Saturday (end of week) for a given Sunday
 */
export function getSaturdayOfWeek(sundayDate: Date): Date {
  const d = new Date(sundayDate);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Formats a Date to display format: "16 Feb, 2025" or "16 February, 2025"
 */
export function formatDateDisplay(date: Date | string, shortMonth = true): string {
  const d = typeof date === 'string' ? parseISODate(date) : date;
  if (isNaN(d.getTime())) return typeof date === 'string' ? date : '';
  
  const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthsFull = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const day = d.getDate();
  const month = shortMonth ? monthsShort[d.getMonth()] : monthsFull[d.getMonth()];
  const year = d.getFullYear();
  
  return `${day} ${month}, ${year}`;
}

/**
 * Generates display week title e.g. "16 - 22 February, 2025"
 */
export function generateWeekTitle(startDateStr: string, endDateStr: string): string {
  const start = parseISODate(startDateStr);
  const end = parseISODate(endDateStr);
  
  const monthsFull = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = monthsFull[start.getMonth()];
  const endMonth = monthsFull[end.getMonth()];
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  if (startYear === endYear) {
    if (startMonth === endMonth) {
      return `${startDay} - ${endDay} ${startMonth}, ${startYear}`;
    }
    return `${startDay} ${startMonth} - ${endDay} ${endMonth}, ${startYear}`;
  }
  return `${startDay} ${startMonth}, ${startYear} - ${endDay} ${endMonth}, ${endYear}`;
}

/**
 * Generates unique week ID e.g. "week_2025_02_16"
 */
export function generateWeekId(startDateStr: string): string {
  return `week_${startDateStr.replace(/-/g, '_')}`;
}

/**
 * Generates default weekly programme with calculated dates for each day
 */
export function generateDefaultProgramme(sundayDate: Date = getSundayOfWeek()): WeeklyProgramme {
  const startIso = formatDateISO(sundayDate);
  const satDate = getSaturdayOfWeek(sundayDate);
  const endIso = formatDateISO(satDate);

  // Sunday
  const sun = new Date(sundayDate);
  // Monday
  const mon = new Date(sundayDate); mon.setDate(mon.getDate() + 1);
  // Tuesday
  const tue = new Date(sundayDate); tue.setDate(tue.getDate() + 2);
  // Wednesday
  const wed = new Date(sundayDate); wed.setDate(wed.getDate() + 3);
  // Thursday
  const thu = new Date(sundayDate); thu.setDate(thu.getDate() + 4);
  // Friday
  const fri = new Date(sundayDate); fri.setDate(fri.getDate() + 5);
  // Saturday
  const sat = new Date(sundayDate); sat.setDate(sat.getDate() + 6);

  const days: DayProgramme[] = [
    {
      day: "Pathian Ni",
      date: formatDateDisplay(sun),
      dayOfWeek: 0,
      services: [
        {
          title: "Chawhma (Sunday School)",
          time: "10:30 AM",
          fields: {
            "Hruaitu": "",
            "Tantu": "",
            "Zirlai": "",
            "Zirtirtu": ""
          }
        },
        {
          title: "Chawhnu Inkhawm",
          time: "1:30 PM",
          fields: {
            "Hruaitu": "",
            "Tantu": "",
            "Thusawitu": "",
            "Thawhlawm Hlantu": ""
          }
        },
        {
          title: "Zan Inkhawm",
          time: "7:00 PM",
          fields: {
            "Hruaitu": "",
            "Tantu": "",
            "Thusawitu": "",
            "Zaipawl": ""
          }
        }
      ]
    },
    {
      day: "Thawhtan Zan (KTP)",
      date: formatDateDisplay(mon),
      dayOfWeek: 1,
      services: [
        {
          title: "KTP Inkhawm",
          time: "7:00 PM",
          fields: {
            "Hruaitu": "",
            "Tantu": "",
            "Thusawitu / Thupui": "",
            "Special Item": ""
          }
        }
      ]
    },
    {
      day: "Thawhleh Zan (Kohhran Hmeichhia)",
      date: formatDateDisplay(tue),
      dayOfWeek: 2,
      services: [
        {
          title: "Kohhran Hmeichhe Inkhawm",
          time: "7:00 PM",
          fields: {
            "Hruaitu": "",
            "Tantu": "",
            "Thusawitu": "",
            "Thawhlawm Khawntu": ""
          }
        }
      ]
    },
    {
      day: "Nilai Zan",
      date: formatDateDisplay(wed),
      dayOfWeek: 3,
      services: [
        {
          title: "Nilai Zan Inkhawm",
          time: "7:00 PM",
          fields: {
            "Hruaitu": "",
            "Tantu": "",
            "Thupui Hawngtu": "",
            "Thupui": ""
          }
        }
      ]
    },
    {
      day: "Inrinni Zan",
      date: formatDateDisplay(sat),
      dayOfWeek: 6,
      services: [
        {
          title: "Inrinni Zan Inkhawm",
          time: "7:00 PM",
          fields: {
            "Hruaitu": "",
            "Tantu": "",
            "Thusawitu": ""
          }
        }
      ]
    }
  ];

  return {
    weekId: generateWeekId(startIso),
    weekTitle: generateWeekTitle(startIso, endIso),
    weekStartDate: startIso,
    weekEndDate: endIso,
    theme: "",
    days,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Helper to recalculate day dates when start date changes
 */
export function recalculateDaysForWeek(days: DayProgramme[], startDateStr: string): DayProgramme[] {
  const sunday = parseISODate(startDateStr);
  
  return days.map((dayItem) => {
    let dayOffset = dayItem.dayOfWeek;
    if (dayOffset === undefined || dayOffset === null) {
      const lower = dayItem.day.toLowerCase();
      if (lower.includes('sunday') || lower.includes('pathian')) dayOffset = 0;
      else if (lower.includes('monday') || lower.includes('thawhtan')) dayOffset = 1;
      else if (lower.includes('tuesday') || lower.includes('thawhleh')) dayOffset = 2;
      else if (lower.includes('wednesday') || lower.includes('nilai')) dayOffset = 3;
      else if (lower.includes('thursday') || lower.includes('ninga')) dayOffset = 4;
      else if (lower.includes('friday') || lower.includes('zirtawp')) dayOffset = 5;
      else if (lower.includes('saturday') || lower.includes('inrin')) dayOffset = 6;
      else dayOffset = 0;
    }

    const dayDate = new Date(sunday);
    dayDate.setDate(dayDate.getDate() + dayOffset);

    return {
      ...dayItem,
      dayOfWeek: dayOffset,
      date: formatDateDisplay(dayDate)
    };
  });
}

/**
 * Checks if the existing current programme is from a past week, and auto-archives it if needed.
 */
export async function checkAndAutoArchivePreviousWeek(currentData: any): Promise<boolean> {
  if (!currentData || !currentData.days || currentData.days.length === 0) {
    return false;
  }

  const currentSunday = getSundayOfWeek();
  const currentSundayIso = formatDateISO(currentSunday);

  // Determine the start date of currentData
  let progStartIso = currentData.weekStartDate;
  if (!progStartIso && currentData.updatedAt) {
    const d = new Date(currentData.updatedAt);
    if (!isNaN(d.getTime())) {
      progStartIso = formatDateISO(getSundayOfWeek(d));
    }
  }

  if (!progStartIso) {
    return false;
  }

  // If the programme start date is strictly before the current week's Sunday
  if (progStartIso < currentSundayIso) {
    const archiveId = currentData.weekId || generateWeekId(progStartIso);
    try {
      const archiveRef = doc(db, 'programme_archives', archiveId);
      const existingArchive = await getDoc(archiveRef);

      if (!existingArchive.exists()) {
        const weekEndIso = currentData.weekEndDate || formatDateISO(getSaturdayOfWeek(parseISODate(progStartIso)));
        const archivePayload: ArchivedProgramme = {
          id: archiveId,
          weekId: archiveId,
          weekTitle: currentData.weekTitle || generateWeekTitle(progStartIso, weekEndIso),
          weekStartDate: progStartIso,
          weekEndDate: weekEndIso,
          theme: currentData.theme || '',
          verse: currentData.verse || '',
          days: currentData.days,
          updatedAt: currentData.updatedAt || new Date().toISOString(),
          archivedAt: new Date().toISOString(),
          archivedBy: 'System Auto-Archive',
          archiveNotes: 'Automatic archive when new week started'
        };

        await setDoc(archiveRef, archivePayload);
        console.log(`[AutoArchive] Successfully archived past programme ${archiveId}`);
        return true;
      }
    } catch (err) {
      console.warn('[AutoArchive] Could not auto-archive programme:', err);
    }
  }

  return false;
}
