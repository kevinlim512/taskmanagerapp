import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Provider as PaperProvider } from 'react-native-paper';

// Use fake timers to help flush animations.
jest.useFakeTimers();

// ---- 0) Stub TouchableOpacity to render a View with testID equal to accessibilityLabel ----
jest.mock('react-native/Libraries/Components/Touchable/TouchableOpacity', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props) => <View {...props} testID={props.accessibilityLabel} />;
});

// ---- 1) Required Mocks ----

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

jest.mock('react-native-calendars', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  const MockCalendar = ({ onDayPress, markedDates, ...props }) => (
    <View testID="mockCalendar">
      <Text>Mock Calendar</Text>
    </View>
  );
  return { Calendar: MockCalendar };
});

process.env.EXPO_OS = process.env.EXPO_OS || 'ios';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// ---- 2) Import Screens ----
import AllEventsScreen from '../screens/Calendar/AllEventsScreen';
import EditEventScreen from '../screens/Calendar/EditEventScreen';
import NewEventScreen from '../screens/Calendar/NewEventScreen';
import CalendarMainScreen, { MergedCalendarHome } from '../screens/CalendarMainScreen';

// ---- 3) Navigation Mocks ----
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockAddListener = jest.fn().mockReturnValue(() => {});

// Capture the headerRight callback to trigger its onPress handler.
let headerRightCallback = null;
const mockSetOptions = jest.fn((options) => {
  if (options && typeof options.headerRight === 'function') {
    headerRightCallback = options.headerRight;
  }
});

// Override react-navigation hooks.
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
      setOptions: mockSetOptions,
      addListener: mockAddListener,
    }),
    useRoute: jest.fn().mockReturnValue({ params: {} }),
  };
});

// ---- 4) Utility Functions ----
const flushMicrotasks = () => act(() => Promise.resolve());

// ---- 5) Reset Mocks Before Each Test ----
beforeEach(() => {
  jest.clearAllMocks();
  AsyncStorage.clear();
  headerRightCallback = null;
});

// ---- 6) AllEventsScreen Tests ----
describe('AllEventsScreen', () => {
  const mockNavigation = {
    navigate: mockNavigate,
    addListener: mockAddListener,
    setOptions: mockSetOptions,
  };

  // Modified setup function accepts an optional tasksData array.
  async function setupAllEventsScreen(params = {}, tasksData) {
    const routeParams = { selectedDate: params.selectedDate };
    const route = { params: routeParams };

    // Provide initial test data for events.
    const mockEvents = [
      { id: 'e1', datetime: '2025-04-10T13:00:00.000Z', title: 'Meeting' },
      { id: 'e2', datetime: '2025-04-11T17:30:00.000Z', title: 'Gym' },
    ];
    // If tasksData is provided, use it; otherwise, default to one task.
    const mockTasks =
      tasksData !== undefined
        ? tasksData
        : [{ id: 't1', text: 'Task A', date: '2025-04-10T09:00:00.000Z' }];
    await AsyncStorage.setItem('@events', JSON.stringify(mockEvents));
    await AsyncStorage.setItem('@tasks', JSON.stringify(mockTasks));

    const utils = render(
      <NavigationContainer>
        <PaperProvider>
          <AllEventsScreen navigation={mockNavigation} route={route} />
        </PaperProvider>
      </NavigationContainer>
    );
    await flushMicrotasks();
    return utils;
  }

  it('loads and merges events & tasks, displaying them grouped by date', async () => {
    const { getByText } = await setupAllEventsScreen();
    await waitFor(() => {
      expect(getByText(/Meeting/i)).toBeTruthy();
      expect(getByText(/Task A/i)).toBeTruthy();
      expect(getByText(/Gym/i)).toBeTruthy();
    });
  });

  it('filters to selectedDate if provided', async () => {
    const { queryByText } = await setupAllEventsScreen({ selectedDate: '2025-04-10' });
    await waitFor(() => {
      expect(queryByText(/Meeting/i)).not.toBeNull();
      expect(queryByText(/Task A/i)).not.toBeNull();
      expect(queryByText(/Gym/i)).toBeNull();
    });
  });

  it('toggles editMode via headerRight button, then shows delete/edit icons', async () => {
    const utils = await setupAllEventsScreen();
    expect(mockSetOptions).toHaveBeenCalledTimes(1);

    // Retrieve and render the header element.
    let headerElem = headerRightCallback && headerRightCallback();
    const renderedHeader = render(<>{headerElem}</>);
    expect(renderedHeader.getByText('Edit')).toBeTruthy();

    // Toggle edit mode.
    await act(async () => {
      headerElem.props.onPress();
      await flushMicrotasks();
    });

    // Query for the delete icon using getByTestId (which we set equal to accessibilityLabel).
    const { getByTestId } = utils;
    const deleteButton = await waitFor(() => getByTestId('Delete Event e1'));
    expect(deleteButton).toBeTruthy();
  });

  it('deletes an event when trash is pressed in edit mode', async () => {
    // For deletion test, set tasks to an empty array.
    const utils = await setupAllEventsScreen({}, []);
    // Toggle edit mode.
    await act(async () => {
      headerRightCallback().props.onPress();
      await flushMicrotasks();
    });

    const { getByTestId } = utils;
    const deleteButton = await waitFor(() => getByTestId('Delete Event e1'));
    expect(deleteButton).toBeTruthy();

    // Clear AsyncStorage setItem mock before deletion.
    AsyncStorage.setItem.mockClear();

    await act(async () => {
      fireEvent.press(deleteButton);
      await flushMicrotasks();
    });

    const updated = await AsyncStorage.getItem('@events');
    const parsed = JSON.parse(updated);
    // "Meeting" (id "e1") should be deleted, leaving only "Gym".
    expect(parsed.length).toBe(1);
    expect(parsed[0].title).toBe('Gym');
  });

  it('navigates to EditEventScreen on edit icon press (in edit mode)', async () => {
    const utils = await setupAllEventsScreen();
    // Toggle edit mode.
    await act(async () => {
      headerRightCallback().props.onPress();
      await flushMicrotasks();
    });

    const { getByTestId } = utils;
    const editButton = await waitFor(() => getByTestId('Edit Event e1'));
    expect(editButton).toBeTruthy();

    await act(async () => {
      fireEvent.press(editButton);
      await flushMicrotasks();
    });
    expect(mockNavigate).toHaveBeenCalledWith('EditEvent', expect.anything());
  });
});

// ---- 7) EditEventScreen Tests ----
describe('EditEventScreen', () => {
  const mockNavigation = { goBack: mockGoBack };

  async function setupEditEventScreen(eventData) {
    const route = { params: { event: eventData } };
    await AsyncStorage.setItem('@events', JSON.stringify([eventData]));
    const utils = render(
      <NavigationContainer>
        <PaperProvider>
          <EditEventScreen navigation={mockNavigation} route={route} />
        </PaperProvider>
      </NavigationContainer>
    );
    await flushMicrotasks();
    return utils;
  }

  it('renders with existing event data', async () => {
    const testEvent = {
      id: '123',
      title: 'My Event',
      datetime: '2025-04-10T13:00:00.000Z',
      usePartyDate: false,
    };
    const { getByDisplayValue } = await setupEditEventScreen(testEvent);
    await waitFor(() => {
      expect(getByDisplayValue('My Event')).toBeTruthy();
    });
  });

  it('updates event and goes back when "Save Changes" is pressed', async () => {
    const testEvent = {
      id: 'abc',
      title: 'Old Title',
      datetime: '2025-04-10T09:15:00.000Z',
      usePartyDate: false,
    };
    const { getByText, getByPlaceholderText } = await setupEditEventScreen(testEvent);
    await waitFor(() => {
      expect(getByPlaceholderText(/enter event title/i)).toBeTruthy();
    });

    await act(async () => {
      fireEvent.changeText(getByPlaceholderText(/enter event title/i), 'New Title');
      await flushMicrotasks();
    });

    await act(async () => {
      fireEvent.press(getByText('Save Changes'));
      await flushMicrotasks();
    });

    const updatedRaw = await AsyncStorage.getItem('@events');
    const updated = JSON.parse(updatedRaw);
    expect(updated[0].title).toBe('New Title');
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});

// ---- 8) NewEventScreen Tests ----
describe('NewEventScreen', () => {
  const mockNavigation = { goBack: mockGoBack };

  async function setupNewEventScreen(params = {}) {
    const route = { params };
    const utils = render(
      <NavigationContainer>
        <PaperProvider>
          <NewEventScreen navigation={mockNavigation} route={route} />
        </PaperProvider>
      </NavigationContainer>
    );
    await flushMicrotasks();
    return utils;
  }

  it('creates a new event and saves to AsyncStorage', async () => {
    const { getByPlaceholderText, getByText } = await setupNewEventScreen();
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText(/enter event title/i), 'Test Event');
      await flushMicrotasks();
    });
    await act(async () => {
      fireEvent.press(getByText('Add Event'));
      await flushMicrotasks();
    });

    const storedEvents = await AsyncStorage.getItem('@events');
    const parsed = JSON.parse(storedEvents);
    expect(parsed.length).toBe(1);
    expect(parsed[0].title).toBe('Test Event');
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('respects "Use Party Date" if toggled', async () => {
    const partyInfo = { date: '2026-01-01T00:00:00.000Z' };
    await AsyncStorage.setItem('@party_info', JSON.stringify(partyInfo));

    const { getByPlaceholderText, getByText, getByTestId } = await setupNewEventScreen();
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText(/enter event title/i), 'Test Party');
      await flushMicrotasks();
    });

    // Press the checkbox (NewEventScreen should add testID="usePartyDateCheckbox" to its Checkbox).
    await act(async () => {
      fireEvent.press(getByTestId('usePartyDateCheckbox'));
      await flushMicrotasks();
    });

    await act(async () => {
      fireEvent.press(getByText('Add Event'));
      await flushMicrotasks();
    });

    const storedEvents = await AsyncStorage.getItem('@events');
    const parsed = JSON.parse(storedEvents);
    expect(parsed.length).toBe(1);
    expect(parsed[0].usePartyDate).toBe(true);
  });
});

// ---- 9) CalendarMainScreen Tests ----
describe('CalendarMainScreen', () => {
  async function setupCalendarHome() {
    const props = {
      navigation: {
        navigate: mockNavigate,
        setOptions: jest.fn(),
        addListener: jest.fn(),
      },
    };
    const utils = render(
      <NavigationContainer>
        <PaperProvider>
          <MergedCalendarHome {...props} />
        </PaperProvider>
      </NavigationContainer>
    );
    await flushMicrotasks();
    return utils;
  }

  it('loads party date and events, marking them on the calendar', async () => {
    const partyInfo = { date: '2025-04-15T00:00:00.000Z' };
    await AsyncStorage.setItem('@party_info', JSON.stringify(partyInfo));
    const { getByTestId } = await setupCalendarHome();
    await waitFor(() => {
      expect(getByTestId('mockCalendar')).toBeTruthy();
    });
  });

  it('navigates to NewEvent when "Add New Event" is pressed', async () => {
    const { getByText } = await setupCalendarHome();
    await waitFor(() => {
      expect(getByText('Add New Event')).toBeTruthy();
    });
    await act(async () => {
      fireEvent.press(getByText('Add New Event'));
      await flushMicrotasks();
    });
    expect(mockNavigate).toHaveBeenCalledWith('NewEvent', expect.anything());
  });

  it('navigates to AllEvents with partyDate if "View Party Day Events" is pressed', async () => {
    const partyInfo = { date: '2025-05-05T00:00:00.000Z' };
    await AsyncStorage.setItem('@party_info', JSON.stringify(partyInfo));
    const { getByText } = await setupCalendarHome();
    await waitFor(() => {
      expect(getByText('View Party Day Events')).toBeTruthy();
    });
    await act(async () => {
      fireEvent.press(getByText('View Party Day Events'));
      await flushMicrotasks();
    });
    expect(mockNavigate).toHaveBeenCalledWith('AllEvents', { selectedDate: '2025-05-05' });
  });
});
