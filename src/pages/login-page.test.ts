// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { LoginPage } from './LoginPage';

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

describe('login page', () => {
  afterEach(cleanup);

  it('shows only the centered login form without promotional or demo-account sections', () => {
    const { container } = render(
      React.createElement(MemoryRouter, null, React.createElement(LoginPage)),
    );

    expect(screen.getByLabelText('用户名')).toBeTruthy();
    expect(screen.getByLabelText('密码')).toBeTruthy();
    expect(screen.getByRole('button', { name: '进入系统' })).toBeTruthy();
    expect(container.querySelector('.login-hero')).toBeNull();
    expect(container.querySelector('.demo-accounts')).toBeNull();
    expect(screen.queryByText('欢迎登录')).toBeNull();
  });
});
