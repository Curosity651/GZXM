import { create } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { persist } from 'zustand/middleware';
import type { StateCreator } from 'zustand';
import type {
  Achievement, ApprovalRecord, ArchiveCategory, ArchiveMaterial, ArchiveRequirement, ArchiveSubmission,
  IndicatorConfig, ProgressReport, Project, ProjectUnit, ReportTask, SelfFundedProject, TimeNode, Topic,
  TopicPowerGridRequirement, User, UserRole, WarningRule, RbacRole, IndicatorDefinition,
  TopicIndicator, TopicUnitMembership, UnitIndicatorAllocation, SubmissionSnapshot,
} from '../types';
import {
  MOCK_ACHIEVEMENTS, MOCK_APPROVAL_RECORDS, MOCK_ARCHIVE_CATEGORIES, MOCK_ARCHIVE_MATERIALS,
  MOCK_ARCHIVE_REQUIREMENTS, MOCK_ARCHIVE_SUBMISSIONS, MOCK_INDICATORS, MOCK_PROJECT, MOCK_REPORTS,
  MOCK_REPORT_TASKS, MOCK_SELF_FUNDED_PROJECTS, MOCK_TIME_NODES, MOCK_TOPICS,
  MOCK_TOPIC_POWER_GRID_REQUIREMENTS, MOCK_UNITS, MOCK_USERS, MOCK_WARNING_RULES, MOCK_WORKFLOW_ACHIEVEMENTS, MOCK_ROLES,
  MOCK_INDICATOR_DEFINITIONS, MOCK_TOPIC_INDICATORS, MOCK_TOPIC_MEMBERSHIPS, MOCK_UNIT_INDICATOR_ALLOCATIONS,
} from '../data/mock';
import { nextAchievementStatus, type AchievementAction } from '../domain/workflows';
import { isReportEditable, nextReportStatus, type ReportAction } from '../domain/report-flow';
import { canPerform, filterByTopicScope, getRole } from '../domain/permissions';
import { createDefaultTopicReportConfig, isReportOpen, isReportOverdue, topicReportWindow } from '../domain/reporting';
import { canAccessTopicByMembership, isInternalTopicUnit, isTopicLead, isTopicOperational } from '../domain/topic-access';

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
  submissionSnapshots: SubmissionSnapshot[];
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
  addTopic: (topic: Topic, operatorId: string) => void;
  updateTopic: (id: string, updates: Partial<Topic>, operatorId: string) => void;
  toggleTopicEnabled: (id: string, enabled: boolean, operatorId: string) => void;
  removeTopic: (id: string) => void;
  addNode: (node: TimeNode) => void;
  updateNode: (id: string, updates: Partial<TimeNode>) => void;
  removeNode: (id: string) => void;
  addIndicator: (indicator: IndicatorConfig) => void;
  updateIndicator: (id: string, updates: Partial<IndicatorConfig>) => void;
  removeIndicator: (id: string) => void;
  batchUpdateIndicators: (updates: { id: string; plannedQuantity: number }[]) => void;
  saveIndicatorDefinition: (definition: IndicatorDefinition) => void;
  saveTopicIndicators: (rows: TopicIndicator[], operatorId: string) => void;
  publishTopicIndicators: (topicId: string, operatorId: string) => void;
  saveTopicMembership: (membership: TopicUnitMembership, operatorId: string) => void;
  toggleTopicMembership: (id: string, enabled: boolean, operatorId: string) => void;
  saveUnitAllocations: (rows: UnitIndicatorAllocation[], operatorId: string) => void;
  publishUnitAllocations: (topicId: string, nodeId: string, operatorId: string) => void;
  updateWarningRule: (id: string, updates: Partial<WarningRule>) => void;
  addAchievement: (achievement: Achievement, operatorId: string) => void;
  updateAchievement: (id: string, updates: Partial<Achievement>, operatorId: string) => void;
  advanceAchievement: (id: string, action: AchievementAction, operatorId: string) => void;
  reviewAchievement: (id: string, action: AchievementAction, operatorId: string, opinion: string) => void;
  saveReport: (report: ProgressReport, operatorId: string) => void;
  saveReportTask: (task: ReportTask, operatorId: string) => void;
  submitReport: (id: string, operatorId: string) => void;
  reviewReport: (id: string, action: ReportAction, operatorId: string, opinion: string) => void;
  addSelfFundedProject: (project: SelfFundedProject, operatorId: string) => void;
  saveArchiveSubmission: (submission: ArchiveSubmission, operatorId: string) => void;
  submitArchive: (id: string, operatorId: string) => void;
  addArchiveCategory: (category: ArchiveCategory) => void;
  updateArchiveCategory: (id: string, updates: Partial<ArchiveCategory>) => void;
  removeArchiveCategory: (id: string) => void;
  addArchiveMaterial: (material: ArchiveMaterial) => void;
  updateArchiveMaterial: (id: string, updates: Partial<ArchiveMaterial>) => void;
  removeArchiveMaterial: (id: string) => void;
  addArchiveRequirement: (req: ArchiveRequirement, operatorId: string) => void;
  updateArchiveRequirement: (id: string, updates: Partial<ArchiveRequirement>) => void;
  removeArchiveRequirement: (id: string, operatorId: string) => void;
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
    const generalDefinition = MOCK_INDICATOR_DEFINITIONS.find((item) => item.name === achievement.achievementType);
    const allocation = MOCK_UNIT_INDICATOR_ALLOCATIONS.find((item) => item.topicId === achievement.topicId && item.unitId === achievement.unitId && item.indicatorDefinitionId === (achievement.indicatorDefinitionId ?? generalDefinition?.id));
    const submittedVersion = achievement.submittedVersion ?? (['预审草稿', '预审退回', '正式成果草稿', '正式退回'].includes(status) ? 0 : 1);
    return { ...achievement, status, countsToIndicator: status === '已生效', uploadUnitId: achievement.uploadUnitId ?? achievement.unitId, topicUnitMembershipId: achievement.topicUnitMembershipId ?? membership?.id, unitIndicatorAllocationId: achievement.unitIndicatorAllocationId ?? allocation?.id, recordVersion: achievement.recordVersion ?? 1, submittedVersion, history: achievement.history ?? [] };
  });
  const normalizedReports = MOCK_REPORTS.map((report): ProgressReport => ({
    ...report,
    recordVersion: report.recordVersion ?? report.version ?? 1,
    submittedVersion: report.submittedVersion ?? (report.status === '草稿' || report.status === '退回修改' ? 0 : 1),
  }));
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
    submissionSnapshots: [],
    reportTasks: MOCK_REPORT_TASKS,
    reports: normalizedReports,
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
  addTopic: (topic, operatorId) => {
    const operator = get().users.find((item) => item.id === operatorId);
    if (!operator || !canPerform(operator, get().roles, 'topic.manage')) throw new Error('没有新建课题的权限');
    set((state) => ({
      topics: [...state.topics, topic],
      topicMemberships: topic.leadingUnitId
        ? [...state.topicMemberships, { id: `membership-${topic.id}-${topic.leadingUnitId}`, topicId: topic.id, unitId: topic.leadingUnitId, membershipType: 'LEAD', principalName: topic.principalName, contactName: topic.contactName, contactPhone: topic.contactPhone, contactEmail: topic.contactEmail, enabled: true, createdAt: today(), updatedAt: today() }]
        : state.topicMemberships,
      users: state.users.map((user) => user.unitId === topic.leadingUnitId
        ? { ...user, dataScope: 'TOPICS', topicIds: [...new Set([...(user.topicIds ?? []), topic.id])], topicId: user.topicId ?? topic.id }
        : user),
    }));
  },
  updateTopic: (id, updates, operatorId) => {
    const operator = get().users.find((item) => item.id === operatorId);
    if (!operator || !canPerform(operator, get().roles, 'topic.manage')) throw new Error('没有编辑课题的权限');
    set((state) => {
    const current = state.topics.find((topic) => topic.id === id);
    if (!current) return {};
    const topics = state.topics.map((topic) => topic.id === id ? { ...topic, ...updates } : topic);
    if (!updates.leadingUnitId || updates.leadingUnitId === current.leadingUnitId) {
      const topicMemberships = state.topicMemberships.map((item) => item.topicId === id && item.membershipType === 'LEAD' ? {
        ...item,
        principalName: updates.principalName ?? item.principalName,
        contactName: updates.contactName ?? item.contactName,
        contactPhone: updates.contactPhone ?? item.contactPhone,
        contactEmail: updates.contactEmail ?? item.contactEmail,
        updatedAt: today(),
      } : item);
      return { topics, topicMemberships };
    }
    const withoutOldLead = state.topicMemberships.filter((item) => !(item.topicId === id && item.membershipType === 'LEAD'));
    const existing = withoutOldLead.find((item) => item.topicId === id && item.unitId === updates.leadingUnitId);
    const newLead: TopicUnitMembership = existing
      ? { ...existing, membershipType: 'LEAD', principalName: updates.principalName, contactName: updates.contactName, contactPhone: updates.contactPhone, contactEmail: updates.contactEmail, enabled: true, updatedAt: today() }
      : { id: `membership-${id}-${updates.leadingUnitId}`, topicId: id, unitId: updates.leadingUnitId, membershipType: 'LEAD', principalName: updates.principalName, contactName: updates.contactName, contactPhone: updates.contactPhone, contactEmail: updates.contactEmail, enabled: true, createdAt: today(), updatedAt: today() };
    const topicMemberships = [...withoutOldLead.filter((item) => item.id !== existing?.id), newLead];
    const users = state.users.map((user) => {
      if (user.unitId === updates.leadingUnitId) {
        return { ...user, dataScope: 'TOPICS' as const, topicIds: [...new Set([...(user.topicIds ?? []), id])], topicId: user.topicId ?? id };
      }
      if (user.unitId !== current.leadingUnitId || topicMemberships.some((item) => item.topicId === id && item.unitId === user.unitId && item.enabled)) return user;
      const topicIds = (user.topicIds ?? []).filter((topicId) => topicId !== id);
      return { ...user, topicIds, topicId: user.topicId === id ? topicIds[0] : user.topicId };
    });
    return { topics, topicMemberships, users };
    });
  },
  toggleTopicEnabled: (id, enabled, operatorId) => {
    const operator = get().users.find((item) => item.id === operatorId);
    if (!operator || !canPerform(operator, get().roles, 'topic.manage')) throw new Error('没有启停课题的权限');
    set((state) => ({ topics: state.topics.map((topic) => topic.id === id ? { ...topic, enabled } : topic) }));
  },
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
  saveTopicIndicators: (rows, operatorId) => {
    const operator = get().users.find((item) => item.id === operatorId);
    const topic = get().topics.find((item) => item.id === rows[0]?.topicId);
    if (!operator || !isTopicOperational(topic) || !canPerform(operator, get().roles, 'topic-indicator.publish')) throw new Error('没有编辑课题总体指标的权限，或课题当前不可操作');
    set((state) => ({ topicIndicators: [...state.topicIndicators.filter((item) => !rows.some((row) => row.id === item.id)), ...rows] }));
  },
  publishTopicIndicators: (topicId, operatorId) => {
    const operator = get().users.find((item) => item.id === operatorId);
    if (!operator || !isTopicOperational(get().topics.find((item) => item.id === topicId)) || !canPerform(operator, get().roles, 'topic-indicator.publish')) throw new Error('没有下发课题总体指标的权限，或课题当前不可操作');
    set((state) => ({ topicIndicators: state.topicIndicators.map((item) => item.topicId === topicId ? { ...item, status: '已下发', version: item.version + 1, publishedAt: new Date().toISOString(), publishedBy: operator.name, updatedAt: today() } : item) }));
  },
  saveTopicMembership: (membership, operatorId) => {
    const operator = get().users.find((item) => item.id === operatorId);
    const allowed = Boolean(operator && isTopicOperational(get().topics.find((item) => item.id === membership.topicId)) && (canPerform(operator, get().roles, 'topic.manage') || (canPerform(operator, get().roles, 'topic-unit.manage') && isTopicLead(operator, membership.topicId, get().topicMemberships))));
    if (!allowed) throw new Error('没有维护该课题承担单位的权限');
    set((state) => ({
      topicMemberships: state.topicMemberships.some((item) => item.id === membership.id) ? state.topicMemberships.map((item) => item.id === membership.id ? membership : item) : [...state.topicMemberships, membership],
      users: state.users.map((user) => user.unitId === membership.unitId && membership.enabled ? { ...user, dataScope: 'TOPICS', topicIds: [...new Set([...(user.topicIds ?? []), membership.topicId])], topicId: user.topicId ?? membership.topicId } : user),
    }));
  },
  toggleTopicMembership: (id, enabled, operatorId) => {
    const membership = get().topicMemberships.find((item) => item.id === id);
    const operator = get().users.find((item) => item.id === operatorId);
    const allowed = Boolean(membership && operator && isTopicOperational(get().topics.find((item) => item.id === membership.topicId)) && (canPerform(operator, get().roles, 'topic.manage') || (canPerform(operator, get().roles, 'topic-unit.manage') && isTopicLead(operator, membership.topicId, get().topicMemberships))));
    if (!allowed) throw new Error('没有维护该课题承担单位的权限');
    set((state) => {
      const membership = state.topicMemberships.find((item) => item.id === id);
      if (!membership || membership.membershipType === 'LEAD') return {};
      return {
        topicMemberships: state.topicMemberships.map((item) => item.id === id ? { ...item, enabled, updatedAt: today() } : item),
        users: state.users.map((user) => {
          if (user.unitId !== membership.unitId) return user;
          const topicIds = enabled ? [...new Set([...(user.topicIds ?? []), membership.topicId])] : (user.topicIds ?? []).filter((topicId) => topicId !== membership.topicId);
          return { ...user, topicIds, topicId: enabled ? user.topicId ?? membership.topicId : user.topicId === membership.topicId ? topicIds[0] : user.topicId };
        }),
      };
    });
  },
  saveUnitAllocations: (rows, operatorId) => {
    const topicId = rows[0]?.topicId;
    const operator = get().users.find((item) => item.id === operatorId);
    if (!topicId || !operator || !isTopicOperational(get().topics.find((item) => item.id === topicId)) || !canPerform(operator, get().roles, 'unit-allocation.manage') || !isTopicLead(operator, topicId, get().topicMemberships)) throw new Error('只有该课题牵头单位可以编辑正常实施课题的单位指标分配');
    set((state) => ({ unitIndicatorAllocations: [...state.unitIndicatorAllocations.filter((item) => !rows.some((row) => row.id === item.id)), ...rows] }));
  },
  publishUnitAllocations: (topicId, nodeId, operatorId) => {
    const operator = get().users.find((item) => item.id === operatorId);
    if (!operator || !isTopicOperational(get().topics.find((item) => item.id === topicId)) || !canPerform(operator, get().roles, 'unit-allocation.publish') || !isTopicLead(operator, topicId, get().topicMemberships)) throw new Error('只有该课题牵头单位可以下发正常实施课题的单位指标分配');
    set((state) => ({ unitIndicatorAllocations: state.unitIndicatorAllocations.map((item) => item.topicId === topicId && item.nodeId === nodeId ? { ...item, status: '已下发', version: item.version + 1, publishedAt: new Date().toISOString(), publishedBy: operator.name, updatedAt: today() } : item) }));
  },
  updateWarningRule: (id, updates) => set((state) => ({ warningRules: state.warningRules.map((rule) => rule.id === id ? { ...rule, ...updates } : rule) })),
  addAchievement: (achievement, operatorId) => {
    const operator = get().users.find((item) => item.id === operatorId);
    if (!operator || !isTopicOperational(get().topics.find((item) => item.id === achievement.topicId)) || !canPerform(operator, get().roles, 'achievement.submit') || !canAccessTopicByMembership(operator, achievement.topicId, get().topicMemberships) || (achievement.uploadUnitId ?? achievement.unitId) !== operator.unitId) throw new Error('没有在该课题新增成果的权限');
    set((state) => ({ achievements: [...state.achievements, { ...achievement, recordVersion: achievement.recordVersion ?? 1, submittedVersion: achievement.submittedVersion ?? 0 }] }));
  },
  updateAchievement: (id, updates, operatorId) => {
    const current = get().achievements.find((item) => item.id === id);
    const operator = get().users.find((item) => item.id === operatorId);
    if (!current || !operator || !isTopicOperational(get().topics.find((item) => item.id === current.topicId)) || !canPerform(operator, get().roles, 'achievement.submit') || !canAccessTopicByMembership(operator, current.topicId, get().topicMemberships) || (current.uploadUnitId ?? current.unitId) !== operator.unitId) throw new Error('没有修改该课题成果的权限');
    set((state) => ({ achievements: state.achievements.map((achievement) => achievement.id === id ? { ...achievement, ...updates, recordVersion: (achievement.recordVersion ?? 0) + 1, updatedAt: today() } : achievement) }));
  },
  advanceAchievement: (id, action, operatorId) => {
    const current = get().achievements.find((achievement) => achievement.id === id);
    const operator = get().users.find((user) => user.id === operatorId);
    if (!current || !operator || !isTopicOperational(get().topics.find((item) => item.id === current.topicId))) throw new Error('成果、操作人不存在或课题当前不可操作');
    if (!canPerform(operator, get().roles, 'achievement.submit') || !canAccessTopicByMembership(operator, current.topicId, get().topicMemberships) || (current.uploadUnitId ?? current.unitId) !== operator.unitId) throw new Error('没有该课题成果的提交权限');
    if (!['SUBMIT_PRE_REVIEW', 'REGISTER_EXTERNAL_SUBMISSION', 'START_FORMAL', 'SUBMIT_FORMAL', 'SUBMIT_SUPPLEMENT'].includes(action)) throw new Error('该动作不是成果提交动作');
    const nextStatus = nextAchievementStatus(current.status as Parameters<typeof nextAchievementStatus>[0], action, current.achievementType);
    const isSubmission = action.startsWith('SUBMIT');
    const operatedAt = new Date().toISOString();
    set((state) => {
      const updated = { ...current, status: nextStatus, submittedAt: isSubmission ? today() : current.submittedAt,
        updatedAt: today(), countsToIndicator: false, recordVersion: (current.recordVersion ?? 0) + 1,
        submittedVersion: isSubmission ? (current.submittedVersion ?? 0) + 1 : current.submittedVersion ?? 0,
        materials: isSubmission ? current.materials.map((material) => material.status === '未提交' ? { ...material, status: '待审核' as const } : material) : current.materials,
        history: [...(current.history ?? []), { id: `history-${Date.now()}-${id}`, action, fromStatus: current.status, toStatus: nextStatus, operatorId, operatorName: operator.name, operatedAt, version: (current.recordVersion ?? 0) + 1 }],
      };
      const snapshot: SubmissionSnapshot | undefined = isSubmission ? {
        id: `snapshot-achievement-${Date.now()}-${id}`, businessType: 'ACHIEVEMENT', businessId: id,
        stage: action === 'SUBMIT_PRE_REVIEW' ? 'PRE_REVIEW' : action === 'SUBMIT_SUPPLEMENT' ? 'SUPPLEMENT' : 'FORMAL',
        submittedVersion: updated.submittedVersion, submittedAt: operatedAt, submitterId: operatorId,
        payload: structuredClone(updated),
      } : undefined;
      return {
        achievements: state.achievements.map((achievement) => achievement.id === id ? updated : achievement),
        submissionSnapshots: snapshot ? [...state.submissionSnapshots, snapshot] : state.submissionSnapshots,
      };
    });
  },
  reviewAchievement: (id, action, operatorId, opinion) => {
    const current = get().achievements.find((achievement) => achievement.id === id);
    if (!current || !isTopicOperational(get().topics.find((item) => item.id === current.topicId))) throw new Error('成果不存在或课题当前不可操作');
    const operator = get().users.find((user) => user.id === operatorId);
    if (!operator) throw new Error('审批人不存在');
    const atFinalLevel = current.status.includes('终审中');
    if ((action === 'APPROVE_INITIAL' || (action === 'RETURN' && !atFinalLevel)) && !canPerform(operator, get().roles, 'achievement.initial.approve')) throw new Error('没有成果初审权限');
    if ((action === 'APPROVE_FINAL' || (action === 'RETURN' && atFinalLevel)) && !canPerform(operator, get().roles, 'achievement.final.approve')) throw new Error('没有成果终审权限');
    const workflowStatuses = ['预审草稿', '预审初审中', '预审终审中', '预审退回', '预审通过', '正式成果草稿', '正式初审中', '正式终审中', '正式退回', '待见刊补充', '待授权补充', '补充初审中', '补充终审中', '补充退回', '已生效'];
    if (!workflowStatuses.includes(current.status)) throw new Error('该成果仍使用旧版流程，不能执行新版审批');
    const nextStatus = nextAchievementStatus(current.status as Parameters<typeof nextAchievementStatus>[0], action, current.achievementType);
    const record: ApprovalRecord = {
      id: `approval-${Date.now()}-${id}`,
      businessType: 'ACHIEVEMENT', businessId: id,
      stage: current.status.startsWith('预审') ? 'PRE_REVIEW' : current.status.startsWith('补充') ? 'SUPPLEMENT' : 'FORMAL',
      level: action === 'APPROVE_FINAL' || atFinalLevel ? 'FINAL' : 'INITIAL',
      decision: action === 'RETURN' ? 'RETURNED' : 'APPROVED',
      opinion, operatorId, operatedAt: new Date().toISOString(), submittedVersion: current.submittedVersion ?? 1,
    };
    set((state) => ({
      achievements: state.achievements.map((achievement) => achievement.id === id ? {
        ...achievement, status: nextStatus, countsToIndicator: nextStatus === '已生效', updatedAt: today(),
        materials: achievement.materials.map((material) => material.status === '待审核' && (action === 'RETURN' || action === 'APPROVE_FINAL')
          ? { ...material, status: action === 'RETURN' ? '退回修改' : '审核通过', reviewedAt: today(), reviewOpinion: action === 'RETURN' ? opinion : material.reviewOpinion }
          : material),
        approvalOpinion: opinion, approver: operator.name, approvedAt: today(), returnReason: action === 'RETURN' ? opinion : undefined,
        recordVersion: (achievement.recordVersion ?? 0) + 1,
        history: [...(achievement.history ?? []), { id: `history-${Date.now()}-${id}`, action, fromStatus: achievement.status, toStatus: nextStatus, operatorId, operatorName: operator.name, opinion, operatedAt: new Date().toISOString(), version: (achievement.recordVersion ?? 0) + 1 }],
      } : achievement),
      approvalRecords: [...state.approvalRecords, record],
    }));
  },
  saveReport: (report, operatorId) => {
    const operator = get().users.find((item) => item.id === operatorId);
    const task = get().reportTasks.find((item) => item.id === report.taskId);
    const topic = get().topics.find((item) => item.id === report.topicId);
    const existing = get().reports.find((item) => item.id === report.id);
    if (!operator || !task || !topic) throw new Error('报告、报告期次或操作账号不存在');
    if (!operator.enabled || !canPerform(operator, get().roles, 'report.submit') || !isTopicLead(operator, topic.id, get().topicMemberships)) throw new Error('只有该课题牵头单位可以保存月季报');
    if (topic.enabled === false || topic.status === '已暂停' || topic.status === '已结题') throw new Error('当前课题已停用，不能保存月季报');
    if (task.topicId !== report.topicId || task.reportType !== report.reportType) throw new Error('报告与报告期次不一致');
    if (!isReportOpen(task)) throw new Error(`该报告将于 ${task.openDate} 开放填报`);
    if (existing && !isReportEditable(existing.status)) throw new Error('当前报告状态不可修改');
    const normalized = { ...report, overdue: isReportOverdue(task.deadline, report.submittedAt),
      recordVersion: (existing?.recordVersion ?? existing?.version ?? 0) + 1,
      submittedVersion: existing?.submittedVersion ?? 0 };
    set((state) => ({
      reports: state.reports.some((item) => item.id === normalized.id)
        ? state.reports.map((item) => item.id === normalized.id ? normalized : item)
        : [...state.reports, normalized],
    }));
  },
  saveReportTask: (task, operatorId) => {
    const operator = get().users.find((item) => item.id === operatorId);
    const topic = get().topics.find((item) => item.id === task.topicId);
    if (!operator || !topic) throw new Error('课题或操作账号不存在');
    if (!operator.enabled || !canPerform(operator, get().roles, 'report.submit') || !isTopicLead(operator, topic.id, get().topicMemberships)) throw new Error('只有该课题牵头单位可以新建月季报');
    if (topic.enabled === false || topic.status === '已暂停' || topic.status === '已结题') throw new Error('当前课题已停用，不能新建月季报');
    if (!topic.reportConfig) throw new Error('该课题尚未配置月季报规则');
    const window = topicReportWindow(topic.reportConfig, task.reportType, task.year, task.period);
    if (window.openDate !== task.openDate || window.deadline !== task.deadline) throw new Error('报告时间与课题配置不一致');
    if (!isReportOpen(task)) throw new Error(`该报告将于 ${task.openDate} 开放填报`);
    const duplicate = get().reportTasks.find((item) => item.id !== task.id && item.topicId === task.topicId && item.reportType === task.reportType && item.year === task.year && item.period === task.period);
    if (duplicate) throw new Error('该课题当前期次的报告已经存在');
    set((state) => ({ reportTasks: state.reportTasks.some((item) => item.id === task.id) ? state.reportTasks.map((item) => item.id === task.id ? task : item) : [...state.reportTasks, task] }));
  },
  submitReport: (id, operatorId) => {
    const report = get().reports.find((item) => item.id === id);
    const operator = get().users.find((item) => item.id === operatorId);
    const task = report && get().reportTasks.find((item) => item.id === report.taskId);
    const topic = report && get().topics.find((item) => item.id === report.topicId);
    if (!report || !operator || !task || !topic) throw new Error('报告、报告期次或操作人不存在');
    if (!operator.enabled || !canPerform(operator, get().roles, 'report.submit') || !canAccessTopicByMembership(operator, report.topicId, get().topicMemberships) || !isTopicLead(operator, report.topicId, get().topicMemberships)) throw new Error('只有该课题牵头单位可以提交月季报');
    if (topic.enabled === false || topic.status === '已暂停' || topic.status === '已结题') throw new Error('当前课题已停用，不能提交月季报');
    if (!isReportOpen(task)) throw new Error(`该报告将于 ${task.openDate} 开放提交`);
    const status = nextReportStatus(report.status, 'SUBMIT');
    const submittedAt = today();
    const operatedAt = new Date().toISOString();
    const updated = { ...report, status, submittedAt, overdue: isReportOverdue(task.deadline, submittedAt), updatedAt: today(),
      recordVersion: (report.recordVersion ?? report.version ?? 0) + 1, submittedVersion: (report.submittedVersion ?? 0) + 1 };
    const snapshot: SubmissionSnapshot = { id: `snapshot-report-${Date.now()}-${id}`, businessType: 'REPORT', businessId: id,
      stage: 'REPORT', submittedVersion: updated.submittedVersion, submittedAt: operatedAt, submitterId: operatorId, payload: structuredClone(updated) };
    set((state) => ({ reports: state.reports.map((item) => item.id === id ? updated : item), submissionSnapshots: [...state.submissionSnapshots, snapshot] }));
  },
  reviewReport: (id, action, operatorId, opinion) => {
    const report = get().reports.find((item) => item.id === id);
    const operator = get().users.find((item) => item.id === operatorId);
    if (!report || !operator || !isTopicOperational(get().topics.find((item) => item.id === report.topicId))) throw new Error('报告、审批人不存在或课题当前不可操作');
    const atFinalLevel = report.status === '终审中';
    if ((action === 'APPROVE_INITIAL' || (action === 'RETURN' && !atFinalLevel)) && !canPerform(operator, get().roles, 'report.initial.approve')) throw new Error('没有报告初审权限');
    if ((action === 'APPROVE_FINAL' || (action === 'RETURN' && atFinalLevel)) && !canPerform(operator, get().roles, 'report.final.approve')) throw new Error('没有报告终审权限');
    const status = nextReportStatus(report.status, action);
    const record: ApprovalRecord = {
      id: `approval-${Date.now()}-${id}`, businessType: 'REPORT', businessId: id, stage: 'REPORT',
      level: atFinalLevel ? 'FINAL' : 'INITIAL', decision: action === 'RETURN' ? 'RETURNED' : 'APPROVED',
      opinion, operatorId, operatedAt: new Date().toISOString(), submittedVersion: report.submittedVersion ?? 1,
    };
    set((state) => ({
      reports: state.reports.map((item) => item.id === id ? { ...item, status, updatedAt: today(), recordVersion: (item.recordVersion ?? item.version ?? 0) + 1 } : item),
      approvalRecords: [...state.approvalRecords, record],
    }));
  },
  addSelfFundedProject: (project, operatorId) => {
    const operator = get().users.find((item) => item.id === operatorId);
    if (!operator || !isTopicOperational(get().topics.find((item) => item.id === project.topicId)) || !isInternalTopicUnit(operator) || !canPerform(operator, get().roles, 'self-funded.manage') || !canAccessTopicByMembership(operator, project.topicId, get().topicMemberships) || project.ownerUnitId !== operator.unitId) throw new Error('没有该课题配套自筹项目的维护权限');
    set((state) => ({ selfFundedProjects: [...state.selfFundedProjects, project] }));
  },
  saveArchiveSubmission: (submission, operatorId) => {
    const operator = get().users.find((item) => item.id === operatorId);
    if (!operator || !isTopicOperational(get().topics.find((item) => item.id === submission.topicId))) throw new Error('操作账号不存在或课题当前不可操作');
    const canNational = submission.ownerType === 'TOPIC_NATIONAL' && canPerform(operator, get().roles, 'archive.topic.submit') && canAccessTopicByMembership(operator, submission.topicId, get().topicMemberships) && submission.unitId === operator.unitId;
    const project = submission.ownerType === 'SELF_FUNDED' ? get().selfFundedProjects.find((item) => item.id === submission.ownerId) : undefined;
    const canSelf = Boolean(project && isInternalTopicUnit(operator) && canPerform(operator, get().roles, 'self-funded.manage') && project.ownerUnitId === operator.unitId);
    if (!canNational && !canSelf) throw new Error('没有该归档记录的编辑权限');
    set((state) => ({ archiveSubmissions: state.archiveSubmissions.some((item) => item.id === submission.id) ? state.archiveSubmissions.map((item) => item.id === submission.id ? submission : item) : [...state.archiveSubmissions, submission] }));
  },
  submitArchive: (id, operatorId) => {
    const submission = get().archiveSubmissions.find((item) => item.id === id);
    const operator = get().users.find((item) => item.id === operatorId);
    if (!submission || !operator || !isTopicOperational(get().topics.find((item) => item.id === submission.topicId))) throw new Error('归档记录、操作人不存在或课题当前不可操作');
    const canSubmitNational = submission.ownerType === 'TOPIC_NATIONAL' && canPerform(operator, get().roles, 'archive.topic.submit') && canAccessTopicByMembership(operator, submission.topicId, get().topicMemberships) && submission.unitId === operator.unitId;
    const selfProject = submission.ownerType === 'SELF_FUNDED' ? get().selfFundedProjects.find((item) => item.id === submission.ownerId) : undefined;
    const canSubmitSelf = Boolean(selfProject && isInternalTopicUnit(operator) && canPerform(operator, get().roles, 'self-funded.manage') && selfProject.ownerUnitId === operator.unitId);
    if (!canSubmitNational && !canSubmitSelf) throw new Error('没有该归档记录的提交权限');
    set((state) => ({ archiveSubmissions: state.archiveSubmissions.map((item) => item.id === id ? { ...item, status: '已归档', submittedAt: today(), updatedAt: today() } : item) }));
  },
  addArchiveCategory: (category) => set((state) => ({ archiveCategories: [...state.archiveCategories, category] })),
  updateArchiveCategory: (id, updates) => set((state) => ({ archiveCategories: state.archiveCategories.map((category) => category.id === id ? { ...category, ...updates } : category) })),
  removeArchiveCategory: (id) => set((state) => ({ archiveCategories: state.archiveCategories.filter((category) => category.id !== id) })),
  addArchiveMaterial: (material) => set((state) => ({ archiveMaterials: [...state.archiveMaterials, material] })),
  updateArchiveMaterial: (id, updates) => set((state) => ({ archiveMaterials: state.archiveMaterials.map((material) => material.id === id ? { ...material, ...updates } : material) })),
  removeArchiveMaterial: (id) => set((state) => ({ archiveMaterials: state.archiveMaterials.filter((material) => material.id !== id) })),
  addArchiveRequirement: (requirement, operatorId) => {
    const operator = get().users.find((item) => item.id === operatorId);
    const isPrivateTopicFolder = requirement.ownerType === 'TOPIC_NATIONAL' && !requirement.sourceCode && Boolean(requirement.topicId && requirement.unitId);
    if (!operator || !isPrivateTopicFolder || !isTopicOperational(get().topics.find((item) => item.id === requirement.topicId)) || !canPerform(operator, get().roles, 'archive.topic.submit') || operator.unitId !== requirement.unitId || !canAccessTopicByMembership(operator, requirement.topicId, get().topicMemberships)) throw new Error('没有新建该单位材料文件夹的权限');
    const duplicate = get().archiveRequirements.some((item) => item.ownerType === 'TOPIC_NATIONAL' && !item.sourceCode && item.topicId === requirement.topicId && item.unitId === requirement.unitId && item.name.trim() === requirement.name.trim());
    if (duplicate) throw new Error('本单位材料中已存在同名文件夹');
    set((state) => ({ archiveRequirements: [...state.archiveRequirements, requirement] }));
  },
  updateArchiveRequirement: (id, updates) => set((state) => ({ archiveRequirements: state.archiveRequirements.map((requirement) => requirement.id === id ? { ...requirement, ...updates } : requirement) })),
  removeArchiveRequirement: (id, operatorId) => {
    const operator = get().users.find((item) => item.id === operatorId);
    const requirement = get().archiveRequirements.find((item) => item.id === id);
    if (!operator || !requirement || requirement.ownerType !== 'TOPIC_NATIONAL' || requirement.sourceCode || !requirement.topicId || !requirement.unitId || !isTopicOperational(get().topics.find((item) => item.id === requirement.topicId)) || operator.unitId !== requirement.unitId || !canPerform(operator, get().roles, 'archive.topic.submit') || !canAccessTopicByMembership(operator, requirement.topicId, get().topicMemberships)) throw new Error('没有删除该单位材料文件夹的权限');
    const relatedSubmissions = get().archiveSubmissions.filter((item) => item.requirementId === id);
    if (relatedSubmissions.some((item) => (item.files?.length ?? 0) > 0 || item.fileIds.length > 0)) throw new Error('该文件夹中已有材料，请先删除文件后再删除文件夹');
    set((state) => ({
      archiveRequirements: state.archiveRequirements.filter((item) => item.id !== id),
      archiveSubmissions: state.archiveSubmissions.filter((item) => item.requirementId !== id),
    }));
  },
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
  addUser: (user) => {
    if (isTopicUnitRole(user.role) && get().users.some((item) => item.enabled && item.unitId === user.unitId && isTopicUnitRole(item.role))) throw new Error('该单位已经存在课题单位账号');
    set((state) => ({ users: [...state.users, user] }));
  },
  updateUser: (id, updates) => {
    const current = get().users.find((item) => item.id === id);
    if (!current) return;
    const next = { ...current, ...updates };
    if (isTopicUnitRole(next.role) && get().users.some((item) => item.id !== id && item.enabled && item.unitId === next.unitId && isTopicUnitRole(item.role))) throw new Error('该单位已经存在课题单位账号');
    set((state) => ({
      users: state.users.map((user) => user.id === id ? next : user),
      currentUser: state.currentUser?.id === id ? next : state.currentUser,
    }));
  },
  removeUser: (id) => set((state) => ({ users: state.users.filter((user) => user.id !== id) })),
  resetUserPassword: (id) => set((state) => ({ users: state.users.map((user) => user.id === id ? { ...user, password: '123456' } : user) })),
  toggleUserEnabled: (id, enabled) => set((state) => ({
    users: state.users.map((user) => user.id === id ? { ...user, enabled } : user),
    currentUser: state.currentUser?.id === id ? (enabled ? { ...state.currentUser, enabled } : null) : state.currentUser,
  })),
  addRole: (role) => set((state) => ({ roles: [...state.roles, role] })),
  updateRole: (id, updates) => set((state) => ({ roles: state.roles.map((role) => role.id === id && !role.builtIn ? { ...role, ...updates, pagePermissions: role.name === '外部课题单位' ? (updates.pagePermissions ?? role.pagePermissions).filter((item) => item !== 'self-funded-archive') : updates.pagePermissions ?? role.pagePermissions, actionPermissions: role.name === '外部课题单位' ? (updates.actionPermissions ?? role.actionPermissions).filter((item) => item !== 'self-funded.manage') : updates.actionPermissions ?? role.actionPermissions, updatedAt: new Date().toISOString() } : role) })),
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

function isTopicUnitRole(role: UserRole): boolean {
  return role === '内部课题单位' || role === '外部课题单位';
}

export function createAppStore() {
  return createStore<AppState>()(stateCreator);
}

export function migratePersistedState(persistedState: unknown): AppState {
  const defaults = createInitialState();
  const persistedRecord = persistedState && typeof persistedState === 'object' ? persistedState as Partial<AppData> & { reportRules?: unknown } : {};
  const { reportRules: _removedReportRules, ...persisted } = persistedRecord;
  const units = (persisted.units ?? defaults.units).map((unit) => unit.id === 'u-sgcc' && unit.name === '国家电网公司'
    ? defaults.units.find((item) => item.id === unit.id)!
    : unit);
  const legacyMockAccountNames: Record<string, string> = {
    'user-tsinghua': '清华大学',
    'user-pku': '北京大学',
    'user-ict': '中科院计算所',
    'user-hust': '华中科技大学',
    'user-gxgrid': '广西电网公司',
  };
  const users = (persisted.users ?? defaults.users).map((user) => user.name === legacyMockAccountNames[user.id]
    ? { ...user, name: defaults.users.find((item) => item.id === user.id)?.name ?? user.name }
    : user);
  const currentUser = persisted.currentUser ? users.find((user) => user.id === persisted.currentUser?.id) ?? persisted.currentUser : null;
  const selfFundedProjects = (persisted.selfFundedProjects ?? defaults.selfFundedProjects).map((project) => project.implementingUnit === '国家电网公司'
    ? { ...project, implementingUnit: '广西电网公司' }
    : project);
  const topics = (persisted.topics ?? defaults.topics).map((topic) => ({
    ...topic,
    reportConfig: topic.reportConfig ?? defaults.topics.find((item) => item.id === topic.id)?.reportConfig ?? createDefaultTopicReportConfig(),
  }));
  const sourceArchiveRequirements = persisted.archiveRequirements ?? defaults.archiveRequirements;
  const sourceArchiveSubmissions = persisted.archiveSubmissions ?? defaults.archiveSubmissions;
  const legacyPrivateFolders = sourceArchiveRequirements.filter((requirement) => requirement.ownerType === 'TOPIC_NATIONAL' && !requirement.sourceCode && requirement.topicId && !requirement.unitId);
  const legacyFolderUnits = new Map(legacyPrivateFolders.map((requirement) => {
    const submittedUnits = sourceArchiveSubmissions
      .filter((submission) => submission.requirementId === requirement.id)
      .map((submission) => submission.unitId ?? submission.ownerId.split(':')[1])
      .filter((unitId): unitId is string => Boolean(unitId));
    const fallbackUnitId = topics.find((topic) => topic.id === requirement.topicId)?.leadingUnitId;
    return [requirement.id, [...new Set(submittedUnits.length ? submittedUnits : fallbackUnitId ? [fallbackUnitId] : [])]];
  }));
  const privateFolderId = (requirementId: string, unitId: string) => {
    const units = legacyFolderUnits.get(requirementId) ?? [];
    return units.length > 1 ? `${requirementId}-${unitId}` : requirementId;
  };
  const archiveRequirements = sourceArchiveRequirements.flatMap((requirement) => {
    const units = legacyFolderUnits.get(requirement.id);
    if (!units) return [requirement];
    return units.map((unitId) => ({ ...requirement, id: privateFolderId(requirement.id, unitId), unitId }));
  });
  const archiveSubmissions = sourceArchiveSubmissions.map((submission) => {
    const units = legacyFolderUnits.get(submission.requirementId);
    if (!units) return submission;
    const unitId = submission.unitId ?? submission.ownerId.split(':')[1] ?? units[0];
    return unitId ? { ...submission, requirementId: privateFolderId(submission.requirementId, unitId), unitId } : submission;
  });
  const nodes = persisted.nodes ?? defaults.nodes;
  const finalNodeId = nodes.at(-1)?.id ?? defaults.nodes.at(-1)!.id;
  const customDefinitions = (persisted.indicatorDefinitions ?? []).filter((item) => !item.builtIn);
  const indicatorDefinitions = [...defaults.indicatorDefinitions, ...customDefinitions];
  const oldPowerGridDefinitionId = 'indicator-power-grid-first-author';
  const paperPowerGridDefinition = defaults.indicatorDefinitions.find((item) => item.code === 'POWER_GRID_FIRST_AUTHOR_PAPER')!;
  const migratedIndicators = (persisted.topicIndicators ?? defaults.topicIndicators).map((item) => item.indicatorDefinitionId === oldPowerGridDefinitionId ? {
    ...item,
    id: item.id.replace(oldPowerGridDefinitionId, paperPowerGridDefinition.id),
    indicatorDefinitionId: paperPowerGridDefinition.id,
    achievementType: paperPowerGridDefinition.achievementType,
  } : item);
  const topicIndicators = [...migratedIndicators];
  topics.forEach((topic) => {
    indicatorDefinitions.filter((definition) => definition.enabled).forEach((definition) => {
      if (topicIndicators.some((item) => item.topicId === topic.id && item.nodeId === finalNodeId && item.indicatorDefinitionId === definition.id)) return;
      const quantity = topic.topicOverallRequirements[definition.id]
        ?? topic.topicOverallRequirements[definition.name]
        ?? (definition.name === definition.achievementType ? topic.topicOverallRequirements[definition.achievementType] : undefined)
        ?? 0;
      topicIndicators.push({
        id: `topic-indicator-${topic.id}-${definition.id}-${finalNodeId}`,
        projectId: topic.projectId,
        topicId: topic.id,
        indicatorDefinitionId: definition.id,
        achievementType: definition.achievementType,
        nodeId: finalNodeId,
        targetQuantity: quantity,
        status: '已下发',
        version: 1,
        publishedAt: new Date().toISOString(),
        publishedBy: '系统升级迁移',
        createdAt: today(),
        updatedAt: today(),
      });
    });
  });
  const unitIndicatorAllocations = (persisted.unitIndicatorAllocations ?? defaults.unitIndicatorAllocations).map((item) => item.indicatorDefinitionId === oldPowerGridDefinitionId ? {
    ...item,
    id: item.id.replace(oldPowerGridDefinitionId, paperPowerGridDefinition.id),
    topicIndicatorId: item.topicIndicatorId.replace(oldPowerGridDefinitionId, paperPowerGridDefinition.id),
    indicatorDefinitionId: paperPowerGridDefinition.id,
    achievementType: paperPowerGridDefinition.achievementType,
  } : item);
  const requiredTopicActions = ['topic.manage', 'indicator.manage', 'topic-indicator.publish'] as const;
  const roles = (persisted.roles ?? defaults.roles).map((role) => role.name === '项目技术负责人' || role.name === '科研助理'
    ? { ...role, actionPermissions: [...new Set([...role.actionPermissions, ...requiredTopicActions])] }
    : role);
  const achievements = (persisted.achievements ?? defaults.achievements).map((achievement) => ({
    ...achievement,
    recordVersion: achievement.recordVersion ?? 1,
    submittedVersion: achievement.submittedVersion ?? (['预审草稿', '预审退回', '正式成果草稿', '正式退回'].includes(achievement.status) ? 0 : 1),
  }));
  const reports = (persisted.reports ?? defaults.reports).map((report) => ({
    ...report,
    recordVersion: report.recordVersion ?? report.version ?? 1,
    submittedVersion: report.submittedVersion ?? (report.status === '草稿' || report.status === '退回修改' ? 0 : 1),
  }));

  return {
    ...defaults,
    ...persisted,
    units,
    users,
    currentUser,
    topics,
    nodes,
    indicatorDefinitions,
    topicIndicators,
    unitIndicatorAllocations,
    roles,
    achievements,
    reports,
    submissionSnapshots: persisted.submissionSnapshots ?? [],
    selfFundedProjects,
    archiveRequirements,
    archiveSubmissions,
    reportTasks: (persisted.reportTasks ?? defaults.reportTasks).filter((task) => reports.some((report) => report.taskId === task.id)),
  } as AppState;
}

export const useAppStore = create<AppState>()(
  persist(stateCreator, { name: 'gzxm-research-management-v5', version: 10, migrate: migratePersistedState }),
);

export const canEditAchievement = (status: string): boolean => ['草稿', '退回修改', '预审草稿', '预审退回', '正式成果草稿', '正式退回'].includes(status);

export const canAccess = (role: UserRole, module: string): boolean => {
  if (role === '系统管理员') return true;
  if (role === '项目技术负责人' || role === '科研助理') return ['research', 'archive', 'monitoring'].includes(module);
  if (role === '内部课题单位' || role === '外部课题单位') return ['research', 'archive', 'monitoring', 'achievement-entry'].includes(module);
  return false;
};
