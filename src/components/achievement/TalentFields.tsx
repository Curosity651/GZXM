import { Col, Form, Input, Row, Select } from 'antd';
import { educationLevelOptions } from '../../utils/helpers';

const { Option } = Select;

export function TalentFields() {
  return (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="学生姓名" name="studentName" rules={[{ required: true, message: '请填写学生姓名' }]}>
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="培养层次" name="educationLevel" rules={[{ required: true, message: '请选择培养层次' }]}>
          <Select placeholder="选择培养层次">
            {educationLevelOptions.map((e) => (
              <Option key={e} value={e}>{e}</Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="培养单位" name="trainingUnit" rules={[{ required: true, message: '请填写培养单位' }]}>
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="导师姓名" name="supervisorName" rules={[{ required: true, message: '请填写导师姓名' }]}>
          <Input />
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item label="学位论文题目" name="thesisTitle" rules={[{ required: true, message: '请填写学位论文题目' }]}>
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="入学时间" name="enrollmentDate">
          <Input type="date" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="预计毕业时间" name="expectedGraduationDate">
          <Input type="date" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="实际毕业时间" name="actualGraduationDate">
          <Input type="date" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="当前培养状态" name="trainingStatus" rules={[{ required: true, message: '请填写当前培养状态' }]}>
          <Input />
        </Form.Item>
      </Col>
    </Row>
  );
}
