import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock react-native-gesture-handler to avoid ref warnings
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    GestureHandlerRootView: View,
    PanGestureHandler: View,
  };
});

jest.mock('expo-device', () => ({
  osName: 'iOS',
  osVersion: '14.0',
}));

process.env.EXPO_OS = process.env.EXPO_OS || 'ios';

// Import screens under test
import EditInvitationScreen from '../screens/GuestList/EditInvitationScreen';
import InvitationSendFlow from '../screens/GuestList/InvitationSendFlow';
import InvitationsScreen from '../screens/GuestList/InvitationsScreen';
import InvitationTemplateScreen from '../screens/GuestList/InvitationTemplateScreen';

// Mock AsyncStorage with the provided mock
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// --- Navigation Mocks ---
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockAddListener = jest.fn().mockReturnValue(() => {});
const mockSetOptions = jest.fn();

// NEW: Add getState and dispatch mocks
const mockDispatch = jest.fn();
const mockGetState = jest.fn(() => ({
  routes: [{ name: 'GuestMain', key: 'guestMainKey' }],
}));

// Remove headerRightCallback expectations from deletion tests.
let headerRightCallback = null;
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  const localAct = require('@testing-library/react-native').act;
  const React = require('react');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
      setOptions: mockSetOptions,
      addListener: mockAddListener,
      getState: mockGetState,
      dispatch: mockDispatch,
    }),
    useRoute: jest.fn(),
    // Simplified useFocusEffect: Run the callback inside useEffect wrapped in act.
    useFocusEffect: (callback) => {
      React.useEffect(() => {
        let cleanup;
        localAct(() => {
          cleanup = callback();
        });
        return () => {
          if (typeof cleanup === 'function') {
            localAct(() => cleanup());
          }
        };
      }, [callback]);
    },
  };
});

// Utility function to wait for a given number of milliseconds
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Utility to flush microtasks
const flushMicrotasks = () => act(() => Promise.resolve());

// --- Mock Date.prototype.toLocaleTimeString for consistent formatting ---
let originalDateToLocaleTimeString;
beforeAll(() => {
  originalDateToLocaleTimeString = Date.prototype.toLocaleTimeString;
  Date.prototype.toLocaleTimeString = jest.fn(function(locales, options = {}) {
    const date = this;
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  });
});

afterAll(() => {
  Date.prototype.toLocaleTimeString = originalDateToLocaleTimeString;
});
// --- End Date Mocking ---

describe('Invitations Section', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear(); // Reset mock AsyncStorage
    headerRightCallback = null;
    const { useRoute } = require('@react-navigation/native');
    useRoute.mockClear();
  });

  // ------------------------------
  // EditInvitationScreen Tests
  // ------------------------------
  describe('EditInvitationScreen', () => {
    const mockInvitation = { id: 'inv1', text: 'You are invited!' };
    const onItemUpdatedMock = jest.fn();

    const setupEditScreen = async (invitation, onUpdate) => {
      const { useRoute } = require('@react-navigation/native');
      useRoute.mockReturnValue({
        params: { item: invitation, onItemUpdated: onUpdate },
      });
      // Pre-populate AsyncStorage
      await AsyncStorage.setItem('@invitations', JSON.stringify([invitation]));
      const utils = render(
        <NavigationContainer>
          <EditInvitationScreen />
        </NavigationContainer>
      );
      // Allow useEffect in EditInvitationScreen to complete
      await flushMicrotasks();
      return utils;
    };

    it('renders with initial invitation text', async () => {
      const { getByDisplayValue } = await setupEditScreen(mockInvitation, onItemUpdatedMock);
      await waitFor(() => {
        expect(getByDisplayValue(mockInvitation.text)).toBeTruthy();
      });
    });

    it('saves changes and goes back when Save Changes is pressed', async () => {
      const { getByDisplayValue, getByText } = await setupEditScreen(mockInvitation, onItemUpdatedMock);
      await waitFor(() => {
        expect(getByDisplayValue(mockInvitation.text)).toBeTruthy();
      });
      const newText = 'Updated invitation text';
      await act(async () => {
        fireEvent.changeText(getByDisplayValue(mockInvitation.text), newText);
      });
      // Clear previous mock calls
      AsyncStorage.setItem.mockClear();
      onItemUpdatedMock.mockClear();
      mockGoBack.mockClear();
      const saveButton = getByText('Save Changes');
      await act(async () => {
        fireEvent.press(saveButton);
        await flushMicrotasks();
      });
      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          '@invitations',
          JSON.stringify([{ ...mockInvitation, text: newText }])
        );
        expect(onItemUpdatedMock).toHaveBeenCalledTimes(1);
        expect(mockGoBack).toHaveBeenCalledTimes(1);
      });
    });

    it('cancels editing and goes back when Cancel is pressed', async () => {
      const { getByText } = await setupEditScreen(mockInvitation, onItemUpdatedMock);
      await waitFor(() => {
        expect(getByText('Cancel')).toBeTruthy();
      });
      // Clear mocks before action
      AsyncStorage.setItem.mockClear();
      onItemUpdatedMock.mockClear();
      mockGoBack.mockClear();
      const cancelButton = getByText('Cancel');
      await act(async () => {
        fireEvent.press(cancelButton);
        await flushMicrotasks();
      });
      expect(mockGoBack).toHaveBeenCalledTimes(1);
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
      expect(onItemUpdatedMock).not.toHaveBeenCalled();
    });
  });

  // ------------------------------
  // InvitationSendFlow Tests
  // ------------------------------
  describe('InvitationSendFlow', () => {
    it('renders the Select Invitation screen as the initial screen', async () => {
      const utils = render(
        <NavigationContainer>
          <InvitationSendFlow />
        </NavigationContainer>
      );
      await flushMicrotasks();
      const { getAllByText } = utils;
      await waitFor(() => {
        const elements = getAllByText(/Select Invitation/i);
        expect(elements.length).toBeGreaterThan(0);
      });
    });
  });

  // ------------------------------
  // InvitationsScreen Tests
  // ------------------------------
  describe('InvitationsScreen', () => {
    const mockInvitations = [
      { id: 'inv1', text: 'Invitation 1' },
      { id: 'inv2', text: 'Invitation 2' },
    ];

    // Modify the setup to pass forceEdit prop so that edit mode is enabled and delete buttons are visible.
    const setupInvitationsScreen = async (invites) => {
      await AsyncStorage.setItem('@invitations', JSON.stringify(invites));
      const utils = render(
        <NavigationContainer>
          <InvitationsScreen forceEdit={true} />
        </NavigationContainer>
      );
      // Allow useFocusEffect and useLayoutEffect to run
      await flushMicrotasks();
      return utils;
    };

    it('renders invitations list and action buttons', async () => {
      const { getByText } = await setupInvitationsScreen(mockInvitations);
      await waitFor(() => {
        expect(getByText('Invitation 1')).toBeTruthy();
        expect(getByText('Invitation 2')).toBeTruthy();
        expect(getByText('Create Invitation Template')).toBeTruthy();
        expect(getByText('Send Invitation')).toBeTruthy();
      });
    });

    it('navigates to InvitationTemplate when Create Invitation Template is pressed', async () => {
      const { getByText } = await setupInvitationsScreen(mockInvitations);
      await waitFor(() => {
        expect(getByText('Create Invitation Template')).toBeTruthy();
      });
      await act(async () => {
        fireEvent.press(getByText('Create Invitation Template'));
        await flushMicrotasks();
      });
      expect(mockNavigate).toHaveBeenCalledWith('InvitationTemplate');
    });

    it('navigates to InvitationSendFlow when Send Invitation is pressed', async () => {
      const { getByText } = await setupInvitationsScreen(mockInvitations);
      await waitFor(() => {
        expect(getByText('Send Invitation')).toBeTruthy();
      });
      await act(async () => {
        fireEvent.press(getByText('Send Invitation'));
        await flushMicrotasks();
      });
      expect(mockNavigate).toHaveBeenCalledWith('InvitationSendFlow');
    });

    it('deletes an invitation when delete icon is pressed in edit mode', async () => {
      const { queryByText, getByTestId } = await setupInvitationsScreen(mockInvitations);
      await waitFor(() => {
        expect(queryByText('Invitation 1')).toBeTruthy();
      });
      // Look for the delete button using its testID.
      const deleteButton = getByTestId(`delete-invitation-${mockInvitations[0].id}`);
      AsyncStorage.setItem.mockClear();
      await act(async () => {
        fireEvent.press(deleteButton);
        await flushMicrotasks();
      });
      await waitFor(() => {
        expect(queryByText('Invitation 1')).toBeNull();
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          '@invitations',
          JSON.stringify([mockInvitations[1]])
        );
      });
    });
  });

  // ------------------------------
  // InvitationTemplateScreen Tests
  // ------------------------------
  describe('InvitationTemplateScreen', () => {
    const partyInfo = {
      date: new Date('2025-10-31T00:00:00.000Z').toISOString(), // Fri Oct 31 2025 UTC
      startTime: new Date('2025-10-31T19:00:00.000Z').toISOString(), // 7:00 PM UTC
      endTime: new Date('2025-10-31T22:00:00.000Z').toISOString(), // 10:00 PM UTC
      venue: 'Test Venue',
      partyName: 'Test Party',
      address: '123 Test St.',
    };

    const setupTemplateScreen = async (currentInvites = []) => {
      await AsyncStorage.setItem('@party_info', JSON.stringify(partyInfo));
      await AsyncStorage.setItem('@invitations', JSON.stringify(currentInvites));
      const utils = render(
        <NavigationContainer>
          <InvitationTemplateScreen />
        </NavigationContainer>
      );
      await flushMicrotasks();
      return utils;
    };

    it('renders template previews using party info', async () => {
      const { getAllByText } = await setupTemplateScreen();
      await waitFor(() => {
        const venuePreviews = getAllByText(/Test Venue/);
        expect(venuePreviews.length).toBeGreaterThan(0);
        expect(getAllByText(/Oct 31 2025/).length).toBeGreaterThan(0);
        expect(getAllByText(/7:00 PM/).length).toBeGreaterThan(0);
      });
    });

    it('saves a new invitation and returns to the Invitations screen when a template is selected', async () => {
      const initialInvites = [{ id: 'existing1', text: 'Old invite' }];
      const { getAllByText } = await setupTemplateScreen(initialInvites);
      let templateButtons;
      await waitFor(() => {
        templateButtons = getAllByText(/Join us at our party/);
        expect(templateButtons.length).toBeGreaterThan(0);
      });
      AsyncStorage.setItem.mockClear();
      mockGoBack.mockClear();
      mockDispatch.mockClear();
      await act(async () => {
        fireEvent.press(templateButtons[0]);
        await flushMicrotasks();
      });
      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          '@invitations',
          expect.stringContaining('Join us at our party on Fri Oct 31 2025 from 7:00 PM to 10:00 PM at Test Venue. Address: 123 Test St.')
        );
        expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
          payload: expect.objectContaining({
            params: { key: 'guestMainKey', params: { activeTab: 'Invitations' } }
          }),
          type: 'SET_PARAMS'
        }));
        expect(mockGoBack).toHaveBeenCalledTimes(1);
      });
    });
  });
});
