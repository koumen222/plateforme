import express from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Client from '../models/Client.js';
import WorkspaceSettings from '../models/WorkspaceSettings.js';
import EcomUser from '../models/EcomUser.js';
import Notification from '../../models/Notification.js';
import { sendWhatsAppMessage } from '../../services/whatsappService.js';
import { requireEcomAuth, validateEcomAccess } from '../middleware/ecomAuth.js';

const router = express.Router();

// GET /api/ecom/orders - Liste des commandes
router.get('/', requireEcomAuth, async (req, res) => {
  try {
    const { status, search, startDate, endDate, city, product, tag, sourceId, page = 1, limit = 50 } = req.query;
    const filter = { workspaceId: req.workspaceId };

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
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const orders = await Order.find(filter)
      .populate('assignedLivreur', 'name email phone')
      .sort({ date: -1, _id: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(filter);

    // Stats via aggregation (performant)
    const statsAgg = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: { $multiply: ['$price', '$quantity'] } }
        }
      }
    ]);
    const stats = { total: 0, pending: 0, confirmed: 0, shipped: 0, delivered: 0, returned: 0, cancelled: 0, totalRevenue: 0 };
    statsAgg.forEach(s => {
      stats[s._id] = s.count;
      stats.total += s.count;
      if (s._id === 'delivered') stats.totalRevenue = s.revenue;
    });

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

// Helper: extraire le vrai nom de produit d'une commande (fallback rawData si numérique)
function getOrderProductName(order) {
  if (order.product && isNaN(String(order.product).replace(/\s/g, ''))) return order.product;
  // Chercher dans rawData une colonne produit avec une valeur non-numérique
  if (order.rawData && typeof order.rawData === 'object') {
    for (const [k, v] of Object.entries(order.rawData)) {
      if (v && typeof v === 'string' && isNaN(v.replace(/\s/g, '')) && /produit|product|article|item|d[eé]signation/i.test(k)) {
        return v;
      }
    }
  }
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
    { field: 'status', compound: [], simple: ['statut', 'status', 'etat', 'state', 'livraison', 'delivery'] },
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
  try {
    const { sourceId } = req.body;
    const settings = await WorkspaceSettings.findOne({ workspaceId: req.workspaceId });
    
    if (!settings) {
      return res.status(400).json({ success: false, message: 'Paramètres introuvables.' });
    }

    let sourcesToSync = [];

    if (sourceId) {
      const source = settings.sources.id(sourceId);
      if (!source) return res.status(404).json({ success: false, message: 'Source non trouvée.' });
      sourcesToSync = [source];
    } else if (settings.sources && settings.sources.length > 0) {
      sourcesToSync = settings.sources.filter(s => s.isActive);
    } else if (settings.googleSheets?.spreadsheetId) {
      // Fallback compatibilité
      sourcesToSync = [{
        _id: 'legacy',
        name: 'Commandes Zendo',
        spreadsheetId: settings.googleSheets.spreadsheetId,
        sheetName: settings.googleSheets.sheetName || 'Sheet1'
      }];
    }

    if (sourcesToSync.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune source Google Sheets configurée ou active.'
      });
    }

    let totalImported = 0;
    let totalUpdated = 0;
    let totalClientsCreated = 0;
    let totalClientsUpdated = 0;
    let syncResults = [];

    for (const source of sourcesToSync) {
      const spreadsheetId = extractSpreadsheetId(source.spreadsheetId);
      if (!spreadsheetId) continue;

      const sheetName = source.sheetName || 'Sheet1';
      const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;

      try {
        const response = await fetch(csvUrl);
        if (!response.ok) throw new Error('Accès refusé au sheet');

        const text = await response.text();
        const jsonStr = text.match(/google\.visualization\.Query\.setResponse\((.+)\);?$/);
        if (!jsonStr) throw new Error('Format invalide');

        const json = JSON.parse(jsonStr[1]);
        const table = json.table;
        if (!table || !table.rows || table.rows.length === 0) continue;

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

        const columnMap = autoDetectColumns(headers);
        const bulkOps = [];

        for (let i = dataStartIndex; i < table.rows.length; i++) {
          const row = table.rows[i];
          if (!row.c || row.c.every(cell => !cell || !cell.v)) continue;

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
            if (typeof cell.v === 'string' && cell.v.startsWith('Date(')) {
              const parts = cell.v.match(/Date\((\d+),(\d+),(\d+)/);
              if (parts) return new Date(parseInt(parts[1]), parseInt(parts[2]), parseInt(parts[3]));
            }
            return parseFlexDate(cell.f || cell.v);
          };

          const rawData = {};
          headers.forEach((header, idx) => {
            if (header && row.c[idx]) {
              const cell = row.c[idx];
              rawData[header] = cell.f || (cell.v != null ? String(cell.v) : '');
            }
          });

          const rowId = `source_${source._id}_row_${i + 2}`;
          const statusMap = {
            'en attente': 'pending', 'pending': 'pending', 'nouveau': 'pending', 'new': 'pending',
            'confirmé': 'confirmed', 'confirmed': 'confirmed', 'confirme': 'confirmed',
            'expédié': 'shipped', 'shipped': 'shipped', 'expedie': 'shipped', 'envoyé': 'shipped', 'envoye': 'shipped',
            'livré': 'delivered', 'delivered': 'delivered', 'livre': 'delivered',
            'retour': 'returned', 'returned': 'returned', 'retourné': 'returned', 'retourne': 'returned',
            'annulé': 'cancelled', 'cancelled': 'cancelled', 'canceled': 'cancelled', 'annule': 'cancelled'
          };
          const mappedStatus = statusMap[(getVal('status') || '').toLowerCase().trim()] || 'pending';

          const doc = {
            orderId: getVal('orderId') || `#${source.name}_${i + 2}`,
            date: getDateVal('date'),
            clientName: getVal('clientName'),
            clientPhone: getVal('clientPhone'),
            city: getVal('city'),
            product: getVal('product'),
            quantity: parseInt(getNumVal('quantity')) || 1,
            price: getNumVal('price'),
            status: mappedStatus,
            tags: [source.name],
            notes: getVal('notes'),
            rawData
          };

          // Vérifier si la commande existe déjà et si son statut a été modifié manuellement
          const existingOrder = await Order.findOne({ 
            workspaceId: req.workspaceId, 
            sheetRowId: rowId 
          });

          // Si la commande existe et que le statut a été modifié manuellement, ne pas écraser le statut
          if (existingOrder && existingOrder.statusModifiedManually) {
            delete doc.status; // Ne pas mettre à jour le statut
          }

          bulkOps.push({
            updateOne: {
              filter: { workspaceId: req.workspaceId, sheetRowId: rowId },
              update: { $set: { ...doc, workspaceId: req.workspaceId, sheetRowId: rowId, source: 'google_sheets' } },
              upsert: true
            }
          });
        }

        if (bulkOps.length > 0) {
          const result = await Order.bulkWrite(bulkOps);
          totalImported += result.upsertedCount || 0;
          totalUpdated += result.modifiedCount || 0;
          
          // Détecter les nouvelles commandes et notifier les livreurs
          if (result.upsertedCount > 0) {
            // Récupérer les commandes qui viennent d'être insérées
            const newOrders = [];
            for (const op of bulkOps) {
              if (op.updateOne.upsert && op.updateOne.filter.sheetRowId) {
                newOrders.push(op.updateOne.filter.sheetRowId);
              }
            }
            
            if (newOrders.length > 0) {
              // Récupérer uniquement la dernière commande (la plus récente)
              const latestOrder = await Order.findOne({
                workspaceId: req.workspaceId,
                sheetRowId: { $in: newOrders },
                status: { $in: ['pending', 'confirmed'] }, // Seulement les commandes en attente/confirmées
                whatsappNotificationSent: { $ne: true } // IMPORTANT: Seulement si notification pas encore envoyée
              })
              .sort({ date: -1 }) // Trier par date décroissante pour obtenir la plus récente
              .populate('assignedLivreur', 'name email phone');
              
              // Envoyer uniquement la dernière commande
              if (latestOrder) {
                await notifyLivreursOfNewOrder(latestOrder, req.workspaceId);
                // Envoyer automatiquement au numéro WhatsApp personnalisé
                await sendOrderToCustomNumber(latestOrder, req.workspaceId);
                
                // Marquer la notification comme envoyée
                latestOrder.whatsappNotificationSent = true;
                latestOrder.whatsappNotificationSentAt = new Date();
                await latestOrder.save();
                
                console.log(`📱 WhatsApp envoyé uniquement pour la dernière commande: #${latestOrder.orderId}`);
              }
            }
          }
        }

        // Update source stats
        if (source._id !== 'legacy') {
          const s = settings.sources.id(source._id);
          s.lastSyncAt = new Date();
          s.detectedHeaders = headers.filter(h => h);
          s.detectedColumns = columnMap;
        } else {
          settings.googleSheets.lastSyncAt = new Date();
          settings.googleSheets.detectedHeaders = headers.filter(h => h);
          settings.googleSheets.detectedColumns = columnMap;
        }
        
        syncResults.push({ name: source.name, imported: bulkOps.length });

      } catch (err) {
        console.error(`Error syncing source ${source.name}:`, err);
      }
    }

    settings.markModified('sources');
    settings.markModified('googleSheets');
    await settings.save();

    // Auto-création des clients/prospects (simplifié pour la réponse)
    // ... (Logique client similaire à l'originale mais adaptée si besoin)

    res.json({
      success: true,
      message: `Sync terminée: ${totalImported} importées, ${totalUpdated} mises à jour.`,
      data: { imported: totalImported, updated: totalUpdated, sources: syncResults }
    });

  } catch (error) {
    console.error('Erreur sync Google Sheets:', error);
    res.status(500).json({ success: false, message: 'Erreur synchronisation: ' + error.message });
  }
});


// GET /api/ecom/orders/settings - Récupérer la config et les sources
router.get('/settings', requireEcomAuth, validateEcomAccess('products', 'write'), async (req, res) => {
  try {
    let settings = await WorkspaceSettings.findOne({ workspaceId: req.workspaceId });
    if (!settings) {
      settings = await WorkspaceSettings.create({ workspaceId: req.workspaceId });
    }
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

// DELETE /api/ecom/orders/sources/:sourceId - Supprimer une source
router.delete('/sources/:sourceId', requireEcomAuth, validateEcomAccess('products', 'write'), async (req, res) => {
  try {
    const settings = await WorkspaceSettings.findOne({ workspaceId: req.workspaceId });
    if (!settings) return res.status(404).json({ success: false, message: 'Paramètres non trouvés' });

    settings.sources.pull(req.params.sourceId);
    await settings.save();
    res.json({ success: true, message: 'Source supprimée' });
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

// PUT /api/ecom/orders/:id - Mettre à jour une commande
router.put('/:id', requireEcomAuth, async (req, res) => {
  try {
    const { status, assignedLivreur } = req.body;
    const updateData = {};
    
    if (status !== undefined) {
      updateData.status = status;
      updateData.statusModifiedManually = true;
      updateData.lastManualStatusUpdate = new Date();
    }
    if (assignedLivreur !== undefined) updateData.assignedLivreur = assignedLivreur;
    
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, workspaceId: req.workspaceId },
      updateData,
      { new: true }
    ).populate('assignedLivreur', 'name email phone');
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée.' });
    }
    
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Erreur update order:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/ecom/orders/:id - Modifier le statut d'une commande
router.put('/:id', requireEcomAuth, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, workspaceId: req.workspaceId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    const allowedFields = ['status', 'notes', 'clientName', 'clientPhone', 'city', 'product', 'quantity', 'price', 'deliveryLocation', 'deliveryTime', 'tags', 'assignedLivreur'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) order[field] = req.body[field];
    });

    // Auto-tagging basé sur le statut
    if (req.body.status) {
      const statusTags = { pending: 'En attente', confirmed: 'Confirmé', shipped: 'Expédié', delivered: 'Client', returned: 'Retour', cancelled: 'Annulé' };
      const allStatusTags = Object.values(statusTags);
      // Retirer les anciens tags de statut, garder les tags manuels
      order.tags = (order.tags || []).filter(t => !allStatusTags.includes(t));
      // Ajouter le nouveau tag
      const newTag = statusTags[req.body.status];
      if (newTag && !order.tags.includes(newTag)) {
        order.tags.push(newTag);
      }
    }

    await order.save();

    // Auto-création/mise à jour du client/prospect selon le statut de la commande
    if (req.body.status && order.clientName) {
      try {
        const orderStatusMap = {
          delivered: { clientStatus: 'delivered', tag: 'Client' },
          pending: { clientStatus: 'prospect', tag: 'En attente' },
          confirmed: { clientStatus: 'confirmed', tag: 'Confirmé' },
          shipped: { clientStatus: 'confirmed', tag: 'Expédié' },
          cancelled: { clientStatus: 'prospect', tag: 'Annulé' },
          returned: { clientStatus: 'returned', tag: 'Retour' }
        };
        const statusPriority = { prospect: 1, confirmed: 2, returned: 3, delivered: 4, blocked: 5 };
        const mapping = orderStatusMap[req.body.status];
        if (mapping) {
          const phone = (order.clientPhone || '').trim();
          const nameParts = (order.clientName || '').trim().split(/\s+/);
          const firstName = nameParts[0] || 'Client';
          const lastName = nameParts.slice(1).join(' ') || '';
          const orderTotal = (order.price || 0) * (order.quantity || 1);

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
            if ((statusPriority[mapping.clientStatus] || 0) > (statusPriority[existingClient.status] || 0)) {
              existingClient.status = mapping.clientStatus;
            }
            existingClient.lastContactAt = new Date();
            if (order.city && !existingClient.city) existingClient.city = order.city;
            if (mapping.tag && !existingClient.tags.includes(mapping.tag)) existingClient.tags.push(mapping.tag);
            if (productName && !(existingClient.products || []).includes(productName)) {
              existingClient.products = [...(existingClient.products || []), productName];
            }
            await existingClient.save();
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
              lastContactAt: new Date(),
              createdBy: req.ecomUser._id
            });
          }
        }
      } catch (clientErr) {
        console.error('Erreur auto-création client:', clientErr);
      }
    }

    res.json({ success: true, message: 'Commande mise à jour', data: order });
  } catch (error) {
    console.error('Erreur update order:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/ecom/orders/:id/send-whatsapp - Envoyer message WhatsApp au livreur via Green API
router.post('/:id/send-whatsapp', requireEcomAuth, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, workspaceId: req.workspaceId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ success: false, message: 'Numéro et message requis' });
    }

    const greenApiId = process.env.GREEN_API_ID_INSTANCE;
    const greenApiToken = process.env.GREEN_API_TOKEN_INSTANCE;
    const greenApiUrl = process.env.GREEN_API_URL || 'https://api.green-api.com';
    if (!greenApiId || !greenApiToken) {
      return res.status(500).json({ success: false, message: 'Green API non configuré sur le serveur' });
    }

    const cleanedPhone = phone.replace(/\D/g, '');
    const apiUrl = `${greenApiUrl}/waInstance${greenApiId}/sendMessage/${greenApiToken}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: `${cleanedPhone}@c.us`, message })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return res.status(500).json({ success: false, message: data.error || data.errorMessage || 'Erreur Green API' });
    }

    res.json({ success: true, message: 'Message WhatsApp envoyé au livreur', data });
  } catch (error) {
    console.error('Erreur envoi WhatsApp livreur:', error);
    res.status(500).json({ success: false, message: error.message || 'Erreur envoi WhatsApp' });
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
    
    if (!customWhatsAppNumber) {
      return res.status(400).json({ success: false, message: 'Numéro WhatsApp requis' });
    }

    // Valider le format du numéro (doit commencer par 237 et contenir uniquement des chiffres)
    const cleanNumber = customWhatsAppNumber.replace(/\D/g, '');
    if (!cleanNumber.startsWith('237') || cleanNumber.length < 9) {
      return res.status(400).json({ 
        success: false, 
        message: 'Format invalide. Le numéro doit commencer par 237 et contenir au moins 9 chiffres (ex: 237612345678)' 
      });
    }

    // Mettre à jour les settings du workspace
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
        environmentNumber: process.env.CUSTOM_WHATSAPP_NUMBER || null
      }
    });

  } catch (error) {
    console.error('Erreur récupération config WhatsApp:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/ecom/orders/sources/:id - Supprimer une source Google Sheets
router.delete('/sources/:id', requireEcomAuth, validateEcomAccess('products', 'write'), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (id === 'legacy') {
      return res.status(400).json({ 
        success: false, 
        message: 'Pour supprimer la source par défaut, utilisez DELETE /api/ecom/orders/sources/legacy/confirm' 
      });
    }

    const settings = await WorkspaceSettings.findOne({ workspaceId: req.workspaceId });
    
    if (!settings || !settings.sources) {
      return res.status(404).json({ success: false, message: 'Source non trouvée.' });
    }

    // Supprimer la source du tableau
    const sourceIndex = settings.sources.findIndex(s => s._id === id);
    if (sourceIndex === -1) {
      return res.status(404).json({ success: false, message: 'Source non trouvée.' });
    }

    const deletedSource = settings.sources[sourceIndex];
    settings.sources.splice(sourceIndex, 1);
    
    await settings.save();

    res.json({
      success: true,
      message: `Source "${deletedSource.name}" supprimée avec succès`,
      data: {
        deletedSource: deletedSource
      }
    });

  } catch (error) {
    console.error('Erreur suppression source:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
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

    res.json({
      success: true,
      message: 'Google Sheet par défaut supprimé avec succès. Les autres configurations sont conservées.',
      data: {
        clearedFields: ['googleSheets.spreadsheetId', 'googleSheets.lastSyncAt'],
        preservedFields: ['googleSheets.apiKey', 'googleSheets.sheetName', 'googleSheets.columnMapping']
      }
    });

  } catch (error) {
    console.error('Erreur suppression source legacy:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
