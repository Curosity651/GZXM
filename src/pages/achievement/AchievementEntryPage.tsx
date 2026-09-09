import { useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Descriptions, Drawer, Form, Input, Modal, Progress, Row, Space, Statistic, Table, Tag, Tree, Typography, Upload, message } from 'antd';
import { EditOutlined, EyeOutlined, FileAddOutlined, SendOutlined, UploadOutlined } from '@ant-design/icons';
import type { Achievement, AchievementType } from '../../types';
import { useAppStore } from '../../store';
import { initialAchievementStatus, isEditableAchievementStatus } from '../../domain/achievement';
import { canPerform } from '../../domain/permissions';
import { accessibleTopics, canViewAchievement, isTopicLead, membershipForUser } from '../../domain/topic-access';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusTag } from '../../components/common/StatusTag';
import { AchievementForm } from '../../components/achievement/AchievementForm';

const { Text } = Typography;
type FormValues = Partial<Achievement>;

export function AchievementEntryPage() {
  const state = useAppStore(); const user = state.currentUser!;
  const topics = accessibleTopics(user, state.topics, state.topicMemberships);
  const types = state.indicatorDefinitions.filter((item) => item.enabled);
  const firstKey = topics[0] && types[0] ? `${topics[0].id}|${types[0].id}` : '';
  const [selectedKey, setSelectedKey] = useState(firstKey);
  const [form] = Form.useForm<FormValues>();
  const [open, setOpen] = useState(false); const [editing, setEditing] = useState<Achievement | null>(null);
  const [detail, setDetail] = useState<Achievement | null>(null); const [external, setExternal] = useState<Achievement | null>(null);
  const [externalForm] = Form.useForm<{ date: string; number: string }>();
  const [topicId, definitionId] = selectedKey.split('|');
  const selectedDefinition = types.find((item) => item.id === definitionId);
  const achievementType = selectedDefinition?.achievementType as AchievementType;
  const canSubmit = canPerform(user, state.roles, 'achievement.submit');
  const allVisible = useMemo(() => state.achievements.filter((item) => canViewAchievement(user, item, state.topicMemberships)), [state.achievements, state.topicMemberships, user]);
  const rows = allVisible.filter((item) => (!topicId || item.topicId === topicId) && (!selectedDefinition || (item.indicatorDefinitionId ? item.indicatorDefinitionId === selectedDefinition.id : item.achievementType === selectedDefinition.achievementType)));
  const ownMembership = membershipForUser(user, topicId, state.topicMemberships);
  const canCreateHere = canSubmit && Boolean(ownMembership && user.unitId);
  const seesAllUnits = ['系统管理员', '项目技术负责人', '科研助理'].includes(user.role) || isTopicLead(user, topicId, state.topicMemberships);
  const scopedAllocations = state.unitIndicatorAllocations.filter((item) => item.topicId === topicId && item.indicatorDefinitionId === definitionId && item.status === '已下发' && (seesAllUnits || item.unitId === user.unitId));
  const target = scopedAllocations.reduce((sum, item) => sum + item.targetQuantity, 0) || state.topicIndicators.filter((item) => item.topicId === topicId && item.indicatorDefinitionId === definitionId && item.status === '已下发').reduce((sum, item) => sum + item.targetQuantity, 0);
  const effective = rows.filter((item) => item.status === '已生效').length;

  const treeData = [{ key: 'project', title: state.project.name, selectable: false, children: topics.map((topic) => ({ key: topic.id, title: `${topic.code} ${topic.name}`, selectable: false, children: types.map((definition) => ({ key: `${topic.id}|${definition.id}`, title: definition.name })) })) }];
  const openCreate = () => {
    if (!canCreateHere) return message.warning('当前账号不是该课题的成员单位');
    const allocation = scopedAllocations.find((item) => item.unitId === user.unitId && item.targetQuantity > 0);
    if (!allocation) return message.warning('该课题尚未向本单位下发此类成果指标');
    setEditing(null); form.resetFields(); form.setFieldsValue({ topicId, unitId: user.unitId, uploadUnitId: user.unitId, achievementType, unitIndicatorAllocationId: allocation.id, indicatorId: allocation.id, nodeId: allocation.nodeId, responsiblePerson: user.name, progressStatus: '拟投稿/申请', projectLabeling: `${state.project.name}（${state.project.code}）` }); setOpen(true);
  };
  const openEdit = (item: Achievement) => { setEditing(item); form.setFieldsValue(item); setOpen(true); };
  const save = async () => {
    const values = await form.validateFields(); const at = new Date().toISOString();
    if (editing) state.updateAchievement(editing.id, { ...values, uploadUnitId: editing.uploadUnitId ?? editing.unitId });
    else state.addAchievement({ id: `achievement-${Date.now()}`, projectId: state.project.id, topicId, unitId: user.unitId!, uploadUnitId: user.unitId!, topicUnitMembershipId: ownMembership!.id, unitIndicatorAllocationId: values.unitIndicatorAllocationId, indicatorDefinitionId: definitionId, achievementType, indicatorId: values.indicatorId!, nodeId: values.nodeId!, title: values.title!, responsiblePerson: values.responsiblePerson!, progressStatus: values.progressStatus ?? '拟投稿/申请', plannedCompletionDate: values.plannedCompletionDate, status: initialAchievementStatus(achievementType), countsToIndicator: false, createdAt: at, updatedAt: at, remarks: values.remarks ?? '', materials: [], recordVersion: 1, history: [], ...values });
    message.success('成果草稿已保存'); setOpen(false);
  };
  const submit = (item: Achievement) => {
    const action = ['正式成果草稿', '正式退回'].includes(item.status) ? 'SUBMIT_FORMAL' : 'SUBMIT_PRE_REVIEW';
    try { state.advanceAchievement(item.id, action, user.id); message.success('已提交审批'); } catch (error) { message.error((error as Error).message); }
  };
  const startFormal = (item: Achievement) => { state.advanceAchievement(item.id, 'START_FORMAL', user.id); const next = { ...item, status: '正式成果草稿' as const }; openEdit(next); };
  const registerExternal = async () => {
    if (!external) return; const values = await externalForm.validateFields();
    state.updateAchievement(external.id, { externalSubmissionDate: values.date, externalSubmissionNumber: values.number, submissionDate: values.date, applicationDate: values.date, progressStatus: external.achievementType === '学术论文' ? '已投稿' : '已申请' });
    state.advanceAchievement(external.id, 'REGISTER_EXTERNAL_SUBMISSION', user.id); setExternal(null); message.success('实际投稿/申请信息已登记');
  };
  const canEditRow = (item: Achievement) => canSubmit && (item.uploadUnitId ?? item.unitId) === user.unitId;

  return <>
    <PageHeader title="成果管理" description="每项成果使用一条记录贯穿投稿/申请前预审、实际投递、正式材料补充和最终生效。" extra={canCreateHere ? <Button type="primary" icon={<FileAddOutlined />} onClick={openCreate}>新增{achievementType}</Button> : undefined} />
    <Alert type="warning" showIcon title="投稿或申请前必须先通过预审；成果名称、人员排序、署名单位及项目标注是预审核心信息。" style={{ marginBottom: 16 }} />
    <Row gutter={16}><Col flex="280px"><Card size="small" title="项目成果树"><Tree defaultExpandAll selectedKeys={selectedKey ? [selectedKey] : []} treeData={treeData} onSelect={(keys) => keys[0] && setSelectedKey(String(keys[0]))} /></Card></Col><Col flex="auto"><Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Row gutter={12}><Col span={5}><Card><Statistic title="分配目标" value={target} /></Card></Col><Col span={5}><Card><Statistic title="预审/投递中" value={rows.filter((item) => item.status.includes('预审') || item.status.includes('投稿') || item.status.includes('申请')).length} /></Card></Col><Col span={5}><Card><Statistic title="正式审批中" value={rows.filter((item) => item.status.startsWith('正式')).length} /></Card></Col><Col span={5}><Card><Statistic title="已生效" value={effective} /></Card></Col><Col span={4}><Card><Text type="secondary">完成率</Text><Progress percent={target ? Math.min(100, Math.round(effective / target * 100)) : 0} size="small" /></Card></Col></Row>
      <Card title={<Space><Tag color="blue">{state.topics.find((item) => item.id === topicId)?.code}</Tag>{achievementType || '请选择成果类型'}</Space>}><Table rowKey="id" dataSource={rows} columns={[
        { title: '成果名称', dataIndex: 'title', render: (value, row) => <Space direction="vertical" size={0}><b>{value}</b><Text type="secondary">{state.units.find((item) => item.id === (row.uploadUnitId ?? row.unitId))?.name}</Text></Space> }, { title: '负责人', dataIndex: 'responsiblePerson', width: 110 }, { title: '当前阶段', dataIndex: 'status', width: 150, render: (value) => <StatusTag status={value} /> }, { title: '更新时间', dataIndex: 'updatedAt', width: 120, render: (value) => value?.slice(0, 10) },
        { title: '操作', width: 300, render: (_, row) => <Space wrap><Button type="link" icon={<EyeOutlined />} onClick={() => setDetail(row)}>详情</Button>{canEditRow(row) && isEditableAchievementStatus(row.status) && !['允许投稿/申请', '已投稿/已申请'].includes(row.status) && <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(row)}>编辑</Button>}{canEditRow(row) && ['预审草稿', '预审退回', '正式成果草稿', '正式退回'].includes(row.status) && <Button type="link" icon={<SendOutlined />} onClick={() => submit(row)}>提交审批</Button>}{canEditRow(row) && ['预审通过', '允许投稿/申请'].includes(row.status) && <Button type="primary" size="small" onClick={() => { setExternal(row); externalForm.resetFields(); }}>登记投稿/申请</Button>}{canEditRow(row) && row.status === '已投稿/已申请' && <Button type="primary" size="small" onClick={() => startFormal(row)}>补充正式材料</Button>}</Space> },
      ]} /></Card>
    </Space></Col></Row>
    <Drawer size={820} title={editing ? '编辑成果记录' : `新增${achievementType}`} open={open} onClose={() => setOpen(false)} extra={<Space><Button onClick={() => setOpen(false)}>取消</Button><Button type="primary" onClick={save}>保存草稿</Button></Space>}><Form form={form} layout="vertical"><AchievementForm form={form} topics={topics} units={state.units} achievement={editing ?? undefined} lockOwnership /><Card size="small" title={editing?.status.startsWith('正式') ? '正式证明材料' : '预审材料'}><Upload beforeUpload={() => false} multiple><Button icon={<UploadOutlined />}>选择文件（Mock）</Button></Upload></Card></Form></Drawer>
    <Drawer width={760} title="成果全周期详情" open={Boolean(detail)} onClose={() => setDetail(null)}>{detail && <><Descriptions bordered column={2} items={[{ key: 'title', label: '成果名称', children: detail.title, span: 2 }, { key: 'status', label: '当前阶段', children: <StatusTag status={detail.status} /> }, { key: 'unit', label: '上传单位', children: state.units.find((item) => item.id === (detail.uploadUnitId ?? detail.unitId))?.name }, { key: 'person', label: '负责人', children: detail.responsiblePerson }, { key: 'number', label: '投稿/申请号', children: detail.externalSubmissionNumber || detail.applicationNumber || '—' }, { key: 'opinion', label: '最近审批意见', children: detail.approvalOpinion || '—', span: 2 }]} /><Card size="small" title="操作历史" style={{ marginTop: 16 }}>{detail.history?.length ? detail.history.map((item) => <p key={item.id}>{item.operatedAt.slice(0, 16)}　{item.operatorName}　{item.action}　<Tag>{item.toStatus}</Tag></p>) : <Text type="secondary">暂无新版操作历史</Text>}</Card></>}</Drawer>
    <Modal title={external?.achievementType === '学术论文' ? '登记实际投稿' : '登记实际申请'} open={Boolean(external)} onCancel={() => setExternal(null)} onOk={registerExternal}><Form form={externalForm} layout="vertical"><Form.Item label="实际投稿/申请日期" name="date" rules={[{ required: true }]}><Input type="date" /></Form.Item><Form.Item label="投稿/申请编号" name="number" rules={[{ required: true }]}><Input /></Form.Item></Form></Modal>
  </>;
}
