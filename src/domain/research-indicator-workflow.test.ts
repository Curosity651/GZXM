import { describe, expect, it } from 'vitest';
import { createAppStore, createInitialState, migratePersistedState } from '../store';
import { MOCK_INDICATOR_DEFINITIONS } from '../data/mock';
import { canPerform, canViewPage, PAGE_PERMISSION_OPTIONS } from './permissions';

describe('科研指标模块权限流程', () => {
  it('科研助理创建课题，课题牵头单位维护承担单位并分配单位指标', () => {
    const state = createAppStore().getState();
    const assistant = state.users.find((user) => user.role === '科研助理')!;
    const projectLeader = state.users.find((user) => user.role === '项目技术负责人')!;
    const topicLead = state.users.find((user) => user.username === 'tsinghua')!;
    const participant = state.users.find((user) => user.username === 'pku')!;

    expect(canPerform(assistant, state.roles, 'topic.manage')).toBe(true);
    expect(canPerform(assistant, state.roles, 'topic-unit.manage')).toBe(false);
    expect(canPerform(assistant, state.roles, 'unit-allocation.manage')).toBe(false);
    expect(canPerform(projectLeader, state.roles, 'topic.manage')).toBe(true);
    expect(canPerform(projectLeader, state.roles, 'indicator.manage')).toBe(true);
    expect(canPerform(projectLeader, state.roles, 'topic-indicator.publish')).toBe(true);

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

  it('科研指标目录将广西电网第一完成信息拆分为三项指标', () => {
    expect(MOCK_INDICATOR_DEFINITIONS).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: '第一作者是广西电网的论文数量', achievementType: '学术论文', unit: '篇', enabled: true }),
      expect.objectContaining({ name: '第一申请人是广西电网的专利数量', achievementType: '发明专利', unit: '项', enabled: true }),
      expect.objectContaining({ name: '第一完成人是广西电网的软著数量', achievementType: '软件著作权', unit: '项', enabled: true }),
      expect.objectContaining({ name: '中文核心期刊的数量', unit: '篇', enabled: true }),
    ]));
    expect(MOCK_INDICATOR_DEFINITIONS).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ name: '第一作者是广西电网的数量' }),
    ]));
  });

  it('课题支持停用与启用，不通过删除课题处理', () => {
    const store = createAppStore();
    const assistant = store.getState().users.find((user) => user.role === '科研助理')!;
    expect(store.getState().topics.find((topic) => topic.id === 't1')?.enabled).not.toBe(false);
    store.getState().toggleTopicEnabled('t1', false, assistant.id);
    expect(store.getState().topics.find((topic) => topic.id === 't1')?.enabled).toBe(false);
    store.getState().toggleTopicEnabled('t1', true, assistant.id);
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

  it('单位指标分配在数据层仅允许当前课题牵头单位修改', () => {
    const store = createAppStore();
    const participant = store.getState().users.find((user) => user.username === 'pku')!;
    const topicLead = store.getState().users.find((user) => user.username === 'tsinghua')!;
    const row = store.getState().unitIndicatorAllocations.find((item) => item.topicId === 't1')!;

    expect(() => store.getState().saveUnitAllocations([{ ...row, targetQuantity: row.targetQuantity + 1 }], participant.id))
      .toThrow('只有该课题牵头单位可以编辑单位指标分配');
    expect(() => store.getState().saveUnitAllocations([{ ...row, targetQuantity: row.targetQuantity + 1 }], topicLead.id))
      .not.toThrow();
  });

  it('旧版本地数据升级时保留课题数据并补齐新指标与权限', () => {
    const oldState = createInitialState();
    oldState.topics[0].name = '用户已编辑的课题名称';
    oldState.units.find((unit) => unit.id === 'u-sgcc')!.name = '国家电网公司';
    oldState.users.find((user) => user.id === 'user-tsinghua')!.name = '清华大学';
    oldState.roles = oldState.roles.map((role) => role.name === '项目技术负责人'
      ? { ...role, actionPermissions: role.actionPermissions.filter((item) => !['topic.manage', 'indicator.manage', 'topic-indicator.publish'].includes(item)) }
      : role);

    const migrated = migratePersistedState(oldState);

    expect(migrated.topics[0].name).toBe('用户已编辑的课题名称');
    expect(migrated.units.find((unit) => unit.id === 'u-sgcc')?.name).toBe('广西电网公司');
    expect(migrated.users.find((user) => user.id === 'user-tsinghua')?.name).toBe('张三');
    expect(migrated.indicatorDefinitions.map((item) => item.name)).toEqual(expect.arrayContaining([
      '第一作者是广西电网的论文数量',
      '第一申请人是广西电网的专利数量',
      '第一完成人是广西电网的软著数量',
    ]));
    expect(migrated.roles.find((role) => role.name === '项目技术负责人')?.actionPermissions)
      .toEqual(expect.arrayContaining(['topic.manage', 'indicator.manage', 'topic-indicator.publish']));
  });
});

describe('课题与牵头单位创建流程', () => {
  it('科研助理新增课题时指定牵头单位，并立即建立牵头关系', () => {
    const store = createAppStore();
    const topicId = 'topic-without-lead';
    const assistant = store.getState().users.find((user) => user.role === '科研助理')!;

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
    }, assistant.id);

    expect(store.getState().topicMemberships.filter((item) => item.topicId === topicId)).toEqual([
      expect.objectContaining({ unitId: 'u-pku', membershipType: 'LEAD', enabled: true }),
    ]);
    expect(store.getState().users.find((user) => user.username === 'pku')?.topicIds).toContain(topicId);
  });

  it('变更牵头单位时同步账号课题范围和负责人联系信息', () => {
    const store = createAppStore();
    const assistant = store.getState().users.find((user) => user.role === '科研助理')!;
    const pku = store.getState().users.find((user) => user.username === 'pku')!;

    store.getState().updateTopic('t1', {
      leadingUnitId: pku.unitId,
      principalName: pku.name,
      contactName: pku.name,
      contactPhone: pku.phone,
      contactEmail: pku.email,
    }, assistant.id);

    expect(store.getState().topicMemberships.find((item) => item.topicId === 't1' && item.membershipType === 'LEAD'))
      .toEqual(expect.objectContaining({ unitId: 'u-pku', principalName: '王五', contactPhone: pku.phone }));
    expect(store.getState().users.find((user) => user.username === 'tsinghua')?.topicIds).not.toContain('t1');
    expect(store.getState().users.find((user) => user.username === 'pku')?.topicIds).toContain('t1');
  });
});
