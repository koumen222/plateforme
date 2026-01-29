import express from 'express';
import CoachingApplication from '../models/CoachingApplication.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const {
      fullName,
      whatsapp,
      hasProduct,
      hasShopify,
      hasStock,
      budget,
      available7Days,
      adExperience,
      motivation
    } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ error: 'Nom et prénom requis' });
    }

    if (!whatsapp || !whatsapp.trim()) {
      return res.status(400).json({ error: 'Numéro WhatsApp requis' });
    }

    if (!hasProduct || !['Oui', 'Non'].includes(hasProduct)) {
      return res.status(400).json({ error: 'Réponse requise pour "Produit déjà existant ?"' });
    }

    if (!hasShopify || !['Oui', 'Non'].includes(hasShopify)) {
      return res.status(400).json({ error: 'Réponse requise pour "Produit déjà en ligne sur Shopify ?"' });
    }

    if (!hasStock || !['Oui', 'Non'].includes(hasStock)) {
      return res.status(400).json({ error: 'Réponse requise pour "Stock disponible ?"' });
    }

    if (!budget || !['< 50 000 FCFA', '50 000 – 100 000 FCFA', '> 100 000 FCFA'].includes(budget)) {
      return res.status(400).json({ error: 'Budget requis' });
    }

    if (!available7Days || !['Oui', 'Non'].includes(available7Days)) {
      return res.status(400).json({ error: 'Réponse requise pour "Disponible 7 jours consécutifs ?"' });
    }

    if (!adExperience || !['Déjà lancé', 'Lancé mais pas rentable', 'Jamais lancé'].includes(adExperience)) {
      return res.status(400).json({ error: 'Expérience publicitaire requise' });
    }

    let autoStatus = 'En attente';
    if (hasProduct === 'Non' || hasShopify === 'Non' || hasStock === 'Non' || available7Days === 'Non') {
      autoStatus = 'Refusé';
    }

    const application = new CoachingApplication({
      fullName: fullName.trim(),
      whatsapp: whatsapp.trim(),
      hasProduct,
      hasShopify,
      hasStock,
      budget,
      available7Days,
      adExperience,
      motivation: motivation?.trim() || '',
      status: autoStatus
    });

    await application.save();

    res.status(201).json({
      success: true,
      message: 'Candidature enregistrée avec succès',
      application: {
        id: application._id,
        status: application.status
      }
    });
  } catch (error) {
    console.error('Erreur création candidature:', error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement de la candidature' });
  }
});

router.use(authenticate);
router.use(requireAdmin);

router.get('/admin', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }

    const applications = await CoachingApplication.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      applications,
      count: applications.length
    });
  } catch (error) {
    console.error('Erreur récupération candidatures:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des candidatures' });
  }
});

router.put('/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentLink } = req.body;

    const application = await CoachingApplication.findById(id);
    if (!application) {
      return res.status(404).json({ error: 'Candidature non trouvée' });
    }

    application.status = 'Accepté';
    if (paymentLink) {
      application.paymentLink = paymentLink.trim();
    }

    await application.save();

    res.json({
      success: true,
      message: 'Candidature acceptée',
      application: application.toObject()
    });
  } catch (error) {
    console.error('Erreur acceptation candidature:', error);
    res.status(500).json({ error: 'Erreur lors de l\'acceptation de la candidature' });
  }
});

router.put('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;

    const application = await CoachingApplication.findById(id);
    if (!application) {
      return res.status(404).json({ error: 'Candidature non trouvée' });
    }

    application.status = 'Refusé';
    await application.save();

    res.json({
      success: true,
      message: 'Candidature refusée',
      application: application.toObject()
    });
  } catch (error) {
    console.error('Erreur refus candidature:', error);
    res.status(500).json({ error: 'Erreur lors du refus de la candidature' });
  }
});

router.put('/:id/payment-link', async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentLink } = req.body;

    const application = await CoachingApplication.findById(id);
    if (!application) {
      return res.status(404).json({ error: 'Candidature non trouvée' });
    }

    application.paymentLink = paymentLink?.trim() || '';
    await application.save();

    res.json({
      success: true,
      message: 'Lien de paiement mis à jour',
      application: application.toObject()
    });
  } catch (error) {
    console.error('Erreur mise à jour lien paiement:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du lien de paiement' });
  }
});

export default router;
