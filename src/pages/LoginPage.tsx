import { useState } from 'react';
import { Button, Card, Form, Input, message } from 'antd';
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
        </Form>
      </Card>
    </div>
  );
}
