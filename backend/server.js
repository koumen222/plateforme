import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { connectDB } from "./config/database.js";
import { authenticate } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import videoRoutes from "./routes/videos.js";
import adminRoutes from "./routes/admin.js";
import coursesRoutes from "./routes/courses.js";
import progressRoutes from "./routes/progress.js";
import commentsRoutes from "./routes/comments.js";

dotenv.config();

const app = express();

// Configuration CORS pour accepter local et production
const allowedOrigins = [
  'http://localhost:5173', // Frontend Vite en développement
  'http://127.0.0.1:5173',  // Alternative localhost
  'https://plateforme-zyfr.vercel.app', // Frontend en production
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

// Middleware de logging pour debug
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.originalUrl}`, req.body ? 'avec body' : 'sans body');
  next();
});

// Routes
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Route de test pour vérifier que le serveur répond
app.get("/api/test", (req, res) => {
  res.json({ message: "API backend fonctionne", timestamp: new Date().toISOString() });
});

// Routes d'authentification (doit être avant les autres routes /api)
console.log('📋 Chargement des routes d\'authentification...');
app.use("/api", authRoutes);
console.log('✅ Routes d\'authentification chargées: /api/register, /api/login, /api/user/me, /api/profile, /api/admin/*');

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
  const { message } = req.body;

  try {
    // Vérifier que l'utilisateur est actif
    if (req.user.status !== 'active') {
      return res.status(403).json({ 
        error: 'Votre compte doit être actif pour accéder au chat',
        status: req.user.status
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: message }]
      })
    });

    const data = await response.json();
    res.json({ reply: data.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "OpenAI error" });
  }
});

// Middleware de gestion des routes non trouvées (doit être après toutes les routes)
app.use((req, res, next) => {
  console.log(`⚠️ Route non trouvée: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: `Route non trouvée: ${req.method} ${req.originalUrl}`,
    availableRoutes: [
      'POST /api/register',
      'POST /api/login',
      'GET /api/user/me',
      'PUT /api/profile',
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
