# Dockerfile à la racine pour construire le backend
# Ce fichier est utilisé si le build context est la racine du projet
# Le Dockerfile principal est dans backend/Dockerfile

FROM node:18-alpine

WORKDIR /app

# Copier les fichiers package.json depuis backend/
COPY backend/package*.json ./

# Installer les dépendances
RUN npm install --production

# Copier le reste des fichiers du backend
COPY backend/ ./

# Créer le dossier uploads
RUN mkdir -p uploads/courses uploads/pdf

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "server.js"]

