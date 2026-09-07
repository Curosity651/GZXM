import { Navigate } from 'react-router-dom';
import { useAppStore } from '../store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const currentUser = useAppStore((s) => s.currentUser);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
