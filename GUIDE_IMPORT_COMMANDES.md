# Guide : Importer et retrouver vos commandes

## 1. Accéder à la page d'import

Depuis n'importe quelle page du module E-commerce :

1. Allez sur la page **Commandes** en cliquant sur **"Commandes"** dans le menu latéral gauche (sidebar)
2. En haut à droite de la page, cliquez sur le bouton bleu **"Importer"**

> Vous serez redirigé vers la page d'import : `http://localhost:5173/ecom/import`

---

## 2. Importer des commandes depuis Google Sheets

La page d'import fonctionne en **4 étapes** :

### Étape 1 — Sélectionner la source

Vous avez deux options :

- **Sources configurées** : Sélectionnez une source Google Sheet déjà enregistrée dans la liste
- **Nouveau lien** : Cliquez sur l'onglet **"Nouveau lien"** puis collez l'URL ou l'ID de votre Google Sheet

> ⚠️ Le Google Sheet doit être partagé en mode **"Toute personne disposant du lien peut consulter"**

Cliquez sur **"Vérifier et continuer"** pour passer à l'étape suivante.

### Étape 2 — Aperçu des données

- Vérifiez que les **colonnes détectées** correspondent bien à vos données (Nom client, Téléphone, Ville, Produit, Prix, etc.)
- Consultez l'**aperçu des données** dans le tableau pour confirmer que tout est correct
- Si tout est bon, cliquez sur **"Lancer l'import"**

### Étape 3 — Import en cours

- Une **barre de progression** s'affiche avec le pourcentage d'avancement
- **Ne fermez pas la page** pendant l'import

### Étape 4 — Résultat

- Vous verrez un résumé : commandes **importées**, **mises à jour**, **doublons** et **erreurs**
- Cliquez sur **"Voir les commandes"** pour aller directement à la liste des commandes importées

---

## 3. Retrouver les commandes importées

Après l'import, vos commandes apparaissent sur la page **Commandes** :

1. Cliquez sur **"Commandes"** dans le menu latéral gauche
2. Toutes vos commandes sont affichées dans la liste

### Filtrer par source

Si vous avez plusieurs sources (plusieurs Google Sheets), vous pouvez filtrer :

1. En haut à droite de la page Commandes, repérez le **menu déroulant des sources** (à côté du bouton "Importer")
2. Cliquez dessus et sélectionnez la source souhaitée pour n'afficher que ses commandes
3. Sélectionnez **"Toutes les sources"** pour tout réafficher

### Filtrer par statut

Utilisez les **pastilles de statut** sous les KPI pour filtrer :

- **Tous** — Toutes les commandes
- **En attente** — Commandes non encore traitées
- **Confirmé** — Commandes confirmées
- **Expédié** — Commandes en cours de livraison
- **Livré** — Commandes livrées
- **Retour** — Commandes retournées
- **Annulé** — Commandes annulées

### Rechercher une commande

Utilisez la **barre de recherche** pour chercher par nom de client, téléphone, ville ou produit.

### Filtres avancés

Cliquez sur l'icône **filtre** (entonnoir) à droite de la barre de recherche pour accéder aux filtres avancés :

- **Ville**
- **Produit**
- **Tag**
- **Date de début / fin**

---

## 4. Supprimer une source et ses commandes

Quand vous supprimez une source, **toutes les commandes associées à cette source sont automatiquement supprimées** de la base de données et disparaissent de l'affichage.

---

## Résumé visuel

```
Sidebar                          Page Commandes
┌──────────────┐     ┌──────────────────────────────────────────┐
│              │     │  Commandes                               │
│  Accueil     │     │                    [Source ▼] [WhatsApp] │
│  Commandes ◄─┼─────┤                              [Importer] │
│  Produits    │     │                                          │
│  Clients     │     │  ┌─────┐ ┌──────┐ ┌──────┐ ┌─────────┐  │
│  Rapports    │     │  │ KPI │ │ KPI  │ │ KPI  │ │   KPI   │  │
│  ...         │     │  └─────┘ └──────┘ └──────┘ └─────────┘  │
│              │     │                                          │
│              │     │  [Tous] [En attente] [Confirmé] [Livré]  │
│              │     │  [Recherche...        ] [Filtres]        │
│              │     │                                          │
│              │     │  ┌──────────────────────────────────┐    │
│              │     │  │  Liste des commandes importées   │    │
│              │     │  │  ...                             │    │
│              │     │  └──────────────────────────────────┘    │
└──────────────┘     └──────────────────────────────────────────┘

                     Bouton "Importer" → Page Import
                     ┌──────────────────────────────────────────┐
                     │  Importation des commandes  [Historique] │
                     │                                          │
                     │  ① Source → ② Aperçu → ③ Import → ④ OK  │
                     │                                          │
                     │  [Sources configurées] [Nouveau lien]    │
                     │                                          │
                     │  ○ Source par défaut                     │
                     │  ○ Ma source 2                           │
                     │                                          │
                     │              [Vérifier et continuer →]   │
                     └──────────────────────────────────────────┘
```
