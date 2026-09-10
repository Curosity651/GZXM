import { describe, expect, it } from 'vitest';
import { normalizeTopicBinding, validateTopicAccountUniqueness } from './admin';
import { createAppStore } from '../store';

describe('账号课题绑定', () => {
  it('课题牵头单位必须保留课题绑定，其他角色清除课题绑定', () => {
    expect(normalizeTopicBinding('外部课题单位', 't1')).toBeUndefined();
    expect(normalizeTopicBinding('科研助理', 't1')).toBeUndefined();
  });

  it('同一课题不能重复创建有效牵头单位账号', () => {
    const users = createAppStore().getState().users;
    expect(validateTopicAccountUniqueness(users, 't1')).toBe('该课题已经绑定业务账号');
    expect(validateTopicAccountUniqueness(users, 'new-topic')).toBeNull();
  });
});

describe('固定重点项目信息', () => {
  it('系统配置只更新唯一项目而不创建项目列表', () => {
    const store = createAppStore();
    store.getState().updateProject({ name: '更新后的重点项目名称' });
    expect(store.getState().project.name).toBe('更新后的重点项目名称');
  });
});
