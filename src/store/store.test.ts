import { describe, expect, it } from 'vitest';
import { createAppStore, createInitialState, visibleTopics } from './index';

describe('Mock 数据范围', () => {
  it('为每个课题建立独立账号并只返回绑定课题', () => {
    const state = createInitialState();
    const user = state.users.find((item) => item.username === 'topic01');
    expect(user?.role).toBe('课题牵头单位');
    expect(visibleTopics(user!, state.topics).map((topic) => topic.id)).toEqual(['t1']);
  });
});

describe('成果审批记录', () => {
  it('初审通过后进入终审并写入审批记录', () => {
    const store = createAppStore();
    store.getState().reviewAchievement('ach-pre-review', 'APPROVE_INITIAL', 'user-assistant', '材料完整');

    const achievement = store.getState().achievements.find((item) => item.id === 'ach-pre-review');
    expect(achievement?.status).toBe('预审终审中');
    expect(store.getState().approvalRecords).toContainEqual(expect.objectContaining({
      businessId: 'ach-pre-review', level: 'INITIAL', decision: 'APPROVED', operatorId: 'user-assistant',
    }));
  });

  it('正式终审通过后才计入指标', () => {
    const store = createAppStore();
    store.getState().reviewAchievement('ach-formal-final', 'APPROVE_FINAL', 'user-leader', '同意');

    const achievement = store.getState().achievements.find((item) => item.id === 'ach-formal-final');
    expect(achievement?.status).toBe('已生效');
    expect(achievement?.countsToIndicator).toBe(true);
  });
});
