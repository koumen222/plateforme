/**
 * Script d'import CSV vers MongoDB
 * Usage: node importSubscribers.js <chemin_du_fichier_csv>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from '../config/database.js';
import Subscriber from '../models/Subscriber.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fonction pour parser CSV simple (gère les guillemets)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function importSubscribers(csvPath) {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await connectDB();
    
    console.log(`📁 Lecture du fichier: ${csvPath}`);
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    // Header
    const headers = parseCSVLine(lines[0]);
    console.log('📊 Colonnes:', headers);
    
    const emailIndex = headers.findIndex(h => h.toLowerCase().includes('email'));
    const prenomIndex = headers.findIndex(h => h.toLowerCase().includes('prénom') || h.toLowerCase().includes('prenom'));
    const nomIndex = headers.findIndex(h => h.toLowerCase().includes('nom'));
    
    if (emailIndex === -1) {
      throw new Error('Colonne Email non trouvée');
    }
    
    console.log(`📧 Index email: ${emailIndex}, prénom: ${prenomIndex}, nom: ${nomIndex}`);
    
    // Données
    const subscribers = [];
    const errors = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      
      const email = values[emailIndex]?.replace(/"/g, '').trim().toLowerCase();
      const prenom = prenomIndex !== -1 ? values[prenomIndex]?.replace(/"/g, '').trim() : '';
      const nom = nomIndex !== -1 ? values[nomIndex]?.replace(/"/g, '').trim() : '';
      
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        errors.push({ line: i + 1, reason: 'Email invalide', email });
        continue;
      }
      
      const name = [prenom, nom].filter(Boolean).join(' ');
      
      subscribers.push({
        email,
        name,
        status: 'active',
        source: 'import',
        tags: ['import_csv_2026'],
        subscribedAt: new Date()
      });
    }
    
    console.log(`\n📈 Résumé:`);
    console.log(`   Total lignes: ${lines.length - 1}`);
    console.log(`   ✅ Validés: ${subscribers.length}`);
    console.log(`   ❌ Erreurs: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n⚠️  Erreurs (10 premières):');
      errors.slice(0, 10).forEach(e => {
        console.log(`   Ligne ${e.line}: ${e.reason} - "${e.email}"`);
      });
    }
    
    // Import par lots
    const batchSize = 100;
    let imported = 0;
    let duplicates = 0;
    
    console.log('\n🚀 Début de l\'import...');
    
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      
      for (const sub of batch) {
        try {
          await Subscriber.findOneAndUpdate(
            { email: sub.email },
            { $setOnInsert: sub },
            { upsert: true, new: true }
          );
          imported++;
        } catch (err) {
          if (err.code === 11000) {
            duplicates++;
          } else {
            console.error(`   ❌ Erreur sur ${sub.email}:`, err.message);
          }
        }
      }
      
      console.log(`   📦 Lot ${Math.floor(i / batchSize) + 1}/${Math.ceil(subscribers.length / batchSize)}: ${Math.min(i + batchSize, subscribers.length)}/${subscribers.length}`);
    }
    
    console.log('\n✅ Import terminé!');
    console.log(`   Importés: ${imported}`);
    console.log(`   Doublons ignorés: ${duplicates}`);
    
    // Exemples
    console.log('\n📋 Quelques contacts importés:');
    subscribers.slice(0, 5).forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.email} - ${s.name || '(sans nom)'}`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Récupérer le chemin du fichier CSV
const csvFile = process.argv[2] || '107785661e8555f5e82bafd2503ffdc85a2f014.csv';
const csvPath = path.resolve(process.cwd(), csvFile);

if (!fs.existsSync(csvPath)) {
  console.error(`❌ Fichier non trouvé: ${csvPath}`);
  console.log('Usage: node importSubscribers.js <chemin_fichier.csv>');
  process.exit(1);
}

importSubscribers(csvPath);
