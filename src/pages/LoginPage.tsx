import { useState } from 'react';
import { Alert, Button, Card, Col, Form, Input, Row, Tag, Typography, message } from 'antd';
import { LockOutlined, SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';

const { Title, Paragraph, Text } = Typography;
const demoAccounts = [
  { role: '系统管理员', username: 'admin', password: 'admin123', color: 'purple' },
  { role: '项目技术负责人', username: 'leader', password: 'leader123', color: 'geekblue' },
  { role: '科研助理', username: 'assistant', password: 'assistant123', color: 'cyan' },
  { role: '课题牵头单位', username: 'topic01', password: 'topic123', color: 'green' },
];

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAppStore((state) => state.login);
  const [form] = Form.useForm<{ username: string; password: string }>();

  const submit = async (values: { username: string; password: string }) => {
    setLoading(true);
    const result = await login(values.username, values.password);
    setLoading(false);
    if (!result.success) return message.error(result.error);
    message.success('登录成功');
    navigate('/', { replace: true });
  };

  return (
    <div className="login-page">
      <div className="login-hero">
        <div className="login-emblem"><SafetyCertificateOutlined /></div>
        <Text className="login-kicker">国家科技重大专项</Text>
        <Title className="login-title">重点项目科研管理系统</Title>
        <Paragraph className="login-copy">围绕课题指标、成果预审、进度报告与归档材料，建立全过程协同管理闭环。</Paragraph>
        <div className="login-metric-row"><div><b>1</b><span>固定重点项目</span></div><div><b>5</b><span>示范课题</span></div><div><b>4</b><span>业务角色</span></div></div>
      </div>
      <Card className="login-card" bordered={false}>
        <Title level={3}>欢迎登录</Title>
        <Paragraph type="secondary">当前为前端 Mock 原型，选择演示身份快速体验。</Paragraph>
        <Alert message="账号权限与课题数据范围均在前端模拟，文件仅保存元数据。" type="info" showIcon style={{ marginBottom: 20 }} />
        <Form form={form} layout="vertical" size="large" onFinish={submit}>
          <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}><Input prefix={<UserOutlined />} placeholder="请输入演示账号" /></Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}><Input.Password prefix={<LockOutlined />} placeholder="请输入密码" /></Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>进入系统</Button>
        </Form>
        <div className="demo-accounts">
          <Text strong>演示账号</Text>
          <Row gutter={[8, 8]} style={{ marginTop: 10 }}>
            {demoAccounts.map((account) => <Col span={12} key={account.username}>
              <button className="account-chip" onClick={() => form.setFieldsValue({ username: account.username, password: account.password })}>
                <Tag color={account.color}>{account.role}</Tag><span>{account.username}</span>
              </button>
            </Col>)}
          </Row>
        </div>
      </Card>
    </div>
  );
}
