import { useState, useEffect, useMemo } from 'react';
import { AppState } from 'react-native';
import { DayPlan, WeeklyWeightEntry } from '../types';

export interface WeekDayMeta {
  dayId: string;
  dayName: string;
  dayShort: string;
  dayOfMonth: number;
  monthName: string;
  isoDate: string;
  isToday: boolean;
}

export const WEEK_DAY_TEMPLATES: readonly {
  dayId: string;
  dayName: string;
  dayShort: string;
}[] = [
  { dayId: 'mon', dayName: 'Pazartesi', dayShort: 'Pzt' },
  { dayId: 'tue', dayName: 'Salı', dayShort: 'Sal' },
  { dayId: 'wed', dayName: 'Çarşamba', dayShort: 'Çar' },
  { dayId: 'thu', dayName: 'Perşembe', dayShort: 'Per' },
  { dayId: 'fri', dayName: 'Cuma', dayShort: 'Cum' },
  { dayId: 'sat', dayName: 'Cumartesi', dayShort: 'Cmt' },
  { dayId: 'sun', dayName: 'Pazar', dayShort: 'Paz' },
];

/**
 * Returns local calendar date formatted as YYYY-MM-DD without UTC timezone shift.
 */
export function getLocalIsoDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD string into a local Date anchored at 12:00 noon
 * to avoid DST or UTC midnight boundary shifts.
 */
export function parseLocalIsoDate(isoDate: string): Date {
  const parts = isoDate.split('-').map((p) => parseInt(p, 10));
  if (parts.length === 3 && !parts.some((n) => Number.isNaN(n))) {
    return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  }
  return new Date();
}

/**
 * Returns Monday-based day index (0 = Monday ... 6 = Sunday).
 */
export function getTodayMondayIndex(date: Date = new Date()): number {
  return (date.getDay() + 6) % 7;
}

export const TURKISH_MONTHS_LONG: readonly string[] = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

export const TURKISH_MONTHS_SHORT: readonly string[] = [
  'Oca',
  'Şub',
  'Mar',
  'Nis',
  'May',
  'Haz',
  'Tem',
  'Ağu',
  'Eyl',
  'Eki',
  'Kas',
  'Ara',
];

// Indexed by Date.prototype.getDay() (0 = Sunday ... 6 = Saturday)
export const TURKISH_WEEKDAYS_LONG: readonly string[] = [
  'Pazar',
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi',
];

export const TURKISH_WEEKDAYS_SHORT: readonly string[] = [
  'Paz',
  'Pzt',
  'Sal',
  'Çar',
  'Per',
  'Cum',
  'Cmt',
];

/**
 * Formats full Turkish header date deterministically, e.g. "2 Kasım Pazartesi".
 */
export function formatTurkishHeaderDate(date: Date = new Date()): string {
  const day = date.getDate();
  const month = TURKISH_MONTHS_LONG[date.getMonth()] ?? '';
  const weekday = TURKISH_WEEKDAYS_LONG[date.getDay()] ?? '';
  return `${day} ${month} ${weekday}`.trim();
}

/**
 * Formats short Turkish day + month deterministically, e.g. "2 Kas".
 */
export function formatTurkishShortDate(date: Date = new Date()): string {
  const day = date.getDate();
  const monthShort = TURKISH_MONTHS_SHORT[date.getMonth()] ?? '';
  return `${day} ${monthShort}`.trim();
}

/**
 * Formats short Turkish weekday deterministically, e.g. "Pzt".
 */
export function formatTurkishWeekdayShort(date: Date = new Date()): string {
  return TURKISH_WEEKDAYS_SHORT[date.getDay()] ?? 'Pzt';
}

/**
 * Formats Turkish full month name deterministically, e.g. "Kasım".
 */
export function formatTurkishMonthLong(date: Date = new Date()): string {
  return TURKISH_MONTHS_LONG[date.getMonth()] ?? '';
}

/**
 * Computes the 7 days (Monday through Sunday) for the current calendar week
 * of `referenceDate`, anchored at local noon to prevent DST issues.
 */
export function getCurrentWeekDays(referenceDate: Date = new Date()): WeekDayMeta[] {
  const todayIso = getLocalIsoDate(referenceDate);
  const mondayOffset = getTodayMondayIndex(referenceDate);
  const mondayNoon = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() - mondayOffset,
    12,
    0,
    0
  );

  return WEEK_DAY_TEMPLATES.map((template, dayIndex) => {
    const targetDate = new Date(
      mondayNoon.getFullYear(),
      mondayNoon.getMonth(),
      mondayNoon.getDate() + dayIndex,
      12,
      0,
      0
    );
    const isoDate = getLocalIsoDate(targetDate);

    return {
      dayId: template.dayId,
      dayName: template.dayName,
      dayShort: template.dayShort,
      dayOfMonth: targetDate.getDate(),
      monthName: formatTurkishMonthLong(targetDate),
      isoDate,
      isToday: isoDate === todayIso,
    };
  });
}

export const getCurrentWeekDates = getCurrentWeekDays;

/**
 * Overlays live calendar week metadata (dayOfMonth, monthName, isToday, labels)
 * onto an existing 7-day meal plan so persisted plans never show stale dates.
 */
export function overlayCurrentWeekDatesOnPlan(
  plan: DayPlan[],
  referenceDate: Date = new Date()
): DayPlan[] {
  const weekDays = getCurrentWeekDays(referenceDate);
  return plan.map((day, index) => {
    const meta = weekDays[index];
    if (!meta) return day;
    return {
      ...day,
      dayId: meta.dayId,
      dayName: meta.dayName,
      dayShort: meta.dayShort,
      dayOfMonth: meta.dayOfMonth,
      monthName: meta.monthName,
      isToday: meta.isToday,
    };
  });
}

/**
 * Returns true if any day in the persisted plan has stale calendar metadata.
 */
export function isPlanDatesOutOfSync(
  plan: DayPlan[] | null | undefined,
  referenceDate: Date = new Date()
): boolean {
  if (!plan || plan.length !== 7) return true;
  const weekDays = getCurrentWeekDays(referenceDate);
  return plan.some((day, index) => {
    const meta = weekDays[index];
    if (!meta) return true;
    return (
      day.dayId !== meta.dayId ||
      day.dayName !== meta.dayName ||
      day.dayShort !== meta.dayShort ||
      day.dayOfMonth !== meta.dayOfMonth ||
      day.monthName !== meta.monthName ||
      day.isToday !== meta.isToday
    );
  });
}

/**
 * Generates dynamic demo weekly weight logs anchored to the current date
 * so initial seed logs never display hardcoded past months.
 */
export function getDynamicInitialWeightLogs(
  referenceDate: Date = new Date()
): WeeklyWeightEntry[] {
  const twoWeeksAgo = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() - 14,
    12,
    0,
    0
  );
  const oneWeekAgo = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() - 7,
    12,
    0,
    0
  );
  const thisWeek = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    12,
    0,
    0
  );

  return [
    {
      id: 'ww-1',
      dateStr: formatTurkishShortDate(twoWeeksAgo),
      weekLabel: '2 Hafta Önce',
      weightKg: 65.8,
      previousWeightKg: 66.2,
      deltaKg: -0.4,
      goalAtLog: 'weight_loss',
    },
    {
      id: 'ww-2',
      dateStr: formatTurkishShortDate(oneWeekAgo),
      weekLabel: 'Geçen Hafta',
      weightKg: 65.4,
      previousWeightKg: 65.8,
      deltaKg: -0.4,
      goalAtLog: 'muscle_gain',
    },
    {
      id: 'ww-3',
      dateStr: formatTurkishShortDate(thisWeek),
      weekLabel: 'Bu Hafta',
      weightKg: 65.0,
      previousWeightKg: 65.4,
      deltaKg: -0.4,
      goalAtLog: 'muscle_gain',
    },
  ];
}

/**
 * Refreshes the dateStr of default demo weight log entries ('ww-1', 'ww-2', 'ww-3')
 * if they were persisted in AsyncStorage with older calendar dates.
 */
export function refreshSeedWeightLogs(
  logs: WeeklyWeightEntry[],
  referenceDate: Date = new Date()
): { logs: WeeklyWeightEntry[]; changed: boolean } {
  const dynamicSeeds = getDynamicInitialWeightLogs(referenceDate);
  const seedMap = new Map(dynamicSeeds.map((item) => [item.id, item]));
  let changed = false;

  const updated = logs.map((entry) => {
    const seed = seedMap.get(entry.id);
    if (seed && (entry.dateStr !== seed.dateStr || entry.weekLabel !== seed.weekLabel)) {
      changed = true;
      return {
        ...entry,
        dateStr: seed.dateStr,
        weekLabel: seed.weekLabel,
      };
    }
    return entry;
  });

  return { logs: updated, changed };
}

// Singleton clock broadcaster to prevent duplicate timers across multiple mounted components
type ClockListener = (now: Date) => void;
const clockListeners = new Set<ClockListener>();
let sharedClockNow = new Date();
let sharedClockInterval: ReturnType<typeof setInterval> | null = null;
let sharedAppStateSub: { remove: () => void } | null = null;

function broadcastClockTick() {
  const current = new Date();
  const prevIso = getLocalIsoDate(sharedClockNow);
  const currentIso = getLocalIsoDate(current);
  if (
    prevIso !== currentIso ||
    sharedClockNow.getHours() !== current.getHours() ||
    sharedClockNow.getMinutes() !== current.getMinutes()
  ) {
    sharedClockNow = current;
    clockListeners.forEach((listener) => listener(sharedClockNow));
  }
}

function startSharedClock() {
  if (!sharedClockInterval) {
    sharedClockInterval = setInterval(broadcastClockTick, 15000);
  }
  if (!sharedAppStateSub) {
    sharedAppStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        broadcastClockTick();
      }
    });
  }
}

function stopSharedClockIfEmpty() {
  if (clockListeners.size === 0) {
    if (sharedClockInterval) {
      clearInterval(sharedClockInterval);
      sharedClockInterval = null;
    }
    if (sharedAppStateSub) {
      sharedAppStateSub.remove();
      sharedAppStateSub = null;
    }
  }
}

/**
 * Reactive hook that keeps today's date, weekday index, and current week metadata
 * live across midnight rollovers and foreground AppState transitions using a singleton clock.
 */
export function useLiveToday() {
  const [now, setNow] = useState<Date>(() => sharedClockNow);

  useEffect(() => {
    const handleTick: ClockListener = (updatedDate) => {
      setNow(updatedDate);
    };

    clockListeners.add(handleTick);
    startSharedClock();

    return () => {
      clockListeners.delete(handleTick);
      stopSharedClockIfEmpty();
    };
  }, []);

  const todayKey = getLocalIsoDate(now);
  const todayDate = useMemo(() => parseLocalIsoDate(todayKey), [todayKey]);
  const todayMondayIndex = useMemo(() => getTodayMondayIndex(todayDate), [todayDate]);
  const formattedHeaderDate = useMemo(() => formatTurkishHeaderDate(todayDate), [todayDate]);
  const weekDays = useMemo(() => getCurrentWeekDays(todayDate), [todayDate]);

  return {
    now,
    todayDate,
    todayKey,
    todayMondayIndex,
    formattedHeaderDate,
    weekDays,
  };
}

export const useCurrentDate = useLiveToday;
