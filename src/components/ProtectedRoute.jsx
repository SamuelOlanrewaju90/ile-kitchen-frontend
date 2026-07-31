import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('owner_token');
  if (!token) return <Navigate to="/owner/login" replace />;
  return children;
}
