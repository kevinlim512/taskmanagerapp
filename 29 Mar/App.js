import React, { useEffect } from 'react';
import { StyleSheet, StatusBar, ImageBackground, Alert } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import PartyScreen from './screens/PartyScreen';
import TasksScreen from './screens/TasksScreen';
import GuestListScreen from './screens/GuestListScreen';
import CalendarMainScreen from './screens/CalendarMainScreen';
import ShoppingListEditScreen from './screens/Tasks/ShoppingListEditScreen';
import EditTaskScreen from './screens/Tasks/EditTaskScreen';
import NotesScreen from './screens/NotesScreen';
import EditNoteScreen from './screens/Notes/EditNoteScreen';

import InvitationSendFlow from './screens/GuestList/InvitationSendFlow';

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
  },
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TasksStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: 'transparent' },
        headerStyle: { backgroundColor: 'transparent' },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen
        name="TasksMain"
        component={TasksScreen}
        options={{ title: 'Tasks' }}
      />
      <Stack.Screen
        name="ShoppingListEditScreen"
        component={ShoppingListEditScreen}
        options={{ title: 'Edit Item' }}
      />
      <Stack.Screen
        name="EditTask"
        component={EditTaskScreen}
        options={{ title: 'Edit Task' }}
      />
    </Stack.Navigator>
  );
}

function NotesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: '#fff' },
        headerStyle: { backgroundColor: 'transparent' },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen
        name="NotesMain"
        component={NotesScreen}
        options={{ title: 'Notes' }}
      />
      <Stack.Screen
        name="EditNote"
        component={EditNoteScreen}
        options={{ title: 'Edit Note' }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      sceneContainerStyle={{ backgroundColor: 'transparent' }}
      screenOptions={({ route }) => ({
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#ccc',
        tabBarStyle: { backgroundColor: '#0d1652' },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Party') {
            return <Feather name="gift" size={size} color={color} />;
          } else if (route.name === 'Tasks') {
            return <Feather name="check-circle" size={size} color={color} />;
          } else if (route.name === 'Guests') {
            return <Feather name="users" size={size} color={color} />;
          } else if (route.name === 'Calendar') {
            return <Feather name="calendar" size={size} color={color} />;
          } else if (route.name === 'Notes') {
            return <Feather name="book" size={size} color={color} />;
          }
          return null;
        },
      })}
    >
      <Tab.Screen name="Party" component={PartyScreen} />
      <Tab.Screen name="Tasks" component={TasksStack} />
      <Tab.Screen name="Guests" component={GuestListScreen} />
      <Tab.Screen name="Calendar" component={CalendarMainScreen} />
      <Tab.Screen name="Notes" component={NotesStack} />
    </Tab.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission not granted to show notifications');
      }
    })();

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={require('./assets/gradient1.jpg')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <NavigationContainer theme={MyTheme}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="InvitationSendFlow"
              component={InvitationSendFlow}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ImageBackground>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({});
