import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import Partenaire from '../models/Partenaire.js';

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

const makeDate = (year, monthIndex, day, hour, minute) =>
  new Date(year, monthIndex, day, hour, minute, 0, 0);

const rawPartenaires = [
  {
    nom: 'Giresse Kalonji',
    domaine: 'Closeur',
    pays: 'Gabon',
    ville: 'Libreville',
    whatsapp: '+241062392735',
    lien_contact: 'https://wa.me/241062392735',
    createdAt: makeDate(2026, 0, 19, 23, 20)
  },
  {
    nom: 'Giresse Kalonji',
    domaine: 'Autre',
    pays: 'Gabon',
    ville: 'Libreville',
    whatsapp: '+241062392735',
    lien_contact: 'https://wa.me/241062392735',
    createdAt: makeDate(2026, 0, 19, 23, 20)
  },
  {
    nom: 'Spark delivery',
    domaine: 'Société de livraison',
    pays: 'Mali',
    ville: 'Bamako',
    whatsapp: '78853922',
    lien_contact: 'https://wa.me/22378853922',
    createdAt: makeDate(2026, 0, 19, 21, 40)
  },
  {
    nom: 'Sèmina Express',
    domaine: 'Société de livraison',
    pays: 'Bénin',
    ville: 'Cotonou',
    whatsapp: '+229 62438954',
    lien_contact: '',
    createdAt: makeDate(2026, 0, 19, 20, 19)
  },
  {
    nom: 'AFRICASH EXPRESS',
    domaine: 'Société de livraison',
    pays: 'Sénégal',
    ville: 'Dakar',
    whatsapp: '+221705345239',
    lien_contact: '',
    createdAt: makeDate(2026, 0, 19, 18, 7)
  },
  {
    nom: 'Warani',
    domaine: 'Société de livraison',
    pays: 'Centrafrique',
    ville: 'Bangui',
    whatsapp: '0616544291',
    lien_contact: 'https://apps.apple.com/fr/app/warani-shop/id6446996236',
    createdAt: makeDate(2026, 0, 19, 17, 47)
  },
  {
    nom: 'Dera services',
    domaine: 'Autre',
    pays: 'Burkina Faso',
    ville: 'Ouagadougou',
    whatsapp: '0022669596956',
    lien_contact: '',
    createdAt: makeDate(2026, 0, 19, 17, 14)
  },
  {
    nom: 'Dera services',
    domaine: 'Autre',
    pays: 'Burkina Faso',
    ville: 'Ouagadougou',
    whatsapp: '0022669596956',
    lien_contact: '',
    createdAt: makeDate(2026, 0, 19, 17, 13)
  },
  {
    nom: 'Rapide Express livraison',
    domaine: 'Société de livraison',
    pays: 'Burkina Faso',
    ville: 'Ouagadougou',
    whatsapp: '+226 74 79 19 03',
    lien_contact: '',
    createdAt: makeDate(2026, 0, 19, 17, 13)
  },
  {
    nom: 'Kima',
    domaine: 'Société de livraison',
    pays: 'Burkina Faso',
    ville: 'Ouagadougou',
    whatsapp: '+226 64845845',
    lien_contact: '',
    createdAt: makeDate(2026, 0, 19, 16, 3)
  },
  {
    nom: 'Lawreen',
    domaine: 'Autre',
    pays: 'Cameroun',
    ville: 'Douala',
    whatsapp: '+237671626796',
    lien_contact: '',
    createdAt: makeDate(2026, 0, 19, 15, 14)
  },
  {
    nom: 'Ndeye Marie Sarr',
    domaine: 'Closeur',
    pays: 'Sénégal',
    ville: 'Dakar',
    whatsapp: '+22177 050 38 20',
    lien_contact: '',
    createdAt: makeDate(2026, 0, 19, 15, 14)
  }
];

const buildKey = (item) => {
  const domaine = normalizeDomaine(item.domaine);
  return [
    item.nom?.trim().toLowerCase(),
    item.whatsapp?.trim().toLowerCase(),
    item.pays?.trim().toLowerCase(),
    item.ville?.trim().toLowerCase(),
    domaine
  ].join('||');
};

const dedupePartenaires = (items) => {
  const map = new Map();
  for (const item of items) {
    const key = buildKey(item);
    const existing = map.get(key);
    if (!existing || item.createdAt > existing.createdAt) {
      map.set(key, item);
    }
  }
  return Array.from(map.values());
};

const applyIfProvided = (target, field, value) => {
  if (typeof value === 'string' && value.trim()) {
    target[field] = value.trim();
  }
};

const run = async () => {
  try {
    await connectDB();

    const partenaires = dedupePartenaires(rawPartenaires);
    let created = 0;
    let updated = 0;

    for (const item of partenaires) {
      const domaine = normalizeDomaine(item.domaine);
      const lookup = {
        nom: item.nom.trim(),
        whatsapp: item.whatsapp.trim(),
        pays: item.pays.trim(),
        ville: item.ville.trim(),
        domaine
      };

      const existing = await Partenaire.findOne(lookup);

      if (existing) {
        applyIfProvided(existing, 'nom', item.nom);
        applyIfProvided(existing, 'whatsapp', item.whatsapp);
        applyIfProvided(existing, 'pays', item.pays);
        applyIfProvided(existing, 'ville', item.ville);
        applyIfProvided(existing, 'lien_contact', item.lien_contact);
        existing.domaine = domaine;
        existing.autorisation_affichage = true;
        existing.statut = 'approuve';
        existing.approved_at = existing.approved_at || item.createdAt;
        await existing.save();
        updated += 1;
        continue;
      }

      await Partenaire.create({
        ...lookup,
        lien_contact: item.lien_contact?.trim() || '',
        autorisation_affichage: true,
        statut: 'approuve',
        approved_at: item.createdAt,
        created_at: item.createdAt,
        updated_at: item.createdAt
      });

      created += 1;
    }

    console.log(`✅ Partenaires traités: ${created} créés, ${updated} mis à jour.`);
  } catch (error) {
    console.error('❌ Erreur ajout partenaires:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
