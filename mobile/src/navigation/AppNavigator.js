import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { useThemeSafe } from '../utils/useThemeSafe';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import CoursesScreen from '../screens/CoursesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoadingScreen from '../screens/LoadingScreen';
import EcomNavigator from './EcomNavigator';
import AdminNavigator from './AdminNavigator';
import CookpiAdminNavigator from './CookpiAdminNavigator';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
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
      }
    };
  }
  const { user } = useAuth();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Courses') {
            iconName = 'school';
          } else if (route.name === 'Ecom') {
            iconName = 'shopping-cart';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Accueil' }}
      />
      <Tab.Screen 
        name="Courses" 
        component={CoursesScreen} 
        options={{ title: 'Cours' }}
      />
      <Tab.Screen 
        name="Ecom" 
        component={EcomNavigator} 
        options={{ title: 'Boutique', headerShown: false }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Profil' }}
      />
    </Tab.Navigator>
  );
};

const AuthNavigator = () => {
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
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          {user?.role === 'admin' ? (
            <Stack.Screen name="Admin" component={AdminNavigator} />
          ) : user?.role === 'cookpi_admin' ? (
            <Stack.Screen name="CookpiAdmin" component={CookpiAdminNavigator} />
          ) : (
            <Stack.Screen name="Main" component={TabNavigator} />
          )}
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
