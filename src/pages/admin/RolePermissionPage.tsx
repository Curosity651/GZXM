import { useState } from 'react';
import { Button, Card, Checkbox, Col, Form, Input, Modal, Popconfirm, Row, Space, Switch, Table, Tag, Typography, message } from 'antd';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionPermissionKey, PagePermissionKey, RbacRole } from '../../types';
import { useAppStore } from '../../store';
import { ACTION_PERMISSION_OPTIONS, PAGE_PERMISSION_OPTIONS } from '../../domain/permissions';
import { PageHeader } from '../../components/common/PageHeader';

type RoleForm = Pick<RbacRole, 'name' | 'description' | 'pagePermissions' | 'actionPermissions'>;
const groupOptions = <T extends { group: string }>(items: T[]) => items.reduce<Record<string, T[]>>((groups, item) => ({ ...groups, [item.group]: [...(groups[item.group] ?? []), item] }), {});

export function RolePermissionPage() {
  const state = useAppStore();
  const [form] = Form.useForm<RoleForm>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RbacRole | null>(null);
  const groupedPages = groupOptions(PAGE_PERMISSION_OPTIONS);
  const groupedActions = groupOptions(ACTION_PERMISSION_OPTIONS);
  const openForm = (role?: RbacRole) => { setEditing(role ?? null); form.setFieldsValue(role ?? { name: '', description: '', pagePermissions: ['home'], actionPermissions: [] }); setOpen(true); };
  const save = async () => {
    const values = await form.validateFields();
    if (state.roles.some((role) => role.id !== editing?.id && role.name.trim() === values.name.trim())) return message.warning('角色名称已存在');
    if (editing) state.updateRole(editing.id, values);
    else state.addRole({ id: `role-${Date.now()}`, code: `custom-${Date.now()}`, ...values, enabled: true, builtIn: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    message.success(editing ? '角色权限已更新' : '角色已创建'); setOpen(false); form.resetFields();
  };
  const remove = (role: RbacRole) => {
    if (state.users.some((user) => user.roleId === role.id)) return message.warning('该角色已有账号使用，不能删除');
    state.removeRole(role.id); message.success('角色已删除');
  };
  return <>
    <PageHeader title="角色权限管理" description="通过角色配置页面访问与业务操作权限；系统管理员固定拥有全部权限。" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>新增角色</Button>} />
    <Card><Table rowKey="id" dataSource={state.roles} columns={[
      { title: '角色名称', dataIndex: 'name', width: 180, render: (value, role) => <Space><Tag color={role.builtIn ? 'purple' : 'blue'}>{value}</Tag>{role.builtIn && <Tag>内置</Tag>}</Space> },
      { title: '说明', dataIndex: 'description' },
      { title: '页面权限', dataIndex: 'pagePermissions', width: 110, render: (value: PagePermissionKey[], role) => role.builtIn ? '全部' : `${value.length} 项` },
      { title: '操作权限', dataIndex: 'actionPermissions', width: 110, render: (value: ActionPermissionKey[], role) => role.builtIn ? '全部' : `${value.length} 项` },
      { title: '状态', dataIndex: 'enabled', width: 90, render: (value, role) => <Switch checked={value} disabled={role.builtIn} onChange={(checked) => state.toggleRoleEnabled(role.id, checked)} /> },
      { title: '操作', width: 150, render: (_, role) => role.builtIn ? <Typography.Text type="secondary">不可修改</Typography.Text> : <Space><Button size="small" icon={<EditOutlined />} onClick={() => openForm(role)}>编辑</Button><Popconfirm title="确认删除该角色？" onConfirm={() => remove(role)}><Button size="small" danger>删除</Button></Popconfirm></Space> },
    ]} /></Card>
    <Modal title={editing ? '编辑角色权限' : '新增角色'} open={open} width={860} onCancel={() => setOpen(false)} onOk={save}>
      <Form form={form} layout="vertical">
        <Row gutter={16}><Col span={10}><Form.Item name="name" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }]}><Input /></Form.Item></Col><Col span={14}><Form.Item name="description" label="角色说明"><Input /></Form.Item></Col></Row>
        <Form.Item name="pagePermissions" label="页面权限" rules={[{ required: true, message: '请至少选择一个页面' }]}><Checkbox.Group style={{ width: '100%' }}><Row gutter={[8, 12]}>{Object.entries(groupedPages).map(([group, items]) => <Col span={12} key={group}><Card size="small" title={group}>{items?.map((item) => <div key={item.value}><Checkbox value={item.value}>{item.label}</Checkbox></div>)}</Card></Col>)}</Row></Checkbox.Group></Form.Item>
        <Form.Item name="actionPermissions" label="操作权限"><Checkbox.Group style={{ width: '100%' }}><Row gutter={[8, 12]}>{Object.entries(groupedActions).map(([group, items]) => <Col span={12} key={group}><Card size="small" title={group}>{items?.map((item) => <div key={item.value}><Checkbox value={item.value}>{item.label}</Checkbox></div>)}</Card></Col>)}</Row></Checkbox.Group></Form.Item>
      </Form>
    </Modal>
  </>;
}
