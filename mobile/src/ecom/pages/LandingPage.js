import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const LandingPage = ({ navigation }) => {
  const features = [
    {
      icon: 'speed',
      title: 'Rapide & Efficace',
      description: 'Gérez vos commandes en quelques clics'
    },
    {
      icon: 'people',
      title: 'Multi-utilisateurs',
      description: 'Closeuses, comptables, livreurs'
    },
    {
      icon: 'analytics',
      title: 'Statistiques',
      description: 'Suivez vos performances en temps réel'
    },
    {
      icon: 'security',
      title: 'Sécurisé',
      description: 'Vos données sont protégées'
    }
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.bgEffect1} />
        <View style={styles.bgEffect2} />
        
        <View style={styles.heroContent}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>EC</Text>
            </View>
          </View>
          
          <Text style={styles.heroTitle}>Ecom Cockpit</Text>
          <Text style={styles.heroSubtitle}>
            La plateforme tout-en-un pour gérer votre business e-commerce
          </Text>

          <View style={styles.heroButtons}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.primaryButtonText}>Se connecter</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.secondaryButtonText}>Créer un compte</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Pourquoi Ecom Cockpit ?</Text>
        
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <MaterialIcons name={feature.icon} size={28} color="#2563eb" />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Roles Section */}
      <View style={styles.rolesSection}>
        <Text style={styles.sectionTitle}>Pour toute votre équipe</Text>
        
        <View style={styles.roleCard}>
          <View style={[styles.roleIcon, { backgroundColor: '#2563eb20' }]}>
            <MaterialIcons name="admin-panel-settings" size={24} color="#2563eb" />
          </View>
          <View style={styles.roleContent}>
            <Text style={styles.roleTitle}>Admin</Text>
            <Text style={styles.roleDescription}>
              Gérez les produits, l'équipe, les stocks et visualisez toutes les données
            </Text>
          </View>
        </View>

        <View style={styles.roleCard}>
          <View style={[styles.roleIcon, { backgroundColor: '#ec489920' }]}>
            <MaterialIcons name="support-agent" size={24} color="#ec4899" />
          </View>
          <View style={styles.roleContent}>
            <Text style={styles.roleTitle}>Closeuse</Text>
            <Text style={styles.roleDescription}>
              Traitez les commandes, gérez les clients et envoyez vos rapports quotidiens
            </Text>
          </View>
        </View>

        <View style={styles.roleCard}>
          <View style={[styles.roleIcon, { backgroundColor: '#10b98120' }]}>
            <MaterialIcons name="account-balance" size={24} color="#10b981" />
          </View>
          <View style={styles.roleContent}>
            <Text style={styles.roleTitle}>Comptabilité</Text>
            <Text style={styles.roleDescription}>
              Suivez les transactions, les revenus et les dépenses en temps réel
            </Text>
          </View>
        </View>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>Prêt à commencer ?</Text>
        <Text style={styles.ctaSubtitle}>
          Créez votre espace de travail en quelques minutes
        </Text>
        
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.ctaButtonText}>Commencer gratuitement</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © {new Date().getFullYear()} Ecom Cockpit · Tous droits réservés
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  hero: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  bgEffect1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
  },
  bgEffect2: {
    position: 'absolute',
    bottom: -50,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
  },
  heroContent: {
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  heroButtons: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#d1d5db',
    fontSize: 16,
    fontWeight: '600',
  },
  featuresSection: {
    padding: 20,
    backgroundColor: '#111827',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#2563eb15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
  },
  rolesSection: {
    padding: 20,
    backgroundColor: '#030712',
  },
  roleCard: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleContent: {
    flex: 1,
    marginLeft: 14,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
  },
  ctaSection: {
    padding: 32,
    backgroundColor: '#1f2937',
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  ctaSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
  ctaButton: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    backgroundColor: '#030712',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#4b5563',
  },
});

export default LandingPage;
