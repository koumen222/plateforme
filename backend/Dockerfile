# Dockerfile pour le backend de la plateforme Andromeda

# Utiliser une image Node.js officielle
FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json et package-lock.json d'abord
# Cela permet de mettre en cache les dépendances si ces fichiers n'ont pas changé
COPY package*.json ./

# Installer les dépendances
RUN npm install --production

# Copier le reste des fichiers du backend
COPY . .

# Créer le dossier uploads s'il n'existe pas
RUN mkdir -p uploads/courses uploads/pdf

# Exposer le port 3000
EXPOSE 3000

# Définir la variable d'environnement NODE_ENV
ENV NODE_ENV=production

# Commande pour démarrer le serveur
CMD ["node", "server.js"]

