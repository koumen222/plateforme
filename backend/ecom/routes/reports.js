import express from 'express';
import mongoose from 'mongoose';
import DailyReport from '../models/DailyReport.js';
import Product from '../models/Product.js';
import { requireEcomAuth, validateEcomAccess } from '../middleware/ecomAuth.js';
import { validateDailyReport } from '../middleware/validation.js';

const router = express.Router();

// GET /api/ecom/reports - Liste des rapports quotidiens
router.get('/', requireEcomAuth, async (req, res) => {
  try {
    const { productId, date, startDate, endDate, page = 1, limit = 50 } = req.query;
    const filter = { workspaceId: req.workspaceId };
    
    if (productId) filter.productId = productId;
    if (date) {
      // Filtre par date exacte (début et fin de la journée)
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      filter.date = { $gte: dayStart, $lte: dayEnd };
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const reports = await DailyReport.find(filter)
      .populate('productId', 'name sellingPrice productCost deliveryCost')
      .populate('reportedBy', 'email')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await DailyReport.countDocuments(filter);

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Erreur get reports:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/ecom/reports/stats/financial - Statistiques financières (compta et admin)
router.get('/stats/financial', 
  requireEcomAuth, 
  validateEcomAccess('finance', 'read'),
  async (req, res) => {
    try {
      const { startDate, endDate, productId } = req.query;
      const matchStage = { workspaceId: new mongoose.Types.ObjectId(req.workspaceId) };
      
      if (startDate || endDate) {
        matchStage.date = {};
        if (startDate) matchStage.date.$gte = new Date(startDate);
        if (endDate) matchStage.date.$lte = new Date(endDate);
      }
      if (productId) matchStage.productId = new mongoose.Types.ObjectId(productId);

      const financialStats = await DailyReport.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'ecom_products',
            localField: 'productId',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: { $multiply: ['$ordersDelivered', '$product.sellingPrice'] }
            },
            totalProductCost: {
              $sum: { $multiply: ['$ordersDelivered', '$product.productCost'] }
            },
            totalDeliveryCost: {
              $sum: { $multiply: ['$ordersDelivered', '$product.deliveryCost'] }
            },
            totalAdSpend: { $sum: '$adSpend' },
            totalOrdersReceived: { $sum: '$ordersReceived' },
            totalOrdersDelivered: { $sum: '$ordersDelivered' }
          }
        },
        {
          $addFields: {
            totalCost: { $add: ['$totalProductCost', '$totalDeliveryCost', '$totalAdSpend'] },
            totalProfit: { 
              $subtract: [
                '$totalRevenue', 
                { $add: ['$totalProductCost', '$totalDeliveryCost', '$totalAdSpend'] }
              ] 
            },
            profitabilityRate: {
              $cond: [
                { $eq: ['$totalRevenue', 0] },
                0,
                { $multiply: [
                  { $divide: [
                    { $subtract: ['$totalRevenue', { $add: ['$totalProductCost', '$totalDeliveryCost', '$totalAdSpend'] }] },
                    '$totalRevenue'
                  ]},
                  100
                ]}
              ]
            },
            deliveryRate: {
              $cond: [
                { $eq: ['$totalOrdersReceived', 0] },
                0,
                { $divide: ['$totalOrdersDelivered', '$totalOrdersReceived'] }
              ]
            },
            roas: {
              $cond: [
                { $eq: ['$totalAdSpend', 0] },
                0,
                { $divide: ['$totalRevenue', '$totalAdSpend'] }
              ]
            }
          }
        }
      ]);

      const stats = financialStats[0] || {
        totalRevenue: 0,
        totalProductCost: 0,
        totalDeliveryCost: 0,
        totalAdSpend: 0,
        totalCost: 0,
        totalProfit: 0,
        totalOrdersReceived: 0,
        totalOrdersDelivered: 0,
        profitabilityRate: 0,
        deliveryRate: 0,
        roas: 0
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Erreur financial stats:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }
);

// GET /api/ecom/reports/:id - Détail d'un rapport
router.get('/:id', requireEcomAuth, async (req, res) => {
  try {
    const report = await DailyReport.findOne({ _id: req.params.id, workspaceId: req.workspaceId })
      .populate('productId', 'name sellingPrice productCost deliveryCost avgAdsCost')
      .populate('reportedBy', 'email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Rapport non trouvé'
      });
    }

    // Calculer les métriques
    const metrics = await report.calculateMetrics();

    res.json({
      success: true,
      data: {
        ...report.toObject(),
        metrics
      }
    });
  } catch (error) {
    console.error('Erreur get report:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/ecom/reports - Créer un rapport quotidien
router.post('/', 
  requireEcomAuth, 
  validateEcomAccess('orders', 'write'),
  validateDailyReport, 
  async (req, res) => {
    try {
      console.log('📊 POST /api/ecom/reports - Création de rapport');
      console.log('👤 Utilisateur:', req.ecomUser?.email);
      console.log('📋 Corps de la requête:', req.body);
      
      const { date, productId, ordersReceived, ordersDelivered, adSpend, notes } = req.body;

      // Vérifier que le produit existe dans le même workspace
      const product = await Product.findOne({ _id: productId, workspaceId: req.workspaceId });
      if (!product) {
        console.log('❌ Produit non trouvé:', productId);
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }

      console.log('✅ Produit trouvé:', product.name);
      console.log('💰 Prix vente:', product.sellingPrice, 'Coûts:', product.productCost, '+', product.deliveryCost);

      // Vérifier si un rapport existe déjà pour cette date et ce produit
      const existingReport = await DailyReport.findOne({
        workspaceId: req.workspaceId,
        date: new Date(date),
        productId
      });

      if (existingReport) {
        return res.status(400).json({
          success: false,
          message: 'Un rapport existe déjà pour cette date et ce produit'
        });
      }

      const reportData = {
        workspaceId: req.workspaceId,
        date: new Date(date),
        productId,
        ordersReceived,
        ordersDelivered,
        adSpend,
        notes,
        reportedBy: req.ecomUser._id
      };

      // Calculer le bénéfice (sans inclure avgAdsCost)
      const sellingPrice = product.sellingPrice || 0;
      const productCost = product.productCost || 0;
      const deliveryCost = product.deliveryCost || 0;
      const totalCost = productCost + deliveryCost;
      const unitBenefit = sellingPrice - totalCost;
      const totalBenefit = unitBenefit * ordersDelivered;
      
      reportData.unitBenefit = unitBenefit;
      reportData.totalBenefit = totalBenefit;
      
      console.log('💰 Bénéfice calculé - Unité:', unitBenefit, 'Total:', totalBenefit);

      const report = new DailyReport(reportData);
      await report.save();

      const populatedReport = await DailyReport.findById(report._id)
        .populate('productId', 'name sellingPrice')
        .populate('reportedBy', 'email');

      res.status(201).json({
        success: true,
        message: 'Rapport créé avec succès',
        data: populatedReport
      });
    } catch (error) {
      console.error('Erreur create report:', error);
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Un rapport existe déjà pour cette date et ce produit'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }
);

// PUT /api/ecom/reports/:id - Modifier un rapport
router.put('/:id', 
  requireEcomAuth, 
  validateEcomAccess('orders', 'write'),
  validateDailyReport, 
  async (req, res) => {
    try {
      const report = await DailyReport.findOne({ _id: req.params.id, workspaceId: req.workspaceId });
      
      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Rapport non trouvé'
        });
      }

      // Vérifier que le produit existe si changement
      if (req.body.productId && req.body.productId !== report.productId.toString()) {
        const product = await Product.findById(req.body.productId);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: 'Produit non trouvé'
          });
        }
      }

      Object.assign(report, req.body);
      await report.save();

      const updatedReport = await DailyReport.findById(report._id)
        .populate('productId', 'name sellingPrice')
        .populate('reportedBy', 'email');

      res.json({
        success: true,
        message: 'Rapport mis à jour avec succès',
        data: updatedReport
      });
    } catch (error) {
      console.error('Erreur update report:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }
);

// DELETE /api/ecom/reports/:id - Supprimer un rapport (admin uniquement)
router.delete('/:id', 
  requireEcomAuth, 
  validateEcomAccess('products', 'write'),
  async (req, res) => {
    try {
      const report = await DailyReport.findOne({ _id: req.params.id, workspaceId: req.workspaceId });
      
      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Rapport non trouvé'
        });
      }

      await DailyReport.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: 'Rapport supprimé avec succès'
      });
    } catch (error) {
      console.error('Erreur delete report:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }
);

export default router;
