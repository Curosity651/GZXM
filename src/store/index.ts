import { create } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { persist } from 'zustand/middleware';
import type { StateCreator } from 'zustand';
import type {
  Achievement, ApprovalRecord, ArchiveCategory, ArchiveMaterial, ArchiveRequirement, ArchiveSubmission,
  IndicatorConfig, ProgressReport, Project, ProjectUnit, ReportTask, SelfFundedProject, TimeNode, Topic,
  TopicPowerGridRequirement, User, UserRole, WarningRule,
} from '../types';
import {
  MOCK_ACHIEVEMENTS, MOCK_APPROVAL_RECORDS, MOCK_ARCHIVE_CATEGORIES, MOCK_ARCHIVE_MATERIALS,
  MOCK_ARCHIVE_REQUIREMENTS, MOCK_ARCHIVE_SUBMISSIONS, MOCK_INDICATORS, MOCK_PROJECT, MOCK_REPORTS,
  MOCK_REPORT_TASKS, MOCK_SELF_FUNDED_PROJECTS, MOCK_TIME_NODES, MOCK_TOPICS,
  MOCK_TOPIC_POWER_GRID_REQUIREMENTS, MOCK_UNITS, MOCK_USERS, MOCK_WARNING_RULES, MOCK_WORKFLOW_ACHIEVEMENTS,
} from '../data/mock';
import { nextAchievementStatus, type AchievementAction } from '../domain/workflows';
import { nextReportStatus, type ReportAction } from '../domain/report-flow';

export interface AppData {
  project: Project;
  units: ProjectUnit[];
  topics: Topic[];
  nodes: TimeNode[];
  indicators: IndicatorConfig[];
  warningRules: WarningRule[];
  achievements: Achievement[];
  approvalRecords: ApprovalRecord[];
  reportTasks: ReportTask[];
  reports: ProgressReport[];
  selfFundedProjects: SelfFundedProject[];
  archiveCategories: ArchiveCategory[];
  archiveMaterials: ArchiveMaterial[];
  archiveRequirements: ArchiveRequirement[];
  archiveSubmissions: ArchiveSubmission[];
  topicPowerGridRequirements: TopicPowerGridRequirement[];
  users: User[];
  currentUser: User | null;
}

export interface AppState extends AppData {
  addUnit: (unit: ProjectUnit) => void;
  updateUnit: (id: string, updates: Partial<ProjectUnit>) => void;
  removeUnit: (id: string) => void;
  addTopic: (topic: Topic) => void;
  updateTopic: (id: string, updates: Partial<Topic>) => void;
  removeTopic: (id: string) => void;
  addNode: (node: TimeNode) => void;
  updateNode: (id: string, updates: Partial<TimeNode>) => void;
  removeNode: (id: string) => void;
  addIndicator: (indicator: IndicatorConfig) => void;
  updateIndicator: (id: string, updates: Partial<IndicatorConfig>) => void;
  removeIndicator: (id: string) => void;
  batchUpdateIndicators: (updates: { id: string; plannedQuantity: number }[]) => void;
  updateWarningRule: (id: string, updates: Partial<WarningRule>) => void;
  addAchievement: (achievement: Achievement) => void;
  updateAchievement: (id: string, updates: Partial<Achievement>) => void;
  lockAchievement: (id: string) => void;
  submitAchievement: (id: string) => void;
  approveAchievement: (id: string, payload: Partial<Achievement>, approver: string) => void;
  rejectAchievement: (id: string, reason: string, approver: string) => void;
  returnAchievement: (id: string, reason: string, approver: string) => void;
  advanceAchievement: (id: string, action: AchievementAction, operatorId: string) => void;
  reviewAchievement: (id: string, action: AchievementAction, operatorId: string, opinion: string) => void;
  saveReport: (report: ProgressReport) => void;
  submitReport: (id: string, operatorId: string) => void;
  reviewReport: (id: string, action: ReportAction, operatorId: string, opinion: string) => void;
  addArchiveCategory: (category: ArchiveCategory) => void;
  updateArchiveCategory: (id: string, updates: Partial<ArchiveCategory>) => void;
  removeArchiveCategory: (id: string) => void;
  addArchiveMaterial: (material: ArchiveMaterial) => void;
  updateArchiveMaterial: (id: string, updates: Partial<ArchiveMaterial>) => void;
  removeArchiveMaterial: (id: string) => void;
  addArchiveRequirement: (req: ArchiveRequirement) => void;
  updateArchiveRequirement: (id: string, updates: Partial<ArchiveRequirement>) => void;
  removeArchiveRequirement: (id: string) => void;
  addPowerGridReq: (req: TopicPowerGridRequirement) => void;
  updatePowerGridReq: (id: string, updates: Partial<TopicPowerGridRequirement>) => void;
  removePowerGridReq: (id: string) => void;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  removeUser: (id: string) => void;
  resetUserPassword: (id: string) => void;
  toggleUserEnabled: (id: string, enabled: boolean) => void;
  resetToMock: () => void;
}

export function createInitialState(): AppData {
  return structuredClone({
    project: MOCK_PROJECT,
    units: MOCK_UNITS,
    topics: MOCK_TOPICS,
    nodes: MOCK_TIME_NODES,
    indicators: MOCK_INDICATORS,
    warningRules: MOCK_WARNING_RULES,
    achievements: [...MOCK_ACHIEVEMENTS, ...MOCK_WORKFLOW_ACHIEVEMENTS],
    approvalRecords: MOCK_APPROVAL_RECORDS,
    reportTasks: MOCK_REPORT_TASKS,
    reports: MOCK_REPORTS,
    selfFundedProjects: MOCK_SELF_FUNDED_PROJECTS,
    archiveCategories: MOCK_ARCHIVE_CATEGORIES,
    archiveMaterials: MOCK_ARCHIVE_MATERIALS,
    archiveRequirements: MOCK_ARCHIVE_REQUIREMENTS,
    archiveSubmissions: MOCK_ARCHIVE_SUBMISSIONS,
    topicPowerGridRequirements: MOCK_TOPIC_POWER_GRID_REQUIREMENTS,
    users: MOCK_USERS,
    currentUser: null,
  });
}

export function visibleTopics(user: User, topics: Topic[]): Topic[] {
  return user.role === '课题牵头单位' ? topics.filter((topic) => topic.id === user.topicId) : topics;
}

const stateCreator: StateCreator<AppState> = (set, get) => ({
  ...createInitialState(),
  addUnit: (unit) => set((state) => ({ units: [...state.units, unit] })),
  updateUnit: (id, updates) => set((state) => ({ units: state.units.map((unit) => unit.id === id ? { ...unit, ...updates } : unit) })),
  removeUnit: (id) => set((state) => ({ units: state.units.filter((unit) => unit.id !== id) })),
  addTopic: (topic) => set((state) => ({ topics: [...state.topics, topic] })),
  updateTopic: (id, updates) => set((state) => ({ topics: state.topics.map((topic) => topic.id === id ? { ...topic, ...updates } : topic) })),
  removeTopic: (id) => set((state) => ({ topics: state.topics.filter((topic) => topic.id !== id) })),
  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  updateNode: (id, updates) => set((state) => ({ nodes: state.nodes.map((node) => node.id === id ? { ...node, ...updates } : node) })),
  removeNode: (id) => set((state) => ({ nodes: state.nodes.filter((node) => node.id !== id) })),
  addIndicator: (indicator) => set((state) => ({ indicators: [...state.indicators, indicator] })),
  updateIndicator: (id, updates) => set((state) => ({ indicators: state.indicators.map((indicator) => indicator.id === id ? { ...indicator, ...updates, updatedAt: today() } : indicator) })),
  removeIndicator: (id) => set((state) => ({ indicators: state.indicators.filter((indicator) => indicator.id !== id) })),
  batchUpdateIndicators: (updates) => set((state) => {
    const quantities = new Map(updates.map((item) => [item.id, item.plannedQuantity]));
    return { indicators: state.indicators.map((indicator) => quantities.has(indicator.id) ? { ...indicator, plannedQuantity: quantities.get(indicator.id)!, updatedAt: today() } : indicator) };
  }),
  updateWarningRule: (id, updates) => set((state) => ({ warningRules: state.warningRules.map((rule) => rule.id === id ? { ...rule, ...updates } : rule) })),
  addAchievement: (achievement) => set((state) => ({ achievements: [...state.achievements, achievement] })),
  updateAchievement: (id, updates) => set((state) => ({ achievements: state.achievements.map((achievement) => achievement.id === id ? { ...achievement, ...updates, updatedAt: today() } : achievement) })),
  lockAchievement: (id) => set((state) => ({ achievements: state.achievements.map((achievement) => achievement.id === id ? { ...achievement, status: '已提交', submittedAt: today(), updatedAt: today() } : achievement) })),
  submitAchievement: (id) => set((state) => ({ achievements: state.achievements.map((achievement) => achievement.id === id ? { ...achievement, status: '已提交', submittedAt: today(), updatedAt: today() } : achievement) })),
  approveAchievement: (id, payload, approver) => set((state) => ({ achievements: state.achievements.map((achievement) => achievement.id === id ? { ...achievement, ...payload, status: '审批通过', countsToIndicator: true, approver, approvedAt: today(), updatedAt: today() } : achievement) })),
  rejectAchievement: (id, reason, approver) => set((state) => ({ achievements: state.achievements.map((achievement) => achievement.id === id ? { ...achievement, status: '审批不通过', countsToIndicator: false, approvalOpinion: reason, approver, approvedAt: today(), updatedAt: today() } : achievement) })),
  returnAchievement: (id, reason, approver) => set((state) => ({ achievements: state.achievements.map((achievement) => achievement.id === id ? { ...achievement, status: '退回修改', countsToIndicator: false, approvalOpinion: reason, approver, approvedAt: today(), updatedAt: today() } : achievement) })),
  advanceAchievement: (id, action, operatorId) => {
    const current = get().achievements.find((achievement) => achievement.id === id);
    const operator = get().users.find((user) => user.id === operatorId);
    if (!current || !operator) throw new Error('成果或操作人不存在');
    if (operator.role !== '课题牵头单位' || operator.topicId !== current.topicId) throw new Error('只能提交本课题成果');
    if (!['SUBMIT_PRE_REVIEW', 'START_FORMAL', 'SUBMIT_FORMAL'].includes(action)) throw new Error('该动作不是成果提交动作');
    const nextStatus = nextAchievementStatus(current.status as Parameters<typeof nextAchievementStatus>[0], action);
    set((state) => ({ achievements: state.achievements.map((achievement) => achievement.id === id ? {
      ...achievement, status: nextStatus, submittedAt: action.startsWith('SUBMIT') ? today() : achievement.submittedAt,
      updatedAt: today(), countsToIndicator: false,
    } : achievement) }));
  },
  reviewAchievement: (id, action, operatorId, opinion) => {
    const current = get().achievements.find((achievement) => achievement.id === id);
    if (!current) throw new Error('成果不存在');
    const operator = get().users.find((user) => user.id === operatorId);
    if (!operator) throw new Error('审批人不存在');
    const atFinalLevel = current.status.includes('终审中');
    if ((action === 'APPROVE_INITIAL' || (action === 'RETURN' && !atFinalLevel)) && operator.role !== '科研助理') throw new Error('仅科研助理可以初审');
    if ((action === 'APPROVE_FINAL' || (action === 'RETURN' && atFinalLevel)) && operator.role !== '项目技术负责人') throw new Error('仅项目技术负责人可以终审');
    const workflowStatuses = ['预审草稿', '预审初审中', '预审终审中', '预审退回', '预审通过', '正式成果草稿', '正式初审中', '正式终审中', '正式退回', '已生效'];
    if (!workflowStatuses.includes(current.status)) throw new Error('该成果仍使用旧版流程，不能执行新版审批');
    const nextStatus = nextAchievementStatus(current.status as Parameters<typeof nextAchievementStatus>[0], action);
    const record: ApprovalRecord = {
      id: `approval-${Date.now()}-${id}`,
      businessType: 'ACHIEVEMENT', businessId: id,
      stage: current.status.startsWith('预审') ? 'PRE_REVIEW' : 'FORMAL',
      level: action === 'APPROVE_FINAL' || atFinalLevel ? 'FINAL' : 'INITIAL',
      decision: action === 'RETURN' ? 'RETURNED' : 'APPROVED',
      opinion, operatorId, operatedAt: new Date().toISOString(), submittedVersion: 1,
    };
    set((state) => ({
      achievements: state.achievements.map((achievement) => achievement.id === id ? {
        ...achievement, status: nextStatus, countsToIndicator: nextStatus === '已生效', updatedAt: today(),
        approvalOpinion: opinion, approver: operator.name, approvedAt: today(),
      } : achievement),
      approvalRecords: [...state.approvalRecords, record],
    }));
  },
  saveReport: (report) => set((state) => ({
    reports: state.reports.some((item) => item.id === report.id)
      ? state.reports.map((item) => item.id === report.id ? report : item)
      : [...state.reports, report],
  })),
  submitReport: (id, operatorId) => {
    const report = get().reports.find((item) => item.id === id);
    const operator = get().users.find((item) => item.id === operatorId);
    if (!report || !operator) throw new Error('报告或操作人不存在');
    if (operator.role !== '课题牵头单位' || operator.topicId !== report.topicId) throw new Error('只能提交本课题报告');
    const status = nextReportStatus(report.status, 'SUBMIT');
    set((state) => ({ reports: state.reports.map((item) => item.id === id ? { ...item, status, submittedAt: today(), updatedAt: today() } : item) }));
  },
  reviewReport: (id, action, operatorId, opinion) => {
    const report = get().reports.find((item) => item.id === id);
    const operator = get().users.find((item) => item.id === operatorId);
    if (!report || !operator) throw new Error('报告或审批人不存在');
    const atFinalLevel = report.status === '终审中';
    if ((action === 'APPROVE_INITIAL' || (action === 'RETURN' && !atFinalLevel)) && operator.role !== '科研助理') throw new Error('仅科研助理可以初审报告');
    if ((action === 'APPROVE_FINAL' || (action === 'RETURN' && atFinalLevel)) && operator.role !== '项目技术负责人') throw new Error('仅项目技术负责人可以终审报告');
    const status = nextReportStatus(report.status, action);
    const record: ApprovalRecord = {
      id: `approval-${Date.now()}-${id}`, businessType: 'REPORT', businessId: id, stage: 'REPORT',
      level: atFinalLevel ? 'FINAL' : 'INITIAL', decision: action === 'RETURN' ? 'RETURNED' : 'APPROVED',
      opinion, operatorId, operatedAt: new Date().toISOString(), submittedVersion: report.version,
    };
    set((state) => ({
      reports: state.reports.map((item) => item.id === id ? { ...item, status, updatedAt: today() } : item),
      approvalRecords: [...state.approvalRecords, record],
    }));
  },
  addArchiveCategory: (category) => set((state) => ({ archiveCategories: [...state.archiveCategories, category] })),
  updateArchiveCategory: (id, updates) => set((state) => ({ archiveCategories: state.archiveCategories.map((category) => category.id === id ? { ...category, ...updates } : category) })),
  removeArchiveCategory: (id) => set((state) => ({ archiveCategories: state.archiveCategories.filter((category) => category.id !== id) })),
  addArchiveMaterial: (material) => set((state) => ({ archiveMaterials: [...state.archiveMaterials, material] })),
  updateArchiveMaterial: (id, updates) => set((state) => ({ archiveMaterials: state.archiveMaterials.map((material) => material.id === id ? { ...material, ...updates } : material) })),
  removeArchiveMaterial: (id) => set((state) => ({ archiveMaterials: state.archiveMaterials.filter((material) => material.id !== id) })),
  addArchiveRequirement: (requirement) => set((state) => ({ archiveRequirements: [...state.archiveRequirements, requirement] })),
  updateArchiveRequirement: (id, updates) => set((state) => ({ archiveRequirements: state.archiveRequirements.map((requirement) => requirement.id === id ? { ...requirement, ...updates } : requirement) })),
  removeArchiveRequirement: (id) => set((state) => ({ archiveRequirements: state.archiveRequirements.filter((requirement) => requirement.id !== id) })),
  addPowerGridReq: (requirement) => set((state) => ({ topicPowerGridRequirements: [...state.topicPowerGridRequirements, requirement] })),
  updatePowerGridReq: (id, updates) => set((state) => ({ topicPowerGridRequirements: state.topicPowerGridRequirements.map((requirement) => requirement.id === id ? { ...requirement, ...updates } : requirement) })),
  removePowerGridReq: (id) => set((state) => ({ topicPowerGridRequirements: state.topicPowerGridRequirements.filter((requirement) => requirement.id !== id) })),
  login: async (username, password) => {
    const user = get().users.find((item) => item.username === username && item.password === password);
    if (!user) return { success: false, error: '用户名或密码错误' };
    if (!user.enabled) return { success: false, error: '该账号已被禁用' };
    const updatedUser = { ...user, lastLoginAt: today() };
    set((state) => ({ currentUser: updatedUser, users: state.users.map((item) => item.id === user.id ? updatedUser : item) }));
    return { success: true };
  },
  logout: () => set({ currentUser: null }),
  addUser: (user) => set((state) => ({ users: [...state.users, user] })),
  updateUser: (id, updates) => set((state) => ({ users: state.users.map((user) => user.id === id ? { ...user, ...updates } : user) })),
  removeUser: (id) => set((state) => ({ users: state.users.filter((user) => user.id !== id) })),
  resetUserPassword: (id) => set((state) => ({ users: state.users.map((user) => user.id === id ? { ...user, password: '123456' } : user) })),
  toggleUserEnabled: (id, enabled) => set((state) => ({ users: state.users.map((user) => user.id === id ? { ...user, enabled } : user) })),
  resetToMock: () => set(createInitialState()),
});

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function createAppStore() {
  return createStore<AppState>()(stateCreator);
}

export const useAppStore = create<AppState>()(
  persist(stateCreator, { name: 'gzxm-research-management-v1', version: 1 }),
);

export const canEditAchievement = (status: string): boolean => ['草稿', '退回修改', '预审草稿', '预审退回', '正式成果草稿', '正式退回'].includes(status);

export const canAccess = (role: UserRole, module: string): boolean => {
  if (role === '系统管理员') return true;
  if (role === '项目技术负责人' || role === '科研助理') return ['research', 'archive', 'monitoring'].includes(module);
  if (role === '课题牵头单位') return ['research', 'archive', 'monitoring', 'achievement-entry'].includes(module);
  return false;
};
