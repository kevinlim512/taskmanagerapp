import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ImageBackground 
} from 'react-native';
import { Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, CommonActions } from '@react-navigation/native';

const PARTY_INFO_KEY = '@party_info';
const INVITES_KEY = '@invitations';

export default function InvitationTemplateScreen() { 
  const [partyInfo, setPartyInfo] = useState(null);
  const navigation = useNavigation(); 

  useEffect(() => {
    async function loadPartyInfo() {
      try {
        const stored = await AsyncStorage.getItem(PARTY_INFO_KEY);
        if (stored) {
          setPartyInfo(JSON.parse(stored));
        }
      } catch (error) {
        console.warn('Failed to load party info:', error);
      }
    }
    loadPartyInfo();
  }, []);

  // Helper function to format time without seconds.
  const formatTime = (timeStr) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  // Define invitation templates.
  const templates = [
    (info) =>
      `Join us at our party on ${info.date ? new Date(info.date).toDateString() : 'TBD'} from ${
        info.startTime ? formatTime(info.startTime) : 'TBD'
      } to ${
        info.endTime ? formatTime(info.endTime) : 'TBD'
      } at ${info.venue || 'TBD'}.${info.address ? ' Address: ' + info.address : ''}`,
    (info) =>
      `You're invited to ${info.partyName || 'our party'} on ${
        info.date ? new Date(info.date).toDateString() : 'TBD'
      } at ${info.venue || 'TBD'} from ${
        info.startTime ? formatTime(info.startTime) : 'TBD'
      } to ${
        info.endTime ? formatTime(info.endTime) : 'TBD'
      }.`,
    (info) =>
      `Celebrate with us! ${info.partyName || 'Party'} on ${
        info.date ? new Date(info.date).toDateString() : 'TBD'
      } at ${info.venue || 'TBD'}. Starts at ${
        info.startTime ? formatTime(info.startTime) : 'TBD'
      }.`,
    (info) =>
      `Don't miss out! ${info.partyName || 'Our party'} on ${
        info.date ? new Date(info.date).toDateString() : 'TBD'
      }. Venue: ${info.venue || 'TBD'}. Begins at ${
        info.startTime ? formatTime(info.startTime) : 'TBD'
      }, ends at ${
        info.endTime ? formatTime(info.endTime) : 'TBD'
      }.`,
    (info) =>
      `You are cordially invited to ${info.partyName || 'our event'} on ${
        info.date ? new Date(info.date).toDateString() : 'TBD'
      }. Venue: ${info.venue || 'TBD'}. Time: ${
        info.startTime ? formatTime(info.startTime) : 'TBD'
      } - ${
        info.endTime ? formatTime(info.endTime) : 'TBD'
      }.`,
    (info) =>
      `Let's party! ${info.partyName || 'Join us'} on ${
        info.date ? new Date(info.date).toDateString() : 'TBD'
      } at ${info.venue || 'TBD'}. Time: ${
        info.startTime ? formatTime(info.startTime) : 'TBD'
      } to ${
        info.endTime ? formatTime(info.endTime) : 'TBD'
      }.`,
    (info) =>
      `Get ready for ${info.partyName || 'a great party'} on ${
        info.date ? new Date(info.date).toDateString() : 'TBD'
      }. We'll kick off at ${
        info.startTime ? formatTime(info.startTime) : 'TBD'
      } at ${info.venue || 'TBD'}.${info.address ? ' (Address: ' + info.address + ')' : ''}`,
    (info) =>
      `Save the date for ${info.partyName || 'our party'} on ${
        info.date ? new Date(info.date).toDateString() : 'TBD'
      }. Starts at ${
        info.startTime ? formatTime(info.startTime) : 'TBD'
      } at ${info.venue || 'TBD'}.`
  ];

  const onTemplateSelect = async (templateFunc) => {
    const invitationText = partyInfo ? templateFunc(partyInfo) : 'Party info not available';
    try {
      const stored = await AsyncStorage.getItem(INVITES_KEY);
      const invites = stored ? JSON.parse(stored) : [];
      const newInvite = { id: Date.now().toString(), text: invitationText };
      const updated = [...invites, newInvite];
      await AsyncStorage.setItem(INVITES_KEY, JSON.stringify(updated));
      
      // Get the parent's state and find the key of the GuestMain route
      const state = navigation.getState();
      const guestMainRoute = state.routes.find(r => r.name === 'GuestMain');
      if (guestMainRoute) {
        navigation.dispatch(
          CommonActions.setParams({
            params: { activeTab: 'Invitations' },
            key: guestMainRoute.key,
          })
        );
      }
      
      navigation.goBack();
    } catch (e) {
      console.warn(e);
      Alert.alert('Error', 'Failed to save invitation.');
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/gradient1.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Select an Invitation Template</Text>
        {templates.map((templateFunc, index) => (
          <TouchableOpacity
            key={index}
            style={styles.templateButton}
            onPress={() => onTemplateSelect(templateFunc)}
          >
            <Text style={styles.templateText}>
              {partyInfo ? templateFunc(partyInfo) : 'Template preview unavailable'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: 'transparent',
    padding: 16,
    alignItems: 'center'
  },
  title: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center'
  },
  templateButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginVertical: 6,
    width: '100%'
  },
  templateText: {
    fontSize: 16,
    color: '#000'
  }
});
