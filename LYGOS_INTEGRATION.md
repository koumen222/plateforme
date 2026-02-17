# Intégration API LYGOS - Paiement Mobile Money

## 📋 Description

Intégration de l'API LYGOS pour permettre les paiements Mobile Money au Cameroun. Le système remplace le message WhatsApp par un système de paiement automatisé.

## 🔐 Configuration

### Variables d'environnement Backend

#### Pour le développement local (fichier `.env`)

Ajoutez ces variables dans votre fichier `.env` du backend :

```env
# API LYGOS
LYGOS_API_KEY=sk_live_xxxxxxxxx
LYGOS_BASE_URL=https://api.lygosapp.com/v1

# Frontend URL (pour les callbacks)
FRONTEND_URL=http://localhost:5173
```

#### Pour la production (Render)

**⚠️ IMPORTANT :** Sur Render, allez dans votre service backend → **Environment** et ajoutez :

```
LYGOS_API_KEY=votre_cle_api_lygos
LYGOS_BASE_URL=https://api.lygosapp.com/v1
FRONTEND_URL=https://www.safitech.shop
```

**Note :** Le code supporte aussi ces noms alternatifs (pour compatibilité) :
- `LYGOS_SECRET_KEY` au lieu de `LYGOS_API_KEY`
- `LYGOS_API_URL` au lieu de `LYGOS_BASE_URL`

**Vérification :** Après avoir ajouté les variables sur Render, redéployez le service. Les logs afficheront si les variables sont bien définies ou si elles sont `undefined`.

### Obtenir votre clé API LYGOS

1. Créez un compte sur [Lygos](https://lygosapp.com)
2. Accédez à votre tableau de bord
3. Générez votre clé API (format: `sk_live_xxxxxxxxx`)
4. Copiez-la dans votre fichier `.env`

## 🚀 Utilisation

### Backend - Routes API

#### POST `/api/payment/init`

Initialise un paiement.

**Body:**
```json
{
  "amount": 5000,
  "order_id": "CMD-00001"
}
```

**Response:**
```json
{
  "link": "https://pay.lygosapp.com/..."
}
```

#### GET `/api/payment/verify/:order_id`

Vérifie le statut d'un paiement.

**Response:**
```json
{
  "paid": true,
  "transaction": {
    "order_id": "CMD-00001",
    "amount": 5000,
    "status": "SUCCESS",
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

### Frontend - Composant PayButton

```jsx
import PayButton from './components/PayButton'

function MyComponent() {
  return (
    <PayButton
      amount={5000}
      orderId="CMD-00001"
      onSuccess={() => console.log('Paiement réussi')}
      onError={(error) => console.error(error)}
    />
  )
}
```

### Pages de callback

- `/payment-success?order_id=CMD-00001` - Page affichée après un paiement réussi
- `/payment-failed?order_id=CMD-00001` - Page affichée après un échec de paiement

## 🔄 Flux de paiement

1. **Utilisateur clique sur "Payer"**
   - Le composant `PayButton` envoie `amount` et `order_id` au backend
   - Le backend appelle l'API LYGOS pour initialiser le paiement
   - Le backend retourne le `link` de paiement

2. **Redirection vers LYGOS**
   - L'utilisateur est redirigé vers le lien de paiement LYGOS
   - Il effectue le paiement via Mobile Money

3. **Callback après paiement**
   - Si succès → redirection vers `/payment-success?order_id=...`
   - Si échec → redirection vers `/payment-failed?order_id=...`

4. **Vérification du paiement**
   - La page `/payment-success` appelle `/api/payment/verify/:order_id`
   - Le backend interroge l'API LYGOS pour vérifier le statut
   - Si `status === "SUCCESS"` → affichage de confirmation

## 🛡️ Sécurité

- ✅ Aucun webhook utilisé (validation serveur uniquement)
- ✅ Vérification du paiement côté serveur via `GET /v1/gateway`
- ✅ Clé API stockée dans `.env` (jamais exposée au frontend)
- ✅ URLs de callback sécurisées avec `order_id` en paramètre

## 📚 Documentation officielle

Pour plus de détails, consultez la documentation officielle :
https://docs.lygosapp.com/home

## ⚠️ Notes importantes

- Le système ne utilise **pas de webhook**
- La validation se fait uniquement via `success_url` et `failure_url`
- La vérification finale se fait par consultation de la passerelle (`GET /v1/gateway`)
- Compatible avec Mobile Money Cameroun (Orange Money, MTN Mobile Money)

