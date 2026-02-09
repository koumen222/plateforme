import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { EcomAuthProvider } from './hooks/useEcomAuth.jsx';
import { CurrencyProvider } from './contexts/CurrencyContext.jsx';
import { useEcomAuth } from './hooks/useEcomAuth.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import CloseuseDashboard from './pages/CloseuseDashboard.jsx';
import ComptaDashboard from './pages/ComptaDashboard.jsx';
import ProductsList from './pages/ProductsList.jsx';
import ProductForm from './pages/ProductForm.jsx';
import ReportsList, { ReportsListWithBoundary } from './pages/ReportsList.jsx';
import ReportForm from './pages/ReportForm.jsx';
import ReportDetail from './pages/ReportDetail.jsx';
import Profile from './pages/Profile.jsx';
import StockOrdersList from './pages/StockOrdersList.jsx';
import StockOrderForm from './pages/StockOrderForm.jsx';
import StockManagement from './pages/StockManagement.jsx';
import DecisionsList from './pages/DecisionsList.jsx';
import DecisionForm from './pages/DecisionForm.jsx';
import TransactionsList from './pages/TransactionsList.jsx';
import TransactionForm from './pages/TransactionForm.jsx';
import TransactionDetail from './pages/TransactionDetail.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import UserManagement from './pages/UserManagement.jsx';
import ClientsList from './pages/ClientsList.jsx';
import ClientForm from './pages/ClientForm.jsx';
import ProspectsList from './pages/ProspectsList.jsx';
import OrdersList from './pages/OrdersList.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import CampaignsList from './pages/CampaignsList.jsx';
import CampaignForm from './pages/CampaignForm.jsx';
import SuperAdminDashboard from './pages/SuperAdminDashboard.jsx';
import SuperAdminUsers from './pages/SuperAdminUsers.jsx';
import SuperAdminWorkspaces from './pages/SuperAdminWorkspaces.jsx';
import SuperAdminActivity from './pages/SuperAdminActivity.jsx';
import SuperAdminSettings from './pages/SuperAdminSettings.jsx';
import SetupSuperAdmin from './pages/SetupSuperAdmin.jsx';
import Settings from './pages/Settings.jsx';
import Data from './pages/Data.jsx';
import Goals from './pages/Goals.jsx';
import EcomLandingPage from './pages/LandingPage.jsx';
import EcomLayout from './components/EcomLayout.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Ecom UI error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-gray-900">Une erreur est survenue</h1>
            <p className="mt-2 text-sm text-gray-600">
              La page a rencontré un problème. Tu peux rafraîchir ou revenir au dashboard.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Rafraîchir
              </button>
              <a
                href="/ecom/dashboard"
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Composant de protection des routes
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isAuthenticated, loading } = useEcomAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/ecom/login" replace />;
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user?.role)) {
      // Rediriger vers le dashboard approprié selon le rôle
      const roleDashboardMap = {
        'super_admin': '/ecom/super-admin',
        'ecom_admin': '/ecom/dashboard/admin',
        'ecom_closeuse': '/ecom/dashboard/closeuse',
        'ecom_compta': '/ecom/dashboard/compta'
      };
      
      return <Navigate to={roleDashboardMap[user.role] || '/ecom/login'} replace />;
    }
  }

  return children;
};

// Composant pour rediriger automatiquement vers le bon dashboard
const DashboardRedirect = () => {
  const { user, isAuthenticated, loading } = useEcomAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/ecom/login" replace />;
  }

  // Rediriger vers le dashboard selon le rôle
  const roleDashboardMap = {
    'super_admin': '/ecom/super-admin',
    'ecom_admin': '/ecom/dashboard/admin',
    'ecom_closeuse': '/ecom/dashboard/closeuse',
    'ecom_compta': '/ecom/dashboard/compta'
  };
  
  const dashboardPath = roleDashboardMap[user?.role] || '/ecom/login';
  return <Navigate to={dashboardPath} replace />;
};

// Wrapper qui ajoute le layout aux routes protégées
const LayoutRoute = ({ children, requiredRole }) => {
  return (
    <ProtectedRoute requiredRole={requiredRole}>
      <EcomLayout>
        <ErrorBoundary>{children}</ErrorBoundary>
      </EcomLayout>
    </ProtectedRoute>
  );
};

const EcomApp = () => {
  return (
    <EcomAuthProvider>
      <CurrencyProvider>
        <div className="min-h-screen bg-gray-50">
          <ErrorBoundary>
            <Routes>
              {/* Route racine - landing page */}
              <Route path="/" element={<EcomLandingPage />} />
              
              {/* Routes publiques (sans layout) */}
              <Route path="landing" element={<EcomLandingPage />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="setup-admin" element={<SetupSuperAdmin />} />
              
              {/* Routes produits */}
              <Route path="products" element={<LayoutRoute requiredRole="ecom_admin"><ProductsList /></LayoutRoute>} />
              <Route path="products/new" element={<LayoutRoute requiredRole="ecom_admin"><ProductForm /></LayoutRoute>} />
              <Route path="products/:id" element={<LayoutRoute><ProductDetail /></LayoutRoute>} />
              <Route path="products/:id/edit" element={<LayoutRoute requiredRole="ecom_admin"><ProductForm /></LayoutRoute>} />
              
              {/* Routes rapports */}
              <Route path="reports" element={<LayoutRoute><ReportsListWithBoundary /></LayoutRoute>} />
              <Route path="reports/new" element={<LayoutRoute><ReportForm /></LayoutRoute>} />
              <Route path="reports/:id/edit" element={<LayoutRoute><ReportForm /></LayoutRoute>} />
              <Route path="reports/:id" element={<LayoutRoute><ReportDetail /></LayoutRoute>} />

              {/* Route profil */}
              <Route path="profile" element={<LayoutRoute><Profile /></LayoutRoute>} />

              {/* Route Data */}
              <Route path="data" element={<LayoutRoute><Data /></LayoutRoute>} />
              
              {/* Route Objectifs */}
              <Route path="goals" element={<LayoutRoute requiredRole={['ecom_admin', 'ecom_closeuse', 'ecom_compta']}><Goals /></LayoutRoute>} />
              
              {/* Routes stock */}
              <Route path="stock" element={<LayoutRoute requiredRole="ecom_admin"><StockOrdersList /></LayoutRoute>} />
              <Route path="stock/orders" element={<LayoutRoute requiredRole="ecom_admin"><StockOrdersList /></LayoutRoute>} />
              <Route path="stock/orders/new" element={<LayoutRoute requiredRole="ecom_admin"><StockOrderForm /></LayoutRoute>} />
              <Route path="stock/orders/:id/edit" element={<LayoutRoute requiredRole="ecom_admin"><StockOrderForm /></LayoutRoute>} />
              <Route path="stock-locations" element={<LayoutRoute requiredRole="ecom_admin"><StockManagement /></LayoutRoute>} />
              
              {/* Routes transactions (compta + admin) */}
              <Route path="transactions" element={<LayoutRoute><TransactionsList /></LayoutRoute>} />
              <Route path="transactions/new" element={<LayoutRoute><TransactionForm /></LayoutRoute>} />
              <Route path="transactions/:id" element={<LayoutRoute><TransactionDetail /></LayoutRoute>} />
              <Route path="transactions/:id/edit" element={<LayoutRoute><TransactionForm /></LayoutRoute>} />
              
              {/* Routes décisions */}
              <Route path="decisions" element={<LayoutRoute requiredRole="ecom_admin"><DecisionsList /></LayoutRoute>} />
              <Route path="decisions/new" element={<LayoutRoute requiredRole="ecom_admin"><DecisionForm /></LayoutRoute>} />
              
              {/* Routes clients (admin + closeuse) */}
              <Route path="clients" element={<LayoutRoute><ClientsList /></LayoutRoute>} />
              <Route path="clients/new" element={<LayoutRoute><ClientForm /></LayoutRoute>} />
              <Route path="clients/:id/edit" element={<LayoutRoute><ClientForm /></LayoutRoute>} />
              
              {/* Routes prospects */}
              <Route path="prospects" element={<LayoutRoute><ProspectsList /></LayoutRoute>} />
              
              {/* Routes commandes (admin + closeuse) */}
              <Route path="orders" element={<LayoutRoute><OrdersList /></LayoutRoute>} />
              <Route path="orders/:id" element={<LayoutRoute><OrderDetail /></LayoutRoute>} />
              
              {/* Routes campagnes marketing (admin) */}
              <Route path="campaigns" element={<LayoutRoute requiredRole="ecom_admin"><CampaignsList /></LayoutRoute>} />
              <Route path="campaigns/new" element={<LayoutRoute requiredRole="ecom_admin"><CampaignForm /></LayoutRoute>} />
              <Route path="campaigns/:id/edit" element={<LayoutRoute requiredRole="ecom_admin"><CampaignForm /></LayoutRoute>} />
              
              {/* Routes gestion utilisateurs (admin) */}
              <Route path="users" element={<LayoutRoute requiredRole="ecom_admin"><UserManagement /></LayoutRoute>} />
              
              {/* Route Paramètres */}
              <Route path="settings" element={<LayoutRoute><Settings /></LayoutRoute>} />
              
              {/* Routes Super Admin */}
              <Route path="super-admin" element={<LayoutRoute requiredRole="super_admin"><SuperAdminDashboard /></LayoutRoute>} />
              <Route path="super-admin/users" element={<LayoutRoute requiredRole="super_admin"><SuperAdminUsers /></LayoutRoute>} />
              <Route path="super-admin/workspaces" element={<LayoutRoute requiredRole="super_admin"><SuperAdminWorkspaces /></LayoutRoute>} />
              <Route path="super-admin/activity" element={<LayoutRoute requiredRole="super_admin"><SuperAdminActivity /></LayoutRoute>} />
              <Route path="super-admin/settings" element={<LayoutRoute requiredRole="super_admin"><SuperAdminSettings /></LayoutRoute>} />
              
              {/* Route de redirection automatique */}
              <Route path="dashboard" element={<DashboardRedirect />} />
              
              {/* Dashboards protégés par rôle */}
              <Route path="dashboard/admin" element={<LayoutRoute requiredRole="ecom_admin"><AdminDashboard /></LayoutRoute>} />
              <Route path="dashboard/closeuse" element={<LayoutRoute requiredRole="ecom_closeuse"><CloseuseDashboard /></LayoutRoute>} />
              <Route path="dashboard/compta" element={<LayoutRoute requiredRole="ecom_compta"><ComptaDashboard /></LayoutRoute>} />
              
              {/* Route catch-all */}
              <Route path="*" element={<Navigate to="/ecom/login" replace />} />
            </Routes>
          </ErrorBoundary>
        </div>
      </CurrencyProvider>
    </EcomAuthProvider>
  );
};

export default EcomApp;
