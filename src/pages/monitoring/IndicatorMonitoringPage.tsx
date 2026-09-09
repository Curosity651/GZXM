import { Card, Col, Progress, Row, Space, Table, Tag, Typography } from 'antd';
import { useAppStore } from '../../store';
import { buildUnitTopicSummaries } from '../../domain/monitoring';
import { PageHeader } from '../../components/common/PageHeader';
import { ACHIEVEMENT_TYPES } from '../../types';

const { Text } = Typography;

export function IndicatorMonitoringPage() {
  const state = useAppStore();
  const summaries = buildUnitTopicSummaries(state.topics, state.units, state.topicMemberships, state.topicIndicators, state.unitIndicatorAllocations, state.achievements, state.currentUser!);
  const visibleTopicIds = new Set(summaries.map((item) => item.topicId));
  const visibleUnitKeys = new Set(summaries.map((item) => `${item.topicId}:${item.unitId}`));
  const effective = state.achievements.filter((item) => visibleTopicIds.has(item.topicId) && visibleUnitKeys.has(`${item.topicId}:${item.uploadUnitId ?? item.unitId}`) && item.status === '已生效');

  return <>
    <PageHeader title="指标完成监控" description="预审通过不占用指标；正式成果终审通过后才进入完成数量。" />
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>{ACHIEVEMENT_TYPES.map((type) => {
      const count = effective.filter((item) => item.achievementType === type).length;
      return <Col xs={12} md={8} xl={Math.floor(24 / ACHIEVEMENT_TYPES.length)} key={type}><Card className="mini-stat"><Text type="secondary">{type}</Text><div className="mini-stat-value">{count}</div><Text type="secondary">项已生效成果</Text></Card></Col>;
    })}</Row>
    <Card title="课题—单位指标完成情况"><Table rowKey={(row) => `${row.topicId}-${row.unitId}`} dataSource={summaries} pagination={false} columns={[
      { title: '课题', dataIndex: 'topicName', render: (value, row) => <Space><Tag>{row.topicCode}</Tag><Text strong>{value}</Text></Space> },
      { title: '承担单位', dataIndex: 'unitName' },
      { title: '目标数量', dataIndex: 'planned', width: 110 }, { title: '完成数量', dataIndex: 'completed', width: 110 },
      { title: '指标缺口', dataIndex: 'gap', width: 100, render: (value) => value ? <Tag color="red">缺 {value}</Tag> : <Tag color="green">已达标</Tag> },
      { title: '完成率', dataIndex: 'rate', width: 260, render: (value) => <Progress percent={value} status={value < 50 ? 'exception' : 'active'} /> },
    ]} /></Card>
  </>;
}
