// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createInitialState, useAppStore } from '../../store';
import { AchievementEntryPage } from './AchievementEntryPage';
import { AchievementApprovalPage } from './AchievementApprovalPage';

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

describe('achievement pages', () => {
  afterEach(() => {
    cleanup();
    useAppStore.setState(createInitialState());
  });

  it('starts each secondary page with business content instead of introductory copy', () => {
    const state = createInitialState();
    const member = state.users.find((user) => user.role === '内部课题单位');
    useAppStore.setState({ ...state, currentUser: member });
    const entry = render(React.createElement(AchievementEntryPage));

    expect(entry.container.querySelector('.page-header')).toBeNull();
    expect(screen.queryByText(/一条成果记录贯穿/)).toBeNull();
    expect(screen.queryByText(/预审阶段不强制上传/)).toBeNull();
    expect(screen.getByRole('button', { name: /新建成果/ })).toBeTruthy();
    expect(screen.getByText('成果进度')).toBeTruthy();
    expect(screen.getByText(/成果列表/)).toBeTruthy();
    entry.unmount();

    const administrator = state.users.find((user) => user.role === '系统管理员');
    useAppStore.setState({ ...state, currentUser: administrator });
    const approval = render(React.createElement(AchievementApprovalPage));
    expect(approval.container.querySelector('.page-header')).toBeNull();
    expect(screen.queryByText(/当前角色可查看审批记录/)).toBeNull();
    approval.unmount();
  });

  it('lets the research assistant review from the unified achievement page without submission actions', () => {
    const state = createInitialState();
    const assistant = state.users.find((user) => user.role === '科研助理');
    useAppStore.setState({ ...state, currentUser: assistant });

    render(React.createElement(AchievementEntryPage));

    expect(screen.getByText('待我处理')).toBeTruthy();
    expect(screen.getByText('成果进度')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /新建成果/ })).toBeNull();
  });
});
