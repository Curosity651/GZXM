import { useState } from 'react';
import { Button, Card, Col, Drawer, Form, Input, message, Modal, Progress, Row, Select, Space, Tag } from 'antd';
import { DeleteOutlined, FileAddOutlined, FolderOpenOutlined, TeamOutlined } from '@ant-design/icons';
import { useAppStore } from '../../store';
import { canPerform } from '../../domain/permissions';
import { accessibleTopics, canViewAllTopicUnitData, isGlobalUser, isTopicOperational } from '../../domain/topic-access';
import { archiveCompletion, isArchiveRequirementComplete, topicArchiveRequirements } from '../../domain/archive';
import { ArchiveFolderFileList } from '../../components/archive/ArchiveFolderFileList';
import type { ArchiveRequirement, TopicUnitMembership } from '../../types';

export function TopicArchivePage() {
  const state = useAppStore();
  const user = state.currentUser!;
  const topics = accessibleTopics(user, state.topics, state.topicMemberships);
  const [topicFilter, setTopicFilter] = useState<string>();
  const [unitFilter, setUnitFilter] = useState<string>();
  const [selectedTopicId, setSelectedTopicId] = useState<string>();
  const [selectedUnitId, setSelectedUnitId] = useState<string>();
  const [selectedFolder, setSelectedFolder] = useState<ArchiveRequirement | null>(null);
  const [addFolderOpen, setAddFolderOpen] = useState(false);
  const [form] = Form.useForm<{ name: string }>();

  const canManageFolders = canPerform(user, state.roles, 'archive.topic.submit') && Boolean(user.unitId);
  const getFolders = (topicId: string, unitId: string) => topicArchiveRequirements(state.archiveRequirements, topicId, unitId);
  const getTopicMembers = (topicId: string) => state.topicMemberships.filter((item) => item.topicId === topicId && item.enabled);
  const getVisibleMembers = (topicId: string) => {
    const members = getTopicMembers(topicId);
    return canViewAllTopicUnitData(user, topicId, state.topicMemberships)
      ? members
      : members.filter((item) => item.unitId === user.unitId);
  };
  const getUnitSubmissions = (topicId: string, unitId: string) => state.archiveSubmissions.filter(
    (item) => item.ownerType === 'TOPIC_NATIONAL' && item.ownerId === `${topicId}:${unitId}`,
  );
  const getUnitFileCount = (topicId: string, unitId: string) => getUnitSubmissions(topicId, unitId)
    .reduce((total, item) => total + (item.files?.length || item.fileIds.length), 0);
  const getAggregateCompletion = (topicId: string, members: TopicUnitMembership[]) => {
    const totals = members.map((member) => archiveCompletion(getFolders(topicId, member.unitId), getUnitSubmissions(topicId, member.unitId)));
    const required = totals.reduce((sum, item) => sum + item.required, 0);
    const completed = totals.reduce((sum, item) => sum + item.completed, 0);
    return { required, completed, rate: required === 0 ? 100 : Math.round((completed / required) * 100) };
  };

  const accessibleMemberships = topics.flatMap((topic) => getVisibleMembers(topic.id));
  const units = state.units.filter((unit) => accessibleMemberships.some((item) => item.unitId === unit.id));
  const visibleTopics = topics.filter((topic) => {
    if (topicFilter && topic.id !== topicFilter) return false;
    return !unitFilter || getVisibleMembers(topic.id).some((item) => item.unitId === unitFilter);
  });
  const selectedTopic = topics.find((topic) => topic.id === selectedTopicId);
  const selectedMembers = selectedTopic ? getVisibleMembers(selectedTopic.id) : [];
  const selectedUnitDirectories = unitFilter
    ? selectedMembers.filter((item) => item.unitId === unitFilter)
    : selectedMembers;
  const selectedUnit = state.units.find((item) => item.id === selectedUnitId);
  const selectedMembership = selectedMembers.find((item) => item.unitId === selectedUnitId);
  const canManageSelectedUnit = canManageFolders && isTopicOperational(selectedTopic) && selectedUnitId === user.unitId;

  const resetDrillDown = () => {
    setSelectedTopicId(undefined);
    setSelectedUnitId(undefined);
    setSelectedFolder(null);
  };

  const submitFolder = async () => {
    if (!selectedTopicId || !selectedUnitId || selectedUnitId !== user.unitId) return message.warning('只能在本单位材料中新增文件夹');
    const { name } = await form.validateFields();
    try {
      state.addArchiveRequirement({
        id: `ar-topic-custom-${Date.now()}`,
        projectId: state.project.id,
        categoryId: 'ac-1',
        topicId: selectedTopicId,
        unitId: selectedUnitId,
        name: name.trim(),
        required: true,
        requiredQuantity: 1,
        ownerType: 'TOPIC_NATIONAL',
        requirementKind: 'REQUIRED',
      }, user.id);
    } catch (error) {
      return message.warning(error instanceof Error ? error.message : '无法创建文件夹');
    }
    setAddFolderOpen(false);
    form.resetFields();
    message.success('自定义材料文件夹已创建');
  };

  const removeFolder = (folder: ArchiveRequirement) => {
    if (folder.sourceCode) return;
    const hasFiles = state.archiveSubmissions.some((item) => item.requirementId === folder.id && ((item.files?.length ?? 0) > 0 || item.fileIds.length > 0));
    if (hasFiles) return message.warning('该文件夹中已有材料，请先删除文件后再删除文件夹');
    Modal.confirm({
      title: '删除自定义文件夹',
      content: `确定删除“${folder.name}”吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        try {
          state.removeArchiveRequirement(folder.id, user.id);
          if (selectedFolder?.id === folder.id) setSelectedFolder(null);
          message.success('文件夹已删除');
        } catch (error) {
          message.warning(error instanceof Error ? error.message : '无法删除文件夹');
        }
      },
    });
  };

  const folderCard = (folder: ArchiveRequirement, topicId: string, unitId: string) => {
    const submission = state.archiveSubmissions.find(
      (item) => item.ownerType === 'TOPIC_NATIONAL' && item.ownerId === `${topicId}:${unitId}` && item.requirementId === folder.id,
    );
    const fileCount = submission?.files?.length || submission?.fileIds.length || 0;
    const complete = isArchiveRequirementComplete(folder, submission);
    return <Col xs={24} sm={12} lg={8} xl={6} key={folder.id}>
      <Card size="small" hoverable className="archive-folder-card" onClick={() => setSelectedFolder(folder)}>
        <Space align="start">
          <FolderOpenOutlined className="archive-folder-icon" />
          <div>
            <div className="archive-folder-name">{folder.name}</div>
            <div className="archive-folder-meta">{folder.sourceCode ? `清单材料 · ${folder.sourceCode}` : '自定义材料文件夹'}</div>
            <Progress percent={complete ? 100 : 0} size="small" showInfo={false} />
            <span className="archive-folder-count">{fileCount ? `${fileCount} 个文件 · 已提交` : '暂无文件'}</span>
          </div>
        </Space>
        {!folder.sourceCode && canManageSelectedUnit && <Button
          type="text"
          danger
          size="small"
          className="archive-folder-delete"
          icon={<DeleteOutlined />}
          onClick={(event) => {
            event.stopPropagation();
            removeFolder(folder);
          }}
        />}
      </Card>
    </Col>;
  };

  const unitDirectoryCard = (member: TopicUnitMembership) => {
    if (!selectedTopic) return null;
    const unit = state.units.find((item) => item.id === member.unitId);
    const folders = getFolders(selectedTopic.id, member.unitId);
    const completion = archiveCompletion(folders, getUnitSubmissions(selectedTopic.id, member.unitId));
    const fileCount = getUnitFileCount(selectedTopic.id, member.unitId);
    const editable = canManageFolders && member.unitId === user.unitId;
    return <Col xs={24} md={12} xl={8} key={member.id}>
      <Card
        hoverable
        className="archive-unit-directory-card"
        title={<Space><span className="archive-unit-directory-icon"><TeamOutlined /></span><span>{unit?.name ?? '未命名单位'}</span></Space>}
        extra={<Tag color={member.membershipType === 'LEAD' ? 'blue' : 'default'}>{member.membershipType === 'LEAD' ? '牵头单位' : '承担单位'}</Tag>}
        actions={[<Button type="link" key="open" onClick={() => { setSelectedUnitId(member.unitId); setSelectedFolder(null); }}>进入单位材料</Button>]}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space wrap>
            <Tag color={editable ? 'green' : 'default'}>{editable ? '可填报' : '仅查看'}</Tag>
            <span>材料文件夹：{folders.length} 个</span>
            <span>已上传：{fileCount} 个文件</span>
          </Space>
          <Progress percent={completion.rate} status={completion.rate < 50 ? 'exception' : 'active'} />
          <div>{completion.completed}/{completion.required} 项必存材料已提交</div>
        </Space>
      </Card>
    </Col>;
  };

  return <>
    <Card className="archive-filter-card" style={{ marginBottom: 16 }}>
      <Space wrap size={16}>
        <b>课题</b>
        <Select
          allowClear
          value={topicFilter}
          onChange={(value) => { setTopicFilter(value); resetDrillDown(); }}
          style={{ width: 360 }}
          placeholder="全部课题"
          options={topics.map((item) => ({ label: `${item.code} ${item.name}`, value: item.id }))}
        />
        <b>承担单位</b>
        <Select
          allowClear
          value={unitFilter}
          onChange={(value) => { setUnitFilter(value); resetDrillDown(); }}
          style={{ width: 320 }}
          placeholder={isGlobalUser(user) ? '全部单位' : '权限范围内单位'}
          options={units.map((item) => ({ label: item.name, value: item.id }))}
        />
      </Space>
    </Card>

    <Card className="archive-content-card" title="课题国家材料">
      <Row gutter={[16, 16]}>
        {visibleTopics.map((topic) => {
          const visibleMembers = getVisibleMembers(topic.id).filter((item) => !unitFilter || item.unitId === unitFilter);
          const sharedFolderCount = state.archiveRequirements.filter((item) => item.ownerType === 'TOPIC_NATIONAL' && item.sourceCode && (!item.topicId || item.topicId === topic.id)).length;
          const completion = getAggregateCompletion(topic.id, visibleMembers);
          return <Col xs={24} xl={12} key={topic.id}>
            <Card
              hoverable
              title={<Space><FolderOpenOutlined /><span>{topic.name}</span></Space>}
              extra={<Tag color="blue">国家材料</Tag>}
              actions={[<Button type="link" key="open" onClick={() => { setSelectedTopicId(topic.id); setSelectedUnitId(undefined); setSelectedFolder(null); }}>进入课题材料</Button>]}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space wrap><Tag color="blue">{topic.code}</Tag><Tag>承担单位 {visibleMembers.length} 家</Tag></Space>
                <div>国家清单文件夹：{sharedFolderCount} 个</div>
                <Progress percent={completion.rate} status={completion.rate < 50 ? 'exception' : 'active'} />
                <div>{completion.completed}/{completion.required} 项必存材料已提交</div>
              </Space>
            </Card>
          </Col>;
        })}
      </Row>
    </Card>

    <Drawer
      width="78%"
      title={selectedTopic ? `${selectedTopic.name} · 课题承担单位` : ''}
      open={Boolean(selectedTopicId)}
      onClose={resetDrillDown}
    >
      <div className="archive-directory-hint">请先进入对应的课题承担单位，再查看或填报该单位的国家材料。</div>
      <Row gutter={[16, 16]}>{selectedUnitDirectories.map(unitDirectoryCard)}</Row>
    </Drawer>

    <Drawer
      width="78%"
      title={selectedTopic && selectedUnit ? `${selectedTopic.code} · ${selectedUnit.name} · 国家材料文件夹` : ''}
      open={Boolean(selectedUnitId)}
      onClose={() => { setSelectedUnitId(undefined); setSelectedFolder(null); }}
      extra={canManageSelectedUnit && <Button type="primary" icon={<FileAddOutlined />} onClick={() => setAddFolderOpen(true)}>新增文件夹</Button>}
    >
      {selectedMembership && <div className="archive-directory-hint">
        <Space wrap>
          <Tag color={selectedMembership.membershipType === 'LEAD' ? 'blue' : 'default'}>{selectedMembership.membershipType === 'LEAD' ? '牵头单位' : '承担单位'}</Tag>
          <span>{canManageSelectedUnit ? '您可上传、补充和删除本单位材料。' : '当前为查看权限，不可修改该单位材料。'}</span>
        </Space>
      </div>}
      <Row gutter={[16, 16]}>
        {selectedTopic && selectedUnitId && getFolders(selectedTopic.id, selectedUnitId).map((folder) => folderCard(folder, selectedTopic.id, selectedUnitId))}
      </Row>
    </Drawer>

    <Drawer
      width="78%"
      title={selectedFolder && selectedUnit ? `${selectedUnit.name} · ${selectedFolder.name} · 文件管理` : ''}
      open={Boolean(selectedFolder)}
      onClose={() => setSelectedFolder(null)}
    >
      {selectedFolder && selectedTopic && selectedUnitId && <ArchiveFolderFileList
        requirement={selectedFolder}
        ownerType="TOPIC_NATIONAL"
        ownerId={`${selectedTopic.id}:${selectedUnitId}`}
        topicId={selectedTopic.id}
        unitId={selectedUnitId}
        editable={canManageSelectedUnit}
      />}
    </Drawer>

    <Modal
      title="新增自定义材料文件夹"
      open={addFolderOpen}
      onCancel={() => setAddFolderOpen(false)}
      onOk={submitFolder}
      okText="创建"
      cancelText="取消"
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="文件夹名称" rules={[{ required: true, message: '请输入文件夹名称' }]}>
          <Input placeholder="例如：补充说明材料" maxLength={40} />
        </Form.Item>
      </Form>
    </Modal>
  </>;
}
