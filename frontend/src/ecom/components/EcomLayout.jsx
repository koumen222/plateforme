import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEcomAuth } from '../hooks/useEcomAuth';
import CurrencySelector from './CurrencySelector.jsx';

const EcomLayout = ({ children }) => {
  const { user, workspace, logout } = useEcomAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/ecom/login');
  };

  const roleDashboardMap = {
    'super_admin': '/ecom/super-admin',
    'ecom_admin': '/ecom/dashboard/admin',
    'ecom_closeuse': '/ecom/dashboard/closeuse',
    'ecom_compta': '/ecom/dashboard/compta',
    'ecom_livreur': '/ecom/orders'
  };

  const dashboardPath = roleDashboardMap[user?.role] || '/ecom/dashboard';

  const roleLabel = {
    'super_admin': 'Super Admin',
    'ecom_admin': 'Admin',
    'ecom_closeuse': 'Closeuse',
    'ecom_compta': 'Comptabilité',
    'ecom_livreur': 'Livreur'
  };

  const navigation = [
    {
      name: 'Accueil',
      shortName: 'Accueil',
      href: dashboardPath,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      roles: ['ecom_admin', 'ecom_closeuse', 'ecom_compta', 'ecom_livreur'],
      primary: true
    },
    {
      name: 'Produits',
      shortName: 'Produits',
      href: '/ecom/products',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      roles: ['ecom_admin'],
      primary: true
    },
    {
      name: 'Rapports',
      shortName: 'Rapports',
      href: '/ecom/reports',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      roles: ['ecom_admin', 'ecom_closeuse', 'ecom_compta'],
      primary: true
    },
    {
      name: 'Stock',
      shortName: 'Stock',
      href: '/ecom/stock/orders',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
      roles: ['ecom_admin'],
      primary: false
    },
    {
      name: 'Gestion Stock',
      shortName: 'G.Stock',
      href: '/ecom/stock-locations',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      roles: ['ecom_admin'],
      primary: false
    },
    {
      name: 'Transactions',
      shortName: 'Compta',
      href: '/ecom/transactions',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      roles: ['ecom_admin', 'ecom_compta'],
      primary: true
    },
    {
      name: 'Clients',
      shortName: 'Clients',
      href: '/ecom/clients',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      roles: ['ecom_admin', 'ecom_closeuse'],
      primary: true
    },
    {
      name: 'Prospects',
      shortName: 'Prospects',
      href: '/ecom/prospects',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      roles: ['ecom_admin', 'ecom_closeuse'],
      primary: false
    },
    {
      name: 'Commandes',
      shortName: 'Cmd',
      href: '/ecom/orders',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      roles: ['ecom_admin', 'ecom_closeuse', 'ecom_livreur'],
      primary: true
    },
    {
      name: 'Marketing',
      shortName: 'Marketing',
      href: '/ecom/campaigns',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
      roles: ['ecom_admin'],
      primary: true
    },
    {
      name: 'Décisions',
      shortName: 'Décisions',
      href: '/ecom/decisions',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      roles: ['ecom_admin'],
      primary: false
    },
    {
      name: 'Équipe',
      shortName: 'Équipe',
      href: '/ecom/users',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      roles: ['ecom_admin'],
      primary: false
    },
    {
      name: 'Dashboard',
      shortName: 'Accueil',
      href: '/ecom/super-admin',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      roles: ['super_admin'],
      primary: true
    },
    {
      name: 'Utilisateurs',
      shortName: 'Users',
      href: '/ecom/super-admin/users',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      roles: ['super_admin'],
      primary: true
    },
    {
      name: 'Espaces',
      shortName: 'Espaces',
      href: '/ecom/super-admin/workspaces',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      roles: ['super_admin'],
      primary: true
    },
    {
      name: 'Activité',
      shortName: 'Activité',
      href: '/ecom/super-admin/activity',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      roles: ['super_admin'],
      primary: false
    },
    {
      name: 'Paramètres',
      shortName: 'Config',
      href: '/ecom/super-admin/settings',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      roles: ['super_admin'],
      primary: false
    }
  ];

  const filteredNav = navigation.filter(item => item.roles.includes(user?.role));
  // Mobile: show primary tabs + "Plus" if there are secondary items
  const mobileMainTabs = filteredNav.filter(item => item.primary).slice(0, 4);
  const mobileSecondaryTabs = filteredNav.filter(item => !mobileMainTabs.includes(item));
  const showMoreTab = mobileSecondaryTabs.length > 0;

  const isActive = (href) => {
    if (href === dashboardPath) {
      return location.pathname.includes('/dashboard');
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Desktop Sidebar - hidden on mobile */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-gray-900 z-30">
        <div className="flex flex-col h-full">
          <div className="flex items-center h-16 px-6 bg-gray-800">
            <Link to={dashboardPath} className="flex items-center space-x-3">
              <img src="/img/ecom-logo.png" alt="Ecom Cockpit" className="h-12" />
            </Link>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {filteredNav.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span className={active ? 'text-white' : 'text-gray-400'}>{item.icon}</span>
                  <span className="ml-3">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-gray-700 p-4">
            {workspace?.name && (
              <div className="mb-3 px-3 py-2 bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Espace</p>
                <p className="text-sm font-medium text-white truncate">{workspace.name}</p>
                {user?.role === 'ecom_admin' && workspace?.inviteCode && (
                  <div className="mt-1 flex items-center gap-1">
                    <p className="text-[10px] text-gray-500">Code: <span className="font-mono text-gray-300">{workspace.inviteCode}</span></p>
                    <button
                      onClick={() => { navigator.clipboard.writeText(workspace.inviteCode); }}
                      className="text-gray-500 hover:text-blue-400 transition"
                      title="Copier le code"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center">
              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                <p className="text-xs text-gray-400">{roleLabel[user?.role] || user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 w-full flex items-center px-3 py-2 text-sm text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="ml-3">Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b h-14 lg:h-16 flex items-center px-3 lg:px-8 sticky top-0 z-10">
          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center lg:hidden">
                <span className="text-white font-bold text-xs">EC</span>
              </div>
              <div className="flex flex-col">
                <h2 className="text-base lg:text-lg font-semibold text-gray-800 truncate leading-tight">
                  {getPageTitle(location.pathname)}
                </h2>
                {workspace?.name && (
                  <span className="text-[10px] text-gray-400 truncate max-w-[150px] lg:max-w-[200px]">{workspace.name}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CurrencySelector compact />
              <span className="hidden sm:inline text-sm text-gray-500 truncate max-w-[120px] lg:max-w-none">{user?.email}</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full whitespace-nowrap">
                {roleLabel[user?.role] || user?.role}
              </span>
              {/* Mobile logout button */}
              <button
                onClick={handleLogout}
                className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 transition-colors"
                title="Déconnexion"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Page content - padding bottom for mobile bottom nav */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-1">
          {mobileMainTabs.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMoreMenuOpen(false)}
                className={`flex flex-col items-center justify-center flex-1 h-full pt-1 transition-colors ${
                  active
                    ? 'text-blue-600'
                    : 'text-gray-400 active:text-gray-600'
                }`}
              >
                <span className={active ? 'text-blue-600' : 'text-gray-400'}>{item.icon}</span>
                <span className={`text-[10px] mt-0.5 font-medium ${active ? 'text-blue-600' : 'text-gray-400'}`}>
                  {item.shortName}
                </span>
                {active && <span className="w-1 h-1 bg-blue-600 rounded-full mt-0.5"></span>}
              </Link>
            );
          })}

          {/* More tab */}
          {showMoreTab && (
            <div className="relative flex-1">
              <button
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className={`flex flex-col items-center justify-center w-full h-16 pt-1 transition-colors ${
                  moreMenuOpen ? 'text-blue-600' : 'text-gray-400 active:text-gray-600'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
                <span className="text-[10px] mt-0.5 font-medium">Plus</span>
              </button>

              {/* More menu popup */}
              {moreMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMoreMenuOpen(false)} />
                  <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-40">
                    {mobileSecondaryTabs.map((item) => {
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setMoreMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                            active
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span className={active ? 'text-blue-600' : 'text-gray-400'}>{item.icon}</span>
                          {item.name}
                        </Link>
                      );
                    })}
                    <button
                      onClick={() => { setMoreMenuOpen(false); handleLogout(); }}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 w-full border-t border-gray-100"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Déconnexion
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};

const getPageTitle = (pathname) => {
  if (pathname.includes('/dashboard')) return 'Dashboard';
  if (pathname.includes('/products/new')) return 'Nouveau produit';
  if (pathname.includes('/products') && pathname.includes('/edit')) return 'Modifier le produit';
  if (pathname.match(/\/products\/[a-f0-9]+$/)) return 'Détail du produit';
  if (pathname.includes('/products')) return 'Produits';
  if (pathname.includes('/reports/new')) return 'Nouveau rapport';
  if (pathname.includes('/reports') && pathname.includes('/edit')) return 'Modifier le rapport';
  if (pathname.includes('/reports/')) return 'Détail du rapport';
  if (pathname.includes('/reports')) return 'Rapports';
  if (pathname.includes('/stock/orders/new')) return 'Nouvelle commande';
  if (pathname.includes('/stock/orders') && pathname.includes('/edit')) return 'Modifier commande';
  if (pathname.includes('/stock-locations')) return 'Gestion Stock';
  if (pathname.includes('/stock')) return 'Stock';
  if (pathname.includes('/transactions/new')) return 'Nouvelle transaction';
  if (pathname.includes('/transactions') && pathname.includes('/edit')) return 'Modifier transaction';
  if (pathname.match(/\/transactions\/[a-f0-9]+$/)) return 'Détail transaction';
  if (pathname.includes('/transactions')) return 'Transactions';
  if (pathname.includes('/decisions/new')) return 'Nouvelle décision';
  if (pathname.includes('/decisions')) return 'Décisions';
  if (pathname.match(/\/orders\/[a-f0-9]{24}/)) return 'Détail commande';
  if (pathname.includes('/orders')) return 'Commandes';
  if (pathname.includes('/clients/new')) return 'Nouveau client';
  if (pathname.includes('/clients') && pathname.includes('/edit')) return 'Modifier client';
  if (pathname.includes('/clients')) return 'Clients';
  if (pathname.includes('/super-admin/users')) return 'Gestion des utilisateurs';
  if (pathname.includes('/super-admin/workspaces')) return 'Gestion des espaces';
  if (pathname.includes('/super-admin/activity')) return 'Activité';
  if (pathname.includes('/super-admin/settings')) return 'Paramètres';
  if (pathname.includes('/super-admin')) return 'Super Administration';
  if (pathname.includes('/users')) return 'Gestion Équipe';
  return 'Ecom Cockpit';
};

export default EcomLayout;
