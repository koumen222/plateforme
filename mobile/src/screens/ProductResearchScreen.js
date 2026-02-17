import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

const ProductResearchScreen = ({ navigation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('margin'); // margin, revenue, competition, demand
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Simuler une recherche de produits
  const searchProducts = async () => {
    if (!searchTerm.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un terme de recherche');
      return;
    }

    setLoading(true);
    
    // Simuler une recherche API
    setTimeout(() => {
      const mockProducts = [
        {
          id: 1,
          name: `Produit ${searchTerm} Premium`,
          category: 'Électronique',
          buyPrice: 15000,
          sellPrice: 25000,
          margin: 40,
          demand: 'Élevée',
          competition: 'Moyenne',
          niche: 'Bonne',
          suppliers: 3,
          monthlySales: 150,
          rating: 4.5,
          reviews: 89,
          description: 'Produit de haute qualité avec forte demande',
          pros: ['Forte marge', 'Demande élevée', 'Plusieurs fournisseurs'],
          cons: ['Compétition moyenne', 'Nécessite stock'],
          opportunity: '★★★★☆'
        },
        {
          id: 2,
          name: `Accessoire ${searchTerm} Pro`,
          category: 'Accessoires',
          buyPrice: 5000,
          sellPrice: 12000,
          margin: 58,
          demand: 'Très élevée',
          competition: 'Faible',
          niche: 'Excellente',
          suppliers: 5,
          monthlySales: 280,
          rating: 4.2,
          reviews: 156,
          description: 'Accessoire tendance avec faible concurrence',
          pros: ['Excellente marge', 'Faible concurrence', 'Tendance'],
          cons: ['Qualité variable', 'Saisonnier'],
          opportunity: '★★★★★'
        },
        {
          id: 3,
          name: `Service ${searchTerm} Plus`,
          category: 'Services',
          buyPrice: 8000,
          sellPrice: 15000,
          margin: 47,
          demand: 'Moyenne',
          competition: 'Élevée',
          niche: 'Moyenne',
          suppliers: 2,
          monthlySales: 95,
          rating: 3.8,
          reviews: 67,
          description: 'Service numérique avec marché saturé',
          pros: ['Pas de stock', 'Marge correcte'],
          cons: ['Forte concurrence', 'Service client'],
          opportunity: '★★★☆☆'
        },
        {
          id: 4,
          name: `Kit ${searchTerm} Starter`,
          category: 'Kits',
          buyPrice: 12000,
          sellPrice: 22000,
          margin: 45,
          demand: 'Élevée',
          competition: 'Faible',
          niche: 'Très bonne',
          suppliers: 4,
          monthlySales: 180,
          rating: 4.7,
          reviews: 234,
          description: 'Kit complet pour débutants avec excellent potentiel',
          pros: ['Très bonne niche', 'Forte demande', 'Faible concurrence'],
          cons: ['Assemblage requis', 'Formation client'],
          opportunity: '★★★★★'
        },
        {
          id: 5,
          name: `Premium ${searchTerm} Elite`,
          category: 'Luxe',
          buyPrice: 35000,
          sellPrice: 65000,
          margin: 46,
          demand: 'Faible',
          competition: 'Très faible',
          niche: 'Excellente',
          suppliers: 1,
          monthlySales: 45,
          rating: 4.9,
          reviews: 45,
          description: 'Produit luxe pour clientèle premium',
          pros: ['Marge élevée', 'Clientèle fidèle', 'Exclusivité'],
          cons: ['Faible volume', 'Investissement élevé'],
          opportunity: '★★★★☆'
        }
      ];

      setProducts(mockProducts);
      setLoading(false);
    }, 1500);
  };

  const sortProducts = (products) => {
    return [...products].sort((a, b) => {
      switch (sortBy) {
        case 'margin':
          return b.margin - a.margin;
        case 'revenue':
          return (b.sellPrice * b.monthlySales) - (a.sellPrice * a.monthlySales);
        case 'competition':
          return a.competition === 'Faible' ? 1 : a.competition === 'Moyenne' ? 0 : -1;
        case 'demand':
          return a.monthlySales - b.monthlySales;
        default:
          return 0;
      }
    });
  };

  const getOpportunityColor = (opportunity) => {
    const stars = opportunity.split('★').length - 1;
    if (stars >= 4) return '#10b981'; // Vert
    if (stars >= 3) return '#f59e0b'; // Jaune
    return '#ef4444'; // Rouge
  };

  const getCompetitionColor = (competition) => {
    switch (competition) {
      case 'Faible': return '#10b981';
      case 'Moyenne': return '#f59e0b';
      case 'Élevée': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getDemandColor = (demand) => {
    switch (demand) {
      case 'Très élevée': return '#10b981';
      case 'Élevée': return '#10b981';
      case 'Moyenne': return '#f59e0b';
      case 'Faible': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderProductCard = (product) => (
    <TouchableOpacity
      key={product.id}
      style={styles.productCard}
      onPress={() => setSelectedProduct(product)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.productName}>{product.name}</Text>
        <View style={[styles.opportunityBadge, { backgroundColor: getOpportunityColor(product.opportunity) }]}>
          <Text style={styles.opportunityText}>{product.opportunity}</Text>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.priceRow}>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Achat</Text>
            <Text style={styles.buyPrice}>{product.buyPrice.toLocaleString()} FCFA</Text>
          </View>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Vente</Text>
            <Text style={styles.sellPrice}>{product.sellPrice.toLocaleString()} FCFA</Text>
          </View>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Marge</Text>
            <Text style={[styles.margin, { color: product.margin >= 40 ? '#10b981' : '#f59e0b' }]}>
              {product.margin}%
            </Text>
          </View>
        </View>
        
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Demande</Text>
            <Text style={[styles.metricValue, { color: getDemandColor(product.demand) }]}>
              {product.demand}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Compétition</Text>
            <Text style={[styles.metricValue, { color: getCompetitionColor(product.competition) }]}>
              {product.competition}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Ventes/mois</Text>
            <Text style={styles.metricValue}>{product.monthlySales}</Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <MaterialIcons name="star" size={16} color="#f59e0b" />
            <Text style={styles.statText}>{product.rating}</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="comment" size={16} color="#6b7280" />
            <Text style={styles.statText}>{product.reviews}</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="store" size={16} color="#2563eb" />
            <Text style={styles.statText}>{product.suppliers}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderProductDetail = () => {
    if (!selectedProduct) return null;

    const monthlyRevenue = selectedProduct.sellPrice * selectedProduct.monthlySales;
    const monthlyProfit = monthlyRevenue * (selectedProduct.margin / 100);

    return (
      <View style={styles.detailContainer}>
        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>{selectedProduct.name}</Text>
          <TouchableOpacity onPress={() => setSelectedProduct(null)}>
            <MaterialIcons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.detailContent}>
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>📊 Analyse Financière</Text>
            <View style={styles.financialGrid}>
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>Prix d'achat</Text>
                <Text style={styles.financialValue}>{selectedProduct.buyPrice.toLocaleString()} FCFA</Text>
              </View>
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>Prix de vente</Text>
                <Text style={styles.financialValue}>{selectedProduct.sellPrice.toLocaleString()} FCFA</Text>
              </View>
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>Marge</Text>
                <Text style={[styles.financialValue, { color: selectedProduct.margin >= 40 ? '#10b981' : '#f59e0b' }]}>
                  {selectedProduct.margin}%
                </Text>
              </View>
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>Bénéfice/unité</Text>
                <Text style={styles.financialValue}>{(selectedProduct.sellPrice - selectedProduct.buyPrice).toLocaleString()} FCFA</Text>
              </View>
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>Revenu mensuel</Text>
                <Text style={styles.financialValue}>{monthlyRevenue.toLocaleString()} FCFA</Text>
              </View>
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>Bénéfice mensuel</Text>
                <Text style={[styles.financialValue, { color: '#10b981' }]}>{monthlyProfit.toLocaleString()} FCFA</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>📈 Analyse Marché</Text>
            <View style={styles.marketInfo}>
              <View style={styles.marketRow}>
                <Text style={styles.marketLabel}>Catégorie:</Text>
                <Text style={styles.marketValue}>{selectedProduct.category}</Text>
              </View>
              <View style={styles.marketRow}>
                <Text style={styles.marketLabel}>Demande:</Text>
                <Text style={[styles.marketValue, { color: getDemandColor(selectedProduct.demand) }]}>
                  {selectedProduct.demand}
                </Text>
              </View>
              <View style={styles.marketRow}>
                <Text style={styles.marketLabel}>Compétition:</Text>
                <Text style={[styles.marketValue, { color: getCompetitionColor(selectedProduct.competition) }]}>
                  {selectedProduct.competition}
                </Text>
              </View>
              <View style={styles.marketRow}>
                <Text style={styles.marketLabel}>Niche:</Text>
                <Text style={[styles.marketValue, { color: getOpportunityColor(selectedProduct.opportunity) }]}>
                  {selectedProduct.niche}
                </Text>
              </View>
              <View style={styles.marketRow}>
                <Text style={styles.marketLabel}>Ventes/mois:</Text>
                <Text style={styles.marketValue}>{selectedProduct.monthlySales}</Text>
              </View>
              <View style={styles.marketRow}>
                <Text style={styles.marketLabel}>Fournisseurs:</Text>
                <Text style={styles.marketValue}>{selectedProduct.suppliers}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>👥 Avis Clients</Text>
            <View style={styles.reviewsInfo}>
              <View style={styles.reviewsRow}>
                <MaterialIcons name="star" size={20} color="#f59e0b" />
                <Text style={styles.reviewsRating}>{selectedProduct.rating} / 5.0</Text>
                <Text style={styles.reviewsCount}>({selectedProduct.reviews} avis)</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>✅ Avantages</Text>
            {selectedProduct.pros.map((pro, index) => (
              <View key={index} style={styles.proConItem}>
                <MaterialIcons name="check-circle" size={16} color="#10b981" />
                <Text style={styles.proConText}>{pro}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>⚠️ Inconvénients</Text>
            {selectedProduct.cons.map((con, index) => (
              <View key={index} style={styles.proConItem}>
                <MaterialIcons name="warning" size={16} color="#f59e0b" />
                <Text style={styles.proConText}>{con}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>📝 Description</Text>
            <Text style={styles.description}>{selectedProduct.description}</Text>
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Recherche Produits</Text>
        <Text style={styles.subtitle}>Analysez les opportunités de marché</Text>
      </View>
      
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un produit (ex: téléphone, ordinateur...)"
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={searchProducts}
          />
          <TouchableOpacity style={styles.searchButton} onPress={searchProducts}>
            <MaterialIcons name="search" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Trier par:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'margin', label: 'Marge', icon: 'trending-up' },
              { key: 'revenue', label: 'Revenu', icon: 'attach-money' },
              { key: 'competition', label: 'Compétition', icon: 'people' },
              { key: 'demand', label: 'Demande', icon: 'trending-up' }
            ].map((sort) => (
              <TouchableOpacity
                key={sort.key}
                style={[styles.sortButton, sortBy === sort.key && styles.sortButtonActive]}
                onPress={() => setSortBy(sort.key)}
              >
                <MaterialIcons 
                  name={sort.icon} 
                  size={16} 
                  color={sortBy === sort.key ? '#fff' : '#6b7280'} 
                />
                <Text style={[styles.sortButtonText, sortBy === sort.key && styles.sortButtonTextActive]}>
                  {sort.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <MaterialIcons name="search" size={48} color="#6b7280" />
          <Text style={styles.loadingText}>Recherche en cours...</Text>
        </View>
      ) : products.length > 0 ? (
        <ScrollView style={styles.productsContainer}>
          {sortProducts(products).map(renderProductCard)}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="search" size={48} color="#6b7280" />
          <Text style={styles.emptyText}>Recherchez des produits pour analyser les opportunités</Text>
        </View>
      )}
      
      {selectedProduct && renderProductDetail()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  searchSection: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginRight: 12,
    backgroundColor: '#f9fafb',
  },
  searchButton: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginRight: 12,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  sortButtonActive: {
    backgroundColor: '#2563eb',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  sortButtonTextActive: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
  },
  productsContainer: {
    flex: 1,
    padding: 16,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  opportunityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  opportunityText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  cardContent: {
    gap: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceItem: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  buyPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  sellPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  margin: {
    fontSize: 14,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6b7280',
  },
  detailContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    zIndex: 1000,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  detailContent: {
    flex: 1,
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  financialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  financialItem: {
    width: (screenWidth - 40) / 2 - 6,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  financialLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  financialValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  marketInfo: {
    gap: 8,
  },
  marketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  marketLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  marketValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  reviewsInfo: {
    gap: 8,
  },
  reviewsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewsRating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  reviewsCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  proConItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  proConText: {
    fontSize: 14,
    color: '#374151',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563',
  },
});

export default ProductResearchScreen;
