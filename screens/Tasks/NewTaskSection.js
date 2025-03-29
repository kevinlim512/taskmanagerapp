import React from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Modal, Keyboard } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Text, Checkbox } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

export default function NewTaskSection(props) {
  const {
    taskText: propTaskText,
    setTaskText: propSetTaskText,
    isDateEnabled,
    setIsDateEnabled,
    taskDate,
    setTaskDate,
    showDatePicker,
    setShowDatePicker,
    addTask,
    formatDate,
    onAddTask,
  } = props;

  // Use internal state if no taskText and setTaskText are provided (for testing)
  const [internalText, setInternalText] = React.useState(propTaskText || "");
  const taskText = propTaskText !== undefined ? propTaskText : internalText;
  const setTaskText = propSetTaskText !== undefined ? propSetTaskText : setInternalText;

  // Helper function to handle adding a task
  const handleAddTask = () => {
    if (taskText?.trim()) {
      if (typeof onAddTask === 'function') {
        onAddTask(taskText.trim());
      } else {
        addTask();
      }
      setTaskText("");
      Keyboard.dismiss();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>New Task</Text>
      <View style={styles.addTaskContainer}>
        <TextInput
          style={styles.taskInput}
          value={taskText}
          onChangeText={setTaskText}
          placeholder="New Task"
          placeholderTextColor="#aaa"
          returnKeyType="done"
          onSubmitEditing={handleAddTask} 
        />
        <TouchableOpacity
          style={styles.addTaskButton}
          onPress={handleAddTask} 
          testID="add-task-button"
        >
          <MaterialIcons name="add" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {/* Date Option UI */}
      <View style={styles.dateContainer}>
        <View style={styles.checkboxContainer}>
          <Checkbox.Android
            status={isDateEnabled ? 'checked' : 'unchecked'}
            onPress={() => setIsDateEnabled(!isDateEnabled)}
            color="orange"
            uncheckedColor="#fff"
          />
          <Text style={styles.checkboxLabel}>Set Date</Text>
        </View>
        {isDateEnabled && (
          <View style={styles.dateRow}>
            <Text style={styles.dateDisplay}>
              {taskDate ? formatDate(taskDate) : "No Date Selected"}
            </Text>
            <TouchableOpacity style={styles.setDateButton} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.setDateButtonText}>Set Date</Text>
            </TouchableOpacity>
          </View>
        )}
        {showDatePicker && (
          <Modal visible={showDatePicker} transparent animationType="fade">
            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, styles.pickerBackground]}>
                <DateTimePicker
                  value={taskDate ? new Date(taskDate) : new Date()}
                  mode="date"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setTaskDate(selectedDate.getTime());
                    }
                  }}
                  textColor="white"
                />
                <TouchableOpacity style={styles.modalDoneButton} onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.modalDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: 'transparent',
  },
  sectionHeader: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  addTaskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  taskInput: {
    flex: 1,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    marginRight: 10,
  },
  addTaskButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'orange',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateContainer: {
    marginBottom: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: 'white',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dateDisplay: {
    fontSize: 16,
    color: '#fff',
  },
  setDateButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
    backgroundColor: 'transparent',
  },
  setDateButtonText: {
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
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  pickerBackground: {
    backgroundColor: '#0d1652',
  },
  modalDoneButton: {
    backgroundColor: 'orange',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  modalDoneText: {
    color: '#fff',
    fontSize: 16,
  },
});
