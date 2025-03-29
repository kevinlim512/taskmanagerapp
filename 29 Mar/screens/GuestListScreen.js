import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { Text } from 'react-native-paper';
import { createStackNavigator } from '@react-navigation/stack';
import { useRoute } from '@react-navigation/native';
import GuestListHome from './GuestList/GuestListHome';
import GuestDetailScreen from './GuestList/GuestDetailScreen';
import InvitationsScreen from './GuestList/InvitationsScreen';
import AddContactScreen from './GuestList/AddContactScreen';
import InvitationTemplateScreen from './GuestList/InvitationTemplateScreen';
import EditInvitationScreen from './GuestList/EditInvitationScreen';

const Stack = createStackNavigator();

// Updated GuestMain to read activeTab from route params
function GuestMain({ navigation }) {
  const route = useRoute();
  const [activeTab, setActiveTab] = useState(route.params?.activeTab || 'GuestList');

  useEffect(() => {
    if (route.params?.activeTab) {
      setActiveTab(route.params.activeTab);
    }
  }, [route.params?.activeTab]);

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'GuestList' && styles.tabItemActive
          ]}
          onPress={() => setActiveTab('GuestList')}
        >
          <Text style={styles.tabItemText}>Guest List</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'Invitations' && styles.tabItemActive
          ]}
          onPress={() => setActiveTab('Invitations')}
        >
          <Text style={styles.tabItemText}>Invitations</Text>
        </TouchableOpacity>
      </View>

      {/* Conditionally show "Add Contact" only when Guest List is active */}
      {activeTab === 'GuestList' && (
        <TouchableOpacity
          style={styles.addContactButton}
          onPress={() => navigation.navigate('AddContact')}
        >
          <Text style={styles.addContactButtonText}>Add Contact</Text>
        </TouchableOpacity>
      )}

      {activeTab === 'Invitations' ? (
        <InvitationsScreen />
      ) : (
        <GuestListHome navigation={navigation} />
      )}
    </View>
  );
}

// Higher-order component to wrap a screen in the gradient background
function withGradientBackground(Component) {
  return function (props) {
    return (
      <ImageBackground
        source={require('../assets/gradient1.jpg')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <Component {...props} />
      </ImageBackground>
    );
  };
}

export default function GuestListScreen() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: 'transparent' },
        headerTintColor: '#fff',
        cardStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen
        name="GuestMain"
        component={withGradientBackground(GuestMain)}
        options={{ title: 'Guests' }}
      />
      <Stack.Screen
        name="GuestDetail"
        component={withGradientBackground(GuestDetailScreen)}
        options={{ title: 'Guest Detail' }}
      />
      <Stack.Screen
        name="AddContact"
        component={withGradientBackground(AddContactScreen)}
        options={{ title: 'Add Contact' }}
      />
      <Stack.Screen
        name="InvitationTemplate"
        component={withGradientBackground(InvitationTemplateScreen)}
        options={{ title: 'Invitation Template' }}
      />
      <Stack.Screen
        name="EditInvitationScreen"
        component={withGradientBackground(EditInvitationScreen)}
        options={{ title: 'Edit Invitation' }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 25,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 25,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'orange',
    backgroundColor: 'transparent',
  },
  tabItemActive: {
    backgroundColor: 'orange',
  },
  tabItemText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addContactButton: {
    backgroundColor: 'orange',
    borderRadius: 10,
    paddingVertical: 12,
    marginVertical: 10,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  addContactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    width: '100%',
    textAlign: 'center',
  },
});
