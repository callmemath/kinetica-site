import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToastContext } from '../../contexts/ToastContext';
import type { Service, Category } from '../../types';
import { apiService } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import ServiceStaffManager from '../../components/admin/ServiceStaffManager';
import ServiceAvailabilityManager from '../../components/admin/ServiceAvailabilityManager';
import {
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  ArrowLeft,
  Clock,
  Euro,
  Users,
  RefreshCw,
  Power,
  PowerOff,
  AlertTriangle,
  Settings,
  Tag,
  FolderOpen
} from 'lucide-react';

const AdminServicesPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { showSuccess, showError } = useToastContext();
  const navigate = useNavigate();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Stati per gestione categorie
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    value: '',
    label: '',
    color: '#3da4db'
  });

  // Categorie dinamiche dal backend
  const [categories, setCategories] = useState<any[]>([]);

  // Form state per creazione/modifica servizio
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 60,
    price: 0,
    categoryId: '',
    color: '#3da4db',
    imageUrl: '',
    isActive: true,
    availability: ''
  });

  // Check admin/staff permissions
  const isAdminOrStaff = useCallback((user: any) => {
    if (!user || !user.role) return false;
    const userRole = user.role.toLowerCase();
    return userRole === 'admin' || userRole === 'staff';
  }, []);

  // Check admin-only permissions
  const isAdmin = useCallback((user: any) => {
    if (!user || !user.role) return false;
    const userRole = user.role.toLowerCase();
    return userRole === 'admin';
  }, []);

  const hasFetched = useRef(false);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('=== FETCH SERVICES DEBUG ===');
      console.log('User:', user);
      console.log('User role:', user?.role);
      console.log('Is admin:', isAdmin(user));
      
      // Tutti usano lo stesso endpoint admin, il filtering viene fatto lato backend
      const response = await apiService.getAdminServices();
      
      if (response.success && response.data) {
        setServices(response.data);
      } else {
        throw new Error(response.message || 'Errore nel recupero dei servizi');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  // Effect separato per il controllo dell'autorizzazione
  useEffect(() => {
    if (!isLoading && user && !isAdminOrStaff(user)) {
      console.log('AdminServicesPage - Redirecting to home page, user not authorized');
      navigate('/');
    }
  }, [user, isLoading, navigate, isAdminOrStaff]);

  // Effect separato per il caricamento dei dati iniziali
  useEffect(() => {
    if (!isLoading && user && isAdminOrStaff(user) && !hasFetched.current) {
      hasFetched.current = true;
      
      console.log('AdminServicesPage - Loading initial data');
      
      // Carica categorie
      loadCategories();

      // Carica servizi
      (async () => {
        try {
          setLoading(true);
          const serviceResponse = await apiService.getAdminServices();
          
          if (serviceResponse.success && serviceResponse.data) {
            setServices(serviceResponse.data);
          } else {
            throw new Error(serviceResponse.message || 'Errore nel recupero dei servizi');
          }
        } catch (error) {
          console.error('Error fetching services:', error);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [user, isLoading, isAdminOrStaff]);

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || service.category?.value === filterCategory;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && service.isActive) ||
                         (filterStatus === 'inactive' && !service.isActive);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const resetForm = () => {
    const firstCategory = categories.find(cat => cat.value !== 'all');
    setFormData({
      name: '',
      description: '',
      duration: 60,
      price: 0,
      categoryId: firstCategory?.id || '',
      color: '#3da4db',
      imageUrl: '',
      isActive: true,
      availability: ''
    });
  };

  const closeCreateModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowCreateModal(false);
      setIsClosing(false);
      resetForm();
    }, 200);
  };

  const closeEditModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowEditModal(false);
      setIsClosing(false);
      resetForm();
      setSelectedService(null);
    }, 200);
  };

  const closeDeleteModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowDeleteModal(false);
      setIsClosing(false);
      setSelectedService(null);
    }, 200);
  };

  const handleCreate = () => {
    resetForm();
    setSelectedService(null);
    setIsClosing(false);
    setShowCreateModal(true);
  };

  const handleEdit = (service: Service) => {
    setFormData({
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: service.price,
      categoryId: service.categoryId,
      color: service.color,
      imageUrl: service.imageUrl || '',
      isActive: service.isActive,
      availability: service.availability || ''
    });
    setSelectedService(service);
    setIsClosing(false);
    setShowEditModal(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim() || !formData.description.trim()) {
        showError('Errore', 'Nome e descrizione sono obbligatori');
        return;
      }

      if (formData.duration <= 0 || formData.price < 0) {
        showError('Errore', 'Durata e prezzo devono essere valori positivi');
        return;
      }

      if (selectedService) {
        // Update existing service
        const response = await apiService.updateService(selectedService.id, formData);
        if (response.success && response.data) {
          setServices(prev => prev.map(service => 
            service.id === selectedService.id 
              ? response.data!
              : service
          ));
          showSuccess('Servizio aggiornato', 'Le modifiche sono state salvate');
          closeEditModal();
        } else {
          throw new Error(response.message || 'Errore nell\'aggiornamento');
        }
      } else {
        // Create new service
        const response = await apiService.createService(formData);
        if (response.success && response.data) {
          setServices(prev => [...prev, response.data!]);
          showSuccess('Servizio creato', 'Il nuovo servizio è stato aggiunto');
          closeCreateModal();
        } else {
          throw new Error(response.message || 'Errore nella creazione');
        }
      }
    } catch (error: any) {
      console.error('Error saving service:', error);
      showError('Errore', error.message || 'Impossibile salvare il servizio');
    }
  };

  const handleDelete = (service: Service) => {
    setSelectedService(service);
    setShowDeleteModal(true);
  };

  const handleManageStaff = (service: Service) => {
    setSelectedService(service);
    setShowStaffModal(true);
  };

  const handleCloseStaffModal = () => {
    setShowStaffModal(false);
    setSelectedService(null);
  };

  const handleToggleActive = async (service: Service) => {
    try {
      const updatedData = {
        ...service,
        isActive: !service.isActive
      };
      
      const response = await apiService.updateService(service.id, updatedData);
      
      if (response.success) {
        setServices(prev => prev.map(s => 
          s.id === service.id ? { ...s, isActive: !s.isActive } : s
        ));
        showSuccess(
          'Stato servizio aggiornato', 
          `Il servizio è stato ${!service.isActive ? 'attivato' : 'disattivato'}`
        );
      } else {
        throw new Error(response.message || 'Errore nell\'aggiornamento dello stato');
      }
    } catch (error) {
      console.error('Errore nell\'aggiornamento dello stato del servizio:', error);
      showError('Errore', 'Impossibile aggiornare lo stato del servizio');
    }
  };

  // Gestione Categorie
  const handleManageCategories = () => {
    setShowCategoriesModal(true);
  };

  const handleCreateCategory = () => {
    setCategoryFormData({ value: '', label: '', color: '#3da4db' });
    setShowCreateCategoryModal(true);
  };

  const handleEditCategory = (category: any) => {
    setCategoryFormData({
      value: category.value,
      label: category.label,
      color: category.color || '#3da4db'
    });
    setSelectedCategory(category);
    setShowEditCategoryModal(true);
  };

  const handleDeleteCategory = (category: any) => {
    setSelectedCategory(category);
    setShowDeleteCategoryModal(true);
  };

  // Funzione per caricare le categorie
  const loadCategories = async () => {
    try {
      const categoryResponse = await apiService.getAdminCategories();
      if (categoryResponse.success && categoryResponse.data) {
        const allCategories = [
          { id: 'all', value: 'all', label: 'Tutte le categorie', color: '#6b7280', isActive: true },
          ...categoryResponse.data
        ];
        setCategories(allCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const saveCategoryChanges = async () => {
    if (!categoryFormData.value.trim() || !categoryFormData.label.trim()) {
      showError('Errore', 'Nome e etichetta della categoria sono obbligatori');
      return;
    }

    try {
      setLoading(true);

      if (selectedCategory) {
        // Modifica categoria esistente
        const response = await apiService.updateCategory(selectedCategory.id, {
          value: categoryFormData.value.trim(),
          label: categoryFormData.label.trim(),
          color: categoryFormData.color,
          isActive: selectedCategory.isActive
        });

        if (response.success) {
          setCategories(prev => prev.map(cat => 
            cat.id === selectedCategory.id 
              ? { ...cat, ...categoryFormData }
              : cat
          ));
          showSuccess('Categoria aggiornata', 'Le modifiche sono state salvate');
          setShowEditCategoryModal(false);
          // Ricarica i servizi per mostrare le categorie aggiornate
          fetchServices();
        } else {
          showError('Errore', response.message || 'Errore nell\'aggiornamento della categoria');
        }
      } else {
        // Crea nuova categoria
        const response = await apiService.createCategory({
          value: categoryFormData.value.trim(),
          label: categoryFormData.label.trim(),
          color: categoryFormData.color
        });

        if (response.success) {
          // Ricarica le categorie dal backend per avere l'ID corretto
          loadCategories();
          showSuccess('Categoria creata', 'La nuova categoria è stata aggiunta');
          setShowCreateCategoryModal(false);
          // Ricarica i servizi per mostrare le nuove categorie
          fetchServices();
        } else {
          showError('Errore', response.message || 'Errore nella creazione della categoria');
        }
      }
    } catch (error) {
      console.error('Error saving category:', error);
      showError('Errore', 'Errore del server durante il salvataggio');
    } finally {
      setLoading(false);
      setSelectedCategory(null);
      setCategoryFormData({ value: '', label: '', color: '#3da4db' });
    }
  };

  const confirmDeleteCategory = async () => {
    if (!selectedCategory) return;

    // Verifica se la categoria è utilizzata dai servizi
    const usedByServices = services.some(service => service.categoryId === selectedCategory.id);
    
    if (usedByServices) {
      showError('Errore', 'Impossibile eliminare una categoria utilizzata dai servizi');
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.deleteCategory(selectedCategory.id);
      
      if (response.success) {
        setCategories(prev => prev.filter(cat => cat.id !== selectedCategory.id));
        showSuccess('Categoria eliminata', 'La categoria è stata rimossa');
        setShowDeleteCategoryModal(false);
        setSelectedCategory(null);
        // Ricarica i servizi per aggiornare la visualizzazione
        fetchServices();
      } else {
        showError('Errore', response.message || 'Errore nell\'eliminazione della categoria');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      showError('Errore', 'Errore del server durante l\'eliminazione');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedService) return;

    try {
      setIsDeleting(true);
      const response = await apiService.deleteService(selectedService.id);
      if (response.success) {
        setServices(prev => prev.filter(s => s.id !== selectedService.id));
        showSuccess('Servizio eliminato', response.message || 'Il servizio è stato rimosso');
        closeDeleteModal();
      } else {
        throw new Error(response.message || 'Errore nell\'eliminazione');
      }
    } catch (error: any) {
      console.error('Error deleting service:', error);
      showError('Errore', error.message || 'Impossibile eliminare il servizio');
    } finally {
      setIsDeleting(false);
    }
  };

  const getCategoryColor = (category?: Category): { backgroundColor: string; color: string } => {
    if (!category || !category.color) {
      return { backgroundColor: '#f3f4f6', color: '#374151' }; // bg-gray-100 text-gray-700
    }
    
    // Usa il colore della categoria dal database per lo sfondo
    // e calcola un colore del testo appropriato
    const backgroundColor = category.color;
    const isLightColor = isColorLight(backgroundColor);
    const textColor = isLightColor ? '#374151' : '#ffffff'; // gray-700 o white
    
    return { backgroundColor, color: textColor };
  };

  // Funzione helper per determinare se un colore è chiaro o scuro
  const isColorLight = (color: string): boolean => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 155;
  };

  // Don't render anything if user doesn't have permissions
  if (!user || !isAdminOrStaff(user)) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes modalEnter {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes modalExit {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
        }

        @keyframes backdropEnter {
          from {
            opacity: 0;
            backdrop-filter: blur(0px);
          }
          to {
            opacity: 1;
            backdrop-filter: blur(8px);
          }
        }

        @keyframes backdropExit {
          from {
            opacity: 1;
            backdrop-filter: blur(8px);
          }
          to {
            opacity: 0;
            backdrop-filter: blur(0px);
          }
        }

        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-100px) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes slideOutToTop {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(-50px) scale(0.9);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.7) rotate(-10deg);
          }
          to {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }

        @keyframes scaleOut {
          from {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
          to {
            opacity: 0;
            transform: scale(0.8) rotate(5deg);
          }
        }

        @keyframes shakeIn {
          0% {
            opacity: 0;
            transform: scale(0.8) translateX(-10px);
          }
          50% {
            transform: scale(1.05) translateX(5px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateX(0);
          }
        }

        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .modal-backdrop-enter {
          animation: backdropEnter 300ms ease-out;
        }

        .modal-backdrop-exit {
          animation: backdropExit 200ms ease-in;
        }

        .modal-content-enter {
          animation: slideInFromTop 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .modal-content-exit {
          animation: slideOutToTop 200ms ease-in;
        }

        .delete-modal-enter {
          animation: shakeIn 350ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .delete-modal-exit {
          animation: scaleOut 200ms ease-in;
        }

        /* Smooth transitions for form elements */
        .form-input {
          transition: all 0.2s ease;
        }

        .form-input:focus {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }

        /* Button animations */
        .btn-animated {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .btn-animated:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .btn-animated:active {
          transform: translateY(0);
          transition: all 0.1s;
        }

        .btn-animated::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .btn-animated:hover::before {
          left: 100%;
        }
      `}</style>
      

      <div className="min-h-screen bg-gray-50">
        {/* Header stile utenti */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  to="/admin"
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-6 h-6 text-white" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-white">Gestione Servizi</h1>
                  <p className="text-primary-100">{filteredServices.length} di {services.length} servizi</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={fetchServices}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Aggiorna</span>
                </button>
                {isAdmin(user) && (
                  <>
                    <button
                      onClick={handleManageCategories}
                      className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Categorie</span>
                    </button>
                    <button
                      onClick={handleCreate}
                      className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Nuovo Servizio</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Cerca servizi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tutti gli stati</option>
                  <option value="active">Solo attivi</option>
                  <option value="inactive">Solo inattivi</option>
                </select>
              </div>
            </div>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredServices.map((service, index) => (
            <div
              key={service.id}
              className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border-l-4 transform hover:-translate-y-1 hover:scale-[1.02] flex flex-col h-full ${
                service.isActive ? 'border-l-green-500' : 'border-l-red-500'
              }`}
              style={{
                animationDelay: `${index * 100}ms`,
                animation: 'fadeInUp 0.6s ease-out forwards',
                opacity: 0
              }}
            >
              <div className="p-6 flex flex-col h-full">
                {/* Service Image */}
                {service.imageUrl && (
                  <div className="mb-4">
                    <img 
                      src={service.imageUrl} 
                      alt={service.name}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Service Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {service.name}
                    </h3>
                    <span 
                      className="inline-block px-2 py-1 rounded-full text-xs font-medium"
                      style={getCategoryColor(service.category)}
                    >
                      {service.category?.label}
                    </span>
                  </div>
                </div>

                {/* Service Description */}
                <div className="flex-grow mb-4">
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {service.description}
                  </p>
                </div>

                {/* Service Details */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{service.duration} min</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Euro className="h-4 w-4" />
                    <span>€{service.price}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-auto">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleActive(service)}
                      className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 group ${
                        service.isActive 
                          ? 'text-green-600 hover:bg-green-50' 
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                      title={service.isActive ? 'Disattiva servizio' : 'Attiva servizio'}
                    >
                      {service.isActive ? (
                        <Power className="h-4 w-4 group-hover:scale-125 transition-transform duration-200" />
                      ) : (
                        <PowerOff className="h-4 w-4 group-hover:scale-125 transition-transform duration-200" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(service)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 group"
                      title="Modifica servizio"
                    >
                      <Edit3 className="h-4 w-4 group-hover:rotate-12 transition-transform duration-200" />
                    </button>
                    <button
                      onClick={() => handleManageStaff(service)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 group"
                      title="Gestisci staff"
                    >
                      <Users className="h-4 w-4 group-hover:scale-125 transition-transform duration-200" />
                    </button>
                    <button
                      onClick={() => handleDelete(service)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 group"
                      title="Elimina servizio"
                    >
                      <Trash2 className="h-4 w-4 group-hover:rotate-12 group-hover:scale-110 transition-all duration-200" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-500">Colore:</span>
                      <div
                        className="w-4 h-4 rounded-full border-2 border-white shadow-sm transition-all duration-200 hover:scale-125 hover:shadow-md cursor-help"
                        style={{ backgroundColor: service.color }}
                        title={`Colore del servizio: ${service.color}`}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nessun servizio trovato
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterCategory !== 'all' || filterStatus !== 'all'
                  ? 'Prova a modificare i filtri di ricerca'
                  : 'Inizia creando il tuo primo servizio'
                }
              </p>
              {(!searchTerm && filterCategory === 'all' && filterStatus === 'all' && isAdmin(user)) && (
                <button
                  onClick={handleCreate}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                >
                  Crea il primo servizio
                </button>
              )}
            </div>
          )}
        </div>
      </div>      {/* Create Modal */}
      {showCreateModal && (
        <div 
          className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${
            isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
          }`}
          onClick={closeCreateModal}
          style={{
            backdropFilter: isClosing ? 'blur(0px)' : 'blur(8px)',
          }}
        >
          <div 
            className={`bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl ${
              isClosing ? 'modal-content-exit' : 'modal-content-enter'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <Plus className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Crea Nuovo Servizio
                  </h2>
                  <p className="text-sm text-gray-500">
                    Aggiungi un nuovo servizio al catalogo
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Nome */}
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                    Nome Servizio *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Es. Fisioterapia Generale"
                  />
                </div>

                {/* Descrizione */}
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                    Descrizione *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="form-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Descrizione dettagliata del servizio..."
                  />
                </div>

                {/* Categoria */}
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                    Categoria
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="form-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.filter(cat => cat.value !== 'all').map(category => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Durata e Prezzo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Durata (minuti)
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                      min="15"
                      max="180"
                      step="15"
                      className="form-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                      <Euro className="w-4 h-4 inline mr-1" />
                      Prezzo (€)
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="5"
                      className="form-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Colore */}
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Colore del servizio
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-16 h-12 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="form-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                        placeholder="#3da4db"
                      />
                    </div>
                  </div>
                </div>

                {/* URL Immagine */}
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL Immagine del Servizio (opzionale)
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="form-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://esempio.com/immagine.jpg"
                  />
                  {formData.imageUrl && (
                    <div className="mt-2 p-2 border border-gray-200 rounded-lg">
                      <p className="text-xs text-gray-500 mb-2">Anteprima:</p>
                      <img 
                        src={formData.imageUrl} 
                        alt="Anteprima immagine servizio"
                        className="w-32 h-24 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Disponibilità per Prenotazioni */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <ServiceAvailabilityManager
                    availability={formData.availability}
                    onChange={(availability) => setFormData({ ...formData, availability })}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={closeCreateModal}
                  className="btn-animated px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSave}
                  className="btn-animated px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Crea Servizio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedService && (
        <div 
          className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${
            isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
          }`}
          onClick={closeEditModal}
          style={{
            backdropFilter: isClosing ? 'blur(0px)' : 'blur(8px)',
          }}
        >
          <div 
            className={`bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl ${
              isClosing ? 'modal-content-exit' : 'modal-content-enter'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <Edit3 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Modifica Servizio
                  </h2>
                  <p className="text-sm text-gray-500">
                    Aggiorna le informazioni di "{selectedService.name}"
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Nome */}
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                    Nome Servizio *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Es. Fisioterapia Generale"
                  />
                </div>

                {/* Descrizione */}
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                    Descrizione *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="form-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Descrizione dettagliata del servizio..."
                  />
                </div>

                {/* Categoria */}
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                    Categoria
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="form-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.filter(cat => cat.value !== 'all').map(category => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Durata e Prezzo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Durata (minuti)
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                      min="15"
                      max="180"
                      step="15"
                      className="form-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                      <Euro className="w-4 h-4 inline mr-1" />
                      Prezzo (€)
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="5"
                      className="form-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Colore */}
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Colore del servizio
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-16 h-12 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="form-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                        placeholder="#3da4db"
                      />
                    </div>
                  </div>
                </div>

                {/* URL Immagine */}
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL Immagine del Servizio (opzionale)
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="form-input w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://esempio.com/immagine.jpg"
                  />
                  {formData.imageUrl && (
                    <div className="mt-2 p-2 border border-gray-200 rounded-lg">
                      <p className="text-xs text-gray-500 mb-2">Anteprima:</p>
                      <img 
                        src={formData.imageUrl} 
                        alt="Anteprima immagine servizio"
                        className="w-32 h-24 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Disponibilità per Prenotazioni */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <ServiceAvailabilityManager
                    availability={formData.availability}
                    onChange={(availability) => setFormData({ ...formData, availability })}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={closeEditModal}
                  className="btn-animated px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSave}
                  className="btn-animated px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg"
                >
                  <Edit3 className="w-4 h-4 inline mr-2" />
                  Salva Modifiche
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedService && (
        <div 
          className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${
            isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
          }`}
          onClick={closeDeleteModal}
          style={{
            backdropFilter: isClosing ? 'blur(0px)' : 'blur(8px)',
          }}
        >
          <div 
            className={`bg-white rounded-xl max-w-md w-full shadow-2xl ${
              isClosing ? 'delete-modal-exit' : 'delete-modal-enter'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header con animazione pulsante */}
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4 animate-pulse">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Conferma Eliminazione
                  </h3>
                  <p className="text-sm text-gray-600">
                    Questa azione non può essere annullata
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="mb-6">
                <p className="text-gray-700">
                  Sei sicuro di voler eliminare il servizio{' '}
                  <span className="font-semibold text-gray-900">"{selectedService.name}"</span>?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Tutti i dati associati al servizio verranno rimossi definitivamente.
                </p>
              </div>

              {/* Banner di avviso - Operazione Irreversibile */}
              <div className={`bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 transition-all duration-400 ${
                !isClosing ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
              }`}>
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

              {/* Actions con loading state migliorato */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeDeleteModal}
                  disabled={isDeleting}
                  className="btn-animated px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Annulla
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="btn-animated px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium shadow-lg"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Elimina Definitivamente</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Staff Management Modal */}
      {showStaffModal && selectedService && (
        <ServiceStaffManager
          service={selectedService}
          isOpen={showStaffModal}
          onClose={handleCloseStaffModal}
          isAdmin={isAdmin(user)}
        />
      )}

      {/* Categories Management Modal */}
      {showCategoriesModal && (
        <div 
          className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${
            isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
          }`}
          onClick={() => setShowCategoriesModal(false)}
          style={{
            backdropFilter: isClosing ? 'blur(0px)' : 'blur(8px)',
          }}
        >
          <div 
            className={`bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl ${
              isClosing ? 'modal-content-exit' : 'modal-content-enter'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <FolderOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Gestione Categorie
                    </h2>
                    <p className="text-sm text-gray-500">
                      Modifica le categorie dei servizi
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCreateCategory}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nuova Categoria</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {categories.filter(cat => cat.value !== 'all').map((category) => (
                  <div
                    key={category.value}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <div>
                        <h3 className="font-medium text-gray-900">{category.label}</h3>
                        <p className="text-sm text-gray-500">{category.value}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifica categoria"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Elimina categoria"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {categories.filter(cat => cat.value !== 'all').length === 0 && (
                <div className="text-center py-12">
                  <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nessuna categoria
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Inizia creando la tua prima categoria
                  </p>
                  <button
                    onClick={handleCreateCategory}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Crea la prima categoria
                  </button>
                </div>
              )}

              <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowCategoriesModal(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {showCreateCategoryModal && (
        <div 
          className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${
            isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
          }`}
          onClick={() => setShowCreateCategoryModal(false)}
          style={{
            backdropFilter: isClosing ? 'blur(0px)' : 'blur(8px)',
          }}
        >
          <div 
            className={`bg-white rounded-xl max-w-md w-full shadow-2xl ${
              isClosing ? 'modal-content-exit' : 'modal-content-enter'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <Plus className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Nuova Categoria
                  </h2>
                  <p className="text-sm text-gray-500">
                    Crea una nuova categoria per i servizi
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Categoria *
                  </label>
                  <input
                    type="text"
                    value={categoryFormData.value}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, value: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="es. massoterapia"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Etichetta *
                  </label>
                  <input
                    type="text"
                    value={categoryFormData.label}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, label: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="es. Massoterapia"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Colore
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={categoryFormData.color}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                      className="w-16 h-12 border-2 border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={categoryFormData.color}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                      placeholder="#3da4db"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowCreateCategoryModal(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Annulla
                </button>
                <button
                  onClick={saveCategoryChanges}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Crea Categoria
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditCategoryModal && selectedCategory && (
        <div 
          className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${
            isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
          }`}
          onClick={() => setShowEditCategoryModal(false)}
          style={{
            backdropFilter: isClosing ? 'blur(0px)' : 'blur(8px)',
          }}
        >
          <div 
            className={`bg-white rounded-xl max-w-md w-full shadow-2xl ${
              isClosing ? 'modal-content-exit' : 'modal-content-enter'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <Edit3 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Modifica Categoria
                  </h2>
                  <p className="text-sm text-gray-500">
                    Aggiorna "{selectedCategory.label}"
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Categoria *
                  </label>
                  <input
                    type="text"
                    value={categoryFormData.value}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, value: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="es. massoterapia"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Etichetta *
                  </label>
                  <input
                    type="text"
                    value={categoryFormData.label}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, label: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="es. Massoterapia"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Colore
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={categoryFormData.color}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                      className="w-16 h-12 border-2 border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={categoryFormData.color}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                      placeholder="#3da4db"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowEditCategoryModal(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Annulla
                </button>
                <button
                  onClick={saveCategoryChanges}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Salva Modifiche
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Modal */}
      {showDeleteCategoryModal && selectedCategory && (
        <div 
          className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 ${
            isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
          }`}
          onClick={() => setShowDeleteCategoryModal(false)}
          style={{
            backdropFilter: isClosing ? 'blur(0px)' : 'blur(8px)',
          }}
        >
          <div 
            className={`bg-white rounded-xl max-w-md w-full shadow-2xl ${
              isClosing ? 'delete-modal-exit' : 'delete-modal-enter'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4 animate-pulse">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Elimina Categoria
                  </h3>
                  <p className="text-sm text-gray-600">
                    Questa azione non può essere annullata
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700">
                  Sei sicuro di voler eliminare la categoria{' '}
                  <span className="font-semibold text-gray-900">"{selectedCategory.label}"</span>?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  La categoria non potrà essere eliminata se è utilizzata dai servizi.
                </p>
              </div>

              {/* Banner di avviso */}
              <div className={`bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 transition-all duration-400 ${
                !isClosing ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
              }`}>
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

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteCategoryModal(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Annulla
                </button>
                <button
                  onClick={confirmDeleteCategory}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Elimina Categoria
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminServicesPage;
