jest.mock('react-native-gesture-handler');
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import GuestListScreen from '../screens/GuestListScreen';
import GuestListHome from '../screens/GuestList/GuestListHome';
import AddContactScreen from '../screens/GuestList/AddContactScreen';
import GuestDetailScreen from '../screens/GuestList/GuestDetailScreen';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock react-native Linking for WhatsApp
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(),
}));

// Mock gesture handler with forwardRef for all handlers
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');

  const mockComponent = (name) =>
    React.forwardRef((props, ref) =>
      React.createElement(View, { ...props, ref }, props.children)
    );

  return {
    GestureHandlerRootView: mockComponent('GestureHandlerRootView'),
    Swipeable: mockComponent('Swipeable'),
    FlatList: require('react-native').FlatList,
    PanGestureHandler: mockComponent('PanGestureHandler'),
    TapGestureHandler: mockComponent('TapGestureHandler'),
    LongPressGestureHandler: mockComponent('LongPressGestureHandler'),
    RotationGestureHandler: mockComponent('RotationGestureHandler'),
    FlingGestureHandler: mockComponent('FlingGestureHandler'),
    PinchGestureHandler: mockComponent('PinchGestureHandler'),
    NativeViewGestureHandler: mockComponent('NativeViewGestureHandler'),
    State: {},
    Directions: {},
  };
});

// Mock Linking for navigation + WhatsApp
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(),
  canOpenURL: jest.fn(),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeEventListener: jest.fn(),
}));

// Mock react-native-draggable-flatlist to avoid gesture issues in tests
jest.mock('react-native-draggable-flatlist', () => {
  const React = require('react');
  const { FlatList } = require('react-native');

  const MockDraggableFlatList = React.forwardRef((props, ref) => {
    return <FlatList ref={ref} {...props} />;
  });

  return {
    __esModule: true,
    default: MockDraggableFlatList,
  };
});

describe('Guests Tab Screens', () => {

  // =====================
  // GuestListScreen
  // =====================
  test('GuestListScreen renders tabs and toggles Add Contact button', () => {
    const { getByText, queryByText } = render(
      <NavigationContainer>
        <GuestListScreen />
      </NavigationContainer>
    );

    expect(getByText('Guest List')).toBeTruthy();
    expect(getByText('Invitations')).toBeTruthy();
    expect(getByText('Add Contact')).toBeTruthy();

    fireEvent.press(getByText('Invitations'));
    expect(queryByText('Add Contact')).toBeNull();
  });

  // =====================
  // GuestListHome
  // =====================
  test('GuestListHome loads sorted guests and displays names', async () => {
    const guests = [
      { id: '1', firstName: 'Charlie', lastName: 'Beta', dietaryRestrictions: 'No' },
      { id: '2', firstName: 'Anna', lastName: 'Alpha', dietaryRestrictions: 'Vegetarian' },
    ];
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(guests));

    const { getByText } = render(
      <NavigationContainer>
        <GuestListHome navigation={{ setOptions: jest.fn(), navigate: jest.fn() }} />
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(getByText('Anna Alpha')).toBeTruthy();
      expect(getByText('Charlie Beta')).toBeTruthy();
    });
  });

  // =====================
  // AddContactScreen
  // =====================
  test('AddContactScreen saves a new guest with dietary info', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null); // no guests yet
    const navigation = { navigate: jest.fn(), goBack: jest.fn() };
  
    const { getByPlaceholderText, getByText } = render(
      <AddContactScreen navigation={navigation} />
    );
  
    fireEvent.changeText(getByPlaceholderText('First Name'), 'John');
    fireEvent.changeText(getByPlaceholderText('Last Name'), 'Doe');
    fireEvent.changeText(getByPlaceholderText('Phone'), '1234567890');
    fireEvent.changeText(getByPlaceholderText('Email'), 'john@example.com');
    fireEvent.press(getByText('Yes'));
    fireEvent.changeText(getByPlaceholderText('Enter dietary restrictions'), 'Vegan');
  
    fireEvent.press(getByText('Add Contact'));
  
    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalled();
      expect(navigation.navigate).toHaveBeenCalled();
    });
  });

  // =====================
  // GuestDetailScreen
  // =====================
  test('GuestDetailScreen loads and shows guest info', async () => {
    const mockGuest = {
      id: '123',
      firstName: 'Emily',
      lastName: 'Stone',
      phone: '1112223333',
      email: 'emily@guest.com',
      dietaryRestrictions: 'None'
    };
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([mockGuest]));

    const { getByText } = render(
      <GuestDetailScreen
        navigation={{ setOptions: jest.fn() }}
        route={{ params: { guestId: '123' } }}
      />
    );

    await waitFor(() => {
      expect(getByText('Emily Stone')).toBeTruthy();
      expect(getByText(/Phone:/)).toBeTruthy();
      expect(getByText(/emily@guest.com/)).toBeTruthy();
    });
  });
});
