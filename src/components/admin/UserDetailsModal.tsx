import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Calendar, Shield, Trash2, Edit, Check, XCircle, AlertTriangle } from 'lucide-react';
import apiService from '../../services/api';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    createdAt: string;
    phone?: string;
    _count?: {
      bookings: number;
    };
  } | null;
  onDeleteUser: (userId: string) => Promise<void>;
  onUpdateUser?: (userId: string, updates: any) => Promise<void>;
  currentUserRole: string;
}

const UserDetailsModal = ({ isOpen, onClose, user, onDeleteUser, onUpdateUser, currentUserRole }: UserDetailsModalProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
    }
  }, [user]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  if (!isVisible || !user) return null;

  const getRoleDisplayName = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'Amministratore';
      case 'staff':
        return 'Staff';
      case 'user':
        return 'Utente';
      default:
        return 'Ruolo sconosciuto';
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canDeleteUser = () => {
    const userRole = user.role.toLowerCase();
    const currentRole = currentUserRole.toLowerCase();
    
    // Non può eliminare se stesso
    // Solo admin può eliminare altri admin/staff
    if (userRole === 'admin' || userRole === 'staff') {
      return currentRole === 'admin';
    }
    
    return true; // Tutti possono eliminare utenti normali
  };

  const canEditRole = () => {
    const currentRole = currentUserRole.toLowerCase();
    return currentRole === 'admin'; // Solo gli admin possono modificare i ruoli
  };

  const handleUpdateRole = async () => {
    if (!user || selectedRole === user.role) {
      setIsEditingRole(false);
      return;
    }

    setIsUpdatingRole(true);
    try {
      const response = await apiService.updateUserRole(user.id, selectedRole);
      if (response.success) {
        // Aggiorna l'utente localmente se la callback è fornita
        if (onUpdateUser) {
          await onUpdateUser(user.id, { role: selectedRole });
        }
        setIsEditingRole(false);
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      // Reset al ruolo originale in caso di errore
      setSelectedRole(user.role);
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleCancelRoleEdit = () => {
    setSelectedRole(user?.role || '');
    setIsEditingRole(false);
  };

  const handleDeleteUser = async () => {
    setIsDeleting(true);
    try {
      await onDeleteUser(user.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div 
      className={`fixed inset-0 bg-white/20 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-all duration-300 transform ${
          isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Dettagli Utente
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-primary-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {user.firstName} {user.lastName}
                </h3>
                <div className="flex items-center space-x-2 mt-2">
                  {!isEditingRole ? (
                    <>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(user.role)}`}>
                        <Shield className="w-4 h-4 mr-1" />
                        {getRoleDisplayName(user.role)}
                      </div>
                      {canEditRole() && (
                        <button
                          onClick={() => setIsEditingRole(true)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Modifica ruolo"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        disabled={isUpdatingRole}
                      >
                        <option value="user">Utente</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Amministratore</option>
                      </select>
                      <button
                        onClick={handleUpdateRole}
                        disabled={isUpdatingRole}
                        className="p-1 text-green-600 hover:text-green-700 transition-colors disabled:opacity-50"
                        title="Salva"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancelRoleEdit}
                        disabled={isUpdatingRole}
                        className="p-1 text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                        title="Annulla"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <span className="text-sm text-gray-500">
              ID: {user.id.slice(-8).toUpperCase()}
            </span>
          </div>

          {/* Contact Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <Mail className="w-5 h-5 mr-2 text-gray-600" />
              Informazioni di Contatto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Email</label>
                <p className="mt-1 text-sm text-gray-900">{user.email}</p>
              </div>
              {user.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">Telefono</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    {user.phone}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Account Stats */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Statistiche Account
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Data Registrazione</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(user.createdAt)}</p>
              </div>
              {user._count && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">Prenotazioni Totali</label>
                  <p className="mt-1 text-sm text-gray-900 font-semibold">{user._count.bookings}</p>
                </div>
              )}
            </div>
          </div>

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-red-800">
                    Conferma eliminazione utente
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      Sei sicuro di voler eliminare l'utente <strong>{user.firstName} {user.lastName}</strong>?
                      Questa azione non può essere annullata.
                    </p>
                  </div>

                  {/* Banner di avviso - Operazione Irreversibile */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-3 mb-2">
                    <div className="flex items-center">
                      <div className="p-1.5 bg-amber-100 rounded-full mr-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-amber-800 font-semibold text-xs">Operazione Irreversibile</p>
                        <p className="text-amber-700 text-xs mt-0.5">Questa azione non potrà essere annullata una volta confermata</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={handleDeleteUser}
                      disabled={isDeleting}
                      className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? 'Eliminazione...' : 'Elimina Definitivamente'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="bg-white text-gray-700 px-4 py-2 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-50"
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {canDeleteUser() && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 transition-colors flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Elimina Utente
              </button>
            )}
            <button
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Chiudi
            </button>
          </div>

          {/* Metadata */}
          <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
            <p>Account creato il: {formatDate(user.createdAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
