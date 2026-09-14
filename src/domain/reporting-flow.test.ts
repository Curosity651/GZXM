import { describe, expect, it } from 'vitest';
import { isReportEditable, nextReportStatus, reportCountsToProgress, reportTaskKey } from './report-flow';
import { createAppStore } from '../store';

describe('报告状态规则', () => {
  it('退回报告允许课题牵头单位修改并重提初审', () => {
    expect(isReportEditable('退回修改')).toBe(true);
    expect(nextReportStatus('退回修改', 'SUBMIT')).toBe('初审中');
  });

  it('只有终审通过报告计入进度', () => {
    expect(reportCountsToProgress('终审中')).toBe(false);
    expect(reportCountsToProgress('已通过')).toBe(true);
  });

  it('同课题同类型同周期生成稳定唯一键', () => {
    expect(reportTaskKey('t1', 'QUARTERLY', 2026, 3)).toBe('t1-QUARTERLY-2026-3');
  });
});

describe('报告两级审批', () => {
  it('课题牵头单位可以保存并提交本课题报告', () => {
    const store = createAppStore();
    store.getState().saveReportTask({
      id: 'report-task-q-t1', topicId: 't1', reportType: 'QUARTERLY', year: 2026, period: 3,
      openDate: '2026-09-01', deadline: '2026-09-10',
    }, 'user-tsinghua');
    store.getState().saveReport({
      id: 'report-new', taskId: 'report-task-q-t1', topicId: 't1', reportType: 'QUARTERLY',
      milestoneProgress: '完成里程碑', overallProgress: '总体正常', demonstrationProgress: '完成调研',
      fundUsage: '按计划执行', nextPlan: '继续联调', problemsAndMeasures: '无', status: '草稿',
      overdue: false, version: 1, updatedAt: '2026-09-09',
    }, 'user-tsinghua');
    store.getState().submitReport('report-new', 'user-tsinghua');
    expect(store.getState().reports.find((item) => item.id === 'report-new')?.status).toBe('初审中');
  });

  it('科研助理初审后进入终审，技术负责人终审后通过', () => {
    const store = createAppStore();
    store.getState().reviewReport('report-t1-sep', 'APPROVE_INITIAL', 'user-assistant', '内容完整');
    expect(store.getState().reports.find((item) => item.id === 'report-t1-sep')?.status).toBe('终审中');
    store.getState().reviewReport('report-t1-sep', 'APPROVE_FINAL', 'user-leader', '同意');
    expect(store.getState().reports.find((item) => item.id === 'report-t1-sep')?.status).toBe('已通过');
  });
});
