import type { ReportType } from '../types';

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function reportDeadline(type: ReportType, year: number, period: number): string {
  if (type === 'MONTHLY') {
    if (period < 1 || period > 12) throw new Error('月报期次必须为 1-12');
    const lastDay = new Date(Date.UTC(year, period, 0)).getUTCDate();
    return isoDate(year, period, Math.min(30, lastDay));
  }
  if (period < 1 || period > 4) throw new Error('季报期次必须为 1-4');
  return isoDate(year, period * 3, 10);
}

export function isReportOverdue(deadline: string, submittedAt?: string, now = new Date()): boolean {
  const compareAt = submittedAt ? new Date(`${submittedAt}T23:59:59`) : now;
  return compareAt.getTime() > new Date(`${deadline}T23:59:59`).getTime();
}
