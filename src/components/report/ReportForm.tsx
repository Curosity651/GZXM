import { Alert, Form, Input } from 'antd';
import type { FormInstance } from 'antd';
import type { ProgressReport } from '../../types';

export function ReportForm({ form }: { form: FormInstance<Partial<ProgressReport>> }) {
  return <Form form={form} layout="vertical">
    <Alert type="info" showIcon message="请填写本课题承担部分。月报和季报使用同一套六项模板，保存草稿后可继续修改。" style={{ marginBottom: 16 }} />
    <Form.Item label="1. 项目里程碑完成情况" name="milestoneProgress" rules={[{ required: true }]}><Input.TextArea rows={3} showCount maxLength={800} /></Form.Item>
    <Form.Item label="2. 项目总体进展" name="overallProgress" extra="覆盖研究内容、成果产出和组织管理，建议不超过 500 字" rules={[{ required: true }]}><Input.TextArea rows={5} showCount maxLength={500} /></Form.Item>
    <Form.Item label="3. 示范工程进展" name="demonstrationProgress" extra="不涉及时可填写“不涉及”，建议不超过 300 字" rules={[{ required: true }]}><Input.TextArea rows={3} showCount maxLength={300} /></Form.Item>
    <Form.Item label="4. 本期经费使用情况" name="fundUsage" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
    <Form.Item label="5. 下期重点工作及目标" name="nextPlan" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
    <Form.Item label="6. 存在问题及应对措施" name="problemsAndMeasures" rules={[{ required: true }]}><Input.TextArea rows={3} placeholder="问题与措施一一对应；无问题可填写“无”" /></Form.Item>
  </Form>;
}
