import express from 'express';
import Product from '../models/Product.js';
import { requireEcomAuth, requireEcomPermission, validateEcomAccess } from '../middleware/ecomAuth.js';
import { validateProduct } from '../middleware/validation.js';
import { checkBusinessRules } from '../services/businessRules.js';

const router = express.Router();

// GET /api/ecom/products/search - Recherche publique de produits (sans authentification)
router.get('/search', async (req, res) => {
  try {
    console.log('🔍 GET /api/ecom/products/search - Recherche publique');
    console.log('🔍 Termes de recherche:', req.query);
    
    const { search, status, isActive, limit = 20 } = req.query;
    
    // Pour la démo, on retourne tous les produits actifs sans filtre de workspace
    // En production, vous pouvez configurer un workspace public spécifique
    const filter = { 
      isActive: true // Uniquement les produits actifs pour la recherche publique
    };
    
    // Ajout de la logique de recherche
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      const statuses = status.split(',').map(s => s.trim());
      filter.status = statuses.length > 1 ? { $in: statuses } : statuses[0];
    }
    
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    console.log('🔎 Filtre recherche publique:', filter);
    
    const products = await Product.find(filter)
      .select('name status sellingPrice productCost deliveryCost avgAdsCost stock isActive createdAt')
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    console.log('📊 Produits trouvés (public):', products.length);

    res.json({
      success: true,
      data: products,
      count: products.length,
      search: search || null
    });
  } catch (error) {
    console.error('Erreur search products public:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/ecom/products - Liste des produits (tous roles peuvent voir)
router.get('/', requireEcomAuth, async (req, res) => {
  try {
    console.log('📦 GET /api/ecom/products - Liste des produits');
    console.log('👤 Utilisateur:', req.ecomUser?.email);
    console.log('🔍 Filtres:', req.query);
    
    const { status, isActive, search } = req.query;
    const filter = { workspaceId: req.workspaceId };
    
    // Ajout de la logique de recherche
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      // Support comma-separated status values: ?status=test,stable,winner
      const statuses = status.split(',').map(s => s.trim());
      filter.status = statuses.length > 1 ? { $in: statuses } : statuses[0];
    }
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    console.log('🔎 Filtre appliqué:', filter);
    const products = await Product.find(filter)
      .populate('createdBy', 'email')
      .sort({ createdAt: -1 });

    console.log('📊 Produits trouvés:', products.length);
    console.log('📋 Données brutes:', products);

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Erreur get products:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/ecom/products/research - Recherche publique de produits (sans authentification)
router.get('/search', async (req, res) => {
  try {
    console.log('🔍 GET /api/ecom/products/search - Recherche publique');
    console.log('🔍 Termes de recherche:', req.query);
    
    const { search, status, isActive, limit = 20 } = req.query;
    
    // Pour la démo, on retourne tous les produits actifs sans filtre de workspace
    // En production, vous pourriez avoir une logique pour déterminer le workspace public
    const filter = { 
      isActive: true // Uniquement les produits actifs pour la recherche publique
    };
    
    // Ajout de la logique de recherche
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      const statuses = status.split(',').map(s => s.trim());
      filter.status = statuses.length > 1 ? { $in: statuses } : statuses[0];
    }
    
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    console.log('🔎 Filtre recherche publique:', filter);
    
    const products = await Product.find(filter)
      .select('name status sellingPrice productCost deliveryCost avgAdsCost stock isActive createdAt')
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    console.log('📊 Produits trouvés (public):', products.length);

    res.json({
      success: true,
      data: products,
      count: products.length,
      search: search || null
    });
  } catch (error) {
    console.error('Erreur search products public:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/ecom/products/stats - Statistiques produits (admin et compta)
router.get('/stats/overview', 
  requireEcomAuth, 
  validateEcomAccess('finance', 'read'),
  async (req, res) => {
    try {
      const workspaceId = req.workspaceId;
      const mongoose = (await import('mongoose')).default;
      const stats = await Product.aggregate([
        {
          $match: { isActive: true, workspaceId: new mongoose.Types.ObjectId(workspaceId) }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalStock: { $sum: '$stock' },
            avgMargin: { $avg: { $subtract: ['$sellingPrice', '$productCost', '$deliveryCost', '$avgAdsCost'] } },
            totalValue: { $sum: { $multiply: ['$stock', '$sellingPrice'] } }
          }
        }
      ]);

      const lowStockProducts = await Product.find({
        workspaceId,
        isActive: true,
        $expr: { $lte: ['$stock', '$reorderThreshold'] }
      }).select('name stock reorderThreshold');

      res.json({
        success: true,
        data: {
          byStatus: stats,
          lowStockAlerts: lowStockProducts,
          totalActiveProducts: await Product.countDocuments({ workspaceId, isActive: true })
        }
      });
    } catch (error) {
      console.error('Erreur products stats:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }
);

// GET /api/ecom/products/:id - Détail d'un produit
router.get('/:id', requireEcomAuth, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, workspaceId: req.workspaceId })
      .populate('createdBy', 'email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Erreur get product:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/ecom/products - Créer un produit (admin uniquement)
router.post('/', 
  requireEcomAuth, 
  validateEcomAccess('products', 'write'),
  validateProduct, 
  async (req, res) => {
    try {
      console.log('📦 POST /api/ecom/products - Création de produit');
      console.log('👤 Utilisateur:', req.ecomUser?.email);
      console.log('📋 Données reçues:', req.body);
      
      const productData = {
        ...req.body,
        workspaceId: req.workspaceId,
        createdBy: req.ecomUser._id
      };

      console.log('🔍 Vérification des règles métier...');
      // Vérifier les règles métier
      const businessCheck = await checkBusinessRules('createProduct', {
        user: req.ecomUser,
        productData
      });

      console.log('✅ Résultat règles métier:', businessCheck);
      if (!businessCheck.allowed) {
        console.log('❌ Règles métier refusées:', businessCheck.message);
        return res.status(400).json({
          success: false,
          message: businessCheck.message
        });
      }

      console.log('💾 Création du produit...');
      const product = new Product(productData);
      await product.save();
      console.log('✅ Produit créé avec ID:', product._id);

      const populatedProduct = await Product.findById(product._id)
        .populate('createdBy', 'email');

      res.status(201).json({
        success: true,
        message: 'Produit créé avec succès',
        data: populatedProduct
      });
    } catch (error) {
      console.error('Erreur create product:', error);
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Un produit avec ce nom existe déjà'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }
);

// PUT /api/ecom/products/:id - Modifier un produit (admin uniquement)
router.put('/:id', 
  requireEcomAuth, 
  validateEcomAccess('products', 'write'),
  validateProduct, 
  async (req, res) => {
    try {
      const product = await Product.findOne({ _id: req.params.id, workspaceId: req.workspaceId });
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }

      // Vérifier les règles métier
      const businessCheck = await checkBusinessRules('updateProduct', {
        user: req.ecomUser,
        product,
        updateData: req.body
      });

      if (!businessCheck.allowed) {
        return res.status(400).json({
          success: false,
          message: businessCheck.message
        });
      }

      Object.assign(product, req.body);
      await product.save();

      const updatedProduct = await Product.findById(product._id)
        .populate('createdBy', 'email');

      res.json({
        success: true,
        message: 'Produit mis à jour avec succès',
        data: updatedProduct
      });
    } catch (error) {
      console.error('Erreur update product:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }
);

// DELETE /api/ecom/products/:id - Supprimer un produit (admin uniquement)
router.delete('/:id', 
  requireEcomAuth, 
  validateEcomAccess('products', 'write'),
  async (req, res) => {
    try {
      const product = await Product.findOne({ _id: req.params.id, workspaceId: req.workspaceId });
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }

      await Product.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: 'Produit supprimé avec succès'
      });
    } catch (error) {
      console.error('Erreur delete product:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }
);

export default router;
