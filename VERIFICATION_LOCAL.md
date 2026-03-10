# 🔍 Guide de Vérification Backend Local

## Vérifier que le backend local fonctionne

### 1. Démarrer le backend local

```bash
cd backend
npm install  # Si vous n'avez pas encore installé les dépendances
npm start   # Ou npm run dev si vous avez un script dev
```

### 2. Vérifier que le serveur démarre correctement

Vous devriez voir dans les logs :
```
✅ MongoDB connecté avec succès
✅ Routes admin chargées:
   - POST /api/admin/upload/course-image
   - POST /api/admin/upload/pdf
   - GET /api/admin/ressources-pdf
   - POST /api/admin/ressources-pdf
   - PUT /api/admin/ressources-pdf/:id
   - DELETE /api/admin/ressources-pdf/:id
🚀 Backend running on port 3000
```

### 3. Tester la route directement

Ouvrez votre navigateur ou utilisez curl :
```bash
# Tester la route health (sans auth)
curl http://localhost:3000/health

# Devrait retourner: {"status":"ok"}

# Tester la route admin (avec token)
curl -H "Authorization: Bearer VOTRE_TOKEN" \
  http://localhost:3000/api/admin/ressources-pdf
```

### 4. Vérifier que MongoDB est connecté

Dans les logs du backend, vous devriez voir :
```
✅ MongoDB connecté avec succès
```

Si vous voyez une erreur MongoDB, vérifiez :
- Que MongoDB est bien démarré (si local) ou que l'URI MongoDB Atlas est correcte
- Que les variables d'environnement sont bien définies dans un fichier `.env` dans `backend/`

### 5. Vérifier les variables d'environnement

Créez un fichier `.env` dans `backend/` avec :
```env
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb+srv://...
JWT_SECRET=votre-secret-tres-long
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

## Problèmes courants

### Problème : "Port 3000 already in use"

**Solution :**
```bash
# Trouver le processus qui utilise le port 3000
# Sur Windows PowerShell:
netstat -ano | findstr :3000

# Tuer le processus (remplacez PID par le numéro trouvé)
taskkill /PID <PID> /F

# Ou changez le port dans .env
PORT=3001
```

### Problème : "Cannot connect to MongoDB"

**Solution :**
1. Vérifiez que MongoDB est démarré (si local)
2. Vérifiez que l'URI MongoDB est correcte dans `.env`
3. Vérifiez que votre IP est autorisée dans MongoDB Atlas (0.0.0.0/0 pour développement)

### Problème : "Route 404"

**Solution :**
1. Vérifiez que le backend est bien démarré sur le port 3000
2. Vérifiez que les routes sont bien chargées dans les logs
3. Redémarrez le backend après avoir fait des modifications
4. Vérifiez que vous utilisez le bon token d'authentification

## Checklist de vérification

- [ ] Backend démarré sur le port 3000
- [ ] MongoDB connecté (voir dans les logs)
- [ ] Routes admin chargées (voir dans les logs)
- [ ] Route `/health` fonctionne (retourne `{"status":"ok"}`)
- [ ] Frontend utilise `http://localhost:3000` (voir dans les logs du navigateur)
- [ ] Token d'authentification valide et utilisateur a le rôle `superadmin`

