import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { useEcomAuth } from '../../contexts/EcomAuthContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import CurrencySelector from './CurrencySelector';

const EcomLayout = ({ children }) => {
  const { user, workspace, logout } = useEcomAuth();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se déconnecter', onPress: () => logout() }
      ]
    );
  };

  const roleDashboardMap = {
    'super_admin': 'SuperAdmin',
    'ecom_admin': 'AdminDashboard',
    'ecom_closeuse': 'CloseuseDashboard',
    'ecom_compta': 'ComptaDashboard',
    'ecom_livreur': 'OrdersList'
  };

  const roleLabel = {
    'super_admin': 'Super Admin',
    'ecom_admin': 'Admin',
    'ecom_closeuse': 'Closeuse',
    'ecom_compta': 'Comptabilité',
    'ecom_livreur': 'Livreur'
  };

  const roleColors = {
    'super_admin': '#8b5cf6', // purple-500
    'ecom_admin': '#2563eb', // blue-600
    'ecom_closeuse': '#ec4899', // pink-500
    'ecom_compta': '#10b981', // emerald-500
    'ecom_livreur': '#f97316' // orange-500
  };

  // Navigation items - exactement comme dans le web
  const mainNav = [
    {
      name: 'Accueil',
      shortName: 'Accueil',
      screen: roleDashboardMap[user?.role] || 'AdminDashboard',
      primary: true,
      roles: ['ecom_admin', 'ecom_closeuse', 'ecom_compta', 'ecom_livreur'],
      icon: 'home'
    },
    {
      name: 'Commandes',
      shortName: 'Cmd',
      screen: 'OrdersList',
      primary: true,
      roles: ['ecom_admin', 'ecom_closeuse', 'ecom_livreur'],
      icon: 'shopping-cart'
    },
    {
      name: 'Produits',
      shortName: 'Produits',
      screen: 'ProductsList',
      primary: true,
      roles: ['ecom_admin'],
      icon: 'inventory-2'
    },
    {
      name: 'Clients',
      shortName: 'Clients',
      screen: 'ClientsList',
      primary: true,
      roles: ['ecom_admin', 'ecom_closeuse'],
      icon: 'people'
    },
    {
      name: 'Rapports',
      shortName: 'Rapports',
      screen: 'ReportsList',
      primary: true,
      roles: ['ecom_admin', 'ecom_closeuse', 'ecom_compta'],
      icon: 'bar-chart'
    },
    {
      name: 'Data',
      shortName: 'Data',
      screen: 'Data',
      primary: false,
      roles: ['ecom_admin', 'ecom_compta', 'super_admin'],
      icon: 'table-chart'
    },
    {
      name: 'Transactions',
      shortName: 'Compta',
      screen: 'TransactionsList',
      primary: true,
      roles: ['ecom_admin', 'ecom_compta'],
      icon: 'account-balance-wallet'
    },
  ];

  const secondaryNav = [
    {
      name: 'Marketing',
      shortName: 'Marketing',
      screen: 'CampaignsList',
      primary: false,
      roles: ['ecom_admin'],
      icon: 'campaign'
    },
    {
      name: 'Stock',
      shortName: 'Stock',
      screen: 'StockOrdersList',
      primary: false,
      roles: ['ecom_admin'],
      icon: 'warehouse'
    },
    {
      name: 'Décisions',
      shortName: 'Décisions',
      screen: 'DecisionsList',
      primary: false,
      roles: ['ecom_admin'],
      icon: 'lightbulb'
    },
    {
      name: 'Utilisateurs',
      shortName: 'Users',
      screen: 'UserManagement',
      primary: false,
      roles: ['ecom_admin'],
      icon: 'manage-accounts'
    },
    {
      name: 'Paramètres',
      shortName: 'Params',
      screen: 'Settings',
      primary: false,
      roles: ['ecom_admin', 'ecom_closeuse', 'ecom_compta', 'ecom_livreur'],
      icon: 'settings'
    },
  ];

  // Filtrer les éléments de navigation selon le rôle
  const filteredMainNav = mainNav.filter(item => item.roles.includes(user?.role));
  const filteredSecondaryNav = secondaryNav.filter(item => item.roles.includes(user?.role));

  const renderNavIcon = (iconName, isActive) => (
    <MaterialIcons 
      name={iconName} 
      size={20} 
      color={isActive ? '#ffffff' : '#9ca3af'} 
    />
  );

  const renderNavItem = (item, isSecondary = false) => {
    const isActive = activeTab === item.name;
    return (
      <TouchableOpacity
        key={item.name}
        style={[
          styles.navItem,
          isActive && styles.navItemActive,
          isSecondary && styles.navItemSecondary
        ]}
        onPress={() => setActiveTab(item.name)}
      >
        {renderNavIcon(item.icon, isActive)}
        <Text style={[
          styles.navItemText,
          isActive && styles.navItemTextActive,
          isSecondary && styles.navItemTextSecondary
        ]}>
          {item.shortName}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image 
            source={require('../../../assets/ecom-logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.workspaceInfo}>
            <Text style={styles.workspaceName}>
              {workspace?.name || 'Ecom Cockpit'}
            </Text>
            <Text style={styles.userRole}>
              {roleLabel[user?.role] || 'Utilisateur'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <CurrencySelector />
          
          <TouchableOpacity
            style={styles.userButton}
            onPress={() => setUserMenuOpen(!userMenuOpen)}
          >
            <View style={[styles.userAvatar, { backgroundColor: roleColors[user?.role] }]}>
              <Text style={styles.userAvatarText}>
                {user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.navScroll}>
          <View style={styles.navContainer}>
            {filteredMainNav.slice(0, 4).map(item => renderNavItem(item))}
          </View>
        </ScrollView>

        {/* More button */}
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => setMoreMenuOpen(!moreMenuOpen)}
        >
          <MaterialIcons 
            name="more-horiz" 
            size={24} 
            color="#9ca3af" 
          />
        </TouchableOpacity>
      </View>

      {/* More Menu Modal */}
      {moreMenuOpen && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setMoreMenuOpen(false)}
          />
          <View style={styles.moreMenu}>
            <Text style={styles.moreMenuTitle}>Plus d'options</Text>
            
            <View style={styles.moreMenuSection}>
              <Text style={styles.moreMenuSectionTitle}>Navigation</Text>
              {filteredMainNav.slice(4).map(item => renderNavItem(item, true))}
            </View>

            <View style={styles.moreMenuSection}>
              <Text style={styles.moreMenuSectionTitle}>Outils</Text>
              {filteredSecondaryNav.map(item => renderNavItem(item, true))}
            </View>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <MaterialIcons name="logout" size={20} color="#ef4444" />
              <Text style={styles.logoutButtonText}>Déconnexion</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* User Menu Modal */}
      {userMenuOpen && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setUserMenuOpen(false)}
          />
          <View style={styles.userMenu}>
            <View style={styles.userMenuHeader}>
              <View style={[styles.userAvatarLarge, { backgroundColor: roleColors[user?.role] }]}>
                <Text style={styles.userAvatarLargeText}>
                  {user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user?.email}</Text>
                <Text style={styles.userRoleText}>{roleLabel[user?.role]}</Text>
                {workspace && (
                  <Text style={styles.workspaceText}>{workspace.name}</Text>
                )}
              </View>
            </View>

            <View style={styles.userMenuSection}>
              <TouchableOpacity style={styles.userMenuItem}>
                <MaterialIcons name="person" size={20} color="#6b7280" />
                <Text style={styles.userMenuItemText}>Profil</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.userMenuItem}>
                <MaterialIcons name="settings" size={20} color="#6b7280" />
                <Text style={styles.userMenuItemText}>Paramètres</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <MaterialIcons name="logout" size={20} color="#ef4444" />
              <Text style={styles.logoutButtonText}>Déconnexion</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb', // gray-50
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  workspaceInfo: {
    flex: 1,
  },
  workspaceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  userRole: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userButton: {
    padding: 4,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  navScroll: {
    flex: 1,
  },
  navContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  navItem: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 60,
  },
  navItemActive: {
    backgroundColor: '#3b82f6',
  },
  navItemSecondary: {
    backgroundColor: '#f3f4f6',
  },
  navItemText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  navItemTextActive: {
    color: '#ffffff',
  },
  navItemTextSecondary: {
    color: '#4b5563',
  },
  moreButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  moreMenu: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  moreMenuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  moreMenuSection: {
    marginBottom: 20,
  },
  moreMenuSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userMenu: {
    position: 'absolute',
    top: 80,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  userMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  userAvatarLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarLargeText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  userRoleText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  workspaceText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  userMenuSection: {
    marginBottom: 16,
  },
  userMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  userMenuItemText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  logoutButtonText: {
    fontSize: 14,
    color: '#ef4444',
    marginLeft: 12,
    fontWeight: '500',
  },
});

export default EcomLayout;
