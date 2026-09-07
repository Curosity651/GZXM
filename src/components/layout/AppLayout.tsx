import { Layout, Menu, Typography, Button, Space, Dropdown } from 'antd';
import {
  BarChartOutlined,
  BellOutlined,
  BookOutlined,
  DashboardOutlined,
  FileTextOutlined,
  FormOutlined,
  HomeOutlined,
  InboxOutlined,
  LogoutOutlined,
  SearchOutlined,
  TableOutlined,
  UploadOutlined,
  UserOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { RedoOutlined } from '@ant-design/icons';
import { useAppStore, canAccess } from '../../store';
import type { UserRole } from '../../types';

const { Sider, Content, Header } = Layout;
const { Title } = Typography;

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: React.ReactNode;
  children?: MenuItem[];
}

export function AppLayout() {
  const { currentUser, resetToMock, logout } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  const role: UserRole = currentUser?.role || '课题用户';

  const allMenuItems: MenuItem[] = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">首页</Link>,
    },
    {
      key: 'research',
      icon: <DashboardOutlined />,
      label: '科研成果管理',
      children: [
        { key: '/indicator', icon: <TableOutlined />, label: <Link to="/indicator">科研指标配置</Link> },
        { key: '/warning-rules', icon: <BellOutlined />, label: <Link to="/warning-rules">预警规则配置</Link> },
        { key: '/achievement-entry', icon: <FormOutlined />, label: <Link to="/achievement-entry">成果录入</Link> },
        { key: '/achievement-approval', icon: <FileTextOutlined />, label: <Link to="/achievement-approval">成果审批</Link> },
        { key: '/monitoring', icon: <BarChartOutlined />, label: <Link to="/monitoring">指标监控</Link> },
      ],
    },
    {
      key: 'archive',
      icon: <InboxOutlined />,
      label: '项目材料归档',
      children: [
        { key: '/archive/catalog', icon: <BookOutlined />, label: <Link to="/archive/catalog">归档目录</Link> },
        { key: '/archive/upload', icon: <UploadOutlined />, label: <Link to="/archive/upload">材料上传</Link> },
        { key: '/archive/query', icon: <SearchOutlined />, label: <Link to="/archive/query">材料查询</Link> },
        { key: '/archive/monitoring', icon: <BarChartOutlined />, label: <Link to="/archive/monitoring">归档监控</Link> },
      ],
    },
    {
      key: 'admin',
      icon: <TeamOutlined />,
      label: '系统管理',
      children: [
        { key: '/admin/users', icon: <UserOutlined />, label: <Link to="/admin/users">用户管理</Link> },
      ],
    },
  ];

  // Filter menus by role
  const filterMenu = (items: MenuItem[]): MenuItem[] => {
    return items
      .filter((item) => {
        if (item.key === '/') return true;
        if (item.key === 'admin') return role === '系统管理员';
        if (item.key === 'research') return canAccess(role, 'research');
        if (item.key === 'archive') return canAccess(role, 'archive');
        return true;
      })
      .map((item) => {
        if (item.children) {
          return { ...item, children: filterMenu(item.children) };
        }
        return item;
      });
  };

  const menuItems = filterMenu(allMenuItems);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const userMenuItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0' }}>
          <Title level={5} style={{ margin: 0 }}>国家科技重大专项</Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['research', 'archive', 'admin']}
          items={menuItems as any}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Title level={4} style={{ margin: 0 }}>科研成果管理</Title>
          <Space>
            {currentUser && (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Button icon={<UserOutlined />} type="text">
                  {currentUser.name}（{currentUser.role}）
                </Button>
              </Dropdown>
            )}
            <Button icon={<RedoOutlined />} onClick={resetToMock}>
              重置演示数据
            </Button>
          </Space>
        </Header>
        <Content style={{ padding: 24, background: '#f5f5f5' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
