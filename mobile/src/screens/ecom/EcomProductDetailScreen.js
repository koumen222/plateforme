import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Share,
} from 'react-native';
import { useThemeSafe } from '../../contexts/ThemeContext';
import { useEcomAuth } from '../../contexts/ecom/EcomAuthContext';
import { useCart } from '../../contexts/ecom/CartContext';
import { useCurrency } from '../../contexts/ecom/CurrencyContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ecomApi } from '../../services/ecom/ecomApi';

const EcomProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const theme = useThemeSafe();
  const { isAuthenticated } = useEcomAuth();
  const { addToCart } = useCart();
  const { formatCurrency } = useCurrency();
  
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    loadProductData();
  }, [productId]);

  const loadProductData = async () => {
    try {
      setLoading(true);
      
      const response = await ecomApi.products.getById(productId);
      if (response.data.success) {
        const productData = response.data.data;
        setProduct(productData);
        
        // Charger les produits associés
        if (productData.categoryId) {
          const relatedResponse = await ecomApi.products.getByCategory(productData.categoryId);
          if (relatedResponse.data.success) {
            const related = relatedResponse.data.data.filter(p => p.id !== productId).slice(0, 4);
            setRelatedProducts(related);
          }
        }
      }
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails du produit');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour ajouter des produits au panier',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => navigation.navigate('EcomLogin') }
        ]
      );
      return;
    }

    if ((product.stock || 0) < quantity) {
      Alert.alert('Stock insuffisant', 'La quantité demandée dépasse le stock disponible');
      return;
    }

    try {
      await addToCart({
        id: product.id,
        name: product.name || product.nom,
        price: product.sellingPrice || product.prix,
        image: product.image_url || product.image,
        description: product.description || product.description_courte,
        quantity
      });
      
      Alert.alert('Succès', 'Produit ajouté au panier');
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le produit au panier');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Découvrez ce produit: ${product.name || product.nom}\n${formatCurrency(product.sellingPrice || product.prix)}`,
        url: `https://votre-app.com/products/${product.id}`
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const toggleFavorite = () => {
    setFavorite(!favorite);
    // Implémenter la logique de favoris ici
  };

  const renderImageGallery = () => {
    const images = [
      product.image_url || product.image,
      ...(product.additionalImages || [])
    ].filter(Boolean);

    if (images.length === 0) {
      return (
        <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.surface }]}>
          <MaterialIcons name="image" size={64} color={theme.colors.textSecondary} />
        </View>
      );
    }

    return (
      <View style={styles.imageGallery}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {images.map((image, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.imageThumbnail,
                { borderColor: selectedImage === index ? theme.colors.primary : theme.colors.border }
              ]}
              onPress={() => setSelectedImage(index)}
            >
              <Image source={{ uri: image }} style={styles.thumbnailImage} resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <View style={styles.mainImageContainer}>
          <Image 
            source={{ uri: images[selectedImage] }} 
            style={styles.mainImage} 
            resizeMode="contain" 
          />
        </View>
      </View>
    );
  };

  const renderRelatedProduct = ({ item }) => (
    <TouchableOpacity
      style={[styles.relatedProductCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => navigation.push('EcomProductDetail', { productId: item.id })}
    >
      <Image
        source={{ uri: item.image_url || item.image || 'https://via.placeholder.com/100x100' }}
        style={styles.relatedProductImage}
        resizeMode="cover"
      />
      <Text style={[styles.relatedProductName, { color: theme.colors.text }]} numberOfLines={2}>
        {item.name || item.nom}
      </Text>
      <Text style={[styles.relatedProductPrice, { color: theme.colors.primary }]}>
        {formatCurrency(item.sellingPrice || item.prix || 0)}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Chargement du produit...
        </Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <MaterialIcons name="error" size={64} color={theme.colors.error} />
        <Text style={[styles.errorText, { color: theme.colors.text }]}>
          Produit non trouvé
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggleFavorite}>
            <MaterialIcons 
              name={favorite ? "favorite" : "favorite-border"} 
              size={24} 
              color={favorite ? theme.colors.error : theme.colors.text} 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare}>
            <MaterialIcons name="share" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Image Gallery */}
      {renderImageGallery()}

      {/* Product Info */}
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: theme.colors.text }]}>
          {product.name || product.nom}
        </Text>
        
        <View style={styles.priceContainer}>
          <Text style={[styles.productPrice, { color: theme.colors.primary }]}>
            {formatCurrency(product.sellingPrice || product.prix || 0)}
          </Text>
          {product.oldPrice && (
            <Text style={[styles.oldPrice, { color: theme.colors.textSecondary }]}>
              {formatCurrency(product.oldPrice)}
            </Text>
          )}
        </View>

        {/* Stock Info */}
        <View style={styles.stockContainer}>
          <Text style={[
            styles.stockText,
            { 
              color: (product.stock || 0) > 10 ? theme.colors.success : 
                     (product.stock || 0) > 0 ? theme.colors.warning : 
                     theme.colors.error
            }
          ]}>
            {(product.stock || 0) > 0 ? `En stock: ${product.stock} unités` : 'Rupture de stock'}
          </Text>
        </View>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Description
          </Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {product.description || product.description_longue || 'Aucune description disponible'}
          </Text>
        </View>

        {/* Specifications */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <View style={styles.specificationsContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Caractéristiques
            </Text>
            {Object.entries(product.specifications).map(([key, value]) => (
              <View key={key} style={styles.specificationRow}>
                <Text style={[styles.specLabel, { color: theme.colors.textSecondary }]}>
                  {key}:
                </Text>
                <Text style={[styles.specValue, { color: theme.colors.text }]}>
                  {value}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Quantity Selector */}
        {(product.stock || 0) > 0 && (
          <View style={styles.quantityContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Quantité
            </Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={[styles.quantityButton, { backgroundColor: theme.colors.surface }]}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <MaterialIcons name="remove" size={20} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={[styles.quantityText, { color: theme.colors.text }]}>
                {quantity}
              </Text>
              <TouchableOpacity
                style={[styles.quantityButton, { backgroundColor: theme.colors.surface }]}
                onPress={() => setQuantity(Math.min(product.stock || 0, quantity + 1))}
              >
                <MaterialIcons name="add" size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Add to Cart Button */}
        <TouchableOpacity
          style={[
            styles.addToCartButton,
            { 
              backgroundColor: (product.stock || 0) > 0 ? theme.colors.primary : theme.colors.border 
            }
          ]}
          onPress={handleAddToCart}
          disabled={(product.stock || 0) === 0}
        >
          <MaterialIcons 
            name="add-shopping-cart" 
            size={20} 
            color={(product.stock || 0) > 0 ? 'white' : theme.colors.textSecondary} 
          />
          <Text style={[
            styles.addToCartButtonText,
            { color: (product.stock || 0) > 0 ? 'white' : theme.colors.textSecondary }
          ]}>
            {(product.stock || 0) > 0 ? 'Ajouter au panier' : 'Rupture de stock'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <View style={styles.relatedProductsContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Produits similaires
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {relatedProducts.map((item) => (
              <View key={item.id} style={styles.relatedProductWrapper}>
                {renderRelatedProduct({ item })}
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  imageGallery: {
    marginBottom: 24,
  },
  imagePlaceholder: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainImageContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  mainImage: {
    width: '100%',
    height: 300,
  },
  imageThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    marginRight: 8,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  productInfo: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  productPrice: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  oldPrice: {
    fontSize: 18,
    textDecorationLine: 'line-through',
    marginLeft: 12,
  },
  stockContainer: {
    marginBottom: 24,
  },
  stockText: {
    fontSize: 16,
    fontWeight: '500',
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  specificationsContainer: {
    marginBottom: 24,
  },
  specificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  specLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  specValue: {
    fontSize: 14,
  },
  quantityContainer: {
    marginBottom: 24,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addToCartButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  relatedProductsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  relatedProductWrapper: {
    marginRight: 12,
  },
  relatedProductCard: {
    width: 150,
    borderRadius: 12,
    overflow: 'hidden',
  },
  relatedProductImage: {
    width: '100%',
    height: 100,
  },
  relatedProductName: {
    fontSize: 14,
    fontWeight: '500',
    margin: 8,
    marginBottom: 4,
  },
  relatedProductPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 8,
    marginBottom: 8,
  },
};

export default EcomProductDetailScreen;
