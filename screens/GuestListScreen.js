import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { Text } from 'react-native-paper';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { useRoute, useNavigation } from '@react-navigation/native';
import GuestListHome from './GuestList/GuestListHome';
import GuestDetailScreen from './GuestList/GuestDetailScreen';
import InvitationsScreen from './GuestList/InvitationsScreen';
import AddContactScreen from './GuestList/AddContactScreen';
import InvitationTemplateScreen from './GuestList/InvitationTemplateScreen';
import EditInvitationScreen from './GuestList/EditInvitationScreen';

const Stack = createStackNavigator();

function GuestMain() {
  const navigation = useNavigation();
  const route = useRoute();
  const [activeTab, setActiveTab] = useState(route.params?.activeTab || 'GuestList');

  useEffect(() => {
    if (route.params) {
      const { activeTab, hideHeaderLeft } = route.params;
      if (activeTab) {
        setActiveTab(activeTab);
      }
      if (activeTab === 'Invitations' || hideHeaderLeft) {
        navigation.setOptions({ headerLeft: () => null });
      } else {
        navigation.setOptions({ headerLeft: undefined });
      }
    }
  }, [route.params]);

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'GuestList' && styles.tabItemActive,
          ]}
          onPress={() => setActiveTab('GuestList')}
        >
          <Text style={styles.tabItemText}>Guest List</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'Invitations' && styles.tabItemActive,
          ]}
          onPress={() => setActiveTab('Invitations')}
        >
          <Text style={styles.tabItemText}>Invitations</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'GuestList' && (
        <TouchableOpacity
          style={styles.addContactButton}
          onPress={() => navigation.navigate('AddContact')}
        >
          <Text style={styles.addContactButtonText}>Add Contact</Text>
        </TouchableOpacity>
      )}

      {activeTab === 'Invitations' ? (
        <InvitationsScreen forceEdit={true} />
      ) : (
        <GuestListHome navigation={navigation} />
      )}
    </View>
  );
}

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
        gestureEnabled: true,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
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
