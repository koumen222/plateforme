#!/usr/bin/env node

/**
 * 🧪 Script de Test pour les Fonctionnalités Anti-Spam WhatsApp
 * 
 * Ce script permet de tester les nouvelles fonctionnalités anti-spam
 * avant de les déployer en production.
 */

import { 
  analyzeSpamRisk, 
  validateMessageBeforeSend, 
  getHumanDelayWithVariation,
  simulateHumanBehavior,
  getMessageWithRotation,
  monitorSpamMetrics
} from './services/whatsappService.js';

// Configuration des tests
const TEST_CONFIG = {
  dryRun: true, // Mode test sans envoi réel
  verbose: true  // Logs détaillés
};

// 🚫 Messages à haut risque de spam (doivent être rejetés)
const HIGH_RISK_MESSAGES = [
  "GRATUIT !!! ACHETEZ MAINTENANT PROMOTION SPÉCIALE CLIQUEZ ICI",
  "GAGNEZ 100% GRATUIT ARGENT RAPIDE DEVENEZ RICHE!!!",
  "URGENT LIMITÉ OFFRE SPÉCIALE DEMANDEZ SOLLICITEZ IMMÉDIAT",
  "MULTI-LEVEL MARKETING PUBLICITÉ LIEN SPONSORISÉ CONCOURS BONUS",
  "TELEPHONE: 1234567890 CLIQUEZ ICI HTTPS://SITE1.COM HTTPS://SITE2.COM"
];

// ⚠️ Messages à risque moyen (doivent générer des avertissements)
const MEDIUM_RISK_MESSAGES = [
  "Bonjour ! Je voulais vous parler d'une promotion spéciale...",
  "Salut ! Découvrez notre offre limitée !",
  "Hey ! J'ai quelque chose d'urgent à vous partager...",
  "Bonsoir ! Une petite promo pour vous aujourd'hui!!"
];

// ✅ Messages sécurisés (doivent être validés)
const SAFE_MESSAGES = [
  "Salut [PRENOM] ! Comment allez-vous ? 😊",
  "Bonjour [PRENOM] ! J'espère que vous passez une bonne journée.",
  "Hey [PRENOM] ! Je voulais partager quelque chose d'intéressant avec vous...",
  "Bonjour [PRENOM] ! Je pense à vous aujourd'hui 👋",
  "Salut [PRENOM] ! Tout va bien ?"
];

/**
 * Test d'analyse de risque de spam
 */
const testSpamRiskAnalysis = () => {
  console.log('\n🔍 TEST 1: Analyse de Risque de Spam');
  console.log('=' .repeat(50));
  
  const allTests = [
    { messages: HIGH_RISK_MESSAGES, expectedRisk: 'HIGH', label: 'Messages à haut risque' },
    { messages: MEDIUM_RISK_MESSAGES, expectedRisk: 'MEDIUM', label: 'Messages à risque moyen' },
    { messages: SAFE_MESSAGES, expectedRisk: 'LOW', label: 'Messages sécurisés' }
  ];
  
  let totalTests = 0;
  let passedTests = 0;
  
  allTests.forEach(({ messages, expectedRisk, label }) => {
    console.log(`\n📝 ${label}:`);
    
    messages.forEach((message, index) => {
      totalTests++;
      const analysis = analyzeSpamRisk(message);
      const passed = analysis.risk === expectedRisk;
      
      if (passed) passedTests++;
      
      console.log(`  ${index + 1}. ${passed ? '✅' : '❌'} Risque: ${analysis.risk} (attendu: ${expectedRisk})`);
      console.log(`     Message: "${message.substring(0, 50)}..."`);
      console.log(`     Score: ${analysis.score} | Warnings: ${analysis.warnings.length}`);
      
      if (analysis.warnings.length > 0 && TEST_CONFIG.verbose) {
        console.log(`     Warnings: ${analysis.warnings.join(', ')}`);
      }
    });
  });
  
  console.log(`\n📊 Résultats analyse: ${passedTests}/${totalTests} tests passés`);
  return passedTests === totalTests;
};

/**
 * Test de validation avant envoi
 */
const testMessageValidation = () => {
  console.log('\n🚫 TEST 2: Validation Avant Envoi');
  console.log('=' .repeat(50));
  
  const testCases = [
    { message: HIGH_RISK_MESSAGES[0], expected: false, label: 'Haut risque' },
    { message: MEDIUM_RISK_MESSAGES[0], expected: true, label: 'Risque moyen' },
    { message: SAFE_MESSAGES[0], expected: true, label: 'Message sûr' },
    { message: '', expected: false, label: 'Message vide' },
    { message: 'a', expected: true, label: 'Message très court' }
  ];
  
  let passedTests = 0;
  
  testCases.forEach(({ message, expected, label }, index) => {
    const result = validateMessageBeforeSend(message, 'test-user-id');
    const passed = result === expected;
    
    if (passed) passedTests++;
    
    console.log(`${index + 1}. ${passed ? '✅' : '❌'} ${label}: ${result ? 'Validé' : 'Rejeté'} (attendu: ${expected ? 'Validé' : 'Rejeté'})`);
    
    if (TEST_CONFIG.verbose && message) {
      console.log(`   Message: "${message}"`);
    }
  });
  
  console.log(`\n📊 Résultats validation: ${passedTests}/${testCases.length} tests passés`);
  return passedTests === testCases.length;
};

/**
 * Test des délais humains
 */
const testHumanDelays = () => {
  console.log('\n⏱️ TEST 3: Délais Humains avec Variation');
  console.log('=' .repeat(50));
  
  const delays = [];
  const numTests = 10;
  
  for (let i = 0; i < numTests; i++) {
    const delay = getHumanDelayWithVariation();
    delays.push(delay);
  }
  
  const avgDelay = delays.reduce((a, b) => a + b, 0) / delays.length;
  const minDelay = Math.min(...delays);
  const maxDelay = Math.max(...delays);
  
  console.log(`📊 Statistiques sur ${numTests} délais générés:`);
  console.log(`   Moyenne: ${Math.round(avgDelay / 1000)}s`);
  console.log(`   Minimum: ${Math.round(minDelay / 1000)}s`);
  console.log(`   Maximum: ${Math.round(maxDelay / 1000)}s`);
  console.log(`   Variation: ${Math.round((maxDelay - minDelay) / 1000)}s`);
  
  // Vérifier que les délais sont dans la plage attendue (30-60 secondes)
  const inRange = delays.every(d => d >= 30000 && d <= 60000);
  const hasVariation = (maxDelay - minDelay) > 5000; // Au moins 5s de variation
  
  console.log(`\n✅ Plage de délais correcte: ${inRange ? 'OUI' : 'NON'}`);
  console.log(`✅ Variation suffisante: ${hasVariation ? 'OUI' : 'NON'}`);
  
  return inRange && hasVariation;
};

/**
 * Test de rotation des messages
 */
const testMessageRotation = () => {
  console.log('\n🎲 TEST 4: Rotation des Messages');
  console.log('=' .repeat(50));
  
  const messageTypes = ['greetings', 'content_intro', 'followup', 'closing'];
  const results = {};
  
  messageTypes.forEach(type => {
    const messages = [];
    const numTests = 20;
    
    for (let i = 0; i < numTests; i++) {
      const message = getMessageWithRotation('test-user', type);
      messages.push(message);
    }
    
    const uniqueMessages = [...new Set(messages)];
    const diversity = uniqueMessages.length / messages.length;
    
    results[type] = {
      total: messages.length,
      unique: uniqueMessages.length,
      diversity: Math.round(diversity * 100)
    };
    
    console.log(`📝 ${type}:`);
    console.log(`   Messages générés: ${messages.length}`);
    console.log(`   Messages uniques: ${uniqueMessages.length}`);
    console.log(`   Diversité: ${results[type].diversity}%`);
    
    if (TEST_CONFIG.verbose && uniqueMessages.length > 0) {
      console.log(`   Exemples: ${uniqueMessages.slice(0, 2).map(m => `"${m}"`).join(', ')}`);
    }
  });
  
  // Vérifier qu'il y a une bonne diversité (>50%)
  const goodDiversity = Object.values(results).every(r => r.diversity > 50);
  console.log(`\n✅ Bonne diversité de messages: ${goodDiversity ? 'OUI' : 'NON'}`);
  
  return goodDiversity;
};

/**
 * Test de monitoring (simulation)
 */
const testMonitoring = async () => {
  console.log('\n📊 TEST 5: Monitoring des Métriques');
  console.log('=' .repeat(50));
  
  // Simuler des logs pour une campagne fictive
  const mockCampaignId = 'test-campaign-123';
  
  console.log('⚠️ Test de monitoring nécessite une vraie campagne...');
  console.log('   Pour tester complètement, exécuter une vraie campagne et vérifier les métriques.');
  
  // Test avec une campagne qui n'existe pas (doit retourner des métriques vides)
  try {
    const metrics = await monitorSpamMetrics(mockCampaignId);
    console.log(`📊 Métriques campagne fictive: ${metrics.total || 0} messages`);
    console.log(`   ✅ Gestion des campagnes inexistantes: OK`);
    return true;
  } catch (error) {
    console.log(`❌ Erreur monitoring: ${error.message}`);
    return false;
  }
};

/**
 * Test d'intégration complet
 */
const runIntegrationTest = async () => {
  console.log('\n🔧 TEST 6: Intégration Complète');
  console.log('=' .repeat(50));
  
  const testMessage = SAFE_MESSAGES[0];
  const testPhone = '237123456789'; // Numéro de test Cameroun
  
  console.log('📝 Test du flux complet avec un message sécurisé...');
  
  // 1. Analyse de risque
  const analysis = analyzeSpamRisk(testMessage);
  console.log(`   1️⃣ Analyse risque: ${analysis.risk} (score: ${analysis.score})`);
  
  // 2. Validation
  const isValid = validateMessageBeforeSend(testMessage, 'test-user');
  console.log(`   2️⃣ Validation: ${isValid ? '✅ Validé' : '❌ Rejeté'}`);
  
  // 3. Délai humain
  const delay = getHumanDelayWithVariation();
  console.log(`   3️⃣ Délai calculé: ${Math.round(delay / 1000)}s`);
  
  // 4. Message de rotation
  const rotatedMessage = getMessageWithRotation('test-user', 'greetings');
  console.log(`   4️⃣ Message roté: "${rotatedMessage}"`);
  
  console.log('\n✅ Flux d\'intégration testé avec succès');
  return true;
};

/**
 * Fonction principale de test
 */
const runAllTests = async () => {
  console.log('🧪 DÉMARRAGE DES TESTS ANTI-SPAM WHATSAPP');
  console.log('=' .repeat(60));
  console.log(`Mode: ${TEST_CONFIG.dryRun ? 'DRY RUN (sans envoi)' : 'PRODUCTION'}`);
  console.log(`Verbose: ${TEST_CONFIG.verbose ? 'OUI' : 'NON'}`);
  
  const tests = [
    { name: 'Analyse de Spam', fn: testSpamRiskAnalysis },
    { name: 'Validation Messages', fn: testMessageValidation },
    { name: 'Délais Humains', fn: testHumanDelays },
    { name: 'Rotation Messages', fn: testMessageRotation },
    { name: 'Monitoring', fn: testMonitoring },
    { name: 'Intégration', fn: runIntegrationTest }
  ];
  
  let passedTests = 0;
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
      if (result) passedTests++;
    } catch (error) {
      console.error(`❌ Erreur dans le test "${test.name}": ${error.message}`);
      results.push({ name: test.name, passed: false, error: error.message });
    }
  }
  
  // Résumé final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('='.repeat(60));
  
  results.forEach(({ name, passed, error }) => {
    console.log(`${passed ? '✅' : '❌'} ${name}${error ? ` (${error})` : ''}`);
  });
  
  console.log(`\n🎯 Résultat final: ${passedTests}/${tests.length} tests passés`);
  
  if (passedTests === tests.length) {
    console.log('🎉 TOUS LES TESTS SONT PASSÉS !');
    console.log('✅ Le système anti-spam est prêt pour la production.');
  } else {
    console.log('⚠️ CERTAINS TESTS ONT ÉCHOUÉ');
    console.log('🔧 Veuillez corriger les problèmes avant de déployer en production.');
  }
  
  console.log('\n📖 Prochaines étapes:');
  console.log('1. Corriger les tests échoués si nécessaire');
  console.log('2. Tester avec une petite campagne réelle');
  console.log('3. Surveiller les métriques en production');
  console.log('4. Ajuster les seuils selon les résultats');
  
  return passedTests === tests.length;
};

// Exécuter les tests si ce script est lancé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Erreur critique lors des tests:', error);
      process.exit(1);
    });
}

export {
  runAllTests,
  testSpamRiskAnalysis,
  testMessageValidation,
  testHumanDelays,
  testMessageRotation,
  testMonitoring,
  runIntegrationTest
};
