import type {
  Achievement, AchievementMaterial, ArchiveCategory, ArchiveMaterial, ArchiveRequirement,
  IndicatorConfig, Project, ProjectUnit, ApprovalRecord, ReportTask, ProgressReport,
  SelfFundedProject, ArchiveSubmission, TimeNode, Topic, WarningRule, User, RbacRole,
  IndicatorDefinition, TopicIndicator, TopicUnitMembership, UnitIndicatorAllocation,
} from '../types';
import { ALL_PAGE_PERMISSIONS } from '../domain/permissions';

export const MOCK_PROJECT: Project = { id: 'p1', name: '国家科技重大专项示范', code: 'GZ-2025-001', startDate: '2025-01-01', endDate: '2028-12-31' };

export const MOCK_UNITS: ProjectUnit[] = [
  { id: 'u-sgcc', projectId: 'p1', name: '国家电网公司', shortName: '国网', unitCategory: '电网公司', countsAsPowerGridUnit: true },
  { id: 'u-tsinghua', projectId: 'p1', name: '清华大学', shortName: '清华', unitCategory: '高校', countsAsPowerGridUnit: false },
  { id: 'u-pku', projectId: 'p1', name: '北京大学', shortName: '北大', unitCategory: '高校', countsAsPowerGridUnit: false },
  { id: 'u-ict', projectId: 'p1', name: '中科院计算所', shortName: '计算所', unitCategory: '科研院所', countsAsPowerGridUnit: false },
  { id: 'u-zju', projectId: 'p1', name: '浙江大学', shortName: '浙大', unitCategory: '高校', countsAsPowerGridUnit: false },
  { id: 'u-hust', projectId: 'p1', name: '华中科技大学', shortName: '华中大', unitCategory: '高校', countsAsPowerGridUnit: false },
  { id: 'u-nari', projectId: 'p1', name: '南瑞集团', shortName: '南瑞', unitCategory: '企业', countsAsPowerGridUnit: true },
];

export const MOCK_TOPICS: Topic[] = [
  { id: 't1', projectId: 'p1', code: 'K1', name: '课题1：总体架构与关键技术研究', leadingUnitId: 'u-tsinghua', participatingUnitIds: ['u-pku', 'u-ict'], principalName: '张三', contactName: '李四', contactPhone: '13800001111', contactEmail: 'lisi@tsinghua.edu.cn', financeAssistant: '王助理', financeAssistantEmail: 'wang@tsinghua.edu.cn', financeAssistantPhone: '13800001112', domesticJournalRequiredCount: 2, topicOverallRequirements: { 学术论文: 6, 发明专利: 5, 软件著作权: 3, 标准规范: 0, 人才培养: 2 } },
  { id: 't2', projectId: 'p1', code: 'K2', name: '课题2：核心算法研究与验证', leadingUnitId: 'u-pku', participatingUnitIds: ['u-tsinghua', 'u-zju'], principalName: '王五', contactName: '赵六', contactPhone: '13800002222', contactEmail: 'zhaoliu@pku.edu.cn', financeAssistant: '刘助理', financeAssistantEmail: 'liu@pku.edu.cn', financeAssistantPhone: '13800002223', domesticJournalRequiredCount: 1, topicOverallRequirements: { 学术论文: 4, 发明专利: 3, 软件著作权: 2, 标准规范: 0, 人才培养: 1 } },
  { id: 't3', projectId: 'p1', code: 'K3', name: '课题3：系统平台研发', leadingUnitId: 'u-ict', participatingUnitIds: ['u-hust', 'u-zju', 'u-sgcc'], principalName: '孙七', contactName: '周八', contactPhone: '13800003333', contactEmail: 'zhouba@ict.ac.cn', financeAssistant: '陈助理', financeAssistantEmail: 'chen@ict.ac.cn', financeAssistantPhone: '13800003334', domesticJournalRequiredCount: 1, topicOverallRequirements: { 学术论文: 3, 发明专利: 4, 软件著作权: 4, 标准规范: 0, 人才培养: 0 } },
  { id: 't4', projectId: 'p1', code: 'K4', name: '课题4：示范应用与集成', leadingUnitId: 'u-sgcc', participatingUnitIds: ['u-tsinghua', 'u-hust', 'u-nari'], principalName: '吴九', contactName: '郑十', contactPhone: '13800004444', contactEmail: 'zhengshi@sgcc.com.cn', financeAssistant: '杨助理', financeAssistantEmail: 'yang@sgcc.com.cn', financeAssistantPhone: '13800004445', domesticJournalRequiredCount: 0, topicOverallRequirements: { 学术论文: 2, 发明专利: 3, 软件著作权: 2, 标准规范: 0, 人才培养: 0 } },
  { id: 't5', projectId: 'p1', code: 'K5', name: '课题5：测试评估与标准规范', leadingUnitId: 'u-hust', participatingUnitIds: ['u-pku', 'u-ict'], principalName: '钱十一', contactName: '刘十二', contactPhone: '13800005555', contactEmail: 'liushier@hust.edu.cn', financeAssistant: '黄助理', financeAssistantEmail: 'huang@hust.edu.cn', financeAssistantPhone: '13800005556', domesticJournalRequiredCount: 1, topicOverallRequirements: { 学术论文: 2, 发明专利: 2, 软件著作权: 2, 标准规范: 2, 人才培养: 0 } },
];

export const MOCK_TIME_NODES: TimeNode[] = [
  { id: 'node-1', projectId: 'p1', name: '第一年度', deadline: '2025-12-31', description: '第一年度检查', participatesInWarning: true, sortOrder: 1 },
  { id: 'node-2', projectId: 'p1', name: '第二年度', deadline: '2026-12-31', description: '第二年度检查', participatesInWarning: true, sortOrder: 2 },
  { id: 'node-3', projectId: 'p1', name: '中期检查', deadline: '2027-06-30', description: '中期检查', participatesInWarning: true, sortOrder: 3 },
  { id: 'node-4', projectId: 'p1', name: '系统试运行', deadline: '2027-12-31', description: '系统试运行', participatesInWarning: true, sortOrder: 4 },
  { id: 'node-5', projectId: 'p1', name: '项目结项', deadline: '2028-12-31', description: '项目结项', participatesInWarning: true, sortOrder: 5 },
];

export const MOCK_INDICATORS: IndicatorConfig[] = [
  { id: 'ind-1', projectId: 'p1', topicId: 't1', unitId: 'u-tsinghua', achievementType: '学术论文', nodeId: 'node-3', plannedQuantity: 2, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'ind-2', projectId: 'p1', topicId: 't1', unitId: 'u-tsinghua', achievementType: '学术论文', nodeId: 'node-5', plannedQuantity: 5, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'ind-3', projectId: 'p1', topicId: 't1', unitId: 'u-tsinghua', achievementType: '发明专利', nodeId: 'node-3', plannedQuantity: 3, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'ind-4', projectId: 'p1', topicId: 't1', unitId: 'u-pku', achievementType: '学术论文', nodeId: 'node-3', plannedQuantity: 2, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'ind-5', projectId: 'p1', topicId: 't3', unitId: 'u-ict', achievementType: '软件著作权', nodeId: 'node-3', plannedQuantity: 1, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'ind-6', projectId: 'p1', topicId: 't3', unitId: 'u-ict', achievementType: '软件著作权', nodeId: 'node-5', plannedQuantity: 3, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'ind-7', projectId: 'p1', topicId: 't4', unitId: 'u-zju', achievementType: '学术论文', nodeId: 'node-3', plannedQuantity: 1, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'ind-8', projectId: 'p1', topicId: 't5', unitId: 'u-hust', achievementType: '标准规范', nodeId: 'node-3', plannedQuantity: 1, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
];

export const MOCK_TOPIC_POWER_GRID_REQUIREMENTS: import('../types').TopicPowerGridRequirement[] = [
  { id: 'pgr-1', projectId: 'p1', topicId: 't1', achievementType: '学术论文', requiredCount: 2 },
  { id: 'pgr-2', projectId: 'p1', topicId: 't1', achievementType: '发明专利', requiredCount: 3 },
  { id: 'pgr-3', projectId: 'p1', topicId: 't1', achievementType: '软件著作权', requiredCount: 1 },
  { id: 'pgr-4', projectId: 'p1', topicId: 't2', achievementType: '发明专利', requiredCount: 1 },
  { id: 'pgr-5', projectId: 'p1', topicId: 't3', achievementType: '发明专利', requiredCount: 2 },
  { id: 'pgr-6', projectId: 'p1', topicId: 't4', achievementType: '学术论文', requiredCount: 1 },
  { id: 'pgr-7', projectId: 'p1', topicId: 't4', achievementType: '发明专利', requiredCount: 1 },
];

export const MOCK_WARNING_RULES: WarningRule[] = [
  { id: 'wr-time', projectId: 'p1', type: 'time', name: '时间预警', enabled: true, levels: [
    { level: 'yellow', advanceDays: 90, completionRateThreshold: 80 },
    { level: 'orange', advanceDays: 30, completionRateThreshold: 60 },
    { level: 'red', advanceDays: 0, completionRateThreshold: 40 },
  ]},
  { id: 'wr-qty', projectId: 'p1', type: 'quantity_gap', name: '数量缺口预警', enabled: true, levels: [
    { level: 'yellow', advanceDays: 0, completionRateThreshold: 80 },
    { level: 'orange', advanceDays: 0, completionRateThreshold: 60 },
    { level: 'red', advanceDays: 0, completionRateThreshold: 40 },
  ]},
  { id: 'wr-progress', projectId: 'p1', type: 'progress', name: '成果进度预警', enabled: true, levels: [
    { level: 'yellow', advanceDays: 90, completionRateThreshold: 80 },
    { level: 'orange', advanceDays: 60, completionRateThreshold: 60 },
    { level: 'red', advanceDays: 30, completionRateThreshold: 40 },
  ]},
  { id: 'wr-material', projectId: 'p1', type: 'material', name: '佐证材料预警', enabled: true, levels: [
    { level: 'yellow', advanceDays: 14, completionRateThreshold: 0 },
    { level: 'orange', advanceDays: 7, completionRateThreshold: 0 },
    { level: 'red', advanceDays: 3, completionRateThreshold: 0 },
  ]},
  { id: 'wr-cj', projectId: 'p1', type: 'chinese_journal_ratio', name: '国内期刊比例预警', enabled: true, levels: [
    { level: 'yellow', advanceDays: 0, completionRateThreshold: 5 },
    { level: 'orange', advanceDays: 0, completionRateThreshold: 10 },
    { level: 'red', advanceDays: 0, completionRateThreshold: 20 },
  ]},
];

const createMaterials = (achId: string, items: { name: string; status: AchievementMaterial['status']; materialType: string; fileId?: string; fileName?: string }[]): AchievementMaterial[] =>
  items.map((item, idx) => ({
    id: `m-${achId}-${idx}`, achievementId: achId,
    materialType: item.materialType, name: item.name,
    fileId: item.fileId || `file-mock-${achId}-${idx}`,
    fileName: item.fileName || `${item.name}.pdf`,
    fileUrl: `mock://files/${item.fileName || item.name}.pdf`,
    version: 1, status: item.status,
    uploadedAt: item.status !== '未提交' ? '2025-06-15' : undefined,
    reviewedAt: item.status === '审核通过' || item.status === '退回修改' ? '2025-06-20' : undefined,
    reviewOpinion: item.status === '退回修改' ? '材料不符合要求' : undefined,
  }));

export const MOCK_ACHIEVEMENTS: Achievement[] = [
  // 课题1 清华 论文 — 审批通过（1篇计入中期）
  {
    id: 'ach-1', projectId: 'p1', topicId: 't1', unitId: 'u-tsinghua', achievementType: '学术论文',
    indicatorId: 'ind-1', nodeId: 'node-3',
    title: '面向国重项目的架构设计方法研究', responsiblePerson: '张三', otherContributors: ['李四', '王五'],
    progressStatus: '', plannedCompletionDate: '2027-03-15', recognizedCompletionDate: '2025-06-01',
    paperStatus: '已正式刊出',
    status: '审批通过', countsToIndicator: true,
    createdAt: '2025-03-01', updatedAt: '2025-06-20', submittedAt: '2025-06-10', remarks: '',
    approvalOpinion: '符合要求', approvedAt: '2025-06-20', approver: '管理员A',
    isChineseJournal: true,
    paperType: 'SCI', journalName: '中国科学', cnNumber: '11-5844/N', issn: '1674-7216', doi: '10.1360/SSP-2025-0001',
    firstAuthor: '张三', correspondingAuthor: '李四', allAuthors: '张三, 李四, 王五',
    signingUnitList: '清华大学', firstSigningUnit: '清华大学', firstAuthorUnit: '清华大学',
    submissionDate: '2025-01-10', acceptanceDate: '2025-04-15', publicationDate: '2025-06-01',
    journalYearVolumePage: '2025年 第1卷 第1期 1-10页', projectLabeling: '已标注',
    materials: createMaterials('ach-1', [{ name: '正式刊出证明', status: '审核通过', materialType: '正式刊出证明' }]),
  },
  // 课题1 北大 论文 — 审批中
  {
    id: 'ach-2', projectId: 'p1', topicId: 't1', unitId: 'u-pku', achievementType: '学术论文',
    indicatorId: 'ind-4', nodeId: 'node-3',
    title: '国重项目数据治理关键技术', responsiblePerson: '赵六',
    progressStatus: '', plannedCompletionDate: '2027-05-01', recognizedCompletionDate: '2025-05-10',
    paperStatus: '已录用',
    status: '审批中', countsToIndicator: false,
    createdAt: '2025-04-10', updatedAt: '2025-06-18', submittedAt: '2025-06-18', remarks: '',
    isChineseJournal: false,
    paperType: 'EI', journalName: '计算机研究与发展', cnNumber: '11-1777/TP', issn: '1000-1239',
    firstAuthor: '赵六', allAuthors: '赵六, 孙七',
    signingUnitList: '北京大学', firstSigningUnit: '北京大学', firstAuthorUnit: '北京大学',
    submissionDate: '2025-02-20', acceptanceDate: '2025-05-10', projectLabeling: '已标注',
    materials: createMaterials('ach-2', [{ name: '论文录用通知', status: '待审核', materialType: '论文录用通知' }]),
  },
  // 课题1 清华 专利 — 审批通过
  {
    id: 'ach-3', projectId: 'p1', topicId: 't1', unitId: 'u-tsinghua', achievementType: '发明专利',
    indicatorId: 'ind-3', nodeId: 'node-3',
    title: '一种国重项目数据处理方法', responsiblePerson: '张三',
    progressStatus: '', plannedCompletionDate: '2027-03-01', recognizedCompletionDate: '2025-04-10',
    patentStatus: '已授权',
    status: '审批通过', countsToIndicator: true,
    createdAt: '2025-02-10', updatedAt: '2025-04-20', submittedAt: '2025-04-10', remarks: '',
    approvalOpinion: '已授权', approvedAt: '2025-04-20', approver: '管理员A',
    patentScope: '国内', applicant: '清华大学', applicantList: '清华大学', firstApplicant: '清华大学',
    inventors: '张三; 李四', inventorList: '张三; 李四', firstInventor: '张三', firstInventorUnit: '清华大学',
    applicationNumber: '202510000001.0', applicationDate: '2025-01-15',
    receiptDate: '2025-02-01', patentNumber: 'CN0000001B', grantDate: '2025-04-10',
    grantPublicationNumber: 'CN0000001B', grantPublicationDate: '2025-04-10',
    patentHolderList: '清华大学', legalStatus: '授权',
    materials: createMaterials('ach-3', [{ name: '发明专利授权证明文件', status: '审核通过', materialType: '发明专利授权证明文件' }]),
  },
  // 课题3 计算所 软著 — 审批通过
  {
    id: 'ach-4', projectId: 'p1', topicId: 't3', unitId: 'u-ict', achievementType: '软件著作权',
    indicatorId: 'ind-5', nodeId: 'node-3',
    title: '国重项目数据管理平台V1.0', responsiblePerson: '王五',
    progressStatus: '', plannedCompletionDate: '2027-05-01', recognizedCompletionDate: '2025-05-01',
    status: '审批通过', countsToIndicator: true,
    createdAt: '2025-02-20', updatedAt: '2025-05-15', submittedAt: '2025-05-10', remarks: '',
    approvalOpinion: '已取得证书', approvedAt: '2025-05-15', approver: '管理员A',
    softwareFullName: '国重项目数据管理平台', shortName: '数据管理平台', version: 'V1.0',
    copyrightOwnerList: '中科院计算所', firstCopyrightOwner: '中科院计算所',
    copyrightOwner: '中科院计算所', developers: '王五, 赵六',
    mainDevelopers: '王五, 赵六', firstDeveloper: '王五', firstDeveloperUnit: '中科院计算所',
    softwareMainFunctions: '实现项目数据的集中管理、查询、统计与分析功能',
    completionDate: '2025-01-31', registrationNumber: '2025SR0000001', certificateDate: '2025-05-01',
    materials: createMaterials('ach-4', [{ name: '软件著作权证书', status: '审核通过', materialType: '软件著作权证书' }]),
  },
  // 课题5 华中大 标准 — 审批通过
  {
    id: 'ach-5', projectId: 'p1', topicId: 't5', unitId: 'u-hust', achievementType: '标准规范',
    indicatorId: 'ind-8', nodeId: 'node-3',
    title: '国重项目数据交换接口技术要求', responsiblePerson: '周十',
    progressStatus: '', plannedCompletionDate: '2027-05-01', recognizedCompletionDate: '2025-05-30',
    status: '审批通过', countsToIndicator: true,
    createdAt: '2025-03-01', updatedAt: '2025-06-05', submittedAt: '2025-05-30', remarks: '',
    approvalOpinion: '已形成送审稿', approvedAt: '2025-06-05', approver: '管理员A',
    standardLevel: '团体标准', leadingUnit: '华中科技大学',
    otherDraftingUnits: '南瑞集团', drafters: '周十, 吴九',
    firstDrafter: '周十', firstDrafterUnit: '华中科技大学',
    participatingUnits: '南瑞集团',
    currentStage: '已提交送审', responsibleOrganization: '中国电力企业联合会',
    draftSubmissionDate: '2025-04-15', draftCommitDate: '2025-05-30',
    materials: createMaterials('ach-5', [{ name: '标准送审稿', status: '审核通过', materialType: '标准送审稿' }]),
  },
];

export const MOCK_WORKFLOW_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach-pre-review', projectId: 'p1', topicId: 't1', unitId: 'u-tsinghua', achievementType: '学术论文',
    indicatorId: 'ind-1', nodeId: 'node-3', title: '面向新型电力系统的协同控制方法', responsiblePerson: '张三',
    progressStatus: '拟投稿', plannedCompletionDate: '2027-03-01', status: '预审初审中', countsToIndicator: false,
    createdAt: '2026-08-20', updatedAt: '2026-09-01', submittedAt: '2026-09-01', remarks: '请核对作者及单位排序',
    firstAuthor: '张三', firstAuthorUnit: '清华大学', signingUnitList: '清华大学、广西电网有限责任公司',
    projectLabeling: '国家科技重大专项 GZ-2025-001', materials: [],
  },
  {
    id: 'ach-formal-final', projectId: 'p1', topicId: 't2', unitId: 'u-pku', achievementType: '发明专利',
    indicatorId: 'ind-3', nodeId: 'node-3', title: '一种电网状态智能感知方法', responsiblePerson: '王五',
    progressStatus: '已受理', plannedCompletionDate: '2027-03-01', recognizedCompletionDate: '2026-08-28',
    status: '正式终审中', countsToIndicator: false, createdAt: '2026-04-10', updatedAt: '2026-09-02',
    submittedAt: '2026-09-02', remarks: '', applicationNumber: 'CN202610000001.0',
    applicantList: '北京大学、广西电网有限责任公司', inventorList: '王五、赵六', materials: [],
  },
];

export const MOCK_INDICATOR_DEFINITIONS: IndicatorDefinition[] = [
  ['paper', 'PAPER', '学术论文'], ['patent', 'PATENT', '发明专利'], ['copyright', 'COPYRIGHT', '软件著作权'],
  ['standard', 'STANDARD', '标准规范'], ['talent', 'TALENT', '人才培养'],
].map(([id, code, name]) => ({
  id: `indicator-${id}`, code, name, achievementType: name as IndicatorDefinition['achievementType'],
  unit: name === '人才培养' ? '人' : name === '学术论文' ? '篇' : '项', builtIn: true, enabled: true,
  createdAt: '2025-01-01', updatedAt: '2025-01-01',
}));

export const MOCK_TOPIC_MEMBERSHIPS: TopicUnitMembership[] = MOCK_TOPICS.flatMap((topic) => [
  { id: `membership-${topic.id}-${topic.leadingUnitId}`, topicId: topic.id, unitId: topic.leadingUnitId, membershipType: 'LEAD' as const, principalName: topic.principalName, contactName: topic.contactName, contactPhone: topic.contactPhone, contactEmail: topic.contactEmail, enabled: true, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  ...topic.participatingUnitIds.map((unitId) => ({ id: `membership-${topic.id}-${unitId}`, topicId: topic.id, unitId, membershipType: 'PARTICIPANT' as const, enabled: true, createdAt: '2025-01-01', updatedAt: '2025-01-01' })),
]);

export const MOCK_TOPIC_INDICATORS: TopicIndicator[] = MOCK_TOPICS.flatMap((topic) =>
  Object.entries(topic.topicOverallRequirements).filter(([, quantity]) => quantity > 0).map(([type, quantity]) => {
    const definition = MOCK_INDICATOR_DEFINITIONS.find((item) => item.achievementType === type)!;
    return { id: `topic-indicator-${topic.id}-${definition.id}-node-5`, projectId: 'p1', topicId: topic.id,
      indicatorDefinitionId: definition.id, achievementType: definition.achievementType, nodeId: 'node-5', targetQuantity: quantity,
      status: '已下发' as const, version: 1, publishedAt: '2025-01-01', publishedBy: '科研助理（董）', createdAt: '2025-01-01', updatedAt: '2025-01-01' };
  }),
);

export const MOCK_UNIT_INDICATOR_ALLOCATIONS: UnitIndicatorAllocation[] = MOCK_TOPIC_INDICATORS.flatMap((topicIndicator) => {
  const memberships = MOCK_TOPIC_MEMBERSHIPS.filter((item) => item.topicId === topicIndicator.topicId && item.enabled);
  return memberships.map((membership, index) => ({
    id: `allocation-${topicIndicator.id}-${membership.unitId}`, projectId: 'p1', topicId: topicIndicator.topicId,
    membershipId: membership.id, unitId: membership.unitId, topicIndicatorId: topicIndicator.id,
    indicatorDefinitionId: topicIndicator.indicatorDefinitionId, achievementType: topicIndicator.achievementType,
    nodeId: topicIndicator.nodeId, targetQuantity: index === 0 ? topicIndicator.targetQuantity : 0,
    status: '已下发' as const, version: 1, publishedAt: '2025-01-02', publishedBy: '课题牵头单位',
    createdAt: '2025-01-02', updatedAt: '2025-01-02',
  }));
});

export const MOCK_ROLES: RbacRole[] = [
  { id: 'role-system-admin', code: 'system-admin', name: '系统管理员', description: '查看全部页面，负责账号、权限、字典和系统配置，默认不参与业务审批', pagePermissions: ALL_PAGE_PERMISSIONS, actionPermissions: ['system.manage'], enabled: true, builtIn: true, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'role-project-leader', code: 'project-leader', name: '项目技术负责人', description: '业务终审与全局进度查看', pagePermissions: ['home', 'topic-indicator', 'indicator-monitoring', 'achievement-entry', 'achievement-review', 'achievement-query', 'report-review', 'progress-overview', 'project-public-archive', 'topic-archive', 'self-funded-archive', 'archive-review', 'archive-monitoring'], actionPermissions: ['achievement.final.approve', 'report.final.approve', 'archive.final.approve'], enabled: true, builtIn: false, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'role-research-assistant', code: 'research-assistant', name: '科研助理', description: '指标配置、业务初审与项目公共材料归档', pagePermissions: ['home', 'topic-indicator', 'indicator-monitoring', 'warning-rules', 'achievement-entry', 'achievement-review', 'achievement-query', 'report-review', 'progress-overview', 'project-public-archive', 'topic-archive', 'self-funded-archive', 'archive-review', 'archive-monitoring'], actionPermissions: ['topic.manage', 'indicator.manage', 'indicator.catalog.manage', 'topic-indicator.publish', 'warning.manage', 'achievement.initial.approve', 'report.initial.approve', 'archive.public.submit', 'archive.initial.approve'], enabled: true, builtIn: false, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'role-topic-unit', code: 'topic-unit', name: '课题牵头单位', description: '课题成员与单位指标管理、成果及材料填报', pagePermissions: ['home', 'topic-indicator', 'indicator-monitoring', 'achievement-entry', 'achievement-query', 'report-management', 'progress-overview', 'topic-archive', 'self-funded-archive', 'archive-monitoring'], actionPermissions: ['topic-unit.manage', 'unit-allocation.manage', 'unit-allocation.publish', 'achievement.submit', 'report.submit', 'archive.topic.submit', 'self-funded.manage'], enabled: true, builtIn: false, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'role-topic-participant', code: 'topic-participant', name: '课题承担单位', description: '承担单位成果、月季报与课题材料填报', pagePermissions: ['home', 'indicator-monitoring', 'achievement-entry', 'achievement-query', 'report-management', 'progress-overview', 'topic-archive', 'archive-monitoring'], actionPermissions: ['achievement.submit', 'report.submit', 'archive.topic.submit'], enabled: true, builtIn: false, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
];

export const MOCK_USERS: User[] = [
  { id: 'user-admin', username: 'admin', password: 'admin123', name: '系统管理员', unitId: 'u-sgcc', phone: '13800000001', email: 'admin@sgcc.com.cn', role: '系统管理员', roleId: 'role-system-admin', dataScope: 'ALL', topicIds: [], enabled: true, createdAt: '2025-01-01', lastLoginAt: '2025-06-01' },
  { id: 'user-leader', username: 'leader', password: 'leader123', name: '项目技术负责人', unitId: 'u-sgcc', phone: '13800000002', email: 'leader@sgcc.com.cn', role: '项目技术负责人', roleId: 'role-project-leader', dataScope: 'ALL', topicIds: [], enabled: true, createdAt: '2025-01-01' },
  { id: 'user-assistant', username: 'assistant', password: 'assistant123', name: '科研助理（董）', unitId: 'u-sgcc', phone: '13800000003', email: 'assistant@sgcc.com.cn', role: '科研助理', roleId: 'role-research-assistant', dataScope: 'ALL', topicIds: [], enabled: true, createdAt: '2025-01-01' },
  { id: 'user-topic-1', username: 'topic01', password: 'topic123', name: '课题一牵头单位', unitId: 'u-tsinghua', topicId: 't1', topicIds: ['t1'], dataScope: 'TOPICS', phone: '13800000101', email: 'topic01@mock.local', role: '课题牵头单位', roleId: 'role-topic-unit', enabled: true, createdAt: '2025-01-01' },
  { id: 'user-topic-2', username: 'topic02', password: 'topic123', name: '课题二牵头单位', unitId: 'u-pku', topicId: 't2', topicIds: ['t2'], dataScope: 'TOPICS', phone: '13800000102', email: 'topic02@mock.local', role: '课题牵头单位', roleId: 'role-topic-unit', enabled: true, createdAt: '2025-01-01' },
  { id: 'user-topic-3', username: 'topic03', password: 'topic123', name: '课题三牵头单位', unitId: 'u-ict', topicId: 't3', topicIds: ['t3'], dataScope: 'TOPICS', phone: '13800000103', email: 'topic03@mock.local', role: '课题牵头单位', roleId: 'role-topic-unit', enabled: true, createdAt: '2025-01-01' },
  { id: 'user-topic-4', username: 'topic04', password: 'topic123', name: '课题四牵头单位', unitId: 'u-sgcc', topicId: 't4', topicIds: ['t4'], dataScope: 'TOPICS', phone: '13800000104', email: 'topic04@mock.local', role: '课题牵头单位', roleId: 'role-topic-unit', enabled: true, createdAt: '2025-01-01' },
  { id: 'user-topic-5', username: 'topic05', password: 'topic123', name: '课题五牵头单位', unitId: 'u-hust', topicId: 't5', topicIds: ['t5'], dataScope: 'TOPICS', phone: '13800000105', email: 'topic05@mock.local', role: '课题牵头单位', roleId: 'role-topic-unit', enabled: true, createdAt: '2025-01-01' },
  { id: 'user-participant-pku', username: 'unit01', password: 'unit123', name: '北京大学承担单位账号', unitId: 'u-pku', topicIds: ['t1', 't5'], dataScope: 'TOPICS', phone: '13800000201', email: 'unit01@mock.local', role: '课题承担单位', roleId: 'role-topic-participant', enabled: true, createdAt: '2025-01-01' },
];

export const MOCK_ARCHIVE_CATEGORIES: ArchiveCategory[] = [
  { id: 'ac-1', projectId: 'p1', name: '项目申报与立项', description: '申报书、任务书、立项批复', sortOrder: 1 },
  { id: 'ac-2', projectId: 'p1', name: '年度/阶段报告', description: '年度报告、中期报告、结题报告', sortOrder: 2 },
  { id: 'ac-3', projectId: 'p1', name: '科研成果材料', description: '论文、专利、软著、标准、人才证明', sortOrder: 3 },
  { id: 'ac-4', projectId: 'p1', name: '检查验收材料', description: '检查、验收相关材料', sortOrder: 4 },
];

export const MOCK_ARCHIVE_REQUIREMENTS: ArchiveRequirement[] = [
  { id: 'ar-public-1', projectId: 'p1', categoryId: 'ac-1', name: '项目申报书', required: true, requiredQuantity: 1, ownerType: 'PROJECT_PUBLIC', requirementKind: 'REQUIRED', sourceCode: 'F1', sourceRow: 30 },
  { id: 'ar-public-2', projectId: 'p1', categoryId: 'ac-1', name: '项目立项批复（含预算）', required: true, requiredQuantity: 1, ownerType: 'PROJECT_PUBLIC', requirementKind: 'REQUIRED', sourceCode: 'F5', sourceRow: 34 },
  { id: 'ar-public-3', projectId: 'p1', categoryId: 'ac-2', name: '项目任务合同书', required: true, requiredQuantity: 1, ownerType: 'PROJECT_PUBLIC', requirementKind: 'REQUIRED', sourceCode: 'F7', sourceRow: 36 },
  { id: 'ar-public-4', projectId: 'p1', categoryId: 'ac-4', name: '综合绩效评价结论及过程材料', required: true, requiredQuantity: 1, ownerType: 'PROJECT_PUBLIC', requirementKind: 'REQUIRED', sourceCode: 'H11', sourceRow: 64 },
  { id: 'ar-topic-1', projectId: 'p1', categoryId: 'ac-1', name: '申报评审过程材料', required: false, requiredQuantity: 1, ownerType: 'TOPIC_NATIONAL', requirementKind: 'CONDITIONAL', sourceCode: 'F4', sourceRow: 33 },
  { id: 'ar-topic-2', projectId: 'p1', categoryId: 'ac-1', name: '保密协议', required: false, requiredQuantity: 1, ownerType: 'TOPIC_NATIONAL', requirementKind: 'CONDITIONAL', sourceCode: 'F6', sourceRow: 35 },
  { id: 'ar-topic-3', projectId: 'p1', categoryId: 'ac-2', name: '实验任务书及实验记录', required: false, requiredQuantity: 1, ownerType: 'TOPIC_NATIONAL', requirementKind: 'CONDITIONAL', sourceCode: 'G1', sourceRow: 38 },
  { id: 'ar-topic-4', projectId: 'p1', categoryId: 'ac-3', name: '知识产权证明材料', required: true, requiredQuantity: 1, ownerType: 'TOPIC_NATIONAL', requirementKind: 'REQUIRED', sourceCode: 'H6', sourceRow: 58 },
  { id: 'ar-topic-5', projectId: 'p1', categoryId: 'ac-3', name: '项目成果统计分析文件', required: false, requiredQuantity: 1, ownerType: 'TOPIC_NATIONAL', requirementKind: 'CONDITIONAL', sourceCode: 'J1', sourceRow: 85 },
  { id: 'ar-topic-6', projectId: 'p1', categoryId: 'ac-4', name: '经费执行情况报告', required: false, requiredQuantity: 1, ownerType: 'TOPIC_NATIONAL', requirementKind: 'CONDITIONAL', sourceCode: 'H14', sourceRow: 68 },
  { id: 'ar-tech-1', projectId: 'p1', categoryId: 'ac-1', name: '项目立项文件', required: true, requiredQuantity: 1, ownerType: 'SELF_FUNDED', requirementKind: 'REQUIRED', templateId: 'tpl-tech-v1' },
  { id: 'ar-tech-2', projectId: 'p1', categoryId: 'ac-1', name: '合同及技术协议', required: true, requiredQuantity: 1, ownerType: 'SELF_FUNDED', requirementKind: 'REQUIRED', templateId: 'tpl-tech-v1' },
  { id: 'ar-tech-3', projectId: 'p1', categoryId: 'ac-2', name: '实施方案及过程报告', required: true, requiredQuantity: 1, ownerType: 'SELF_FUNDED', requirementKind: 'REQUIRED', templateId: 'tpl-tech-v1' },
  { id: 'ar-tech-4', projectId: 'p1', categoryId: 'ac-3', name: '成果证明材料', required: true, requiredQuantity: 1, ownerType: 'SELF_FUNDED', requirementKind: 'REQUIRED', templateId: 'tpl-tech-v1' },
  { id: 'ar-tech-5', projectId: 'p1', categoryId: 'ac-4', name: '验收证书及验收报告', required: true, requiredQuantity: 1, ownerType: 'SELF_FUNDED', requirementKind: 'REQUIRED', templateId: 'tpl-tech-v1' },
  { id: 'ar-reno-1', projectId: 'p1', categoryId: 'ac-1', name: '项目建议书及批复', required: true, requiredQuantity: 1, ownerType: 'SELF_FUNDED', requirementKind: 'REQUIRED', templateId: 'tpl-renovation-v1' },
  { id: 'ar-reno-2', projectId: 'p1', categoryId: 'ac-1', name: '招投标及合同材料', required: true, requiredQuantity: 1, ownerType: 'SELF_FUNDED', requirementKind: 'REQUIRED', templateId: 'tpl-renovation-v1' },
  { id: 'ar-reno-3', projectId: 'p1', categoryId: 'ac-2', name: '施工及设备调试记录', required: false, requiredQuantity: 1, ownerType: 'SELF_FUNDED', requirementKind: 'CONDITIONAL', templateId: 'tpl-renovation-v1' },
  { id: 'ar-reno-4', projectId: 'p1', categoryId: 'ac-4', name: '竣工验收及结算材料', required: true, requiredQuantity: 1, ownerType: 'SELF_FUNDED', requirementKind: 'REQUIRED', templateId: 'tpl-renovation-v1' },
  { id: 'ar-infra-1', projectId: 'p1', categoryId: 'ac-1', name: '立项及可研材料', required: true, requiredQuantity: 1, ownerType: 'SELF_FUNDED', requirementKind: 'REQUIRED', templateId: 'tpl-infrastructure-v1' },
  { id: 'ar-infra-2', projectId: 'p1', categoryId: 'ac-1', name: '招投标及合同材料', required: true, requiredQuantity: 1, ownerType: 'SELF_FUNDED', requirementKind: 'REQUIRED', templateId: 'tpl-infrastructure-v1' },
  { id: 'ar-infra-3', projectId: 'p1', categoryId: 'ac-2', name: '设备到货与安装调试记录', required: false, requiredQuantity: 1, ownerType: 'SELF_FUNDED', requirementKind: 'CONDITIONAL', templateId: 'tpl-infrastructure-v1' },
  { id: 'ar-infra-4', projectId: 'p1', categoryId: 'ac-4', name: '竣工验收材料', required: true, requiredQuantity: 1, ownerType: 'SELF_FUNDED', requirementKind: 'REQUIRED', templateId: 'tpl-infrastructure-v1' },
];

export const MOCK_ARCHIVE_MATERIALS: ArchiveMaterial[] = [
  { id: 'am-1', projectId: 'p1', categoryId: 'ac-3', requirementId: 'ar-4', name: '论文录用通知及全文', fileName: 'paper_ach-1.pdf', sourceAchievementId: 'ach-1', uploader: '张三', uploadedAt: '2025-06-21', remarks: '', versions: [{ id: 'av-1-1', archiveMaterialId: 'am-1', version: 1, fileName: 'paper_ach-1.pdf', fileUrl: 'mock://files/paper_ach-1.pdf', uploadedAt: '2025-06-21', uploader: '张三' }] },
  { id: 'am-2', projectId: 'p1', categoryId: 'ac-3', requirementId: 'ar-4', name: '发明专利授权证书', fileName: 'patent_ach-4.pdf', sourceAchievementId: 'ach-4', uploader: '张三', uploadedAt: '2025-04-21', remarks: '', versions: [{ id: 'av-2-1', archiveMaterialId: 'am-2', version: 1, fileName: 'patent_ach-4.pdf', fileUrl: 'mock://files/patent_ach-4.pdf', uploadedAt: '2025-04-21', uploader: '张三' }] },
  { id: 'am-3', projectId: 'p1', categoryId: 'ac-4', requirementId: 'ar-5', name: '中期检查汇报PPT', fileName: 'midterm_report.pptx', uploader: '管理员A', uploadedAt: '2025-06-25', remarks: '', versions: [{ id: 'av-3-1', archiveMaterialId: 'am-3', version: 1, fileName: 'midterm_report.pptx', fileUrl: 'mock://files/midterm_report.pptx', uploadedAt: '2025-06-25', uploader: '管理员A' }] },
  { id: 'am-4', projectId: 'p1', categoryId: 'ac-1', requirementId: 'ar-1', name: '项目任务书', fileName: 'task_book.pdf', uploader: '管理员A', uploadedAt: '2025-01-05', remarks: '', versions: [{ id: 'av-4-1', archiveMaterialId: 'am-4', version: 1, fileName: 'task_book.pdf', fileUrl: 'mock://files/task_book.pdf', uploadedAt: '2025-01-05', uploader: '管理员A' }] },
];

export const MOCK_APPROVAL_RECORDS: ApprovalRecord[] = [];

export const MOCK_REPORT_TASKS: ReportTask[] = MOCK_TOPICS.flatMap((topic) => ([
  { id: `report-task-m-${topic.id}`, topicId: topic.id, reportType: 'MONTHLY', year: 2026, period: 9, deadline: '2026-09-30' },
  { id: `report-task-q-${topic.id}`, topicId: topic.id, reportType: 'QUARTERLY', year: 2026, period: 3, deadline: '2026-09-10' },
]));

export const MOCK_REPORTS: ProgressReport[] = [
  {
    id: 'report-t1-sep', taskId: 'report-task-m-t1', topicId: 't1', reportType: 'MONTHLY',
    milestoneProgress: '完成总体架构评审，里程碑按计划推进。', overallProgress: '完成关键技术方案论证和原型验证。',
    demonstrationProgress: '完成示范场景调研。', fundUsage: '本期支出 18 万元，累计支出 126 万元。',
    nextPlan: '完成核心模块联调。', problemsAndMeasures: '跨单位数据口径不一致，计划组织专项协调。',
    status: '初审中', overdue: false, version: 1, submittedAt: '2026-09-08', updatedAt: '2026-09-08',
  },
];

export const MOCK_SELF_FUNDED_PROJECTS: SelfFundedProject[] = [
  { id: 'sf-1', topicId: 't1', code: 'ZC-KJ-001', name: '智能调度验证平台研发', projectType: '科技项目', principalName: '李工', implementingUnit: '广西电网有限责任公司', startDate: '2025-03-01', endDate: '2027-12-31', budget: 320, status: '实施中', templateSnapshotId: 'tpl-tech-v1' },
  { id: 'sf-2', topicId: 't1', code: 'ZC-JG-001', name: '示范站技术改造', projectType: '技改项目', principalName: '陈工', implementingUnit: '南宁供电局', startDate: '2026-01-01', endDate: '2027-06-30', budget: 180, status: '实施中', templateSnapshotId: 'tpl-renovation-v1' },
  { id: 'sf-3', topicId: 't2', code: 'ZC-JJ-001', name: '试验环境基础设施建设', projectType: '基建项目', principalName: '周工', implementingUnit: '广西电网有限责任公司', startDate: '2025-08-01', endDate: '2026-12-31', budget: 450, status: '验收中', templateSnapshotId: 'tpl-infrastructure-v1' },
];

export const MOCK_ARCHIVE_SUBMISSIONS: ArchiveSubmission[] = [
  { id: 'as-public-1', requirementId: 'ar-public-1', ownerType: 'PROJECT_PUBLIC', ownerId: 'p1', applicability: 'APPLICABLE', status: '已通过', fileIds: ['file-project-application'], version: 1, submittedAt: '2026-01-05', updatedAt: '2026-01-06' },
  { id: 'as-topic-1', requirementId: 'ar-topic-4', ownerType: 'TOPIC_NATIONAL', ownerId: 't1', topicId: 't1', applicability: 'APPLICABLE', status: '初审中', fileIds: ['file-ip-proof'], version: 1, submittedAt: '2026-09-02', updatedAt: '2026-09-02' },
  { id: 'as-self-1', requirementId: 'ar-tech-1', ownerType: 'SELF_FUNDED', ownerId: 'sf-1', topicId: 't1', applicability: 'APPLICABLE', status: '终审中', fileIds: ['file-initiation'], version: 1, submittedAt: '2026-08-28', updatedAt: '2026-09-03' },
];
