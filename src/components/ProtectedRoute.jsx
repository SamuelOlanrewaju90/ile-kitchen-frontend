import { Navigate } from 'react-router-dom';

export function VendorRoute({ children }) {
  const token = localStorage.getItem('vendor_token');
  if (!token) return <Navigate to="/vendor/login" replace />;
  return children;
}

export function AdminRoute({ children }) {
  const token = localStorage.getItem('vendor_token');
  const userRaw = localStorage.getItem('vendor_user');
  if (!token) return <Navigate to="/vendor/login" replace />;
  try {
    const user = JSON.parse(userRaw || '{}');
    if (!user.is_admin) return <Navigate to="/vendor/dashboard" replace />;
  } catch {
    return <Navigate to="/vendor/login" replace />;
  }
  return children;
}
