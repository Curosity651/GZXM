// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AchievementEntryPage } from './achievement/AchievementEntryPage';
import { ReportManagementPage } from './report/ReportManagementPage';
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

const getComputedStyle = window.getComputedStyle.bind(window);
Object.defineProperty(window, 'getComputedStyle', {
  writable: true,
  value: (element: Element) => getComputedStyle(element),
});

class ResizeObserverStub {
  observe() { return undefined; }
  unobserve() { return undefined; }
  disconnect() { return undefined; }
}
globalThis.ResizeObserver = ResizeObserverStub;

describe('business action visibility', () => {
  afterEach(() => {
    cleanup();
    useAppStore.setState(createInitialState());
  });

  it('keeps the achievement submission page read-only for the system administrator', () => {
    const state = createInitialState();
    const administrator = state.users.find((user) => user.role === '系统管理员');
    useAppStore.setState({ ...state, currentUser: administrator });

    render(React.createElement(AchievementEntryPage));

    expect(screen.queryByText('新增成果')).toBeNull();
    expect(screen.getByText(/只读查看/)).toBeTruthy();
  });

  it('shows every topic report without submission actions to the system administrator', () => {
    const state = createInitialState();
    const administrator = state.users.find((user) => user.role === '系统管理员');
    useAppStore.setState({ ...state, currentUser: administrator });

    render(React.createElement(ReportManagementPage));

    expect(screen.getAllByText('课题1：总体架构与关键技术研究').length).toBeGreaterThan(0);
    expect(screen.getAllByText('只读查看').length).toBeGreaterThan(0);
    expect(screen.queryByText('提交初审')).toBeNull();
  });
});
