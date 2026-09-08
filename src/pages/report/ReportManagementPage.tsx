import { useMemo, useState } from 'react';
import { Button, Card, Drawer, Form, Space, Table, Tabs, Tag, Typography, message } from 'antd';
import { EditOutlined, SendOutlined } from '@ant-design/icons';
import type { ProgressReport, ReportTask, ReportType } from '../../types';
import { useAppStore } from '../../store';
import { isReportOverdue } from '../../domain/reporting';
import { isReportEditable } from '../../domain/report-flow';
import { canPerform, filterByTopicScope } from '../../domain/permissions';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusTag } from '../../components/common/StatusTag';
import { ReportForm } from '../../components/report/ReportForm';

const { Text } = Typography;

export function ReportManagementPage() {
  const state = useAppStore();
  const user = state.currentUser!;
  const canSubmit = canPerform(user.role, 'report.submit');
  const topic = state.topics.find((item) => item.id === user.topicId);
  const [drawer, setDrawer] = useState(false);
  const [editingTask, setEditingTask] = useState<ReportTask | null>(null);
  const [editingReport, setEditingReport] = useState<ProgressReport | null>(null);
  const [form] = Form.useForm<Partial<ProgressReport>>();
  const tasks = useMemo(() => filterByTopicScope(user, state.reportTasks), [state.reportTasks, user]);

  const openEdit = (task: ReportTask) => {
    const report = state.reports.find((item) => item.taskId === task.id) ?? null;
    setEditingTask(task); setEditingReport(report); form.setFieldsValue(report ?? {}); setDrawer(true);
  };
  const save = async (): Promise<string> => {
    const values = await form.validateFields();
    const task = editingTask!;
    const report: ProgressReport = {
      id: editingReport?.id ?? `report-${Date.now()}`, taskId: task.id, topicId: task.topicId, reportType: task.reportType,
      milestoneProgress: values.milestoneProgress!, overallProgress: values.overallProgress!, demonstrationProgress: values.demonstrationProgress!,
      fundUsage: values.fundUsage!, nextPlan: values.nextPlan!, problemsAndMeasures: values.problemsAndMeasures!,
      status: editingReport?.status === '退回修改' ? '退回修改' : '草稿', overdue: isReportOverdue(task.deadline, editingReport?.submittedAt),
      version: editingReport?.version ?? 1, submittedAt: editingReport?.submittedAt, updatedAt: new Date().toISOString().slice(0, 10),
    };
    state.saveReport(report); setEditingReport(report); message.success('报告草稿已保存'); return report.id;
  };
  const submit = async () => { const id = await save(); state.submitReport(id, user.id); message.success('报告已提交科研助理初审'); setDrawer(false); };
  const rows = (type: ReportType) => tasks.filter((item) => item.reportType === type).map((task) => ({ ...task, report: state.reports.find((item) => item.taskId === task.id) }));
  const columns = [
    { title: '课题', dataIndex: 'topicId', width: 220, render: (value: string) => state.topics.find((item) => item.id === value)?.name ?? value },
    { title: '报告期次', render: (_: unknown, row: ReportTask) => row.reportType === 'MONTHLY' ? `${row.year} 年 ${row.period} 月` : `${row.year} 年第 ${row.period} 季度` },
    { title: '截止日期', dataIndex: 'deadline', width: 130 },
    { title: '状态', width: 120, render: (_: unknown, row: ReportTask & { report?: ProgressReport }) => <StatusTag status={row.report?.status ?? '未填报'} /> },
    { title: '时效', width: 100, render: (_: unknown, row: ReportTask & { report?: ProgressReport }) => isReportOverdue(row.deadline, row.report?.submittedAt) ? <Tag color="red">逾期</Tag> : <Tag color="green">正常</Tag> },
    { title: '提交时间', width: 130, render: (_: unknown, row: ReportTask & { report?: ProgressReport }) => row.report?.submittedAt ?? '—' },
    { title: '操作', width: 120, render: (_: unknown, row: ReportTask & { report?: ProgressReport }) => <Button type="link" icon={<EditOutlined />} disabled={canSubmit && row.report ? !isReportEditable(row.report.status) : false} onClick={() => openEdit(row)}>{canSubmit ? '填报/查看' : '只读查看'}</Button> },
  ];
  return <>
    <PageHeader title="月报与季报" description={canSubmit ? `${topic?.name ?? '本课题'} · 月报每月 30 日前，季报于 3/10、6/10、9/10、12/10 前提交。` : '全部课题报告 · 系统管理员只读查看，不参与填报或审批。'} />
    <Card><Tabs items={[{ key: 'monthly', label: '月报任务', children: <Table rowKey="id" dataSource={rows('MONTHLY')} columns={columns} pagination={false} /> }, { key: 'quarterly', label: '季报任务', children: <Table rowKey="id" dataSource={rows('QUARTERLY')} columns={columns} pagination={false} /> }]} /></Card>
    <Drawer size={760} title={editingTask?.reportType === 'MONTHLY' ? '课题月报填报' : '课题季报填报'} open={drawer} onClose={() => setDrawer(false)} extra={canSubmit ? <Space><Button onClick={save}>保存草稿</Button><Button type="primary" icon={<SendOutlined />} onClick={submit}>提交初审</Button></Space> : undefined}>
      {editingTask && <Space style={{ marginBottom: 16 }}><Text strong>{state.topics.find((item) => item.id === editingTask.topicId)?.name}</Text><Tag>{editingTask.deadline} 截止</Tag>{editingReport && <StatusTag status={editingReport.status} />}</Space>}
      <ReportForm form={form} disabled={!canSubmit} />
    </Drawer>
  </>;
}
