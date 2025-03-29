import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TasksScreen from '../screens/TasksScreen';
import NewTaskSection from '../screens/Tasks/NewTaskSection';
import TasksListSection from '../screens/Tasks/TasksListSection';
import EditTaskScreen from '../screens/Tasks/EditTaskScreen';

// Use the async-storage mock provided by the library
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock the draggable flat list as a basic view that renders task text
jest.mock('react-native-draggable-flatlist', () => {
  const { View, Text } = require('react-native');
  return ({ data }) => (
    <View testID="mock-draggable-flatlist">
      {data.map((item, index) => (
        <Text key={index}>{item.text || item.title}</Text>
      ))}
    </View>
  );
});

describe('Tasks Tab Screens and Components', () => {
  it('renders TasksScreen with NewTaskSection and TasksListSection', () => {
    const { getByPlaceholderText, getByTestId } = render(
      <NavigationContainer>
        <TasksScreen navigation={{ setOptions: jest.fn() }} />
      </NavigationContainer>
    );

    expect(getByPlaceholderText('New Task')).toBeTruthy();
    expect(getByTestId('mock-draggable-flatlist')).toBeTruthy();
  });

  it('adds a new task and stores it', async () => {
    const { getByPlaceholderText, getByTestId } = render(
      <NavigationContainer>
        <TasksScreen navigation={{ setOptions: jest.fn() }} />
      </NavigationContainer>
    );

    const input = getByPlaceholderText('New Task');
    fireEvent.changeText(input, 'Buy snacks');

    const addButton = getByTestId('add-task-button');
    fireEvent.press(addButton);

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  it('TasksListSection displays tasks from props', () => {
    const tasks = [
      { id: '1', title: 'Task One', text: 'Task One', completed: false },
      { id: '2', title: 'Task Two', text: 'Task Two', completed: false },
    ];

    const { getByText } = render(
      <NavigationContainer>
        <TasksListSection
          tasks={tasks}
          editing={false}
          onToggleComplete={jest.fn()}
          onDeleteTask={jest.fn()}
          onReorderTasks={jest.fn()}
          completedTasks={[]}
        />
      </NavigationContainer>
    );

    expect(getByText('Active Tasks')).toBeTruthy();
    expect(getByText('Task One')).toBeTruthy();
    expect(getByText('Task Two')).toBeTruthy();
  });

  it('NewTaskSection input and submit work', () => {
    const mockAdd = jest.fn();
    // Pass the onAddTask prop to trigger our internal handleAddTask function
    const { getByPlaceholderText, getByTestId } = render(
      <NewTaskSection onAddTask={mockAdd} />
    );

    const input = getByPlaceholderText('New Task');
    fireEvent.changeText(input, 'Study');

    const addButton = getByTestId('add-task-button');
    fireEvent.press(addButton);

    // Expect that onAddTask is called with the string 'Study'
    expect(mockAdd).toHaveBeenCalledWith('Study'); 
  });

  it('EditTaskScreen updates task and saves', async () => {
    const route = {
      params: {
        task: {
          id: '1',
          text: 'Old Task',
          date: new Date().toISOString(),
        },
      },
    };

    const navigation = { goBack: jest.fn(), setOptions: jest.fn() };

    const { getByDisplayValue, getByPlaceholderText, getByText } = render(
      <EditTaskScreen navigation={navigation} route={route} />
    );

    expect(getByDisplayValue('Old Task')).toBeTruthy();

    const input = getByPlaceholderText('Enter task text');
    fireEvent.changeText(input, 'Updated Task');

    // Look for the button with text "Save Changes" as rendered in the component
    fireEvent.press(getByText('Save Changes'));

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    expect(navigation.goBack).toHaveBeenCalled();
  });
});
