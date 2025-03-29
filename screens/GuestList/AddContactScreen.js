import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
  ImageBackground
} from 'react-native';
import { Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GUESTS_KEY = '@guests';

export default function AddContactScreen({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [hasDietaryRestrictions, setHasDietaryRestrictions] = useState(false);
  const [dietaryDetails, setDietaryDetails] = useState('');

  function handlePhoneChange(text) {
    const digitsOnly = text.replace(/[^\d]/g, '');
    setContactPhone(digitsOnly);
  }

  async function addGuest() {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'Please enter both first and last name.');
      return;
    }
    if (!contactPhone) {
      Alert.alert('Error', 'Please enter a phone number.');
      return;
    }
    const newGuest = {
      id: Date.now().toString(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: contactPhone.trim(),
      email: contactEmail.trim(),
      dietaryRestrictions: hasDietaryRestrictions ? dietaryDetails.trim() : 'No'
    };
    try {
      const stored = await AsyncStorage.getItem(GUESTS_KEY);
      const guestList = stored ? JSON.parse(stored) : [];
      const updatedList = [...guestList, newGuest];
      await AsyncStorage.setItem(GUESTS_KEY, JSON.stringify(updatedList));
      navigation.goBack();
    } catch (error) {
      console.warn('Failed to add contact:', error);
      Alert.alert('Error', 'Failed to add contact.');
    }
  }

  return (
    <ImageBackground
      source={require('../../assets/gradient1.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Text style={styles.title}>Add New Contact</Text>
        <TextInput
          style={styles.textInput}
          placeholder="First Name"
          placeholderTextColor="#aaa"
          value={firstName}
          onChangeText={setFirstName}
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        <TextInput
          style={styles.textInput}
          placeholder="Last Name"
          placeholderTextColor="#aaa"
          value={lastName}
          onChangeText={setLastName}
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        <TextInput
          style={styles.textInput}
          placeholder="Phone"
          placeholderTextColor="#aaa"
          value={contactPhone}
          onChangeText={handlePhoneChange}
          keyboardType="number-pad"
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        <TextInput
          style={styles.textInput}
          placeholder="Email"
          placeholderTextColor="#aaa"
          value={contactEmail}
          onChangeText={setContactEmail}
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />

        <Text style={styles.inputLabel}>Dietary Restrictions</Text>
        <View style={styles.radioContainer}>
          <TouchableOpacity
            style={styles.radioButton}
            onPress={() => setHasDietaryRestrictions(false)}
          >
            <View style={[styles.radioCircle, !hasDietaryRestrictions && styles.radioSelected]} />
            <Text style={styles.radioLabel}>No</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.radioButton}
            onPress={() => setHasDietaryRestrictions(true)}
          >
            <View style={[styles.radioCircle, hasDietaryRestrictions && styles.radioSelected]} />
            <Text style={styles.radioLabel}>Yes</Text>
          </TouchableOpacity>
        </View>
        {hasDietaryRestrictions && (
          <TextInput
            style={styles.textInput}
            placeholder="Enter dietary restrictions"
            placeholderTextColor="#aaa"
            value={dietaryDetails}
            onChangeText={setDietaryDetails}
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
        )}

        <TouchableOpacity style={styles.addButton} onPress={addGuest}>
          <Text style={styles.addButtonText}>Add Contact</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 16,
    justifyContent: 'flex-start'
  },
  title: {
    fontSize: 22,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold'
  },
  textInput: {
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 8,
    fontSize: 14,
    marginBottom: 12
  },
  addButton: {
    height: 40,
    borderRadius: 8,
    backgroundColor: 'orange',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  inputLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
    fontWeight: 'bold'
  },
  radioContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fff',
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: 'orange',
  },
  radioLabel: {
    color: '#fff',
    fontSize: 16,
  },
});
