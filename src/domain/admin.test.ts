import { describe, expect, it } from 'vitest';
import { normalizeTopicBinding, validateTopicAccountUniqueness } from './admin';
import { createAppStore } from '../store';

describe('单位账号绑定', () => {
  it('课题关系不再直接保存在账号字段中', () => {
    expect(normalizeTopicBinding('外部课题单位', 't1')).toBeUndefined();
    expect(normalizeTopicBinding('科研助理', 't1')).toBeUndefined();
  });

  it('同一单位不能重复创建有效课题单位账号', () => {
    const users = createAppStore().getState().users;
    expect(validateTopicAccountUniqueness(users, 'u-tsinghua')).toBe('该单位已经存在课题单位账号');
    expect(validateTopicAccountUniqueness(users, 'new-unit')).toBeNull();
  });
});

describe('固定重点项目信息', () => {
  it('系统配置只更新唯一项目而不创建项目列表', () => {
    const store = createAppStore();
    store.getState().updateProject({ name: '更新后的重点项目名称' });
    expect(store.getState().project.name).toBe('更新后的重点项目名称');
  });
});
