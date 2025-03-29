import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import PartyScreen from '../screens/PartyScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('PartyScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders editing mode when no party info is saved', async () => {
    // Simulate no stored party info.
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    const { getByText } = render(<PartyScreen />);
    
    // Wait for useEffect to run.
    await waitFor(() => {
      expect(getByText('Party Information')).toBeTruthy();
    });
  });

  test('renders saved party info when AsyncStorage returns party info', async () => {
    const partyInfo = {
      partyName: "Test Party",
      date: new Date(2025, 2, 27).toISOString(),
      startTime: new Date(2025, 2, 27, 18, 0, 0).toISOString(),
      endTime: new Date(2025, 2, 27, 21, 0, 0).toISOString(),
      venue: "Test Venue",
      address: "123 Test St"
    };
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(partyInfo));
    const { getByText } = render(<PartyScreen />);
    
    // Wait for AsyncStorage retrieval and state update.
    await waitFor(() => {
      expect(getByText('Test Party')).toBeTruthy();
      expect(getByText(/Test Venue/)).toBeTruthy();
      expect(getByText(/Date:/)).toBeTruthy();
    });
  });

  test('alerts when required fields are missing on save', async () => {
    // Simulate no stored party info so that we're in editing mode.
    AsyncStorage.getItem.mockResolvedValueOnce(null);
    const { getByText } = render(<PartyScreen />);
    
    // Wait for the component to render the "Party Information" heading.
    await waitFor(() => {
      expect(getByText('Party Information')).toBeTruthy();
    });
    
    // Press the "Save Changes" button without filling required fields.
    fireEvent.press(getByText('Save Changes'));
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      'Please fill in the required fields: Name, Date, Start Time, End Time, Venue.'
    );
  });
});
