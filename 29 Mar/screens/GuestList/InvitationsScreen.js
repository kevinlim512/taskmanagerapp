import React, { useState, useCallback, useLayoutEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, ImageBackground } from 'react-native';
import { Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

const INVITES_KEY = '@invitations';

export default function InvitationsScreen({ forceEdit = false }) {
  const [invitations, setInvitations] = useState([]);
  const [isEditing, setIsEditing] = useState(forceEdit);
  const navigation = useNavigation();

  // Load invitations from AsyncStorage
  const loadInvites = async () => {
    try {
      const stored = await AsyncStorage.getItem(INVITES_KEY);
      if (stored) {
        setInvitations(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Failed to load invitations:', error);
    }
  };

  // Delete an invitation
  const handleDelete = async (id) => {
    const updatedInvitations = invitations.filter((inv) => inv.id !== id);
    setInvitations(updatedInvitations);
    await AsyncStorage.setItem(INVITES_KEY, JSON.stringify(updatedInvitations));
  };

  // Refresh invitations on screen focus
  useFocusEffect(
    useCallback(() => {
      async function fetchData() {
        await loadInvites();
      }
      fetchData();
    }, [])
  );

  // "Edit" or "Done" button in header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          <Text style={styles.headerButtonText}>{isEditing ? 'Done' : 'Edit'}</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, isEditing]);

  // Render each invitation item
  const renderItem = ({ item }) => (
    <View style={styles.inviteCard}>
      <Text style={styles.inviteText} numberOfLines={3} ellipsizeMode="tail">
        {item.text}
      </Text>
      {isEditing && (
        <View style={styles.iconButtonsContainer}>
          <TouchableOpacity
            style={[styles.iconButton, styles.iconButtonLeft]}
            onPress={() =>
              navigation.navigate('EditInvitationScreen', {
                item,
                onItemUpdated: loadInvites,
              })
            }
          >
            <MaterialIcons name="edit" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel={`Delete Invitation ${item.id}`}
            testID={`delete-invitation-${item.id}`}
            style={[styles.iconButton, styles.iconButtonRight]}
            onPress={() => handleDelete(item.id)}
          >
            <MaterialIcons name="delete" size={24} color="red" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <ImageBackground
      source={require('../../assets/gradient1.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.fullWidthButton}
          onPress={() => navigation.navigate('InvitationTemplate')}
        >
          <Text style={styles.buttonText}>Create Invitation Template</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fullWidthButton, { marginBottom: 16 }]}
          onPress={() => navigation.navigate('InvitationSendFlow')}
        >
          <Text style={styles.buttonText}>Send Invitation</Text>
        </TouchableOpacity>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 16,
  },
  fullWidthButton: {
    backgroundColor: 'orange',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  inviteCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    minHeight: 80,
  },
  inviteText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  iconButtonsContainer: {
    position: 'absolute',
    right: 4,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 8,
  },
  iconButton: {
    width: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonLeft: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  iconButtonRight: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  headerButtonText: {
    fontSize: 16,
    color: 'orange',
    fontWeight: 'bold',
    marginRight: 16,
  },
});
