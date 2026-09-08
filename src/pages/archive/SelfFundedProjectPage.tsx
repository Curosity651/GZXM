import { useState } from 'react';
import { Button, Card, Col, Drawer, Form, Input, InputNumber, Modal, Progress, Row, Select, Space, Tag, message } from 'antd';
import { FileAddOutlined, FolderOpenOutlined } from '@ant-design/icons';
import type { SelfFundedProject } from '../../types';
import { useAppStore } from '../../store';
import { archiveCompletion } from '../../domain/archive';
import { canPerform } from '../../domain/permissions';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusTag } from '../../components/common/StatusTag';
import { RequirementChecklist } from '../../components/archive/RequirementChecklist';

const templateMap = { 科技项目: 'tpl-tech-v1', 技改项目: 'tpl-renovation-v1', 基建项目: 'tpl-infrastructure-v1' } as const;

export function SelfFundedProjectPage() {
  const state = useAppStore();
  const user = state.currentUser!;
  const projects = state.selfFundedProjects.filter((item) => user.role !== '课题牵头单位' || item.topicId === user.topicId);
  const editable = canPerform(user.role, 'self-funded.manage');
  const [form] = Form.useForm<Partial<SelfFundedProject>>();
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState<SelfFundedProject | null>(null);
  const requirementsFor = (project: SelfFundedProject) => state.archiveRequirements.filter((item) => item.ownerType === 'SELF_FUNDED' && item.templateId === project.templateSnapshotId);
  const addProject = async () => {
    const values = await form.validateFields(); const projectType = values.projectType!;
    state.addSelfFundedProject({ id: `sf-${Date.now()}`, topicId: user.topicId!, code: values.code!, name: values.name!, projectType, principalName: values.principalName!, implementingUnit: values.implementingUnit!, startDate: values.startDate, endDate: values.endDate, budget: values.budget, status: values.status ?? '筹备中', templateSnapshotId: templateMap[projectType], remarks: values.remarks }, user.id);
    setModal(false); form.resetFields(); message.success('配套自筹项目已创建，并已生成对应类型的归档清单快照');
  };
  const cardActions = (project: SelfFundedProject) => [<Button key={`open-${project.id}`} type="link" onClick={() => setSelected(project)}>进入归档</Button>];
  return <>
    <PageHeader title="配套自筹项目" description="配套自筹项目只用于材料归档，不承接科研指标，也不单独提交月报或季报。" extra={editable && <Button type="primary" icon={<FileAddOutlined />} onClick={() => setModal(true)}>新建自筹项目</Button>} />
    <Row gutter={[16, 16]}>{projects.map((project) => { const completion = archiveCompletion(requirementsFor(project), state.archiveSubmissions.filter((item) => item.ownerType === 'SELF_FUNDED' && item.ownerId === project.id)); return <Col xs={24} xl={12} key={project.id}><Card hoverable title={<Space><FolderOpenOutlined /><span>{project.name}</span></Space>} extra={<StatusTag status={project.status} />} actions={cardActions(project)}><Space direction="vertical" style={{ width: '100%' }}><Space><Tag color="blue">{project.projectType}</Tag><Tag>{project.code}</Tag></Space><div>项目负责人：{project.principalName}　实施单位：{project.implementingUnit}</div><Progress percent={completion.rate} status={completion.rate < 50 ? 'exception' : 'active'} /><div>{completion.completed}/{completion.required} 项材料终审通过</div></Space></Card></Col>; })}</Row>
    <Modal title="新建配套自筹项目" open={modal} onCancel={() => setModal(false)} onOk={addProject} width={680}><Form form={form} layout="vertical"><Row gutter={16}><Col span={12}><Form.Item label="项目编号" name="code" rules={[{ required: true }]}><Input /></Form.Item></Col><Col span={12}><Form.Item label="项目类型" name="projectType" rules={[{ required: true }]}><Select options={Object.keys(templateMap).map((item) => ({ label: item, value: item }))} /></Form.Item></Col></Row><Form.Item label="项目名称" name="name" rules={[{ required: true }]}><Input /></Form.Item><Row gutter={16}><Col span={12}><Form.Item label="项目负责人" name="principalName" rules={[{ required: true }]}><Input /></Form.Item></Col><Col span={12}><Form.Item label="实施单位" name="implementingUnit" rules={[{ required: true }]}><Input /></Form.Item></Col></Row><Row gutter={16}><Col span={8}><Form.Item label="开始日期" name="startDate"><Input type="date" /></Form.Item></Col><Col span={8}><Form.Item label="结束日期" name="endDate"><Input type="date" /></Form.Item></Col><Col span={8}><Form.Item label="预算（万元）" name="budget"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col></Row><Form.Item label="状态" name="status" initialValue="筹备中"><Select options={['筹备中', '实施中', '验收中', '已完成'].map((item) => ({ label: item, value: item }))} /></Form.Item></Form></Modal>
    <Drawer width="88%" title={selected ? `${selected.name} · ${selected.projectType}归档清单` : ''} open={Boolean(selected)} onClose={() => setSelected(null)}>{selected && <RequirementChecklist requirements={requirementsFor(selected)} ownerType="SELF_FUNDED" ownerId={selected.id} topicId={selected.topicId} editable={editable && selected.topicId === user.topicId} />}</Drawer>
  </>;
}
