import { useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Space, Switch, Table, Tabs, Tag, Typography, message } from 'antd';
import { EditOutlined, PlusOutlined, SendOutlined, SaveOutlined, TeamOutlined } from '@ant-design/icons';
import type { IndicatorDefinition, Topic, TopicIndicator, TopicUnitMembership, UnitIndicatorAllocation } from '../../types';
import { useAppStore } from '../../store';
import { canPerform } from '../../domain/permissions';
import { accessibleTopics, isTopicLead } from '../../domain/topic-access';
import { validateTopicIndicators, validateUnitAllocations } from '../../domain/indicator-allocation';
import { PageHeader } from '../../components/common/PageHeader';

const now = () => new Date().toISOString();

export function IndicatorConfigPage() {
  const state = useAppStore();
  const user = state.currentUser!;
  const visibleTopics = accessibleTopics(user, state.topics, state.topicMemberships);
  const leadTopics = visibleTopics.filter((topic) => isTopicLead(user, topic.id, state.topicMemberships));
  const canManageTopics = canPerform(user, state.roles, 'topic.manage');
  const canManageCatalog = canPerform(user, state.roles, 'indicator.catalog.manage');
  const canPublishTopic = canPerform(user, state.roles, 'topic-indicator.publish');
  const canManageUnits = canPerform(user, state.roles, 'topic-unit.manage');
  const unitTopics = canManageUnits ? leadTopics : ['系统管理员', '项目技术负责人', '科研助理'].includes(user.role) ? visibleTopics : leadTopics;
  const unitMap = Object.fromEntries(state.units.map((unit) => [unit.id, unit.name]));

  const [topicForm] = Form.useForm<Partial<Topic>>();
  const [catalogForm] = Form.useForm<Partial<IndicatorDefinition>>();
  const [memberForm] = Form.useForm<Partial<TopicUnitMembership>>();
  const [topicModal, setTopicModal] = useState<Topic | 'new' | null>(null);
  const [catalogModal, setCatalogModal] = useState<IndicatorDefinition | 'new' | null>(null);
  const [memberModal, setMemberModal] = useState(false);
  const [targetTopicId, setTargetTopicId] = useState(visibleTopics[0]?.id);
  const [targetNodeId, setTargetNodeId] = useState(state.nodes.at(-1)?.id);
  const [targetDraft, setTargetDraft] = useState<Record<string, number>>({});
  const [unitTopicId, setUnitTopicId] = useState(unitTopics[0]?.id);
  const [allocationDraft, setAllocationDraft] = useState<Record<string, number>>({});

  const openTopic = (topic?: Topic) => {
    setTopicModal(topic ?? 'new'); topicForm.resetFields();
    topicForm.setFieldsValue(topic ?? { status: '实施中', startDate: state.project.startDate, endDate: state.project.endDate, participatingUnitIds: [], topicOverallRequirements: {}, domesticJournalRequiredCount: 0 });
  };
  const saveTopic = async () => {
    const values = await topicForm.validateFields();
    if (topicModal === 'new') state.addTopic({ id: `topic-${Date.now()}`, projectId: state.project.id, code: values.code!, name: values.name!, leadingUnitId: values.leadingUnitId!, participatingUnitIds: [], principalName: values.principalName, contactName: values.contactName, contactPhone: values.contactPhone, contactEmail: values.contactEmail, startDate: values.startDate, endDate: values.endDate, summary: values.summary, status: values.status ?? '实施中', domesticJournalRequiredCount: 0, topicOverallRequirements: {}, remarks: values.remarks });
    else if (topicModal) state.updateTopic(topicModal.id, values);
    message.success(topicModal === 'new' ? '课题已创建' : '课题信息已更新'); setTopicModal(null);
  };
  const saveDefinition = async () => {
    const values = await catalogForm.validateFields(); const base = catalogModal === 'new' ? undefined : catalogModal;
    state.saveIndicatorDefinition({ id: base?.id ?? `indicator-custom-${Date.now()}`, code: values.code!, name: values.name!, achievementType: values.achievementType!, unit: values.unit!, builtIn: base?.builtIn ?? false, enabled: values.enabled ?? true, createdAt: base?.createdAt ?? now(), updatedAt: now() });
    message.success('指标目录已保存'); setCatalogModal(null);
  };

  const currentTargetRows = useMemo(() => state.indicatorDefinitions.filter((item) => item.enabled).map((definition) => {
    const existing = state.topicIndicators.find((item) => item.topicId === targetTopicId && item.nodeId === targetNodeId && item.indicatorDefinitionId === definition.id);
    return { definition, existing, quantity: targetDraft[definition.id] ?? existing?.targetQuantity ?? 0 };
  }), [state.indicatorDefinitions, state.topicIndicators, targetTopicId, targetNodeId, targetDraft]);
  const buildTargetRows = (): TopicIndicator[] => currentTargetRows.map(({ definition, existing, quantity }) => ({ id: existing?.id ?? `topic-indicator-${targetTopicId}-${definition.id}-${targetNodeId}`, projectId: state.project.id, topicId: targetTopicId!, indicatorDefinitionId: definition.id, achievementType: definition.achievementType, nodeId: targetNodeId!, targetQuantity: quantity, status: existing?.status ?? '草稿', version: existing?.version ?? 0, publishedAt: existing?.publishedAt, publishedBy: existing?.publishedBy, createdAt: existing?.createdAt ?? now(), updatedAt: now() }));
  const saveTargets = (publish = false) => {
    const rows = buildTargetRows(); const issues = validateTopicIndicators(rows);
    if (issues.length) return message.error(issues[0].message);
    state.saveTopicIndicators(rows); if (publish) state.publishTopicIndicators(targetTopicId!, user.name);
    setTargetDraft({}); message.success(publish ? '课题指标已直接下发' : '课题指标草稿已保存');
  };

  const memberships = state.topicMemberships.filter((item) => item.topicId === unitTopicId);
  const activeMemberships = memberships.filter((item) => item.enabled);
  const publishedTopicIndicators = state.topicIndicators.filter((item) => item.topicId === unitTopicId && item.status === '已下发');
  const addMember = async () => {
    const values = await memberForm.validateFields(); const existing = memberships.find((item) => item.unitId === values.unitId);
    state.saveTopicMembership({ id: existing?.id ?? `membership-${unitTopicId}-${values.unitId}`, topicId: unitTopicId!, unitId: values.unitId!, membershipType: existing?.membershipType ?? 'PARTICIPANT', principalName: values.principalName, contactName: values.contactName, contactPhone: values.contactPhone, contactEmail: values.contactEmail, enabled: true, createdAt: existing?.createdAt ?? now(), updatedAt: now() });
    const topic = state.topics.find((item) => item.id === unitTopicId)!;
    if (!topic.participatingUnitIds.includes(values.unitId!)) state.updateTopic(topic.id, { participatingUnitIds: [...topic.participatingUnitIds, values.unitId!] });
    setMemberModal(false); memberForm.resetFields(); message.success('承担单位已加入课题');
  };
  const allocationValue = (indicator: TopicIndicator, membership: TopicUnitMembership) => { const id = `allocation-${indicator.id}-${membership.unitId}`; return allocationDraft[id] ?? state.unitIndicatorAllocations.find((item) => item.id === id)?.targetQuantity ?? 0; };
  const buildAllocations = (): UnitIndicatorAllocation[] => publishedTopicIndicators.flatMap((indicator) => activeMemberships.map((membership) => {
    const id = `allocation-${indicator.id}-${membership.unitId}`; const existing = state.unitIndicatorAllocations.find((item) => item.id === id);
    return { id, projectId: state.project.id, topicId: unitTopicId!, membershipId: membership.id, unitId: membership.unitId, topicIndicatorId: indicator.id, indicatorDefinitionId: indicator.indicatorDefinitionId, achievementType: indicator.achievementType, nodeId: indicator.nodeId, targetQuantity: allocationValue(indicator, membership), status: existing?.status ?? '草稿', version: existing?.version ?? 0, publishedAt: existing?.publishedAt, publishedBy: existing?.publishedBy, createdAt: existing?.createdAt ?? now(), updatedAt: now() };
  }));
  const saveAllocations = (publish = false) => {
    const rows = buildAllocations();
    if (publish) { const issues = validateUnitAllocations(publishedTopicIndicators, rows, state.achievements); if (issues.length) return message.error(issues[0].message); }
    state.saveUnitAllocations(rows); if (publish) state.publishUnitAllocations(unitTopicId!, user.name);
    setAllocationDraft({}); message.success(publish ? '单位指标已下发' : '单位指标草稿已保存');
  };

  const topicPanel = <Card extra={canManageTopics && <Button type="primary" icon={<PlusOutlined />} onClick={() => openTopic()}>新增课题</Button>}><Table rowKey="id" dataSource={visibleTopics} pagination={false} columns={[
    { title: '课题', render: (_, row: Topic) => <Space direction="vertical" size={0}><Space><Tag color="blue">{row.code}</Tag><b>{row.name}</b></Space><Typography.Text type="secondary">{row.summary || '暂无研究内容摘要'}</Typography.Text></Space> },
    { title: '研究周期', width: 190, render: (_, row) => row.startDate && row.endDate ? `${row.startDate} 至 ${row.endDate}` : '未配置' }, { title: '牵头单位', dataIndex: 'leadingUnitId', width: 170, render: (value) => unitMap[value] ?? value }, { title: '负责人', dataIndex: 'principalName', width: 100 }, { title: '状态', dataIndex: 'status', width: 90, render: (value) => <Tag color={value === '已暂停' ? 'orange' : 'green'}>{value ?? '实施中'}</Tag> },
    { title: '操作', width: 80, render: (_, row) => <Button type="link" disabled={!canManageTopics} icon={<EditOutlined />} onClick={() => openTopic(row)}>编辑</Button> },
  ]} /></Card>;

  const catalogPanel = <Card extra={canManageCatalog && <Button type="primary" icon={<PlusOutlined />} onClick={() => { setCatalogModal('new'); catalogForm.resetFields(); catalogForm.setFieldsValue({ enabled: true, unit: '项' }); }}>新增自定义指标</Button>}><Table rowKey="id" dataSource={state.indicatorDefinitions} pagination={false} columns={[
    { title: '指标编码', dataIndex: 'code', width: 140 }, { title: '指标名称', dataIndex: 'name' }, { title: '成果分类', dataIndex: 'achievementType', width: 140 }, { title: '单位', dataIndex: 'unit', width: 80 }, { title: '来源', dataIndex: 'builtIn', width: 100, render: (value) => <Tag color={value ? 'blue' : 'cyan'}>{value ? '系统预置' : '自定义'}</Tag> },
    { title: '启用', dataIndex: 'enabled', width: 80, render: (value, row) => <Switch checked={value} disabled={!canManageCatalog} onChange={(enabled) => state.saveIndicatorDefinition({ ...row, enabled, updatedAt: now() })} /> }, { title: '操作', width: 80, render: (_, row) => <Button type="link" disabled={!canManageCatalog || row.builtIn} onClick={() => { setCatalogModal(row); catalogForm.setFieldsValue(row); }}>编辑</Button> },
  ]} /></Card>;

  const targetPanel = <Card title={<Space>课题<Select style={{ width: 300 }} value={targetTopicId} onChange={(value) => { setTargetTopicId(value); setTargetDraft({}); }} options={visibleTopics.map((item) => ({ label: `${item.code} ${item.name}`, value: item.id }))} />考核节点<Select style={{ width: 150 }} value={targetNodeId} onChange={(value) => { setTargetNodeId(value); setTargetDraft({}); }} options={state.nodes.map((item) => ({ label: item.name, value: item.id }))} /></Space>} extra={canPublishTopic && <Space><Button icon={<SaveOutlined />} onClick={() => saveTargets()}>保存草稿</Button><Button type="primary" icon={<SendOutlined />} onClick={() => saveTargets(true)}>直接下发</Button></Space>}><Alert type="info" showIcon title="科研助理直接下发到课题；目标值为对应考核节点的累计要求。" style={{ marginBottom: 16 }} /><Table rowKey={(row) => row.definition.id} dataSource={currentTargetRows} pagination={false} columns={[
    { title: '指标编码', render: (_, row) => row.definition.code }, { title: '指标名称', render: (_, row) => row.definition.name }, { title: '计量单位', render: (_, row) => row.definition.unit, width: 100 }, { title: '累计目标', render: (_, row) => <InputNumber min={0} precision={0} disabled={!canPublishTopic} value={row.quantity} onChange={(value) => setTargetDraft((draft) => ({ ...draft, [row.definition.id]: value ?? 0 }))} /> }, { title: '状态/版本', render: (_, row) => row.existing ? <Space><Tag color={row.existing.status === '已下发' ? 'green' : 'default'}>{row.existing.status}</Tag><span>V{row.existing.version}</span></Space> : '未配置' },
  ]} /></Card>;

  const unitsPanel = <Card title={<Space><TeamOutlined />课题<Select style={{ width: 340 }} value={unitTopicId} onChange={setUnitTopicId} options={unitTopics.map((item) => ({ label: `${item.code} ${item.name}`, value: item.id }))} /></Space>} extra={canManageUnits && <Button type="primary" icon={<PlusOutlined />} disabled={!unitTopicId} onClick={() => setMemberModal(true)}>添加承担单位</Button>}>{!unitTopics.length ? <Alert type="info" showIcon title="当前账号没有可查看的课题。" /> : <Table rowKey="id" dataSource={memberships} pagination={false} columns={[
    { title: '单位', dataIndex: 'unitId', render: (value) => unitMap[value] ?? value }, { title: '类型', dataIndex: 'membershipType', width: 120, render: (value) => <Tag color={value === 'LEAD' ? 'blue' : 'cyan'}>{value === 'LEAD' ? '牵头单位' : '承担单位'}</Tag> }, { title: '负责人', dataIndex: 'principalName' }, { title: '联系人', dataIndex: 'contactName' }, { title: '联系电话', dataIndex: 'contactPhone' }, { title: '账号状态', width: 100, render: (_, row) => <Tag color={state.users.some((item) => item.unitId === row.unitId && item.enabled) ? 'green' : 'orange'}>{state.users.some((item) => item.unitId === row.unitId && item.enabled) ? '已启用' : '未创建'}</Tag> }, { title: '启用', dataIndex: 'enabled', width: 80, render: (value, row) => <Switch checked={value} disabled={!canManageUnits || row.membershipType === 'LEAD'} onChange={(enabled) => state.toggleTopicMembership(row.id, enabled)} /> },
  ]} />}</Card>;

  const allocationPanel = <Card title={<Space>课题<Select style={{ width: 340 }} value={unitTopicId} onChange={(value) => { setUnitTopicId(value); setAllocationDraft({}); }} options={unitTopics.map((item) => ({ label: `${item.code} ${item.name}`, value: item.id }))} /></Space>} extra={canManageUnits && <Space><Button onClick={() => saveAllocations()}>保存草稿</Button><Button type="primary" onClick={() => saveAllocations(true)}>下发单位指标</Button></Space>}><Alert type="info" showIcon title="每行单位分配合计不得低于课题指标；允许超额分配，调整后也不能低于已经生效的成果数。" style={{ marginBottom: 16 }} /><Table rowKey="id" dataSource={publishedTopicIndicators} pagination={false} scroll={{ x: 900 }} columns={[
    { title: '指标/节点', fixed: 'left', width: 220, render: (_, row) => <Space direction="vertical" size={0}><b>{row.achievementType}</b><Typography.Text type="secondary">{state.nodes.find((node) => node.id === row.nodeId)?.name}</Typography.Text></Space> }, { title: '课题目标', dataIndex: 'targetQuantity', width: 100 }, ...activeMemberships.map((membership) => ({ title: unitMap[membership.unitId], width: 150, render: (_: unknown, row: TopicIndicator) => { const id = `allocation-${row.id}-${membership.unitId}`; return <InputNumber min={0} precision={0} value={allocationValue(row, membership)} onChange={(value) => setAllocationDraft((draft) => ({ ...draft, [id]: value ?? 0 }))} />; } })), { title: '分配合计', width: 110, render: (_, row) => { const total = activeMemberships.reduce((sum, member) => sum + allocationValue(row, member), 0); return <Tag color={total < row.targetQuantity ? 'red' : total > row.targetQuantity ? 'blue' : 'green'}>{total}{total > row.targetQuantity ? '（超额）' : ''}</Tag>; } },
  ]} /></Card>;

  const items = [{ key: 'topics', label: '课题管理', children: topicPanel }, { key: 'catalog', label: '指标目录', children: catalogPanel }, { key: 'targets', label: '课题指标下发', children: targetPanel }, ...(unitTopics.length ? [{ key: 'units', label: '课题单位管理', children: unitsPanel }, { key: 'allocations', label: '单位指标分配', children: allocationPanel }] : [])];
  return <><PageHeader title="科研指标配置" description="先由科研助理维护课题并下发课题指标，再由课题牵头单位添加承担单位并分配指标。成果只归属课题和单位，不下沉到配套自筹项目。" /><Tabs items={items} />
    <Modal width={720} title={topicModal === 'new' ? '新增课题' : '编辑课题'} open={Boolean(topicModal)} onCancel={() => setTopicModal(null)} onOk={saveTopic}><Form form={topicForm} layout="vertical"><Row gutter={16}><Col span={8}><Form.Item label="课题编号" name="code" rules={[{ required: true }]}><Input /></Form.Item></Col><Col span={16}><Form.Item label="课题名称" name="name" rules={[{ required: true }]}><Input /></Form.Item></Col></Row><Row gutter={16}><Col span={12}><Form.Item label="开始日期" name="startDate" rules={[{ required: true }]}><Input type="date" /></Form.Item></Col><Col span={12}><Form.Item label="结束日期" name="endDate" rules={[{ required: true }]}><Input type="date" /></Form.Item></Col></Row><Row gutter={16}><Col span={12}><Form.Item label="牵头单位" name="leadingUnitId" rules={[{ required: true }]}><Select options={state.units.map((item) => ({ label: item.name, value: item.id }))} /></Form.Item></Col><Col span={12}><Form.Item label="课题负责人" name="principalName" rules={[{ required: true }]}><Input /></Form.Item></Col></Row><Row gutter={16}><Col span={12}><Form.Item label="单位联系人" name="contactName"><Input /></Form.Item></Col><Col span={12}><Form.Item label="联系电话" name="contactPhone"><Input /></Form.Item></Col></Row><Form.Item label="联系邮箱" name="contactEmail"><Input /></Form.Item><Form.Item label="研究内容摘要" name="summary" rules={[{ required: true }]}><Input.TextArea rows={4} /></Form.Item><Form.Item label="状态" name="status"><Select options={['草稿', '实施中', '已暂停', '已结题'].map((value) => ({ label: value, value }))} /></Form.Item><Form.Item label="备注" name="remarks"><Input.TextArea rows={2} /></Form.Item></Form></Modal>
    <Modal title={catalogModal === 'new' ? '新增自定义指标' : '编辑自定义指标'} open={Boolean(catalogModal)} onCancel={() => setCatalogModal(null)} onOk={saveDefinition}><Form form={catalogForm} layout="vertical"><Form.Item label="指标编码" name="code" rules={[{ required: true }]}><Input /></Form.Item><Form.Item label="指标名称" name="name" rules={[{ required: true }]}><Input /></Form.Item><Form.Item label="归属成果分类" name="achievementType" rules={[{ required: true }]}><Select options={state.indicatorDefinitions.filter((item) => item.builtIn).map((item) => ({ label: item.name, value: item.achievementType }))} /></Form.Item><Form.Item label="计量单位" name="unit" rules={[{ required: true }]}><Input /></Form.Item></Form></Modal>
    <Modal title="添加课题承担单位" open={memberModal} onCancel={() => setMemberModal(false)} onOk={addMember}><Form form={memberForm} layout="vertical"><Form.Item label="承担单位" name="unitId" rules={[{ required: true }]}><Select options={state.units.filter((unit) => !memberships.some((item) => item.unitId === unit.id && item.enabled)).map((item) => ({ label: item.name, value: item.id }))} /></Form.Item><Form.Item label="单位负责人" name="principalName" rules={[{ required: true }]}><Input /></Form.Item><Form.Item label="联系人" name="contactName"><Input /></Form.Item><Form.Item label="联系电话" name="contactPhone"><Input /></Form.Item><Form.Item label="联系邮箱" name="contactEmail"><Input /></Form.Item></Form></Modal>
  </>;
}
