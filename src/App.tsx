import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ToastProvider } from './contexts/ToastContext';
import { CookieProvider } from './contexts/CookieContext';
import { StudioSettingsProvider } from './hooks/useStudioSettings';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import Footer from './components/Footer';
import CookieBanner from './components/CookieBanner';
import { ScrollToTop } from './hooks/useScrollToTop';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/ServicesPage';
import BookingPage from './pages/BookingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminServicesPage from './pages/admin/AdminServicesPage';
import AdminStaffPage from './pages/admin/AdminStaffPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import BookingsPage from './pages/BookingsPage';
import ProfilePage from './pages/ProfilePage';
import ContactsPage from './pages/ContactsPage';
import CollaborationsPage from './pages/CollaborationsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import NotFoundPage from './pages/NotFoundPage';
import TestErrorPage from './pages/TestErrorPage';
import RoleDebugger from './components/RoleDebugger';

function App() {
  return (
    <ErrorBoundary>
      <CookieProvider>
        <ToastProvider>
          <AuthProvider>
            <StudioSettingsProvider>
              <Router>
                <ScrollToTop />
                <div className="min-h-screen flex flex-col">
                  <Header />
                  <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/chi-siamo" element={<AboutPage />} />
                    <Route path="/servizi" element={<ServicesPage />} />
                    <Route path="/prenota" element={<BookingPage />} />
                    <Route path="/booking" element={<BookingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/admin" element={<AdminDashboardPage />} />
                    <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                    <Route path="/admin/bookings" element={<AdminBookingsPage />} />
                    <Route path="/admin/users" element={<AdminUsersPage />} />
                    <Route path="/admin/services" element={<AdminServicesPage />} />
                    <Route path="/admin/staff" element={<AdminStaffPage />} />
                    <Route path="/admin/reports" element={<AdminReportsPage />} />
                    <Route path="/admin/settings" element={<AdminSettingsPage />} />
                    <Route path="/prenotazioni" element={<BookingsPage />} />
                    <Route path="/profilo" element={<ProfilePage />} />
                    <Route path="/collaborazioni" element={<CollaborationsPage />} />
                    <Route path="/contatti" element={<ContactsPage />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                    {/* Pagina di test solo in development */}
                    {import.meta.env.DEV && (
                      <Route path="/test-error" element={<TestErrorPage />} />
                    )}
                    {/* Catch-all route per pagine non trovate */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </main>
                <Footer />
                <CookieBanner />
                {/* Debugger temporaneo solo in development */}
                {import.meta.env.DEV && <RoleDebugger />}
              </div>
            </Router>
          </StudioSettingsProvider>
        </AuthProvider>
      </ToastProvider>
    </CookieProvider>
  </ErrorBoundary>
  );
}

export default App;
