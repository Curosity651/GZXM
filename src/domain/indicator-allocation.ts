import type { Achievement, TopicIndicator, UnitIndicatorAllocation } from '../types';

export interface AllocationValidationIssue {
  topicIndicatorId: string;
  message: string;
}

export function validateTopicIndicators(rows: TopicIndicator[]): AllocationValidationIssue[] {
  const seen = new Set<string>();
  const issues: AllocationValidationIssue[] = [];
  rows.forEach((row) => {
    const key = `${row.topicId}:${row.indicatorDefinitionId}:${row.nodeId}`;
    if (seen.has(key)) issues.push({ topicIndicatorId: row.id, message: '同一指标与考核节点只能配置一行' });
    if (!Number.isFinite(row.targetQuantity) || row.targetQuantity < 0) issues.push({ topicIndicatorId: row.id, message: '目标值必须为大于等于 0 的数字' });
    seen.add(key);
  });
  return issues;
}

export function effectiveCount(allocation: UnitIndicatorAllocation, achievements: Achievement[]): number {
  return achievements.filter((item) => item.status === '已生效'
    && item.topicId === allocation.topicId
    && (item.uploadUnitId ?? item.unitId) === allocation.unitId
    && item.achievementType === allocation.achievementType
    && item.nodeId === allocation.nodeId).length;
}

export function validateUnitAllocations(
  topicIndicators: TopicIndicator[],
  allocations: UnitIndicatorAllocation[],
  achievements: Achievement[],
): AllocationValidationIssue[] {
  return topicIndicators.flatMap((topicIndicator) => {
    const rows = allocations.filter((item) => item.topicIndicatorId === topicIndicator.id);
    const total = rows.reduce((sum, item) => sum + (Number(item.targetQuantity) || 0), 0);
    const issues: AllocationValidationIssue[] = [];
    if (total < topicIndicator.targetQuantity) {
      issues.push({ topicIndicatorId: topicIndicator.id, message: `单位合计 ${total}，低于课题目标 ${topicIndicator.targetQuantity}` });
    }
    rows.forEach((row) => {
      const count = effectiveCount(row, achievements);
      if (row.targetQuantity < count) issues.push({ topicIndicatorId: topicIndicator.id, message: `${row.unitId} 的目标不能低于已生效成果数 ${count}` });
    });
    return issues;
  });
}

