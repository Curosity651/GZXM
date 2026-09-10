import { useMemo, useState } from 'react';
import { Button, Card, Checkbox, Col, Form, Input, Modal, Row, Select, Space, Table, Tag, Tooltip, Typography, message } from 'antd';
import { DownOutlined, EditOutlined, LockOutlined, ReloadOutlined, SearchOutlined, UpOutlined } from '@ant-design/icons';
import type { ActionPermissionKey, PagePermissionKey, RbacRole } from '../../types';
import { useAppStore } from '../../store';
import { ACTION_PERMISSION_OPTIONS, PAGE_PERMISSION_OPTIONS } from '../../domain/permissions';

type RoleForm = Pick<RbacRole, 'name' | 'description' | 'pagePermissions' | 'actionPermissions'>;
interface RoleFilters { name?: string; enabled?: boolean; description?: string; }

const groupOptions = <T extends { group: string }>(items: T[]) => items.reduce<Record<string, T[]>>((groups, item) => ({ ...groups, [item.group]: [...(groups[item.group] ?? []), item] }), {});

export function RolePermissionPage() {
  const state = useAppStore();
  const [editForm] = Form.useForm<RoleForm>();
  const [filterForm] = Form.useForm<RoleFilters>();
  const [filters, setFilters] = useState<RoleFilters>({});
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RbacRole | null>(null);
  const fixedRoleNames = ['系统管理员', '项目技术负责人', '科研助理', '内部课题单位', '外部课题单位'];
  const fixedRoles = fixedRoleNames.map((name) => state.roles.find((role) => role.name === name)).filter((role): role is RbacRole => Boolean(role));
  const groupedPages = groupOptions(PAGE_PERMISSION_OPTIONS);
  const groupedActions = groupOptions(ACTION_PERMISSION_OPTIONS);

  const filteredRoles = useMemo(() => fixedRoles.filter((role) => {
    const name = filters.name?.trim().toLowerCase();
    const description = filters.description?.trim().toLowerCase();
    return (!name || role.name.toLowerCase().includes(name))
      && (filters.enabled === undefined || role.enabled === filters.enabled)
      && (!description || (role.description ?? '').toLowerCase().includes(description));
  }), [filters, fixedRoles]);

  const openForm = (role: RbacRole) => {
    if (role.builtIn) return;
    setEditing(role);
    editForm.setFieldsValue(role.name === '外部课题单位'
      ? { ...role, pagePermissions: role.pagePermissions.filter((item) => item !== 'self-funded-archive'), actionPermissions: role.actionPermissions.filter((item) => item !== 'self-funded.manage') }
      : role);
    setOpen(true);
  };

  const save = async () => {
    const values = await editForm.validateFields();
    if (!editing) return;
    const external = editing.name === '外部课题单位';
    state.updateRole(editing.id, {
      description: values.description,
      pagePermissions: external ? values.pagePermissions.filter((item) => item !== 'self-funded-archive') : values.pagePermissions,
      actionPermissions: external ? values.actionPermissions.filter((item) => item !== 'self-funded.manage') : values.actionPermissions,
    });
    message.success('角色权限已更新');
    setOpen(false);
    editForm.resetFields();
  };

  const resetFilters = () => {
    filterForm.resetFields();
    setFilters({});
  };

  return <div className="role-management-page">
    <Card className="role-filter-card">
      <Form form={filterForm} colon={false} onFinish={(values) => setFilters(values)}>
        <div className="role-filter-grid">
          <Form.Item label="角色名称" name="name"><Input allowClear placeholder="请输入角色名称" /></Form.Item>
          <Form.Item label="角色状态" name="enabled"><Select allowClear placeholder="请选择状态" options={[{ label: '启用', value: true }, { label: '停用', value: false }]} /></Form.Item>
          {expanded && <Form.Item label="角色说明" name="description"><Input allowClear placeholder="请输入说明关键词" /></Form.Item>}
          <div className="role-filter-actions">
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>查询</Button>
              <Button onClick={resetFilters}>重置</Button>
              <Button type="link" onClick={() => setExpanded((value) => !value)} icon={expanded ? <UpOutlined /> : <DownOutlined />} iconPosition="end">{expanded ? '收起' : '展开'}</Button>
            </Space>
          </div>
        </div>
      </Form>
    </Card>

    <Card className="role-list-card">
      <div className="role-list-toolbar">
        <div>
          <Typography.Title level={4}>角色列表</Typography.Title>
          <Typography.Text type="secondary">共 {filteredRoles.length} 个角色</Typography.Text>
        </div>
        <Tooltip title="刷新列表"><Button icon={<ReloadOutlined />} onClick={() => message.success('列表已刷新')} /></Tooltip>
      </div>
      <Table rowKey="id" dataSource={filteredRoles} pagination={false} scroll={{ x: 940 }} columns={[
        { title: '角色名称', dataIndex: 'name', width: 190, fixed: 'left', render: (value, role) => <Space><Tag color={role.builtIn ? 'purple' : 'blue'}>{value}</Tag>{role.builtIn && <Tag>内置</Tag>}</Space> },
        { title: '角色说明', dataIndex: 'description', width: 360 },
        { title: '页面权限', dataIndex: 'pagePermissions', width: 120, render: (value: PagePermissionKey[], role) => role.builtIn ? '全部' : `${value.length} 项` },
        { title: '操作权限', dataIndex: 'actionPermissions', width: 120, render: (value: ActionPermissionKey[], role) => role.builtIn ? '系统管理' : `${value.length} 项` },
        { title: '角色状态', dataIndex: 'enabled', width: 100, render: (enabled) => <Tag color={enabled ? 'green' : 'default'}>{enabled ? '启用' : '停用'}</Tag> },
        { title: '操作', width: 150, fixed: 'right', render: (_, role) => role.builtIn ? <Space><LockOutlined /><Typography.Text type="secondary">内置锁定</Typography.Text></Space> : <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openForm(role)}>编辑权限</Button> },
      ]} />
    </Card>

    <Modal title={`编辑角色权限${editing ? ` · ${editing.name}` : ''}`} open={open} width={900} onCancel={() => { setOpen(false); editForm.resetFields(); }} onOk={save}>
      <Form form={editForm} layout="vertical">
        <Row gutter={16}><Col span={10}><Form.Item name="name" label="角色名称"><Input disabled /></Form.Item></Col><Col span={14}><Form.Item name="description" label="角色说明"><Input /></Form.Item></Col></Row>
        <Form.Item name="pagePermissions" label="页面权限" rules={[{ required: true, message: '请至少选择一个页面' }]}><Checkbox.Group style={{ width: '100%' }}><Row gutter={[8, 12]}>{Object.entries(groupedPages).map(([group, items]) => <Col span={12} key={group}><Card size="small" title={group}>{items?.map((item) => <div key={item.value}><Checkbox value={item.value} disabled={editing?.name === '外部课题单位' && item.value === 'self-funded-archive'}>{item.label}{editing?.name === '外部课题单位' && item.value === 'self-funded-archive' ? '（外部单位禁止）' : ''}</Checkbox></div>)}</Card></Col>)}</Row></Checkbox.Group></Form.Item>
        <Form.Item name="actionPermissions" label="操作权限"><Checkbox.Group style={{ width: '100%' }}><Row gutter={[8, 12]}>{Object.entries(groupedActions).map(([group, items]) => <Col span={12} key={group}><Card size="small" title={group}>{items?.map((item) => <div key={item.value}><Checkbox value={item.value} disabled={editing?.name === '外部课题单位' && item.value === 'self-funded.manage'}>{item.label}{editing?.name === '外部课题单位' && item.value === 'self-funded.manage' ? '（外部单位禁止）' : ''}</Checkbox></div>)}</Card></Col>)}</Row></Checkbox.Group></Form.Item>
      </Form>
    </Modal>
  </div>;
}
