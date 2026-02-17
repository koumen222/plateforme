import express from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Client from '../models/Client.js';
import WorkspaceSettings from '../models/WorkspaceSettings.js';
import EcomUser from '../models/EcomUser.js';
import CloseuseAssignment from '../models/CloseuseAssignment.js';
import Notification from '../../models/Notification.js';
import { sendWhatsAppMessage } from '../../services/whatsappService.js';
import { requireEcomAuth, validateEcomAccess } from '../middleware/ecomAuth.js';
import { notifyNewOrder, notifyOrderStatus, notifyTeamOrderCreated, notifyTeamOrderStatusChanged } from '../services/notificationHelper.js';
import { EventEmitter } from 'events';

const router = express.Router();

// Créer un EventEmitter global pour la progression
const syncProgressEmitter = new EventEmitter();

// Fonction pour détecter le pays depuis le numéro de téléphone ou la ville
const detectCountry = (phone, city) => {
  // Détection par indicatif téléphonique
  if (phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Cameroun
    if (cleanPhone.startsWith('237')) return { code: 'CM', name: 'Cameroun' };
    // France
    if (cleanPhone.startsWith('33') || cleanPhone.startsWith('263')) return { code: 'FR', name: 'France' };
    // Côte d'Ivoire
    if (cleanPhone.startsWith('225')) return { code: 'CI', name: 'Côte d\'Ivoire' };
    // Sénégal
    if (cleanPhone.startsWith('221')) return { code: 'SN', name: 'Sénégal' };
    // Mali
    if (cleanPhone.startsWith('223')) return { code: 'ML', name: 'Mali' };
    // Burkina Faso
    if (cleanPhone.startsWith('226')) return { code: 'BF', name: 'Burkina Faso' };
    // Niger
    if (cleanPhone.startsWith('227')) return { code: 'NE', name: 'Niger' };
    // Togo
    if (cleanPhone.startsWith('228')) return { code: 'TG', name: 'Togo' };
    // Bénin
    if (cleanPhone.startsWith('229')) return { code: 'BJ', name: 'Bénin' };
    // Gabon
    if (cleanPhone.startsWith('241')) return { code: 'GA', name: 'Gabon' };
    // Congo RDC
    if (cleanPhone.startsWith('243')) return { code: 'CD', name: 'Congo RDC' };
    // Congo Brazzaville
    if (cleanPhone.startsWith('242')) return { code: 'CG', name: 'Congo Brazzaville' };
    // Canada
    if (cleanPhone.startsWith('1')) return { code: 'CA', name: 'Canada' };
    // USA
    if (cleanPhone.startsWith('1')) return { code: 'US', name: 'États-Unis' };
    // Royaume-Uni
    if (cleanPhone.startsWith('44')) return { code: 'GB', name: 'Royaume-Uni' };
    // Belgique
    if (cleanPhone.startsWith('32')) return { code: 'BE', name: 'Belgique' };
    // Suisse
    if (cleanPhone.startsWith('41')) return { code: 'CH', name: 'Suisse' };
    // Luxembourg
    if (cleanPhone.startsWith('352')) return { code: 'LU', name: 'Luxembourg' };
    // Maroc
    if (cleanPhone.startsWith('212')) return { code: 'MA', name: 'Maroc' };
    // Tunisie
    if (cleanPhone.startsWith('216')) return { code: 'TN', name: 'Tunisie' };
    // Algérie
    if (cleanPhone.startsWith('213')) return { code: 'DZ', name: 'Algérie' };
    // Égypte
    if (cleanPhone.startsWith('20')) return { code: 'EG', name: 'Égypte' };
  }
  
  // Détection par nom de ville
  if (city) {
    const cleanCity = city.toLowerCase().trim();
    
    // Villes camerounaises
    if (['douala', 'yaoundé', 'yaounde', 'bafoussam', 'garoua', 'maroua', 'bamenda', 'kumba', 'limbé', 'nkongsamba', 'bertoua', 'ebolowa', 'buea', 'kribi'].includes(cleanCity)) {
      return { code: 'CM', name: 'Cameroun' };
    }
    
    // Villes françaises
    if (['paris', 'marseille', 'lyon', 'toulouse', 'nice', 'nantes', 'strasbourg', 'montpellier', 'bordeaux', 'lille'].includes(cleanCity)) {
      return { code: 'FR', name: 'France' };
    }
    
    // Villes ivoiriennes
    if (['abidjan', 'yamoussoukro', 'bouaké', 'korhogo', 'daloa', 'san-pedro'].includes(cleanCity)) {
      return { code: 'CI', name: 'Côte d\'Ivoire' };
    }
    
    // Villes sénégalaises
    if (['dakar', 'thiès', 'kaolack', 'mbour', 'saint-louis', 'touba'].includes(cleanCity)) {
      return { code: 'SN', name: 'Sénégal' };
    }
  }
  
  // Par défaut, retourner Cameroun
  return { code: 'CM', name: 'Cameroun' };
};

// Fonction pour envoyer automatiquement les détails d'une nouvelle commande via WhatsApp
const sendOrderNotification = async (order, workspaceId) => {
  try {
    // Récupérer les paramètres du workspace
    const settings = await WorkspaceSettings.findOne({ workspaceId });
    if (!settings) return;
    
    // Détecter le pays de la commande
    const country = detectCountry(order.clientPhone, order.city);
    
    // Trouver le numéro WhatsApp configuré pour ce pays
    const whatsappConfig = settings.whatsappNumbers?.find(w => 
      w.country === country.code && w.isActive && w.autoNotifyOrders
    );
    
    // Si pas de configuration spécifique, utiliser le numéro par défaut
    const targetNumber = whatsappConfig?.phoneNumber || settings.customWhatsAppNumber;
    if (!targetNumber) return;
    
    // Créer le message de notification
    const message = `🔔 *NOUVELLE COMMANDE* 🔔

📋 *Détails de la commande:*
🔹 *ID:* ${order.orderId}
👤 *Client:* ${order.clientName || 'Non spécifié'}
📱 *Téléphone:* ${order.clientPhone || 'Non spécifié'}
🏙️ *Ville:* ${order.city || 'Non spécifié'}
📍 *Adresse:* ${order.address || 'Non spécifié'}
📦 *Produit:* ${order.product || 'Non spécifié'}
🔢 *Quantité:* ${order.quantity || 1}
💰 *Prix:* ${order.price || 0} FCFA
📊 *Statut:* ${order.status || 'pending'}
📝 *Notes:* ${order.notes || 'Aucune'}

🌍 *Pays détecté:* ${country.name}
⏰ *Date:* ${new Date(order.date).toLocaleString('fr-FR')}

🚀 *Prenez cette commande rapidement!*`;

    // Envoyer le message WhatsApp
    await sendWhatsAppMessage({
      to: targetNumber,
      message: message,
      userId: 'system',
      firstName: 'Système'
    });
    
    console.log(`✅ Notification WhatsApp envoyée pour la commande ${order.orderId} vers ${country.name}`);
  } catch (error) {
    console.error('Erreur envoi notification WhatsApp:', error);
  }
};

// POST /api/ecom/orders - Créer une commande manuellement
router.post('/', requireEcomAuth, validateEcomAccess('products', 'write'), async (req, res) => {
  try {
    const { clientName, clientPhone, city, address, product, quantity, price, status, notes, tags } = req.body;
    if (!clientName && !clientPhone) {
      return res.status(400).json({ success: false, message: 'Nom client ou téléphone requis' });
    }
    const order = new Order({
      workspaceId: req.workspaceId,
      orderId: `#MAN_${Date.now().toString(36)}`,
      date: new Date(),
      clientName: clientName || '',
      clientPhone: clientPhone || '',
      city: city || '',
      address: address || '',
      product: product || '',
      quantity: quantity || 1,
      price: price || 0,
      status: status || 'pending',
      notes: notes || '',
      tags: tags || [],
      source: 'manual',
      sheetRowId: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    });
    await order.save();
    
    // Envoyer la notification WhatsApp automatiquement
    await sendOrderNotification(order, req.workspaceId);
    
    // Notification interne
    notifyNewOrder(req.workspaceId, order).catch(() => {});
    
    // Notification d'équipe (exclure l'acteur)
    notifyTeamOrderCreated(req.workspaceId, req.ecomUser._id, order, req.ecomUser.email).catch(() => {});
    
    // 📱 Push notification
    try {
      const { sendPushNotification } = await import('../../services/pushService.js');
      await sendPushNotification(req.workspaceId, {
        title: '🛒 Nouvelle commande',
        body: `${order.clientName || order.clientPhone} - ${order.product || 'Produit'} (${order.quantity}x)`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'new-order',
        data: {
          type: 'new_order',
          orderId: order._id.toString(),
          url: `/orders/${order._id}`
        }
      }, 'push_new_orders');
    } catch (e) {
      console.warn('⚠️ Push notification failed:', e.message);
    }
    
    res.status(201).json({ success: true, message: 'Commande créée', data: order });
  } catch (error) {
    console.error('Erreur création commande:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/ecom/orders/bulk - Supprimer toutes les commandes (optionnel: filtrées par sourceId)
router.delete('/bulk', requireEcomAuth, validateEcomAccess('products', 'write'), async (req, res) => {
  try {
    const { sourceId } = req.query;
    const filter = { workspaceId: req.workspaceId };
    if (sourceId) {
      if (sourceId === 'legacy') {
        filter.sheetRowId = { $not: /^source_/ };
      } else {
        filter.sheetRowId = { $regex: `^source_${sourceId}_` };
      }
    }
    const result = await Order.deleteMany(filter);
    res.json({ success: true, message: `${result.deletedCount} commande(s) supprimée(s)`, data: { deletedCount: result.deletedCount } });
  } catch (error) {
    console.error('Erreur suppression bulk:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/ecom/orders/new-since - Silent polling endpoint for frontend
// Returns only orders created/updated after a given timestamp (lightweight)
router.get('/new-since', requireEcomAuth, async (req, res) => {
  try {
    const { since, sourceId } = req.query;
    if (!since) {
      return res.json({ success: true, data: { orders: [], count: 0, serverTime: new Date().toISOString() } });
    }

    const sinceDate = new Date(since);
    if (isNaN(sinceDate.getTime())) {
      return res.json({ success: true, data: { orders: [], count: 0, serverTime: new Date().toISOString() } });
    }

    const filter = {
      workspaceId: req.workspaceId,
      updatedAt: { $gt: sinceDate }
    };
    if (sourceId) {
      filter.sheetRowId = { $regex: `^source_${sourceId}_` };
    }

    const orders = await Order.find(filter)
      .sort({ updatedAt: -1 })
      .limit(200)
      .lean();

    // Log de polling (seulement si des commandes sont trouvées)
    if (orders.length > 0) {
      console.log(`📡 [Polling Endpoint] ${orders.length} commande(s) retournée(s) pour workspace ${req.workspaceId}`);
    }

    res.json({
      success: true,
      data: {
        orders,
        count: orders.length,
        serverTime: new Date().toISOString()
      }
    });
  } catch (error) {
    // Silent — never break the frontend polling
    console.error('❌ [Polling Endpoint] Erreur:', error.message);
    res.json({ success: true, data: { orders: [], count: 0, serverTime: new Date().toISOString() } });
  }
});

// GET /api/ecom/orders - Liste des commandes
router.get('/', requireEcomAuth, async (req, res) => {
  try {
    const { status, search, startDate, endDate, city, product, tag, sourceId, page = 1, limit = 50, allWorkspaces, period } = req.query;
    
    // Si super_admin et allWorkspaces=true, ne pas filtrer par workspaceId
    const isSuperAdmin = req.ecomUser.role === 'super_admin';
    const viewAllWorkspaces = isSuperAdmin && allWorkspaces === 'true';
    
    const filter = viewAllWorkspaces ? {} : { workspaceId: req.workspaceId };

    // Gestion des filtres de période prédéfinis
    if (period) {
      const now = new Date();
      let periodStart, periodEnd;
      
      switch (period) {
        case 'today':
          periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case '7days':
          periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          periodEnd = new Date();
          break;
        case '30days':
          periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          periodEnd = new Date();
          break;
        case '90days':
          periodStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          periodEnd = new Date();
          break;
        default:
          // Période non reconnue, ignorer
          break;
      }
      
      if (periodStart && periodEnd) {
        filter.date = { $gte: periodStart, $lt: periodEnd };
      }
    } else if (startDate || endDate) {
      // Filtres de dates manuels (comportement existant)
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    if (status) filter.status = status;
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (product) filter.product = { $regex: product, $options: 'i' };
    if (tag) filter.tags = tag;
    if (sourceId) {
      if (sourceId === 'legacy') {
        filter.sheetRowId = { $not: /^source_/ };
      } else {
        filter.sheetRowId = { $regex: `^source_${sourceId}_` };
      }
    }
    if (search) {
      filter.$or = [
        { clientName: { $regex: search, $options: 'i' } },
        { clientPhone: { $regex: search, $options: 'i' } },
        { product: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { orderId: { $regex: search, $options: 'i' } }
      ];
    }

    // Filtre closeuse: ne montrer que les commandes des produits assignés
    if (req.ecomUser.role === 'ecom_closeuse') {
      console.log('🔒 [orders] Closeuse filter - userId:', req.ecomUser._id, 'workspaceId:', req.workspaceId);
      const assignment = await CloseuseAssignment.findOne({
        closeuseId: req.ecomUser._id,
        workspaceId: req.workspaceId,
        isActive: true
      });

      console.log('🔒 [orders] Assignment found:', !!assignment);
      if (assignment) {
        const sheetProductNames = (assignment.productAssignments || []).flatMap(pa => pa.sheetProductNames || []);
        const assignedProductIds = (assignment.productAssignments || []).flatMap(pa => pa.productIds || []);
        const assignedCityNames = (assignment.cityAssignments || []).flatMap(ca => ca.cityNames || []);
        console.log('🔒 [orders] sheetProductNames:', sheetProductNames, 'assignedProductIds:', assignedProductIds.length, 'assignedCityNames:', assignedCityNames);

        if (sheetProductNames.length > 0 || assignedProductIds.length > 0 || assignedCityNames.length > 0) {
          // Correspondance exacte sur les noms de produits assignés (case-insensitive)
          const productConditions = sheetProductNames.map(name => ({
            product: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
          }));

          // Correspondance exacte sur les noms de villes assignées (case-insensitive)
          const cityConditions = assignedCityNames.map(name => ({
            city: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
          }));

          console.log('🔒 [orders] Product names to match:', sheetProductNames);
          console.log('🔒 [orders] City names to match:', assignedCityNames);

          // Combiner toutes les conditions (produits OU villes)
          const allConditions = [...productConditions, ...cityConditions];

          if (allConditions.length > 0) {
            if (filter.$or) {
              // search + product/city filter: wrap both in $and
              const searchOr = filter.$or;
              delete filter.$or;
              filter.$and = [{ $or: searchOr }, { $or: allConditions }];
            } else {
              filter.$or = allConditions;
            }
            console.log('🔒 [orders] Final filter: exact match on', sheetProductNames.length, 'products and', assignedCityNames.length, 'cities');
          }
        }
      }
    }

    // Debug: log complete filter for closeuse
    if (req.ecomUser.role === 'ecom_closeuse') {
      console.log('🔒 [orders] COMPLETE FILTER:', JSON.stringify(filter, null, 2));
    }

    const orders = await Order.find(filter)
      .populate('assignedLivreur', 'name email phone')
      .sort({ date: -1, _id: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Debug: log sample product values from returned orders
    if (req.ecomUser.role === 'ecom_closeuse') {
      console.log('🔒 [orders] Orders returned:', orders.length);
      if (orders.length > 0) {
        console.log('🔒 [orders] Sample product values:', orders.slice(0, 5).map(o => o.product));
      }
    }

    const total = await Order.countDocuments(filter);

    // Stats — use countDocuments per status (filtered by closeuse products if applicable)
    const wsFilter = viewAllWorkspaces ? {} : { workspaceId: req.workspaceId };
    
    // For closeuse, also apply product and city filter to stats
    let statsFilter = { ...wsFilter };
    if (req.ecomUser.role === 'ecom_closeuse' && (filter.$or || filter.$and)) {
      // Extract product and city conditions from the main filter
      if (filter.$or) {
        statsFilter.$or = filter.$or;
      } else if (filter.$and) {
        // Find the product/city conditions in $and
        const productCityCondition = filter.$and.find(c => c.$or && (c.$or[0]?.product || c.$or[0]?.city));
        if (productCityCondition) {
          statsFilter.$or = productCityCondition.$or;
        }
      }
    }
    
    const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'returned', 'cancelled', 'unreachable', 'called', 'postponed'];
    
    const countPromises = statuses.map(s => 
      Order.countDocuments({ ...statsFilter, status: s })
    );
    const counts = await Promise.all(countPromises);
    
    const stats = { total: 0, totalRevenue: 0 };
    statuses.forEach((s, i) => {
      stats[s] = counts[i];
      stats.total += counts[i];
    });
    
    // Calculate delivered revenue
    const deliveredOrders = await Order.find(
      { ...statsFilter, status: 'delivered' },
      { price: 1, quantity: 1 }
    ).lean();
    stats.totalRevenue = deliveredOrders.reduce((sum, o) => sum + ((o.price || 0) * (o.quantity || 1)), 0);

    // Calculer le revenu livré par période si un filtre de période est utilisé
    if (period) {
      stats.periodRevenue = 0;
      const periodDeliveredOrders = await Order.find(
        { ...statsFilter, status: 'delivered', date: filter.date },
        { price: 1, quantity: 1 }
      ).lean();
      stats.periodRevenue = periodDeliveredOrders.reduce((sum, o) => sum + ((o.price || 0) * (o.quantity || 1)), 0);
      
      // Ajouter des informations sur la période
      const now = new Date();
      switch (period) {
        case 'today':
          stats.periodLabel = "Aujourd'hui";
          break;
        case '7days':
          stats.periodLabel = "7 derniers jours";
          break;
        case '30days':
          stats.periodLabel = "30 derniers jours";
          break;
        case '90days':
          stats.periodLabel = "90 derniers jours";
          break;
        default:
          stats.periodLabel = "Période personnalisée";
          break;
      }
    }

    res.json({
      success: true,
      data: {
        orders,
        stats,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    console.error('Erreur get orders:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/ecom/orders/stats/detailed - Statistiques détaillées pour la page stats
router.get('/stats/detailed', requireEcomAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    // Pour .find()/.countDocuments() Mongoose cast auto string→ObjectId
    const wsFilter = { workspaceId: req.workspaceId };
    // Pour .aggregate() il faut un vrai ObjectId sinon ça ne matche pas
    const wsFilterAgg = { workspaceId: new mongoose.Types.ObjectId(req.workspaceId) };
    
    // Date filter
    if (startDate || endDate) {
      wsFilter.date = {};
      wsFilterAgg.date = {};
      if (startDate) {
        wsFilter.date.$gte = new Date(startDate);
        wsFilterAgg.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        wsFilter.date.$lte = end;
        const endAgg = new Date(endDate);
        endAgg.setHours(23, 59, 59, 999);
        wsFilterAgg.date.$lte = endAgg;
      }
    }

    // Order stats by status
    const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'returned', 'cancelled', 'unreachable', 'called', 'postponed'];
    const countPromises = statuses.map(s => Order.countDocuments({ ...wsFilter, status: s }));
    const counts = await Promise.all(countPromises);
    
    const orderStats = { total: 0, totalRevenue: 0 };
    statuses.forEach((s, i) => {
      orderStats[s] = counts[i];
      orderStats.total += counts[i];
    });

    // Revenue and average order value
    const deliveredOrders = await Order.find({ ...wsFilter, status: 'delivered' }, { price: 1, quantity: 1 }).lean();
    orderStats.totalRevenue = deliveredOrders.reduce((sum, o) => sum + ((o.price || 0) * (o.quantity || 1)), 0);
    orderStats.avgOrderValue = deliveredOrders.length > 0 ? orderStats.totalRevenue / deliveredOrders.length : 0;

    // Top products (only delivered)
    const topProducts = await Order.aggregate([
      { $match: { ...wsFilterAgg, status: 'delivered', product: { $exists: true, $ne: '' } } },
      { $group: { 
        _id: '$product', 
        count: { $sum: 1 }, 
        revenue: { $sum: { $multiply: [{ $ifNull: ['$price', 0] }, { $ifNull: ['$quantity', 1] }] } }
      }},
      { $sort: { count: -1 } },
      { $limit: 15 }
    ]);

    // Top cities (only delivered)
    const topCities = await Order.aggregate([
      { $match: { ...wsFilterAgg, status: 'delivered', city: { $exists: true, $ne: '' } } },
      { $group: { 
        _id: '$city', 
        count: { $sum: 1 },
        revenue: { $sum: { $multiply: [{ $ifNull: ['$price', 0] }, { $ifNull: ['$quantity', 1] }] } }
      }},
      { $sort: { count: -1 } },
      { $limit: 15 }
    ]);

    // Top clients by phone (only delivered)
    const topClients = await Order.aggregate([
      { $match: { ...wsFilterAgg, status: 'delivered', clientPhone: { $exists: true, $ne: '' } } },
      { $group: { 
        _id: '$clientPhone',
        clientName: { $first: '$clientName' },
        phone: { $first: '$clientPhone' },
        orderCount: { $sum: 1 },
        totalSpent: { $sum: { $multiply: [{ $ifNull: ['$price', 0] }, { $ifNull: ['$quantity', 1] }] } }
      }},
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ]);

    // Client stats
    const Client = (await import('../models/Client.js')).default;
    const clientTotal = await Client.countDocuments({ workspaceId: req.workspaceId });
    const clientDelivered = await Client.countDocuments({ workspaceId: req.workspaceId, status: 'delivered' });
    const clientStats = { total: clientTotal, delivered: clientDelivered };

    // Products sold by client and city - get raw orders first then process (only delivered)
    const rawOrders = await Order.find({
      ...wsFilter,
      status: 'delivered',
      clientName: { $exists: true, $ne: '' },
      city: { $exists: true, $ne: '' }
    }).lean();

    // Process orders to extract real product names and group data
    const productsByClientCityMap = new Map();
    
    rawOrders.forEach(order => {
      const productName = getOrderProductName(order);
      if (!productName) return;
      
      const key = `${order.clientName}|${order.city}|${productName}`;
      const quantity = order.quantity || 1;
      const revenue = (order.price || 0) * quantity;
      
      if (productsByClientCityMap.has(key)) {
        const existing = productsByClientCityMap.get(key);
        existing.quantity += quantity;
        existing.revenue += revenue;
        existing.orderCount += 1;
      } else {
        productsByClientCityMap.set(key, {
          _id: {
            client: order.clientName,
            city: order.city,
            product: productName
          },
          quantity: quantity,
          revenue: revenue,
          orderCount: 1,
          phone: order.clientPhone
        });
      }
    });

    // Convert to array and sort by quantity
    const productsByClientCity = Array.from(productsByClientCityMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 20);

    // Daily trend (last 30 days) - only delivered orders
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dailyTrend = await Order.aggregate([
      { $match: { workspaceId: new mongoose.Types.ObjectId(req.workspaceId), status: 'delivered', date: { $gte: thirtyDaysAgo } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        count: { $sum: 1 },
        revenue: { $sum: { $multiply: [{ $ifNull: ['$price', 0] }, { $ifNull: ['$quantity', 1] }] } }
      }},
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        orderStats,
        topProducts,
        topCities,
        topClients,
        clientStats,
        productsByClientCity,
        dailyTrend
      }
    });
  } catch (error) {
    console.error('Erreur stats détaillées:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Helper: extraire le vrai nom de produit d'une commande (fallback rawData si numérique)
function getOrderProductName(order) {
  // Si le produit est un vrai nom (non-numérique), le retourner directement
  if (order.product && isNaN(String(order.product).replace(/\s/g, ''))) return order.product;
  // Chercher dans rawData une colonne produit avec une valeur non-numérique
  if (order.rawData && typeof order.rawData === 'object') {
    for (const [k, v] of Object.entries(order.rawData)) {
      if (v && typeof v === 'string' && isNaN(v.replace(/\s/g, '')) && /produit|product|article|item|d[eé]signation/i.test(k)) {
        return v;
      }
    }
  }
  // Fallback: retourner le produit même s'il est numérique, plutôt que rien
  if (order.product) return String(order.product);
  return '';
}

// Helper: extraire le spreadsheetId depuis une URL Google Sheets
function extractSpreadsheetId(input) {
  if (!input) return null;
  // Si c'est déjà un ID (pas d'URL)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(input.trim())) return input.trim();
  // Extraire depuis l'URL
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// Helper: auto-détecter les colonnes depuis les headers
function autoDetectColumns(headers) {
  const mapping = {};
  const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  // Patterns ordonnés par priorité (les plus spécifiques d'abord)
  // Chaque pattern a des termes composés (prioritaires) et des termes simples
  const patterns = [
    { field: 'orderId', compound: ['order id', 'order number', 'numero commande', 'n° commande'], simple: ['order id', 'ref', 'reference'] },
    { field: 'date', compound: ['date & time', 'date time', 'date commande'], simple: ['date', 'jour', 'day', 'created'] },
    { field: 'clientPhone', compound: ['phone number', 'numero telephone', 'num tel'], simple: ['tel', 'telephone', 'phone', 'mobile', 'whatsapp'] },
    { field: 'clientName', compound: ['first name', 'last name', 'full name', 'nom complet', 'nom client', 'customer name'], simple: ['nom', 'name', 'client', 'prenom', 'firstname', 'lastname'] },
    { field: 'city', compound: [], simple: ['ville', 'city', 'commune', 'localite', 'zone'] },
    { field: 'product', compound: ['product name', 'nom produit', 'nom article', 'nom du produit'], simple: ['produit', 'product', 'article', 'item', 'designation'] },
    { field: 'price', compound: ['product price', 'prix produit', 'prix unitaire', 'unit price', 'selling price'], simple: ['prix', 'price', 'montant', 'amount', 'total', 'cout', 'cost', 'tarif'] },
    { field: 'quantity', compound: [], simple: ['quantite', 'quantity', 'qte', 'qty', 'nb', 'nombre'] },
    { field: 'status', compound: ['statut livraison', 'statut commande', 'delivery status', 'order status'], simple: ['statut', 'status', 'etat', 'state'] },
    { field: 'notes', compound: [], simple: ['notes', 'note', 'commentaire', 'comment', 'remarque', 'observation'] },
    { field: 'address', compound: ['address 1', 'adresse 1'], simple: ['adresse', 'address'] },
  ];

  // Pass 1: compound matches (plus spécifiques)
  headers.forEach((header, index) => {
    const h = normalize(header);
    for (const p of patterns) {
      if (!mapping[p.field] && p.compound.some(c => h.includes(c))) {
        mapping[p.field] = index;
      }
    }
  });

  // Pass 2: simple matches (seulement si pas déjà mappé ET index pas déjà pris)
  const usedIndices = new Set(Object.values(mapping));
  headers.forEach((header, index) => {
    if (usedIndices.has(index)) return;
    const h = normalize(header);
    for (const p of patterns) {
      if (!mapping[p.field] && p.simple.some(k => h.includes(k))) {
        mapping[p.field] = index;
        usedIndices.add(index);
        break;
      }
    }
  });

  console.log('📊 Column mapping result:', mapping, 'Headers:', headers);
  return mapping;
}

// Helper: parser une date flexible
function parseFlexDate(dateVal) {
  if (!dateVal) return new Date();
  // Try ISO / standard format
  let d = new Date(dateVal);
  if (!isNaN(d.getTime())) return d;
  // Try DD/MM/YYYY or DD-MM-YYYY
  const parts = dateVal.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    if (day <= 31 && month <= 12) {
      d = new Date(year < 100 ? 2000 + year : year, month - 1, day);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return new Date();
}

// Helper: notifier les livreurs des nouvelles commandes
async function notifyLivreursOfNewOrder(order, workspaceId) {
  try {
    // Récupérer tous les livreurs disponibles pour ce workspace
    const livreurs = await EcomUser.find({ 
      workspaceId,
      role: 'livreur',
      status: 'active'
    });

    if (livreurs.length === 0) {
      console.log('Aucun livreur disponible pour la notification');
      return;
    }

    // Créer une notification pour chaque livreur
    const notifications = livreurs.map(livreur => ({
      userId: livreur._id,
      type: 'new_order',
      title: '📦 Nouvelle commande disponible',
      message: `Commande #${order.orderId} - ${order.clientName} à ${order.city}`,
      data: {
        orderId: order._id,
        orderIdStr: order.orderId,
        clientName: order.clientName,
        city: order.city,
        product: order.product,
        price: order.price,
        phone: order.clientPhone
      },
      priority: 'high',
      actionUrl: `/ecom/orders/${order._id}`
    }));

    // Insérer toutes les notifications
    await Notification.insertMany(notifications);
    
    // Envoyer les messages WhatsApp
    for (const livreur of livreurs) {
      if (livreur.phone) {
        try {
          const whatsappMessage = `📦 *NOUVELLE COMMANDE DISPONIBLE*\n\n` +
            `🔢 *Commande:* #${order.orderId}\n` +
            `👤 *Client:* ${order.clientName}\n` +
            `📞 *Téléphone:* ${order.clientPhone}\n` +
            `📍 *Ville:* ${order.city}\n` +
            `📦 *Produit:* ${order.product}\n` +
            `🔢 *Quantité:* ${order.quantity}\n` +
            `💰 *Prix:* ${order.price} FCFA\n\n` +
            `🚀 *Prenez cette commande rapidement!*`;
          
          await sendWhatsAppMessage({ 
            to: livreur.phone, 
            message: whatsappMessage,
            userId: livreur._id,
            firstName: livreur.name 
          });
          console.log(`✅ WhatsApp envoyé à ${livreur.name} (${livreur.phone}) pour la commande #${order.orderId}`);
        } catch (whatsappError) {
          console.error(`❌ Erreur WhatsApp pour ${livreur.phone}:`, whatsappError.message);
        }
      }
    }
    
    console.log(`✅ Notifications envoyées à ${livreurs.length} livreurs pour la commande #${order.orderId}`);
    
  } catch (error) {
    console.error('Erreur lors de la notification des livreurs:', error);
  }
}

// Helper: notifier les livreurs qu'une commande a été prise
async function notifyOrderTaken(order, workspaceId, takenByLivreurId) {
  try {
    // Récupérer tous les livreurs SAUF celui qui a pris la commande
    const livreurs = await EcomUser.find({ 
      workspaceId,
      role: 'livreur',
      status: 'active',
      _id: { $ne: takenByLivreurId }
    });

    if (livreurs.length === 0) {
      console.log('Aucun autre livreur à notifier');
      return;
    }

    // Récupérer le nom du livreur qui a pris la commande
    const takingLivreur = await EcomUser.findById(takenByLivreurId).select('name');

    // Créer une notification pour chaque autre livreur
    const notifications = livreurs.map(livreur => ({
      userId: livreur._id,
      type: 'order_taken',
      title: '🚚 Commande assignée',
      message: `Commande #${order.orderId} a été prise par ${takingLivreur?.name || 'un livreur'}`,
      data: {
        orderId: order._id,
        orderIdStr: order.orderId,
        takenBy: takingLivreur?.name || 'Un livreur'
      },
      priority: 'medium',
      actionUrl: null // Pas d'action car la commande n'est plus disponible
    }));

    // Insérer toutes les notifications
    await Notification.insertMany(notifications);
    
    // Envoyer les messages WhatsApp aux autres livreurs
    for (const livreur of livreurs) {
      if (livreur.phone) {
        try {
          const whatsappMessage = `🚚 *COMMANDE ASSIGNÉE*\n\n` +
            `❌ La commande #${order.orderId} n'est plus disponible\n\n` +
            `👤 *Client:* ${order.clientName}\n` +
            `📍 *Ville:* ${order.city}\n` +
            `✅ *Prise par:* ${takingLivreur?.name || 'Un livreur'}\n\n` +
            `📋 *Autres commandes disponibles dans votre dashboard*`;
          
          await sendWhatsAppMessage({ 
            to: livreur.phone, 
            message: whatsappMessage,
            userId: livreur._id,
            firstName: livreur.name 
          });
          console.log(`✅ WhatsApp de commande prise envoyé à ${livreur.name} (${livreur.phone})`);
        } catch (whatsappError) {
          console.error(`❌ Erreur WhatsApp pour ${livreur.phone}:`, whatsappError.message);
        }
      }
    }
    
    console.log(`✅ Notification de commande prise envoyée à ${livreurs.length} autres livreurs`);
    
  } catch (error) {
    console.error('Erreur lors de la notification de commande prise:', error);
  }
}

// Helper: envoyer automatiquement à un numéro WhatsApp prédéfini
async function sendOrderToCustomNumber(order, workspaceId) {
  try {
    // Récupérer les paramètres du workspace pour le numéro personnalisé
    const settings = await WorkspaceSettings.findOne({ workspaceId });
    
    // Numéro WhatsApp personnalisé (peut être configuré dans les settings)
    const customWhatsAppNumber = settings?.customWhatsAppNumber || process.env.CUSTOM_WHATSAPP_NUMBER;
    
    if (!customWhatsAppNumber) {
      console.log('⚠️ Aucun numéro WhatsApp personnalisé configuré');
      return;
    }

    // Formater le message complet pour le destinataire personnalisé
    const whatsappMessage = `📦 *NOUVELLE COMMANDE REÇUE*\n\n` +
      `🔢 *Référence:* #${order.orderId}\n` +
      `📅 *Date:* ${new Date(order.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}\n` +
      `⏰ *Heure:* ${new Date(order.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n\n` +
      `👤 *INFORMATIONS CLIENT*\n` +
      `👤 *Nom:* ${order.clientName}\n` +
      `📞 *Téléphone:* ${order.clientPhone}\n` +
      `📍 *Ville:* ${order.city}\n` +
      `${order.deliveryLocation ? `🏠 *Adresse:* ${order.deliveryLocation}\n` : ''}` +
      `${order.deliveryTime ? `⏰ *Heure livraison:* ${order.deliveryTime}\n` : ''}\n\n` +
      `📦 *DÉTAILS COMMANDE*\n` +
      `📦 *Produit:* ${order.product}\n` +
      `🔢 *Quantité:* ${order.quantity}\n` +
      `💰 *Prix unitaire:* ${order.price} FCFA\n` +
      `💰 *Total:* ${order.price * order.quantity} FCFA\n\n` +
      `📋 *STATUT:* ${order.status === 'pending' ? '⏳ En attente' : 
                      order.status === 'confirmed' ? '✅ Confirmé' : 
                      order.status === 'shipped' ? '🚚 Expédié' : 
                      order.status === 'delivered' ? '✅ Livré' : 
                      order.status === 'cancelled' ? '❌ Annulé' : order.status}\n\n` +
      `${order.notes ? `📝 *Notes:* ${order.notes}\n\n` : ''}` +
      `🔗 *Traitez cette commande rapidement*`;

    // Envoyer le message WhatsApp
    try {
      await sendWhatsAppMessage({ 
        to: customWhatsAppNumber, 
        message: whatsappMessage,
        userId: 'system',
        firstName: 'System'
      });
      
      console.log(`✅ Commande #${order.orderId} envoyée automatiquement à ${customWhatsAppNumber}`);
      
      // Créer une notification système pour le suivi
      await Notification.create({
        userId: null, // Notification système
        type: 'auto_whatsapp_sent',
        title: '📱 WhatsApp auto-envoyé',
        message: `Commande #${order.orderId} envoyée à ${customWhatsAppNumber}`,
        data: {
          orderId: order._id,
          orderIdStr: order.orderId,
          phoneNumber: customWhatsAppNumber,
          sentAt: new Date()
        },
        priority: 'low'
      });
      
    } catch (whatsappError) {
      console.error(`❌ Erreur WhatsApp auto-envoi à ${customWhatsAppNumber}:`, whatsappError.message);
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'envoi WhatsApp automatique:', error);
  }
}

// POST /api/ecom/orders/sync-sheets - Synchroniser depuis Google Sheets
router.post('/sync-sheets', requireEcomAuth, validateEcomAccess('products', 'write'), async (req, res) => {
  const startTime = Date.now();
  const syncId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Vérifier si la requête a été annulée
  if (req.signal?.aborted) {
    console.log(`🚫 [${syncId}] Sync annulée avant le début`);
    return res.status(499).json({ success: false, message: 'Synchronisation annulée' });
  }
  
  // Nettoyer les locks si la requête est annulée
  const cleanupOnAbort = () => {
    const sourceId = req.body?.sourceId || 'unknown';
    const lockKey = `sync_lock_${req.workspaceId}_${sourceId}`;
    WorkspaceSettings.updateOne(
      { workspaceId: req.workspaceId },
      { $pull: { syncLocks: { key: lockKey } } }
    ).catch(() => {}); // Ignorer les erreurs de nettoyage
  };
  
  req.signal?.addEventListener('abort', cleanupOnAbort);
  
    try {
      const { sourceId } = req.body;
      
      // Vérifier si annulé pendant le traitement
      if (req.signal?.aborted) {
        console.log(`� [${syncId}] Sync annulée pendant le traitement`);
        return res.status(499).json({ success: false, message: 'Synchronisation annulée' });
      }
      
      // � VALIDATION STRICTE sourceId
      if (!sourceId || typeof sourceId !== 'string') {
        console.log('❌ sourceId manquant ou invalide:', sourceId);
        return res.status(400).json({ 
          success: false, 
          message: 'sourceId est requis et doit être une chaîne de caractères valide' 
        });
      }
    
    console.log(`🔄 [${syncId}] POST /sync-sheets - Workspace:`, req.workspaceId);
    console.log(`🔄 [${syncId}] SourceId validé:`, sourceId);
    
    // Émettre la progression initiale
    syncProgressEmitter.emit('progress', {
      workspaceId: req.workspaceId,
      sourceId,
      current: 0,
      total: 100,
      status: '🔍 Vérification des paramètres...',
      percentage: 0
    });
    
    // 🔒 VÉRIFICATION LOCK SYNCHRONISATION
    const lockKey = `sync_lock_${req.workspaceId}_${sourceId}`;
    
    // Émettre progression: vérification du lock
    syncProgressEmitter.emit('progress', {
      workspaceId: req.workspaceId,
      sourceId,
      current: 2,
      total: 100,
      status: '🔒 Vérification des verrous...',
      percentage: 2
    });
    
    try {
      const existingLock = await WorkspaceSettings.findOne({ 
        workspaceId: req.workspaceId,
        'syncLocks.key': lockKey 
      });
      
      if (existingLock && existingLock.syncLocks?.[0]?.expiresAt > new Date()) {
        const lockAge = Math.floor((Date.now() - existingLock.syncLocks[0].createdAt) / 1000);
        console.log(`⏸️ [${syncId}] Sync déjà en cours (lock existant depuis ${lockAge}s)`);
        return res.status(429).json({ 
          success: false, 
          message: 'Synchronisation déjà en cours pour cette source. Veuillez patienter.',
          retryAfter: Math.ceil((existingLock.syncLocks[0].expiresAt - Date.now()) / 1000)
        });
      }
    } catch (lockError) {
      // Si le champ syncLocks n'existe pas encore, on continue
      if (lockError.name === 'MongoServerError' && lockError.message.includes('syncLocks')) {
        console.log(`ℹ️ [${syncId}] Champ syncLocks non encore initialisé, continuation...`);
      } else {
        throw lockError;
      }
    }
    
    // 🔒 CRÉATION LOCK TEMPORAIRE (2 minutes)
    const lockExpiresAt = new Date(Date.now() + 120000); // 2 minutes
    let settings = null;
    
    // Émettre progression: création du lock
    syncProgressEmitter.emit('progress', {
      workspaceId: req.workspaceId,
      sourceId,
      current: 4,
      total: 100,
      status: '🔒 Création du verrou de synchronisation...',
      percentage: 4
    });
    
    try {
      // D'abord, s'assurer que le document existe avec syncLocks
      settings = await WorkspaceSettings.findOne({ workspaceId: req.workspaceId });
      
      if (!settings) {
        // Créer le document s'il n'existe pas
        settings = new WorkspaceSettings({
          workspaceId: req.workspaceId,
          googleSheets: { apiKey: '', spreadsheetId: '', sheetName: 'Sheet1' },
          sources: [],
          syncLocks: []
        });
        await settings.save();
        console.log(`✅ [${syncId}] WorkspaceSettings créé avec syncLocks`);
      } else if (!settings.syncLocks) {
        // Ajouter le champ syncLocks s'il n'existe pas
        settings.syncLocks = [];
        await settings.save();
        console.log(`🔧 [${syncId}] Champ syncLocks ajouté au document existant`);
      }
      
      // Maintenant ajouter le lock
      const lockData = {
        key: lockKey,
        createdAt: new Date(),
        expiresAt: lockExpiresAt,
        sourceId,
        userId: req.ecomUser?._id
      };
      
      // Nettoyer les anciens locks expirés d'abord
      settings.syncLocks = settings.syncLocks.filter(lock => lock.expiresAt > new Date());
      
      // Vérifier si un lock actif existe déjà
      const existingActiveLock = settings.syncLocks.find(lock => lock.key === lockKey);
      if (existingActiveLock) {
        console.log(`⏸️ [${syncId}] Lock déjà actif, annulation`);
        return res.status(429).json({
          success: false,
          message: 'Synchronisation déjà en cours pour cette source.',
          retryAfter: Math.ceil((existingActiveLock.expiresAt - Date.now()) / 1000)
        });
      }
      
      // Ajouter le nouveau lock
      settings.syncLocks.push(lockData);
      await settings.save();
      
    } catch (lockError) {
      console.error(`❌ [${syncId}] Erreur création lock:`, lockError);
      throw lockError;
    }
    
    console.log(`🔒 [${syncId}] Lock créé pour ${sourceId}, expire à ${lockExpiresAt.toLocaleTimeString('fr-FR')}`);

    console.log(`📋 [${syncId}] Sources disponibles:`, settings.sources?.length || 0);
    console.log(`📋 [${syncId}] Google Sheets legacy:`, settings.googleSheets?.spreadsheetId ? 'OUI' : 'NON');

    let sourceToSync = null;
    
    // 🔍 RECHERCHE SPÉCIFIQUE DE LA SOURCE
    if (sourceId === 'legacy') {
      if (!settings.googleSheets?.spreadsheetId) {
        await WorkspaceSettings.updateOne(
          { workspaceId: req.workspaceId },
          { $pull: { syncLocks: { key: lockKey } } }
        );
        return res.status(404).json({ 
          success: false, 
          message: 'Source legacy non configurée. Veuillez configurer Google Sheets par défaut.' 
        });
      }
      sourceToSync = {
        _id: 'legacy',
        name: 'Commandes Zendo',
        spreadsheetId: settings.googleSheets.spreadsheetId,
        sheetName: settings.googleSheets.sheetName || 'Sheet1'
      };
    } else {
      const source = settings.sources.id(sourceId);
      if (!source) {
        await WorkspaceSettings.updateOne(
          { workspaceId: req.workspaceId },
          { $pull: { syncLocks: { key: lockKey } } }
        );
        return res.status(404).json({ 
          success: false, 
          message: 'Source non trouvée. Veuillez vérifier l\'ID de la source.' 
        });
      }
      
      if (!source.isActive) {
        await WorkspaceSettings.updateOne(
          { workspaceId: req.workspaceId },
          { $pull: { syncLocks: { key: lockKey } } }
        );
        return res.status(400).json({ 
          success: false, 
          message: 'Source désactivée. Activez-la d\'abord dans les paramètres.' 
        });
      }
      
      sourceToSync = source;
    }

      console.log(`🎯 [${syncId}] Synchronisation de la source:`, sourceToSync.name);
      
      // Émettre progression: connexion
      syncProgressEmitter.emit('progress', {
        workspaceId: req.workspaceId,
        sourceId,
        current: 8,
        total: 100,
        status: '🌐 Connexion à Google Sheets...',
        percentage: 8
      });

    let totalImported = 0;
    let totalUpdated = 0;
    let syncError = null;

    // 📊 SYNCHRONISATION DE LA SOURCE UNIQUE
    const spreadsheetId = extractSpreadsheetId(sourceToSync.spreadsheetId);
    if (!spreadsheetId) {
      syncError = 'ID de spreadsheet invalide';
    } else {
      const sheetName = sourceToSync.sheetName || 'Sheet1';
      const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;

      try {
        console.log(`🌐 [${syncId}] Appel API Google Sheets...`);
        
        // Vérifier si annulé avant l'appel API
        if (req.signal?.aborted) {
          console.log(`🚫 [${syncId}] Sync annulée avant appel API Google Sheets`);
          return res.status(499).json({ success: false, message: 'Synchronisation annulée' });
        }
        
        // Émettre progression: récupération des données
        syncProgressEmitter.emit('progress', {
          workspaceId: req.workspaceId,
          sourceId,
          current: 20,
          total: 100,
          status: '📥 Récupération des données depuis Google Sheets...',
          percentage: 20
        });
        
        const response = await fetch(csvUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}: Accès refusé au sheet`);

        const text = await response.text();
        const jsonStr = text.match(/google\.visualization\.Query\.setResponse\((.+)\);?$/);
        if (!jsonStr) throw new Error('Format de réponse invalide');

        const json = JSON.parse(jsonStr[1]);
        const table = json.table;
        if (!table || !table.rows || table.rows.length === 0) {
          console.log(`📭 [${syncId}] Sheet vide ou sans données`);
        } else {
          let headers = table.cols.map(col => col.label || '');
          let dataStartIndex = 0;
          const hasLabels = headers.some(h => h && h.trim());
          if (!hasLabels && table.rows.length > 0) {
            const firstRow = table.rows[0];
            if (firstRow.c) {
              headers = firstRow.c.map(cell => cell ? (cell.f || (cell.v != null ? String(cell.v) : '')) : '');
              dataStartIndex = 1;
            }
          }

          console.log(`📊 [${syncId}] Headers détectés (${headers.length}):`, headers);
          const columnMap = autoDetectColumns(headers);
          
          // Fallback: if status column not detected, scan headers manually
          if (columnMap.status === undefined) {
            console.log(`⚠️ [${syncId}] Status column NOT detected! Scanning headers for fallback...`);
            const statusKeywordsForHeaders = ['statut', 'status', 'etat', 'état', 'state', 'livraison', 'delivery'];
            const normalizeH = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
            const usedIdx = new Set(Object.values(columnMap));
            for (let hi = 0; hi < headers.length; hi++) {
              if (usedIdx.has(hi)) continue;
              const nh = normalizeH(headers[hi]);
              if (statusKeywordsForHeaders.some(kw => nh.includes(kw))) {
                columnMap.status = hi;
                console.log(`✅ [${syncId}] Status column found via fallback at index ${hi}: "${headers[hi]}"`);
                break;
              }
            }
            if (columnMap.status === undefined) {
              console.log(`❌ [${syncId}] Status column NOT found even with fallback! All orders will default to 'pending'.`);
            }
          }
          
          console.log(`📊 [${syncId}] Final column mapping:`, columnMap);
          const bulkOps = [];
          
          // Émettre progression: traitement
          syncProgressEmitter.emit('progress', {
            workspaceId: req.workspaceId,
            sourceId,
            current: 30,
            total: 100,
            status: '⚙️ Chargement des commandes existantes...',
            percentage: 30
          });

          // Batch-load existing orders for dedup:
          // 1) By sheetRowId for this source
          const existingByRow = await Order.find(
            { workspaceId: req.workspaceId, sheetRowId: { $regex: `^source_${sourceToSync._id}_` } },
            { sheetRowId: 1, orderId: 1, statusModifiedManually: 1, status: 1 }
          ).lean();
          const existingByRowId = new Map(existingByRow.map(o => [o.sheetRowId, o]));
          
          // 2) By orderId across ALL orders in workspace (to catch manual status changes on any source)
          const allOrdersWithId = await Order.find(
            { workspaceId: req.workspaceId, orderId: { $exists: true, $ne: '' } },
            { orderId: 1, statusModifiedManually: 1, status: 1 }
          ).lean();
          const existingByOrderId = new Map(allOrdersWithId.map(o => [o.orderId, o]));
          console.log(`📋 [${syncId}] ${existingByRow.length} par rowId, ${allOrdersWithId.length} par orderId chargées pour dedup`);

          // Statistiques de mapping des statuts
          let statusStats = {};
          let unrecognizedStatuses = new Set();

          // Mapping étendu des statuts (déclaré une seule fois hors boucle)
          const statusMap = {
            'en attente': 'pending', 'pending': 'pending', 'nouveau': 'pending', 'new': 'pending',
            'à traiter': 'pending', 'a traiter': 'pending', 'en cours': 'pending', 'processing': 'pending',
            'en attente de paiement': 'pending', 'attente paiement': 'pending', 'en validation': 'pending',
            'confirmé': 'confirmed', 'confirmed': 'confirmed', 'confirme': 'confirmed',
            'validé': 'confirmed', 'valide': 'confirmed', 'accepté': 'confirmed', 'accepte': 'confirmed',
            'approuvé': 'confirmed', 'approuve': 'confirmed',
            'expédié': 'shipped', 'shipped': 'shipped', 'expedie': 'shipped', 'envoyé': 'shipped', 'envoye': 'shipped',
            'en livraison': 'shipped', 'en route': 'shipped', 'en transit': 'shipped',
            'en cours de livraison': 'shipped', 'transporté': 'shipped', 'transporte': 'shipped',
            'livré': 'delivered', 'delivered': 'delivered', 'livre': 'delivered',
            'reçu': 'delivered', 'recu': 'delivered', 'livraison effectuée': 'delivered',
            'livraison terminée': 'delivered', 'remis': 'delivered', 'remis client': 'delivered',
            'retour': 'returned', 'returned': 'returned', 'retourné': 'returned', 'retourne': 'returned',
            'retour client': 'returned', 'retour marchandise': 'returned', 'retour produit': 'returned',
            'remboursé': 'returned', 'rembourse': 'returned', 'échange': 'returned', 'echange': 'returned',
            'annulé': 'cancelled', 'cancelled': 'cancelled', 'canceled': 'cancelled', 'annule': 'cancelled',
            'abandonné': 'cancelled', 'abandonne': 'cancelled', 'refusé': 'cancelled', 'refuse': 'cancelled',
            'rejeté': 'cancelled', 'rejete': 'cancelled',
            'injoignable': 'unreachable', 'unreachable': 'unreachable', 'injoignabl': 'unreachable',
            'non joignable': 'unreachable', 'non joignabl': 'unreachable', 'téléphone injoignable': 'unreachable',
            'tel injoignable': 'unreachable', 'pas de réponse': 'unreachable', 'absence réponse': 'unreachable',
            'client injoignable': 'unreachable', 'contact impossible': 'unreachable',
            'appelé': 'called', 'called': 'called', 'appele': 'called', 'contacté': 'called',
            'contacte': 'called', 'appel effectué': 'called', 'appel terminé': 'called',
            'client appelé': 'called', 'tentative appel': 'called',
            'reporté': 'postponed', 'postponed': 'postponed', 'reporte': 'postponed',
            'différé': 'postponed', 'differe': 'postponed', 'plus tard': 'postponed',
            'reporté demande': 'postponed', 'reporté client': 'postponed', 'ajourné': 'postponed',
            'ajourne': 'postponed'
          };

          // Fonction de mapping intelligent avec reconnaissance par mots-clés
          const statusKeywords = {
            'pending': ['attente', 'nouveau', 'new', 'traiter', 'processing', 'validation', 'en cours'],
            'confirmed': ['confirm', 'valid', 'accept', 'approuv'],
            'shipped': ['expedi', 'envoy', 'livraison', 'route', 'transit', 'transport'],
            'delivered': ['livr', 'reçu', 'recu', 'remis', 'termin'],
            'returned': ['retour', 'rembours', 'échange', 'echange', 'refund'],
            'cancelled': ['annul', 'abandon', 'refus', 'rejet', 'cancel'],
            'unreachable': ['injoign', 'joign', 'réponse', 'reponse'],
            'called': ['appel', 'téléphon', 'telephon'],
            'postponed': ['report', 'différ', 'tard', 'ajourn']
          };
          const intelligentStatusMapping = (normalized, raw) => {
            if (!normalized || normalized === '') return 'pending';
            if (statusMap[normalized]) return statusMap[normalized];
            for (const [mapped, kwList] of Object.entries(statusKeywords)) {
              for (const kw of kwList) {
                if (normalized.includes(kw)) return mapped;
              }
            }
            return 'pending';
          };

          // Track seen orderIds to prevent duplicates within same sync batch
          const seenOrderIds = new Set();

          syncProgressEmitter.emit('progress', {
            workspaceId: req.workspaceId,
            sourceId,
            current: 35,
            total: 100,
            status: '⚙️ Traitement des commandes...',
            percentage: 35
          });

          for (let i = dataStartIndex; i < table.rows.length; i++) {
            const row = table.rows[i];
            if (!row.c || row.c.every(cell => !cell || !cell.v)) continue;

            // Émettre progression toutes les 5% des lignes
            const progress = 35 + Math.floor(((i - dataStartIndex) / (table.rows.length - dataStartIndex)) * 40);
            if (i % Math.max(1, Math.ceil((table.rows.length - dataStartIndex) / 20)) === 0) {
              syncProgressEmitter.emit('progress', {
                workspaceId: req.workspaceId,
                sourceId,
                current: progress,
                total: 100,
                status: `⚙️ Traitement des commandes... ${i - dataStartIndex + 1}/${table.rows.length - dataStartIndex}`,
                percentage: progress
              });
            }

            const getVal = (field) => {
              const idx = columnMap[field];
              if (idx === undefined || !row.c[idx]) return '';
              const cell = row.c[idx];
              return cell.f || (cell.v != null ? String(cell.v) : '');
            };

            const getNumVal = (field) => {
              const idx = columnMap[field];
              if (idx === undefined || !row.c[idx]) return 0;
              return parseFloat(row.c[idx].v) || 0;
            };

            const getDateVal = (field) => {
              const idx = columnMap[field];
              if (idx === undefined || !row.c[idx]) return new Date();
              const cell = row.c[idx];
              // Google Visualization API: Date(year, month, day) — month is 0-indexed, may have spaces
              if (typeof cell.v === 'string' && cell.v.startsWith('Date(')) {
                const parts = cell.v.match(/Date\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
                if (parts) return new Date(parseInt(parts[1]), parseInt(parts[2]), parseInt(parts[3]));
              }
              // Google Sheets serial date number (days since Dec 30, 1899)
              if (typeof cell.v === 'number' && cell.v > 10000 && cell.v < 100000) {
                const epoch = new Date(1899, 11, 30);
                return new Date(epoch.getTime() + cell.v * 86400000);
              }
              // Use formatted value first (cell.f), then raw value
              return parseFlexDate(cell.f || (cell.v != null ? String(cell.v) : ''));
            };

            const rawData = {};
            headers.forEach((header, idx) => {
              if (header && row.c[idx]) {
                const cell = row.c[idx];
                rawData[header] = cell.f || (cell.v != null ? String(cell.v) : '');
              }
            });

            const rowId = `source_${sourceToSync._id}_row_${i + 2}`;
            let rawStatus = getVal('status') || '';
            
            // Fallback: if status column not mapped, try to find status in rawData
            if (!rawStatus && rawData && typeof rawData === 'object') {
              const statusEntry = Object.entries(rawData).find(([k]) => {
                const nk = k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                return nk.includes('statut') || nk.includes('status') || nk.includes('etat') || nk === 'state';
              });
              if (statusEntry && statusEntry[1]) {
                rawStatus = statusEntry[1];
              }
            }
            
            const normalizedStatus = rawStatus.toString().toLowerCase().trim();
            const mappedStatus = intelligentStatusMapping(normalizedStatus, rawStatus);
            
            // Debug: log first 3 rows to verify status mapping
            if (i - dataStartIndex < 3) {
              console.log(`🔍 [${syncId}] Row ${i+2}: rawStatus="${rawStatus}" → normalized="${normalizedStatus}" → mapped="${mappedStatus}" | columnMap.status=${columnMap.status}`);
            }
            
            // Statistiques de mapping
            statusStats[mappedStatus] = (statusStats[mappedStatus] || 0) + 1;
            if (mappedStatus === 'pending' && normalizedStatus !== '' && !statusMap[normalizedStatus]) {
              unrecognizedStatuses.add(rawStatus);
            }

            const orderId = getVal('orderId') || `#${sourceToSync.name}_${i + 2}`;

            // Dedup: skip if this orderId was already processed in this batch
            if (seenOrderIds.has(orderId)) {
              console.log(`⚠️ [${syncId}] Doublon détecté dans le sheet, orderId: ${orderId}, ligne ${i + 2} ignorée`);
              continue;
            }
            seenOrderIds.add(orderId);

            const rawCity = getVal('city');
            const rawAddress = getVal('address');

            const doc = {
              orderId,
              date: getDateVal('date'),
              clientName: getVal('clientName'),
              clientPhone: getVal('clientPhone'),
              city: rawCity || rawAddress,
              address: rawAddress,
              product: getVal('product'),
              quantity: parseInt(getNumVal('quantity')) || 1,
              price: getNumVal('price'),
              status: mappedStatus,
              tags: [sourceToSync.name],
              notes: getVal('notes'),
              rawData
            };

            // Check if order already exists (by rowId first, then by orderId)
            const existingOrder = existingByRowId.get(rowId) || existingByOrderId.get(orderId);

            // Si la commande existe et que le statut a été modifié manuellement, ne pas écraser le statut
            if (existingOrder && existingOrder.statusModifiedManually) {
              delete doc.status;
            }

            // Use orderId + workspaceId as primary dedup key when orderId is a real value (not auto-generated)
            const isRealOrderId = getVal('orderId') && getVal('orderId').trim() !== '';
            const filterKey = isRealOrderId
              ? { workspaceId: req.workspaceId, orderId }
              : { workspaceId: req.workspaceId, sheetRowId: rowId };

            bulkOps.push({
              updateOne: {
                filter: filterKey,
                update: { $set: { ...doc, workspaceId: req.workspaceId, sheetRowId: rowId, source: 'google_sheets' } },
                upsert: true
              }
            });
          }

          if (bulkOps.length > 0) {
            console.log(`💾 [${syncId}] Bulk write de ${bulkOps.length} opérations...`);
            
            // Vérifier si annulé avant le bulk write
            if (req.signal?.aborted) {
              console.log(`🚫 [${syncId}] Sync annulée avant bulk write`);
              return res.status(499).json({ success: false, message: 'Synchronisation annulée' });
            }
            
            // Émettre progression: sauvegarde
            syncProgressEmitter.emit('progress', {
              workspaceId: req.workspaceId,
              sourceId,
              current: 80,
              total: 100,
              status: '💾 Sauvegarde des commandes dans la base...',
              percentage: 80
            });
            
            const result = await Order.bulkWrite(bulkOps);
            totalImported += result.upsertedCount || 0;
            totalUpdated += result.modifiedCount || 0;
            console.log(`✅ [${syncId}] Bulk write terminé: ${result.upsertedCount} insérés, ${result.modifiedCount} modifiés`);
            
            // Émettre progression: notifications
            syncProgressEmitter.emit('progress', {
              workspaceId: req.workspaceId,
              sourceId,
              current: 90,
              total: 100,
              status: '📱 Envoi des notifications WhatsApp...',
              percentage: 90
            });
            
            // Notifications pour nouvelles commandes
            if (result.upsertedCount > 0) {
              const newOrders = [];
              for (const op of bulkOps) {
                if (op.updateOne.upsert && op.updateOne.filter.sheetRowId) {
                  newOrders.push(op.updateOne.filter.sheetRowId);
                }
              }
              
              if (newOrders.length > 0) {
                const latestOrder = await Order.findOne({
                  workspaceId: req.workspaceId,
                  sheetRowId: { $in: newOrders },
                  status: { $in: ['pending', 'confirmed'] },
                  whatsappNotificationSent: { $ne: true }
                })
                .sort({ date: -1 })
                .populate('assignedLivreur', 'name email phone');
                
                if (latestOrder) {
                  await notifyLivreursOfNewOrder(latestOrder, req.workspaceId);
                  await sendOrderToCustomNumber(latestOrder, req.workspaceId);
                  
                  latestOrder.whatsappNotificationSent = true;
                  latestOrder.whatsappNotificationSentAt = new Date();
                  await latestOrder.save();
                  
                  console.log(`📱 [${syncId}] WhatsApp envoyé pour commande: #${latestOrder.orderId}`);
                }
              }
            }
          }

          // Afficher les statistiques de mapping des statuts
          console.log(`📊 [${syncId}] Statistiques de mapping des statuts:`);
          Object.entries(statusStats).forEach(([status, count]) => {
            console.log(`   ${status}: ${count} commandes`);
          });
          
          if (unrecognizedStatuses.size > 0) {
            console.log(`⚠️ [${syncId}] Statuts non reconnus (${unrecognizedStatuses.size}):`, Array.from(unrecognizedStatuses));
          }

          // Update source stats
          if (sourceToSync._id !== 'legacy') {
            const s = settings.sources.id(sourceToSync._id);
            if (s) {
              s.lastSyncAt = new Date();
              s.detectedHeaders = headers.filter(h => h);
              s.detectedColumns = columnMap;
            }
          } else {
            settings.googleSheets.lastSyncAt = new Date();
            settings.googleSheets.detectedHeaders = headers.filter(h => h);
            settings.googleSheets.detectedColumns = columnMap;
          }
        }

      } catch (err) {
        console.error(`❌ [${syncId}] Erreur sync source ${sourceToSync.name}:`, err);
        syncError = err.message;
      }
    }

    // Émettre progression: finalisation
    syncProgressEmitter.emit('progress', {
      workspaceId: req.workspaceId,
      sourceId,
      current: 95,
      total: 100,
      status: '� Finalisation de la synchronisation...',
      percentage: 95
    });
    
    // Sauvegarder les settings
    settings.markModified('sources');
    settings.markModified('googleSheets');
    await settings.save();
    
    // �🔓 NETTOYAGE LOCK
    try {
      const settings = await WorkspaceSettings.findOne({ workspaceId: req.workspaceId });
      if (settings && settings.syncLocks) {
        settings.syncLocks = settings.syncLocks.filter(lock => lock.key !== lockKey);
        await settings.save();
        console.log(`🔓 [${syncId}] Lock libéré`);
      }
    } catch (cleanupError) {
      console.error(`❌ [${syncId}] Erreur nettoyage lock:`, cleanupError);
    }

    const duration = Math.floor((Date.now() - startTime) / 1000);
    
    if (syncError) {
      console.log(`❌ [${syncId}] Sync échouée après ${duration}s:`, syncError);
      return res.status(500).json({ 
        success: false, 
        message: `Erreur synchronisation: ${syncError}`,
        duration,
        sourceId
      });
    }

    console.log(`✅ [${syncId}] Sync réussie en ${duration}s: ${totalImported} importées, ${totalUpdated} mises à jour`);
    
    // Émettre progression: terminé
    syncProgressEmitter.emit('progress', {
      workspaceId: req.workspaceId,
      sourceId,
      current: 100,
      total: 100,
      status: `✅ Terminé! ${totalImported} nouvelles commandes, ${totalUpdated} mises à jour`,
      percentage: 100,
      completed: true
    });
    
    // 📱 Envoyer notification push de synchronisation terminée
    try {
      // Importer le service push
      const { sendPushNotification } = await import('../../services/pushService.js');
      
      await sendPushNotification(req.workspaceId, {
        title: '📊 Synchronisation terminée',
        body: `${totalImported} nouvelles commandes importées, ${totalUpdated} mises à jour`,
        icon: '/icons/sync-success.png',
        badge: '/icons/badge.png',
        tag: 'sync-completed',
        data: {
          type: 'sync-completed',
          sourceId,
          imported: totalImported,
          updated: totalUpdated,
          duration: Math.floor((Date.now() - startTime) / 1000)
        },
        actions: [
          {
            action: 'view-orders',
            title: 'Voir les commandes'
          },
          {
            action: 'dismiss',
            title: 'Fermer'
          }
        ]
      });
      
      console.log(`📱 [${syncId}] Notification push envoyée pour la synchronisation`);
    } catch (pushError) {
      console.error(`❌ [${syncId}] Erreur notification push:`, pushError);
      // Ne pas échouer la sync si la notification échoue
    }
    
    res.json({
      success: true,
      message: `Synchronisation terminée: ${totalImported} nouvelles commandes, ${totalUpdated} mises à jour.`,
      data: { 
        imported: totalImported, 
        updated: totalUpdated, 
        duration,
        sourceId,
        sourceName: sourceToSync.name
      }
    });

  } catch (error) {
    console.error(`💥 [${syncId}] Erreur critique sync:`, error);
    
    // 🔓 NETTOYAGE LOCK EN CAS D'ERREUR
    try {
      const sourceIdForCleanup = req.body?.sourceId || 'unknown';
      const lockKey = `sync_lock_${req.workspaceId}_${sourceIdForCleanup}`;
      const settings = await WorkspaceSettings.findOne({ workspaceId: req.workspaceId });
      if (settings && settings.syncLocks) {
        settings.syncLocks = settings.syncLocks.filter(lock => lock.key !== lockKey);
        await settings.save();
        console.log(`🔓 [${syncId}] Lock d'urgence libéré`);
      }
    } catch (cleanupError) {
      console.error(`❌ [${syncId}] Erreur nettoyage lock:`, cleanupError);
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Erreur critique lors de la synchronisation: ' + error.message 
    });
  }
});


// GET /api/ecom/orders/sync-progress - Endpoint SSE pour suivre la progression
router.get('/sync-progress', requireEcomAuth, async (req, res) => {
  const { workspaceId, sourceId } = req.query;
  
  console.log(`📡 SSE connecté - Workspace: ${workspaceId}, Source: ${sourceId}`);
  
  // Configuration SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });
  
  // Envoyer la progression initiale immédiatement
  const initialData = {
    current: 1,
    total: 100,
    status: 'Initialisation...',
    percentage: 1,
    workspaceId,
    sourceId
  };
  
  console.log('📤 Envoi progression initiale:', initialData);
  res.write(`data: ${JSON.stringify(initialData)}\n\n`);
  
  // Écouter les événements de progression
  const progressKey = `${workspaceId}_${sourceId}`;
  console.log(`🔑 Clé d'écoute: ${progressKey}`);
  
  const progressHandler = (data) => {
    console.log(`📡 Événement reçu pour ${progressKey}:`, data);
    
    if (data.workspaceId === workspaceId && data.sourceId === sourceId) {
      console.log('📤 Envoi progression au client:', data);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      
      if (data.completed) {
        console.log('✅ Progression terminée, fermeture SSE');
        setTimeout(() => {
          res.end();
        }, 1000);
      }
    }
  };
  
  // S'abonner aux événements
  syncProgressEmitter.on('progress', progressHandler);
  console.log(`👂 Abonné aux événements pour ${progressKey}`);
  
  // Envoyer un heartbeat toutes les 30 secondes pour maintenir la connexion
  const heartbeatInterval = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);
  
  // Nettoyer quand le client se déconnecte
  req.on('close', () => {
    console.log(`❌ Client déconnecté de ${progressKey}`);
    syncProgressEmitter.off('progress', progressHandler);
    clearInterval(heartbeatInterval);
  });
  
  // Timeout de connexion (2 minutes)
  setTimeout(() => {
    if (!res.closed) {
      console.log(`⏰ Timeout SSE pour ${progressKey}`);
      res.end();
    }
  }, 120000);
});


// GET /api/ecom/orders/settings - Récupérer la config et les sources
router.get('/settings', requireEcomAuth, validateEcomAccess('products', 'write'), async (req, res) => {
  try {
    console.log('📋 GET /orders/settings - Récupération config et sources');
    console.log('👤 Utilisateur:', req.ecomUser?.email);
    console.log('🏢 WorkspaceId utilisé:', req.workspaceId);
    console.log('🎭 Mode incarnation:', req.user?.workspaceId ? 'OUI' : 'NON');
    
    let settings = await WorkspaceSettings.findOne({ workspaceId: req.workspaceId });
    console.log('📊 Settings trouvés:', settings ? 'OUI' : 'NON');
    
    if (!settings) {
      console.log('📝 Création nouveaux settings pour workspace:', req.workspaceId);
      settings = await WorkspaceSettings.create({ workspaceId: req.workspaceId });
    }
    
    console.log('📋 Sources trouvées:', settings.sources?.length || 0);
    console.log('📋 Sources:', settings.sources);
    
    res.json({ 
      success: true, 
      data: {
        googleSheets: settings.googleSheets,
        sources: settings.sources || []
      } 
    });
  } catch (error) {
    console.error('Erreur get settings:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/ecom/orders/sources - Ajouter une nouvelle source Google Sheets
router.post('/sources', requireEcomAuth, validateEcomAccess('products', 'write'), async (req, res) => {
  try {
    const { name, spreadsheetId, sheetName } = req.body;
    if (!name || !spreadsheetId) {
      return res.status(400).json({ success: false, message: 'Nom et ID du sheet requis' });
    }

    let settings = await WorkspaceSettings.findOne({ workspaceId: req.workspaceId });
    if (!settings) {
      settings = new WorkspaceSettings({ workspaceId: req.workspaceId });
    }

    settings.sources.push({ name, spreadsheetId, sheetName: sheetName || 'Sheet1' });
    await settings.save();

    res.json({ success: true, message: 'Source ajoutée', data: settings.sources[settings.sources.length - 1] });
  } catch (error) {
    console.error('Erreur add source:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/ecom/orders/sources/:sourceId - Modifier une source
router.put('/sources/:sourceId', requireEcomAuth, validateEcomAccess('products', 'write'), async (req, res) => {
  try {
    const { name, spreadsheetId, sheetName, isActive } = req.body;
    const settings = await WorkspaceSettings.findOne({ workspaceId: req.workspaceId });
    if (!settings) return res.status(404).json({ success: false, message: 'Paramètres non trouvés' });

    const source = settings.sources.id(req.params.sourceId);
    if (!source) return res.status(404).json({ success: false, message: 'Source non trouvée' });

    if (name !== undefined) source.name = name;
    if (spreadsheetId !== undefined) source.spreadsheetId = spreadsheetId;
    if (sheetName !== undefined) source.sheetName = sheetName;
    if (isActive !== undefined) source.isActive = isActive;

    await settings.save();
    res.json({ success: true, message: 'Source mise à jour', data: source });
  } catch (error) {
    console.error('Erreur update source:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/ecom/orders/sources/:sourceId - Supprimer une source Google Sheets
router.delete('/sources/:sourceId', requireEcomAuth, validateEcomAccess('products', 'write'), async (req, res) => {
  try {
    const { sourceId } = req.params;

    if (sourceId === 'legacy') {
      return res.status(400).json({ 
        success: false, 
        message: 'Pour supprimer la source par défaut, utilisez DELETE /api/ecom/orders/sources/legacy/confirm' 
      });
    }

    const settings = await WorkspaceSettings.findOne({ workspaceId: req.workspaceId });
    if (!settings || !settings.sources) {
      return res.status(404).json({ success: false, message: 'Source non trouvée.' });
    }

    const sourceIndex = settings.sources.findIndex(s => String(s._id) === sourceId);
    if (sourceIndex === -1) {
      return res.status(404).json({ success: false, message: 'Source non trouvée.' });
    }

    const deletedSource = settings.sources[sourceIndex];
    settings.sources.splice(sourceIndex, 1);
    await settings.save();

    const deleteResult = await Order.deleteMany({
      workspaceId: req.workspaceId,
      sheetRowId: { $regex: `^source_${sourceId}_` }
    });

    res.json({
      success: true,
      message: `Source "${deletedSource.name}" supprimée avec succès ainsi que ${deleteResult.deletedCount} commande(s)`,
      data: { deletedSource, deletedOrders: deleteResult.deletedCount }
    });
  } catch (error) {
    console.error('Erreur delete source:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/ecom/orders/settings - Sauvegarder la config Google Sheets
router.put('/settings', requireEcomAuth, validateEcomAccess('products', 'write'), async (req, res) => {
  try {
    const { spreadsheetId, sheetName } = req.body;

    let settings = await WorkspaceSettings.findOne({ workspaceId: req.workspaceId });
    if (!settings) {
      settings = new WorkspaceSettings({ workspaceId: req.workspaceId });
    }

    if (spreadsheetId !== undefined) settings.googleSheets.spreadsheetId = spreadsheetId;
    if (sheetName !== undefined) settings.googleSheets.sheetName = sheetName;

    await settings.save();
    res.json({ success: true, message: 'Configuration sauvegardée', data: settings.googleSheets });
  } catch (error) {
    console.error('Erreur save settings:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/ecom/orders/settings/push-notifications - Récupérer les préférences de notifications push
router.get('/settings/push-notifications', requireEcomAuth, async (req, res) => {
  try {
    let settings = await WorkspaceSettings.findOne({ workspaceId: req.workspaceId });
    if (!settings) {
      settings = new WorkspaceSettings({ workspaceId: req.workspaceId });
      await settings.save();
    }

    res.json({ 
      success: true, 
      data: settings.pushNotifications || {
        push_new_orders: true,
        push_status_changes: true,
        push_deliveries: true,
        push_stock_updates: true,
        push_low_stock: true,
        push_sync_completed: true
      }
    });
  } catch (error) {
    console.error('Erreur get push notifications settings:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/ecom/orders/settings/push-notifications - Mettre à jour les préférences de notifications push
router.put('/settings/push-notifications', requireEcomAuth, async (req, res) => {
  try {
    const { push_new_orders, push_status_changes, push_deliveries, push_stock_updates, push_low_stock, push_sync_completed } = req.body;

    let settings = await WorkspaceSettings.findOne({ workspaceId: req.workspaceId });
    if (!settings) {
      settings = new WorkspaceSettings({ workspaceId: req.workspaceId });
    }

    if (!settings.pushNotifications) {
      settings.pushNotifications = {};
    }

    if (push_new_orders !== undefined) settings.pushNotifications.push_new_orders = push_new_orders;
    if (push_status_changes !== undefined) settings.pushNotifications.push_status_changes = push_status_changes;
    if (push_deliveries !== undefined) settings.pushNotifications.push_deliveries = push_deliveries;
    if (push_stock_updates !== undefined) settings.pushNotifications.push_stock_updates = push_stock_updates;
    if (push_low_stock !== undefined) settings.pushNotifications.push_low_stock = push_low_stock;
    if (push_sync_completed !== undefined) settings.pushNotifications.push_sync_completed = push_sync_completed;

    await settings.save();
    res.json({ success: true, message: 'Préférences de notifications push sauvegardées', data: settings.pushNotifications });
  } catch (error) {
    console.error('Erreur save push notifications settings:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/ecom/orders/backfill-clients - Créer les clients/prospects depuis toutes les commandes existantes
router.post('/backfill-clients', requireEcomAuth, validateEcomAccess('products', 'write'), async (req, res) => {
  try {
    // Mapper statut commande → statut client + tag
    const statusMap = {
      delivered: { clientStatus: 'delivered', tag: 'Client' },
      pending: { clientStatus: 'prospect', tag: 'En attente' },
      confirmed: { clientStatus: 'confirmed', tag: 'Confirmé' },
      shipped: { clientStatus: 'confirmed', tag: 'Expédié' },
      cancelled: { clientStatus: 'prospect', tag: 'Annulé' },
      returned: { clientStatus: 'returned', tag: 'Retour' }
    };
    // Priorité des statuts (un client livré ne doit pas redevenir prospect)
    const statusPriority = { prospect: 1, confirmed: 2, returned: 3, delivered: 4, blocked: 5 };

    const allOrders = await Order.find({ workspaceId: req.workspaceId, status: { $in: Object.keys(statusMap) } });
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const order of allOrders) {
      if (!order.clientName) { skipped++; continue; }

      const phone = (order.clientPhone || '').trim();
      const nameParts = (order.clientName || '').trim().split(/\s+/);
      const firstName = nameParts[0] || 'Client';
      const lastName = nameParts.slice(1).join(' ') || '';
      const orderTotal = (order.price || 0) * (order.quantity || 1);
      const mapping = statusMap[order.status] || statusMap.pending;

      let existingClient = null;
      if (phone) {
        existingClient = await Client.findOne({ workspaceId: req.workspaceId, phone });
      }
      if (!existingClient && firstName) {
        existingClient = await Client.findOne({ workspaceId: req.workspaceId, firstName: { $regex: `^${firstName}$`, $options: 'i' }, lastName: { $regex: `^${lastName}$`, $options: 'i' } });
      }

      const productName = getOrderProductName(order);

      if (existingClient) {
        existingClient.totalOrders = (existingClient.totalOrders || 0) + 1;
        existingClient.totalSpent = (existingClient.totalSpent || 0) + orderTotal;
        // Ne pas rétrograder le statut (livré > confirmé > prospect)
        if ((statusPriority[mapping.clientStatus] || 0) > (statusPriority[existingClient.status] || 0)) {
          existingClient.status = mapping.clientStatus;
        }
        existingClient.lastContactAt = order.date || order.createdAt || new Date();
        if (order.city && !existingClient.city) existingClient.city = order.city;
        if (mapping.tag && !existingClient.tags.includes(mapping.tag)) existingClient.tags.push(mapping.tag);
        if (productName && !(existingClient.products || []).includes(productName)) {
          existingClient.products = [...(existingClient.products || []), productName];
        }
        await existingClient.save();
        updated++;
      } else {
        await Client.create({
          workspaceId: req.workspaceId,
          firstName,
          lastName,
          phone,
          city: order.city || '',
          address: order.deliveryLocation || '',
          source: 'other',
          status: mapping.clientStatus,
          totalOrders: 1,
          totalSpent: orderTotal,
          products: productName ? [productName] : [],
          tags: [mapping.tag],
          lastContactAt: order.date || order.createdAt || new Date(),
          createdBy: req.ecomUser._id
        });
        created++;
      }
    }

    res.json({
      success: true,
      message: `Backfill terminé: ${created} créés, ${updated} mis à jour, ${skipped} ignorés (sans nom) sur ${allOrders.length} commandes`,
      data: { created, updated, skipped, total: allOrders.length }
    });
  } catch (error) {
    console.error('Erreur backfill clients:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/ecom/orders/available - Commandes disponibles pour les livreurs
router.get('/available', requireEcomAuth, async (req, res) => {
  try {
    const { city, limit = 20 } = req.query;
    
    // Filtre pour les commandes disponibles (non assignées et en attente/confirmées)
    const filter = {
      workspaceId: req.workspaceId,
      status: { $in: ['pending', 'confirmed'] },
      assignedLivreur: null
    };
    
    if (city) {
      filter.city = { $regex: city, $options: 'i' };
    }
    
    const orders = await Order.find(filter)
      .sort({ date: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Erreur get available orders:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/ecom/orders/:id/assign - Assigner une commande à un livreur
router.post('/:id/assign', requireEcomAuth, async (req, res) => {
  try {
    const orderId = req.params.id;
    const livreurId = req.user._id; // L'utilisateur connecté devient le livreur
    
    // Vérifier que l'utilisateur est un livreur
    if (req.user.role !== 'livreur') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux livreurs.' });
    }
    
    const order = await Order.findOneAndUpdate(
      { 
        _id: orderId, 
        workspaceId: req.workspaceId,
        assignedLivreur: null, // Non encore assignée
        status: { $in: ['pending', 'confirmed'] } // Disponible
      },
      { 
        assignedLivreur: livreurId,
        status: 'confirmed' // Marquer comme confirmée quand assignée
      },
      { new: true }
    ).populate('assignedLivreur', 'name email phone');
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande non disponible ou déjà assignée.' });
    }
    
    // Notifier les autres livreurs que cette commande n'est plus disponible
    await notifyOrderTaken(order, req.workspaceId, req.user._id);
    
    // 📱 Push notification pour assignation livreur
    try {
      const { sendPushNotification } = await import('../../services/pushService.js');
      await sendPushNotification(req.workspaceId, {
        title: '🚚 Commande assignée',
        body: `${order.orderId} assignée à un livreur - ${order.clientName || order.clientPhone}`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'order-assigned',
        data: {
          type: 'order_assigned',
          orderId: order._id.toString(),
          url: `/orders/${order._id}`
        }
      }, 'push_deliveries');
    } catch (e) {
      console.warn('⚠️ Push notification failed:', e.message);
    }
    
    res.json({ 
      success: true, 
      message: 'Commande assignée avec succès',
      data: order 
    });
  } catch (error) {
    console.error('Erreur assign order:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/ecom/orders/:id - Modifier une commande (statut, champs, auto-tagging, client sync)
router.put('/:id', requireEcomAuth, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, workspaceId: req.workspaceId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    const allowedFields = ['status', 'notes', 'clientName', 'clientPhone', 'city', 'address', 'product', 'quantity', 'price', 'deliveryLocation', 'deliveryTime', 'tags', 'assignedLivreur'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) order[field] = req.body[field];
    });

    // Marquer le statut comme modifié manuellement
    if (req.body.status !== undefined) {
      order.statusModifiedManually = true;
      order.lastManualStatusUpdate = new Date();
    }

    // Auto-tagging basé sur le statut
    if (req.body.status) {
      const statusTags = { pending: 'En attente', confirmed: 'Confirmé', shipped: 'Expédié', delivered: 'Client', returned: 'Retour', cancelled: 'Annulé', unreachable: 'Injoignable', called: 'Appelé', postponed: 'Reporté' };
      const allStatusTags = Object.values(statusTags);
      // Retirer les anciens tags de statut, garder les tags manuels
      order.tags = (order.tags || []).filter(t => !allStatusTags.includes(t));
      // Ajouter le nouveau tag
      const newTag = statusTags[req.body.status] || req.body.status;
      if (newTag && !order.tags.includes(newTag)) {
        order.tags.push(newTag);
      }
    }

    await order.save();

    // Notification interne sur changement de statut
    if (req.body.status) {
      notifyOrderStatus(req.workspaceId, order, req.body.status).catch(() => {});
      
      // Notification d'équipe (exclure l'acteur)
      notifyTeamOrderStatusChanged(req.workspaceId, req.ecomUser._id, order, req.body.status, req.ecomUser.email).catch(() => {});
      
      // 📱 Push notification pour changement de statut
      try {
        const { sendPushNotification } = await import('../../services/pushService.js');
        const statusEmojis = {
          pending: '⏳', confirmed: '✅', shipped: '📦', 
          delivered: '🎉', returned: '↩️', cancelled: '❌',
          unreachable: '📵', called: '📞', postponed: '⏰'
        };
        const statusLabels = {
          pending: 'En attente', confirmed: 'Confirmée', shipped: 'Expédiée',
          delivered: 'Livrée', returned: 'Retournée', cancelled: 'Annulée',
          unreachable: 'Injoignable', called: 'Appelée', postponed: 'Reportée'
        };
        await sendPushNotification(req.workspaceId, {
          title: `${statusEmojis[req.body.status] || '📋'} Commande ${statusLabels[req.body.status] || req.body.status}`,
          body: `${order.orderId} - ${order.clientName || order.clientPhone}`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'order-status',
          data: {
            type: 'order_status_change',
            orderId: order._id.toString(),
            status: req.body.status,
            url: `/orders/${order._id}`
          }
        }, 'push_status_changes');
      } catch (e) {
        console.warn('⚠️ Push notification failed:', e.message);
      }
    }

    res.json({ success: true, message: 'Commande mise à jour', data: order });
  } catch (error) {
    console.error('Erreur update order:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/ecom/orders/:id - Supprimer une commande
router.delete('/:id', requireEcomAuth, validateEcomAccess('products', 'write'), async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({ _id: req.params.id, workspaceId: req.workspaceId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }
    res.json({ success: true, message: 'Commande supprimée' });
  } catch (error) {
    console.error('Erreur delete order:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/ecom/orders/fix-statuses - Corriger les statuts en français
router.get('/fix-statuses', requireEcomAuth, validateEcomAccess('products', 'write'), async (req, res) => {
  try {
    const statusMapping = {
      'livré': 'delivered', 'livre': 'delivered', 'LIVRÉ': 'delivered', 'LIVRE': 'delivered',
      'en attente': 'pending', 'attente': 'pending', 'EN ATTENTE': 'pending',
      'confirmé': 'confirmed', 'confirme': 'confirmed', 'CONFIRMÉ': 'confirmed', 'CONFIRME': 'confirmed',
      'expédié': 'shipped', 'expedie': 'shipped', 'EXPÉDIÉ': 'shipped', 'EXPEDIE': 'shipped',
      'retour': 'returned', 'retourné': 'returned', 'RETOUR': 'returned', 'RETournÉ': 'returned',
      'annulé': 'cancelled', 'annule': 'cancelled', 'ANNULÉ': 'cancelled', 'ANNULE': 'cancelled',
      'injoignable': 'unreachable', 'INJOIGNABLE': 'unreachable',
      'appelé': 'called', 'appele': 'called', 'APPELÉ': 'called', 'APPELE': 'called',
      'reporté': 'postponed', 'reporte': 'postponed', 'REPORTÉ': 'postponed', 'REPORTE': 'postponed'
    };
    
    let totalUpdated = 0;
    const updateResults = [];
    
    for (const [oldStatus, newStatus] of Object.entries(statusMapping)) {
      const result = await Order.updateMany(
        { workspaceId: req.workspaceId, status: oldStatus },
        { status: newStatus }
      );
      
      if (result.modifiedCount > 0) {
        totalUpdated += result.modifiedCount;
        updateResults.push({ oldStatus, newStatus, count: result.modifiedCount });
        console.log(`✅ ${oldStatus} -> ${newStatus}: ${result.modifiedCount} commandes`);
      }
    }
    
    res.json({ 
      success: true, 
      message: `${totalUpdated} commandes mises à jour`,
      data: {
        totalUpdated,
        updates: updateResults
      }
    });
  } catch (error) {
    console.error('Erreur fix statuses:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/ecom/orders/:id - Détails d'une commande spécifique
router.get('/:id', requireEcomAuth, async (req, res) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.id, 
      workspaceId: req.workspaceId 
    })
    .populate('assignedLivreur', 'name email phone');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée.' });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Erreur get order detail:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/ecom/orders/:id/send-whatsapp - Envoyer les détails d'une commande par WhatsApp
router.post('/:id/send-whatsapp', requireEcomAuth, validateEcomAccess('products', 'write'), async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Numéro de téléphone requis' });
    }

    // Récupérer la commande
    const order = await Order.findOne({ 
      _id: req.params.id, 
      workspaceId: req.workspaceId 
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée.' });
    }

    // Formater le message WhatsApp avec tous les détails
    const whatsappMessage = `📦 *DÉTAILS COMMANDE*\n\n` +
      `🔢 *Référence:* #${order.orderId}\n` +
      `📅 *Date:* ${new Date(order.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}\n` +
      `⏰ *Heure:* ${new Date(order.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n\n` +
      `👤 *INFORMATIONS CLIENT*\n` +
      `👤 *Nom:* ${order.clientName}\n` +
      `📞 *Téléphone:* ${order.clientPhone}\n` +
      `📍 *Ville:* ${order.city}\n` +
      `${order.deliveryLocation ? `🏠 *Adresse:* ${order.deliveryLocation}\n` : ''}` +
      `${order.deliveryTime ? `⏰ *Heure livraison:* ${order.deliveryTime}\n` : ''}\n\n` +
      `📦 *DÉTAILS COMMANDE*\n` +
      `📦 *Produit:* ${order.product}\n` +
      `🔢 *Quantité:* ${order.quantity}\n` +
      `💰 *Prix unitaire:* ${order.price} FCFA\n` +
      `💰 *Total:* ${order.price * order.quantity} FCFA\n\n` +
      `📋 *STATUT:* ${order.status === 'pending' ? '⏳ En attente' : 
                      order.status === 'confirmed' ? '✅ Confirmé' : 
                      order.status === 'shipped' ? '🚚 Expédié' : 
                      order.status === 'delivered' ? '✅ Livré' : 
                      order.status === 'cancelled' ? '❌ Annulé' : order.status}\n\n` +
      `${order.notes ? `📝 *Notes:* ${order.notes}\n\n` : ''}` +
      `🔗 *Envoyé depuis le système de gestion*`;

    // Envoyer le message WhatsApp
    try {
      await sendWhatsAppMessage({ 
        to: phoneNumber, 
        message: whatsappMessage,
        userId: req.user._id,
        firstName: req.user.name 
      });
      
      console.log(`✅ WhatsApp envoyé à ${phoneNumber} pour la commande #${order.orderId}`);
      
      res.json({
        success: true,
        message: `Détails de la commande #${order.orderId} envoyés par WhatsApp à ${phoneNumber}`,
        data: {
          orderId: order._id,
          orderIdStr: order.orderId,
          phoneNumber: phoneNumber,
          sentAt: new Date()
        }
      });
    } catch (whatsappError) {
      console.error(`❌ Erreur WhatsApp pour ${phoneNumber}:`, whatsappError.message);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de l\'envoi WhatsApp: ' + whatsappError.message 
      });
    }
  } catch (error) {
    console.error('Erreur send order WhatsApp:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/ecom/orders/config/whatsapp - Configurer le numéro WhatsApp personnalisé
router.post('/config/whatsapp', requireEcomAuth, validateEcomAccess('products', 'write'), async (req, res) => {
  try {
    const { customWhatsAppNumber } = req.body;
    
    // Validation du format du numéro
    if (customWhatsAppNumber && !/^237\d{8,}$/.test(customWhatsAppNumber)) {
      return res.status(400).json({ success: false, message: 'Format invalide. Le numéro doit commencer par 237 suivi d\'au moins 8 chiffres' });
    }
    
    const settings = await WorkspaceSettings.findOneAndUpdate(
      { workspaceId: req.workspaceId },
      { $set: { customWhatsAppNumber: cleanNumber } },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: `Numéro WhatsApp configuré: ${cleanNumber}`,
      data: {
        customWhatsAppNumber: cleanNumber
      }
    });

  } catch (error) {
    console.error('Erreur configuration WhatsApp personnalisé:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/ecom/orders/config/whatsapp - Récupérer la configuration WhatsApp
router.get('/config/whatsapp', requireEcomAuth, validateEcomAccess('products', 'write'), async (req, res) => {
  try {
    const settings = await WorkspaceSettings.findOne({ workspaceId: req.workspaceId });
    
    res.json({
      success: true,
      data: {
        customWhatsAppNumber: settings?.customWhatsAppNumber || null,
        environmentNumber: process.env.CUSTOM_WHATSAPP_NUMBER || null,
        whatsappNumbers: settings?.whatsappNumbers || []
      }
    });

  } catch (error) {
    console.error('Erreur récupération config WhatsApp:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/ecom/orders/whatsapp-numbers - Lister tous les numéros WhatsApp configurés
router.get('/whatsapp-numbers', requireEcomAuth, validateEcomAccess('products', 'read'), async (req, res) => {
  try {
    const settings = await WorkspaceSettings.findOne({ workspaceId: req.workspaceId });
    const whatsappNumbers = settings?.whatsappNumbers || [];
    res.json({ success: true, data: whatsappNumbers });
  } catch (error) {
    console.error('Erreur récupération numéros WhatsApp:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/ecom/orders/whatsapp-numbers - Ajouter un numéro WhatsApp pour un pays
router.post('/whatsapp-numbers', requireEcomAuth, validateEcomAccess('products', 'write'), async (req, res) => {
  try {
    const { country, countryName, phoneNumber, isActive = true, autoNotifyOrders = true } = req.body;
    
    // Validation
    if (!country || !countryName || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'Pays, nom du pays et numéro requis' });
    }
    
    if (!/^\+\d{10,15}$/.test(phoneNumber)) {
      return res.status(400).json({ success: false, message: 'Format invalide. Le numéro doit être au format international (+country_code + number)' });
    }
    
    const settings = await WorkspaceSettings.findOneAndUpdate(
      { workspaceId: req.workspaceId },
      { 
        $push: { 
          whatsappNumbers: {
            country,
            countryName,
            phoneNumber,
            isActive,
            autoNotifyOrders,
            createdAt: new Date()
          }
        }
      },
      { upsert: true, new: true }
    );
    
    res.json({ success: true, message: 'Numéro WhatsApp ajouté', data: settings });
  } catch (error) {
    console.error('Erreur ajout numéro WhatsApp:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/ecom/orders/whatsapp-numbers/:id - Mettre à jour un numéro WhatsApp
router.put('/whatsapp-numbers/:id', requireEcomAuth, validateEcomAccess('products', 'write'), async (req, res) => {
  try {
    const { id } = req.params;
    const { country, countryName, phoneNumber, isActive, autoNotifyOrders } = req.body;
    
    if (phoneNumber && !/^\+\d{10,15}$/.test(phoneNumber)) {
      return res.status(400).json({ success: false, message: 'Format invalide. Le numéro doit être au format international (+country_code + number)' });
    }
    
    const settings = await WorkspaceSettings.findOneAndUpdate(
      { workspaceId: req.workspaceId, 'whatsappNumbers._id': id },
      { 
        $set: { 
          'whatsappNumbers.$.country': country,
          'whatsappNumbers.$.countryName': countryName,
          'whatsappNumbers.$.phoneNumber': phoneNumber,
          'whatsappNumbers.$.isActive': isActive,
          'whatsappNumbers.$.autoNotifyOrders': autoNotifyOrders
        }
      },
      { new: true }
    );
    
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Numéro WhatsApp non trouvé' });
    }
    
    res.json({ success: true, message: 'Numéro WhatsApp mis à jour', data: settings });
  } catch (error) {
    console.error('Erreur mise à jour numéro WhatsApp:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/ecom/orders/whatsapp-numbers/:id - Supprimer un numéro WhatsApp
router.delete('/whatsapp-numbers/:id', requireEcomAuth, validateEcomAccess('products', 'write'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const settings = await WorkspaceSettings.findOneAndUpdate(
      { workspaceId: req.workspaceId },
      { $pull: { whatsappNumbers: { _id: id } } },
      { new: true }
    );
    
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Numéro WhatsApp non trouvé' });
    }
    
    res.json({ success: true, message: 'Numéro WhatsApp supprimé', data: settings });
  } catch (error) {
    console.error('Erreur suppression numéro WhatsApp:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/ecom/orders/test-whatsapp - Tester l'envoi WhatsApp
router.post('/test-whatsapp', requireEcomAuth, validateEcomAccess('products', 'write'), async (req, res) => {
  try {
    const { country } = req.body;
    
    // Récupérer les paramètres du workspace
    const settings = await WorkspaceSettings.findOne({ workspaceId: req.workspaceId });
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Configuration non trouvée' });
    }
    
    let targetNumber;
    if (country) {
      // Trouver le numéro pour le pays spécifié
      const whatsappConfig = settings.whatsappNumbers?.find(w => w.country === country && w.isActive);
      targetNumber = whatsappConfig?.phoneNumber;
    } else {
      // Utiliser le numéro par défaut
      targetNumber = settings.customWhatsAppNumber;
    }
    
    if (!targetNumber) {
      return res.status(400).json({ success: false, message: 'Aucun numéro WhatsApp configuré pour ce pays' });
    }
    
    const testMessage = `🧪 *TEST DE NOTIFICATION* 🧪

✅ Le système de notification WhatsApp fonctionne correctement!
📅 Heure du test: ${new Date().toLocaleString('fr-FR')}
🌍 Pays: ${country || 'Défaut'}
📱 Numéro: ${targetNumber}

🚀 Prêt à recevoir les notifications des nouvelles commandes!`;
    
    await sendWhatsAppMessage({
      to: targetNumber,
      message: testMessage,
      userId: req.user._id,
      firstName: req.user.name || 'Admin'
    });
    
    res.json({ success: true, message: 'Message de test envoyé avec succès' });
  } catch (error) {
    console.error('Erreur test WhatsApp:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi du message de test' });
  }
});

// DELETE /api/ecom/orders/sources/legacy/confirm - Supprimer le Google Sheet par défaut
router.delete('/sources/legacy/confirm', requireEcomAuth, validateEcomAccess('products', 'write'), async (req, res) => {
  try {
    const settings = await WorkspaceSettings.findOne({ workspaceId: req.workspaceId });
    
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Workspace non trouvé.' });
    }

    // Supprimer seulement le spreadsheetId et réinitialiser le sync, mais garder les autres configurations
    settings.googleSheets.spreadsheetId = '';
    settings.googleSheets.lastSyncAt = null;
    
    await settings.save();

    // Supprimer toutes les commandes de la source legacy (sheetRowId ne commence pas par source_)
    const deleteResult = await Order.deleteMany({
      workspaceId: req.workspaceId,
      sheetRowId: { $not: /^source_/, $ne: '' }
    });

    res.json({
      success: true,
      message: `Google Sheet par défaut supprimé avec succès ainsi que ${deleteResult.deletedCount} commande(s). Les autres configurations sont conservées.`,
      data: {
        clearedFields: ['googleSheets.spreadsheetId', 'googleSheets.lastSyncAt'],
        preservedFields: ['googleSheets.apiKey', 'googleSheets.sheetName', 'googleSheets.columnMapping'],
        deletedOrders: deleteResult.deletedCount
      }
    });

  } catch (error) {
    console.error('Erreur suppression source legacy:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/ecom/orders/sync-clients - Synchroniser tous les clients depuis les commandes
router.post('/sync-clients', requireEcomAuth, async (req, res) => {
  try {
    console.log('🔄 ===== DÉBUT SYNCHRONISATION CLIENTS =====');
    console.log('👤 Utilisateur:', req.ecomUser?.email);
    console.log('🏢 Workspace ID:', req.workspaceId);
    
    const orderStatusMap = {
      delivered: { clientStatus: 'delivered', tag: 'Client' },
      pending: { clientStatus: 'prospect', tag: 'En attente' },
      confirmed: { clientStatus: 'confirmed', tag: 'Confirmé' },
      shipped: { clientStatus: 'confirmed', tag: 'Expédié' },
      cancelled: { clientStatus: 'prospect', tag: 'Annulé' },
      returned: { clientStatus: 'returned', tag: 'Retour' },
      unreachable: { clientStatus: 'prospect', tag: 'Injoignable' },
      called: { clientStatus: 'prospect', tag: 'Appelé' },
      postponed: { clientStatus: 'prospect', tag: 'Reporté' }
    };
    console.log('📋 Mapping statuts:', Object.keys(orderStatusMap));
    
    const statusPriority = { prospect: 1, confirmed: 2, returned: 3, delivered: 4, blocked: 5 };
    console.log('📊 Priorité statuts:', statusPriority);

    // Récupérer les statuts demandés (ou tous par défaut)
    const requestedStatuses = req.body.statuses;
    const statusesToSync = requestedStatuses && requestedStatuses.length > 0 
      ? requestedStatuses 
      : Object.keys(orderStatusMap);
    console.log('🎯 Statuts à synchroniser:', statusesToSync);

    // Récupérer toutes les commandes avec clientPhone et statut filtré
    console.log('🔍 Recherche des commandes avec téléphone...');
    const orders = await Order.find({ 
      workspaceId: req.workspaceId,
      clientPhone: { $exists: true, $ne: '' },
      status: { $in: statusesToSync }
    }).lean();

    console.log(`📦 ${orders.length} commandes trouvées pour synchronisation`);
    if (orders.length > 0) {
      console.log('📈 Exemples de commandes:');
      orders.slice(0, 3).forEach((order, i) => {
        console.log(`  ${i+1}. ${order.clientName} - ${order.clientPhone} - ${order.status} - ${order.price}x${order.quantity}`);
      });
    }

    let created = 0;
    let updated = 0;
    const statusGroups = {};
    const totalOrders = orders.length;

    // Emit progress start
    req.app.get('io')?.emit(`sync-clients-progress-${req.workspaceId}`, {
      type: 'start',
      total: totalOrders,
      message: `Démarrage de la synchronisation de ${totalOrders} commandes...`
    });

    console.log('⚙️ Traitement des commandes...');
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const phone = (order.clientPhone || '').trim();
      const nameParts = (order.clientName || '').trim().split(/\s+/);
      const firstName = nameParts[0] || 'Client';
      const lastName = nameParts.slice(1).join(' ') || '';
      const orderTotal = (order.price || 0) * (order.quantity || 1);
      const productName = getOrderProductName(order);

      // Log détaillé pour les premières commandes
      if (i < 5) {
        console.log(`📝 Commande ${i+1}: ${order.clientName} (${phone}) - ${order.status} - ${orderTotal}€ - produit: "${productName}" (raw: "${order.product}")`);
      }

      // Compter par statut pour le retour
      const mapping = orderStatusMap[order.status];
      if (mapping) {
        statusGroups[mapping.clientStatus] = (statusGroups[mapping.clientStatus] || 0) + 1;
        if (i < 5) {
          console.log(`  ↳ Mapping: ${order.status} → ${mapping.clientStatus} (${mapping.tag})`);
        }
      } else {
        if (i < 5) {
          console.log(`  ⚠️ Aucun mapping pour statut: ${order.status}`);
        }
      }

      let client = await Client.findOne({ workspaceId: req.workspaceId, phone });

      if (!client) {
        // Créer nouveau client
        console.log(`  ➕ Création nouveau client: ${firstName} ${lastName} (${phone})`);
        client = new Client({
          workspaceId: req.workspaceId,
          phone,
          firstName,
          lastName,
          city: order.city || '',
          address: order.address || '',
          products: productName ? [productName] : [],
          status: mapping ? mapping.clientStatus : 'prospect',
          tags: mapping ? [mapping.tag] : [],
          totalOrders: 1,
          totalSpent: orderTotal,
          lastOrderAt: order.date,
          lastContactAt: order.date,
          createdBy: req.ecomUser._id
        });
        await client.save();
        created++;
        console.log(`  ✅ Client créé avec ID: ${client._id}`);
      } else {
        // Mettre à jour client existant
        console.log(`  🔄 Mise à jour client existant: ${client.firstName} (${phone}) - statut actuel: ${client.status}`);
        let hasChanges = false;
        
        // Mettre à jour le statut si priorité plus élevée
        if (mapping && statusPriority[mapping.clientStatus] > statusPriority[client.status]) {
          console.log(`    📈 Changement statut: ${client.status} → ${mapping.clientStatus} (priorité ${statusPriority[mapping.clientStatus]} > ${statusPriority[client.status]})`);
          client.status = mapping.clientStatus;
          hasChanges = true;
        }
        
        // Ajouter le tag si non présent
        if (mapping && !client.tags.includes(mapping.tag)) {
          console.log(`    🏷️ Ajout tag: ${mapping.tag}`);
          client.tags.push(mapping.tag);
          hasChanges = true;
        }
        
        // Mettre à jour l'adresse si elle n'existe pas
        if (order.address && !client.address) {
          console.log(`    📍 Ajout adresse: ${order.address}`);
          client.address = order.address;
          hasChanges = true;
        }
        
        // Ajouter le produit s'il n'est pas déjà dans la liste
        if (productName && !client.products.includes(productName)) {
          console.log(`    📦 Ajout produit: ${productName}`);
          client.products.push(productName);
          hasChanges = true;
        }
        
        // Mettre à jour les totaux
        const oldOrders = client.totalOrders || 0;
        const oldSpent = client.totalSpent || 0;
        client.totalOrders = oldOrders + 1;
        client.totalSpent = oldSpent + orderTotal;
        client.lastOrderAt = order.date;
        client.lastContactAt = order.date;
        
        console.log(`    💰 Mise à jour totaux: ${oldOrders}→${client.totalOrders} commandes, ${oldSpent}→${client.totalSpent}€ dépensés`);
        
        if (hasChanges || true) { // Toujours sauvegarder pour les totaux
          await client.save();
          updated++;
          console.log(`  ✅ Client mis à jour`);
        }
      }

      // Emit progress every 10 orders or at the end
      if (i % 10 === 0 || i === orders.length - 1) {
        const progress = Math.round(((i + 1) / totalOrders) * 100);
        console.log(`📊 Progression: ${i + 1}/${totalOrders} (${progress}%) - Créés: ${created}, Mis à jour: ${updated}`);
        
        req.app.get('io')?.emit(`sync-clients-progress-${req.workspaceId}`, {
          type: 'progress',
          current: i + 1,
          total: totalOrders,
          percentage: progress,
          created,
          updated,
          message: `Traitement de ${i + 1}/${totalOrders} commandes...`
        });
      }
    }

    console.log(`✅ ===== SYNCHRONISATION TERMINÉE =====`);
    console.log(`📊 Résultats:`);
    console.log(`  • Total commandes traitées: ${totalOrders}`);
    console.log(`  • Clients créés: ${created}`);
    console.log(`  • Clients mis à jour: ${updated}`);
    console.log(`  • Total clients traités: ${created + updated}`);
    console.log(`� Répartition par statut:`, statusGroups);

    // Emit completion
    req.app.get('io')?.emit(`sync-clients-progress-${req.workspaceId}`, {
      type: 'complete',
      created,
      updated,
      total: created + updated,
      statusGroups,
      message: 'Synchronisation terminée avec succès !'
    });

    res.json({ 
      success: true, 
      message: 'Synchronisation terminée',
      data: {
        created,
        updated,
        total: created + updated,
        statusGroups
      }
    });
  } catch (error) {
    console.error('❌ ===== ERREUR SYNCHRONISATION =====');
    console.error('Erreur:', error.message);
    console.error('Stack:', error.stack);
    
    // Emit error
    req.app.get('io')?.emit(`sync-clients-progress-${req.workspaceId}`, {
      type: 'error',
      message: 'Erreur lors de la synchronisation'
    });
    
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/ecom/orders/revenue-periods - Statistiques des revenus par période
router.get('/revenue-periods', requireEcomAuth, async (req, res) => {
  try {
    const { allWorkspaces } = req.query;
    
    // Si super_admin et allWorkspaces=true, ne pas filtrer par workspaceId
    const isSuperAdmin = req.ecomUser.role === 'super_admin';
    const viewAllWorkspaces = isSuperAdmin && allWorkspaces === 'true';
    
    const baseFilter = viewAllWorkspaces ? {} : { workspaceId: req.workspaceId };
    const now = new Date();
    
    // Définir les périodes
    const periods = [
      {
        key: 'today',
        label: "Aujourd'hui",
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      },
      {
        key: '7days',
        label: '7 derniers jours',
        start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        end: new Date()
      },
      {
        key: '30days',
        label: '30 derniers jours',
        start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      },
      {
        key: '90days',
        label: '90 derniers jours',
        start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        end: new Date()
      }
    ];
    
    // Calculer les revenus pour chaque période
    const revenueStats = await Promise.all(
      periods.map(async (period) => {
        const deliveredOrders = await Order.find(
          {
            ...baseFilter,
            status: 'delivered',
            date: { $gte: period.start, $lt: period.end }
          },
          { price: 1, quantity: 1 }
        ).lean();
        
        const revenue = deliveredOrders.reduce((sum, o) => sum + ((o.price || 0) * (o.quantity || 1)), 0);
        const orderCount = deliveredOrders.length;
        
        return {
          period: period.key,
          label: period.label,
          revenue,
          orderCount,
          avgOrderValue: orderCount > 0 ? revenue / orderCount : 0,
          startDate: period.start,
          endDate: period.end
        };
      })
    );
    
    // Statistiques globales
    const totalDeliveredOrders = await Order.find(
      { ...baseFilter, status: 'delivered' },
      { price: 1, quantity: 1 }
    ).lean();
    
    const totalRevenue = totalDeliveredOrders.reduce((sum, o) => sum + ((o.price || 0) * (o.quantity || 1)), 0);
    const totalOrderCount = totalDeliveredOrders.length;
    
    res.json({
      success: true,
      data: {
        periods: revenueStats,
        total: {
          revenue: totalRevenue,
          orderCount: totalOrderCount,
          avgOrderValue: totalOrderCount > 0 ? totalRevenue / totalOrderCount : 0
        },
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Erreur revenue periods:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
