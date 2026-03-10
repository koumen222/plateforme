import dotenv from 'dotenv';
import { connectDB } from '../config/database.js';
import { s3Client, R2_CONFIG, getR2PublicUrl } from '../config/r2.js';
import { PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testR2Connection() {
  console.log('🔍 Test de connexion à Cloudflare R2...\n');
  
  // Vérifier les variables d'environnement
  console.log('📋 Variables d\'environnement:');
  console.log(`   R2_ACCOUNT_ID: ${process.env.R2_ACCOUNT_ID || process.env.R2_ACCOUNT ? '✅ Défini' : '❌ Manquant'}`);
  console.log(`   R2_ACCESS_KEY_ID: ${process.env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY ? '✅ Défini' : '❌ Manquant'}`);
  console.log(`   R2_SECRET_ACCESS_KEY: ${process.env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_KEY ? '✅ Défini' : '❌ Manquant'}`);
  console.log(`   R2_BUCKET_NAME: ${process.env.R2_BUCKET_NAME || process.env.R2_BUCKET ? '✅ Défini' : '❌ Manquant'}`);
  console.log(`   R2_ENDPOINT: ${R2_CONFIG.endpoint || '❌ Non configuré'}\n`);

  if (!R2_CONFIG.bucket || !R2_CONFIG.accountId) {
    console.error('❌ Variables R2 manquantes. Configurez-les dans votre .env');
    process.exit(1);
  }

  try {
    // Test 1: Lister les objets du bucket
    console.log('📦 Test 1: Liste des objets dans le bucket...');
    const listCommand = new ListObjectsV2Command({
      Bucket: R2_CONFIG.bucket,
      MaxKeys: 5
    });
    
    const listResult = await s3Client.send(listCommand);
    console.log(`✅ Connexion réussie! ${listResult.Contents?.length || 0} objet(s) trouvé(s)\n`);

    // Test 2: Upload d'un fichier de test
    console.log('📤 Test 2: Upload d\'un fichier de test...');
    const testContent = `Test file créé le ${new Date().toISOString()}\nCe fichier sert à tester la connexion R2.`;
    const testKey = `test/${randomUUID()}.txt`;
    
    const putCommand = new PutObjectCommand({
      Bucket: R2_CONFIG.bucket,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
      Metadata: {
        test: 'true',
        createdAt: new Date().toISOString()
      }
    });

    await s3Client.send(putCommand);
    console.log(`✅ Fichier uploadé: ${testKey}`);
    
    const publicUrl = getR2PublicUrl(testKey);
    console.log(`   URL publique: ${publicUrl || '❌ Impossible de générer l\'URL'}\n`);

    // Test 3: Upload d'un fichier réel depuis le dossier backend
    console.log('📤 Test 3: Upload d\'un fichier de documentation...');
    
    // Chercher un fichier README ou documentation
    const docFiles = [
      path.join(__dirname, '../FILE_MANAGER_README.md'),
      path.join(__dirname, '../ENV_EXAMPLE.md'),
      path.join(__dirname, '../README.md')
    ];

    let uploadedFile = null;
    for (const filePath of docFiles) {
      if (fs.existsSync(filePath)) {
        const fileName = path.basename(filePath);
        const fileContent = fs.readFileSync(filePath);
        const docKey = `docs/${randomUUID()}-${fileName}`;
        
        const putDocCommand = new PutObjectCommand({
          Bucket: R2_CONFIG.bucket,
          Key: docKey,
          Body: fileContent,
          ContentType: 'text/markdown',
          Metadata: {
            originalName: fileName,
            uploadedAt: new Date().toISOString()
          }
        });

        await s3Client.send(putDocCommand);
        const docUrl = getR2PublicUrl(docKey);
        console.log(`✅ Fichier uploadé: ${fileName}`);
        console.log(`   Clé R2: ${docKey}`);
        console.log(`   URL publique: ${docUrl || '❌ Impossible de générer l\'URL'}`);
        uploadedFile = { key: docKey, url: docUrl, name: fileName };
        break;
      }
    }

    if (!uploadedFile) {
      console.log('⚠️ Aucun fichier de documentation trouvé à uploader');
    }

    console.log('\n✅ Tous les tests sont passés avec succès!');
    console.log('\n📝 Résumé:');
    console.log(`   Bucket: ${R2_CONFIG.bucket}`);
    console.log(`   Endpoint: ${R2_CONFIG.endpoint}`);
    console.log(`   Account ID: ${R2_CONFIG.accountId}`);
    console.log(`   Fichiers de test uploadés: ${uploadedFile ? '2' : '1'}`);

  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error.message);
    if (error.$metadata) {
      console.error('   Code:', error.$metadata.httpStatusCode);
      console.error('   Request ID:', error.$metadata.requestId);
    }
    console.error('\n💡 Vérifiez:');
    console.error('   1. Les variables d\'environnement sont correctes');
    console.error('   2. Le bucket existe dans Cloudflare R2');
    console.error('   3. Les credentials ont les bonnes permissions');
    console.error('   4. L\'endpoint R2 est accessible');
    process.exit(1);
  }
}

// Exécuter le test
testR2Connection()
  .then(() => {
    console.log('\n🎉 Tests terminés!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  });


