import { Card, Descriptions, Drawer, Select, Space, Table, Tag } from 'antd';
import { useState } from 'react';
import type { Achievement } from '../../types';
import { useAppStore } from '../../store';
import { canViewAchievement } from '../../domain/topic-access';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusTag } from '../../components/common/StatusTag';
import { ApprovalTimeline } from '../../components/common/ApprovalTimeline';

export function AchievementQueryPage() {
  const state = useAppStore();
  const [detail, setDetail] = useState<Achievement | null>(null);
  const [type, setType] = useState<string>();
  const scoped = state.achievements.filter((item) => canViewAchievement(state.currentUser!, item, state.topicMemberships)).filter((item) => !type || item.achievementType === type);
  return <>
    <PageHeader title="成果全周期查询" description="查询预审、正式审批、指标计入和历史意见。" />
    <Card title={<Space>成果类型<Select allowClear placeholder="全部类型" style={{ width: 180 }} value={type} onChange={setType} options={[...new Set(state.achievements.map((item) => item.achievementType))].map((item) => ({ label: item, value: item }))} /></Space>}>
      <Table rowKey="id" dataSource={scoped} onRow={(row) => ({ onClick: () => setDetail(row), style: { cursor: 'pointer' } })} columns={[
        { title: '成果名称', dataIndex: 'title' }, { title: '类型', dataIndex: 'achievementType', render: (value) => <Tag>{value}</Tag> },
        { title: '课题', dataIndex: 'topicId', render: (value) => state.topics.find((item) => item.id === value)?.name ?? value },
        { title: '状态', dataIndex: 'status', render: (value) => <StatusTag status={value} /> }, { title: '计入指标', dataIndex: 'countsToIndicator', render: (value) => value ? <Tag color="green">是</Tag> : <Tag>否</Tag> },
      ]} />
    </Card>
    <Drawer title="成果生命周期" width={680} open={Boolean(detail)} onClose={() => setDetail(null)}>{detail && <><Descriptions bordered column={1} items={[{ key: 'name', label: '成果名称', children: detail.title }, { key: 'type', label: '成果类型', children: detail.achievementType }, { key: 'status', label: '状态', children: <StatusTag status={detail.status} /> }, { key: 'owner', label: '负责人', children: detail.responsiblePerson }, { key: 'opinion', label: '最近意见', children: detail.approvalOpinion || '—' }]} /><Card title="审批时间线" size="small" style={{ marginTop: 16 }}><ApprovalTimeline records={state.approvalRecords.filter((item) => item.businessId === detail.id)} users={state.users} /></Card></>}</Drawer>
  </>;
}
