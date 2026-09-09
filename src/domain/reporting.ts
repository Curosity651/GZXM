import type { ProgressReport, ReportSubmissionRule, ReportTask, ReportType, Topic } from '../types';

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

export function reportWindow(rule: ReportSubmissionRule, period: number): { openDate: string; deadline: string } {
  const month = rule.reportType === 'MONTHLY' ? period : rule.quarterlyMonths[period - 1] ?? period * 3;
  return {
    openDate: isoDate(rule.effectiveYear, month, clampDay(rule.effectiveYear, month, rule.openDay)),
    deadline: isoDate(rule.effectiveYear, month, clampDay(rule.effectiveYear, month, rule.deadlineDay)),
  };
}

export function generateReportTasks(
  topics: Topic[], rules: ReportSubmissionRule[], currentTasks: ReportTask[] = [], reports: ProgressReport[] = [],
): ReportTask[] {
  const generated = rules.filter((rule) => rule.enabled).flatMap((rule) => {
    const periods = rule.reportType === 'MONTHLY' ? Array.from({ length: 12 }, (_, index) => index + 1) : Array.from({ length: rule.quarterlyMonths.length }, (_, index) => index + 1);
    return topics.filter((topic) => topic.status !== '已暂停' && topic.status !== '已结题').flatMap((topic) => periods.map((period) => {
      const id = `report-task-${rule.reportType === 'MONTHLY' ? 'm' : 'q'}-${topic.id}-${rule.effectiveYear}-${period}`;
      const existing = currentTasks.find((item) => item.id === id);
      const window = reportWindow(rule, period);
      if (existing && reports.some((report) => report.taskId === id)) return existing;
      return { id, topicId: topic.id, reportType: rule.reportType, year: rule.effectiveYear, period, openDate: window.openDate, deadline: window.deadline, ruleId: rule.id };
    }));
  });
  const generatedIds = new Set(generated.map((item) => item.id));
  const preserved = currentTasks.filter((task) => !generatedIds.has(task.id) && reports.some((report) => report.taskId === task.id));
  return [...preserved, ...generated];
}

export function isReportOpen(task: ReportTask, now = new Date()): boolean {
  return now.getTime() >= new Date(`${task.openDate}T00:00:00`).getTime();
}

export function isReportOverdue(deadline: string, submittedAt?: string, now = new Date()): boolean {
  const compareAt = submittedAt ? new Date(`${submittedAt}T23:59:59`) : now;
  return compareAt.getTime() > new Date(`${deadline}T23:59:59`).getTime();
}
