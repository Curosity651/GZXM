import { useState } from 'react';
import {
  Button, Card, Descriptions, Form, Input, Modal, Radio,
  Select, Space, Table, Tag, Typography, message,
} from 'antd';
import {
  CheckCircleFilled, CheckOutlined, CloseCircleFilled, EyeOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../../store';
import {
  ACHIEVEMENT_EVIDENCE_RULES, ACHIEVEMENT_STATUS, ACHIEVEMENT_TYPES,
  type Achievement,
} from '../../types';
import { validateAchievementForApproval } from '../../utils/validation';
import { mockFileService } from '../../utils/helpers';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

export function AchievementApprovalPage() {
  const {
    topics, units, nodes, indicators, achievements,
    approveAchievement, rejectAchievement, returnAchievement, updateAchievement,
  } = useAppStore();

  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailAchievement, setDetailAchievement] = useState<Achievement | null>(null);
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [validation, setValidation] = useState<any>(null);
  const [filter, setFilter] = useState({ topicId: '', achievementType: '', status: '' });

  const topicMap = Object.fromEntries(topics.map((t) => [t.id, t]));
  const indicatorMap = Object.fromEntries(indicators.map((i) => [i.id, i]));
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const unitMap = Object.fromEntries(units.map((u) => [u.id, u.name]));

  const filtered = achievements.filter((a) => {
    const reviewable = ['已提交', '审批中', '审批不通过', '退回修改'].includes(a.status);
    return (
      reviewable &&
      (!filter.topicId || a.topicId === filter.topicId) &&
      (!filter.achievementType || a.achievementType === filter.achievementType) &&
      (!filter.status || a.status === filter.status)
    );
  });

  const openApproval = (achievement: Achievement) => {
    setEditing(achievement);
    const indicator = indicatorMap[achievement.indicatorId];
    const node = nodeMap[achievement.nodeId];
    const val = validateAchievementForApproval(achievement, indicator, node, achievements);
    setValidation(val);
    form.setFieldsValue({
      result: 'pass',
      approvalOpinion: '',
    });
    setVisible(true);
  };

  const handleMaterialApprove = (materialId: string, achievementId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const ach = achievements.find((a) => a.id === achievementId);
    if (!ach) return;
    const updatedMaterials = ach.materials.map((m) =>
      m.id === materialId ? { ...m, status: '审核通过' as const, reviewedAt: today } : m
    );
    updateAchievement(achievementId, { materials: updatedMaterials } as any);
    setEditing((prev) => prev ? { ...prev, materials: updatedMaterials } : null);
    message.success('材料审核通过');
  };

  const handleMaterialReturn = (materialId: string, achievementId: string, reason: string) => {
    if (!reason) {
      message.warning('退回材料需要填写原因');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const ach = achievements.find((a) => a.id === achievementId);
    if (!ach) return;
    const updatedMaterials = ach.materials.map((m) =>
      m.id === materialId ? { ...m, status: '退回修改' as const, reviewedAt: today, reviewOpinion: reason } : m
    );
    updateAchievement(achievementId, { materials: updatedMaterials } as any);
    setEditing((prev) => prev ? { ...prev, materials: updatedMaterials } : null);
    message.success('材料已退回修改');
  };

  const handleSubmit = (values: any) => {
    if (!editing) return;

    if (values.result === 'pass') {
      // Auto-set countsToIndicator: pass->true
      const payload: Partial<Achievement> = {
        countsToIndicator: true,
        approvalOpinion: values.approvalOpinion,
      };
      approveAchievement(editing.id, payload, '当前审批人');
      message.success('审批通过');
    } else if (values.result === 'reject') {
      // Auto-set countsToIndicator: reject->false
      rejectAchievement(editing.id, values.approvalOpinion || '审批不通过', '当前审批人');
      message.success('已标记为审批不通过');
    } else if (values.result === 'return') {
      // Auto-set countsToIndicator: return->false
      returnAchievement(editing.id, values.approvalOpinion || '退回修改', '当前审批人');
      message.success('已退回修改');
    }
    setVisible(false);
    setEditing(null);
    setValidation(null);
    form.resetFields();
  };

  const openDetail = (achievement: Achievement) => {
    setDetailAchievement(achievement);
    setDetailVisible(true);
  };

  const statusColor: Record<string, string> = {
    草稿: 'default', 已提交: 'processing', 审批中: 'warning', 审批通过: 'success', 审批不通过: 'error', 退回修改: 'error',
  };
  const matColor: Record<string, string> = {
    未提交: 'default', 待审核: 'processing', 审核通过: 'success', 退回修改: 'error',
  };

  const getMatSummary = (ach: Achievement) => {
    const mats = ach.materials || [];
    if (mats.length === 0) return <Tag>无材料</Tag>;
    const approved = mats.filter((m) => m.status === '审核通过').length;
    const pending = mats.filter((m) => m.status === '待审核').length;
    const returned = mats.filter((m) => m.status === '退回修改').length;
    const notSub = mats.filter((m) => m.status === '未提交').length;
    const parts: string[] = [];
    if (approved > 0) parts.push(`${approved}通过`);
    if (pending > 0) parts.push(`${pending}待审`);
    if (returned > 0) parts.push(`${returned}退回`);
    if (notSub > 0) parts.push(`${notSub}未提交`);
    return <Tag color={approved === mats.length ? 'success' : 'warning'}>{parts.join('/')}</Tag>;
  };

  const columns = [
    { title: '成果名称', dataIndex: 'title', key: 'title' },
    { title: '类型', dataIndex: 'achievementType', key: 'achievementType' },
    { title: '课题', dataIndex: 'topicId', key: 'topicId', render: (v: string) => topicMap[v]?.name || v },
    { title: '责任单位', dataIndex: 'unitId', key: 'unitId', render: (v: string) => unitMap[v] || v },
    { title: '责任人', dataIndex: 'responsiblePerson', key: 'responsiblePerson' },
    { title: '实际认定完成时间', dataIndex: 'recognizedCompletionDate', key: 'recognizedCompletionDate', render: (v: string) => v || '-' },
    { title: '佐证材料', key: 'matStatus', render: (_: any, r: Achievement) => getMatSummary(r) },
    { title: '提交时间', dataIndex: 'submittedAt', key: 'submittedAt', render: (v: string) => v || '-' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={statusColor[v]}>{v}</Tag> },
    {
      title: '操作', key: 'action',
      render: (_: any, record: Achievement) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => openDetail(record)}>详情</Button>
          <Button type="primary" icon={<CheckOutlined />} size="small" onClick={() => openApproval(record)}>审批</Button>
        </Space>
      ),
    },
  ];

  const renderBasicDescriptions = (a: Achievement) => (
    <Descriptions title="基本信息" bordered column={2} size="small">
      <Descriptions.Item label="所属课题">{topicMap[a.topicId]?.name || a.topicId}</Descriptions.Item>
      <Descriptions.Item label="成果完成单位">{unitMap[a.unitId] || a.unitId}</Descriptions.Item>
      <Descriptions.Item label="成果类型">{a.achievementType}</Descriptions.Item>
      <Descriptions.Item label="成果名称">{a.title}</Descriptions.Item>
      <Descriptions.Item label="第一完成人">{a.responsiblePerson}</Descriptions.Item>
      <Descriptions.Item label="其他参与人">{(a.otherContributors || []).join(', ') || '-'}</Descriptions.Item>
      <Descriptions.Item label="实际认定完成时间">{a.recognizedCompletionDate || '-'}</Descriptions.Item>
      <Descriptions.Item label="提交时间">{a.submittedAt || '-'}</Descriptions.Item>
      <Descriptions.Item label="状态"><Tag color={statusColor[a.status]}>{a.status}</Tag></Descriptions.Item>
      <Descriptions.Item label="备注">{a.remarks || '-'}</Descriptions.Item>
    </Descriptions>
  );

  const renderTypeSpecificDescriptions = (a: Achievement) => {
    if (a.achievementType === '学术论文') {
      return (
        <Descriptions title="论文信息" bordered column={2} size="small">
          <Descriptions.Item label="论文状态">{a.paperStatus || '-'}</Descriptions.Item>
          <Descriptions.Item label="论文类别">{a.paperType || '-'}</Descriptions.Item>
          <Descriptions.Item label="期刊名称">{a.journalName || '-'}</Descriptions.Item>
          <Descriptions.Item label="署名单位列表">{a.signingUnitList || '-'}</Descriptions.Item>
          <Descriptions.Item label="第一署名单位">{a.firstSigningUnit || '-'}</Descriptions.Item>
          <Descriptions.Item label="第一作者">{a.firstAuthor || '-'}</Descriptions.Item>
          <Descriptions.Item label="第一作者所属单位">{a.firstAuthorUnit || '-'}</Descriptions.Item>
          <Descriptions.Item label="通讯作者">{a.correspondingAuthor || '-'}</Descriptions.Item>
          <Descriptions.Item label="录用日期">{a.acceptanceDate || '-'}</Descriptions.Item>
          <Descriptions.Item label="正式刊出日期">{a.publicationDate || '-'}</Descriptions.Item>
          <Descriptions.Item label="DOI">{a.doi || '-'}</Descriptions.Item>
          <Descriptions.Item label="是否国内期刊">{a.isChineseJournal ? '是' : '否'}</Descriptions.Item>
        </Descriptions>
      );
    }
    if (a.achievementType === '发明专利') {
      return (
        <Descriptions title="专利信息" bordered column={2} size="small">
          <Descriptions.Item label="专利状态">{a.patentStatus || '-'}</Descriptions.Item>
          <Descriptions.Item label="专利范围">{a.patentScope || '-'}</Descriptions.Item>
          <Descriptions.Item label="申请人列表">{a.applicantList || '-'}</Descriptions.Item>
          <Descriptions.Item label="第一申请人">{a.firstApplicant || '-'}</Descriptions.Item>
          <Descriptions.Item label="发明人列表">{a.inventorList || '-'}</Descriptions.Item>
          <Descriptions.Item label="第一发明人">{a.firstInventor || '-'}</Descriptions.Item>
          <Descriptions.Item label="申请号">{a.applicationNumber || '-'}</Descriptions.Item>
          <Descriptions.Item label="申请日期">{a.applicationDate || '-'}</Descriptions.Item>
          <Descriptions.Item label="受理日期">{a.receiptDate || '-'}</Descriptions.Item>
          <Descriptions.Item label="专利号">{a.patentNumber || '-'}</Descriptions.Item>
          <Descriptions.Item label="授权公告日期">{a.grantPublicationDate || '-'}</Descriptions.Item>
        </Descriptions>
      );
    }
    if (a.achievementType === '软件著作权') {
      return (
        <Descriptions title="软著信息" bordered column={2} size="small">
          <Descriptions.Item label="软件全称">{a.softwareFullName || '-'}</Descriptions.Item>
          <Descriptions.Item label="版本号">{a.version || '-'}</Descriptions.Item>
          <Descriptions.Item label="第一著作权人">{a.firstCopyrightOwner || '-'}</Descriptions.Item>
          <Descriptions.Item label="开发完成日期">{a.completionDate || '-'}</Descriptions.Item>
          <Descriptions.Item label="登记号">{a.registrationNumber || '-'}</Descriptions.Item>
          <Descriptions.Item label="证书日期">{a.certificateDate || '-'}</Descriptions.Item>
        </Descriptions>
      );
    }
    if (a.achievementType === '标准规范') {
      return (
        <Descriptions title="标准信息" bordered column={2} size="small">
          <Descriptions.Item label="标准级别">{a.standardLevel || '-'}</Descriptions.Item>
          <Descriptions.Item label="牵头/第一起草单位">{a.leadingUnit || '-'}</Descriptions.Item>
          <Descriptions.Item label="第一主要起草人">{a.firstDrafter || '-'}</Descriptions.Item>
          <Descriptions.Item label="送审提交日期">{a.draftCommitDate || '-'}</Descriptions.Item>
          <Descriptions.Item label="标准号">{a.standardNumber || '-'}</Descriptions.Item>
        </Descriptions>
      );
    }
    if (a.achievementType === '人才培养') {
      return (
        <Descriptions title="人才培养信息" bordered column={2} size="small">
          <Descriptions.Item label="学生姓名">{a.studentName || '-'}</Descriptions.Item>
          <Descriptions.Item label="培养层次">{a.educationLevel || '-'}</Descriptions.Item>
          <Descriptions.Item label="导师姓名">{a.supervisorName || '-'}</Descriptions.Item>
          <Descriptions.Item label="学位论文题目">{a.thesisTitle || '-'}</Descriptions.Item>
          <Descriptions.Item label="实际毕业日期">{a.actualGraduationDate || a.defenseDate || '-'}</Descriptions.Item>
        </Descriptions>
      );
    }
    return null;
  };

  return (
    <Card title="成果审批">
      <Space style={{ marginBottom: 16 }} wrap>
        <Select placeholder="选择课题" allowClear style={{ width: 200 }}
          onChange={(v) => setFilter({ ...filter, topicId: v })}>
          {topics.map((t) => (<Option key={t.id} value={t.id}>{t.name}</Option>))}
        </Select>
        <Select placeholder="成果类型" allowClear style={{ width: 140 }}
          onChange={(v) => setFilter({ ...filter, achievementType: v })}>
          {ACHIEVEMENT_TYPES.map((t) => (<Option key={t} value={t}>{t}</Option>))}
        </Select>
        <Select placeholder="状态" allowClear style={{ width: 140 }}
          onChange={(v) => setFilter({ ...filter, status: v })}>
          {ACHIEVEMENT_STATUS.filter((s) => s !== '草稿').map((s) => (
            <Option key={s} value={s}>{s}</Option>
          ))}
        </Select>
      </Space>

      <Table rowKey="id" columns={columns} dataSource={filtered} pagination={{ pageSize: 10 }} scroll={{ x: 1400 }} />

      {/* ======== Approval Modal ======== */}
      <Modal
        title={`审批：${editing?.title || ''}`}
        open={visible}
        width={900}
        onOk={() => form.submit()}
        onCancel={() => { setVisible(false); setEditing(null); setValidation(null); form.resetFields(); }}
      >
        {editing && (
          <>
            {renderBasicDescriptions(editing)}
            <div style={{ margin: '12px 0' }}>{renderTypeSpecificDescriptions(editing)}</div>

            {/* Validation result */}
            {validation && (
              <Card size="small"
                title={
                  <Space>
                    <Text strong>系统自动校验</Text>
                    <Tag color={validation.passed ? 'success' : 'error'}>
                      {validation.passed ? '全部通过' : '未通过'}
                    </Tag>
                  </Space>
                }
                style={{ marginBottom: 16 }}>
                {validation.checks.map(
                  (check: { label: string; passed: boolean; detail?: string }, idx: number) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                      {check.passed
                        ? <CheckCircleFilled style={{ color: '#52c41a', marginRight: 8 }} />
                        : <CloseCircleFilled style={{ color: '#f5222d', marginRight: 8 }} />
                      }
                      <Text style={{ flex: 1 }}>{check.label}</Text>
                      {check.detail && (
                        <Text type={check.passed ? 'secondary' : 'danger'} style={{ fontSize: 12 }}>
                          {check.detail}
                        </Text>
                      )}
                    </div>
                  )
                )}
              </Card>
            )}

            {/* Materials review section with approve/return buttons */}
            {editing.materials && editing.materials.length > 0 && (
              <Card size="small" title="佐证材料审核" style={{ marginBottom: 16 }}>
                {editing.materials.map((m) => (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 8, padding: 8, border: '1px solid #f0f0f0', borderRadius: 4,
                  }}>
                    <div style={{ flex: 1 }}>
                      <Text strong>{m.materialType || m.name}</Text>
                      {m.fileName && <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>{m.fileName}</Text>}
                      <Tag color={matColor[m.status]} style={{ marginLeft: 8 }}>{m.status}</Tag>
                      {m.reviewOpinion && <Text type="danger" style={{ fontSize: 12, display: 'block' }}>{m.reviewOpinion}</Text>}
                    </div>
                    <Space>
                      {m.fileId && (
                        <>
                          <Button size="small" type="link" onClick={() => mockFileService.preview(m.fileId)}>预览</Button>
                          <Button size="small" type="link" onClick={() => mockFileService.download(m.fileId)}>下载</Button>
                        </>
                      )}
                      {m.status === '待审核' && (
                        <>
                          <Button size="small" type="primary" onClick={() => handleMaterialApprove(m.id, editing.id)}>
                            通过
                          </Button>
                          <Button size="small" danger onClick={() => {
                            const reason = window.prompt('请输入退回原因：');
                            if (reason) handleMaterialReturn(m.id, editing.id, reason);
                          }}>
                            退回
                          </Button>
                        </>
                      )}
                    </Space>
                  </div>
                ))}
              </Card>
            )}
          </>
        )}

        {/* Approval form */}
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="审批结论" name="result" initialValue="pass" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="pass">审批通过</Radio>
              <Radio value="reject">审批不通过</Radio>
              <Radio value="return">退回修改</Radio>
            </Radio.Group>
          </Form.Item>

          {validation && (
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">
                审批通过后将自动计入指标；审批不通过或退回修改将不计入指标。
              </Text>
            </div>
          )}

          <Form.Item label="审批意见" name="approvalOpinion">
            <TextArea rows={3} placeholder="请输入审批意见（不通过/退回时建议填写原因）" />
          </Form.Item>
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
            {renderBasicDescriptions(detailAchievement)}
            <div>{renderTypeSpecificDescriptions(detailAchievement)}</div>

            <Descriptions title="审批记录" bordered column={2} size="small">
              <Descriptions.Item label="审批人">{detailAchievement.approver || '-'}</Descriptions.Item>
              <Descriptions.Item label="审批时间">{detailAchievement.approvedAt || '-'}</Descriptions.Item>
              <Descriptions.Item label="审批意见">{detailAchievement.approvalOpinion || '-'}</Descriptions.Item>
              <Descriptions.Item label="是否计入指标">{detailAchievement.countsToIndicator ? '是' : '否'}</Descriptions.Item>
              <Descriptions.Item label="佐证材料规则">
                {ACHIEVEMENT_EVIDENCE_RULES[detailAchievement.achievementType]?.displayText || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Card title="佐证材料" size="small">
              {detailAchievement.materials && detailAchievement.materials.length > 0 ? (
                detailAchievement.materials.map((m) => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text>{m.materialType || m.name}</Text>
                    <Space>
                      {m.fileName && <Text type="secondary" style={{ fontSize: 12 }}>{m.fileName}</Text>}
                      {m.fileId && (
                        <Button size="small" type="link" onClick={() => mockFileService.preview(m.fileId)}>预览</Button>
                      )}
                      {m.fileUrl && (
                        <Button size="small" type="link" href={m.fileUrl} target="_blank">下载</Button>
                      )}
                      <Tag color={matColor[m.status]}>{m.status}</Tag>
                    </Space>
                  </div>
                ))
              ) : (<Text type="secondary">无材料</Text>)}
            </Card>
          </Space>
        )}
      </Modal>
    </Card>
  );
}
