import { Card, Col, Progress, Row, Space, Statistic, Table, Tag, Typography } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, FileDoneOutlined, FolderOpenOutlined, RiseOutlined, WarningOutlined } from '@ant-design/icons';
import { useAppStore } from '../store';
import { buildTopicSummariesV2 } from '../domain/monitoring';
import { StatusTag } from '../components/common/StatusTag';
import { canPerform } from '../domain/permissions';
import { accessibleTopics, canViewAchievement, isGlobalUser, isInternalTopicUnit, isTopicLead } from '../domain/topic-access';
import { isArchiveRequirementComplete } from '../domain/archive';

const { Text } = Typography;

export function HomePage() {
  const state = useAppStore();
  const user = state.currentUser!;
  const summaries = buildTopicSummariesV2(state.topics, state.topicMemberships, state.topicIndicators, state.achievements, user);
  const visibleAchievements = state.achievements.filter((item) => canViewAchievement(user, item, state.topicMemberships));
  const visibleTopicIds = new Set(accessibleTopics(user, state.topics, state.topicMemberships).map((item) => item.id));
  const visibleReports = state.reports.filter((item) => visibleTopicIds.has(item.topicId));
  const visibleArchiveSubmissions = state.archiveSubmissions.filter((item) => {
    if (isGlobalUser(user)) return true;
    if (item.ownerType === 'PROJECT_PUBLIC') return false;
    if (!item.topicId || !visibleTopicIds.has(item.topicId)) return false;
    if (item.ownerType === 'TOPIC_NATIONAL') return item.unitId === user.unitId || isTopicLead(user, item.topicId, state.topicMemberships);
    const project = state.selfFundedProjects.find((entry) => entry.id === item.ownerId);
    return isInternalTopicUnit(user) && Boolean(project && (project.ownerUnitId === user.unitId || isTopicLead(user, item.topicId, state.topicMemberships)));
  });
  const effective = visibleAchievements.filter((item) => item.status === '已生效').length;
  const reportDone = visibleReports.filter((item) => item.status === '已通过').length;
  const archiveDone = visibleArchiveSubmissions.filter((item) => {
    const requirement = state.archiveRequirements.find((entry) => entry.id === item.requirementId);
    return requirement ? isArchiveRequirementComplete(requirement, item) : false;
  }).length;
  const waiting = visibleAchievements.filter((item) => item.status.includes('初审中') || item.status.includes('终审中')).length + visibleReports.filter((item) => ['初审中', '终审中'].includes(item.status)).length;
  const initialReviewer = canPerform(user, state.roles, 'achievement.initial.approve');
  const finalReviewer = canPerform(user, state.roles, 'achievement.final.approve');
  const tasks = [
    ...visibleAchievements.filter((item) => (initialReviewer && item.status.includes('初审中')) || (finalReviewer && item.status.includes('终审中'))).map((item) => ({ id: `achievement-${item.id}`, title: item.title, status: item.status, type: '成果审批' })),
    ...visibleReports.filter((item) => (canPerform(user, state.roles, 'report.initial.approve') && item.status === '初审中') || (canPerform(user, state.roles, 'report.final.approve') && item.status === '终审中')).map((item) => ({ id: `report-${item.id}`, title: `${item.reportType === 'MONTHLY' ? '月报' : '季报'} · ${state.topics.find((topic) => topic.id === item.topicId)?.name}`, status: item.status, type: '进度报告' })),
  ];

  return <>
    <Row gutter={[16, 16]}>
      {[{ title: '课题数量', value: summaries.length, icon: <RiseOutlined />, color: '#1677ff' }, { title: '生效成果', value: effective, icon: <FileDoneOutlined />, color: '#00a870' }, { title: '已通过报告', value: reportDone, icon: <CheckCircleOutlined />, color: '#7b61ff' }, { title: '已提交材料项', value: archiveDone, icon: <FolderOpenOutlined />, color: '#fa8c16' }, { title: '当前待审批', value: waiting, icon: <ClockCircleOutlined />, color: '#eb2f96' }].map((item) => <Col flex="1 1 190px" key={item.title}><Card className="metric-card"><Space align="start"><div className="metric-icon" style={{ color: item.color, background: `${item.color}15` }}>{item.icon}</div><Statistic title={item.title} value={item.value} /></Space></Card></Col>)}
    </Row>
    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
      <Col xs={24} xl={16} style={{ display: 'flex' }}><Card title="课题执行概览" extra={<Tag color="blue">文件上传实时计入</Tag>} style={{ width: '100%', height: '100%' }}>
        <Table rowKey="topicId" size="middle" pagination={false} dataSource={summaries} columns={[
          { title: '课题', dataIndex: 'topicName', render: (value, row) => <Space><Tag>{row.topicCode}</Tag><Text strong>{value}</Text></Space> },
          { title: '指标目标', dataIndex: 'planned', width: 100 }, { title: '已完成', dataIndex: 'completed', width: 90 },
          { title: '缺口', dataIndex: 'gap', width: 80, render: (value) => <Text type={value > 0 ? 'danger' : 'success'}>{value}</Text> },
          { title: '完成率', dataIndex: 'rate', width: 220, render: (value) => <Progress percent={value} size="small" status={value < 50 ? 'exception' : 'active'} /> },
        ]} />
      </Card></Col>
      <Col xs={24} xl={8} style={{ display: 'flex' }}><Card title="我的待办" extra={<WarningOutlined style={{ color: '#fa8c16' }} />} style={{ width: '100%', height: '100%' }}>
        <Table rowKey="id" size="small" pagination={false} dataSource={tasks} scroll={{ y: 280 }} locale={{ emptyText: <div className="empty-compact"><CheckCircleOutlined /><p>当前没有待办事项</p></div> }} columns={[
          { title: '待办事项', dataIndex: 'title', ellipsis: true },
          { title: '业务类型', dataIndex: 'type', width: 90 },
          { title: '状态', dataIndex: 'status', width: 100, render: (value) => <StatusTag status={value} /> },
        ]} />
      </Card></Col>
    </Row>
  </>;
}
