import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useThemeSafe } from '../../contexts/ThemeContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const AdminCoursesScreen = () => {
  const theme = useThemeSafe();
  const [searchTerm, setSearchTerm] = useState('');

  const courses = [
    { id: 1, title: 'React Native Basics', instructor: 'Jean Dupont', students: 45, status: 'published', price: 29.99 },
    { id: 2, title: 'JavaScript Avancé', instructor: 'Marie Martin', students: 32, status: 'draft', price: 49.99 },
    { id: 3, title: 'React Hooks', instructor: 'Pierre Durand', students: 28, status: 'published', price: 39.99 },
    { id: 4, title: 'TypeScript', instructor: 'Sophie Petit', students: 15, status: 'archived', price: 34.99 },
  ];

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return '#4CAF50';
      case 'draft': return '#FF9800';
      case 'archived': return '#F44336';
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'published': return 'Publié';
      case 'draft': return 'Brouillon';
      case 'archived': return 'Archivé';
      default: return status;
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Gestion des cours</Text>
      
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <MaterialIcons name="search" size={24} color={theme.colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Rechercher un cours..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statNumber, { color: theme.colors.primary }]}>{courses.length}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
            {courses.filter(c => c.status === 'published').length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Publiés</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statNumber, { color: '#FF9800' }]}>
            {courses.filter(c => c.status === 'draft').length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Brouillons</Text>
        </View>
      </View>

      {filteredCourses.map(course => (
        <TouchableOpacity key={course.id} style={[styles.courseCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.courseHeader}>
            <View style={styles.courseInfo}>
              <Text style={[styles.courseTitle, { color: theme.colors.text }]}>{course.title}</Text>
              <Text style={[styles.courseInstructor, { color: theme.colors.textSecondary }]}>
                Par {course.instructor}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(course.status) }]}>
              <Text style={styles.statusText}>{getStatusText(course.status)}</Text>
            </View>
          </View>
          
          <View style={styles.courseStats}>
            <View style={styles.statItem}>
              <MaterialIcons name="people" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                {course.students} étudiants
              </Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="euro" size={16} color={theme.colors.primary} />
              <Text style={[styles.statText, { color: theme.colors.primary }]}>
                {course.price.toFixed(2)}
              </Text>
            </View>
          </View>
          
          <View style={styles.courseActions}>
            <TouchableOpacity style={styles.actionButton}>
              <MaterialIcons name="edit" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <MaterialIcons name="visibility" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <MaterialIcons name="delete" size={20} color="#F44336" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.primary }]}>
        <MaterialIcons name="add" size={24} color="white" />
        <Text style={styles.addButtonText}>Créer un nouveau cours</Text>
      </TouchableOpacity>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  courseCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  courseInstructor: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  courseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    marginLeft: 4,
  },
  courseActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default AdminCoursesScreen;
