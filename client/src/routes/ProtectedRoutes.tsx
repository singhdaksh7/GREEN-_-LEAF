import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

export function CustomerRoute() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export function AdminRoute() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
