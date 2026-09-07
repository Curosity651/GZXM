import { useState } from 'react';
import {
  Button, Card, Form, Input, message, Modal, Select, Space, Switch,
  Table, Tag, Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import { useAppStore } from '../../store';
import type { User, UserRole } from '../../types';

const { Option } = Select;

const ROLE_OPTIONS: UserRole[] = ['系统管理员', '项目管理人员', '课题用户', '成果审批人员'];

export function UserManagementPage() {
  const { users, units, currentUser, addUser, updateUser, removeUser, resetUserPassword, toggleUserEnabled } = useAppStore();

  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form] = Form.useForm();

  const unitMap = Object.fromEntries(units.map((u) => [u.id, u.name]));

  const openForm = (user?: User) => {
    setEditing(user || null);
    if (user) {
      form.setFieldsValue({
        username: user.username,
        name: user.name,
        unitId: user.unitId,
        phone: user.phone || '',
        email: user.email || '',
        role: user.role,
      });
    } else {
      form.resetFields();
    }
    setVisible(true);
  };

  const handleSave = (values: any) => {
    if (editing) {
      updateUser(editing.id, {
        name: values.name,
        unitId: values.unitId,
        phone: values.phone || '',
        email: values.email || '',
        role: values.role,
      });
      message.success('用户信息更新成功');
    } else {
      addUser({
        id: `user-${Date.now()}`,
        username: values.username,
        password: values.password || '123456',
        name: values.name,
        unitId: values.unitId,
        phone: values.phone || '',
        email: values.email || '',
        role: values.role,
        enabled: true,
        createdAt: new Date().toISOString().split('T')[0],
      });
      message.success('用户添加成功');
    }
    setVisible(false);
    setEditing(null);
    form.resetFields();
  };

  const handleResetPassword = (userId: string) => {
    resetUserPassword(userId);
    message.success('密码已重置为 123456');
  };

  const handleToggleEnabled = (userId: string, enabled: boolean) => {
    toggleUserEnabled(userId, enabled);
    message.success(enabled ? '账号已启用' : '账号已禁用');
  };

  const handleDelete = (userId: string) => {
    removeUser(userId);
    message.success('用户已删除');
  };

  const columns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    {
      title: '所属单位',
      dataIndex: 'unitId',
      key: 'unitId',
      render: (v: string) => unitMap[v] || v,
    },
    { title: '手机', dataIndex: 'phone', key: 'phone', render: (v: string) => v || '-' },
    { title: '邮箱', dataIndex: 'email', key: 'email', render: (v: string) => v || '-' },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (v: UserRole) => <Tag color={v === '系统管理员' ? 'red' : 'blue'}>{v}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record: User) => (
        <Switch
          checked={enabled}
          disabled={record.id === currentUser?.id}
          onChange={(v) => handleToggleEnabled(record.id, v)}
        />
      ),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (v: string) => v || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openForm(record)}>编辑</Button>
          <Popconfirm title="确定要重置密码为 123456？" onConfirm={() => handleResetPassword(record.id)}>
            <Button icon={<KeyOutlined />} size="small">重置密码</Button>
          </Popconfirm>
          <Popconfirm
            title="确定要删除该用户？"
            disabled={record.id === currentUser?.id}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button icon={<DeleteOutlined />} danger size="small" disabled={record.id === currentUser?.id}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="用户管理"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>新增用户</Button>}
    >
      <Table rowKey="id" columns={columns} dataSource={users} pagination={{ pageSize: 10 }} />

      <Modal
        title={editing ? '编辑用户' : '新增用户'}
        open={visible}
        onOk={() => form.submit()}
        onCancel={() => { setVisible(false); setEditing(null); form.resetFields(); }}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input disabled={!!editing} placeholder="请输入用户名" />
          </Form.Item>
          {!editing && (
            <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]} initialValue="123456">
              <Input.Password placeholder="默认密码 123456" />
            </Form.Item>
          )}
          <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item label="所属单位" name="unitId" rules={[{ required: true, message: '请选择单位' }]}>
            <Select placeholder="请选择所属单位">
              {units.map((u) => (
                <Option key={u.id} value={u.id}>{u.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="手机" name="phone">
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item label="邮箱" name="email">
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item label="角色" name="role" rules={[{ required: true, message: '请选择角色' }]}>
            <Select placeholder="请选择角色">
              {ROLE_OPTIONS.map((r) => (
                <Option key={r} value={r}>{r}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
