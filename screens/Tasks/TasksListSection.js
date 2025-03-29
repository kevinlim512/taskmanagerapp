import React, { useRef } from 'react';
import { View, StyleSheet, Pressable, Animated, TouchableOpacity } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { MaterialIcons } from '@expo/vector-icons';
import { Text, Surface, Checkbox } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

export default function TasksListSection({
  tasks = [],
  completedTasks = [],
  toggleTask = () => {},
  deleteTask = () => {},
  formatDate = (date) => date,
  saveTasks = () => {},
  isEditing = false,
}) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const navigation = useNavigation();

  const getCardHeight = (item) => (item.date ? 80 : 60);

  const isOverdue = (date) => {
    if (!date) return false;
    const taskDate = new Date(date);
    const now = new Date();
    const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
    const currentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return currentDay > taskDay;
  };

  const renderActiveItem = ({ item, drag, isActive }) => (
    <Surface style={[styles.card, { height: getCardHeight(item), opacity: isActive ? 0.8 : 1 }]}>
      <View style={styles.cardContent}>
        <Checkbox.Android
          status="unchecked"
          onPress={() => toggleTask(item.id, false)}
          color="orange"
          uncheckedColor="#000"
          style={styles.checkIcon}
        />
        <View style={styles.textContainer}>
          <Text style={styles.taskText}>{item.text || item.title}</Text>
          {item.date && (
            <Text style={[styles.dateText, isOverdue(item.date) && styles.overdueText]}>
              {isOverdue(item.date) ? 'Overdue: ' : ''}{formatDate(item.date)}
            </Text>
          )}
        </View>
        <View style={styles.iconsContainer}>
          {isEditing && (
            <>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => navigation.navigate('EditTask', { task: item })}
              >
                <MaterialIcons name="edit" size={24} color="black" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => deleteTask(item.id)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <MaterialIcons name="delete" size={24} color="red" />
              </TouchableOpacity>
              <Pressable
                style={styles.iconButton}
                onPressIn={drag}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <MaterialIcons name="drag-handle" size={24} color="#333" />
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Surface>
  );

  const renderCompletedItem = ({ item }) => (
    <Surface key={item.id} style={[styles.card, { height: getCardHeight(item) }]}>
      <View style={styles.cardContent}>
        <Checkbox.Android
          status="checked"
          onPress={() => toggleTask(item.id, true)}
          color="orange"
          uncheckedColor="#000"
          style={styles.checkIcon}
        />
        <View style={styles.textContainer}>
          <Text style={styles.completedText}>{item.text || item.title}</Text>
          {item.date && (
            <Text style={[styles.dateText, { color: 'grey' }]}>{formatDate(item.date)}</Text>
          )}
        </View>
        {isEditing && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => deleteTask(item.id)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialIcons name="delete" size={24} color="red" />
          </TouchableOpacity>
        )}
      </View>
    </Surface>
  );

  const handleDragEnd = ({ data }) => {
    saveTasks(data);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.header}>Active Tasks</Text>
      <DraggableFlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderActiveItem}
        onDragEnd={handleDragEnd}
        contentContainerStyle={styles.listContent}
        scrollEnabled={false}
        renderPlaceholderItem={({ item }) => (
          <Surface style={[styles.card, { height: getCardHeight(item), opacity: 0 }]} />
        )}
      />
      {completedTasks.length > 0 && (
        <View style={styles.completedSection}>
          <Text style={styles.header}>Completed Tasks</Text>
          {completedTasks.map((item) => renderCompletedItem({ item }))}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  header: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginVertical: 10,
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: 'white',
    elevation: 4,
    paddingHorizontal: 10,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  checkIcon: {
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  taskText: {
    fontSize: 16,
    color: 'black',
  },
  completedText: {
    fontSize: 16,
    color: 'grey',
  },
  dateText: {
    fontSize: 14,
    color: 'black',
  },
  overdueText: {
    color: 'red',
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  completedSection: {
    marginTop: 20,
  },
});
