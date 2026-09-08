import { useState } from 'react';
import { Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Switch, Table, Tag, message } from 'antd';
import { EditOutlined, KeyOutlined, PlusOutlined } from '@ant-design/icons';
import type { User, UserRole } from '../../types';
import { useAppStore } from '../../store';
import { normalizeTopicBinding, validateTopicAccountUniqueness } from '../../domain/admin';
import { PageHeader } from '../../components/common/PageHeader';

const roles: UserRole[] = ['系统管理员', '项目技术负责人', '科研助理', '课题牵头单位'];

export function UserManagementPage() {
  const state = useAppStore();
  const [form] = Form.useForm<Partial<User>>();
  const role = Form.useWatch('role', form);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const unitMap = Object.fromEntries(state.units.map((item) => [item.id, item.name]));
  const topicMap = Object.fromEntries(state.topics.map((item) => [item.id, `${item.code} ${item.name}`]));
  const openForm = (user?: User) => { setEditing(user ?? null); form.setFieldsValue(user ?? { role: '课题牵头单位', password: '123456' }); setOpen(true); };
  const save = async () => {
    const values = await form.validateFields();
    const topicId = normalizeTopicBinding(values.role!, values.topicId);
    if (values.role === '课题牵头单位') {
      const error = validateTopicAccountUniqueness(state.users, topicId, editing?.id);
      if (error) return message.warning(error);
    }
    const payload = { ...values, topicId, unitId: values.role === '课题牵头单位' ? state.topics.find((item) => item.id === topicId)?.leadingUnitId : values.unitId };
    if (editing) state.updateUser(editing.id, payload);
    else state.addUser({ id: `user-${Date.now()}`, username: values.username!, password: values.password!, name: values.name!, role: values.role!, topicId, unitId: payload.unitId, phone: values.phone, email: values.email, enabled: true, createdAt: new Date().toISOString().slice(0, 10) });
    message.success(editing ? '账号信息已更新' : '账号已创建'); setOpen(false); form.resetFields();
  };
  return <>
    <PageHeader title="用户管理" description="每个课题建立一个独立牵头单位账号；参与单位不创建账号。" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>新增账号</Button>} />
    <Card><Table rowKey="id" dataSource={state.users} columns={[
      { title: '用户名', dataIndex: 'username', width: 120 }, { title: '显示名称', dataIndex: 'name' },
      { title: '角色', dataIndex: 'role', width: 150, render: (value) => <Tag color={value === '系统管理员' ? 'purple' : value === '项目技术负责人' ? 'geekblue' : value === '科研助理' ? 'cyan' : 'green'}>{value}</Tag> },
      { title: '绑定课题', dataIndex: 'topicId', render: (value) => value ? topicMap[value] : '全部课题' }, { title: '所属单位', dataIndex: 'unitId', render: (value) => unitMap[value] ?? '—' },
      { title: '状态', dataIndex: 'enabled', width: 90, render: (value, user) => <Switch checked={value} disabled={user.id === state.currentUser?.id} onChange={(checked) => state.toggleUserEnabled(user.id, checked)} /> },
      { title: '操作', width: 210, render: (_, user) => <Space><Button size="small" icon={<EditOutlined />} onClick={() => openForm(user)}>编辑</Button><Popconfirm title="确认将密码重置为 123456？" onConfirm={() => { state.resetUserPassword(user.id); message.success('密码已重置'); }}><Button size="small" icon={<KeyOutlined />}>重置密码</Button></Popconfirm></Space> },
    ]} /></Card>
    <Modal title={editing ? '编辑账号' : '新增账号'} open={open} onCancel={() => { setOpen(false); form.resetFields(); }} onOk={save} width={620}>
      <Form form={form} layout="vertical"><Form.Item label="用户名" name="username" rules={[{ required: true }]}><Input disabled={Boolean(editing)} /></Form.Item>{!editing && <Form.Item label="初始密码" name="password" initialValue="123456" rules={[{ required: true }]}><Input.Password /></Form.Item>}<Form.Item label="显示名称" name="name" rules={[{ required: true }]}><Input /></Form.Item><Form.Item label="角色" name="role" rules={[{ required: true }]}><Select options={roles.map((item) => ({ label: item, value: item }))} /></Form.Item>{role === '课题牵头单位' && <Form.Item label="绑定课题" name="topicId" rules={[{ required: true }]}><Select options={state.topics.map((item) => ({ label: `${item.code} ${item.name}`, value: item.id }))} /></Form.Item>}{role !== '课题牵头单位' && <Form.Item label="所属单位" name="unitId"><Select allowClear options={state.units.map((item) => ({ label: item.name, value: item.id }))} /></Form.Item>}<Form.Item label="手机" name="phone"><Input /></Form.Item><Form.Item label="邮箱" name="email"><Input /></Form.Item></Form>
    </Modal>
  </>;
}
