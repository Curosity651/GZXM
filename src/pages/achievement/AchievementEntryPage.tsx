import { useEffect, useMemo, useState } from 'react';
import {
  Button, Card, Col, DatePicker, Descriptions, Form, Input, message, Modal,
  Row, Select, Space, Table, Tag, Typography, Upload,
} from 'antd';
import dayjs from 'dayjs';
import {
  EditOutlined, ExclamationCircleOutlined, EyeOutlined,
  PlusOutlined, SendOutlined, UploadOutlined,
} from '@ant-design/icons';
import { useAppStore, canEditAchievement } from '../../store';
import {
  ACHIEVEMENT_EVIDENCE_RULES, ACHIEVEMENT_STATUS, ACHIEVEMENT_TYPES,
  PAPER_TYPES,
  type Achievement, type AchievementMaterial,
} from '../../types';
import { mockFileService } from '../../utils/helpers';
import { PAPER_STATUS_OPTIONS, PATENT_STATUS_OPTIONS } from '../../utils/helpers';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

export function AchievementEntryPage() {
  const {
    project, topics, units, indicators, nodes, achievements,
    addAchievement, updateAchievement, lockAchievement,
  } = useAppStore();

  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailAchievement, setDetailAchievement] = useState<Achievement | null>(null);
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [filter, setFilter] = useState({ topicId: '', unitId: '', achievementType: '', status: '' });
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { fileId: string; fileName: string; fileUrl: string }>>({});

  const topicMap = Object.fromEntries(topics.map((t) => [t.id, t]));
  const unitMap = Object.fromEntries(units.map((u) => [u.id, u.name]));
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  const selectedTopicId: string | undefined = Form.useWatch('topicId', form);
  const selectedAchievementType: string | undefined = Form.useWatch('achievementType', form);
  const paperStatus: string | undefined = Form.useWatch('paperStatus', form);
  const patentStatus: string | undefined = Form.useWatch('patentStatus', form);

  const selectedTopic = topics.find((t) => t.id === selectedTopicId);
  const unitOptions = selectedTopic
    ? [selectedTopic.leadingUnitId, ...selectedTopic.participatingUnitIds]
    : [];

  // Indicator linking: find matching indicator for selected topic+unit+type
  const matchingIndicators = useMemo(() => {
    if (!selectedTopicId || !selectedAchievementType) return [];
    const unitId = form.getFieldValue('unitId');
    return indicators.filter(
      (i) =>
        i.topicId === selectedTopicId &&
        i.achievementType === selectedAchievementType &&
        (!unitId || i.unitId === unitId)
    );
  }, [selectedTopicId, selectedAchievementType, indicators, form]);

  const filtered = achievements.filter((a) => {
    return (
      (!filter.topicId || a.topicId === filter.topicId) &&
      (!filter.unitId || a.unitId === filter.unitId) &&
      (!filter.achievementType || a.achievementType === filter.achievementType) &&
      (!filter.status || a.status === filter.status)
    );
  });

  const evidenceDef = selectedAchievementType
    ? ACHIEVEMENT_EVIDENCE_RULES[selectedAchievementType as keyof typeof ACHIEVEMENT_EVIDENCE_RULES]
    : null;
  const evidenceMaterialOptions = evidenceDef ? evidenceDef.rule.options : [];

  useEffect(() => {
    if (visible && evidenceMaterialOptions.length > 0) {
      form.setFieldsValue({ _materialFields: evidenceMaterialOptions });
    }
  }, [selectedAchievementType, visible, evidenceMaterialOptions, form]);

  /* ---------- helpers ---------- */

  const getDateStr = (v: any) => (v ? dayjs(v).format('YYYY-MM-DD') : undefined);

  const saveMaterials = (newId: string, materialNames: string[], today: string): AchievementMaterial[] => {
    const existingMaterials: AchievementMaterial[] = editing?.materials || [];
    return materialNames.map((name) => {
      const existing = existingMaterials.find((m) => m.materialType === name || m.name === name);
      const uploaded = uploadedFiles[name];
      if (uploaded) {
        return {
          id: existing?.id || `mat-${Date.now()}-${name}`,
          achievementId: newId, materialType: name, name,
          fileId: uploaded.fileId, fileName: uploaded.fileName, fileUrl: uploaded.fileUrl,
          version: 1, status: '待审核' as const, uploadedAt: today,
        };
      }
      if (existing) return existing;
      return {
        id: `mat-${Date.now()}-${name}`,
        achievementId: newId, materialType: name, name,
        fileId: '', fileName: '', fileUrl: '', version: 1,
        status: '未提交' as const,
      };
    });
  };

  const buildAchievementFromForm = (values: any, today: string): any => {
    const otherArr = values.otherContributors
      ? values.otherContributors.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

    // Determine recognizedCompletionDate from type-specific fields
    let recDate = getDateStr(values.completionDate);
    if (values.achievementType === '学术论文') {
      if (values.paperStatus === '已录用') recDate = getDateStr(values.acceptanceDate) || recDate;
      else if (values.paperStatus === '已正式刊出') recDate = getDateStr(values.publicationDate) || recDate;
    } else if (values.achievementType === '发明专利') {
      if (values.patentStatus === '已受理') recDate = getDateStr(values.receiptDate) || recDate;
      else if (values.patentStatus === '已授权') recDate = getDateStr(values.grantDate) || recDate;
    } else if (values.achievementType === '软件著作权') {
      recDate = getDateStr(values.certificateDate) || recDate;
    } else if (values.achievementType === '标准规范') {
      recDate = getDateStr(values.draftCommitDate) || recDate;
    } else if (values.achievementType === '人才培养') {
      recDate = getDateStr(values.defenseDate) || getDateStr(values.actualGraduationDate) || recDate;
    }

    const newId = editing?.id || `ach-${Date.now()}`;
    const matNames: string[] = values._materialFields || [];
    const materials = saveMaterials(newId, matNames, today);

    // Indicator linking: find matching indicator
    let indicatorId = editing?.indicatorId || '';
    let nodeId = editing?.nodeId || '';
    if (!indicatorId && values.topicId && values.unitId && values.achievementType) {
      const match = indicators.find(
        (i) => i.topicId === values.topicId && i.unitId === values.unitId && i.achievementType === values.achievementType
      );
      if (match) {
        indicatorId = match.id;
        nodeId = match.nodeId;
      }
    }

    const paperTypeStr = Array.isArray(values.paperType) ? values.paperType.join(',') : values.paperType;

    return {
      projectId: project.id,
      topicId: values.topicId,
      unitId: values.unitId,
      achievementType: values.achievementType,
      nodeId,
      indicatorId,
      title: values.title,
      responsiblePerson: values.responsiblePerson,
      otherContributors: otherArr,
      progressStatus: '',
      plannedCompletionDate: getDateStr(values.completionDate),
      recognizedCompletionDate: recDate,
      remarks: values.remarks || '',
      countsToIndicator: false,
      // status fields
      paperStatus: values.paperStatus,
      patentStatus: values.patentStatus,
      standardNumber: values.standardNumber,
      publishDate: getDateStr(values.publishDate),
      implementDate: getDateStr(values.implementDate),
      // paper
      paperType: paperTypeStr,
      isChineseJournal: values.isChineseJournal,
      journalName: values.journalName,
      signingUnitList: values.signingUnitList,
      firstSigningUnit: values.firstSigningUnit,
      firstAuthorUnit: values.firstAuthorUnit,
      cnNumber: values.cnNumber,
      issn: values.issn,
      doi: values.doi,
      firstAuthor: values.firstAuthor,
      correspondingAuthor: values.correspondingAuthor,
      allAuthors: values.allAuthors,
      journalYearVolumePage: values.journalYearVolumePage,
      submissionDate: getDateStr(values.submissionDate),
      acceptanceDate: getDateStr(values.acceptanceDate),
      publicationDate: getDateStr(values.publicationDate),
      projectLabeling: values.projectLabeling,
      // patent
      patentScope: values.patentScope,
      applicantList: values.applicantList,
      firstApplicant: values.firstApplicant,
      inventorList: values.inventorList,
      firstInventor: values.firstInventor,
      firstInventorUnit: values.firstInventorUnit,
      applicationNumber: values.applicationNumber,
      applicationDate: getDateStr(values.applicationDate),
      receiptDate: getDateStr(values.receiptDate),
      receiptNumber: values.receiptNumber,
      patentNumber: values.patentNumber,
      grantDate: getDateStr(values.grantDate),
      grantPublicationNumber: values.grantPublicationNumber,
      grantPublicationDate: getDateStr(values.grantPublicationDate),
      patentHolderList: values.patentHolderList,
      legalStatus: values.legalStatus,
      // copyright
      softwareFullName: values.softwareFullName,
      shortName: values.shortName,
      version: values.version,
      copyrightOwnerList: values.copyrightOwnerList,
      firstCopyrightOwner: values.firstCopyrightOwner,
      mainDevelopers: values.mainDevelopers,
      firstDeveloper: values.firstDeveloper,
      firstDeveloperUnit: values.firstDeveloperUnit,
      softwareMainFunctions: values.softwareMainFunctions,
      devCompletionDate: getDateStr(values.devCompletionDate),
      completionDate: getDateStr(values.devCompletionDate),
      registrationNumber: values.registrationNumber,
      certificateDate: getDateStr(values.certificateDate),
      // standard
      standardLevel: values.standardLevel,
      leadingUnit: values.leadingUnit,
      otherDraftingUnits: values.otherDraftingUnits,
      drafters: values.drafters,
      firstDrafter: values.firstDrafter,
      firstDrafterUnit: values.firstDrafterUnit,
      responsibleOrganization: values.responsibleOrganization,
      draftSubmissionDate: getDateStr(values.draftSubmissionDate),
      draftCommitDate: getDateStr(values.draftCommitDate),
      // talent
      studentName: values.studentName,
      educationLevel: values.educationLevel,
      trainingUnit: values.trainingUnit,
      supervisorName: values.supervisorName,
      supervisorUnit: values.supervisorUnit,
      thesisTitle: values.thesisTitle,
      defenseDate: getDateStr(values.defenseDate),
      actualGraduationDate: getDateStr(values.actualGraduationDate),
      enrollmentDate: getDateStr(values.enrollmentDate),
      expectedGraduationDate: getDateStr(values.expectedGraduationDate),
      trainingStatus: values.trainingStatus,
      materials,
    };
  };

  const validateFormFull = (values: any): string[] => {
    const errs: string[] = [];
    if (!values.topicId) errs.push('请选择所属课题');
    if (!values.unitId) errs.push('请选择成果完成单位');
    if (!values.achievementType) errs.push('请选择成果类型');
    if (!values.title) errs.push('请输入成果名称/题目');
    if (!values.responsiblePerson) errs.push('请输入第一完成人');

    // Indicator matching check
    if (values.topicId && values.unitId && values.achievementType) {
      const match = indicators.find(
        (i) => i.topicId === values.topicId && i.unitId === values.unitId && i.achievementType === values.achievementType
      );
      if (!match) {
        errs.push('该课题、单位和成果类型下没有配置指标，请先在指标配置中设置');
      }
    }

    if (values.achievementType === '学术论文') {
      if (!values.paperStatus) errs.push('请选择论文状态');
      if (!values.journalName) errs.push('请输入期刊名称');
      if (!values.allAuthors) errs.push('请输入作者列表');
      if (!values.firstAuthor) errs.push('请输入第一作者');
      if (!values.signingUnitList) errs.push('请输入署名单位列表');
      if (!values.firstSigningUnit) errs.push('请输入第一署名单位');
      if (values.paperStatus === '已录用' && !values.acceptanceDate) errs.push('已录用状态需填写录用日期');
      if (values.paperStatus === '已正式刊出' && !values.publicationDate) errs.push('已正式刊出状态需填写刊出日期');
    } else if (values.achievementType === '发明专利') {
      if (!values.patentStatus) errs.push('请选择专利状态');
      if (!values.applicationNumber) errs.push('请输入申请号');
      if (!values.applicationDate) errs.push('请选择申请日期');
      if (values.patentStatus === '已受理') {
        if (!values.receiptDate) errs.push('已受理状态需填写受理日期');
        if (!values.receiptNumber) errs.push('已受理状态需填写受理通知书编号');
      }
      if (values.patentStatus === '已授权') {
        if (!values.patentNumber) errs.push('已授权状态需填写专利号');
        if (!values.grantDate) errs.push('已授权状态需填写授权公告日期');
      }
      if (!values.inventorList) errs.push('请输入发明人列表');
      if (!values.firstInventor) errs.push('请输入第一发明人');
    } else if (values.achievementType === '软件著作权') {
      if (!values.softwareFullName) errs.push('请输入软件全称');
      if (!values.version) errs.push('请输入版本号');
      if (!values.devCompletionDate) errs.push('请选择开发完成日期');
    } else if (values.achievementType === '标准规范') {
      if (!values.standardLevel) errs.push('请选择标准级别');
      if (!values.leadingUnit) errs.push('请输入牵头/第一起草单位');
      if (!values.drafters) errs.push('请输入主要起草人');
      if (!values.draftSubmissionDate) errs.push('请选择送审稿形成日期');
      if (!values.draftCommitDate) errs.push('请选择送审提交日期');
    } else if (values.achievementType === '人才培养') {
      if (!values.studentName) errs.push('请输入学生姓名');
      if (!values.educationLevel) errs.push('请选择培养层次');
      if (!values.thesisTitle) errs.push('请输入学位论文题目');
      if (!values.defenseDate && !values.actualGraduationDate) errs.push('请选择论文答辩日期或实际毕业日期');
    }

    // Materials validation
    if (evidenceDef) {
      const opts = evidenceDef.rule.options;
      if (evidenceDef.rule.type === 'SINGLE') {
        const missing = opts.filter((o: string) => !uploadedFiles[o]);
        if (missing.length > 0) errs.push(`缺少佐证材料：${missing.join('、')}`);
      } else if (evidenceDef.rule.type === 'OR') {
        const hasAny = opts.some((o: string) => uploadedFiles[o]);
        if (!hasAny && opts.length > 0) errs.push(`需至少上传以下材料之一：${opts.join(' 或 ')}`);
      }
    }
    return errs;
  };

  /* ---------- UNIFIED submit method ---------- */

  const handleSubmitApproval = () => {
    form.validateFields().then((values: any) => {
      const errs = validateFormFull(values);
      if (errs.length > 0) {
        Modal.error({ title: '提交校验未通过', content: errs.join('；') });
        return;
      }
      Modal.confirm({
        title: '确认提交该成果审批？',
        icon: <ExclamationCircleOutlined />,
        content: '提交后成果信息和佐证材料将被锁定，无法再编辑修改。',
        okText: '确认提交',
        cancelText: '再检查下',
        onOk: () => {
          const today = new Date().toISOString().split('T')[0];
          const data = buildAchievementFromForm(values, today);
          const newId = editing?.id || `ach-${Date.now()}`;
          if (editing) {
            updateAchievement(editing.id, { ...data, updatedAt: today } as any);
            lockAchievement(editing.id);
          } else {
            addAchievement({ ...data, id: newId, status: '已提交', submittedAt: today, createdAt: today, updatedAt: today } as Achievement);
          }
          message.success('已提交审批');
          closeForm();
        },
      });
    }).catch(() => {});
  };

  /* ---------- actions ---------- */

  const closeForm = () => {
    setVisible(false);
    setEditing(null);
    setUploadedFiles({});
    form.resetFields();
  };

  const handleSaveDraft = () => {
    const values = form.getFieldsValue();
    if (!values.topicId || !values.unitId || !values.achievementType || !values.title) {
      message.error('保存草稿需要填写：所属课题、成果完成单位、成果类型、成果名称');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const data = buildAchievementFromForm(values, today);
    if (editing) {
      updateAchievement(editing.id, { ...data, updatedAt: today } as any);
      message.success('草稿更新成功');
    } else {
      addAchievement({ ...data, id: `ach-${Date.now()}`, status: '草稿', createdAt: today, updatedAt: today } as Achievement);
      message.success('保存草稿成功');
    }
    closeForm();
  };

  const openForm = (achievement?: Achievement) => {
    if (achievement && !canEditAchievement(achievement.status)) {
      message.warning('该成果当前状态不允许编辑');
      return;
    }
    setEditing(achievement || null);
    setUploadedFiles({});
    if (achievement) {
      const files: Record<string, { fileId: string; fileName: string; fileUrl: string }> = {};
      achievement.materials.forEach((m) => {
        if (m.fileId) files[m.materialType || m.name] = { fileId: m.fileId, fileName: m.fileName, fileUrl: m.fileUrl };
      });
      setUploadedFiles(files);

      const paperTypeVal = achievement.paperType ? achievement.paperType.split(',').filter(Boolean) : undefined;

      form.setFieldsValue({
        ...achievement,
        paperType: paperTypeVal,
        completionDate: achievement.plannedCompletionDate ? dayjs(achievement.plannedCompletionDate) : undefined,
        acceptanceDate: achievement.acceptanceDate ? dayjs(achievement.acceptanceDate) : undefined,
        publicationDate: achievement.publicationDate ? dayjs(achievement.publicationDate) : undefined,
        submissionDate: achievement.submissionDate ? dayjs(achievement.submissionDate) : undefined,
        applicationDate: achievement.applicationDate ? dayjs(achievement.applicationDate) : undefined,
        receiptDate: achievement.receiptDate ? dayjs(achievement.receiptDate) : undefined,
        grantDate: achievement.grantDate ? dayjs(achievement.grantDate) : undefined,
        grantPublicationDate: achievement.grantPublicationDate ? dayjs(achievement.grantPublicationDate) : undefined,
        devCompletionDate: achievement.completionDate ? dayjs(achievement.completionDate) : undefined,
        certificateDate: achievement.certificateDate ? dayjs(achievement.certificateDate) : undefined,
        draftSubmissionDate: achievement.draftSubmissionDate ? dayjs(achievement.draftSubmissionDate) : undefined,
        draftCommitDate: achievement.draftCommitDate ? dayjs(achievement.draftCommitDate) : undefined,
        defenseDate: achievement.defenseDate ? dayjs(achievement.defenseDate) : undefined,
        actualGraduationDate: achievement.actualGraduationDate ? dayjs(achievement.actualGraduationDate) : undefined,
        enrollmentDate: achievement.enrollmentDate ? dayjs(achievement.enrollmentDate) : undefined,
        expectedGraduationDate: achievement.expectedGraduationDate ? dayjs(achievement.expectedGraduationDate) : undefined,
        publishDate: achievement.publishDate ? dayjs(achievement.publishDate) : undefined,
        implementDate: achievement.implementDate ? dayjs(achievement.implementDate) : undefined,
        otherContributors: (achievement.otherContributors || []).join(', '),
        _materialFields: achievement.materials.map((m) => m.materialType || m.name),
      });
    } else {
      form.resetFields();
    }
    setVisible(true);
  };

  const openDetail = (achievement: Achievement) => {
    setDetailAchievement(achievement);
    setDetailVisible(true);
  };

  /* ---------- rendering helpers ---------- */

  const statusColor: Record<string, string> = {
    草稿: 'default', 已提交: 'processing', 审批中: 'warning', 审批通过: 'success', 审批不通过: 'error', 退回修改: 'error',
  };
  const matColor: Record<string, string> = {
    未提交: 'default', 待审核: 'processing', 审核通过: 'success', 退回修改: 'error',
  };

  const getTypeStatusColumn = (_: any, record: Achievement) => {
    if (record.achievementType === '学术论文') return record.paperStatus || '-';
    if (record.achievementType === '发明专利') return record.patentStatus || '-';
    return '-';
  };

  const columns = [
    { title: '成果名称', dataIndex: 'title', key: 'title' },
    { title: '类型', dataIndex: 'achievementType', key: 'achievementType' },
    { title: '课题', dataIndex: 'topicId', key: 'topicId', render: (v: string) => topicMap[v]?.name || v },
    { title: '成果完成单位', dataIndex: 'unitId', key: 'unitId', render: (v: string) => unitMap[v] || v },
    { title: '第一完成人', dataIndex: 'responsiblePerson', key: 'responsiblePerson' },
    { title: '论文状态/专利状态', key: 'typeStatus', render: getTypeStatusColumn },
    {
      title: '指标', dataIndex: 'indicatorId', key: 'indicatorId',
      render: (v: string, _record: Achievement) => {
        if (!v) return <Tag color="default">未关联</Tag>;
        const ind = indicators.find((i) => i.id === v);
        if (!ind) return <Tag color="default">未关联</Tag>;
        const node = nodeMap[ind.nodeId];
        return <Tag color="blue">{ind.achievementType} / {node?.name || ind.nodeId}</Tag>;
      },
    },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={statusColor[v]}>{v}</Tag> },
    { title: '提交时间', dataIndex: 'submittedAt', key: 'submittedAt', render: (v: string) => v || '-' },
    {
      title: '操作', key: 'action',
      render: (_: any, record: Achievement) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => openDetail(record)}>详情</Button>
          {canEditAchievement(record.status) && (
            <>
              <Button icon={<EditOutlined />} size="small" onClick={() => openForm(record)}>编辑</Button>
              <Button type="primary" icon={<SendOutlined />} size="small" onClick={() => {
                Modal.confirm({
                  title: '确认提交该成果审批？',
                  icon: <ExclamationCircleOutlined />,
                  content: '提交后成果信息和佐证材料将被锁定，无法再编辑修改。',
                  okText: '确认提交',
                  cancelText: '再检查下',
                  onOk: () => {
                    lockAchievement(record.id);
                    message.success(record.status === '退回修改' ? '已重新提交' : '已提交审批');
                  },
                });
              }}>
                {record.status === '退回修改' ? '重新提交' : '提交审批'}
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  /* ==================== RENDER ==================== */

  return (
    <>
      <Card title="成果录入" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>新增成果</Button>}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Select placeholder="选择课题" allowClear style={{ width: 200 }}
            onChange={(v) => setFilter({ ...filter, topicId: v, unitId: '' })}>
            {topics.map((t) => (<Option key={t.id} value={t.id}>{t.name}</Option>))}
          </Select>
          <Select placeholder="成果完成单位" allowClear style={{ width: 160 }}
            value={filter.unitId || undefined}
            onChange={(v) => setFilter({ ...filter, unitId: v })}>
            {(() => {
              const ft = topics.find((t) => t.id === filter.topicId);
              if (!ft) return null;
              return [ft.leadingUnitId, ...ft.participatingUnitIds].map((uid) => (
                <Option key={uid} value={uid}>{unitMap[uid] || uid}</Option>
              ));
            })()}
          </Select>
          <Select placeholder="成果类型" allowClear style={{ width: 140 }}
            onChange={(v) => setFilter({ ...filter, achievementType: v })}>
            {ACHIEVEMENT_TYPES.map((t) => (<Option key={t} value={t}>{t}</Option>))}
          </Select>
          <Select placeholder="状态" allowClear style={{ width: 140 }}
            onChange={(v) => setFilter({ ...filter, status: v })}>
            {ACHIEVEMENT_STATUS.map((s) => (<Option key={s} value={s}>{s}</Option>))}
          </Select>
        </Space>

        <Table rowKey="id" columns={columns} dataSource={filtered} pagination={{ pageSize: 10 }} scroll={{ x: 1500 }} />
      </Card>

      {/* ======== Add/Edit Modal ======== */}
      <Modal
        title={editing ? '编辑成果' : '新增成果'}
        open={visible}
        width={1000}
        onCancel={closeForm}
        footer={
          <Space>
            <Button onClick={closeForm}>取消</Button>
            <Button onClick={handleSaveDraft}>保存草稿</Button>
            <Button type="primary" onClick={handleSubmitApproval}>提交审批</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          {/* ---------- 1. Basic Info ---------- */}
          <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="所属课题" name="topicId" rules={[{ required: true, message: '请选择课题' }]}>
                  <Select placeholder="选择课题" onChange={() => form.setFieldsValue({ unitId: undefined })}>
                    {topics.map((t) => (<Option key={t.id} value={t.id}>{t.name}</Option>))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="成果完成单位" name="unitId" rules={[{ required: true, message: '请选择成果完成单位' }]}>
                  <Select placeholder="选择成果完成单位" disabled={!selectedTopicId}>
                    {unitOptions.map((uid) => (<Option key={uid} value={uid}>{unitMap[uid] || uid}</Option>))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="成果类型" name="achievementType" rules={[{ required: true, message: '请选择成果类型' }]}>
                  <Select placeholder="选择成果类型">
                    {ACHIEVEMENT_TYPES.map((t) => (<Option key={t} value={t}>{t}</Option>))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="成果名称/题目" name="title" rules={[{ required: true, message: '请输入成果名称' }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="第一完成人" name="responsiblePerson" rules={[{ required: true, message: '请输入第一完成人' }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="其他参与人（逗号分隔）" name="otherContributors">
                  <Input placeholder="张三, 李四, 王五" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="完成时间" name="completionDate">
                  <DatePicker style={{ width: '100%' }} placeholder="选择完成时间" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="备注" name="remarks">
                  <TextArea rows={2} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* ---------- 2. Status (replaces old recognition type) ---------- */}
          {selectedAchievementType === '学术论文' && (
            <Card title="论文状态" size="small" style={{ marginBottom: 16 }}>
              <Form.Item label="论文状态" name="paperStatus" rules={[{ required: true, message: '请选择论文状态' }]}>
                <Select placeholder="选择论文状态">
                  {PAPER_STATUS_OPTIONS.map((s) => (<Option key={s} value={s}>{s}</Option>))}
                </Select>
              </Form.Item>
              {matchingIndicators.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">关联指标：</Text>
                  {matchingIndicators.map((ind) => (
                    <Tag key={ind.id} color="blue">{nodeMap[ind.nodeId]?.name || ind.nodeId}（{ind.plannedQuantity}篇）</Tag>
                  ))}
                </div>
              )}
            </Card>
          )}
          {selectedAchievementType === '发明专利' && (
            <Card title="专利状态" size="small" style={{ marginBottom: 16 }}>
              <Form.Item label="专利状态" name="patentStatus" rules={[{ required: true, message: '请选择专利状态' }]}>
                <Select placeholder="选择专利状态">
                  {PATENT_STATUS_OPTIONS.map((s) => (<Option key={s} value={s}>{s}</Option>))}
                </Select>
              </Form.Item>
              {matchingIndicators.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">关联指标：</Text>
                  {matchingIndicators.map((ind) => (
                    <Tag key={ind.id} color="blue">{nodeMap[ind.nodeId]?.name || ind.nodeId}（{ind.plannedQuantity}项）</Tag>
                  ))}
                </div>
              )}
            </Card>
          )}
          {selectedAchievementType === '软件著作权' && matchingIndicators.length > 0 && (
            <Card title="关联指标" size="small" style={{ marginBottom: 16 }}>
              {matchingIndicators.map((ind) => (
                <Tag key={ind.id} color="blue">{nodeMap[ind.nodeId]?.name || ind.nodeId}（{ind.plannedQuantity}项）</Tag>
              ))}
            </Card>
          )}
          {selectedAchievementType === '标准规范' && matchingIndicators.length > 0 && (
            <Card title="关联指标" size="small" style={{ marginBottom: 16 }}>
              {matchingIndicators.map((ind) => (
                <Tag key={ind.id} color="blue">{nodeMap[ind.nodeId]?.name || ind.nodeId}（{ind.plannedQuantity}项）</Tag>
              ))}
            </Card>
          )}
          {selectedAchievementType === '人才培养' && matchingIndicators.length > 0 && (
            <Card title="关联指标" size="small" style={{ marginBottom: 16 }}>
              {matchingIndicators.map((ind) => (
                <Tag key={ind.id} color="blue">{nodeMap[ind.nodeId]?.name || ind.nodeId}（{ind.plannedQuantity}人）</Tag>
              ))}
            </Card>
          )}

          {/* ---------- 3. Type-specific Fields ---------- */}
          {selectedAchievementType === '学术论文' && (
            <Card title="学术论文详细信息" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item label="论文类别" name="paperType">
                    <Select mode="multiple" placeholder="选择论文类别（可多选）">
                      {PAPER_TYPES.map((t) => (<Option key={t} value={t}>{t}</Option>))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}><Form.Item label="期刊名称" name="journalName"><Input /></Form.Item></Col>
                <Col span={12}><Form.Item label="署名单位列表" name="signingUnitList"><Input placeholder="逗号分隔" /></Form.Item></Col>
                <Col span={12}><Form.Item label="第一署名单位" name="firstSigningUnit"><Input /></Form.Item></Col>
                <Col span={12}><Form.Item label="作者列表" name="allAuthors"><Input placeholder="逗号分隔" /></Form.Item></Col>
                <Col span={12}><Form.Item label="第一作者" name="firstAuthor"><Input /></Form.Item></Col>
                <Col span={12}><Form.Item label="第一作者所属单位" name="firstAuthorUnit"><Input /></Form.Item></Col>
                <Col span={12}>
                  <Form.Item label="是否国内期刊论文" name="isChineseJournal" valuePropName="checked">
                    <Select placeholder="选择" allowClear>
                      <Option value={true}>是</Option>
                      <Option value={false}>否</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}><Form.Item label="CN号" name="cnNumber"><Input /></Form.Item></Col>
                <Col span={12}>
                  <Form.Item label="录用日期" name="acceptanceDate"
                    rules={paperStatus === '已录用' ? [{ required: true, message: '请选择录用日期' }] : undefined}>
                    <DatePicker style={{ width: '100%' }} placeholder="选择录用日期" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="正式刊出日期" name="publicationDate"
                    rules={paperStatus === '已正式刊出' ? [{ required: true, message: '请选择刊出日期' }] : undefined}>
                    <DatePicker style={{ width: '100%' }} placeholder="选择刊出日期" />
                  </Form.Item>
                </Col>
                <Col span={12}><Form.Item label="期刊年/卷/期/页码" name="journalYearVolumePage"><Input /></Form.Item></Col>
                <Col span={12}><Form.Item label="DOI" name="doi"><Input /></Form.Item></Col>
                <Col span={12}><Form.Item label="ISSN" name="issn"><Input /></Form.Item></Col>
                <Col span={12}><Form.Item label="通讯作者" name="correspondingAuthor"><Input /></Form.Item></Col>
                <Col span={12}>
                  <Form.Item label="投稿日期" name="submissionDate">
                    <DatePicker style={{ width: '100%' }} placeholder="选择投稿日期" />
                  </Form.Item>
                </Col>
                <Col span={12}><Form.Item label="项目标注" name="projectLabeling"><Input /></Form.Item></Col>
              </Row>
            </Card>
          )}

          {selectedAchievementType === '发明专利' && (
            <Card title="发明专利详细信息" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="专利范围" name="patentScope">
                    <Select placeholder="选择范围" allowClear>
                      <Option value="国内">国内</Option>
                      <Option value="国际">国际</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}><Form.Item label="申请人列表" name="applicantList"><Input placeholder="逗号分隔" /></Form.Item></Col>
                <Col span={12}><Form.Item label="第一申请人" name="firstApplicant"><Input /></Form.Item></Col>
                <Col span={12}><Form.Item label="发明人列表" name="inventorList"><Input placeholder="分号分隔" /></Form.Item></Col>
                <Col span={12}><Form.Item label="第一发明人" name="firstInventor"><Input /></Form.Item></Col>
                <Col span={12}><Form.Item label="第一发明人所属单位" name="firstInventorUnit"><Input /></Form.Item></Col>
                <Col span={12}><Form.Item label="申请号" name="applicationNumber"><Input /></Form.Item></Col>
                <Col span={12}>
                  <Form.Item label="申请日期" name="applicationDate">
                    <DatePicker style={{ width: '100%' }} placeholder="选择申请日期" />
                  </Form.Item>
                </Col>
                {patentStatus === '已受理' && (
                  <>
                    <Col span={12}>
                      <Form.Item label="受理日期" name="receiptDate" rules={[{ required: true, message: '请选择受理日期' }]}>
                        <DatePicker style={{ width: '100%' }} placeholder="选择受理日期" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="受理通知书编号" name="receiptNumber" rules={[{ required: true, message: '请输入受理通知书编号' }]}>
                        <Input />
                      </Form.Item>
                    </Col>
                  </>
                )}
                {patentStatus === '已授权' && (
                  <>
                    <Col span={12}>
                      <Form.Item label="专利号" name="patentNumber" rules={[{ required: true, message: '请输入专利号' }]}>
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}><Form.Item label="授权公告号" name="grantPublicationNumber"><Input /></Form.Item></Col>
                    <Col span={12}>
                      <Form.Item label="授权公告日期" name="grantPublicationDate">
                        <DatePicker style={{ width: '100%' }} placeholder="选择授权公告日期" />
                      </Form.Item>
                    </Col>
                    <Col span={12}><Form.Item label="专利权人列表" name="patentHolderList"><Input placeholder="逗号分隔" /></Form.Item></Col>
                  </>
                )}
                <Col span={12}><Form.Item label="当前法律状态" name="legalStatus"><Input /></Form.Item></Col>
              </Row>
            </Card>
          )}

          {selectedAchievementType === '软件著作权' && (
            <Card title="软件著作权详细信息" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}><Form.Item label="软件全称" name="softwareFullName"><Input /></Form.Item></Col>
                <Col span={12}><Form.Item label="软件简称" name="shortName"><Input /></Form.Item></Col>
                <Col span={12}><Form.Item label="版本号" name="version"><Input /></Form.Item></Col>
                <Col span={12}><Form.Item label="著作权人列表" name="copyrightOwnerList"><Input placeholder="逗号分隔" /></Form.Item></Col>
                <Col span={12}><Form.Item label="第一著作权人" name="firstCopyrightOwner"><Input /></Form.Item></Col>
                <Col span={12}><Form.Item label="主要开发人员" name="mainDevelopers"><Input placeholder="逗号分隔" /></Form.Item></Col>
                <Col span={12}><Form.Item label="第一开发人员" name="firstDeveloper"><Input /></Form.Item></Col>
                <Col span={12}><Form.Item label="第一开发人员所属单位" name="firstDeveloperUnit"><Input /></Form.Item></Col>
                <Col span={12}>
                  <Form.Item label="开发完成日期" name="devCompletionDate">
                    <DatePicker style={{ width: '100%' }} placeholder="选择开发完成日期" />
                  </Form.Item>
                </Col>
                <Col span={12}><Form.Item label="登记号" name="registrationNumber"><Input /></Form.Item></Col>
                <Col span={12}>
                  <Form.Item label="证书日期" name="certificateDate">
                    <DatePicker style={{ width: '100%' }} placeholder="选择证书日期" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item label="软件主要功能" name="softwareMainFunctions"><TextArea rows={3} /></Form.Item>
                </Col>
              </Row>
            </Card>
          )}

          {selectedAchievementType === '标准规范' && (
            <Card title="标准规范详细信息" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="标准级别" name="standardLevel">
                    <Select placeholder="选择标准级别" allowClear>
                      <Option value="国家标准">国家标准</Option>
                      <Option value="行业标准">行业标准</Option>
                      <Option value="地方标准">地方标准</Option>
                      <Option value="团体标准">团体标准</Option>
                      <Option value="企业标准">企业标准</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}><Form.Item label="牵头/第一起草单位" name="leadingUnit"><Input /></Form.Item></Col>
                <Col span={12}><Form.Item label="其他起草单位" name="otherDraftingUnits"><Input placeholder="逗号分隔" /></Form.Item></Col>
                <Col span={12}><Form.Item label="第一主要起草人" name="firstDrafter"><Input /></Form.Item></Col>
                <Col span={12}><Form.Item label="第一主要起草人所属单位" name="firstDrafterUnit"><Input /></Form.Item></Col>
                <Col span={12}><Form.Item label="归口单位" name="responsibleOrganization"><Input /></Form.Item></Col>
                <Col span={12}>
                  <Form.Item label="送审稿形成日期" name="draftSubmissionDate">
                    <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="送审提交日期" name="draftCommitDate">
                    <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
                  </Form.Item>
                </Col>
                <Col span={12}><Form.Item label="标准号" name="standardNumber"><Input /></Form.Item></Col>
                <Col span={12}>
                  <Form.Item label="发布日期" name="publishDate"><DatePicker style={{ width: '100%' }} placeholder="选择发布日期" /></Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="实施日期" name="implementDate"><DatePicker style={{ width: '100%' }} placeholder="选择实施日期" /></Form.Item>
                </Col>
              </Row>
            </Card>
          )}

          {selectedAchievementType === '人才培养' && (
            <Card title="人才培养详细信息" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}><Form.Item label="学生姓名" name="studentName"><Input /></Form.Item></Col>
                <Col span={12}>
                  <Form.Item label="培养层次" name="educationLevel">
                    <Select placeholder="选择培养层次" allowClear>
                      <Option value="博士">博士</Option>
                      <Option value="硕士">硕士</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}><Form.Item label="培养单位" name="trainingUnit"><Input /></Form.Item></Col>
                <Col span={12}><Form.Item label="导师姓名" name="supervisorName"><Input /></Form.Item></Col>
                <Col span={12}><Form.Item label="导师所属单位" name="supervisorUnit"><Input /></Form.Item></Col>
                <Col span={12}><Form.Item label="学位论文题目" name="thesisTitle"><Input /></Form.Item></Col>
                <Col span={12}>
                  <Form.Item label="论文答辩日期/实际毕业日期" name="defenseDate">
                    <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          )}

          {/* ---------- 4. Materials ---------- */}
          {selectedAchievementType && evidenceMaterialOptions.length > 0 && (
            <Card title="佐证材料" size="small" style={{ marginBottom: 16 }}>
              <Form.Item name="_materialFields" noStyle><Input type="hidden" /></Form.Item>
              {evidenceDef && (
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                  {evidenceDef.displayText}
                  {evidenceDef.rule.type === 'OR' ? '（任选其一上传即可）' : '（需全部上传）'}
                </Text>
              )}
              {evidenceMaterialOptions.map((matName) => {
                const uploaded = uploadedFiles[matName];
                return (
                  <div key={matName} style={{ marginBottom: 12, padding: 8, border: '1px solid #f0f0f0', borderRadius: 4 }}>
                    <Space align="center" style={{ width: '100%' }}>
                      <Text strong>{matName}</Text>
                      {uploaded && <Tag color="success">已上传</Tag>}
                      <Upload showUploadList={false} beforeUpload={() => false}
                        onChange={async (info) => {
                          const file = info.file.originFileObj || info.file;
                          if (file) {
                            const result = await mockFileService.upload(file as File);
                            setUploadedFiles((prev) => ({
                              ...prev,
                              [matName]: { fileId: result.fileId, fileName: result.fileName, fileUrl: result.fileUrl },
                            }));
                            message.success(`${matName} 已上传`);
                          }
                        }}>
                        <Button size="small" icon={<UploadOutlined />}>{uploaded ? '重新上传' : '上传'}</Button>
                      </Upload>
                      {uploaded && <Text type="secondary" style={{ fontSize: 12 }}>{uploaded.fileName}</Text>}
                    </Space>
                  </div>
                );
              })}
            </Card>
          )}
        </Form>
      </Modal>

      {/* ======== Detail Modal ======== */}
      <Modal
        title="成果详情"
        open={detailVisible}
        width={900}
        footer={<Button onClick={() => setDetailVisible(false)}>关闭</Button>}
        onCancel={() => setDetailVisible(false)}
      >
        {detailAchievement && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Descriptions title="基本信息" bordered column={2} size="small">
              <Descriptions.Item label="所属课题">{topicMap[detailAchievement.topicId]?.name || detailAchievement.topicId}</Descriptions.Item>
              <Descriptions.Item label="成果完成单位">{unitMap[detailAchievement.unitId] || detailAchievement.unitId}</Descriptions.Item>
              <Descriptions.Item label="成果类型">{detailAchievement.achievementType}</Descriptions.Item>
              <Descriptions.Item label="成果名称">{detailAchievement.title}</Descriptions.Item>
              <Descriptions.Item label="第一完成人">{detailAchievement.responsiblePerson}</Descriptions.Item>
              <Descriptions.Item label="其他参与人">{(detailAchievement.otherContributors || []).join(', ') || '-'}</Descriptions.Item>
              <Descriptions.Item label="完成时间">{detailAchievement.plannedCompletionDate || '-'}</Descriptions.Item>
              <Descriptions.Item label="实际认定完成时间">{detailAchievement.recognizedCompletionDate || '-'}</Descriptions.Item>
              <Descriptions.Item label="论文状态/专利状态">
                {detailAchievement.achievementType === '学术论文' && (detailAchievement.paperStatus || '-')}
                {detailAchievement.achievementType === '发明专利' && (detailAchievement.patentStatus || '-')}
                {(detailAchievement.achievementType !== '学术论文' && detailAchievement.achievementType !== '发明专利') && '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color={statusColor[detailAchievement.status]}>{detailAchievement.status}</Tag></Descriptions.Item>
              <Descriptions.Item label="备注">{detailAchievement.remarks || '-'}</Descriptions.Item>
            </Descriptions>

            {detailAchievement.achievementType === '学术论文' && (
              <Descriptions title="论文信息" bordered column={2} size="small">
                <Descriptions.Item label="论文状态">{detailAchievement.paperStatus || '-'}</Descriptions.Item>
                <Descriptions.Item label="论文类别">{detailAchievement.paperType || '-'}</Descriptions.Item>
                <Descriptions.Item label="期刊名称">{detailAchievement.journalName || '-'}</Descriptions.Item>
                <Descriptions.Item label="署名单位列表">{detailAchievement.signingUnitList || '-'}</Descriptions.Item>
                <Descriptions.Item label="第一署名单位">{detailAchievement.firstSigningUnit || '-'}</Descriptions.Item>
                <Descriptions.Item label="作者列表">{detailAchievement.allAuthors || '-'}</Descriptions.Item>
                <Descriptions.Item label="第一作者">{detailAchievement.firstAuthor || '-'}</Descriptions.Item>
                <Descriptions.Item label="第一作者所属单位">{detailAchievement.firstAuthorUnit || '-'}</Descriptions.Item>
                <Descriptions.Item label="是否国内期刊论文">{detailAchievement.isChineseJournal ? '是' : '否'}</Descriptions.Item>
                <Descriptions.Item label="CN号">{detailAchievement.cnNumber || '-'}</Descriptions.Item>
                <Descriptions.Item label="ISSN">{detailAchievement.issn || '-'}</Descriptions.Item>
                <Descriptions.Item label="DOI">{detailAchievement.doi || '-'}</Descriptions.Item>
                <Descriptions.Item label="通讯作者">{detailAchievement.correspondingAuthor || '-'}</Descriptions.Item>
                <Descriptions.Item label="录用日期">{detailAchievement.acceptanceDate || '-'}</Descriptions.Item>
                <Descriptions.Item label="正式刊出日期">{detailAchievement.publicationDate || '-'}</Descriptions.Item>
                <Descriptions.Item label="期刊年/卷/期/页码">{detailAchievement.journalYearVolumePage || '-'}</Descriptions.Item>
                <Descriptions.Item label="投稿日期">{detailAchievement.submissionDate || '-'}</Descriptions.Item>
                <Descriptions.Item label="项目标注">{detailAchievement.projectLabeling || '-'}</Descriptions.Item>
              </Descriptions>
            )}

            {detailAchievement.achievementType === '发明专利' && (
              <Descriptions title="专利信息" bordered column={2} size="small">
                <Descriptions.Item label="专利状态">{detailAchievement.patentStatus || '-'}</Descriptions.Item>
                <Descriptions.Item label="专利范围">{detailAchievement.patentScope || '-'}</Descriptions.Item>
                <Descriptions.Item label="申请人列表">{detailAchievement.applicantList || '-'}</Descriptions.Item>
                <Descriptions.Item label="第一申请人">{detailAchievement.firstApplicant || '-'}</Descriptions.Item>
                <Descriptions.Item label="发明人列表">{detailAchievement.inventorList || '-'}</Descriptions.Item>
                <Descriptions.Item label="第一发明人">{detailAchievement.firstInventor || '-'}</Descriptions.Item>
                <Descriptions.Item label="第一发明人所属单位">{detailAchievement.firstInventorUnit || '-'}</Descriptions.Item>
                <Descriptions.Item label="申请号">{detailAchievement.applicationNumber || '-'}</Descriptions.Item>
                <Descriptions.Item label="申请日期">{detailAchievement.applicationDate || '-'}</Descriptions.Item>
                <Descriptions.Item label="受理日期">{detailAchievement.receiptDate || '-'}</Descriptions.Item>
                <Descriptions.Item label="受理通知书编号">{detailAchievement.receiptNumber || '-'}</Descriptions.Item>
                <Descriptions.Item label="专利号">{detailAchievement.patentNumber || '-'}</Descriptions.Item>
                <Descriptions.Item label="授权公告号">{detailAchievement.grantPublicationNumber || '-'}</Descriptions.Item>
                <Descriptions.Item label="授权公告日期">{detailAchievement.grantPublicationDate || '-'}</Descriptions.Item>
                <Descriptions.Item label="专利权人列表">{detailAchievement.patentHolderList || '-'}</Descriptions.Item>
                <Descriptions.Item label="法律状态">{detailAchievement.legalStatus || '-'}</Descriptions.Item>
              </Descriptions>
            )}

            {detailAchievement.achievementType === '软件著作权' && (
              <Descriptions title="软著信息" bordered column={2} size="small">
                <Descriptions.Item label="软件全称">{detailAchievement.softwareFullName || '-'}</Descriptions.Item>
                <Descriptions.Item label="软件简称">{detailAchievement.shortName || '-'}</Descriptions.Item>
                <Descriptions.Item label="版本号">{detailAchievement.version || '-'}</Descriptions.Item>
                <Descriptions.Item label="著作权人列表">{detailAchievement.copyrightOwnerList || '-'}</Descriptions.Item>
                <Descriptions.Item label="第一著作权人">{detailAchievement.firstCopyrightOwner || '-'}</Descriptions.Item>
                <Descriptions.Item label="主要开发人员">{detailAchievement.mainDevelopers || '-'}</Descriptions.Item>
                <Descriptions.Item label="第一开发人员">{detailAchievement.firstDeveloper || '-'}</Descriptions.Item>
                <Descriptions.Item label="第一开发人员所属单位">{detailAchievement.firstDeveloperUnit || '-'}</Descriptions.Item>
                <Descriptions.Item label="开发完成日期">{detailAchievement.completionDate || '-'}</Descriptions.Item>
                <Descriptions.Item label="登记号">{detailAchievement.registrationNumber || '-'}</Descriptions.Item>
                <Descriptions.Item label="证书日期">{detailAchievement.certificateDate || '-'}</Descriptions.Item>
                <Descriptions.Item label="软件主要功能">{detailAchievement.softwareMainFunctions || '-'}</Descriptions.Item>
              </Descriptions>
            )}

            {detailAchievement.achievementType === '标准规范' && (
              <Descriptions title="标准信息" bordered column={2} size="small">
                <Descriptions.Item label="标准级别">{detailAchievement.standardLevel || '-'}</Descriptions.Item>
                <Descriptions.Item label="牵头/第一起草单位">{detailAchievement.leadingUnit || '-'}</Descriptions.Item>
                <Descriptions.Item label="其他起草单位">{detailAchievement.otherDraftingUnits || '-'}</Descriptions.Item>
                <Descriptions.Item label="第一主要起草人">{detailAchievement.firstDrafter || '-'}</Descriptions.Item>
                <Descriptions.Item label="第一主要起草人所属单位">{detailAchievement.firstDrafterUnit || '-'}</Descriptions.Item>
                <Descriptions.Item label="归口单位">{detailAchievement.responsibleOrganization || '-'}</Descriptions.Item>
                <Descriptions.Item label="送审稿形成日期">{detailAchievement.draftSubmissionDate || '-'}</Descriptions.Item>
                <Descriptions.Item label="送审提交日期">{detailAchievement.draftCommitDate || '-'}</Descriptions.Item>
                <Descriptions.Item label="标准号">{detailAchievement.standardNumber || '-'}</Descriptions.Item>
                <Descriptions.Item label="发布日期">{detailAchievement.publishDate || '-'}</Descriptions.Item>
                <Descriptions.Item label="实施日期">{detailAchievement.implementDate || '-'}</Descriptions.Item>
              </Descriptions>
            )}

            {detailAchievement.achievementType === '人才培养' && (
              <Descriptions title="人才培养信息" bordered column={2} size="small">
                <Descriptions.Item label="学生姓名">{detailAchievement.studentName || '-'}</Descriptions.Item>
                <Descriptions.Item label="培养层次">{detailAchievement.educationLevel || '-'}</Descriptions.Item>
                <Descriptions.Item label="培养单位">{detailAchievement.trainingUnit || '-'}</Descriptions.Item>
                <Descriptions.Item label="导师姓名">{detailAchievement.supervisorName || '-'}</Descriptions.Item>
                <Descriptions.Item label="导师所属单位">{detailAchievement.supervisorUnit || '-'}</Descriptions.Item>
                <Descriptions.Item label="学位论文题目">{detailAchievement.thesisTitle || '-'}</Descriptions.Item>
                <Descriptions.Item label="论文答辩日期/实际毕业日期">{detailAchievement.defenseDate || detailAchievement.actualGraduationDate || '-'}</Descriptions.Item>
              </Descriptions>
            )}

            <Descriptions title="提交/审批历史" bordered column={2} size="small">
              <Descriptions.Item label="提交时间">{detailAchievement.submittedAt || '-'}</Descriptions.Item>
              <Descriptions.Item label="审批人">{detailAchievement.approver || '-'}</Descriptions.Item>
              <Descriptions.Item label="审批时间">{detailAchievement.approvedAt || '-'}</Descriptions.Item>
              <Descriptions.Item label="审批意见">{detailAchievement.approvalOpinion || '-'}</Descriptions.Item>
              <Descriptions.Item label="是否计入指标">{detailAchievement.countsToIndicator ? '是' : '否'}</Descriptions.Item>
            </Descriptions>

            <Card title="佐证材料" size="small">
              {detailAchievement.materials && detailAchievement.materials.length > 0 ? (
                detailAchievement.materials.map((m) => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text>{m.materialType || m.name}</Text>
                    <Space>
                      {m.fileName && <Text type="secondary" style={{ fontSize: 12 }}>{m.fileName}</Text>}
                      <Tag color={matColor[m.status]}>{m.status}</Tag>
                    </Space>
                  </div>
                ))
              ) : (<Text type="secondary">无材料</Text>)}
            </Card>
          </Space>
        )}
      </Modal>
    </>
  );
}
