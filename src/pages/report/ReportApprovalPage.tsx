import { useMemo, useState } from 'react';
import { Alert, Button, Card, Descriptions, Drawer, Input, Modal, Space, Table, Tag, message } from 'antd';
import { CheckOutlined, EyeOutlined, RollbackOutlined } from '@ant-design/icons';
import type { ProgressReport } from '../../types';
import type { ReportAction } from '../../domain/report-flow';
import { useAppStore } from '../../store';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusTag } from '../../components/common/StatusTag';
import { ApprovalTimeline } from '../../components/common/ApprovalTimeline';
import { canPerform, filterByTopicScope } from '../../domain/permissions';

export function ReportApprovalPage() {
  const state = useAppStore();
  const user = state.currentUser!;
  const canInitial = canPerform(user, state.roles, 'report.initial.approve');
  const canFinal = canPerform(user, state.roles, 'report.final.approve');
  const [detail, setDetail] = useState<ProgressReport | null>(null);
  const [decision, setDecision] = useState<'approve' | 'return' | null>(null);
  const [opinion, setOpinion] = useState('');
  const reviewable = useMemo(() => filterByTopicScope(user, state.reports).filter((item) => (canInitial && item.status === '初审中') || (canFinal && item.status === '终审中')), [canFinal, canInitial, state.reports, user]);
  const approveAction: ReportAction | null = detail ? detail.status === '初审中' && canInitial ? 'APPROVE_INITIAL' : detail.status === '终审中' && canFinal ? 'APPROVE_FINAL' : null : null;
  const confirm = () => {
    if (!detail || !approveAction) return;
    if (decision === 'return' && !opinion.trim()) return message.warning('退回时必须填写审批意见');
    state.reviewReport(detail.id, decision === 'approve' ? approveAction : 'RETURN', state.currentUser!.id, opinion || '同意');
    message.success(decision === 'approve' ? '审批已通过' : '已退回修改'); setDecision(null); setDetail(null); setOpinion('');
  };
  return <>
    <PageHeader title="月季报审批" description="科研助理初审，项目技术负责人终审；终审通过后纳入项目进度统计。" />
    {!canInitial && !canFinal && <Alert showIcon type="info" message="当前角色可查看审批记录，但没有审批操作权限。" style={{ marginBottom: 16 }} />}
    <Card><Table rowKey="id" dataSource={reviewable} columns={[
      { title: '报告', render: (_, row) => <Space><Tag color={row.reportType === 'MONTHLY' ? 'blue' : 'purple'}>{row.reportType === 'MONTHLY' ? '月报' : '季报'}</Tag>{state.topics.find((item) => item.id === row.topicId)?.name}</Space> },
      { title: '状态', dataIndex: 'status', width: 120, render: (value) => <StatusTag status={value} /> },
      { title: '提交时间', dataIndex: 'submittedAt', width: 130 }, { title: '逾期', dataIndex: 'overdue', width: 80, render: (value) => value ? <Tag color="red">是</Tag> : <Tag color="green">否</Tag> },
      { title: '操作', width: 110, render: (_, row) => <Button type="link" icon={<EyeOutlined />} onClick={() => setDetail(row)}>查看审批</Button> },
    ]} /></Card>
    <Drawer width={760} title="进度报告详情" open={Boolean(detail)} onClose={() => setDetail(null)} extra={approveAction && <Space><Button danger icon={<RollbackOutlined />} onClick={() => setDecision('return')}>退回</Button><Button type="primary" icon={<CheckOutlined />} onClick={() => setDecision('approve')}>通过</Button></Space>}>
      {detail && <><Descriptions bordered column={1} items={[
        { key: 'milestone', label: '1. 里程碑完成情况', children: detail.milestoneProgress }, { key: 'overall', label: '2. 总体进展', children: detail.overallProgress }, { key: 'demo', label: '3. 示范工程进展', children: detail.demonstrationProgress }, { key: 'fund', label: '4. 经费使用', children: detail.fundUsage }, { key: 'next', label: '5. 下期工作', children: detail.nextPlan }, { key: 'problem', label: '6. 问题及措施', children: detail.problemsAndMeasures },
      ]} /><Card title="审批记录" size="small" style={{ marginTop: 16 }}><ApprovalTimeline records={state.approvalRecords.filter((item) => item.businessId === detail.id)} users={state.users} /></Card></>}
    </Drawer>
    <Modal title={decision === 'approve' ? '确认审批通过' : '退回修改'} open={Boolean(decision)} onCancel={() => setDecision(null)} onOk={confirm}><Input.TextArea rows={4} value={opinion} onChange={(event) => setOpinion(event.target.value)} placeholder={decision === 'return' ? '请填写退回原因' : '可填写审批意见'} /></Modal>
  </>;
}
