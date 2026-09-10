import type { User, UserRole } from '../types';

export function normalizeTopicBinding(role: UserRole, topicId?: string): string | undefined {
  void role; void topicId;
  return undefined;
}

export function validateTopicAccountUniqueness(users: User[], topicId?: string, editingUserId?: string): string | null {
  if (!topicId) return '课题单位账号必须关联所属单位';
  const duplicate = users.some((user) => user.id !== editingUserId && user.enabled && (user.role === '内部课题单位' || user.role === '外部课题单位') && user.unitId === topicId);
  return duplicate ? '该单位已经存在课题单位账号' : null;
}
