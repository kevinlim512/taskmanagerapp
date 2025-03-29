import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
  ImageBackground,
} from 'react-native';
import { Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';

const INVITES_KEY = '@invitations';

export default function EditInvitationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { item, onItemUpdated } = route.params;
  
  const [editText, setEditText] = useState(item.text);
  const [invitations, setInvitations] = useState([]);

  useEffect(() => {
    loadInvitations();
    navigation.setOptions({ title: 'Edit Invitation' });
  }, []);

  async function loadInvitations() {
    try {
      const stored = await AsyncStorage.getItem(INVITES_KEY);
      if (stored) {
        setInvitations(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Failed to load invitations:', error);
    }
  }

  async function saveInvitations(newInvitations) {
    try {
      await AsyncStorage.setItem(INVITES_KEY, JSON.stringify(newInvitations));
      setInvitations(newInvitations);
    } catch (error) {
      console.warn('Failed to save invitations:', error);
      Alert.alert('Error', 'Failed to save invitation changes.');
    }
  }

  function handleSave() {
    if (!editText.trim()) {
      Alert.alert('Error', 'Please enter invitation text.');
      return;
    }
    const updatedInvitations = invitations.map(inv => {
      if (inv.id === item.id) {
        return { ...inv, text: editText.trim() };
      }
      return inv;
    });
    saveInvitations(updatedInvitations);
    if (onItemUpdated) {
      onItemUpdated();
    }
    navigation.goBack();
  }

  function handleCancel() {
    navigation.goBack();
  }

  return (
    <ImageBackground
      source={require('../../assets/gradient1.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder="Edit Invitation Text"
          placeholderTextColor="#aaa"
          value={editText}
          onChangeText={setEditText}
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
          multiline
        />
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.saveButtonText}>Cancel</Text>
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
    justifyContent: 'flex-start',
  },
  input: {
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: 'orange',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButton: {
    backgroundColor: 'grey',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
