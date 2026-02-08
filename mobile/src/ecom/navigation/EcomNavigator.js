import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useEcomAuth, EcomAuthProvider } from '../hooks/useEcomAuth';
import { CurrencyProvider } from '../contexts/CurrencyContext';

// Pages
import LandingPage from '../pages/LandingPage';
import Login from '../pages/Login';
import Register from '../pages/Register';
import AdminDashboard from '../pages/AdminDashboard';
import CloseuseDashboard from '../pages/CloseuseDashboard';
import ComptaDashboard from '../pages/ComptaDashboard';
import OrdersList from '../pages/OrdersList';
import ProductsList from '../pages/ProductsList';
import ClientsList from '../pages/ClientsList';
import ReportsList from '../pages/ReportsList';
import TransactionsList from '../pages/TransactionsList';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';
import UserManagement from '../pages/UserManagement';
import ProductForm from '../pages/ProductForm';
import ReportForm from '../pages/ReportForm';
import TransactionForm from '../pages/TransactionForm';
import ClientForm from '../pages/ClientForm';
import OrderDetail from '../pages/OrderDetail';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Global App Header Component - Material Design 3 Style
const GlobalHeader = ({ navigation }) => {
  const { user } = useEcomAuth();
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.globalHeader, { paddingTop: insets.top + 8 }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1e40af" />
      <View style={styles.headerLeft}>
        <View style={styles.appLogo}>
          <MaterialIcons name="shopping-bag" size={22} color="#fff" />
        </View>
        <View>
          <Text style={styles.appName}>E-Com Manager</Text>
          <Text style={styles.appSubtitle}>Gestion des ventes</Text>
        </View>
      </View>
      
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => {}}>
          <MaterialIcons name="search" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => {}}>
          <View style={styles.notifBadge}>
            <MaterialIcons name="notifications" size={24} color="#fff" />
            <View style={styles.badgeDot} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.profileBtn} 
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.profileInitial}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Écran de chargement
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <View style={styles.loadingLogo}>
      <Text style={styles.loadingLogoText}>EC</Text>
    </View>
    <Text style={styles.loadingText}>Chargement...</Text>
  </View>
);

// Placeholder screens pour les fonctionnalités à venir
const PlaceholderScreen = ({ route }) => (
  <View style={styles.placeholderContainer}>
    <MaterialIcons name="construction" size={48} color="#9ca3af" />
    <Text style={styles.placeholderTitle}>{route.name}</Text>
    <Text style={styles.placeholderText}>Cette fonctionnalité arrive bientôt</Text>
  </View>
);

// Wrapper pour ajouter le header global à chaque écran
const withGlobalHeader = (Component) => {
  return (props) => (
    <View style={{ flex: 1 }}>
      <GlobalHeader navigation={props.navigation} />
      <Component {...props} />
    </View>
  );
};

// Wrapper pour ajouter le header global aux pages secondaires
const WithHeader = (Component) => {
  return function WrappedComponent(props) {
    return (
      <View style={{ flex: 1 }}>
        <GlobalHeader navigation={props.navigation} />
        <Component {...props} />
      </View>
    );
  };
};

// Stack Navigators pour chaque onglet principal (permet navigation vers formulaires)
const DashboardStack = createStackNavigator();
const OrdersStack = createStackNavigator();
const ProductsStack = createStackNavigator();
const ClientsStack = createStackNavigator();

const AdminDashboardStack = () => (
  <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
    <DashboardStack.Screen name="DashboardHome" component={AdminDashboard} />
    <DashboardStack.Screen name="ProductForm" component={WithHeader(ProductForm)} />
    <DashboardStack.Screen name="ReportForm" component={WithHeader(ReportForm)} />
    <DashboardStack.Screen name="OrderDetail" component={WithHeader(OrderDetail)} />
  </DashboardStack.Navigator>
);

const OrdersStackNavigator = () => (
  <OrdersStack.Navigator screenOptions={{ headerShown: false }}>
    <OrdersStack.Screen name="OrdersHome" component={OrdersList} />
    <OrdersStack.Screen name="OrderDetail" component={WithHeader(OrderDetail)} />
  </OrdersStack.Navigator>
);

const ProductsStackNavigator = () => (
  <ProductsStack.Navigator screenOptions={{ headerShown: false }}>
    <ProductsStack.Screen name="ProductsHome" component={ProductsList} />
    <ProductsStack.Screen name="ProductForm" component={WithHeader(ProductForm)} />
  </ProductsStack.Navigator>
);

const ClientsStackNavigator = () => (
  <ClientsStack.Navigator screenOptions={{ headerShown: false }}>
    <ClientsStack.Screen name="ClientsHome" component={ClientsList} />
    <ClientsStack.Screen name="ClientForm" component={WithHeader(ClientForm)} />
  </ClientsStack.Navigator>
);

// Tab Navigator pour Admin
const AdminTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarActiveTintColor: '#6366f1',
      tabBarInactiveTintColor: '#a1a1aa',
      tabBarLabelStyle: styles.tabBarLabel,
      tabBarIcon: ({ color, size }) => {
        let iconName;
        switch (route.name) {
          case 'Dashboard': iconName = 'dashboard'; break;
          case 'Orders': iconName = 'receipt-long'; break;
          case 'Products': iconName = 'inventory-2'; break;
          case 'Clients': iconName = 'people'; break;
          case 'More': iconName = 'more-horiz'; break;
          default: iconName = 'circle';
        }
        return <MaterialIcons name={iconName} size={22} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={AdminDashboardStack} options={{ tabBarLabel: 'Accueil' }} />
    <Tab.Screen name="Orders" component={OrdersStackNavigator} options={{ tabBarLabel: 'Commandes' }} />
    <Tab.Screen name="Products" component={ProductsStackNavigator} options={{ tabBarLabel: 'Produits' }} />
    <Tab.Screen name="Clients" component={ClientsStackNavigator} options={{ tabBarLabel: 'Clients' }} />
    <Tab.Screen name="More" component={MoreStackNavigator} options={{ tabBarLabel: 'Plus' }} />
  </Tab.Navigator>
);

// Tab Navigator pour Closeuse
const CloseuseTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarActiveTintColor: '#ec4899',
      tabBarInactiveTintColor: '#6b7280',
      tabBarLabelStyle: styles.tabBarLabel,
      tabBarIcon: ({ color }) => {
        let iconName;
        switch (route.name) {
          case 'Dashboard': iconName = 'dashboard'; break;
          case 'Orders': iconName = 'receipt-long'; break;
          case 'Clients': iconName = 'people'; break;
          case 'Reports': iconName = 'assessment'; break;
          default: iconName = 'circle';
        }
        return <MaterialIcons name={iconName} size={22} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={CloseuseDashboard} options={{ tabBarLabel: 'Accueil' }} />
    <Tab.Screen name="Orders" component={OrdersList} options={{ tabBarLabel: 'Commandes' }} />
    <Tab.Screen name="Clients" component={ClientsList} options={{ tabBarLabel: 'Clients' }} />
    <Tab.Screen name="Reports" component={ReportsList} options={{ tabBarLabel: 'Rapports' }} />
  </Tab.Navigator>
);

// Tab Navigator pour Compta
const ComptaTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarActiveTintColor: '#10b981',
      tabBarInactiveTintColor: '#6b7280',
      tabBarLabelStyle: styles.tabBarLabel,
      tabBarIcon: ({ color }) => {
        let iconName;
        switch (route.name) {
          case 'Dashboard': iconName = 'dashboard'; break;
          case 'Transactions': iconName = 'account-balance-wallet'; break;
          case 'Reports': iconName = 'assessment'; break;
          case 'Data': iconName = 'analytics'; break;
          default: iconName = 'circle';
        }
        return <MaterialIcons name={iconName} size={22} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={ComptaDashboard} options={{ tabBarLabel: 'Accueil' }} />
    <Tab.Screen name="Transactions" component={TransactionsList} options={{ tabBarLabel: 'Transactions' }} />
    <Tab.Screen name="Reports" component={ReportsList} options={{ tabBarLabel: 'Rapports' }} />
    <Tab.Screen name="Data" component={PlaceholderScreen} options={{ tabBarLabel: 'Data' }} />
  </Tab.Navigator>
);

// Écran "Plus" pour Admin (défini avant MoreStackNavigator)
const MoreScreen = ({ navigation }) => {
  const { user, logout } = useEcomAuth();

  const menuItems = [
    { icon: 'assessment', label: 'Rapports', screen: 'Reports', color: '#f59e0b' },
    { icon: 'account-balance-wallet', label: 'Transactions', screen: 'Transactions', color: '#10b981' },
    { icon: 'inventory', label: 'Stock', screen: 'Stock', color: '#8b5cf6' },
    { icon: 'campaign', label: 'Marketing', screen: 'Campaigns', color: '#ec4899' },
    { icon: 'group', label: 'Équipe', screen: 'Users', color: '#3b82f6' },
    { icon: 'settings', label: 'Paramètres', screen: 'Settings', color: '#6b7280' },
    { icon: 'person', label: 'Mon Profil', screen: 'Profile', color: '#8b5cf6' },
  ];

  return (
    <View style={styles.moreContainer}>
      {/* Header */}
      <GlobalHeader navigation={navigation} />
      
      <View style={styles.moreContent}>
        <Text style={styles.moreTitle}>Plus d'options</Text>
        
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.moreItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <View style={[styles.moreItemIcon, { backgroundColor: item.color + '15' }]}>
              <MaterialIcons name={item.icon} size={22} color={item.color} />
            </View>
            <Text style={styles.moreItemLabel}>{item.label}</Text>
            <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <MaterialIcons name="logout" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Stack Navigator pour l'onglet "Plus" avec toutes les pages secondaires
const MoreStack = createStackNavigator();

const MoreStackNavigator = () => (
  <MoreStack.Navigator screenOptions={{ headerShown: false }}>
    <MoreStack.Screen name="MoreHome" component={MoreScreen} />
    <MoreStack.Screen name="Reports" component={WithHeader(ReportsList)} />
    <MoreStack.Screen name="ReportForm" component={WithHeader(ReportForm)} />
    <MoreStack.Screen name="Transactions" component={WithHeader(TransactionsList)} />
    <MoreStack.Screen name="TransactionForm" component={WithHeader(TransactionForm)} />
    <MoreStack.Screen name="Stock" component={WithHeader(PlaceholderScreen)} />
    <MoreStack.Screen name="Campaigns" component={WithHeader(PlaceholderScreen)} />
    <MoreStack.Screen name="Users" component={WithHeader(UserManagement)} />
    <MoreStack.Screen name="Settings" component={WithHeader(Settings)} />
    <MoreStack.Screen name="Profile" component={WithHeader(Profile)} />
  </MoreStack.Navigator>
);

// Composant principal avec logique d'authentification
const EcomNavigatorContent = () => {
  const { isAuthenticated, loading, user } = useEcomAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // Déterminer quel dashboard afficher selon le rôle
  const getDashboardComponent = () => {
    switch (user?.role) {
      case 'ecom_admin':
      case 'super_admin':
        return AdminTabNavigator;
      case 'ecom_closeuse':
        return CloseuseTabNavigator;
      case 'ecom_compta':
        return ComptaTabNavigator;
      default:
        return AdminTabNavigator;
    }
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // Routes publiques
        <>
          <Stack.Screen name="Landing" component={LandingPage} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />
        </>
      ) : (
        // Routes protégées - toutes les pages sont dans les Tab Navigators
        <Stack.Screen name="Main" component={getDashboardComponent()} />
      )}
    </Stack.Navigator>
  );
};

// Export principal avec providers
const EcomNavigator = () => {
  return (
    <EcomAuthProvider>
      <CurrencyProvider>
        <EcomNavigatorContent />
      </CurrencyProvider>
    </EcomAuthProvider>
  );
};

const styles = StyleSheet.create({
  // Global Header
  globalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e40af',
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appLogo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  appSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerIconBtn: {
    padding: 10,
    borderRadius: 20,
  },
  notifBadge: {
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: '#1e40af',
  },
  profileBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  profileInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#030712',
  },
  loadingLogo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingLogoText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  placeholderText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 0,
    height: 80,
    paddingBottom: 8,
    paddingTop: 12,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 0,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  moreContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  moreContent: {
    flex: 1,
    padding: 16,
  },
  moreTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
    marginTop: 8,
  },
  moreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  moreItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreItemLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginLeft: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
  },
});

export default EcomNavigator;
