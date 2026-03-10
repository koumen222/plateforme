# 🤖 Agent Vendeur WhatsApp - Guide Complet

## 🎯 Objectif

Système d'agent vendeur camerounais intelligent qui :
- Lance automatiquement la conversation après une commande
- Répond à toutes les questions du client
- Pousse toujours vers la livraison aujourd'hui
- Utilise les informations produit configurées
- Fonctionne uniquement pour les commandes reçues
- Est sécurisé et stable

---

## 📁 Architecture des fichiers

```
backend/ecom/
├── models/
│   ├── AgentConversation.js    # État des conversations
│   ├── AgentMessage.js         # Historique des messages
│   └── ProductConfig.js        # Configuration produits (MCP)
├── services/
│   ├── agentService.js         # Logique ChatGPT + commerciale
│   ├── agentWhatsappService.js # Envoi/réception WhatsApp
│   └── agentCronService.js     # Relances automatiques
└── routes/
    └── agent.js                # API REST agent
```

---

## 🔧 Configuration

### Variables d'environnement requises

```env
# Green API (WhatsApp)
GREEN_API_ID_INSTANCE=your_instance_id
GREEN_API_TOKEN_INSTANCE=your_token
GREEN_API_URL=https://your_instance.api.greenapi.com

# OpenAI (ChatGPT)
OPENAI_API_KEY=sk-your-api-key
AGENT_GPT_MODEL=gpt-4o-mini  # ou gpt-4o pour plus de qualité
```

### Configurer le webhook Green API

1. Aller dans votre dashboard Green API
2. Configurer l'URL du webhook: `https://votre-backend.com/api/ecom/agent/webhook`
3. Activer les notifications pour:
   - `incomingMessageReceived`
   - `outgoingMessageStatus`

---

## 🚀 API Endpoints

### Webhook (reçoit les messages WhatsApp)
```
POST /api/ecom/agent/webhook
```

### Démarrer une conversation pour une commande
```
POST /api/ecom/agent/conversations/start/:orderId
Body: { "workspaceId": "..." }
```

### Lister les conversations
```
GET /api/ecom/agent/conversations?workspaceId=...&state=pending_confirmation&active=true&page=1&limit=20
```

### Détail d'une conversation (avec messages)
```
GET /api/ecom/agent/conversations/:id
```

### Fermer une conversation
```
POST /api/ecom/agent/conversations/:id/close
Body: { "state": "confirmed|cancelled|escalated", "reason": "..." }
```

### Relancer manuellement
```
POST /api/ecom/agent/conversations/:id/relance
```

### Statistiques
```
GET /api/ecom/agent/stats?workspaceId=...&dateFrom=...&dateTo=...
```

### Configurations produits
```
GET /api/ecom/agent/product-configs?workspaceId=...
POST /api/ecom/agent/product-configs
PUT /api/ecom/agent/product-configs/:id
DELETE /api/ecom/agent/product-configs/:id
```

### Exécuter les relances manuellement
```
POST /api/ecom/agent/relance/run
Body: { "workspaceId": "..." }
```

### Nettoyer les conversations inactives
```
POST /api/ecom/agent/cleanup/stale
Body: { "workspaceId": "..." }
```

### Santé du service
```
GET /api/ecom/agent/health
```

---

## 🧠 Logique Globale

### 1️⃣ Création de conversation

Quand une commande arrive:
1. Création conversation avec `state = pending_confirmation`
2. `confidence_score = 50`
3. `relance_count = 0`
4. `active = true`
5. Envoi message initial via Green API

### 2️⃣ Réception message client

Le webhook vérifie:
1. `message.fromMe === false`
2. `message_id` pas déjà traité (anti-doublon)
3. `conversation.active === true`

### 3️⃣ Traitement du message

Le backend:
1. Stocke le message
2. Analyse l'intention (confirmation, annulation, question, objection...)
3. Analyse le sentiment (positif, neutre, négatif)
4. Met à jour le `confidence_score`
5. Génère une réponse via ChatGPT

### 4️⃣ Module Contexte Produit (MCP)

Le système récupère:
- Nom produit, Prix, Livraison
- Garantie, Avantages
- FAQ, Objections fréquentes
- Tonalité configurée

Puis construit un prompt dynamique pour ChatGPT.

---

## 📊 Score de Probabilité d'Achat

Le score (0-100) est mis à jour selon:

| Action | Impact |
|--------|--------|
| Confirmation | +30 |
| Annulation | -50 |
| Négociation horaire | +10 |
| Question | +5 |
| Objection | -10 |
| Sentiment positif | +10 |
| Sentiment négatif | -15 |

---

## 🔥 Logique Commerciale

### Toujours:
- Répondre à toutes les questions
- Rassurer le client
- Pousser la livraison aujourd'hui
- Terminer par une question

### Gestion de la persuasion:

| Niveau | Stratégie |
|--------|-----------|
| 1 | Argument logistique ("Le livreur est dans votre zone") |
| 2 | Argument disponibilité ("Dernier passage de la journée") |
| 3 | Urgence douce ("Stock limité, ne ratez pas l'occasion") |

**Si refus clair 2 fois → accepter demain**

---

## ⏱️ Système de Relance Automatique

Cron job toutes les **5 minutes**:

| Condition | Action |
|-----------|--------|
| `last_interaction > 30min` | Relance 1 |
| `last_interaction > 2h` | Relance 2 |
| `last_interaction > 24h` | Désactivation |

---

## 🛑 Sécurité Intégrée

- ✅ Anti-doublon webhook (stockage des message_id traités)
- ✅ Anti-boucle infinie (ne répond pas aux messages sortants)
- ✅ Répond uniquement aux conversations actives
- ✅ Limite nombre de relances (max 3)
- ✅ Gestion timeout WhatsApp 24h

---

## 🎭 Comportement selon le Sentiment

| Sentiment | Comportement |
|-----------|--------------|
| **Positif** | Closing direct, confirme la livraison |
| **Neutre** | Persuasion normale, avantages produit |
| **Négatif** | Ton rassurant + possible escalade humaine |

---

## 🏁 Clôture de Conversation

### Si livraison confirmée:
```
state = confirmed
active = false
confirmedAt = Date.now()
```

### Si annulation:
```
state = cancelled
active = false
cancelledAt = Date.now()
```

### Si escalade:
```
state = escalated
active = false (optionnel)
escalatedAt = Date.now()
escalationReason = "..."
```

---

## 📋 Exemple de Configuration Produit

```javascript
{
  "workspaceId": "...",
  "productName": "Montre Connectée Pro",
  "productNameVariants": ["montre", "smartwatch", "montre pro"],
  "isActive": true,
  "pricing": {
    "sellingPrice": 25000,
    "deliveryCost": 1500
  },
  "delivery": {
    "estimatedTime": "dans l'après-midi",
    "expressAvailable": true,
    "expressMessage": "Le livreur est déjà dans votre zone aujourd'hui."
  },
  "guarantee": {
    "hasGuarantee": true,
    "duration": "6 mois",
    "description": "Garantie constructeur, échange gratuit"
  },
  "advantages": [
    { "title": "Qualité", "description": "Produit original certifié" },
    { "title": "Livraison", "description": "Livraison express le jour même" }
  ],
  "faq": [
    { "question": "c'est original", "answer": "Oui, produit 100% original avec garantie" }
  ],
  "objections": [
    { "objection": "trop cher", "answer": "On fait un effort sur les frais de livraison, je vous l'offre aujourd'hui !" }
  ],
  "agentConfig": {
    "tonality": "friendly",
    "useEmojis": true,
    "persuasionStyle": "balanced"
  },
  "persuasionArguments": {
    "level1": ["Le livreur passe justement dans votre quartier cet après-midi"],
    "level2": ["C'est le dernier passage de la journée, après il faudra attendre demain"],
    "level3": ["Je vois qu'il ne reste que 2 unités en stock, je vous le réserve ?"]
  },
  "initialMessage": "Bonjour 👋\nNous avons bien reçu votre commande du {PRODUIT}.\nLe livreur est déjà dans votre zone aujourd'hui.\nOn vous livre dans l'après-midi ?",
  "relanceMessages": {
    "relance1": "Bonjour 👋 Je voulais juste m'assurer que vous avez bien reçu mon message. On peut toujours vous livrer aujourd'hui si ça vous arrange ?",
    "relance2": "Coucou ! Notre livreur passe dans votre quartier cet après-midi. C'est le dernier passage de la journée, vous confirmez ?",
    "relance3": "Bonjour ! Je voulais savoir si vous êtes toujours intéressé(e). On peut organiser la livraison demain si vous préférez 😊"
  }
}
```

---

## 🔄 Intégration avec les Commandes

Pour déclencher automatiquement l'agent quand une commande est créée, ajoutez dans votre route de création de commande:

```javascript
import { createConversationForOrder } from '../services/agentService.js';
import { sendInitialMessageForOrder } from '../services/agentWhatsappService.js';

// Après création de la commande
const conversation = await createConversationForOrder(order, workspaceId);
await sendInitialMessageForOrder(conversation);
```

---

## 📈 Résultat Final

Le système devient:
- ✅ Commercial automatique 24/7
- ✅ Adapté au marché camerounais
- ✅ Basé sur infos produit dynamiques
- ✅ Orienté livraison immédiate
- ✅ Stable et sécurisé
- ✅ Scalable pour plusieurs produits
