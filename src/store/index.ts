import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Achievement, ArchiveCategory, ArchiveMaterial, ArchiveRequirement,
  IndicatorConfig, Project,
  ProjectUnit, TimeNode, Topic, TopicPowerGridRequirement, WarningRule, User, UserRole,
} from '../types';
import {
  MOCK_ACHIEVEMENTS, MOCK_ARCHIVE_CATEGORIES, MOCK_ARCHIVE_MATERIALS, MOCK_ARCHIVE_REQUIREMENTS,
  MOCK_INDICATORS,
  MOCK_PROJECT, MOCK_TIME_NODES, MOCK_TOPICS, MOCK_UNITS, MOCK_WARNING_RULES,
  MOCK_USERS, MOCK_TOPIC_POWER_GRID_REQUIREMENTS,
} from '../data/mock';

export interface AppState {
  project: Project;
  units: ProjectUnit[];
  topics: Topic[];
  nodes: TimeNode[];
  indicators: IndicatorConfig[];
  warningRules: WarningRule[];
  achievements: Achievement[];
  archiveCategories: ArchiveCategory[];
  archiveMaterials: ArchiveMaterial[];
  archiveRequirements: ArchiveRequirement[];
  topicPowerGridRequirements: TopicPowerGridRequirement[];

  // Auth
  users: User[];
  currentUser: User | null;

  // Unit CRUD
  addUnit: (unit: ProjectUnit) => void;
  updateUnit: (id: string, updates: Partial<ProjectUnit>) => void;
  removeUnit: (id: string) => void;

  // Topic CRUD
  addTopic: (topic: Topic) => void;
  updateTopic: (id: string, updates: Partial<Topic>) => void;
  removeTopic: (id: string) => void;

  // Node CRUD
  addNode: (node: TimeNode) => void;
  updateNode: (id: string, updates: Partial<TimeNode>) => void;
  removeNode: (id: string) => void;

  // Indicator CRUD
  addIndicator: (indicator: IndicatorConfig) => void;
  updateIndicator: (id: string, updates: Partial<IndicatorConfig>) => void;
  removeIndicator: (id: string) => void;
  batchUpdateIndicators: (updates: { id: string; plannedQuantity: number }[]) => void;

  // Warning rules
  updateWarningRule: (id: string, updates: Partial<WarningRule>) => void;

  // Achievement CRUD
  addAchievement: (achievement: Achievement) => void;
  updateAchievement: (id: string, updates: Partial<Achievement>) => void;
  lockAchievement: (id: string) => void;
  submitAchievement: (id: string) => void;
  approveAchievement: (id: string, payload: Partial<Achievement>, approver: string) => void;
  rejectAchievement: (id: string, reason: string, approver: string) => void;
  returnAchievement: (id: string, reason: string, approver: string) => void;

  // Archive CRUD
  addArchiveCategory: (category: ArchiveCategory) => void;
  updateArchiveCategory: (id: string, updates: Partial<ArchiveCategory>) => void;
  removeArchiveCategory: (id: string) => void;
  addArchiveMaterial: (material: ArchiveMaterial) => void;
  updateArchiveMaterial: (id: string, updates: Partial<ArchiveMaterial>) => void;
  removeArchiveMaterial: (id: string) => void;
  addArchiveRequirement: (req: ArchiveRequirement) => void;
  updateArchiveRequirement: (id: string, updates: Partial<ArchiveRequirement>) => void;
  removeArchiveRequirement: (id: string) => void;

  // Power grid
  addPowerGridReq: (req: TopicPowerGridRequirement) => void;
  updatePowerGridReq: (id: string, updates: Partial<TopicPowerGridRequirement>) => void;
  removePowerGridReq: (id: string) => void;

  // Auth actions
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  // User CRUD
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  removeUser: (id: string) => void;
  resetUserPassword: (id: string) => void;
  toggleUserEnabled: (id: string, enabled: boolean) => void;

  // Reset
  resetToMock: () => void;
}

const buildInitialState = () => ({
  project: MOCK_PROJECT,
  units: MOCK_UNITS,
  topics: MOCK_TOPICS,
  nodes: MOCK_TIME_NODES,
  indicators: MOCK_INDICATORS,
  warningRules: MOCK_WARNING_RULES,
  achievements: MOCK_ACHIEVEMENTS,
  archiveCategories: MOCK_ARCHIVE_CATEGORIES,
  archiveMaterials: MOCK_ARCHIVE_MATERIALS,
  archiveRequirements: MOCK_ARCHIVE_REQUIREMENTS,
  topicPowerGridRequirements: MOCK_TOPIC_POWER_GRID_REQUIREMENTS,
  users: MOCK_USERS,
  currentUser: null as User | null,
});

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...buildInitialState(),

      addUnit: (unit) => set((s) => ({ units: [...s.units, unit] })),
      updateUnit: (id, updates) => set((s) => ({ units: s.units.map((u) => (u.id === id ? { ...u, ...updates } : u)) })),
      removeUnit: (id) => set((s) => ({ units: s.units.filter((u) => u.id !== id) })),

      addTopic: (topic) => set((s) => ({ topics: [...s.topics, topic] })),
      updateTopic: (id, updates) => set((s) => ({ topics: s.topics.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),
      removeTopic: (id) => set((s) => ({ topics: s.topics.filter((t) => t.id !== id) })),

      addNode: (node) => set((s) => ({ nodes: [...s.nodes, node] })),
      updateNode: (id, updates) => set((s) => ({ nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)) })),
      removeNode: (id) => set((s) => ({ nodes: s.nodes.filter((n) => n.id !== id) })),

      addIndicator: (indicator) => set((s) => ({ indicators: [...s.indicators, indicator] })),
      updateIndicator: (id, updates) => set((s) => ({
        indicators: s.indicators.map((i) => (i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : i)),
      })),
      removeIndicator: (id) => set((s) => ({ indicators: s.indicators.filter((i) => i.id !== id) })),
      batchUpdateIndicators: (updates) => set((s) => {
        const map = new Map(updates.map((u) => [u.id, u.plannedQuantity]));
        const today = new Date().toISOString().split('T')[0];
        return { indicators: s.indicators.map((i) => map.has(i.id) ? { ...i, plannedQuantity: map.get(i.id)!, updatedAt: today } : i) };
      }),

      updateWarningRule: (id, updates) => set((s) => ({ warningRules: s.warningRules.map((r) => (r.id === id ? { ...r, ...updates } : r)) })),

      addAchievement: (achievement) => set((s) => ({ achievements: [...s.achievements, achievement] })),
      updateAchievement: (id, updates) => set((s) => ({ achievements: s.achievements.map((a) => (a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : a)) })),
      lockAchievement: (id) => set((s) => ({ achievements: s.achievements.map((a) => (a.id === id ? { ...a, status: '已提交' as const, submittedAt: new Date().toISOString().split('T')[0], updatedAt: new Date().toISOString().split('T')[0] } : a)) })),
      submitAchievement: (id) => set((s) => ({ achievements: s.achievements.map((a) => (a.id === id ? { ...a, status: '已提交' as const, submittedAt: new Date().toISOString().split('T')[0], updatedAt: new Date().toISOString().split('T')[0] } : a)) })),
      approveAchievement: (id, payload, approver) => { const today = new Date().toISOString().split('T')[0]; set((s) => ({ achievements: s.achievements.map((a) => (a.id === id ? { ...a, ...payload, status: '审批通过' as const, approver, approvedAt: today, updatedAt: today } : a)) })); },
      rejectAchievement: (id, reason, approver) => { const today = new Date().toISOString().split('T')[0]; set((s) => ({ achievements: s.achievements.map((a) => (a.id === id ? { ...a, status: '审批不通过' as const, approvalOpinion: reason, approver, approvedAt: today, updatedAt: today, countsToIndicator: false } : a)) })); },
      returnAchievement: (id, reason, approver) => { const today = new Date().toISOString().split('T')[0]; set((s) => ({ achievements: s.achievements.map((a) => (a.id === id ? { ...a, status: '退回修改' as const, approvalOpinion: reason, approver, approvedAt: today, updatedAt: today, countsToIndicator: false } : a)) })); },

      addArchiveCategory: (c) => set((s) => ({ archiveCategories: [...s.archiveCategories, c] })),
      updateArchiveCategory: (id, u) => set((s) => ({ archiveCategories: s.archiveCategories.map((c) => (c.id === id ? { ...c, ...u } : c)) })),
      removeArchiveCategory: (id) => set((s) => ({ archiveCategories: s.archiveCategories.filter((c) => c.id !== id) })),
      addArchiveMaterial: (m) => set((s) => ({ archiveMaterials: [...s.archiveMaterials, m] })),
      updateArchiveMaterial: (id, u) => set((s) => ({ archiveMaterials: s.archiveMaterials.map((m) => (m.id === id ? { ...m, ...u } : m)) })),
      removeArchiveMaterial: (id) => set((s) => ({ archiveMaterials: s.archiveMaterials.filter((m) => m.id !== id) })),
      addArchiveRequirement: (r) => set((s) => ({ archiveRequirements: [...s.archiveRequirements, r] })),
      updateArchiveRequirement: (id, u) => set((s) => ({ archiveRequirements: s.archiveRequirements.map((r) => (r.id === id ? { ...r, ...u } : r)) })),
      removeArchiveRequirement: (id) => set((s) => ({ archiveRequirements: s.archiveRequirements.filter((r) => r.id !== id) })),

      addPowerGridReq: (req) => set((s) => ({ topicPowerGridRequirements: [...s.topicPowerGridRequirements, req] })),
      updatePowerGridReq: (id, updates) => set((s) => ({ topicPowerGridRequirements: s.topicPowerGridRequirements.map((r) => (r.id === id ? { ...r, ...updates } : r)) })),
      removePowerGridReq: (id) => set((s) => ({ topicPowerGridRequirements: s.topicPowerGridRequirements.filter((r) => r.id !== id) })),

      // Auth actions
      login: async (username: string, password: string) => {
        const state = get();
        const user = state.users.find((u) => u.username === username && u.password === password);
        if (!user) {
          return { success: false, error: '用户名或密码错误' };
        }
        if (!user.enabled) {
          return { success: false, error: '该账号已被禁用' };
        }
        const updatedUser = { ...user, lastLoginAt: new Date().toISOString().split('T')[0] };
        set((s) => ({
          currentUser: updatedUser,
          users: s.users.map((u) => (u.id === user.id ? updatedUser : u)),
        }));
        return { success: true };
      },
      logout: () => set({ currentUser: null }),

      // User CRUD
      addUser: (user) => set((s) => ({ users: [...s.users, user] })),
      updateUser: (id, updates) => set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...updates } : u)) })),
      removeUser: (id) => set((s) => ({ users: s.users.filter((u) => u.id !== id) })),
      resetUserPassword: (id) => set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, password: '123456' } : u)) })),
      toggleUserEnabled: (id, enabled) => set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, enabled } : u)) })),

      resetToMock: () => set(buildInitialState()),
    }),
    { name: 'research-achievement-storage-v6' }
  )
);

export const canEditAchievement = (status: string): boolean => {
  return status === '草稿' || status === '退回修改';
};

export const canAccess = (role: UserRole, module: string): boolean => {
  const access: Record<UserRole, string[]> = {
    '系统管理员': ['all'],
    '项目管理人员': ['research', 'archive', 'monitoring'],
    '课题用户': ['achievement-entry', 'monitoring'],
    '成果审批人员': ['achievement-approval', 'monitoring'],
  };
  const allowed = access[role] || [];
  if (allowed.includes('all')) return true;
  return allowed.includes(module);
};
