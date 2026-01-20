import express from 'express';
import Partenaire from '../models/Partenaire.js';
import PartenaireAvis from '../models/PartenaireAvis.js';
import PartenaireContact from '../models/PartenaireContact.js';

const router = express.Router();

const normalizeString = (value) => {
  if (!value) return '';
  return value.toString().trim();
};

const normalizeToken = (value) => {
  if (!value) return '';
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/é/g, 'e')
    .replace(/\s+/g, '_');
};

const normalizeDomaine = (value) => {
  if (!value) return 'autre';
  const normalized = normalizeToken(value);
  if (normalized === 'societe_de_livraison' || normalized === 'societe_livraison') {
    return 'agence_livraison';
  }
  return normalized || 'autre';
};

const normalizeType = (value) => {
  if (!value) return 'autre';
  const normalized = normalizeToken(value);
  if (normalized === 'agence_de_livraison' || normalized === 'agence_livraison') {
    return 'agence_livraison';
  }
  if (normalized === 'closeur') return 'closeur';
  if (normalized === 'transitaire') return 'transitaire';
  return 'autre';
};

const allowedDomaines = new Set([
  'livreur',
  'agence_livraison',
  'transitaire',
  'closeur',
  'fournisseur',
  'autre'
]);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseListParam = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => parseListParam(item));
  }
  return value
    .toString()
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeDomaines = (value) => {
  const list = parseListParam(value).map(normalizeDomaine);
  return Array.from(new Set(list.filter((domaine) => allowedDomaines.has(domaine))));
};

const buildBadges = (partenaire) => {
  const badges = [];
  if (partenaire.statut === 'approuve' && partenaire.autorisation_affichage) {
    badges.push('verifie');
  }
  const ratingAvg = partenaire.stats?.rating_avg || 0;
  const ratingCount = partenaire.stats?.rating_count || 0;
  if (ratingAvg >= 4.5 && ratingCount >= 3) {
    badges.push('top');
  }
  const lastContactAt = partenaire.stats?.last_contact_at
    ? new Date(partenaire.stats.last_contact_at)
    : null;
  if (lastContactAt && Date.now() - lastContactAt.getTime() <= 30 * 24 * 60 * 60 * 1000) {
    badges.push('actif_mois');
  }
  const responseRate = partenaire.stats?.response_rate || 0;
  if (responseRate >= 0.8) {
    badges.push('reactif');
  }
  return badges;
};

const shapePartenaire = (partenaire) => {
  const domaines = Array.isArray(partenaire.domaines_activite) && partenaire.domaines_activite.length
    ? partenaire.domaines_activite
    : partenaire.domaine
      ? [partenaire.domaine]
      : [];
  return {
    ...partenaire,
    domaines_activite: domaines,
    type_partenaire: partenaire.type_partenaire || normalizeType(partenaire.domaine),
    badges: buildBadges(partenaire)
  };
};

/**
 * POST /api/partenaires
 * Inscription partenaire (statut en_attente)
 */
router.post('/', async (req, res) => {
  try {
    const {
      nom,
      domaine,
      domaines_activite,
      type_partenaire,
      pays,
      ville,
      description_courte,
      telephone,
      whatsapp,
      email,
      lien_contact,
      autorisation_affichage,
      annees_experience,
      zones_couvertes,
      delais_moyens,
      methodes_paiement,
      langues_parlees,
      logo_url,
      disponibilite
    } = req.body || {};

    const normalizedDomaines = normalizeDomaines(domaines_activite?.length ? domaines_activite : domaine);
    const normalizedType = normalizeType(type_partenaire || domaine);

    const requiredFields = [
      { key: 'nom', value: nom },
      { key: 'type_partenaire', value: normalizedType },
      { key: 'pays', value: pays },
      { key: 'ville', value: ville },
      { key: 'domaines_activite', value: normalizedDomaines.length ? normalizedDomaines : null },
      { key: 'description_courte', value: description_courte },
      { key: 'telephone', value: telephone },
      { key: 'whatsapp', value: whatsapp },
      { key: 'email', value: email }
    ];

    const missing = requiredFields
      .filter((item) => !item.value || (typeof item.value === 'string' && !item.value.trim()))
      .map((item) => item.key);

    if (missing.length) {
      return res.status(400).json({
        error: `Champs obligatoires manquants: ${missing.join(', ')}`
      });
    }

    const partenaire = new Partenaire({
      nom: normalizeString(nom),
      type_partenaire: normalizedType,
      domaine: normalizedDomaines[0] || normalizeDomaine(domaine),
      domaines_activite: normalizedDomaines,
      description_courte: normalizeString(description_courte),
      pays: normalizeString(pays),
      ville: normalizeString(ville),
      telephone: normalizeString(telephone),
      whatsapp: normalizeString(whatsapp),
      email: normalizeString(email),
      lien_contact: normalizeString(lien_contact),
      autorisation_affichage: Boolean(autorisation_affichage),
      statut: 'en_attente',
      annees_experience: Number.isFinite(Number(annees_experience)) ? Number(annees_experience) : null,
      zones_couvertes: parseListParam(zones_couvertes),
      delais_moyens: normalizeString(delais_moyens),
      methodes_paiement: parseListParam(methodes_paiement),
      langues_parlees: parseListParam(langues_parlees),
      logo_url: normalizeString(logo_url),
      disponibilite: disponibilite ? normalizeToken(disponibilite) : undefined
    });

    await partenaire.save();

    res.status(201).json({
      success: true,
      message: 'Merci, votre profil sera visible après validation.',
      partenaire: shapePartenaire(partenaire.toObject())
    });
  } catch (error) {
    console.error('Erreur inscription partenaire:', error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement' });
  }
});

/**
 * GET /api/partenaires
 * Liste publique des partenaires approuvés
 */
router.get('/', async (req, res) => {
  try {
    const { domaine, domaines, domaines_activite, pays, ville, type, disponibilite, note_min, verifie_only } = req.query;
    const filter = { statut: 'approuve', autorisation_affichage: true };

    const domainesFilters = normalizeDomaines(domaines_activite || domaines || domaine);
    if (domainesFilters.length) {
      filter.$or = [
        { domaines_activite: { $in: domainesFilters } },
        { domaine: { $in: domainesFilters } }
      ];
    }

    if (type && type !== 'all') {
      filter.type_partenaire = normalizeType(type);
    }

    if (disponibilite && disponibilite !== 'all') {
      filter.disponibilite = normalizeToken(disponibilite);
    }

    const paysList = parseListParam(pays);
    if (paysList.length) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: paysList.map((item) => ({ pays: new RegExp(escapeRegExp(item), 'i') }))
      });
    }

    const villeList = parseListParam(ville);
    if (villeList.length) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: villeList.map((item) => ({ ville: new RegExp(escapeRegExp(item), 'i') }))
      });
    }

    const noteMinValue = Number(note_min);
    if (Number.isFinite(noteMinValue) && noteMinValue > 0) {
      filter['stats.rating_avg'] = { $gte: noteMinValue };
    }

    const partenaires = await Partenaire.find(filter)
      .sort({ approved_at: -1, created_at: -1 })
      .lean();

    res.json({
      success: true,
      partenaires: partenaires.map(shapePartenaire),
      count: partenaires.length
    });
  } catch (error) {
    console.error('Erreur récupération partenaires:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des partenaires' });
  }
});

/**
 * GET /api/partenaires/:id
 * Profil public d'un partenaire + avis approuvés
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const partenaire = await Partenaire.findById(id).lean();
    if (!partenaire) {
      return res.status(404).json({ error: 'Partenaire non trouvé' });
    }

    const avis = await PartenaireAvis.find({
      partenaire_id: id,
      statut: 'approuve'
    })
      .sort({ created_at: -1 })
      .lean();

    res.json({
      success: true,
      partenaire: shapePartenaire(partenaire),
      avis
    });
  } catch (error) {
    console.error('Erreur récupération partenaire:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du partenaire' });
  }
});

/**
 * POST /api/partenaires/:id/avis
 * Soumettre un avis (statut en_attente)
 */
router.post('/:id/avis', async (req, res) => {
  try {
    const { id } = req.params;
    const { note, commentaire, recommande, auteur_nom, auteur_email } = req.body || {};

    const partenaire = await Partenaire.findById(id);
    if (!partenaire) {
      return res.status(404).json({ error: 'Partenaire non trouvé' });
    }

    const numericNote = Number(note);
    if (!Number.isFinite(numericNote) || numericNote < 1 || numericNote > 5) {
      return res.status(400).json({ error: 'La note doit être comprise entre 1 et 5' });
    }

    const avis = await PartenaireAvis.create({
      partenaire_id: id,
      note: numericNote,
      commentaire: normalizeString(commentaire),
      recommande: Boolean(recommande),
      auteur_nom: normalizeString(auteur_nom),
      auteur_email: normalizeString(auteur_email),
      statut: 'en_attente'
    });

    res.status(201).json({
      success: true,
      message: 'Merci pour votre avis. Il sera visible après validation.',
      avis: avis.toObject()
    });
  } catch (error) {
    console.error('Erreur création avis partenaire:', error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement de l\'avis' });
  }
});

/**
 * POST /api/partenaires/:id/contact
 * Tracking des contacts (WhatsApp, appel, plateforme)
 */
router.post('/:id/contact', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, message } = req.body || {};
    const partenaire = await Partenaire.findById(id);
    if (!partenaire) {
      return res.status(404).json({ error: 'Partenaire non trouvé' });
    }

    partenaire.stats = partenaire.stats || {};
    partenaire.stats.contact_count = (partenaire.stats.contact_count || 0) + 1;
    partenaire.stats.last_contact_at = new Date();
    await partenaire.save();

    const contactType = ['whatsapp', 'appel', 'plateforme'].includes(type) ? type : 'plateforme';
    await PartenaireContact.create({
      partenaire_id: id,
      type: contactType,
      message: normalizeString(message)
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur tracking contact partenaire:', error);
    res.status(500).json({ error: 'Erreur lors du tracking contact' });
  }
});

export default router;
