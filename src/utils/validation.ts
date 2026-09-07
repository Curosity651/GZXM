import dayjs from 'dayjs';
import type { Achievement, ApprovalValidation, IndicatorConfig, TimeNode, Topic } from '../types';
import { ACHIEVEMENT_EVIDENCE_RULES } from '../types';

export interface ValidationError {
  field?: string;
  message: string;
}

export const validateTopic = (topic: Topic): ValidationError[] => {
  const errors: ValidationError[] = [];
  if (!topic.leadingUnitId) errors.push({ field: 'leadingUnitId', message: '课题必须配置牵头单位' });
  return errors;
};

export const validateUnitBelongsToTopic = (topic: Topic, unitId: string): boolean => {
  return topic.leadingUnitId === unitId || topic.participatingUnitIds.includes(unitId);
};

export const validateIndicator = (
  indicator: IndicatorConfig,
  allIndicators: IndicatorConfig[],
  nodes: TimeNode[],
  topics: Topic[]
): ValidationError[] => {
  const errors: ValidationError[] = [];
  const topic = topics.find((t) => t.id === indicator.topicId);

  if (!topic) { errors.push({ message: '所属课题不存在' }); return errors; }
  if (!topic.leadingUnitId) errors.push({ message: `课题 ${topic.name} 未配置牵头单位` });
  if (!validateUnitBelongsToTopic(topic, indicator.unitId)) errors.push({ message: `责任单位 ${indicator.unitId} 不属于课题 ${topic.name}` });
  if (indicator.plannedQuantity < 0) errors.push({ field: 'plannedQuantity', message: '成果数量不得为负数' });

  const duplicate = allIndicators.find(
    (i) => i.id !== indicator.id && i.topicId === indicator.topicId && i.unitId === indicator.unitId && i.achievementType === indicator.achievementType && i.nodeId === indicator.nodeId
  );
  if (duplicate) errors.push({ message: '同一课题、单位、成果类型和时间节点不得重复配置' });

  const sameGroup = allIndicators.filter(
    (i) => i.topicId === indicator.topicId && i.unitId === indicator.unitId && i.achievementType === indicator.achievementType
  );
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const sorted = sameGroup.map((i) => ({ indicator: i, node: nodeMap.get(i.nodeId) })).filter((x) => x.node).sort((a, b) => a.node!.sortOrder - b.node!.sortOrder);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].indicator.plannedQuantity < sorted[i - 1].indicator.plannedQuantity) {
      errors.push({ message: `累计数量校验失败：${sorted[i].indicator.nodeId} 要求(${sorted[i].indicator.plannedQuantity})不得小于前一节点(${sorted[i - 1].indicator.plannedQuantity})` });
      break;
    }
  }
  return errors;
};

export const checkDuplicateAchievement = (
  achievement: Achievement,
  allAchievements: Achievement[]
): { isDuplicate: boolean; reason: string | undefined } => {
  const others = allAchievements.filter((a) => a.id !== achievement.id);

  switch (achievement.achievementType) {
    case '学术论文': {
      if (achievement.doi) {
        const doiDup = others.find((a) => a.achievementType === '学术论文' && a.doi === achievement.doi);
        if (doiDup) return { isDuplicate: true, reason: `DOI 重复：${achievement.doi}（已有成果「${doiDup.title}」）` };
      }
      const normalizedTitle = achievement.title.replace(/\s+/g, ' ').trim().toLowerCase();
      const titleDup = others.find(
        (a) =>
          a.achievementType === '学术论文' &&
          a.title.replace(/\s+/g, ' ').trim().toLowerCase() === normalizedTitle
      );
      if (titleDup) return { isDuplicate: true, reason: `论文标题重复（已有成果「${titleDup.title}」）` };
      break;
    }
    case '发明专利': {
      if (achievement.applicationNumber) {
        const appDup = others.find((a) => a.achievementType === '发明专利' && a.applicationNumber === achievement.applicationNumber);
        if (appDup) return { isDuplicate: true, reason: `申请号重复：${achievement.applicationNumber}` };
      }
      if (achievement.receiptNumber) {
        const recDup = others.find((a) => a.achievementType === '发明专利' && a.receiptNumber === achievement.receiptNumber);
        if (recDup) return { isDuplicate: true, reason: `受理号重复：${achievement.receiptNumber}` };
      }
      break;
    }
    case '软件著作权': {
      if (achievement.registrationNumber) {
        const regDup = others.find((a) => a.achievementType === '软件著作权' && a.registrationNumber === achievement.registrationNumber);
        if (regDup) return { isDuplicate: true, reason: `登记号重复：${achievement.registrationNumber}` };
      }
      break;
    }
    case '标准规范': {
      const nameDup = others.find(
        (a) =>
          a.achievementType === '标准规范' &&
          a.title.replace(/\s+/g, ' ').trim().toLowerCase() === achievement.title.replace(/\s+/g, ' ').trim().toLowerCase()
      );
      if (nameDup) return { isDuplicate: true, reason: `标准名称重复（已有「${nameDup.title}」）` };
      break;
    }
    case '人才培养': {
      if (achievement.studentName && achievement.thesisTitle) {
        const dup = others.find(
          (a) =>
            a.achievementType === '人才培养' &&
            a.studentName === achievement.studentName &&
            a.thesisTitle === achievement.thesisTitle
        );
        if (dup) return { isDuplicate: true, reason: `学生姓名+论文题目重复（已有「${dup.studentName} / ${dup.thesisTitle}」）` };
      }
      break;
    }
  }
  return { isDuplicate: false, reason: undefined };
};

export const validateEvidenceMaterials = (
  achievement: Achievement
): { passed: boolean; detail?: string } => {
  const evidenceDef = ACHIEVEMENT_EVIDENCE_RULES[achievement.achievementType];
  if (!evidenceDef) return { passed: true };

  const uploadedApproved = achievement.materials
    .filter((m) => m.status === '审核通过')
    .map((m) => m.materialType);

  const rule = evidenceDef.rule;
  if (rule.type === 'SINGLE') {
    const missing = rule.options.filter((opt) => !uploadedApproved.includes(opt));
    if (missing.length > 0) {
      return { passed: false, detail: `缺少已审核通过的材料：${missing.join('、')}` };
    }
  } else if (rule.type === 'OR') {
    const hasAny = rule.options.some((opt) => uploadedApproved.includes(opt));
    if (!hasAny && rule.options.length > 0) {
      return { passed: false, detail: `需至少上传以下材料之一：${rule.options.join(' 或 ')}` };
    }
  }
  return { passed: true };
};

export const validateAchievementForApproval = (
  achievement: Achievement,
  indicator?: IndicatorConfig,
  node?: TimeNode,
  allAchievements?: Achievement[]
): ApprovalValidation => {
  const checks = [];

  // 1. 关联有效指标
  const hasValidIndicator = !!indicator;
  checks.push({
    label: '已关联有效指标',
    passed: hasValidIndicator,
    detail: hasValidIndicator ? undefined : '未关联有效指标',
  });

  // 2. 成果认定状态检查（基于 paperStatus/patentStatus）
  let recognitionMet = true;
  let recognitionDetail: string | undefined;
  switch (achievement.achievementType) {
    case '学术论文':
      if (!achievement.paperStatus) {
        recognitionMet = false;
        recognitionDetail = '未选择论文状态';
      } else if (achievement.paperStatus === '已录用' && !achievement.acceptanceDate) {
        recognitionMet = false;
        recognitionDetail = '已录用状态需填写录用日期';
      } else if (achievement.paperStatus === '已正式刊出' && !achievement.publicationDate) {
        recognitionMet = false;
        recognitionDetail = '已正式刊出状态需填写正式刊出日期';
      }
      break;
    case '发明专利':
      if (!achievement.patentStatus) {
        recognitionMet = false;
        recognitionDetail = '未选择专利状态';
      } else if (achievement.patentStatus === '已受理' && !achievement.receiptDate) {
        recognitionMet = false;
        recognitionDetail = '已受理状态需填写受理日期';
      } else if (achievement.patentStatus === '已授权' && !achievement.grantDate) {
        recognitionMet = false;
        recognitionDetail = '已授权状态需填写授权日期';
      }
      break;
    case '软件著作权':
      if (!achievement.certificateDate) {
        recognitionMet = false;
        recognitionDetail = '需填写证书日期';
      }
      break;
    case '标准规范':
      if (!achievement.draftCommitDate) {
        recognitionMet = false;
        recognitionDetail = '需填写送审提交日期';
      }
      break;
    case '人才培养':
      if (!achievement.actualGraduationDate && !achievement.defenseDate) {
        recognitionMet = false;
        recognitionDetail = '需填写实际毕业日期或论文答辩日期';
      }
      break;
  }
  checks.push({
    label: '成果认定状态满足要求',
    passed: recognitionMet,
    detail: recognitionMet ? undefined : recognitionDetail,
  });

  // 3. recognizedCompletionDate 是否已填写
  const hasCompletionDate = !!achievement.recognizedCompletionDate;
  checks.push({
    label: '已填写认定完成日期',
    passed: hasCompletionDate,
    detail: hasCompletionDate ? undefined : '未填写认定完成日期',
  });

  // 4. 佐证材料是否满足规则
  const evidenceCheck = validateEvidenceMaterials(achievement);
  checks.push({
    label: `佐证材料满足认定条件（${ACHIEVEMENT_EVIDENCE_RULES[achievement.achievementType]?.displayText || '-'}）`,
    passed: evidenceCheck.passed,
    detail: evidenceCheck.detail,
  });

  // 5. 重复成果检查
  let duplicateCheck = { isDuplicate: false, reason: undefined as string | undefined };
  if (allAchievements) {
    duplicateCheck = checkDuplicateAchievement(achievement, allAchievements);
  }
  checks.push({
    label: '未发现重复成果',
    passed: !duplicateCheck.isDuplicate,
    detail: duplicateCheck.reason || '基于题目和DOI等初步判断',
  });

  // 6. 是否超过节点截止时间
  if (node && achievement.recognizedCompletionDate) {
    const onTime = dayjs(achievement.recognizedCompletionDate).isBefore(dayjs(node.deadline)) || dayjs(achievement.recognizedCompletionDate).isSame(dayjs(node.deadline));
    checks.push({
      label: '认定完成日期未超过节点截止时间',
      passed: onTime,
      detail: onTime ? undefined : `认定完成日期 ${achievement.recognizedCompletionDate} 已超过节点截止时间 ${node.deadline}`,
    });
  } else {
    checks.push({ label: '认定完成日期未超过节点截止时间', passed: true });
  }

  return {
    passed: checks.every((c) => c.passed),
    checks,
  };
};
