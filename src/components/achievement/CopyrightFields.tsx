import { Col, Form, Input, Row } from 'antd';

export function CopyrightFields() {
  return (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="软件简称" name="shortName">
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="版本号" name="version">
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="著作权人" name="copyrightOwner">
          <Input />
        </Form.Item>
      </Col>
      <Col span={24}><Form.Item label="著作权人及排序" name="copyrightOwnerList"><Input /></Form.Item></Col>
      <Col span={12}>
        <Form.Item label="软件开发者" name="developers">
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="开发完成日期" name="completionDate">
          <Input type="date" />
        </Form.Item>
      </Col>
      <Col span={12}><Form.Item label="首次发表日期" name="firstPublicationDate"><Input type="date" /></Form.Item></Col>
      <Col span={12}><Form.Item label="开发方式" name="developmentMode"><Input placeholder="独立开发/合作开发" /></Form.Item></Col>
      <Col span={12}><Form.Item label="权利范围" name="rightsScope"><Input /></Form.Item></Col>
      <Col span={12}><Form.Item label="软件分类" name="softwareCategory"><Input /></Form.Item></Col>
      <Col span={12}><Form.Item label="运行平台" name="operatingPlatform"><Input /></Form.Item></Col>
      <Col span={12}><Form.Item label="开发语言" name="developmentLanguage"><Input /></Form.Item></Col>
      <Col span={24}><Form.Item label="主要功能" name="softwareMainFunctions"><Input.TextArea rows={3} /></Form.Item></Col>
      <Col span={24}><Form.Item label="技术特点" name="technicalFeatures"><Input.TextArea rows={3} /></Form.Item></Col>
      <Col span={12}>
        <Form.Item label="登记申请日期" name="registrationApplicationDate">
          <Input type="date" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="登记号" name="registrationNumber">
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="发证日期" name="certificateDate">
          <Input type="date" />
        </Form.Item>
      </Col>
    </Row>
  );
}
