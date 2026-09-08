import type { User, UserRole } from '../types';

export type PageKey =
  | 'home' | 'topic-indicator' | 'indicator-monitoring' | 'warning-rules'
  | 'achievement-entry' | 'achievement-review' | 'achievement-query'
  | 'report-management' | 'report-review' | 'progress-overview'
  | 'project-public-archive' | 'topic-archive' | 'self-funded-archive'
  | 'archive-review' | 'archive-monitoring'
  | 'user-management' | 'role-permission' | 'dictionary' | 'system-config';

export type ActionKey =
  | 'topic.manage' | 'indicator.manage' | 'warning.manage'
  | 'achievement.submit' | 'achievement.initial.approve' | 'achievement.final.approve'
  | 'report.submit' | 'report.initial.approve' | 'report.final.approve'
  | 'archive.public.submit' | 'archive.topic.submit' | 'archive.initial.approve' | 'archive.final.approve'
  | 'self-funded.manage' | 'system.manage';

const targetRoles: UserRole[] = ['系统管理员', '项目技术负责人', '科研助理', '课题牵头单位'];

const pagePermissions: Record<Exclude<UserRole, '项目管理人员' | '课题用户' | '成果审批人员'>, PageKey[] | 'ALL'> = {
  系统管理员: 'ALL',
  项目技术负责人: [
    'home', 'topic-indicator', 'indicator-monitoring', 'achievement-review', 'achievement-query',
    'report-review', 'progress-overview', 'project-public-archive', 'topic-archive', 'self-funded-archive',
    'archive-review', 'archive-monitoring',
  ],
  科研助理: [
    'home', 'topic-indicator', 'indicator-monitoring', 'warning-rules', 'achievement-review', 'achievement-query',
    'report-review', 'progress-overview', 'project-public-archive', 'topic-archive', 'self-funded-archive',
    'archive-review', 'archive-monitoring',
  ],
  课题牵头单位: [
    'home', 'topic-indicator', 'indicator-monitoring', 'achievement-entry', 'achievement-query',
    'report-management', 'progress-overview', 'topic-archive', 'self-funded-archive', 'archive-monitoring',
  ],
};

const actionPermissions: Record<ActionKey, UserRole[]> = {
  'topic.manage': ['科研助理'],
  'indicator.manage': ['科研助理'],
  'warning.manage': ['科研助理'],
  'achievement.submit': ['课题牵头单位'],
  'achievement.initial.approve': ['科研助理'],
  'achievement.final.approve': ['项目技术负责人'],
  'report.submit': ['课题牵头单位'],
  'report.initial.approve': ['科研助理'],
  'report.final.approve': ['项目技术负责人'],
  'archive.public.submit': ['科研助理'],
  'archive.topic.submit': ['课题牵头单位'],
  'archive.initial.approve': ['科研助理'],
  'archive.final.approve': ['项目技术负责人'],
  'self-funded.manage': ['课题牵头单位'],
  'system.manage': ['系统管理员'],
};

export function canViewPage(role: UserRole, page: PageKey): boolean {
  if (!targetRoles.includes(role)) return false;
  const allowed = pagePermissions[role as keyof typeof pagePermissions];
  return allowed === 'ALL' || allowed.includes(page);
}

export function canPerform(role: UserRole, action: ActionKey): boolean {
  return actionPermissions[action].includes(role);
}

export function filterByTopicScope<T extends { topicId?: string }>(user: User, records: T[]): T[] {
  if (user.role !== '课题牵头单位') return records;
  if (!user.topicId) return [];
  return records.filter((record) => record.topicId === user.topicId);
}
