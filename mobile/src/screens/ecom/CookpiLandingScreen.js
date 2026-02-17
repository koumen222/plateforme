import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useThemeSafe } from '../../utils/useThemeSafe';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const CookpiLandingScreen = ({ navigation }) => {
  const theme = useThemeSafe();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    loadLandingData();
  }, []);

  const loadLandingData = async () => {
    try {
      // Simuler le chargement des données
      const mockProducts = [
        {
          id: 1,
          name: 'Cooking Set Pro',
          price: 49.99,
          image: 'https://via.placeholder.com/200x150',
          rating: 4.8,
          reviews: 124,
        },
        {
          id: 2,
          name: 'Recipe Book Premium',
          price: 29.99,
          image: 'https://via.placeholder.com/200x150',
          rating: 4.6,
          reviews: 89,
        },
        {
          id: 3,
          name: 'Kitchen Tools Kit',
          price: 34.99,
          image: 'https://via.placeholder.com/200x150',
          rating: 4.7,
          reviews: 156,
        },
      ];

      const mockTestimonials = [
        {
          id: 1,
          name: 'Marie L.',
          text: 'Excellent produit! Ma cuisine a été transformée.',
          rating: 5,
        },
        {
          id: 2,
          name: 'Jean D.',
          text: 'Livraison rapide et produit de qualité.',
          rating: 5,
        },
        {
          id: 3,
          name: 'Sophie M.',
          text: 'Je recommande vivement ces produits.',
          rating: 4,
        },
      ];

      setFeaturedProducts(mockProducts);
      setTestimonials(mockTestimonials);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <MaterialIcons
          key={i}
          name={i <= rating ? 'star' : 'star-border'}
          size={16}
          color={i <= rating ? '#FFD700' : '#ccc'}
        />
      );
    }
    return stars;
  };

  const renderFeatureCard = (icon, title, description) => (
    <View key={title} style={[styles.featureCard, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.featureIcon, { backgroundColor: theme.colors.primary }]}>
        <MaterialIcons name={icon} size={24} color="white" />
      </View>
      <Text style={[styles.featureTitle, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.featureDescription, { color: theme.colors.textSecondary }]}>
        {description}
      </Text>
    </View>
  );

  const renderProductCard = (product) => (
    <TouchableOpacity
      key={product.id}
      style={[styles.productCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
    >
      <Image source={{ uri: product.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: theme.colors.text }]}>
          {product.name}
        </Text>
        <View style={styles.productRating}>
          {renderStars(Math.floor(product.rating))}
          <Text style={[styles.ratingText, { color: theme.colors.textSecondary }]}>
            {product.rating} ({product.reviews})
          </Text>
        </View>
        <Text style={[styles.productPrice, { color: theme.colors.primary }]}>
          {product.price}€
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderTestimonialCard = (testimonial) => (
    <View
      key={testimonial.id}
      style={[styles.testimonialCard, { backgroundColor: theme.colors.surface }]}
    >
      <View style={styles.testimonialHeader}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.avatarText}>{testimonial.name.charAt(0)}</Text>
        </View>
        <View style={styles.testimonialInfo}>
          <Text style={[styles.testimonialName, { color: theme.colors.text }]}>
            {testimonial.name}
          </Text>
          <View style={styles.testimonialRating}>
            {renderStars(testimonial.rating)}
          </View>
        </View>
      </View>
      <Text style={[styles.testimonialText, { color: theme.colors.textSecondary }]}>
        "{testimonial.text}"
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Cookpi
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Votre partenaire cuisine
            </Text>
            
            {/* Auth Buttons */}
            <View style={styles.authButtons}>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
                onPress={() => navigation.navigate('EcomLogin')}
              >
                <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>
                  Se connecter
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.ctaButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('Products')}
              >
                <Text style={styles.ctaButtonText}>Découvrir nos produits</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.registerButton, { backgroundColor: theme.colors.surface }]}
                onPress={() => navigation.navigate('EcomRegister')}
              >
                <Text style={[styles.registerButtonText, { color: theme.colors.primary }]}>
                  Créer un compte
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Pourquoi nous choisir?
          </Text>
          <View style={styles.featuresGrid}>
            {renderFeatureCard(
              'local-shipping',
              'Livraison rapide',
              'Livraison sous 48h en France métropolitaine'
            )}
            {renderFeatureCard(
              'verified',
              'Qualité garantie',
              'Produits testés et approuvés par des chefs'
            )}
            {renderFeatureCard(
              'support-agent',
              'Support 24/7',
              'Assistance client disponible à tout moment'
            )}
            {renderFeatureCard(
              'eco',
              'Écologique',
              'Emballages recyclables et produits durables'
            )}
          </View>
        </View>

        {/* Featured Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Produits populaires
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Products')}>
              <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
                Voir tout
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {featuredProducts.map(renderProductCard)}
          </ScrollView>
        </View>

        {/* Testimonials */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Témoignages clients
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {testimonials.map(renderTestimonialCard)}
          </ScrollView>
        </View>

        {/* Newsletter */}
        <View style={[styles.newsletter, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.newsletterTitle, { color: theme.colors.text }]}>
            Restez informé
          </Text>
          <Text style={[styles.newsletterDescription, { color: theme.colors.textSecondary }]}>
            Recevez nos offres exclusives et nouveautés
          </Text>
          <TouchableOpacity
            style={[styles.newsletterButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => Alert.alert('Info', 'Fonctionnalité newsletter à implémenter')}
          >
            <Text style={styles.newsletterButtonText}>S\'inscrire</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            © 2024 Cookpi. Tous droits réservés.
          </Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => Alert.alert('Info', 'Mentions légales à implémenter')}>
              <Text style={[styles.footerLink, { color: theme.colors.primary }]}>
                Mentions légales
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Alert.alert('Info', 'CGV à implémenter')}>
              <Text style={[styles.footerLink, { color: theme.colors.primary }]}>
                CGV
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
    textAlign: 'center',
  },
  ctaButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  ctaButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  authButtons: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  secondaryButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 12,
    width: '100%',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  registerButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    width: '100%',
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 16,
    fontWeight: '500',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  productCard: {
    width: 200,
    marginRight: 15,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
  },
  productImage: {
    width: '100%',
    height: 150,
  },
  productInfo: {
    padding: 15,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  productRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  testimonialCard: {
    width: 280,
    padding: 20,
    borderRadius: 12,
    marginRight: 15,
    elevation: 2,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
  },
  testimonialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  testimonialInfo: {
    flex: 1,
  },
  testimonialName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  testimonialRating: {
    flexDirection: 'row',
  },
  testimonialText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  newsletter: {
    margin: 20,
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
  },
  newsletterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  newsletterDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  newsletterButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  newsletterButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    marginBottom: 10,
  },
  footerLinks: {
    flexDirection: 'row',
  },
  footerLink: {
    fontSize: 14,
    marginHorizontal: 10,
  },
});

export default CookpiLandingScreen;
