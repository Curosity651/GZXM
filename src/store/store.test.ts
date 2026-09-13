import { describe, expect, it } from 'vitest';
import { createAppStore, createInitialState, visibleTopics } from './index';

describe('Mock 数据范围', () => {
  it('为每个课题建立独立账号并只返回绑定课题', () => {
    const state = createInitialState();
    const user = state.users.find((item) => item.username === 'tsinghua');
    expect(user?.role).toBe('外部课题单位');
    expect(visibleTopics(user!, state.topics).map((topic) => topic.id)).toEqual(['t1']);
  });

  it('初始化数据不再暴露旧版单层审批状态', () => {
    const legacy = new Set(['草稿', '已提交', '审批中', '审批通过', '审批不通过', '退回修改']);
    expect(createInitialState().achievements.every((item) => !legacy.has(item.status))).toBe(true);
  });
});

describe('成果审批记录', () => {
  it('课题账号提交预审后进入初审队列', () => {
    const store = createAppStore();
    store.getState().updateAchievement('ach-pre-review', { status: '预审草稿' });
    store.getState().advanceAchievement('ach-pre-review', 'SUBMIT_PRE_REVIEW', 'user-topic-1');
    expect(store.getState().achievements.find((item) => item.id === 'ach-pre-review')?.status).toBe('预审初审中');
  });

  it('初审通过后进入终审并写入审批记录', () => {
    const store = createAppStore();
    store.getState().reviewAchievement('ach-pre-review', 'APPROVE_INITIAL', 'user-assistant', '材料完整');

    const achievement = store.getState().achievements.find((item) => item.id === 'ach-pre-review');
    expect(achievement?.status).toBe('预审终审中');
    expect(store.getState().approvalRecords).toContainEqual(expect.objectContaining({
      businessId: 'ach-pre-review', level: 'INITIAL', decision: 'APPROVED', operatorId: 'user-assistant',
    }));
  });

  it('专利正式终审后需完成授权补充两级审批才计入指标', () => {
    const store = createAppStore();
    store.getState().reviewAchievement('ach-formal-final', 'APPROVE_FINAL', 'user-leader', '同意');

    let achievement = store.getState().achievements.find((item) => item.id === 'ach-formal-final')!;
    expect(achievement.status).toBe('待授权补充');
    expect(achievement.countsToIndicator).toBe(false);

    store.getState().updateAchievement(achievement.id, { materials: [{
      id: 'supplement-material', achievementId: achievement.id, materialType: '专利授权证书', name: '专利授权证书',
      fileId: 'file-1', fileName: 'grant.pdf', fileUrl: '#', version: 1, status: '待审核',
    }] });
    store.getState().advanceAchievement(achievement.id, 'SUBMIT_SUPPLEMENT', 'user-pku');
    store.getState().reviewAchievement(achievement.id, 'APPROVE_INITIAL', 'user-assistant', '材料完整');
    store.getState().reviewAchievement(achievement.id, 'APPROVE_FINAL', 'user-leader', '同意生效');

    achievement = store.getState().achievements.find((item) => item.id === 'ach-formal-final')!;
    expect(achievement.status).toBe('已生效');
    expect(achievement.countsToIndicator).toBe(true);
    expect(achievement.materials[0].status).toBe('审核通过');
  });

  it('终审退回由项目技术负责人操作并记录为终审', () => {
    const store = createAppStore();
    store.getState().reviewAchievement('ach-formal-final', 'RETURN', 'user-leader', '请补充正式受理材料');

    expect(store.getState().achievements.find((item) => item.id === 'ach-formal-final')?.status).toBe('正式退回');
    expect(store.getState().approvalRecords.at(-1)).toEqual(expect.objectContaining({ level: 'FINAL', decision: 'RETURNED' }));
  });
});
