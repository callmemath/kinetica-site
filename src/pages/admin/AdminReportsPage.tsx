import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  Activity,
  BarChart3,
  PieChart,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToastContext } from '../../contexts/ToastContext';
import { isAdminOrStaff } from '../../utils/roles';
import AnimatedCard from '../../components/AnimatedCard';
import LoadingSpinner from '../../components/LoadingSpinner';

interface ReportStats {
  totalRevenue: number;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  averageBookingValue: number;
  topServices: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
  topStaff: Array<{
    name: string;
    bookings: number;
    revenue: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    bookings: number;
  }>;
  dailyStats: Array<{
    date: string;
    bookings: number;
    revenue: number;
  }>;
  paymentStats: {
    paid: number;
    unpaid: number;
    totalPaid: number;
    totalUnpaid: number;
  };
}

const AdminReportsPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { showSuccess, showError } = useToastContext();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [reportStats, setReportStats] = useState<ReportStats | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: '2025-08-01',
    endDate: '2025-08-31'
  });

  // Check permissions
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      showError('Accesso richiesto', 'Devi effettuare il login per accedere ai report');
      navigate('/login');
      return;
    }
    
    if (user && !isAdminOrStaff(user)) {
      showError('Accesso negato', 'Non hai i permessi per accedere a questa sezione');
      navigate('/dashboard');
      return;
    }

    if (user && isAdminOrStaff(user)) {
      loadReportData();
    }
  }, [user, authLoading, dateRange]);

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token'); // Usa la chiave corretta
      console.log('Token presente:', token ? 'Sì' : 'No');
      console.log('User dal context:', user);
      
      if (!token) {
        throw new Error('Token non presente');
      }
      
      const response = await fetch(`http://localhost:3001/api/admin/reports?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          const errorText = await response.text();
          console.log('Auth error:', errorText);
          throw new Error('Non hai i permessi per accedere ai report');
        }
        throw new Error('Errore nel caricamento dei report');
      }
      
      const data = await response.json();
      setReportStats(data.data || data);
    } catch (error) {
      console.error('Errore nel caricamento dei report:', error);
      showError('Errore', 'Impossibile caricare i dati dei report');
      // Mock data per sviluppo
      setReportStats({
        totalRevenue: 15250,
        totalBookings: 89,
        completedBookings: 75,
        cancelledBookings: 8,
        averageBookingValue: 85.5,
        topServices: [
          { name: 'Fisioterapia', count: 35, revenue: 5250 },
          { name: 'Osteopatia', count: 25, revenue: 3750 },
          { name: 'Massoterapia', count: 20, revenue: 2400 }
        ],
        topStaff: [
          { name: 'Dr. Mario Rossi', bookings: 45, revenue: 6750 },
          { name: 'Dr.ssa Laura Bianchi', bookings: 30, revenue: 4500 },
          { name: 'Dr. Giuseppe Verdi', bookings: 25, revenue: 3750 }
        ],
        monthlyRevenue: [
          { month: 'Gennaio 2025', revenue: 12500, bookings: 65 },
          { month: 'Febbraio 2025', revenue: 13200, bookings: 72 },
          { month: 'Marzo 2025', revenue: 15250, bookings: 89 }
        ],
        dailyStats: [],
        paymentStats: {
          paid: 65,
          unpaid: 24,
          totalPaid: 12800,
          totalUnpaid: 2450
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3001/api/admin/reports/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          format
        })
      });

      if (!response.ok) {
        throw new Error('Errore nell\'export');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${dateRange.startDate}-${dateRange.endDate}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      showSuccess('Export completato', `Report esportato in formato ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Errore nell\'export:', error);
      showError('Errore', 'Impossibile esportare il report');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
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
                <h1 className="text-2xl font-bold text-white">Report e Statistiche</h1>
                <p className="text-primary-100">Analisi dettagliate delle performance del centro</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => loadReportData()}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Aggiorna</span>
              </button>
              <button
                onClick={() => exportReport('excel')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Excel</span>
              </button>
              <button
                onClick={() => exportReport('pdf')}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filtri */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Inizio
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Fine
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {reportStats && (
          <>
            {/* Statistiche Principali */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <AnimatedCard>
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Ricavi Totali
                        </dt>
                        <dd className="text-lg font-semibold text-gray-900">
                          {formatCurrency(reportStats.totalRevenue)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </AnimatedCard>

              <AnimatedCard>
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Calendar className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Prenotazioni Totali
                        </dt>
                        <dd className="text-lg font-semibold text-gray-900">
                          {reportStats.totalBookings}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </AnimatedCard>

              <AnimatedCard>
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <TrendingUp className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Valore Medio Prenotazione
                        </dt>
                        <dd className="text-lg font-semibold text-gray-900">
                          {formatCurrency(reportStats.averageBookingValue)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </AnimatedCard>

              <AnimatedCard>
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Activity className="h-8 w-8 text-orange-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Tasso Completamento
                        </dt>
                        <dd className="text-lg font-semibold text-gray-900">
                          {reportStats.totalBookings > 0 
                            ? Math.round((reportStats.completedBookings / reportStats.totalBookings) * 100)
                            : 0}%
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            </div>

            {/* Statistiche Pagamenti */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <AnimatedCard>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                    Stato Pagamenti
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Prenotazioni Pagate</span>
                      <div className="text-right">
                        <span className="text-sm font-medium text-green-600">
                          {reportStats.paymentStats.paid}
                        </span>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(reportStats.paymentStats.totalPaid)}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Prenotazioni Non Pagate</span>
                      <div className="text-right">
                        <span className="text-sm font-medium text-red-600">
                          {reportStats.paymentStats.unpaid}
                        </span>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(reportStats.paymentStats.totalUnpaid)}
                        </div>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900">Tasso Pagamento</span>
                        <span className="text-sm font-medium text-blue-600">
                          {reportStats.paymentStats.paid + reportStats.paymentStats.unpaid > 0
                            ? Math.round((reportStats.paymentStats.paid / (reportStats.paymentStats.paid + reportStats.paymentStats.unpaid)) * 100)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedCard>

              <AnimatedCard>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                    Statistiche Prenotazioni
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Completate</span>
                      <span className="text-sm font-medium text-green-600">
                        {reportStats.completedBookings}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Cancellate</span>
                      <span className="text-sm font-medium text-red-600">
                        {reportStats.cancelledBookings}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">In Attesa</span>
                      <span className="text-sm font-medium text-yellow-600">
                        {reportStats.totalBookings - reportStats.completedBookings - reportStats.cancelledBookings}
                      </span>
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            </div>

            {/* Top Services e Staff */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <AnimatedCard>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <PieChart className="w-5 h-5 mr-2 text-purple-600" />
                    Servizi Più Richiesti
                  </h3>
                  <div className="space-y-3">
                    {reportStats.topServices.map((service, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {service.name}
                          </span>
                          <div className="text-xs text-gray-500">
                            {service.count} prenotazioni
                          </div>
                        </div>
                        <span className="text-sm font-medium text-green-600">
                          {formatCurrency(service.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedCard>

              <AnimatedCard>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-600" />
                    Performance Staff
                  </h3>
                  <div className="space-y-3">
                    {reportStats.topStaff.map((staff, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {staff.name}
                          </span>
                          <div className="text-xs text-gray-500">
                            {staff.bookings} prenotazioni
                          </div>
                        </div>
                        <span className="text-sm font-medium text-green-600">
                          {formatCurrency(staff.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedCard>
            </div>

            {/* Trend Mensile */}
            <AnimatedCard>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  Trend Mensile
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Periodo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Prenotazioni
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ricavi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportStats.monthlyRevenue?.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.month}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.bookings}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(item.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </AnimatedCard>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminReportsPage;
