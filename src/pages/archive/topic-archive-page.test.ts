// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createInitialState, useAppStore } from '../../store';
import { TopicArchivePage } from './TopicArchivePage';

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

function renderAs(username: string) {
  const state = createInitialState();
  const user = state.users.find((item) => item.username === username)!;
  useAppStore.setState({ ...state, currentUser: user });
  render(React.createElement(TopicArchivePage));
}

function openTopic(code: string) {
  const topicCard = screen.getByText(code).closest('.ant-card');
  expect(topicCard).toBeTruthy();
  fireEvent.click(within(topicCard as HTMLElement).getByRole('button', { name: '进入课题材料' }));
}

function openUnit(name: string) {
  const unitCard = screen.getByText(name).closest('.ant-card');
  expect(unitCard).toBeTruthy();
  fireEvent.click(within(unitCard as HTMLElement).getByRole('button', { name: '进入单位材料' }));
}

describe('课题国家材料单位目录与权限', () => {
  afterEach(() => {
    cleanup();
    useAppStore.setState(createInitialState());
  });

  it('科研助理可查看课题下所有单位目录，但不能编辑单位材料', () => {
    renderAs('assistant');
    openTopic('K1');

    expect(screen.getByText('清华大学')).toBeTruthy();
    expect(screen.getByText('北京大学')).toBeTruthy();
    expect(screen.getByText('中科院计算所')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: '进入单位材料' })).toHaveLength(3);

    openUnit('清华大学');
    expect(screen.getByText('当前为查看权限，不可修改该单位材料。')).toBeTruthy();
    expect(screen.queryByRole('button', { name: '新增文件夹' })).toBeNull();
  });

  it('课题牵头单位可查看下属单位，且只能编辑自己的目录', () => {
    renderAs('tsinghua');
    openTopic('K1');

    expect(screen.getAllByRole('button', { name: '进入单位材料' })).toHaveLength(3);
    openUnit('清华大学');
    expect(screen.getByText('您可上传、补充和删除本单位材料。')).toBeTruthy();
    expect(screen.getByRole('button', { name: /新增文件夹/ })).toBeEnabled();
  });

  it('普通承担单位在非牵头课题中只能看到本单位目录', () => {
    renderAs('pku');
    openTopic('K1');

    expect(screen.getAllByRole('button', { name: '进入单位材料' })).toHaveLength(1);
    expect(screen.getByText('北京大学')).toBeTruthy();
    expect(screen.queryByText('清华大学')).toBeNull();
    expect(screen.queryByText('中科院计算所')).toBeNull();
  });
});
