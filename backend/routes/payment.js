import express from 'express';
import fetch from 'node-fetch';
import User from '../models/User.js';

const router = express.Router();

const LYGOS_API_KEY = process.env.LYGOS_API_KEY;
const LYGOS_BASE_URL = process.env.LYGOS_BASE_URL || 'https://api.lygosapp.com/v1';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.safitech.shop';

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

    if (!LYGOS_API_KEY) {
      console.error('❌ LYGOS_API_KEY non définie dans .env');
      return res.status(500).json({ 
        error: 'Configuration du paiement manquante' 
      });
    }

    console.log('💳 ========== INITIALISATION PAIEMENT LYGOS ==========');
    console.log('   - Amount:', amount);
    console.log('   - Order ID:', order_id);
    console.log('   - Phone:', phone || 'Non fourni');
    console.log('   - Provider:', provider || 'Non fourni');
    console.log('   - Base URL:', LYGOS_BASE_URL);

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
    const response = await fetch(`${LYGOS_BASE_URL}/gateway`, {
      method: 'POST',
      headers: {
        'api-key': LYGOS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(lygosBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erreur API Lygos:', data);
      return res.status(response.status).json({ 
        error: data.message || 'Erreur lors de l\'initialisation du paiement' 
      });
    }

    if (!data.link) {
      console.error('❌ Pas de link dans la réponse Lygos:', data);
      return res.status(500).json({ 
        error: 'Réponse invalide de l\'API de paiement' 
      });
    }

    console.log('✅ Paiement initialisé avec succès');
    console.log('   - Link:', data.link);
    console.log('💳 ========== FIN INITIALISATION ==========');

    // Retourner uniquement le link
    res.json({ link: data.link });
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

