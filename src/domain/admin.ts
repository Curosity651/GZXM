import type { User, UserRole } from '../types';

export function normalizeTopicBinding(role: UserRole, topicId?: string): string | undefined {
  return role === '课题牵头单位' ? topicId : undefined;
}

export function validateTopicAccountUniqueness(users: User[], topicId?: string, editingUserId?: string): string | null {
  if (!topicId) return '课题牵头单位账号必须绑定一个课题';
  const duplicate = users.some((user) => user.id !== editingUserId && user.enabled && user.role === '课题牵头单位' && user.topicId === topicId);
  return duplicate ? '该课题已经绑定业务账号' : null;
}
