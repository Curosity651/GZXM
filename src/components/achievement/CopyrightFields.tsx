import { Col, Form, Input, Row, Select } from 'antd';

export function CopyrightFields() {
  return (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="软件简称" name="shortName">
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="第一完成人" name="firstCompleter" rules={[{ required: true, message: '请填写第一完成人' }]}>
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="是否为广西电网第一完成人" name="isPowerGridFirstCompleter" rules={[{ required: true, message: '请选择是否为广西电网第一完成人' }]}>
          <Select placeholder="请选择" options={[{ label: '是', value: true }, { label: '否', value: false }]} />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="版本号" name="version" rules={[{ required: true, message: '请填写版本号' }]}>
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="第一著作权人" name="firstCopyrightOwner" rules={[{ required: true, message: '请填写第一著作权人' }]}>
          <Input />
        </Form.Item>
      </Col>
      <Col span={24}><Form.Item label="著作权人及排序" name="copyrightOwnerList" rules={[{ required: true, message: '请填写著作权人及排序' }]}><Input /></Form.Item></Col>
      <Col span={12}>
        <Form.Item label="软件开发者" name="developers" rules={[{ required: true, message: '请填写软件开发者' }]}>
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="开发完成日期" name="completionDate" rules={[{ required: true, message: '请选择开发完成日期' }]}>
          <Input type="date" />
        </Form.Item>
      </Col>
      <Col span={12}><Form.Item label="首次发表日期" name="firstPublicationDate"><Input type="date" /></Form.Item></Col>
      <Col span={12}><Form.Item label="开发方式" name="developmentMode"><Input placeholder="独立开发/合作开发" /></Form.Item></Col>
      <Col span={12}><Form.Item label="权利范围" name="rightsScope"><Input /></Form.Item></Col>
      <Col span={12}><Form.Item label="软件分类" name="softwareCategory"><Input /></Form.Item></Col>
      <Col span={12}><Form.Item label="运行平台" name="operatingPlatform"><Input /></Form.Item></Col>
      <Col span={12}><Form.Item label="开发语言" name="developmentLanguage"><Input /></Form.Item></Col>
      <Col span={24}><Form.Item label="主要功能" name="softwareMainFunctions" rules={[{ required: true, message: '请填写软件主要功能' }]}><Input.TextArea rows={3} /></Form.Item></Col>
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
