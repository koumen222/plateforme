# 🔒 Guide de Configuration SSL/HTTPS pour AWS EC2

## ❌ Problème : Mixed Content Error

Si votre frontend est en HTTPS (ex: `https://safitech.shop`) mais votre backend en HTTP (`http://13.60.216.44`), les navigateurs bloquent les requêtes pour des raisons de sécurité.

**Erreur typique :**
```
Mixed Content: The page at 'https://...' was loaded over HTTPS, 
but requested an insecure XMLHttpRequest endpoint 'http://...'
```

## ✅ Solution : Configurer HTTPS sur votre serveur AWS

### Option 1 : Nginx Reverse Proxy avec Let's Encrypt (Recommandé)

#### Étape 1 : Installer Nginx sur votre serveur AWS

```bash
# Se connecter au serveur AWS
ssh -i backend-key.pem ubuntu@13.60.216.44

# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Nginx
sudo apt install nginx -y

# Démarrer Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### Étape 2 : Configurer Nginx comme reverse proxy

```bash
# Créer la configuration Nginx
sudo nano /etc/nginx/sites-available/plateforme-backend
```

Ajoutez cette configuration :

```nginx
server {
    listen 80;
    server_name 13.60.216.44;  # Ou votre domaine si vous en avez un

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activer la configuration
sudo ln -s /etc/nginx/sites-available/plateforme-backend /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

#### Étape 3 : Installer Certbot pour Let's Encrypt

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtenir un certificat SSL (si vous avez un domaine)
sudo certbot --nginx -d votre-domaine.com

# OU pour une IP publique, utilisez un service comme Cloudflare Tunnel (voir Option 2)
```

**Note :** Let's Encrypt nécessite un nom de domaine. Pour une IP publique uniquement, utilisez l'Option 2.

#### Étape 4 : Mettre à jour la configuration frontend

Une fois HTTPS configuré, mettez à jour votre frontend :

```env
# frontend/.env
VITE_API_BASE_URL=https://votre-domaine.com
# OU
VITE_API_BASE_URL=https://13.60.216.44
```

### Option 2 : Cloudflare Tunnel (Solution rapide sans domaine)

Cloudflare Tunnel crée un tunnel HTTPS sécurisé vers votre serveur sans nécessiter de domaine.

#### Étape 1 : Créer un compte Cloudflare (gratuit)

1. Allez sur https://cloudflare.com
2. Créez un compte gratuit

#### Étape 2 : Installer cloudflared sur votre serveur

```bash
# Sur votre serveur AWS
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/
```

#### Étape 3 : Authentifier et créer le tunnel

```bash
# Authentifier
cloudflared tunnel login

# Créer un tunnel
cloudflared tunnel create plateforme-backend

# Créer la configuration
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

Ajoutez :

```yaml
tunnel: <TUNNEL_ID>
credentials-file: /home/ubuntu/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: plateforme-backend-<VOTRE_ID>.trycloudflare.com
    service: http://localhost:3000
  - service: http_status:404
```

#### Étape 4 : Démarrer le tunnel

```bash
# Tester
cloudflared tunnel --config ~/.cloudflared/config.yml run

# Installer comme service
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

Vous obtiendrez une URL HTTPS comme : `https://plateforme-backend-xxxxx.trycloudflare.com`

#### Étape 5 : Mettre à jour le frontend

```env
# frontend/.env
VITE_API_BASE_URL=https://plateforme-backend-xxxxx.trycloudflare.com
```

### Option 3 : Utiliser un domaine avec Cloudflare DNS

Si vous avez un domaine (ex: `safitech.shop`), vous pouvez créer un sous-domaine pour l'API :

1. Ajoutez un enregistrement DNS A dans Cloudflare pointant vers `13.60.216.44`
2. Configurez Nginx avec Certbot (Option 1)
3. Utilisez `https://api.safitech.shop` comme URL backend

## 🔧 Configuration Backend pour HTTPS

Une fois HTTPS configuré, assurez-vous que votre backend accepte les connexions HTTPS :

### Mettre à jour server.js

Le backend doit être configuré pour accepter les connexions via le reverse proxy :

```javascript
// Dans backend/server.js
app.set("trust proxy", 1); // Déjà présent

// Les cookies doivent être en secure: true (déjà configuré)
cookie: {
  secure: true, // HTTPS uniquement
  sameSite: "none" // Pour cross-domain
}
```

## ✅ Vérification

1. Testez l'API en HTTPS :
```bash
curl https://votre-url/api/health
```

2. Vérifiez dans le frontend que les requêtes utilisent HTTPS :
- Ouvrez la console (F12)
- Onglet Network
- Vérifiez que les requêtes commencent par `https://`

## 🚨 Solution Temporaire (Non recommandée pour production)

Si vous devez tester rapidement sans configurer SSL, vous pouvez temporairement désactiver la sécurité Mixed Content dans Chrome (UNIQUEMENT pour le développement) :

1. Ouvrez Chrome avec : `chrome.exe --disable-web-security --user-data-dir="C:/temp/chrome"`
2. ⚠️ **NE JAMAIS utiliser cette méthode en production !**

## 📝 Notes Importantes

- HTTPS est **obligatoire** pour les sites en production
- Les certificats Let's Encrypt sont gratuits et se renouvellent automatiquement
- Cloudflare Tunnel est une solution rapide mais peut avoir des limitations
- Pour une solution permanente, configurez un domaine avec SSL

