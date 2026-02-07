import express from 'express';
import Campaign from '../models/Campaign.js';
import Client from '../models/Client.js';
import { requireEcomAuth, validateEcomAccess } from '../middleware/ecomAuth.js';

const router = express.Router();

// Helper: remplacer les variables dans le template
function renderMessage(template, client) {
  return template
    .replace(/\{firstName\}/g, client.firstName || '')
    .replace(/\{lastName\}/g, client.lastName || '')
    .replace(/\{fullName\}/g, [client.firstName, client.lastName].filter(Boolean).join(' '))
    .replace(/\{phone\}/g, client.phone || '')
    .replace(/\{city\}/g, client.city || '')
    .replace(/\{product\}/g, (client.products || []).join(', ') || '')
    .replace(/\{totalOrders\}/g, String(client.totalOrders || 0))
    .replace(/\{totalSpent\}/g, String(client.totalSpent || 0));
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

// GET /api/ecom/campaigns/templates - Templates prédéfinis
router.get('/templates', requireEcomAuth, async (req, res) => {
  const templates = [
    {
      id: 'relance_pending',
      name: 'Relance commandes en attente',
      type: 'relance_pending',
      message: 'Bonjour {firstName} 👋\n\nVotre commande est toujours en attente. Souhaitez-vous confirmer votre commande ?\n\nN\'hésitez pas à nous contacter pour toute question.',
      targetFilters: { clientStatus: 'prospect' }
    },
    {
      id: 'relance_cancelled',
      name: 'Relance commandes annulées',
      type: 'relance_cancelled',
      message: 'Bonjour {firstName} 👋\n\nNous avons remarqué que votre dernière commande a été annulée. Nous aimerions comprendre ce qui s\'est passé.\n\nPouvons-nous vous aider ?',
      targetFilters: { clientStatus: 'returned' }
    },
    {
      id: 'promo',
      name: 'Promotion produit',
      type: 'promo',
      message: 'Bonjour {firstName} 🎉\n\nNous avons une offre spéciale pour vous ! Profitez de nos promotions exclusives.\n\nContactez-nous pour en savoir plus.',
      targetFilters: { clientStatus: 'delivered' }
    },
    {
      id: 'followup',
      name: 'Suivi après livraison',
      type: 'followup',
      message: 'Bonjour {firstName} 😊\n\nNous espérons que vous êtes satisfait(e) de votre commande ({product}).\n\nVotre avis compte beaucoup pour nous. N\'hésitez pas à nous faire un retour !',
      targetFilters: { clientStatus: 'delivered' }
    },
    {
      id: 'reorder',
      name: 'Relance réachat',
      type: 'custom',
      message: 'Bonjour {firstName} 👋\n\nCela fait un moment que nous n\'avons pas eu de vos nouvelles !\n\nNos produits vous manquent ? Nous avons de nouvelles offres qui pourraient vous intéresser.',
      targetFilters: { clientStatus: 'delivered' }
    }
  ];
  res.json({ success: true, data: templates });
});

// POST /api/ecom/campaigns/preview - Prévisualiser les clients ciblés
router.post('/preview', requireEcomAuth, async (req, res) => {
  try {
    const { targetFilters } = req.body;
    const filter = buildClientFilter(req.workspaceId, targetFilters || {});
    // Seulement les clients avec un téléphone
    filter.phone = { $exists: true, $ne: '' };

    const clients = await Client.find(filter).select('firstName lastName phone city products totalOrders totalSpent status tags').limit(500);
    res.json({ success: true, data: { count: clients.length, clients } });
  } catch (error) {
    console.error('Erreur preview campaign:', error);
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
    const { name, type, messageTemplate, targetFilters, scheduledAt, tags } = req.body;
    if (!name || !messageTemplate) {
      return res.status(400).json({ success: false, message: 'Nom et message requis' });
    }

    // Compter les clients ciblés
    const filter = buildClientFilter(req.workspaceId, targetFilters || {});
    filter.phone = { $exists: true, $ne: '' };
    const targetedCount = await Client.countDocuments(filter);

    const campaign = new Campaign({
      workspaceId: req.workspaceId,
      name,
      type: type || 'custom',
      messageTemplate,
      targetFilters: targetFilters || {},
      scheduledAt: scheduledAt || null,
      status: scheduledAt ? 'scheduled' : 'draft',
      stats: { targeted: targetedCount },
      tags: tags || [],
      createdBy: req.ecomUser._id
    });

    await campaign.save();
    res.status(201).json({ success: true, message: 'Campagne créée', data: campaign });
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

    const allowedFields = ['name', 'type', 'messageTemplate', 'targetFilters', 'scheduledAt', 'tags', 'status'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) campaign[field] = req.body[field];
    });

    // Recompter les clients ciblés
    const filter = buildClientFilter(req.workspaceId, campaign.targetFilters || {});
    filter.phone = { $exists: true, $ne: '' };
    campaign.stats.targeted = await Client.countDocuments(filter);

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

    const greenApiId = process.env.GREEN_API_ID_INSTANCE;
    const greenApiToken = process.env.GREEN_API_TOKEN_INSTANCE;
    const greenApiUrl = process.env.GREEN_API_URL || 'https://api.green-api.com';
    if (!greenApiId || !greenApiToken) {
      return res.status(500).json({ success: false, message: 'Green API non configuré' });
    }

    // Récupérer les clients ciblés
    const filter = buildClientFilter(req.workspaceId, campaign.targetFilters || {});
    filter.phone = { $exists: true, $ne: '' };
    const clients = await Client.find(filter);

    campaign.status = 'sending';
    campaign.stats.targeted = clients.length;
    campaign.results = [];
    await campaign.save();

    let sent = 0;
    let failed = 0;
    let messageCount = 0;
    const BATCH_SIZE = 5;
    const BATCH_PAUSE_MS = 10000; // 10 secondes entre chaque lot
    const MSG_PAUSE_MS = 2000; // 2 secondes entre chaque message

    for (const client of clients) {
      const message = renderMessage(campaign.messageTemplate, client);
      const cleanedPhone = (client.phone || '').replace(/\D/g, '');
      if (!cleanedPhone || cleanedPhone.length < 8) {
        campaign.results.push({ clientId: client._id, clientName: `${client.firstName} ${client.lastName}`, phone: client.phone, status: 'failed', error: 'Numéro invalide' });
        failed++;
        continue;
      }

      try {
        const apiUrl = `${greenApiUrl}/waInstance${greenApiId}/sendMessage/${greenApiToken}`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId: `${cleanedPhone}@c.us`, message })
        });
        const data = await response.json();
        if (!response.ok || data.error) {
          campaign.results.push({ clientId: client._id, clientName: `${client.firstName} ${client.lastName}`, phone: client.phone, status: 'failed', error: data.error || data.errorMessage || 'Erreur API' });
          failed++;
        } else {
          campaign.results.push({ clientId: client._id, clientName: `${client.firstName} ${client.lastName}`, phone: client.phone, status: 'sent', sentAt: new Date() });
          sent++;
          messageCount++;
          // Mettre à jour le dernier contact du client
          client.lastContactAt = new Date();
          if (!client.tags.includes('Relancé')) client.tags.push('Relancé');
          await client.save();
        }
      } catch (err) {
        campaign.results.push({ clientId: client._id, clientName: `${client.firstName} ${client.lastName}`, phone: client.phone, status: 'failed', error: err.message });
        failed++;
      }

      // Pause de 10 secondes tous les 5 messages envoyés, sinon 2s entre chaque
      if (messageCount > 0 && messageCount % BATCH_SIZE === 0) {
        console.log(`⏸️ Campagne ${campaign.name}: pause 10s après ${messageCount} messages envoyés...`);
        await new Promise(resolve => setTimeout(resolve, BATCH_PAUSE_MS));
      } else {
        await new Promise(resolve => setTimeout(resolve, MSG_PAUSE_MS));
      }
    }

    campaign.status = failed === clients.length ? 'failed' : 'sent';
    campaign.sentAt = new Date();
    campaign.stats.sent = sent;
    campaign.stats.failed = failed;
    await campaign.save();

    res.json({
      success: true,
      message: `Campagne envoyée: ${sent} envoyés, ${failed} échoués sur ${clients.length} ciblés`,
      data: campaign
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

export default router;
