import type { ArchiveApplicability, ArchiveRequirement, ArchiveWorkflowStatus } from '../types';

export type ArchiveOwnerType = 'PROJECT_PUBLIC' | 'TOPIC_NATIONAL' | 'SELF_FUNDED';
export type ArchiveAction = 'SUBMIT' | 'APPROVE_INITIAL' | 'APPROVE_FINAL' | 'RETURN';

export function nextArchiveStatus(ownerType: ArchiveOwnerType, status: ArchiveWorkflowStatus, action: ArchiveAction): ArchiveWorkflowStatus {
  if (action === 'SUBMIT' && ['未提交', '草稿', '退回修改'].includes(status)) return ownerType === 'PROJECT_PUBLIC' ? '终审中' : '已归档';
  if (action === 'APPROVE_INITIAL' && status === '初审中') return '终审中';
  if (action === 'APPROVE_FINAL' && status === '终审中') return '已通过';
  if (action === 'RETURN' && ['初审中', '终审中'].includes(status)) return '退回修改';
  throw new Error(`非法的归档状态流转：${ownerType}/${status} -> ${action}`);
}

export function validateApplicability(applicability: ArchiveApplicability, reason?: string): boolean {
  return applicability !== 'NOT_APPLICABLE' || Boolean(reason?.trim());
}

export function createTemplateSnapshot(requirements: ArchiveRequirement[]): ArchiveRequirement[] {
  return structuredClone(requirements);
}
