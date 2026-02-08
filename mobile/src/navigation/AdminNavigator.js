import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useThemeSafe } from '../utils/useThemeSafe';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminCoursesScreen from '../screens/admin/AdminCoursesScreen';
import AdminEcomScreen from '../screens/admin/AdminEcomScreen';
import AdminReportsScreen from '../screens/admin/AdminReportsScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

const AdminDrawerNavigator = () => {
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
          } else if (route.name === 'AdminUsers') {
            iconName = 'people';
          } else if (route.name === 'AdminCourses') {
            iconName = 'school';
          } else if (route.name === 'AdminEcom') {
            iconName = 'shopping-cart';
          } else if (route.name === 'AdminReports') {
            iconName = 'assessment';
          } else if (route.name === 'AdminSettings') {
            iconName = 'settings';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.textSecondary,
        drawerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: 'white',
      })}
    >
      <Drawer.Screen 
        name="AdminDashboard" 
        component={AdminDashboardScreen} 
        options={{ title: 'Tableau de bord' }}
      />
      <Drawer.Screen 
        name="AdminUsers" 
        component={AdminUsersScreen} 
        options={{ title: 'Utilisateurs' }}
      />
      <Drawer.Screen 
        name="AdminCourses" 
        component={AdminCoursesScreen} 
        options={{ title: 'Cours' }}
      />
      <Drawer.Screen 
        name="AdminEcom" 
        component={AdminEcomScreen} 
        options={{ title: 'E-commerce' }}
      />
      <Drawer.Screen 
        name="AdminReports" 
        component={AdminReportsScreen} 
        options={{ title: 'Rapports' }}
      />
      <Drawer.Screen 
        name="AdminSettings" 
        component={AdminSettingsScreen} 
        options={{ title: 'Paramètres' }}
      />
    </Drawer.Navigator>
  );
};

const AdminNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDrawer" component={AdminDrawerNavigator} />
    </Stack.Navigator>
  );
};

export default AdminNavigator;
