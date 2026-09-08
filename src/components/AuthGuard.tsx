import { Navigate, useLocation } from 'react-router-dom';
import { Result } from 'antd';
import { useAppStore } from '../store';
import { canViewPage, type PageKey } from '../domain/permissions';

const routePermissions: Record<string, PageKey> = {
  '/indicator': 'topic-indicator', '/warning-rules': 'warning-rules', '/monitoring': 'indicator-monitoring',
  '/achievement-entry': 'achievement-entry', '/achievement-approval': 'achievement-review',
  '/achievement-query': 'achievement-query',
  '/reports': 'report-management', '/report-approval': 'report-review',
  '/progress-overview': 'progress-overview',
  '/archive/catalog': 'project-public-archive', '/archive/public': 'project-public-archive',
  '/archive/topics': 'topic-archive', '/archive/self-funded': 'self-funded-archive',
  '/archive/approval': 'archive-review', '/archive/monitoring': 'archive-monitoring', '/admin/users': 'user-management',
  '/admin/config': 'system-config',
};

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const currentUser = useAppStore((s) => s.currentUser);
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const page = routePermissions[location.pathname];
  if (page && !canViewPage(currentUser.role, page)) {
    return <Result status="403" title="无权访问" subTitle="当前角色没有该页面权限，请从左侧菜单进入可用功能。" />;
  }

  return <>{children}</>;
}
