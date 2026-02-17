import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useThemeSafe } from '../utils/useThemeSafe';
import CookpiLandingScreen from '../screens/ecom/CookpiLandingScreen';
import EcomLoginScreen from '../screens/ecom/EcomLoginScreen';
import EcomRegisterScreen from '../screens/ecom/EcomRegisterScreen';
import EcomHomeScreen from '../screens/ecom/EcomHomeScreen';
import AdminDashboard from '../screens/ecom/AdminDashboard';
import CloseuseDashboard from '../screens/ecom/CloseuseDashboard';
import ComptaDashboard from '../screens/ecom/ComptaDashboard';
import ProductsList from '../screens/ecom/ProductsList.jsx';
import ProductForm from '../screens/ecom/ProductForm.jsx';
import ProductDetail from '../screens/ecom/EcomProductDetailScreen';
import ReportsList from '../screens/ecom/ReportsList.jsx';
import ReportForm from '../screens/ecom/ReportForm.jsx';
import ReportDetail from '../screens/ecom/ReportDetail.jsx';
import StockOrdersList from '../screens/ecom/StockOrdersList.jsx';
import StockOrderForm from '../screens/ecom/StockOrderForm.jsx';
import StockManagement from '../screens/ecom/StockManagement.jsx';
import DecisionsList from '../screens/ecom/DecisionsList.jsx';
import DecisionForm from '../screens/ecom/DecisionForm.jsx';
import TransactionsList from '../screens/ecom/TransactionsList.jsx';
import TransactionForm from '../screens/ecom/TransactionForm.jsx';
import TransactionDetail from '../screens/ecom/TransactionDetail.jsx';
import UserManagement from '../screens/ecom/UserManagement.jsx';
import ClientsList from '../screens/ecom/ClientsList.jsx';
import ClientForm from '../screens/ecom/ClientForm.jsx';
import ProspectsList from '../screens/ecom/ProspectsList.jsx';
import OrdersList from '../screens/ecom/OrdersList.jsx';
import OrderDetail from '../screens/ecom/OrderDetail.jsx';
import CampaignsList from '../screens/ecom/CampaignsList.jsx';
import CampaignForm from '../screens/ecom/CampaignForm.jsx';
import Settings from '../screens/ecom/Settings.jsx';
import Data from '../screens/ecom/Data.jsx';
import EcomLayout from '../screens/ecom/EcomLayout.jsx';

const Stack = createStackNavigator();

const EcomNavigator = () => {
  const theme = useThemeSafe();

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
      {/* Public routes */}
      <Stack.Screen 
        name="CookpiLanding" 
        component={CookpiLandingScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="EcomLogin" 
        component={EcomLoginScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="EcomRegister" 
        component={EcomRegisterScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="EcomHome" 
        component={EcomHomeScreen} 
        options={{ headerShown: false }}
      />

      {/* Protected routes with layout */}
      <Stack.Screen 
        name="AdminDashboard" 
        component={AdminDashboard} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CloseuseDashboard" 
        component={CloseuseDashboard} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ComptaDashboard" 
        component={ComptaDashboard} 
        options={{ headerShown: false }}
      />

      {/* Products */}
      <Stack.Screen 
        name="ProductsList" 
        component={ProductsList} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ProductForm" 
        component={ProductForm} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ProductDetail" 
        component={ProductDetail} 
        options={{ headerShown: false }}
      />

      {/* Reports */}
      <Stack.Screen 
        name="ReportsList" 
        component={ReportsList} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ReportForm" 
        component={ReportForm} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ReportDetail" 
        component={ReportDetail} 
        options={{ headerShown: false }}
      />

      {/* Stock */}
      <Stack.Screen 
        name="StockOrdersList" 
        component={StockOrdersList} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="StockOrderForm" 
        component={StockOrderForm} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="StockManagement" 
        component={StockManagement} 
        options={{ headerShown: false }}
      />

      {/* Decisions */}
      <Stack.Screen 
        name="DecisionsList" 
        component={DecisionsList} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="DecisionForm" 
        component={DecisionForm} 
        options={{ headerShown: false }}
      />

      {/* Transactions */}
      <Stack.Screen 
        name="TransactionsList" 
        component={TransactionsList} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="TransactionForm" 
        component={TransactionForm} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="TransactionDetail" 
        component={TransactionDetail} 
        options={{ headerShown: false }}
      />

      {/* Users & Clients */}
      <Stack.Screen 
        name="UserManagement" 
        component={UserManagement} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ClientsList" 
        component={ClientsList} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ClientForm" 
        component={ClientForm} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ProspectsList" 
        component={ProspectsList} 
        options={{ headerShown: false }}
      />

      {/* Orders */}
      <Stack.Screen 
        name="OrdersList" 
        component={OrdersList} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="OrderDetail" 
        component={OrderDetail} 
        options={{ headerShown: false }}
      />

      {/* Campaigns */}
      <Stack.Screen 
        name="CampaignsList" 
        component={CampaignsList} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CampaignForm" 
        component={CampaignForm} 
        options={{ headerShown: false }}
      />

      {/* Settings & Data */}
      <Stack.Screen 
        name="Settings" 
        component={Settings} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Data" 
        component={Data} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default EcomNavigator;
