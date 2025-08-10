import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Users, 
  UserPlus, 
  Shield, 
  Calendar,
  Mail,
  Phone,
  Eye,
  Edit,
  Download,
  RefreshCw
} from 'lucide-react';
import AnimatedCard from '../../components/AnimatedCard';
import UserDetailsModal from '../../components/admin/UserDetailsModal';
import apiService from '../../services/api';

interface BackendUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  isVerified?: boolean;
  createdAt: string;
  _count?: {
    bookings: number;
  };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  bookingsCount: number;
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Funzione per trasformare i dati dal backend al formato frontend
  const transformUserData = (backendUser: BackendUser): User => ({
    id: backendUser.id,
    firstName: backendUser.firstName,
    lastName: backendUser.lastName,
    email: backendUser.email,
    phone: backendUser.phone,
    role: backendUser.role,
    isVerified: backendUser.isVerified ?? true, // Default a true se non specificato
    createdAt: backendUser.createdAt,
    updatedAt: backendUser.createdAt, // Usa createdAt come fallback
    bookingsCount: backendUser._count?.bookings || 0,
  });

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getAdminUsers();
      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          // Se i dati sono già un array
          const transformedUsers = response.data.map(transformUserData);
          setUsers(transformedUsers);
        } else if (response.data.users && Array.isArray(response.data.users)) {
          // Se i dati sono nella struttura {users: [...], pagination: {...}}
          const transformedUsers = response.data.users.map(transformUserData);
          setUsers(transformedUsers);
        } else {
          console.warn('Response data structure not recognized:', response.data);
          setUsers([]);
        }
      } else {
        console.warn('Response not successful or no data:', response);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUsers = async () => {
    setIsRefreshing(true);
    await loadUsers();
    setIsRefreshing(false);
  };

  const filterUsers = () => {
    // Protezione: verifica che users sia un array
    if (!Array.isArray(users)) {
      setFilteredUsers([]);
      return;
    }

    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.firstName.toLowerCase().includes(search) ||
        user.lastName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        (user.phone && user.phone.toLowerCase().includes(search))
      );
    }

    // Role filter
    if (roleFilter !== 'ALL') {
      filtered = filtered.filter(user => user.role.toUpperCase() === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'VERIFIED') {
        filtered = filtered.filter(user => user.isVerified);
      } else if (statusFilter === 'UNVERIFIED') {
        filtered = filtered.filter(user => !user.isVerified);
      }
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredUsers(filtered);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await apiService.deleteUser(userId);
      if (response.success) {
        // Update local state
        setUsers(prev => prev.filter(user => user.id !== userId));
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, ...updates }
          : user
      ));
      
      // Update selected user if it's the same
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (error) {
      console.error('Error updating user locally:', error);
      throw error;
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'Amministratore';
      case 'staff':
        return 'Staff';
      case 'user':
        return 'Utente';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'staff':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'user':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'staff':
        return <Users className="w-4 h-4" />;
      case 'user':
        return <UserPlus className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const exportUsers = () => {
    const csvContent = [
      ['Nome', 'Cognome', 'Email', 'Telefono', 'Ruolo', 'Verificato', 'Prenotazioni', 'Data Registrazione'],
      ...filteredUsers.map(user => [
        user.firstName,
        user.lastName,
        user.email,
        user.phone || '',
        getRoleDisplayName(user.role),
        user.isVerified ? 'Sì' : 'No',
        user.bookingsCount.toString(),
        new Date(user.createdAt).toLocaleDateString('it-IT')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `utenti_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento utenti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg">
        <div className="container-max px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/admin/dashboard"
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Gestione Utenti
                </h1>
                <p className="text-primary-100">
                  {filteredUsers.length} di {users.length} utenti
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={refreshUsers}
                disabled={isRefreshing}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Aggiorna</span>
              </button>
              <button
                onClick={exportUsers}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Esporta</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container-max px-4 py-6">
        <AnimatedCard delay={100}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cerca nome, email, telefono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Role Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                >
                  <option value="ALL">Tutti i ruoli</option>
                  <option value="ADMIN">Amministratore</option>
                  <option value="STAFF">Staff</option>
                  <option value="USER">Utente</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                >
                  <option value="ALL">Tutti gli stati</option>
                  <option value="VERIFIED">Verificati</option>
                  <option value="UNVERIFIED">Non verificati</option>
                </select>
              </div>
            </div>
          </div>
        </AnimatedCard>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 my-8">
          {[
            { 
              label: 'Totale Utenti', 
              value: filteredUsers.length, 
              icon: Users, 
              color: 'text-blue-600', 
              bgColor: 'bg-blue-100' 
            },
            { 
              label: 'Amministratori', 
              value: filteredUsers.filter(u => u.role.toLowerCase() === 'admin').length, 
              icon: Shield, 
              color: 'text-purple-600', 
              bgColor: 'bg-purple-100' 
            },
            { 
              label: 'Staff', 
              value: filteredUsers.filter(u => u.role.toLowerCase() === 'staff').length, 
              icon: Users, 
              color: 'text-blue-600', 
              bgColor: 'bg-blue-100' 
            },
            { 
              label: 'Utenti Standard', 
              value: filteredUsers.filter(u => u.role.toLowerCase() === 'user').length, 
              icon: UserPlus, 
              color: 'text-green-600', 
              bgColor: 'bg-green-100' 
            }
          ].map((stat, index) => (
            <AnimatedCard key={stat.label} delay={200 + index * 100}>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>

        {/* Users Table */}
        <AnimatedCard delay={600}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Utenti ({filteredUsers.length})
              </h3>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nessun utente trovato</p>
                <p className="text-sm text-gray-500">Prova a modificare i filtri di ricerca</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Utente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contatti
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ruolo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prenotazioni
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registrato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Azioni
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-primary-600 font-semibold">
                                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {user.id.slice(-8).toUpperCase()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900 flex items-center">
                              <Mail className="w-4 h-4 mr-1 text-gray-400" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="text-sm text-gray-500 flex items-center mt-1">
                                <Phone className="w-4 h-4 mr-1 text-gray-400" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                            {getRoleIcon(user.role)}
                            <span className="ml-1">{getRoleDisplayName(user.role)}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.isVerified 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          }`}>
                            {user.isVerified ? 'Verificato' : 'Non verificato'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                            <span className="text-sm text-gray-900">{user.bookingsCount}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(user.createdAt).toLocaleDateString('it-IT')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                              title="Visualizza dettagli"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="p-2 text-gray-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50"
                              title="Modifica utente"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </AnimatedCard>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          onDeleteUser={handleDeleteUser}
          onUpdateUser={handleUpdateUser}
          currentUserRole="admin"
        />
      )}
    </div>
  );
};

export default AdminUsersPage;
