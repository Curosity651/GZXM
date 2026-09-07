import dayjs from 'dayjs';
import type {
  Achievement,
  AchievementType,
  CompletionStats,
  IndicatorConfig,
  TimeNode,
  Topic,
} from '../types';
import { daysUntil } from './helpers';

export const isRecognized = (a: Achievement, deadline?: string) => {
  const approved = a.status === '审批通过' && a.countsToIndicator;
  if (!approved) return false;
  if (deadline) {
    if (!a.recognizedCompletionDate) return false;
    return dayjs(a.recognizedCompletionDate).isBefore(dayjs(deadline)) || dayjs(a.recognizedCompletionDate).isSame(dayjs(deadline));
  }
  return true;
};

export const isUnderReview = (a: Achievement) => a.status === '已提交' || a.status === '审批中';

export const isRegistered = (a: Achievement) => ['已提交', '审批中', '审批通过', '审批不通过', '退回修改'].includes(a.status);

export const calculateCompletionStats = (
  indicator: IndicatorConfig,
  achievements: Achievement[],
  nodes: TimeNode[]
): CompletionStats => {
  const node = nodes.find((n) => n.id === indicator.nodeId);
  const deadline = node?.deadline;

  const relevant = achievements.filter(
    (a) =>
      a.topicId === indicator.topicId &&
      a.unitId === indicator.unitId &&
      a.achievementType === indicator.achievementType
  );

  const registeredCount = relevant.filter((a) => isRegistered(a)).length;
  const recognizedCount = relevant.filter((a) => isRecognized(a, deadline)).length;
  const missingCount = Math.max(0, indicator.plannedQuantity - recognizedCount);
  const completionRate = indicator.plannedQuantity > 0 ? recognizedCount / indicator.plannedQuantity : 0;

  return {
    viewKey: `${indicator.topicId}-${indicator.unitId}-${indicator.achievementType}-${indicator.nodeId}`,
    topicId: indicator.topicId,
    unitId: indicator.unitId,
    achievementType: indicator.achievementType,
    nodeId: indicator.nodeId,
    nodeName: node?.name || indicator.nodeId,
    deadline: deadline || '',
    plannedQuantity: indicator.plannedQuantity,
    registeredCount,
    recognizedCount,
    missingCount,
    completionRate,
  };
};

export interface DomesticJournalRatioResult {
  total: number;
  chinese: number;
  ratio: number | null;
  projectedTotal: number;
  projectedChinese: number;
  projectedRatio: number | null;
  minRequiredCount: number;
  gapCount: number;
}

export const calculateDomesticJournalRatio = (
  achievements: Achievement[],
  topics: Topic[]
): DomesticJournalRatioResult => {
  // Count ALL papers with status === '审批通过' && countsToIndicator (NO isRepresentative filter)
  const approvedPapers = achievements.filter(
    (a) =>
      a.achievementType === '学术论文' &&
      a.status === '审批通过' &&
      a.countsToIndicator
  );
  const total = approvedPapers.length;
  const chinese = approvedPapers.filter((a) => a.isChineseJournal).length;
  const ratio = total > 0 ? (chinese / total) * 100 : null;

  // 预计：包含审批中/已提交的论文
  const projected = achievements.filter(
    (a) =>
      a.achievementType === '学术论文' &&
      (a.status === '审批通过' || a.status === '已提交' || a.status === '审批中')
  );
  const projectedTotal = projected.length;
  const projectedChinese = projected.filter((a) => a.isChineseJournal).length;
  const projectedRatio = projectedTotal > 0 ? (projectedChinese / projectedTotal) * 100 : null;

  // Total required across all topics
  const minRequiredCount = topics.reduce((sum, t) => sum + (t.domesticJournalRequiredCount || 0), 0);

  // Gap: difference between required and actual
  const gapCount = Math.max(0, minRequiredCount - chinese);

  return {
    total, chinese,
    ratio: ratio !== null ? Number(ratio.toFixed(2)) : null,
    projectedTotal, projectedChinese,
    projectedRatio: projectedRatio !== null ? Number(projectedRatio.toFixed(2)) : null,
    minRequiredCount,
    gapCount,
  };
};

export const calculateTopicChineseJournalCount = (topicId: string, achievements: Achievement[]) => {
  return achievements.filter(
    (a) =>
      a.topicId === topicId &&
      a.achievementType === '学术论文' &&
      a.isChineseJournal &&
      a.status === '审批通过' &&
      a.countsToIndicator
  ).length;
};

// IP stats: only count 发明专利 + 软件著作权 (审批通过 + countsToIndicator)
export const calculateIPStats = (achievements: Achievement[]) => {
  const ipTypes: AchievementType[] = ['发明专利', '软件著作权'];
  return achievements.filter(
    (a) => ipTypes.includes(a.achievementType) && a.status === '审批通过' && a.countsToIndicator
  ).length;
};

export const aggregateStats = (
  indicators: IndicatorConfig[],
  achievements: Achievement[],
  nodes: TimeNode[],
  groupBy: 'project' | 'topic' | 'unit' | 'node',
  topics: Topic[]
) => {
  const stats = indicators
    .map((i) => calculateCompletionStats(i, achievements, nodes));

  const grouped = new Map<string, CompletionStats>();

  stats.forEach((s) => {
    const topic = topics.find((t) => t.id === s.topicId);
    let key = '';
    let viewKey = '';
    switch (groupBy) {
      case 'project': key = `${s.achievementType}-${s.nodeId}`; viewKey = 'project'; break;
      case 'topic': key = `${s.topicId}-${s.achievementType}-${s.nodeId}`; viewKey = `${topic?.name || s.topicId}`; break;
      case 'unit': key = `${s.topicId || 'project'}-${s.unitId || 'all'}-${s.achievementType}-${s.nodeId}`; viewKey = `${topic?.name || s.topicId} - ${s.unitId}`; break;
      case 'node': key = `${s.nodeId}-${s.achievementType}`; viewKey = s.nodeName; break;
    }

    if (!grouped.has(key)) {
      grouped.set(key, {
        viewKey,
        topicId: groupBy === 'topic' || groupBy === 'unit' ? s.topicId : undefined,
        unitId: groupBy === 'unit' ? s.unitId : undefined,
        achievementType: s.achievementType,
        nodeId: s.nodeId,
        nodeName: s.nodeName,
        deadline: s.deadline,
        plannedQuantity: 0,
        registeredCount: 0,
        recognizedCount: 0,
        missingCount: 0,
        completionRate: 0,
      });
    }

    const existing = grouped.get(key)!;
    existing.plannedQuantity += s.plannedQuantity;
    existing.registeredCount += s.registeredCount;
    existing.recognizedCount += s.recognizedCount;
    existing.missingCount += s.missingCount;
  });

  const result = Array.from(grouped.values());
  result.forEach((r) => { r.completionRate = r.plannedQuantity > 0 ? r.recognizedCount / r.plannedQuantity : 0; });
  return result;
};

export const findNearestNode = (
  indicators: IndicatorConfig[],
  nodes: TimeNode[],
  topicId?: string,
  unitId?: string,
  achievementType?: AchievementType
): { nodeId: string; nodeName: string; deadline: string; daysRemaining: number } | null => {
  const relevant = indicators.filter(
    (i) =>
      (!topicId || i.topicId === topicId) &&
      (!unitId || i.unitId === unitId) &&
      (!achievementType || i.achievementType === achievementType)
  );
  if (relevant.length === 0) return null;

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const future = relevant
    .map((i) => {
      const node = nodeMap.get(i.nodeId);
      if (!node) return null;
      return { nodeId: i.nodeId, nodeName: node.name, deadline: node.deadline, daysRemaining: daysUntil(node.deadline) };
    })
    .filter(Boolean)
    .sort((a, b) => a!.daysRemaining - b!.daysRemaining);

  return future[0] || null;
};
