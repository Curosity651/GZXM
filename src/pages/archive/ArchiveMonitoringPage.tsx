import { Card, Col, Progress, Row, Space, Table, Tag } from 'antd';
import { PageHeader } from '../../components/common/PageHeader';
import { useAppStore } from '../../store';
import { archiveCompletion } from '../../domain/archive';

export function ArchiveMonitoringPage() {
  const state = useAppStore();
  const user = state.currentUser!;
  const topicIds = user.role === '课题牵头单位' ? [user.topicId!] : state.topics.map((item) => item.id);
  const publicReqs = state.archiveRequirements.filter((item) => item.ownerType === 'PROJECT_PUBLIC');
  const topicReqs = state.archiveRequirements.filter((item) => item.ownerType === 'TOPIC_NATIONAL');
  const publicStats = archiveCompletion(publicReqs, state.archiveSubmissions.filter((item) => item.ownerType === 'PROJECT_PUBLIC'));
  const topicRows = state.topics.filter((topic) => topicIds.includes(topic.id)).map((topic) => ({ ...topic, stats: archiveCompletion(topicReqs, state.archiveSubmissions.filter((item) => item.ownerType === 'TOPIC_NATIONAL' && item.ownerId === topic.id)) }));
  const projectRows = state.selfFundedProjects.filter((item) => topicIds.includes(item.topicId)).map((project) => ({ ...project, stats: archiveCompletion(state.archiveRequirements.filter((item) => item.ownerType === 'SELF_FUNDED' && item.templateId === project.templateSnapshotId), state.archiveSubmissions.filter((item) => item.ownerType === 'SELF_FUNDED' && item.ownerId === project.id)) }));
  return <>
    <PageHeader title="归档进度监控" description="仅终审通过的清单项计入完成率，条件材料在确认适用后进入分母。" />
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}><Col xs={24} md={8}><Card title="项目公共材料"><Progress type="dashboard" percent={publicStats.rate} /><div>{publicStats.completed}/{publicStats.required} 项完成</div></Card></Col><Col xs={24} md={8}><Card title="课题国家材料"><h1>{topicRows.length}</h1><span>个课题纳入监控</span></Card></Col><Col xs={24} md={8}><Card title="配套自筹项目"><h1>{projectRows.length}</h1><span>个项目纳入归档</span></Card></Col></Row>
    <Card title="课题国家材料" style={{ marginBottom: 16 }}><Table rowKey="id" pagination={false} dataSource={topicRows} columns={[{ title: '课题', render: (_, row) => <Space><Tag>{row.code}</Tag>{row.name}</Space> }, { title: '完成项', render: (_, row) => `${row.stats.completed}/${row.stats.required}` }, { title: '完成率', render: (_, row) => <Progress percent={row.stats.rate} /> }]} /></Card>
    <Card title="配套自筹项目归档"><Table rowKey="id" pagination={false} dataSource={projectRows} columns={[{ title: '所属课题', dataIndex: 'topicId', render: (value) => state.topics.find((item) => item.id === value)?.name }, { title: '项目名称', dataIndex: 'name' }, { title: '类型', dataIndex: 'projectType', render: (value) => <Tag color="purple">{value}</Tag> }, { title: '完成项', render: (_, row) => `${row.stats.completed}/${row.stats.required}` }, { title: '完成率', render: (_, row) => <Progress percent={row.stats.rate} /> }]} /></Card>
  </>;
}
