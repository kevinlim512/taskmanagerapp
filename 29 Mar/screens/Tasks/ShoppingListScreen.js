import React, { useState, useEffect, useRef, memo } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
  ImageBackground,
  Animated,
} from 'react-native';
import { Text, Card, Checkbox } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

const SHOPPING_KEY = '@shopping_list';

// Memoized header component to prevent unnecessary re-mounts.
const AddItemFields = memo(function AddItemFields({
  itemName,
  price,
  quantity,
  setItemName,
  setPrice,
  setQuantity,
  addItem,
}) {
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.sectionHeader}>Add Shopping List Item</Text>
      <View style={styles.inputContainer}>
        <TextInput
          key="itemNameInput"
          style={styles.input}
          placeholder="Item Name"
          placeholderTextColor="#aaa"
          value={itemName}
          onChangeText={setItemName}
          returnKeyType="done"
          blurOnSubmit={false}
        />
        <TextInput
          key="priceInput"
          style={styles.input}
          placeholder="Price"
          placeholderTextColor="#aaa"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        <TextInput
          key="quantityInput"
          style={styles.input}
          placeholder="Quantity"
          placeholderTextColor="#aaa"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        <TouchableOpacity style={styles.addButton} onPress={addItem}>
          <Text style={styles.addButtonText}>Add Item</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.sectionHeader, { paddingTop: 16, marginBottom: 0 }]}>
        Shopping List
      </Text>
    </View>
  );
});

export default function ShoppingListScreen({ isEditing }) {
  const [items, setItems] = useState([]);
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const navigation = useNavigation();

  // Animated value for fading the card area
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const stored = await AsyncStorage.getItem(SHOPPING_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Failed to load shopping items:', error);
    }
  };

  const saveItems = async (newItems) => {
    try {
      await AsyncStorage.setItem(SHOPPING_KEY, JSON.stringify(newItems));
      setItems(newItems);
    } catch (error) {
      console.warn('Failed to save shopping items:', error);
    }
  };

  const addItem = () => {
    if (!itemName.trim() || !price.trim() || !quantity.trim()) {
      Alert.alert(
        'Error',
        'Please enter item name, price and quantity.'
      );
      return;
    }
    const parsedPrice = parseFloat(price);
    const parsedQuantity = parseFloat(quantity);
    if (isNaN(parsedPrice) || isNaN(parsedQuantity)) {
      Alert.alert('Error', 'Price and quantity must be numbers.');
      return;
    }
    const newItem = {
      id: Date.now().toString(),
      name: itemName.trim(),
      price: parsedPrice,
      quantity: parsedQuantity,
      total: parsedPrice * parsedQuantity,
      completed: false,
    };
    const updated = [...items, newItem];
    saveItems(updated);
    setItemName('');
    setPrice('');
    setQuantity('');
  };

  const deleteItem = (id) => {
    const updated = items.filter((item) => item.id !== id);
    saveItems(updated);
  };

  const toggleShoppingItem = (id) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });
    saveItems(updated);
  };

  // Render each shopping item
  const renderItem = ({ item, drag }) => (
    <Card style={styles.itemCard}>
      <Card.Content style={styles.itemRow}>
        {item.completed ? (
          <Checkbox.Android
            status="checked"
            onPress={() => toggleShoppingItem(item.id)}
            color="orange"
            uncheckedColor="#000"
            style={styles.checkIcon}
          />
        ) : (
          <Checkbox.Android
            status="unchecked"
            onPress={() => toggleShoppingItem(item.id)}
            color="orange"
            uncheckedColor="#000"
            style={styles.checkIcon}
          />
        )}
        <View style={styles.itemDetails}>
          <Text style={[styles.itemName, item.completed && { color: 'grey' }]}>
            {item.name}
          </Text>
          <Text style={styles.itemInfo}>Price: ${item.price.toFixed(2)}</Text>
          <Text style={styles.itemInfo}>Quantity: {item.quantity}</Text>
          <Text style={styles.itemInfo}>
            Total: ${item.total.toFixed(2)}
          </Text>
        </View>
        {isEditing && (
          <View style={styles.editIconsContainer}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('ShoppingListEditScreen', {
                  item,
                  onItemUpdated: loadItems,
                })
              }
              style={styles.editIcon}
            >
              <MaterialIcons name="edit" size={24} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => deleteItem(item.id)}
              style={styles.editIcon}
            >
              <MaterialIcons name="delete" size={24} color="red" />
            </TouchableOpacity>
            <TouchableOpacity onPressIn={drag} style={styles.dragHandle}>
              <MaterialIcons name="drag-handle" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

  // Footer showing the grand total
  const ListFooter = () => (
    <View style={styles.footerContainer}>
      <Text style={styles.footerText}>Grand Total: ${grandTotal.toFixed(2)}</Text>
      <View style={{ height: 20 }} />
    </View>
  );

  // Fade out then fade in to avoid flashing
  const handleDragEnd = ({ data }) => {
    saveItems(data);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  return (
    <ImageBackground
      source={require('../../assets/gradient1.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <DraggableFlatList
            data={items}
            keyExtractor={(item) => item.id}
            onDragEnd={handleDragEnd}
            renderItem={renderItem}
            ListHeaderComponent={
              <AddItemFields
                itemName={itemName}
                price={price}
                quantity={quantity}
                setItemName={setItemName}
                setPrice={setPrice}
                setQuantity={setQuantity}
                addItem={addItem}
              />
            }
            ListFooterComponent={<ListFooter />}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
          />
        </Animated.View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  headerContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: 'transparent',
    marginBottom: 16,
  },
  input: {
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 8,
    fontSize: 14,
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: 'orange',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemCard: {
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 3,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  checkIcon: {
    marginRight: 8,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    color: '#000',
    fontWeight: 'bold',
  },
  itemInfo: {
    fontSize: 16,
    color: '#333',
  },
  editIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editIcon: {
    marginRight: 8,
  },
  dragHandle: {
    marginLeft: 4,
  },
  footerContainer: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
    marginTop: 10,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});
