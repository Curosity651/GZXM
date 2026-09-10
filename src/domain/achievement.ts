import type { AchievementAction } from './workflows';
import type { Achievement, AchievementType, AchievementWorkflowStatus, UnitIndicatorAllocation, UserRole } from '../types';

export type AchievementStageKey = 'initiated' | 'preApproved' | 'external' | 'formal' | 'effective';

export interface AchievementProgressRow {
  key: string;
  topicId: string;
  unitId: string;
  indicatorDefinitionId: string;
  achievementType: AchievementType;
  target: number;
  initiated: number;
  preApproved: number;
  external: number;
  formal: number;
  effective: number;
  completionRate: number;
  achievements: Achievement[];
}

const PRE_APPROVED = new Set<AchievementWorkflowStatus>(['预审通过', '允许投稿/申请', '已投稿/已申请', '正式成果草稿', '正式初审中', '正式终审中', '正式退回', '已生效']);
const EXTERNAL = new Set<AchievementWorkflowStatus>(['已投稿/已申请', '正式成果草稿', '正式初审中', '正式终审中', '正式退回', '已生效']);
const FORMAL = new Set<AchievementWorkflowStatus>(['正式成果草稿', '正式初审中', '正式终审中', '正式退回', '已生效']);

export function hasReachedAchievementStage(status: string, stage: AchievementStageKey): boolean {
  if (stage === 'initiated') return true;
  if (stage === 'preApproved') return PRE_APPROVED.has(status as AchievementWorkflowStatus);
  if (stage === 'external') return EXTERNAL.has(status as AchievementWorkflowStatus);
  if (stage === 'formal') return FORMAL.has(status as AchievementWorkflowStatus);
  return status === '已生效';
}

export function aggregateAchievementProgress(allocations: UnitIndicatorAllocation[], achievements: Achievement[]): AchievementProgressRow[] {
  const grouped = new Map<string, UnitIndicatorAllocation>();
  allocations.filter((item) => item.status === '已下发').forEach((item) => {
    const key = `${item.topicId}|${item.unitId}|${item.indicatorDefinitionId}`;
    const current = grouped.get(key);
    if (!current || item.targetQuantity > current.targetQuantity) grouped.set(key, item);
  });
  return [...grouped.values()].map((allocation) => {
    const matched = achievements.filter((item) => item.topicId === allocation.topicId
      && (item.uploadUnitId ?? item.unitId) === allocation.unitId
      && (item.indicatorDefinitionId ? item.indicatorDefinitionId === allocation.indicatorDefinitionId : item.achievementType === allocation.achievementType));
    const count = (stage: AchievementStageKey) => matched.filter((item) => hasReachedAchievementStage(item.status, stage)).length;
    const effective = count('effective');
    return {
      key: `${allocation.topicId}|${allocation.unitId}|${allocation.indicatorDefinitionId}`,
      topicId: allocation.topicId,
      unitId: allocation.unitId,
      indicatorDefinitionId: allocation.indicatorDefinitionId,
      achievementType: allocation.achievementType,
      target: allocation.targetQuantity,
      initiated: matched.length,
      preApproved: count('preApproved'),
      external: count('external'),
      formal: count('formal'),
      effective,
      completionRate: allocation.targetQuantity > 0 ? Math.round(effective / allocation.targetQuantity * 100) : 0,
      achievements: matched,
    };
  });
}

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
