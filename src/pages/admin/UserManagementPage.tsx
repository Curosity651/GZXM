import { useState } from 'react';
import { Button, Card, Col, Form, Input, Modal, Popconfirm, Row, Select, Space, Switch, Table, Tag, message } from 'antd';
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
  const roleNames = ['系统管理员', '项目技术负责人', '科研助理', '课题牵头单位', '课题承担单位'];
  const activeRoles = state.roles.filter((role) => roleNames.includes(role.name) && (role.enabled || role.id === editing?.roleId));
  const openForm = (user?: User) => {
    setEditing(user ?? null);
    form.setFieldsValue(user ? { ...user } : { password: '123456', roleId: activeRoles.find((role) => !role.builtIn)?.id, enabled: true });
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
    else state.addUser({ id: `user-${Date.now()}`, username: values.username!, password: values.password!, name: values.name!, role: payload.role, roleId: values.roleId, dataScope: scope, topicIds, topicId: payload.topicId, unitId: payload.unitId, phone: values.phone, email: values.email, enabled: values.enabled ?? true, createdAt: new Date().toISOString().slice(0, 10) });
    message.success(editing ? '账号信息已更新' : '账号已创建'); setOpen(false); form.resetFields();
  };
  return <>
    <PageHeader title="用户管理" description="维护用户基本信息、所属角色和账号状态。课题数据范围由用户所属单位自动计算，不在本页面配置。" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>新增用户</Button>} />
    <Card><Table rowKey="id" dataSource={state.users} columns={[
      { title: '用户名', dataIndex: 'username', width: 120 }, { title: '用户姓名', dataIndex: 'name', width: 130 },
      { title: '角色', dataIndex: 'roleId', width: 160, render: (_, user) => { const role = getRole(user, state.roles); return <Tag color={role?.builtIn ? 'purple' : 'blue'}>{role?.name ?? '未分配'}</Tag>; } },
      { title: '所属单位', dataIndex: 'unitId', render: (value) => unitMap[value] ?? '—' },
      { title: '手机号', dataIndex: 'phone', width: 130, render: (value) => value || '—' },
      { title: '邮箱', dataIndex: 'email', width: 190, render: (value) => value || '—' },
      { title: '状态', dataIndex: 'enabled', width: 90, render: (value, user) => <Switch checked={value} disabled={user.id === state.currentUser?.id} onChange={(checked) => state.toggleUserEnabled(user.id, checked)} /> },
      { title: '操作', width: 210, render: (_, user) => <Space><Button size="small" icon={<EditOutlined />} onClick={() => openForm(user)}>编辑</Button><Popconfirm title="确认将密码重置为 123456？" onConfirm={() => { state.resetUserPassword(user.id); message.success('密码已重置'); }}><Button size="small" icon={<KeyOutlined />}>重置密码</Button></Popconfirm></Space> },
    ]} /></Card>
    <Modal title={editing ? '编辑用户' : '新增用户'} open={open} onCancel={() => { setOpen(false); form.resetFields(); }} onOk={save} width={720}>
      <Form form={form} layout="vertical">
        <Row gutter={16}><Col span={12}><Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}><Input disabled={Boolean(editing)} /></Form.Item></Col><Col span={12}><Form.Item label="用户姓名" name="name" rules={[{ required: true, message: '请输入用户姓名' }]}><Input /></Form.Item></Col></Row>
        {!editing && <Form.Item label="初始密码" name="password" rules={[{ required: true, message: '请输入初始密码' }]}><Input.Password /></Form.Item>}
        <Row gutter={16}><Col span={12}><Form.Item label="角色" name="roleId" rules={[{ required: true, message: '请选择角色' }]}><Select options={activeRoles.map((role) => ({ label: role.name, value: role.id }))} /></Form.Item></Col><Col span={12}><Form.Item label="账号状态" name="enabled" valuePropName="checked"><Switch checkedChildren="启用" unCheckedChildren="停用" disabled={editing?.id === state.currentUser?.id} /></Form.Item></Col></Row>
        <Form.Item label="所属单位" name="unitId" rules={[{ required: true, message: '请选择所属单位' }]}><Select showSearch optionFilterProp="label" options={state.units.map((item) => ({ label: item.name, value: item.id }))} /></Form.Item>
        <Row gutter={16}><Col span={12}><Form.Item label="手机号" name="phone"><Input /></Form.Item></Col><Col span={12}><Form.Item label="邮箱" name="email" rules={[{ type: 'email', message: '请输入正确的邮箱地址' }]}><Input /></Form.Item></Col></Row>
      </Form>
    </Modal>
  </>;
}
