// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createInitialState, useAppStore } from '../../store';
import { ArchiveFolderFileList } from './ArchiveFolderFileList';

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

describe('archive folder file list', () => {
  afterEach(() => {
    cleanup();
    useAppStore.setState(createInitialState());
  });

  it('shows desktop-style file columns and supports checked batch deletion', async () => {
    const state = createInitialState();
    const operator = state.users.find((user) => user.username === 'gxgrid')!;
    const requirement = state.archiveRequirements.find((item) => item.id === 'ar-tech-2')!;
    useAppStore.setState({
      ...state,
      currentUser: operator,
      archiveSubmissions: [...state.archiveSubmissions, {
        id: 'as-test-file-list',
        requirementId: requirement.id,
        ownerType: 'SELF_FUNDED',
        ownerId: 'sf-1',
        topicId: 't3',
        unitId: 'u-sgcc',
        applicability: 'APPLICABLE',
        status: '已归档',
        fileIds: ['test-file'],
        files: [{ id: 'test-file', name: '技术协议.docx', size: 2048, uploader: '广西电网公司', uploadedAt: '2026/9/12 10:00:00' }],
        version: 1,
        updatedAt: '2026-09-12',
      }],
    });

    render(React.createElement(ArchiveFolderFileList, { requirement, ownerType: 'SELF_FUNDED', ownerId: 'sf-1', topicId: 't3', unitId: 'u-sgcc', editable: true }));

    expect(screen.getByText('材料提交提示')).toBeTruthy();
    expect(screen.getByRole('button', { name: /上传文件/ })).toBeTruthy();
    expect(screen.getByText('文件名')).toBeTruthy();
    expect(screen.getByText('大小')).toBeTruthy();
    expect(screen.getByText('上传人')).toBeTruthy();
    expect(screen.getByText('上传时间')).toBeTruthy();
    expect(screen.queryByText('材料适用性')).toBeNull();
    expect(screen.queryByRole('button', { name: /确认归档/ })).toBeNull();
    expect(screen.getByRole('button', { name: /上传文件/ })).toBeEnabled();

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes.at(-1)!);
    fireEvent.click(screen.getByRole('button', { name: /批量删除/ }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /删.*除/ }));

    await waitFor(() => {
      const submission = useAppStore.getState().archiveSubmissions.find((item) => item.id === 'as-test-file-list');
      expect(submission?.fileIds).toEqual([]);
      expect(submission?.files).toEqual([]);
    });
  }, 15000);
});
