// PartyScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
  Keyboard,
  ImageBackground,
} from 'react-native';
import { Text } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PARTY_INFO_KEY = '@party_info';
const EVENTS_KEY = '@events';

export default function PartyScreen() {
  const [partyName, setPartyName] = useState('');
  const [date, setDate] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [isEditing, setIsEditing] = useState(true);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  // Load persisted party info on mount.
  useEffect(() => {
    async function loadPartyInfo() {
      try {
        const storedInfo = await AsyncStorage.getItem(PARTY_INFO_KEY);
        if (storedInfo) {
          const info = JSON.parse(storedInfo);
          setPartyName(info.partyName || '');
          setDate(info.date ? new Date(info.date) : null);
          setStartTime(info.startTime ? new Date(info.startTime) : null);
          setEndTime(info.endTime ? new Date(info.endTime) : null);
          setVenue(info.venue || '');
          setAddress(info.address || '');
          setIsEditing(false);
        }
      } catch (error) {
        console.error('Error loading party info:', error);
      }
    }
    loadPartyInfo();
  }, []);

  function requiredFieldsFilled() {
    return (
      partyName.trim() &&
      date &&
      startTime &&
      endTime &&
      venue.trim()
    );
  }

  // After saving party info, update events that use party date.
  async function updateEventsWithPartyDate(newPartyDate) {
    try {
      const storedEvents = await AsyncStorage.getItem(EVENTS_KEY);
      if (storedEvents) {
        let events = JSON.parse(storedEvents);
        if (!Array.isArray(events)) events = [];
        const updatedEvents = events.map(ev => {
          // If event has usePartyDate enabled, update its date portion
          if (ev.usePartyDate && newPartyDate) {
            const oldDate = new Date(ev.datetime);
            const updatedDate = new Date(
              newPartyDate.getFullYear(),
              newPartyDate.getMonth(),
              newPartyDate.getDate(),
              oldDate.getHours(),
              oldDate.getMinutes(),
              oldDate.getSeconds()
            );
            return { ...ev, datetime: updatedDate.toISOString() };
          }
          return ev;
        });
        await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(updatedEvents));
      }
    } catch (error) {
      console.warn('Error updating events with new party date:', error);
    }
  }

  async function handleSave() {
    if (!requiredFieldsFilled()) {
      Alert.alert(
        'Error',
        'Please fill in the required fields: Name, Date, Start Time, End Time, Venue.'
      );
      return;
    }
    const info = {
      partyName: partyName.trim(),
      date: date.toISOString(),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      venue: venue.trim(),
      address: address.trim()
    };
    try {
      await AsyncStorage.setItem(PARTY_INFO_KEY, JSON.stringify(info));
      setIsEditing(false);
      // After saving, update events that have usePartyDate enabled
      updateEventsWithPartyDate(date);
    } catch (error) {
      console.error('Error saving party info:', error);
      Alert.alert('Error', 'Failed to save party information.');
    }
  }

  const hasSomeData =
    partyName || date || startTime || endTime || venue || address;

  function formatTime(d) {
    let hours = d.getHours();
    let minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const minStr = minutes < 10 ? `0${minutes}` : minutes;
    return `${hours}:${minStr} ${ampm}`;
  }

  // Branch: No party info and not editing
  if (!hasSomeData && !isEditing) {
    return (
      <ImageBackground
        source={require('../assets/gradient1.jpg')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View style={styles.partyContainer}>
          <View style={styles.partyBox}>
            <Text style={styles.title}>No Party Information</Text>
            <Text style={styles.subtitle}>Please add your party details.</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setIsEditing(true)}
            >
              <Text style={{ color: '#fff' }}>Add Party Info</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    );
  }

  // Branch: Editing party info
  if (isEditing) {
    return (
      <ImageBackground
        source={require('../assets/gradient1.jpg')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View style={styles.partyContainer}>
          <View style={styles.partyBox}>
            <Text style={styles.title}>Party Information</Text>

            <Text style={styles.label}>Party Name (required)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. John's Birthday Bash"
              placeholderTextColor="#aaa"
              value={partyName}
              onChangeText={setPartyName}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
            />

            <Text style={styles.label}>Date (required)</Text>
            <TouchableOpacity
              style={styles.fakeInput}
              onPress={() => setShowDateModal(true)}
            >
              <Text style={{ color: date ? '#000' : '#aaa' }}>
                {date ? date.toDateString() : 'Select date'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Start Time (required)</Text>
            <TouchableOpacity
              style={styles.fakeInput}
              onPress={() => setShowStartModal(true)}
            >
              <Text style={{ color: startTime ? '#000' : '#aaa' }}>
                {startTime ? formatTime(startTime) : 'Select start time'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>End Time (required)</Text>
            <TouchableOpacity
              style={styles.fakeInput}
              onPress={() => setShowEndModal(true)}
            >
              <Text style={{ color: endTime ? '#000' : '#aaa' }}>
                {endTime ? formatTime(endTime) : 'Select end time'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Venue (required)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Sunny Park"
              placeholderTextColor="#aaa"
              value={venue}
              onChangeText={setVenue}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
            />

            <Text style={styles.label}>Address (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Street address"
              placeholderTextColor="#aaa"
              value={address}
              onChangeText={setAddress}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
            />

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>

          {/* DATE MODAL */}
          <Modal visible={showDateModal} transparent animationType="fade">
            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, styles.pickerBackground]}>
                <DateTimePicker
                  value={date || new Date()}
                  mode="date"
                  onChange={(event, selected) => {
                    if (selected) {
                      setDate(selected);
                    }
                  }}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  textColor="white"
                />
                <TouchableOpacity
                  style={styles.modalDoneButton}
                  onPress={() => setShowDateModal(false)}
                >
                  <Text style={styles.modalDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* START TIME MODAL */}
          <Modal visible={showStartModal} transparent animationType="fade">
            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, styles.pickerBackground]}>
                <DateTimePicker
                  value={startTime || new Date()}
                  mode="time"
                  onChange={(event, selected) => {
                    if (selected) {
                      setStartTime(selected);
                    }
                  }}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  textColor="white"
                />
                <TouchableOpacity
                  style={styles.modalDoneButton}
                  onPress={() => setShowStartModal(false)}
                >
                  <Text style={styles.modalDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* END TIME MODAL */}
          <Modal visible={showEndModal} transparent animationType="fade">
            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, styles.pickerBackground]}>
                <DateTimePicker
                  value={endTime || new Date()}
                  mode="time"
                  onChange={(event, selected) => {
                    if (selected) {
                      setEndTime(selected);
                    }
                  }}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  textColor="white"
                />
                <TouchableOpacity
                  style={styles.modalDoneButton}
                  onPress={() => setShowEndModal(false)}
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

  // Display saved party info when not editing.
  return (
    <ImageBackground
      source={require('../assets/gradient1.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={styles.partyContainer}>
        <View style={styles.partyBox}>
          <Text style={styles.bigText}>{partyName}</Text>
          <Text style={styles.mediumText}>
            Date: {date ? date.toDateString() : 'N/A'}
          </Text>
          <Text style={styles.mediumText}>
            Start: {startTime ? formatTime(startTime) : 'N/A'}
          </Text>
          <Text style={styles.mediumText}>
            End: {endTime ? formatTime(endTime) : 'N/A'}
          </Text>
          <Text style={styles.mediumText}>
            Venue: {venue || 'N/A'}
          </Text>
          {address ? (
            <Text style={styles.mediumText}>Address: {address}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.button, { marginTop: 12 }]}
            onPress={() => setIsEditing(true)}
          >
            <Text style={{ color: '#fff' }}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  partyContainer: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  partyBox: {
    width: '100%',
    backgroundColor: '#0d1652',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    color: '#fff',
    marginBottom: 8,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 12,
  },
  button: {
    backgroundColor: 'orange',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 8,
    alignSelf: 'center',
  },
  saveButton: {
    height: 50,
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  label: {
    width: '100%',
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
    textAlign: 'left',
  },
  input: {
    width: '100%',
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  fakeInput: {
    width: '100%',
    height: 40,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 12,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  bigText: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  mediumText: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 4,
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
    padding: 16,
    alignItems: 'center',
  },
  pickerBackground: {
    backgroundColor: '#0d1652',
  },
  modalDoneButton: {
    backgroundColor: 'orange',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 12,
  },
  modalDoneText: {
    color: '#fff',
    fontSize: 16,
  },
});
