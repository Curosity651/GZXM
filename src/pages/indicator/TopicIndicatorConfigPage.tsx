import { useState } from 'react';
import { Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Space, Switch, Table, Tag, Typography, message } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import type { Topic, TopicIndicator, TopicUnitMembership, UnitIndicatorAllocation } from '../../types';
import { useAppStore } from '../../store';
import { canPerform } from '../../domain/permissions';
import { isGlobalUser, isTopicLead } from '../../domain/topic-access';
import { validateTopicIndicators, validateUnitAllocations } from '../../domain/indicator-allocation';

const now = () => new Date().toISOString();

export function TopicIndicatorConfigPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const state = useAppStore();
  const user = state.currentUser!;
  const existing = topicId && topicId !== 'new' ? state.topics.find((topic) => topic.id === topicId) : undefined;
  const isNew = !existing;
  const canManageTopic = canPerform(user, state.roles, 'topic.manage');
  const canPublishTopic = canPerform(user, state.roles, 'topic-indicator.publish');
  const canAllocate = canPerform(user, state.roles, 'unit-allocation.manage');
  const [form] = Form.useForm<Partial<Topic>>();
  const [requirements, setRequirements] = useState<Record<string, number>>(existing?.topicOverallRequirements ?? {});
  const [nodeId, setNodeId] = useState(state.nodes.at(-1)?.id);
  const [allocationDraft, setAllocationDraft] = useState<Record<string, number>>({});
  const [reportModal, setReportModal] = useState(false);
  const [reportConfig, setReportConfig] = useState(existing?.reportConfig ?? { effectiveYear: new Date().getFullYear(), monthlyEnabled: true, monthlyOpenDay: 1, monthlyDeadlineDay: 30, quarterlyEnabled: true, quarterlyOpenDay: 1, quarterlyDeadlineDay: 10, quarterlyMonths: [3, 6, 9, 12] });
  const definitions = state.indicatorDefinitions.filter((item) => item.enabled);
  const memberships = state.topicMemberships.filter((item) => item.topicId === existing?.id);
  const activeMemberships = memberships.filter((item) => item.enabled);
  const isLead = Boolean(existing && isTopicLead(user, existing.id, state.topicMemberships));
  const canEditAllocation = canAllocate && (isLead || isGlobalUser(user));
  const allocationMemberships = isLead || isGlobalUser(user) ? activeMemberships : activeMemberships.filter((item) => item.unitId === user.unitId);
  const published = state.topicIndicators.filter((item) => item.topicId === existing?.id && item.status === '已下发');
  const unitMap = Object.fromEntries(state.units.map((unit) => [unit.id, unit.name]));
  const targetRows = definitions.map((definition) => {
    const current = state.topicIndicators.find((item) => item.topicId === existing?.id && item.nodeId === nodeId && item.indicatorDefinitionId === definition.id);
    return { definition, current, quantity: current?.targetQuantity ?? requirements[definition.id] ?? requirements[definition.achievementType] ?? 0 };
  });

  const saveTopic = async () => {
    if (!canManageTopic) return;
    const values = await form.validateFields();
    const id = existing?.id ?? `topic-${Date.now()}`;
    const topic = { ...values, id, projectId: state.project.id, code: values.code!, name: values.name!, leadingUnitId: values.leadingUnitId!, participatingUnitIds: values.participatingUnitIds ?? [], domesticJournalRequiredCount: existing?.domesticJournalRequiredCount ?? 0, topicOverallRequirements: requirements, reportConfig } as Topic;
    if (existing) state.updateTopic(id, topic); else state.addTopic(topic);
    topic.participatingUnitIds.forEach((unitId) => {
      const old = state.topicMemberships.find((item) => item.topicId === id && item.unitId === unitId);
      state.saveTopicMembership({ id: old?.id ?? `membership-${id}-${unitId}`, topicId: id, unitId, membershipType: 'PARTICIPANT', enabled: true, createdAt: old?.createdAt ?? now(), updatedAt: now() });
    });
    const rows: TopicIndicator[] = definitions.map((definition) => ({ id: `topic-indicator-${id}-${definition.id}-${nodeId}`, projectId: state.project.id, topicId: id, indicatorDefinitionId: definition.id, achievementType: definition.achievementType, nodeId: nodeId!, targetQuantity: requirements[definition.id] ?? requirements[definition.achievementType] ?? 0, status: '草稿', version: 0, createdAt: now(), updatedAt: now() }));
    state.saveTopicIndicators(rows); state.publishTopicIndicators(id, user.name);
    message.success('课题配置已确认'); navigate('/indicator');
  };

  const saveTargets = () => {
    if (!existing || !nodeId) return;
    const rows: TopicIndicator[] = targetRows.map(({ definition, current, quantity }) => ({ id: current?.id ?? `topic-indicator-${existing.id}-${definition.id}-${nodeId}`, projectId: state.project.id, topicId: existing.id, indicatorDefinitionId: definition.id, achievementType: definition.achievementType, nodeId, targetQuantity: quantity, status: current?.status ?? '草稿', version: current?.version ?? 0, publishedAt: current?.publishedAt, publishedBy: current?.publishedBy, createdAt: current?.createdAt ?? now(), updatedAt: now() }));
    const issues = validateTopicIndicators(rows); if (issues.length) return message.error(issues[0].message);
    state.updateTopic(existing.id, { topicOverallRequirements: requirements }); state.saveTopicIndicators(rows); state.publishTopicIndicators(existing.id, user.name); message.success('课题总体指标已确认');
  };

  const allocationValue = (indicator: TopicIndicator, membership: TopicUnitMembership) => allocationDraft[`allocation-${indicator.id}-${membership.unitId}`] ?? state.unitIndicatorAllocations.find((item) => item.id === `allocation-${indicator.id}-${membership.unitId}`)?.targetQuantity ?? 0;
  const saveAllocations = () => {
    if (!existing) return;
    const rows: UnitIndicatorAllocation[] = published.flatMap((indicator) => activeMemberships.map((membership) => { const id = `allocation-${indicator.id}-${membership.unitId}`; const old = state.unitIndicatorAllocations.find((item) => item.id === id); return { id, projectId: state.project.id, topicId: existing.id, membershipId: membership.id, unitId: membership.unitId, topicIndicatorId: indicator.id, indicatorDefinitionId: indicator.indicatorDefinitionId, achievementType: indicator.achievementType, nodeId: indicator.nodeId, targetQuantity: allocationValue(indicator, membership), status: old?.status ?? '草稿', version: old?.version ?? 0, publishedAt: old?.publishedAt, publishedBy: old?.publishedBy, createdAt: old?.createdAt ?? now(), updatedAt: now() }; }));
    const issues = validateUnitAllocations(published, rows, state.achievements); if (issues.length) return message.error(issues[0].message);
    state.saveUnitAllocations(rows); state.publishUnitAllocations(existing.id, user.name); message.success('单位指标分配已确认');
  };

  if (!isNew && !existing) return <Card>课题不存在 <Button type="link" onClick={() => navigate('/indicator')}>返回课题列表</Button></Card>;
  return <div className={`topic-indicator-editor ${isNew ? 'topic-editor-new' : ''}`}><Space style={{ marginBottom: 18 }}><Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/indicator')}>返回课题列表</Button><Typography.Text type="secondary">{isNew ? '新建课题' : existing?.code}</Typography.Text></Space><Row gutter={18} align="top"><Col span={isNew ? 12 : 10}><Card title="课题信息" extra={canManageTopic && <Button type="primary" icon={<SaveOutlined />} onClick={saveTopic}>确认课题配置</Button>}><Form form={form} layout="vertical" initialValues={existing ?? { status: '实施中', startDate: state.project.startDate, endDate: state.project.endDate, participatingUnitIds: [] }} disabled={!canManageTopic}><Row gutter={12}><Col span={8}><Form.Item label="课题编号" name="code" rules={[{ required: true }]}><Input /></Form.Item></Col><Col span={16}><Form.Item label="课题名称" name="name" rules={[{ required: true }]}><Input /></Form.Item></Col><Col span={24}><Form.Item label="牵头单位" name="leadingUnitId" rules={[{ required: true }]}><Select options={state.units.map((unit) => ({ label: unit.name, value: unit.id }))} /></Form.Item></Col><Col span={12}><Form.Item label="课题负责人" name="principalName"><Input /></Form.Item></Col><Col span={12}><Form.Item label="状态" name="status"><Select options={['草稿', '实施中', '已暂停', '已结题'].map((value) => ({ label: value, value }))} /></Form.Item></Col><Col span={12}><Form.Item label="开始日期" name="startDate"><Input type="date" /></Form.Item></Col><Col span={12}><Form.Item label="结束日期" name="endDate"><Input type="date" /></Form.Item></Col></Row><Form.Item label="承担单位" name="participatingUnitIds"><Select mode="multiple" options={state.units.map((unit) => ({ label: unit.name, value: unit.id }))} /></Form.Item><Form.Item label="研究内容摘要" name="summary"><Input.TextArea rows={3} /></Form.Item></Form></Card></Col><Col span={isNew ? 12 : 14}><Card title="课题总体指标" extra={canPublishTopic && <Button type="primary" onClick={isNew ? saveTopic : saveTargets}>确认</Button>}><Space style={{ marginBottom: 12 }}>考核节点<Select value={nodeId} onChange={setNodeId} options={state.nodes.map((node) => ({ label: node.name, value: node.id }))} /></Space><Table size="small" rowKey={(row) => row.definition.id} dataSource={targetRows} pagination={false} columns={[{ title: '指标名称', render: (_: unknown, row: (typeof targetRows)[number]) => <b>{row.definition.name}</b> }, { title: '目标值', width: 130, render: (_: unknown, row: (typeof targetRows)[number]) => <InputNumber min={0} precision={0} disabled={!canPublishTopic} value={row.quantity} onChange={(value) => setRequirements({ ...requirements, [row.definition.id]: value ?? 0 })} /> }, { title: '状态', render: (_: unknown, row: (typeof targetRows)[number]) => row.current ? <Tag>{row.current.status}</Tag> : '未确认' }]} /><div style={{ marginTop: 12, textAlign: 'right' }}><Button onClick={() => setReportModal(true)}>课题月季报配置</Button></div></Card></Col>{existing && <Col span={24}><Card title="单位指标分配" extra={canEditAllocation && <Button type="primary" onClick={saveAllocations}>确认</Button>}><Table size="small" rowKey="id" dataSource={published} pagination={false} scroll={{ x: 580 }} columns={[{ title: '指标', render: (_: unknown, row: TopicIndicator) => definitions.find((definition) => definition.id === row.indicatorDefinitionId)?.name ?? row.achievementType }, ...allocationMemberships.map((membership) => ({ title: unitMap[membership.unitId], render: (_: unknown, row: TopicIndicator) => <InputNumber min={0} precision={0} disabled={!canEditAllocation} value={allocationValue(row, membership)} onChange={(value) => setAllocationDraft({ ...allocationDraft, [`allocation-${row.id}-${membership.unitId}`]: value ?? 0 })} /> })), { title: '课题目标', dataIndex: 'targetQuantity' }]} /></Card></Col>}</Row><Modal title="课题月季报配置" open={reportModal} onCancel={() => setReportModal(false)} onOk={() => { if (reportConfig.monthlyOpenDay > reportConfig.monthlyDeadlineDay || reportConfig.quarterlyOpenDay > reportConfig.quarterlyDeadlineDay) return message.warning('截止日不能早于开放日'); if (existing) state.updateTopic(existing.id, { reportConfig }); setReportModal(false); message.success(existing ? '月季报配置已保存' : '月季报配置已暂存'); }} okText="确认"><Row gutter={16}><Col span={8}><Typography.Text>生效年度</Typography.Text><InputNumber min={2020} max={2100} style={{ width: '100%', marginTop: 8 }} value={reportConfig.effectiveYear} onChange={(value) => setReportConfig({ ...reportConfig, effectiveYear: value ?? new Date().getFullYear() })} /></Col><Col span={8}><Typography.Text>启用月报</Typography.Text><div style={{ marginTop: 12 }}><Switch checked={reportConfig.monthlyEnabled} onChange={(value) => setReportConfig({ ...reportConfig, monthlyEnabled: value })} /></div></Col><Col span={8}><Typography.Text>启用季报</Typography.Text><div style={{ marginTop: 12 }}><Switch checked={reportConfig.quarterlyEnabled} onChange={(value) => setReportConfig({ ...reportConfig, quarterlyEnabled: value })} /></div></Col><Col span={12} style={{ marginTop: 16 }}><Typography.Text>月报开放日 / 截止日</Typography.Text><Space style={{ marginTop: 8 }}><InputNumber min={1} max={31} value={reportConfig.monthlyOpenDay} onChange={(value) => setReportConfig({ ...reportConfig, monthlyOpenDay: value ?? 1 })} /><InputNumber min={1} max={31} value={reportConfig.monthlyDeadlineDay} onChange={(value) => setReportConfig({ ...reportConfig, monthlyDeadlineDay: value ?? 30 })} /></Space></Col><Col span={12} style={{ marginTop: 16 }}><Typography.Text>季报开放日 / 截止日</Typography.Text><Space style={{ marginTop: 8 }}><InputNumber min={1} max={31} value={reportConfig.quarterlyOpenDay} onChange={(value) => setReportConfig({ ...reportConfig, quarterlyOpenDay: value ?? 1 })} /><InputNumber min={1} max={31} value={reportConfig.quarterlyDeadlineDay} onChange={(value) => setReportConfig({ ...reportConfig, quarterlyDeadlineDay: value ?? 10 })} /></Space></Col><Col span={24} style={{ marginTop: 16 }}><Typography.Text>季报月份</Typography.Text><Select mode="multiple" style={{ width: '100%', marginTop: 8 }} value={reportConfig.quarterlyMonths} onChange={(value) => setReportConfig({ ...reportConfig, quarterlyMonths: value })} options={Array.from({ length: 12 }, (_, index) => ({ label: `${index + 1} 月`, value: index + 1 }))} /></Col></Row></Modal></div>;
}
