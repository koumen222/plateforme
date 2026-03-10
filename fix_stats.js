// Script simple pour corriger les statuts sans connexion directe à la BDD
const axios = require('axios');

async function fixStatuses() {
  try {
    // Remplacez par votre URL et token réels
    const BASE_URL = 'http://localhost:3000';
    const TOKEN = 'VOTRE_TOKEN_ICI'; // Vous devez obtenir ce token depuis la connexion
    
    console.log('🔍 Tentative de correction des statuts...');
    
    // Test de connexion
    const testResponse = await axios.get(`${BASE_URL}/api/ecom/orders`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    
    console.log('✅ Connexion réussie');
    console.log(`📊 Commandes trouvées: ${testResponse.data.data.orders.length}`);
    console.log('📊 Stats actuelles:', testResponse.data.data.stats);
    
    // Lancer la correction
    const fixResponse = await axios.get(`${BASE_URL}/api/ecom/orders/fix-statuses`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    
    console.log('✅ Correction terminée:');
    console.log(`   ${fixResponse.data.message}`);
    console.log('   Détail:', fixResponse.data.data.updates);
    
    // Vérifier les nouvelles stats
    const newStatsResponse = await axios.get(`${BASE_URL}/api/ecom/orders`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    
    console.log('📊 Nouvelles stats:');
    console.log(JSON.stringify(newStatsResponse.data.data.stats, null, 2));
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Instructions
console.log(`
🚀 Instructions pour utiliser ce script:

1. Démarrez votre backend: npm start
2. Connectez-vous à l'interface et obtenez votre token
3. Modifiez la variable TOKEN ci-dessus
4. Lancez: node fix_stats.js

Alternative: Utilisez directement l'URL dans le navigateur:
http://localhost:3000/api/ecom/orders/fix-statuses
(avec votre token d'authentification)
`);

fix_stats();
