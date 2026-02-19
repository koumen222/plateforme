import express from 'express';
import mongoose from 'mongoose';
import OpenAI from 'openai';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { requireEcomAuth, validateEcomAccess } from '../middleware/ecomAuth.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

// GET /api/ecom/transactions/budgets
router.get('/budgets',
  requireEcomAuth,
  validateEcomAccess('finance', 'read'),
  async (req, res) => {
    try {
      const wid = new mongoose.Types.ObjectId(req.workspaceId);
      const { month } = req.query;
      let startOfMonth, endOfMonth;
      if (month && /^\d{4}-\d{2}$/.test(month)) {
        const [year, monthNum] = month.split('-').map(Number);
        startOfMonth = new Date(year, monthNum - 1, 1);
        endOfMonth = new Date(year, monthNum, 0, 23, 59, 59);
      } else {
        const now = new Date();
        startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      }

      const [budgetDocs, categorySpending, productSpending] = await Promise.all([
        Budget.find({ workspaceId: req.workspaceId, isActive: true }).populate('productId', 'name status sellingPrice').lean(),
        Transaction.aggregate([
          { $match: { workspaceId: wid, type: 'expense', date: { $gte: startOfMonth, $lte: endOfMonth } } },
          { $group: { _id: '$category', totalSpent: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]),
        Transaction.aggregate([
          { $match: { workspaceId: wid, type: 'expense', date: { $gte: startOfMonth, $lte: endOfMonth }, productId: { $ne: null } } },
          { $group: { _id: { category: '$category', productId: '$productId' }, totalSpent: { $sum: '$amount' }, count: { $sum: 1 } } }
        ])
      ]);

      const budgets = budgetDocs.map(budget => {
        let totalSpent, txCount;
        if (budget.productId) {
          const ps = productSpending.find(s => s._id.category === budget.category && s._id.productId.toString() === budget.productId._id.toString());
          totalSpent = ps?.totalSpent || 0;
          txCount = ps?.count || 0;
        } else {
          const cs = categorySpending.find(s => s._id === budget.category) || { totalSpent: 0, count: 0 };
          totalSpent = cs.totalSpent;
          txCount = cs.count;
        }
        const remaining = budget.amount - totalSpent;
        const percentage = budget.amount > 0 ? (totalSpent / budget.amount) * 100 : 0;
        return {
          ...budget,
          totalSpent,
          transactionCount: txCount,
          remaining,
          percentage,
          status: percentage > 100 ? 'exceeded' : percentage >= 70 ? 'warning' : 'ok'
        };
      });

      budgets.sort((a, b) => b.percentage - a.percentage);

      res.json({
        success: true,
        data: {
          budgets,
          summary: {
            totalBudget: budgets.reduce((s, b) => s + b.amount, 0),
            totalSpent: budgets.reduce((s, b) => s + b.totalSpent, 0),
            totalRemaining: budgets.reduce((s, b) => s + b.remaining, 0),
            exceededCount: budgets.filter(b => b.status === 'exceeded').length,
            warningCount: budgets.filter(b => b.status === 'warning').length
          }
        }
      });
    } catch (error) {
      console.error('Erreur budgets:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

// POST /api/ecom/transactions/budgets
router.post('/budgets',
  requireEcomAuth,
  validateEcomAccess('finance', 'write'),
  async (req, res) => {
    try {
      const budget = new Budget({
        ...req.body,
        workspaceId: req.workspaceId,
        createdBy: req.ecomUser._id
      });
      await budget.save();
      res.status(201).json({ success: true, data: budget });
    } catch (error) {
      console.error('Erreur create budget:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

// PUT /api/ecom/transactions/budgets/:id
router.put('/budgets/:id',
  requireEcomAuth,
  validateEcomAccess('finance', 'write'),
  async (req, res) => {
    try {
      const budget = await Budget.findOneAndUpdate(
        { _id: req.params.id, workspaceId: req.workspaceId },
        req.body,
        { new: true }
      );
      if (!budget) return res.status(404).json({ success: false, message: 'Budget non trouvé' });
      res.json({ success: true, data: budget });
    } catch (error) {
      console.error('Erreur update budget:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

// DELETE /api/ecom/transactions/budgets/:id
router.delete('/budgets/:id',
  requireEcomAuth,
  validateEcomAccess('finance', 'write'),
  async (req, res) => {
    try {
      const budget = await Budget.findOneAndDelete({ _id: req.params.id, workspaceId: req.workspaceId });
      if (!budget) return res.status(404).json({ success: false, message: 'Budget non trouvé' });
      res.json({ success: true, message: 'Budget supprimé' });
    } catch (error) {
      console.error('Erreur delete budget:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

// GET /api/ecom/transactions/forecast - Analyse profonde & prévisions
router.get('/forecast',
  requireEcomAuth,
  validateEcomAccess('finance', 'read'),
  async (req, res) => {
    try {
      const wid = new mongoose.Types.ObjectId(req.workspaceId);
      const wsId = req.workspaceId;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysPassed = now.getDate();
      const daysLeft = daysInMonth - daysPassed;
      const start6MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      const [
        monthSoFar, last6Months, categoryThisMonth, categoryLastMonth,
        ordersThisMonth, ordersLastMonth, ordersByProduct,
        products, budgetDocs, weeklyTrend
      ] = await Promise.all([
        Transaction.aggregate([
          { $match: { workspaceId: wid, date: { $gte: startOfMonth, $lte: now } } },
          { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]),
        Transaction.aggregate([
          { $match: { workspaceId: wid, date: { $gte: start6MonthsAgo } } },
          { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]),
        Transaction.aggregate([
          { $match: { workspaceId: wid, type: 'expense', date: { $gte: startOfMonth, $lte: now } } },
          { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
          { $sort: { total: -1 } }
        ]),
        Transaction.aggregate([
          { $match: { workspaceId: wid, type: 'expense', date: { $gte: startLastMonth, $lte: endLastMonth } } },
          { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]),
        Order.aggregate([
          { $match: { workspaceId: wid, date: { $gte: startOfMonth, $lte: now } } },
          { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: { $multiply: [{ $ifNull: ['$price', 0] }, { $ifNull: ['$quantity', 1] }] } } } }
        ]),
        Order.aggregate([
          { $match: { workspaceId: wid, date: { $gte: startLastMonth, $lte: endLastMonth } } },
          { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: { $multiply: [{ $ifNull: ['$price', 0] }, { $ifNull: ['$quantity', 1] }] } } } }
        ]),
        Order.aggregate([
          { $match: { workspaceId: wid, date: { $gte: startOfMonth, $lte: now } } },
          { $group: { _id: '$product', orders: { $sum: 1 }, revenue: { $sum: { $multiply: [{ $ifNull: ['$price', 0] }, { $ifNull: ['$quantity', 1] }] } }, delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } }, returned: { $sum: { $cond: [{ $in: ['$status', ['returned', 'no_answer']] }, 1, 0] } } } },
          { $sort: { revenue: -1 } },
          { $limit: 10 }
        ]),
        Product.find({ workspaceId: wsId, isActive: true }).select('name status sellingPrice productCost deliveryCost avgAdsCost stock').lean(),
        Budget.find({ workspaceId: wsId, isActive: true }).populate('productId', 'name').lean(),
        Transaction.aggregate([
          { $match: { workspaceId: wid, date: { $gte: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000) } } },
          { $group: { _id: { week: { $isoWeek: '$date' }, type: '$type' }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
          { $sort: { '_id.week': 1 } }
        ])
      ]);

      const currentExpense = monthSoFar.find(t => t._id === 'expense')?.total || 0;
      const currentIncome = monthSoFar.find(t => t._id === 'income')?.total || 0;
      const dailyExpenseRate = daysPassed > 0 ? currentExpense / daysPassed : 0;
      const dailyIncomeRate = daysPassed > 0 ? currentIncome / daysPassed : 0;
      const projectedExpense = currentExpense + (dailyExpenseRate * daysLeft);
      const projectedIncome = currentIncome + (dailyIncomeRate * daysLeft);
      const ratio = projectedIncome > 0 ? projectedExpense / projectedIncome : 1;
      const healthScore = Math.max(0, Math.min(100, Math.round((1 - ratio) * 100 + 50)));

      const totalOrdersThisMonth = ordersThisMonth.reduce((s, o) => s + o.count, 0);
      const totalRevenueThisMonth = ordersThisMonth.reduce((s, o) => s + o.revenue, 0);
      const deliveredThisMonth = ordersThisMonth.find(o => o._id === 'delivered');
      const totalOrdersLastMonth = ordersLastMonth.reduce((s, o) => s + o.count, 0);
      const totalRevenueLastMonth = ordersLastMonth.reduce((s, o) => s + o.revenue, 0);
      const orderGrowth = totalOrdersLastMonth > 0 ? ((totalOrdersThisMonth - totalOrdersLastMonth) / totalOrdersLastMonth * 100) : 0;
      const revenueGrowth = totalRevenueLastMonth > 0 ? ((totalRevenueThisMonth - totalRevenueLastMonth) / totalRevenueLastMonth * 100) : 0;
      const deliveryRate = totalOrdersThisMonth > 0 ? ((deliveredThisMonth?.count || 0) / totalOrdersThisMonth * 100) : 0;

      const categoryAnalysis = categoryThisMonth.map(cat => {
        const lastMonth = categoryLastMonth.find(c => c._id === cat._id);
        const lastTotal = lastMonth?.total || 0;
        const variation = lastTotal > 0 ? ((cat.total - lastTotal) / lastTotal * 100) : (cat.total > 0 ? 100 : 0);
        const projectedCategory = daysPassed > 0 ? (cat.total / daysPassed) * daysInMonth : 0;
        return { category: cat._id, currentSpent: cat.total, lastMonthSpent: lastTotal, variation: Math.round(variation), projected: Math.round(projectedCategory), txCount: cat.count, dailyRate: daysPassed > 0 ? Math.round(cat.total / daysPassed) : 0 };
      });

      const productAnalysis = ordersByProduct.map(p => {
        const productInfo = products.find(pr => pr.name === p._id);
        const margin = productInfo ? productInfo.sellingPrice - productInfo.productCost - productInfo.deliveryCost : 0;
        const returnRate = p.orders > 0 ? (p.returned / p.orders * 100) : 0;
        const deliveryRateP = p.orders > 0 ? (p.delivered / p.orders * 100) : 0;
        return { name: p._id || 'Inconnu', orders: p.orders, revenue: p.revenue, delivered: p.delivered, returned: p.returned, deliveryRate: Math.round(deliveryRateP), returnRate: Math.round(returnRate), margin: Math.round(margin), estimatedProfit: Math.round(p.delivered * margin), stock: productInfo?.stock || null, status: productInfo?.status || null };
      });

      const budgetAlerts = [];
      for (const budget of budgetDocs) {
        const catSpending = categoryThisMonth.find(c => c._id === budget.category);
        const spent = catSpending?.total || 0;
        const pct = budget.amount > 0 ? (spent / budget.amount * 100) : 0;
        const projectedBudgetSpend = daysPassed > 0 ? (spent / daysPassed) * daysInMonth : 0;
        const projectedPct = budget.amount > 0 ? (projectedBudgetSpend / budget.amount * 100) : 0;
        if (pct >= 60 || projectedPct >= 90) {
          budgetAlerts.push({ name: budget.name, category: budget.category, product: budget.productId?.name || null, amount: budget.amount, spent: Math.round(spent), percentage: Math.round(pct), projectedSpend: Math.round(projectedBudgetSpend), projectedPercentage: Math.round(projectedPct), severity: pct > 100 ? 'critical' : pct >= 80 ? 'high' : projectedPct >= 100 ? 'medium' : 'low' });
        }
      }
      budgetAlerts.sort((a, b) => { const sev = { critical: 4, high: 3, medium: 2, low: 1 }; return sev[b.severity] - sev[a.severity]; });

      const weeks = [...new Set(weeklyTrend.map(w => w._id.week))].sort();
      const weeklyData = weeks.map(w => {
        const exp = weeklyTrend.find(t => t._id.week === w && t._id.type === 'expense')?.total || 0;
        const inc = weeklyTrend.find(t => t._id.week === w && t._id.type === 'income')?.total || 0;
        return { week: w, expenses: Math.round(exp), income: Math.round(inc), balance: Math.round(inc - exp) };
      });

      const monthKeys = [...new Set(last6Months.map(m => `${m._id.year}-${String(m._id.month).padStart(2, '0')}`))].sort();
      const monthlyData = monthKeys.map(mk => {
        const exp = last6Months.find(m => `${m._id.year}-${String(m._id.month).padStart(2, '0')}` === mk && m._id.type === 'expense')?.total || 0;
        const inc = last6Months.find(m => `${m._id.year}-${String(m._id.month).padStart(2, '0')}` === mk && m._id.type === 'income')?.total || 0;
        return { month: mk, expenses: Math.round(exp), income: Math.round(inc), margin: inc > 0 ? Math.round((inc - exp) / inc * 100) : 0 };
      });

      const last3MonthsData = monthlyData.slice(-4, -1);
      const avg3mExpense = last3MonthsData.length > 0 ? last3MonthsData.reduce((s, m) => s + m.expenses, 0) / last3MonthsData.length : 0;
      const avg3mIncome = last3MonthsData.length > 0 ? last3MonthsData.reduce((s, m) => s + m.income, 0) / last3MonthsData.length : 0;

      const recommendations = [];
      if (ratio > 0.8) recommendations.push({ type: 'critical', icon: '🚨', title: 'Ratio dépenses/revenus critique', detail: `Vos dépenses représentent ${Math.round(ratio * 100)}% de vos revenus.`, action: 'Réduire les dépenses non essentielles.' });
      else if (ratio > 0.6) recommendations.push({ type: 'warning', icon: '⚠️', title: 'Marge bénéficiaire serrée', detail: `Ratio: ${Math.round(ratio * 100)}%.`, action: 'Optimiser les coûts.' });
      if (orderGrowth < -15) recommendations.push({ type: 'critical', icon: '📉', title: 'Baisse des commandes', detail: `${Math.round(orderGrowth)}% vs mois dernier.`, action: 'Analyser les campagnes pub.' });
      else if (orderGrowth > 20) recommendations.push({ type: 'success', icon: '🚀', title: 'Forte croissance', detail: `+${Math.round(orderGrowth)}% vs mois dernier.`, action: 'Vérifier les stocks.' });
      if (deliveryRate < 50 && totalOrdersThisMonth > 5) recommendations.push({ type: 'warning', icon: '🚚', title: 'Taux de livraison faible', detail: `${Math.round(deliveryRate)}% livrées.`, action: 'Améliorer le suivi.' });
      const criticalBudgets = budgetAlerts.filter(b => b.severity === 'critical' || b.severity === 'high');
      if (criticalBudgets.length > 0) recommendations.push({ type: 'warning', icon: '💰', title: `${criticalBudgets.length} budget(s) en dépassement`, detail: criticalBudgets.map(b => `${b.name}: ${b.percentage}%`).join(', '), action: 'Geler les dépenses non urgentes.' });
      recommendations.sort((a, b) => { const p = { critical: 4, warning: 3, info: 2, success: 1 }; return (p[b.type] || 0) - (p[a.type] || 0); });

      res.json({
        success: true,
        data: {
          currentExpense, currentIncome,
          projectedExpense: Math.round(projectedExpense), projectedIncome: Math.round(projectedIncome),
          projectedBalance: Math.round(projectedIncome - projectedExpense),
          dailyExpenseRate: Math.round(dailyExpenseRate), dailyIncomeRate: Math.round(dailyIncomeRate),
          daysPassed, daysLeft, daysInMonth, healthScore,
          healthLabel: healthScore >= 70 ? 'Saine' : healthScore >= 40 ? 'Attention' : 'Critique',
          avg3mExpense: Math.round(avg3mExpense), avg3mIncome: Math.round(avg3mIncome),
          expenseVsAvg: avg3mExpense > 0 ? Math.round((projectedExpense - avg3mExpense) / avg3mExpense * 100) : 0,
          incomeVsAvg: avg3mIncome > 0 ? Math.round((projectedIncome - avg3mIncome) / avg3mIncome * 100) : 0,
          orders: { thisMonth: totalOrdersThisMonth, lastMonth: totalOrdersLastMonth, growth: Math.round(orderGrowth), revenueThisMonth: Math.round(totalRevenueThisMonth), revenueLastMonth: Math.round(totalRevenueLastMonth), revenueGrowth: Math.round(revenueGrowth), deliveryRate: Math.round(deliveryRate), byStatus: ordersThisMonth.map(o => ({ status: o._id, count: o.count, revenue: Math.round(o.revenue) })) },
          categoryAnalysis, productAnalysis, budgetAlerts,
          weeklyTrend: weeklyData, monthlyTrend: monthlyData, recommendations
        }
      });
    } catch (error) {
      console.error('Erreur forecast:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

// POST /api/ecom/transactions/forecast/ai
router.post('/forecast/ai',
  requireEcomAuth,
  validateEcomAccess('finance', 'read'),
  async (req, res) => {
    try {
      const { forecastData } = req.body;
      if (!forecastData) return res.status(400).json({ success: false, message: 'Données forecast manquantes' });
      const f = forecastData;
      const catLabels = { publicite: 'Publicité', produit: 'Achat produit', livraison: 'Livraison', salaire: 'Salaire', abonnement: 'Abonnements', materiel: 'Matériel', transport: 'Transport', autre_depense: 'Autres dépenses' };
      const summary = `Tu es un expert en analyse financière e-commerce. Analyse ces données et réponds UNIQUEMENT avec un JSON valide (sans markdown):\n{\n  "resume": "Résumé exécutif 2-3 phrases",\n  "diagnostic": "Diagnostic approfondi 3-5 phrases",\n  "points_forts": ["point 1", "point 2"],\n  "points_faibles": ["point 1", "point 2"],\n  "opportunites": ["opp 1"],\n  "risques": ["risque 1"],\n  "actions_prioritaires": [{"priorite": "URGENT", "action": "action", "impact": "impact"}],\n  "prevision_optimiste": "scénario optimiste",\n  "prevision_pessimiste": "scénario pessimiste",\n  "conseil_expert": "conseil en une phrase"\n}\n\nDonnées: Score santé ${f.healthScore}/100, dépenses projetées ${f.projectedExpense} FCFA, revenus projetés ${f.projectedIncome} FCFA, solde ${f.projectedBalance} FCFA, commandes ce mois ${f.orders?.thisMonth} (${f.orders?.growth > 0 ? '+' : ''}${f.orders?.growth}% vs mois dernier), taux livraison ${f.orders?.deliveryRate}%.\nCatégories: ${(f.categoryAnalysis || []).map(c => `${catLabels[c.category] || c.category}: ${c.currentSpent} FCFA (${c.variation > 0 ? '+' : ''}${c.variation}%)`).join(', ')}.`;
      const completion = await openai.chat.completions.create({ model: 'gpt-4o', messages: [{ role: 'user', content: summary }], temperature: 0.4, max_tokens: 2000 });
      const raw = completion.choices[0].message.content.trim();
      let analysis;
      try { analysis = JSON.parse(raw); } catch { const m = raw.match(/\{[\s\S]*\}/); analysis = m ? JSON.parse(m[0]) : { resume: raw, diagnostic: '', points_forts: [], points_faibles: [], opportunites: [], risques: [], actions_prioritaires: [], prevision_optimiste: '', prevision_pessimiste: '', conseil_expert: '' }; }
      res.json({ success: true, analysis, tokensUsed: completion.usage?.total_tokens });
    } catch (error) {
      console.error('Erreur forecast/ai:', error);
      res.status(500).json({ success: false, message: error.message || 'Erreur OpenAI' });
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
