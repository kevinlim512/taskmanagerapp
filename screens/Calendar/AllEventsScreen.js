import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, StyleSheet, ImageBackground, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Card } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

const EVENTS_KEY = '@events';
const TASKS_KEY = '@tasks';

// Helper: returns local date string (YYYY-MM-DD) for a given date value.
function getLocalDateString(dateVal) {
  const d = new Date(dateVal);
  const year = d.getFullYear();
  const month = ('0' + (d.getMonth() + 1)).slice(-2);
  const day = ('0' + d.getDate()).slice(-2);
  return `${year}-${month}-${day}`;
}

export default function AllEventsScreen({ navigation, route }) {
  const [events, setEvents] = useState([]);
  const [editMode, setEditMode] = useState(false);

  // This is the date selected from the calendar tap.
  const selectedDate = route.params?.selectedDate || null;

  useEffect(() => {
    loadEvents();
  }, []);

  // Refresh events whenever this screen regains focus (e.g. after editing).
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadEvents();
    });
    return unsubscribe;
  }, [navigation]);

  // Set up header "Edit" button.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => setEditMode((prev) => !prev)}>
          <Text style={styles.headerRightButton}>
            {editMode ? 'Done' : 'Edit'}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, editMode]);

  async function loadEvents() {
    try {
      // Load events from storage.
      const storedEvents = await AsyncStorage.getItem(EVENTS_KEY);
      const parsedEvents = storedEvents ? JSON.parse(storedEvents) : [];

      // Load tasks from storage and filter those with a date attached.
      const storedTasks = await AsyncStorage.getItem(TASKS_KEY);
      let tasksWithDate = [];
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        tasksWithDate = Array.isArray(parsedTasks)
          ? parsedTasks.filter((task) => task.date)
          : [];
        // Convert tasks to event-like objects and mark them as tasks.
        tasksWithDate = tasksWithDate.map((task) => ({
          id: task.id,
          datetime: task.date,
          title: task.text,
          isTask: true,
        }));
      }

      // Merge events and tasks, avoiding duplicates if they share the same ID.
      const uniqueMerged = Array.isArray(parsedEvents) ? [...parsedEvents] : [];
      tasksWithDate.forEach((task) => {
        if (!uniqueMerged.some((ev) => ev.id === task.id)) {
          uniqueMerged.push(task);
        }
      });

      setEvents(uniqueMerged);
    } catch (error) {
      console.warn(error);
      setEvents([]);
    }
  }

  // Helper: group events by date (YYYY-MM-DD) using local time.
  function groupEvents() {
    const groups = {};
    if (!Array.isArray(events)) return groups;
    events.forEach((ev) => {
      if (!ev.datetime) return; // skip if datetime is missing
      const key = getLocalDateString(ev.datetime);
      if (!groups[key]) groups[key] = [];
      groups[key].push(ev);
    });
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    });
    return groups;
  }

  function formatHeading(dateKey) {
    // Create a Date object from the local date string.
    const d = new Date(dateKey + 'T00:00:00');
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    const day = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${weekday}, ${day} ${month} ${year}`;
  }

  // For non-task events, format the time normally.
  function formatTime(datetime) {
    const d = new Date(datetime);
    let hours = d.getHours();
    let minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const minStr = minutes < 10 ? `0${minutes}` : minutes;
    return `${hours}:${minStr} ${ampm}`;
  }

  async function handleDelete(eventId) {
    try {
      const updatedEvents = events.filter((ev) => ev.id !== eventId);
      setEvents(updatedEvents);
      await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(updatedEvents));
    } catch (err) {
      console.warn(err);
    }
  }

  function handleEdit(ev) {
    navigation.navigate('EditEvent', { event: ev });
  }

  // Group all events by date.
  const groupedEvents = groupEvents();

  // If a date was selected in the calendar, only show that date's events.
  // Otherwise, show all events.
  let dateKeys;
  if (selectedDate) {
    dateKeys = [selectedDate];
  } else {
    dateKeys = Object.keys(groupedEvents).sort(
      (a, b) => new Date(a) - new Date(b)
    );
  }
  dateKeys = dateKeys.filter((dk) => groupedEvents[dk]);

  return (
    <ImageBackground
      source={require('../../assets/gradient1.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} testID="allEventsScreen">
        {dateKeys.length === 0 ? (
          <Text style={styles.emptyText}>
            {selectedDate ? 'No events for this date.' : 'No events found.'}
          </Text>
        ) : (
          dateKeys.map((dateKey) => (
            <View key={dateKey} style={{ marginBottom: 20 }}>
              <Text style={styles.sectionHeader}>{formatHeading(dateKey)}</Text>
              {groupedEvents[dateKey].map((ev, index) => (
                <Card
                  key={`${ev.id}-${index}`}
                  style={[
                    styles.card,
                    ev.isTask && {
                      backgroundColor: 'transparent',
                      borderColor: '#fff',
                      borderWidth: 3,
                    },
                  ]}
                >
                  <Card.Content style={styles.cardRow}>
                    <View style={{ flex: 1 }}>
                      {ev.isTask ? (
                        <Text style={[styles.cardTask, { color: '#fff' }]}>
                          Task
                        </Text>
                      ) : (
                        <Text style={styles.cardTime}>
                          {formatTime(ev.datetime)}
                        </Text>
                      )}
                      <Text
                        style={[
                          styles.cardTitle,
                          ev.isTask && { color: '#fff' },
                        ]}
                      >
                        {ev.title}
                      </Text>
                    </View>
                    {editMode && !ev.isTask && (
                      <View style={styles.iconRow}>
                        <TouchableOpacity
                          accessibilityLabel={`Edit Event ${ev.id}`}
                          onPress={() => handleEdit(ev)}
                          style={{ marginRight: 12 }}
                        >
                          <MaterialIcons name="edit" size={24} color="#333" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          accessibilityLabel={`Delete Event ${ev.id}`}
                          onPress={() => handleDelete(ev.id)}
                        >
                          <MaterialIcons name="delete" size={24} color="red" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </Card.Content>
                </Card>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 16,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  headerRightButton: {
    color: '#fff',
    marginRight: 16,
    fontWeight: 'bold',
  },
  sectionHeader: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  card: {
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 3,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTime: {
    fontSize: 14,
    color: '#0d1652',
    fontWeight: '600',
  },
  cardTask: {
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: 'bold',
    color: '#0d1652',
  },
  cardTitle: {
    fontSize: 16,
    color: '#333',
  },
  emptyText: {
    color: '#fff',
    fontStyle: 'italic',
    marginTop: 20,
    textAlign: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
