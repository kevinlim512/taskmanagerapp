import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ShoppingListScreen from '../screens/Tasks/ShoppingListScreen';
import ShoppingListEditScreen from '../screens/Tasks/ShoppingListEditScreen';

// Use the async-storage mock provided by the library
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock DraggableFlatList as a basic view that always renders its ListHeaderComponent
jest.mock('react-native-draggable-flatlist', () => {
  const { View, Text } = require('react-native');
  return ({ data, ListHeaderComponent }) => (
    <View testID="mock-draggable-flatlist">
      {ListHeaderComponent}
      {data && data.map((item, index) => (
        <Text key={index}>{item.name}</Text>
      ))}
    </View>
  );
});

// For ShoppingListEditScreen tests, we need to mock useRoute so that we can pass our route props.
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
    }),
    useRoute: jest.fn(),
  };
});

describe('Shopping List Screens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ShoppingListScreen', () => {
    it('renders add item fields and header correctly', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      const { getByPlaceholderText, getByText } = render(
        <NavigationContainer>
          <ShoppingListScreen />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(getByPlaceholderText('Item Name')).toBeTruthy();
      });
      expect(getByPlaceholderText('Price')).toBeTruthy();
      expect(getByPlaceholderText('Quantity')).toBeTruthy();
      expect(getByText('Shopping List')).toBeTruthy();
    });

    it('adds a new shopping list item and stores it', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      const { getByPlaceholderText, getByText } = render(
        <NavigationContainer>
          <ShoppingListScreen />
        </NavigationContainer>
      );

      fireEvent.changeText(getByPlaceholderText('Item Name'), 'Milk');
      fireEvent.changeText(getByPlaceholderText('Price'), '2.5');
      fireEvent.changeText(getByPlaceholderText('Quantity'), '3');

      const addButton = getByText('Add Item');
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalled();
      });
    });
  });

  describe('ShoppingListEditScreen', () => {
    const mockItem = {
      id: '1',
      name: 'Eggs',
      price: 3.0,
      quantity: 2,
      total: 6.0,
      completed: false,
    };
    const onItemUpdatedMock = jest.fn();

    beforeEach(() => {
      // Set the useRoute mock to return the necessary route params
      const { useRoute } = require('@react-navigation/native');
      useRoute.mockReturnValue({
        params: { item: mockItem, onItemUpdated: onItemUpdatedMock },
      });
    });

    it('renders edit fields with initial values', async () => {
      // Return the current list (including our mockItem) so that loadItems() updates state.
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([mockItem]));
      const navigation = { goBack: jest.fn(), setOptions: jest.fn() };
      const { getByDisplayValue } = render(
        <NavigationContainer>
          <ShoppingListEditScreen navigation={navigation} />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(getByDisplayValue('Eggs')).toBeTruthy();
      });
      expect(getByDisplayValue('3')).toBeTruthy();
      expect(getByDisplayValue('2')).toBeTruthy();
    });

    it('updates an item and saves changes', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([mockItem]));
      const navigation = { goBack: jest.fn(), setOptions: jest.fn() };
      const { getByDisplayValue, getByText } = render(
        <NavigationContainer>
          <ShoppingListEditScreen navigation={navigation} />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(getByDisplayValue('Eggs')).toBeTruthy();
      });

      // Change the item name and price.
      const nameInput = getByDisplayValue('Eggs');
      fireEvent.changeText(nameInput, 'Organic Eggs');

      const priceInput = getByDisplayValue('3');
      fireEvent.changeText(priceInput, '3.5');

      const saveButton = getByText('Save Changes');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalled();
        expect(onItemUpdatedMock).toHaveBeenCalled();
        expect(navigation.goBack).toHaveBeenCalled();
      });
    });

    it('cancels editing and goes back', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([mockItem]));
      const navigation = { goBack: jest.fn(), setOptions: jest.fn() };
      const { getByText } = render(
        <NavigationContainer>
          <ShoppingListEditScreen navigation={navigation} />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(getByText('Cancel')).toBeTruthy();
      });

      const cancelButton = getByText('Cancel');
      fireEvent.press(cancelButton);
      expect(navigation.goBack).toHaveBeenCalled();
    });
  });
});
