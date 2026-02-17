import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useThemeSafe } from '../utils/useThemeSafe';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import axios from 'axios';

const API_URL = 'http://localhost:3000'; // Adapter selon votre configuration

const HomeScreen = ({ navigation }) => {
  const { user, refreshUser } = useAuth();
  const theme = useThemeSafe();
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState([]);
  const [ressourcesPdf, setRessourcesPdf] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFeaturedContent();
  }, []);

  const loadFeaturedContent = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchFeaturedCourses(),
        fetchFeaturedRessourcesPdf()
      ]);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedCourses = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/courses`);
      if (response.data.success) {
        const coursesData = response.data.courses || [];
        const sortedCourses = [...coursesData].sort((a, b) => {
          const priorityA = getCoursePriority(a);
          const priorityB = getCoursePriority(b);
          return priorityA - priorityB;
        });
        setCourses(sortedCourses.slice(0, 6)); // Limiter à 6 cours pour l'affichage mobile
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchFeaturedRessourcesPdf = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/ressources-pdf`);
      if (response.data.success) {
        setRessourcesPdf(response.data.ressources || []);
      }
    } catch (error) {
      console.error('Error fetching PDF resources:', error);
    }
  };

  const getCoursePriority = (course) => {
    const slug = (course.slug || '').toLowerCase().trim();
    const title = (course.title || '').toLowerCase().trim();
    if (slug === 'facebook-ads' || slug.includes('facebook') || title.includes('facebook')) return 1;
    if (slug === 'tiktok-ads' || slug.includes('tiktok') || title.includes('tiktok')) return 2;
    return 3;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUser();
      await loadFeaturedContent();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const menuItems = [
    {
      id: 'courses',
      title: 'Cours',
      description: 'Accédez à vos formations',
      icon: 'school',
      color: '#3b82f6',
      screen: 'Courses',
    },
    {
      id: 'resources',
      title: 'Ressources',
      description: 'Téléchargez les PDF',
      icon: 'description',
      color: '#f59e0b',
      screen: 'Resources',
    },
    {
      id: 'community',
      title: 'Communauté',
      description: 'Rejoignez la communauté',
      icon: 'groups',
      color: '#8b5cf6',
      screen: 'Community',
    },
    {
      id: 'ecom',
      title: 'Boutique',
      description: 'Nos produits et services',
      icon: 'shopping-cart',
      color: '#10b981',
      screen: 'Ecom',
    },
  ];

  const renderCourseItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.courseCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => navigation.navigate('Courses', { courseId: item.id })}
    >
      <View style={[styles.courseIcon, { backgroundColor: getCoursePriority(item) === 1 ? '#1877f2' : getCoursePriority(item) === 2 ? '#000000' : '#3b82f6' }]}>
        <MaterialIcons name="school" size={24} color="white" />
      </View>
      <View style={styles.courseInfo}>
        <Text style={[styles.courseTitle, { color: theme.colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.courseDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.courseMeta}>
          <MaterialIcons name="schedule" size={14} color={theme.colors.textSecondary} />
          <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
            {item.duration || '8 heures'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderResourceItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.resourceCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => console.log('Open resource:', item.id)}
    >
      <View style={[styles.resourceIcon, { backgroundColor: '#ef4444' }]}>
        <MaterialIcons name="picture-as-pdf" size={24} color="white" />
      </View>
      <View style={styles.resourceInfo}>
        <Text style={[styles.resourceTitle, { color: theme.colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.resourceDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.resourceMeta}>
          <MaterialIcons name="download" size={14} color={theme.colors.textSecondary} />
          <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
            {item.downloadCount || 0} téléchargements
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.welcome, { color: theme.colors.text }]}>
          Bienvenue, {user?.name || 'Utilisateur'}!
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {user?.status === 'active' 
            ? 'Votre compte est actif' 
            : 'Votre compte est en attente de validation'
          }
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <MaterialIcons name="trending-up" size={24} color={theme.colors.primary} />
          <Text style={[styles.statNumber, { color: theme.colors.text }]}>
            {courses.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Formations
          </Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <MaterialIcons name="description" size={24} color={theme.colors.accent} />
          <Text style={[styles.statNumber, { color: theme.colors.text }]}>
            {ressourcesPdf.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Ressources
          </Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Menu Principal
        </Text>
        
        <View style={styles.menuGrid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
              onPress={() => {
                if (item.screen === 'Courses') {
                  navigation.navigate('Courses');
                } else if (item.screen === 'Ecom') {
                  navigation.navigate('Ecom');
                }
              }}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: item.color }]}>
                <MaterialIcons name={item.icon} size={24} color="white" />
              </View>
              <Text style={[styles.menuTitle, { color: theme.colors.text }]}>
                {item.title}
              </Text>
              <Text style={[styles.menuDescription, { color: theme.colors.textSecondary }]}>
                {item.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.coursesContainer}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Formations Populaires
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Courses')}>
            <Text style={[styles.seeAll, { color: theme.colors.primary }]}>
              Voir tout
            </Text>
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        ) : (
          <FlatList
            data={courses.slice(0, 3)}
            renderItem={renderCourseItem}
            keyExtractor={(item, index) => item._id?.toString() || item.id?.toString() || index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        )}
      </View>

      <View style={styles.resourcesContainer}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Ressources PDF
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Resources')}>
            <Text style={[styles.seeAll, { color: theme.colors.primary }]}>
              Voir tout
            </Text>
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        ) : (
          <FlatList
            data={ressourcesPdf.slice(0, 3)}
            renderItem={renderResourceItem}
            keyExtractor={(item, index) => item._id?.toString() || item.id?.toString() || index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  welcome: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  menuContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  menuDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  coursesContainer: {
    padding: 20,
  },
  resourcesContainer: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  horizontalList: {
    paddingRight: 20,
  },
  courseCard: {
    width: 200,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
  },
  courseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
  courseDescription: {
    fontSize: 12,
    marginBottom: 8,
  },
  courseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    marginLeft: 4,
  },
  resourceCard: {
    width: 200,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
  },
  resourceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 12,
    marginBottom: 8,
  },
  resourceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
};

export default HomeScreen;
