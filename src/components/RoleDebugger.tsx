import { useAuth } from '../hooks/useAuth';
import { isAdmin, isStaff, isAdminOrStaff, normalizeRole } from '../utils/roles';

const RoleDebugger = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Debug: </strong>Nessun utente loggato
      </div>
    );
  }

  const userRole = user.role;
  const normalizedRole = normalizeRole(userRole);

  return (
    <div className="fixed bottom-4 right-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded max-w-sm">
      <strong>Debug Ruoli:</strong>
      <div className="text-sm mt-2 space-y-1">
        <div>Ruolo originale: "{userRole}"</div>
        <div>Ruolo normalizzato: "{normalizedRole}"</div>
        <div>isAdmin: {isAdmin(user) ? 'Sì' : 'No'}</div>
        <div>isStaff: {isStaff(user) ? 'Sì' : 'No'}</div>
        <div>isAdminOrStaff: {isAdminOrStaff(user) ? 'Sì' : 'No'}</div>
      </div>
    </div>
  );
};

export default RoleDebugger;
