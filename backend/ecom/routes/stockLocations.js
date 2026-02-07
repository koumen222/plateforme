import express from 'express';
import mongoose from 'mongoose';
import StockLocation from '../models/StockLocation.js';
import Product from '../models/Product.js';
import { requireEcomAuth, validateEcomAccess } from '../middleware/ecomAuth.js';

const router = express.Router();

// GET /api/ecom/stock-locations - Liste du stock par emplacement
router.get('/',
  requireEcomAuth,
  async (req, res) => {
    try {
      const { city, agency, productId } = req.query;
      const filter = { workspaceId: req.workspaceId };

      if (city) filter.city = { $regex: new RegExp(city, 'i') };
      if (agency) filter.agency = { $regex: new RegExp(agency, 'i') };
      if (productId) filter.productId = productId;

      const entries = await StockLocation.find(filter)
        .populate('productId', 'name sellingPrice productCost')
        .populate('updatedBy', 'email')
        .sort({ city: 1, agency: 1 });

      res.json({ success: true, data: entries });
    } catch (error) {
      console.error('Erreur get stock locations:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

// GET /api/ecom/stock-locations/summary - Résumé par ville et agence
router.get('/summary',
  requireEcomAuth,
  async (req, res) => {
    try {
      const wsId = new mongoose.Types.ObjectId(req.workspaceId);

      // Par ville
      const byCity = await StockLocation.aggregate([
        { $match: { workspaceId: wsId } },
        {
          $group: {
            _id: '$city',
            totalQuantity: { $sum: '$quantity' },
            totalValue: { $sum: { $multiply: ['$quantity', '$unitCost'] } },
            entries: { $sum: 1 }
          }
        },
        { $sort: { totalQuantity: -1 } }
      ]);

      // Par agence
      const byAgency = await StockLocation.aggregate([
        { $match: { workspaceId: wsId, agency: { $ne: '' } } },
        {
          $group: {
            _id: '$agency',
            totalQuantity: { $sum: '$quantity' },
            totalValue: { $sum: { $multiply: ['$quantity', '$unitCost'] } },
            cities: { $addToSet: '$city' },
            entries: { $sum: 1 }
          }
        },
        { $sort: { totalQuantity: -1 } }
      ]);

      // Par produit
      const byProduct = await StockLocation.aggregate([
        { $match: { workspaceId: wsId } },
        {
          $group: {
            _id: '$productId',
            totalQuantity: { $sum: '$quantity' },
            totalValue: { $sum: { $multiply: ['$quantity', '$unitCost'] } },
            cities: { $addToSet: '$city' }
          }
        },
        {
          $lookup: {
            from: 'ecom_products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $project: {
            productName: '$product.name',
            totalQuantity: 1,
            totalValue: 1,
            cities: 1
          }
        },
        { $sort: { totalQuantity: -1 } }
      ]);

      // Totaux globaux
      const totals = await StockLocation.aggregate([
        { $match: { workspaceId: wsId } },
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: '$quantity' },
            totalValue: { $sum: { $multiply: ['$quantity', '$unitCost'] } },
            totalEntries: { $sum: 1 },
            uniqueCities: { $addToSet: '$city' },
            uniqueAgencies: { $addToSet: { $cond: [{ $eq: ['$agency', ''] }, '$$REMOVE', '$agency'] } }
          }
        }
      ]);

      const total = totals[0] || { totalQuantity: 0, totalValue: 0, totalEntries: 0, uniqueCities: [], uniqueAgencies: [] };

      res.json({
        success: true,
        data: {
          byCity,
          byAgency,
          byProduct,
          totals: {
            totalQuantity: total.totalQuantity,
            totalValue: total.totalValue,
            totalEntries: total.totalEntries,
            citiesCount: total.uniqueCities?.length || 0,
            agenciesCount: total.uniqueAgencies?.length || 0
          }
        }
      });
    } catch (error) {
      console.error('Erreur stock summary:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

// POST /api/ecom/stock-locations - Ajouter/mettre à jour un emplacement de stock
router.post('/',
  requireEcomAuth,
  validateEcomAccess('products', 'write'),
  async (req, res) => {
    try {
      const { productId, city, agency, quantity, unitCost, notes } = req.body;

      if (!productId || quantity === undefined) {
        return res.status(400).json({ success: false, message: 'Produit et quantité sont requis' });
      }

      // Vérifier que le produit existe
      const product = await Product.findOne({ _id: productId, workspaceId: req.workspaceId });
      if (!product) {
        return res.status(404).json({ success: false, message: 'Produit non trouvé' });
      }

      // Upsert: créer ou mettre à jour
      const entry = await StockLocation.findOneAndUpdate(
        {
          workspaceId: req.workspaceId,
          productId,
          city: city.trim(),
          agency: (agency || '').trim()
        },
        {
          $set: {
            quantity: parseInt(quantity),
            unitCost: parseFloat(unitCost) || product.productCost || 0,
            notes: notes || '',
            updatedBy: req.ecomUser._id
          }
        },
        { upsert: true, new: true }
      );

      const populated = await StockLocation.findById(entry._id)
        .populate('productId', 'name sellingPrice productCost')
        .populate('updatedBy', 'email');

      res.status(201).json({
        success: true,
        message: 'Stock mis à jour',
        data: populated
      });
    } catch (error) {
      console.error('Erreur create/update stock location:', error);
      if (error.code === 11000) {
        return res.status(400).json({ success: false, message: 'Cet emplacement existe déjà' });
      }
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

// PUT /api/ecom/stock-locations/:id - Modifier un emplacement
router.put('/:id',
  requireEcomAuth,
  validateEcomAccess('products', 'write'),
  async (req, res) => {
    try {
      const entry = await StockLocation.findOne({ _id: req.params.id, workspaceId: req.workspaceId });
      if (!entry) {
        return res.status(404).json({ success: false, message: 'Emplacement non trouvé' });
      }

      const { city, agency, quantity, unitCost, notes } = req.body;
      if (city !== undefined) entry.city = city.trim();
      if (agency !== undefined) entry.agency = (agency || '').trim();
      if (quantity !== undefined) entry.quantity = parseInt(quantity);
      if (unitCost !== undefined) entry.unitCost = parseFloat(unitCost);
      if (notes !== undefined) entry.notes = notes;
      entry.updatedBy = req.ecomUser._id;

      await entry.save();

      const populated = await StockLocation.findById(entry._id)
        .populate('productId', 'name sellingPrice productCost')
        .populate('updatedBy', 'email');

      res.json({ success: true, message: 'Emplacement mis à jour', data: populated });
    } catch (error) {
      console.error('Erreur update stock location:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

// DELETE /api/ecom/stock-locations/:id - Supprimer un emplacement
router.delete('/:id',
  requireEcomAuth,
  validateEcomAccess('products', 'write'),
  async (req, res) => {
    try {
      const entry = await StockLocation.findOneAndDelete({ _id: req.params.id, workspaceId: req.workspaceId });
      if (!entry) {
        return res.status(404).json({ success: false, message: 'Emplacement non trouvé' });
      }
      res.json({ success: true, message: 'Emplacement supprimé' });
    } catch (error) {
      console.error('Erreur delete stock location:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

// POST /api/ecom/stock-locations/:id/adjust - Ajuster le stock (ajouter/retirer)
router.post('/:id/adjust',
  requireEcomAuth,
  validateEcomAccess('products', 'write'),
  async (req, res) => {
    try {
      const { adjustment, reason } = req.body;
      if (!adjustment || adjustment === 0) {
        return res.status(400).json({ success: false, message: 'Ajustement requis (positif ou négatif)' });
      }

      const entry = await StockLocation.findOne({ _id: req.params.id, workspaceId: req.workspaceId });
      if (!entry) {
        return res.status(404).json({ success: false, message: 'Emplacement non trouvé' });
      }

      const newQty = entry.quantity + parseInt(adjustment);
      if (newQty < 0) {
        return res.status(400).json({ success: false, message: `Stock insuffisant. Actuel: ${entry.quantity}` });
      }

      entry.quantity = newQty;
      entry.notes = reason ? `${entry.notes ? entry.notes + ' | ' : ''}${adjustment > 0 ? '+' : ''}${adjustment}: ${reason}` : entry.notes;
      entry.updatedBy = req.ecomUser._id;
      await entry.save();

      const populated = await StockLocation.findById(entry._id)
        .populate('productId', 'name sellingPrice productCost')
        .populate('updatedBy', 'email');

      res.json({ success: true, message: `Stock ajusté de ${adjustment > 0 ? '+' : ''}${adjustment}`, data: populated });
    } catch (error) {
      console.error('Erreur adjust stock:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

export default router;
