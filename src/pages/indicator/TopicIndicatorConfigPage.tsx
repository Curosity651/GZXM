import { useState } from 'react';
import { Alert, Button, Card, Col, Form, Input, InputNumber, Modal, Result, Row, Select, Space, Switch, Table, Tag, Typography, message } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { IndicatorDefinition, Topic, TopicIndicator, TopicUnitMembership, UnitIndicatorAllocation, User } from '../../types';
import { useAppStore } from '../../store';
import { canPerform } from '../../domain/permissions';
import { canAccessTopicByMembership, isGlobalUser, isTopicLead } from '../../domain/topic-access';
import { validateTopicIndicators, validateUnitAllocations } from '../../domain/indicator-allocation';

const now = () => new Date().toISOString();
const isUnitAccount = (account: User) => account.role === '内部课题单位' || account.role === '外部课题单位';

export function TopicIndicatorConfigPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const state = useAppStore();
  const user = state.currentUser!;
  const isNew = topicId === 'new';
  const isViewMode = !isNew && searchParams.get('mode') === 'view';
  const existing = !isNew ? state.topics.find((topic) => topic.id === topicId) : undefined;
  const hasManageTopicPermission = canPerform(user, state.roles, 'topic.manage');
  const canManageTopic = hasManageTopicPermission && !isViewMode;
  const canPublishTopic = canPerform(user, state.roles, 'topic-indicator.publish') && !isViewMode;
  const canAllocate = canPerform(user, state.roles, 'unit-allocation.manage');
  const canAccessTopic = isNew ? hasManageTopicPermission : Boolean(existing && canAccessTopicByMembership(user, existing.id, state.topicMemberships));
  const [form] = Form.useForm<Partial<Topic>>();
  const [requirements, setRequirements] = useState<Record<string, number>>(existing?.topicOverallRequirements ?? {});
  const [nodeId, setNodeId] = useState(state.nodes.at(-1)?.id);
  const [allocationDraft, setAllocationDraft] = useState<Record<string, number>>({});
  const [reportModal, setReportModal] = useState(false);
  const [reportConfig, setReportConfig] = useState(existing?.reportConfig ?? {
    effectiveYear: new Date().getFullYear(),
    monthlyEnabled: true,
    monthlyOpenDay: 1,
    monthlyDeadlineDay: 30,
    quarterlyEnabled: true,
    quarterlyOpenDay: 1,
    quarterlyDeadlineDay: 10,
    quarterlyMonths: [3, 6, 9, 12],
  });

  const definitions = state.indicatorDefinitions.filter((item) => item.enabled);
  const memberships = state.topicMemberships.filter((item) => item.topicId === existing?.id);
  const activeMemberships = memberships.filter((item) => item.enabled);
  const isLead = Boolean(existing && isTopicLead(user, existing.id, state.topicMemberships));
  const canEditAllocation = canAllocate && isLead && !isViewMode;
  const allocationMemberships = isLead || isGlobalUser(user)
    ? activeMemberships
    : activeMemberships.filter((item) => item.unitId === user.unitId);
  const published = state.topicIndicators.filter((item) => item.topicId === existing?.id && item.status === '已下发');
  const unitMap = Object.fromEntries(state.units.map((unit) => [unit.id, unit.name]));
  const initialLeadAccount = state.users.find((account) => account.enabled && account.unitId === existing?.leadingUnitId && isUnitAccount(account));
  const selectedLeadingUnitId = Form.useWatch('leadingUnitId', form) ?? existing?.leadingUnitId;
  const selectedLeadAccount = state.users.find((account) => account.enabled && account.unitId === selectedLeadingUnitId && isUnitAccount(account));
  const initialValues: Partial<Topic> = existing
    ? {
        ...existing,
        principalName: initialLeadAccount?.name ?? existing.principalName,
        contactName: initialLeadAccount?.name ?? existing.contactName,
        contactPhone: initialLeadAccount?.phone ?? existing.contactPhone,
        contactEmail: initialLeadAccount?.email ?? existing.contactEmail,
      }
    : { status: '实施中', startDate: state.project.startDate, endDate: state.project.endDate, participatingUnitIds: [] };

  const valueForDefinition = (definition: IndicatorDefinition, current?: TopicIndicator) => {
    if (requirements[definition.id] !== undefined) return requirements[definition.id];
    if (current) return current.targetQuantity;
    return definition.name === definition.achievementType ? requirements[definition.achievementType] ?? 0 : 0;
  };
  const targetRows = definitions.map((definition) => {
    const current = state.topicIndicators.find((item) => item.topicId === existing?.id && item.nodeId === nodeId && item.indicatorDefinitionId === definition.id);
    return { definition, current, quantity: valueForDefinition(definition, current) };
  });

  const changeLeadingUnit = (leadingUnitId: string) => {
    const account = state.users.find((item) => item.enabled && item.unitId === leadingUnitId && isUnitAccount(item));
    const participatingUnitIds = (form.getFieldValue('participatingUnitIds') ?? []).filter((unitId: string) => unitId !== leadingUnitId);
    form.setFieldsValue({
      leadingUnitId,
      participatingUnitIds,
      principalName: account?.name,
      contactName: account?.name,
      contactPhone: account?.phone,
      contactEmail: account?.email,
    });
    if (!account) message.warning('该单位暂无启用的课题单位账号，请先在用户管理中配置');
  };

  const buildTopicIndicatorRows = (id: string) => definitions.map((definition) => {
    const current = state.topicIndicators.find((item) => item.topicId === id && item.nodeId === nodeId && item.indicatorDefinitionId === definition.id);
    return {
      id: current?.id ?? `topic-indicator-${id}-${definition.id}-${nodeId}`,
      projectId: state.project.id,
      topicId: id,
      indicatorDefinitionId: definition.id,
      achievementType: definition.achievementType,
      nodeId: nodeId!,
      targetQuantity: valueForDefinition(definition, current),
      status: current?.status ?? '草稿',
      version: current?.version ?? 0,
      publishedAt: current?.publishedAt,
      publishedBy: current?.publishedBy,
      createdAt: current?.createdAt ?? now(),
      updatedAt: now(),
    } as TopicIndicator;
  });

  const commitTopic = (values: Partial<Topic>) => {
    const id = existing?.id ?? `topic-${Date.now()}`;
    const leadAccount = state.users.find((account) => account.enabled && account.unitId === values.leadingUnitId && isUnitAccount(account));
    if (!leadAccount) return message.warning('牵头单位没有可用账号，无法确认课题配置');
    const participantIds = (values.participatingUnitIds ?? []).filter((unitId) => unitId !== values.leadingUnitId);
    const topic = {
      ...values,
      id,
      projectId: state.project.id,
      code: values.code!,
      name: values.name!,
      leadingUnitId: values.leadingUnitId!,
      participatingUnitIds: participantIds,
      principalName: leadAccount.name,
      contactName: leadAccount.name,
      contactPhone: leadAccount.phone,
      contactEmail: leadAccount.email,
      domesticJournalRequiredCount: existing?.domesticJournalRequiredCount ?? 0,
      topicOverallRequirements: requirements,
      reportConfig,
    } as Topic;

    if (existing) state.updateTopic(id, topic, user.id);
    else state.addTopic(topic, user.id);

    const oldParticipants = state.topicMemberships.filter((item) => item.topicId === id && item.membershipType === 'PARTICIPANT');
    oldParticipants.filter((item) => item.enabled && !participantIds.includes(item.unitId)).forEach((item) => state.toggleTopicMembership(item.id, false, user.id));
    participantIds.forEach((unitId) => {
      const old = oldParticipants.find((item) => item.unitId === unitId);
      state.saveTopicMembership({
        id: old?.id ?? `membership-${id}-${unitId}`,
        topicId: id,
        unitId,
        membershipType: 'PARTICIPANT',
        enabled: true,
        createdAt: old?.createdAt ?? now(),
        updatedAt: now(),
      }, user.id);
    });

    const rows = buildTopicIndicatorRows(id);
    state.saveTopicIndicators(rows, user.id);
    state.publishTopicIndicators(id, user.id);
    message.success('课题配置已确认并下发');
    navigate('/indicator');
  };

  const requestSaveTopic = async () => {
    if (!canManageTopic || !canPublishTopic || !nodeId) return message.warning('当前账号没有确认课题配置的权限');
    const values = await form.validateFields();
    const leadAccount = state.users.find((account) => account.enabled && account.unitId === values.leadingUnitId && isUnitAccount(account));
    if (!leadAccount) return message.warning('牵头单位没有可用账号，请先完成账号配置');
    const rows = buildTopicIndicatorRows(existing?.id ?? 'new-topic');
    const issues = validateTopicIndicators(rows);
    if (issues.length) return message.error(issues[0].message);
    Modal.confirm({
      title: '确认课题配置',
      content: `确定保存课题信息，并将总体指标下发给“${unitMap[values.leadingUnitId!]}”吗？`,
      okText: '确认并下发',
      cancelText: '取消',
      onOk: () => commitTopic(values),
    });
  };

  const requestSaveTargets = () => {
    if (!existing || !nodeId || !canManageTopic || !canPublishTopic) return message.warning('当前账号没有确认总体指标的权限');
    const rows = buildTopicIndicatorRows(existing.id);
    const issues = validateTopicIndicators(rows);
    if (issues.length) return message.error(issues[0].message);
    Modal.confirm({
      title: '确认课题总体指标',
      content: `确定保存并下发“${existing.name}”在当前考核节点的 ${rows.length} 项指标吗？`,
      okText: '确认并下发',
      cancelText: '取消',
      onOk: () => {
        state.updateTopic(existing.id, { topicOverallRequirements: requirements }, user.id);
        state.saveTopicIndicators(rows, user.id);
        state.publishTopicIndicators(existing.id, user.id);
        message.success('课题总体指标已确认并下发');
      },
    });
  };

  const allocationValue = (indicator: TopicIndicator, membership: TopicUnitMembership) => allocationDraft[`allocation-${indicator.id}-${membership.unitId}`]
    ?? state.unitIndicatorAllocations.find((item) => item.id === `allocation-${indicator.id}-${membership.unitId}`)?.targetQuantity
    ?? 0;

  const requestSaveAllocations = () => {
    if (!existing || !canEditAllocation) return message.warning('只有该课题牵头单位可以确认单位指标分配');
    const rows: UnitIndicatorAllocation[] = published.flatMap((indicator) => activeMemberships.map((membership) => {
      const id = `allocation-${indicator.id}-${membership.unitId}`;
      const old = state.unitIndicatorAllocations.find((item) => item.id === id);
      return {
        id,
        projectId: state.project.id,
        topicId: existing.id,
        membershipId: membership.id,
        unitId: membership.unitId,
        topicIndicatorId: indicator.id,
        indicatorDefinitionId: indicator.indicatorDefinitionId,
        achievementType: indicator.achievementType,
        nodeId: indicator.nodeId,
        targetQuantity: allocationValue(indicator, membership),
        status: old?.status ?? '草稿',
        version: old?.version ?? 0,
        publishedAt: old?.publishedAt,
        publishedBy: old?.publishedBy,
        createdAt: old?.createdAt ?? now(),
        updatedAt: now(),
      };
    }));
    const issues = validateUnitAllocations(published, rows, state.achievements);
    if (issues.length) return message.error(issues[0].message);
    Modal.confirm({
      title: '确认单位指标分配',
      content: `确定将“${existing.name}”的指标分配结果下发给 ${activeMemberships.length} 家课题单位吗？`,
      okText: '确认并下发',
      cancelText: '取消',
      onOk: () => {
        state.saveUnitAllocations(rows, user.id);
        state.publishUnitAllocations(existing.id, user.id);
        message.success('单位指标分配已确认并下发');
      },
    });
  };

  const saveReportConfig = () => {
    if (!canManageTopic) return message.warning('当前账号没有修改课题月季报配置的权限');
    if (reportConfig.monthlyOpenDay > reportConfig.monthlyDeadlineDay || reportConfig.quarterlyOpenDay > reportConfig.quarterlyDeadlineDay) return message.warning('截止日不能早于开放日');
    if (existing) state.updateTopic(existing.id, { reportConfig }, user.id);
    setReportModal(false);
    message.success(existing ? '月季报配置已保存' : '月季报配置已暂存');
  };

  if (!isNew && !existing) return <Card>课题不存在 <Button type="link" onClick={() => navigate('/indicator')}>返回课题列表</Button></Card>;
  if (!canAccessTopic) return <Result status="403" title="无权访问该课题" subTitle="当前账号未绑定该课题，或没有新建课题的权限。" extra={<Button onClick={() => navigate('/indicator')}>返回课题列表</Button>} />;

  return <div className={`topic-indicator-editor ${isNew ? 'topic-editor-new' : ''}`}>
    <Space style={{ marginBottom: 18 }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/indicator')}>返回课题列表</Button>
      <Typography.Text type="secondary">{isNew ? '新建课题' : `${existing?.code}${isViewMode ? ' · 详情' : ' · 编辑'}`}</Typography.Text>
    </Space>

    <Row gutter={18} align="top">
      <Col span={isNew ? 12 : 10}>
        <Card title="课题信息" extra={canManageTopic && <Button type="primary" icon={<SaveOutlined />} onClick={requestSaveTopic}>确认课题配置</Button>}>
          <Form form={form} layout="vertical" initialValues={initialValues} disabled={!canManageTopic}>
            <Row gutter={12}>
              <Col span={8}><Form.Item label="课题编号" name="code" rules={[{ required: true, message: '请输入课题编号' }]}><Input /></Form.Item></Col>
              <Col span={16}><Form.Item label="课题名称" name="name" rules={[{ required: true, message: '请输入课题名称' }]}><Input /></Form.Item></Col>
              <Col span={24}>
                <Form.Item label="牵头单位" name="leadingUnitId" rules={[{ required: true, message: '请选择牵头单位' }]}>
                  <Select onChange={changeLeadingUnit} options={state.units.map((unit) => ({ label: unit.name, value: unit.id }))} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="课题负责人"
                  name="principalName"
                  rules={[{ required: true, message: '牵头单位必须有启用的账号' }]}
                  extra={selectedLeadAccount ? `已关联账号：${selectedLeadAccount.username}` : '请选择已配置账号的牵头单位'}
                >
                  <Input disabled placeholder="选择牵头单位后自动带入" />
                </Form.Item>
              </Col>
              <Col span={12}><Form.Item label="状态" name="status"><Select options={['草稿', '实施中', '已暂停', '已结题'].map((value) => ({ label: value, value }))} /></Form.Item></Col>
              <Col span={12}><Form.Item label="开始日期" name="startDate"><Input type="date" /></Form.Item></Col>
              <Col span={12}><Form.Item label="结束日期" name="endDate"><Input type="date" /></Form.Item></Col>
            </Row>
            <Form.Item name="contactName" hidden><Input /></Form.Item>
            <Form.Item name="contactPhone" hidden><Input /></Form.Item>
            <Form.Item name="contactEmail" hidden><Input /></Form.Item>
            <Form.Item label="承担单位" name="participatingUnitIds">
              <Select mode="multiple" options={state.units.filter((unit) => unit.id !== selectedLeadingUnitId).map((unit) => ({ label: unit.name, value: unit.id }))} />
            </Form.Item>
            <Form.Item label="研究内容摘要" name="summary"><Input.TextArea rows={3} /></Form.Item>
          </Form>
        </Card>
      </Col>

      <Col span={isNew ? 12 : 14}>
        <Card title="课题总体指标" extra={!isNew && canPublishTopic && <Button type="primary" onClick={requestSaveTargets}>确认并下发</Button>}>
          <Space style={{ marginBottom: 12 }}>考核节点
            <Select value={nodeId} onChange={setNodeId} options={state.nodes.map((node) => ({ label: node.name, value: node.id }))} />
          </Space>
          <Table
            size="small"
            rowKey={(row) => row.definition.id}
            dataSource={targetRows}
            pagination={false}
            columns={[
              { title: '指标名称', render: (_: unknown, row: (typeof targetRows)[number]) => <b>{row.definition.name}</b> },
              { title: '计量单位', width: 100, render: (_: unknown, row: (typeof targetRows)[number]) => row.definition.unit },
              { title: '目标值', width: 130, render: (_: unknown, row: (typeof targetRows)[number]) => <InputNumber min={0} precision={0} disabled={!canPublishTopic} value={row.quantity} onChange={(value) => setRequirements({ ...requirements, [row.definition.id]: value ?? 0 })} /> },
              { title: '状态', width: 100, render: (_: unknown, row: (typeof targetRows)[number]) => row.current ? <Tag>{row.current.status}</Tag> : '未确认' },
            ]}
          />
          {canManageTopic && <div style={{ marginTop: 12, textAlign: 'right' }}><Button onClick={() => setReportModal(true)}>课题月季报配置</Button></div>}
        </Card>
      </Col>

      {existing && <Col span={24}>
        <Card title="单位指标分配" extra={canEditAllocation && <Button type="primary" onClick={requestSaveAllocations}>确认并下发</Button>}>
          {!canEditAllocation && <Alert style={{ marginBottom: 12 }} type="info" showIcon message={isViewMode ? '当前为详情查看模式，所有内容均不可修改。' : isGlobalUser(user) ? '项目技术负责人和科研助理可查看分配结果，单位指标由课题牵头单位分配。' : '当前账号仅可查看本单位的指标分配。'} />}
          <Table
            size="small"
            rowKey="id"
            dataSource={published}
            pagination={false}
            scroll={{ x: 720 }}
            columns={[
              { title: '指标', width: 260, render: (_: unknown, row: TopicIndicator) => definitions.find((definition) => definition.id === row.indicatorDefinitionId)?.name ?? row.achievementType },
              ...allocationMemberships.map((membership) => ({
                title: unitMap[membership.unitId],
                render: (_: unknown, row: TopicIndicator) => <InputNumber min={0} precision={0} disabled={!canEditAllocation} value={allocationValue(row, membership)} onChange={(value) => setAllocationDraft({ ...allocationDraft, [`allocation-${row.id}-${membership.unitId}`]: value ?? 0 })} />,
              })),
              { title: '课题目标', dataIndex: 'targetQuantity', width: 100 },
            ]}
          />
        </Card>
      </Col>}
    </Row>

    <Modal title="课题月季报配置" open={reportModal} onCancel={() => setReportModal(false)} onOk={saveReportConfig} okText="确认保存">
      <Row gutter={16}>
        <Col span={8}><Typography.Text>生效年度</Typography.Text><InputNumber min={2020} max={2100} style={{ width: '100%', marginTop: 8 }} value={reportConfig.effectiveYear} onChange={(value) => setReportConfig({ ...reportConfig, effectiveYear: value ?? new Date().getFullYear() })} /></Col>
        <Col span={8}><Typography.Text>启用月报</Typography.Text><div style={{ marginTop: 12 }}><Switch checked={reportConfig.monthlyEnabled} onChange={(value) => setReportConfig({ ...reportConfig, monthlyEnabled: value })} /></div></Col>
        <Col span={8}><Typography.Text>启用季报</Typography.Text><div style={{ marginTop: 12 }}><Switch checked={reportConfig.quarterlyEnabled} onChange={(value) => setReportConfig({ ...reportConfig, quarterlyEnabled: value })} /></div></Col>
        <Col span={12} style={{ marginTop: 16 }}><Typography.Text>月报开放日 / 截止日</Typography.Text><Space style={{ marginTop: 8 }}><InputNumber min={1} max={31} value={reportConfig.monthlyOpenDay} onChange={(value) => setReportConfig({ ...reportConfig, monthlyOpenDay: value ?? 1 })} /><InputNumber min={1} max={31} value={reportConfig.monthlyDeadlineDay} onChange={(value) => setReportConfig({ ...reportConfig, monthlyDeadlineDay: value ?? 30 })} /></Space></Col>
        <Col span={12} style={{ marginTop: 16 }}><Typography.Text>季报开放日 / 截止日</Typography.Text><Space style={{ marginTop: 8 }}><InputNumber min={1} max={31} value={reportConfig.quarterlyOpenDay} onChange={(value) => setReportConfig({ ...reportConfig, quarterlyOpenDay: value ?? 1 })} /><InputNumber min={1} max={31} value={reportConfig.quarterlyDeadlineDay} onChange={(value) => setReportConfig({ ...reportConfig, quarterlyDeadlineDay: value ?? 10 })} /></Space></Col>
        <Col span={24} style={{ marginTop: 16 }}><Typography.Text>季报月份</Typography.Text><Select mode="multiple" style={{ width: '100%', marginTop: 8 }} value={reportConfig.quarterlyMonths} onChange={(value) => setReportConfig({ ...reportConfig, quarterlyMonths: value })} options={Array.from({ length: 12 }, (_, index) => ({ label: `${index + 1} 月`, value: index + 1 }))} /></Col>
      </Row>
    </Modal>
  </div>;
}
