import express from 'express';
import fetch from 'node-fetch';
import User from '../models/User.js';

const router = express.Router();

const LYGOS_API_KEY = process.env.LYGOS_API_KEY || process.env.LYGOS_SECRET_KEY;
const LYGOS_BASE_URL = process.env.LYGOS_BASE_URL || process.env.LYGOS_API_URL || 'https://api.lygosapp.com/v1';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.safitech.shop';

// Log des variables d'environnement au démarrage (sans exposer les valeurs complètes)
console.log('🔑 ========== CONFIGURATION LYGOS ==========');
console.log('   - LYGOS_API_KEY défini:', !!LYGOS_API_KEY);
console.log('   - LYGOS_API_KEY length:', LYGOS_API_KEY ? LYGOS_API_KEY.length : 0);
console.log('   - LYGOS_API_KEY preview:', LYGOS_API_KEY ? `${LYGOS_API_KEY.substring(0, 10)}...` : 'undefined');
console.log('   - LYGOS_BASE_URL:', LYGOS_BASE_URL);
console.log('   - Variables process.env disponibles:');
console.log('     * LYGOS_API_KEY:', !!process.env.LYGOS_API_KEY);
console.log('     * LYGOS_SECRET_KEY:', !!process.env.LYGOS_SECRET_KEY);
console.log('     * LYGOS_BASE_URL:', !!process.env.LYGOS_BASE_URL);
console.log('     * LYGOS_API_URL:', !!process.env.LYGOS_API_URL);
console.log('🔑 ========== FIN CONFIGURATION ==========');

/**
 * POST /api/payment/init
 * Initialise un paiement via l'API Lygos
 */
router.post('/init', async (req, res) => {
  try {
    const { amount, order_id, phone, provider } = req.body;

    // Validation
    if (!amount || !order_id) {
      return res.status(400).json({ 
        error: 'Les champs amount et order_id sont requis' 
      });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ 
        error: 'Le montant doit être un nombre positif' 
      });
    }

    // Vérification détaillée des variables d'environnement
    console.log('🔍 ========== VÉRIFICATION VARIABLES LYGOS ==========');
    console.log('   - LYGOS_API_KEY défini:', !!LYGOS_API_KEY);
    console.log('   - LYGOS_API_KEY value:', LYGOS_API_KEY ? `${LYGOS_API_KEY.substring(0, 10)}...` : 'undefined');
    console.log('   - LYGOS_BASE_URL:', LYGOS_BASE_URL);
    console.log('   - process.env.LYGOS_API_KEY:', process.env.LYGOS_API_KEY ? 'défini' : 'undefined');
    console.log('   - process.env.LYGOS_SECRET_KEY:', process.env.LYGOS_SECRET_KEY ? 'défini' : 'undefined');
    console.log('🔍 ========== FIN VÉRIFICATION ==========');

    if (!LYGOS_API_KEY) {
      console.error('❌ LYGOS_API_KEY non définie dans .env');
      console.error('   - Vérifiez que LYGOS_API_KEY ou LYGOS_SECRET_KEY est défini sur Render');
      return res.status(500).json({ 
        error: 'Configuration du paiement manquante - LYGOS_API_KEY non définie' 
      });
    }

    console.log('💳 ========== INITIALISATION PAIEMENT LYGOS ==========');
    console.log('   - Amount:', amount);
    console.log('   - Order ID:', order_id);
    console.log('   - Phone:', phone || 'Non fourni');
    console.log('   - Provider:', provider || 'Non fourni');
    console.log('   - Base URL:', LYGOS_BASE_URL);
    console.log('   - API Key utilisé:', LYGOS_API_KEY ? `${LYGOS_API_KEY.substring(0, 10)}...` : 'undefined');

    // Préparer les URLs de callback
    const successUrl = `${FRONTEND_URL}/payment-success?order_id=${encodeURIComponent(order_id)}`;
    const failureUrl = `${FRONTEND_URL}/payment-failed?order_id=${encodeURIComponent(order_id)}`;

    console.log('   - Success URL:', successUrl);
    console.log('   - Failure URL:', failureUrl);

    // Préparer le body pour LYGOS avec les champs de base
    const lygosBody = {
      amount: amount,
      shop_name: "Safitech Academy",
      message: "Paiement formation",
      order_id: order_id,
      success_url: successUrl,
      failure_url: failureUrl
    };

    // Ajouter les champs optionnels si fournis
    if (phone) {
      lygosBody.phone = phone;
    }
    if (provider) {
      lygosBody.provider = provider; // 'mtn' ou 'orange'
    }

    // Appeler l'API Lygos
    console.log('📤 Appel API Lygos...');
    console.log('   - URL:', `${LYGOS_BASE_URL}/gateway`);
    console.log('   - Headers api-key:', LYGOS_API_KEY ? `${LYGOS_API_KEY.substring(0, 10)}...` : 'undefined');
    console.log('   - Body:', JSON.stringify(lygosBody, null, 2));
    
    const response = await fetch(`${LYGOS_BASE_URL}/gateway`, {
      method: 'POST',
      headers: {
        'api-key': LYGOS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(lygosBody)
    });
    
    console.log('📥 Réponse reçue de Lygos');
    console.log('   - Status:', response.status);
    console.log('   - StatusText:', response.statusText);

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('❌ Erreur parsing réponse Lygos:', parseError);
      const text = await response.text();
      console.error('   - Réponse brute:', text);
      return res.status(500).json({ 
        error: 'Réponse invalide de l\'API de paiement' 
      });
    }

    if (!response.ok) {
      console.error('❌ Erreur API Lygos:', data);
      console.error('   - Status:', response.status);
      console.error('   - StatusText:', response.statusText);
      return res.status(response.status).json({ 
        error: data.message || data.error || 'Erreur lors de l\'initialisation du paiement',
        details: process.env.NODE_ENV === 'development' ? data : undefined
      });
    }

    // Log de la réponse complète pour debug
    console.log('📥 Réponse complète de Lygos:', JSON.stringify(data, null, 2));
    
    // Vérifier si le lien existe (peut être dans différents champs)
    let paymentLink = data.link || data.payment_link || data.url || data.paymentUrl || data.checkout_url;
    
    if (!paymentLink) {
      console.error('❌ Pas de lien de paiement dans la réponse Lygos');
      console.error('   - Réponse complète:', JSON.stringify(data, null, 2));
      console.error('   - Champs disponibles:', Object.keys(data));
      return res.status(500).json({ 
        error: 'Réponse invalide de l\'API de paiement - lien manquant',
        details: process.env.NODE_ENV === 'development' ? data : undefined
      });
    }

    // Normaliser le lien si nécessaire
    // Si le lien ne commence pas par http/https, essayer de le compléter
    if (!paymentLink.startsWith('http://') && !paymentLink.startsWith('https://')) {
      console.warn('⚠️ Lien de paiement ne commence pas par http/https:', paymentLink);
      
      // Si c'est un chemin relatif (commence par /)
      if (paymentLink.startsWith('/')) {
        paymentLink = `https://api.lygosapp.com${paymentLink}`;
        console.log('   - Lien normalisé (chemin relatif):', paymentLink);
      } 
      // Si c'est un domaine sans protocole (contient un point mais pas de http)
      else if (paymentLink.includes('.') && !paymentLink.includes('://')) {
        // Ajouter https:// au début
        paymentLink = `https://${paymentLink}`;
        console.log('   - Lien normalisé (domaine sans protocole):', paymentLink);
      } 
      // Autre format inattendu
      else {
        console.error('❌ Format de lien inattendu:', paymentLink);
        console.error('   - Type:', typeof paymentLink);
        console.error('   - Longueur:', paymentLink.length);
        return res.status(500).json({ 
          error: 'Lien de paiement invalide reçu de l\'API',
          details: process.env.NODE_ENV === 'development' ? { receivedLink: paymentLink, fullResponse: data } : undefined
        });
      }
    }
    
    // Vérification finale
    if (!paymentLink.startsWith('http://') && !paymentLink.startsWith('https://')) {
      console.error('❌ Lien de paiement toujours invalide après normalisation:', paymentLink);
      return res.status(500).json({ 
        error: 'Lien de paiement invalide reçu de l\'API',
        details: process.env.NODE_ENV === 'development' ? { receivedLink: paymentLink } : undefined
      });
    }

    console.log('✅ Paiement initialisé avec succès');
    console.log('   - Link:', paymentLink);
    console.log('💳 ========== FIN INITIALISATION ==========');

    // Retourner le link avec succès
    res.json({ 
      success: true,
      link: paymentLink 
    });
  } catch (error) {
    console.error('❌ Erreur initialisation paiement:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'initialisation du paiement',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/payment/verify/:order_id
 * Vérifie le statut d'un paiement via l'API Lygos
 */
router.get('/verify/:order_id', async (req, res) => {
  try {
    const { order_id } = req.params;

    if (!order_id) {
      return res.status(400).json({ 
        error: 'order_id est requis' 
      });
    }

    if (!LYGOS_API_KEY) {
      console.error('❌ LYGOS_API_KEY non définie dans .env');
      return res.status(500).json({ 
        error: 'Configuration du paiement manquante' 
      });
    }

    console.log('🔍 ========== VÉRIFICATION PAIEMENT LYGOS ==========');
    console.log('   - Order ID:', order_id);
    console.log('   - Base URL:', LYGOS_BASE_URL);

    // Appeler l'API Lygos pour récupérer les transactions
    const response = await fetch(`${LYGOS_BASE_URL}/gateway`, {
      method: 'GET',
      headers: {
        'api-key': LYGOS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erreur API Lygos:', data);
      return res.status(response.status).json({ 
        error: data.message || 'Erreur lors de la vérification du paiement' 
      });
    }

    // Parcourir la liste des transactions pour trouver celle avec order_id
    const transactions = data.transactions || data.data || [];
    
    console.log('   - Nombre de transactions:', transactions.length);

    const transaction = transactions.find(t => t.order_id === order_id);

    if (!transaction) {
      console.log('⚠️ Transaction non trouvée pour order_id:', order_id);
      return res.json({ paid: false, message: 'Transaction non trouvée' });
    }

    console.log('✅ Transaction trouvée');
    console.log('   - Status:', transaction.status);
    console.log('   - Amount:', transaction.amount);
    console.log('   - Order ID:', transaction.order_id);

    // Vérifier que le statut est SUCCESS
    const isPaid = transaction.status === 'SUCCESS' || transaction.status === 'success';

    console.log('   - Paiement validé:', isPaid);
    console.log('🔍 ========== FIN VÉRIFICATION ==========');

    res.json({ 
      paid: isPaid,
      transaction: {
        order_id: transaction.order_id,
        amount: transaction.amount,
        status: transaction.status,
        created_at: transaction.created_at
      }
    });
  } catch (error) {
    console.error('❌ Erreur vérification paiement:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la vérification du paiement',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/payment/activate
 * Active automatiquement l'utilisateur après vérification du paiement
 */
router.post('/activate', async (req, res) => {
  try {
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({ 
        error: 'order_id est requis' 
      });
    }

    console.log('🔄 ========== ACTIVATION AUTOMATIQUE ==========');
    console.log('   - Order ID:', order_id);

    // Extraire l'ID utilisateur de l'order_id (format: PAY-{userId}-{timestamp})
    const orderIdMatch = order_id.match(/^PAY-(.+?)-(\d+)$/);
    if (!orderIdMatch) {
      console.error('❌ Format order_id invalide:', order_id);
      return res.status(400).json({ 
        error: 'Format order_id invalide' 
      });
    }

    const userId = orderIdMatch[1];
    console.log('   - User ID extrait:', userId);

    // Vérifier d'abord le paiement
    if (!LYGOS_API_KEY) {
      console.error('❌ LYGOS_API_KEY non définie dans .env');
      return res.status(500).json({ 
        error: 'Configuration du paiement manquante' 
      });
    }

    const verifyResponse = await fetch(`${LYGOS_BASE_URL}/gateway`, {
      method: 'GET',
      headers: {
        'api-key': LYGOS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const verifyData = await verifyResponse.json();

    if (!verifyResponse.ok) {
      console.error('❌ Erreur vérification paiement:', verifyData);
      return res.status(verifyResponse.status).json({ 
        error: verifyData.message || 'Erreur lors de la vérification du paiement' 
      });
    }

    const transactions = verifyData.transactions || verifyData.data || [];
    const transaction = transactions.find(t => t.order_id === order_id);

    if (!transaction) {
      console.log('⚠️ Transaction non trouvée pour order_id:', order_id);
      return res.status(404).json({ 
        error: 'Transaction non trouvée' 
      });
    }

    const isPaid = transaction.status === 'SUCCESS' || transaction.status === 'success';

    if (!isPaid) {
      console.log('⚠️ Paiement non confirmé pour order_id:', order_id);
      return res.status(400).json({ 
        error: 'Le paiement n\'a pas été confirmé' 
      });
    }

    console.log('✅ Paiement confirmé, activation de l\'utilisateur...');

    // Trouver et activer l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      console.error('❌ Utilisateur non trouvé:', userId);
      return res.status(404).json({ 
        error: 'Utilisateur non trouvé' 
      });
    }

    // Activer l'utilisateur
    user.status = 'active';
    await user.save();

    console.log('✅ Utilisateur activé avec succès');
    console.log('   - User ID:', user._id);
    console.log('   - Email:', user.email);
    console.log('   - Nouveau statut:', user.status);
    console.log('🔄 ========== FIN ACTIVATION ==========');

    res.json({
      success: true,
      message: 'Compte activé avec succès',
      user: {
        id: user._id,
        email: user.email,
        status: user.status
      },
      transaction: {
        order_id: transaction.order_id,
        amount: transaction.amount,
        status: transaction.status
      }
    });
  } catch (error) {
    console.error('❌ Erreur activation automatique:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'activation automatique',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;

