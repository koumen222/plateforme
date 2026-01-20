import express from 'express';
import Partenaire from '../models/Partenaire.js';

const router = express.Router();

const normalizeDomaine = (value) => {
  if (!value) return 'autre';
  const normalized = value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/é/g, 'e')
    .replace(/\s+/g, '_');
  if (normalized === 'societe_de_livraison' || normalized === 'societe_livraison') {
    return 'agence_livraison';
  }
  return normalized;
};

const allowedDomaines = new Set([
  'livreur',
  'agence_livraison',
  'transitaire',
  'closeur',
  'fournisseur',
  'autre'
]);

/**
 * POST /api/recrutement
 * Alias vers l'inscription partenaire
 */
router.post('/', async (req, res) => {
  try {
    const {
      nom,
      type,
      domaine,
      pays,
      ville,
      whatsapp,
      lien_contact,
      autorisation_affichage
    } = req.body || {};

    if (!nom || !whatsapp) {
      return res.status(400).json({ error: 'Nom et WhatsApp sont obligatoires' });
    }

    const normalizedDomaine = normalizeDomaine(domaine || type);
    if (!allowedDomaines.has(normalizedDomaine)) {
      return res.status(400).json({ error: 'Domaine invalide' });
    }

    const entry = new Partenaire({
      nom: nom.trim(),
      domaine: normalizedDomaine,
      pays: pays?.trim() || '',
      ville: ville?.trim() || '',
      whatsapp: whatsapp.trim(),
      lien_contact: lien_contact?.trim() || '',
      autorisation_affichage: Boolean(autorisation_affichage),
      statut: 'en_attente'
    });

    await entry.save();

    res.status(201).json({
      success: true,
      message: 'Merci, votre profil sera visible après validation.',
      partenaire: entry.toObject()
    });
  } catch (error) {
    console.error('Erreur création recrutement:', error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement' });
  }
});

export default router;
