import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { Loader } from '../components/UI';
import { colors } from '../theme';

import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ItemDetailsScreen } from '../screens/ItemDetailsScreen';
import { CreateItemScreen } from '../screens/CreateItemScreen';
import { MyListingsScreen } from '../screens/MyListingsScreen';
import { RequestsScreen } from '../screens/RequestsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AdminScreen } from '../screens/AdminScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
  },
};

const stackOptions = {
  headerStyle: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTintColor: colors.textPrimary,
  headerTitleStyle: { fontWeight: '700', fontSize: 17 },
  headerTitleAlign: 'center',
  headerBackTitle: 'Back',
  cardStyle: { backgroundColor: colors.background, flex: 1 },
};

const itemFormOptions = ({ route }) => ({ title: route.params?.item ? 'Edit Listing' : 'New Listing' });

const HomeStack = () => (
  <Stack.Navigator screenOptions={stackOptions}>
    <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ItemDetails" component={ItemDetailsScreen} options={{ title: 'Item Details' }} />
    <Stack.Screen name="CreateItem" component={CreateItemScreen} options={itemFormOptions} />
  </Stack.Navigator>
);

const ListingsStack = () => (
  <Stack.Navigator screenOptions={stackOptions}>
    <Stack.Screen name="MyListingsMain" component={MyListingsScreen} options={{ title: 'My Listings' }} />
    <Stack.Screen name="CreateItem" component={CreateItemScreen} options={itemFormOptions} />
    <Stack.Screen name="ItemDetails" component={ItemDetailsScreen} options={{ title: 'Item Details' }} />
  </Stack.Navigator>
);

const RequestsStack = () => (
  <Stack.Navigator screenOptions={stackOptions}>
    <Stack.Screen name="RequestsMain" component={RequestsScreen} options={{ title: 'Requests' }} />
    <Stack.Screen name="ItemDetails" component={ItemDetailsScreen} options={{ title: 'Item Details' }} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={stackOptions}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'Profile' }} />
    <Stack.Screen name="Admin" component={AdminScreen} options={{ title: 'Admin Panel' }} />
  </Stack.Navigator>
);

const TAB_ICONS = {
  Home: ['compass', 'compass-outline'],
  MyListings: ['cube', 'cube-outline'],
  Requests: ['swap-horizontal', 'swap-horizontal-outline'],
  Profile: ['person-circle', 'person-circle-outline'],
};

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        ...(Platform.OS === 'web' ? { height: 64, paddingBottom: 8, paddingTop: 6 } : {}),
      },
      tabBarIcon: ({ focused, color, size }) => {
        const [active, inactive] = TAB_ICONS[route.name] || ['ellipse', 'ellipse-outline'];
        return <Ionicons name={focused ? active : inactive} size={size ?? 24} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeStack} options={{ tabBarLabel: 'Explore' }} />
    <Tab.Screen name="MyListings" component={ListingsStack} options={{ tabBarLabel: 'My Items' }} />
    <Tab.Screen name="Requests" component={RequestsStack} options={{ tabBarLabel: 'Requests' }} />
    <Tab.Screen name="Profile" component={ProfileStack} options={{ tabBarLabel: 'Profile' }} />
  </Tab.Navigator>
);

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ ...stackOptions, headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

export const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <Loader label="Loading BorrowHub…" />;

  return (
    <NavigationContainer theme={navTheme} documentTitle={{ formatter: (o, r) => `BorrowHub${o?.title ? ` · ${o.title}` : ''}` }}>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};
