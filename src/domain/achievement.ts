import type { AchievementAction } from './workflows';
import type { Achievement, AchievementType, AchievementWorkflowStatus, UnitIndicatorAllocation, UserRole } from '../types';

export type AchievementStageKey = 'initiated' | 'preApproved' | 'external' | 'formal' | 'supplement' | 'effective';

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
  supplement: number;
  effective: number;
  completionRate: number;
  achievements: Achievement[];
}

const postFormalStatuses: AchievementWorkflowStatus[] = ['待见刊补充', '待授权补充', '补充初审中', '补充终审中', '补充退回', '已生效'];
const PRE_APPROVED = new Set<AchievementWorkflowStatus>(['预审通过', '允许投稿/申请', '已投稿/已申请', '正式成果草稿', '正式初审中', '正式终审中', '正式退回', ...postFormalStatuses]);
const EXTERNAL = new Set<AchievementWorkflowStatus>(['已投稿/已申请', '正式成果草稿', '正式初审中', '正式终审中', '正式退回', ...postFormalStatuses]);
const FORMAL = new Set<AchievementWorkflowStatus>(['正式成果草稿', '正式初审中', '正式终审中', '正式退回', ...postFormalStatuses]);
const SUPPLEMENT = new Set<AchievementWorkflowStatus>(['待见刊补充', '待授权补充', '补充初审中', '补充终审中', '补充退回', '已生效']);

export function hasReachedAchievementStage(status: string, stage: AchievementStageKey): boolean {
  if (stage === 'initiated') return true;
  if (stage === 'preApproved') return PRE_APPROVED.has(status as AchievementWorkflowStatus);
  if (stage === 'external') return EXTERNAL.has(status as AchievementWorkflowStatus);
  if (stage === 'formal') return FORMAL.has(status as AchievementWorkflowStatus);
  if (stage === 'supplement') return SUPPLEMENT.has(status as AchievementWorkflowStatus);
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
      && achievementMatchesIndicator(item, allocation.indicatorDefinitionId, allocation.achievementType));
    const count = (stage: AchievementStageKey) => {
      if (stage === 'external' && !['学术论文', '发明专利'].includes(allocation.achievementType)) return 0;
      return matched.filter((item) => item.countsToIndicator || hasReachedAchievementStage(item.status, stage)).length;
    };
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
      supplement: count('supplement'),
      effective,
      completionRate: allocation.targetQuantity > 0 ? Math.round(effective / allocation.targetQuantity * 100) : 0,
      achievements: matched,
    };
  });
}

export function initialAchievementStatus(_type: AchievementType): AchievementWorkflowStatus {
  return '预审草稿';
}

export function reviewActionFor(status: AchievementWorkflowStatus, access: UserRole | { canInitial: boolean; canFinal: boolean }): AchievementAction | null {
  const canInitial = typeof access === 'string' ? access === '科研助理' : access.canInitial;
  const canFinal = typeof access === 'string' ? access === '项目技术负责人' : access.canFinal;
  if (canInitial && (status === '预审初审中' || status === '正式初审中' || status === '补充初审中')) return 'APPROVE_INITIAL';
  if (canFinal && (status === '预审终审中' || status === '正式终审中' || status === '补充终审中')) return 'APPROVE_FINAL';
  return null;
}

export function isEditableAchievementStatus(status: string): boolean {
  return ['预审草稿', '预审退回', '允许投稿/申请', '已投稿/已申请', '正式成果草稿', '正式退回', '待见刊补充', '待授权补充', '补充退回'].includes(status);
}

export function achievementMatchesIndicator(achievement: Achievement, indicatorDefinitionId: string, achievementType: AchievementType): boolean {
  if (achievement.achievementType !== achievementType) return false;
  if (indicatorDefinitionId === 'indicator-chinese-core-journal') return achievement.isChineseCoreJournal === true || achievement.paperType === '中文核心';
  if (indicatorDefinitionId === 'indicator-power-grid-first-author-paper') return achievement.isPowerGridFirstAuthor === true;
  if (indicatorDefinitionId === 'indicator-power-grid-first-applicant-patent') return achievement.isPowerGridFirstApplicant === true;
  if (indicatorDefinitionId === 'indicator-power-grid-first-completer-copyright') return achievement.isPowerGridFirstCompleter === true;
  return achievement.indicatorDefinitionId ? achievement.indicatorDefinitionId === indicatorDefinitionId : achievement.achievementType === achievementType;
}
