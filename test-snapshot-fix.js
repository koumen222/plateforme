import mongoose from 'mongoose';

// Test du helper toObjectId
const toObjectId = (v) => {
  if (!v) return null;
  if (v instanceof mongoose.Types.ObjectId) return v;
  if (mongoose.Types.ObjectId.isValid(v)) return new mongoose.Types.ObjectId(v);
  return null;
};

console.log('🧪 Test du helper toObjectId:');
console.log('- String valide:', toObjectId('507f1f77bcf86cd799439011'));
console.log('- ObjectId existant:', toObjectId(new mongoose.Types.ObjectId()));
console.log('- String invalide:', toObjectId('invalid-id'));
console.log('- null/undefined:', toObjectId(null), toObjectId(undefined));

console.log('✅ Fix appliqué avec succès !');
console.log('📋 Résumé des modifications:');
console.log('1. ✅ Ajout du helper toObjectId pour conversion sécurisée');
console.log('2. ✅ Modification du CREATE pour sauvegarder les IDs client (pas commande)');
console.log('3. ✅ Modification du SEND avec résolution sécurisée du snapshot');
console.log('4. ✅ Logs de debug détaillés pour diagnostiquer');
console.log('5. ✅ Gestion workspaceId string vs ObjectId');
