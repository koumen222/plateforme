import express from 'express';
import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import { requireEcomAuth, validateEcomAccess } from '../middleware/ecomAuth.js';

const router = express.Router();

// GET /api/ecom/transactions - Liste des transactions
router.get('/', 
  requireEcomAuth, 
  validateEcomAccess('finance', 'read'),
  async (req, res) => {
    try {
      const { type, category, startDate, endDate, page = 1, limit = 50 } = req.query;
      const filter = { workspaceId: req.workspaceId };

      if (type) filter.type = type;
      if (category) filter.category = category;
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          filter.date.$lte = end;
        }
      }

      const transactions = await Transaction.find(filter)
        .populate('productId', 'name')
        .populate('createdBy', 'email')
        .sort({ date: -1, createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Transaction.countDocuments(filter);

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Erreur get transactions:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

// GET /api/ecom/transactions/summary - Résumé financier
router.get('/summary',
  requireEcomAuth,
  validateEcomAccess('finance', 'read'),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const matchStage = { workspaceId: new mongoose.Types.ObjectId(req.workspaceId) };

      if (startDate || endDate) {
        matchStage.date = {};
        if (startDate) matchStage.date.$gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          matchStage.date.$lte = end;
        }
      }

      // Résumé par type
      const summary = await Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      // Résumé par catégorie
      const byCategory = await Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { type: '$type', category: '$category' },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.type': 1, total: -1 } }
      ]);

      // Résumé par mois
      const byMonth = await Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
              type: '$type'
            },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } }
      ]);

      const incomeData = summary.find(s => s._id === 'income') || { total: 0, count: 0 };
      const expenseData = summary.find(s => s._id === 'expense') || { total: 0, count: 0 };

      res.json({
        success: true,
        data: {
          totalIncome: incomeData.total,
          totalExpense: expenseData.total,
          balance: incomeData.total - expenseData.total,
          incomeCount: incomeData.count,
          expenseCount: expenseData.count,
          byCategory,
          byMonth
        }
      });
    } catch (error) {
      console.error('Erreur transaction summary:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

// GET /api/ecom/transactions/:id - Détail d'une transaction
router.get('/:id',
  requireEcomAuth,
  validateEcomAccess('finance', 'read'),
  async (req, res) => {
    try {
      const transaction = await Transaction.findOne({ _id: req.params.id, workspaceId: req.workspaceId })
        .populate('productId', 'name')
        .populate('createdBy', 'email');

      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction non trouvée' });
      }

      res.json({ success: true, data: transaction });
    } catch (error) {
      console.error('Erreur get transaction:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

// POST /api/ecom/transactions - Créer une transaction
router.post('/',
  requireEcomAuth,
  validateEcomAccess('finance', 'write'),
  async (req, res) => {
    try {
      const { date, type, category, amount, description, reference, productId } = req.body;

      const errors = [];
      if (!date) errors.push('Date requise');
      if (!type || !['income', 'expense'].includes(type)) errors.push('Type invalide (income ou expense)');
      if (!category) errors.push('Catégorie requise');
      if (!amount || amount <= 0) errors.push('Montant requis et doit être positif');

      if (errors.length > 0) {
        return res.status(400).json({ success: false, message: 'Erreurs de validation', errors });
      }

      const transaction = new Transaction({
        workspaceId: req.workspaceId,
        date: new Date(date),
        type,
        category,
        amount,
        description: description || '',
        reference: reference || '',
        productId: productId || null,
        createdBy: req.ecomUser._id
      });

      await transaction.save();

      const populated = await Transaction.findById(transaction._id)
        .populate('productId', 'name')
        .populate('createdBy', 'email');

      res.status(201).json({
        success: true,
        message: 'Transaction créée avec succès',
        data: populated
      });
    } catch (error) {
      console.error('Erreur create transaction:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

// PUT /api/ecom/transactions/:id - Modifier une transaction
router.put('/:id',
  requireEcomAuth,
  validateEcomAccess('finance', 'write'),
  async (req, res) => {
    try {
      const transaction = await Transaction.findOne({ _id: req.params.id, workspaceId: req.workspaceId });
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction non trouvée' });
      }

      Object.assign(transaction, req.body);
      if (req.body.date) transaction.date = new Date(req.body.date);
      await transaction.save();

      const updated = await Transaction.findById(transaction._id)
        .populate('productId', 'name')
        .populate('createdBy', 'email');

      res.json({
        success: true,
        message: 'Transaction mise à jour',
        data: updated
      });
    } catch (error) {
      console.error('Erreur update transaction:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

// DELETE /api/ecom/transactions/:id - Supprimer une transaction
router.delete('/:id',
  requireEcomAuth,
  validateEcomAccess('finance', 'write'),
  async (req, res) => {
    try {
      const transaction = await Transaction.findOne({ _id: req.params.id, workspaceId: req.workspaceId });
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction non trouvée' });
      }

      await Transaction.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: 'Transaction supprimée' });
    } catch (error) {
      console.error('Erreur delete transaction:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

export default router;
