import { Alert, Card, Col, List, Progress, Row, Space, Statistic, Table, Tag, Typography } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, FileDoneOutlined, FolderOpenOutlined, RiseOutlined, WarningOutlined } from '@ant-design/icons';
import { useAppStore } from '../store';
import { buildTopicSummaries } from '../domain/monitoring';
import { PageHeader } from '../components/common/PageHeader';
import { StatusTag } from '../components/common/StatusTag';
import { canPerform, filterByTopicScope, getRole } from '../domain/permissions';

const { Text } = Typography;

export function HomePage() {
  const state = useAppStore();
  const user = state.currentUser!;
  const role = getRole(user, state.roles);
  const summaries = buildTopicSummaries(state.topics, state.indicators, state.achievements, state.currentUser ?? undefined);
  const effective = state.achievements.filter((item) => item.status === '已生效' || item.status === '审批通过').length;
  const reportDone = state.reports.filter((item) => item.status === '已通过').length;
  const archiveDone = state.archiveSubmissions.filter((item) => item.status === '已通过').length;
  const waiting = state.achievements.filter((item) => item.status.includes('初审中') || item.status.includes('终审中')).length + state.reports.filter((item) => ['初审中', '终审中'].includes(item.status)).length;
  const roleHint: Record<string, string> = {
    系统管理员: '你可以查看全部业务页面并维护账号与系统配置，业务审批按钮默认关闭。',
    项目技术负责人: '重点关注待终审事项、课题横向进度和高风险预警。',
    科研助理: '重点处理成果、报告和归档初审，并维护课题指标与项目公共材料。',
    课题牵头单位: '请及时办理本课题成果、月季报、国家材料和配套自筹项目归档。',
  };
  const initialReviewer = canPerform(user, state.roles, 'achievement.initial.approve');
  const finalReviewer = canPerform(user, state.roles, 'achievement.final.approve');
  const tasks = [
    ...filterByTopicScope(user, state.achievements).filter((item) => (initialReviewer && item.status.includes('初审中')) || (finalReviewer && item.status.includes('终审中'))).slice(0, 3).map((item) => ({ title: item.title, status: item.status, type: '成果审批' })),
    ...filterByTopicScope(user, state.reports).filter((item) => (canPerform(user, state.roles, 'report.initial.approve') && item.status === '初审中') || (canPerform(user, state.roles, 'report.final.approve') && item.status === '终审中')).slice(0, 2).map((item) => ({ title: `${item.reportType === 'MONTHLY' ? '月报' : '季报'} · ${state.topics.find((topic) => topic.id === item.topicId)?.name}`, status: item.status, type: '进度报告' })),
  ];

  return <>
    <PageHeader title="工作台" description={`${user.name}，欢迎回来。${roleHint[role?.name ?? ''] ?? `当前角色：${role?.name ?? '未分配'}。`}`} />
    <Alert type="info" showIcon message="本系统管理一个固定重点项目；科研指标、成果和月季报均按课题办理，配套自筹项目仅用于材料归档。" style={{ marginBottom: 20 }} />
    <Row gutter={[16, 16]}>
      {[{ title: '课题数量', value: summaries.length, icon: <RiseOutlined />, color: '#1677ff' }, { title: '生效成果', value: effective, icon: <FileDoneOutlined />, color: '#00a870' }, { title: '已通过报告', value: reportDone, icon: <CheckCircleOutlined />, color: '#7b61ff' }, { title: '已完成归档项', value: archiveDone, icon: <FolderOpenOutlined />, color: '#fa8c16' }, { title: '当前待审批', value: waiting, icon: <ClockCircleOutlined />, color: '#eb2f96' }].map((item) => <Col flex="1 1 190px" key={item.title}><Card className="metric-card"><Space align="start"><div className="metric-icon" style={{ color: item.color, background: `${item.color}15` }}>{item.icon}</div><Statistic title={item.title} value={item.value} /></Space></Card></Col>)}
    </Row>
    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
      <Col xs={24} xl={16}><Card title="课题执行概览" extra={<Tag color="blue">仅终审通过计入</Tag>}>
        <Table rowKey="topicId" size="middle" pagination={false} dataSource={summaries} columns={[
          { title: '课题', dataIndex: 'topicName', render: (value, row) => <Space><Tag>{row.topicCode}</Tag><Text strong>{value}</Text></Space> },
          { title: '指标目标', dataIndex: 'planned', width: 100 }, { title: '已完成', dataIndex: 'completed', width: 90 },
          { title: '缺口', dataIndex: 'gap', width: 80, render: (value) => <Text type={value > 0 ? 'danger' : 'success'}>{value}</Text> },
          { title: '完成率', dataIndex: 'rate', width: 220, render: (value) => <Progress percent={value} size="small" status={value < 50 ? 'exception' : 'active'} /> },
        ]} />
      </Card></Col>
      <Col xs={24} xl={8}><Card title="我的待办" extra={<WarningOutlined style={{ color: '#fa8c16' }} />}>
        {tasks.length ? <List dataSource={tasks} renderItem={(item) => <List.Item><List.Item.Meta title={item.title} description={item.type} /><StatusTag status={item.status} /></List.Item>} /> : <div className="empty-compact"><CheckCircleOutlined /><p>当前没有待办事项</p></div>}
      </Card></Col>
    </Row>
  </>;
}
