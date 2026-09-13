import { Col, Form, Input, Row, Select } from 'antd';
import { patentScopeOptions, PATENT_STATUS_OPTIONS } from '../../utils/helpers';

const { Option } = Select;

export function PatentFields() {
  return (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="专利状态" name="patentStatus" rules={[{ required: true, message: '请选择专利状态' }]}>
          <Select placeholder="选择专利状态">
            {PATENT_STATUS_OPTIONS.map((s) => (
              <Option key={s} value={s}>{s}</Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="国内或国际" name="patentScope" rules={[{ required: true, message: '请选择专利范围' }]}>
          <Select placeholder="选择范围">
            {patentScopeOptions.map((s) => (
              <Option key={s} value={s}>{s}</Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="是否为广西电网第一申请人" name="isPowerGridFirstApplicant" rules={[{ required: true, message: '请选择是否为广西电网第一申请人' }]}>
          <Select placeholder="请选择" options={[{ label: '是', value: true }, { label: '否', value: false }]} />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="技术领域" name="technicalField"><Input /></Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="申请国家/地区" name="applicationCountry"><Input /></Form.Item>
      </Col>
      <Col span={24}><Form.Item label="专利摘要" name="abstract"><Input.TextArea rows={3} /></Form.Item></Col>
      <Col span={24}><Form.Item label="权利归属说明" name="ownershipDescription"><Input.TextArea rows={2} /></Form.Item></Col>
      <Col span={12}>
        <Form.Item label="第一申请人" name="firstApplicant" rules={[{ required: true, message: '请填写第一申请人' }]}>
          <Input />
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item label="发明人及排序" name="inventorList" rules={[{ required: true, message: '请填写发明人及排序' }]}>
          <Input />
        </Form.Item>
      </Col>
      <Col span={24}><Form.Item label="申请人及排序" name="applicantList" rules={[{ required: true, message: '请填写申请人及排序' }]}><Input /></Form.Item></Col>
      <Col span={12}>
        <Form.Item label="申请号" name="applicationNumber">
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="受理号" name="receiptNumber">
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="申请时间" name="applicationDate">
          <Input type="date" />
        </Form.Item>
      </Col>
      <Col span={12}><Form.Item label="公开号" name="publicationNumber"><Input /></Form.Item></Col>
      <Col span={12}>
        <Form.Item label="受理时间" name="receiptDate">
          <Input type="date" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="授权时间" name="grantDate">
          <Input type="date" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="授权公告号" name="grantPublicationNumber">
          <Input />
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item label="当前法律状态" name="legalStatus">
          <Input />
        </Form.Item>
      </Col>
    </Row>
  );
}
