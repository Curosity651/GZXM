import { useMemo, useState } from 'react';
import { Button, Card, Form, Input, Modal, Select, Space, Table, Tag, Typography, message } from 'antd';
import { EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Topic } from '../../types';
import { useAppStore } from '../../store';
import { canPerform } from '../../domain/permissions';
import { accessibleTopics, isTopicLead } from '../../domain/topic-access';

export function IndicatorConfigPage() {
  const state = useAppStore(); const user = state.currentUser!; const navigate = useNavigate();
  const visibleTopics = accessibleTopics(user, state.topics, state.topicMemberships); const canManageTopics = canPerform(user, state.roles, 'topic.manage'); const canAllocateIndicators = canPerform(user, state.roles, 'unit-allocation.manage');
  const [query, setQuery] = useState({ name: '', status: '', leadingUnitId: '' }); const unitMap = Object.fromEntries(state.units.map((unit) => [unit.id, unit.name]));
  const definitions = state.indicatorDefinitions.filter((item) => item.enabled);
  const topics = useMemo(() => visibleTopics.filter((topic) => (!query.name || topic.name.includes(query.name)) && (!query.status || (topic.status ?? '实施中') === query.status) && (!query.leadingUnitId || topic.leadingUnitId === query.leadingUnitId)), [visibleTopics, query]);
  const toggle = (topic: Topic) => {
    const enabled = topic.enabled === false;
    Modal.confirm({
      title: enabled ? '确认启用课题' : '确认停用课题',
      content: enabled
        ? `启用后“${topic.name}”将恢复正常使用，是否继续？`
        : `停用后“${topic.name}”保留历史数据，但不再作为正常执行课题，是否继续？`,
      okText: enabled ? '确认启用' : '确认停用',
      cancelText: '取消',
      onOk: () => {
        state.toggleTopicEnabled(topic.id, enabled, user.id);
        message.success(enabled ? '课题已启用' : '课题已停用');
      },
    });
  };
  const columns = [{ title: '课题名称', render: (_: unknown, row: Topic) => <Button type="link" onClick={() => navigate(`/indicator/topic/${row.id}?mode=view`)} style={{ padding: 0, height: 'auto', textAlign: 'left' }}><Space direction="vertical" size={0}><span><Tag color="blue">{row.code}</Tag><b>{row.name}</b></span><Typography.Text type="secondary">{row.summary || '暂无研究内容摘要'}</Typography.Text></Space></Button> }, { title: '牵头单位', render: (_: unknown, row: Topic) => unitMap[row.leadingUnitId] }, { title: '承担单位', render: (_: unknown, row: Topic) => `${row.participatingUnitIds.length} 个` }, { title: '指标配置', render: (_: unknown, row: Topic) => { const count = state.topicIndicators.filter((item) => item.topicId === row.id && item.status === '已下发').length; return `${count}/${definitions.length} 项已确认`; } }, { title: '状态', render: (_: unknown, row: Topic) => <Tag color={row.enabled === false ? 'default' : row.status === '已暂停' ? 'orange' : 'green'}>{row.enabled === false ? '已停用' : row.status ?? '实施中'}</Tag> }, { title: '操作', width: 300, render: (_: unknown, row: Topic) => { const canAllocate = canAllocateIndicators && isTopicLead(user, row.id, state.topicMemberships) && row.enabled !== false && row.status !== '已暂停' && row.status !== '已结题'; return <Space><Button type="link" icon={<EditOutlined />} disabled={!canManageTopics} onClick={() => navigate(`/indicator/topic/${row.id}`)}>编辑</Button><Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/indicator/topic/${row.id}?mode=view`)}>详情</Button>{canAllocate && <Button type="link" onClick={() => navigate(`/indicator/topic/${row.id}?mode=allocation`)}>分配指标</Button>}{canManageTopics && <Button type="link" onClick={() => toggle(row)}>{row.enabled === false ? '启用' : '停用'}</Button>}</Space>; } }];
  return <div className="indicator-config-page"><Card style={{ marginBottom: 18 }}><Form layout="inline"><Form.Item label="课题名称"><Input placeholder="请输入课题名称" value={query.name} onChange={(event) => setQuery({ ...query, name: event.target.value })} /></Form.Item><Form.Item label="课题状态"><Select allowClear placeholder="请选择课题状态" style={{ width: 180 }} value={query.status || undefined} onChange={(status) => setQuery({ ...query, status: status ?? '' })} options={['实施中', '草稿', '已暂停', '已结题'].map((value) => ({ label: value, value }))} /></Form.Item><Form.Item label="牵头单位"><Select allowClear placeholder="请选择牵头单位" style={{ width: 230 }} value={query.leadingUnitId || undefined} onChange={(leadingUnitId) => setQuery({ ...query, leadingUnitId: leadingUnitId ?? '' })} options={state.units.map((unit) => ({ label: unit.name, value: unit.id }))} /></Form.Item><Form.Item><Space><Button onClick={() => setQuery({ name: '', status: '', leadingUnitId: '' })}>重置</Button><Button type="primary">查询</Button></Space></Form.Item></Form></Card><Card title={<Space>课题列表 <Typography.Text type="secondary">共 {topics.length} 个课题</Typography.Text></Space>} extra={canManageTopics && <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/indicator/topic/new')}>新建课题</Button>}><Table rowKey="id" dataSource={topics} columns={columns} pagination={false} /></Card></div>;
}
