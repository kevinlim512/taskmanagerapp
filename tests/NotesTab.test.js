import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import EditNoteScreen from '../screens/Notes/EditNoteScreen';
import NotesScreen from '../screens/NotesScreen';

// --- Mocks ---

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock react-native-safe-area-context to avoid SafeAreaProviderCompat errors
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaProvider: ({ children }) => <>{children}</>,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// Mock @expo/vector-icons (MaterialIcons) to render a simple component.
// Lazy require for Text to avoid out-of-scope errors.
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    MaterialIcons: (props) => <Text {...props}>Icon</Text>,
  };
});

// --- Test Suite ---

describe('EditNoteScreen', () => {
  const note = { id: '1', text: 'Initial note text' };
  const navigation = { goBack: jest.fn() };
  const route = { params: { note } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with initial text', () => {
    const { getByDisplayValue } = render(
      <EditNoteScreen navigation={navigation} route={route} />
    );
    expect(getByDisplayValue('Initial note text')).toBeTruthy();
  });

  it('updates note in AsyncStorage and navigates back on save', async () => {
    // Setup: existing notes in AsyncStorage
    const storedNotes = JSON.stringify([{ id: '1', text: 'Initial note text' }]);
    AsyncStorage.getItem.mockResolvedValue(storedNotes);

    const { getByText, getByDisplayValue } = render(
      <EditNoteScreen navigation={navigation} route={route} />
    );

    // Update the text in the TextInput
    const input = getByDisplayValue('Initial note text');
    act(() => {
      fireEvent.changeText(input, 'Updated note text');
    });

    // Press the Save button
    const saveButton = getByText('Save Note');
    await act(async () => {
      fireEvent.press(saveButton);
    });

    // Verify AsyncStorage.getItem and setItem calls with updated note
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('@notes');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@notes',
      JSON.stringify([{ id: '1', text: 'Updated note text' }])
    );
    // Verify navigation.goBack() is called
    expect(navigation.goBack).toHaveBeenCalled();
  });
});

describe('NotesScreen', () => {
  let navigation;
  // Capture headerRight from setOptions to simulate toggling editing mode.
  let headerRight;

  beforeEach(() => {
    headerRight = null;
    // Update the navigation mock so that addListener immediately calls the callback when "focus" is added.
    navigation = {
      navigate: jest.fn(),
      setOptions: jest.fn((options) => {
        if (options.headerRight) {
          headerRight = options.headerRight();
        }
      }),
      addListener: jest.fn((event, callback) => {
        if (event === 'focus') {
          callback();
        }
        return jest.fn();
      }),
    };
    jest.clearAllMocks();
  });

  it('loads and displays saved notes from AsyncStorage', async () => {
    const savedNotes = [{ id: '1', text: 'Note 1' }, { id: '2', text: 'Note 2' }];
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedNotes));

    const { getByText } = render(<NotesScreen navigation={navigation} />);
    // Flush pending promises
    await act(async () => {});

    // Wait for the notes to be loaded (triggered by useEffect on focus)
    await waitFor(() => {
      expect(getByText('Note 1')).toBeTruthy();
      expect(getByText('Note 2')).toBeTruthy();
    });
  });

  it('creates a new note and navigates to EditNote', async () => {
    // Start with no saved notes
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();

    const { getByText } = render(<NotesScreen navigation={navigation} />);
    // Flush pending promises
    await act(async () => {});

    const createButton = getByText('Create New Note');
    await act(async () => {
      fireEvent.press(createButton);
    });

    // Expect navigation.navigate to have been called with "EditNote" and a new note object
    expect(navigation.navigate).toHaveBeenCalled();
    const navigateArgs = navigation.navigate.mock.calls[0];
    expect(navigateArgs[0]).toBe('EditNote');
    expect(navigateArgs[1]).toHaveProperty('note');
    expect(navigateArgs[1].note).toHaveProperty('id');
    expect(navigateArgs[1].note).toHaveProperty('text', '');
  });

  it('toggles editing mode and updates header button text', async () => {
    render(<NotesScreen navigation={navigation} />);
    // Flush pending promises
    await act(async () => {});

    // Initially, header button should say 'Edit'
    expect(headerRight).toBeTruthy();
    // Extract inner text from header button's Text component.
    expect(headerRight.props.children.props.children).toBe('Edit');

    // Simulate toggling edit mode by calling onPress on headerRight
    act(() => {
      headerRight.props.onPress();
    });

    // After toggling, setOptions is called again and headerRight is updated.
    expect(navigation.setOptions).toHaveBeenCalled();
    const updatedHeaderRight = navigation.setOptions.mock.calls[
      navigation.setOptions.mock.calls.length - 1
    ][0].headerRight();
    expect(updatedHeaderRight.props.children.props.children).toBe('Done');
  });

  it('deletes a note in editing mode', async () => {
    // Setup initial saved note
    const savedNotes = [{ id: '1', text: 'Note to delete' }];
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedNotes));
    AsyncStorage.setItem.mockResolvedValue();

    const { getByText, queryByText, getByTestId } = render(
      <NotesScreen navigation={navigation} />
    );
    // Flush pending promises
    await act(async () => {});

    // Wait for the note to appear
    await waitFor(() => {
      expect(getByText('Note to delete')).toBeTruthy();
    });

    // Simulate toggling to editing mode using the header button
    if (headerRight && headerRight.props.onPress) {
      act(() => {
        headerRight.props.onPress();
      });
    }
    // Now that editing mode is enabled, the delete button should be visible.
    const deleteButton = await waitFor(() => getByTestId('delete-button'));
    await act(async () => {
      fireEvent.press(deleteButton);
    });

    // After deletion, AsyncStorage.setItem should have been called with an empty array.
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@notes', JSON.stringify([]));
    // Optionally, the note text should no longer be in the tree.
    expect(queryByText('Note to delete')).toBeNull();
  });
});
