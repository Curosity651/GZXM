import { Card, Descriptions, Empty, Space, Table, Tag, Typography } from 'antd';
import type { Achievement, ApprovalRecord, ProjectUnit, Topic, User } from '../../types';
import { StatusTag } from '../common/StatusTag';
import { ApprovalTimeline } from '../common/ApprovalTimeline';
import { AchievementStageBar } from './AchievementStageBar';

const { Text } = Typography;

export function AchievementDetail({ achievement, topics, units, records, users }: { achievement: Achievement; topics: Topic[]; units: ProjectUnit[]; records: ApprovalRecord[]; users: User[] }) {
  const topic = topics.find((item) => item.id === achievement.topicId);
  const unit = units.find((item) => item.id === (achievement.uploadUnitId ?? achievement.unitId));
  const people = achievement.allAuthors || achievement.inventorList || achievement.copyrightOwnerList || achievement.drafters || achievement.studentName || '—';
  const yesNo = (value: boolean | undefined) => value === undefined ? '—' : value ? '是' : '否';
  const specialItems = achievement.achievementType === '学术论文' ? [
    { key: 'first-person', label: '第一作者', children: achievement.firstAuthor || '—' },
    { key: 'grid-first', label: '广西电网第一作者', children: yesNo(achievement.isPowerGridFirstAuthor) },
    { key: 'core', label: '中文核心期刊', children: yesNo(achievement.isChineseCoreJournal) },
    { key: 'paper-type', label: '收录类别', children: achievement.paperType || '—' },
  ] : achievement.achievementType === '发明专利' ? [
    { key: 'first-person', label: '第一申请人', children: achievement.firstApplicant || achievement.applicant || '—' },
    { key: 'grid-first', label: '广西电网第一申请人', children: yesNo(achievement.isPowerGridFirstApplicant) },
  ] : achievement.achievementType === '软件著作权' ? [
    { key: 'first-person', label: '第一完成人', children: achievement.firstCompleter || '—' },
    { key: 'grid-first', label: '广西电网第一完成人', children: yesNo(achievement.isPowerGridFirstCompleter) },
  ] : [];
  return <Space direction="vertical" size={16} style={{ width: '100%' }}>
    <Card size="small"><AchievementStageBar achievement={achievement} /></Card>
    <Card size="small" title="成果信息"><Descriptions bordered size="small" column={2} items={[
      { key: 'title', label: '成果名称', children: achievement.title, span: 2 },
      { key: 'topic', label: '所属课题', children: topic ? `${topic.code} ${topic.name}` : achievement.topicId },
      { key: 'unit', label: '上传单位', children: unit?.name ?? '—' },
      { key: 'type', label: '成果类型', children: <Tag color="blue">{achievement.achievementType}</Tag> },
      { key: 'status', label: '当前状态', children: <StatusTag status={achievement.status} /> },
      { key: 'owner', label: '负责人', children: achievement.responsiblePerson },
      { key: 'number', label: '投稿/申请编号', children: achievement.externalSubmissionNumber || achievement.applicationNumber || achievement.registrationNumber || '—' },
      ...specialItems,
      { key: 'people', label: '作者/完成人及排序', children: people, span: 2 },
      { key: 'units', label: '署名/申请单位', children: achievement.signingUnitList || achievement.applicantList || achievement.copyrightOwner || achievement.participatingUnits || '—', span: 2 },
      { key: 'remark', label: '备注', children: achievement.remarks || '—', span: 2 },
    ]} /></Card>
    <Card size="small" title="成果材料">{achievement.materials.length ? <Table size="small" rowKey="id" pagination={false} dataSource={achievement.materials} columns={[
      { title: '材料类型', dataIndex: 'materialType', width: 150 },
      { title: '材料名称', dataIndex: 'name' },
      { title: '文件', dataIndex: 'fileName', render: (value) => <Tag color="geekblue">{value}</Tag> },
      { title: '审核状态', dataIndex: 'status', width: 100, render: (value) => <StatusTag status={value} /> },
      { title: '材料日期', dataIndex: 'materialDate', width: 120, render: (value) => value || '—' },
      { title: '上传人', dataIndex: 'uploader', width: 110, render: (value) => value || '—' },
      { title: '上传时间', dataIndex: 'uploadedAt', width: 120, render: (value) => value?.slice(0, 10) || '—' },
    ]} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无附件材料" />}</Card>
    <Card size="small" title="审批记录">{records.length ? <ApprovalTimeline records={records} users={users} /> : <Text type="secondary">暂无审批记录</Text>}</Card>
  </Space>;
}
