import React, { useState, useEffect } from 'react';
import { useToastContext } from '../../contexts/ToastContext';
import { apiService } from '../../services/api';
import type { Service, Staff } from '../../types';
import LoadingSpinner from '../LoadingSpinner';
import {
  Users,
  Plus,
  X,
  Check,
  AlertCircle,
  Search,
  UserCheck,
  UserX
} from 'lucide-react';

interface ServiceStaffManagerProps {
  service: Service;
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

const ServiceStaffManager: React.FC<ServiceStaffManagerProps> = ({
  service,
  isOpen,
  onClose,
  isAdmin
}) => {
  const { showSuccess, showError } = useToastContext();
  
  const [loading, setLoading] = useState(false);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [assignedStaff, setAssignedStaff] = useState<Staff[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, service.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [allStaffResponse, assignedStaffResponse] = await Promise.all([
        apiService.getAdminStaff(),
        apiService.getServiceStaff(service.id)
      ]);

      if (allStaffResponse.success && allStaffResponse.data) {
        // Filtra solo lo staff attivo e mappa al tipo corretto
        const activeStaff = allStaffResponse.data
          .filter(staff => staff.isActive)
          .map(staff => ({
            id: staff.id,
            firstName: staff.firstName,
            lastName: staff.lastName,
            email: staff.email,
            phone: staff.phone,
            specialization: staff.specialization,
            bio: staff.bio,
            avatar: staff.avatar,
            isActive: staff.isActive,
            workingHours: staff.workingHours,
            createdAt: staff.createdAt,
            updatedAt: staff.updatedAt
          }));
        setAllStaff(activeStaff);
      }

      if (assignedStaffResponse.success && assignedStaffResponse.data) {
        // Mappa al tipo corretto
        const mappedAssignedStaff = assignedStaffResponse.data.map(staff => ({
          id: staff.id,
          firstName: staff.firstName,
          lastName: staff.lastName,
          email: staff.email,
          phone: staff.phone,
          specialization: staff.specialization,
          bio: staff.bio,
          avatar: staff.avatar,
          isActive: staff.isActive,
          workingHours: staff.workingHours,
          createdAt: staff.createdAt,
          updatedAt: staff.updatedAt
        }));
        setAssignedStaff(mappedAssignedStaff);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Errore', 'Impossibile caricare i dati dello staff');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  const isStaffAssigned = (staffId: string) => {
    return assignedStaff.some(staff => staff.id === staffId);
  };

  const toggleStaffAssignment = async (staff: Staff) => {
    const isAssigned = isStaffAssigned(staff.id);
    
    try {
      setIsSaving(true);
      
      if (isAssigned) {
        // Rimuovi staff dal servizio
        const response = await apiService.removeStaffFromService(service.id, staff.id);
        if (response.success) {
          setAssignedStaff(prev => prev.filter(s => s.id !== staff.id));
          showSuccess('Staff rimosso', response.message || `${staff.firstName} ${staff.lastName} rimosso dal servizio`);
        } else {
          throw new Error(response.message || 'Errore nella rimozione');
        }
      } else {
        // Assegna staff al servizio
        const response = await apiService.assignStaffToService(service.id, staff.id);
        if (response.success) {
          setAssignedStaff(prev => [...prev, staff]);
          showSuccess('Staff assegnato', response.message || `${staff.firstName} ${staff.lastName} assegnato al servizio`);
        } else {
          throw new Error(response.message || 'Errore nell\'assegnazione');
        }
      }
    } catch (error: any) {
      console.error('Error toggling staff assignment:', error);
      showError('Errore', error.message || 'Impossibile aggiornare l\'assegnazione');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStaff = isAdmin 
    ? allStaff.filter(staff => {
        const searchLower = searchTerm.toLowerCase();
        return (
          staff.firstName.toLowerCase().includes(searchLower) ||
          staff.lastName.toLowerCase().includes(searchLower) ||
          staff.email.toLowerCase().includes(searchLower) ||
          staff.specialization.toLowerCase().includes(searchLower)
        );
      })
    : assignedStaff; // Per lo staff, mostra solo quelli assegnati

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center p-4 z-50 transition-all duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl transition-all duration-300 transform ${
          isClosing ? 'scale-95 translate-y-4 opacity-0' : 'scale-100 translate-y-0 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: service.color }}
              >
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {isAdmin ? 'Gestione Staff' : 'Staff Assegnato'} - {service.name}
                </h2>
                <p className="text-sm text-gray-600">
                  {isAdmin 
                    ? 'Assegna o rimuovi lo staff per questo servizio'
                    : 'Visualizza lo staff assegnato a questo servizio'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="p-6">
              {/* Summary */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    {assignedStaff.length} di {allStaff.length} membri dello staff assegnati
                  </span>
                </div>
                <p className="text-sm text-blue-700">
                  {isAdmin 
                    ? 'Solo lo staff assegnato potrà erogare questo servizio'
                    : 'Questi sono i membri dello staff autorizzati a erogare questo servizio'
                  }
                </p>
              </div>

              {/* Search - Solo per Admin */}
              {isAdmin && (
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Cerca staff per nome, email o specializzazione..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Staff List */}
              <div className="space-y-3">
                {filteredStaff.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {isAdmin ? (
                        searchTerm ? 'Nessun risultato' : 'Nessuno staff trovato'
                      ) : (
                        'Nessuno staff assegnato'
                      )}
                    </h3>
                    <p className="text-gray-600">
                      {isAdmin ? (
                        searchTerm 
                          ? 'Prova a modificare i termini di ricerca' 
                          : 'Non ci sono membri dello staff attivi'
                      ) : (
                        'Nessun membro dello staff è stato assegnato a questo servizio'
                      )}
                    </p>
                  </div>
                ) : (
                  filteredStaff.map((staff) => {
                    const isAssigned = isStaffAssigned(staff.id);
                    
                    return (
                      <div
                        key={staff.id}
                        className={`p-4 border rounded-lg transition-all duration-200 hover:shadow-md ${
                          isAssigned 
                            ? 'border-green-200 bg-green-50' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {/* Avatar */}
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                              {staff.avatar ? (
                                <img
                                  src={staff.avatar}
                                  alt={`${staff.firstName} ${staff.lastName}`}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-gray-600 font-medium">
                                  {staff.firstName[0]}{staff.lastName[0]}
                                </span>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">
                                {staff.firstName} {staff.lastName}
                                {isAssigned && (
                                  <Check className="inline-block ml-2 h-4 w-4 text-green-600" />
                                )}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {staff.specialization}
                              </p>
                              <p className="text-xs text-gray-500">
                                {staff.email}
                              </p>
                            </div>
                          </div>

                          {/* Toggle Button - Solo per Admin */}
                          {isAdmin && (
                            <button
                              onClick={() => toggleStaffAssignment(staff)}
                              disabled={isSaving}
                              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                                isAssigned
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200 focus:ring-2 focus:ring-red-500'
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200 focus:ring-2 focus:ring-blue-500'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {isSaving ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  {isAssigned ? (
                                    <>
                                      <UserX className="h-4 w-4" />
                                      <span>Rimuovi</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="h-4 w-4" />
                                      <span>Assegna</span>
                                    </>
                                  )}
                                </>
                              )}
                            </button>
                          )}

                          {/* Status indicator per Staff */}
                          {!isAdmin && (
                            <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-700 rounded-lg">
                              <Check className="h-4 w-4" />
                              <span className="font-medium">Assegnato</span>
                            </div>
                          )}
                        </div>

                        {/* Additional Info */}
                        {staff.bio && (
                          <div className="mt-2 text-xs text-gray-500">
                            {staff.bio}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <AlertCircle className="h-4 w-4" />
              <span>
                {isAdmin 
                  ? 'Le modifiche vengono salvate automaticamente'
                  : 'Solo visualizzazione - contatta un amministratore per modifiche'
                }
              </span>
            </div>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceStaffManager;
