import { useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Form, InputNumber, Progress, Row, Select, Space, Statistic, Switch, Table, Tabs, Tag, Typography, message } from 'antd';
import type { ProgressReport, ReportSubmissionRule, ReportTask, ReportType } from '../../types';
import { useAppStore } from '../../store';
import { canPerform } from '../../domain/permissions';
import { isTopicLead } from '../../domain/topic-access';
import { isReportOverdue } from '../../domain/reporting';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusTag } from '../../components/common/StatusTag';

const { Text } = Typography;
const submittedStatuses = ['初审中', '终审中', '已通过', '退回修改'];

function RuleEditor({ rule, editable }: { rule: ReportSubmissionRule; editable: boolean }) {
  const saveReportRule = useAppStore((state) => state.saveReportRule);
  const currentUser = useAppStore((state) => state.currentUser)!;
  const [form] = Form.useForm<ReportSubmissionRule>();
  const save = async () => {
    const values = await form.validateFields();
    if (values.openDay > values.deadlineDay) return message.warning('截止提交日不能早于开放填报日');
    saveReportRule({ ...rule, ...values, quarterlyMonths: rule.reportType === 'QUARTERLY' ? values.quarterlyMonths : [], updatedAt: new Date().toISOString(), updatedBy: currentUser.name });
    message.success(`${rule.reportType === 'MONTHLY' ? '月报' : '季报'}规则已保存，未提交任务已同步更新`);
  };
  return <Card title={rule.reportType === 'MONTHLY' ? '月报统一规则' : '季报统一规则'} extra={<Tag color="blue">全项目统一</Tag>}>
    <Form form={form} layout="vertical" initialValues={rule} disabled={!editable}>
      <Row gutter={16}><Col span={6}><Form.Item label="启用规则" name="enabled" valuePropName="checked"><Switch /></Form.Item></Col><Col span={6}><Form.Item label="生效年度" name="effectiveYear" rules={[{ required: true }]}><InputNumber min={2020} max={2100} style={{ width: '100%' }} /></Form.Item></Col><Col span={6}><Form.Item label={rule.reportType === 'MONTHLY' ? '每月开放日' : '季末月开放日'} name="openDay" rules={[{ required: true }]}><InputNumber min={1} max={31} style={{ width: '100%' }} addonAfter="日" /></Form.Item></Col><Col span={6}><Form.Item label={rule.reportType === 'MONTHLY' ? '每月截止日' : '季末月截止日'} name="deadlineDay" rules={[{ required: true }]}><InputNumber min={1} max={31} style={{ width: '100%' }} addonAfter="日" /></Form.Item></Col></Row>
      {rule.reportType === 'QUARTERLY' && <Form.Item label="季报月份" name="quarterlyMonths" rules={[{ required: true }]}><Select mode="multiple" options={Array.from({ length: 12 }, (_, index) => ({ label: `${index + 1} 月`, value: index + 1 }))} /></Form.Item>}
      <Space><Text type="secondary">最近更新：{rule.updatedAt.slice(0, 10)} · {rule.updatedBy ?? '—'}</Text>{editable && <Button type="primary" onClick={save}>保存规则</Button>}</Space>
    </Form>
  </Card>;
}

export function ReportProgressPage() {
  const state = useAppStore(); const user = state.currentUser!;
  const canManageRule = canPerform(user, state.roles, 'report.rule.manage');
  const global = ['系统管理员', '项目技术负责人', '科研助理'].includes(user.role);
  const visibleTopicIds = new Set(state.topics.filter((topic) => global || isTopicLead(user, topic.id, state.topicMemberships)).map((topic) => topic.id));
  const [type, setType] = useState<ReportType>('MONTHLY');
  const years = [...new Set(state.reportTasks.map((task) => task.year))].sort((a, b) => b - a);
  const [year, setYear] = useState(years[0]); const [period, setPeriod] = useState<number>(); const [status, setStatus] = useState<string>();
  const records = useMemo(() => state.reportTasks.filter((task) => visibleTopicIds.has(task.topicId) && task.reportType === type && task.year === year && (!period || task.period === period)).map((task) => ({ task, report: state.reports.find((item) => item.taskId === task.id) })).filter(({ report }) => !status || (report?.status ?? '未填报') === status), [period, state.reportTasks, state.reports, status, type, visibleTopicIds, year]);
  const total = records.length; const submitted = records.filter(({ report }) => report && submittedStatuses.includes(report.status)).length; const approved = records.filter(({ report }) => report?.status === '已通过').length; const missing = records.filter(({ report }) => !report || ['未填报', '草稿'].includes(report.status)).length; const overdue = records.filter(({ task, report }) => isReportOverdue(task.deadline, report?.submittedAt)).length;
  const columns = [
    { title: '课题', render: (_: unknown, row: { task: ReportTask }) => { const topic = state.topics.find((item) => item.id === row.task.topicId); return <Space><Tag>{topic?.code}</Tag><Text strong>{topic?.name}</Text></Space>; } },
    { title: '牵头单位', render: (_: unknown, row: { task: ReportTask }) => { const topic = state.topics.find((item) => item.id === row.task.topicId); return state.units.find((item) => item.id === topic?.leadingUnitId)?.name ?? '—'; } },
    { title: '报告期次', width: 150, render: (_: unknown, row: { task: ReportTask }) => row.task.reportType === 'MONTHLY' ? `${row.task.year} 年 ${row.task.period} 月` : `${row.task.year} 年第 ${row.task.period} 季度` },
    { title: '开放/截止', width: 210, render: (_: unknown, row: { task: ReportTask }) => `${row.task.openDate} 至 ${row.task.deadline}` },
    { title: '报告状态', width: 120, render: (_: unknown, row: { report?: ProgressReport }) => <StatusTag status={row.report?.status ?? '未填报'} /> },
    { title: '提交时间', width: 120, render: (_: unknown, row: { report?: ProgressReport }) => row.report?.submittedAt ?? '—' },
    { title: '审批阶段', width: 110, render: (_: unknown, row: { report?: ProgressReport }) => row.report?.status === '初审中' ? '科研助理初审' : row.report?.status === '终审中' ? '技术负责人终审' : row.report?.status === '已通过' ? '审批完成' : '—' },
    { title: '时效', width: 80, render: (_: unknown, row: { task: ReportTask; report?: ProgressReport }) => isReportOverdue(row.task.deadline, row.report?.submittedAt) ? <Tag color="red">逾期</Tag> : <Tag color="green">正常</Tag> },
  ];
  const progressPanel = <><Card style={{ marginBottom: 16 }}><Space wrap>报告类型<Select value={type} onChange={(value) => { setType(value); setPeriod(undefined); }} options={[{ label: '月报', value: 'MONTHLY' }, { label: '季报', value: 'QUARTERLY' }]} />年度<Select value={year} onChange={setYear} options={years.map((value) => ({ label: `${value} 年`, value }))} />期次<Select allowClear placeholder="全部期次" value={period} onChange={setPeriod} options={Array.from({ length: type === 'MONTHLY' ? 12 : 4 }, (_, index) => ({ label: type === 'MONTHLY' ? `${index + 1} 月` : `第 ${index + 1} 季度`, value: index + 1 }))} />状态<Select allowClear placeholder="全部状态" value={status} onChange={setStatus} options={['未填报', '草稿', '初审中', '终审中', '已通过', '退回修改'].map((value) => ({ label: value, value }))} /></Space></Card>
    <Row gutter={12} style={{ marginBottom: 16 }}>{[{ title: '应提交', value: total }, { title: '已提交', value: submitted }, { title: '已通过', value: approved }, { title: '未提交', value: missing }, { title: '逾期', value: overdue }].map((item) => <Col flex="1" key={item.title}><Card><Statistic title={item.title} value={item.value} suffix="个课题" /></Card></Col>)}<Col flex="1"><Card><Text type="secondary">提交率</Text><Progress percent={total ? Math.round(submitted / total * 100) : 0} size="small" /></Card></Col></Row>
    <Card><Table rowKey={(row) => row.task.id} dataSource={records} columns={columns} pagination={{ pageSize: 10 }} /></Card></>;
  return <><PageHeader title="月季报进度" description="按照全项目统一规则，统计各课题月报和季报的提交、审批与逾期情况。" /><Tabs items={[{ key: 'progress', label: '提交进度', children: progressPanel }, { key: 'rules', label: '规则配置', children: <Space direction="vertical" size={16} style={{ width: '100%' }}>{!canManageRule && <Alert type="info" showIcon message="当前身份可查看规则，但只有科研助理可以修改。" />}{state.reportRules.map((rule) => <RuleEditor key={rule.id} rule={rule} editable={canManageRule} />)}</Space> }]} /></>;
}

