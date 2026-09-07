// 项目
export interface Project {
  id: string; name: string; code: string; startDate: string; endDate: string;
}

// 项目单位
export type UnitCategory = '电网公司' | '高校' | '科研院所' | '企业' | '其他';
export interface ProjectUnit {
  id: string; projectId: string; name: string; shortName?: string;
  unitCategory: UnitCategory; countsAsPowerGridUnit: boolean;
}

// 课题
export interface Topic {
  id: string; projectId: string; code: string; name: string;
  leadingUnitId: string; participatingUnitIds: string[];
  principalName?: string;
  contactName?: string; contactPhone?: string; contactEmail?: string;
  financeAssistant?: string; financeAssistantEmail?: string; financeAssistantPhone?: string;
  domesticJournalRequiredCount: number;
  topicOverallRequirements: Record<string, number>;
  remarks?: string;
}

// 电网公司主导成果要求
export interface TopicPowerGridRequirement {
  id: string; projectId: string; topicId: string;
  achievementType: '学术论文' | '发明专利' | '软件著作权' | '标准规范';
  requiredCount: number;
}

export type AchievementType = '学术论文' | '发明专利' | '软件著作权' | '标准规范' | '人才培养';
export const ACHIEVEMENT_TYPES: AchievementType[] = ['学术论文', '发明专利', '软件著作权', '标准规范', '人才培养'];

export type PaperType = 'SCI' | 'EI' | '中文核心' | 'CSCD' | '其他';
export const PAPER_TYPES: PaperType[] = ['SCI', 'EI', '中文核心', 'CSCD', '其他'];
export type EducationLevel = '博士' | '硕士';

export type AchievementStatus = '草稿' | '已提交' | '审批中' | '审批通过' | '审批不通过' | '退回修改';
export const ACHIEVEMENT_STATUS: AchievementStatus[] = ['草稿', '已提交', '审批中', '审批通过', '审批不通过', '退回修改'];

// 时间节点
export interface TimeNode {
  id: string; projectId: string; name: string; deadline: string;
  description?: string; participatesInWarning: boolean; sortOrder: number;
}

// 指标配置（简化版）
export interface IndicatorConfig {
  id: string; projectId: string; topicId: string; unitId: string;
  achievementType: AchievementType; nodeId: string; plannedQuantity: number;
  remarks?: string; createdAt: string; updatedAt: string;
}

// 佐证材料规则
export type EvidenceRule =
  | { type: 'SINGLE'; options: string[] }
  | { type: 'OR'; options: string[] };

export interface EvidenceRuleDef {
  rule: EvidenceRule;
  displayText: string;
}

export const ACHIEVEMENT_EVIDENCE_RULES: Record<AchievementType, EvidenceRuleDef> = {
  学术论文: { rule: { type: 'OR', options: ['正式刊出证明', '论文录用通知'] }, displayText: '正式刊出或取得录用通知' },
  发明专利: { rule: { type: 'OR', options: ['发明专利受理证明文件', '发明专利授权证明文件'] }, displayText: '发明专利受理或授权证明文件' },
  软件著作权: { rule: { type: 'SINGLE', options: ['软件著作权证书'] }, displayText: '取得软件著作权证书' },
  标准规范: { rule: { type: 'SINGLE', options: ['标准送审稿'] }, displayText: '提交标准送审稿' },
  人才培养: { rule: { type: 'SINGLE', options: ['研究生学位论文证明材料'] }, displayText: '提供研究生学位论文证明材料' },
};

// 佐证材料
export type MaterialStatus = '未提交' | '待审核' | '审核通过' | '退回修改';
export const MATERIAL_STATUS: MaterialStatus[] = ['未提交', '待审核', '审核通过', '退回修改'];

export interface AchievementMaterial {
  id: string; achievementId: string; materialType: string; name: string;
  fileId: string; fileName: string; fileUrl: string; version: number;
  status: MaterialStatus; uploadedAt?: string; reviewedAt?: string; reviewOpinion?: string;
}

// 成果
export interface Achievement {
  id: string; projectId: string; topicId: string; unitId: string;
  achievementType: AchievementType;

  indicatorId: string; nodeId: string;

  title: string; responsiblePerson: string; otherContributors?: string[];
  progressStatus: string;
  plannedCompletionDate?: string; recognizedCompletionDate?: string;

  status: AchievementStatus; countsToIndicator: boolean;
  createdAt: string; updatedAt: string; submittedAt?: string; remarks: string;

  approvalOpinion?: string; approvedAt?: string; approver?: string;

  // 状态字段（替代旧认定类型）
  paperStatus?: string;  // 撰写中 | 已投稿 | 已录用 | 已正式刊出
  patentStatus?: string; // 申请材料准备中 | 已申请 | 已受理 | 已授权

  standardNumber?: string; publishDate?: string; implementDate?: string; // 标准已发布补充

  // 论文特有
  isChineseJournal?: boolean;
  paperType?: string; journalName?: string; cnNumber?: string; issn?: string;
  doi?: string; firstAuthor?: string; correspondingAuthor?: string; allAuthors?: string;
  signingUnitList?: string; firstSigningUnit?: string; firstAuthorUnit?: string;
  submissionDate?: string; acceptanceDate?: string; publicationDate?: string;
  projectLabeling?: string; journalYearVolumePage?: string; // 期刊年/卷/期/页码

  // 专利特有
  patentScope?: '国内' | '国际'; applicant?: string; applicantList?: string;
  firstApplicant?: string; inventors?: string; inventorList?: string;
  firstInventor?: string; firstInventorUnit?: string;
  applicationNumber?: string; receiptNumber?: string; applicationDate?: string;
  receiptDate?: string; grantDate?: string; patentNumber?: string;
  grantPublicationNumber?: string; grantPublicationDate?: string;
  patentHolderList?: string; legalStatus?: string;

  // 软著特有
  shortName?: string; version?: string; softwareFullName?: string;
  copyrightOwner?: string; copyrightOwnerList?: string; firstCopyrightOwner?: string;
  developers?: string; mainDevelopers?: string; firstDeveloper?: string;
  firstDeveloperUnit?: string; softwareMainFunctions?: string;
  completionDate?: string; registrationApplicationDate?: string;
  registrationNumber?: string; certificateDate?: string;

  // 标准特有
  standardLevel?: string; leadingUnit?: string; participatingUnits?: string;
  otherDraftingUnits?: string; drafters?: string; firstDrafter?: string;
  firstDrafterUnit?: string; responsibleOrganization?: string; currentStage?: string;
  draftSubmissionDate?: string; draftCommitDate?: string;

  // 人才特有
  studentName?: string; educationLevel?: EducationLevel; trainingUnit?: string;
  supervisorName?: string; supervisorUnit?: string; thesisTitle?: string;
  defenseDate?: string; enrollmentDate?: string;
  expectedGraduationDate?: string; actualGraduationDate?: string; trainingStatus?: string;

  materials: AchievementMaterial[];
}

// 预警
export type WarningLevel = 'yellow' | 'orange' | 'red';
export type WarningType = 'time' | 'quantity_gap' | 'progress' | 'material' | 'chinese_journal_ratio';

export const WARNING_TYPES: { value: WarningType; label: string }[] = [
  { value: 'time', label: '时间预警' }, { value: 'quantity_gap', label: '数量缺口预警' },
  { value: 'progress', label: '成果进度预警' }, { value: 'material', label: '佐证材料预警' },
  { value: 'chinese_journal_ratio', label: '国内期刊比例预警' },
];

export interface WarningLevelConfig {
  level: WarningLevel; advanceDays: number; completionRateThreshold: number;
}

export interface WarningRule {
  id: string; projectId: string; type: WarningType; name: string;
  levels: WarningLevelConfig[]; enabled: boolean;
}

export interface WarningResult {
  id: string; type: WarningType; level: WarningLevel; title: string; message: string;
  topicId?: string; unitId?: string; achievementType?: AchievementType; nodeId?: string;
  deadline?: string; daysRemaining?: number; gap?: number;
}

// 归档
export interface ArchiveCategory {
  id: string; projectId: string; name: string; description: string; parentId?: string; sortOrder: number;
}

export interface ArchiveMaterial {
  id: string; projectId: string; categoryId: string; requirementId?: string;
  name: string; fileName: string; fileUrl?: string;
  sourceAchievementId?: string; uploader: string; uploadedAt: string; remarks: string;
  versions: ArchiveMaterialVersion[];
}

export interface ArchiveMaterialVersion {
  id: string; archiveMaterialId: string; version: number;
  fileName: string; fileUrl: string; uploadedAt: string; uploader: string; versionDescription?: string;
}

export interface ArchiveRequirement {
  id: string; projectId: string; categoryId: string; name: string;
  required: boolean; requiredQuantity: number;
  applicableNodeId?: string; description?: string;
}

// 统计
export interface CompletionStats {
  viewKey: string; topicId?: string; unitId?: string;
  achievementType: AchievementType; nodeId: string; nodeName: string; deadline: string;
  plannedQuantity: number; registeredCount: number; recognizedCount: number;
  missingCount: number; completionRate: number;
}

export interface ArchiveMonitoringStats {
  categoryId: string; categoryName: string; requiredCount: number;
  uploadedCount: number; missingCount: number; completionRate: number;
}

export interface ApprovalValidation {
  passed: boolean;
  checks: { label: string; passed: boolean; detail?: string }[];
}

// 用户与认证
export type UserRole = '系统管理员' | '项目管理人员' | '课题用户' | '成果审批人员';

export interface User {
  id: string; username: string; password: string; name: string;
  unitId: string; phone?: string; email?: string;
  role: UserRole; enabled: boolean;
  createdAt: string; lastLoginAt?: string;
}

export interface AuthState {
  currentUser: User | null; isAuthenticated: boolean;
}

// 文件服务接口
export interface FileService {
  upload(file: File): Promise<{ fileId: string; fileName: string; fileUrl: string }>;
  download(fileId: string): Promise<void>;
  preview(fileId: string): Promise<string>;
  delete(fileId: string): Promise<void>;
  getVersions(fileId: string): Promise<Array<{ version: number; fileName: string; uploadedAt: string; uploader: string }>>;
}
