# Guide de Dépannage des Statistiques de Commandes

## 🚨 Problème : Incohérence entre KPIs et Commandes Affichées

**Symptôme** : Les commandes affichées montrent "Livré" mais les KPIs indiquent 0 revenu livré et 0 commandes livrées.

## 🔍 Étapes de Diagnostic

### 1. Vérifier les Logs du Backend

```bash
# Dans les logs du backend, cherchez :
📊 Stats aggregation result:
📊 Filter applied:
📊 Status delivered: X commandes, revenue: Y
📊 Final stats:
```

### 2. Lancer le Script de Debug

```bash
cd backend/ecom
node debug_orders.js
```

Ce script va :
- ✅ Lister tous les statuts uniques dans la base
- ✅ Compter les commandes par statut  
- ✅ Vérifier les revenus par statut
- ✅ Montrer des exemples concrets

### 3. Problèmes Communs Identifiés

#### A. Statut en Français vs Anglais
**Problème** : Commandes avec `status: "livré"` au lieu de `"delivered"`

**Solution** : Les commandes synchronisées avant l'amélioration peuvent avoir des statuts en français.

**Vérification** :
```javascript
// Dans debug_orders.js, regarder si vous avez :
livré: X commandes
delivered: Y commandes
```

**Correction** :
```bash
# Mettre à jour tous les statuts "livré" -> "delivered"
node -e "
const mongoose = require('mongoose');
const Order = require('./models/Order');

mongoose.connect('mongodb://localhost:27017/plateforme').then(async () => {
  const result = await Order.updateMany(
    { status: { \$in: ['livré', 'livre', 'LIVRÉ', 'LIVRE'] } },
    { status: 'delivered' }
  );
  console.log(\`✅ \${result.modifiedCount} commandes mises à jour\`);
  mongoose.disconnect();
});
"
```

#### B. Prix ou Quantité à 0
**Problème** : Commandes livrées mais avec `price: 0` ou `quantity: 0`

**Vérification** : Dans les logs, cherchez :
```
📊 Status delivered: X commandes, revenue: 0
```

**Solution** : Mettre à jour les prix manquants

#### C. Filtres qui Excluent les Commandes
**Problème** : Les stats utilisent un filtre différent des commandes affichées

**Vérification** : Dans les logs, comparez :
```
📊 Filter applied: { workspaceId: ..., status: ... }
```

## 🛠️ Solutions Rapides

### Solution 1 : Standardiser les Statuts

```javascript
// Dans backend/ecom/routes/orders.js - ajout temporaire
router.get('/fix-statuses', async (req, res) => {
  const statusMapping = {
    'livré': 'delivered', 'livre': 'delivered', 'LIVRÉ': 'delivered',
    'en attente': 'pending', 'attente': 'pending',
    'confirmé': 'confirmed', 'confirme': 'confirmed',
    // ... ajouter tous les mappings nécessaires
  };
  
  let totalUpdated = 0;
  
  for (const [oldStatus, newStatus] of Object.entries(statusMapping)) {
    const result = await Order.updateMany(
      { status: oldStatus },
      { status: newStatus }
    );
    totalUpdated += result.modifiedCount;
    console.log(`✅ ${oldStatus} -> ${newStatus}: ${result.modifiedCount} commandes`);
  }
  
  res.json({ success: true, message: `${totalUpdated} commandes mises à jour` });
});
```

### Solution 2 : Recalculer les Stats

```javascript
// Forcer le rafraîchissement des stats
fetch('/api/ecom/orders?_refresh=true');
```

### Solution 3 : Vérifier la Synchronisation

1. **Resynchronisez** votre Google Sheet
2. **Vérifiez les logs** pour les nouveaux mappings
3. **Confirmez** que les statuts sont corrects

## 📊 Vérification Manuelle

### Dans MongoDB Compass
```javascript
// Vérifier les statuts
db.ecom_orders.distinct("status")

// Compter par statut
db.ecom_orders.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])

// Vérifier les revenus livrés
db.ecom_orders.aggregate([
  { $match: { status: "delivered" } },
  { $group: { _id: null, revenue: { $sum: { $multiply: ["$price", "$quantity"] } } } }
])
```

### Dans le Frontend
```javascript
// Ouvrir la console et vérifier
console.log('Stats reçues:', stats);
console.log('Commandes reçues:', orders);
```

## 🎯 Checklist de Résolution

- [ ] Lancer `debug_orders.js` et analyser les résultats
- [ ] Vérifier les logs du backend après chargement des commandes
- [ ] Standardiser les statuts (français → anglais)
- [ ] Mettre à jour les commandes avec prix = 0
- [ ] Resynchroniser les données si nécessaire
- [ **] Vérifier que les KPIs correspondent aux commandes

## 🆘 Si le Problème Persiste

1. **Redémarrez** le backend après les modifications
2. **Videz** le cache du navigateur
3. **Vérifiez** que vous n'avez pas de filtres actifs
4. **Contactez** le support avec les logs obtenus

---

## 📝 Notes importantes

- Les stats sont calculées **en temps réel** à chaque chargement
- Les filtres appliqués affectent **à la fois** les commandes et les stats
- Les statuts en français doivent être convertis en anglais
- Le revenu livré ne compte que les commandes avec `status: "delivered"`
