import { useState, useMemo } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  TableOutlined,
  DownloadOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../../store';
import {
  ACHIEVEMENT_TYPES,
  type AchievementType,
  type IndicatorConfig,
  type TimeNode,
  type Topic,
} from '../../types';
import { exportToExcel } from '../../utils/export';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

export function IndicatorConfigPage() {
  const {
    project,
    topics,
    units,
    nodes,
    indicators,
    addNode,
    updateNode,
    removeNode,
    addIndicator,
    removeIndicator,
    batchUpdateIndicators,
    updateTopic,
    topicPowerGridRequirements,
    addPowerGridReq,
    updatePowerGridReq,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState('topic-config');
  const [nodeFormVisible, setNodeFormVisible] = useState(false);
  const [editingNode, setEditingNode] = useState<TimeNode | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');

  const [topicDrawerOpen, setTopicDrawerOpen] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string>('');

  const [nodeForm] = Form.useForm();

  const topicMap = Object.fromEntries(topics.map((t) => [t.id, t]));
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const unitMap = Object.fromEntries(units.map((u) => [u.id, u.name]));

  const sortedNodes = [...nodes].sort((a, b) => a.sortOrder - b.sortOrder);

  // ---- TimeNode handlers ----
  const handleSaveNode = (values: any) => {
    const payload = {
      projectId: project.id,
      name: values.name,
      deadline: values.deadline ? dayjs(values.deadline).format('YYYY-MM-DD') : '',
      description: values.description || '',
      participatesInWarning: values.participatesInWarning,
      sortOrder: values.sortOrder,
    };
    if (editingNode) {
      updateNode(editingNode.id, payload);
      message.success('更新时间节点成功');
    } else {
      const id = `node-${Date.now()}`;
      addNode({ ...payload, id });
      message.success('新增时间节点成功');
    }
    setNodeFormVisible(false);
    setEditingNode(null);
    nodeForm.resetFields();
  };

  const openNodeForm = (node?: TimeNode) => {
    setEditingNode(node || null);
    if (node) {
      nodeForm.setFieldsValue({
        ...node,
        deadline: node.deadline ? dayjs(node.deadline) : undefined,
      });
    } else {
      nodeForm.resetFields();
      nodeForm.setFieldsValue({
        participatesInWarning: true,
        sortOrder: nodes.length + 1,
      });
    }
    setNodeFormVisible(true);
  };

  // ---- Topic Drawer handlers ----
  const openTopicDrawer = (topicId: string) => {
    setEditingTopicId(topicId);
    setTopicDrawerOpen(true);
  };

  const closeTopicDrawer = () => {
    setTopicDrawerOpen(false);
    setEditingTopicId('');
  };

  const editingTopic = editingTopicId ? topicMap[editingTopicId] : null;
  const editingPowerGridReqs = editingTopicId ? topicPowerGridRequirements.filter((r) => r.topicId === editingTopicId) : [];

  const handleSaveTopicBasic = (values: any, topic: Topic) => {
    updateTopic(topic.id, {
      code: values.code, name: values.name,
      principalName: values.principalName || '',
      contactName: values.contactName || '',
      contactPhone: values.contactPhone || '',
      contactEmail: values.contactEmail || '',
      financeAssistant: values.financeAssistant || '',
      financeAssistantEmail: values.financeAssistantEmail || '',
      financeAssistantPhone: values.financeAssistantPhone || '',
      remarks: values.remarks || '',
    });
    message.success('基本信息更新成功');
  };

  const handleSaveTopicUnits = (values: any, topic: Topic) => {
    const pUnits = values.participatingUnits
      ? values.participatingUnits.split(/[,，、\n]/).map((s: string) => s.trim()).filter(Boolean)
      : [];
    updateTopic(topic.id, {
      leadingUnitId: values.leadingUnit,
      participatingUnitIds: pUnits,
    });
    message.success('参与单位更新成功');
  };

  const handleSaveTopicReq = (values: any, topic: Topic) => {
    const overallReqs: Record<string, number> = {};
    ACHIEVEMENT_TYPES.forEach((type) => { overallReqs[type] = values[`req_${type}`] ?? 0; });
    updateTopic(topic.id, {
      domesticJournalRequiredCount: values.domesticJournalRequiredCount ?? 0,
      topicOverallRequirements: overallReqs,
    });
    message.success('成果要求更新成功');
  };

  const handleSavePowerGridReqs = (values: { achievementType: string; requiredCount: number }[], topic: Topic) => {
    values.forEach((val) => {
      const existing = topicPowerGridRequirements.find((r) => r.topicId === topic.id && r.achievementType === val.achievementType);
      if (existing) {
        updatePowerGridReq(existing.id, { requiredCount: val.requiredCount });
      } else if (val.requiredCount > 0) {
        addPowerGridReq({ id: `pgr-${Date.now()}-${val.achievementType}`, projectId: project.id, topicId: topic.id, achievementType: val.achievementType as any, requiredCount: val.requiredCount });
      }
    });
    message.success('电网公司成果要求更新成功');
  };

  // ---- Tab 3: 指标分解 ----
  const selectedTopic = selectedTopicId ? topicMap[selectedTopicId] : null;
  const selectedNode = selectedNodeId ? nodeMap[selectedNodeId] : null;

  const topicUnitIds = selectedTopic
    ? [selectedTopic.leadingUnitId, ...selectedTopic.participatingUnitIds]
    : [];

  const topicIndicators = selectedTopicId
    ? indicators.filter((i) => i.topicId === selectedTopicId)
    : [];

  const SEP = '::';
  const [matrixEdits, setMatrixEdits] = useState<Record<string, number>>({});

  const makeKey = (unitId: string, type: string) => `${unitId}${SEP}${type}`;
  const parseKey = (key: string) => {
    const idx = key.indexOf(SEP);
    return { unitId: key.substring(0, idx), type: key.substring(idx + SEP.length) };
  };

  const matrixData = useMemo(() => {
    if (!selectedTopic || !selectedNodeId) return { rows: [] as { unitId: string; unitName: string; cells: Record<string, IndicatorConfig | undefined> }[], totals: {} as Record<string, number> };

    const rows = topicUnitIds.map((unitId) => {
      const cells: Record<string, IndicatorConfig | undefined> = {};
      ACHIEVEMENT_TYPES.forEach((type) => {
        cells[type] = topicIndicators.find(
          (i) => i.unitId === unitId && i.achievementType === type && i.nodeId === selectedNodeId
        );
      });
      return { unitId, unitName: unitMap[unitId] || unitId, cells };
    });

    const totals: Record<string, number> = {};
    ACHIEVEMENT_TYPES.forEach((type) => {
      totals[type] = rows.reduce((sum, row) => {
        const editKey = makeKey(row.unitId, type);
        if (editKey in matrixEdits) return sum + matrixEdits[editKey];
        return sum + (row.cells[type]?.plannedQuantity || 0);
      }, 0);
    });

    return { rows, totals };
  }, [selectedTopic, selectedNodeId, topicIndicators, topicUnitIds, unitMap, matrixEdits]);

  const handleMatrixCellChange = (unitId: string, type: string, value: number | null) => {
    setMatrixEdits((prev) => ({ ...prev, [makeKey(unitId, type)]: value ?? 0 }));
  };

  const handleBatchSave = () => {
    if (!selectedTopicId || !selectedNodeId) return;

    const updates: { id: string; plannedQuantity: number }[] = [];
    const newIndicators: IndicatorConfig[] = [];
    const today = new Date().toISOString().split('T')[0];

    Object.entries(matrixEdits).forEach(([key, qty]) => {
      const { unitId, type } = parseKey(key);

      const existing = topicIndicators.find(
        (i) => i.unitId === unitId && i.achievementType === type && i.nodeId === selectedNodeId
      );

      if (existing) {
        updates.push({ id: existing.id, plannedQuantity: qty });
      } else if (qty > 0) {
        newIndicators.push({
          id: `ind-${Date.now()}-${unitId}-${type}`,
          projectId: project.id,
          topicId: selectedTopicId,
          unitId,
          achievementType: type as AchievementType,
          nodeId: selectedNodeId,
          plannedQuantity: qty,
          createdAt: today,
          updatedAt: today,
        });
      }
    });

    const zeroEntries = Object.entries(matrixEdits).filter(([, qty]) => qty === 0);
    zeroEntries.forEach(([key]) => {
      const { unitId, type } = parseKey(key);
      const existing = topicIndicators.find(
        (i) => i.unitId === unitId && i.achievementType === type && i.nodeId === selectedNodeId
      );
      if (existing) {
        removeIndicator(existing.id);
      }
    });

    if (updates.length > 0) {
      batchUpdateIndicators(updates);
    }
    newIndicators.forEach((ind) => {
      addIndicator(ind);
    });

    setMatrixEdits({});
    message.success('批量保存成功');
  };

  const nodeColumns = [
    { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder', width: 70 },
    { title: '节点名称', dataIndex: 'name', key: 'name' },
    { title: '截止时间', dataIndex: 'deadline', key: 'deadline' },
    { title: '节点说明', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '参与预警',
      dataIndex: 'participatesInWarning',
      key: 'participatesInWarning',
      render: (v: boolean) => (v ? <Tag color="blue">是</Tag> : <Tag>否</Tag>),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: TimeNode) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openNodeForm(record)}>
            编辑
          </Button>
          <Button
            icon={<DeleteOutlined />}
            danger
            size="small"
            onClick={() => {
              removeNode(record.id);
              message.success('已删除');
            }}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const renderTopicConfigTab = () => (
    <div>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {topics.map((topic) => (
          <Card
            key={topic.id}
            size="small"
            hoverable
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Space>
                    <Tag color="blue">{topic.code}</Tag>
                    <Text strong style={{ fontSize: 16 }}>{topic.name}</Text>
                  </Space>
                  <Space size="large" wrap>
                    <Text type="secondary">
                      牵头单位：{topic.leadingUnitId || '-'}
                    </Text>
                    <Text type="secondary">
                      参与单位：{topic.participatingUnitIds.length} 个
                    </Text>
                    <Text type="secondary">
                      国内期刊要求：{topic.domesticJournalRequiredCount || 0} 篇
                    </Text>
                  </Space>
                </Space>
              </div>
              <Button
                type="primary"
                icon={<SettingOutlined />}
                onClick={() => openTopicDrawer(topic.id)}
              >
                编辑配置
              </Button>
            </div>
          </Card>
        ))}
      </Space>

      {/* Topic Edit Drawer */}
      <Drawer
        title={editingTopic ? `${editingTopic.code} ${editingTopic.name} - 课题配置` : '课题配置'}
        open={topicDrawerOpen}
        onClose={closeTopicDrawer}
        width={720}
        destroyOnClose
      >
        {editingTopic && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* Section 1: 基本信息 */}
            <Card title="基本信息" size="small">
              <Section1BasicInfo
                topic={editingTopic}
                onSave={(values) => handleSaveTopicBasic(values, editingTopic)}
              />
            </Card>

            {/* Section 2: 参与单位 (Select dropdowns) */}
            <Card title="参与单位" size="small">
              <Section2Units
                topic={editingTopic}
                onSave={(values) => handleSaveTopicUnits(values, editingTopic)}
              />
            </Card>

            {/* Section 3: 课题总体成果要求 */}
            <Card title="课题成果要求" size="small">
              <Section3TopicReq
                topic={editingTopic}
                onSave={(values) => handleSaveTopicReq(values, editingTopic)}
              />
            </Card>

            {/* Section 4: 电网公司主导成果要求 */}
            <Card title="电网公司主导成果要求" size="small">
              <Section4PowerGrid
                topic={editingTopic}
                powerGridReqs={editingPowerGridReqs}
                onSave={(values) => handleSavePowerGridReqs(values, editingTopic)}
              />
            </Card>
          </Space>
        )}
      </Drawer>
    </div>
  );

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane
          tab={<span><SettingOutlined /> 课题配置</span>}
          key="topic-config"
        >
          {renderTopicConfigTab()}
        </Tabs.TabPane>

        <Tabs.TabPane
          tab={<span><TableOutlined /> 时间节点配置</span>}
          key="nodes"
        >
          <Card
            title="时间节点配置"
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openNodeForm()}>
                新增节点
              </Button>
            }
          >
            <Table
              rowKey="id"
              columns={nodeColumns}
              dataSource={sortedNodes}
              pagination={false}
            />
          </Card>
        </Tabs.TabPane>

        <Tabs.TabPane
          tab={<span><TableOutlined /> 指标分解</span>}
          key="indicator-decompose"
        >
          <Card size="small" style={{ marginBottom: 16 }}>
            <Space>
              <Text strong>选择课题：</Text>
              <Select
                placeholder="请选择课题"
                style={{ width: 400 }}
                value={selectedTopicId || undefined}
                onChange={(v) => {
                  setSelectedTopicId(v || '');
                  setSelectedNodeId('');
                  setMatrixEdits({});
                }}
                allowClear
              >
                {topics.map((t) => (
                  <Option key={t.id} value={t.id}>{t.code} {t.name}</Option>
                ))}
              </Select>

              {selectedTopic && sortedNodes.length > 0 && (
                <>
                  <Text strong>时间节点：</Text>
                  <Radio.Group
                    value={selectedNodeId}
                    onChange={(e) => {
                      setSelectedNodeId(e.target.value);
                      setMatrixEdits({});
                    }}
                  >
                    {sortedNodes.map((n) => (
                      <Radio.Button key={n.id} value={n.id}>
                        {n.name}（{n.deadline}）
                      </Radio.Button>
                    ))}
                  </Radio.Group>
                </>
              )}
            </Space>
          </Card>

          {selectedTopic && (
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space direction="vertical" size={4}>
                <Text strong>{selectedTopic.code} {selectedTopic.name}</Text>
                <Space size="large" wrap>
                  <Text type="secondary">牵头单位：{selectedTopic.leadingUnitId || '-'}</Text>
                  <Text type="secondary">参与单位：{selectedTopic.participatingUnitIds.join('、') || '-'}</Text>
                  <Text type="secondary">负责人：{selectedTopic.principalName || '-'}</Text>
                  <Text type="secondary">联系人：{selectedTopic.contactName || '-'}（{selectedTopic.contactPhone || ''}{selectedTopic.contactEmail ? ` / ${selectedTopic.contactEmail}` : ''}）</Text>
                </Space>
                <Space size="large">
                  <Text type="secondary">国内期刊要求：{selectedTopic.domesticJournalRequiredCount || 0} 篇</Text>
                </Space>
              </Space>
            </Card>
          )}

          {selectedNodeId && selectedTopic && (
            <Card
              title="指标分解矩阵"
              extra={
                <Space>
                  <Button icon={<DownloadOutlined />} onClick={() => {
                    const rows = matrixData.rows.map((row) => {
                      const r: any = { 单位: row.unitName };
                      ACHIEVEMENT_TYPES.forEach((type) => {
                        r[type] = row.cells[type]?.plannedQuantity ?? matrixEdits[makeKey(row.unitId, type)] ?? 0;
                      });
                      return r;
                    });
                    exportToExcel(rows, `指标矩阵_${selectedTopic?.code}_${selectedNode?.name}`);
                  }}>导出 Excel</Button>
                  <Button type="primary" onClick={handleBatchSave}>批量保存</Button>
                </Space>
              }
            >
              <Table
                rowKey="unitId"
                pagination={false}
                scroll={{ x: 900 }}
                dataSource={matrixData.rows}
                columns={[
                  {
                    title: '单位',
                    dataIndex: 'unitName',
                    key: 'unitName',
                    width: 150,
                    fixed: 'left' as const,
                  },
                  ...ACHIEVEMENT_TYPES.map((type) => ({
                    title: type,
                    key: type,
                    width: 120,
                    render: (_: any, row: any) => {
                      const existing = row.cells[type];
                      const editKey = makeKey(row.unitId, type);
                      const val = editKey in matrixEdits ? matrixEdits[editKey] : (existing?.plannedQuantity ?? 0);
                      return (
                        <InputNumber
                          min={0}
                          value={val}
                          size="small"
                          style={{ width: '100%' }}
                          onChange={(v) => handleMatrixCellChange(row.unitId, type, v)}
                        />
                      );
                    },
                  })),
                ]}
                summary={() => (
                  <Table.Summary>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}>
                        <Text strong>各单位合计</Text>
                      </Table.Summary.Cell>
                      {ACHIEVEMENT_TYPES.map((type) => (
                        <Table.Summary.Cell key={type} index={ACHIEVEMENT_TYPES.indexOf(type) + 1}>
                          <Text strong>{matrixData.totals[type] || 0}</Text>
                        </Table.Summary.Cell>
                      ))}
                    </Table.Summary.Row>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}>
                        <Text strong type="warning">课题总指标</Text>
                      </Table.Summary.Cell>
                      {ACHIEVEMENT_TYPES.map((type) => {
                        const val = selectedTopic?.topicOverallRequirements?.[type] ?? 0;
                        return (
                          <Table.Summary.Cell key={type} index={ACHIEVEMENT_TYPES.indexOf(type) + 1}>
                            <Text strong>{val}</Text>
                          </Table.Summary.Cell>
                        );
                      })}
                    </Table.Summary.Row>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}>
                        <Text type="danger">差值（缺口）</Text>
                      </Table.Summary.Cell>
                      {ACHIEVEMENT_TYPES.map((type) => {
                        const targetVal = selectedTopic?.topicOverallRequirements?.[type] ?? 0;
                        const unitTotal = matrixData.totals[type] || 0;
                        const gap = targetVal - unitTotal;
                        return (
                          <Table.Summary.Cell key={type} index={ACHIEVEMENT_TYPES.indexOf(type) + 1}>
                            <Text type={gap !== 0 ? 'danger' : undefined} strong>
                              {gap > 0 ? `-${gap}` : gap < 0 ? `+${Math.abs(gap)}` : '0'}
                            </Text>
                          </Table.Summary.Cell>
                        );
                      })}
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </Card>
          )}
        </Tabs.TabPane>
      </Tabs>

      {/* Node Form Modal */}
      <Modal
        title={editingNode ? '编辑时间节点' : '新增时间节点'}
        open={nodeFormVisible}
        onOk={() => nodeForm.submit()}
        onCancel={() => {
          setNodeFormVisible(false);
          setEditingNode(null);
          nodeForm.resetFields();
        }}
      >
        <Form form={nodeForm} layout="vertical" onFinish={handleSaveNode}>
          <Form.Item label="节点名称" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="截止时间" name="deadline" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="节点说明" name="description">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item label="排序" name="sortOrder" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="参与预警" name="participatesInWarning" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// ---- Section Components for Topic Drawer ----

function Section1BasicInfo({ topic, onSave }: { topic: Topic; onSave: (values: any) => void }) {
  const [form] = Form.useForm();

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onSave(values);
    });
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        code: topic.code,
        name: topic.name,
        principalName: topic.principalName || '',
        contactName: topic.contactName || '',
        contactPhone: topic.contactPhone || '',
        contactEmail: topic.contactEmail || '',
        financeAssistant: topic.financeAssistant || '',
        financeAssistantEmail: topic.financeAssistantEmail || '',
        financeAssistantPhone: topic.financeAssistantPhone || '',
        remarks: topic.remarks || '',
      }}
    >
      <Form.Item label="课题编号" name="code" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label="课题名称" name="name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label="课题负责人" name="principalName">
        <Input placeholder="请输入课题负责人姓名" />
      </Form.Item>
      <Form.Item label="课题联系人" name="contactName">
        <Input placeholder="请输入联系人姓名" />
      </Form.Item>
      <Form.Item label="课题联系人手机" name="contactPhone">
        <Input placeholder="请输入联系人手机" />
      </Form.Item>
      <Form.Item label="课题联系人邮箱" name="contactEmail">
        <Input placeholder="请输入联系人邮箱" />
      </Form.Item>
      <Form.Item label="课题财务助理" name="financeAssistant">
        <Input placeholder="请输入财务助理姓名" />
      </Form.Item>
      <Form.Item label="财务助理邮箱" name="financeAssistantEmail">
        <Input placeholder="请输入财务助理邮箱" />
      </Form.Item>
      <Form.Item label="财务助理手机" name="financeAssistantPhone">
        <Input placeholder="请输入财务助理手机" />
      </Form.Item>
      <Form.Item label="备注" name="remarks">
        <TextArea rows={2} />
      </Form.Item>
      <Button type="primary" onClick={handleSubmit}>保存基本信息</Button>
    </Form>
  );
}

function Section2Units({ topic, onSave }: { topic: Topic; onSave: (values: any) => void }) {
  const [form] = Form.useForm();

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onSave(values);
    });
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        leadingUnit: topic.leadingUnitId,
        participatingUnits: topic.participatingUnitIds.join('、'),
      }}
    >
      <Form.Item label="牵头单位" name="leadingUnit" rules={[{ required: true, message: '请输入牵头单位' }]}>
        <Input placeholder="请输入牵头单位名称" />
      </Form.Item>
      <Form.Item label="参与单位" name="participatingUnits" help="多个单位用顿号或逗号分隔">
        <TextArea rows={3} placeholder="请输入参与单位名称，多个用顿号分隔" />
      </Form.Item>
      <Button type="primary" onClick={handleSubmit}>保存参与单位</Button>
    </Form>
  );
}

const POWER_GRID_TYPES: Array<'学术论文' | '发明专利' | '软件著作权' | '标准规范'> = ['学术论文', '发明专利', '软件著作权', '标准规范'];

function Section3TopicReq({ topic, onSave }: { topic: Topic; onSave: (values: any) => void }) {
  const [form] = Form.useForm();
  const reqs = topic.topicOverallRequirements || {};

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onSave(values);
    });
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        ...Object.fromEntries(ACHIEVEMENT_TYPES.map((t) => [`req_${t}`, reqs[t] ?? 0])),
        domesticJournalRequiredCount: topic.domesticJournalRequiredCount || 0,
      }}
    >
      {ACHIEVEMENT_TYPES.map((type) => (
        <Form.Item key={type} label={`${type}要求数量`} name={`req_${type}`}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
      ))}
      <Form.Item label="国内期刊论文要求（篇）" name="domesticJournalRequiredCount">
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>
      <Button type="primary" onClick={handleSubmit}>保存成果要求</Button>
    </Form>
  );
}

function Section4PowerGrid({ powerGridReqs, onSave }: { topic: Topic; powerGridReqs: import('../../types').TopicPowerGridRequirement[]; onSave: (values: any[]) => void }) {
  const [form] = Form.useForm();
  const reqMap = Object.fromEntries(powerGridReqs.map((r) => [r.achievementType, r]));

  const handleSubmit = () => {
    form.validateFields().then(() => {
      const values = form.getFieldsValue();
      const result = POWER_GRID_TYPES.map((type) => ({ achievementType: type, requiredCount: values[`pg_${type}`] ?? 0 }));
      onSave(result);
    });
  };

  return (
    <Form form={form} layout="vertical" initialValues={(() => { const obj: Record<string, any> = {}; POWER_GRID_TYPES.forEach((t) => { obj[`pg_${t}`] = reqMap[t]?.requiredCount ?? 0; }); return obj; })()}>
      <Table rowKey="type" pagination={false} dataSource={POWER_GRID_TYPES.map((type) => ({ type, label: type }))}
        columns={[
          { title: '成果类型', dataIndex: 'label', key: 'label', width: 120 },
          { title: '电网公司主导要求', key: 'count', render: (_: any, record: { type: string }) => (
            <Form.Item name={`pg_${record.type}`} style={{ margin: 0 }}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          )},
        ]}
      />
      <Button type="primary" onClick={handleSubmit} style={{ marginTop: 16 }}>保存电网公司成果要求</Button>
    </Form>
  );
}
