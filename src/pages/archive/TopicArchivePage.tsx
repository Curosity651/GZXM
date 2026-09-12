import { useState } from 'react';
import { Button, Card, Col, Form, Input, Modal, Progress, Row, Select, Space, Tag, Drawer, message } from 'antd';
import { DeleteOutlined, FileAddOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { useAppStore } from '../../store';
import { canPerform } from '../../domain/permissions';
import { accessibleTopics, canViewAllTopicUnitData, isGlobalUser } from '../../domain/topic-access';
import { archiveCompletion } from '../../domain/archive';
import { RequirementChecklist } from '../../components/archive/RequirementChecklist';
import type { ArchiveRequirement } from '../../types';

export function TopicArchivePage() {
  const state = useAppStore();
  const user = state.currentUser!;
  const topics = accessibleTopics(user, state.topics, state.topicMemberships);
  const [topicFilter, setTopicFilter] = useState<string>();
  const [unitFilter, setUnitFilter] = useState<string>();
  const [selectedTopicId, setSelectedTopicId] = useState<string>();
  const [selectedFolder, setSelectedFolder] = useState<ArchiveRequirement | null>(null);
  const [addFolderOpen, setAddFolderOpen] = useState(false);
  const [form] = Form.useForm<{ name: string }>();
  const visibleTopics = topics.filter((topic) => !topicFilter || topic.id === topicFilter);
  const memberships = state.topicMemberships.filter((item) => item.enabled && visibleTopics.some((topic) => topic.id === item.topicId));
  const units = state.units.filter((unit) => memberships.some((item) => item.unitId === unit.id));
  const canManageFolders = canPerform(user, state.roles, 'archive.topic.submit') && Boolean(user.unitId);
  const selectedTopic = topics.find((topic) => topic.id === selectedTopicId);
  const selectedMembers = selectedTopic ? state.topicMemberships.filter((item) => item.topicId === selectedTopic.id && item.enabled) : [];
  const selectedVisibleMembers = selectedTopic && canViewAllTopicUnitData(user, selectedTopic.id, state.topicMemberships) ? selectedMembers : selectedMembers.filter((item) => item.unitId === user.unitId);
  const selectedUnitId = unitFilter && selectedVisibleMembers.some((item) => item.unitId === unitFilter) ? unitFilter : selectedVisibleMembers[0]?.unitId;
  const requirements = state.archiveRequirements.filter((item) => item.ownerType === 'TOPIC_NATIONAL');
  const getFolders = (topicId: string) => requirements.filter((item) => !item.templateId && (!item.topicId || item.topicId === topicId));
  const submitFolder = async () => {
    const { name } = await form.validateFields();
    state.addArchiveRequirement({ id: `ar-topic-custom-${Date.now()}`, projectId: 'p1', categoryId: 'ac-1', topicId: selectedTopicId, name, required: true, requiredQuantity: 1, ownerType: 'TOPIC_NATIONAL', requirementKind: 'REQUIRED' });
    setAddFolderOpen(false); form.resetFields(); message.success('自定义材料文件夹已创建');
  };
  const removeFolder = (folder: ArchiveRequirement) => {
    if (folder.sourceCode) return;
    Modal.confirm({ title: '删除自定义文件夹', content: `确定删除“${folder.name}”吗？`, okText: '删除', okType: 'danger', cancelText: '取消', onOk: () => { state.removeArchiveRequirement(folder.id); if (selectedFolder?.id === folder.id) setSelectedFolder(null); message.success('文件夹已删除'); } });
  };
  const folderCard = (folder: ArchiveRequirement, topicId: string, unitId?: string) => {
    const completion = archiveCompletion([folder], state.archiveSubmissions.filter((item) => item.ownerType === 'TOPIC_NATIONAL' && item.ownerId === `${topicId}:${unitId}`));
    return <Col xs={24} sm={12} lg={8} xl={6} key={folder.id}><Card size="small" hoverable className="archive-folder-card" onClick={() => setSelectedFolder(folder)}><Space align="start"><FolderOpenOutlined className="archive-folder-icon" /><div><div className="archive-folder-name">{folder.name}</div><div className="archive-folder-meta">{folder.sourceCode ? `清单材料 · ${folder.sourceCode}` : '自定义材料文件夹'}</div><Progress percent={completion.rate} size="small" showInfo={false} /><span className="archive-folder-count">{completion.completed}/{completion.required} 已归档</span></div></Space>{!folder.sourceCode && canManageFolders && <Button type="text" danger size="small" className="archive-folder-delete" icon={<DeleteOutlined />} onClick={(event) => { event.stopPropagation(); removeFolder(folder); }} />}</Card></Col>;
  };
  return <>
    <Card className="archive-filter-card" style={{ marginBottom: 16 }}><Space wrap size={16}><b>课题</b><Select allowClear value={topicFilter} onChange={setTopicFilter} style={{ width: 360 }} placeholder="全部课题" options={topics.map((item) => ({ label: `${item.code} ${item.name}`, value: item.id }))} /><b>提交单位</b><Select allowClear value={unitFilter} onChange={setUnitFilter} style={{ width: 320 }} placeholder={isGlobalUser(user) ? '全部单位' : '本单位'} options={units.map((item) => ({ label: item.name, value: item.id }))} /></Space></Card>
    <Card className="archive-content-card" title="课题国家材料"><Row gutter={[16, 16]}>{visibleTopics.map((topic) => { const members = state.topicMemberships.filter((item) => item.topicId === topic.id && item.enabled); const visible = canViewAllTopicUnitData(user, topic.id, state.topicMemberships) ? members : members.filter((item) => item.unitId === user.unitId); const currentUnit = unitFilter && visible.some((item) => item.unitId === unitFilter) ? unitFilter : visible[0]?.unitId; const folders = getFolders(topic.id); const completion = archiveCompletion(folders, state.archiveSubmissions.filter((item) => item.ownerType === 'TOPIC_NATIONAL' && item.ownerId === `${topic.id}:${currentUnit}`)); return <Col xs={24} xl={12} key={topic.id}><Card hoverable title={<Space><FolderOpenOutlined /><span>{topic.name}</span></Space>} extra={<Tag color="blue">国家材料</Tag>} actions={[<Button type="link" key="open" onClick={() => { setSelectedTopicId(topic.id); setSelectedFolder(null); }}>进入课题材料</Button>]}><Space direction="vertical" style={{ width: '100%' }}><Space wrap><Tag color="blue">{topic.code}</Tag><Tag>{state.units.find((unit) => unit.id === currentUnit)?.name ?? '未指定单位'}</Tag></Space><div>材料文件夹：{folders.length} 个　参与单位：{visible.length} 个</div><Progress percent={completion.rate} status={completion.rate < 50 ? 'exception' : 'active'} /><div>{completion.completed}/{completion.required} 项材料已归档</div></Space></Card></Col>; })}</Row></Card>
    <Drawer width="78%" title={selectedTopic ? `${selectedTopic.name} · 国家材料文件夹` : ''} open={Boolean(selectedTopicId)} onClose={() => { setSelectedTopicId(undefined); setSelectedFolder(null); }} extra={canManageFolders && <Button type="primary" icon={<FileAddOutlined />} onClick={() => setAddFolderOpen(true)}>新增文件夹</Button>}><Row gutter={[16, 16]}>{selectedTopic && selectedUnitId && getFolders(selectedTopic.id).map((folder) => folderCard(folder, selectedTopic.id, selectedUnitId))}</Row></Drawer>
    <Drawer width="72%" title={selectedFolder ? `${selectedFolder.name} · 文件管理` : ''} open={Boolean(selectedFolder)} onClose={() => setSelectedFolder(null)}>{selectedFolder && selectedTopic && selectedUnitId && <RequirementChecklist requirements={[selectedFolder]} ownerType="TOPIC_NATIONAL" ownerId={`${selectedTopic.id}:${selectedUnitId}`} topicId={selectedTopic.id} unitId={selectedUnitId} editable={canManageFolders && selectedUnitId === user.unitId} />}</Drawer>
    <Modal title="新增自定义材料文件夹" open={addFolderOpen} onCancel={() => setAddFolderOpen(false)} onOk={submitFolder} okText="创建" cancelText="取消"><Form form={form} layout="vertical"><Form.Item name="name" label="文件夹名称" rules={[{ required: true, message: '请输入文件夹名称' }]}><Input placeholder="例如：补充说明材料" maxLength={40} /></Form.Item></Form></Modal>
  </>;
}
