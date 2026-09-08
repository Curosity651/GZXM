import { useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Drawer, Form, Input, Row, Select, Space, Table, Tag, Upload, message } from 'antd';
import { EditOutlined, FileAddOutlined, SendOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { ACHIEVEMENT_TYPES, type Achievement, type AchievementType } from '../../types';
import { useAppStore } from '../../store';
import { initialAchievementStatus, isEditableAchievementStatus } from '../../domain/achievement';
import { canPerform, filterByTopicScope } from '../../domain/permissions';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusTag } from '../../components/common/StatusTag';

type FormValues = Partial<Achievement> & { uploads?: UploadFile[] };

export function AchievementEntryPage() {
  const state = useAppStore();
  const user = state.currentUser!;
  const canSubmit = canPerform(user, state.roles, 'achievement.submit');
  const primaryTopicId = user.topicIds?.[0] ?? user.topicId;
  const topic = state.topics.find((item) => item.id === primaryTopicId);
  const [form] = Form.useForm<FormValues>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Achievement | null>(null);
  const type = Form.useWatch('achievementType', form) as AchievementType | undefined;
  const selectedTopicId = Form.useWatch('topicId', form) ?? primaryTopicId;
  const availableTopics = filterByTopicScope(user, state.topics);
  const selectedTopic = state.topics.find((item) => item.id === selectedTopicId);
  const achievements = useMemo(() => filterByTopicScope(user, state.achievements), [state.achievements, user]);

  const openCreate = () => { setEditing(null); form.resetFields(); form.setFieldsValue({ topicId: primaryTopicId, achievementType: '学术论文', responsiblePerson: topic?.principalName, projectLabeling: `${state.project.name}（${state.project.code}）` }); setOpen(true); };
  const openEdit = (item: Achievement) => { setEditing(item); form.setFieldsValue(item); setOpen(true); };
  const save = async () => {
    const values = await form.validateFields();
    const now = new Date().toISOString();
    if (editing) state.updateAchievement(editing.id, values);
    else {
      const selectedType = values.achievementType!;
      const indicator = state.indicators.find((item) => item.topicId === selectedTopicId && item.achievementType === selectedType);
      state.addAchievement({
        id: `ach-${Date.now()}`, projectId: state.project.id, topicId: selectedTopicId!, unitId: selectedTopic?.leadingUnitId ?? '',
        achievementType: selectedType, indicatorId: indicator?.id ?? '', nodeId: indicator?.nodeId ?? state.nodes[0]?.id,
        title: values.title!, responsiblePerson: values.responsiblePerson!, progressStatus: values.progressStatus ?? '',
        plannedCompletionDate: values.plannedCompletionDate, status: initialAchievementStatus(selectedType), countsToIndicator: false,
        createdAt: now, updatedAt: now, remarks: values.remarks ?? '', materials: [], ...values,
      } as Achievement);
    }
    message.success('成果草稿已保存'); setOpen(false);
  };
  const submit = (item: Achievement) => {
    const action = item.status === '预审通过' ? 'START_FORMAL' : item.status === '正式成果草稿' || item.status === '正式退回' ? 'SUBMIT_FORMAL' : 'SUBMIT_PRE_REVIEW';
    state.advanceAchievement(item.id, action, user.id);
    message.success(action === 'START_FORMAL' ? '已进入正式成果材料补录阶段' : '已提交审批');
  };

  return <>
    <PageHeader
      title="成果填报"
      description={canSubmit ? `${topic?.name ?? '本课题'} · 论文、专利、软著和标准先预审，人才培养直接进入正式审批。` : '全部课题成果 · 系统管理员只读查看，不参与成果提交或审批。'}
      extra={canSubmit ? <Button type="primary" icon={<FileAddOutlined />} onClick={openCreate}>新增成果</Button> : undefined}
    />
    <Alert type="warning" showIcon title="投稿或申请前请先完成预审，重点核对成果名称、人员顺序、单位排序和项目标注。预审通过不计入指标。" style={{ marginBottom: 16 }} />
    <Card><Table rowKey="id" dataSource={achievements} columns={[
      { title: '成果名称', dataIndex: 'title', render: (value, row) => <div><b>{value}</b><div><Tag>{row.achievementType}</Tag></div></div> },
      { title: '负责人', dataIndex: 'responsiblePerson', width: 110 },
      { title: '当前阶段', dataIndex: 'status', width: 150, render: (value) => <StatusTag status={value} /> },
      { title: '关联节点', dataIndex: 'nodeId', width: 120, render: (value) => state.nodes.find((item) => item.id === value)?.name ?? '未关联' },
      { title: '更新时间', dataIndex: 'updatedAt', width: 120, render: (value) => value?.slice(0, 10) },
      { title: '操作', width: 210, render: (_, row) => canSubmit ? <Space>
        {isEditableAchievementStatus(row.status) && <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(row)}>编辑</Button>}
        {['预审草稿', '预审退回', '正式成果草稿', '正式退回'].includes(row.status) && <Button type="link" icon={<SendOutlined />} onClick={() => submit(row)}>提交</Button>}
        {row.status === '预审通过' && <Button type="primary" size="small" onClick={() => submit(row)}>补录正式材料</Button>}
      </Space> : <Tag>只读</Tag> },
    ]} /></Card>
    <Drawer size={720} title={editing ? '编辑成果' : '新增成果'} open={open} onClose={() => setOpen(false)} extra={<Space><Button onClick={() => setOpen(false)}>取消</Button><Button type="primary" onClick={save}>保存草稿</Button></Space>}>
      <Form form={form} layout="vertical">
        <Form.Item label="所属课题" name="topicId" rules={[{ required: true }]}><Select disabled={Boolean(editing)} options={availableTopics.map((item) => ({ label: `${item.code} ${item.name}`, value: item.id }))} /></Form.Item>
        <Row gutter={16}><Col span={12}><Form.Item label="成果类型" name="achievementType" rules={[{ required: true }]}><Select disabled={Boolean(editing)} options={ACHIEVEMENT_TYPES.map((item) => ({ label: item, value: item }))} /></Form.Item></Col><Col span={12}><Form.Item label="负责人" name="responsiblePerson" rules={[{ required: true }]}><Input /></Form.Item></Col></Row>
        <Form.Item label="成果名称" name="title" rules={[{ required: true, message: '请输入成果名称' }]}><Input placeholder="预审通过后，名称变更需要重新提交审批" /></Form.Item>
        <Row gutter={16}><Col span={12}><Form.Item label="当前进度" name="progressStatus" rules={[{ required: true }]}><Input placeholder="例如：拟投稿、材料准备中" /></Form.Item></Col><Col span={12}><Form.Item label="计划完成日期" name="plannedCompletionDate"><Input type="date" /></Form.Item></Col></Row>
        {type === '学术论文' && <><Row gutter={16}><Col span={12}><Form.Item label="拟投期刊/会议" name="journalName"><Input /></Form.Item></Col><Col span={12}><Form.Item label="第一作者" name="firstAuthor" rules={[{ required: true }]}><Input /></Form.Item></Col></Row><Form.Item label="作者及单位排序" name="signingUnitList" rules={[{ required: true }]}><Input.TextArea rows={2} /></Form.Item></>}
        {type === '发明专利' && <><Form.Item label="发明人及排序" name="inventorList" rules={[{ required: true }]}><Input.TextArea rows={2} /></Form.Item><Form.Item label="申请人及排序" name="applicantList" rules={[{ required: true }]}><Input.TextArea rows={2} /></Form.Item><Form.Item label="申请号（正式阶段填写）" name="applicationNumber"><Input /></Form.Item></>}
        {type === '软件著作权' && <><Row gutter={16}><Col span={12}><Form.Item label="软件全称" name="softwareFullName" rules={[{ required: true }]}><Input /></Form.Item></Col><Col span={12}><Form.Item label="版本号" name="version"><Input /></Form.Item></Col></Row><Form.Item label="著作权人及排序" name="copyrightOwnerList" rules={[{ required: true }]}><Input /></Form.Item><Form.Item label="主要开发人" name="mainDevelopers"><Input /></Form.Item></>}
        {type === '标准规范' && <><Row gutter={16}><Col span={12}><Form.Item label="标准级别" name="standardLevel"><Select options={['国家标准', '行业标准', '团体标准', '企业标准'].map((item) => ({ label: item, value: item }))} /></Form.Item></Col><Col span={12}><Form.Item label="当前阶段" name="currentStage"><Input /></Form.Item></Col></Row><Form.Item label="起草单位及排序" name="participatingUnits" rules={[{ required: true }]}><Input /></Form.Item><Form.Item label="起草人及排序" name="drafters"><Input /></Form.Item></>}
        {type === '人才培养' && <><Row gutter={16}><Col span={12}><Form.Item label="学生姓名" name="studentName" rules={[{ required: true }]}><Input /></Form.Item></Col><Col span={12}><Form.Item label="培养层次" name="educationLevel"><Select options={['硕士', '博士'].map((item) => ({ label: item, value: item }))} /></Form.Item></Col></Row><Form.Item label="学位论文题目" name="thesisTitle"><Input /></Form.Item></>}
        <Form.Item label="项目标注" name="projectLabeling" rules={[{ required: type !== '人才培养' }]}><Input /></Form.Item>
        <Form.Item label={editing?.status.includes('正式') ? '正式佐证材料' : '预审材料'}><Upload beforeUpload={() => false} multiple><Button icon={<UploadOutlined />}>选择文件（Mock）</Button></Upload></Form.Item>
        <Form.Item label="备注" name="remarks"><Input.TextArea rows={3} /></Form.Item>
      </Form>
    </Drawer>
  </>;
}
