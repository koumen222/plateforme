import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useThemeSafe } from '../../contexts/ThemeContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const AdminReportsScreen = () => {
  const theme = useThemeSafe();

  const reports = [
    {
      id: 1,
      title: 'Rapport des ventes',
      description: 'Analyse des ventes mensuelles',
      icon: 'assessment',
      date: '08/02/2024',
      type: 'sales',
    },
    {
      id: 2,
      title: 'Rapport des utilisateurs',
      description: 'Statistiques des utilisateurs actifs',
      icon: 'people',
      date: '07/02/2024',
      type: 'users',
    },
    {
      id: 3,
      title: 'Rapport des cours',
      description: 'Performance des cours populaires',
      icon: 'school',
      date: '06/02/2024',
      type: 'courses',
    },
    {
      id: 4,
      title: 'Rapport financier',
      description: 'Revenus et dépenses',
      icon: 'euro',
      date: '05/02/2024',
      type: 'financial',
    },
  ];

  const getIconColor = (type) => {
    switch (type) {
      case 'sales': return '#4CAF50';
      case 'users': return '#2196F3';
      case 'courses': return '#FF9800';
      case 'financial': return '#9C27B0';
      default: return theme.colors.primary;
    }
  };

  const stats = [
    { title: 'Revenus totaux', value: '45.2k€', change: '+12%', positive: true },
    { title: 'Utilisateurs actifs', value: '1,234', change: '+5%', positive: true },
    { title: 'Cours vendus', value: '892', change: '-3%', positive: false },
    { title: 'Taux de conversion', value: '3.2%', change: '+0.5%', positive: true },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Rapports et analyses</Text>
      
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{stat.value}</Text>
            <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>
              {stat.title}
            </Text>
            <View style={styles.changeContainer}>
              <MaterialIcons 
                name={stat.positive ? "trending-up" : "trending-down"} 
                size={16} 
                color={stat.positive ? '#4CAF50' : '#F44336'} 
              />
              <Text style={[
                styles.changeText,
                { color: stat.positive ? '#4CAF50' : '#F44336' }
              ]}>
                {stat.change}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.reportsSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Rapports disponibles
        </Text>
        
        {reports.map(report => (
          <TouchableOpacity 
            key={report.id} 
            style={[styles.reportCard, { backgroundColor: theme.colors.surface }]}
          >
            <View style={styles.reportHeader}>
              <View style={[styles.iconContainer, { backgroundColor: getIconColor(report.type) }]}>
                <MaterialIcons name={report.icon} size={24} color="white" />
              </View>
              <View style={styles.reportInfo}>
                <Text style={[styles.reportTitle, { color: theme.colors.text }]}>
                  {report.title}
                </Text>
                <Text style={[styles.reportDescription, { color: theme.colors.textSecondary }]}>
                  {report.description}
                </Text>
                <Text style={[styles.reportDate, { color: theme.colors.textSecondary }]}>
                  {report.date}
                </Text>
              </View>
            </View>
            
            <View style={styles.reportActions}>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialIcons name="visibility" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialIcons name="download" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialIcons name="share" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Générer un nouveau rapport
        </Text>
        
        <View style={styles.generateOptions}>
          <TouchableOpacity style={[styles.generateButton, { backgroundColor: theme.colors.primary }]}>
            <MaterialIcons name="date-range" size={24} color="white" />
            <Text style={styles.generateButtonText}>Rapport personnalisé</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.generateButton, { backgroundColor: theme.colors.primary }]}>
            <MaterialIcons name="schedule" size={24} color="white" />
            <Text style={styles.generateButtonText}>Automatiser les rapports</Text>
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
    marginBottom: 12,
    elevation: 2,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  reportsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  reportCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 12,
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  section: {
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  generateOptions: {
    gap: 12,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default AdminReportsScreen;
