import { Navigate, useLocation } from 'react-router-dom';
import { Result } from 'antd';
import { useAppStore } from '../store';
import { canViewPage, type PageKey } from '../domain/permissions';

const routePermissions: Record<string, PageKey> = {
  '/indicator': 'topic-indicator',
  '/indicator/topic': 'topic-indicator',
  '/achievement-entry': 'achievement-entry',
  '/reports': 'report-management',
  '/archive/topics': 'topic-archive', '/archive/self-funded': 'self-funded-archive',
  '/archive/monitoring': 'archive-monitoring', '/admin/users': 'user-management', '/admin/roles': 'role-permission',
  '/admin/config': 'system-config',
};

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const currentUser = useAppStore((s) => s.currentUser);
  const roles = useAppStore((s) => s.roles);
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const page = routePermissions[location.pathname] ?? Object.entries(routePermissions).find(([path]) => location.pathname.startsWith(`${path}/`))?.[1];
  if (page && !canViewPage(currentUser, roles, page)) {
    return <Result status="403" title="无权访问" subTitle="当前角色没有该页面权限，请从左侧菜单进入可用功能。" />;
  }

  return <>{children}</>;
}
