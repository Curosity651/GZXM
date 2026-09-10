import { Card, Col, Progress, Row, Space, Table, Tag } from 'antd';
import { PageHeader } from '../../components/common/PageHeader';
import { useAppStore } from '../../store';
import { archiveCompletion } from '../../domain/archive';
import { accessibleTopics, canViewAllTopicUnitData, isGlobalUser, isInternalTopicUnit, isTopicLead } from '../../domain/topic-access';

export function ArchiveMonitoringPage() {
  const state = useAppStore();
  const user = state.currentUser!;
  const visibleTopics = accessibleTopics(user, state.topics, state.topicMemberships);
  const topicReqs = state.archiveRequirements.filter((item) => item.ownerType === 'TOPIC_NATIONAL');
  const topicRows = visibleTopics.flatMap((topic) => state.topicMemberships.filter((member) => member.topicId === topic.id && member.enabled && (canViewAllTopicUnitData(user, topic.id, state.topicMemberships) || member.unitId === user.unitId)).map((member) => ({ ...topic, rowId: `${topic.id}:${member.unitId}`, unitId: member.unitId, stats: archiveCompletion(topicReqs, state.archiveSubmissions.filter((item) => item.ownerType === 'TOPIC_NATIONAL' && item.ownerId === `${topic.id}:${member.unitId}`)) })));
  const showSelfFunded = isGlobalUser(user) || isInternalTopicUnit(user);
  const projectRows = showSelfFunded ? state.selfFundedProjects.filter((item) => isGlobalUser(user) || (visibleTopics.some((topic) => topic.id === item.topicId) && (item.ownerUnitId === user.unitId || isTopicLead(user, item.topicId, state.topicMemberships)))).map((project) => ({ ...project, stats: archiveCompletion(state.archiveRequirements.filter((item) => item.ownerType === 'SELF_FUNDED' && item.templateId === project.templateSnapshotId), state.archiveSubmissions.filter((item) => item.ownerType === 'SELF_FUNDED' && item.ownerId === project.id)) })) : [];
  return <>
    <PageHeader title="归档进度监控" description="按课题、单位和自筹项目统计材料上传完成情况；材料上传后直接计入完成率。" />
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}><Col xs={24} md={showSelfFunded ? 12 : 24}><Card title="课题国家材料"><h1>{topicRows.length}</h1><span>个单位清单纳入监控</span></Card></Col>{showSelfFunded && <Col xs={24} md={12}><Card title="配套自筹项目"><h1>{projectRows.length}</h1><span>个项目纳入归档</span></Card></Col>}</Row>
    <Card title="课题国家材料" style={{ marginBottom: 16 }}><Table rowKey="rowId" pagination={false} dataSource={topicRows} columns={[{ title: '课题', render: (_, row) => <Space><Tag>{row.code}</Tag>{row.name}</Space> }, { title: '提交单位', dataIndex: 'unitId', render: (value) => state.units.find((item) => item.id === value)?.name ?? value }, { title: '完成项', render: (_, row) => `${row.stats.completed}/${row.stats.required}` }, { title: '完成率', render: (_, row) => <Progress percent={row.stats.rate} /> }]} /></Card>
    {showSelfFunded && <Card title="配套自筹项目归档"><Table rowKey="id" pagination={false} dataSource={projectRows} columns={[{ title: '所属课题', dataIndex: 'topicId', render: (value) => state.topics.find((item) => item.id === value)?.name }, { title: '归属单位', dataIndex: 'ownerUnitId', render: (value) => state.units.find((item) => item.id === value)?.name ?? value }, { title: '项目名称', dataIndex: 'name' }, { title: '类型', dataIndex: 'projectType', render: (value) => <Tag color="purple">{value}</Tag> }, { title: '完成项', render: (_, row) => `${row.stats.completed}/${row.stats.required}` }, { title: '完成率', render: (_, row) => <Progress percent={row.stats.rate} /> }]} /></Card>}
  </>;
}
