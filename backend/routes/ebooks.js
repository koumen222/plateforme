import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Ebook from '../models/Ebook.js';
import PaymentTransaction from '../models/PaymentTransaction.js';

const router = express.Router();

// Récupérer tous les ebooks actifs (publique)
router.get('/', async (req, res) => {
  try {
    const ebooks = await Ebook.find({ isActive: true })
      .select('-content')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({ success: true, ebooks });
  } catch (error) {
    console.error('Erreur récupération ebooks:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// Récupérer tous les ebooks (admin uniquement - inclut inactifs)
router.get('/admin/all', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const ebooks = await Ebook.find({})
      .select('-content')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({ success: true, ebooks });
  } catch (error) {
    console.error('Erreur récupération ebooks admin:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// Récupérer un ebook par ID (sans contenu si non acheté)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id).lean();
    
    if (!ebook) {
      return res.status(404).json({ error: 'Ebook non trouvé' });
    }

    if (!ebook.isActive) {
      return res.status(404).json({ error: 'Ebook non disponible' });
    }

    // Vérifier si l'utilisateur a acheté cet ebook
    const purchase = await PaymentTransaction.findOne({
      userId: req.user._id,
      ebookId: ebook._id,
      status: 'success'
    }).lean();

    const ebookData = {
      ...ebook,
      purchased: !!purchase,
      content: purchase ? ebook.content : null,
      fileUrl: purchase ? ebook.fileUrl : null
    };

    res.json({ success: true, ebook: ebookData });
  } catch (error) {
    console.error('Erreur récupération ebook:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

// Créer un ebook (admin uniquement)
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { title, description, price, currency, content, coverImage, fileUrl } = req.body;

    if (!title || !description || !content) {
      return res.status(400).json({ error: 'Titre, description et contenu requis' });
    }

    const ebook = new Ebook({
      title,
      description,
      price: price || 500,
      currency: currency || 'XAF',
      content,
      coverImage: coverImage || '',
      fileUrl: fileUrl || '',
      createdBy: req.user._id
    });

    await ebook.save();

    res.status(201).json({ success: true, ebook });
  } catch (error) {
    console.error('Erreur création ebook:', error);
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
});

// Vérifier si l'utilisateur a acheté un ebook
router.get('/:id/purchased', authenticate, async (req, res) => {
  try {
    const purchase = await PaymentTransaction.findOne({
      userId: req.user._id,
      ebookId: req.params.id,
      status: 'success'
    }).lean();

    res.json({ success: true, purchased: !!purchase });
  } catch (error) {
    console.error('Erreur vérification achat:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification' });
  }
});

// Mettre à jour un ebook (admin uniquement)
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { title, description, price, currency, content, coverImage, fileUrl, isActive } = req.body;

    const ebook = await Ebook.findById(req.params.id);
    if (!ebook) {
      return res.status(404).json({ error: 'Ebook non trouvé' });
    }

    if (title) ebook.title = title;
    if (description) ebook.description = description;
    if (price !== undefined) ebook.price = price;
    if (currency) ebook.currency = currency;
    if (content) ebook.content = content;
    if (coverImage !== undefined) ebook.coverImage = coverImage;
    if (fileUrl !== undefined) ebook.fileUrl = fileUrl;
    if (isActive !== undefined) ebook.isActive = isActive;

    await ebook.save();

    res.json({ success: true, ebook });
  } catch (error) {
    console.error('Erreur mise à jour ebook:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

// Supprimer un ebook (admin uniquement)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const ebook = await Ebook.findByIdAndDelete(req.params.id);
    if (!ebook) {
      return res.status(404).json({ error: 'Ebook non trouvé' });
    }

    res.json({ success: true, message: 'Ebook supprimé' });
  } catch (error) {
    console.error('Erreur suppression ebook:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

export default router;
