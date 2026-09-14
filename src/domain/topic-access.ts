import type { Achievement, Topic, TopicUnitMembership, User } from '../types';

export const isGlobalUser = (user: User) => ['系统管理员', '项目技术负责人', '科研助理'].includes(user.role);
export const isTopicUnitUser = (user: User) => ['内部课题单位', '外部课题单位'].includes(user.role);
export const isInternalTopicUnit = (user: User) => user.role === '内部课题单位';
export const isTopicOperational = (topic: Topic | undefined) => Boolean(topic && topic.enabled !== false && topic.status !== '已暂停' && topic.status !== '已结题');

export function membershipsForUser(user: User, memberships: TopicUnitMembership[]): TopicUnitMembership[] {
  if (!user.unitId) return [];
  return memberships.filter((item) => item.unitId === user.unitId && item.enabled);
}

export function accessibleTopics(user: User, topics: Topic[], memberships: TopicUnitMembership[]): Topic[] {
  if (isGlobalUser(user)) return topics;
  const topicIds = new Set(membershipsForUser(user, memberships).map((item) => item.topicId));
  return topics.filter((topic) => topicIds.has(topic.id));
}

export function membershipForUser(user: User, topicId: string, memberships: TopicUnitMembership[]) {
  return membershipsForUser(user, memberships).find((item) => item.topicId === topicId);
}

export function canAccessTopicByMembership(user: User, topicId: string | undefined, memberships: TopicUnitMembership[]): boolean {
  if (!topicId) return isGlobalUser(user);
  return isGlobalUser(user) || Boolean(membershipForUser(user, topicId, memberships));
}

export function canViewAllTopicUnitData(user: User, topicId: string, memberships: TopicUnitMembership[]): boolean {
  return isGlobalUser(user) || isTopicLead(user, topicId, memberships);
}

export function isTopicLead(user: User, topicId: string, memberships: TopicUnitMembership[]): boolean {
  return membershipForUser(user, topicId, memberships)?.membershipType === 'LEAD';
}

export function canManageTopicUnits(user: User, topicId: string, memberships: TopicUnitMembership[]): boolean {
  return isTopicLead(user, topicId, memberships);
}

export function canViewAchievement(user: User, achievement: Achievement, memberships: TopicUnitMembership[]): boolean {
  if (isGlobalUser(user)) return true;
  if (!user.unitId) return false;
  if (!membershipForUser(user, achievement.topicId, memberships)) return false;
  if (isTopicLead(user, achievement.topicId, memberships)) return true;
  return achievement.uploadUnitId === user.unitId || achievement.unitId === user.unitId;
}
