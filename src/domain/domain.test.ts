import { describe, expect, it } from 'vitest';
import { canPerform, canViewPage, filterByTopicScope } from './permissions';
import { nextAchievementStatus } from './workflows';
import { reportDeadline } from './reporting';
import { archiveCompletion } from './archive';
import type { ArchiveRequirement, ArchiveSubmission, User } from '../types';

describe('角色权限与课题数据范围', () => {
  it('系统管理员可以查看业务页面但默认不能执行业务审批', () => {
    expect(canViewPage('系统管理员', 'achievement-entry')).toBe(true);
    expect(canPerform('系统管理员', 'achievement.final.approve')).toBe(false);
  });

  it('课题牵头单位只能取得绑定课题的数据', () => {
    const user = {
      id: 'topic-user', username: 'topic01', password: 'topic123', name: '课题一账号',
      role: '外部课题单位', topicId: 't1', enabled: true, createdAt: '2026-01-01',
    } as User;
    const records = [{ id: 'a', topicId: 't1' }, { id: 'b', topicId: 't2' }];

    expect(filterByTopicScope(user, records)).toEqual([{ id: 'a', topicId: 't1' }]);
  });
});

describe('成果审批状态机', () => {
  it('正式终审通过后成果生效', () => {
    expect(nextAchievementStatus('正式终审中', 'APPROVE_FINAL')).toBe('已生效');
  });

  it('不允许跳过初审直接执行终审', () => {
    expect(() => nextAchievementStatus('预审初审中', 'APPROVE_FINAL')).toThrow('非法的成果状态流转');
  });
});

describe('报告截止日期', () => {
  it('二月不存在三十日时使用月末', () => {
    expect(reportDeadline('MONTHLY', 2027, 2)).toBe('2027-02-28');
  });

  it('季报使用确认的季度截止日期', () => {
    expect(reportDeadline('QUARTERLY', 2027, 3)).toBe('2027-09-10');
  });
});

describe('归档完成率', () => {
  it('只统计必存和已确认适用的条件项，且仅终审通过算完成', () => {
    const requirements = [
      { id: 'required', requirementKind: 'REQUIRED' },
      { id: 'conditional-yes', requirementKind: 'CONDITIONAL' },
      { id: 'conditional-no', requirementKind: 'CONDITIONAL' },
    ] as ArchiveRequirement[];
    const submissions = [
      { requirementId: 'required', applicability: 'APPLICABLE', status: '已通过' },
      { requirementId: 'conditional-yes', applicability: 'APPLICABLE', status: '初审中' },
      { requirementId: 'conditional-no', applicability: 'NOT_APPLICABLE', status: '未提交', nonApplicableReason: '本项目不涉及' },
    ] as ArchiveSubmission[];

    expect(archiveCompletion(requirements, submissions)).toEqual({ required: 2, completed: 1, rate: 50 });
  });
});
