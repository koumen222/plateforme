import express from 'express';
import CoachingApplication from '../models/CoachingApplication.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const {
      fullName,
      whatsapp,
      email,
      country,
      monthlySales,
      mainGoal,
      facebookAdsExperience,
      hasProduct,
      hasShopify,
      hasStock,
      budget,
      available7Days,
      adExperience,
      motivation
    } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ error: 'Nom et prénom requis' });
    }

    if (!whatsapp || !whatsapp.trim()) {
      return res.status(400).json({ error: 'Numéro WhatsApp requis' });
    }

    if (!country || !country.trim()) {
      return res.status(400).json({ error: 'Pays requis' });
    }

    if (!hasProduct || !['Oui', 'Non'].includes(hasProduct)) {
      return res.status(400).json({ error: 'Réponse requise pour "Produit déjà existant ?"' });
    }

    if (!hasShopify || !['Oui', 'Non'].includes(hasShopify)) {
      return res.status(400).json({ error: 'Réponse requise pour "Produit déjà en ligne sur Shopify ?"' });
    }

    if (!hasStock || !['Oui', 'Non'].includes(hasStock)) {
      return res.status(400).json({ error: 'Réponse requise pour "Stock disponible ?"' });
    }

    if (!budget || !['< 50 000 FCFA', '50 000 – 100 000 FCFA', '> 100 000 FCFA'].includes(budget)) {
      return res.status(400).json({ error: 'Budget requis' });
    }

    if (!available7Days || !['Oui', 'Non'].includes(available7Days)) {
      return res.status(400).json({ error: 'Réponse requise pour "Disponible 7 jours consécutifs ?"' });
    }

    if (!adExperience || !['Déjà lancé', 'Lancé mais pas rentable', 'Jamais lancé'].includes(adExperience)) {
      return res.status(400).json({ error: 'Expérience publicitaire requise' });
    }

    let autoStatus = 'En attente';
    if (hasProduct === 'Non' || hasShopify === 'Non' || hasStock === 'Non' || available7Days === 'Non') {
      autoStatus = 'Refusé';
    }

    const application = new CoachingApplication({
      fullName: fullName.trim(),
      whatsapp: whatsapp.trim(),
      email: email?.trim() || '',
      country: country.trim(),
      monthlySales: monthlySales || '',
      mainGoal: mainGoal?.trim() || '',
      facebookAdsExperience: facebookAdsExperience || '',
      hasProduct,
      hasShopify,
      hasStock,
      budget,
      available7Days,
      adExperience,
      motivation: motivation?.trim() || '',
      status: autoStatus
    });

    await application.save();

    res.status(201).json({
      success: true,
      message: 'Candidature enregistrée avec succès',
      application: {
        id: application._id,
        status: application.status
      }
    });
  } catch (error) {
    console.error('Erreur création candidature:', error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement de la candidature' });
  }
});

router.use(authenticate);
router.use(requireAdmin);

router.get('/admin', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }

    const applications = await CoachingApplication.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      applications,
      count: applications.length
    });
  } catch (error) {
    console.error('Erreur récupération candidatures:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des candidatures' });
  }
});

router.put('/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentLink } = req.body;

    const application = await CoachingApplication.findById(id);
    if (!application) {
      return res.status(404).json({ error: 'Candidature non trouvée' });
    }

    application.status = 'Accepté';
    if (paymentLink) {
      application.paymentLink = paymentLink.trim();
    }

    await application.save();

    res.json({
      success: true,
      message: 'Candidature acceptée',
      application: application.toObject()
    });
  } catch (error) {
    console.error('Erreur acceptation candidature:', error);
    res.status(500).json({ error: 'Erreur lors de l\'acceptation de la candidature' });
  }
});

router.put('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;

    const application = await CoachingApplication.findById(id);
    if (!application) {
      return res.status(404).json({ error: 'Candidature non trouvée' });
    }

    application.status = 'Refusé';
    await application.save();

    res.json({
      success: true,
      message: 'Candidature refusée',
      application: application.toObject()
    });
  } catch (error) {
    console.error('Erreur refus candidature:', error);
    res.status(500).json({ error: 'Erreur lors du refus de la candidature' });
  }
});

router.put('/:id/payment-link', async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentLink } = req.body;

    const application = await CoachingApplication.findById(id);
    if (!application) {
      return res.status(404).json({ error: 'Candidature non trouvée' });
    }

    application.paymentLink = paymentLink?.trim() || '';
    await application.save();

    res.json({
      success: true,
      message: 'Lien de paiement mis à jour',
      application: application.toObject()
    });
  } catch (error) {
    console.error('Erreur mise à jour lien paiement:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du lien de paiement' });
  }
});

router.post('/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params;
    const application = await CoachingApplication.findById(id);
    if (!application) {
      return res.status(404).json({ error: 'Candidature non trouvée' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API non configurée' });
    }

    const expFBAds = application.facebookAdsExperience || 'Non renseigné'
    const expPub = application.adExperience || 'Non renseigné'
    const expComplete = expFBAds !== 'Non renseigné' && expPub !== 'Non renseigné' 
      ? `${expFBAds} (${expPub})`
      : expFBAds !== 'Non renseigné' ? expFBAds : expPub

    const prompt = `Analyse cette candidature pour un coaching e-commerce 7 jours.

Données du candidat:
- Ventes/mois: ${application.monthlySales || 'Non renseigné'}
- Budget publicitaire: ${application.budget || 'Non renseigné'}
- Expérience FB Ads: ${expComplete}
- Objectif: ${application.mainGoal || 'Non renseigné'}
- Motivation: ${application.motivation || 'Non renseigné'}

Réponds UNIQUEMENT au format JSON suivant (sans texte avant ou après):
{
  "score": 75,
  "decision": "Accepté",
  "raison": "Candidat avec bon potentiel et budget adapté"
}

Critères d'évaluation:
- Score 0-100 basé sur ventes, budget, expérience, objectif clair, motivation
- Décision: "Accepté" (score >= 70), "En attente" (score 50-69), "Refusé" (score < 50)
- Raison: 1 phrase max expliquant la décision`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Tu es un expert en sélection de candidats pour coaching e-commerce. Réponds uniquement en JSON valide.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erreur OpenAI:', errorData);
      return res.status(500).json({ error: 'Erreur lors de l\'analyse IA' });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    
    if (!content) {
      return res.status(500).json({ error: 'Réponse IA vide' });
    }

    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON non trouvé');
      }
    } catch (parseError) {
      console.error('Erreur parsing JSON:', parseError, 'Content:', content);
      return res.status(500).json({ error: 'Format de réponse IA invalide' });
    }

    if (!analysis.score || !analysis.decision || !analysis.raison) {
      return res.status(500).json({ error: 'Format d\'analyse incomplet' });
    }

    res.json({
      success: true,
      analysis: {
        score: Math.min(100, Math.max(0, parseInt(analysis.score) || 0)),
        decision: analysis.decision,
        raison: analysis.raison
      }
    });
  } catch (error) {
    console.error('Erreur analyse IA:', error);
    res.status(500).json({ error: 'Erreur lors de l\'analyse IA' });
  }
});

router.post('/analyze-all', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API non configurée' });
    }

    const applications = await CoachingApplication.find({}).lean();
    
    if (applications.length === 0) {
      return res.json({
        success: true,
        results: [],
        count: 0
      });
    }

    const analyzeApplication = async (application) => {
      try {
        const expFBAds = application.facebookAdsExperience || 'Non renseigné'
        const expPub = application.adExperience || 'Non renseigné'
        const expComplete = expFBAds !== 'Non renseigné' && expPub !== 'Non renseigné' 
          ? `${expFBAds} (${expPub})`
          : expFBAds !== 'Non renseigné' ? expFBAds : expPub

        const prompt = `Analyse cette candidature pour un coaching e-commerce 7 jours.

Données du candidat:
- Ventes/mois: ${application.monthlySales || 'Non renseigné'}
- Budget publicitaire: ${application.budget || 'Non renseigné'}
- Expérience FB Ads: ${expComplete}
- Objectif: ${application.mainGoal || 'Non renseigné'}
- Motivation: ${application.motivation || 'Non renseigné'}

Réponds UNIQUEMENT au format JSON suivant (sans texte avant ou après):
{
  "score": 75,
  "decision": "Accepté",
  "raison": "Candidat avec bon potentiel et budget adapté"
}

Critères d'évaluation:
- Score 0-100 basé sur ventes, budget, expérience, objectif clair, motivation
- Décision: "Accepté" (score >= 70), "En attente" (score 50-69), "Refusé" (score < 50)
- Raison: 1 phrase max expliquant la décision`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'Tu es un expert en sélection de candidats pour coaching e-commerce. Réponds uniquement en JSON valide.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 200
          })
        });

        if (!response.ok) {
          throw new Error('Erreur OpenAI');
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        
        if (!content) {
          throw new Error('Réponse vide');
        }

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('JSON non trouvé');
        }

        const analysis = JSON.parse(jsonMatch[0]);
        
        return {
          id: application._id.toString(),
          success: true,
          analysis: {
            score: Math.min(100, Math.max(0, parseInt(analysis.score) || 0)),
            decision: analysis.decision,
            raison: analysis.raison
          }
        };
      } catch (error) {
        console.error(`Erreur analyse candidature ${application._id}:`, error);
        return {
          id: application._id.toString(),
          success: false,
          error: error.message
        };
      }
    };

    const results = await Promise.all(applications.map(analyzeApplication));

    res.json({
      success: true,
      results: results,
      count: results.length,
      successCount: results.filter(r => r.success).length
    });
  } catch (error) {
    console.error('Erreur analyse batch:', error);
    res.status(500).json({ error: 'Erreur lors de l\'analyse batch' });
  }
});

router.post('/:id/generate-message', async (req, res) => {
  try {
    const { id } = req.params;
    const application = await CoachingApplication.findById(id);
    if (!application) {
      return res.status(404).json({ error: 'Candidature non trouvée' });
    }

    if (application.status !== 'Accepté') {
      return res.status(400).json({ error: 'Seules les candidatures acceptées peuvent générer un message' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API non configurée' });
    }

    const prompt = `Génère un message WhatsApp personnalisé pour un candidat accepté au coaching e-commerce 7 jours.

Données du candidat:
- Nom: ${application.fullName}
- Pays: ${application.country || 'Non renseigné'}
- Ventes/mois: ${application.monthlySales || 'Non renseigné'}
- Budget: ${application.budget || 'Non renseigné'}
- Objectif: ${application.mainGoal || 'Non renseigné'}
- Motivation: ${application.motivation || 'Non renseigné'}

Contraintes:
- Ton professionnel et engageant
- Pas de mention de paiement
- Mettre l'accent sur engagement et discipline
- Message court: 5-6 lignes maximum
- En français
- Commencer par saluer avec le prénom`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Tu es un expert en communication pour coaching e-commerce. Génère des messages WhatsApp professionnels et engageants.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erreur OpenAI:', errorData);
      return res.status(500).json({ error: 'Erreur lors de la génération du message' });
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content?.trim();
    
    if (!message) {
      return res.status(500).json({ error: 'Message généré vide' });
    }

    const whatsappGroupLink = 'https://chat.whatsapp.com/KiYqQy1yZabCdqUGRawF7o';
    const finalMessage = `${message}\n\nRejoins notre groupe pour commencer : ${whatsappGroupLink}`;

    res.json({
      success: true,
      message: finalMessage
    });
  } catch (error) {
    console.error('Erreur génération message:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du message' });
  }
});

export default router;
