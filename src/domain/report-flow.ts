import type { ReportStatus, ReportType } from '../types';

export type ReportAction = 'SUBMIT' | 'APPROVE_INITIAL' | 'APPROVE_FINAL' | 'RETURN';

const transitions: Record<string, Partial<Record<ReportAction, ReportStatus>>> = {
  草稿: { SUBMIT: '初审中' },
  退回修改: { SUBMIT: '初审中' },
  初审中: { APPROVE_INITIAL: '终审中', RETURN: '退回修改' },
  终审中: { APPROVE_FINAL: '已通过', RETURN: '退回修改' },
};

export function nextReportStatus(status: ReportStatus, action: ReportAction): ReportStatus {
  const next = transitions[status]?.[action];
  if (!next) throw new Error(`非法的报告状态流转：${status} -> ${action}`);
  return next;
}

export function isReportEditable(status: ReportStatus): boolean {
  return ['草稿', '退回修改'].includes(status);
}

export function reportCountsToProgress(status: ReportStatus): boolean {
  return status === '已通过';
}

export function reportTaskKey(topicId: string, type: ReportType, year: number, period: number): string {
  return `${topicId}-${type}-${year}-${period}`;
}
