import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Platform,
  Alert,
  Keyboard,
  ImageBackground,
} from 'react-native';
import { Text } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TASKS_KEY = '@tasks';

export default function EditTaskScreen({ navigation, route }) {
  const { task } = route.params;
  const [editText, setEditText] = useState(task.text);
  // Use the stored task date or default to tomorrow.
  const initialDate = task.date ? new Date(task.date) : new Date(Date.now() + 86400000);
  const [dateValue, setDateValue] = useState(initialDate);
  const [dateModalVisible, setDateModalVisible] = useState(false);

  function formatDate(d) {
    return d.toDateString();
  }

  async function saveTask() {
    if (!editText.trim()) {
      Alert.alert('Error', 'Please enter task text.');
      return;
    }
    
    // Use the chosen date as the task's date.
    const updatedTask = {
      ...task,
      text: editText.trim(),
      date: dateValue.toISOString(),
    };

    try {
      const stored = await AsyncStorage.getItem(TASKS_KEY);
      const tasks = stored ? JSON.parse(stored) : [];
      const updatedTasks = tasks.map((t) => t.id === task.id ? updatedTask : t);
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updatedTasks));
      // Return to the TasksScreen (which refreshes via useFocusEffect).
      navigation.goBack();
    } catch (error) {
      console.warn(error);
    }
  }

  return (
    <ImageBackground
      source={require('../../assets/gradient1.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Text style={styles.label}>Task Text</Text>
        <TextInput
          style={styles.textInput}
          value={editText}
          onChangeText={setEditText}
          placeholder="Enter task text"
          placeholderTextColor="#aaa"
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />

        <Text style={styles.label}>Date</Text>
        <View style={styles.row}>
          <Text style={styles.dateDisplay}>{formatDate(dateValue)}</Text>
          <TouchableOpacity
            style={styles.setButton}
            onPress={() => setDateModalVisible(true)}
          >
            <Text style={styles.setButtonText}>Set Date</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={saveTask}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>

        {/* Date Picker Modal */}
        <Modal visible={dateModalVisible} transparent animationType="fade">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <DateTimePicker
                value={dateValue}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  if (selectedDate) setDateValue(selectedDate);
                }}
                textColor="#fff"
              />
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setDateModalVisible(false)}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  textInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 12,
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateDisplay: {
    fontSize: 16,
    color: '#fff',
  },
  setButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
    backgroundColor: 'transparent',
  },
  setButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: 'orange',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 360,
    backgroundColor: '#0d1652',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  doneButton: {
    backgroundColor: 'orange',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
