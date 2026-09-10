import { useState } from 'react';
import { Button, Card, Divider, Form, Input, Space, Typography, message } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';

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
      <Card className="login-card" variant="borderless">
        <Form form={form} layout="vertical" size="large" onFinish={submit}>
          <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}><Input prefix={<UserOutlined />} placeholder="请输入用户名" /></Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}><Input.Password prefix={<LockOutlined />} placeholder="请输入密码" /></Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>进入系统</Button>
          <Divider plain>演示账号</Divider>
          <Space wrap size={[8, 8]}>
            {[['系统管理员', 'admin', 'admin123'], ['项目技术负责人', 'leader', 'leader123'], ['科研助理', 'assistant', 'assistant123'], ['内部课题单位', 'gxgrid', 'unit123'], ['外部课题单位', 'tsinghua', 'unit123']].map(([label, username, password]) => <Button key={username} size="small" onClick={() => form.setFieldsValue({ username, password })}>{label}</Button>)}
          </Space>
          <Typography.Text type="secondary" style={{ display: 'block', marginTop: 10 }}>点击角色可自动填入演示账号。</Typography.Text>
        </Form>
      </Card>
    </div>
  );
}
