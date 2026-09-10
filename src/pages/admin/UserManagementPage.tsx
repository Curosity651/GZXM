import { useMemo, useState } from 'react';
import { Button, Card, Col, Form, Input, Modal, Popconfirm, Row, Select, Space, Switch, Table, Tag, Tooltip, Typography, message } from 'antd';
import { DownOutlined, EditOutlined, KeyOutlined, PlusOutlined, ReloadOutlined, SearchOutlined, UpOutlined } from '@ant-design/icons';
import type { User } from '../../types';
import { useAppStore } from '../../store';
import { getRole } from '../../domain/permissions';

interface UserFilters {
  username?: string;
  roleId?: string;
  contactName?: string;
  enabled?: boolean;
  phone?: string;
  email?: string;
}

export function UserManagementPage() {
  const state = useAppStore();
  const [editForm] = Form.useForm<Partial<User>>();
  const [filterForm] = Form.useForm<UserFilters>();
  const [filters, setFilters] = useState<UserFilters>({});
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const activeRoles = state.roles.filter((role) => role.enabled || role.id === editing?.roleId);

  const filteredUsers = useMemo(() => state.users.filter((user) => {
    const username = filters.username?.trim().toLowerCase();
    const phone = filters.phone?.trim();
    const email = filters.email?.trim().toLowerCase();
    return (!username || user.username.toLowerCase().includes(username) || user.name.toLowerCase().includes(username))
      && (!filters.roleId || user.roleId === filters.roleId)
      && (!filters.contactName || user.name.toLowerCase().includes(filters.contactName.trim().toLowerCase()))
      && (filters.enabled === undefined || user.enabled === filters.enabled)
      && (!phone || user.phone?.includes(phone))
      && (!email || user.email?.toLowerCase().includes(email));
  }), [filters, state.users]);

  const openForm = (user?: User) => {
    setEditing(user ?? null);
    editForm.setFieldsValue(user ? { ...user } : { roleId: activeRoles.find((role) => !role.builtIn)?.id, enabled: true });
    setOpen(true);
  };

  const save = async () => {
    const values = await editForm.validateFields();
    const selectedRole = state.roles.find((role) => role.id === values.roleId);
    if (!selectedRole) return message.warning('请选择有效角色');
    const unitRole = selectedRole.name === '内部课题单位' || selectedRole.name === '外部课题单位';
    let unitId = editing?.unitId;
    if (!editing && unitRole) {
      const unitName = values.username!.trim();
      const existingUnit = state.units.find((unit) => unit.name === unitName || unit.shortName === unitName);
      unitId = existingUnit?.id ?? `unit-${Date.now()}`;
      if (!existingUnit) state.addUnit({ id: unitId, projectId: state.project.id, name: unitName, shortName: unitName, unitCategory: selectedRole.name === '内部课题单位' ? '电网公司' : '其他', countsAsPowerGridUnit: selectedRole.name === '内部课题单位' });
    }
    if (unitRole && state.users.some((user) => user.id !== editing?.id && user.enabled && user.unitId === unitId && (user.role === '内部课题单位' || user.role === '外部课题单位'))) return message.warning('该单位已经存在课题单位账号，每家单位只能配置一个账号');
    const topicIds = unitRole ? state.topicMemberships.filter((item) => item.unitId === unitId && item.enabled).map((item) => item.topicId) : [];
    const scope = unitRole ? 'TOPICS' : 'ALL';
    const payload = { ...values, role: selectedRole.name as User['role'], dataScope: scope as User['dataScope'], topicIds, topicId: topicIds[0], unitId };
    if (editing) state.updateUser(editing.id, payload);
    else state.addUser({ id: `user-${Date.now()}`, username: values.username!.trim(), password: '123456', name: values.name!, role: payload.role, roleId: values.roleId, dataScope: scope, topicIds, topicId: payload.topicId, unitId: payload.unitId, phone: values.phone, email: values.email, enabled: true, createdAt: new Date().toISOString().slice(0, 10) });
    message.success(editing ? '账号信息已更新' : '账号已创建');
    setOpen(false);
    editForm.resetFields();
  };

  const resetFilters = () => {
    filterForm.resetFields();
    setFilters({});
  };

  return <div className="user-management-page">
    <Card className="user-filter-card">
      <Form form={filterForm} colon={false} onFinish={(values) => setFilters(values)}>
        <div className="user-filter-grid">
          <Form.Item label="用户名" name="username"><Input allowClear placeholder="请输入单位用户名" /></Form.Item>
          <Form.Item label="角色" name="roleId"><Select allowClear placeholder="请选择角色" options={activeRoles.map((role) => ({ label: role.name, value: role.id }))} /></Form.Item>
          <Form.Item label="联系人" name="contactName"><Input allowClear placeholder="请输入联系人姓名" /></Form.Item>
          <Form.Item label="状态" name="enabled"><Select allowClear placeholder="请选择状态" options={[{ label: '启用', value: true }, { label: '停用', value: false }]} /></Form.Item>
          {expanded && <>
            <Form.Item label="手机号" name="phone"><Input allowClear placeholder="请输入手机号" /></Form.Item>
            <Form.Item label="邮箱" name="email"><Input allowClear placeholder="请输入邮箱" /></Form.Item>
          </>}
          <div className="user-filter-actions">
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>查询</Button>
              <Button onClick={resetFilters}>重置</Button>
              <Button type="link" onClick={() => setExpanded((value) => !value)} icon={expanded ? <UpOutlined /> : <DownOutlined />} iconPosition="end">{expanded ? '收起' : '展开'}</Button>
            </Space>
          </div>
        </div>
      </Form>
    </Card>

    <Card className="user-list-card">
      <div className="user-list-toolbar">
        <div>
          <Typography.Title level={4}>用户列表</Typography.Title>
          <Typography.Text type="secondary">共 {filteredUsers.length} 个用户</Typography.Text>
        </div>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>新建用户</Button>
          <Tooltip title="刷新列表"><Button icon={<ReloadOutlined />} onClick={() => message.success('列表已刷新')} /></Tooltip>
        </Space>
      </div>
      <Table rowKey="id" dataSource={filteredUsers} pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }} scroll={{ x: 1020 }} columns={[
        { title: '用户名', dataIndex: 'username', width: 180, fixed: 'left' },
        { title: '角色', dataIndex: 'roleId', width: 160, render: (_, user) => { const role = getRole(user, state.roles); return <Tag color={role?.builtIn ? 'purple' : 'blue'}>{role?.name ?? '未分配'}</Tag>; } },
        { title: '单位联系人姓名', dataIndex: 'name', width: 160 },
        { title: '手机号', dataIndex: 'phone', width: 130, render: (value) => value || '—' },
        { title: '邮箱', dataIndex: 'email', width: 210, render: (value) => value || '—' },
        { title: '状态', dataIndex: 'enabled', width: 90, render: (value, user) => <Switch checked={value} disabled={user.id === state.currentUser?.id} onChange={(checked) => state.toggleUserEnabled(user.id, checked)} /> },
        { title: '操作', width: 220, fixed: 'right', render: (_, user) => <Space><Button type="link" size="small" icon={<EditOutlined />} onClick={() => openForm(user)}>编辑</Button><Popconfirm title="确认将密码重置为 123456？" onConfirm={() => { state.resetUserPassword(user.id); message.success('密码已重置'); }}><Button type="link" size="small" icon={<KeyOutlined />}>重置密码</Button></Popconfirm></Space> },
      ]} />
    </Card>

    <Modal title={editing ? '编辑用户' : '新增用户'} open={open} onCancel={() => { setOpen(false); editForm.resetFields(); }} onOk={save} width={720}>
      <Form form={editForm} layout="vertical">
        <Row gutter={16}><Col span={12}><Form.Item label="用户名（单位名称）" name="username" rules={[{ required: true, message: '请输入用户名' }]}><Input disabled={Boolean(editing)} placeholder="请输入单位名称" /></Form.Item></Col><Col span={12}><Form.Item label="角色" name="roleId" rules={[{ required: true, message: '请选择角色' }]}><Select disabled={Boolean(editing)} options={activeRoles.map((role) => ({ label: role.name, value: role.id }))} /></Form.Item></Col></Row>
        <Form.Item label="单位联系人姓名" name="name" rules={[{ required: true, message: '请输入单位联系人姓名' }]}><Input /></Form.Item>
        <Row gutter={16}><Col span={12}><Form.Item label="手机号" name="phone"><Input /></Form.Item></Col><Col span={12}><Form.Item label="邮箱" name="email" rules={[{ type: 'email', message: '请输入正确的邮箱地址' }]}><Input /></Form.Item></Col></Row>
        {editing && <Form.Item label="账号状态" name="enabled" valuePropName="checked"><Switch checkedChildren="启用" unCheckedChildren="停用" disabled={editing.id === state.currentUser?.id} /></Form.Item>}
      </Form>
    </Modal>
  </div>;
}
