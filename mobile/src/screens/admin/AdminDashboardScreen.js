import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useThemeSafe } from '../../contexts/ThemeContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const AdminDashboardScreen = () => {
  const theme = useThemeSafe();

  const stats = [
    { title: 'Utilisateurs', value: '1,234', icon: 'people', color: '#4CAF50' },
    { title: 'Cours', value: '45', icon: 'school', color: '#2196F3' },
    { title: 'Commandes', value: '789', icon: 'shopping-cart', color: '#FF9800' },
    { title: 'Revenus', value: '12.5k€', icon: 'euro', color: '#9C27B0' },
  ];

  const recentActivities = [
    { id: 1, user: 'Jean Dupont', action: 'a acheté', item: 'React Native Course', time: 'Il y a 2h' },
    { id: 2, user: 'Marie Martin', action: 's\'est inscrite à', item: 'JavaScript Avancé', time: 'Il y a 3h' },
    { id: 3, user: 'Pierre Durand', action: 'a noté', item: 'React Hooks', time: 'Il y a 5h' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Tableau de bord</Text>
      
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <TouchableOpacity 
            key={index}
            style={[styles.statCard, { backgroundColor: theme.colors.surface }]}
          >
            <View style={[styles.iconContainer, { backgroundColor: stat.color }]}>
              <MaterialIcons name={stat.icon} size={24} color="white" />
            </View>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{stat.value}</Text>
            <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>
              {stat.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Activités récentes
        </Text>
        
        {recentActivities.map(activity => (
          <View key={activity.id} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <MaterialIcons name="person" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.activityContent}>
              <Text style={[styles.activityText, { color: theme.colors.text }]}>
                <Text style={styles.activityUser}>{activity.user}</Text> {activity.action}{' '}
                <Text style={styles.activityItem}>{activity.item}</Text>
              </Text>
              <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>
                {activity.time}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Actions rapides
        </Text>
        
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          >
            <MaterialIcons name="add" size={24} color="white" />
            <Text style={styles.actionButtonText}>Ajouter un cours</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          >
            <MaterialIcons name="people" size={24} color="white" />
            <Text style={styles.actionButtonText}>Gérer les utilisateurs</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          >
            <MaterialIcons name="assessment" size={24} color="white" />
            <Text style={styles.actionButtonText}>Voir les rapports</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    lineHeight: 20,
  },
  activityUser: {
    fontWeight: '600',
  },
  activityItem: {
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 12,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default AdminDashboardScreen;
