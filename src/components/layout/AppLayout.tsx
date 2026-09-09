import type { ReactNode } from 'react';
import { Avatar, Button, Dropdown, Layout, Menu, Modal, Space, Tag, Typography, message } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined, FileDoneOutlined, FileTextOutlined,
  HomeOutlined, InboxOutlined, LogoutOutlined, SafetyCertificateOutlined,
  SettingOutlined, TeamOutlined, UserOutlined,
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
      { key: '/indicator', label: <Link to="/indicator">课题与指标配置</Link>, page: 'topic-indicator' },
      { key: '/monitoring', label: <Link to="/monitoring">指标完成监控</Link>, page: 'indicator-monitoring' },
      { key: '/warning-rules', label: <Link to="/warning-rules">预警规则配置</Link>, page: 'warning-rules' },
    ],
  },
  {
    key: 'achievement-group', label: '成果管理', icon: <FileDoneOutlined />, children: [
      { key: '/achievement-entry', label: <Link to="/achievement-entry">成果管理</Link>, page: 'achievement-entry' },
      { key: '/achievement-approval', label: <Link to="/achievement-approval">成果审批</Link>, page: 'achievement-review' },
      { key: '/achievement-query', label: <Link to="/achievement-query">成果查询</Link>, page: 'achievement-query' },
    ],
  },
  {
    key: 'report-group', label: '进度管理', icon: <FileTextOutlined />, children: [
      { key: '/reports', label: <Link to="/reports">月报与季报</Link>, page: 'report-management' },
      { key: '/report-approval', label: <Link to="/report-approval">月季报审批</Link>, page: 'report-review' },
      { key: '/progress-overview', label: <Link to="/progress-overview">项目进度总览</Link>, page: 'progress-overview' },
    ],
  },
  {
    key: 'archive-group', label: '归档材料', icon: <InboxOutlined />, children: [
      { key: '/archive/catalog', label: <Link to="/archive/catalog">归档目录</Link>, page: 'project-public-archive' },
      { key: '/archive/public', label: <Link to="/archive/public">重点项目公共材料</Link>, page: 'project-public-archive' },
      { key: '/archive/topics', label: <Link to="/archive/topics">课题国家材料</Link>, page: 'topic-archive' },
      { key: '/archive/self-funded', label: <Link to="/archive/self-funded">配套自筹项目</Link>, page: 'self-funded-archive' },
      { key: '/archive/approval', label: <Link to="/archive/approval">归档审批</Link>, page: 'archive-review' },
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
      <Sider width={244} theme="dark" className="app-sider">
        <div className="brand-block">
          <div className="brand-mark"><SafetyCertificateOutlined /></div>
          <div><div className="brand-title">GZXM 科研管理</div><div className="brand-subtitle">重点项目协同工作台</div></div>
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} defaultOpenKeys={['indicator-group', 'achievement-group', 'archive-group', 'admin-group']} items={visibleMenu(menuTree, currentUser, roles) as MenuProps['items']} />
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
