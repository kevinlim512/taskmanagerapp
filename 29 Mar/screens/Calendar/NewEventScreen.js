// NewEventScreen.js
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

export default function NewEventScreen({ navigation, route }) {
  const { selectedDate } = route.params || { selectedDate: '' };
  const [eventTitle, setEventTitle] = useState('');
  // Use selectedDate if provided, otherwise current date.
  const [dateValue, setDateValue] = useState(
    selectedDate ? new Date(selectedDate) : new Date()
  );
  const [timeValue, setTimeValue] = useState(new Date());
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);

  // "Use Party Date" checkbox state and party date state
  const [usePartyDate, setUsePartyDate] = useState(false);
  const [partyDate, setPartyDate] = useState(null);

  // Load the party date from AsyncStorage
  useEffect(() => {
    async function loadPartyDate() {
      try {
        const storedInfo = await AsyncStorage.getItem(PARTY_INFO_KEY);
        if (storedInfo) {
          const info = JSON.parse(storedInfo);
          if (info.date) {
            const isoDate = new Date(info.date);
            setPartyDate(isoDate);
          }
        }
      } catch (error) {
        console.warn('Failed to load party date:', error);
      }
    }
    loadPartyDate();
  }, []);

  // If "Use Party Date" is enabled and partyDate changes, update dateValue automatically.
  useEffect(() => {
    if (usePartyDate && partyDate) {
      setDateValue(partyDate);
    }
  }, [partyDate, usePartyDate]);

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

  async function addEvent() {
    if (!dateValue) {
      Alert.alert('Error', 'Please select a date.');
      return;
    }
    if (!eventTitle.trim()) {
      Alert.alert('Error', 'Please enter an event title.');
      return;
    }
    // Combine the selected date and time into one Date object.
    const combined = new Date(
      dateValue.getFullYear(),
      dateValue.getMonth(),
      dateValue.getDate(),
      timeValue.getHours(),
      timeValue.getMinutes(),
      timeValue.getSeconds()
    );
    const newEvent = {
      id: Date.now().toString(),
      title: eventTitle.trim(),
      datetime: combined.toISOString(),
      usePartyDate: usePartyDate,
    };

    try {
      const stored = await AsyncStorage.getItem(EVENTS_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      const eventsArray = Array.isArray(parsed) ? parsed : [];
      eventsArray.push(newEvent);
      await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(eventsArray));
      navigation.goBack();
    } catch (error) {
      console.warn(error);
    }
  }

  // Toggle the "Use Party Date" checkbox.
  const handleUsePartyDateToggle = () => {
    const newVal = !usePartyDate;
    setUsePartyDate(newVal);
    if (newVal && partyDate) {
      setDateValue(partyDate);
    }
  };

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
          placeholder="Enter event title"
          placeholderTextColor="#aaa"
          value={eventTitle}
          onChangeText={setEventTitle}
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />

        {/* Date selection UI */}
        <Text style={styles.label}>Date</Text>
        <View style={styles.dateRow}>
          <Text style={styles.dateDisplay}>{formatDate(dateValue)}</Text>
          <TouchableOpacity
            style={[
              styles.setDateButton,
              usePartyDate && { opacity: 0.4 },
            ]}
            disabled={usePartyDate}
            onPress={() => setDateModalVisible(true)}
          >
            <Text style={styles.setDateButtonText}>Set Date</Text>
          </TouchableOpacity>
        </View>

        {/* Checkbox below the displayed date */}
        <View style={[styles.checkboxRow, { marginTop: 2 }]}>
          <Checkbox.Android
            testID="usePartyDateCheckbox"
            status={usePartyDate ? 'checked' : 'unchecked'}
            onPress={handleUsePartyDateToggle}
            color="orange"
            uncheckedColor="#fff"
          />
          <Text style={styles.checkboxLabel}>
            Use Party Date ({partyDate ? formatDate(partyDate) : 'N/A'})
          </Text>
        </View>

        {/* Time selection UI */}
        <Text style={styles.label}>Time</Text>
        <View style={styles.timeRow}>
          <Text style={styles.timeDisplay}>{formatTime(timeValue)}</Text>
          <TouchableOpacity
            style={styles.setTimeButton}
            onPress={() => setTimeModalVisible(true)}
          >
            <Text style={styles.setTimeButtonText}>Set Time</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={addEvent}>
          <Text style={styles.addButtonText}>Add Event</Text>
        </TouchableOpacity>

        {/* Time Modal */}
        <Modal visible={timeModalVisible} transparent animationType="fade">
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, styles.pickerBackground]}>
              <DateTimePicker
                value={timeValue}
                mode="time"
                onChange={(event, selected) => {
                  if (selected) setTimeValue(selected);
                }}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                textColor="white"
              />
              <TouchableOpacity
                style={styles.modalDoneButton}
                onPress={() => setTimeModalVisible(false)}
              >
                <Text style={styles.modalDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Date Modal */}
        <Modal visible={dateModalVisible} transparent animationType="fade">
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, styles.pickerBackground]}>
              <DateTimePicker
                value={dateValue || new Date()}
                mode="date"
                onChange={(event, selected) => {
                  if (selected) setDateValue(selected);
                }}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                textColor="white"
              />
              <TouchableOpacity
                style={styles.modalDoneButton}
                onPress={() => setDateModalVisible(false)}
              >
                <Text style={styles.modalDoneText}>Done</Text>
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
    backgroundColor: 'transparent',
    padding: 16,
  },
  label: {
    fontSize: 16,
    color: '#0d1652',
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateDisplay: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeDisplay: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
  },
  setTimeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
    backgroundColor: 'transparent',
  },
  setTimeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: 'orange',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
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
