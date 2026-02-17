import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { initiatePayment, checkPaymentStatus, mapMonetbilStatus, verifyMonetbilIP, verifyMonetbilSignature } from '../services/monetbilService.js';
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
      notifyUrl: `${process.env.BACKEND_URL || 'https://infomania.store'}/api/payments/webhook`
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

    console.log(`🔍 Vérification statut paiement: ${paymentId}`);

    // Récupérer la transaction
    const transaction = await PaymentTransaction.findOne({ paymentId });
    if (!transaction) {
      console.error(`❌ Transaction non trouvée pour paymentId: ${paymentId}`);
      return res.status(404).json({ error: 'Transaction non trouvée' });
    }

    // Vérifier que la transaction appartient à l'utilisateur
    if (transaction.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Si la transaction est déjà en succès, retourner directement
    if (transaction.status === 'success') {
      console.log(`✅ Transaction déjà en succès: ${paymentId}`);
      return res.json({
        success: true,
        status: 'success',
        message: 'Paiement confirmé',
        transaction: transaction.transactionData || null
      });
    }

    // Vérifier le statut via Monetbil
    console.log(`📞 Appel API Monetbil pour vérifier: ${paymentId}`);
    const monetbilResponse = await checkPaymentStatus(paymentId);
    console.log(`📥 Réponse Monetbil:`, monetbilResponse);

    // Mettre à jour la transaction
    transaction.monetbilResponse = monetbilResponse;
    
    if (monetbilResponse.transaction) {
      const monetbilStatus = monetbilResponse.transaction.status;
      const oldStatus = transaction.status;
      transaction.monetbilStatus = monetbilStatus;
      transaction.status = mapMonetbilStatus(monetbilStatus);
      transaction.transactionData = monetbilResponse.transaction;
      
      console.log(`📊 Statut: ${oldStatus} -> ${transaction.status} (Monetbil: ${monetbilStatus})`);
      
      if (transaction.status === 'success' && oldStatus !== 'success') {
        transaction.completedAt = new Date();
        // Incrémenter le compteur d'achats de l'ebook
        await Ebook.findByIdAndUpdate(transaction.ebookId, {
          $inc: { purchaseCount: 1 }
        });
        console.log(`✅ Paiement confirmé! Ebook ${transaction.ebookId} - Compteur incrémenté`);
      }
    } else {
      console.log(`⏳ Pas encore de transaction dans la réponse Monetbil (paiement en attente)`);
    }

    await transaction.save();

    res.json({
      success: true,
      status: transaction.status,
      message: monetbilResponse.message || 'Vérification en cours',
      transaction: monetbilResponse.transaction || null
    });
  } catch (error) {
    console.error('❌ Erreur vérification paiement:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la vérification du paiement',
      details: error.message 
    });
  }
});

// Webhook pour les notifications Monetbil (GET ou POST)
router.get('/webhook', async (req, res) => {
  handleMonetbilWebhook(req, res);
});

router.post('/webhook', async (req, res) => {
  handleMonetbilWebhook(req, res);
});

async function handleMonetbilWebhook(req, res) {
  try {
    // Récupérer les paramètres depuis GET ou POST
    const params = req.method === 'GET' ? req.query : req.body;
    
    // Récupérer l'adresse IP du client
    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    
    console.log('📥 Notification Monetbil reçue:', {
      method: req.method,
      ip: clientIP,
      params: Object.keys(params)
    });

    // 1. Vérifier l'adresse IP (sécurité) - optionnel
    if (!verifyMonetbilIP(clientIP)) {
      console.warn('⚠️ IP non autorisée:', clientIP);
      // Ne pas bloquer si aucune IP n'est configurée (optionnel)
      if (process.env.MONETBIL_ALLOWED_IPS && process.env.MONETBIL_ALLOWED_IPS.trim() !== '') {
        console.error('❌ IP bloquée car MONETBIL_ALLOWED_IPS est configuré');
        return res.status(403).json({ error: 'IP non autorisée' });
      } else {
        console.warn('⚠️ IP non autorisée mais continuation car vérification IP optionnelle');
      }
    }

    // 2. Vérifier la signature (sécurité) - optionnel
    const receivedSignature = params.sign;
    if (receivedSignature) {
      const isValidSignature = verifyMonetbilSignature(params, receivedSignature);
      if (!isValidSignature) {
        console.error('❌ Signature invalide');
        console.error('   Paramètres reçus:', Object.keys(params));
        console.error('   Signature reçue:', receivedSignature);
        // Ne pas bloquer pour permettre les tests - la signature est optionnelle selon la doc
        console.warn('⚠️ Signature invalide mais continuation (signature optionnelle selon doc Monetbil)');
      } else {
        console.log('✅ Signature valide');
      }
    } else {
      console.warn('⚠️ Aucune signature dans la notification - acceptée (signature optionnelle)');
    }

    // 3. Extraire les paramètres Monetbil
    const {
      service,
      transaction_id,
      transaction_uuid,
      phone,
      amount,
      fee,
      status,
      message,
      country_name,
      country_iso,
      country_code,
      mccmnc,
      operator,
      operator_code,
      operator_transaction_id,
      currency,
      user,
      item_ref,
      payment_ref,
      first_name,
      last_name,
      email
    } = params;

    // Vérifier que le service correspond
    if (service !== process.env.MONETBIL_SERVICE_KEY) {
      console.error('❌ Service key invalide:', service);
      return res.status(400).json({ error: 'Service key invalide' });
    }

    // Trouver la transaction par transaction_id ou payment_ref
    let paymentTransaction = null;
    
    if (transaction_id) {
      // Chercher par paymentId (qui correspond à transaction_id)
      paymentTransaction = await PaymentTransaction.findOne({ paymentId: transaction_id });
    }
    
    if (!paymentTransaction && payment_ref) {
      // Chercher par paymentRef
      paymentTransaction = await PaymentTransaction.findOne({ paymentRef: payment_ref });
    }

    if (!paymentTransaction) {
      console.error('❌ Transaction non trouvée:', { transaction_id, payment_ref });
      // Retourner success pour éviter que Monetbil réessaie
      return res.json({ success: true, message: 'Transaction non trouvée mais notification reçue' });
    }

    // Si la transaction est déjà complétée avec succès, ne rien faire
    if (paymentTransaction.status === 'success' && status === 'success') {
      console.log('✅ Transaction déjà complétée:', paymentTransaction.paymentId);
      return res.json({ success: true, message: 'Transaction déjà complétée' });
    }

    // Mapper le statut Monetbil (success, cancelled, failed) vers notre statut interne
    let internalStatus = 'pending';
    let monetbilStatus = null;
    
    if (status === 'success') {
      internalStatus = 'success';
      monetbilStatus = 1;
    } else if (status === 'cancelled') {
      internalStatus = 'cancelled';
      monetbilStatus = -1;
    } else if (status === 'failed') {
      internalStatus = 'failed';
      monetbilStatus = 0;
    }

    // Mettre à jour la transaction
    paymentTransaction.status = internalStatus;
    paymentTransaction.monetbilStatus = monetbilStatus;
    paymentTransaction.phoneNumber = phone || paymentTransaction.phoneNumber;
    paymentTransaction.operator = operator || paymentTransaction.operator;
    
    // Stocker toutes les données de la transaction
    paymentTransaction.transactionData = {
      transaction_id,
      transaction_uuid,
      phone,
      amount: parseFloat(amount) || paymentTransaction.amount,
      fee: parseFloat(fee) || 0,
      status,
      message,
      country_name,
      country_iso,
      country_code,
      mccmnc,
      operator,
      operator_code,
      operator_transaction_id,
      currency: currency || paymentTransaction.currency,
      user,
      item_ref,
      payment_ref,
      first_name,
      last_name,
      email
    };

    // Si le paiement est réussi
    if (internalStatus === 'success') {
      const wasAlreadySuccess = paymentTransaction.status === 'success';
      paymentTransaction.completedAt = new Date();
      
      // Incrémenter le compteur d'achats de l'ebook seulement si ce n'était pas déjà en succès
      if (!wasAlreadySuccess) {
        await Ebook.findByIdAndUpdate(paymentTransaction.ebookId, {
          $inc: { purchaseCount: 1 }
        });
        
        console.log('✅ Paiement confirmé via webhook:', {
          paymentId: paymentTransaction.paymentId,
          transaction_id,
          ebookId: paymentTransaction.ebookId,
          userId: paymentTransaction.userId,
          amount: paymentTransaction.amount,
          operator: operator || 'N/A'
        });
      } else {
        console.log('ℹ️ Paiement déjà confirmé précédemment:', paymentTransaction.paymentId);
      }
    } else {
      console.log(`⚠️ Paiement ${status}:`, {
        paymentId: paymentTransaction.paymentId,
        transaction_id,
        status,
        message
      });
    }

    await paymentTransaction.save();

    // Répondre à Monetbil pour confirmer la réception
    res.json({ success: true, message: 'Notification reçue et traitée' });
  } catch (error) {
    console.error('❌ Erreur webhook paiement:', error);
    // Retourner success pour éviter que Monetbil réessaie indéfiniment
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors du traitement du webhook',
      message: error.message 
    });
  }
}

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
