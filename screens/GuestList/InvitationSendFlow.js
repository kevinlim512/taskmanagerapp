import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Share,
  Linking,
  ImageBackground,
} from 'react-native';
import { Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Device from 'expo-device';

const INVITES_KEY = '@invitations';
const GUESTS_KEY = '@guests';

// Screen 1: Select Invitation to Send
function SelectInvitationScreen() {
  const [invitations, setInvitations] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      const stored = await AsyncStorage.getItem(INVITES_KEY);
      if (stored) {
        setInvitations(JSON.parse(stored));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load invitations.');
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.inviteCard}
      onPress={() => navigation.navigate('SendMethod', { invitation: item })}
    >
      <Text style={styles.inviteText} numberOfLines={3} ellipsizeMode="tail">
        {item.text}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ImageBackground
      source={require('../../assets/gradient1.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.containerTopAligned}>
        <Text style={styles.title}>Select Invitation to Send</Text>
        <FlatList
          data={invitations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      </View>
    </ImageBackground>
  );
}

// Screen 2: Choose Sending Method
function SendMethodScreen() {
  const navigation = useNavigation();
  const { invitation } = useRoute().params;

  const handleShare = async () => {
    try {
      await Share.share({
        message: invitation.text,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to open share menu.');
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/gradient1.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.containerTopAligned}>
        <Text style={styles.title}>Choose How to Send</Text>
        <TouchableOpacity style={styles.button} onPress={handleShare}>
          <Text style={styles.buttonText}>Send with Share Menu</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { marginTop: 16, backgroundColor: '#128C7E' }]}
          onPress={() => navigation.navigate('SendWhatsapp', { invitation })}
        >
          <Text style={styles.buttonText}>Send to Guest via WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

// Screen 3: Send via WhatsApp (Contact Selection Only)
function SendWhatsappScreen() {
  const { invitation } = useRoute().params;
  const [guests, setGuests] = useState([]);

  useEffect(() => {
    loadGuests();
  }, []);

  const loadGuests = async () => {
    try {
      const stored = await AsyncStorage.getItem(GUESTS_KEY);
      if (stored) {
        setGuests(JSON.parse(stored));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load contacts.');
    }
  };

  const handleContactPress = (phone) => {
    if (!phone) {
      Alert.alert('Error', 'Contact has no phone number.');
      return;
    }
    const url = `https://wa.me/${phone.trim()}?text=${encodeURIComponent(invitation.text)}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (!supported) {
          Alert.alert('Error', 'WhatsApp is not installed or cannot be opened.');
        } else {
          return Linking.openURL(url);
        }
      })
      .catch(() => Alert.alert('Error', 'Failed to open WhatsApp.'));
  };

  const renderContact = ({ item }) => {
    const displayName = `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'No Name';
    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => handleContactPress(item.phone)}
        activeOpacity={0.8}
      >
        <View style={styles.itemContent}>
          <Text style={styles.itemText}>{displayName}</Text>
          <Text style={styles.phoneText}>{item.phone}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ImageBackground
      source={require('../../assets/gradient1.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.containerTopAligned}>
        <FlatList
          data={guests}
          keyExtractor={(item) => item.id}
          renderItem={renderContact}
          contentContainerStyle={{ paddingVertical: 8 }}
        />
      </View>
    </ImageBackground>
  );
}

const Stack = createStackNavigator();

export default function InvitationSendFlow() {
  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: 'transparent' },
        headerStyle: { backgroundColor: 'transparent' },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen
        name="SelectInvitation"
        component={SelectInvitationScreen}
        options={{ title: 'Select Invitation' }}
      />
      <Stack.Screen
        name="SendMethod"
        component={SendMethodScreen}
        options={{ title: 'Send Invitation' }}
      />
      <Stack.Screen
        name="SendWhatsapp"
        component={SendWhatsappScreen}
        options={{ title: 'Send to Guest via WhatsApp' }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  containerTopAligned: {
    flex: 1,
    padding: 16,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 22,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  inviteCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  inviteText: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: 'orange',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
  itemContent: {
    flex: 1,
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 18,
    color: '#000',
    textAlign: 'left',
  },
  phoneText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'left',
  },
});
