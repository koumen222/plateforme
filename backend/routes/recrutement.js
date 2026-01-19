import express from 'express';
import Recrutement from '../models/Recrutement.js';

const router = express.Router();

const normalizeType = (value) => {
  if (!value) return 'autre';
  const normalized = value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/é/g, 'e')
    .replace(/\s+/g, '_');
  if (normalized === 'societe_de_livraison') return 'societe_livraison';
  return normalized;
};

const allowedTypes = new Set([
  'livreur',
  'societe_livraison',
  'transitaire',
  'closeur',
  'fournisseur',
  'autre'
]);

/**
 * POST /api/recrutement
 * Collecte d'informations pour l'annuaire interne
 */
router.post('/', async (req, res) => {
  try {
    const {
      nom,
      type,
      pays,
      ville,
      whatsapp,
      lien_contact,
      autorisation_affichage
    } = req.body || {};

    if (!nom || !whatsapp) {
      return res.status(400).json({ error: 'Nom et WhatsApp sont obligatoires' });
    }

    const normalizedType = normalizeType(type);
    if (!allowedTypes.has(normalizedType)) {
      return res.status(400).json({ error: 'Type invalide' });
    }

    const entry = new Recrutement({
      nom: nom.trim(),
      type: normalizedType,
      pays: pays?.trim() || '',
      ville: ville?.trim() || '',
      whatsapp: whatsapp.trim(),
      lien_contact: lien_contact?.trim() || '',
      autorisation_affichage: Boolean(autorisation_affichage)
    });

    await entry.save();

    res.status(201).json({
      success: true,
      message: 'Informations enregistrées',
      recrutement: entry.toObject()
    });
  } catch (error) {
    console.error('Erreur création recrutement:', error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement' });
  }
});

export default router;
