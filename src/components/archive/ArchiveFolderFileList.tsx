import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Modal, Space, Table, Tag, Upload, message } from 'antd';
import { DeleteOutlined, DownloadOutlined, EyeOutlined, FileOutlined, UploadOutlined } from '@ant-design/icons';
import type { ArchiveOwnerType } from '../../domain/archive-flow';
import type { ArchiveRequirement, ArchiveSubmission, ArchiveSubmissionFile } from '../../types';
import { useAppStore } from '../../store';

const legacyFileNames: Record<string, string> = {
  'file-project-application': '项目申报书.pdf',
  'file-ip-proof': '知识产权证明材料.pdf',
  'file-initiation': '项目立项文件.pdf',
};

function fileExtension(name: string) {
  const extension = name.includes('.') ? name.split('.').pop() : undefined;
  return extension?.toUpperCase() ?? '文件';
}

function formatFileSize(size: number) {
  if (!size) return '—';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function legacyFiles(submission?: ArchiveSubmission): ArchiveSubmissionFile[] {
  if (!submission) return [];
  if (submission.files?.length) return submission.files;
  return submission.fileIds.map((id, index) => ({
    id,
    name: legacyFileNames[id] ?? `归档材料${index + 1}`,
    size: 0,
    uploader: '历史数据',
    uploadedAt: submission.updatedAt,
  }));
}

export function ArchiveFolderFileList({ requirement, ownerType, ownerId, topicId, unitId, editable }: {
  requirement: ArchiveRequirement;
  ownerType: ArchiveOwnerType;
  ownerId: string;
  topicId?: string;
  unitId?: string;
  editable: boolean;
}) {
  const state = useAppStore();
  const [selectedFileIds, setSelectedFileIds] = useState<React.Key[]>([]);
  const submission = state.archiveSubmissions.find((item) => item.ownerType === ownerType && item.ownerId === ownerId && item.requirementId === requirement.id);
  const files = useMemo(() => legacyFiles(submission), [submission]);
  const canEdit = editable;

  useEffect(() => setSelectedFileIds([]), [requirement.id, ownerId]);

  const save = (patch: Partial<ArchiveSubmission>) => {
    state.saveArchiveSubmission({
      id: submission?.id ?? `archive-${Date.now()}-${ownerId.replace(/[^a-zA-Z0-9-]/g, '-')}-${requirement.id}`,
      requirementId: requirement.id,
      ownerType,
      ownerId,
      topicId,
      unitId,
      applicability: requirement.requirementKind === 'REQUIRED' ? 'APPLICABLE' : submission?.applicability ?? 'PENDING',
      status: submission?.status === '退回修改' ? '退回修改' : submission?.status ?? '草稿',
      fileIds: submission?.fileIds ?? [],
      files: submission?.files ?? legacyFiles(submission),
      version: submission?.version ?? 1,
      submittedAt: submission?.submittedAt,
      updatedAt: new Date().toISOString().slice(0, 10),
      ...patch,
    }, state.currentUser!.id);
  };

  const uploadFile = (file: File & { uid?: string }) => {
    const id = `file-${Date.now()}-${String(file.uid ?? file.name).replace(/[^a-zA-Z0-9-]/g, '-')}`;
    const uploaded: ArchiveSubmissionFile = {
      id,
      name: file.name,
      size: file.size,
      uploader: state.currentUser!.name,
      uploadedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    };
    save({
      fileIds: [...files.map((item) => item.id), id],
      files: [...files, uploaded],
      applicability: 'APPLICABLE',
    });
    message.success(`已上传：${file.name}`);
    return false;
  };

  const removeFiles = (ids: React.Key[]) => {
    const removedIds = new Set(ids.map(String));
    const remainingFiles = files.filter((file) => !removedIds.has(file.id));
    save({
      fileIds: remainingFiles.map((file) => file.id),
      files: remainingFiles,
      applicability: requirement.requirementKind === 'REQUIRED' || remainingFiles.length ? 'APPLICABLE' : 'PENDING',
    });
    setSelectedFileIds([]);
    message.success(`已删除 ${removedIds.size} 个文件`);
  };

  const confirmBatchDelete = () => {
    if (!selectedFileIds.length) return;
    Modal.confirm({
      title: '批量删除文件',
      content: `确定删除已选择的 ${selectedFileIds.length} 个文件吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => removeFiles(selectedFileIds),
    });
  };

  return <div className="archive-file-manager">
    <div className="archive-file-toolbar">
      <div className="archive-material-tip">
        <Alert
          type="info"
          showIcon
          title={<Space wrap><b>材料提交提示</b><Tag color={requirement.requirementKind === 'REQUIRED' ? 'red' : 'gold'}>{requirement.requirementKind === 'REQUIRED' ? '必存' : '有则必存'}</Tag></Space>}
          description={<div>
            <div>{requirement.description || (requirement.requirementKind === 'REQUIRED'
              ? `“${requirement.name}”为必须归档保存的材料，请至少上传 ${requirement.requiredQuantity} 份文件。`
              : `“${requirement.name}”如在项目执行过程中形成，则必须上传归档；未形成时无需提交。`)}</div>
            {(requirement.sourceCode || requirement.sourceRow) && <div className="archive-material-source">归档清单：{requirement.sourceCode ?? '—'}{requirement.sourceRow ? ` · 第 ${requirement.sourceRow} 行` : ''}</div>}
          </div>}
        />
      </div>
      <Space className="archive-file-actions">
        <Upload disabled={!canEdit} showUploadList={false} beforeUpload={uploadFile}>
          <Button type="primary" disabled={!canEdit} icon={<UploadOutlined />}>上传文件</Button>
        </Upload>
        <Button danger disabled={!canEdit || !selectedFileIds.length} icon={<DeleteOutlined />} onClick={confirmBatchDelete}>批量删除</Button>
      </Space>
    </div>

    <Table<ArchiveSubmissionFile>
      className="archive-file-table"
      rowKey="id"
      pagination={false}
      dataSource={files}
      locale={{ emptyText: '当前文件夹暂无文件，请点击右上角“上传文件”添加材料' }}
      rowSelection={{ selectedRowKeys: selectedFileIds, onChange: setSelectedFileIds, getCheckboxProps: () => ({ disabled: !canEdit }) }}
      columns={[
        { title: '文件名', dataIndex: 'name', render: (value: string) => <Space><FileOutlined className="archive-list-file-icon" /><span className="archive-list-file-name">{value}</span></Space> },
        { title: '类型', dataIndex: 'name', width: 100, render: fileExtension },
        { title: '大小', dataIndex: 'size', width: 120, render: formatFileSize },
        { title: '上传人', dataIndex: 'uploader', width: 140 },
        { title: '上传时间', dataIndex: 'uploadedAt', width: 190 },
        { title: '操作', width: 210, render: (_, file) => <Space size={0}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => message.info(`原型演示：预览 ${file.name}`)}>查看</Button>
          <Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => message.info(`原型演示：下载 ${file.name}`)}>下载</Button>
          {canEdit && <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => removeFiles([file.id])}>删除</Button>}
        </Space> },
      ]}
    />

  </div>;
}
