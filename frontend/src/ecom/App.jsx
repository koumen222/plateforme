import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { EcomAuthProvider, EcomAuthDebug } from './hooks/useEcomAuth.jsx';
import { useEcomAuth } from './hooks/useEcomAuth.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import CloseuseDashboard from './pages/CloseuseDashboard.jsx';
import ComptaDashboard from './pages/ComptaDashboard.jsx';
import ProductsList from './pages/ProductsList.jsx';
import ProductForm from './pages/ProductForm.jsx';
import ReportsList from './pages/ReportsList.jsx';
import ReportForm from './pages/ReportForm.jsx';
import ReportDetail from './pages/ReportDetail.jsx';
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
import EcomLandingPage from './pages/LandingPage.jsx';
import EcomLayout from './components/EcomLayout.jsx';

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

  if (requiredRole && user?.role !== requiredRole) {
    // Rediriger vers le dashboard approprié selon le rôle
    const roleDashboardMap = {
      'super_admin': '/ecom/super-admin',
      'ecom_admin': '/ecom/dashboard/admin',
      'ecom_closeuse': '/ecom/dashboard/closeuse',
      'ecom_compta': '/ecom/dashboard/compta'
    };
    
    return <Navigate to={roleDashboardMap[user.role] || '/ecom/login'} replace />;
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
        {children}
      </EcomLayout>
    </ProtectedRoute>
  );
};

const EcomApp = () => {
  return (
    <EcomAuthProvider>
      <div className="ecom-app">
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
          <Route path="reports" element={<LayoutRoute><ReportsList /></LayoutRoute>} />
          <Route path="reports/new" element={<LayoutRoute><ReportForm /></LayoutRoute>} />
          <Route path="reports/:id/edit" element={<LayoutRoute><ReportForm /></LayoutRoute>} />
          <Route path="reports/:id" element={<LayoutRoute><ReportDetail /></LayoutRoute>} />
          
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
      </div>
    </EcomAuthProvider>
  );
};

export default EcomApp;
