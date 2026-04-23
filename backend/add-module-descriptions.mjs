import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '.env') })

await mongoose.connect(process.env.MONGO_URI)

const Module = mongoose.model('Module', new mongoose.Schema({
  courseId: mongoose.Schema.Types.ObjectId,
  title: String,
  description: String,
  order: Number
}, { strict: false }))

const descriptions = {
  'MINDSET & FONDATIONS': `Dans ce module fondateur, tu vas comprendre la vraie réalité du e-commerce en Afrique : les opportunités, les pièges à éviter et ce qui distingue ceux qui réussissent de ceux qui abandonnent. On travaille la mentalité du gagnant, la gestion du stress, des pertes et des finances pour que tu sois armé mentalement avant même de lancer ta boutique.`,

  'BUSINESS MODEL E-COMMERCE AFRIQUE': `Découvre les différents modèles économiques adaptés au marché africain : dropshipping local, import-China, vente de produits transformés, revente... Tu apprendras à choisir le bon modèle selon ton budget, ta zone géographique et tes objectifs. On analyse également les plateformes de paiement disponibles en Afrique et comment les intégrer.`,

  'TROUVER UN PRODUIT GAGNANT (2026)': `La recherche produit est le pilier numéro 1 du e-commerce. Dans ce module, tu apprendras les méthodes 2026 pour identifier des produits à fort potentiel sur le marché africain, analyser la concurrence, valider la demande avec des données réelles et éviter les pièges des produits saturés ou invendables.`,

  'FOURNISSEURS & APPROVISIONNEMENT': `Comment trouver des fournisseurs fiables en Chine, en Turquie ou localement ? Ce module couvre les plateformes d'approvisionnement (Alibaba, 1688, DHgate), comment évaluer un fournisseur, négocier les prix, passer les premières commandes et gérer les délais de livraison vers l'Afrique.`,

  'FOURNISSEURS & APPROVISIONNEMENT PARTIE 2': `On va plus loin dans la relation fournisseur : négociation de prix en volume, création de produits personnalisés (private label), gestion des retours, protection contre les arnaques et construction d'une relation long terme avec tes meilleurs fournisseurs pour obtenir des conditions exclusives.`,

  'FOURNISSEURS & APPROVISIONNEMENT PARTIE 3': `Cette partie avancée couvre la logistique de bout en bout : transit, dédouanement, calcul des coûts réels d'importation, choix des transitaires et optimisation des marges. Tu sauras exactement combien te coûte un produit rendu chez toi et comment fixer un prix de vente rentable.`,

  'CRÉER UNE BOUTIQUE QUI CONVERTIT CAS SHOPIFY': `Une boutique belle ne suffit pas — elle doit vendre. Tu apprendras à créer une boutique Shopify optimisée pour la conversion : structure des pages, fiches produits convaincantes, pages de vente, mise en place des paiements locaux (Wave, Orange Money, MTN MoMo), livraisons et paramètres essentiels pour le marché africain.`,

  'Prise en main de scalor': `Scalor est l'outil de pilotage central de ta boutique. Dans ce module, tu vas maîtriser son tableau de bord : suivi des commandes, analyse des indicateurs clés (ROAS, CPM, CAC, AOV), automatisation des rapports et utilisation des données pour prendre de meilleures décisions commerciales au quotidien.`,

  'CRÉATIVES & MARKETING': `Le contenu est roi. Découvrez comment créer des vidéos, images et publicités qui capturent l'attention sur les réseaux sociaux africains. Tu apprendras les hooks qui déclenchent l'achat, le copywriting adapté aux cultures locales, la création de créatives avec des outils IA et les formats qui performent sur Facebook, TikTok et Instagram.`,

  'LANCER DES PUBS RENTABLEAVEC FACEBOOK ADS': `Facebook Ads reste le levier publicitaire le plus puissant en Afrique. Ce module te guide pas à pas : structure de campagne, ciblage des audiences africaines, budgets de départ, lecture des métriques essentielles, optimisation des campagnes et stratégies pour scaler sans brûler ton budget.`,

  'TIKTOK ADS EN AFRIQUE (2026)': `TikTok Ads explose en Afrique. Tu apprendras à créer un compte publicitaire, configurer tes pixels, lancer tes premières campagnes, créer des vidéos TikTok adaptées à chaque marché et exploiter les algorithmes de la plateforme pour générer du trafic qualifié à moindre coût.`,

  'ANALYSE & RENTABILITÉ (AVEC SCALOR)': `Savoir lire ses chiffres c'est savoir piloter. Dans ce module, tu apprendras à analyser la rentabilité réelle de ta boutique avec Scalor : calcul du bénéfice net, analyse du ROAS, identification des produits les plus rentables, détection des fuites de budget et stratégies pour augmenter tes marges.`,

  "VENDRE SUR D\u2019AUTRES MARCH\u00c9S": `Après le marché local, l'expansion. Ce module t'explique comment vendre depuis l'Afrique vers la diaspora africaine en Europe, aux États-Unis ou au Canada : adaptation des offres, solutions de paiement internationales, logistique transfrontalière et stratégies publicitaires multi-marchés.`,
  "VENDRE SUR D'AUTRES MARCH\u00c9S": `Après le marché local, l'expansion. Ce module t'explique comment vendre depuis l'Afrique vers la diaspora africaine en Europe, aux États-Unis ou au Canada : adaptation des offres, solutions de paiement internationales, logistique transfrontalière et stratégies publicitaires multi-marchés.`,
  "VENDRE SUR D\u2018AUTRES MARCH\u00c9S": `Après le marché local, l'expansion. Ce module t'explique comment vendre depuis l'Afrique vers la diaspora africaine en Europe, aux États-Unis ou au Canada : adaptation des offres, solutions de paiement internationales, logistique transfrontalière et stratégies publicitaires multi-marchés.`,

  'CRÉER SA MARQUE EN E-COMMERCE': `Construire une marque forte te donne un avantage compétitif durable. Tu découvriras comment positionner ta marque, créer une identité visuelle cohérente, développer une communauté fidèle sur les réseaux sociaux, travailler avec des influenceurs africains et transformer des acheteurs en ambassadeurs.`,

  "GESTION D\u2019\u00c9QUIPE EN E-COMMERCE": `Quand le business grandit, il faut déléguer. Ce module couvre le recrutement de prestataires fiables (agents de livraison, SAV, community managers), la gestion à distance, les outils de collaboration, la structure des salaires et commissions, et comment créer des process pour faire tourner la boutique sans toi.`,
  "GESTION D'\u00c9QUIPE EN E-COMMERCE": `Quand le business grandit, il faut déléguer. Ce module couvre le recrutement de prestataires fiables (agents de livraison, SAV, community managers), la gestion à distance, les outils de collaboration, la structure des salaires et commissions, et comment créer des process pour faire tourner la boutique sans toi.`,
  "GESTION D\u2018\u00c9QUIPE EN E-COMMERCE": `Quand le business grandit, il faut déléguer. Ce module couvre le recrutement de prestataires fiables (agents de livraison, SAV, community managers), la gestion à distance, les outils de collaboration, la structure des salaires et commissions, et comment créer des process pour faire tourner la boutique sans toi.`,

  'Comprendre la logistique en e-commerce': `La logistique est souvent le point faible des e-commerçants africains. Ce module décrypte tout : choix des livreurs (local vs national), suivi des colis, gestion des retours et remboursements, entrepôts et stocks, coûts de livraison optimaux et comment transformer la logistique en avantage concurrentiel.`
}

const COURSE_SLUG = /ecom-starter-30/
const Course = mongoose.model('Course', new mongoose.Schema({ slug: String }, { strict: false }))
const course = await Course.findOne({ slug: COURSE_SLUG })
if (!course) { console.error('Course not found'); process.exit(1) }

const modules = await Module.find({ courseId: course._id })
let updated = 0

for (const mod of modules) {
  const desc = descriptions[mod.title]
  if (desc) {
    await Module.updateOne({ _id: mod._id }, { $set: { description: desc } })
    console.log(`✅ ${mod.title}`)
    updated++
  } else {
    console.log(`⚠️  Pas de description pour: "${mod.title}"`)
  }
}

console.log(`\n✅ ${updated} modules mis à jour`)
await mongoose.disconnect()
