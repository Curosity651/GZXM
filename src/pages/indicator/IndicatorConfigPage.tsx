import { useMemo, useState } from 'react';
import { Button, Card, Form, Input, InputNumber, Modal, Select, Space, Table, Tabs, Tag, message } from 'antd';
import { EditOutlined, SaveOutlined } from '@ant-design/icons';
import { ACHIEVEMENT_TYPES, type AchievementType, type Topic } from '../../types';
import { useAppStore, visibleTopics } from '../../store';
import { canPerform } from '../../domain/permissions';
import { PageHeader } from '../../components/common/PageHeader';

export function IndicatorConfigPage() {
  const state = useAppStore();
  const user = state.currentUser!;
  const topics = visibleTopics(user, state.topics);
  const editable = canPerform(user.role, 'indicator.manage');
  const [nodeId, setNodeId] = useState(state.nodes[0]?.id);
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [form] = Form.useForm();
  const unitMap = Object.fromEntries(state.units.map((unit) => [unit.id, unit.name]));

  const rows = useMemo(() => topics.map((topic) => {
    const values = Object.fromEntries(ACHIEVEMENT_TYPES.map((type) => {
      const indicator = state.indicators.find((item) => item.topicId === topic.id && item.nodeId === nodeId && item.achievementType === type);
      return [type, draft[`${topic.id}-${type}`] ?? indicator?.plannedQuantity ?? 0];
    }));
    return { ...topic, ...values };
  }), [draft, nodeId, state.indicators, topics]);

  const saveIndicators = () => {
    Object.entries(draft).forEach(([key, plannedQuantity]) => {
      const [topicId, achievementType] = key.split('-') as [string, AchievementType];
      const existing = state.indicators.find((item) => item.topicId === topicId && item.nodeId === nodeId && item.achievementType === achievementType);
      if (existing) state.updateIndicator(existing.id, { plannedQuantity });
      else state.addIndicator({ id: `ind-${Date.now()}-${topicId}-${achievementType}`, projectId: state.project.id, topicId, unitId: state.topics.find((item) => item.id === topicId)?.leadingUnitId ?? '', achievementType, nodeId, plannedQuantity, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    });
    setDraft({}); message.success('课题指标已保存');
  };

  const indicatorColumns = [
    { title: '课题', dataIndex: 'name', fixed: 'left' as const, width: 280, render: (value: string, row: Topic) => <Space><Tag color="blue">{row.code}</Tag>{value}</Space> },
    ...ACHIEVEMENT_TYPES.map((type) => ({ title: type, dataIndex: type, width: 130, render: (value: number, row: Topic) => editable ? <InputNumber min={0} value={value} onChange={(next) => setDraft((current) => ({ ...current, [`${row.id}-${type}`]: next ?? 0 }))} /> : value })),
  ];

  return <>
    <PageHeader title="课题与指标配置" description="科研指标仅分配到课题，不继续拆分到参与单位或配套自筹项目。" />
    <Tabs items={[
      { key: 'topics', label: '课题配置', children: <Card><Table rowKey="id" dataSource={topics} pagination={false} columns={[
        { title: '课题编号', dataIndex: 'code', width: 100, render: (value) => <Tag color="blue">{value}</Tag> },
        { title: '课题名称', dataIndex: 'name' }, { title: '课题负责人', dataIndex: 'principalName', width: 120 },
        { title: '牵头单位', dataIndex: 'leadingUnitId', render: (value) => unitMap[value] ?? value },
        { title: '参与单位', dataIndex: 'participatingUnitIds', render: (value: string[]) => value.map((id) => unitMap[id] ?? id).join('、') || '—' },
        { title: '操作', width: 80, render: (_, topic) => <Button type="link" icon={<EditOutlined />} disabled={!editable} onClick={() => { setEditingTopic(topic); form.setFieldsValue(topic); }}>编辑</Button> },
      ]} /></Card> },
      { key: 'indicators', label: '指标分配', children: <Card title={<Space>考核节点<Select style={{ width: 180 }} value={nodeId} onChange={setNodeId} options={state.nodes.map((node) => ({ label: node.name, value: node.id }))} /></Space>} extra={editable && <Button type="primary" icon={<SaveOutlined />} disabled={!Object.keys(draft).length} onClick={saveIndicators}>保存指标</Button>}><Table rowKey="id" dataSource={rows} columns={indicatorColumns} pagination={false} scroll={{ x: 960 }} /></Card> },
    ]} />
    <Modal title="编辑课题基础信息" open={Boolean(editingTopic)} onCancel={() => setEditingTopic(null)} onOk={() => form.validateFields().then((values) => { state.updateTopic(editingTopic!.id, values); setEditingTopic(null); message.success('课题信息已更新'); })}>
      <Form form={form} layout="vertical"><Form.Item label="课题编号" name="code" rules={[{ required: true }]}><Input /></Form.Item><Form.Item label="课题名称" name="name" rules={[{ required: true }]}><Input /></Form.Item><Form.Item label="课题负责人" name="principalName" rules={[{ required: true }]}><Input /></Form.Item><Form.Item label="单位联系人" name="contactName"><Input /></Form.Item><Form.Item label="联系电话" name="contactPhone"><Input /></Form.Item></Form>
    </Modal>
  </>;
}
