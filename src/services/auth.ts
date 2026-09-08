import type { User } from '../types';
import { MOCK_USERS } from '../data/mock';

export interface IAuthService {
  login(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }>;
  logout(): Promise<void>;
}

export const mockAuthService: IAuthService = {
  async login(username: string, password: string) {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 300));

    // First check localStorage for dynamically added users
    let users = MOCK_USERS;
    try {
      const stored = localStorage.getItem('gzxm-research-management-v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.users && Array.isArray(parsed.state.users)) {
          users = parsed.state.users as User[];
        }
      }
    } catch {
      // fall back to default users
    }

    const user = users.find((u) => u.username === username && u.password === password);
    if (!user) {
      return { success: false, error: '用户名或密码错误' };
    }
    if (!user.enabled) {
      return { success: false, error: '该账号已被禁用' };
    }
    return { success: true, user: { ...user, lastLoginAt: new Date().toISOString() } };
  },

  async logout() {
    // no-op for mock
  },
};
