# Stockage des Images Uploadées

## 📁 Emplacement de Stockage

### Local (Développement)
Les images uploadées sont stockées dans :
```
backend/uploads/courses/
```

### Chemin Public
Les images sont accessibles via :
```
/uploads/courses/[nom-du-fichier]
```

### URL Complète
- **Local** : `http://localhost:3000/uploads/courses/[nom-du-fichier]`
- **Production** : `https://plateforme-r1h7.onrender.com/uploads/courses/[nom-du-fichier]`

## 🔧 Configuration

### Backend (`backend/middleware/upload.js`)
- **Dossier de stockage** : `backend/uploads/courses/`
- **Nom de fichier** : `course-[timestamp]-[random].ext`
- **Taille max** : 5MB
- **Formats acceptés** : jpeg, jpg, png, gif, webp

### Serveur (`backend/server.js`)
Les fichiers sont servis statiquement via :
```javascript
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

## 📝 Processus d'Upload

1. **Upload** : L'image est envoyée via `POST /api/admin/upload/course-image`
2. **Stockage** : Multer sauvegarde l'image dans `backend/uploads/courses/`
3. **Nom unique** : Un nom unique est généré avec timestamp
4. **Réponse** : Le backend retourne le chemin public `/uploads/courses/[filename]`
5. **Sauvegarde DB** : Le chemin est sauvegardé dans le champ `coverImage` du cours

## ⚠️ Important pour la Production (Render)

**ATTENTION** : Sur Render, le système de fichiers est **éphémère**. Les fichiers uploadés seront perdus lors d'un redéploiement.

### Solutions recommandées pour la production :

1. **Cloudinary** (recommandé)
   - Service de stockage cloud gratuit
   - CDN intégré
   - Optimisation automatique des images

2. **AWS S3**
   - Stockage cloud scalable
   - Intégration facile avec Node.js

3. **MongoDB GridFS**
   - Stockage dans la base de données
   - Pas de service externe nécessaire

4. **Autres services** : Imgur, Cloudflare R2, etc.

## 🔍 Vérification

Après un upload, les logs affichent :
```
✅ Image uploadée avec succès
   - Nom du fichier: course-1234567890-987654321.jpg
   - Chemin complet sur le serveur: /path/to/backend/uploads/courses/course-1234567890-987654321.jpg
   - Taille: 245.67 KB
   - Type MIME: image/jpeg
   - Chemin public (URL): /uploads/courses/course-1234567890-987654321.jpg
   - URL complète: https://plateforme-r1h7.onrender.com/uploads/courses/course-1234567890-987654321.jpg
```

