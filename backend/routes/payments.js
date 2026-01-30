import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { initiatePayment, checkPaymentStatus, mapMonetbilStatus } from '../services/monetbilService.js';
import Ebook from '../models/Ebook.js';
import PaymentTransaction from '../models/PaymentTransaction.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Initier un paiement pour un ebook
router.post('/initiate', authenticate, async (req, res) => {
  try {
    const { ebookId, phoneNumber, operator } = req.body;

    if (!ebookId || !phoneNumber) {
      return res.status(400).json({ error: 'ebookId et phoneNumber requis' });
    }

    // Vérifier si l'ebook existe
    const ebook = await Ebook.findById(ebookId);
    if (!ebook || !ebook.isActive) {
      return res.status(404).json({ error: 'Ebook non trouvé ou non disponible' });
    }

    // Vérifier si l'utilisateur a déjà acheté cet ebook
    const existingPurchase = await PaymentTransaction.findOne({
      userId: req.user._id,
      ebookId: ebook._id,
      status: 'success'
    });

    if (existingPurchase) {
      return res.status(400).json({ error: 'Vous avez déjà acheté cet ebook' });
    }

    // Générer des références uniques
    const itemRef = `ebook_${ebook._id}`;
    const paymentRef = `payment_${uuidv4()}`;

    // Préparer les données pour Monetbil
    const monetbilParams = {
      phoneNumber: phoneNumber.trim(),
      amount: ebook.price,
      currency: ebook.currency || 'XAF',
      operator: operator || null,
      itemRef: itemRef,
      paymentRef: paymentRef,
      user: req.user._id.toString(),
      firstName: req.user.name?.split(' ')[0] || null,
      lastName: req.user.name?.split(' ').slice(1).join(' ') || null,
      email: req.user.email || null,
      country: 'CM',
      notifyUrl: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/payments/webhook`
    };

    // Initier le paiement via Monetbil
    const monetbilResponse = await initiatePayment(monetbilParams);

    // Créer la transaction en base de données
    const transaction = new PaymentTransaction({
      userId: req.user._id,
      ebookId: ebook._id,
      paymentId: monetbilResponse.paymentId,
      amount: ebook.price,
      currency: ebook.currency || 'XAF',
      phoneNumber: phoneNumber.trim(),
      operator: monetbilResponse.channel || operator || null,
      status: 'pending',
      monetbilResponse: monetbilResponse,
      itemRef: itemRef,
      paymentRef: paymentRef
    });

    await transaction.save();

    res.json({
      success: true,
      paymentId: monetbilResponse.paymentId,
      channel: monetbilResponse.channel,
      channelName: monetbilResponse.channel_name,
      channelUssd: monetbilResponse.channel_ussd,
      paymentUrl: monetbilResponse.payment_url || null,
      message: monetbilResponse.message,
      transactionId: transaction._id
    });
  } catch (error) {
    console.error('Erreur initiation paiement:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'initiation du paiement',
      details: error.message 
    });
  }
});

// Vérifier le statut d'un paiement
router.post('/check', authenticate, async (req, res) => {
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: 'paymentId requis' });
    }

    // Récupérer la transaction
    const transaction = await PaymentTransaction.findOne({ paymentId });
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction non trouvée' });
    }

    // Vérifier que la transaction appartient à l'utilisateur
    if (transaction.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Vérifier le statut via Monetbil
    const monetbilResponse = await checkPaymentStatus(paymentId);

    // Mettre à jour la transaction
    transaction.monetbilResponse = monetbilResponse;
    
    if (monetbilResponse.transaction) {
      const monetbilStatus = monetbilResponse.transaction.status;
      transaction.monetbilStatus = monetbilStatus;
      transaction.status = mapMonetbilStatus(monetbilStatus);
      transaction.transactionData = monetbilResponse.transaction;
      
      if (transaction.status === 'success') {
        transaction.completedAt = new Date();
        // Incrémenter le compteur d'achats de l'ebook
        await Ebook.findByIdAndUpdate(transaction.ebookId, {
          $inc: { purchaseCount: 1 }
        });
      }
    }

    await transaction.save();

    res.json({
      success: true,
      status: transaction.status,
      message: monetbilResponse.message,
      transaction: monetbilResponse.transaction || null
    });
  } catch (error) {
    console.error('Erreur vérification paiement:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la vérification du paiement',
      details: error.message 
    });
  }
});

// Webhook pour les notifications Monetbil
router.post('/webhook', async (req, res) => {
  try {
    const { paymentId, transaction } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: 'paymentId requis' });
    }

    // Récupérer la transaction
    const paymentTransaction = await PaymentTransaction.findOne({ paymentId });
    if (!paymentTransaction) {
      console.error('Transaction non trouvée pour paymentId:', paymentId);
      return res.status(404).json({ error: 'Transaction non trouvée' });
    }

    // Si la transaction est déjà complétée, ne rien faire
    if (paymentTransaction.status === 'success') {
      return res.json({ success: true, message: 'Transaction déjà complétée' });
    }

    // Mettre à jour la transaction
    if (transaction) {
      const monetbilStatus = transaction.status;
      paymentTransaction.monetbilStatus = monetbilStatus;
      paymentTransaction.status = mapMonetbilStatus(monetbilStatus);
      paymentTransaction.transactionData = transaction;
      
      if (paymentTransaction.status === 'success') {
        paymentTransaction.completedAt = new Date();
        // Incrémenter le compteur d'achats de l'ebook
        await Ebook.findByIdAndUpdate(paymentTransaction.ebookId, {
          $inc: { purchaseCount: 1 }
        });
      }
    }

    await paymentTransaction.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur webhook paiement:', error);
    res.status(500).json({ error: 'Erreur lors du traitement du webhook' });
  }
});

// Récupérer l'historique des paiements de l'utilisateur
router.get('/history', authenticate, async (req, res) => {
  try {
    const transactions = await PaymentTransaction.find({ userId: req.user._id })
      .populate('ebookId', 'title coverImage')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, transactions });
  } catch (error) {
    console.error('Erreur récupération historique:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

export default router;
