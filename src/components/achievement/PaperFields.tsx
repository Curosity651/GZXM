import { Col, Form, Input, Row, Select } from 'antd';
import { paperTypeOptions, PAPER_STATUS_OPTIONS } from '../../utils/helpers';

const { Option } = Select;

export function PaperFields() {
  return (
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="论文状态" name="paperStatus" rules={[{ required: true, message: '请选择论文状态' }]}>
          <Select placeholder="选择论文状态">
            {PAPER_STATUS_OPTIONS.map((s) => (
              <Option key={s} value={s}>{s}</Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="论文类型" name="paperType">
          <Select placeholder="选择论文类型" allowClear>
            {paperTypeOptions.map((t) => (
              <Option key={t} value={t}>{t}</Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="期刊名称" name="journalName">
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="CN号" name="cnNumber">
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="ISSN号" name="issn">
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="DOI" name="doi">
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="第一作者" name="firstAuthor">
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="通讯作者" name="correspondingAuthor">
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="全部作者" name="allAuthors">
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="投稿时间" name="submissionDate">
          <Input type="date" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="录用时间" name="acceptanceDate">
          <Input type="date" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="正式刊出时间" name="publicationDate">
          <Input type="date" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="是否国内期刊论文" name="isChineseJournal" valuePropName="checked">
          <Select placeholder="选择" allowClear>
            <Option value={true}>是</Option>
            <Option value={false}>否</Option>
          </Select>
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item label="项目名称/编号标注情况" name="projectLabeling">
          <Input />
        </Form.Item>
      </Col>
    </Row>
  );
}
