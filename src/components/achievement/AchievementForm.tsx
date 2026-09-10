import { Card, Col, Form, Input, Row, Select } from 'antd';
import { type Achievement, type IndicatorDefinition } from '../../types';
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
}

export function AchievementForm({ form, topics, units, lockOwnership = false, definitions = [] }: AchievementFormProps) {
  const achievementType = Form.useWatch('achievementType', form);
  const topicId = Form.useWatch('topicId', form);
  const topic = topics.find((t) => t.id === topicId);
  const unitMap = Object.fromEntries(units.map((u) => [u.id, u.name]));
  const unitOptions = topic
    ? [topic.leadingUnitId, ...topic.participatingUnitIds]
    : [];

  return (
    <div>
      <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="所属课题" name="topicId" rules={[{ required: true, message: '请选择课题' }]}>
              <Select
                placeholder="选择课题"
                disabled={lockOwnership}
                onChange={() => form.setFieldsValue({ unitId: undefined })}
              >
                {topics.map((t) => (
                  <Option key={t.id} value={t.id}>{t.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="责任单位" name="unitId" rules={[{ required: true, message: '请选择责任单位' }]}>
              <Select placeholder="选择责任单位" disabled={!topicId || lockOwnership}>
                {unitOptions.map((uid) => (
                  <Option key={uid} value={uid}>{unitMap[uid] || uid}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="对应成果指标" name="indicatorDefinitionId" rules={[{ required: true, message: '请选择成果指标' }]}>
              <Select placeholder="选择已分配的成果指标" disabled={lockOwnership} onChange={(id) => form.setFieldValue('achievementType', definitions.find((item) => item.id === id)?.achievementType)} options={definitions.filter((item) => item.enabled).map((item) => ({ label: item.name, value: item.id }))} />
            </Form.Item>
            <Form.Item name="achievementType" hidden><Input /></Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="成果名称/题目" name="title" rules={[{ required: true, message: '请输入成果名称' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="第一完成人/责任人" name="responsiblePerson" rules={[{ required: true }]}>
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
