import type { AchievementType, AchievementWorkflowStatus } from '../types';

export type AchievementAction =
  | 'SUBMIT_PRE_REVIEW' | 'APPROVE_INITIAL' | 'APPROVE_FINAL'
  | 'RETURN' | 'REGISTER_EXTERNAL_SUBMISSION' | 'START_FORMAL' | 'SUBMIT_FORMAL' | 'SUBMIT_SUPPLEMENT';

const transitions: Partial<Record<AchievementWorkflowStatus, Partial<Record<AchievementAction, AchievementWorkflowStatus>>>> = {
  预审草稿: { SUBMIT_PRE_REVIEW: '预审初审中' },
  预审初审中: { APPROVE_INITIAL: '预审终审中', RETURN: '预审退回' },
  预审终审中: { RETURN: '预审退回' },
  预审退回: { SUBMIT_PRE_REVIEW: '预审初审中' },
  预审通过: { REGISTER_EXTERNAL_SUBMISSION: '已投稿/已申请', START_FORMAL: '正式成果草稿' },
  '允许投稿/申请': { REGISTER_EXTERNAL_SUBMISSION: '已投稿/已申请' },
  '已投稿/已申请': { START_FORMAL: '正式成果草稿' },
  正式成果草稿: { SUBMIT_FORMAL: '正式初审中' },
  正式初审中: { APPROVE_INITIAL: '正式终审中', RETURN: '正式退回' },
  正式终审中: { RETURN: '正式退回' },
  正式退回: { SUBMIT_FORMAL: '正式初审中' },
  待见刊补充: { SUBMIT_SUPPLEMENT: '补充初审中' },
  待授权补充: { SUBMIT_SUPPLEMENT: '补充初审中' },
  补充初审中: { APPROVE_INITIAL: '补充终审中', RETURN: '补充退回' },
  补充终审中: { APPROVE_FINAL: '已生效', RETURN: '补充退回' },
  补充退回: { SUBMIT_SUPPLEMENT: '补充初审中' },
};

export function nextAchievementStatus(status: AchievementWorkflowStatus, action: AchievementAction, achievementType?: AchievementType): AchievementWorkflowStatus {
  if (status === '预审终审中' && action === 'APPROVE_FINAL') {
    return achievementType === '学术论文' || achievementType === '发明专利' ? '允许投稿/申请' : '正式成果草稿';
  }
  if (status === '正式终审中' && action === 'APPROVE_FINAL') {
    if (achievementType === '学术论文') return '待见刊补充';
    if (achievementType === '发明专利') return '待授权补充';
    return '已生效';
  }
  const next = transitions[status]?.[action];
  if (!next) throw new Error(`非法的成果状态流转：${status} -> ${action}`);
  return next;
}

export function isAchievementCountable(status: AchievementWorkflowStatus): boolean {
  return status === '已生效';
}
