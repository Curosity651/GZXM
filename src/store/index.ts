import { create } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { persist } from 'zustand/middleware';
import type { StateCreator } from 'zustand';
import type {
  Achievement, ApprovalRecord, ArchiveCategory, ArchiveMaterial, ArchiveRequirement, ArchiveSubmission,
  IndicatorConfig, ProgressReport, Project, ProjectUnit, ReportTask, SelfFundedProject, TimeNode, Topic,
  TopicPowerGridRequirement, User, UserRole, WarningRule, RbacRole, IndicatorDefinition,
  TopicIndicator, TopicUnitMembership, UnitIndicatorAllocation,
} from '../types';
import {
  MOCK_ACHIEVEMENTS, MOCK_APPROVAL_RECORDS, MOCK_ARCHIVE_CATEGORIES, MOCK_ARCHIVE_MATERIALS,
  MOCK_ARCHIVE_REQUIREMENTS, MOCK_ARCHIVE_SUBMISSIONS, MOCK_INDICATORS, MOCK_PROJECT, MOCK_REPORTS,
  MOCK_REPORT_TASKS, MOCK_SELF_FUNDED_PROJECTS, MOCK_TIME_NODES, MOCK_TOPICS,
  MOCK_TOPIC_POWER_GRID_REQUIREMENTS, MOCK_UNITS, MOCK_USERS, MOCK_WARNING_RULES, MOCK_WORKFLOW_ACHIEVEMENTS, MOCK_ROLES,
  MOCK_INDICATOR_DEFINITIONS, MOCK_TOPIC_INDICATORS, MOCK_TOPIC_MEMBERSHIPS, MOCK_UNIT_INDICATOR_ALLOCATIONS,
} from '../data/mock';
import { nextAchievementStatus, type AchievementAction } from '../domain/workflows';
import { nextReportStatus, type ReportAction } from '../domain/report-flow';
import { nextArchiveStatus, type ArchiveAction } from '../domain/archive-flow';
import { canAccessTopic, canPerform, filterByTopicScope, getRole } from '../domain/permissions';

export interface AppData {
  project: Project;
  units: ProjectUnit[];
  topics: Topic[];
  nodes: TimeNode[];
  indicators: IndicatorConfig[];
  indicatorDefinitions: IndicatorDefinition[];
  topicIndicators: TopicIndicator[];
  topicMemberships: TopicUnitMembership[];
  unitIndicatorAllocations: UnitIndicatorAllocation[];
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
  roles: RbacRole[];
  users: User[];
  currentUser: User | null;
}

export interface AppState extends AppData {
  updateProject: (updates: Partial<Project>) => void;
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
  saveIndicatorDefinition: (definition: IndicatorDefinition) => void;
  saveTopicIndicators: (rows: TopicIndicator[]) => void;
  publishTopicIndicators: (topicId: string, operatorName: string) => void;
  saveTopicMembership: (membership: TopicUnitMembership) => void;
  toggleTopicMembership: (id: string, enabled: boolean) => void;
  saveUnitAllocations: (rows: UnitIndicatorAllocation[]) => void;
  publishUnitAllocations: (topicId: string, operatorName: string) => void;
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
  addSelfFundedProject: (project: SelfFundedProject, operatorId: string) => void;
  saveArchiveSubmission: (submission: ArchiveSubmission) => void;
  submitArchive: (id: string, operatorId: string) => void;
  reviewArchive: (id: string, action: ArchiveAction, operatorId: string, opinion: string) => void;
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
  addRole: (role: RbacRole) => void;
  updateRole: (id: string, updates: Partial<RbacRole>) => void;
  toggleRoleEnabled: (id: string, enabled: boolean) => void;
  removeRole: (id: string) => void;
  resetToMock: () => void;
}

export function createInitialState(): AppData {
  const normalizedAchievements = [...MOCK_ACHIEVEMENTS, ...MOCK_WORKFLOW_ACHIEVEMENTS].map((achievement): Achievement => {
    const statusMap: Record<string, Achievement['status']> = {
      草稿: achievement.achievementType === '人才培养' ? '正式成果草稿' : '预审草稿',
      已提交: '预审初审中', 审批中: '预审初审中', 审批通过: '已生效',
      审批不通过: '预审退回', 退回修改: '预审退回',
    };
    const status = statusMap[achievement.status] ?? achievement.status;
    const membership = MOCK_TOPIC_MEMBERSHIPS.find((item) => item.topicId === achievement.topicId && item.unitId === achievement.unitId);
    const allocation = MOCK_UNIT_INDICATOR_ALLOCATIONS.find((item) => item.topicId === achievement.topicId && item.unitId === achievement.unitId && item.achievementType === achievement.achievementType);
    return { ...achievement, status, countsToIndicator: status === '已生效', uploadUnitId: achievement.uploadUnitId ?? achievement.unitId, topicUnitMembershipId: achievement.topicUnitMembershipId ?? membership?.id, unitIndicatorAllocationId: achievement.unitIndicatorAllocationId ?? allocation?.id, recordVersion: achievement.recordVersion ?? 1, history: achievement.history ?? [] };
  });
  return structuredClone({
    project: MOCK_PROJECT,
    units: MOCK_UNITS,
    topics: MOCK_TOPICS,
    nodes: MOCK_TIME_NODES,
    indicators: MOCK_INDICATORS,
    indicatorDefinitions: MOCK_INDICATOR_DEFINITIONS,
    topicIndicators: MOCK_TOPIC_INDICATORS,
    topicMemberships: MOCK_TOPIC_MEMBERSHIPS,
    unitIndicatorAllocations: MOCK_UNIT_INDICATOR_ALLOCATIONS,
    warningRules: MOCK_WARNING_RULES,
    achievements: normalizedAchievements,
    approvalRecords: MOCK_APPROVAL_RECORDS,
    reportTasks: MOCK_REPORT_TASKS,
    reports: MOCK_REPORTS,
    selfFundedProjects: MOCK_SELF_FUNDED_PROJECTS,
    archiveCategories: MOCK_ARCHIVE_CATEGORIES,
    archiveMaterials: MOCK_ARCHIVE_MATERIALS,
    archiveRequirements: MOCK_ARCHIVE_REQUIREMENTS,
    archiveSubmissions: MOCK_ARCHIVE_SUBMISSIONS,
    topicPowerGridRequirements: MOCK_TOPIC_POWER_GRID_REQUIREMENTS,
    roles: MOCK_ROLES,
    users: MOCK_USERS,
    currentUser: null,
  });
}

export function visibleTopics(user: User, topics: Topic[]): Topic[] {
  return filterByTopicScope(user, topics);
}

const stateCreator: StateCreator<AppState> = (set, get) => ({
  ...createInitialState(),
  updateProject: (updates) => set((state) => ({ project: { ...state.project, ...updates } })),
  addUnit: (unit) => set((state) => ({ units: [...state.units, unit] })),
  updateUnit: (id, updates) => set((state) => ({ units: state.units.map((unit) => unit.id === id ? { ...unit, ...updates } : unit) })),
  removeUnit: (id) => set((state) => ({ units: state.units.filter((unit) => unit.id !== id) })),
  addTopic: (topic) => set((state) => ({
    topics: [...state.topics, topic],
    topicMemberships: [...state.topicMemberships, { id: `membership-${topic.id}-${topic.leadingUnitId}`, topicId: topic.id, unitId: topic.leadingUnitId, membershipType: 'LEAD', principalName: topic.principalName, contactName: topic.contactName, contactPhone: topic.contactPhone, contactEmail: topic.contactEmail, enabled: true, createdAt: today(), updatedAt: today() }],
  })),
  updateTopic: (id, updates) => set((state) => {
    const current = state.topics.find((topic) => topic.id === id);
    if (!current) return {};
    const topics = state.topics.map((topic) => topic.id === id ? { ...topic, ...updates } : topic);
    if (!updates.leadingUnitId || updates.leadingUnitId === current.leadingUnitId) return { topics };
    const withoutOldLead = state.topicMemberships.filter((item) => !(item.topicId === id && item.membershipType === 'LEAD'));
    const existing = withoutOldLead.find((item) => item.topicId === id && item.unitId === updates.leadingUnitId);
    const newLead: TopicUnitMembership = existing
      ? { ...existing, membershipType: 'LEAD', enabled: true, updatedAt: today() }
      : { id: `membership-${id}-${updates.leadingUnitId}`, topicId: id, unitId: updates.leadingUnitId, membershipType: 'LEAD', enabled: true, createdAt: today(), updatedAt: today() };
    return { topics, topicMemberships: [...withoutOldLead.filter((item) => item.id !== existing?.id), newLead] };
  }),
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
  saveIndicatorDefinition: (definition) => set((state) => ({ indicatorDefinitions: state.indicatorDefinitions.some((item) => item.id === definition.id) ? state.indicatorDefinitions.map((item) => item.id === definition.id ? definition : item) : [...state.indicatorDefinitions, definition] })),
  saveTopicIndicators: (rows) => set((state) => ({ topicIndicators: [...state.topicIndicators.filter((item) => !rows.some((row) => row.id === item.id)), ...rows] })),
  publishTopicIndicators: (topicId, operatorName) => set((state) => ({ topicIndicators: state.topicIndicators.map((item) => item.topicId === topicId ? { ...item, status: '已下发', version: item.version + 1, publishedAt: new Date().toISOString(), publishedBy: operatorName, updatedAt: today() } : item) })),
  saveTopicMembership: (membership) => set((state) => ({
    topicMemberships: state.topicMemberships.some((item) => item.id === membership.id) ? state.topicMemberships.map((item) => item.id === membership.id ? membership : item) : [...state.topicMemberships, membership],
    users: state.users.map((user) => user.unitId === membership.unitId && membership.enabled ? { ...user, dataScope: 'TOPICS', topicIds: [...new Set([...(user.topicIds ?? []), membership.topicId])], topicId: user.topicId ?? membership.topicId } : user),
  })),
  toggleTopicMembership: (id, enabled) => set((state) => {
    const membership = state.topicMemberships.find((item) => item.id === id);
    if (!membership || membership.membershipType === 'LEAD') return {};
    return {
      topicMemberships: state.topicMemberships.map((item) => item.id === id ? { ...item, enabled, updatedAt: today() } : item),
      users: state.users.map((user) => user.unitId === membership.unitId ? { ...user, topicIds: enabled ? [...new Set([...(user.topicIds ?? []), membership.topicId])] : (user.topicIds ?? []).filter((topicId) => topicId !== membership.topicId) } : user),
    };
  }),
  saveUnitAllocations: (rows) => set((state) => ({ unitIndicatorAllocations: [...state.unitIndicatorAllocations.filter((item) => !rows.some((row) => row.id === item.id)), ...rows] })),
  publishUnitAllocations: (topicId, operatorName) => set((state) => ({ unitIndicatorAllocations: state.unitIndicatorAllocations.map((item) => item.topicId === topicId ? { ...item, status: '已下发', version: item.version + 1, publishedAt: new Date().toISOString(), publishedBy: operatorName, updatedAt: today() } : item) })),
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
    if (!canPerform(operator, get().roles, 'achievement.submit') || !canAccessTopic(operator, current.topicId)) throw new Error('没有该课题成果的提交权限');
    if (!['SUBMIT_PRE_REVIEW', 'REGISTER_EXTERNAL_SUBMISSION', 'START_FORMAL', 'SUBMIT_FORMAL'].includes(action)) throw new Error('该动作不是成果提交动作');
    const nextStatus = nextAchievementStatus(current.status as Parameters<typeof nextAchievementStatus>[0], action);
    set((state) => ({ achievements: state.achievements.map((achievement) => achievement.id === id ? {
      ...achievement, status: nextStatus, submittedAt: action.startsWith('SUBMIT') ? today() : achievement.submittedAt,
      updatedAt: today(), countsToIndicator: false, recordVersion: (achievement.recordVersion ?? 0) + 1,
      history: [...(achievement.history ?? []), { id: `history-${Date.now()}-${id}`, action, fromStatus: achievement.status, toStatus: nextStatus, operatorId, operatorName: operator.name, operatedAt: new Date().toISOString(), version: (achievement.recordVersion ?? 0) + 1 }],
    } : achievement) }));
  },
  reviewAchievement: (id, action, operatorId, opinion) => {
    const current = get().achievements.find((achievement) => achievement.id === id);
    if (!current) throw new Error('成果不存在');
    const operator = get().users.find((user) => user.id === operatorId);
    if (!operator) throw new Error('审批人不存在');
    const atFinalLevel = current.status.includes('终审中');
    if ((action === 'APPROVE_INITIAL' || (action === 'RETURN' && !atFinalLevel)) && !canPerform(operator, get().roles, 'achievement.initial.approve')) throw new Error('没有成果初审权限');
    if ((action === 'APPROVE_FINAL' || (action === 'RETURN' && atFinalLevel)) && !canPerform(operator, get().roles, 'achievement.final.approve')) throw new Error('没有成果终审权限');
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
        approvalOpinion: opinion, approver: operator.name, approvedAt: today(), returnReason: action === 'RETURN' ? opinion : undefined,
        recordVersion: (achievement.recordVersion ?? 0) + 1,
        history: [...(achievement.history ?? []), { id: `history-${Date.now()}-${id}`, action, fromStatus: achievement.status, toStatus: nextStatus, operatorId, operatorName: operator.name, opinion, operatedAt: new Date().toISOString(), version: (achievement.recordVersion ?? 0) + 1 }],
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
    if (!canPerform(operator, get().roles, 'report.submit') || !canAccessTopic(operator, report.topicId)) throw new Error('没有该课题报告的提交权限');
    const status = nextReportStatus(report.status, 'SUBMIT');
    set((state) => ({ reports: state.reports.map((item) => item.id === id ? { ...item, status, submittedAt: today(), updatedAt: today() } : item) }));
  },
  reviewReport: (id, action, operatorId, opinion) => {
    const report = get().reports.find((item) => item.id === id);
    const operator = get().users.find((item) => item.id === operatorId);
    if (!report || !operator) throw new Error('报告或审批人不存在');
    const atFinalLevel = report.status === '终审中';
    if ((action === 'APPROVE_INITIAL' || (action === 'RETURN' && !atFinalLevel)) && !canPerform(operator, get().roles, 'report.initial.approve')) throw new Error('没有报告初审权限');
    if ((action === 'APPROVE_FINAL' || (action === 'RETURN' && atFinalLevel)) && !canPerform(operator, get().roles, 'report.final.approve')) throw new Error('没有报告终审权限');
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
  addSelfFundedProject: (project, operatorId) => {
    const operator = get().users.find((item) => item.id === operatorId);
    if (!operator || !canPerform(operator, get().roles, 'self-funded.manage') || !canAccessTopic(operator, project.topicId)) throw new Error('没有该课题配套自筹项目的维护权限');
    set((state) => ({ selfFundedProjects: [...state.selfFundedProjects, project] }));
  },
  saveArchiveSubmission: (submission) => set((state) => ({
    archiveSubmissions: state.archiveSubmissions.some((item) => item.id === submission.id)
      ? state.archiveSubmissions.map((item) => item.id === submission.id ? submission : item)
      : [...state.archiveSubmissions, submission],
  })),
  submitArchive: (id, operatorId) => {
    const submission = get().archiveSubmissions.find((item) => item.id === id);
    const operator = get().users.find((item) => item.id === operatorId);
    if (!submission || !operator) throw new Error('归档记录或操作人不存在');
    const canSubmitPublic = submission.ownerType === 'PROJECT_PUBLIC' && canPerform(operator, get().roles, 'archive.public.submit');
    const canSubmitTopic = submission.ownerType !== 'PROJECT_PUBLIC' && canPerform(operator, get().roles, 'archive.topic.submit') && canAccessTopic(operator, submission.topicId);
    if (!canSubmitPublic && !canSubmitTopic) throw new Error('没有该归档记录的提交权限');
    const status = nextArchiveStatus(submission.ownerType, submission.status, 'SUBMIT');
    set((state) => ({ archiveSubmissions: state.archiveSubmissions.map((item) => item.id === id ? { ...item, status, submittedAt: today(), updatedAt: today() } : item) }));
  },
  reviewArchive: (id, action, operatorId, opinion) => {
    const submission = get().archiveSubmissions.find((item) => item.id === id);
    const operator = get().users.find((item) => item.id === operatorId);
    if (!submission || !operator) throw new Error('归档记录或审批人不存在');
    const atFinalLevel = submission.status === '终审中';
    if ((action === 'APPROVE_INITIAL' || (action === 'RETURN' && !atFinalLevel)) && !canPerform(operator, get().roles, 'archive.initial.approve')) throw new Error('没有归档材料初审权限');
    if ((action === 'APPROVE_FINAL' || (action === 'RETURN' && atFinalLevel)) && !canPerform(operator, get().roles, 'archive.final.approve')) throw new Error('没有归档材料终审权限');
    const status = nextArchiveStatus(submission.ownerType, submission.status, action);
    const record: ApprovalRecord = {
      id: `approval-${Date.now()}-${id}`, businessType: 'ARCHIVE', businessId: id, stage: 'ARCHIVE',
      level: atFinalLevel ? 'FINAL' : 'INITIAL', decision: action === 'RETURN' ? 'RETURNED' : 'APPROVED',
      opinion, operatorId, operatedAt: new Date().toISOString(), submittedVersion: submission.version,
    };
    set((state) => ({
      archiveSubmissions: state.archiveSubmissions.map((item) => item.id === id ? { ...item, status, updatedAt: today() } : item),
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
    const role = getRole(user, get().roles);
    if (!role) return { success: false, error: '该账号尚未分配角色' };
    if (!role.enabled) return { success: false, error: '该账号所属角色已被停用' };
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
  addRole: (role) => set((state) => ({ roles: [...state.roles, role] })),
  updateRole: (id, updates) => set((state) => ({ roles: state.roles.map((role) => role.id === id && !role.builtIn ? { ...role, ...updates, updatedAt: new Date().toISOString() } : role) })),
  toggleRoleEnabled: (id, enabled) => set((state) => ({ roles: state.roles.map((role) => role.id === id && !role.builtIn ? { ...role, enabled, updatedAt: new Date().toISOString() } : role) })),
  removeRole: (id) => set((state) => {
    const role = state.roles.find((item) => item.id === id);
    if (!role || role.builtIn || state.users.some((user) => user.roleId === id)) return {};
    return { roles: state.roles.filter((item) => item.id !== id) };
  }),
  resetToMock: () => set(createInitialState()),
});

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function createAppStore() {
  return createStore<AppState>()(stateCreator);
}

export const useAppStore = create<AppState>()(
  persist(stateCreator, { name: 'gzxm-research-management-v3', version: 3 }),
);

export const canEditAchievement = (status: string): boolean => ['草稿', '退回修改', '预审草稿', '预审退回', '正式成果草稿', '正式退回'].includes(status);

export const canAccess = (role: UserRole, module: string): boolean => {
  if (role === '系统管理员') return true;
  if (role === '项目技术负责人' || role === '科研助理') return ['research', 'archive', 'monitoring'].includes(module);
  if (role === '课题牵头单位') return ['research', 'archive', 'monitoring', 'achievement-entry'].includes(module);
  if (role === '课题承担单位') return ['research', 'archive', 'monitoring', 'achievement-entry'].includes(module);
  return false;
};
