import type { AchievementWorkflowStatus } from '../types';

export type AchievementAction =
  | 'SUBMIT_PRE_REVIEW' | 'APPROVE_INITIAL' | 'APPROVE_FINAL'
  | 'RETURN' | 'REGISTER_EXTERNAL_SUBMISSION' | 'START_FORMAL' | 'SUBMIT_FORMAL';

const transitions: Partial<Record<AchievementWorkflowStatus, Partial<Record<AchievementAction, AchievementWorkflowStatus>>>> = {
  预审草稿: { SUBMIT_PRE_REVIEW: '预审初审中' },
  预审初审中: { APPROVE_INITIAL: '预审终审中', RETURN: '预审退回' },
  预审终审中: { APPROVE_FINAL: '允许投稿/申请', RETURN: '预审退回' },
  预审退回: { SUBMIT_PRE_REVIEW: '预审初审中' },
  预审通过: { REGISTER_EXTERNAL_SUBMISSION: '已投稿/已申请', START_FORMAL: '正式成果草稿' },
  '允许投稿/申请': { REGISTER_EXTERNAL_SUBMISSION: '已投稿/已申请' },
  '已投稿/已申请': { START_FORMAL: '正式成果草稿' },
  正式成果草稿: { SUBMIT_FORMAL: '正式初审中' },
  正式初审中: { APPROVE_INITIAL: '正式终审中', RETURN: '正式退回' },
  正式终审中: { APPROVE_FINAL: '已生效', RETURN: '正式退回' },
  正式退回: { SUBMIT_FORMAL: '正式初审中' },
};

export function nextAchievementStatus(status: AchievementWorkflowStatus, action: AchievementAction): AchievementWorkflowStatus {
  const next = transitions[status]?.[action];
  if (!next) throw new Error(`非法的成果状态流转：${status} -> ${action}`);
  return next;
}

export function isAchievementCountable(status: AchievementWorkflowStatus): boolean {
  return status === '已生效';
}
