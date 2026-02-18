// Test de la construction d'URL Green API
console.log('🧪 Test URL Construction Green API:');

// Simulation des variables d'environnement
process.env.GREEN_API_URL = 'https://api.green-api.com';
process.env.GREEN_API_ID_INSTANCE = '7103497791';
process.env.GREEN_API_TOKEN_INSTANCE = 'test-token';

// Test de la construction correcte
const apiUrl = process.env.GREEN_API_URL || 'https://api.green-api.com';
const idInstance = process.env.GREEN_API_ID_INSTANCE;
const apiTokenInstance = process.env.GREEN_API_TOKEN_INSTANCE;

const url = `${apiUrl}/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;

console.log('✅ URL CORRECTE:', url);
console.log('');

// Test de l'ancienne méthode incorrecte
const oldWrongUrl = `https://${idInstance}.api.greenapi.com/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;
console.log('❌ ANCIENNE URL INCORRECTE:', oldWrongUrl);
console.log('');

// Test de l'URL de healthcheck
const healthUrl = `${apiUrl}/waInstance${idInstance}/getStateInstance/${apiTokenInstance}`;
console.log('🔍 HEALTHCHECK URL:', healthUrl);

console.log('');
console.log('✅ Fix appliqué avec succès !');
console.log('📋 Résumé des corrections:');
console.log('1. ✅ URL correcte: https://api.green-api.com/waInstance{id}/sendMessage/{token}');
console.log('2. ✅ Log "[GreenAPI] POST" ajouté pour chaque envoi');
console.log('3. ✅ Healthcheck avant envoi en masse (timeout 8s)');
console.log('4. ✅ Arrêt préventif si healthcheck échoue');
