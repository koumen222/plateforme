import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useThemeSafe } from '../utils/useThemeSafe';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// Import des écrans admin cookpi
import AdminDashboardScreen from '../screens/ecom/AdminDashboardScreen';
import CampaignsListScreen from '../screens/ecom/CampaignsListScreen';
import CampaignFormScreen from '../screens/ecom/CampaignFormScreen';
import ClientsListScreen from '../screens/ecom/ClientsListScreen';
import ProductsManagementScreen from '../screens/ecom/ProductsManagementScreen';
import OrdersListScreen from '../screens/ecom/EcomOrdersScreen';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

const CookpiDrawerNavigator = () => {
  let theme;
  try {
    theme = useThemeSafe();
  } catch (error) {
    // Fallback theme if not within ThemeProvider
    theme = {
      colors: {
        primary: '#2563eb',
        textSecondary: '#6b7280',
        surface: '#f3f4f6',
        text: '#111827',
        background: '#ffffff',
      }
    };
  }

  return (
    <Drawer.Navigator
      screenOptions={({ route }) => ({
        drawerIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'AdminDashboard') {
            iconName = 'dashboard';
          } else if (route.name === 'Campaigns') {
            iconName = 'campaign';
          } else if (route.name === 'Clients') {
            iconName = 'people';
          } else if (route.name === 'Products') {
            iconName = 'inventory';
          } else if (route.name === 'Orders') {
            iconName = 'shopping-cart';
          } else if (route.name === 'Reports') {
            iconName = 'bar-chart';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.textSecondary,
        drawerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          color: theme.colors.text,
        },
      })}
    >
      <Drawer.Screen 
        name="AdminDashboard" 
        component={AdminDashboardScreen}
        options={{ title: 'Tableau de bord' }}
      />
      <Drawer.Screen 
        name="Campaigns" 
        component={CampaignsListScreen}
        options={{ title: 'Campagnes' }}
      />
      <Drawer.Screen 
        name="Clients" 
        component={ClientsListScreen}
        options={{ title: 'Clients' }}
      />
      <Drawer.Screen 
        name="Products" 
        component={ProductsManagementScreen}
        options={{ title: 'Produits' }}
      />
      <Drawer.Screen 
        name="Orders" 
        component={OrdersListScreen}
        options={{ title: 'Commandes' }}
      />
    </Drawer.Navigator>
  );
};

const CookpiAdminNavigator = () => {
  let theme;
  try {
    theme = useThemeSafe();
  } catch (error) {
    // Fallback theme if not within ThemeProvider
    theme = {
      colors: {
        surface: '#f3f4f6',
        text: '#111827',
      }
    };
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          color: theme.colors.text,
        },
      }}
    >
      <Stack.Screen 
        name="CookpiAdminDrawer" 
        component={CookpiDrawerNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CampaignForm" 
        component={CampaignFormScreen}
        options={{ title: 'Campagne' }}
      />
      <Stack.Screen 
        name="ClientForm" 
        component={() => {
          // Écran placeholder pour le formulaire client
          const React = require('react');
          const { View, Text } = require('react-native');
          const { useThemeSafe } = require('../utils/useThemeSafe');
          
          return function ClientFormPlaceholder() {
            const theme = useThemeSafe();
            return (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
                <Text style={{ color: theme.colors.text, fontSize: 18 }}>Formulaire client - À implémenter</Text>
              </View>
            );
          };
        }}
        options={{ title: 'Client' }}
      />
      <Stack.Screen 
        name="ProductForm" 
        component={() => {
          // Écran placeholder pour le formulaire produit
          const React = require('react');
          const { View, Text } = require('react-native');
          const { useThemeSafe } = require('../utils/useThemeSafe');
          
          return function ProductFormPlaceholder() {
            const theme = useThemeSafe();
            return (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
                <Text style={{ color: theme.colors.text, fontSize: 18 }}>Formulaire produit - À implémenter</Text>
              </View>
            );
          };
        }}
        options={{ title: 'Produit' }}
      />
      <Stack.Screen 
        name="OrderForm" 
        component={() => {
          // Écran placeholder pour le formulaire commande
          const React = require('react');
          const { View, Text } = require('react-native');
          const { useThemeSafe } = require('../utils/useThemeSafe');
          
          return function OrderFormPlaceholder() {
            const theme = useThemeSafe();
            return (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
                <Text style={{ color: theme.colors.text, fontSize: 18 }}>Formulaire commande - À implémenter</Text>
              </View>
            );
          };
        }}
        options={{ title: 'Commande' }}
      />
      <Stack.Screen 
        name="OrderDetail" 
        component={() => {
          // Écran placeholder pour le détail commande
          const React = require('react');
          const { View, Text } = require('react-native');
          const { useThemeSafe } = require('../utils/useThemeSafe');
          
          return function OrderDetailPlaceholder() {
            const theme = useThemeSafe();
            return (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
                <Text style={{ color: theme.colors.text, fontSize: 18 }}>Détail commande - À implémenter</Text>
              </View>
            );
          };
        }}
        options={{ title: 'Détail commande' }}
      />
      <Stack.Screen 
        name="ClientDetail" 
        component={() => {
          // Écran placeholder pour le détail client
          const React = require('react');
          const { View, Text } = require('react-native');
          const { useThemeSafe } = require('../utils/useThemeSafe');
          
          return function ClientDetailPlaceholder() {
            const theme = useThemeSafe();
            return (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
                <Text style={{ color: theme.colors.text, fontSize: 18 }}>Détail client - À implémenter</Text>
              </View>
            );
          };
        }}
        options={{ title: 'Détail client' }}
      />
      <Stack.Screen 
        name="CampaignDetail" 
        component={() => {
          // Écran placeholder pour le détail campagne
          const React = require('react');
          const { View, Text } = require('react-native');
          const { useThemeSafe } = require('../utils/useThemeSafe');
          
          return function CampaignDetailPlaceholder() {
            const theme = useThemeSafe();
            return (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
                <Text style={{ color: theme.colors.text, fontSize: 18 }}>Détail campagne - À implémenter</Text>
              </View>
            );
          };
        }}
        options={{ title: 'Détail campagne' }}
      />
    </Stack.Navigator>
  );
};

export default CookpiAdminNavigator;
