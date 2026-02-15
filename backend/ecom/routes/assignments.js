import express from 'express';
import OrderSource from '../models/OrderSource.js';
import CloseuseAssignment from '../models/CloseuseAssignment.js';
import EcomUser from '../models/EcomUser.js';
import Product from '../models/Product.js';
import { requireEcomAuth } from '../middleware/ecomAuth.js';

const router = express.Router();

// ===== GESTION DES SOURCES DE COMMANDES =====

// Lister toutes les sources du workspace
router.get('/sources', requireEcomAuth, async (req, res) => {
  try {
    const sources = await OrderSource.find({ 
      workspaceId: req.workspaceId, 
      isActive: true 
    }).populate('createdBy', 'name email').sort({ name: 1 });

    res.json({
      success: true,
      data: sources
    });
  } catch (error) {
    console.error('Erreur liste sources:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Créer une nouvelle source
router.post('/sources', requireEcomAuth, async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Nom requis' });
    }

    const source = new OrderSource({
      name: name.trim(),
      description: description?.trim() || '',
      color: color || '#3B82F6',
      icon: icon || '📱',
      workspaceId: req.workspaceId,
      createdBy: req.ecomUser._id
    });

    await source.save();

    res.status(201).json({
      success: true,
      message: 'Source créée avec succès',
      data: source
    });
  } catch (error) {
    console.error('Erreur création source:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Modifier une source
router.put('/sources/:id', requireEcomAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, icon, isActive } = req.body;

    const source = await OrderSource.findOne({ 
      _id: id, 
      workspaceId: req.workspaceId 
    });

    if (!source) {
      return res.status(404).json({ success: false, message: 'Source non trouvée' });
    }

    if (name) source.name = name.trim();
    if (description !== undefined) source.description = description.trim();
    if (color) source.color = color;
    if (icon) source.icon = icon;
    if (isActive !== undefined) source.isActive = isActive;

    await source.save();

    res.json({
      success: true,
      message: 'Source mise à jour avec succès',
      data: source
    });
  } catch (error) {
    console.error('Erreur modification source:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ===== GESTION DES AFFECTATIONS CLOSEUSES =====

// Lister toutes les affectations du workspace
router.get('/assignments', requireEcomAuth, async (req, res) => {
  try {
    const assignments = await CloseuseAssignment.find({ 
      workspaceId: req.workspaceId, 
      isActive: true 
    })
    .populate('closeuseId', 'name email')
    .populate('orderSources.sourceId', 'name color icon')
    .populate('orderSources.assignedBy', 'name email')
    .populate('productAssignments.sourceId', 'name color icon')
    .populate('productAssignments.productIds', 'name sellingPrice stock')
    .populate('productAssignments.assignedBy', 'name email')
    .sort({ 'closeuseId.name': 1 });

    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Erreur liste affectations:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Obtenir l'affectation d'une closeuse spécifique
router.get('/assignments/:closeuseId', requireEcomAuth, async (req, res) => {
  try {
    const { closeuseId } = req.params;

    const assignment = await CloseuseAssignment.findOne({ 
      closeuseId, 
      workspaceId: req.workspaceId, 
      isActive: true 
    })
    .populate('closeuseId', 'name email')
    .populate('orderSources.sourceId', 'name color icon')
    .populate('orderSources.assignedBy', 'name email')
    .populate('productAssignments.sourceId', 'name color icon')
    .populate('productAssignments.productIds', 'name sellingPrice stock')
    .populate('productAssignments.assignedBy', 'name email');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Affectation non trouvée' });
    }

    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Erreur affectation closeuse:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Créer ou mettre à jour une affectation
router.post('/assignments', requireEcomAuth, async (req, res) => {
  try {
    const { closeuseId, orderSources, productAssignments, notes } = req.body;

    if (!closeuseId) {
      return res.status(400).json({ success: false, message: 'ID closeuse requis' });
    }

    // Vérifier que la closeuse existe et a le bon rôle
    const closeuse = await EcomUser.findOne({ 
      _id: closeuseId, 
      role: 'ecom_closeuse',
      workspaces: { $elemMatch: { workspaceId: req.workspaceId, status: 'active' } }
    });

    if (!closeuse) {
      return res.status(404).json({ success: false, message: 'Closeuse non trouvée dans ce workspace' });
    }

    // Chercher une affectation existante
    let assignment = await CloseuseAssignment.findOne({ 
      closeuseId, 
      workspaceId: req.workspaceId 
    });

    if (assignment) {
      // Mettre à jour l'affectation existante
      if (orderSources) {
        assignment.orderSources = orderSources.map(source => ({
          sourceId: source.sourceId,
          assignedBy: req.ecomUser._id,
          assignedAt: new Date()
        }));
      }

      if (productAssignments) {
        assignment.productAssignments = productAssignments.map(assignment => ({
          sourceId: assignment.sourceId,
          productIds: assignment.productIds,
          assignedBy: req.ecomUser._id,
          assignedAt: new Date()
        }));
      }

      if (notes !== undefined) assignment.notes = notes.trim();
      assignment.isActive = true;
    } else {
      // Créer une nouvelle affectation
      assignment = new CloseuseAssignment({
        workspaceId: req.workspaceId,
        closeuseId,
        orderSources: orderSources ? orderSources.map(source => ({
          sourceId: source.sourceId,
          assignedBy: req.ecomUser._id,
          assignedAt: new Date()
        })) : [],
        productAssignments: productAssignments ? productAssignments.map(assignment => ({
          sourceId: assignment.sourceId,
          productIds: assignment.productIds,
          assignedBy: req.ecomUser._id,
          assignedAt: new Date()
        })) : [],
        notes: notes?.trim() || '',
        isActive: true
      });
    }

    await assignment.save();

    // Recharger avec les populations
    const populatedAssignment = await CloseuseAssignment.findById(assignment._id)
      .populate('closeuseId', 'name email')
      .populate('orderSources.sourceId', 'name color icon')
      .populate('orderSources.assignedBy', 'name email')
      .populate('productAssignments.sourceId', 'name color icon')
      .populate('productAssignments.productIds', 'name sellingPrice stock')
      .populate('productAssignments.assignedBy', 'name email');

    res.json({
      success: true,
      message: 'Affectation enregistrée avec succès',
      data: populatedAssignment
    });
  } catch (error) {
    console.error('Erreur création affectation:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Supprimer une affectation
router.delete('/assignments/:id', requireEcomAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await CloseuseAssignment.findOne({ 
      _id: id, 
      workspaceId: req.workspaceId 
    });

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Affectation non trouvée' });
    }

    assignment.isActive = false;
    await assignment.save();

    res.json({
      success: true,
      message: 'Affectation supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression affectation:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ===== VUE POUR LA CLOSEUSE =====

// Obtenir les sources et produits assignés à la closeuse connectée
router.get('/my-assignments', requireEcomAuth, async (req, res) => {
  try {
    // Uniquement pour les closeuses
    if (req.ecomUserRole !== 'ecom_closeuse') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux closeuses' });
    }

    const assignment = await CloseuseAssignment.findOne({ 
      closeuseId: req.ecomUser._id, 
      workspaceId: req.workspaceId, 
      isActive: true 
    })
    .populate('orderSources.sourceId', 'name color icon')
    .populate('productAssignments.sourceId', 'name color icon')
    .populate('productAssignments.productIds', 'name sellingPrice stock status');

    if (!assignment) {
      return res.json({
        success: true,
        data: {
          orderSources: [],
          productAssignments: []
        }
      });
    }

    res.json({
      success: true,
      data: {
        orderSources: assignment.orderSources,
        productAssignments: assignment.productAssignments
      }
    });
  } catch (error) {
    console.error('Erreur mes affectations:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
