import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import MonitorScreen from './src/screens/MonitorScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  const [userId, setUserId] = React.useState(null);

  React.useEffect(() => {
    // Check if user is already logged in
    const checkLogin = async () => {
      const storedId = await AsyncStorage.getItem('@userId');
      if (storedId) setUserId(parseInt(storedId));
    };
    checkLogin();
  }, []);

  // Save session when userId changes
  React.useEffect(() => {
    if (userId) {
      AsyncStorage.setItem('@userId', userId.toString());
    } else {
      AsyncStorage.removeItem('@userId');
    }
  }, [userId]);

  const handleLogout = () => {
    setUserId(null); // Triggers re-render to Auth Stack
  };
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        {userId ? (
          // MAIN APP STACK
          <Tab.Navigator
            screenOptions={{
              tabBarActiveTintColor: '#0d6efd',
              tabBarInactiveTintColor: 'gray',
            }}
          >
            <Tab.Screen
              name="Monitor"
              options={{ title: 'CrashProof Monitor' }}
            >
              {props => <MonitorScreen {...props} userId={userId} onLogout={handleLogout} />}
            </Tab.Screen>
            <Tab.Screen
              name="History"
              options={{ title: 'Incident History' }}
            >
              {props => <HistoryScreen {...props} userId={userId} />}
            </Tab.Screen>
            <Tab.Screen
              name="Contacts"
              component={ContactsScreen}
              options={{ title: 'Emergency Contacts' }}
            />
          </Tab.Navigator>
        ) : (
          // AUTHENTICATION STACK
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login">
              {props => <LoginScreen {...props} setUserId={setUserId} />}
            </Stack.Screen>
            <Stack.Screen name="Register">
              {props => <RegisterScreen {...props} setUserId={setUserId} />}
            </Stack.Screen>
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
