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

  // URL de callback fixe pour Render (OBLIGATOIRE)
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || 
    (process.env.NODE_ENV === 'production' || process.env.RENDER_EXTERNAL_URL
      ? 'https://plateforme-r1h7.onrender.com/auth/google/callback'
      : 'http://localhost:3000/auth/google/callback');

  console.log('🔐 Configuration Google OAuth:');
  console.log('   - Client ID:', GOOGLE_CLIENT_ID.substring(0, 30) + '...');
  console.log('   - Callback URL:', callbackURL);

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

      // Chercher un utilisateur existant par googleId
      console.log('   - Recherche utilisateur avec googleId:', googleId);
      
      let user = await User.findOne({ googleId: googleId });

      if (!user) {
        console.log('   - 📝 Nouvel utilisateur à créer');
        
        // Vérifier si un utilisateur existe déjà avec cet email
        const existingUserByEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingUserByEmail) {
          console.log('   - 🔄 Utilisateur existant avec cet email trouvé');
          console.log('   -   Email:', existingUserByEmail.email);
          console.log('   -   Mise à jour avec googleId et authProvider');
          // Mettre à jour l'utilisateur existant pour ajouter googleId et changer authProvider
          existingUserByEmail.googleId = googleId;
          existingUserByEmail.authProvider = "google";
          if (!existingUserByEmail.name && name) {
            existingUserByEmail.name = name;
            console.log('   -   Mise à jour du nom:', name);
          }
          await existingUserByEmail.save();
          user = existingUserByEmail;
          console.log('   - ✅ Utilisateur mis à jour avec Google OAuth');
          console.log('   -   User ID:', user._id.toString());
          console.log('   -   Status:', user.status);
        } else {
          // Nouvel utilisateur - créer le compte automatiquement
          console.log('   - 🆕 Création automatique du compte');
          try {
            user = await User.create({
              name: profile.displayName || email.split('@')[0],
              email: profile.emails?.[0]?.value || email.toLowerCase(),
              googleId: profile.id,
              authProvider: "google",
              emailVerified: false,
              accountStatus: "pending",
              role: 'student',
              status: 'pending'
            });
            console.log('   - ✅ Nouvel utilisateur créé automatiquement');
            console.log('   -   Email:', user.email);
            console.log('   -   Nom:', user.name);
            console.log('   -   User ID:', user._id.toString());
            console.log('   -   Status: pending (en attente de validation admin)');
          } catch (createError) {
            console.error('   - ❌ Erreur lors de la création de l\'utilisateur:', createError);
            // Si l'erreur est due à un email dupliqué, essayer de récupérer l'utilisateur
            if (createError.code === 11000 && createError.keyPattern?.email) {
              console.log('   - 🔄 Email déjà utilisé, récupération de l\'utilisateur existant');
              user = await User.findOne({ email: email.toLowerCase() });
              if (user) {
                user.googleId = googleId;
                user.authProvider = "google";
                await user.save();
                console.log('   - ✅ Utilisateur mis à jour avec Google OAuth');
              } else {
                throw createError;
              }
            } else {
              throw createError;
            }
          }
        }
      } else {
        console.log('   - ✅ Utilisateur existant trouvé (par googleId)');
        console.log('   -   Email:', user.email);
        console.log('   -   Nom:', user.name);
        console.log('   -   User ID:', user._id.toString());
        console.log('   -   Status:', user.status);
        console.log('   -   Role:', user.role);
        // Mise à jour si nécessaire
        if (!user.name && name) {
          console.log('   - 🔄 Mise à jour: ajout name');
          user.name = name;
          await user.save();
        }
      }

      console.log('🔐 ========== FIN PASSPORT STRATEGY ==========');
      
      // Vérifier que l'utilisateur a un _id valide
      if (!user || !user._id) {
        console.error('❌ ERREUR: Utilisateur sans _id valide');
        return done(new Error('Utilisateur sans ID valide'), null);
      }
      
      // Convertir l'objet User MongoDB en objet simple pour la session
      const userObj = {
        _id: user._id.toString(), // S'assurer que _id est une string
        googleId: user.googleId,
        name: user.name,
        email: user.email,
        status: user.status || 'pending',
        role: user.role || 'student',
        authProvider: user.authProvider || 'google'
      };
      
      // Ne pas inclure phoneNumber si il est null/undefined (évite les problèmes d'index)
      if (user.phoneNumber) {
        userObj.phoneNumber = user.phoneNumber;
      }
      
      console.log('   - UserObj créé:', JSON.stringify(userObj, null, 2));
      return done(null, userObj);
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

  // Sérialisation utilisateur pour la session (version simplifiée pour Render)
  passport.serializeUser((user, done) => {
    // Sérialiser l'objet utilisateur complet pour éviter les problèmes de session
    done(null, user);
  });

  passport.deserializeUser((obj, done) => {
    // Désérialiser directement l'objet (pas besoin de requête DB)
    done(null, obj);
  });
};

