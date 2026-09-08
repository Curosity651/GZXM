import { useMemo, useState } from 'react';
import { Alert, Button, Card, Descriptions, Drawer, Input, Modal, Space, Table, Tag, message } from 'antd';
import { CheckOutlined, EyeOutlined, RollbackOutlined } from '@ant-design/icons';
import type { ArchiveSubmission } from '../../types';
import type { ArchiveAction } from '../../domain/archive-flow';
import { useAppStore } from '../../store';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusTag } from '../../components/common/StatusTag';
import { ApprovalTimeline } from '../../components/common/ApprovalTimeline';
import { canPerform, filterByTopicScope } from '../../domain/permissions';

export function ArchiveApprovalPage() {
  const state = useAppStore();
  const user = state.currentUser!;
  const canInitial = canPerform(user, state.roles, 'archive.initial.approve');
  const canFinal = canPerform(user, state.roles, 'archive.final.approve');
  const [detail, setDetail] = useState<ArchiveSubmission | null>(null);
  const [decision, setDecision] = useState<'approve' | 'return' | null>(null);
  const [opinion, setOpinion] = useState('');
  const items = useMemo(() => filterByTopicScope(user, state.archiveSubmissions).filter((item) => (canInitial && item.status === '初审中') || (canFinal && item.status === '终审中')), [canFinal, canInitial, state.archiveSubmissions, user]);
  const action: ArchiveAction | null = detail ? detail.status === '初审中' && canInitial ? 'APPROVE_INITIAL' : detail.status === '终审中' && canFinal ? 'APPROVE_FINAL' : null : null;
  const requirement = detail ? state.archiveRequirements.find((item) => item.id === detail.requirementId) : undefined;
  const confirm = () => {
    if (!detail || !action) return;
    if (decision === 'return' && !opinion.trim()) return message.warning('退回时必须填写审批意见');
    state.reviewArchive(detail.id, decision === 'approve' ? action : 'RETURN', state.currentUser!.id, opinion || '同意归档');
    message.success(decision === 'approve' ? '归档审批已通过' : '已退回修改'); setDecision(null); setDetail(null); setOpinion('');
  };
  const ownerLabel = (item: ArchiveSubmission) => item.ownerType === 'PROJECT_PUBLIC' ? state.project.name : item.ownerType === 'TOPIC_NATIONAL' ? state.topics.find((topic) => topic.id === item.ownerId)?.name : state.selfFundedProjects.find((project) => project.id === item.ownerId)?.name;
  return <>
    <PageHeader title="归档审批" description="课题材料和自筹项目材料执行两级审批；项目公共材料由科研助理提交后直接终审。" />
    {!canInitial && !canFinal && <Alert type="info" showIcon message="当前角色可查看审批记录，但没有审批操作权限。" style={{ marginBottom: 16 }} />}
    <Card><Table rowKey="id" dataSource={items} columns={[
      { title: '材料名称', render: (_, row) => state.archiveRequirements.find((item) => item.id === row.requirementId)?.name ?? row.requirementId },
      { title: '归档对象', render: (_, row) => ownerLabel(row) }, { title: '归档类型', dataIndex: 'ownerType', width: 120, render: (value) => <Tag>{value === 'PROJECT_PUBLIC' ? '项目公共' : value === 'TOPIC_NATIONAL' ? '课题国家' : '配套自筹'}</Tag> },
      { title: '状态', dataIndex: 'status', width: 110, render: (value) => <StatusTag status={value} /> }, { title: '操作', width: 110, render: (_, row) => <Button type="link" icon={<EyeOutlined />} onClick={() => setDetail(row)}>查看审批</Button> },
    ]} /></Card>
    <Drawer width={700} title="归档材料审批" open={Boolean(detail)} onClose={() => setDetail(null)} extra={action && <Space><Button danger icon={<RollbackOutlined />} onClick={() => setDecision('return')}>退回</Button><Button type="primary" icon={<CheckOutlined />} onClick={() => setDecision('approve')}>通过</Button></Space>}>
      {detail && <><Descriptions bordered column={1} items={[{ key: 'name', label: '材料名称', children: requirement?.name }, { key: 'owner', label: '归档对象', children: ownerLabel(detail) }, { key: 'kind', label: '归档要求', children: requirement?.requirementKind === 'REQUIRED' ? '必存' : '有则必存' }, { key: 'app', label: '适用性', children: detail.applicability }, { key: 'files', label: 'Mock 文件', children: `${detail.fileIds.length} 个` }, { key: 'status', label: '状态', children: <StatusTag status={detail.status} /> }]} /><Card title="审批记录" size="small" style={{ marginTop: 16 }}><ApprovalTimeline records={state.approvalRecords.filter((item) => item.businessId === detail.id)} users={state.users} /></Card></>}
    </Drawer>
    <Modal title={decision === 'approve' ? '确认审批通过' : '退回修改'} open={Boolean(decision)} onCancel={() => setDecision(null)} onOk={confirm}><Input.TextArea rows={4} value={opinion} onChange={(event) => setOpinion(event.target.value)} placeholder={decision === 'return' ? '请填写退回原因' : '可填写审批意见'} /></Modal>
  </>;
}
