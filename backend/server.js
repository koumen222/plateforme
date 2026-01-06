// Gestion des erreurs non capturées (doit être en premier)
process.on("uncaughtException", err => {
  console.error("❌ UNCAUGHT EXCEPTION:", err);
  console.error("Stack:", err.stack);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ UNHANDLED PROMISE REJECTION:", reason);
  console.error("Promise:", promise);
  if (reason && reason.stack) {
    console.error("Stack:", reason.stack);
  }
});

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import fetch from "node-fetch";
import { connectDB } from "./config/database.js";
import { configurePassport } from "./config/passport.js";
import { authenticate } from "./middleware/auth.js";
import User from "./models/User.js";
import jwt from "jsonwebtoken";
import authRoutes from "./routes/auth.js";
import videoRoutes from "./routes/videos.js";
import adminRoutes from "./routes/admin.js";
import coursesRoutes from "./routes/courses.js";
import progressRoutes from "./routes/progress.js";
import commentsRoutes from "./routes/comments.js";

dotenv.config();

// Configuration des secrets et URLs
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SESSION_SECRET = process.env.SESSION_SECRET || JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.safitech.shop';

const app = express();

// Configuration CORS pour accepter local et production
const allowedOrigins = [
  'http://localhost:5173', // Frontend Vite en développement
  'http://127.0.0.1:5173',  // Alternative localhost
  'https://www.safitech.shop', // Frontend en production
  'https://safitech.shop', // Frontend en production (sans www)
  process.env.FRONTEND_URL // Variable d'environnement
].filter(Boolean); // Enlever les valeurs undefined

console.log('🌐 Origines CORS autorisées:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origin (même origine, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('⚠️  CORS blocked origin:', origin);
      console.log('   Allowed origins:', allowedOrigins);
      callback(null, true); // Autoriser temporairement pour debug (à changer en production)
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

app.use(express.json());

// Configuration pour Render (trust proxy)
// Sur Render, le serveur est derrière un proxy, il faut faire confiance au proxy
if (process.env.RENDER_EXTERNAL_URL || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  console.log('🔒 Trust proxy activé pour Render/production');
}

// Configuration de la session pour Passport
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS uniquement en production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 heures
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // Pour OAuth cross-domain
  }
}));

// Initialiser Passport
app.use(passport.initialize());
app.use(passport.session());

// Configurer la stratégie Google OAuth (définie dans config/passport.js)
configurePassport();

// Log de confirmation des routes OAuth
console.log('🔐 Routes OAuth Google configurées:');
console.log('   - GET /auth/google');
console.log('   - GET /auth/google/callback');

// Middleware de logging pour debug (exclure les health checks pour réduire le bruit)
app.use((req, res, next) => {
  // Ne pas logger les health checks
  if (req.originalUrl !== '/health' && req.originalUrl !== '/') {
    console.log(`📥 ${req.method} ${req.originalUrl}`, req.body ? 'avec body' : 'sans body');
  }
  next();
});

// Routes
// Route racine pour vérifier que le service est en ligne (nécessaire pour Render)
app.get("/", (req, res) => {
  res.send('Plateforme UNEV API - serveur opérationnel 🚀')
});

// Route HEAD pour la racine (nécessaire pour les health checks Render)
app.head("/", (req, res) => {
  res.status(200).end();
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ============================================
// Routes Google OAuth
// ============================================

/**
 * GET /auth/google
 * Redirige l'utilisateur vers Google pour l'authentification
 */
app.get("/auth/google", (req, res, next) => {
  console.log('🔐 Requête OAuth Google reçue:', req.method, req.originalUrl);
  console.log('   Query params:', req.query);
  next();
}, passport.authenticate("google", { 
  scope: ["profile", "email"] 
}));

/**
 * GET /auth/google/callback
 * Callback OAuth après authentification Google
 * Redirige vers https://www.safitech.shop/dashboard.html après succès
 */
app.get("/auth/google/callback", (req, res, next) => {
  console.log('🔄 Callback OAuth Google reçue:', req.method, req.originalUrl);
  console.log('   Query params:', req.query);
  console.log('   User dans session:', req.user ? 'présent' : 'absent');
  next();
}, passport.authenticate("google", { 
  failureRedirect: `${FRONTEND_URL}/login?error=google_auth_failed` 
}), async (req, res) => {
    try {
      const user = req.user;
      
      if (!user) {
        console.error('❌ Utilisateur non trouvé après authentification Google');
        return res.redirect(`${FRONTEND_URL}/login?error=user_not_found`);
      }

      // Générer le token JWT
      const token = jwt.sign(
        { userId: user._id, email: user.email, status: user.status, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Rediriger vers le dashboard avec le token dans l'URL
      const dashboardUrl = new URL(`${FRONTEND_URL}/dashboard.html`);
      dashboardUrl.searchParams.set('token', token);
      dashboardUrl.searchParams.set('user', JSON.stringify({
        id: user._id.toString(),
        _id: user._id.toString(),
        name: user.name || '',
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        status: user.status,
        role: user.role,
        authProvider: user.authProvider
      }));

      console.log(`✅ Authentification Google réussie - Utilisateur: ${user.name} (${user.email})`);
      console.log(`   Redirection vers: ${dashboardUrl.toString()}`);
      
      res.redirect(dashboardUrl.toString());
    } catch (error) {
      console.error('❌ Erreur callback Google:', error);
      res.redirect(`${FRONTEND_URL}/login?error=google_auth_error`);
    }
  }
);

// Route de test pour vérifier que le serveur répond
app.get("/api/test", (req, res) => {
  res.json({ message: "API backend fonctionne", timestamp: new Date().toISOString() });
});

// Routes d'authentification (doit être avant les autres routes /api)
console.log('📋 Chargement des routes d\'authentification...');
app.use("/api", authRoutes);
console.log('✅ Routes d\'authentification chargées:');
console.log('   - POST /api/register');
console.log('   - POST /api/login');
console.log('   - GET /auth/google ← Route Google OAuth (redirection)');
console.log('   - GET /auth/google/callback ← Callback Google OAuth');
console.log('   - GET /api/user/me');
console.log('   - PUT /api/profile');
console.log('   - POST /api/admin/register');
console.log('   - GET /api/admin/check');

// Routes protégées (vidéos)
app.use("/api", videoRoutes);

// Routes cours (publiques et protégées)
app.use("/api/courses", coursesRoutes);

// Routes progression (protégées)
app.use("/api/progress", progressRoutes);

// Routes commentaires (protégées)
app.use("/api/comments", commentsRoutes);

// Routes admin (protégées)
app.use("/api/admin", adminRoutes);

// Route chatbot (protégée - nécessite statut active)
app.post("/api/chat", authenticate, async (req, res) => {
  const { message, conversationHistory } = req.body;

  try {
    // Vérifier que l'utilisateur est actif
    if (req.user.status !== 'active') {
      return res.status(403).json({ 
        error: 'Votre compte doit être actif pour accéder au chat',
        status: req.user.status
      });
    }

    if (!message) {
      return res.status(400).json({ error: 'Le message est requis' });
    }

    // Préparer les messages pour OpenAI
    // Utiliser l'historique de conversation si fourni, sinon créer un nouveau contexte
    let messages = [];
    
    if (conversationHistory && Array.isArray(conversationHistory)) {
      // Filtrer et formater l'historique (exclure les messages système pour OpenAI)
      messages = conversationHistory
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role === 'bot' ? 'assistant' : msg.role,
          content: msg.content
        }));
    } else {
      // Si pas d'historique, créer un message simple
      messages = [{ role: "user", content: message }];
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erreur OpenAI API:', errorData);
      return res.status(response.status).json({ 
        error: errorData.error?.message || 'Erreur lors de la communication avec OpenAI' 
      });
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Format de réponse OpenAI inattendu:', data);
      return res.status(500).json({ error: 'Format de réponse OpenAI inattendu' });
    }

    res.json({ reply: data.choices[0].message.content });
  } catch (err) {
    console.error('Erreur chatbot:', err);
    res.status(500).json({ 
      error: err.message || "Erreur lors du traitement de votre message" 
    });
  }
});

// Middleware de gestion des routes non trouvées (doit être après toutes les routes)
app.use((req, res, next) => {
  console.log(`⚠️ Route non trouvée: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: `Route non trouvée: ${req.method} ${req.originalUrl}`,
    availableRoutes: [
      'GET /auth/google',
      'GET /auth/google/callback',
      'POST /api/register',
      'POST /api/login',
      'GET /api/user/me',
      'PUT /api/profile',
      'POST /api/chat',
      'POST /api/admin/register',
      'GET /api/admin/check'
    ]
  });
});

const PORT = process.env.PORT || 3000;

// Démarrer le serveur après la connexion MongoDB
const startServer = async () => {
  try {
    // Connexion MongoDB
    await connectDB();
    
    // Plus de création automatique d'admin
    // L'admin doit créer son compte via /admin/login (première connexion uniquement)
    
    // Créer des cours par défaut s'ils n'existent pas
    const Course = (await import('./models/Course.js')).default;
    const defaultCourses = [
      {
        title: 'Introduction à la Plateforme de Formation',
        description: 'Découvrez comment utiliser notre plateforme de formation en ligne. Ce cours vous guidera à travers toutes les fonctionnalités et vous aidera à démarrer votre parcours d\'apprentissage.',
        videoId: '148751763', // ID Vimeo d'exemple (à remplacer par une vraie vidéo)
        module: 1,
        order: 1
      },
      {
        title: 'Les Bases du Contenu Pédagogique',
        description: 'Apprenez les fondamentaux pour créer et structurer du contenu pédagogique efficace. Ce cours vous enseignera les meilleures pratiques pour concevoir des formations engageantes.',
        videoId: '148751763', // ID Vimeo d'exemple (à remplacer par une vraie vidéo)
        module: 1,
        order: 2
      },
      {
        title: 'Suivi et Évaluation de la Progression',
        description: 'Comprenez comment suivre votre progression dans les cours et évaluer vos acquis. Ce module vous explique le système de suivi et les outils d\'évaluation disponibles.',
        videoId: '148751763', // ID Vimeo d'exemple (à remplacer par une vraie vidéo)
        module: 1,
        order: 3
      }
    ];
    
    for (const courseData of defaultCourses) {
      const existingCourse = await Course.findOne({ title: courseData.title });
      
      if (!existingCourse) {
        const course = new Course(courseData);
        await course.save();
        console.log(`✅ Cours par défaut créé: ${courseData.title}`);
      }
    }
    
    // Démarrer le serveur Express
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Backend running on port ${PORT}`);
      console.log(`📡 API disponible sur http://localhost:${PORT}`);
      console.log(`🌐 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`\n📋 Routes disponibles:`);
      console.log(`   POST /api/register - Inscription utilisateur`);
      console.log(`   POST /api/login - Connexion`);
      console.log(`   GET  /api/user/me - Profil utilisateur`);
      console.log(`   PUT  /api/profile - Mise à jour profil`);
      console.log(`   POST /api/admin/register - Inscription admin`);
      console.log(`   GET  /api/admin/check - Vérifier admin`);
      console.log(`\n✅ Serveur prêt à recevoir des requêtes!\n`);
    });
  } catch (error) {
    console.error('❌ Impossible de démarrer le serveur:', error);
    process.exit(1);
  }
};

startServer();
