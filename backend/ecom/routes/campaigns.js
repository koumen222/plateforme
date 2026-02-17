import express from 'express';
import Campaign from '../models/Campaign.js';
import Client from '../models/Client.js';
import Order from '../models/Order.js';
import { requireEcomAuth, validateEcomAccess } from '../middleware/ecomAuth.js';
// 🆕 Import des fonctions anti-spam WhatsApp
import { 
  analyzeSpamRisk, 
  validateMessageBeforeSend, 
  sendWhatsAppMessage,
  getHumanDelayWithVariation,
  simulateHumanBehavior
} from '../../services/whatsappService.js';

const router = express.Router();

// Helper: remplacer les variables dans le template (priorité aux données de commande)
function renderMessage(template, client, orderData = null) {
  // Utiliser les données de commande si disponibles, sinon utiliser les données client
  const orderInfo = orderData || client;
  
  let msg = template
    .replace(/\{firstName\}/g, client.firstName || orderInfo.clientName?.split(' ')[0] || '')
    .replace(/\{lastName\}/g, client.lastName || orderInfo.clientName?.split(' ').slice(1).join(' ') || '')
    .replace(/\{fullName\}/g, client.firstName && client.lastName ? [client.firstName, client.lastName].join(' ') : (orderInfo.clientName || ''))
    .replace(/\{phone\}/g, client.phone || orderInfo.clientPhone || '')
    .replace(/\{city\}/g, client.city || orderInfo.city || '')
    .replace(/\{product\}/g, (client.products || []).join(', ') || orderInfo.product || '')
    .replace(/\{totalOrders\}/g, String(client.totalOrders || 1))
    .replace(/\{totalSpent\}/g, String(client.totalSpent || (orderInfo.price || 0) * (orderInfo.quantity || 1)))
    .replace(/\{status\}/g, client._orderStatus || orderInfo.status || '')
    .replace(/\{price\}/g, client._orderPrice ? String(client._orderPrice) : String(orderInfo.price || 0))
    .replace(/\{quantity\}/g, client._orderQuantity ? String(client._orderQuantity) : String(orderInfo.quantity || 1))
    .replace(/\{orderDate\}/g, client._orderDate ? new Date(client._orderDate).toLocaleDateString('fr-FR') : (orderInfo.date ? new Date(orderInfo.date).toLocaleDateString('fr-FR') : ''))
    .replace(/\{address\}/g, client.address || orderInfo.address || '')
    .replace(/\{lastContact\}/g, client.lastContactAt ? new Date(client.lastContactAt).toLocaleDateString('fr-FR') : (orderInfo.date ? new Date(orderInfo.date).toLocaleDateString('fr-FR') : ''));
  return msg;
}

// Helper: construire le filtre MongoDB depuis les targetFilters
function buildClientFilter(workspaceId, targetFilters) {
  const filter = { workspaceId };
  if (targetFilters.clientStatus) filter.status = targetFilters.clientStatus;
  if (targetFilters.city) filter.city = { $regex: targetFilters.city, $options: 'i' };
  if (targetFilters.product) filter.products = { $regex: targetFilters.product, $options: 'i' };
  if (targetFilters.tag) filter.tags = targetFilters.tag;
  if (targetFilters.minOrders > 0) filter.totalOrders = { ...filter.totalOrders, $gte: targetFilters.minOrders };
  if (targetFilters.maxOrders > 0) filter.totalOrders = { ...filter.totalOrders, $lte: targetFilters.maxOrders };
  if (targetFilters.lastContactBefore) filter.lastContactAt = { $lt: new Date(targetFilters.lastContactBefore) };
  return filter;
}

// Helper: ciblage basé sur les commandes — retourne les phones des clients correspondants
async function getClientsFromOrderFilters(workspaceId, targetFilters) {
  const orderFilter = { workspaceId };
  if (targetFilters.orderStatus) orderFilter.status = targetFilters.orderStatus;
  if (targetFilters.orderCity) orderFilter.city = { $regex: targetFilters.orderCity, $options: 'i' };
  if (targetFilters.orderAddress) orderFilter.address = { $regex: targetFilters.orderAddress, $options: 'i' };
  if (targetFilters.orderProduct) orderFilter.product = { $regex: targetFilters.orderProduct, $options: 'i' };
  if (targetFilters.orderDateFrom) orderFilter.date = { ...orderFilter.date, $gte: new Date(targetFilters.orderDateFrom) };
  if (targetFilters.orderDateTo) {
    const end = new Date(targetFilters.orderDateTo);
    end.setHours(23, 59, 59, 999);
    orderFilter.date = { ...orderFilter.date, $lte: end };
  }
  if (targetFilters.orderSourceId) {
    if (targetFilters.orderSourceId === 'legacy') {
      orderFilter.sheetRowId = { $not: /^source_/ };
    } else {
      orderFilter.sheetRowId = { $regex: `^source_${targetFilters.orderSourceId}_` };
    }
  }
  if (targetFilters.orderMinPrice > 0) orderFilter.price = { ...orderFilter.price, $gte: targetFilters.orderMinPrice };
  if (targetFilters.orderMaxPrice > 0) orderFilter.price = { ...orderFilter.price, $lte: targetFilters.orderMaxPrice };

  const orders = await Order.find(orderFilter).select('clientName clientPhone city address product price date status quantity').lean();

  // Group by phone, keep most recent order data
  const clientMap = new Map();
  for (const o of orders) {
    const phone = (o.clientPhone || '').trim();
    if (!phone) continue;
    const existing = clientMap.get(phone);
    if (!existing || new Date(o.date) > new Date(existing.date)) {
      clientMap.set(phone, o);
    }
  }
  return clientMap; // Map<phone, orderData>
}

// GET /api/ecom/campaigns - Liste des campagnes
router.get('/', requireEcomAuth, async (req, res) => {
  try {
    const { status, type, page = 1, limit = 50 } = req.query;
    const filter = { workspaceId: req.workspaceId };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const campaigns = await Campaign.find(filter)
      .populate('createdBy', 'email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-results');

    const total = await Campaign.countDocuments(filter);

    const allCampaigns = await Campaign.find({ workspaceId: req.workspaceId }).select('status');
    const stats = {
      total: allCampaigns.length,
      draft: allCampaigns.filter(c => c.status === 'draft').length,
      scheduled: allCampaigns.filter(c => c.status === 'scheduled').length,
      sent: allCampaigns.filter(c => c.status === 'sent').length,
      sending: allCampaigns.filter(c => c.status === 'sending').length
    };

    res.json({
      success: true,
      data: {
        campaigns,
        stats,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    console.error('Erreur get campaigns:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/ecom/campaigns/filter-options - Villes, adresses et produits depuis commandes + clients
router.get('/filter-options', requireEcomAuth, async (req, res) => {
  try {
    const wsFilter = { workspaceId: req.workspaceId };
    
    // Récupérer depuis les commandes
    const [orderCities, orderProducts, orderAddresses] = await Promise.all([
      Order.find({ ...wsFilter, city: { $exists: true, $ne: '' } }).distinct('city'),
      Order.find({ ...wsFilter, product: { $exists: true, $ne: '' } }).distinct('product'),
      Order.find({ ...wsFilter, address: { $exists: true, $ne: '' } }).distinct('address')
    ]);
    
    // Récupérer aussi depuis les clients (données enrichies)
    const [clientCities, clientProducts, clientAddresses] = await Promise.all([
      Client.find({ ...wsFilter, city: { $exists: true, $ne: '' } }).distinct('city'),
      Client.find({ ...wsFilter, products: { $exists: true, $ne: [] } }).distinct('products'),
      Client.find({ ...wsFilter, address: { $exists: true, $ne: '' } }).distinct('address')
    ]);
    
    // Fusionner et dédupliquer
    const cities = [...new Set([...orderCities, ...clientCities])].filter(Boolean).sort();
    const products = [...new Set([...orderProducts, ...clientProducts])].filter(Boolean).sort();
    const addresses = [...new Set([...orderAddresses, ...clientAddresses])].filter(Boolean).sort();
    
    console.log(`📊 Filter options: ${cities.length} villes, ${products.length} produits, ${addresses.length} adresses`);
    res.json({ success: true, data: { cities, products, addresses } });
  } catch (error) {
    console.error('Erreur filter-options:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/ecom/campaigns/templates - Templates prédéfinis
router.get('/templates', requireEcomAuth, async (req, res) => {
  const templates = [
    {
      id: 'relance_pending',
      name: 'Relance en attente',
      type: 'relance_pending',
      message: 'Bonjour {firstName} 👋\n\nVotre commande est toujours en attente. Souhaitez-vous confirmer ?\n\nN\'hésitez pas à nous contacter pour toute question.',
      targetFilters: { orderStatus: 'pending' }
    },
    {
      id: 'relance_unreachable',
      name: 'Relance injoignables',
      type: 'custom',
      message: 'Bonjour {firstName} 👋\n\nNous avons essayé de vous joindre concernant votre commande mais sans succès.\n\nMerci de nous recontacter au plus vite pour finaliser votre commande.',
      targetFilters: { orderStatus: 'unreachable' }
    },
    {
      id: 'relance_called',
      name: 'Relance appelés',
      type: 'custom',
      message: 'Bonjour {firstName} 👋\n\nSuite à notre appel, nous attendons votre confirmation pour votre commande ({product}).\n\nMerci de nous confirmer dès que possible.',
      targetFilters: { orderStatus: 'called' }
    },
    {
      id: 'relance_postponed',
      name: 'Relance reportés',
      type: 'custom',
      message: 'Bonjour {firstName} 👋\n\nVous aviez souhaité reporter votre commande ({product}). Nous revenons vers vous pour savoir si le moment est plus opportun.\n\nÊtes-vous prêt(e) à recevoir votre commande ?',
      targetFilters: { orderStatus: 'postponed' }
    },
    {
      id: 'relance_cancelled',
      name: 'Relance annulés',
      type: 'relance_cancelled',
      message: 'Bonjour {firstName} 👋\n\nVotre commande a été annulée. Nous aimerions comprendre ce qui s\'est passé.\n\nPouvons-nous vous aider ou vous proposer une alternative ?',
      targetFilters: { orderStatus: 'cancelled' }
    },
    {
      id: 'relance_returned',
      name: 'Relance retours',
      type: 'custom',
      message: 'Bonjour {firstName} 👋\n\nNous avons noté le retour de votre commande ({product}). Nous aimerions comprendre la raison.\n\nY a-t-il un problème que nous pouvons résoudre ?',
      targetFilters: { orderStatus: 'returned' }
    },
    {
      id: 'relance_confirmed',
      name: 'Relance confirmés non expédiés',
      type: 'custom',
      message: 'Bonjour {firstName} 😊\n\nVotre commande ({product}) est confirmée et sera bientôt expédiée.\n\nNous vous tiendrons informé(e) de l\'avancement.',
      targetFilters: { orderStatus: 'confirmed' }
    },
    {
      id: 'promo_city',
      name: 'Promo par ville',
      type: 'promo',
      message: 'Bonjour {firstName} 🎉\n\nOffre exclusive pour {city} ! Profitez de nos prix exceptionnels sur {product}.\n\nContactez-nous vite, stock limité !',
      targetFilters: {}
    },
    {
      id: 'promo_product',
      name: 'Promo par produit',
      type: 'promo',
      message: 'Bonjour {firstName} 🎁\n\nVous avez aimé {product} ? Nous avons des nouveautés et offres spéciales sur cette gamme !\n\nContactez-nous pour en profiter.',
      targetFilters: { orderStatus: 'delivered' }
    },
    {
      id: 'followup',
      name: 'Suivi après livraison',
      type: 'followup',
      message: 'Bonjour {firstName} 😊\n\nNous espérons que vous êtes satisfait(e) de votre commande ({product}).\n\nVotre avis compte beaucoup pour nous. N\'hésitez pas à nous faire un retour !',
      targetFilters: { orderStatus: 'delivered' }
    },
    {
      id: 'reorder',
      name: 'Relance réachat',
      type: 'custom',
      message: 'Bonjour {firstName} 👋\n\nCela fait un moment ! Nos produits vous manquent ?\n\nNous avons de nouvelles offres qui pourraient vous intéresser. Contactez-nous !',
      targetFilters: { orderStatus: 'delivered' }
    },
    {
      id: 'relance_shipped',
      name: 'Suivi expédition',
      type: 'followup',
      message: 'Bonjour {firstName} 📦\n\nVotre commande ({product}) a été expédiée ! Elle arrivera bientôt à {city}.\n\nMerci de vous assurer d\'être disponible pour la réception.',
      targetFilters: { orderStatus: 'shipped' }
    }
  ];
  res.json({ success: true, data: templates });
});

// POST /api/ecom/campaigns/preview - Prévisualiser les clients ciblés
router.post('/preview', requireEcomAuth, async (req, res) => {
  try {
    const { targetFilters } = req.body;
    const tf = targetFilters || {};
    console.log('🔍 Campaign preview - targetFilters reçus:', tf);

    // Si un statut de commande est sélectionné, n'afficher que ces personnes
    if (tf.orderStatus) {
      console.log(`📊 Filtre par statut de commande: ${tf.orderStatus}`);
      
      // Utiliser directement les commandes avec ce statut
      const orderFilter = { 
        workspaceId: req.workspaceId, 
        status: tf.orderStatus,
        clientPhone: { $exists: true, $ne: '' }
      };
      
      // Ajouter les autres filtres de commande seulement s'ils sont présents
      if (tf.orderCity) orderFilter.city = { $regex: tf.orderCity, $options: 'i' };
      if (tf.orderProduct) orderFilter.product = { $regex: tf.orderProduct, $options: 'i' };
      if (tf.orderDateFrom) orderFilter.date = { ...orderFilter.date, $gte: new Date(tf.orderDateFrom) };
      if (tf.orderDateTo) {
        const end = new Date(tf.orderDateTo);
        end.setHours(23, 59, 59, 999);
        orderFilter.date = { ...orderFilter.date, $lte: end };
      }
      if (tf.orderSourceId) {
        if (tf.orderSourceId === 'legacy') {
          orderFilter.sheetRowId = { $not: /^source_/ };
        } else {
          orderFilter.sheetRowId = { $regex: `^source_${tf.orderSourceId}_` };
        }
      }
      if (tf.orderMinPrice > 0) orderFilter.price = { ...orderFilter.price, $gte: tf.orderMinPrice };
      if (tf.orderMaxPrice > 0) orderFilter.price = { ...orderFilter.price, $lte: tf.orderMaxPrice };

      const orders = await Order.find(orderFilter)
        .select('clientName clientPhone city address product price date status quantity')
        .limit(500)
        .lean();

      console.log(`📦 Commandes trouvées pour le statut ${tf.orderStatus}: ${orders.length}`);

      // Convertir les commandes en structure pour le marketing
      const clients = orders.map(order => ({
        firstName: order.clientName?.split(' ')[0] || '',
        lastName: order.clientName?.split(' ').slice(1).join(' ') || '',
        phone: order.clientPhone,
        city: order.city || '',
        address: order.address || '',
        products: order.product ? [order.product] : [],
        totalOrders: 1,
        totalSpent: (order.price || 0) * (order.quantity || 1),
        status: order.status || '',
        tags: [],
        lastContactAt: order.date || new Date(),
        _id: order._id,
        _orderStatus: order.status || '',
        _orderPrice: order.price || 0,
        _orderDate: order.date || null,
        _orderProduct: order.product || '',
        _orderQuantity: order.quantity || 1
      }));

      console.log(`✅ Preview: ${clients.length} personnes avec le statut ${tf.orderStatus}`);
      return res.json({ success: true, data: { count: clients.length, clients } });
    }

    // Si aucun statut de commande, utiliser les filtres clients (ancienne méthode)
    const filter = buildClientFilter(req.workspaceId, tf);
    filter.phone = { $exists: true, $ne: '' };
    const clients = await Client.find(filter)
      .select('firstName lastName phone city products totalOrders totalSpent status tags address lastContactAt')
      .limit(500)
      .lean();

    console.log(`✅ Preview: ${clients.length} clients (filtres clients)`);
    res.json({ success: true, data: { count: clients.length, clients } });
  } catch (error) {
    console.error('Erreur preview campaign:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/ecom/campaigns/:id/preview - Prévisualiser les clients ciblés pour une campagne spécifique
router.post('/:id/preview', requireEcomAuth, async (req, res) => {
  try {
    // Récupérer la campagne
    const campaign = await Campaign.findOne({ _id: req.params.id, workspaceId: req.workspaceId });
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campagne non trouvée' });
    }

    // Utiliser les filtres de la campagne
    const filter = buildClientFilter(req.workspaceId, campaign.targetFilters || {});
    // Seulement les clients avec un téléphone
    filter.phone = { $exists: true, $ne: '' };

    const clients = await Client.find(filter).select('firstName lastName phone city products totalOrders totalSpent status tags').limit(500);
    
    res.json({ 
      success: true, 
      data: { 
        count: clients.length, 
        clients,
        messageTemplate: campaign.messageTemplate,
        campaignName: campaign.name
      } 
    });
  } catch (error) {
    console.error('Erreur preview campaign spécifique:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/ecom/campaigns/:id - Détail d'une campagne
router.get('/:id', requireEcomAuth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, workspaceId: req.workspaceId })
      .populate('createdBy', 'email');
    if (!campaign) return res.status(404).json({ success: false, message: 'Campagne non trouvée' });
    res.json({ success: true, data: campaign });
  } catch (error) {
    console.error('Erreur get campaign:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/ecom/campaigns - Créer une campagne
router.post('/', requireEcomAuth, async (req, res) => {
  try {
    const { name, type, messageTemplate, targetFilters, scheduledAt, tags, selectedClientIds } = req.body;
    if (!name || !messageTemplate) {
      return res.status(400).json({ success: false, message: 'Nom et message requis' });
    }

    // 🆕 VALIDATION ANTI-SPAM du message template
    const analysis = analyzeSpamRisk(messageTemplate);
    const isValid = validateMessageBeforeSend(messageTemplate, 'campaign-creation');
    
    if (!isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message rejeté pour risque de spam élevé',
        spamAnalysis: {
          risk: analysis.risk,
          score: analysis.score,
          warnings: analysis.warnings,
          recommendations: analysis.recommendations
        }
      });
    }
    
    // Avertir si risque moyen
    if (analysis.risk === 'MEDIUM') {
      console.warn('⚠️ Campagne marketing à risque moyen:', analysis.warnings);
    }

    // Compter les clients ciblés - utiliser selectedClientIds si présent
    let targetedCount;
    if (selectedClientIds && selectedClientIds.length > 0) {
      targetedCount = selectedClientIds.length;
      console.log(`📋 Campagne avec ${targetedCount} clients sélectionnés manuellement`);
    } else {
      const filter = buildClientFilter(req.workspaceId, targetFilters || {});
      filter.phone = { $exists: true, $ne: '' };
      targetedCount = await Client.countDocuments(filter);
    }

    const campaign = new Campaign({
      workspaceId: req.workspaceId,
      name,
      type: type || 'custom',
      messageTemplate,
      targetFilters: targetFilters || {},
      selectedClientIds: selectedClientIds || [],
      scheduledAt: scheduledAt || null,
      status: scheduledAt ? 'scheduled' : 'draft',
      stats: { targeted: targetedCount },
      tags: tags || [],
      createdBy: req.ecomUser._id,
      // 🆕 Métadonnées anti-spam
      spamValidation: {
        validated: true,
        riskLevel: analysis.risk,
        score: analysis.score,
        validatedAt: new Date(),
        warnings: analysis.warnings
      }
    });

    await campaign.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Campagne créée', 
      data: campaign,
      spamValidation: {
        validated: true,
        riskLevel: analysis.risk,
        score: analysis.score,
        message: analysis.risk === 'HIGH' ? 'Message à risque élevé' : 
                analysis.risk === 'MEDIUM' ? 'Message à risque moyen' : 'Message sécurisé'
      }
    });
  } catch (error) {
    console.error('Erreur create campaign:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/ecom/campaigns/:id - Modifier une campagne
router.put('/:id', requireEcomAuth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, workspaceId: req.workspaceId });
    if (!campaign) return res.status(404).json({ success: false, message: 'Campagne non trouvée' });
    if (campaign.status === 'sending' || campaign.status === 'sent') {
      return res.status(400).json({ success: false, message: 'Impossible de modifier une campagne en cours ou envoyée' });
    }

    const allowedFields = ['name', 'type', 'messageTemplate', 'targetFilters', 'scheduledAt', 'tags', 'status', 'selectedClientIds'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) campaign[field] = req.body[field];
    });

    // Recompter les clients ciblés - priorité aux selectedClientIds
    if (campaign.selectedClientIds && campaign.selectedClientIds.length > 0) {
      campaign.stats.targeted = campaign.selectedClientIds.length;
    } else {
      const filter = buildClientFilter(req.workspaceId, campaign.targetFilters || {});
      filter.phone = { $exists: true, $ne: '' };
      campaign.stats.targeted = await Client.countDocuments(filter);
    }

    await campaign.save();
    res.json({ success: true, message: 'Campagne modifiée', data: campaign });
  } catch (error) {
    console.error('Erreur update campaign:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/ecom/campaigns/:id/send - Envoyer la campagne maintenant
router.post('/:id/send', requireEcomAuth, validateEcomAccess('products', 'write'), async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, workspaceId: req.workspaceId });
    if (!campaign) return res.status(404).json({ success: false, message: 'Campagne non trouvée' });
    if (campaign.status === 'sending' || campaign.status === 'sent') {
      return res.status(400).json({ success: false, message: 'Campagne déjà envoyée ou en cours' });
    }

    // 🆕 Pour les campagnes programmées, annuler la programmation et envoyer maintenant
    if (campaign.status === 'scheduled') {
      campaign.status = 'draft';
      campaign.scheduledAt = null;
      await campaign.save();
      console.log(`🔄 Campagne ${campaign.name}: programmation annulée, envoi manuel initié`);
    }

    const greenApiId = process.env.GREEN_API_ID_INSTANCE;
    const greenApiToken = process.env.GREEN_API_TOKEN_INSTANCE;
    const greenApiUrl = process.env.GREEN_API_URL || 'https://api.green-api.com';
    if (!greenApiId || !greenApiToken) {
      return res.status(500).json({ success: false, message: 'Green API non configuré' });
    }

    // 🆕 VALIDATION ANTI-SPAM du message avant envoi massif
    const analysis = analyzeSpamRisk(campaign.messageTemplate);
    const isValid = validateMessageBeforeSend(campaign.messageTemplate, `campaign-${campaign._id}`);
    
    if (!isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Envoi bloqué - message à risque de spam élevé',
        spamAnalysis: {
          risk: analysis.risk,
          score: analysis.score,
          warnings: analysis.warnings,
          recommendations: analysis.recommendations
        }
      });
    }

    // Récupérer les clients ciblés - utiliser directement les commandes si des filtres de commande sont présents
    let clients;
    const hasOrderFilters = campaign.targetFilters && (
      campaign.targetFilters.orderStatus || 
      campaign.targetFilters.orderCity || 
      campaign.targetFilters.orderAddress || 
      campaign.targetFilters.orderProduct || 
      campaign.targetFilters.orderDateFrom || 
      campaign.targetFilters.orderDateTo || 
      campaign.targetFilters.orderSourceId || 
      campaign.targetFilters.orderMinPrice || 
      campaign.targetFilters.orderMaxPrice
    );

    if (campaign.selectedClientIds && campaign.selectedClientIds.length > 0) {
      // Utiliser les clients sélectionnés manuellement
      clients = await Client.find({
        _id: { $in: campaign.selectedClientIds },
        workspaceId: req.workspaceId,
        phone: { $exists: true, $ne: '' }
      });
      console.log(`📋 Campagne avec ${clients.length} clients sélectionnés manuellement`);
    } else if (hasOrderFilters) {
      // Utiliser directement les commandes
      const orderMap = await getClientsFromOrderFilters(req.workspaceId, campaign.targetFilters);
      console.log(`📦 Campagne basée sur ${orderMap.size} commandes`);

      // Convertir les commandes en structure compatible
      clients = Array.from(orderMap.entries()).map(([phone, orderData]) => ({
        firstName: orderData.clientName?.split(' ')[0] || '',
        lastName: orderData.clientName?.split(' ').slice(1).join(' ') || '',
        phone: phone,
        city: orderData.city || '',
        address: orderData.address || '',
        products: orderData.product ? [orderData.product] : [],
        totalOrders: 1,
        totalSpent: (orderData.price || 0) * (orderData.quantity || 1),
        status: orderData.status || '',
        tags: [],
        lastContactAt: orderData.date || new Date(),
        _id: orderData._id, // ID de la commande pour le suivi
        _orderStatus: orderData.status || '',
        _orderPrice: orderData.price || 0,
        _orderDate: orderData.date || null,
        _orderProduct: orderData.product || '',
        _orderQuantity: orderData.quantity || 1
      }));
    } else {
      // Utiliser les filtres clients (ancienne méthode)
      const filter = buildClientFilter(req.workspaceId, campaign.targetFilters || {});
      filter.phone = { $exists: true, $ne: '' };
      
      // 🆕 DEBUG: Log des filtres utilisés
      console.log('🔍 [DEBUG] Filtres de recherche:', JSON.stringify(filter, null, 2));
      console.log('🔍 [DEBUG] WorkspaceId:', req.workspaceId);
      console.log('🔍 [DEBUG] TargetFilters:', JSON.stringify(campaign.targetFilters, null, 2));
      
      // Vérifier d'abord combien de clients existent au total
      const totalClients = await Client.countDocuments({ workspaceId: req.workspaceId });
      console.log('🔍 [DEBUG] Total clients dans workspace:', totalClients);
      
      // Vérifier combien ont des numéros
      const clientsWithPhone = await Client.countDocuments({ 
        workspaceId: req.workspaceId, 
        phone: { $exists: true, $ne: '' } 
      });
      console.log('🔍 [DEBUG] Clients avec numéro:', clientsWithPhone);
      
      clients = await Client.find(filter);
      console.log('🔍 [DEBUG] Clients trouvés avec filtres:', clients.length);
    }

    campaign.status = 'sending';
    campaign.stats.targeted = clients.length;
    campaign.results = [];
    await campaign.save();

    // 🆕 VÉRIFICATION PRÉVENTIVE: Si aucun client trouvé, annuler et retourner erreur détaillée
    if (clients.length === 0) {
      campaign.status = 'failed';
      campaign.error = 'Aucun client trouvé correspondant aux critères';
      await campaign.save();
      
      return res.status(400).json({
        success: false,
        message: 'Aucun client trouvé correspondant aux critères de ciblage',
        details: {
          totalClientsInWorkspace: await Client.countDocuments({ workspaceId: req.workspaceId }),
          clientsWithPhone: await Client.countDocuments({ 
            workspaceId: req.workspaceId, 
            phone: { $exists: true, $ne: '' } 
          }),
          targetFilters: campaign.targetFilters,
          hasOrderFilters: hasOrderFilters,
          selectedClientIds: campaign.selectedClientIds?.length || 0
        },
        recommendations: [
          'Vérifiez que les clients ont des numéros de téléphone',
          'Vérifiez que les filtres de ciblage ne sont pas trop restrictifs',
          'Importez des clients si la base est vide'
        ]
      });
    }

    console.log(`🚀 Envoi campagne marketing "${campaign.name}" avec système anti-spam`);
    console.log(`   Clients ciblés: ${clients.length}`);
    console.log(`   Risque spam: ${analysis.risk} (score: ${analysis.score})`);

    let sent = 0;
    let failed = 0;
    let messageCount = 0;
    
    // 🆕 Configuration anti-spam pour marketing
    const BATCH_SIZE = 3; // Réduit de 5 à 3 pour plus de sécurité
    const BATCH_PAUSE_MS = 15000; // Augmenté de 10s à 15s
    const MSG_PAUSE_MS = 5000; // Augmenté de 2s à 5s

    for (const client of clients) {
      // Utiliser les données de commande si disponibles
      const orderData = hasOrderFilters ? {
        clientName: `${client.firstName} ${client.lastName}`.trim(),
        clientPhone: client.phone,
        city: client.city,
        address: client.address,
        product: client._orderProduct,
        price: client._orderPrice,
        quantity: client._orderQuantity,
        date: client._orderDate,
        status: client._orderStatus
      } : null;
      
      const message = renderMessage(campaign.messageTemplate, client, orderData);
      const cleanedPhone = (client.phone || '').replace(/\D/g, '');
      
      if (!cleanedPhone || cleanedPhone.length < 8) {
        campaign.results.push({ 
          clientId: client._id, 
          clientName: `${client.firstName} ${client.lastName}`, 
          phone: client.phone, 
          status: 'failed', 
          error: 'Numéro invalide' 
        });
        failed++;
        continue;
      }

      try {
        // 🆕 Validation anti-spam pour chaque message personnalisé
        const personalizedAnalysis = analyzeSpamRisk(message);
        const isPersonalizedValid = validateMessageBeforeSend(message, `client-${client._id}`);
        
        if (!isPersonalizedValid) {
          campaign.results.push({ 
            clientId: client._id, 
            clientName: `${client.firstName} ${client.lastName}`, 
            phone: client.phone, 
            status: 'failed', 
            error: 'Message personnalisé rejeté (spam)',
            spamRisk: personalizedAnalysis.risk,
            spamScore: personalizedAnalysis.score
          });
          failed++;
          continue;
        }

        // 🆕 Envoi avec système anti-spam
        const messageData = {
          to: cleanedPhone,
          message: message,
          campaignId: campaign._id,
          userId: client._id,
          firstName: client.firstName
        };

        const result = await sendWhatsAppMessage(messageData);
        
        if (result.success) {
          campaign.results.push({ 
            clientId: client._id, 
            clientName: `${client.firstName} ${client.lastName}`, 
            phone: client.phone, 
            status: 'sent', 
            sentAt: new Date(),
            messageId: result.messageId,
            spamRisk: personalizedAnalysis.risk
          });
          sent++;
          messageCount++;
          
          // Mettre à jour le dernier contact si c'est un vrai client
          if (!hasOrderFilters) {
            const realClient = await Client.findById(client._id);
            if (realClient) {
              realClient.lastContactAt = new Date();
              if (!realClient.tags.includes('Relancé')) realClient.tags.push('Relancé');
              await realClient.save();
            }
          }
          
          console.log(`✅ Message envoyé à ${client.firstName} ${client.lastName} (${cleanedPhone})`);
        } else {
          campaign.results.push({ 
            clientId: client._id, 
            clientName: `${client.firstName} ${client.lastName}`, 
            phone: client.phone, 
            status: 'failed', 
            error: result.error 
          });
          failed++;
        }
        
      } catch (err) {
        campaign.results.push({ 
          clientId: client._id, 
          clientName: `${client.firstName} ${client.lastName}`, 
          phone: client.phone, 
          status: 'failed', 
          error: err.message 
        });
        failed++;
      }

      // 🆕 Délais anti-spam améliorés
      if (messageCount > 0 && messageCount % BATCH_SIZE === 0) {
        const pauseTime = getHumanDelayWithVariation();
        const pauseSeconds = Math.round(pauseTime / 1000);
        console.log(`⏸️ Campagne ${campaign.name}: pause anti-spam de ${pauseSeconds}s après ${messageCount} messages...`);
        await new Promise(resolve => setTimeout(resolve, pauseTime));
      } else {
        // Délai variable entre chaque message
        const variableDelay = MSG_PAUSE_MS + Math.random() * 2000; // 5-7 secondes
        await new Promise(resolve => setTimeout(resolve, variableDelay));
      }
    }

    campaign.status = failed === clients.length ? 'failed' : 'sent';
    campaign.sentAt = new Date();
    campaign.stats.sent = sent;
    campaign.stats.failed = failed;
    campaign.spamValidation = {
      validated: true,
      riskLevel: analysis.risk,
      score: analysis.score,
      sentAt: new Date()
    };
    await campaign.save();

    const successRate = Math.round((sent / clients.length) * 100);
    console.log(`✅ Campagne marketing terminée: ${sent}/${clients.length} envoyés (${successRate}% succès)`);

    res.json({
      success: true,
      message: `Campagne envoyée avec protection anti-spam: ${sent} envoyés, ${failed} échoués sur ${clients.length} ciblés`,
      data: campaign,
      stats: {
        total: clients.length,
        sent,
        failed,
        successRate,
        spamRisk: analysis.risk,
        spamScore: analysis.score
      }
    });
  } catch (error) {
    console.error('Erreur send campaign:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/ecom/campaigns/:id - Supprimer une campagne
router.delete('/:id', requireEcomAuth, validateEcomAccess('products', 'write'), async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndDelete({ _id: req.params.id, workspaceId: req.workspaceId });
    if (!campaign) return res.status(404).json({ success: false, message: 'Campagne non trouvée' });
    res.json({ success: true, message: 'Campagne supprimée' });
  } catch (error) {
    console.error('Erreur delete campaign:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// 🆕 POST /api/ecom/campaigns/preview-send - Envoyer un aperçu à une seule personne
router.post('/preview-send', requireEcomAuth, validateEcomAccess('products', 'write'), async (req, res) => {
  try {
    const { 
      messageTemplate, 
      clientId, 
      clientData,
      campaignId = 'preview-' + Date.now()
    } = req.body;
    
    // Validation des champs requis
    if (!messageTemplate || !messageTemplate.trim()) {
      return res.status(400).json({ success: false, message: 'Le message template est requis' });
    }
    
    let client = null;
    
    // Si clientId fourni, récupérer le client depuis la base
    if (clientId) {
      client = await Client.findOne({ _id: clientId, workspaceId: req.workspaceId });
      if (!client) {
        return res.status(404).json({ success: false, message: 'Client non trouvé' });
      }
    } 
    // Sinon, utiliser les données fournies
    else if (clientData) {
      client = clientData;
    } else {
      return res.status(400).json({ success: false, message: 'clientId ou clientData requis' });
    }
    
    // Personnaliser le message
    const personalizedMessage = renderMessage(messageTemplate, client);
    
    // 🆕 VALIDATION ANTI-SPAM du message personnalisé
    const analysis = analyzeSpamRisk(personalizedMessage);
    const isValid = validateMessageBeforeSend(personalizedMessage, `preview-${client._id || 'manual'}`);
    
    if (!isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message rejeté pour risque de spam élevé',
        analysis: {
          risk: analysis.risk,
          score: analysis.score,
          warnings: analysis.warnings,
          recommendations: analysis.recommendations
        }
      });
    }
    
    // Nettoyer et valider le numéro
    const cleanedPhone = (client.phone || '').replace(/\D/g, '').trim();
    if (!cleanedPhone || cleanedPhone.length < 8) {
      return res.status(400).json({ success: false, message: 'Numéro de téléphone invalide' });
    }
    
    console.log(`📱 Envoi d\'aperçu marketing à ${client.firstName} ${client.lastName || ''} (${cleanedPhone})`);
    console.log(`   Message: "${personalizedMessage.substring(0, 50)}..."`);
    console.log(`   Risque spam: ${analysis.risk} (score: ${analysis.score})`);
    
    // Préparer les données pour l'envoi
    const messageData = {
      to: cleanedPhone,
      message: personalizedMessage,
      campaignId: campaignId,
      userId: client._id || null,
      firstName: client.firstName || null
    };
    
    // Envoyer le message en utilisant le système anti-spam
    try {
      const result = await sendWhatsAppMessage(messageData);
      
      console.log(`✅ Message d\'aperçu marketing envoyé avec succès`);
      console.log(`   ID du message: ${result.messageId}`);
      console.log(`   ID du log: ${result.logId}`);
      
      res.json({
        success: true,
        message: 'Message d\'aperçu marketing envoyé avec succès',
        result: {
          messageId: result.messageId,
          logId: result.logId,
          phone: cleanedPhone,
          clientName: `${client.firstName || ''} ${client.lastName || ''}`.trim(),
          sentAt: new Date(),
          personalizedMessage: personalizedMessage,
          spamAnalysis: {
            risk: analysis.risk,
            score: analysis.score,
            validated: true
          }
        }
      });
      
    } catch (error) {
      console.error(`❌ Erreur envoi aperçu marketing: ${error.message}`);
      
      // Gérer les erreurs spécifiques
      if (error.message.includes('HTTP_466')) {
        return res.status(429).json({ 
          success: false,
          message: 'Limite de débit atteinte - veuillez réessayer dans quelques minutes',
          type: 'rate_limit',
          retryAfter: 60
        });
      }
      
      if (error.message.includes('numéro invalide')) {
        return res.status(400).json({ 
          success: false,
          message: 'Numéro de téléphone invalide ou non enregistré sur WhatsApp',
          type: 'invalid_phone'
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de l\'envoi du message d\'aperçu',
        details: error.message
      });
    }
    
  } catch (error) {
    console.error('Erreur générale aperçu marketing:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de l\'envoi d\'aperçu',
      details: error.message
    });
  }
});

// 🆕 POST /api/ecom/campaigns/test-message - Tester un message sans l'envoyer
router.post('/test-message', requireEcomAuth, async (req, res) => {
  try {
    const { messageTemplate, clientData } = req.body;
    
    if (!messageTemplate || !messageTemplate.trim()) {
      return res.status(400).json({ success: false, message: 'Le message template est requis' });
    }
    
    // Si clientData fourni, personnaliser le message pour le test
    let testMessage = messageTemplate;
    if (clientData) {
      testMessage = renderMessage(messageTemplate, clientData);
    }
    
    // Analyse anti-spam complète
    const analysis = analyzeSpamRisk(testMessage);
    const isValid = validateMessageBeforeSend(testMessage, 'test-user');
    
    res.json({
      success: true,
      message: 'Message testé avec succès',
      analysis: {
        risk: analysis.risk,
        score: analysis.score,
        warnings: analysis.warnings,
        recommendations: analysis.recommendations,
        validated: isValid,
        length: testMessage.length,
        wordCount: testMessage.split(/\s+/).length
      },
      personalizedMessage: clientData ? testMessage : null,
      verdict: isValid ? '✅ Message safe pour envoi' : '❌ Message à risque - modifications recommandées'
    });
    
  } catch (error) {
    console.error('Erreur test message marketing:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors du test du message',
      details: error.message
    });
  }
});

export default router;
