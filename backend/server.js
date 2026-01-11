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
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/database.js";
import { configurePassport } from "./config/passport.js";
import { authenticate, checkAccountStatus } from "./middleware/auth.js";
import User from "./models/User.js";
import jwt from "jsonwebtoken";
// Variables pour les modules chargés dynamiquement (évite les crashes si fichiers absents)
let authRoutes = null;
let videoRoutes = null;
let adminRoutes = null;
let coursesRoutes = null;
let progressRoutes = null;
let commentsRoutes = null;
let paymentRoutes = null;
let successRadarRoutes = null;
let diagnosticRoutes = null;
let ressourcesPdfRoutes = null;
let startSuccessRadarCron = null;
let runSuccessRadarOnce = null;
import Course from "./models/Course.js";
import Module from "./models/Module.js";
import Lesson from "./models/Lesson.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Configuration des secrets et URLs
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SESSION_SECRET = process.env.SESSION_SECRET || JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.safitech.shop';

const app = express();

// Configuration CORS dynamique pour autoriser les sous-domaines safitech.shop
const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origine (ex: Postman, curl)
    if (!origin) {
      return callback(null, true);
    }
    
    // Liste des origines autorisées
    const allowedOrigins = [
      "https://safitech.shop",
      "https://www.safitech.shop",
      "https://api.safitech.shop",
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000"
    ];
    
    // Vérifier si l'origine est dans la liste autorisée
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (origin.includes('.safitech.shop')) {
      // Autoriser tous les sous-domaines de safitech.shop
      callback(null, true);
    } else {
      console.log(`⚠️ CORS bloqué pour l'origine: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS","PATCH"],
  allowedHeaders: ["Content-Type","Authorization","X-Requested-With"],
  exposedHeaders: ["Content-Type","Authorization"],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Log de la configuration CORS au démarrage
console.log('🔒 Configuration CORS activée');
console.log('   - Origines autorisées: safitech.shop et sous-domaines');
console.log('   - Credentials: activé');

app.use(express.json());
app.use(cookieParser());

// Servir les fichiers statiques (images uploadées et PDF)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('📁 Dossier uploads configuré: /uploads');
console.log('📁 Dossier uploads/pdf configuré: /uploads/pdf');

// Configuration pour Render (trust proxy - OBLIGATOIRE et doit être AVANT session)
app.set("trust proxy", 1);
console.log('🔒 Trust proxy activé (nécessaire pour Render)');

// Configuration de la session pour Passport (OBLIGATOIRE pour Render)
app.use(session({
  name: "safitech.sid", // Nom du cookie de session
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // HTTPS uniquement (OBLIGATOIRE pour Render)
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 heures
    sameSite: "none" // OBLIGATOIRE pour OAuth cross-domain sur Render
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

// Middleware pour rediriger dashboard.html vers safitech.shop
app.use((req, res, next) => {
  if (req.originalUrl.includes("dashboard.html")) {
    return res.redirect("https://www.safitech.shop/");
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
// Routes Google OAuth - DÉSACTIVÉES
// ============================================
// Les routes OAuth Google ont été désactivées
// L'authentification se fait maintenant uniquement via email/password

// app.get("/auth/google",
//   passport.authenticate("google", { scope: ["profile", "email"] })
// );

// app.get("/auth/google/callback",
//   passport.authenticate("google", {
//     failureRedirect: `${FRONTEND_URL}/login`
//   }),
//   async (req, res) => {
//     // ... code désactivé
//   }
// );

// Routes de diagnostic - seront montées dans startServer après chargement dynamique
// Placeholder pour éviter les erreurs
app.get("/api/diagnostic/*", async (req, res) => {
  if (!diagnosticRoutes) {
    return res.status(503).json({ 
      success: false, 
      error: 'Module diagnostic non disponible' 
    });
  }
});

// Route de test pour vérifier que le serveur répond
app.get("/api/test", (req, res) => {
  res.json({ 
    message: "API backend fonctionne", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });
});

// Route GET /api/valentine-winners - PRIORITAIRE (avant toutes les autres routes)
// Cette route est définie ici pour garantir qu'elle soit toujours disponible
app.get("/api/valentine-winners", authenticate, async (req, res) => {
  console.log('💝 Route /api/valentine-winners appelée (route principale)');
  console.log('💝 Headers:', JSON.stringify(req.headers, null, 2));
  console.log('💝 User:', req.user ? { id: req.user._id, status: req.user.status } : 'non authentifié');
  console.log('💝 Query params:', req.query);
  
  try {
    const WinningProduct = (await import("./models/WinningProduct.js")).default;
    
    let valentineProducts = await WinningProduct.find({ specialEvent: 'saint-valentin' })
      .sort({ lastUpdated: -1, createdAt: -1 })
      .limit(50)
      .lean();
    
    console.log(`💝 Produits trouvés en DB: ${valentineProducts.length}`);
    
    // Si des produits existent en base, retourner leurs noms
    if (valentineProducts.length > 0) {
      const productNames = valentineProducts.map(p => p.name || 'Produit sans nom').filter(Boolean);
      console.log(`💝 Retour de ${productNames.length} produits depuis la DB`);
      return res.json({
        success: true,
        products: productNames
      });
    }
    
    // Sinon, retourner une liste par défaut
    console.log('💝 Aucun produit en DB, retour liste par défaut');
    return res.json({
      success: true,
      products: [
        "Montre connectée couple",
        "Projecteur galaxie",
        "Parfum couple",
        "Bracelet amour magnétique",
        "Lampe coeur LED"
      ]
    });
  } catch (error) {
    console.error('❌ Erreur route /api/valentine-winners:', error);
    console.error('❌ Stack:', error.stack);
    // En cas d'erreur, retourner la liste par défaut
    res.json({
      success: true,
      products: [
        "Montre connectée couple",
        "Projecteur galaxie",
        "Parfum couple",
        "Bracelet amour magnétique",
        "Lampe coeur LED"
      ],
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Route de test pour vérifier que les routes sont bien chargées
app.get("/api/test-routes", (req, res) => {
  const allRoutes = [];
  
  // Collecter toutes les routes enregistrées
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      const methods = Object.keys(middleware.route.methods).map(m => m.toUpperCase());
      allRoutes.push(`${methods.join(',')} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      // Routes dans un router
      middleware.handle.stack?.forEach((handler) => {
        if (handler.route) {
          const methods = Object.keys(handler.route.methods).map(m => m.toUpperCase());
          allRoutes.push(`${methods.join(',')} ${handler.regexp.source}`);
        }
      });
    }
  });
  
  res.json({
    success: true,
    message: 'Routes disponibles',
    routes: allRoutes,
    valentineRouteExists: allRoutes.some(r => r.includes('valentine-winners'))
  });
});

// Route GET /api/auth/me - Récupérer l'utilisateur depuis le cookie
app.get("/api/auth/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        status: user.status,
        accountStatus: user.accountStatus,
        emailVerified: user.emailVerified,
        role: user.role,
        authProvider: user.authProvider,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des données utilisateur' });
  }
});

// Routes seront montées dans startServer après chargement dynamique
// Placeholders pour éviter les erreurs si routes non chargées

// Routes ressources PDF (publiques) - seront montées dans startServer après chargement dynamique
// Placeholder pour éviter les erreurs
app.get("/api/ressources-pdf", async (req, res) => {
  if (!ressourcesPdfRoutes) {
    // Essayer de charger le module si pas encore chargé
    try {
      const module = await import("./routes/ressources-pdf.js");
      ressourcesPdfRoutes = module.default;
      app.use("/api/ressources-pdf", ressourcesPdfRoutes);
      // Laisser la requête passer au router
      return;
    } catch (error) {
      return res.status(503).json({ 
        success: false, 
        error: 'Module ressources-pdf non disponible',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
});

// Routes seront montées dans startServer après chargement dynamique

// Route de test pour vérifier les routes Success Radar (sera montée après chargement dynamique)
app.get("/api/test-success-radar-routes", (req, res) => {
  if (!successRadarRoutes) {
    return res.status(503).json({ 
      success: false,
      message: 'Module successRadar non chargé' 
    });
  }
  
  const routes = successRadarRoutes.stack
    .filter(r => r.route)
    .map(r => ({
      method: Object.keys(r.route.methods)[0].toUpperCase(),
      path: r.route.path
    }));
  
  res.json({ 
    success: true,
    message: 'Routes Success Radar disponibles',
    routes: routes,
    valentineExists: routes.some(r => r.path === '/valentine-winners'),
    totalRoutes: routes.length
  });
});

// Note: La route /api/valentine-winners est définie plus haut (ligne ~183) pour garantir sa priorité
// Toutes les autres routes seront montées dans startServer après chargement dynamique

// Route chatbot (protégée - nécessite statut active)
app.post("/api/chat", authenticate, async (req, res) => {
  const { message, conversationHistory } = req.body;

  try {
    // Le frontend gère les restrictions selon user.status
    // Ne jamais bloquer ici selon le status

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
  console.log(`   - Headers:`, JSON.stringify(req.headers, null, 2));
  res.status(404).json({ 
    error: `Route non trouvée: ${req.method} ${req.originalUrl}`,
    availableRoutes: [
      'GET /auth/google',
      'GET /auth/google/callback',
      'POST /api/register',
      'POST /api/login',
      'GET /api/user/me',
      'PUT /api/profile',
      'PUT /api/change-password',
      'POST /api/chat',
      'GET /api/success-radar',
      'GET /api/valentine-winners',
      'POST /api/regenerate-products',
      'POST /api/regenerate-valentine',
      'GET /api/ressources-pdf',
      'GET /api/ressources-pdf/:slug',
      'GET /api/courses',
      'GET /api/courses/:id',
      'GET /api/comments',
      'GET /api/progress',
      'POST /api/admin/register',
      'GET /api/admin/check',
      'GET /api/admin/ressources-pdf',
      'POST /api/admin/ressources-pdf',
      'PUT /api/admin/ressources-pdf/:id',
      'DELETE /api/admin/ressources-pdf/:id'
    ]
  });
});

const PORT = process.env.PORT || 3000;

// Démarrer le serveur après la connexion MongoDB
const startServer = async () => {
  try {
    // Charger TOUS les modules dynamiquement pour éviter les crashes si fichiers absents
    console.log('📦 Chargement dynamique de tous les modules...');
    
    // 1. Routes d'authentification
    try {
      const authModule = await import("./routes/auth.js");
      authRoutes = authModule.default;
      app.use("/api", authRoutes);
      console.log('✅ Routes d\'authentification chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement auth.js:', error.message);
    }
    
    // 2. Routes vidéos
    try {
      const videoModule = await import("./routes/videos.js");
      videoRoutes = videoModule.default;
      app.use("/api", videoRoutes);
      console.log('✅ Routes vidéos chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement videos.js:', error.message);
    }
    
    // 3. Routes cours
    try {
      const coursesModule = await import("./routes/courses.js");
      coursesRoutes = coursesModule.default;
      app.use("/api/courses", coursesRoutes);
      console.log('✅ Routes cours chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement courses.js:', error.message);
    }
    
    // 4. Routes ressources PDF
    try {
      const ressourcesPdfModule = await import("./routes/ressources-pdf.js");
      ressourcesPdfRoutes = ressourcesPdfModule.default;
      app.use("/api/ressources-pdf", ressourcesPdfRoutes);
      console.log('✅ Routes ressources PDF chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement ressources-pdf.js:', error.message);
      app.get("/api/ressources-pdf", (req, res) => {
        res.status(503).json({ success: false, error: 'Module ressources-pdf non disponible' });
      });
    }
    
    // 5. Routes progression
    try {
      const progressModule = await import("./routes/progress.js");
      progressRoutes = progressModule.default;
      app.use("/api/progress", progressRoutes);
      console.log('✅ Routes progression chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement progress.js:', error.message);
    }
    
    // 6. Routes commentaires
    try {
      const commentsModule = await import("./routes/comments.js");
      commentsRoutes = commentsModule.default;
      app.use("/api/comments", commentsRoutes);
      console.log('✅ Routes commentaires chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement comments.js:', error.message);
    }
    
    // 7. Routes Success Radar
    try {
      const successRadarModule = await import("./routes/successRadar.js");
      successRadarRoutes = successRadarModule.default;
      app.use("/api", successRadarRoutes);
      console.log('✅ Routes Success Radar chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement successRadar.js:', error.message);
    }
    
    // 8. Routes admin
    try {
      const adminModule = await import("./routes/admin.js");
      adminRoutes = adminModule.default;
      app.use("/api/admin", adminRoutes);
      console.log('✅ Routes admin chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement admin.js:', error.message);
    }
    
    // 9. Routes paiement
    try {
      const paymentModule = await import("./routes/payment.js");
      paymentRoutes = paymentModule.default;
      app.use("/api/payment", paymentRoutes);
      console.log('✅ Routes paiement chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement payment.js:', error.message);
    }
    
    // 10. Routes diagnostic
    try {
      const diagnosticModule = await import("./routes/diagnostic.js");
      diagnosticRoutes = diagnosticModule.default;
      app.use("/api/diagnostic", diagnosticRoutes);
      console.log('✅ Routes diagnostic chargées');
    } catch (error) {
      console.error('⚠️ Erreur chargement diagnostic.js:', error.message);
    }
    
    // 11. Services Success Radar Cron
    try {
      const successRadarCronModule = await import("./services/successRadarCron.js");
      startSuccessRadarCron = successRadarCronModule.startSuccessRadarCron;
      runSuccessRadarOnce = successRadarCronModule.runSuccessRadarOnce;
      console.log('✅ Services Success Radar Cron chargés');
    } catch (error) {
      console.error('⚠️ Erreur chargement successRadarCron.js:', error.message);
    }
    
    console.log('📦 Chargement dynamique terminé\n');
    
    // Connexion MongoDB
    await connectDB();
    
    // Plus de création automatique d'admin
    // L'admin doit créer son compte via /admin/login (première connexion uniquement)
    
    // S'assurer que Facebook Ads est "activé" (publié) par défaut
    let facebookAdsCourse = await Course.findOne({ slug: 'facebook-ads' });
    
    if (!facebookAdsCourse) {
      console.log('🚀 Initialisation automatique du cours Facebook Ads...');
      
      // Créer le cours Facebook Ads
      facebookAdsCourse = new Course({
        title: 'Facebook Ads',
        description: 'Apprendre à vendre avec Facebook Ads - Méthode Andromeda',
        coverImage: '/img/fbads.png',
        slug: 'facebook-ads',
        isDefault: true,
        isPublished: true
      });
      await facebookAdsCourse.save();
      console.log('✅ Cours Facebook Ads créé');

      // Créer le Module 1
      const module1 = new Module({
        courseId: facebookAdsCourse._id,
        title: 'Module 1 - Formation Andromeda',
        order: 1
      });
      await module1.save();
      console.log('✅ Module 1 créé');

      // Créer toutes les leçons
      const lessonsData = [
        {
          title: 'JOUR 1 - Introduction',
          videoId: '_FEzE2vdu_k',
          order: 1,
          summary: {
            text: `Bienvenue dans la formation Andromeda ! Cette méthode révolutionnaire vous permettra de créer des campagnes Facebook Ads performantes qui génèrent des ventes. Dans ce premier jour, vous découvrirez les fondamentaux de la méthode et comment structurer votre approche pour maximiser vos résultats.`,
            points: [
              'Découvrir la méthode Andromeda',
              'Comprendre la structure d\'une campagne performante',
              'Préparer votre stratégie de lancement',
              'Apprendre les bases du système de test',
              'Maîtriser l\'approche progressive de scaling'
            ]
          },
          resources: [
            {
              icon: '📄',
              title: 'Andromeda - Jour des créas',
              type: 'PDF',
              link: '/assets/docs/andromeda-jour-des-creas.pdf',
              download: true
            }
          ]
        },
        {
          title: 'JOUR 2 - La structure d\'une campagne qui nourrit Andromeda',
          videoId: '1151322854',
          order: 2,
          summary: {
            text: `Aujourd'hui, vous allez découvrir la structure complète d'une campagne Andromeda. Cette méthode révolutionnaire vous permettra de créer des campagnes qui génèrent des ventes de manière prévisible et scalable.`,
            points: [
              'Comprendre les principes fondamentaux de la méthode Andromeda',
              'Découvrir la structure d\'une campagne qui convertit',
              'Apprendre comment nourrir l\'algorithme Facebook efficacement',
              'Maîtriser les éléments clés d\'une campagne performante',
              'Préparer votre stratégie de test et d\'optimisation'
            ]
          },
          resources: [
            {
              icon: '🎓',
              title: 'Formation Comote Sora 2',
              type: 'Lien vers la formation',
              link: '#',
              download: false
            }
          ]
        },
        {
          title: 'JOUR 3 - Créer la créative Andromeda',
          videoId: 'gdG0xjuF7SQ',
          order: 3,
          summary: {
            text: `Aujourd'hui, vous allez créer la créative Andromeda, le cœur de votre campagne. Cette vidéo verticale doit captiver votre audience dès les premières secondes et suivre une structure précise pour maximiser les conversions.`,
            points: [
              '🎬 Vidéo verticale 9:16 – Durée : 20 à 30 secondes',
              '🎣 Hook fort dans les 2 premières secondes pour captiver immédiatement',
              '📐 Structure : Problème → Révélation → Preuve → Promesse → CTA',
              '✨ Optimiser chaque élément pour maximiser l\'engagement',
              '🎯 Créer une vidéo qui convertit efficacement'
            ]
          },
          resources: [
            {
              icon: '📄',
              title: 'Guide de création de campagne',
              type: 'PDF • 4.2 MB',
              link: '/assets/docs/guide-creation-campagne.pdf',
              download: true
            },
            {
              icon: '📝',
              title: 'Formules de copywriting',
              type: 'PDF • 1.8 MB',
              link: '/assets/docs/formules-copywriting.pdf',
              download: true
            }
          ]
        },
        {
          title: 'JOUR 4 - Paramétrer le compte publicitaire',
          videoId: '1151323764',
          order: 4,
          summary: {
            text: `Aujourd'hui, vous allez paramétrer correctement votre compte publicitaire Facebook. Cette configuration est essentielle pour que vos campagnes fonctionnent de manière optimale et que vous puissiez suivre précisément vos conversions.`,
            points: [
              '💰 Devise : HKD – Dollar Hong Kong',
              '💳 Ajouter la carte bancaire au compte',
              '💵 Créditer 25 $ (budget pour 5 jours à 5$/jour)',
              '📊 Installer le Pixel Meta sur votre site web',
              '🎯 Configurer l\'événement Purchase (achat) dans le Pixel',
              '✅ Vérifier que le tracking fonctionne correctement'
            ]
          },
          resources: [
            {
              icon: '📄',
              title: 'Dictionnaire des métriques',
              type: 'PDF • 2.8 MB',
              link: '/assets/docs/dictionnaire-metriques.pdf',
              download: true
            },
            {
              icon: '📊',
              title: 'Template de reporting',
              type: 'XLSX • 1.5 MB',
              link: '/assets/docs/template-reporting.xlsx',
              download: true
            }
          ]
        },
        {
          title: 'JOUR 5 - Lancement',
          videoId: '1151379720',
          order: 5,
          summary: {
            text: `Le moment est venu ! Aujourd'hui, vous allez lancer votre campagne Andromeda. Cette étape est simple mais cruciale : vous devez activer la campagne et laisser l'algorithme faire son travail sans intervention.`,
            points: [
              '🚀 Activer la campagne préparée hier',
              '⚠️ Ne rien modifier - Laisser l\'algorithme apprendre',
              '👀 Observer uniquement les ventes générées',
              '📊 Noter les premiers résultats sans intervenir',
              '⏳ Laisser tourner au moins 24h sans modification'
            ]
          },
          resources: [
            {
              icon: '📄',
              title: 'Guide de démarrage',
              type: 'PDF • 2.5 MB',
              link: '/assets/docs/guide-demarrage.pdf',
              download: true
            },
            {
              icon: '📊',
              title: 'Checklist de campagne',
              type: 'PDF • 1.2 MB',
              link: '/assets/docs/checklist-campagne.pdf',
              download: true
            }
          ]
        },
        {
          title: 'JOUR 6 - Analyse et optimisation',
          videoId: '148751763',
          order: 6,
          summary: {
            text: `Après 2 jours de lancement, il est temps d'analyser les premiers résultats. Cette phase d'apprentissage est cruciale : vous allez observer ce qui fonctionne et ce qui ne fonctionne pas, sans pour autant intervenir prématurément.`,
            points: [
              '⚠️ Ne couper aucune publicité à ce stade',
              '📝 Noter : Les adsets qui génèrent des achats',
              '📝 Noter : Les adsets complètement ignorés (0 engagement)',
              '📊 Analyser les métriques sans modifier',
              '⏳ Laisser l\'algorithme continuer son apprentissage',
              '📈 Observer les tendances émergentes'
            ]
          },
          resources: [
            {
              icon: '📄',
              title: 'Livre blanc stratégies avancées',
              type: 'PDF • 5.2 MB',
              link: '/assets/docs/livre-blanc-strategies.pdf',
              download: true
            },
            {
              icon: '📊',
              title: 'Exemples de funnel complets',
              type: 'PDF • 3.8 MB',
              link: '/assets/docs/exemples-funnel.pdf',
              download: true
            }
          ]
        },
        {
          title: 'JOUR 7 - Mini Scaling',
          videoId: '148751763',
          order: 7,
          summary: {
            text: `Après 3 jours d'observation, il est temps de faire votre première optimisation. Cette étape de mini scaling vous permettra d'éliminer les adsets morts et d'augmenter progressivement le budget de votre campagne performante.`,
            points: [
              '✂️ Couper uniquement les adsets totalement morts (0 engagement, 0 résultat)',
              '📈 Augmenter le budget de la campagne de +20 % maximum',
              '⚠️ Ne pas modifier les adsets qui génèrent des résultats',
              '💰 Maintenir un budget raisonnable pour continuer l\'apprentissage',
              '📊 Observer l\'impact de ces modifications sur les performances',
              '⏳ Laisser tourner 24h avant toute nouvelle modification'
            ]
          },
          resources: [
            {
              icon: '📄',
              title: 'Guide de scaling progressif',
              type: 'PDF • 2.8 MB',
              link: '/assets/docs/guide-scaling.pdf',
              download: true
            },
            {
              icon: '📊',
              title: 'Template d\'optimisation',
              type: 'XLSX • 1.2 MB',
              link: '/assets/docs/template-optimisation.xlsx',
              download: true
            }
          ]
        },
        {
          title: 'JOUR 8 - Réservation Coaching',
          videoId: '148751763',
          order: 8,
          isCoaching: true,
          summary: {
            text: `Félicitations ! Vous avez terminé la formation Andromeda. Il est maintenant temps de réserver votre session de coaching personnalisée pour approfondir vos connaissances et optimiser vos campagnes.`,
            points: []
          },
          resources: []
        }
      ];

      for (const lessonData of lessonsData) {
        const lesson = new Lesson({
          moduleId: module1._id,
          title: lessonData.title,
          videoId: lessonData.videoId,
          order: lessonData.order,
          locked: false,
          summary: lessonData.summary || {},
          resources: lessonData.resources || [],
          isCoaching: lessonData.isCoaching || false
        });
        await lesson.save();
        console.log(`✅ Leçon ${lessonData.order} créée: ${lessonData.title}`);
      }
      
      console.log('✅ Cours Facebook Ads initialisé avec succès !');
    } else {
      console.log('ℹ️ Cours Facebook Ads existe déjà');
      if (facebookAdsCourse.isPublished !== true) {
        facebookAdsCourse.isPublished = true;
        await facebookAdsCourse.save();
        console.log('✅ Facebook Ads publié (visible sur la home)');
      }
    }
    
    // Démarrer le Success Radar (cron + exécution initiale) si disponible
    if (startSuccessRadarCron && runSuccessRadarOnce) {
      startSuccessRadarCron();
      runSuccessRadarOnce();
    } else {
      console.warn('⚠️ Services Success Radar Cron non disponibles');
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
      console.log(`   GET  /api/success-radar - Success Radar (protégé)`);
      console.log(`   GET  /api/valentine-winners - Winners St Valentin (protégé)`);
      console.log(`\n✅ Serveur prêt à recevoir des requêtes!\n`);
    });
  } catch (error) {
    console.error('❌ Impossible de démarrer le serveur:', error);
    process.exit(1);
  }
};

startServer();
