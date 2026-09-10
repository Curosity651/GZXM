// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { HomePage } from './HomePage';
import { createInitialState, useAppStore } from '../store';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: () => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

class ResizeObserverStub {
  observe() { return undefined; }
  unobserve() { return undefined; }
  disconnect() { return undefined; }
}
globalThis.ResizeObserver = ResizeObserverStub;

describe('home page layout', () => {
  afterEach(() => {
    cleanup();
    useAppStore.setState(createInitialState());
  });

  it('stretches the topic overview and task cards to the same row height', () => {
    const state = createInitialState();
    const administrator = state.users.find((user) => user.role === '系统管理员');
    useAppStore.setState({ ...state, currentUser: administrator });

    render(React.createElement(HomePage));

    const overviewCard = screen.getByText('课题执行概览').closest('.ant-card');
    const tasksCard = screen.getByText('我的待办').closest('.ant-card');
    const overviewColumn = overviewCard?.parentElement;
    const tasksColumn = tasksCard?.parentElement;

    expect(overviewColumn).toHaveStyle({ display: 'flex' });
    expect(tasksColumn).toHaveStyle({ display: 'flex' });
    expect(overviewCard).toHaveStyle({ height: '100%', width: '100%' });
    expect(tasksCard).toHaveStyle({ height: '100%', width: '100%' });
  });

  it('starts with dashboard content without an introductory header', () => {
    const state = createInitialState();
    const administrator = state.users.find((user) => user.role === '系统管理员');
    useAppStore.setState({ ...state, currentUser: administrator });

    render(React.createElement(HomePage));

    expect(screen.queryByRole('heading', { name: '工作台' })).toBeNull();
    expect(screen.queryByText(/欢迎回来/)).toBeNull();
    expect(screen.queryByText(/本系统管理一个固定重点项目/)).toBeNull();
  });

  it('keeps every task in a vertically scrollable table', () => {
    const state = createInitialState();
    const projectLeader = state.users.find((user) => user.role === '项目技术负责人');
    const baseAchievement = state.achievements[0];
    const pendingAchievements = Array.from({ length: 6 }, (_, index) => ({
      ...baseAchievement,
      id: `pending-achievement-${index + 1}`,
      title: `待办成果${index + 1}`,
      status: '正式终审中' as const,
    }));
    useAppStore.setState({
      ...state,
      currentUser: projectLeader,
      achievements: pendingAchievements,
      reports: [],
    });

    const { container } = render(React.createElement(HomePage));

    expect(screen.getByRole('columnheader', { name: '待办事项' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: '业务类型' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: '状态' })).toBeTruthy();
    expect(screen.getByText('待办成果1')).toBeTruthy();
    expect(screen.getByText('待办成果6')).toBeTruthy();
    expect(container.querySelector('.ant-table-body')).toHaveStyle({ overflowY: 'scroll' });
  });
});
