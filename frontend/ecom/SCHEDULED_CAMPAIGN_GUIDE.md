# 📅 Guide : Campagnes Programmées et Aperçu

## 📋 Objectif
Permettre d'utiliser la fonctionnalité d'aperçu à une personne même pour les campagnes programmées, et gérer l'envoi manuel des campagnes programmées.

## 🚀 **Comment Utiliser pour les Campagnes Programmées**

### 1️⃣ **Reconnaître une Campagne Programmée**
Dans la liste des campagnes, une campagne programmée a :
- **Badge orange** : `Programmée`
- **Date/heure** affichée : `Programmée: 08 févr. 26, 14:30`
- **Bouton orange** : `[📤 Envoyer maintenant]`

### 2️⃣ **Options Disponibles**

#### 🎯 **Option 1 : Aperçu à une Personne**
- **Bouton bleu** `Aperçu` → Toujours disponible
- **Ouvre la modale** pour choisir le destinataire
- **Envoie à une seule personne** même si programmée
- **Ne modifie pas** la programmation

#### 🎯 **Option 2 : Envoi Manuel Immédiat**
- **Bouton orange** `Envoyer maintenant` → Disponible pour les programmées
- **Annule la programmation** automatiquement
- **Envoie à tout le monde** maintenant
- **Statut change** : `Programmée` → `Brouillon` → `Envoyée`

#### 🎯 **Option 3 : Laisser la Programmation**
- **Ne faites rien** → La campagne s'enverra automatiquement
- **Respecte la date/heure** programmée
- **Aucune action manuelle** requise

## 🔄 **Workflow pour Campagnes Programmées**

### 🎯 **Scénario 1 : Tester Avant l'Envoi Automatique**
1. **Repérez votre campagne** programmée
2. **Cliquez "Aperçu"** (bouton bleu)
3. **Sélectionnez une personne** de confiance
4. **Cliquez "Aperçu"** à côté de son nom
5. **Vérifiez la réception** sur WhatsApp
6. **La campagne reste programmée** pour l'envoi automatique

### 🎯 **Scénario 2 : Envoyer Manuellement Maintenant**
1. **Repérez votre campagne** programmée
2. **Cliquez "Envoyer maintenant"** (bouton orange)
3. **Confirmez l'annulation** de la programmation
4. **La campagne s'envoie** immédiatement à tout le monde
5. **Statut devient** : `Envoyée`

### 🎯 **Scénario 3 : Modifier la Programmation**
1. **Cliquez "Modifier"** (icône crayon)
2. **Changez la date/heure** de programmation
3. **Sauvegardez** les modifications
4. **La campagne s'enverra** à la nouvelle date/heure

## 🎨 **Interface Visuelle**

### 📊 **Badges de Statut**
```javascript
// Campagne programmée
[📅 Programmée]  // Badge orange

// Campagne envoyée manuellement
[✅ Envoyée]     // Badge vert
```

### 🎨 **Boutons Disponibles**
```javascript
// Pour campagne programmée
[👁️ Aperçu]     // Bleu - Test individuel
[📤 Envoyer maintenant] // Orange - Envoi manuel

// Pour campagne en brouillon
[👁️ Aperçu]     // Bleu - Test individuel  
[📤 Envoyer]      // Vert - Envoi massif
```

### 📱 **Messages de Confirmation**
```javascript
// Pour campagne programmée
"Cette campagne est programmée. Envoyer maintenant annulera la programmation et enverra à tous les clients ciblés. Continuer ?"

// Pour campagne en brouillon
"Envoyer cette campagne maintenant ? Les messages WhatsApp seront envoyés à tous les clients ciblés."
```

## 🔧 **Comportement Technique**

### 📡 **Backend : Route d'Envoi**
```javascript
POST /api/ecom/campaigns/:id/send

// Pour campagne programmée
if (campaign.status === 'scheduled') {
  campaign.status = 'draft';
  campaign.scheduledAt = null;
  await campaign.save();
  // Envoi manuel
}
```

### 🔄 **Frontend : Logique de Confirmation**
```javascript
const campaign = campaigns.find(c => c._id === id);
const isScheduled = campaign?.status === 'scheduled';

const confirmMessage = isScheduled 
  ? "Cette campagne est programmée. Envoyer maintenant annulera la programmation..."
  : "Envoyer cette campagne maintenant ?";
```

### 📊 **Changement de Statut**
```
Programmée → (envoi manuel) → Brouillon → Envoyée
```

## 📱 **Cas d'Usage Avancés**

### 🎯 **Test de Campagne Programmée**
1. **Programmez** votre campagne pour plus tard
2. **Utilisez "Aperçu"** pour tester sur une personne
3. **Vérifiez** que tout fonctionne correctement
4. **Laissez la programmation** faire son travail
5. **Surveillez** les résultats

### 🎯 **Urgence : Envoyer Maintenant**
1. **Situation urgente** nécessite un envoi immédiat
2. **Cliquez "Envoyer maintenant"**
3. **La programmation est annulée**
4. **L'envoi se fait** tout de suite
5. **Statut mis à jour** automatiquement

### 🎯 **Modification de Programmation**
1. **Besoin de changer** l'heure d'envoi
2. **Cliquez "Modifier"** sur la campagne
3. **Changez la date/heure**
4. **Sauvegardez** les modifications
5. **La nouvelle programmation** est active

## 🚨 **Comportements à Éviter**

### ❌ **Ce qu'il ne faut pas faire**
- **N'envoyez pas manuellement** une campagne déjà envoyée
- **N'oubliez pas de tester** avant l'envoi programmé
- **Ne modifiez pas** la campagne pendant l'envoi
- **N'annulez pas** la programmation si ce n'est pas nécessaire

### ✅ **Ce qu'il faut faire**
- **Testez toujours** avec "Aperçu" avant l'envoi
- **Vérifiez le statut** avant d'envoyer manuellement
- **Surveillez les résultats** après envoi
- **Documentez les changements** de statut

## 📊 **Tableau Récapitulatif**

| Statut | Bouton Aperçu | Bouton Envoi | Comportement |
|--------|---------------|---------------|------------|
| Brouillon | ✅ Disponible | ✅ Vert | Test individuel / Envoi massif |
| Programmée | ✅ Disponible | 🟠 Orange | Test individuel / Annulation + Envoi |
| En cours | ❌ Grisé | ❌ Grisé | Bloqué - Envoi en cours |
| Envoyée | ❌ Grisé | ❌ Grisé | Bloqué - Déjà envoyée |
| Échouée | ❌ Grisé | ❌ Grisé | Bloqué - Erreur à résoudre |

## 🎯 **Avantages**

### ✅ **Flexibilité Totale**
- **Test individuel** même pour campagnes programmées
- **Envoi manuel** possible quand nécessaire
- **Programmation préservée** si non modifiée
- **Contrôle total** sur le timing

### 💰 **Sécurité Renforcée**
- **Double confirmation** pour les envois manuels
- **Protection contre les erreurs** d'envoi
- **Logs détaillés** des changements de statut
- **Annulation claire** de la programmation

### 📈 **Meilleure Organisation**
- **Planification** possible avec programmation
- **Tests rapides** avec aperçu individuel
- **Adaptabilité** aux urgences
- **Traçabilité** des actions effectuées

## 🔄 **Comparaison : Programmé vs Manuel**

### 📅 **Campagne Programmée**
- ✅ **Automatique** à la date/heure prévue
- ✅ **Test possible** avec aperçu individuel
- ✅ **Flexibilité** pour envoi manuel
- ✅ **Pas d'intervention** requise

### 📤 **Envoi Manuel**
- ✅ **Contrôle total** du timing
- ✅ **Immédiat** si nécessaire
- ✅ **Annulation** de la programmation
- ⚠️ **Action requise** pour déclencher

## 🎯 **Conclusion**

Les campagnes programmées offrent maintenant la même flexibilité que les campagnes en brouillon :

- ✅ **Aperçu individuel** disponible pour tous les types
- ✅ **Envoi manuel** possible quand nécessaire
- ✅ **Programmation préservée** si non modifiée
- ✅ **Interface claire** avec couleurs distinctives

**Utilisez l'aperçu individuel pour tester vos campagnes programmées et envoyez manuellement seulement en cas d'urgence !** 🚀✨

---

## 📝 **Résumé Rapide**

### 📅 **Pour Campagne Programmée**
1. **Aperçu** → Test sur une personne (programmation préservée)
2. **Envoyer maintenant** → Annule programmation + envoie tout le monde
3. **Ne rien faire** → Envoi automatique à l'heure prévue

### 🎯 **Pour Tester**
1. **Programmez** votre campagne
2. **Utilisez "Aperçu"** pour tester
3. **Vérifiez** que tout fonctionne
4. **Laissez la programmation** faire son travail

**Simple, flexible et sécurisé !** 🎯
