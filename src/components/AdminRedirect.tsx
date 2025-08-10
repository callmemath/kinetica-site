import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isAdminOrStaff } from '../utils/roles';

interface AdminRedirectProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const AdminRedirect = ({ children, redirectTo = '/admin' }: AdminRedirectProps) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user && isAdminOrStaff(user)) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, user, navigate, redirectTo]);

  // Se è admin/staff, non renderizzare i children perché stiamo reindirizzando
  if (isAuthenticated && user && isAdminOrStaff(user)) {
    return null;
  }

  return <>{children}</>;
};

export default AdminRedirect;
