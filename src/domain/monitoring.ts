import type { Achievement, AchievementType, IndicatorConfig, ProjectUnit, Topic, TopicIndicator, TopicUnitMembership, UnitIndicatorAllocation, User } from '../types';
import { filterByTopicScope } from './permissions';
import { accessibleTopics, isTopicLead } from './topic-access';

export interface TopicSummary {
  topicId: string;
  topicCode: string;
  topicName: string;
  planned: number;
  completed: number;
  rate: number;
  gap: number;
}

export interface UnitTopicSummary extends TopicSummary {
  unitId: string;
  unitName: string;
}

export function buildUnitTopicSummaries(
  topics: Topic[], units: ProjectUnit[], memberships: TopicUnitMembership[],
  _topicIndicators: TopicIndicator[], allocations: UnitIndicatorAllocation[], achievements: Achievement[], user: User,
): UnitTopicSummary[] {
  const visible = accessibleTopics(user, topics, memberships);
  const global = ['系统管理员', '项目技术负责人', '科研助理'].includes(user.role);
  return visible.flatMap((topic) => {
    const canSeeAllUnits = global || isTopicLead(user, topic.id, memberships);
    const topicMemberships = memberships.filter((item) => item.topicId === topic.id && item.enabled && (canSeeAllUnits || item.unitId === user.unitId));
    return topicMemberships.map((membership) => {
      const unitAllocations = allocations.filter((item) => item.topicId === topic.id && item.unitId === membership.unitId && item.status === '已下发');
      const planned = unitAllocations.reduce((sum, item) => sum + item.targetQuantity, 0);
      const completed = achievements.filter((item) => item.topicId === topic.id && (item.uploadUnitId ?? item.unitId) === membership.unitId && item.status === '已生效').length;
      return { topicId: topic.id, topicCode: topic.code, topicName: topic.name, unitId: membership.unitId, unitName: units.find((item) => item.id === membership.unitId)?.name ?? membership.unitId, planned, completed, gap: Math.max(planned - completed, 0), rate: planned === 0 ? 0 : Math.min(100, Math.round(completed / planned * 100)) };
    });
  });
}

export function buildTopicSummariesV2(
  topics: Topic[], memberships: TopicUnitMembership[], topicIndicators: TopicIndicator[], achievements: Achievement[], user: User,
): TopicSummary[] {
  return accessibleTopics(user, topics, memberships).map((topic) => {
    const planned = topicIndicators.filter((item) => item.topicId === topic.id && item.status === '已下发').reduce((sum, item) => sum + item.targetQuantity, 0);
    const completed = achievements.filter((item) => item.topicId === topic.id && item.status === '已生效').length;
    return { topicId: topic.id, topicCode: topic.code, topicName: topic.name, planned, completed, gap: Math.max(planned - completed, 0), rate: planned === 0 ? 0 : Math.min(100, Math.round(completed / planned * 100)) };
  });
}

export function buildTopicSummaries(
  topics: Topic[],
  indicators: IndicatorConfig[],
  achievements: Achievement[],
  user?: User,
): TopicSummary[] {
  const visible = user ? filterByTopicScope(user, topics) : topics;

  return visible.map((topic) => {
    const targetByType = new Map<AchievementType, number>();
    indicators.filter((indicator) => indicator.topicId === topic.id).forEach((indicator) => {
      const current = targetByType.get(indicator.achievementType) ?? 0;
      targetByType.set(indicator.achievementType, Math.max(current, indicator.plannedQuantity));
    });
    const planned = [...targetByType.values()].reduce((sum, value) => sum + value, 0);
    const completed = achievements.filter((achievement) => (
      achievement.topicId === topic.id && achievement.status === '已生效' && achievement.countsToIndicator
    )).length;
    return {
      topicId: topic.id,
      topicCode: topic.code,
      topicName: topic.name,
      planned,
      completed,
      gap: Math.max(planned - completed, 0),
      rate: planned === 0 ? 100 : Math.round((completed / planned) * 100),
    };
  });
}
