import type { User } from '../types';

export interface IAuthService {
  login(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }>;
  logout(): Promise<void>;
}

const MOCK_USERS: User[] = [
  { id: 'user-admin', username: 'admin', password: 'admin123', name: '系统管理员', unitId: 'u-sgcc', phone: '13800000001', email: 'admin@sgcc.com.cn', role: '系统管理员', enabled: true, createdAt: '2025-01-01', lastLoginAt: '2025-06-01' },
  { id: 'user-pm', username: 'pm', password: 'pm123', name: '项目管理员', unitId: 'u-sgcc', phone: '13800000002', email: 'pm@sgcc.com.cn', role: '项目管理人员', enabled: true, createdAt: '2025-01-01' },
  { id: 'user-topic', username: 'topic', password: 'topic123', name: '课题用户', unitId: 'u-tsinghua', phone: '13800000003', email: 'topic@tsinghua.edu.cn', role: '课题用户', enabled: true, createdAt: '2025-01-01' },
  { id: 'user-reviewer', username: 'reviewer', password: 'reviewer123', name: '审批人员', unitId: 'u-sgcc', phone: '13800000004', email: 'reviewer@sgcc.com.cn', role: '成果审批人员', enabled: true, createdAt: '2025-01-01' },
];

export const mockAuthService: IAuthService = {
  async login(username: string, password: string) {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 300));

    // First check localStorage for dynamically added users
    let users = MOCK_USERS;
    try {
      const stored = localStorage.getItem('research-achievement-storage-v6');
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
