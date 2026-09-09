import { useState } from 'react';
import { Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Switch, Table, Tag, message } from 'antd';
import { EditOutlined, KeyOutlined, PlusOutlined } from '@ant-design/icons';
import type { User } from '../../types';
import { useAppStore } from '../../store';
import { getRole } from '../../domain/permissions';
import { PageHeader } from '../../components/common/PageHeader';

export function UserManagementPage() {
  const state = useAppStore();
  const [form] = Form.useForm<Partial<User>>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const unitMap = Object.fromEntries(state.units.map((item) => [item.id, item.name]));
  const topicMap = Object.fromEntries(state.topics.map((item) => [item.id, `${item.code} ${item.name}`]));
  const activeRoles = state.roles.filter((role) => role.enabled || role.id === editing?.roleId);
  const openForm = (user?: User) => {
    setEditing(user ?? null);
    form.setFieldsValue(user ? { ...user } : { password: '123456', roleId: activeRoles.find((role) => !role.builtIn)?.id });
    setOpen(true);
  };
  const save = async () => {
    const values = await form.validateFields();
    const selectedRole = state.roles.find((role) => role.id === values.roleId);
    if (!selectedRole) return message.warning('请选择有效角色');
    const unitRole = selectedRole.name === '课题牵头单位' || selectedRole.name === '课题承担单位';
    const topicIds = unitRole ? state.topicMemberships.filter((item) => item.unitId === values.unitId && item.enabled).map((item) => item.topicId) : [];
    const scope = unitRole ? 'TOPICS' : 'ALL';
    const payload = { ...values, role: selectedRole.name as User['role'], dataScope: scope as User['dataScope'], topicIds, topicId: topicIds[0], unitId: values.unitId };
    if (editing) state.updateUser(editing.id, payload);
    else state.addUser({ id: `user-${Date.now()}`, username: values.username!, password: values.password!, name: values.name!, role: payload.role, roleId: values.roleId, dataScope: scope, topicIds, topicId: payload.topicId, unitId: payload.unitId, phone: values.phone, email: values.email, enabled: true, createdAt: new Date().toISOString().slice(0, 10) });
    message.success(editing ? '账号信息已更新' : '账号已创建'); setOpen(false); form.resetFields();
  };
  return <>
    <PageHeader title="用户管理" description="每个账号绑定一个角色和一个所属单位；单位账号可访问的课题由课题成员关系自动计算。" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>新增账号</Button>} />
    <Card><Table rowKey="id" dataSource={state.users} columns={[
      { title: '用户名', dataIndex: 'username', width: 120 }, { title: '显示名称', dataIndex: 'name' },
      { title: '角色', dataIndex: 'roleId', width: 160, render: (_, user) => { const role = getRole(user, state.roles); return <Tag color={role?.builtIn ? 'purple' : 'blue'}>{role?.name ?? '未分配'}</Tag>; } },
      { title: '数据范围', width: 240, render: (_, user) => user.dataScope === 'TOPICS' ? state.topicMemberships.filter((item) => item.unitId === user.unitId && item.enabled).map((item) => topicMap[item.topicId]).join('、') || '尚未加入课题' : '全部课题' },
      { title: '所属单位', dataIndex: 'unitId', render: (value) => unitMap[value] ?? '—' },
      { title: '状态', dataIndex: 'enabled', width: 90, render: (value, user) => <Switch checked={value} disabled={user.id === state.currentUser?.id} onChange={(checked) => state.toggleUserEnabled(user.id, checked)} /> },
      { title: '操作', width: 210, render: (_, user) => <Space><Button size="small" icon={<EditOutlined />} onClick={() => openForm(user)}>编辑</Button><Popconfirm title="确认将密码重置为 123456？" onConfirm={() => { state.resetUserPassword(user.id); message.success('密码已重置'); }}><Button size="small" icon={<KeyOutlined />}>重置密码</Button></Popconfirm></Space> },
    ]} /></Card>
    <Modal title={editing ? '编辑账号' : '新增账号'} open={open} onCancel={() => { setOpen(false); form.resetFields(); }} onOk={save} width={680}>
      <Form form={form} layout="vertical">
        <Form.Item label="用户名" name="username" rules={[{ required: true }]}><Input disabled={Boolean(editing)} /></Form.Item>
        {!editing && <Form.Item label="初始密码" name="password" rules={[{ required: true }]}><Input.Password /></Form.Item>}
        <Form.Item label="显示名称" name="name" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item label="角色" name="roleId" rules={[{ required: true }]}><Select options={activeRoles.map((role) => ({ label: role.name, value: role.id }))} /></Form.Item>
        <Form.Item label="所属单位" name="unitId" rules={[{ required: true, message: '请选择账号所属单位' }]}><Select options={state.units.map((item) => ({ label: item.name, value: item.id }))} /></Form.Item>
        <Form.Item label="手机" name="phone"><Input /></Form.Item><Form.Item label="邮箱" name="email"><Input /></Form.Item>
      </Form>
    </Modal>
  </>;
}
