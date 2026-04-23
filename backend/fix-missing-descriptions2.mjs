import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '.env') })

await mongoose.connect(process.env.MONGO_URI)

const Module = mongoose.model('ModuleFix2', new mongoose.Schema({ title: String, description: String }, { strict: false, collection: 'modules' }))

const fixes = [
  {
    _id: '69e8fda6e324d41d8a260a4f', // Comprendre la logistique — restaurer bonne desc
    description: `La logistique est souvent le point faible des e-commerçants africains. Ce module décrypte tout : choix des livreurs (local vs national), suivi des colis, gestion des retours et remboursements, entrepôts et stocks, coûts de livraison optimaux et comment transformer la logistique en avantage concurrentiel.`
  },
  {
    _id: '69e8fcf1e324d41d8a2609e3', // GESTION D'ÉQUIPE
    description: `Quand le business grandit, il faut déléguer. Ce module couvre le recrutement de prestataires fiables (agents de livraison, SAV, community managers), la gestion à distance, les outils de collaboration, la structure des salaires et commissions, et comment créer des process pour faire tourner la boutique sans toi.`
  }
]

for (const fix of fixes) {
  const mod = await Module.findById(fix._id)
  if (mod) {
    await Module.updateOne({ _id: fix._id }, { $set: { description: fix.description } })
    console.log(`✅ "${mod.title}" corrigé`)
  }
}

await mongoose.disconnect()
