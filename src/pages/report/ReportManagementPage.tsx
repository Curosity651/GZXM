import { useMemo, useState } from 'react';
import { Button, Card, Col, Drawer, Form, Input, InputNumber, Modal, Progress, Row, Select, Space, Statistic, Table, Tag, Typography, message } from 'antd';
import { CheckOutlined, DownOutlined, EditOutlined, EyeOutlined, FileAddOutlined, RollbackOutlined, SearchOutlined, SendOutlined, UpOutlined } from '@ant-design/icons';
import type { ProgressReport, ReportTask, ReportType } from '../../types';
import type { ReportAction } from '../../domain/report-flow';
import { useAppStore } from '../../store';
import { isReportOpen, isReportOverdue, topicReportWindow } from '../../domain/reporting';
import { isReportEditable } from '../../domain/report-flow';
import { canPerform } from '../../domain/permissions';
import { accessibleTopics, isTopicLead, isTopicOperational } from '../../domain/topic-access';
import { StatusTag } from '../../components/common/StatusTag';
import { ApprovalTimeline } from '../../components/common/ApprovalTimeline';
import { ReportForm } from '../../components/report/ReportForm';

const { Text } = Typography;
const today = () => new Date().toISOString().slice(0, 10);
interface NewReportValues { topicId: string; reportType: ReportType; year: number; period: number }

export function ReportManagementPage() {
  const state = useAppStore();
  const user = state.currentUser!;
  const topics = accessibleTopics(user, state.topics, state.topicMemberships);
  const leadTopics = topics.filter((topic) => isTopicOperational(topic) && isTopicLead(user, topic.id, state.topicMemberships));
  const canSubmit = canPerform(user, state.roles, 'report.submit');
  const canInitial = canPerform(user, state.roles, 'report.initial.approve');
  const canFinal = canPerform(user, state.roles, 'report.final.approve');
  const canReview = canInitial || canFinal;
  const [form] = Form.useForm<Partial<ProgressReport>>();
  const [newForm] = Form.useForm<NewReportValues>();
  const [editingTask, setEditingTask] = useState<ReportTask | null>(null);
  const [editingReport, setEditingReport] = useState<ProgressReport | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [decision, setDecision] = useState<'approve' | 'return' | null>(null);
  const [opinion, setOpinion] = useState('');
  const [scope, setScope] = useState<'all' | 'pending'>(canReview ? 'pending' : 'all');
  const [expanded, setExpanded] = useState(false);
  const [topicId, setTopicId] = useState<string>();
  const [type, setType] = useState<ReportType>();
  const [year, setYear] = useState<number>();
  const [period, setPeriod] = useState<number>();
  const [status, setStatus] = useState<string>();

  const topicIds = useMemo(() => new Set(topics.map((topic) => topic.id)), [topics]);
  const records = useMemo(() => state.reports
    .filter((report) => topicIds.has(report.topicId))
    .map((report) => ({ report, task: state.reportTasks.find((task) => task.id === report.taskId) }))
    .filter((item): item is { report: ProgressReport; task: ReportTask } => Boolean(item.task)), [state.reports, state.reportTasks, topicIds]);
  const baseRecords = records.filter(({ report, task }) => (!topicId || report.topicId === topicId) && (!type || report.reportType === type) && (!year || task.year === year) && (!period || task.period === period));
  const visibleRows = baseRecords.filter(({ report }) => (!status || report.status === status) && (scope === 'all' || (canInitial && report.status === '初审中') || (canFinal && report.status === '终审中')));
  const stats = {
    total: baseRecords.length,
    draft: baseRecords.filter(({ report }) => report.status === '草稿').length,
    reviewing: baseRecords.filter(({ report }) => ['初审中', '终审中'].includes(report.status)).length,
    approved: baseRecords.filter(({ report }) => report.status === '已通过').length,
    returned: baseRecords.filter(({ report }) => report.status === '退回修改').length,
    overdue: baseRecords.filter(({ report, task }) => isReportOverdue(task.deadline, report.submittedAt)).length,
  };
  const submittedCount = baseRecords.filter(({ report }) => report.status !== '草稿').length;
  const passRate = submittedCount ? Math.round(stats.approved / submittedCount * 100) : 0;

  const reviewAction = (report: ProgressReport | null): ReportAction | null => {
    if (!report || !isTopicOperational(state.topics.find((topic) => topic.id === report.topicId))) return null;
    if (report?.status === '初审中' && canInitial) return 'APPROVE_INITIAL';
    if (report?.status === '终审中' && canFinal) return 'APPROVE_FINAL';
    return null;
  };
  const editable = Boolean(editingTask && isTopicOperational(state.topics.find((topic) => topic.id === editingTask.topicId)) && isReportOpen(editingTask) && canSubmit && isTopicLead(user, editingTask.topicId, state.topicMemberships) && (!editingReport || isReportEditable(editingReport.status)));
  const openRecord = (task: ReportTask, report: ProgressReport) => { setEditingTask(task); setEditingReport(report); form.setFieldsValue(report); setDrawer(true); };
  const prepareNew = () => { const date = new Date(); newForm.resetFields(); newForm.setFieldsValue({ reportType: 'MONTHLY', year: date.getFullYear(), period: date.getMonth() + 1 }); setNewOpen(true); };
  const watchedNewValues = Form.useWatch([], newForm) as Partial<NewReportValues> | undefined;
  const selectedTopic = leadTopics.find((item) => item.id === watchedNewValues?.topicId);
  let selectedWindow: { openDate: string; deadline: string } | undefined;
  if (selectedTopic?.reportConfig && watchedNewValues?.reportType && watchedNewValues.year && watchedNewValues.period) {
    try {
      selectedWindow = topicReportWindow(selectedTopic.reportConfig, watchedNewValues.reportType, watchedNewValues.year, watchedNewValues.period);
    } catch {
      selectedWindow = undefined;
    }
  }
  const createReport = async () => {
    const values = await newForm.validateFields();
    const topic = leadTopics.find((item) => item.id === values.topicId);
    if (!topic) return message.warning('只有课题牵头单位可以新建月季报');
    if (topic.enabled === false || topic.status === '已暂停' || topic.status === '已结题') return message.warning('当前课题已停用，不能新建月季报');
    if (!topic.reportConfig) return message.warning('该课题尚未配置月季报规则');
    let window: { openDate: string; deadline: string };
    try {
      window = topicReportWindow(topic.reportConfig, values.reportType, values.year, values.period);
    } catch (error) {
      return message.warning(error instanceof Error ? error.message : '月季报规则配置不正确');
    }
    const oldTask = state.reportTasks.find((task) => task.topicId === values.topicId && task.reportType === values.reportType && task.year === values.year && task.period === values.period);
    const oldReport = oldTask && state.reports.find((report) => report.taskId === oldTask.id);
    if (oldTask && oldReport) { setNewOpen(false); openRecord(oldTask, oldReport); return message.info('该期报告已经存在'); }
    const id = oldTask?.id ?? `report-task-${values.reportType === 'MONTHLY' ? 'm' : 'q'}-${values.topicId}-${values.year}-${values.period}`;
    const task: ReportTask = { id, topicId: values.topicId, reportType: values.reportType, year: values.year, period: values.period, ...window };
    if (!isReportOpen(task)) return message.warning(`该报告将于 ${task.openDate} 开放填报`);
    try {
      state.saveReportTask(task, user.id);
    } catch (error) {
      return message.warning(error instanceof Error ? error.message : '无法新建月季报');
    }
    setEditingTask(task); setEditingReport(null); form.resetFields(); setNewOpen(false); setDrawer(true);
  };
  const save = async (): Promise<string> => {
    const values = await form.validateFields(); const task = editingTask!;
    const report: ProgressReport = { id: editingReport?.id ?? `report-${Date.now()}`, taskId: task.id, topicId: task.topicId, reportType: task.reportType, milestoneProgress: values.milestoneProgress!, overallProgress: values.overallProgress!, demonstrationProgress: values.demonstrationProgress!, fundUsage: values.fundUsage!, nextPlan: values.nextPlan!, problemsAndMeasures: values.problemsAndMeasures!, status: editingReport?.status === '退回修改' ? '退回修改' : '草稿', overdue: isReportOverdue(task.deadline, editingReport?.submittedAt), recordVersion: editingReport?.recordVersion ?? 0, submittedVersion: editingReport?.submittedVersion ?? 0, submittedAt: editingReport?.submittedAt, updatedAt: today() };
    state.saveReport(report, user.id); setEditingReport(useAppStore.getState().reports.find((item) => item.id === report.id) ?? report); message.success('报告草稿已保存'); return report.id;
  };
  const submit = async () => { const id = await save(); state.submitReport(id, user.id); message.success('报告已提交科研助理初审'); setDrawer(false); };
  const confirmReview = () => {
    const action = reviewAction(editingReport); if (!editingReport || !action || !decision) return;
    if (decision === 'return' && !opinion.trim()) return message.warning('退回时必须填写审批意见');
    state.reviewReport(editingReport.id, decision === 'approve' ? action : 'RETURN', user.id, opinion || '同意');
    message.success(decision === 'approve' ? '审批已通过' : '已退回修改'); setDecision(null); setDrawer(false); setOpinion('');
  };

  return <>
    <Card style={{ marginBottom: 16 }} styles={{ body: { overflowX: 'auto' } }}><div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'nowrap', minWidth: 'max-content' }}>
      {canReview && <Space size={8}><Text>处理范围</Text><Select style={{ width: 130 }} value={scope} onChange={setScope} options={[{ label: '待我处理', value: 'pending' }, { label: '全部报告', value: 'all' }]} /></Space>}
      <Space size={8}><Text>所属课题</Text><Select allowClear placeholder="全部课题" style={{ width: 220 }} value={topicId} onChange={setTopicId} options={topics.map((topic) => ({ label: `${topic.code} ${topic.name}`, value: topic.id }))} /></Space>
      <Space size={8}><Text>报告状态</Text><Select allowClear placeholder="全部状态" style={{ width: 150 }} value={status} onChange={setStatus} options={['草稿', '初审中', '终审中', '已通过', '退回修改'].map((value) => ({ label: value, value }))} /></Space>
      {expanded && <><Space size={8}><Text>报告类型</Text><Select allowClear placeholder="全部类型" style={{ width: 130 }} value={type} onChange={setType} options={[{ label: '月报', value: 'MONTHLY' }, { label: '季报', value: 'QUARTERLY' }]} /></Space><Space size={8}><Text>年度</Text><InputNumber placeholder="全部年度" style={{ width: 120 }} value={year} onChange={(value) => setYear(value ?? undefined)} /></Space><Space size={8}><Text>期次</Text><InputNumber placeholder="全部期次" style={{ width: 110 }} value={period} onChange={(value) => setPeriod(value ?? undefined)} /></Space></>}
      <Space size={10} style={{ marginLeft: 'auto' }}><Button type="primary" icon={<SearchOutlined />}>查询</Button><Button onClick={() => { setScope(canReview ? 'pending' : 'all'); setTopicId(undefined); setType(undefined); setYear(undefined); setPeriod(undefined); setStatus(undefined); }}>重置</Button><Button type="link" icon={expanded ? <UpOutlined /> : <DownOutlined />} onClick={() => setExpanded(!expanded)}>{expanded ? '收起' : '展开'}</Button></Space>
    </div></Card>
    <Card title="月季报进度" style={{ marginBottom: 16 }}><Row gutter={[12, 12]}>
      {[["已发起报告", stats.total], ['草稿', stats.draft], ['审核中', stats.reviewing], ['已通过', stats.approved], ['退回修改', stats.returned], ['逾期', stats.overdue]].map(([label, value]) => <Col flex="1 1 140px" key={String(label)}><Statistic title={label} value={value} /></Col>)}
      <Col flex="1 1 220px"><Text type="secondary">审批通过率</Text><Progress percent={passRate} status={passRate >= 100 ? 'success' : 'active'} /></Col>
    </Row></Card>
    <Card title={`月季报列表（${visibleRows.length}）`} extra={canSubmit && leadTopics.length > 0 && <Button type="primary" icon={<FileAddOutlined />} onClick={prepareNew}>新建月季报</Button>}><Table rowKey={({ report }) => report.id} dataSource={visibleRows} columns={[
      { title: '报告', render: (_, { report }) => <Space><Tag color={report.reportType === 'MONTHLY' ? 'blue' : 'purple'}>{report.reportType === 'MONTHLY' ? '月报' : '季报'}</Tag><Text strong>{state.topics.find((topic) => topic.id === report.topicId)?.name}</Text></Space> },
      { title: '报告期次', width: 150, render: (_, { task }) => task.reportType === 'MONTHLY' ? `${task.year} 年 ${task.period} 月` : `${task.year} 年第 ${task.period} 季度` },
      { title: '截止日期', width: 120, render: (_, { task }) => task.deadline },
      { title: '状态', width: 120, render: (_, { report }) => <StatusTag status={report.status} /> },
      { title: '当前环节', width: 140, render: (_, { report }) => report.status === '初审中' ? '科研助理初审' : report.status === '终审中' ? '技术负责人终审' : report.status === '已通过' ? '审批完成' : '课题单位填报' },
      { title: '提交时间', width: 120, render: (_, { report }) => report.submittedAt ?? '—' },
      { title: '时效', width: 80, render: (_, { task, report }) => isReportOverdue(task.deadline, report.submittedAt) ? <Tag color="red">逾期</Tag> : <Tag color="green">正常</Tag> },
      { title: '操作', width: 120, render: (_, { task, report }) => <Button type="link" icon={isReportEditable(report.status) ? <EditOutlined /> : <EyeOutlined />} onClick={() => openRecord(task, report)}>{reviewAction(report) ? '审批' : canSubmit && isTopicLead(user, task.topicId, state.topicMemberships) && isReportEditable(report.status) ? '编辑' : '详情'}</Button> },
    ]} /></Card>
    <Modal title="新建月季报" open={newOpen} onCancel={() => setNewOpen(false)} onOk={createReport} okText="开始填报"><Form form={newForm} layout="vertical"><Form.Item label="所属课题" name="topicId" rules={[{ required: true }]}><Select options={leadTopics.map((topic) => ({ label: `${topic.code} ${topic.name}`, value: topic.id }))} /></Form.Item><Row gutter={12}><Col span={8}><Form.Item label="报告类型" name="reportType" rules={[{ required: true }]}><Select options={[{ label: '月报', value: 'MONTHLY' }, { label: '季报', value: 'QUARTERLY' }]} /></Form.Item></Col><Col span={8}><Form.Item label="年度" name="year" rules={[{ required: true }]}><InputNumber min={2020} max={2100} style={{ width: '100%' }} /></Form.Item></Col><Col span={8}><Form.Item label="期次" name="period" rules={[{ required: true }]}><InputNumber min={1} max={watchedNewValues?.reportType === 'QUARTERLY' ? selectedTopic?.reportConfig?.quarterlyMonths.length ?? 4 : 12} style={{ width: '100%' }} /></Form.Item></Col></Row><Row gutter={12}><Col span={12}><Form.Item label="开放日期"><Input value={selectedWindow?.openDate} placeholder="选择完整信息后自动计算" readOnly /></Form.Item></Col><Col span={12}><Form.Item label="截止日期"><Input value={selectedWindow?.deadline} placeholder="选择完整信息后自动计算" readOnly /></Form.Item></Col></Row></Form></Modal>
    <Drawer width={780} title={editingTask?.reportType === 'MONTHLY' ? '课题月报' : '课题季报'} open={drawer} onClose={() => setDrawer(false)} extra={editable ? <Space><Button onClick={save}>保存草稿</Button><Button type="primary" icon={<SendOutlined />} onClick={submit}>提交初审</Button></Space> : reviewAction(editingReport) ? <Space><Button danger icon={<RollbackOutlined />} onClick={() => setDecision('return')}>退回修改</Button><Button type="primary" icon={<CheckOutlined />} onClick={() => setDecision('approve')}>审批通过</Button></Space> : undefined}>
      {editingTask && <Space style={{ marginBottom: 16 }}><Text strong>{state.topics.find((topic) => topic.id === editingTask.topicId)?.name}</Text><Tag>{editingTask.deadline} 截止</Tag>{editingReport && <><StatusTag status={editingReport.status} /><Tag>记录 V{editingReport.recordVersion ?? 1}</Tag><Tag color="blue">提交 V{editingReport.submittedVersion ?? 0}</Tag></>}</Space>}
      <ReportForm form={form} disabled={!editable} />
      {editingReport && <Card title="审批记录" size="small" style={{ marginTop: 16 }}><ApprovalTimeline records={state.approvalRecords.filter((item) => item.businessId === editingReport.id)} users={state.users} /></Card>}
    </Drawer>
    <Modal title={decision === 'approve' ? '确认审批通过' : '退回修改'} open={Boolean(decision)} onCancel={() => setDecision(null)} onOk={confirmReview}><Input.TextArea rows={4} value={opinion} onChange={(event) => setOpinion(event.target.value)} placeholder={decision === 'return' ? '请填写明确的退回原因' : '审批意见（选填）'} /></Modal>
  </>;
}
