// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { createInitialState, useAppStore } from '../../store';
import { IndicatorConfigPage } from './IndicatorConfigPage';
import { TopicIndicatorConfigPage } from './TopicIndicatorConfigPage';

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

function setCurrentUser(username: string) {
  const state = createInitialState();
  const currentUser = state.users.find((item) => item.username === username)!;
  useAppStore.setState({ ...state, currentUser });
}

function renderTopicAs(username: string, topicId = 't1', viewMode = false) {
  setCurrentUser(username);
  render(
    React.createElement(
      MemoryRouter,
      { initialEntries: [`/indicator/topic/${topicId}${viewMode ? '?mode=view' : ''}`] },
      React.createElement(
        Routes,
        null,
        React.createElement(Route, { path: '/indicator/topic/:topicId', element: React.createElement(TopicIndicatorConfigPage) }),
        React.createElement(Route, { path: '/indicator', element: React.createElement('div', null, '课题列表') }),
      ),
    ),
  );
}

describe('科研指标配置页权限与交互', () => {
  afterEach(() => {
    cleanup();
    useAppStore.setState(createInitialState());
  }, 15000);

  it('项目技术负责人可编辑课题和总体指标，负责人联动牵头单位账号', () => {
    renderTopicAs('leader');

    expect(screen.getByRole('button', { name: /确认课题配置/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: '确认并下发' })).toBeEnabled();
    expect(screen.getByText('已关联账号：tsinghua')).toBeTruthy();
    expect(screen.getAllByText('第一作者是广西电网的论文数量').length).toBeGreaterThan(0);
    expect(screen.getAllByText('第一申请人是广西电网的专利数量').length).toBeGreaterThan(0);
    expect(screen.getAllByText('第一完成人是广西电网的软著数量').length).toBeGreaterThan(0);
    screen.getAllByRole('spinbutton').slice(0, 9).forEach((input) => expect(input).toBeEnabled());
  }, 15000);

  it('科研助理保留课题与总体指标编辑下发权限', () => {
    renderTopicAs('assistant');
    expect(screen.getByRole('button', { name: /确认课题配置/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: '确认并下发' })).toBeEnabled();
  }, 15000);

  it('项目技术负责人和科研助理进入详情后严格只读', () => {
    renderTopicAs('leader', 't1', true);
    expect(screen.queryByRole('button', { name: /确认课题配置/ })).toBeNull();
    expect(screen.queryByRole('button', { name: '确认并下发' })).toBeNull();
    expect(screen.queryByRole('button', { name: '课题月季报配置' })).toBeNull();
    expect(screen.getByRole('textbox', { name: '课题编号' })).toBeDisabled();
    screen.getAllByRole('spinbutton').forEach((input) => expect(input).toBeDisabled());
    expect(screen.getByText('当前为详情查看模式，所有内容均不可修改。')).toBeTruthy();
    cleanup();

    renderTopicAs('assistant', 't1', true);
    expect(screen.queryByRole('button', { name: /确认课题配置/ })).toBeNull();
    expect(screen.getByRole('textbox', { name: '课题编号' })).toBeDisabled();
    screen.getAllByRole('spinbutton').forEach((input) => expect(input).toBeDisabled());
  }, 15000);

  it('课题单位不能通过详情地址访问未绑定课题', () => {
    renderTopicAs('pku', 't3');
    expect(screen.getByText('无权访问该课题')).toBeTruthy();
  });

  it('课题配置和启停操作都会先弹出确认框', async () => {
    renderTopicAs('leader');
    fireEvent.click(screen.getByRole('button', { name: /确认课题配置/ }));
    expect(await screen.findByText('确认课题配置', { selector: '.ant-modal-title' })).toBeTruthy();
    cleanup();

    setCurrentUser('leader');
    render(React.createElement(MemoryRouter, null, React.createElement(IndicatorConfigPage)));
    const firstRow = screen.getByText('K1').closest('tr');
    expect(firstRow).toBeTruthy();
    fireEvent.click(within(firstRow as HTMLElement).getByRole('button', { name: '停用' }));
    expect(await screen.findByText('确认停用课题', { selector: '.ant-modal-title' })).toBeTruthy();
  }, 15000);
});
