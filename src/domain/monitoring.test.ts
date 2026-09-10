import { describe, expect, it } from 'vitest';
import { buildTopicSummaries } from './monitoring';
import type { Achievement, IndicatorConfig, Topic, User } from '../types';

const topics = [
  { id: 't1', code: 'K1', name: '课题一' },
  { id: 't2', code: 'K2', name: '课题二' },
] as Topic[];
const indicators = [
  { id: 'i1', topicId: 't1', achievementType: '学术论文', plannedQuantity: 2 },
  { id: 'i2', topicId: 't2', achievementType: '发明专利', plannedQuantity: 1 },
] as IndicatorConfig[];
const achievements = [
  { id: 'a1', topicId: 't1', achievementType: '学术论文', status: '已生效', countsToIndicator: true },
  { id: 'a2', topicId: 't1', achievementType: '学术论文', status: '正式终审中', countsToIndicator: false },
  { id: 'a3', topicId: 't2', achievementType: '发明专利', status: '预审通过', countsToIndicator: false },
] as Achievement[];

describe('课题指标监控', () => {
  it('只有已生效成果计入课题完成数量', () => {
    const result = buildTopicSummaries(topics, indicators, achievements);
    expect(result.find((item) => item.topicId === 't1')).toEqual(expect.objectContaining({ planned: 2, completed: 1, rate: 50 }));
    expect(result.find((item) => item.topicId === 't2')).toEqual(expect.objectContaining({ planned: 1, completed: 0, rate: 0 }));
  });

  it('课题账号只能取得自身课题汇总', () => {
    const user = { role: '外部课题单位', topicId: 't2' } as User;
    const result = buildTopicSummaries(topics, indicators, achievements, user);
    expect(result.map((item) => item.topicId)).toEqual(['t2']);
  });
});
