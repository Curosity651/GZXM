import { Card, Col, Form, Input, Row, Select } from 'antd';
import { type Achievement, type IndicatorDefinition, type Project, type TimeNode, type UnitIndicatorAllocation } from '../../types';
import { PaperFields } from './PaperFields';
import { PatentFields } from './PatentFields';
import { CopyrightFields } from './CopyrightFields';
import { StandardFields } from './StandardFields';
import { TalentFields } from './TalentFields';

const { Option } = Select;
const { TextArea } = Input;

interface TopicInfo {
  id: string; name: string; leadingUnitId: string; participatingUnitIds: string[];
}

interface UnitInfo {
  id: string; name: string;
}

interface AchievementFormProps {
  form: any;
  topics: TopicInfo[];
  units: UnitInfo[];
  achievement?: Achievement;
  lockOwnership?: boolean;
  definitions?: IndicatorDefinition[];
  project: Project;
  allocations: UnitIndicatorAllocation[];
  nodes: TimeNode[];
  currentUnitId?: string;
}

export function AchievementForm({ form, topics, units, lockOwnership = false, definitions = [], project, allocations, nodes, currentUnitId }: AchievementFormProps) {
  const achievementType = Form.useWatch('achievementType', form);
  const topicId = Form.useWatch('topicId', form);
  const allocationId = Form.useWatch('unitIndicatorAllocationId', form);
  const unit = units.find((item) => item.id === currentUnitId);
  const baseDefinitionIds = new Set(definitions
    .filter((item) => item.enabled && item.name === item.achievementType)
    .map((item) => item.id));
  const availableAllocations = allocations.filter((item) => item.status === '已下发'
    && item.targetQuantity > 0
    && item.unitId === currentUnitId
    && item.topicId === topicId
    && baseDefinitionIds.has(item.indicatorDefinitionId));
  const selectedAllocation = allocations.find((item) => item.id === allocationId);
  const selectedNode = nodes.find((item) => item.id === selectedAllocation?.nodeId);

  return (
    <div>
      <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="所属项目">
              <Input value={`${project.name}（${project.code}）`} disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="所属课题" name="topicId" rules={[{ required: true, message: '请选择课题' }]}>
              <Select
                placeholder="选择课题"
                disabled={lockOwnership}
                onChange={() => form.setFieldsValue({ unitIndicatorAllocationId: undefined, indicatorDefinitionId: undefined, achievementType: undefined, nodeId: undefined })}
              >
                {topics.filter((item) => allocations.some((allocation) => allocation.status === '已下发'
                  && allocation.targetQuantity > 0
                  && allocation.unitId === currentUnitId
                  && allocation.topicId === item.id
                  && baseDefinitionIds.has(allocation.indicatorDefinitionId))).map((t) => (
                  <Option key={t.id} value={t.id}>{t.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="填报单位">
              <Input value={unit?.name ?? '未配置所属单位'} disabled />
            </Form.Item>
            <Form.Item name="unitId" hidden rules={[{ required: true, message: '缺少当前账号所属单位' }]}><Input /></Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="对应成果指标" name="unitIndicatorAllocationId" rules={[{ required: true, message: '请选择当前单位已下发的成果指标' }]}>
              <Select
                placeholder={topicId ? '选择已下发的成果指标' : '请先选择课题'}
                disabled={!topicId || lockOwnership}
                onChange={(id) => {
                  const allocation = allocations.find((item) => item.id === id);
                  form.setFieldsValue({
                    indicatorDefinitionId: allocation?.indicatorDefinitionId,
                    achievementType: allocation?.achievementType,
                    nodeId: allocation?.nodeId,
                  });
                }}
                options={availableAllocations.map((allocation) => {
                  const definition = definitions.find((item) => item.id === allocation.indicatorDefinitionId);
                  const node = nodes.find((item) => item.id === allocation.nodeId);
                  return { label: `${definition?.name ?? allocation.achievementType} · ${node?.name ?? allocation.nodeId}（目标 ${allocation.targetQuantity}）`, value: allocation.id };
                })}
              />
            </Form.Item>
            <Form.Item name="indicatorDefinitionId" hidden><Input /></Form.Item>
            <Form.Item name="achievementType" hidden><Input /></Form.Item>
            <Form.Item name="nodeId" hidden><Input /></Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="考核节点">
              <Input value={selectedNode ? `${selectedNode.name}（${selectedNode.deadline}）` : '请先选择成果指标'} disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="本单位下发目标">
              <Input value={selectedAllocation ? `${selectedAllocation.targetQuantity} ${definitions.find((item) => item.id === selectedAllocation.indicatorDefinitionId)?.unit ?? '项'}` : '—'} disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="成果名称/题目" name="title" rules={[{ required: true, message: '请输入成果名称' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="填报负责人" name="responsiblePerson" rules={[{ required: true, message: '请填写填报负责人' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="备注" name="remarks">
              <TextArea rows={2} />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {achievementType && (
        <Card title={achievementType === '学术论文' ? '论文信息与作者' : achievementType === '发明专利' ? '提案信息、发明人与申请人' : achievementType === '软件著作权' ? '软件信息、著作权人与技术特点' : `${achievementType}详细信息`} size="small" style={{ marginBottom: 16 }}>
          {achievementType === '学术论文' && <PaperFields />}
          {achievementType === '发明专利' && <PatentFields />}
          {achievementType === '软件著作权' && <CopyrightFields />}
          {achievementType === '标准规范' && <StandardFields />}
          {achievementType === '人才培养' && <TalentFields />}
        </Card>
      )}
    </div>
  );
}
