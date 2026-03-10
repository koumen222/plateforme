import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import Partenaire from '../models/Partenaire.js';

const recrutementSchema = new mongoose.Schema({}, { strict: false });
const RecrutementLegacy = mongoose.model('RecrutementLegacy', recrutementSchema, 'recrutements');

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

const buildLookup = (doc) => ({
  nom: (doc.nom || '').trim(),
  whatsapp: (doc.whatsapp || '').trim(),
  pays: (doc.pays || '').trim(),
  ville: (doc.ville || '').trim(),
  domaine: normalizeDomaine(doc.type || doc.domaine)
});

const run = async () => {
  try {
    await connectDB();

    const legacyDocs = await RecrutementLegacy.find().lean();
    console.log(`📦 Recrutements trouvés: ${legacyDocs.length}`);

    let created = 0;
    let skipped = 0;

    for (const doc of legacyDocs) {
      const lookup = buildLookup(doc);
      if (!lookup.nom || !lookup.whatsapp) {
        skipped += 1;
        continue;
      }

      const existing = await Partenaire.findOne({
        nom: lookup.nom,
        whatsapp: lookup.whatsapp,
        pays: lookup.pays,
        ville: lookup.ville,
        domaine: lookup.domaine
      });

      if (existing) {
        skipped += 1;
        continue;
      }

      const createdAt = doc.created_at || doc.createdAt || new Date();
      const updatedAt = doc.updated_at || doc.updatedAt || createdAt;

      await Partenaire.create({
        nom: lookup.nom,
        domaine: lookup.domaine,
        pays: lookup.pays,
        ville: lookup.ville,
        whatsapp: lookup.whatsapp,
        lien_contact: (doc.lien_contact || '').trim(),
        autorisation_affichage: Boolean(doc.autorisation_affichage),
        statut: 'en_attente',
        approved_at: null,
        created_at: createdAt,
        updated_at: updatedAt
      });

      created += 1;
    }

    console.log(`✅ Migration terminée: ${created} créés, ${skipped} ignorés.`);
  } catch (error) {
    console.error('❌ Erreur migration recrutements:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
