import type { AchievementAction } from './workflows';
import type { AchievementType, AchievementWorkflowStatus, UserRole } from '../types';

export function initialAchievementStatus(type: AchievementType): AchievementWorkflowStatus {
  return type === '人才培养' ? '正式成果草稿' : '预审草稿';
}

export function reviewActionFor(status: AchievementWorkflowStatus, role: UserRole): AchievementAction | null {
  if (role === '科研助理' && (status === '预审初审中' || status === '正式初审中')) return 'APPROVE_INITIAL';
  if (role === '项目技术负责人' && (status === '预审终审中' || status === '正式终审中')) return 'APPROVE_FINAL';
  return null;
}

export function isEditableAchievementStatus(status: string): boolean {
  return ['预审草稿', '预审退回', '允许投稿/申请', '已投稿/已申请', '正式成果草稿', '正式退回'].includes(status);
}
