import type { Achievement, AchievementType, IndicatorConfig, Topic, User } from '../types';
import { filterByTopicScope } from './permissions';

export interface TopicSummary {
  topicId: string;
  topicCode: string;
  topicName: string;
  planned: number;
  completed: number;
  rate: number;
  gap: number;
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
