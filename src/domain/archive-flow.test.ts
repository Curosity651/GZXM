import { describe, expect, it } from 'vitest';
import { createTemplateSnapshot, nextArchiveStatus, validateApplicability } from './archive-flow';
import { createAppStore } from '../store';
import type { ArchiveRequirement } from '../types';

describe('归档业务流程', () => {
  it('项目公共材料由科研助理提交后直接进入终审', () => {
    expect(nextArchiveStatus('PROJECT_PUBLIC', '草稿', 'SUBMIT')).toBe('终审中');
  });

  it('课题国家和自筹材料不经过审批直接归档', () => {
    expect(nextArchiveStatus('TOPIC_NATIONAL', '草稿', 'SUBMIT')).toBe('已归档');
    expect(nextArchiveStatus('SELF_FUNDED', '草稿', 'SUBMIT')).toBe('已归档');
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

  it('课题材料的旧提交入口保持直接归档', () => {
    const store = createAppStore();
    store.getState().saveArchiveSubmission({ id: 'as-new', requirementId: 'ar-topic-4', ownerType: 'TOPIC_NATIONAL', ownerId: 't1:u-tsinghua', topicId: 't1', unitId: 'u-tsinghua', applicability: 'APPLICABLE', status: '草稿', fileIds: ['file-1'], version: 1, updatedAt: '2026-09-09' }, 'user-tsinghua');
    store.getState().submitArchive('as-new', 'user-tsinghua');
    expect(store.getState().archiveSubmissions.find((item) => item.id === 'as-new')?.status).toBe('已归档');
  });
});
