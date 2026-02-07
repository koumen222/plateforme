import express from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Client from '../models/Client.js';
import WorkspaceSettings from '../models/WorkspaceSettings.js';
import { requireEcomAuth, validateEcomAccess } from '../middleware/ecomAuth.js';

const router = express.Router();

// GET /api/ecom/orders - Liste des commandes
router.get('/', requireEcomAuth, async (req, res) => {
  try {
    const { status, search, startDate, endDate, city, product, tag, page = 1, limit = 50 } = req.query;
    const filter = { workspaceId: req.workspaceId };

    if (status) filter.status = status;
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (product) filter.product = { $regex: product, $options: 'i' };
    if (tag) filter.tags = tag;
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
      .sort({ date: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(filter);

    // Stats via aggregation (performant)
    const statsAgg = await Order.aggregate([
      { $match: { workspaceId: req.workspaceId } },
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

// POST /api/ecom/orders/sync-sheets - Synchroniser depuis Google Sheets
router.post('/sync-sheets', requireEcomAuth, validateEcomAccess('products', 'write'), async (req, res) => {
  try {
    const settings = await WorkspaceSettings.findOne({ workspaceId: req.workspaceId });
    if (!settings || !settings.googleSheets?.spreadsheetId) {
      return res.status(400).json({
        success: false,
        message: 'Lien Google Sheets manquant. Collez le lien de votre Google Sheet dans les paramètres.'
      });
    }

    const spreadsheetId = extractSpreadsheetId(settings.googleSheets.spreadsheetId);
    if (!spreadsheetId) {
      return res.status(400).json({ success: false, message: 'Lien Google Sheets invalide' });
    }

    const sheetName = settings.googleSheets.sheetName || 'Sheet1';

    // Utiliser l'export CSV public (le sheet doit être partagé "Toute personne ayant le lien")
    const gid = 0; // Premier onglet par défaut
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;

    const response = await fetch(csvUrl);
    if (!response.ok) {
      return res.status(400).json({
        success: false,
        message: 'Impossible d\'accéder au Google Sheet. Vérifiez que le sheet est partagé en mode "Toute personne ayant le lien".'
      });
    }

    const text = await response.text();
    // Google renvoie du JSONP: google.visualization.Query.setResponse({...})
    const jsonStr = text.match(/google\.visualization\.Query\.setResponse\((.+)\);?$/);
    if (!jsonStr) {
      return res.status(400).json({ success: false, message: 'Format de réponse Google Sheets invalide. Vérifiez le lien et le partage.' });
    }

    const json = JSON.parse(jsonStr[1]);
    const table = json.table;
    if (!table || !table.rows || table.rows.length === 0) {
      return res.json({ success: true, message: 'Aucune donnée trouvée dans le sheet', data: { imported: 0 } });
    }

    // Extraire les headers depuis cols.label
    let headers = table.cols.map(col => col.label || '');
    let dataStartIndex = 0;

    // Si les labels sont vides, utiliser la première ligne de données comme headers
    const hasLabels = headers.some(h => h && h.trim());
    if (!hasLabels && table.rows.length > 0) {
      const firstRow = table.rows[0];
      if (firstRow.c) {
        headers = firstRow.c.map(cell => {
          if (!cell) return '';
          return cell.f || (cell.v != null ? String(cell.v) : '');
        });
        dataStartIndex = 1; // Sauter la première ligne (c'est les headers)
      }
    }

    const columnMap = autoDetectColumns(headers);

    console.log('📊 Google Sheets headers:', headers);
    console.log('📊 Headers source:', hasLabels ? 'cols.label' : 'first row');
    console.log('📊 Auto-detected columns:', columnMap);

    const statusMap = {
      'en attente': 'pending', 'pending': 'pending', 'nouveau': 'pending', 'new': 'pending',
      'confirmé': 'confirmed', 'confirmed': 'confirmed', 'confirme': 'confirmed',
      'expédié': 'shipped', 'shipped': 'shipped', 'expedie': 'shipped', 'envoyé': 'shipped', 'envoye': 'shipped',
      'livré': 'delivered', 'delivered': 'delivered', 'livre': 'delivered',
      'retour': 'returned', 'returned': 'returned', 'retourné': 'returned', 'retourne': 'returned',
      'annulé': 'cancelled', 'cancelled': 'cancelled', 'canceled': 'cancelled', 'annule': 'cancelled'
    };

    // Préparer les opérations bulk pour performance
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

      const rowId = `row_${i + 2}`;
      const mappedStatus = statusMap[(getVal('status') || '').toLowerCase().trim()] || 'pending';

      let productVal = getVal('product');
      let priceVal = getNumVal('price');

      // Si product est un nombre (ex: "13000"), c'est probablement le prix mal mappé
      if (productVal && !isNaN(productVal.replace(/\s/g, '')) && parseFloat(productVal.replace(/\s/g, '')) > 0) {
        // Si price est 0 ou vide, utiliser product comme price
        if (!priceVal || priceVal === 0) {
          priceVal = parseFloat(productVal.replace(/\s/g, '')) || 0;
        }
        // Chercher le vrai nom de produit dans rawData (valeur non-numérique dans une colonne "produit/article/product")
        const productKeys = Object.keys(rawData).filter(k => {
          const kn = k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          return /produit|product|article|item|designation/.test(kn);
        });
        let realProduct = '';
        for (const pk of productKeys) {
          const v = rawData[pk];
          if (v && isNaN(v.replace(/\s/g, ''))) {
            realProduct = v;
            break;
          }
        }
        // Si pas trouvé via clé, chercher toute valeur non-numérique qui ressemble à un nom de produit
        if (!realProduct) {
          for (const [k, v] of Object.entries(rawData)) {
            if (v && typeof v === 'string' && isNaN(v.replace(/\s/g, '')) && v.length > 2 && 
                k !== headers[columnMap['clientName']] && k !== headers[columnMap['clientPhone']] && 
                k !== headers[columnMap['city']] && k !== headers[columnMap['status']] &&
                k !== headers[columnMap['notes']] && k !== headers[columnMap['address']]) {
              // Vérifier que ce n'est pas déjà mappé à un autre champ connu
              const mappedHeaders = Object.values(columnMap).map(idx => headers[idx]);
              if (!mappedHeaders.includes(k) || k === headers[columnMap['product']]) {
                realProduct = v;
                break;
              }
            }
          }
        }
        productVal = realProduct || '';
      }

      // Auto-tag basé sur le statut
      const statusTags = { pending: 'En attente', confirmed: 'Confirmé', shipped: 'Expédié', delivered: 'Client', returned: 'Retour', cancelled: 'Annulé' };
      const autoTag = statusTags[mappedStatus] || 'En attente';

      const doc = {
        orderId: getVal('orderId') || `#${i + 2}`,
        date: getDateVal('date'),
        clientName: getVal('clientName'),
        clientPhone: getVal('clientPhone'),
        city: getVal('city'),
        product: productVal,
        quantity: parseInt(getNumVal('quantity')) || 1,
        price: priceVal,
        status: mappedStatus,
        tags: [autoTag],
        notes: getVal('notes'),
        rawData
      };

      const insertDoc = {
        ...doc,
        workspaceId: req.workspaceId,
        sheetRowId: rowId,
        source: 'google_sheets'
      };

      bulkOps.push({
        updateOne: {
          filter: { workspaceId: req.workspaceId, sheetRowId: rowId },
          update: { $setOnInsert: insertDoc },
          upsert: true
        }
      });
    }

    let imported = 0;
    let updated = 0;

    if (bulkOps.length > 0) {
      const result = await Order.bulkWrite(bulkOps);
      imported = result.upsertedCount || 0;
      updated = result.modifiedCount || 0;
    }

    // Sauvegarder les headers et colonnes détectées
    settings.googleSheets.lastSyncAt = new Date();
    settings.googleSheets.detectedHeaders = headers.filter(h => h);
    settings.googleSheets.detectedColumns = columnMap;
    settings.markModified('googleSheets');
    await settings.save();

    // Auto-création des clients/prospects depuis les commandes synchronisées
    const orderStatusMap = {
      delivered: { clientStatus: 'delivered', tag: 'Client' },
      pending: { clientStatus: 'prospect', tag: 'En attente' },
      confirmed: { clientStatus: 'confirmed', tag: 'Confirmé' },
      shipped: { clientStatus: 'confirmed', tag: 'Expédié' },
      cancelled: { clientStatus: 'prospect', tag: 'Annulé' },
      returned: { clientStatus: 'returned', tag: 'Retour' }
    };
    const statusPriority = { prospect: 1, confirmed: 2, returned: 3, delivered: 4, blocked: 5 };
    let clientsCreated = 0;
    let clientsUpdated = 0;

    try {
      const syncedOrders = await Order.find({ workspaceId: req.workspaceId, source: 'google_sheets' });
      for (const order of syncedOrders) {
        if (!order.clientName) continue;
        const mapping = orderStatusMap[order.status] || orderStatusMap.pending;
        const phone = (order.clientPhone || '').trim();
        const nameParts = (order.clientName || '').trim().split(/\s+/);
        const firstName = nameParts[0] || 'Client';
        const lastName = nameParts.slice(1).join(' ') || '';
        const orderTotal = (order.price || 0) * (order.quantity || 1);
        const productName = getOrderProductName(order);

        let existingClient = null;
        if (phone) existingClient = await Client.findOne({ workspaceId: req.workspaceId, phone });
        if (!existingClient && firstName) existingClient = await Client.findOne({ workspaceId: req.workspaceId, firstName: { $regex: `^${firstName}$`, $options: 'i' }, lastName: { $regex: `^${lastName}$`, $options: 'i' } });

        if (existingClient) {
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
          clientsUpdated++;
        } else {
          await Client.create({
            workspaceId: req.workspaceId, firstName, lastName, phone,
            city: order.city || '', address: order.deliveryLocation || '',
            source: 'other', status: mapping.clientStatus,
            totalOrders: 1, totalSpent: orderTotal,
            products: productName ? [productName] : [],
            tags: [mapping.tag],
            lastContactAt: order.date || order.createdAt || new Date(),
            createdBy: req.ecomUser._id
          });
          clientsCreated++;
        }
      }
    } catch (clientErr) {
      console.error('Erreur auto-sync clients/prospects:', clientErr);
    }

    res.json({
      success: true,
      message: `Sync: ${imported} importées, ${updated} mises à jour · ${clientsCreated} prospects/clients créés, ${clientsUpdated} mis à jour`,
      data: { imported, updated, clientsCreated, clientsUpdated, totalRows: table.rows.length, detectedColumns: Object.keys(columnMap), headers: headers.filter(h => h) }
    });
  } catch (error) {
    console.error('Erreur sync Google Sheets:', error);
    res.status(500).json({ success: false, message: 'Erreur synchronisation: ' + error.message });
  }
});

// GET /api/ecom/orders/settings - Récupérer la config Google Sheets
// IMPORTANT: routes /settings AVANT /:id pour éviter le conflit
router.get('/settings', requireEcomAuth, validateEcomAccess('products', 'write'), async (req, res) => {
  try {
    let settings = await WorkspaceSettings.findOne({ workspaceId: req.workspaceId });
    if (!settings) {
      settings = await WorkspaceSettings.create({ workspaceId: req.workspaceId });
    }
    res.json({ success: true, data: settings.googleSheets });
  } catch (error) {
    console.error('Erreur get settings:', error);
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

// GET /api/ecom/orders/:id - Détail d'une commande
router.get('/:id', requireEcomAuth, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, workspaceId: req.workspaceId }).populate('assignedLivreur', 'name email phone');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Erreur get order:', error);
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

export default router;
