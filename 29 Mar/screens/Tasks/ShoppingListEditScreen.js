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

const SHOPPING_KEY = '@shopping_list';

export default function ShoppingListEditScreen({ navigation: propNavigation }) {
  // Use the provided navigation prop if available; otherwise, fall back to useNavigation()
  const navigation = propNavigation || useNavigation();
  const route = useRoute();
  
  // The item to edit is passed via route.params.item
  // Also receive a callback for refreshing the list
  const { item, onItemUpdated } = route.params;

  // Local state for the entire list
  const [items, setItems] = useState([]);
  
  // Local state for the edit fields
  const [editName, setEditName] = useState(item.name);
  const [editPrice, setEditPrice] = useState(String(item.price));
  const [editQuantity, setEditQuantity] = useState(String(item.quantity));

  // Load existing shopping list from AsyncStorage on mount
  useEffect(() => {
    loadItems();
    navigation.setOptions({ title: 'Edit Item' });
  }, []);

  async function loadItems() {
    try {
      const stored = await AsyncStorage.getItem(SHOPPING_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Failed to load shopping items:', error);
    }
  }

  async function saveItems(newItems) {
    try {
      await AsyncStorage.setItem(SHOPPING_KEY, JSON.stringify(newItems));
      setItems(newItems);
    } catch (error) {
      console.warn('Failed to save shopping items:', error);
      Alert.alert('Error', 'Failed to save shopping items.');
    }
  }

  function handleSaveChanges() {
    if (!editName.trim() || !editPrice.trim() || !editQuantity.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    const parsedPrice = parseFloat(editPrice);
    const parsedQuantity = parseFloat(editQuantity);
    if (isNaN(parsedPrice) || isNaN(parsedQuantity)) {
      Alert.alert('Error', 'Price and quantity must be numbers.');
      return;
    }

    const updatedList = items.map(listItem => {
      if (listItem.id === item.id) {
        const newTotal = parsedPrice * parsedQuantity;
        return {
          ...listItem,
          name: editName.trim(),
          price: parsedPrice,
          quantity: parsedQuantity,
          total: newTotal,
        };
      }
      return listItem;
    });

    saveItems(updatedList);
    if (onItemUpdated) {
      onItemUpdated(); // refresh the shopping list in the previous screen
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
        {/* Labels for each input */}
        <Text style={styles.inputLabel}>Item Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Item Name"
          placeholderTextColor="#aaa"
          value={editName}
          onChangeText={setEditName}
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />

        <Text style={styles.inputLabel}>Price</Text>
        <TextInput
          style={styles.input}
          placeholder="Price"
          placeholderTextColor="#aaa"
          value={editPrice}
          onChangeText={setEditPrice}
          keyboardType="numeric"
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />

        <Text style={styles.inputLabel}>Quantity</Text>
        <TextInput
          style={styles.input}
          placeholder="Quantity"
          placeholderTextColor="#aaa"
          value={editQuantity}
          onChangeText={setEditQuantity}
          keyboardType="numeric"
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
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
  inputLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  input: {
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 8,
    fontSize: 14,
    marginBottom: 12,
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
