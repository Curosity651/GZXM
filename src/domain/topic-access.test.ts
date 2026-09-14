import { describe, expect, it } from 'vitest';
import type { Achievement, TopicUnitMembership, User } from '../types';
import { canViewAchievement } from './topic-access';

const memberships = [
  { id: 'lead-a', topicId: 't1', unitId: 'unit-a', membershipType: 'LEAD', enabled: true },
  { id: 'participant-b', topicId: 't1', unitId: 'unit-b', membershipType: 'PARTICIPANT', enabled: true },
  { id: 'participant-a', topicId: 't2', unitId: 'unit-a', membershipType: 'PARTICIPANT', enabled: true },
] as TopicUnitMembership[];

const achievement = { topicId: 't1', unitId: 'unit-b', uploadUnitId: 'unit-b' } as Achievement;
const user = (role: User['role'], unitId?: string) => ({ role, unitId } as User);

describe('成果进度与成果记录可见范围', () => {
  it('科研助理和项目技术负责人可查看全部单位', () => {
    expect(canViewAchievement(user('科研助理'), achievement, memberships)).toBe(true);
    expect(canViewAchievement(user('项目技术负责人'), achievement, memberships)).toBe(true);
  });

  it('牵头单位可查看所牵头课题的下属单位成果', () => {
    expect(canViewAchievement(user('外部课题单位', 'unit-a'), achievement, memberships)).toBe(true);
  });

  it('承担单位只查看自己单位的成果，系统管理员只读查看全部成果', () => {
    expect(canViewAchievement(user('外部课题单位', 'unit-b'), achievement, memberships)).toBe(true);
    expect(canViewAchievement(user('外部课题单位', 'unit-c'), achievement, memberships)).toBe(false);
    expect(canViewAchievement(user('系统管理员', 'unit-a'), achievement, memberships)).toBe(true);
  });
});
