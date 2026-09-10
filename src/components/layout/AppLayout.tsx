import { useState, type ReactNode } from 'react';
import { Avatar, Button, Dropdown, Layout, Menu, Modal, Space, Tag, Typography, message } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined, FileDoneOutlined, FileTextOutlined,
  HomeOutlined, InboxOutlined, LogoutOutlined, SafetyCertificateOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, SettingOutlined, TeamOutlined, UserOutlined,
} from '@ant-design/icons';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { canViewPage, getRole, type PageKey } from '../../domain/permissions';
import type { RbacRole, User } from '../../types';

const { Sider, Content, Header } = Layout;
const { Text } = Typography;

interface MenuNode {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  page?: PageKey;
  children?: MenuNode[];
}

const menuTree: MenuNode[] = [
  { key: '/', label: <Link to="/">工作台</Link>, icon: <HomeOutlined />, page: 'home' },
  {
    key: 'indicator-group', label: '科研指标管理', icon: <DashboardOutlined />, children: [
      { key: '/indicator', label: <Link to="/indicator">科研指标配置</Link>, page: 'topic-indicator' },
    ],
  },
  { key: '/achievement-entry', label: <Link to="/achievement-entry">成果管理</Link>, icon: <FileDoneOutlined />, page: 'achievement-entry' },
  { key: '/reports', label: <Link to="/reports">进度管理</Link>, icon: <FileTextOutlined />, page: 'report-management' },
  {
    key: 'archive-group', label: '归档材料', icon: <InboxOutlined />, children: [
      { key: '/archive/topics', label: <Link to="/archive/topics">课题国家材料</Link>, page: 'topic-archive' },
      { key: '/archive/self-funded', label: <Link to="/archive/self-funded">配套自筹材料</Link>, page: 'self-funded-archive' },
      { key: '/archive/monitoring', label: <Link to="/archive/monitoring">归档进度监控</Link>, page: 'archive-monitoring' },
    ],
  },
  {
    key: 'admin-group', label: '系统管理', icon: <SettingOutlined />, children: [
      { key: '/admin/users', label: <Link to="/admin/users">用户管理</Link>, page: 'user-management' },
      { key: '/admin/roles', label: <Link to="/admin/roles">角色权限管理</Link>, page: 'role-permission' },
    ],
  },
];

function visibleMenu(nodes: MenuNode[], user: User, roles: RbacRole[]): MenuNode[] {
  const result: MenuNode[] = [];
  nodes.forEach((node) => {
    const children = node.children ? visibleMenu(node.children, user, roles) : undefined;
    if (children && children.length > 0) result.push({ ...node, children });
    else if (node.page && canViewPage(user, roles, node.page)) result.push({ ...node });
  });
  return result;
}

export function AppLayout() {
  const { currentUser, project, roles, resetToMock, logout } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  if (!currentUser) return null;

  const confirmReset = () => Modal.confirm({
    title: '重置全部演示数据？',
    content: '当前浏览器中的填报、审批和配置修改将恢复为初始 Mock 数据。',
    okText: '确认重置', cancelText: '取消', okButtonProps: { danger: true },
    onOk: () => { resetToMock(); message.success('演示数据已重置'); navigate('/'); },
  });

  return (
    <Layout className="app-shell">
      <Sider width={244} collapsedWidth={72} collapsed={collapsed} trigger={null} theme="dark" className="app-sider">
        <div className={`brand-block${collapsed ? ' is-collapsed' : ''}`}>
          <div className="brand-mark"><SafetyCertificateOutlined /></div>
          {!collapsed && <div><div className="brand-title">GZXM 科研管理</div><div className="brand-subtitle">重点项目协同工作台</div></div>}
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} defaultOpenKeys={['indicator-group', 'achievement-group', 'archive-group', 'admin-group']} items={visibleMenu(menuTree, currentUser, roles) as MenuProps['items']} />
        <Button
          type="text"
          className="sider-collapse-button"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
          onClick={() => setCollapsed((value) => !value)}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <div><Text strong>{project.name}</Text><Tag color="blue" style={{ marginLeft: 10 }}>{project.code}</Tag></div>
          <Space size={12}>
            <Button type="text" onClick={confirmReset}>重置演示数据</Button>
            <Dropdown menu={{ items: [
              { key: 'role', icon: <TeamOutlined />, label: getRole(currentUser, roles)?.name ?? '未分配角色', disabled: true },
              { type: 'divider' },
              { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: () => { logout(); navigate('/login', { replace: true }); } },
            ] }}>
              <Button type="text"><Space><Avatar size="small" icon={<UserOutlined />} />{currentUser.name}</Space></Button>
            </Dropdown>
          </Space>
        </Header>
        <Content className="app-content"><Outlet /></Content>
      </Layout>
    </Layout>
  );
}
