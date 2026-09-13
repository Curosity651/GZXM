import { Col, Form, Input, Row } from 'antd';

export function StandardFields() {
  return (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="标准类型/级别" name="standardLevel" rules={[{ required: true, message: '请填写标准类型或级别' }]}>
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="牵头单位" name="leadingUnit" rules={[{ required: true, message: '请填写牵头单位' }]}>
          <Input />
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item label="参与单位" name="participatingUnits">
          <Input />
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item label="主要起草人" name="drafters" rules={[{ required: true, message: '请填写主要起草人' }]}>
          <Input />
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item label="归口单位/标准组织" name="responsibleOrganization">
          <Input />
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item label="标准当前阶段" name="currentStage" rules={[{ required: true, message: '请填写标准当前阶段' }]}>
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="送审稿形成时间" name="draftSubmissionDate">
          <Input type="date" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="送审稿提交时间" name="draftCommitDate">
          <Input type="date" />
        </Form.Item>
      </Col>
    </Row>
  );
}
