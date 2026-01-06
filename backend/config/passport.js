import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

/**
 * Configuration de la stratégie Google OAuth pour Passport
 */
export const configurePassport = () => {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️  GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET non défini. OAuth Google désactivé.');
    return;
  }

  // Détection automatique de l'URL du callback OAuth
  // Les URIs autorisés dans Google Cloud Console sont :
  // - http://localhost:3000/auth/google/callback (développement)
  // - https://www.safitech.shop/auth/google/callback (production)
  // - https://plateforme-r1h7.onrender.com/auth/google/callback (Render - URL fixe)
  const getCallbackURL = () => {
    // Si GOOGLE_CALLBACK_URL est défini explicitement, l'utiliser
    if (process.env.GOOGLE_CALLBACK_URL) {
      return process.env.GOOGLE_CALLBACK_URL;
    }
    
    // URL fixe pour Render (production)
    if (process.env.NODE_ENV === 'production' || process.env.RENDER_EXTERNAL_URL) {
      return 'https://plateforme-r1h7.onrender.com/auth/google/callback';
    }
    
    // En développement local
    return 'http://localhost:3000/auth/google/callback';
  };

  const callbackURL = getCallbackURL();

  console.log('🔐 Configuration Google OAuth:');
  console.log('   - Client ID:', GOOGLE_CLIENT_ID.substring(0, 30) + '...');
  console.log('   - Callback URL:', callbackURL);
  console.log('   - RENDER_EXTERNAL_URL:', process.env.RENDER_EXTERNAL_URL || 'non défini');
  console.log('   - GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL || 'non défini');
  console.log('   - NODE_ENV:', process.env.NODE_ENV || 'non défini');

  // Configuration de la stratégie Google OAuth
  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: callbackURL
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('🔐 ========== PASSPORT STRATEGY CALLBACK ==========');
      console.log('   - Profile reçu de Google');
      console.log('   - Profile ID:', profile.id);
      console.log('   - Profile displayName:', profile.displayName);
      console.log('   - Profile emails:', JSON.stringify(profile.emails, null, 2));
      console.log('   - Profile photos:', profile.photos ? profile.photos.length + ' photo(s)' : 'aucune');
      console.log('   - Profile raw:', JSON.stringify(profile, null, 2));
      
      const { id: googleId, emails, displayName: name, photos } = profile;
      // Version sécurisée : vérifier que emails existe et contient au moins un élément
      const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;

      console.log('   - Email extrait:', email);
      console.log('   - Google ID:', googleId);
      console.log('   - Display Name:', name);

      if (!email) {
        console.error('❌ ERREUR: Email non fourni par Google');
        console.error('   - Profile complet:', JSON.stringify(profile, null, 2));
        return done(new Error('Email non fourni par Google'), null);
      }

      // Chercher un utilisateur existant par googleId ou email
      console.log('   - Recherche utilisateur avec email:', email.toLowerCase());
      console.log('   - Recherche utilisateur avec googleId:', googleId);
      
      let user = await User.findOne({
        $or: [
          { googleId },
          { email: email.toLowerCase() }
        ]
      });

      if (user) {
        console.log('   - ✅ Utilisateur existant trouvé:', user.email);
        console.log('   - User ID:', user._id);
        console.log('   - User status:', user.status);
        // Utilisateur existant - mise à jour si nécessaire
        if (!user.googleId) {
          console.log('   - Mise à jour: ajout googleId');
          user.googleId = googleId;
          user.authProvider = 'google';
        }
        if (!user.name && name) {
          console.log('   - Mise à jour: ajout name');
          user.name = name;
        }
        await user.save();
        console.log('   - Utilisateur mis à jour avec succès');
      } else {
        console.log('   - Nouvel utilisateur à créer');
        // Nouvel utilisateur - créer le compte
        user = new User({
          name: name || email.split('@')[0],
          email: email.toLowerCase(),
          googleId,
          authProvider: 'google',
          role: 'student',
          status: 'pending' // En attente de validation par l'admin
        });
        await user.save();
        console.log('   - ✅ Nouvel utilisateur créé:', user.email);
        console.log('   - User ID:', user._id);
      }

      console.log('🔐 ========== FIN PASSPORT STRATEGY ==========');
      return done(null, user);
    } catch (error) {
      console.error('❌ ========== ERREUR PASSPORT STRATEGY ==========');
      console.error('   - Error message:', error.message);
      console.error('   - Error stack:', error.stack);
      console.error('   - Error name:', error.name);
      console.error('   - Profile reçu:', JSON.stringify(profile, null, 2));
      console.error('❌ ============================================');
      return done(error, null);
    }
  }));

  // Sérialisation utilisateur pour la session
  passport.serializeUser((user, done) => {
    console.log('📦 Serialize user:', user._id, user.email);
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      console.log('📦 Deserialize user ID:', id);
      const user = await User.findById(id);
      if (user) {
        console.log('   - User trouvé:', user.email);
      } else {
        console.error('   - ❌ User non trouvé pour ID:', id);
      }
      done(null, user);
    } catch (error) {
      console.error('❌ Erreur deserializeUser:', error);
      done(error, null);
    }
  });
};

