import { useMemo, useState } from 'react';
import { Button, Card, Drawer, Input, Modal, Segmented, Space, Table, Tabs, Tag, Typography, message } from 'antd';
import { CheckOutlined, EyeOutlined, RollbackOutlined } from '@ant-design/icons';
import type { Achievement } from '../../types';
import { useAppStore } from '../../store';
import { reviewActionFor } from '../../domain/achievement';
import { canViewAchievement } from '../../domain/topic-access';
import { StatusTag } from '../../components/common/StatusTag';
import { AchievementDetail } from '../../components/achievement/AchievementDetail';

const { Text } = Typography;
type WorkScope = '待我审批' | '已审批' | '全部记录';

export function AchievementApprovalPage() {
  const state = useAppStore();
  const user = state.currentUser!;
  const [stage, setStage] = useState<'pre' | 'formal'>('pre');
  const [scope, setScope] = useState<WorkScope>('待我审批');
  const [detail, setDetail] = useState<Achievement | null>(null);
  const [opinion, setOpinion] = useState('');
  const [decision, setDecision] = useState<'approve' | 'return' | null>(null);

  const visible = useMemo(() => state.achievements.filter((item) => canViewAchievement(user, item, state.topicMemberships)), [state.achievements, state.topicMemberships, user]);
  const stageRows = visible.filter((item) => stage === 'pre' ? item.status.includes('预审') || item.status === '允许投稿/申请' : item.status.startsWith('正式') || item.status === '已生效');
  const processedIds = new Set(state.approvalRecords.filter((item) => item.businessType === 'ACHIEVEMENT' && item.operatorId === user.id && item.stage === (stage === 'pre' ? 'PRE_REVIEW' : 'FORMAL')).map((item) => item.businessId));
  const rows = stageRows.filter((item) => scope === '待我审批' ? Boolean(reviewActionFor(item.status as never, user.role)) : scope === '已审批' ? processedIds.has(item.id) : true);
  const currentAction = detail ? reviewActionFor(detail.status as never, user.role) : null;

  const confirmDecision = () => {
    if (!detail || !currentAction || !decision) return;
    if (decision === 'return' && !opinion.trim()) return message.warning('退回时必须填写审批意见');
    state.reviewAchievement(detail.id, decision === 'approve' ? currentAction : 'RETURN', user.id, opinion || '同意');
    message.success(decision === 'approve' ? '审批已通过' : '已退回修改');
    setDecision(null); setDetail(null); setOpinion('');
  };
  const stageLabel = (item: Achievement) => item.status.includes('初审') ? '科研助理初审' : item.status.includes('终审') ? '项目技术负责人终审' : item.status === '已生效' ? '审批完成' : '单位补充材料';

  return <>
    <Card>
      <Tabs activeKey={stage} onChange={(key) => { setStage(key as 'pre' | 'formal'); setScope('待我审批'); }} items={[
        { key: 'pre', label: '投稿/申请前预审' }, { key: 'formal', label: '正式成果审批' },
      ]} />
      <Segmented value={scope} onChange={(value) => setScope(value as WorkScope)} options={['待我审批', '已审批', '全部记录']} style={{ marginBottom: 16 }} />
      <Table rowKey="id" dataSource={rows} columns={[
        { title: '成果名称', dataIndex: 'title', render: (value, row) => <Space direction="vertical" size={0}><Text strong>{value}</Text><Tag>{row.achievementType}</Tag></Space> },
        { title: '所属课题', dataIndex: 'topicId', render: (value) => state.topics.find((item) => item.id === value)?.name ?? value },
        { title: '提交单位', render: (_, row) => state.units.find((item) => item.id === (row.uploadUnitId ?? row.unitId))?.name ?? '—' },
        { title: '提交人', dataIndex: 'responsiblePerson', width: 110 },
        { title: '当前环节', width: 150, render: (_, row) => stageLabel(row) },
        { title: '状态', dataIndex: 'status', width: 140, render: (value) => <StatusTag status={value} /> },
        { title: '提交时间', dataIndex: 'submittedAt', width: 120, render: (value) => value?.slice(0, 10) ?? '—' },
        { title: '操作', width: 110, render: (_, row) => <Button type="link" icon={<EyeOutlined />} onClick={() => setDetail(row)}>{reviewActionFor(row.status as never, user.role) ? '审批' : '查看'}</Button> },
      ]} />
    </Card>
    <Drawer width={920} title="成果审批详情" open={Boolean(detail)} onClose={() => setDetail(null)} extra={currentAction && <Space><Button danger icon={<RollbackOutlined />} onClick={() => setDecision('return')}>退回修改</Button><Button type="primary" icon={<CheckOutlined />} onClick={() => setDecision('approve')}>审批通过</Button></Space>}>
      {detail && <AchievementDetail achievement={detail} topics={state.topics} units={state.units} records={state.approvalRecords.filter((item) => item.businessId === detail.id)} users={state.users} />}
    </Drawer>
    <Modal title={decision === 'approve' ? '确认审批通过' : '退回修改'} open={Boolean(decision)} onCancel={() => setDecision(null)} onOk={confirmDecision} okText="确认"><Input.TextArea rows={4} value={opinion} onChange={(event) => setOpinion(event.target.value)} placeholder={decision === 'return' ? '请填写明确的退回原因' : '审批意见（选填）'} /></Modal>
  </>;
}
