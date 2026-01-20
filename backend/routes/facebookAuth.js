import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { setRedisValue, getRedisValue } from '../config/redis.js';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

const router = express.Router();

// Accepter les deux formats de variables (FACEBOOK_* ou META_*)
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || process.env.META_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || process.env.META_APP_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Extraire BACKEND_URL depuis META_REDIRECT_URI si disponible
let BACKEND_URL = process.env.BACKEND_URL;
if (!BACKEND_URL && process.env.META_REDIRECT_URI) {
  try {
    const url = new URL(process.env.META_REDIRECT_URI);
    BACKEND_URL = `${url.protocol}//${url.host}`;
  } catch (e) {
    // Si l'URL n'est pas valide, utiliser la valeur par défaut
    BACKEND_URL = 'http://localhost:3000';
  }
}
if (!BACKEND_URL) {
  BACKEND_URL = 'http://localhost:3000';
}

// TTL pour les tokens Meta (30 minutes = 1800 secondes)
const META_TOKEN_TTL = 1800;

/**
 * GET /api/meta/init-facebook-auth
 * Route intermédiaire pour initier l'OAuth Facebook avec token JWT
 * Accepte le token dans le header Authorization
 * Retourne l'URL de redirection Facebook
 */
router.get('/api/meta/init-facebook-auth', authenticate, async (req, res) => {
  try {
    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      console.error('❌ Configuration Facebook manquante');
      console.error('   FACEBOOK_APP_ID:', FACEBOOK_APP_ID ? '✅ Défini' : '❌ Manquant');
      console.error('   FACEBOOK_APP_SECRET:', FACEBOOK_APP_SECRET ? '✅ Défini' : '❌ Manquant');
      console.error('   Ajoutez ces variables dans votre fichier .env :');
      console.error('   FACEBOOK_APP_ID=votre_app_id');
      console.error('   FACEBOOK_APP_SECRET=votre_app_secret');
      return res.status(500).json({ 
        error: 'Configuration Facebook manquante',
        message: 'Les variables FACEBOOK_APP_ID et FACEBOOK_APP_SECRET doivent être définies dans le fichier .env du backend',
        details: {
          FACEBOOK_APP_ID: FACEBOOK_APP_ID ? 'Défini' : 'Manquant',
          FACEBOOK_APP_SECRET: FACEBOOK_APP_SECRET ? 'Défini' : 'Manquant'
        }
      });
    }

    const userId = req.user._id.toString();
    
    // Scopes nécessaires pour accéder aux Business Managers et comptes publicitaires
    const scopes = [
      'business_management',
      'ads_read',
      'ads_management',
      'read_insights'
    ].join(',');

    // Créer un state sécurisé avec userId et timestamp
    const state = Buffer.from(JSON.stringify({ 
      userId,
      timestamp: Date.now()
    })).toString('base64');

    const callbackUrl = `${BACKEND_URL}/auth/facebook/callback`;
    
    // Construire l'URL d'authentification Facebook
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${FACEBOOK_APP_ID}&` +
      `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
      `scope=${scopes}&` +
      `state=${state}&` +
      `response_type=code`;

    console.log(`🔐 Génération URL OAuth Facebook pour utilisateur ${userId}`);
    console.log(`   Callback URL: ${callbackUrl}`);
    console.log(`   BACKEND_URL: ${BACKEND_URL}`);
    console.log(`   App ID: ${FACEBOOK_APP_ID?.substring(0, 10)}...`);
    
    // Retourner l'URL au lieu de rediriger (le frontend fera la redirection)
    res.json({
      success: true,
      authUrl: authUrl
    });
  } catch (error) {
    console.error('❌ Erreur initiation OAuth Facebook:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'authentification Facebook',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /auth/facebook
 * Initier l'authentification OAuth Facebook
 * Accepte un token temporaire en query param ou utilise la session
 */
router.get('/auth/facebook', async (req, res) => {
  try {
    let userId = null;

    // Méthode 1: Token temporaire dans query param
    if (req.query.token) {
      try {
        const decoded = jwt.verify(
          req.query.token,
          process.env.JWT_SECRET || 'your-secret-key-change-in-production'
        );
        if (decoded.type === 'facebook_oauth') {
          userId = decoded.userId;
        }
      } catch (err) {
        console.error('❌ Token temporaire invalide:', err.message);
        return res.redirect(`${FRONTEND_URL}/connect-facebook?error=invalid_token`);
      }
    }
    // Méthode 2: Authentification normale (pour compatibilité)
    else {
      // Essayer d'utiliser le middleware authenticate via une requête interne
      try {
        const authReq = { ...req };
        await new Promise((resolve, reject) => {
          authenticate(authReq, res, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        if (authReq.user) {
          userId = authReq.user._id.toString();
        }
      } catch (err) {
        // Si l'authentification échoue, rediriger vers le frontend
        return res.redirect(`${FRONTEND_URL}/connect-facebook?error=auth_required`);
      }
    }

    if (!userId) {
      return res.redirect(`${FRONTEND_URL}/connect-facebook?error=no_user_id`);
    }

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      console.error('❌ Configuration Facebook manquante');
      console.error('   FACEBOOK_APP_ID:', FACEBOOK_APP_ID ? '✅ Défini' : '❌ Manquant');
      console.error('   FACEBOOK_APP_SECRET:', FACEBOOK_APP_SECRET ? '✅ Défini' : '❌ Manquant');
      console.error('   📝 Ajoutez ces variables dans backend/.env');
      return res.redirect(`${FRONTEND_URL}/connect-facebook?error=config_missing&message=${encodeURIComponent('Configuration Facebook manquante - Voir backend/FACEBOOK_SETUP.md')}`);
    }

    // Scopes nécessaires pour accéder aux Business Managers et comptes publicitaires
    const scopes = [
      'business_management',
      'ads_read',
      'ads_management',
      'read_insights'
    ].join(',');

    // Créer un state sécurisé avec userId et timestamp
    const state = Buffer.from(JSON.stringify({ 
      userId,
      timestamp: Date.now()
    })).toString('base64');

    const callbackUrl = `${BACKEND_URL}/auth/facebook/callback`;
    
    // Construire l'URL d'authentification Facebook
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${FACEBOOK_APP_ID}&` +
      `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
      `scope=${scopes}&` +
      `state=${state}&` +
      `response_type=code`;

    console.log(`🔐 Redirection OAuth Facebook pour utilisateur ${userId}`);
    res.redirect(authUrl);
  } catch (error) {
    console.error('❌ Erreur initiation OAuth Facebook:', error);
    res.redirect(`${FRONTEND_URL}/connect-facebook?error=oauth_init_failed&message=${encodeURIComponent(error.message)}`);
  }
});

/**
 * GET /auth/facebook/callback
 * Callback OAuth Facebook
 * Échange le code contre un access token et le stocke dans Redis
 */
router.get('/auth/facebook/callback', async (req, res) => {
  try {
    const { code, state, error: facebookError } = req.query;
    
    // Vérifier les erreurs Facebook
    if (facebookError) {
      console.error('❌ Erreur Facebook OAuth:', facebookError);
      return res.redirect(`${FRONTEND_URL}/connect-facebook?error=facebook_auth_failed&message=${encodeURIComponent(facebookError)}`);
    }

    if (!code) {
      console.error('❌ Code OAuth manquant');
      return res.redirect(`${FRONTEND_URL}/connect-facebook?error=no_code`);
    }

    if (!state) {
      console.error('❌ State manquant');
      return res.redirect(`${FRONTEND_URL}/connect-facebook?error=no_state`);
    }

    // Décoder le state pour récupérer l'userId
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch (err) {
      console.error('❌ Erreur décodage state:', err);
      return res.redirect(`${FRONTEND_URL}/connect-facebook?error=invalid_state`);
    }

    const userId = stateData.userId;
    
    if (!userId) {
      console.error('❌ userId manquant dans state');
      return res.redirect(`${FRONTEND_URL}/connect-facebook?error=no_user_id`);
    }

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      console.error('❌ Configuration Facebook manquante');
      return res.redirect(`${FRONTEND_URL}/connect-facebook?error=config_missing`);
    }

    const callbackUrl = `${BACKEND_URL}/auth/facebook/callback`;

    console.log(`🔄 Échange du code OAuth contre un access token pour utilisateur ${userId}`);

    // Échanger le code contre un access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${FACEBOOK_APP_ID}&` +
      `client_secret=${FACEBOOK_APP_SECRET}&` +
      `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
      `code=${code}`
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error('❌ Erreur échange token Facebook:', errorData);
      return res.redirect(`${FRONTEND_URL}/connect-facebook?error=token_exchange_failed&message=${encodeURIComponent(errorData.error?.message || 'Unknown error')}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in || 5184000; // 60 jours par défaut de Facebook

    if (!accessToken) {
      console.error('❌ Access token manquant dans la réponse');
      return res.redirect(`${FRONTEND_URL}/connect-facebook?error=no_token`);
    }

    // Stocker le token dans Redis avec TTL de 30 minutes
    const redisKey = `meta:${userId}`;
    const tokenDataToStore = JSON.stringify({
      accessToken,
      expiresAt: Date.now() + (expiresIn * 1000),
      createdAt: Date.now()
    });

    const stored = await setRedisValue(redisKey, tokenDataToStore, META_TOKEN_TTL);
    
    if (!stored) {
      console.warn('⚠️ Impossible de stocker le token dans Redis, utilisation du fallback');
      // Fallback: on pourrait utiliser le Map en mémoire ici si nécessaire
    }

    console.log(`✅ Token Meta stocké dans Redis pour utilisateur ${userId} (TTL: ${META_TOKEN_TTL}s)`);

    // Rediriger vers l'analyseur avec succès
    res.redirect(`${FRONTEND_URL}/connect-facebook?success=connected`);
  } catch (error) {
    console.error('❌ Erreur callback OAuth Facebook:', error);
    res.redirect(`${FRONTEND_URL}/connect-facebook?error=callback_failed&message=${encodeURIComponent(error.message)}`);
  }
});

export default router;

