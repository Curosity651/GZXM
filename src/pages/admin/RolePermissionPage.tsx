import { useState } from 'react';
import { Alert, Button, Card, Checkbox, Col, Form, Input, Modal, Row, Space, Table, Tag, Typography, message } from 'antd';
import { EditOutlined, LockOutlined } from '@ant-design/icons';
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
  const fixedRoleNames = ['系统管理员', '项目技术负责人', '科研助理', '课题牵头单位', '课题承担单位'];
  const fixedRoles = fixedRoleNames.map((name) => state.roles.find((role) => role.name === name)).filter((role): role is RbacRole => Boolean(role));
  const groupedPages = groupOptions(PAGE_PERMISSION_OPTIONS);
  const groupedActions = groupOptions(ACTION_PERMISSION_OPTIONS);
  const openForm = (role: RbacRole) => { if (role.builtIn) return; setEditing(role); form.setFieldsValue(role); setOpen(true); };
  const save = async () => {
    const values = await form.validateFields();
    if (!editing) return;
    state.updateRole(editing.id, { description: values.description, pagePermissions: values.pagePermissions, actionPermissions: values.actionPermissions });
    message.success('角色权限已更新'); setOpen(false); form.resetFields();
  };
  return <>
    <PageHeader title="角色权限管理" description="系统固定设置五个角色。系统管理员为内置角色，其余业务角色可配置页面权限和操作权限。" />
    <Alert type="info" showIcon message="系统管理员固定拥有全部页面访问权限和系统管理权限，默认不参与成果、月季报和归档材料审批。" style={{ marginBottom: 16 }} />
    <Card><Table rowKey="id" dataSource={fixedRoles} pagination={false} columns={[
      { title: '角色名称', dataIndex: 'name', width: 180, render: (value, role) => <Space><Tag color={role.builtIn ? 'purple' : 'blue'}>{value}</Tag>{role.builtIn && <Tag>内置</Tag>}</Space> },
      { title: '说明', dataIndex: 'description' },
      { title: '页面权限', dataIndex: 'pagePermissions', width: 110, render: (value: PagePermissionKey[], role) => role.builtIn ? '全部' : `${value.length} 项` },
      { title: '操作权限', dataIndex: 'actionPermissions', width: 120, render: (value: ActionPermissionKey[], role) => role.builtIn ? '系统管理' : `${value.length} 项` },
      { title: '角色状态', width: 100, render: () => <Tag color="green">启用</Tag> },
      { title: '操作', width: 130, render: (_, role) => role.builtIn ? <Space><LockOutlined /><Typography.Text type="secondary">内置锁定</Typography.Text></Space> : <Button size="small" icon={<EditOutlined />} onClick={() => openForm(role)}>编辑权限</Button> },
    ]} /></Card>
    <Modal title={`编辑角色权限${editing ? ` · ${editing.name}` : ''}`} open={open} width={900} onCancel={() => setOpen(false)} onOk={save}>
      <Form form={form} layout="vertical">
        <Row gutter={16}><Col span={10}><Form.Item name="name" label="角色名称"><Input disabled /></Form.Item></Col><Col span={14}><Form.Item name="description" label="角色说明"><Input /></Form.Item></Col></Row>
        <Form.Item name="pagePermissions" label="页面权限" rules={[{ required: true, message: '请至少选择一个页面' }]}><Checkbox.Group style={{ width: '100%' }}><Row gutter={[8, 12]}>{Object.entries(groupedPages).map(([group, items]) => <Col span={12} key={group}><Card size="small" title={group}>{items?.map((item) => <div key={item.value}><Checkbox value={item.value}>{item.label}</Checkbox></div>)}</Card></Col>)}</Row></Checkbox.Group></Form.Item>
        <Form.Item name="actionPermissions" label="操作权限"><Checkbox.Group style={{ width: '100%' }}><Row gutter={[8, 12]}>{Object.entries(groupedActions).map(([group, items]) => <Col span={12} key={group}><Card size="small" title={group}>{items?.map((item) => <div key={item.value}><Checkbox value={item.value}>{item.label}</Checkbox></div>)}</Card></Col>)}</Row></Checkbox.Group></Form.Item>
      </Form>
    </Modal>
  </>;
}
