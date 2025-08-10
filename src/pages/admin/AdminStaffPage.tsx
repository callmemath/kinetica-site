import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Power, 
  PowerOff,
  Mail,
  Phone,
  Calendar,
  Award,
  X,
  User,
  Lock,
  ArrowLeft,
  AlertTriangle,
  Image
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToastContext } from '../../contexts/ToastContext';
import { apiService } from '../../services/api';
import type { Staff } from '../../services/api';
import { isAdminOrStaff, isAdmin } from '../../utils/roles';

const AdminStaffPage = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [specializationFilter, setSpecializationFilter] = useState<'all' | string>('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    specialization: '',
    yearsOfExperience: 0,
    bio: '',
    avatar: '',
    workingHours: '',
    isActive: true
  });

  const { user, isLoading: authLoading } = useAuth();
  const { showSuccess, showError } = useToastContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;

    if (!user || !isAdminOrStaff(user)) {
      navigate('/');
      return;
    }

    fetchStaff();
  }, [user, navigate, authLoading]);

  useEffect(() => {
    let filtered = staff;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.specialization.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => 
        statusFilter === 'active' ? member.isActive : !member.isActive
      );
    }

    // Apply specialization filter
    if (specializationFilter !== 'all') {
      filtered = filtered.filter(member => 
        member.specialization === specializationFilter
      );
    }

    setFilteredStaff(filtered);
  }, [staff, searchTerm, statusFilter, specializationFilter]);

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getAdminStaff();
      if (response.success && response.data) {
        setStaff(response.data);
      } else {
        showError('Errore nel caricamento dello staff');
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      showError('Errore nel caricamento dello staff');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      specialization: '',
      yearsOfExperience: 0,
      bio: '',
      avatar: '',
      workingHours: '',
      isActive: true
    });
    setShowCreateModal(true);
    setIsClosing(false);
  };

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormData({
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      email: staffMember.email,
      password: '', // Password non necessaria per la modifica
      phone: staffMember.phone || '',
      specialization: staffMember.specialization,
      yearsOfExperience: staffMember.yearsOfExperience || 0,
      bio: staffMember.bio || '',
      avatar: staffMember.avatar || '',
      workingHours: staffMember.workingHours || '',
      isActive: staffMember.isActive
    });
    setShowEditModal(true);
    setIsClosing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Validazione dei campi obbligatori
      if (!formData.firstName.trim()) {
        showError('Il nome è obbligatorio');
        setIsSaving(false);
        return;
      }
      
      if (!formData.lastName.trim()) {
        showError('Il cognome è obbligatorio');
        setIsSaving(false);
        return;
      }
      
      if (!formData.email.trim()) {
        showError('L\'email è obbligatoria');
        setIsSaving(false);
        return;
      }
      
      if (!formData.specialization.trim()) {
        showError('La specializzazione è obbligatoria');
        setIsSaving(false);
        return;
      }
      
      // Per la creazione, la password è obbligatoria
      if (!editingStaff && !formData.password.trim()) {
        showError('La password è obbligatoria per creare un nuovo staff');
        setIsSaving(false);
        return;
      }
      
      if (!editingStaff && formData.password.length < 6) {
        showError('La password deve essere di almeno 6 caratteri');
        setIsSaving(false);
        return;
      }

      if (editingStaff) {
        // Update existing staff member (exclude password)
        const { password, ...updateData } = formData;
        const response = await apiService.updateStaff(editingStaff.id, updateData);
        if (response.success) {
          showSuccess('Membro dello staff aggiornato con successo');
          closeEditModal();
          fetchStaff();
        } else {
          showError(response.message || 'Errore nell\'aggiornamento del membro dello staff');
        }
      } else {
        // Create new staff member (include password)
        console.log('📤 Sending staff data:', formData);
        console.log('📤 yearsOfExperience type:', typeof formData.yearsOfExperience, 'value:', formData.yearsOfExperience);
        
        // Ensure yearsOfExperience is a number, not a string
        const staffPayload = {
          ...formData,
          yearsOfExperience: formData.yearsOfExperience || 0
        };
        
        console.log('📤 Final payload:', staffPayload);
        const response = await apiService.createStaff(staffPayload);
        console.log('📥 Response:', response);
        if (response.success) {
          showSuccess('Membro dello staff creato con successo');
          closeCreateModal();
          fetchStaff();
        } else {
          showError(response.message || 'Errore nella creazione del membro dello staff');
        }
      }
    } catch (error) {
      console.error('Error saving staff:', error);
      showError('Errore nel salvataggio del membro dello staff');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (staffMember: Staff) => {
    setDeletingStaff(staffMember);
    setShowDeleteModal(true);
    setIsClosing(false);
  };

  const confirmDelete = async () => {
    if (!deletingStaff) return;
    
    setIsDeleting(true);
    try {
      const response = await apiService.deleteStaff(deletingStaff.id);
      if (response.success) {
        showSuccess('Membro dello staff eliminato con successo');
        closeDeleteModal();
        fetchStaff();
      } else {
        showError(response.message || 'Errore nell\'eliminazione del membro dello staff');
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      showError('Errore nell\'eliminazione del membro dello staff');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleStaffStatus = async (staffMember: Staff) => {
    try {
      const response = await apiService.toggleStaffStatus(staffMember.id);
      if (response.success) {
        showSuccess(`${staffMember.firstName} ${staffMember.lastName} ${staffMember.isActive ? 'disattivato' : 'attivato'} con successo`);
        fetchStaff();
      } else {
        const errorMessage = response.message || 'Errore nell\'aggiornamento dello stato';
        const isBookingError = errorMessage.includes('prenotazioni') || errorMessage.includes('booking') || errorMessage.includes('active');
        showError(
          'Impossibile modificare lo stato',
          isBookingError 
            ? `${errorMessage}. Non è possibile disattivare questo membro dello staff perché ha prenotazioni attive o future. Completa o annulla le prenotazioni prima di procedere.`
            : errorMessage
        );
      }
    } catch (error) {
      console.error('Error toggling staff status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore nell\'aggiornamento dello stato';
      const isBookingError = errorMessage.includes('prenotazioni') || errorMessage.includes('booking') || errorMessage.includes('active');
      showError(
        'Impossibile modificare lo stato',
        isBookingError 
          ? `${errorMessage}. Non è possibile disattivare questo membro dello staff perché ha prenotazioni attive o future. Completa o annulla le prenotazioni prima di procedere.`
          : errorMessage
      );
    }
  };

  const closeCreateModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowCreateModal(false);
      setIsClosing(false);
    }, 150);
  };

  const closeEditModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowEditModal(false);
      setEditingStaff(null);
      setIsClosing(false);
    }, 150);
  };

  const closeDeleteModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowDeleteModal(false);
      setDeletingStaff(null);
      setIsClosing(false);
    }, 150);
  };

  const getUniqueSpecializations = () => {
    const specializations = staff.map(member => member.specialization);
    return [...new Set(specializations)];
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento staff...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/admin')}
                className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors mr-2"
                title="Torna alla Dashboard"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <Users className="w-10 h-10 text-white" />
              <div>
                <h1 className="text-3xl font-bold text-white">Gestione Staff</h1>
                <p className="text-primary-100 mt-1">Gestisci i membri del team</p>
              </div>
            </div>
            {isAdmin(user) && (
              <button
                onClick={handleCreate}
                className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-300 flex items-center space-x-2 shadow-lg transform hover:scale-105 hover:shadow-xl active:scale-95 group animate-bounce-gentle"
              >
                <Plus className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
                <span className="transition-colors duration-300 group-hover:text-primary-700">Aggiungi Staff</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cerca per nome, email, specializzazione..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
              >
                <option value="all">Tutti gli stati</option>
                <option value="active">Attivi</option>
                <option value="inactive">Inattivi</option>
              </select>
            </div>

            {/* Specialization Filter */}
            <div className="relative">
              <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={specializationFilter}
                onChange={(e) => setSpecializationFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
              >
                <option value="all">Tutte le specializzazioni</option>
                {getUniqueSpecializations().map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Staff Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((staffMember, index) => (
            <div 
              key={staffMember.id} 
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-primary-200 transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Card Header */}
              <div className="p-6 border-b border-gray-200 flex-shrink-0 bg-gradient-to-r from-gray-50 to-white group-hover:from-primary-50 group-hover:to-blue-50 transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-700 transition-colors duration-200">
                      {staffMember.firstName} {staffMember.lastName}
                    </h3>
                    <p className="text-primary-600 font-medium group-hover:text-primary-700 transition-colors duration-200">
                      {staffMember.specialization}
                    </p>
                    {staffMember.yearsOfExperience && (
                      <p className="text-sm text-gray-500 mt-1 group-hover:text-gray-600 transition-colors duration-200">
                        {staffMember.yearsOfExperience} anni di esperienza
                      </p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${getStatusColor(staffMember.isActive)} ${
                    staffMember.isActive ? 'group-hover:shadow-sm' : ''
                  }`}>
                    {staffMember.isActive ? 'Attivo' : 'Inattivo'}
                  </span>
                </div>
              </div>

              {/* Card Content - flexible height */}
              <div className="p-6 flex-grow flex flex-col">
                <div className="space-y-3 flex-shrink-0">
                  <div className="flex items-center space-x-3 group/item hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors duration-200">
                    <Mail className="w-4 h-4 text-gray-400 group-hover/item:text-primary-500 transition-colors duration-200" />
                    <span className="text-sm text-gray-600 group-hover/item:text-gray-700 transition-colors duration-200">
                      {staffMember.email}
                    </span>
                  </div>
                  {staffMember.phone && (
                    <div className="flex items-center space-x-3 group/item hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors duration-200">
                      <Phone className="w-4 h-4 text-gray-400 group-hover/item:text-primary-500 transition-colors duration-200" />
                      <span className="text-sm text-gray-600 group-hover/item:text-gray-700 transition-colors duration-200">
                        {staffMember.phone}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-3 group/item hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors duration-200">
                    <Calendar className="w-4 h-4 text-gray-400 group-hover/item:text-primary-500 transition-colors duration-200" />
                    <span className="text-sm text-gray-600 group-hover/item:text-gray-700 transition-colors duration-200">
                      {staffMember._count?.bookings || 0} prenotazioni
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 group/item hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors duration-200">
                    <Award className="w-4 h-4 text-gray-400 group-hover/item:text-primary-500 transition-colors duration-200" />
                    <span className="text-sm text-gray-600 group-hover/item:text-gray-700 transition-colors duration-200">
                      {staffMember._count?.services || 0} servizi
                    </span>
                  </div>
                </div>

                {/* Bio section - takes available space */}
                {staffMember.bio && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex-grow">
                    <p className="text-sm text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-200">
                      {staffMember.bio}
                    </p>
                  </div>
                )}
                
                {/* Spacer to push actions to bottom when no bio */}
                {!staffMember.bio && <div className="flex-grow"></div>}
              </div>

              {/* Card Actions - solo per admin */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between flex-shrink-0 mt-auto group-hover:bg-gray-100 transition-colors duration-300">
                {isAdmin(user) ? (
                  <>
                    <button
                      onClick={() => toggleStaffStatus(staffMember)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                        staffMember.isActive
                          ? 'text-red-600 hover:bg-red-50 hover:shadow-sm'
                          : 'text-green-600 hover:bg-green-50 hover:shadow-sm'
                      }`}
                    >
                      {staffMember.isActive ? (
                        <>
                          <PowerOff className="w-4 h-4" />
                          <span>Disattiva</span>
                        </>
                      ) : (
                        <>
                          <Power className="w-4 h-4" />
                          <span>Attiva</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(staffMember)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95 hover:shadow-sm"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(staffMember)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95 hover:shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  // Staff non può interagire con altri membri dello staff
                  <div></div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredStaff.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun membro dello staff trovato</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== 'all' || specializationFilter !== 'all'
                ? 'Prova a modificare i filtri di ricerca'
                : 'Inizia aggiungendo il primo membro del team'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && specializationFilter === 'all' && (
              <button
                onClick={handleCreate}
                className="btn-primary inline-flex items-center space-x-2 transform hover:scale-105 active:scale-95 transition-all duration-300 hover:shadow-xl group animate-pulse-glow"
              >
                <Plus className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
                <span>Aggiungi primo membro</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center bg-white/20 backdrop-blur-sm transition-all duration-300 ${
            isClosing ? 'opacity-0' : 'opacity-100 animate-modal-fade-in'
          }`}
          onClick={editingStaff ? closeEditModal : closeCreateModal}
        >
          <div 
            className={`bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto transition-all duration-300 transform ${
              isClosing 
                ? 'opacity-0 scale-90 translate-y-8' 
                : 'opacity-100 scale-100 translate-y-0 animate-modal-slide-in'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 animate-fade-in-down animate-delay-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingStaff ? 'Modifica Membro Staff' : 'Nuovo Membro Staff'}
              </h2>
              <button
                onClick={editingStaff ? closeEditModal : closeCreateModal}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-110 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <form id="staff-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="p-6 space-y-6 animate-fade-in-up animate-delay-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Nome"
                      required
                    />
                  </div>
                </div>

                {/* Cognome */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cognome *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Cognome"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="email@esempio.com"
                      required
                    />
                  </div>
                </div>

                {/* Password - solo per creazione */}
                {!editingStaff && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Password per l'account"
                        required={!editingStaff}
                        minLength={6}
                      />
                    </div>
                  </div>
                )}

                {/* Telefono */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefono
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="+39 123 456 7890"
                    />
                  </div>
                </div>

                {/* Specializzazione */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specializzazione *
                  </label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="es. Fisioterapia, Osteopatia"
                      required
                    />
                  </div>
                </div>

                {/* Anni di esperienza */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anni di esperienza
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({ ...formData, yearsOfExperience: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Biografia
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Descrizione professionale, formazione, specializzazioni..."
                />
              </div>

              {/* URL Immagine */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Immagine Profilo
                </label>
                <div className="relative">
                  <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="url"
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="https://esempio.com/immagine.jpg"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  URL dell'immagine che verrà mostrata nella pagina "Chi Siamo"
                </p>
              </div>

              {/* Status */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Membro attivo
                </label>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50 animate-fade-in-up animate-delay-300">
              <button
                onClick={editingStaff ? closeEditModal : closeCreateModal}
                disabled={isSaving}
                className="px-6 py-3 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annulla
              </button>
              <button
                type="submit"
                form="staff-form"
                disabled={isSaving}
                className="btn-primary px-6 py-3 min-w-[120px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 transition-all duration-200"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>{editingStaff ? 'Aggiorna' : 'Crea'} Membro</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingStaff && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300 ${
            isClosing ? 'opacity-0' : 'opacity-100 animate-modal-fade-in'
          }`}
          onClick={closeDeleteModal}
        >
          <div 
            className={`bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transition-all duration-400 transform ${
              isClosing 
                ? 'opacity-0 scale-90 translate-y-8' 
                : 'opacity-100 scale-100 translate-y-0 animate-modal-bounce-in'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 animate-fade-in-down animate-delay-100">
              <h2 className="text-xl font-bold text-red-600 flex items-center">
                <Trash2 className="w-6 h-6 mr-2" />
                Conferma Eliminazione
              </h2>
              <button
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-110 active:scale-95 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 animate-fade-in animate-delay-200">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-scale">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 animate-fade-in-up animate-delay-300">
                  Sei sicuro di voler eliminare questo membro dello staff?
                </h3>
                <p className="text-gray-600 mb-4 animate-fade-in-up animate-delay-400">
                  Stai per eliminare <strong>{deletingStaff.firstName} {deletingStaff.lastName}</strong> ({deletingStaff.specialization}).
                </p>

                {/* Banner di avviso - Operazione Irreversibile */}
                <div className={`bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 transition-all duration-400 animate-fade-in-up animate-delay-500`}>
                  <div className="flex items-center">
                    <div className="p-2 bg-amber-100 rounded-full mr-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-amber-800 font-semibold text-sm">Operazione Irreversibile</p>
                      <p className="text-amber-700 text-xs mt-1">Questa azione non potrà essere annullata una volta confermata</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50 animate-fade-in-up animate-delay-600">
              <button
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="px-6 py-3 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annulla
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all duration-200 transform hover:scale-105 active:scale-95 min-w-[120px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Elimina
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStaffPage;
