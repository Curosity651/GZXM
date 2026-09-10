import { describe, expect, it } from 'vitest';
import { createAppStore } from '../store';
import { MOCK_INDICATOR_DEFINITIONS } from '../data/mock';
import { canPerform, canViewPage, PAGE_PERMISSION_OPTIONS } from './permissions';

describe('科研指标模块权限流程', () => {
  it('科研助理创建课题，课题牵头单位维护承担单位并分配单位指标', () => {
    const state = createAppStore().getState();
    const assistant = state.users.find((user) => user.role === '科研助理')!;
    const topicLead = state.users.find((user) => user.username === 'tsinghua')!;
    const participant = state.users.find((user) => user.username === 'pku')!;

    expect(canPerform(assistant, state.roles, 'topic.manage')).toBe(true);
    expect(canPerform(assistant, state.roles, 'topic-unit.manage')).toBe(false);
    expect(canPerform(assistant, state.roles, 'unit-allocation.manage')).toBe(false);

    expect(canPerform(topicLead, state.roles, 'topic-unit.manage')).toBe(true);
    expect(canPerform(topicLead, state.roles, 'unit-allocation.manage')).toBe(true);
    expect(canPerform(topicLead, state.roles, 'unit-allocation.publish')).toBe(true);

    expect(canViewPage(participant, state.roles, 'topic-indicator')).toBe(true);
    expect(canPerform(participant, state.roles, 'unit-allocation.manage')).toBe(true);
  });

  it('角色权限配置不再暴露指标监控和预警页面', () => {
    const values = PAGE_PERMISSION_OPTIONS.map((item) => item.value);
    expect(values).not.toContain('indicator-monitoring');
    expect(values).not.toContain('warning-rules');
  });

  it('科研指标目录包含固定的电网第一作者和中文核心期刊指标', () => {
    expect(MOCK_INDICATOR_DEFINITIONS).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: '第一作者是广西电网的数量', unit: '篇', enabled: true }),
      expect.objectContaining({ name: '中文核心期刊的数量', unit: '篇', enabled: true }),
    ]));
  });

  it('课题支持停用与启用，不通过删除课题处理', () => {
    const store = createAppStore();
    expect(store.getState().topics.find((topic) => topic.id === 't1')?.enabled).not.toBe(false);
    store.getState().toggleTopicEnabled('t1', false);
    expect(store.getState().topics.find((topic) => topic.id === 't1')?.enabled).toBe(false);
    store.getState().toggleTopicEnabled('t1', true);
    expect(store.getState().topics.find((topic) => topic.id === 't1')?.enabled).toBe(true);
  });

  it('身份任务边界保持为助理配置总体指标、牵头单位配置分配指标', () => {
    const state = createAppStore().getState();
    const assistant = state.users.find((user) => user.role === '科研助理')!;
    const unitUser = state.users.find((user) => user.role === '内部课题单位')!;
    expect(canPerform(assistant, state.roles, 'topic.manage')).toBe(true);
    expect(canPerform(assistant, state.roles, 'topic-indicator.publish')).toBe(true);
    expect(canPerform(unitUser, state.roles, 'unit-allocation.manage')).toBe(true);
    expect(canPerform(unitUser, state.roles, 'topic.manage')).toBe(false);
  });
});

describe('课题与牵头单位创建流程', () => {
  it('科研助理新增课题时指定牵头单位，并立即建立牵头关系', () => {
    const store = createAppStore();
    const topicId = 'topic-without-lead';

    store.getState().addTopic({
      id: topicId,
      projectId: store.getState().project.id,
      code: 'K6',
      name: '已指定牵头单位的课题',
      leadingUnitId: 'u-pku',
      participatingUnitIds: [],
      status: '实施中',
      domesticJournalRequiredCount: 0,
      topicOverallRequirements: {},
    });

    expect(store.getState().topicMemberships.filter((item) => item.topicId === topicId)).toEqual([
      expect.objectContaining({ unitId: 'u-pku', membershipType: 'LEAD', enabled: true }),
    ]);
  });
});
