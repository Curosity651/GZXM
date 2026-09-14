import type { ReportTask, ReportType, TopicReportConfig } from '../types';

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

function clampDay(year: number, month: number, day: number): number {
  return Math.min(Math.max(day, 1), new Date(Date.UTC(year, month, 0)).getUTCDate());
}

export function createDefaultTopicReportConfig(year = new Date().getFullYear()): TopicReportConfig {
  return {
    effectiveYear: year,
    monthlyEnabled: true,
    monthlyOpenDay: 1,
    monthlyDeadlineDay: 30,
    quarterlyEnabled: true,
    quarterlyOpenDay: 1,
    quarterlyDeadlineDay: 10,
    quarterlyMonths: [3, 6, 9, 12],
  };
}

export function topicReportWindow(config: TopicReportConfig, reportType: ReportType, year: number, period: number): { openDate: string; deadline: string } {
  if (year !== config.effectiveYear) throw new Error(`该课题仅配置了 ${config.effectiveYear} 年的月季报规则`);
  if (reportType === 'MONTHLY' && !config.monthlyEnabled) throw new Error('该课题未启用月报');
  if (reportType === 'QUARTERLY' && !config.quarterlyEnabled) throw new Error('该课题未启用季报');
  if (reportType === 'MONTHLY' && (period < 1 || period > 12)) throw new Error('月报期次必须为 1 至 12');
  if (reportType === 'QUARTERLY' && (period < 1 || period > config.quarterlyMonths.length)) throw new Error(`季报期次必须为 1 至 ${config.quarterlyMonths.length}`);
  const month = reportType === 'MONTHLY' ? period : config.quarterlyMonths[period - 1];
  if (!month || month < 1 || month > 12) throw new Error('季报月份配置不正确');
  const openDay = reportType === 'MONTHLY' ? config.monthlyOpenDay : config.quarterlyOpenDay;
  const deadlineDay = reportType === 'MONTHLY' ? config.monthlyDeadlineDay : config.quarterlyDeadlineDay;
  return {
    openDate: isoDate(year, month, clampDay(year, month, openDay)),
    deadline: isoDate(year, month, clampDay(year, month, deadlineDay)),
  };
}

export function isReportOpen(task: ReportTask, now = new Date()): boolean {
  return now.getTime() >= new Date(`${task.openDate}T00:00:00`).getTime();
}

export function isReportOverdue(deadline: string, submittedAt?: string, now = new Date()): boolean {
  const compareAt = submittedAt ? new Date(`${submittedAt}T23:59:59`) : now;
  return compareAt.getTime() > new Date(`${deadline}T23:59:59`).getTime();
}
