import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text } from 'react-native-paper';
import { createStackNavigator } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

import ShoppingListScreen from './Tasks/ShoppingListScreen';
import NewTaskSection from './Tasks/NewTaskSection';
import TasksListSection from './Tasks/TasksListSection';

const TASKS_KEY = '@tasks';

const ShoppingListStack = createStackNavigator();

function ShoppingListStackScreen({ isEditing }) {
  return (
    <ShoppingListStack.Navigator screenOptions={{ headerShown: false }}>
      <ShoppingListStack.Screen name="ShoppingListScreen">
        {() => <ShoppingListScreen isEditing={isEditing} />}
      </ShoppingListStack.Screen>
    </ShoppingListStack.Navigator>
  );
}

const formatDate = (timestamp) => {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  const day = d.getDate();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

export default function TasksScreen({ navigation }) {
  const [activeSubTab, setActiveSubTab] = useState('Tasks');
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [taskText, setTaskText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isDateEnabled, setIsDateEnabled] = useState(false);
  const [taskDate, setTaskDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => {
        if (activeSubTab === 'Tasks' || activeSubTab === 'Shopping List') {
          return (
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
              <Text style={styles.headerButtonText}>
                {isEditing ? 'Done' : 'Edit'}
              </Text>
            </TouchableOpacity>
          );
        }
        return null;
      },
    });
  }, [navigation, activeSubTab, isEditing]);

  // Load tasks on mount and when the screen regains focus.
  const loadTasks = async () => {
    try {
      const stored = await AsyncStorage.getItem(TASKS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setTasks(parsed.filter(t => !t.completed));
        setCompletedTasks(parsed.filter(t => t.completed));
      }
    } catch (err) {
      console.warn('Failed to load tasks:', err);
    }
  };

  // Refresh tasks whenever the screen gains focus.
  useFocusEffect(
    React.useCallback(() => {
      loadTasks();
    }, [])
  );

  // Enable LayoutAnimation on Android.
  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const saveTasks = (newTasks) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTasks(newTasks);
    AsyncStorage.setItem(TASKS_KEY, JSON.stringify([...newTasks, ...completedTasks])).catch(err => {
      console.warn('Failed to save tasks:', err);
    });
  };

  const addTask = () => {
    if (!taskText.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      text: taskText,
      completed: false,
      date: isDateEnabled && taskDate ? taskDate : null,
    };
    const updatedActive = [...tasks, newTask];
    setTasks(updatedActive);
    AsyncStorage.setItem(TASKS_KEY, JSON.stringify([...updatedActive, ...completedTasks]));
    setTaskText('');
    setTaskDate(null);
    setIsDateEnabled(false);
  };

  const toggleTask = (id, isCompleted) => {
    if (isCompleted) {
      const found = completedTasks.find(t => t.id === id);
      if (!found) return;
      const newCompleted = completedTasks.filter(t => t.id !== id);
      const newActive = [...tasks, { ...found, completed: false }];
      setTasks(newActive);
      setCompletedTasks(newCompleted);
      AsyncStorage.setItem(TASKS_KEY, JSON.stringify([...newActive, ...newCompleted]));
    } else {
      const found = tasks.find(t => t.id === id);
      if (!found) return;
      const newActive = tasks.filter(t => t.id !== id);
      const newCompleted = [...completedTasks, { ...found, completed: true }];
      setTasks(newActive);
      setCompletedTasks(newCompleted);
      AsyncStorage.setItem(TASKS_KEY, JSON.stringify([...newActive, ...newCompleted]));
    }
  };

  const deleteTask = (id) => {
    const newActive = tasks.filter(t => t.id !== id);
    const newCompleted = completedTasks.filter(t => t.id !== id);
    setTasks(newActive);
    setCompletedTasks(newCompleted);
    AsyncStorage.setItem(TASKS_KEY, JSON.stringify([...newActive, ...newCompleted]));
  };

  return (
    <ImageBackground
      source={require('../assets/gradient1.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={styles.container}>
        {/* Sub-tab Bar */}
        <View style={styles.subTabBar}>
          <TouchableOpacity
            style={[styles.subTabItem, activeSubTab === 'Tasks' && styles.subTabItemActive]}
            onPress={() => setActiveSubTab('Tasks')}
          >
            <Text style={styles.subTabItemText}>Tasks</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.subTabItem, activeSubTab === 'Shopping List' && styles.subTabItemActive]}
            onPress={() => setActiveSubTab('Shopping List')}
          >
            <Text style={styles.subTabItemText}>Shopping List</Text>
          </TouchableOpacity>
        </View>
        {activeSubTab === 'Tasks' ? (
          <View style={styles.scrollContainer}>
            <NewTaskSection
              taskText={taskText}
              setTaskText={setTaskText}
              isDateEnabled={isDateEnabled}
              setIsDateEnabled={setIsDateEnabled}
              taskDate={taskDate}
              setTaskDate={setTaskDate}
              showDatePicker={showDatePicker}
              setShowDatePicker={setShowDatePicker}
              addTask={addTask}
              formatDate={formatDate}
            />
            <TasksListSection
              tasks={tasks}
              completedTasks={completedTasks}
              toggleTask={toggleTask}
              deleteTask={deleteTask}
              formatDate={formatDate}
              saveTasks={saveTasks}
              isEditing={isEditing}
            />
          </View>
        ) : (
          <ShoppingListStackScreen isEditing={isEditing} />
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButtonText: {
    fontSize: 16,
    color: 'orange',
    fontWeight: 'bold',
    marginRight: 16,
  },
  subTabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 25,
    backgroundColor: 'transparent',
  },
  subTabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'orange',
  },
  subTabItemActive: {
    backgroundColor: 'orange',
  },
  subTabItemText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
});
