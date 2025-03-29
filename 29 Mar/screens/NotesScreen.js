import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ImageBackground
} from 'react-native';
import { Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

const NOTES_KEY = '@notes';

export default function NotesScreen({ navigation }) {
  const [notes, setNotes] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  // Load notes from AsyncStorage
  const loadNotes = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTES_KEY);
      if (stored) {
        setNotes(JSON.parse(stored));
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to load notes.');
    }
  };

  // Save notes to AsyncStorage
  const saveNotes = async (newNotes) => {
    try {
      setNotes(newNotes);
      await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(newNotes));
    } catch (e) {
      Alert.alert('Error', 'Failed to save notes.');
    }
  };

  // On component mount (and on focus), load notes
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadNotes();
    });
    return unsubscribe;
  }, [navigation]);

  // Customize header with an Edit/Done button
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          <Text style={styles.headerButtonText}>
            {isEditing ? 'Done' : 'Edit'}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, isEditing]);

  // Create a new note and navigate to edit it
  const createNewNote = async () => {
    const newNote = { id: Date.now().toString(), text: '' };
    const updatedNotes = [newNote, ...notes];
    await saveNotes(updatedNotes);
    navigation.navigate('EditNote', { note: newNote });
  };

  // Delete note
  const handleDelete = async (id) => {
    const updatedNotes = notes.filter(n => n.id !== id);
    await saveNotes(updatedNotes);
  };

  // Render a single note
  const renderItem = ({ item }) => (
    <View style={styles.noteItemContainer}>
      <TouchableOpacity
        style={styles.noteItem}
        onPress={() => navigation.navigate('EditNote', { note: item })}
      >
        <Text style={styles.noteText}>{item.text || 'New Note'}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item.id)}
        testID="delete-button" // needed for tests
      >
        {isEditing && (
          <MaterialIcons name="delete" size={24} color="red" />
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <ImageBackground
      source={require('../assets/gradient1.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.topBar} />
        <TouchableOpacity style={styles.createButton} onPress={createNewNote}>
          <Text style={styles.createButtonText}>Create New Note</Text>
        </TouchableOpacity>

        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topBar: {
    paddingBottom: 16,
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginHorizontal: 16,
  },
  createButton: {
    backgroundColor: 'orange',
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  noteText: {
    fontSize: 16,
    color: '#000',
  },
  headerButtonText: {
    fontSize: 16,
    color: 'orange',
    fontWeight: 'bold',
    marginRight: 16,
  },
  noteItemContainer: {
    flexDirection: 'row',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
    alignItems: 'center',
  },
  noteItem: {
    flex: 1,
    padding: 16,
  },
  deleteButton: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
