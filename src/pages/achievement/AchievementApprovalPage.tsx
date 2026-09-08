import { useMemo, useState } from 'react';
import { Alert, Button, Card, Descriptions, Drawer, Input, Modal, Space, Table, Tabs, Tag, Typography, message } from 'antd';
import { CheckOutlined, EyeOutlined, RollbackOutlined } from '@ant-design/icons';
import type { Achievement } from '../../types';
import { useAppStore } from '../../store';
import type { AchievementAction } from '../../domain/workflows';
import { canPerform, filterByTopicScope } from '../../domain/permissions';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusTag } from '../../components/common/StatusTag';
import { ApprovalTimeline } from '../../components/common/ApprovalTimeline';

const { Text } = Typography;

export function AchievementApprovalPage() {
  const state = useAppStore();
  const user = state.currentUser!;
  const canInitial = canPerform(user, state.roles, 'achievement.initial.approve');
  const canFinal = canPerform(user, state.roles, 'achievement.final.approve');
  const [detail, setDetail] = useState<Achievement | null>(null);
  const [opinion, setOpinion] = useState('');
  const [decisionOpen, setDecisionOpen] = useState<'approve' | 'return' | null>(null);
  const reviewable = useMemo(() => filterByTopicScope(user, state.achievements).filter((item) =>
    (canInitial && ['预审初审中', '正式初审中'].includes(item.status)) || (canFinal && ['预审终审中', '正式终审中'].includes(item.status))), [canFinal, canInitial, state.achievements, user]);
  const topicMap = Object.fromEntries(state.topics.map((topic) => [topic.id, topic.name]));
  const currentAction: AchievementAction | null = detail?.status.includes('初审中') && canInitial ? 'APPROVE_INITIAL' : detail?.status.includes('终审中') && canFinal ? 'APPROVE_FINAL' : null;
  const confirmDecision = () => {
    if (!detail || !currentAction) return;
    if (decisionOpen === 'return' && !opinion.trim()) return message.warning('退回时必须填写审批意见');
    state.reviewAchievement(detail.id, decisionOpen === 'approve' ? currentAction : 'RETURN', state.currentUser!.id, opinion || '同意');
    message.success(decisionOpen === 'approve' ? '审批已通过' : '已退回修改');
    setDecisionOpen(null); setDetail(null); setOpinion('');
  };

  const list = (items: Achievement[]) => <Table rowKey="id" dataSource={items} columns={[
    { title: '成果名称', dataIndex: 'title', render: (value, row) => <div><Text strong>{value}</Text><div><Tag>{row.achievementType}</Tag></div></div> },
    { title: '所属课题', dataIndex: 'topicId', render: (value) => topicMap[value] ?? value },
    { title: '负责人', dataIndex: 'responsiblePerson', width: 110 },
    { title: '审批阶段', dataIndex: 'status', width: 140, render: (value) => <StatusTag status={value} /> },
    { title: '提交时间', dataIndex: 'submittedAt', width: 120 },
    { title: '操作', width: 100, render: (_, row) => <Button type="link" icon={<EyeOutlined />} onClick={() => setDetail(row)}>查看审批</Button> },
  ]} />;

  return <>
    <PageHeader title="成果审批" description="预审关注名称、人员和单位排序；正式审批关注认定材料。初审与终审职责分离。" />
    {!canInitial && !canFinal && <Alert type="info" showIcon message="当前角色可查看审批记录，但没有审批操作权限。" style={{ marginBottom: 16 }} />}
    <Card><Tabs items={[
      { key: 'pre', label: `预审待办（${reviewable.filter((item) => item.status.startsWith('预审')).length}）`, children: list(reviewable.filter((item) => item.status.startsWith('预审'))) },
      { key: 'formal', label: `正式成果待办（${reviewable.filter((item) => item.status.startsWith('正式')).length}）`, children: list(reviewable.filter((item) => item.status.startsWith('正式'))) },
    ]} /></Card>
    <Drawer width={760} title="成果审批详情" open={Boolean(detail)} onClose={() => setDetail(null)} extra={currentAction && <Space><Button danger icon={<RollbackOutlined />} onClick={() => setDecisionOpen('return')}>退回修改</Button><Button type="primary" icon={<CheckOutlined />} onClick={() => setDecisionOpen('approve')}>审批通过</Button></Space>}>
      {detail && <><Descriptions bordered column={2} size="small" items={[
        { key: 'title', label: '成果名称', children: detail.title, span: 2 }, { key: 'type', label: '成果类型', children: detail.achievementType },
        { key: 'status', label: '当前状态', children: <StatusTag status={detail.status} /> }, { key: 'topic', label: '所属课题', children: topicMap[detail.topicId] },
        { key: 'owner', label: '负责人', children: detail.responsiblePerson }, { key: 'people', label: '人员顺序', children: detail.allAuthors || detail.inventorList || detail.mainDevelopers || detail.drafters || detail.studentName || '—', span: 2 },
        { key: 'units', label: '单位排序', children: detail.signingUnitList || detail.applicantList || detail.copyrightOwnerList || detail.participatingUnits || '—', span: 2 },
        { key: 'mark', label: '项目标注', children: detail.projectLabeling || '—', span: 2 }, { key: 'remarks', label: '填报说明', children: detail.remarks || '—', span: 2 },
      ]} /><Card size="small" title="附件核对" style={{ marginTop: 16 }}>{detail.materials.length ? detail.materials.map((item) => <Tag key={item.id}>{item.fileName}</Tag>) : <Text type="secondary">当前为 Mock 原型，暂无真实文件；请按字段信息演示审批。</Text>}</Card><Card size="small" title="审批记录" style={{ marginTop: 16 }}><ApprovalTimeline records={state.approvalRecords.filter((item) => item.businessId === detail.id)} users={state.users} /></Card></>}
    </Drawer>
    <Modal title={decisionOpen === 'approve' ? '确认审批通过' : '退回修改'} open={Boolean(decisionOpen)} onCancel={() => setDecisionOpen(null)} onOk={confirmDecision} okText="确认"><Input.TextArea rows={4} value={opinion} onChange={(event) => setOpinion(event.target.value)} placeholder={decisionOpen === 'return' ? '请填写明确的退回原因' : '可填写审批意见'} /></Modal>
  </>;
}
