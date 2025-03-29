import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
} from 'react-native';
import { Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTES_KEY = '@notes';

export default function EditNoteScreen({ navigation, route }) {
  const { note } = route.params;
  const [text, setText] = useState(note.text);

  const saveNote = async () => {
    try {
      // 1. Retrieve existing notes from AsyncStorage
      const stored = await AsyncStorage.getItem(NOTES_KEY);
      let notes = stored ? JSON.parse(stored) : [];

      // 2. Find and update the specific note
      notes = notes.map((n) => (n.id === note.id ? { ...n, text } : n));

      // 3. Save updated notes back to AsyncStorage
      await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));

      // 4. Navigate back
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Could not save note');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.textInput}
        value={text}
        onChangeText={setText}
        placeholder="New Note"
        multiline
        autoFocus
        returnKeyType="done"
        onSubmitEditing={() => Keyboard.dismiss()}
      />
      <TouchableOpacity style={styles.saveButton} onPress={saveNote}>
        <Text style={styles.saveButtonText}>Save Note</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'transparent',
  },
  textInput: {
    height: 200,
    fontSize: 18,
    textAlignVertical: 'top',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: 'orange',
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
