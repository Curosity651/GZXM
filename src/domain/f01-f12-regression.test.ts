import { describe, expect, it } from 'vitest';
import type { Achievement, IndicatorDefinition, ProgressReport, ReportTask, TimeNode, Topic, TopicIndicator, UnitIndicatorAllocation } from '../types';
import { createAppStore, createInitialState, migratePersistedState } from '../store';
import { achievementMatchesIndicator, reviewActionFor } from './achievement';
import { effectiveCount, indicatorTargetDraftKey, validateTopicIndicators } from './indicator-allocation';
import { buildTopicSummariesV2 } from './monitoring';
import { canPerform, canViewPage } from './permissions';
import { topicArchiveRequirements } from './archive';
import { canViewAchievement, isTopicLead } from './topic-access';

describe('F01-F12 专项回归', () => {
  it('F01 只有具备分配权限且属于当前课题牵头单位的账号可以分配指标', () => {
    const state = createInitialState();
    const lead = state.users.find((item) => item.username === 'tsinghua')!;
    const participant = state.users.find((item) => item.username === 'pku')!;
    expect(canPerform(lead, state.roles, 'unit-allocation.manage') && isTopicLead(lead, 't1', state.topicMemberships)).toBe(true);
    expect(canPerform(participant, state.roles, 'unit-allocation.manage') && isTopicLead(participant, 't1', state.topicMemberships)).toBe(false);
  });

  it('F02 指标草稿按考核节点和指标双维度隔离', () => {
    expect(indicatorTargetDraftKey('node-1', 'paper')).not.toBe(indicatorTargetDraftKey('node-2', 'paper'));
    expect(indicatorTargetDraftKey('node-1', 'paper')).not.toBe(indicatorTargetDraftKey('node-1', 'patent'));
  });

  it('F03 专项指标只统计真正满足专项条件的成果', () => {
    const ordinary = { id: 'ordinary', topicId: 't1', unitId: 'u1', uploadUnitId: 'u1', nodeId: 'node-1', achievementType: '学术论文', status: '已生效', isChineseCoreJournal: false } as Achievement;
    const core = { ...ordinary, id: 'core', isChineseCoreJournal: true } as Achievement;
    const allocation = { topicId: 't1', unitId: 'u1', nodeId: 'node-1', indicatorDefinitionId: 'indicator-chinese-core-journal', achievementType: '学术论文' } as UnitIndicatorAllocation;
    expect(achievementMatchesIndicator(ordinary, allocation.indicatorDefinitionId, allocation.achievementType)).toBe(false);
    expect(effectiveCount(allocation, [ordinary, core], [{ id: 'node-1', sortOrder: 1 } as TimeNode])).toBe(1);
  });

  it('F04 未到开放日期的月季报不能提交', () => {
    const store = createAppStore();
    const task: ReportTask = { id: 'future-task', topicId: 't1', reportType: 'MONTHLY', year: 2099, period: 1, openDate: '2099-01-01', deadline: '2099-01-31' };
    const report: ProgressReport = { id: 'future-report', taskId: task.id, topicId: 't1', reportType: 'MONTHLY', milestoneProgress: '', overallProgress: '', demonstrationProgress: '', fundUsage: '', nextPlan: '', problemsAndMeasures: '', status: '草稿', overdue: false, recordVersion: 1, submittedVersion: 0, updatedAt: '2026-09-14' };
    store.setState((state) => ({ reportTasks: [...state.reportTasks, task], reports: [...state.reports, report] }));
    expect(() => store.getState().submitReport(report.id, 'user-tsinghua')).toThrow('开放提交');
  });

  it('F05 不自动生成空白报告，迁移时移除没有报告的孤立任务', () => {
    const state = createInitialState();
    state.reportTasks.push({ id: 'orphan', topicId: 't1', reportType: 'MONTHLY', year: 2026, period: 8, openDate: '2026-08-01', deadline: '2026-08-30' });
    const migrated = migratePersistedState(state);
    expect(migrated.reportTasks.some((item) => item.id === 'orphan')).toBe(false);
  });

  it('F06 单位自定义归档文件夹具有独立单位归属且不能被其他单位删除', () => {
    const store = createAppStore();
    const folder = { id: 'private-folder', projectId: 'p1', categoryId: 'ac-1', topicId: 't1', unitId: 'u-tsinghua', name: '清华自定义材料', required: true, requiredQuantity: 1, ownerType: 'TOPIC_NATIONAL' as const, requirementKind: 'REQUIRED' as const };
    store.getState().addArchiveRequirement(folder, 'user-tsinghua');
    expect(topicArchiveRequirements(store.getState().archiveRequirements, 't1', 'u-tsinghua')).toContainEqual(expect.objectContaining({ id: folder.id }));
    expect(topicArchiveRequirements(store.getState().archiveRequirements, 't1', 'u-pku')).not.toContainEqual(expect.objectContaining({ id: folder.id }));
    expect(() => store.getState().removeArchiveRequirement(folder.id, 'user-pku')).toThrow('没有删除');
  });

  it('F07 国家材料要求严格按课题过滤，不会串入其他课题', () => {
    const state = createInitialState();
    const scoped = { id: 'topic-one-only', projectId: 'p1', categoryId: 'ac-1', topicId: 't1', unitId: 'u-tsinghua', name: '课题一私有项', required: true, requiredQuantity: 1, ownerType: 'TOPIC_NATIONAL' as const, requirementKind: 'REQUIRED' as const };
    const requirements = [...state.archiveRequirements, scoped];
    expect(topicArchiveRequirements(requirements, 't1', 'u-tsinghua').some((item) => item.id === scoped.id)).toBe(true);
    expect(topicArchiveRequirements(requirements, 't2', 'u-tsinghua').some((item) => item.id === scoped.id)).toBe(false);
  });

  it('F08 累计目标不能倒退且专项指标不重复计入总目标', () => {
    const nodes = [{ id: 'n1', sortOrder: 1 }, { id: 'n2', sortOrder: 2 }] as TimeNode[];
    const definitions = [
      { id: 'paper', name: '学术论文', achievementType: '学术论文', enabled: true },
      { id: 'core', name: '中文核心期刊的数量', achievementType: '学术论文', enabled: true },
    ] as IndicatorDefinition[];
    const decreasing = [
      { id: 'i1', topicId: 't1', nodeId: 'n1', indicatorDefinitionId: 'paper', achievementType: '学术论文', targetQuantity: 5 },
      { id: 'i2', topicId: 't1', nodeId: 'n2', indicatorDefinitionId: 'paper', achievementType: '学术论文', targetQuantity: 2 },
    ] as TopicIndicator[];
    expect(validateTopicIndicators(decreasing, [], nodes, definitions).map((item) => item.message)).toContain('累计目标不能低于上一考核节点');
    const indicators = [
      { ...decreasing[1], targetQuantity: 5, status: '已下发' },
      { id: 'special', topicId: 't1', nodeId: 'n2', indicatorDefinitionId: 'core', achievementType: '学术论文', targetQuantity: 2, status: '已下发' },
    ] as TopicIndicator[];
    const achievement = { id: 'a1', topicId: 't1', unitId: 'u1', uploadUnitId: 'u1', nodeId: 'n1', indicatorDefinitionId: 'paper', achievementType: '学术论文', status: '已生效', isChineseCoreJournal: true } as Achievement;
    const summary = buildTopicSummariesV2([{ id: 't1', code: 'K1', name: '课题一' } as Topic], [], indicators, [achievement], { role: '系统管理员', enabled: true } as never, nodes, definitions)[0];
    expect(summary).toEqual(expect.objectContaining({ planned: 5, completed: 1 }));
  });

  it('F09 停用账号立即清除现有会话并拒绝动作权限', () => {
    const store = createAppStore();
    const user = store.getState().users.find((item) => item.username === 'tsinghua')!;
    store.setState({ currentUser: user });
    store.getState().toggleUserEnabled(user.id, false);
    const disabled = store.getState().users.find((item) => item.id === user.id)!;
    expect(store.getState().currentUser).toBeNull();
    expect(canPerform(disabled, store.getState().roles, 'achievement.submit')).toBe(false);
  });

  it('F10 页面和成果审批均以动态 RBAC 权限点为准', () => {
    const state = createInitialState();
    const assistant = state.users.find((item) => item.username === 'assistant')!;
    const roles = state.roles.map((role) => role.id === assistant.roleId ? { ...role, pagePermissions: role.pagePermissions.filter((item) => item !== 'achievement-entry') } : role);
    expect(canViewPage(assistant, roles, 'achievement-entry')).toBe(false);
    expect(reviewActionFor('预审初审中', { canInitial: true, canFinal: false })).toBe('APPROVE_INITIAL');
    expect(reviewActionFor('预审初审中', { canInitial: false, canFinal: false })).toBeNull();
  });

  it('F11 停用课题禁止业务修改，停用成员失去课题成果访问权', () => {
    const store = createAppStore();
    const assistant = store.getState().users.find((item) => item.username === 'assistant')!;
    store.getState().toggleTopicEnabled('t1', false, assistant.id);
    expect(() => store.getState().updateAchievement('ach-pre-review', { remarks: '不应保存' }, 'user-tsinghua')).toThrow('没有修改');
    const memberId = store.getState().topicMemberships.find((item) => item.topicId === 't2' && item.unitId === 'u-tsinghua')!.id;
    store.setState((state) => ({ topicMemberships: state.topicMemberships.map((item) => item.id === memberId ? { ...item, enabled: false } : item) }));
    const achievement = { topicId: 't2', unitId: 'u-tsinghua', uploadUnitId: 'u-tsinghua' } as Achievement;
    expect(canViewAchievement(store.getState().users.find((item) => item.id === 'user-tsinghua')!, achievement, store.getState().topicMemberships)).toBe(false);
  });

  it('F12 成果和月季报重提均递增提交版本、保存快照并让审批引用该版本', () => {
    const store = createAppStore();
    store.getState().reviewAchievement('ach-pre-review', 'RETURN', 'user-assistant', '修改后重提');
    store.getState().advanceAchievement('ach-pre-review', 'SUBMIT_PRE_REVIEW', 'user-tsinghua');
    store.getState().reviewAchievement('ach-pre-review', 'APPROVE_INITIAL', 'user-assistant', '通过');
    expect(store.getState().achievements.find((item) => item.id === 'ach-pre-review')?.submittedVersion).toBe(2);
    expect(store.getState().submissionSnapshots).toContainEqual(expect.objectContaining({ businessId: 'ach-pre-review', submittedVersion: 2 }));
    expect(store.getState().approvalRecords.at(-1)).toEqual(expect.objectContaining({ businessId: 'ach-pre-review', submittedVersion: 2 }));

    store.getState().reviewReport('report-t1-sep', 'RETURN', 'user-assistant', '补充内容');
    const returned = store.getState().reports.find((item) => item.id === 'report-t1-sep')!;
    store.getState().saveReport({ ...returned, overallProgress: '已补充' }, 'user-tsinghua');
    store.getState().submitReport(returned.id, 'user-tsinghua');
    store.getState().reviewReport(returned.id, 'APPROVE_INITIAL', 'user-assistant', '通过');
    expect(store.getState().reports.find((item) => item.id === returned.id)?.submittedVersion).toBe(2);
    expect(store.getState().submissionSnapshots).toContainEqual(expect.objectContaining({ businessId: returned.id, submittedVersion: 2 }));
    expect(store.getState().approvalRecords.at(-1)).toEqual(expect.objectContaining({ businessId: returned.id, submittedVersion: 2 }));
  });
});
