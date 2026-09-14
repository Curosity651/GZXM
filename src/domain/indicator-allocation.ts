import type { Achievement, IndicatorDefinition, TimeNode, TopicIndicator, UnitIndicatorAllocation } from '../types';
import { achievementMatchesIndicator } from './achievement';

export interface AllocationValidationIssue {
  topicIndicatorId: string;
  message: string;
}

export const indicatorTargetDraftKey = (nodeId: string, definitionId: string) => `${nodeId}:${definitionId}`;

export function validateTopicIndicators(rows: TopicIndicator[], existingRows: TopicIndicator[] = [], nodes: TimeNode[] = [], definitions: IndicatorDefinition[] = []): AllocationValidationIssue[] {
  const seen = new Set<string>();
  const issues: AllocationValidationIssue[] = [];
  rows.forEach((row) => {
    const key = `${row.topicId}:${row.indicatorDefinitionId}:${row.nodeId}`;
    if (seen.has(key)) issues.push({ topicIndicatorId: row.id, message: '同一指标与考核节点只能配置一行' });
    if (!Number.isFinite(row.targetQuantity) || row.targetQuantity < 0) issues.push({ topicIndicatorId: row.id, message: '目标值必须为大于等于 0 的数字' });
    seen.add(key);
  });
  const merged = [...existingRows.filter((current) => !rows.some((row) => row.topicId === current.topicId && row.nodeId === current.nodeId && row.indicatorDefinitionId === current.indicatorDefinitionId)), ...rows];
  const nodeOrder = new Map(nodes.map((node) => [node.id, node.sortOrder]));
  const groups = new Map<string, TopicIndicator[]>();
  merged.forEach((row) => {
    const key = `${row.topicId}:${row.indicatorDefinitionId}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  });
  groups.forEach((group) => group.sort((left, right) => (nodeOrder.get(left.nodeId) ?? 0) - (nodeOrder.get(right.nodeId) ?? 0)).forEach((row, index) => {
    const previous = group[index - 1];
    if (previous && row.targetQuantity < previous.targetQuantity) issues.push({ topicIndicatorId: row.id, message: '累计目标不能低于上一考核节点' });
  }));
  rows.forEach((row) => {
    const definition = definitions.find((item) => item.id === row.indicatorDefinitionId);
    if (!definition || definition.name === definition.achievementType) return;
    const baseDefinition = definitions.find((item) => item.enabled && item.name === definition.achievementType);
    const base = merged.find((item) => item.topicId === row.topicId && item.nodeId === row.nodeId && item.indicatorDefinitionId === baseDefinition?.id);
    if (base && row.targetQuantity > base.targetQuantity) issues.push({ topicIndicatorId: row.id, message: `${definition.name}属于${definition.achievementType}总目标，不能高于总目标 ${base.targetQuantity}` });
  });
  return issues;
}

export function effectiveCount(allocation: UnitIndicatorAllocation, achievements: Achievement[], nodes: TimeNode[] = []): number {
  const nodeOrder = new Map(nodes.map((node) => [node.id, node.sortOrder]));
  const selectedOrder = nodeOrder.get(allocation.nodeId);
  return achievements.filter((item) => item.status === '已生效'
    && item.topicId === allocation.topicId
    && (item.uploadUnitId ?? item.unitId) === allocation.unitId
    && achievementMatchesIndicator(item, allocation.indicatorDefinitionId, allocation.achievementType)
    && (selectedOrder === undefined ? item.nodeId === allocation.nodeId : (nodeOrder.get(item.nodeId) ?? Number.POSITIVE_INFINITY) <= selectedOrder)).length;
}

export function validateUnitAllocations(
  topicIndicators: TopicIndicator[],
  allocations: UnitIndicatorAllocation[],
  achievements: Achievement[],
  nodes: TimeNode[] = [],
  definitions: IndicatorDefinition[] = [],
): AllocationValidationIssue[] {
  const issues = topicIndicators.flatMap((topicIndicator) => {
    const rows = allocations.filter((item) => item.topicIndicatorId === topicIndicator.id);
    const total = rows.reduce((sum, item) => sum + (Number(item.targetQuantity) || 0), 0);
    const issues: AllocationValidationIssue[] = [];
    if (total < topicIndicator.targetQuantity) {
      issues.push({ topicIndicatorId: topicIndicator.id, message: `单位合计 ${total}，低于课题目标 ${topicIndicator.targetQuantity}` });
    }
    rows.forEach((row) => {
      const count = effectiveCount(row, achievements, nodes);
      if (row.targetQuantity < count) issues.push({ topicIndicatorId: topicIndicator.id, message: `${row.unitId} 的目标不能低于已生效成果数 ${count}` });
    });
    return issues;
  });
  topicIndicators.forEach((indicator) => {
    const definition = definitions.find((item) => item.id === indicator.indicatorDefinitionId);
    if (!definition || definition.name === definition.achievementType) return;
    const baseDefinition = definitions.find((item) => item.enabled && item.name === definition.achievementType);
    allocations.filter((item) => item.topicIndicatorId === indicator.id).forEach((special) => {
      const base = allocations.find((item) => item.topicId === special.topicId && item.nodeId === special.nodeId && item.unitId === special.unitId && item.indicatorDefinitionId === baseDefinition?.id);
      if (base && special.targetQuantity > base.targetQuantity) issues.push({ topicIndicatorId: indicator.id, message: `${special.unitId} 的${definition.name}属于${definition.achievementType}总目标，不能高于该单位总目标 ${base.targetQuantity}` });
    });
  });
  return issues;
}
