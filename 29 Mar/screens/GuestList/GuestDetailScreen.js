import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Linking,
  ImageBackground,
  Keyboard,
} from 'react-native';
import { Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GUESTS_KEY = '@guests';

export default function GuestDetailScreen({ route, navigation }) {
  const { guestId } = route.params || {};
  const [guest, setGuest] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  // dietaryRestrictions will be a string; if 'No' then no dietary restrictions.
  const [dietaryRestrictions, setDietaryRestrictions] = useState('No');

  // Additional state for editing dietary restrictions:
  const [hasDietary, setHasDietary] = useState(false);
  const [dietaryDetails, setDietaryDetails] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          <Text style={styles.headerRightText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, isEditing]);

  useEffect(() => {
    if (guestId) {
      loadGuest(guestId);
    }
  }, [guestId]);

  async function loadGuest(id) {
    try {
      const stored = await AsyncStorage.getItem(GUESTS_KEY);
      if (stored) {
        const all = JSON.parse(stored);
        const found = all.find(g => g.id === id);
        if (found) {
          setGuest(found);
          setFirstName(found.firstName || '');
          setLastName(found.lastName || '');
          setPhone(found.phone || '');
          setEmail(found.email || '');
          setDietaryRestrictions(found.dietaryRestrictions || 'No');
          const hasDiet = (found.dietaryRestrictions && found.dietaryRestrictions !== 'No');
          setHasDietary(hasDiet);
          setDietaryDetails(hasDiet ? found.dietaryRestrictions : '');
        }
      }
    } catch (error) {
      console.warn(error);
    }
  }

  async function saveEdits() {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'Please enter both first and last name.');
      return;
    }
    try {
      const stored = await AsyncStorage.getItem(GUESTS_KEY);
      if (!stored) return;
      const all = JSON.parse(stored);
      const idx = all.findIndex(g => g.id === guestId);
      if (idx !== -1) {
        all[idx].firstName = firstName.trim();
        all[idx].lastName = lastName.trim();
        all[idx].phone = phone.trim();
        all[idx].email = email.trim();
        // Save dietary restrictions: if hasDietary is true, save dietaryDetails; otherwise, 'No'
        all[idx].dietaryRestrictions = hasDietary ? dietaryDetails.trim() : 'No';
        await AsyncStorage.setItem(GUESTS_KEY, JSON.stringify(all));
        setGuest(all[idx]);
      }
    } catch (error) {
      console.warn(error);
    }
    setIsEditing(false);
  }

  function openWhatsApp() {
    if (!phone) {
      Alert.alert('Error', 'No phone number available.');
      return;
    }
    const url = `whatsapp://send?phone=${phone}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'WhatsApp not installed or phone number invalid.');
    });
  }

  if (!guest) {
    return (
      <ImageBackground
        source={require('../../assets/gradient1.jpg')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View style={styles.detailContainer}>
          <Text style={styles.detailTitle}>No guest found</Text>
        </View>
      </ImageBackground>
    );
  }

  if (isEditing) {
    return (
      <ImageBackground
        source={require('../../assets/gradient1.jpg')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View style={styles.detailContainer}>
          <Text style={styles.detailTitle}>Edit Guest</Text>
          <TextInput
            style={styles.textInput}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First Name"
          />
          <TextInput
            style={styles.textInput}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last Name"
          />
          <TextInput
            style={styles.textInput}
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone"
            keyboardType="number-pad"
          />
          <TextInput
            style={styles.textInput}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
          />
          {/* Dietary Restrictions Field */}
          <Text style={styles.inputLabel}>Dietary Restrictions</Text>
          <View style={styles.radioContainer}>
            <TouchableOpacity
              style={styles.radioButton}
              onPress={() => {
                setHasDietary(false);
                setDietaryDetails('');
              }}
            >
              <View style={[styles.radioCircle, !hasDietary && styles.radioSelected]} />
              <Text style={styles.radioLabel}>No</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.radioButton}
              onPress={() => setHasDietary(true)}
            >
              <View style={[styles.radioCircle, hasDietary && styles.radioSelected]} />
              <Text style={styles.radioLabel}>Yes</Text>
            </TouchableOpacity>
          </View>
          {hasDietary && (
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

          <View style={{ marginTop: 16 }}>
            <TouchableOpacity style={[styles.saveButton, { width: '100%' }]} onPress={saveEdits}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    );
  }

  const displayName = `${guest.firstName} ${guest.lastName}`.trim();
  return (
    <ImageBackground
      source={require('../../assets/gradient1.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={[styles.detailContainer, { justifyContent: 'flex-start' }]}>
        <Text style={styles.detailTitle}>{displayName}</Text>
        <Text style={styles.detailText}>
          <Text style={styles.boldLabel}>Phone:</Text> {guest.phone || 'N/A'}
        </Text>
        <Text style={styles.detailText}>
          <Text style={styles.boldLabel}>Email:</Text> {guest.email || 'N/A'}
        </Text>
        <Text style={styles.detailText}>
          <Text style={styles.boldLabel}>Dietary Restrictions:</Text> {guest.dietaryRestrictions || 'No'}
        </Text>
        <TouchableOpacity style={styles.waButton} onPress={openWhatsApp}>
          <Text style={styles.waButtonText}>Contact in WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  headerRightText: {
    color: 'white',
    fontSize: 16,
    marginRight: 10,
  },
  detailContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 16,
    justifyContent: 'flex-start',
  },
  detailTitle: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 10,
    fontWeight: '700',
  },
  detailText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
  },
  boldLabel: {
    fontWeight: 'bold',
    color: '#fff',
  },
  textInput: {
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    marginBottom: 8,
  },
  saveButton: {
    width: 80,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'orange',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  waButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#128C7E',
    borderRadius: 8,
    alignItems: 'center',
  },
  waButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
    fontWeight: 'bold',
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
