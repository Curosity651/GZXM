import { Button, Input, Progress, Select, Space, Table, Tag, Upload, message } from 'antd';
import { SendOutlined, UploadOutlined } from '@ant-design/icons';
import type { ArchiveOwnerType } from '../../domain/archive-flow';
import type { ArchiveRequirement, ArchiveSubmission } from '../../types';
import { useAppStore } from '../../store';
import { archiveCompletion } from '../../domain/archive';
import { validateApplicability } from '../../domain/archive-flow';
import { StatusTag } from '../common/StatusTag';

export function RequirementChecklist({ requirements, ownerType, ownerId, topicId, unitId, editable }: {
  requirements: ArchiveRequirement[];
  ownerType: ArchiveOwnerType;
  ownerId: string;
  topicId?: string;
  unitId?: string;
  editable: boolean;
}) {
  const state = useAppStore();
  const submissions = state.archiveSubmissions.filter((item) => item.ownerType === ownerType && item.ownerId === ownerId);
  const completion = archiveCompletion(requirements, submissions);
  const getSubmission = (requirementId: string) => submissions.find((item) => item.requirementId === requirementId);
  const save = (requirement: ArchiveRequirement, patch: Partial<ArchiveSubmission>) => {
    const current = getSubmission(requirement.id);
    state.saveArchiveSubmission({
      id: current?.id ?? `archive-${Date.now()}-${ownerId.replace(/[^a-zA-Z0-9-]/g, '-')}-${requirement.id}`, requirementId: requirement.id, ownerType, ownerId, topicId, unitId,
      applicability: requirement.requirementKind === 'REQUIRED' ? 'APPLICABLE' : current?.applicability ?? 'PENDING',
      status: current?.status === '退回修改' ? '退回修改' : current?.status ?? '草稿', fileIds: current?.fileIds ?? [],
      version: current?.version ?? 1, submittedAt: current?.submittedAt, updatedAt: new Date().toISOString().slice(0, 10),
      ...patch,
    }, state.currentUser!.id);
  };
  const submit = (requirement: ArchiveRequirement) => {
    const current = getSubmission(requirement.id);
    if (!current) return message.warning('请先上传材料或确认适用性');
    if (!validateApplicability(current.applicability, current.nonApplicableReason)) return message.warning('选择不适用时必须填写理由');
    if (current.applicability !== 'NOT_APPLICABLE' && !current.fileIds.length) return message.warning('请先上传材料');
    state.submitArchive(current.id, state.currentUser!.id); message.success('材料已归档');
  };
  return <>
    <Space style={{ marginBottom: 16 }}><b>归档进度</b><Progress percent={completion.rate} style={{ width: 240 }} /><span>{completion.completed}/{completion.required} 项已归档</span></Space>
    <Table rowKey="id" pagination={false} dataSource={requirements} columns={[
      { title: '编号', dataIndex: 'sourceCode', width: 90, render: (value) => value ? <Tag>{value}</Tag> : '—' },
      { title: '材料名称', dataIndex: 'name', render: (value, row) => <div><b>{value}</b><div><Tag color={row.requirementKind === 'REQUIRED' ? 'red' : 'gold'}>{row.requirementKind === 'REQUIRED' ? '必存' : '有则必存'}</Tag>{row.sourceRow && <span style={{ color: '#8c8c8c' }}>国家清单第 {row.sourceRow} 行</span>}</div></div> },
      { title: '适用性', width: 230, render: (_, row) => {
        const current = getSubmission(row.id); const applicability = row.requirementKind === 'REQUIRED' ? 'APPLICABLE' : current?.applicability ?? 'PENDING';
        return <Space direction="vertical" size={4}><Select disabled={!editable || row.requirementKind === 'REQUIRED' || current?.status === '已归档'} value={applicability} style={{ width: 130 }} onChange={(value) => save(row, { applicability: value })} options={[{ label: '待确认', value: 'PENDING' }, { label: '适用', value: 'APPLICABLE' }, { label: '不适用', value: 'NOT_APPLICABLE' }]} />{applicability === 'NOT_APPLICABLE' && <Input disabled={!editable || current?.status === '已归档'} value={current?.nonApplicableReason} placeholder="不适用理由" onChange={(event) => save(row, { applicability, nonApplicableReason: event.target.value })} />}</Space>;
      } },
      { title: '材料', width: 180, render: (_, row) => { const current = getSubmission(row.id); return <Space direction="vertical"><span>{current?.fileIds.length ? `${current.fileIds.length} 个 Mock 文件` : '尚未上传'}</span>{editable && current?.status !== '已归档' && <Upload showUploadList={false} beforeUpload={(file) => { save(row, { fileIds: [...(current?.fileIds ?? []), `mock-${file.uid}`], applicability: current?.applicability === 'NOT_APPLICABLE' ? 'NOT_APPLICABLE' : 'APPLICABLE' }); message.success(`已记录文件：${file.name}`); return false; }}><Button size="small" icon={<UploadOutlined />}>选择文件</Button></Upload>}</Space>; } },
      { title: '状态', width: 110, render: (_, row) => <StatusTag status={getSubmission(row.id)?.status ?? '未提交'} /> },
      { title: '操作', width: 100, render: (_, row) => { const current = getSubmission(row.id); return editable && current?.status !== '已归档' ? <Button type="link" icon={<SendOutlined />} onClick={() => submit(row)}>归档</Button> : '—'; } },
    ]} />
  </>;
}
