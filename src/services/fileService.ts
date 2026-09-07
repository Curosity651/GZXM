import type { FileService } from '../types';

export const mockFileService: FileService = {
  async upload(file: File) {
    await new Promise((r) => setTimeout(r, 200));
    return {
      fileId: `file-${Date.now()}`,
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
    };
  },

  async download(fileId: string) {
    // Mock: open a new tab with the file URL
    window.open(`mock://download/${fileId}`, '_blank');
  },

  async preview(fileId: string) {
    // Mock: return a preview URL
    return `mock://preview/${fileId}`;
  },

  async delete(_fileId: string) {
    // no-op for mock
  },

  async getVersions(fileId: string) {
    return [
      { version: 1, fileName: `${fileId}.pdf`, uploadedAt: '2025-06-01', uploader: '系统用户' },
    ];
  },
};
