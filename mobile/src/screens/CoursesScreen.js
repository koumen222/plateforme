import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useThemeSafe } from '../utils/useThemeSafe';

const CoursesScreen = () => {
  const theme = useThemeSafe();

  const courses = [
    { id: 1, title: 'React Native Basics', duration: '2h', level: 'Débutant' },
    { id: 2, title: 'JavaScript Avancé', duration: '3h', level: 'Intermédiaire' },
    { id: 3, title: 'React Hooks', duration: '2.5h', level: 'Intermédiaire' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Mes Cours</Text>
      
      {courses.map(course => (
        <TouchableOpacity 
          key={course.id} 
          style={[styles.courseCard, { backgroundColor: theme.colors.surface }]}
        >
          <Text style={[styles.courseTitle, { color: theme.colors.text }]}>
            {course.title}
          </Text>
          <View style={styles.courseInfo}>
            <Text style={[styles.courseMeta, { color: theme.colors.textSecondary }]}>
              Durée: {course.duration}
            </Text>
            <Text style={[styles.courseMeta, { color: theme.colors.textSecondary }]}>
              Niveau: {course.level}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  courseCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  courseInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  courseMeta: {
    fontSize: 14,
  },
});

export default CoursesScreen;
