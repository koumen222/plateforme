# 💝 Ajouter des produits Saint-Valentin en local

## Méthode 1 : Utiliser le script automatique

Le script ajoute automatiquement 5 produits Saint-Valentin de test :

```bash
cd backend
npm run add-valentine
```

## Méthode 2 : Ajouter manuellement via MongoDB

1. Connectez-vous à MongoDB (via MongoDB Compass ou mongo shell)
2. Sélectionnez votre base de données
3. Trouvez la collection `winningproducts`
4. Ajoutez un nouveau document avec ces champs :

```json
{
  "name": "Nom du produit",
  "category": "Cadeaux romantiques",
  "priceRange": "5000 - 15000 FCFA",
  "countries": ["Cameroun", "Côte d'Ivoire"],
  "saturation": 25,
  "demandScore": 85,
  "trendScore": 90,
  "status": "hot",
  "problemSolved": "Description du problème résolu",
  "whyItWorks": "Pourquoi ça fonctionne",
  "proofIndicator": "Indicateur de preuve",
  "supplierPrice": 2000,
  "sellingPrice": 8000,
  "marketingAngle": "Angle marketing",
  "scalingPotential": "Élevé",
  "alibabaLink": "https://www.alibaba.com/...",
  "specialEvent": "saint-valentin"
}
```

## Méthode 3 : Via l'API (si vous créez une route admin)

Vous pouvez créer une route admin pour ajouter des produits Saint-Valentin via l'interface.

## Vérification

Après avoir ajouté les produits :

1. Redémarrez le backend si nécessaire
2. Allez sur la page `/produits-gagnants` dans le frontend
3. Vous devriez voir la section "Winners Saint-Valentin" en haut de la page

## Produits de test inclus

Le script ajoute automatiquement :
- Bouquet de roses artificielles LED
- Boîte cadeau romantique avec message personnalisé
- Bijoux en forme de cœur
- Parfum romantique pour couple
- Lumière LED en forme de cœur

