import React, { useState, useEffect } from 'react';
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
import { Text, Checkbox } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EVENTS_KEY = '@events';
const PARTY_INFO_KEY = '@party_info';

export default function EditEventScreen({ navigation, route }) {
  const { event } = route.params;
  const [editTitle, setEditTitle] = useState(event.title);
  const initialDate = new Date(event.datetime);
  const [dateValue, setDateValue] = useState(initialDate);
  const [timeValue, setTimeValue] = useState(initialDate);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [timeModalVisible, setTimeModalVisible] = useState(false);

  // "Use Party Date" state: initialize from event if available, otherwise false.
  const [usePartyDate, setUsePartyDate] = useState(event.usePartyDate || false);
  const [partyDate, setPartyDate] = useState(null);

  // Load the party date from AsyncStorage
  useEffect(() => {
    async function loadPartyDate() {
      try {
        const storedInfo = await AsyncStorage.getItem(PARTY_INFO_KEY);
        if (storedInfo) {
          const info = JSON.parse(storedInfo);
          if (info.date) {
            setPartyDate(new Date(info.date));
          }
        }
      } catch (error) {
        console.warn('Failed to load party date:', error);
      }
    }
    loadPartyDate();
  }, []);

  // If "Use Party Date" is enabled and partyDate is available, update dateValue automatically.
  useEffect(() => {
    if (usePartyDate && partyDate) {
      setDateValue(partyDate);
    }
  }, [usePartyDate, partyDate]);

  function formatTime(d) {
    let hours = d.getHours();
    let minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const minStr = minutes < 10 ? `0${minutes}` : minutes;
    return `${hours}:${minStr} ${ampm}`;
  }

  function formatDate(d) {
    return d.toDateString();
  }

  // Toggle the "Use Party Date" checkbox.
  const handleUsePartyDateToggle = () => {
    const newVal = !usePartyDate;
    setUsePartyDate(newVal);
    if (newVal && partyDate) {
      setDateValue(partyDate);
    }
  };

  async function saveEvent() {
    if (!dateValue) {
      Alert.alert('Error', 'Please select a date.');
      return;
    }
    if (!editTitle.trim()) {
      Alert.alert('Error', 'Please enter an event title.');
      return;
    }
    // Combine date and time into one Date object.
    const combined = new Date(
      dateValue.getFullYear(),
      dateValue.getMonth(),
      dateValue.getDate(),
      timeValue.getHours(),
      timeValue.getMinutes(),
      timeValue.getSeconds()
    );
    try {
      const stored = await AsyncStorage.getItem(EVENTS_KEY);
      const events = stored ? JSON.parse(stored) : [];
      const updatedEvents = events.map((ev) => {
        if (ev.id === event.id) {
          return {
            ...ev,
            title: editTitle.trim(),
            datetime: combined.toISOString(),
            usePartyDate: usePartyDate,
          };
        }
        return ev;
      });
      await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(updatedEvents));
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
        <Text style={styles.label}>Event Title</Text>
        <TextInput
          style={styles.textInput}
          value={editTitle}
          onChangeText={setEditTitle}
          placeholder="Enter event title"
          placeholderTextColor="#aaa"
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />

        <Text style={styles.label}>Date</Text>
        <View style={styles.row}>
          <Text style={styles.dateDisplay}>{formatDate(dateValue)}</Text>
          <TouchableOpacity
            style={[
              styles.setButton,
              usePartyDate && { opacity: 0.4 },
            ]}
            disabled={usePartyDate}
            onPress={() => setDateModalVisible(true)}
          >
            <Text style={styles.setButtonText}>Set Date</Text>
          </TouchableOpacity>
        </View>

        {/* "Use Party Date" Checkbox */}
        <View style={[styles.checkboxRow, { marginBottom: 12 }]}>
          <Checkbox.Android
            status={usePartyDate ? 'checked' : 'unchecked'}
            onPress={handleUsePartyDateToggle}
            color="orange"
            uncheckedColor="#fff"
          />
          <Text style={styles.checkboxLabel}>
            Use Party Date ({partyDate ? formatDate(partyDate) : 'N/A'})
          </Text>
        </View>

        <Text style={styles.label}>Time</Text>
        <View style={styles.row}>
          <Text style={styles.timeDisplay}>{formatTime(timeValue)}</Text>
          <TouchableOpacity
            style={styles.setButton}
            onPress={() => setTimeModalVisible(true)}
          >
            <Text style={styles.setButtonText}>Set Time</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={saveEvent}>
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

        {/* Time Picker Modal */}
        <Modal visible={timeModalVisible} transparent animationType="fade">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <DateTimePicker
                value={timeValue}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedTime) => {
                  if (selectedTime) setTimeValue(selectedTime);
                }}
                textColor="#fff"
              />
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setTimeModalVisible(false)}
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
  timeDisplay: {
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 8,
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
