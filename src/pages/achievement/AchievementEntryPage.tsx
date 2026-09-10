import { useMemo, useState } from 'react';
import { Button, Card, Col, Drawer, Form, Input, Modal, Progress, Row, Select, Space, Statistic, Table, Typography, Upload, message } from 'antd';
import { CheckOutlined, DownOutlined, EditOutlined, EyeOutlined, FileAddOutlined, PaperClipOutlined, RollbackOutlined, SearchOutlined, SendOutlined, UpOutlined, UploadOutlined } from '@ant-design/icons';
import type { Achievement } from '../../types';
import { useAppStore } from '../../store';
import { aggregateAchievementProgress, hasReachedAchievementStage, initialAchievementStatus, isEditableAchievementStatus, reviewActionFor } from '../../domain/achievement';
import { canPerform } from '../../domain/permissions';
import { accessibleTopics, canViewAchievement, membershipForUser } from '../../domain/topic-access';
import { StatusTag } from '../../components/common/StatusTag';
import { AchievementForm } from '../../components/achievement/AchievementForm';
import { AchievementDetail } from '../../components/achievement/AchievementDetail';

const { Text } = Typography;
type FormValues = Partial<Achievement>;

export function AchievementEntryPage() {
  const state = useAppStore();
  const user = state.currentUser!;
  const topics = accessibleTopics(user, state.topics, state.topicMemberships);
  const canSubmit = canPerform(user, state.roles, 'achievement.submit');
  const canReview = canPerform(user, state.roles, 'achievement.initial.approve') || canPerform(user, state.roles, 'achievement.final.approve');
  const [form] = Form.useForm<FormValues>();
  const [externalForm] = Form.useForm<{ date: string; number: string }>();
  const [supplementForm] = Form.useForm<{ materialType: string; name: string; materialDate?: string; remarks?: string }>();
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<Achievement | null>(null);
  const [external, setExternal] = useState<Achievement | null>(null);
  const [supplementFor, setSupplementFor] = useState<Achievement | null>(null);
  const [supplementFile, setSupplementFile] = useState('');
  const [workScope, setWorkScope] = useState<'all' | 'pending'>(canReview ? 'pending' : 'all');
  const [decision, setDecision] = useState<'approve' | 'return' | null>(null);
  const [opinion, setOpinion] = useState('');
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [topicId, setTopicId] = useState<string>();
  const [definitionId, setDefinitionId] = useState<string>();
  const [unitId, setUnitId] = useState<string>();
  const [status, setStatus] = useState<string>();
  const [keyword, setKeyword] = useState('');

  const visible = useMemo(
    () => state.achievements.filter((item) => canViewAchievement(user, item, state.topicMemberships)),
    [state.achievements, state.topicMemberships, user],
  );
  const visibleAllocations = state.unitIndicatorAllocations.filter((item) => item.status === '已下发'
    && topics.some((topic) => topic.id === item.topicId)
    && canViewAchievement(user, { topicId: item.topicId, unitId: item.unitId, uploadUnitId: item.unitId } as Achievement, state.topicMemberships));
  const progressAchievements = visible.filter((item) => (!topicId || item.topicId === topicId)
    && (!definitionId || item.indicatorDefinitionId === definitionId)
    && (!unitId || (item.uploadUnitId ?? item.unitId) === unitId));
  const rows = progressAchievements.filter((item) => (!status || item.status === status)
    && (!keyword || item.title.toLowerCase().includes(keyword.toLowerCase()))
    && (workScope === 'all' || Boolean(reviewActionFor(item.status as never, user.role))));
  const progressRows = aggregateAchievementProgress(
    visibleAllocations.filter((item) => (!topicId || item.topicId === topicId)
      && (!definitionId || item.indicatorDefinitionId === definitionId)
      && (!unitId || item.unitId === unitId)),
    progressAchievements,
  );
  const totals = progressRows.reduce((sum, item) => ({
    target: sum.target + item.target,
    initiated: sum.initiated + item.initiated,
    preApproved: sum.preApproved + item.preApproved,
    external: sum.external + item.external,
    formal: sum.formal + item.formal,
    effective: sum.effective + item.effective,
  }), { target: 0, initiated: 0, preApproved: 0, external: 0, formal: 0, effective: 0 });
  const completionRate = totals.target > 0 ? Math.round(totals.effective / totals.target * 100) : 0;
  const unitOptions = state.units.filter((unit) => visibleAllocations.some((item) => item.unitId === unit.id)
    || visible.some((item) => (item.uploadUnitId ?? item.unitId) === unit.id));
  const isOwner = (item: Achievement) => canSubmit && (item.uploadUnitId ?? item.unitId) === user.unitId;

  const openCreate = () => {
    if (!canSubmit || !user.unitId) return;
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ unitId: user.unitId, uploadUnitId: user.unitId, responsiblePerson: user.name, progressStatus: '拟投稿/申请', projectLabeling: `${state.project.name}（${state.project.code}）` });
    setFormOpen(true);
  };
  const openEdit = (item: Achievement) => {
    const fallbackDefinition = state.indicatorDefinitions.find((definition) => definition.achievementType === item.achievementType);
    setEditing(item);
    form.setFieldsValue({ ...item, indicatorDefinitionId: item.indicatorDefinitionId ?? fallbackDefinition?.id });
    setFormOpen(true);
  };
  const save = async () => {
    const values = await form.validateFields();
    if (editing) state.updateAchievement(editing.id, { ...values, uploadUnitId: editing.uploadUnitId ?? editing.unitId });
    else {
      const allocation = state.unitIndicatorAllocations.find((item) => item.status === '已下发' && item.topicId === values.topicId && item.unitId === user.unitId && item.indicatorDefinitionId === values.indicatorDefinitionId);
      if (!allocation || !user.unitId) return message.warning('当前单位尚未获得该课题下此项成果指标');
      const membership = membershipForUser(user, values.topicId!, state.topicMemberships);
      const at = new Date().toISOString();
      state.addAchievement({ id: `achievement-${Date.now()}`, projectId: state.project.id, topicId: values.topicId!, unitId: user.unitId, uploadUnitId: user.unitId, topicUnitMembershipId: membership?.id, unitIndicatorAllocationId: allocation.id, indicatorDefinitionId: allocation.indicatorDefinitionId, achievementType: allocation.achievementType, indicatorId: allocation.id, nodeId: allocation.nodeId, title: values.title!, responsiblePerson: values.responsiblePerson!, progressStatus: values.progressStatus ?? '拟投稿/申请', status: initialAchievementStatus(allocation.achievementType), countsToIndicator: false, createdAt: at, updatedAt: at, remarks: values.remarks ?? '', materials: [], recordVersion: 1, history: [], ...values });
    }
    message.success('成果草稿已保存');
    setFormOpen(false);
  };
  const submit = (item: Achievement) => {
    const action = ['正式成果草稿', '正式退回'].includes(item.status) ? 'SUBMIT_FORMAL' : 'SUBMIT_PRE_REVIEW';
    try { state.advanceAchievement(item.id, action, user.id); message.success('已提交审批'); }
    catch (error) { message.error((error as Error).message); }
  };
  const startFormal = (item: Achievement) => { state.advanceAchievement(item.id, 'START_FORMAL', user.id); openEdit({ ...item, status: '正式成果草稿' }); };
  const registerExternal = async () => {
    if (!external) return;
    const values = await externalForm.validateFields();
    state.updateAchievement(external.id, { externalSubmissionDate: values.date, externalSubmissionNumber: values.number, submissionDate: values.date, applicationDate: values.date, progressStatus: external.achievementType === '学术论文' ? '已投稿' : '已申请' });
    state.advanceAchievement(external.id, 'REGISTER_EXTERNAL_SUBMISSION', user.id);
    setExternal(null);
    message.success('投稿/申请信息已登记');
  };
  const saveSupplement = async () => {
    if (!supplementFor) return;
    const values = await supplementForm.validateFields();
    if (!supplementFile) return message.warning('请选择附件文件');
    const at = new Date().toISOString();
    state.updateAchievement(supplementFor.id, { materials: [...supplementFor.materials, { id: `material-${Date.now()}`, achievementId: supplementFor.id, materialType: values.materialType, name: values.name, fileId: `file-${Date.now()}`, fileName: supplementFile, fileUrl: '#', version: supplementFor.materials.length + 1, status: '未提交', materialDate: values.materialDate, remarks: values.remarks, uploader: user.name, uploadedAt: at }] });
    message.success('附件材料已补充');
    setSupplementFor(null);
    setSupplementFile('');
    supplementForm.resetFields();
  };
  const confirmDecision = () => {
    if (!detail || !decision) return;
    const action = reviewActionFor(detail.status as never, user.role);
    if (!action) return message.warning('当前成果不在您的审批环节');
    if (decision === 'return' && !opinion.trim()) return message.warning('退回时必须填写审批意见');
    state.reviewAchievement(detail.id, decision === 'approve' ? action : 'RETURN', user.id, opinion || '同意');
    message.success(decision === 'approve' ? '审批已通过' : '已退回修改');
    setDecision(null);
    setDetail(null);
    setOpinion('');
  };

  return <>
    <Card className="achievement-filter-card" style={{ marginBottom: 16 }}>
      <div className={`achievement-filter-grid${filterExpanded ? ' is-expanded' : ''}`}>
        {canReview && <Space className="achievement-filter-field" size={8}><Text>处理范围</Text><Select value={workScope} onChange={setWorkScope} options={[{ label: '待我处理', value: 'pending' }, { label: '全部成果', value: 'all' }]} /></Space>}
        <Space className="achievement-filter-field" size={8}><Text>所属课题</Text><Select allowClear placeholder="全部相关课题" value={topicId} onChange={setTopicId} options={topics.map((item) => ({ label: `${item.code} ${item.name}`, value: item.id }))} /></Space>
        <Space className="achievement-filter-field" size={8}><Text>成果状态</Text><Select allowClear placeholder="全部状态" value={status} onChange={setStatus} options={[...new Set(visible.map((item) => item.status))].map((item) => ({ label: item === '已生效' ? '已完成' : item, value: item }))} /></Space>
        {filterExpanded && <>
          <Space className="achievement-filter-field" size={8}><Text>成果类型</Text><Select allowClear placeholder="全部类型" value={definitionId} onChange={setDefinitionId} options={state.indicatorDefinitions.filter((definition) => visibleAllocations.some((item) => item.indicatorDefinitionId === definition.id)).map((item) => ({ label: item.name, value: item.id }))} /></Space>
          <Space className="achievement-filter-field" size={8}><Text>提交单位</Text><Select allowClear placeholder="全部单位" value={unitId} onChange={setUnitId} options={unitOptions.map((item) => ({ label: item.name, value: item.id }))} /></Space>
          <Space className="achievement-filter-field" size={8}><Text>成果名称</Text><Input allowClear placeholder="请输入成果名称" value={keyword} onChange={(event) => setKeyword(event.target.value)} /></Space>
        </>}
        <Space className="achievement-filter-actions" size={10}>
          <Button type="primary" icon={<SearchOutlined />}>查询</Button>
          <Button onClick={() => { setWorkScope(canReview ? 'pending' : 'all'); setTopicId(undefined); setDefinitionId(undefined); setUnitId(undefined); setStatus(undefined); setKeyword(''); }}>重置</Button>
          <Button type="link" icon={filterExpanded ? <UpOutlined /> : <DownOutlined />} onClick={() => setFilterExpanded(!filterExpanded)}>{filterExpanded ? '收起' : '展开'}</Button>
        </Space>
      </div>
    </Card>

    <Card title="成果进度" style={{ marginBottom: 16 }}><Row gutter={[12, 12]}>
      {[
        ['分配指标', totals.target], ['已发起', totals.initiated], ['预审通过', totals.preApproved],
        ['已投稿/申请', totals.external], ['正式成果', totals.formal], ['已完成', totals.effective],
      ].map(([label, value]) => <Col flex="1 1 140px" key={String(label)}><Statistic title={label} value={value} /></Col>)}
      <Col flex="1 1 220px"><Text type="secondary">完成率</Text><Progress percent={Math.min(completionRate, 100)} status={completionRate >= 100 ? 'success' : 'active'} format={() => `${completionRate}%`} /></Col>
    </Row></Card>

    <Card title={`成果列表（${rows.length}）`} extra={canSubmit && <Button type="primary" icon={<FileAddOutlined />} onClick={openCreate}>新建成果</Button>}>
      <Table rowKey="id" dataSource={rows} scroll={{ x: 1180 }} columns={[
        { title: '成果名称', dataIndex: 'title', width: 250, fixed: 'left', render: (value, row) => <Space direction="vertical" size={0}><Text strong>{value}</Text><Text type="secondary">{state.indicatorDefinitions.find((item) => item.id === row.indicatorDefinitionId)?.name ?? row.achievementType}</Text></Space> },
        { title: '所属课题', dataIndex: 'topicId', width: 210, render: (value) => state.topics.find((item) => item.id === value)?.name ?? value },
        { title: '提交单位', width: 180, render: (_, row) => state.units.find((item) => item.id === (row.uploadUnitId ?? row.unitId))?.name ?? '—' },
        { title: '负责人', dataIndex: 'responsiblePerson', width: 110 },
        { title: '当前阶段', dataIndex: 'status', width: 150, render: (value) => <StatusTag status={value === '已生效' ? '已完成' : value} /> },
        { title: '附件', width: 80, render: (_, row) => `${row.materials.length} 个` },
        { title: '更新时间', dataIndex: 'updatedAt', width: 110, render: (value) => value?.slice(0, 10) },
        { title: '操作', fixed: 'right', width: 340, render: (_, row) => <Space wrap>
          <Button type="link" icon={<EyeOutlined />} onClick={() => setDetail(row)}>详情</Button>
          {reviewActionFor(row.status as never, user.role) && <Button type="link" onClick={() => setDetail(row)}>审批</Button>}
          {isOwner(row) && isEditableAchievementStatus(row.status) && !['允许投稿/申请', '已投稿/已申请'].includes(row.status) && <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(row)}>编辑</Button>}
          {isOwner(row) && ['预审草稿', '预审退回', '正式成果草稿', '正式退回'].includes(row.status) && <Button type="link" icon={<SendOutlined />} onClick={() => submit(row)}>提交审批</Button>}
          {isOwner(row) && ['预审通过', '允许投稿/申请'].includes(row.status) && <Button size="small" type="primary" onClick={() => { setExternal(row); externalForm.resetFields(); }}>登记投稿/申请</Button>}
          {isOwner(row) && row.status === '已投稿/已申请' && <Button size="small" type="primary" onClick={() => startFormal(row)}>提交正式成果</Button>}
          {isOwner(row) && hasReachedAchievementStage(row.status, 'effective') && <Button type="link" icon={<PaperClipOutlined />} onClick={() => { setSupplementFor(row); supplementForm.resetFields(); setSupplementFile(''); }}>补充附件</Button>}
        </Space> },
      ]} />
    </Card>

    <Drawer width={980} title={editing ? '编辑成果' : '新建成果'} open={formOpen} onClose={() => setFormOpen(false)} extra={<Space><Button onClick={() => setFormOpen(false)}>取消</Button><Button type="primary" onClick={save}>保存草稿</Button></Space>}><Form form={form} layout="vertical"><AchievementForm form={form} topics={topics} units={state.units} achievement={editing ?? undefined} lockOwnership={Boolean(editing)} definitions={state.indicatorDefinitions} /><Card size="small" title={editing?.status.startsWith('正式') ? '正式证明材料' : '预审参考附件（选填）'}><Upload beforeUpload={() => false} multiple><Button icon={<UploadOutlined />}>选择文件（Mock）</Button></Upload></Card></Form></Drawer>
    <Drawer width={860} title="成果详情" open={Boolean(detail)} onClose={() => setDetail(null)} extra={detail && reviewActionFor(detail.status as never, user.role) && <Space><Button danger icon={<RollbackOutlined />} onClick={() => setDecision('return')}>退回修改</Button><Button type="primary" icon={<CheckOutlined />} onClick={() => setDecision('approve')}>审批通过</Button></Space>}>{detail && <AchievementDetail achievement={detail} topics={state.topics} units={state.units} records={state.approvalRecords.filter((item) => item.businessId === detail.id)} users={state.users} />}</Drawer>
    <Modal title={external?.achievementType === '学术论文' ? '登记实际投稿' : '登记实际申请'} open={Boolean(external)} onCancel={() => setExternal(null)} onOk={registerExternal}><Form form={externalForm} layout="vertical"><Form.Item label="实际投稿/申请日期" name="date" rules={[{ required: true }]}><Input type="date" /></Form.Item><Form.Item label="投稿/申请编号" name="number" rules={[{ required: true }]}><Input /></Form.Item></Form></Modal>
    <Modal title="补充附件材料" open={Boolean(supplementFor)} onCancel={() => setSupplementFor(null)} onOk={saveSupplement} okText="确认提交"><Form form={supplementForm} layout="vertical"><Form.Item label="材料类型" name="materialType" rules={[{ required: true }]}><Select options={['专利授权证明', '论文录用通知', '论文见刊页', '检索证明', '软件著作权证书', '标准发布文件', '其他'].map((value) => ({ label: value, value }))} /></Form.Item><Form.Item label="材料名称" name="name" rules={[{ required: true }]}><Input /></Form.Item><Form.Item label="材料日期" name="materialDate"><Input type="date" /></Form.Item><Form.Item label="附件文件" required><Upload maxCount={1} beforeUpload={(file) => { setSupplementFile(file.name); return false; }} onRemove={() => { setSupplementFile(''); return true; }}><Button icon={<UploadOutlined />}>选择文件</Button></Upload></Form.Item><Form.Item label="备注" name="remarks"><Input.TextArea rows={3} /></Form.Item></Form></Modal>
    <Modal title={decision === 'approve' ? '确认审批通过' : '退回修改'} open={Boolean(decision)} onCancel={() => { setDecision(null); setOpinion(''); }} onOk={confirmDecision} okText="确认"><Input.TextArea rows={4} value={opinion} onChange={(event) => setOpinion(event.target.value)} placeholder={decision === 'return' ? '请填写明确的退回原因' : '审批意见（选填）'} /></Modal>
  </>;
}
