import dotenv from 'dotenv';
import { connectDB } from '../config/database.js';
import { s3Client, R2_CONFIG, getR2PublicUrl } from '../config/r2.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script pour uploader tous les fichiers de documentation vers R2
 */
async function uploadDocsToR2() {
  console.log('📚 Upload des fichiers de documentation vers R2...\n');

  // Vérifier les variables d'environnement
  if (!R2_CONFIG.bucket || !R2_CONFIG.accountId) {
    console.error('❌ Variables R2 manquantes!');
    console.error('\n📝 Configurez ces variables dans votre .env:');
    console.error('   R2_ACCOUNT_ID=votre-account-id');
    console.error('   R2_ACCESS_KEY_ID=votre-access-key');
    console.error('   R2_SECRET_ACCESS_KEY=votre-secret-key');
    console.error('   R2_BUCKET_NAME=nom-de-votre-bucket');
    console.error('\n💡 Voir backend/ENV_EXAMPLE.md pour plus de détails');
    process.exit(1);
  }

  try {
    // Liste des fichiers de documentation à uploader
    const docsDir = path.join(__dirname, '..');
    const docFiles = [
      'FILE_MANAGER_README.md',
      'ENV_EXAMPLE.md',
      'README.md'
    ];

    const uploadedFiles = [];

    for (const fileName of docFiles) {
      const filePath = path.join(docsDir, fileName);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️ Fichier non trouvé: ${fileName}`);
        continue;
      }

      try {
        const fileContent = fs.readFileSync(filePath);
        const fileStats = fs.statSync(filePath);
        const docKey = `docs/${randomUUID()}-${fileName}`;
        
        console.log(`📤 Upload de ${fileName}...`);
        
        const putCommand = new PutObjectCommand({
          Bucket: R2_CONFIG.bucket,
          Key: docKey,
          Body: fileContent,
          ContentType: 'text/markdown',
          Metadata: {
            originalName: fileName,
            uploadedAt: new Date().toISOString(),
            size: fileStats.size.toString()
          }
        });

        await s3Client.send(putCommand);
        const publicUrl = getR2PublicUrl(docKey);
        
        uploadedFiles.push({
          name: fileName,
          key: docKey,
          url: publicUrl,
          size: fileStats.size
        });

        console.log(`   ✅ Uploadé: ${docKey}`);
        console.log(`   📏 Taille: ${(fileStats.size / 1024).toFixed(2)} KB`);
        console.log(`   🔗 URL: ${publicUrl || '❌ URL non disponible'}\n`);

      } catch (error) {
        console.error(`   ❌ Erreur upload ${fileName}:`, error.message);
      }
    }

    // Résumé
    console.log('\n📊 Résumé:');
    console.log(`   Fichiers uploadés: ${uploadedFiles.length}/${docFiles.length}`);
    console.log(`   Bucket: ${R2_CONFIG.bucket}`);
    console.log(`   Endpoint: ${R2_CONFIG.endpoint}\n`);

    if (uploadedFiles.length > 0) {
      console.log('✅ Fichiers uploadés avec succès:');
      uploadedFiles.forEach(file => {
        console.log(`   - ${file.name}`);
        console.log(`     Clé: ${file.key}`);
        console.log(`     URL: ${file.url || 'N/A'}\n`);
      });
    } else {
      console.log('⚠️ Aucun fichier n\'a pu être uploadé');
    }

  } catch (error) {
    console.error('\n❌ Erreur lors de l\'upload:', error.message);
    if (error.$metadata) {
      console.error('   Code HTTP:', error.$metadata.httpStatusCode);
      console.error('   Request ID:', error.$metadata.requestId);
    }
    console.error('\n💡 Vérifiez:');
    console.error('   1. Les variables d\'environnement sont correctes');
    console.error('   2. Le bucket existe dans Cloudflare R2');
    console.error('   3. Les credentials ont les permissions nécessaires');
    console.error('   4. L\'endpoint R2 est accessible');
    process.exit(1);
  }
}

// Exécuter l'upload
uploadDocsToR2()
  .then(() => {
    console.log('🎉 Upload terminé!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  });


