import express from 'express';
import fetch from 'node-fetch';
import User from '../models/User.js';

const router = express.Router();

const MONEYFUSION_URL = 'https://www.pay.moneyfusion.net/scalor/597e2cf962834532/pay/';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.safitech.shop';

/**
 * POST /api/payment/init
 * Initialise un paiement via MoneyFusion
 */
router.post('/init', async (req, res) => {
  try {
    const { amount, order_id, subscription_type } = req.body;

    if (!amount || !order_id) {
      return res.status(400).json({ error: 'Les champs amount et order_id sont requis' });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Le montant doit être un nombre positif' });
    }

    const successUrl = `${FRONTEND_URL}/payment-success?order_id=${encodeURIComponent(order_id)}`;
    const failureUrl = `${FRONTEND_URL}/payment-failed?order_id=${encodeURIComponent(order_id)}`;

    const body = {
      totalPrice: amount,
      articleName: subscription_type === 'lifetime' ? 'Accès à vie' : 'Abonnement mensuel',
      orderId: order_id,
      successUrl,
      failUrl: failureUrl,
    };

    console.log('💳 Initialisation paiement MoneyFusion:', body);

    const response = await fetch(MONEYFUSION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    let data;
    try {
      data = await response.json();
    } catch {
      const text = await response.text();
      console.error('❌ Réponse MoneyFusion non-JSON:', text);
      return res.status(500).json({ error: 'Réponse invalide de MoneyFusion' });
    }

    console.log('📥 Réponse MoneyFusion:', JSON.stringify(data));

    if (!response.ok || !data.token) {
      console.error('❌ Erreur MoneyFusion:', data);
      return res.status(500).json({ error: data.message || 'Erreur lors de l\'initialisation du paiement' });
    }

    const paymentLink = `https://www.pay.moneyfusion.net/pay/${data.token}`;
    console.log('✅ Lien de paiement:', paymentLink);

    res.json({ success: true, link: paymentLink });
  } catch (error) {
    console.error('❌ Erreur init paiement:', error);
    res.status(500).json({ error: 'Erreur lors de l\'initialisation du paiement' });
  }
});

/**
 * GET /api/payment/verify/:order_id
 * Vérifie le statut d'un paiement MoneyFusion
 */
router.get('/verify/:order_id', async (req, res) => {
  try {
    const { order_id } = req.params;

    if (!order_id) {
      return res.status(400).json({ error: 'order_id est requis' });
    }

    const response = await fetch(`https://www.pay.moneyfusion.net/paiement_status/${encodeURIComponent(order_id)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();
    console.log('🔍 Statut MoneyFusion pour', order_id, ':', data);

    const isPaid = data.statut === 'paid' || data.status === 'paid' || data.statut === 'SUCCESS' || data.status === 'SUCCESS';

    res.json({
      paid: isPaid,
      transaction: data,
    });
  } catch (error) {
    console.error('❌ Erreur vérification paiement:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification du paiement' });
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
      return res.status(400).json({ error: 'order_id est requis' });
    }

    console.log('🔄 Activation automatique pour order_id:', order_id);

    let userId, isSubscription = false, detectedSubscriptionType = null;

    const payMatch = order_id.match(/^PAY-(.+?)-(\d+)$/);
    const subMatch = order_id.match(/^SUB-(.+?)-(monthly|lifetime)-(\d+)$/);

    if (subMatch) {
      userId = subMatch[1];
      detectedSubscriptionType = subMatch[2];
      isSubscription = true;
    } else if (payMatch) {
      userId = payMatch[1];
    } else {
      return res.status(400).json({ error: 'Format order_id invalide' });
    }

    // Vérifier le paiement via MoneyFusion
    const verifyResponse = await fetch(`https://www.pay.moneyfusion.net/paiement_status/${encodeURIComponent(order_id)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const verifyData = await verifyResponse.json();
    const isPaid = verifyData.statut === 'paid' || verifyData.status === 'paid' || verifyData.statut === 'SUCCESS' || verifyData.status === 'SUCCESS';

    if (!isPaid) {
      return res.status(400).json({ error: 'Le paiement n\'a pas été confirmé' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    if (isSubscription && detectedSubscriptionType) {
      const now = new Date();
      let expiryDate = new Date();

      if (detectedSubscriptionType === 'monthly') {
        expiryDate.setMonth(now.getMonth() + 1);
      } else if (detectedSubscriptionType === 'lifetime') {
        expiryDate.setFullYear(now.getFullYear() + 100);
      }

      user.subscriptionType = detectedSubscriptionType;
      user.subscriptionExpiry = expiryDate;
    }

    user.status = 'active';
    await user.save();

    console.log('✅ Utilisateur activé:', user._id, user.email);

    res.json({
      success: true,
      message: 'Compte activé avec succès',
      user: { id: user._id, email: user.email, status: user.status },
    });
  } catch (error) {
    console.error('❌ Erreur activation:', error);
    res.status(500).json({ error: 'Erreur lors de l\'activation automatique' });
  }
});

export default router;
