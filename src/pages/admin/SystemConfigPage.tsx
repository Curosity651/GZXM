import { Alert, Button, Card, Col, Form, Input, Row, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useAppStore } from '../../store';
import { PageHeader } from '../../components/common/PageHeader';

export function SystemConfigPage() {
  const state = useAppStore();
  const [form] = Form.useForm();
  const save = async () => { const values = await form.validateFields(); state.updateProject(values); message.success('固定重点项目信息已更新'); };
  return <>
    <PageHeader title="系统配置" description="本系统只管理一个固定重点项目，不提供项目列表、新建或删除功能。" />
    <Alert type="info" showIcon message="下列信息用于页面标题、成果项目标注和统计口径。配套自筹项目仍在各课题归档模块中单独创建。" style={{ marginBottom: 16 }} />
    <Card title="重点项目基础信息"><Form form={form} layout="vertical" initialValues={state.project}><Row gutter={16}><Col span={16}><Form.Item label="项目名称" name="name" rules={[{ required: true }]}><Input /></Form.Item></Col><Col span={8}><Form.Item label="项目编号" name="code" rules={[{ required: true }]}><Input /></Form.Item></Col></Row><Row gutter={16}><Col span={12}><Form.Item label="开始日期" name="startDate" rules={[{ required: true }]}><Input type="date" /></Form.Item></Col><Col span={12}><Form.Item label="结束日期" name="endDate" rules={[{ required: true }]}><Input type="date" /></Form.Item></Col></Row><Button type="primary" icon={<SaveOutlined />} onClick={save}>保存配置</Button></Form></Card>
  </>;
}
