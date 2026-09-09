import type { ActionPermissionKey, PagePermissionKey, RbacRole, User, UserRole } from '../types';

export type PageKey = PagePermissionKey;
export type ActionKey = ActionPermissionKey;

export const PAGE_PERMISSION_OPTIONS: { value: PageKey; label: string; group: string }[] = [
  { value: 'home', label: '工作台', group: '工作台' },
  { value: 'topic-indicator', label: '科研指标配置', group: '科研指标' },
  { value: 'indicator-monitoring', label: '指标完成监控', group: '科研指标' },
  { value: 'warning-rules', label: '规则预警', group: '科研指标' },
  { value: 'achievement-entry', label: '成果填报', group: '成果管理' },
  { value: 'achievement-review', label: '成果审批', group: '成果管理' },
  { value: 'achievement-query', label: '成果查询', group: '成果管理' },
  { value: 'report-management', label: '月季报填报', group: '进度管理' },
  { value: 'report-review', label: '月季报审批', group: '进度管理' },
  { value: 'progress-overview', label: '月季报进度', group: '进度管理' },
  { value: 'project-public-archive', label: '项目公共材料', group: '归档管理' },
  { value: 'topic-archive', label: '课题国家材料', group: '归档管理' },
  { value: 'self-funded-archive', label: '配套自筹项目材料', group: '归档管理' },
  { value: 'archive-review', label: '归档材料审批', group: '归档管理' },
  { value: 'archive-monitoring', label: '归档完成监控', group: '归档管理' },
  { value: 'user-management', label: '用户管理', group: '系统管理' },
  { value: 'role-permission', label: '角色权限管理', group: '系统管理' },
  { value: 'dictionary', label: '字典管理', group: '系统管理' },
  { value: 'system-config', label: '系统配置', group: '系统管理' },
];

export const ACTION_PERMISSION_OPTIONS: { value: ActionKey; label: string; group: string }[] = [
  { value: 'topic.manage', label: '维护课题', group: '科研指标' },
  { value: 'indicator.manage', label: '维护指标', group: '科研指标' },
  { value: 'indicator.catalog.manage', label: '维护指标目录', group: '科研指标' },
  { value: 'topic-indicator.publish', label: '下发课题指标', group: '科研指标' },
  { value: 'topic-unit.manage', label: '维护课题承担单位', group: '科研指标' },
  { value: 'unit-allocation.manage', label: '维护单位指标', group: '科研指标' },
  { value: 'unit-allocation.publish', label: '下发单位指标', group: '科研指标' },
  { value: 'warning.manage', label: '维护预警规则', group: '科研指标' },
  { value: 'achievement.submit', label: '提交成果', group: '成果管理' },
  { value: 'achievement.initial.approve', label: '成果初审', group: '成果管理' },
  { value: 'achievement.final.approve', label: '成果终审', group: '成果管理' },
  { value: 'report.submit', label: '提交月季报', group: '进度管理' },
  { value: 'report.initial.approve', label: '月季报初审', group: '进度管理' },
  { value: 'report.final.approve', label: '月季报终审', group: '进度管理' },
  { value: 'report.rule.manage', label: '配置月季报规则', group: '进度管理' },
  { value: 'archive.public.submit', label: '提交项目公共材料', group: '归档管理' },
  { value: 'archive.topic.submit', label: '提交课题归档材料', group: '归档管理' },
  { value: 'archive.initial.approve', label: '归档材料初审', group: '归档管理' },
  { value: 'archive.final.approve', label: '归档材料终审', group: '归档管理' },
  { value: 'self-funded.manage', label: '维护配套自筹项目', group: '归档管理' },
  { value: 'system.manage', label: '系统管理', group: '系统管理' },
];

export const ALL_PAGE_PERMISSIONS = PAGE_PERMISSION_OPTIONS.map((item) => item.value);
export const ALL_ACTION_PERMISSIONS = ACTION_PERMISSION_OPTIONS.map((item) => item.value);

const pagePermissions: Record<UserRole, PageKey[] | 'ALL'> = {
  系统管理员: 'ALL',
  项目技术负责人: [
    'home', 'topic-indicator', 'indicator-monitoring', 'achievement-entry', 'achievement-review', 'achievement-query',
    'report-review', 'progress-overview', 'project-public-archive', 'topic-archive', 'self-funded-archive',
    'archive-review', 'archive-monitoring',
  ],
  科研助理: [
    'home', 'topic-indicator', 'indicator-monitoring', 'warning-rules', 'achievement-entry', 'achievement-review', 'achievement-query',
    'report-review', 'progress-overview', 'project-public-archive', 'topic-archive', 'self-funded-archive',
    'archive-review', 'archive-monitoring',
  ],
  课题牵头单位: [
    'home', 'topic-indicator', 'indicator-monitoring', 'achievement-entry', 'achievement-query',
    'report-management', 'progress-overview', 'topic-archive', 'self-funded-archive', 'archive-monitoring',
  ],
  课题承担单位: ['home', 'indicator-monitoring', 'achievement-entry', 'achievement-query', 'topic-archive', 'archive-monitoring'],
};

const actionPermissions: Record<ActionKey, UserRole[]> = {
  'topic.manage': ['科研助理'],
  'indicator.manage': ['科研助理'],
  'indicator.catalog.manage': ['科研助理'],
  'topic-indicator.publish': ['科研助理'],
  'topic-unit.manage': ['课题牵头单位'],
  'unit-allocation.manage': ['课题牵头单位'],
  'unit-allocation.publish': ['课题牵头单位'],
  'warning.manage': ['科研助理'],
  'achievement.submit': ['课题牵头单位', '课题承担单位'],
  'achievement.initial.approve': ['科研助理'],
  'achievement.final.approve': ['项目技术负责人'],
  'report.submit': ['课题牵头单位', '课题承担单位'],
  'report.initial.approve': ['科研助理'],
  'report.final.approve': ['项目技术负责人'],
  'report.rule.manage': ['科研助理'],
  'archive.public.submit': ['科研助理'],
  'archive.topic.submit': ['课题牵头单位', '课题承担单位'],
  'archive.initial.approve': ['科研助理'],
  'archive.final.approve': ['项目技术负责人'],
  'self-funded.manage': ['课题牵头单位'],
  'system.manage': ['系统管理员'],
};

export function getRole(user: User | null | undefined, roles: RbacRole[]): RbacRole | undefined {
  if (!user) return undefined;
  return roles.find((role) => role.id === user.roleId)
    ?? roles.find((role) => role.name === user.role);
}

export function canViewPage(user: User, roles: RbacRole[], page: PageKey): boolean;
export function canViewPage(role: UserRole, page: PageKey): boolean;
export function canViewPage(userOrRole: User | UserRole, rolesOrPage: RbacRole[] | PageKey, pageArg?: PageKey): boolean {
  if (typeof userOrRole === 'string') {
    const allowed = pagePermissions[userOrRole];
    return allowed === 'ALL' || Boolean(allowed?.includes(rolesOrPage as PageKey));
  }
  const role = getRole(userOrRole, rolesOrPage as RbacRole[]);
  return Boolean(role?.enabled && (role.builtIn || role.pagePermissions.includes(pageArg!)));
}

export function canPerform(user: User, roles: RbacRole[], action: ActionKey): boolean;
export function canPerform(role: UserRole, action: ActionKey): boolean;
export function canPerform(userOrRole: User | UserRole, rolesOrAction: RbacRole[] | ActionKey, actionArg?: ActionKey): boolean {
  if (typeof userOrRole === 'string') return actionPermissions[rolesOrAction as ActionKey]?.includes(userOrRole) ?? false;
  const role = getRole(userOrRole, rolesOrAction as RbacRole[]);
  return Boolean(role?.enabled && role.actionPermissions.includes(actionArg!));
}

export function canAccessTopic(user: User, topicId?: string): boolean {
  if (!topicId) return user.dataScope !== 'TOPICS';
  const scope = user.dataScope ?? (user.role === '课题牵头单位' || user.role === '课题承担单位' ? 'TOPICS' : 'ALL');
  const topicIds = user.topicIds?.length ? user.topicIds : user.topicId ? [user.topicId] : [];
  return scope === 'ALL' || topicIds.includes(topicId);
}

export function filterByTopicScope<T extends object>(user: User, records: T[]): T[] {
  return records.filter((record) => {
    const scoped = record as { id?: string; topicId?: string; leadingUnitId?: string };
    const topicId = scoped.topicId ?? (scoped.leadingUnitId ? scoped.id : undefined);
    return canAccessTopic(user, topicId);
  });
}
