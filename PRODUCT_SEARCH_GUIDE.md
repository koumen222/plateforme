# Guide de Recherche de Produits

## Overview

La fonctionnalité de recherche produits permet aux utilisateurs de rechercher des produits depuis le site web public et depuis l'interface admin.

## Fonctionnalités

### 1. Recherche Publique (Landing Page)
- **URL**: `/` (landing page)
- **Accès**: Public, sans authentification
- **Endpoint**: `GET /api/ecom/products/search`
- **Fonctionnalités**:
  - Recherche par nom de produit (insensible à la casse)
  - Recherche par statut (test, stable, winner, etc.)
  - Affichage des résultats en temps réel avec debounce (300ms)
  - Limitation aux produits actifs uniquement
  - Suggestions de produits populaires

### 2. Recherche Admin (ProductsList)
- **URL**: `/ecom/products` (interface admin)
- **Accès**: Authentifié (rôles admin, closeuse, compta)
- **Endpoint**: `GET /api/ecom/products`
- **Fonctionnalités**:
  - Recherche par nom et statut
  - Filtres multiples: statut, activité (actif/inactif)
  - Réinitialisation des filtres
  - Recherche combinée avec tous les filtres

## API Endpoints

### Recherche Publique
```http
GET /api/ecom/products/search?search=term&status=winner&isActive=true&limit=20
```

**Paramètres**:
- `search` (optionnel): Terme de recherche
- `status` (optionnel): Filtre par statut (valeurs séparées par virgule)
- `isActive` (optionnel): Filtre par activité (true/false)
- `limit` (défaut: 20): Nombre maximum de résultats

**Réponse**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "product_id",
      "name": "Nom du produit",
      "status": "winner",
      "sellingPrice": 15000,
      "productCost": 8000,
      "deliveryCost": 2000,
      "avgAdsCost": 1000,
      "stock": 50,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1,
  "search": "term"
}
```

### Recherche Admin
```http
GET /api/ecom/products?search=term&status=winner&isActive=true
```

**Paramètres**: Same as public search + workspace filtering

## Configuration

### Variables d'Environnement

Pour la recherche publique, ajoutez dans votre `.env`:
```env
DEFAULT_WORKSPACE_ID=votre_workspace_id_public
```

### Index MongoDB

Les index suivants sont configurés pour optimiser les performances:
```javascript
// Index pour recherche plein texte
productSchema.index({ name: 'text', status: 'text' });

// Index pour filtres rapides
productSchema.index({ status: 1, isActive: 1 });
productSchema.index({ workspaceId: 1, isActive: 1 });
```

## Composants Frontend

### ProductSearch Component
**Location**: `frontend/src/ecom/components/ProductSearch.jsx`

**Props**: Aucun (composant autonome)

**Fonctionnalités**:
- Recherche avec debounce
- Affichage des résultats en dropdown
- Formatage des prix
- Badges de statut
- Suggestions populaires

### ProductsList Component
**Location**: `frontend/src/ecom/pages/ProductsList.jsx`

**Améliorations ajoutées**:
- Barre de recherche avec filtres
- Filtres par statut et activité
- Réinitialisation des filtres
- Messages d'erreur améliorés

## Services Frontend

### publicApi Service
**Location**: `frontend/src/ecom/services/publicApi.js`

**Fonctions**:
- `searchProducts(query, options)`: Recherche de produits
- `getPopularProducts(limit)`: Produits populaires
- `getProductDetails(productId)`: Détails d'un produit

## Utilisation

### Pour les visiteurs du site
1. Allez sur la landing page
2. Utilisez la barre de recherche dans la section "Découvrez nos produits"
3. Tapez votre recherche (ex: "Gummies", "Sérum")
4. Les résultats apparaissent en temps réel
5. Cliquez sur "Voir tous les produits" pour accéder à l'interface complète

### Pour les administrateurs
1. Connectez-vous à l'interface admin
2. Allez dans la section "Produits"
3. Utilisez la barre de recherche et les filtres
4. Combinez les filtres pour affiner votre recherche
5. Réinitialisez les filtres avec le bouton dédié

## Performance

### Optimisations
- **Debounce**: 300ms pour éviter les requêtes excessives
- **Index MongoDB**: Index text et composites pour des recherches rapides
- **Limitation**: Résultats limités pour éviter les surcharges
- **Caching**: Possibilité d'ajouter Redis cache pour les recherches populaires

### Monitoring
Les logs suivants sont disponibles:
- `🔍 GET /api/ecom/products/search - Recherche publique`
- `📦 GET /api/ecom/products - Liste des produits`
- `🔎 Filtre appliqué:` pour le debugging

## Sécurité

- La recherche publique ne retourne que les produits actifs
- Le workspace est filtré automatiquement
- Les champs sensibles sont limités dans la réponse publique
- Rate limiting recommandé pour l'endpoint public

## Évolutions Possibles

1. **Recherche avancée**: Ajouter plus de champs (catégorie, prix, etc.)
2. **Auto-complétion**: Suggestions de recherche en temps réel
3. **Recherche par image**: Upload d'image pour trouver des produits similaires
4. **Analytics**: Tracking des recherches pour améliorer les recommandations
5. **Favoris**: Permettre aux utilisateurs de sauvegarder leurs recherches
