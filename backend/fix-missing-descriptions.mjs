import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '.env') })

await mongoose.connect(process.env.MONGO_URI)

const Module = mongoose.model('ModuleFix', new mongoose.Schema({ title: String, description: String }, { strict: false, collection: 'modules' }))

// Fix by ID for the 2 modules that had encoding issues
const fixes = [
  {
    _id: '69e8fda6e324d41d8a260a4f', // GESTION D'ÉQUIPE
    description: `Quand le business grandit, il faut déléguer. Ce module couvre le recrutement de prestataires fiables (agents de livraison, SAV, community managers), la gestion à distance, les outils de collaboration, la structure des salaires et commissions, et comment créer des process pour faire tourner la boutique sans toi.`
  },
  {
    _id: '69e8fbaae324d41d8a2608f4', // VENDRE SUR D'AUTRES MARCHÉS
    description: `Après le marché local, l'expansion. Ce module t'explique comment vendre depuis l'Afrique vers la diaspora africaine en Europe, aux États-Unis ou au Canada : adaptation des offres, solutions de paiement internationales, logistique transfrontalière et stratégies publicitaires multi-marchés.`
  }
]

for (const fix of fixes) {
  const mod = await Module.findById(fix._id)
  if (mod) {
    await Module.updateOne({ _id: fix._id }, { $set: { description: fix.description } })
    console.log(`✅ "${mod.title}" mis à jour`)
  } else {
    console.log(`❌ Module non trouvé: ${fix._id}`)
  }
}

await mongoose.disconnect()
