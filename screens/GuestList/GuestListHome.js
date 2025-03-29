import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, ImageBackground } from 'react-native';
import { Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

const GUESTS_KEY = '@guests';

const DeleteButton = ({ onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.deleteButtonContainer}>
    <View style={styles.deleteButtonSquare}>
      <MaterialIcons name="delete" size={24} color="red" />
    </View>
  </TouchableOpacity>
);

export default function GuestListHome({ navigation }) {
  const [guests, setGuests] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const isFocused = useIsFocused();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          <Text style={styles.headerButtonText}>{isEditing ? 'Done' : 'Edit'}</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, isEditing]);

  useEffect(() => {
    if (isFocused) {
      loadGuests();
    }
  }, [isFocused]);

  async function loadGuests() {
    try {
      const stored = await AsyncStorage.getItem(GUESTS_KEY);
      if (stored) {
        const guestList = JSON.parse(stored);
        // Sort by surname (lastName) then firstName (both case-insensitive)
        const sortedGuests = guestList.sort((a, b) => {
          const surnameA = (a.lastName || "").toLowerCase();
          const surnameB = (b.lastName || "").toLowerCase();
          if (surnameA < surnameB) return -1;
          if (surnameA > surnameB) return 1;
          const firstNameA = (a.firstName || "").toLowerCase();
          const firstNameB = (b.firstName || "").toLowerCase();
          if (firstNameA < firstNameB) return -1;
          if (firstNameA > firstNameB) return 1;
          return 0;
        });
        setGuests(sortedGuests);
      } else {
        setGuests([]);
      }
    } catch (error) {
      console.warn('Failed to load guests:', error);
    }
  }

  async function saveGuests(newList) {
    setGuests(newList);
    try {
      await AsyncStorage.setItem(GUESTS_KEY, JSON.stringify(newList));
    } catch (error) {
      console.warn('Failed to save guests:', error);
    }
  }

  function deleteGuest(id) {
    const updated = guests.filter(g => g.id !== id);
    saveGuests(updated);
  }

  function renderItem({ item }) {
    const displayName =
      `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'No Name';

    return (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          item.dietaryRestrictions && item.dietaryRestrictions !== 'No'
            ? styles.itemContainerWithDiet
            : null,
        ]}
        onPress={() => navigation.navigate('GuestDetail', { guestId: item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.itemContent}>
          <Text style={styles.itemText}>{displayName}</Text>
          {item.dietaryRestrictions && item.dietaryRestrictions !== 'No' && (
            <Text style={styles.dietaryIndicator}>
              <Text style={styles.redDot}>●</Text> {item.dietaryRestrictions}
            </Text>
          )}
        </View>
        {isEditing && (
          <DeleteButton onPress={() => deleteGuest(item.id)} />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/gradient1.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <FlatList
          data={guests}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
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
  headerButtonText: {
    fontSize: 16,
    color: 'orange',
    fontWeight: 'bold',
    marginRight: 16,
  },
  listContainer: {
    paddingBottom: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 10,
    height: 60,
    position: 'relative',
  },
  itemContainerWithDiet: {
    height: 70,
  },
  itemContent: {
    flex: 1,
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 18,
    color: '#000',
    textAlign: 'left',
  },
  dietaryIndicator: {
    fontSize: 12,
    color: '#333',
    textAlign: 'left',
  },
  redDot: {
    color: 'red',
    fontSize: 12,
  },
  deleteButtonContainer: {
    position: 'absolute',
    right: 4,
    top: 0,
    bottom: 0,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonSquare: {
    width: 40,
    height: '100%',
    backgroundColor: 'white',
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
