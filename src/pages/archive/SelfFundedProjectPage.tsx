import { useState } from 'react';
import { Button, Card, Col, Drawer, Form, Input, InputNumber, Modal, Progress, Row, Select, Space, Tag, message } from 'antd';
import { FileAddOutlined, FolderOpenOutlined } from '@ant-design/icons';
import type { ArchiveRequirement, SelfFundedProject } from '../../types';
import { useAppStore } from '../../store';
import { archiveCompletion, isArchiveRequirementComplete } from '../../domain/archive';
import { canPerform } from '../../domain/permissions';
import { accessibleTopics, canAccessTopicByMembership, isGlobalUser, isInternalTopicUnit, isTopicLead, isTopicOperational } from '../../domain/topic-access';
import { StatusTag } from '../../components/common/StatusTag';
import { ArchiveFolderFileList } from '../../components/archive/ArchiveFolderFileList';

const templateMap = { 科技项目: 'tpl-tech-v1', 技改项目: 'tpl-renovation-v1', 基建项目: 'tpl-infrastructure-v1' } as const;

export function SelfFundedProjectPage() {
  const state = useAppStore();
  const user = state.currentUser!;
  const topics = accessibleTopics(user, state.topics, state.topicMemberships);
  const projects = state.selfFundedProjects.filter((project) => isGlobalUser(user) || (canAccessTopicByMembership(user, project.topicId, state.topicMemberships) && (project.ownerUnitId === user.unitId || isTopicLead(user, project.topicId, state.topicMemberships))));
  const editable = isInternalTopicUnit(user) && canPerform(user, state.roles, 'self-funded.manage');
  const editableTopics = topics.filter(isTopicOperational);
  const primaryTopicId = editableTopics[0]?.id;
  const [form] = Form.useForm<Partial<SelfFundedProject>>();
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState<SelfFundedProject | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<ArchiveRequirement | null>(null);
  const [topicFilter, setTopicFilter] = useState(primaryTopicId);
  const [unitFilter, setUnitFilter] = useState(isGlobalUser(user) ? undefined : user.unitId);
  const filteredProjects = projects.filter((project) => (!topicFilter || project.topicId === topicFilter) && (!unitFilter || project.ownerUnitId === unitFilter));
  const unitOptions = state.units.filter((unit) => projects.some((project) => project.ownerUnitId === unit.id)).map((unit) => ({ label: unit.name, value: unit.id }));
  const requirementsFor = (project: SelfFundedProject) => state.archiveRequirements.filter((item) => item.ownerType === 'SELF_FUNDED' && item.templateId === project.templateSnapshotId);
  const addProject = async () => {
    const values = await form.validateFields(); const projectType = values.projectType!;
    state.addSelfFundedProject({ id: `sf-${Date.now()}`, topicId: values.topicId ?? primaryTopicId!, ownerUnitId: user.unitId!, code: values.code!, name: values.name!, projectType, principalName: values.principalName!, implementingUnit: state.units.find((item) => item.id === user.unitId)?.name ?? user.name, startDate: values.startDate, endDate: values.endDate, budget: values.budget, status: values.status ?? '筹备中', templateSnapshotId: templateMap[projectType], remarks: values.remarks }, user.id);
    setModal(false); form.resetFields(); message.success('配套自筹项目已创建，并已生成对应类型的归档清单快照');
  };
  const cardActions = (project: SelfFundedProject) => [<Button key={`open-${project.id}`} type="link" onClick={() => { setSelected(project); setSelectedFolder(null); }}>进入归档</Button>];
  const folderCard = (folder: ArchiveRequirement, project: SelfFundedProject) => {
    const submission = state.archiveSubmissions.find((item) => item.ownerType === 'SELF_FUNDED' && item.ownerId === project.id && item.requirementId === folder.id);
    const fileCount = submission?.fileIds.length ?? 0;
    const complete = isArchiveRequirementComplete(folder, submission);
    return <Col xs={24} sm={12} lg={8} xl={6} key={folder.id}><Card size="small" hoverable className="archive-folder-card" onClick={() => setSelectedFolder(folder)}><Space align="start"><FolderOpenOutlined className="archive-folder-icon" /><div><div className="archive-folder-name">{folder.name}</div><div className="archive-folder-meta">{folder.requirementKind === 'REQUIRED' ? '必存材料' : '有则必存'} · 至少 {folder.requiredQuantity} 份</div><Progress percent={complete ? 100 : 0} size="small" showInfo={false} /><span className="archive-folder-count">{fileCount ? `${fileCount} 个文件 · 已提交` : '暂无文件'}</span></div></Space></Card></Col>;
  };
  return <>
    <Card className="archive-filter-card" style={{ marginBottom: 16 }}>
      <Space wrap size={16}>
        <b>课题</b><Select allowClear value={topicFilter} onChange={setTopicFilter} style={{ width: 360 }} placeholder="全部课题" options={topics.map((item) => ({ label: `${item.code} ${item.name}`, value: item.id }))} />
        <b>提交单位</b><Select allowClear value={unitFilter} onChange={setUnitFilter} style={{ width: 320 }} placeholder="全部单位" options={unitOptions} />
      </Space>
    </Card>
    {editable && editableTopics.length > 0 && <div className="archive-page-actions"><Button type="primary" icon={<FileAddOutlined />} onClick={() => setModal(true)}>新建自筹项目</Button></div>}
    <Card className="archive-content-card">
      <Row gutter={[16, 16]}>{filteredProjects.map((project) => { const completion = archiveCompletion(requirementsFor(project), state.archiveSubmissions.filter((item) => item.ownerType === 'SELF_FUNDED' && item.ownerId === project.id)); return <Col xs={24} xl={12} key={project.id}><Card hoverable title={<Space><FolderOpenOutlined /><span>{project.name}</span></Space>} extra={<StatusTag status={project.status} />} actions={cardActions(project)}><Space direction="vertical" style={{ width: '100%' }}><Space><Tag color="blue">{project.projectType}</Tag><Tag>{project.code}</Tag><Tag>{state.units.find((item) => item.id === project.ownerUnitId)?.name ?? project.ownerUnitId}</Tag></Space><div>项目负责人：{project.principalName}　实施单位：{project.implementingUnit}</div><Progress percent={completion.rate} status={completion.rate < 50 ? 'exception' : 'active'} /><div>{completion.completed}/{completion.required} 项必存材料已提交</div></Space></Card></Col>; })}</Row>
    </Card>
    <Modal title="新建配套自筹项目" open={modal} onCancel={() => setModal(false)} onOk={addProject} width={680}><Form form={form} layout="vertical" initialValues={{ topicId: primaryTopicId }}><Form.Item label="所属课题" name="topicId" rules={[{ required: true }]}><Select options={editableTopics.map((item) => ({ label: `${item.code} ${item.name}`, value: item.id }))} /></Form.Item><Row gutter={16}><Col span={12}><Form.Item label="项目编号" name="code" rules={[{ required: true }]}><Input /></Form.Item></Col><Col span={12}><Form.Item label="项目类型" name="projectType" rules={[{ required: true }]}><Select options={Object.keys(templateMap).map((item) => ({ label: item, value: item }))} /></Form.Item></Col></Row><Form.Item label="项目名称" name="name" rules={[{ required: true }]}><Input /></Form.Item><Row gutter={16}><Col span={12}><Form.Item label="项目负责人" name="principalName" rules={[{ required: true }]}><Input /></Form.Item></Col><Col span={12}><Form.Item label="实施单位"><Input value={state.units.find((item) => item.id === user.unitId)?.name} disabled /></Form.Item></Col></Row><Row gutter={16}><Col span={8}><Form.Item label="开始日期" name="startDate"><Input type="date" /></Form.Item></Col><Col span={8}><Form.Item label="结束日期" name="endDate"><Input type="date" /></Form.Item></Col><Col span={8}><Form.Item label="预算（万元）" name="budget"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col></Row><Form.Item label="状态" name="status" initialValue="筹备中"><Select options={['筹备中', '实施中', '验收中', '已完成'].map((item) => ({ label: item, value: item }))} /></Form.Item></Form></Modal>
    <Drawer width="78%" title={selected ? `${selected.name} · 自筹材料文件夹` : ''} open={Boolean(selected)} onClose={() => { setSelected(null); setSelectedFolder(null); }}>{selected && <Row gutter={[16, 16]}>{requirementsFor(selected).map((folder) => folderCard(folder, selected))}</Row>}</Drawer>
    <Drawer width="78%" title={selectedFolder ? `${selectedFolder.name} · 文件管理` : ''} open={Boolean(selectedFolder)} onClose={() => setSelectedFolder(null)}>{selected && selectedFolder && <ArchiveFolderFileList requirement={selectedFolder} ownerType="SELF_FUNDED" ownerId={selected.id} topicId={selected.topicId} unitId={selected.ownerUnitId} editable={editable && selected.ownerUnitId === user.unitId && isTopicOperational(state.topics.find((topic) => topic.id === selected.topicId))} />}</Drawer>
  </>;
}
