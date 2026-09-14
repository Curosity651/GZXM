import { useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Descriptions, Drawer, Form, Input, Modal, Progress, Row, Select, Space, Statistic, Table, Tag, Typography, Upload, message } from 'antd';
import { CheckOutlined, DownOutlined, EditOutlined, EyeOutlined, FileAddOutlined, RollbackOutlined, SearchOutlined, SendOutlined, UpOutlined, UploadOutlined } from '@ant-design/icons';
import type { Achievement, AchievementMaterial } from '../../types';
import { useAppStore } from '../../store';
import { aggregateAchievementProgress, achievementMatchesIndicator, initialAchievementStatus, isEditableAchievementStatus, reviewActionFor } from '../../domain/achievement';
import { formalMaterialRequirements, supplementMaterialRequirements } from '../../domain/achievement-materials';
import { canPerform } from '../../domain/permissions';
import { accessibleTopics, canViewAchievement, isTopicOperational, membershipForUser } from '../../domain/topic-access';
import { StatusTag } from '../../components/common/StatusTag';
import { AchievementForm } from '../../components/achievement/AchievementForm';
import { AchievementDetail } from '../../components/achievement/AchievementDetail';

const { Text } = Typography;
type FormValues = Partial<Achievement>;
type SupplementValues = Pick<Achievement, 'publicationDate' | 'journalYearVolumePage' | 'doi' | 'grantDate' | 'patentNumber' | 'grantPublicationNumber' | 'legalStatus'>;

const isSupplementEditable = (status: string) => ['待见刊补充', '待授权补充', '补充退回'].includes(status);

export function AchievementEntryPage() {
  const state = useAppStore();
  const user = state.currentUser!;
  const topics = accessibleTopics(user, state.topics, state.topicMemberships);
  const canSubmit = canPerform(user, state.roles, 'achievement.submit');
  const reviewAccess = { canInitial: canPerform(user, state.roles, 'achievement.initial.approve'), canFinal: canPerform(user, state.roles, 'achievement.final.approve') };
  const canReview = reviewAccess.canInitial || reviewAccess.canFinal;
  const reviewAction = (item: Achievement) => isTopicOperational(state.topics.find((topic) => topic.id === item.topicId)) ? reviewActionFor(item.status as never, reviewAccess) : null;
  const [form] = Form.useForm<FormValues>();
  const [externalForm] = Form.useForm<{ date: string; number: string }>();
  const [supplementForm] = Form.useForm<SupplementValues>();
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<Achievement | null>(null);
  const [external, setExternal] = useState<Achievement | null>(null);
  const [supplementFor, setSupplementFor] = useState<Achievement | null>(null);
  const [supplementFiles, setSupplementFiles] = useState<Record<string, string>>({});
  const [formFiles, setFormFiles] = useState<Record<string, string>>({});
  const [workScope, setWorkScope] = useState<'all' | 'pending'>(canReview ? 'pending' : 'all');
  const [decision, setDecision] = useState<'approve' | 'return' | null>(null);
  const [opinion, setOpinion] = useState('');
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [topicId, setTopicId] = useState<string>();
  const [definitionId, setDefinitionId] = useState<string>();
  const [unitId, setUnitId] = useState<string>();
  const [status, setStatus] = useState<string>();
  const [keyword, setKeyword] = useState('');
  const [progressNodeId, setProgressNodeId] = useState<string | undefined>(() => [...state.nodes].sort((a, b) => b.sortOrder - a.sortOrder)[0]?.id);

  const visible = useMemo(
    () => state.achievements.filter((item) => canViewAchievement(user, item, state.topicMemberships)),
    [state.achievements, state.topicMemberships, user],
  );
  const visibleAllocations = state.unitIndicatorAllocations.filter((item) => item.status === '已下发' && item.targetQuantity > 0
    && topics.some((topic) => topic.id === item.topicId)
    && canViewAchievement(user, { topicId: item.topicId, unitId: item.unitId, uploadUnitId: item.unitId } as Achievement, state.topicMemberships));
  const selectedNode = state.nodes.find((item) => item.id === progressNodeId);
  const nodeOrder = new Map(state.nodes.map((item) => [item.id, item.sortOrder]));
  const progressAchievements = visible.filter((item) => (!topicId || item.topicId === topicId)
    && (!selectedNode || (nodeOrder.get(item.nodeId) ?? Number.MAX_SAFE_INTEGER) <= selectedNode.sortOrder)
    && (!definitionId || achievementMatchesIndicator(item, definitionId, state.indicatorDefinitions.find((definition) => definition.id === definitionId)?.achievementType ?? item.achievementType))
    && (!unitId || (item.uploadUnitId ?? item.unitId) === unitId));
  const rows = progressAchievements.filter((item) => (!status || item.status === status)
    && (!keyword || item.title.toLowerCase().includes(keyword.toLowerCase()))
    && (workScope === 'all' || Boolean(reviewAction(item))));
  const progressRows = aggregateAchievementProgress(
    visibleAllocations.filter((item) => (!progressNodeId || item.nodeId === progressNodeId)
      && (!topicId || item.topicId === topicId)
      && (!definitionId || item.indicatorDefinitionId === definitionId)
      && (!unitId || item.unitId === unitId)),
    progressAchievements,
  );
  const baseDefinitionIds = new Set(state.indicatorDefinitions.filter((item) => item.enabled && item.name === item.achievementType).map((item) => item.id));
  const totals = progressRows.filter((item) => baseDefinitionIds.has(item.indicatorDefinitionId)).reduce((sum, item) => ({
    target: sum.target + item.target,
    initiated: sum.initiated + item.initiated,
    preApproved: sum.preApproved + item.preApproved,
    external: sum.external + item.external,
    formal: sum.formal + item.formal,
    supplement: sum.supplement + item.supplement,
    effective: sum.effective + item.effective,
  }), { target: 0, initiated: 0, preApproved: 0, external: 0, formal: 0, supplement: 0, effective: 0 });
  const completionRate = totals.target > 0 ? Math.round(totals.effective / totals.target * 100) : 0;
  const unitOptions = state.units.filter((unit) => visibleAllocations.some((item) => item.unitId === unit.id)
    || visible.some((item) => (item.uploadUnitId ?? item.unitId) === unit.id));
  const ownBaseAllocations = state.unitIndicatorAllocations.filter((item) => item.status === '已下发' && item.targetQuantity > 0 && item.unitId === user.unitId && baseDefinitionIds.has(item.indicatorDefinitionId)
    && isTopicOperational(state.topics.find((topic) => topic.id === item.topicId)));
  const isOwner = (item: Achievement) => canSubmit && (item.uploadUnitId ?? item.unitId) === user.unitId && isTopicOperational(state.topics.find((topic) => topic.id === item.topicId));

  const openCreate = () => {
    if (!canSubmit || !user.unitId) return;
    if (!ownBaseAllocations.length) return message.warning('当前单位暂无已下发且需要填报的成果指标');
    setEditing(null);
    setFormFiles({});
    form.resetFields();
    form.setFieldsValue({ unitId: user.unitId, uploadUnitId: user.unitId, responsiblePerson: user.name, progressStatus: '拟投稿/申请', projectLabeling: `${state.project.name}（${state.project.code}）` });
    setFormOpen(true);
  };
  const openEdit = (item: Achievement) => {
    const allocation = state.unitIndicatorAllocations.find((row) => row.id === item.unitIndicatorAllocationId)
      ?? state.unitIndicatorAllocations.find((row) => row.topicId === item.topicId && row.unitId === (item.uploadUnitId ?? item.unitId) && row.indicatorDefinitionId === item.indicatorDefinitionId);
    setEditing(item);
    setFormFiles({});
    form.resetFields();
    form.setFieldsValue({ ...item, unitIndicatorAllocationId: allocation?.id, indicatorDefinitionId: allocation?.indicatorDefinitionId ?? item.indicatorDefinitionId });
    setFormOpen(true);
  };
  const save = async () => {
    const values = await form.validateFields();
    if (!user.unitId) return message.error('当前账号未配置所属单位');
    const formalRequirements = editing && ['正式成果草稿', '正式退回'].includes(editing.status) ? formalMaterialRequirements(editing.achievementType) : [];
    const missingFormalMaterials = formalRequirements.filter((requirement) => !formFiles[requirement.materialType]
      && !editing?.materials.some((material) => material.materialType === requirement.materialType && material.status !== '退回修改'));
    if (missingFormalMaterials.length) return message.warning(`请上传正式审批材料：${missingFormalMaterials.map((item) => item.materialType).join('、')}`);
    const at = new Date().toISOString();
    const buildMaterials = (achievementId: string, existingCount: number): AchievementMaterial[] => Object.entries(formFiles).map(([materialType, fileName], index) => ({
      id: `material-${Date.now()}-${index}`,
      achievementId,
      materialType,
      name: materialType,
      fileId: `file-${Date.now()}-${index}`,
      fileName,
      fileUrl: '#',
      version: existingCount + index + 1,
      status: '未提交',
      uploader: user.name,
      uploadedAt: at,
    }));
    if (editing) {
      state.updateAchievement(editing.id, {
        ...values,
        projectId: editing.projectId,
        topicId: editing.topicId,
        unitId: editing.unitId,
        uploadUnitId: editing.uploadUnitId ?? editing.unitId,
        unitIndicatorAllocationId: editing.unitIndicatorAllocationId ?? values.unitIndicatorAllocationId,
        indicatorDefinitionId: editing.indicatorDefinitionId ?? values.indicatorDefinitionId,
        indicatorId: editing.indicatorId,
        nodeId: editing.nodeId || values.nodeId!,
        achievementType: editing.achievementType,
        materials: [...editing.materials, ...buildMaterials(editing.id, editing.materials.length)],
      }, user.id);
    } else {
      const allocation = ownBaseAllocations.find((item) => item.id === values.unitIndicatorAllocationId && item.topicId === values.topicId);
      if (!allocation) return message.warning('当前单位尚未获得该课题下此项成果指标');
      const membership = membershipForUser(user, allocation.topicId, state.topicMemberships);
      const achievementId = `achievement-${Date.now()}`;
      state.addAchievement({
        ...values,
        id: achievementId,
        projectId: state.project.id,
        topicId: allocation.topicId,
        unitId: user.unitId,
        uploadUnitId: user.unitId,
        topicUnitMembershipId: membership?.id,
        unitIndicatorAllocationId: allocation.id,
        indicatorDefinitionId: allocation.indicatorDefinitionId,
        achievementType: allocation.achievementType,
        indicatorId: allocation.id,
        nodeId: allocation.nodeId,
        title: values.title!,
        responsiblePerson: values.responsiblePerson!,
        progressStatus: values.progressStatus ?? '拟投稿/申请',
        status: initialAchievementStatus(allocation.achievementType),
        countsToIndicator: false,
        createdAt: at,
        updatedAt: at,
        remarks: values.remarks ?? '',
        materials: buildMaterials(achievementId, 0),
        recordVersion: 1,
        history: [],
      }, user.id);
    }
    message.success('成果草稿已保存');
    setFormFiles({});
    setFormOpen(false);
  };
  const submit = (item: Achievement) => {
    const action = ['正式成果草稿', '正式退回'].includes(item.status) ? 'SUBMIT_FORMAL' : 'SUBMIT_PRE_REVIEW';
    if (action === 'SUBMIT_FORMAL') {
      const missing = formalMaterialRequirements(item.achievementType).filter((requirement) => !item.materials.some((material) => material.materialType === requirement.materialType && material.status !== '退回修改'));
      if (missing.length) return message.warning('请先编辑成果并上传全部正式审批材料');
    }
    try { state.advanceAchievement(item.id, action, user.id); message.success('已提交审批'); }
    catch (error) { message.error((error as Error).message); }
  };
  const startFormal = (item: Achievement) => {
    try {
      state.advanceAchievement(item.id, 'START_FORMAL', user.id);
      openEdit({ ...item, status: '正式成果草稿' });
    } catch (error) { message.error((error as Error).message); }
  };
  const registerExternal = async () => {
    if (!external) return;
    const values = await externalForm.validateFields();
    state.updateAchievement(external.id, {
      externalSubmissionDate: values.date,
      externalSubmissionNumber: values.number,
      ...(external.achievementType === '学术论文' ? { submissionDate: values.date, paperStatus: '已投稿' } : { applicationDate: values.date, patentStatus: '已申请' }),
      progressStatus: external.achievementType === '学术论文' ? '已投稿' : '已申请',
    }, user.id);
    state.advanceAchievement(external.id, 'REGISTER_EXTERNAL_SUBMISSION', user.id);
    setExternal(null);
    message.success('投稿/申请信息已登记');
  };
  const openSupplement = (item: Achievement) => {
    setSupplementFor(item);
    setSupplementFiles({});
    supplementForm.resetFields();
    supplementForm.setFieldsValue({
      publicationDate: item.publicationDate,
      journalYearVolumePage: item.journalYearVolumePage,
      doi: item.doi,
      grantDate: item.grantDate,
      patentNumber: item.patentNumber,
      grantPublicationNumber: item.grantPublicationNumber,
      legalStatus: item.legalStatus,
    });
  };
  const saveSupplement = async () => {
    if (!supplementFor) return;
    const values = await supplementForm.validateFields();
    const requirements = supplementMaterialRequirements(supplementFor);
    const missing = requirements.filter((item) => item.required && !supplementFiles[item.materialType]);
    if (missing.length) return message.warning(`请上传：${missing.map((item) => item.materialType).join('、')}`);
    const at = new Date().toISOString();
    const materials: AchievementMaterial[] = requirements.map((requirement, index) => ({
      id: `material-${Date.now()}-${index}`,
      achievementId: supplementFor.id,
      materialType: requirement.materialType,
      name: requirement.materialType,
      fileId: `file-${Date.now()}-${index}`,
      fileName: supplementFiles[requirement.materialType],
      fileUrl: '#',
      version: supplementFor.materials.filter((item) => item.materialType === requirement.materialType).length + 1,
      status: '待审核',
      uploader: user.name,
      uploadedAt: at,
    }));
    state.updateAchievement(supplementFor.id, { ...values, materials: [...supplementFor.materials, ...materials] }, user.id);
    try {
      state.advanceAchievement(supplementFor.id, 'SUBMIT_SUPPLEMENT', user.id);
      message.success('补充材料已提交科研助理初审');
      setSupplementFor(null);
      setSupplementFiles({});
      supplementForm.resetFields();
    } catch (error) { message.error((error as Error).message); }
  };
  const confirmDecision = () => {
    if (!detail || !decision) return;
    const action = reviewAction(detail);
    if (!action) return message.warning('当前成果不在您的审批环节');
    if (decision === 'return' && !opinion.trim()) return message.warning('退回时必须填写审批意见');
    try {
      state.reviewAchievement(detail.id, decision === 'approve' ? action : 'RETURN', user.id, opinion || '同意');
      message.success(decision === 'approve' ? '审批已通过' : '已退回修改');
      setDecision(null);
      setDetail(null);
      setOpinion('');
    } catch (error) { message.error((error as Error).message); }
  };

  const supplementRequirements = supplementFor ? supplementMaterialRequirements(supplementFor) : [];
  const editingFormalRequirements = editing && ['正式成果草稿', '正式退回'].includes(editing.status) ? formalMaterialRequirements(editing.achievementType) : [];

  return <>
    <Card className="achievement-filter-card" style={{ marginBottom: 16 }}>
      <div className={`achievement-filter-grid${filterExpanded ? ' is-expanded' : ''}`}>
        {canReview && <Space className="achievement-filter-field" size={8}><Text>处理范围</Text><Select value={workScope} onChange={setWorkScope} options={[{ label: '待我处理', value: 'pending' }, { label: '全部成果', value: 'all' }]} /></Space>}
        <Space className="achievement-filter-field" size={8}><Text>考核节点</Text><Select value={progressNodeId} onChange={setProgressNodeId} options={[...state.nodes].sort((a, b) => a.sortOrder - b.sortOrder).map((item) => ({ label: item.name, value: item.id }))} /></Space>
        <Space className="achievement-filter-field" size={8}><Text>所属课题</Text><Select allowClear placeholder="全部相关课题" value={topicId} onChange={setTopicId} options={topics.map((item) => ({ label: `${item.code} ${item.name}`, value: item.id }))} /></Space>
        <Space className="achievement-filter-field" size={8}><Text>成果状态</Text><Select allowClear placeholder="全部状态" value={status} onChange={setStatus} options={[...new Set(visible.map((item) => item.status))].map((item) => ({ label: item === '已生效' ? '已完成' : item, value: item }))} /></Space>
        {filterExpanded && <>
          <Space className="achievement-filter-field" size={8}><Text>成果指标</Text><Select allowClear placeholder="全部指标" value={definitionId} onChange={setDefinitionId} options={state.indicatorDefinitions.filter((definition) => visibleAllocations.some((item) => item.indicatorDefinitionId === definition.id)).map((item) => ({ label: item.name, value: item.id }))} /></Space>
          <Space className="achievement-filter-field" size={8}><Text>提交单位</Text><Select allowClear placeholder="全部单位" value={unitId} onChange={setUnitId} options={unitOptions.map((item) => ({ label: item.name, value: item.id }))} /></Space>
          <Space className="achievement-filter-field" size={8}><Text>成果名称</Text><Input allowClear placeholder="请输入成果名称" value={keyword} onChange={(event) => setKeyword(event.target.value)} /></Space>
        </>}
        <Space className="achievement-filter-actions" size={10}>
          <Button type="primary" icon={<SearchOutlined />}>查询</Button>
          <Button onClick={() => { setWorkScope(canReview ? 'pending' : 'all'); setProgressNodeId([...state.nodes].sort((a, b) => b.sortOrder - a.sortOrder)[0]?.id); setTopicId(undefined); setDefinitionId(undefined); setUnitId(undefined); setStatus(undefined); setKeyword(''); }}>重置</Button>
          <Button type="link" icon={filterExpanded ? <UpOutlined /> : <DownOutlined />} onClick={() => setFilterExpanded(!filterExpanded)}>{filterExpanded ? '收起' : '展开'}</Button>
        </Space>
      </div>
    </Card>

    <Card title="成果进度" style={{ marginBottom: 16 }}><Row gutter={[12, 12]}>
      {[
        ['分配指标', totals.target], ['已发起', totals.initiated], ['预审通过', totals.preApproved],
        ['已投稿/申请', totals.external], ['正式审批', totals.formal], ['进入补充阶段', totals.supplement], ['已完成', totals.effective],
      ].map(([label, value]) => <Col flex="1 1 125px" key={String(label)}><Statistic title={label} value={value} /></Col>)}
      <Col flex="1 1 220px"><Text type="secondary">完成率</Text><Progress percent={Math.min(completionRate, 100)} status={completionRate >= 100 ? 'success' : 'active'} format={() => `${completionRate}%`} /></Col>
    </Row>
      <Table size="small" rowKey="key" style={{ marginTop: 16 }} dataSource={progressRows} pagination={{ pageSize: 5 }} scroll={{ x: 1050 }} columns={[
        { title: '课题', dataIndex: 'topicId', width: 210, render: (value) => state.topics.find((item) => item.id === value)?.name ?? value },
        { title: '单位', dataIndex: 'unitId', width: 170, render: (value) => state.units.find((item) => item.id === value)?.name ?? value },
        { title: '指标', dataIndex: 'indicatorDefinitionId', width: 180, render: (value) => state.indicatorDefinitions.find((item) => item.id === value)?.name ?? value },
        { title: '目标', dataIndex: 'target', width: 72 },
        { title: '已发起', dataIndex: 'initiated', width: 82 },
        { title: '正式审批', dataIndex: 'formal', width: 96 },
        { title: '补充阶段', dataIndex: 'supplement', width: 92 },
        { title: '已完成', dataIndex: 'effective', width: 82 },
        { title: '完成率', dataIndex: 'completionRate', width: 120, render: (value) => <Progress percent={Math.min(value, 100)} size="small" /> },
      ]} />
    </Card>

    <Card title={`成果列表（${rows.length}）`} extra={canSubmit && <Button type="primary" icon={<FileAddOutlined />} onClick={openCreate}>新建成果</Button>}>
      <Table rowKey="id" dataSource={rows} scroll={{ x: 1180 }} columns={[
        { title: '成果名称', dataIndex: 'title', width: 250, fixed: 'left', render: (value, row) => <Space direction="vertical" size={0}><Text strong>{value}</Text><Text type="secondary">{state.indicatorDefinitions.find((item) => item.id === row.indicatorDefinitionId)?.name ?? row.achievementType}</Text></Space> },
        { title: '所属课题', dataIndex: 'topicId', width: 210, render: (value) => state.topics.find((item) => item.id === value)?.name ?? value },
        { title: '提交单位', width: 180, render: (_, row) => state.units.find((item) => item.id === (row.uploadUnitId ?? row.unitId))?.name ?? '—' },
        { title: '负责人', dataIndex: 'responsiblePerson', width: 110 },
        { title: '当前阶段', dataIndex: 'status', width: 150, render: (value) => <StatusTag status={value === '已生效' ? '已完成' : value} /> },
        { title: '附件', width: 80, render: (_, row) => `${row.materials.length} 个` },
        { title: '更新时间', dataIndex: 'updatedAt', width: 110, render: (value) => value?.slice(0, 10) },
        { title: '操作', fixed: 'right', width: 350, render: (_, row) => <Space wrap>
          <Button type="link" icon={<EyeOutlined />} onClick={() => setDetail(row)}>详情</Button>
          {reviewAction(row) && <Button type="link" onClick={() => setDetail(row)}>审批</Button>}
          {isOwner(row) && isEditableAchievementStatus(row.status) && !['允许投稿/申请', '已投稿/已申请', '待见刊补充', '待授权补充', '补充退回'].includes(row.status) && <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(row)}>编辑</Button>}
          {isOwner(row) && ['预审草稿', '预审退回', '正式成果草稿', '正式退回'].includes(row.status) && <Button type="link" icon={<SendOutlined />} onClick={() => submit(row)}>提交审批</Button>}
          {isOwner(row) && row.status === '允许投稿/申请' && <Button size="small" type="primary" onClick={() => { setExternal(row); externalForm.resetFields(); }}>{row.achievementType === '学术论文' ? '登记投稿' : '登记申请'}</Button>}
          {isOwner(row) && row.status === '已投稿/已申请' && <Button size="small" type="primary" onClick={() => startFormal(row)}>填报正式成果</Button>}
          {isOwner(row) && isSupplementEditable(row.status) && <Button size="small" type="primary" icon={<UploadOutlined />} onClick={() => openSupplement(row)}>{row.achievementType === '学术论文' ? '提交见刊材料' : '提交授权材料'}</Button>}
        </Space> },
      ]} />
    </Card>

    <Drawer width={980} title={editing ? '编辑成果' : '新建成果'} open={formOpen} onClose={() => setFormOpen(false)} extra={<Space><Button onClick={() => setFormOpen(false)}>取消</Button><Button type="primary" onClick={save}>保存草稿</Button></Space>}>
      <Form form={form} layout="vertical">
        <AchievementForm form={form} topics={topics} units={state.units} achievement={editing ?? undefined} lockOwnership={Boolean(editing)} definitions={state.indicatorDefinitions} project={state.project} allocations={state.unitIndicatorAllocations} nodes={state.nodes} currentUnitId={user.unitId} />
        <Card size="small" title={editingFormalRequirements.length ? '正式审批附件' : '预审参考附件（选填）'}>
          {editingFormalRequirements.length > 0 ? <>
            <Alert style={{ marginBottom: 12 }} type="info" showIcon message="正式审批材料提示" description="下列材料为正式审批必交项，已上传的同类材料无需重复上传。" />
            <Table size="small" pagination={false} rowKey="materialType" dataSource={editingFormalRequirements} columns={[
              { title: '材料', dataIndex: 'materialType', width: 210, render: (value) => <Space><Tag color="red">必交</Tag>{value}</Space> },
              { title: '要求提示', dataIndex: 'description' },
              { title: '附件', width: 170, render: (_, requirement) => editing?.materials.some((material) => material.materialType === requirement.materialType && material.status !== '退回修改')
                ? <Tag color="green">已上传</Tag>
                : <Upload maxCount={1} beforeUpload={(file) => { setFormFiles((current) => ({ ...current, [requirement.materialType]: file.name })); return false; }} onRemove={() => { setFormFiles((current) => { const next = { ...current }; delete next[requirement.materialType]; return next; }); return true; }}><Button size="small" icon={<UploadOutlined />}>选择文件</Button></Upload> },
            ]} />
          </> : <Upload maxCount={1} beforeUpload={(file) => { setFormFiles({ '预审参考附件': file.name }); return false; }} onRemove={() => { setFormFiles({}); return true; }}><Button icon={<UploadOutlined />}>选择文件</Button></Upload>}
        </Card>
      </Form>
    </Drawer>
    <Drawer width={860} title="成果详情" open={Boolean(detail)} onClose={() => setDetail(null)} extra={detail && reviewAction(detail) && <Space><Button danger icon={<RollbackOutlined />} onClick={() => setDecision('return')}>退回修改</Button><Button type="primary" icon={<CheckOutlined />} onClick={() => setDecision('approve')}>审批通过</Button></Space>}>
      {detail && <><Alert style={{ marginBottom: 16 }} type="info" showIcon message={reviewAction(detail) ? (detail.status.includes('终审中') ? '当前为终审环节' : '当前为初审环节') : '成果详情'} /><AchievementDetail achievement={detail} topics={state.topics} units={state.units} records={state.approvalRecords.filter((item) => item.businessId === detail.id)} users={state.users} /></>}
    </Drawer>
    <Modal title={external?.achievementType === '学术论文' ? '登记实际投稿' : '登记实际申请'} open={Boolean(external)} onCancel={() => setExternal(null)} onOk={registerExternal} okText="确认登记">
      <Form form={externalForm} layout="vertical"><Form.Item label="实际投稿/申请日期" name="date" rules={[{ required: true }]}><Input type="date" /></Form.Item><Form.Item label="投稿/申请编号" name="number" rules={[{ required: true }]}><Input /></Form.Item></Form>
    </Modal>
    <Modal width={760} title={supplementFor?.achievementType === '学术论文' ? '提交论文见刊补充材料' : '提交专利授权补充材料'} open={Boolean(supplementFor)} onCancel={() => setSupplementFor(null)} onOk={saveSupplement} okText="提交初审">
      {supplementFor && <Form form={supplementForm} layout="vertical">
        <Alert style={{ marginBottom: 16 }} type="warning" showIcon message="补充材料将依次经科研助理初审、项目技术负责人终审，终审通过后成果才计入指标。" />
        {supplementFor.achievementType === '学术论文' ? <Row gutter={16}>
          <Col span={12}><Form.Item label="正式刊出日期" name="publicationDate" rules={[{ required: true, message: '请选择正式刊出日期' }]}><Input type="date" /></Form.Item></Col>
          <Col span={12}><Form.Item label="年/卷/期/页码" name="journalYearVolumePage" rules={[{ required: true, message: '请填写年卷期页码' }]}><Input /></Form.Item></Col>
          <Col span={12}><Form.Item label="DOI" name="doi"><Input /></Form.Item></Col>
        </Row> : <Row gutter={16}>
          <Col span={12}><Form.Item label="授权日期" name="grantDate" rules={[{ required: true, message: '请选择授权日期' }]}><Input type="date" /></Form.Item></Col>
          <Col span={12}><Form.Item label="专利号" name="patentNumber" rules={[{ required: true, message: '请填写专利号' }]}><Input /></Form.Item></Col>
          <Col span={12}><Form.Item label="授权公告号" name="grantPublicationNumber" rules={[{ required: true, message: '请填写授权公告号' }]}><Input /></Form.Item></Col>
          <Col span={12}><Form.Item label="当前法律状态" name="legalStatus" rules={[{ required: true, message: '请填写当前法律状态' }]}><Input /></Form.Item></Col>
        </Row>}
        <Table size="small" pagination={false} rowKey="materialType" dataSource={supplementRequirements} columns={[
          { title: '必交材料', dataIndex: 'materialType', width: 210, render: (value) => <Space><Tag color="red">必交</Tag><Text>{value}</Text></Space> },
          { title: '要求提示', dataIndex: 'description' },
          { title: '附件', width: 170, render: (_, requirement) => <Upload maxCount={1} beforeUpload={(file) => { setSupplementFiles((current) => ({ ...current, [requirement.materialType]: file.name })); return false; }} onRemove={() => { setSupplementFiles((current) => { const next = { ...current }; delete next[requirement.materialType]; return next; }); return true; }}><Button size="small" icon={<UploadOutlined />}>选择文件</Button></Upload> },
        ]} />
      </Form>}
    </Modal>
    <Modal title={decision === 'approve' ? '确认审批通过' : '退回修改'} open={Boolean(decision)} onCancel={() => { setDecision(null); setOpinion(''); }} onOk={confirmDecision} okText="确认">
      {detail && <Descriptions size="small" column={1} style={{ marginBottom: 12 }} items={[{ key: 'stage', label: '审批环节', children: detail.status }, { key: 'role', label: '当前审批人', children: `${user.role}（${user.name}）` }]} />}
      <Input.TextArea rows={4} value={opinion} onChange={(event) => setOpinion(event.target.value)} placeholder={decision === 'return' ? '请填写明确的退回原因' : '审批意见（选填）'} />
    </Modal>
  </>;
}
