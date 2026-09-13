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
        <Form.Item label="论文类型" name="paperFormType" rules={[{ required: true, message: '请选择论文类型' }]}>
          <Select placeholder="选择论文类型" options={['期刊论文', '会议论文'].map((value) => ({ label: value, value }))} />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="收录类别" name="paperType" rules={[{ required: true, message: '请选择收录类别' }]}>
          <Select placeholder="选择收录类别">
            {paperTypeOptions.map((t) => (
              <Option key={t} value={t}>{t}</Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="是否为中文核心期刊" name="isChineseCoreJournal" rules={[{ required: true, message: '请选择是否为中文核心期刊' }]}>
          <Select placeholder="请选择" options={[{ label: '是', value: true }, { label: '否', value: false }]} />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="是否为广西电网第一作者" name="isPowerGridFirstAuthor" rules={[{ required: true, message: '请选择是否为广西电网第一作者' }]}>
          <Select placeholder="请选择" options={[{ label: '是', value: true }, { label: '否', value: false }]} />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="英文题目" name="englishTitle"><Input /></Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="研究方向" name="researchDirection"><Input /></Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="拟投期刊/会议" name="intendedJournal"><Input /></Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="期刊级别" name="journalLevel"><Input placeholder="如：SCI 一区、中文核心" /></Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="期刊/会议名称" name="journalName" rules={[{ required: true, message: '请填写期刊或会议名称' }]}>
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
        <Form.Item label="第一作者" name="firstAuthor" rules={[{ required: true, message: '请填写第一作者' }]}>
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="通讯作者" name="correspondingAuthor">
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="全部作者" name="allAuthors" rules={[{ required: true, message: '请按顺序填写全部作者' }]}>
          <Input />
        </Form.Item>
      </Col>
      <Col span={24}><Form.Item label="作者及署名单位排序" name="signingUnitList" rules={[{ required: true, message: '请填写作者及署名单位排序' }]}><Input.TextArea rows={2} /></Form.Item></Col>
      <Col span={12}><Form.Item label="第一署名单位" name="firstSigningUnit"><Input /></Form.Item></Col>
      <Col span={24}><Form.Item label="摘要" name="abstract"><Input.TextArea rows={3} /></Form.Item></Col>
      <Col span={24}><Form.Item label="关键词" name="keywords"><Input placeholder="多个关键词使用顿号分隔" /></Form.Item></Col>
      <Col span={12}>
        <Form.Item label="投稿时间" name="submissionDate">
          <Input type="date" />
        </Form.Item>
      </Col>
      <Col span={12}><Form.Item label="投稿编号" name="externalSubmissionNumber"><Input /></Form.Item></Col>
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
      <Col span={24}>
        <Form.Item label="项目名称/编号标注情况" name="projectLabeling" rules={[{ required: true, message: '请填写项目标注情况' }]}>
          <Input />
        </Form.Item>
      </Col>
    </Row>
  );
}
