import { describe, expect, it } from 'vitest';
import { createTemplateSnapshot, nextArchiveStatus, validateApplicability } from './archive-flow';
import { createAppStore } from '../store';
import type { ArchiveRequirement } from '../types';

describe('归档业务流程', () => {
  it('项目公共材料由科研助理提交后直接进入终审', () => {
    expect(nextArchiveStatus('PROJECT_PUBLIC', '草稿', 'SUBMIT')).toBe('终审中');
  });

  it('课题国家和自筹材料提交后先进入科研助理初审', () => {
    expect(nextArchiveStatus('TOPIC_NATIONAL', '草稿', 'SUBMIT')).toBe('初审中');
    expect(nextArchiveStatus('SELF_FUNDED', '草稿', 'SUBMIT')).toBe('初审中');
  });

  it('条件材料选择不适用时必须填写理由', () => {
    expect(validateApplicability('NOT_APPLICABLE', '')).toBe(false);
    expect(validateApplicability('NOT_APPLICABLE', '本项目不涉及设备采购')).toBe(true);
  });

  it('项目清单快照不受源模板后续修改影响', () => {
    const source = [{ id: 'r1', name: '立项文件' }] as ArchiveRequirement[];
    const snapshot = createTemplateSnapshot(source);
    source[0].name = '已修改名称';
    expect(snapshot[0].name).toBe('立项文件');
  });
});

describe('归档 Store 流程', () => {
  it('课题账号可以在本课题下新建配套自筹项目', () => {
    const store = createAppStore();
    store.getState().addSelfFundedProject({ id: 'sf-new', topicId: 't3', ownerUnitId: 'u-sgcc', code: 'ZC-KJ-009', name: '配套验证项目', projectType: '科技项目', principalName: '李工', implementingUnit: '国家电网公司', status: '筹备中', templateSnapshotId: 'tpl-tech-v1' }, 'user-gxgrid');
    expect(store.getState().selfFundedProjects.some((item) => item.id === 'sf-new')).toBe(true);
  });

  it('课题材料完成两级审批后变为已通过', () => {
    const store = createAppStore();
    store.getState().saveArchiveSubmission({ id: 'as-new', requirementId: 'ar-topic-4', ownerType: 'TOPIC_NATIONAL', ownerId: 't1:u-tsinghua', topicId: 't1', unitId: 'u-tsinghua', applicability: 'APPLICABLE', status: '草稿', fileIds: ['file-1'], version: 1, updatedAt: '2026-09-09' }, 'user-tsinghua');
    store.getState().submitArchive('as-new', 'user-tsinghua');
    expect(store.getState().archiveSubmissions.find((item) => item.id === 'as-new')?.status).toBe('初审中');
    store.getState().reviewArchive('as-new', 'APPROVE_INITIAL', 'user-assistant', '材料完整');
    store.getState().reviewArchive('as-new', 'APPROVE_FINAL', 'user-leader', '同意归档');
    expect(store.getState().archiveSubmissions.find((item) => item.id === 'as-new')?.status).toBe('已通过');
  });
});
