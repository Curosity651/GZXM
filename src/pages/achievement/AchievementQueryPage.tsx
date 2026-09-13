import { useMemo, useState } from 'react';
import { Button, Card, Col, Drawer, Progress, Row, Select, Space, Statistic, Table, Tag, Typography } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import type { Achievement } from '../../types';
import { useAppStore } from '../../store';
import { aggregateAchievementProgress, type AchievementProgressRow } from '../../domain/achievement';
import { accessibleTopics, canViewAchievement, isTopicLead } from '../../domain/topic-access';
import { StatusTag } from '../../components/common/StatusTag';
import { AchievementDetail } from '../../components/achievement/AchievementDetail';

const { Text } = Typography;

export function AchievementQueryPage() {
  const state = useAppStore();
  const user = state.currentUser!;
  const topics = accessibleTopics(user, state.topics, state.topicMemberships);
  const global = ['项目技术负责人', '科研助理'].includes(user.role);
  const visibleAchievements = state.achievements.filter((item) => canViewAchievement(user, item, state.topicMemberships));
  const visibleAllocations = state.unitIndicatorAllocations.filter((item) => {
    if (item.status !== '已下发' || item.targetQuantity <= 0) return false;
    if (global) return true;
    if (!topics.some((topic) => topic.id === item.topicId)) return false;
    return isTopicLead(user, item.topicId, state.topicMemberships) || item.unitId === user.unitId;
  });
  const allRows = useMemo(() => aggregateAchievementProgress(visibleAllocations, visibleAchievements), [visibleAchievements, visibleAllocations]);
  const [topicId, setTopicId] = useState<string>();
  const [unitId, setUnitId] = useState<string>();
  const [definitionId, setDefinitionId] = useState<string>();
  const [selected, setSelected] = useState<AchievementProgressRow | null>(null);
  const [detail, setDetail] = useState<Achievement | null>(null);
  const rows = allRows.filter((item) => (!topicId || item.topicId === topicId) && (!unitId || item.unitId === unitId) && (!definitionId || item.indicatorDefinitionId === definitionId));
  const totals = rows.reduce((sum, item) => ({ target: sum.target + item.target, initiated: sum.initiated + item.initiated, preApproved: sum.preApproved + item.preApproved, external: sum.external + item.external, formal: sum.formal + item.formal, supplement: sum.supplement + item.supplement, effective: sum.effective + item.effective }), { target: 0, initiated: 0, preApproved: 0, external: 0, formal: 0, supplement: 0, effective: 0 });
  const rate = totals.target > 0 ? Math.round(totals.effective / totals.target * 100) : 0;

  return <>
    <Row gutter={12} style={{ marginBottom: 16 }}>
      {[['指标总数', totals.target], ['已发起', totals.initiated], ['预审通过', totals.preApproved], ['已投稿/申请', totals.external], ['正式审批', totals.formal], ['补充阶段', totals.supplement], ['已生效', totals.effective]].map(([label, value]) => <Col flex="1 1 130px" key={String(label)}><Card><Statistic title={label} value={value} /></Card></Col>)}
    </Row>
    <Card style={{ marginBottom: 16 }}><Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}><div><Text type="secondary">总体指标完成率</Text><div><Text strong style={{ fontSize: 24 }}>{rate}%</Text><Text type="secondary">　{totals.effective}/{totals.target}</Text></div></div><Progress percent={Math.min(rate, 100)} status={rate >= 100 ? 'success' : 'active'} style={{ width: 420 }} format={() => rate > 100 ? `${rate}%（超额）` : `${rate}%`} /></Space></Card>
    <Card>
      <Space wrap style={{ marginBottom: 16 }}>
        <Select allowClear placeholder="全部课题" style={{ width: 240 }} value={topicId} onChange={setTopicId} options={topics.map((item) => ({ label: `${item.code} ${item.name}`, value: item.id }))} />
        <Select allowClear placeholder="全部单位" style={{ width: 240 }} value={unitId} onChange={setUnitId} options={state.units.filter((unit) => visibleAllocations.some((item) => item.unitId === unit.id)).map((item) => ({ label: item.name, value: item.id }))} />
        <Select allowClear placeholder="全部成果类型" style={{ width: 190 }} value={definitionId} onChange={setDefinitionId} options={state.indicatorDefinitions.filter((definition) => visibleAllocations.some((item) => item.indicatorDefinitionId === definition.id)).map((item) => ({ label: item.name, value: item.id }))} />
      </Space>
      <Table rowKey="key" dataSource={rows} scroll={{ x: 1180 }} columns={[
        { title: '课题', dataIndex: 'topicId', width: 190, fixed: 'left', render: (value) => state.topics.find((item) => item.id === value)?.name ?? value },
        { title: '单位', dataIndex: 'unitId', width: 190, render: (value) => state.units.find((item) => item.id === value)?.name ?? value },
        { title: '成果类型', dataIndex: 'indicatorDefinitionId', width: 130, render: (value, row) => state.indicatorDefinitions.find((item) => item.id === value)?.name ?? row.achievementType },
        { title: '分配指标', dataIndex: 'target', width: 90 }, { title: '已发起', dataIndex: 'initiated', width: 80 }, { title: '预审通过', dataIndex: 'preApproved', width: 90 }, { title: '已投稿/申请', dataIndex: 'external', width: 110 }, { title: '正式审批', dataIndex: 'formal', width: 90 }, { title: '补充阶段', dataIndex: 'supplement', width: 90 }, { title: '已生效', dataIndex: 'effective', width: 80 },
        { title: '完成率', dataIndex: 'completionRate', width: 170, render: (value, row) => <Space><Progress type="circle" size={44} percent={Math.min(value, 100)} format={() => `${value}%`} /><Text type="secondary">{row.effective}/{row.target}</Text></Space> },
        { title: '操作', fixed: 'right', width: 90, render: (_, row) => <Button type="link" icon={<EyeOutlined />} onClick={() => setSelected(row)}>明细</Button> },
      ]} />
    </Card>
    <Drawer width={820} title="成果进度明细" open={Boolean(selected)} onClose={() => setSelected(null)}>{selected && <><Space style={{ marginBottom: 16 }}><Tag color="blue">{state.indicatorDefinitions.find((item) => item.id === selected.indicatorDefinitionId)?.name}</Tag><Text>{state.units.find((item) => item.id === selected.unitId)?.name}</Text><Text type="secondary">已生效 {selected.effective}/{selected.target}</Text></Space><Table rowKey="id" dataSource={selected.achievements} pagination={false} columns={[{ title: '成果名称', dataIndex: 'title' }, { title: '负责人', dataIndex: 'responsiblePerson' }, { title: '状态', dataIndex: 'status', render: (value) => <StatusTag status={value} /> }, { title: '操作', width: 80, render: (_, row) => <Button type="link" onClick={() => setDetail(row)}>查看</Button> }]} /></>}</Drawer>
    <Drawer width={860} title="成果详情" open={Boolean(detail)} onClose={() => setDetail(null)}>{detail && <AchievementDetail achievement={detail} topics={state.topics} units={state.units} records={state.approvalRecords.filter((item) => item.businessId === detail.id)} users={state.users} />}</Drawer>
  </>;
}
