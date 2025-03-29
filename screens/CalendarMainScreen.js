// Removed the useLayoutEffect block that sets headerRight entirely.

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { Text } from 'react-native-paper';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import NewEventScreen from './Calendar/NewEventScreen';
import AllEventsScreen from './Calendar/AllEventsScreen';
import EditEventScreen from './Calendar/EditEventScreen';

const PARTY_INFO_KEY = '@party_info';
const EVENTS_KEY = '@events';
const TASKS_KEY = '@tasks';

function MergedCalendarHome({ navigation }) {
  const [partyDateString, setPartyDateString] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState({});

  // Format a Date object as a local date string in YYYY-MM-DD format.
  const getLocalDateString = (dateVal) => {
    const d = new Date(dateVal);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  };

  // Load the party date from AsyncStorage using local time.
  const loadPartyDate = async () => {
    try {
      const storedInfo = await AsyncStorage.getItem(PARTY_INFO_KEY);
      if (storedInfo) {
        const info = JSON.parse(storedInfo);
        if (info.date) {
          const dayStr = getLocalDateString(info.date);
          setPartyDateString(dayStr);
        } else {
          setPartyDateString(null);
        }
      } else {
        setPartyDateString(null);
      }
    } catch (error) {
      console.warn('Failed to load party date:', error);
      setPartyDateString(null);
    }
  };

  // Load events from both EVENTS_KEY and TASKS_KEY using local dates.
  const loadCalendarEvents = async () => {
    try {
      const storedEvents = await AsyncStorage.getItem(EVENTS_KEY);
      const parsedEvents = storedEvents ? JSON.parse(storedEvents) : [];
      const storedTasks = await AsyncStorage.getItem(TASKS_KEY);
      let tasksWithDate = [];
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        tasksWithDate = Array.isArray(parsedTasks)
          ? parsedTasks.filter((task) => task.date)
          : [];
        tasksWithDate = tasksWithDate.map((task) => ({
          id: task.id,
          datetime: task.date,
          title: task.text,
          isTask: true,
        }));
      }
      const mergedEvents = [...parsedEvents, ...tasksWithDate];
      // Group events by local date string (YYYY-MM-DD)
      const eventsByDate = {};
      mergedEvents.forEach((ev) => {
        if (!ev.datetime) return; // skip if datetime is missing
        const key = getLocalDateString(ev.datetime);
        if (!eventsByDate[key]) eventsByDate[key] = [];
        eventsByDate[key].push(ev);
      });
      // Sort events in each group
      Object.keys(eventsByDate).forEach((key) => {
        eventsByDate[key].sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
      });
      setCalendarEvents(eventsByDate);
    } catch (error) {
      console.warn('Failed to load calendar events:', error);
    }
  };

  // Initial loads.
  useEffect(() => {
    loadPartyDate();
    loadCalendarEvents();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadPartyDate();
      loadCalendarEvents();
    }, [])
  );

  // Today's local date string
  const todayString = getLocalDateString(new Date());

  // Build markedDates based on events.
  const markedDates = {};
  Object.keys(calendarEvents).forEach((dateStr) => {
    markedDates[dateStr] = {
      dots: [{ key: 'event', color: 'lime' }],
    };
  });

  // For today's date, add an orange circle.
  markedDates[todayString] = {
    ...(markedDates[todayString] || {}),
    selected: true,
    selectedColor: 'orange',
    selectedTextColor: 'white',
    dots: [{ key: 'event', color: 'lime' }],
  };

  // For party date (if set and different from today), add a red circle.
  if (partyDateString && partyDateString !== todayString) {
    markedDates[partyDateString] = {
      ...(markedDates[partyDateString] || {}),
      selected: true,
      selectedColor: 'red',
      selectedTextColor: 'white',
      dots: [{ key: 'event', color: 'lime' }],
    };
  }

  const calendarTheme = {
    backgroundColor: 'transparent',
    calendarBackground: '#0d1652',
    dayTextColor: '#fff',
    monthTextColor: '#fff',
    arrowColor: 'orange',
    textDisabledColor: '#ccc',
    textDayFontWeight: '500',
    textMonthFontWeight: '500',
    textDayHeaderFontWeight: '500',
    dotStyle: {
      marginTop: 10,
      height: 4,
      width: 20,
      borderRadius: 2,
      backgroundColor: 'lime',
    },
  };

  const onDayPress = (day) => {
    navigation.navigate('AllEvents', { selectedDate: day.dateString });
  };

  const showPartyEvents = () => {
    if (partyDateString) {
      navigation.navigate('AllEvents', { selectedDate: partyDateString });
    }
  };

  return (
    <ImageBackground
      source={require('../assets/gradient1.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Text style={styles.instructionText}>Tap a date to see its events.</Text>
        <Calendar
          onDayPress={onDayPress}
          style={styles.calendar}
          markingType="multi-dot"
          markedDates={markedDates}
          theme={calendarTheme}
        />
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('NewEvent', { selectedDate: todayString })}
        >
          <Text style={styles.navButtonText}>Add New Event</Text>
        </TouchableOpacity>
        {partyDateString && (
          <>
            <TouchableOpacity
              style={[styles.navButton, { marginTop: 10, backgroundColor: 'red' }]}
              onPress={showPartyEvents}
            >
              <Text style={styles.navButtonText}>View Party Day Events</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navButton, { marginTop: 10, backgroundColor: 'red' }]}
              onPress={() => navigation.navigate('AllEvents')}
            >
              <Text style={styles.navButtonText}>View All Events</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ImageBackground>
  );
}

const Stack = createNativeStackNavigator();

export default function CalendarMainScreen() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: 'transparent' },
        headerTintColor: '#fff',
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen
        name="CalendarHome"
        component={MergedCalendarHome}
        options={{ title: 'Calendar' }}
      />
      <Stack.Screen
        name="NewEvent"
        component={NewEventScreen}
        options={{ title: 'New Event' }}
      />
      <Stack.Screen
        name="AllEvents"
        component={AllEventsScreen}
        options={{ title: 'All Events' }}
      />
      <Stack.Screen
        name="EditEvent"
        component={EditEventScreen}
        options={{ title: 'Edit Event' }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 16,
  },
  instructionText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  calendar: {
    borderRadius: 8,
    marginBottom: 16,
  },
  navButton: {
    backgroundColor: 'orange',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerButton: {
    marginRight: 10,
    padding: 8,
    backgroundColor: 'transparent',
  },
  headerButtonText: {
    color: 'orange',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export { MergedCalendarHome };
