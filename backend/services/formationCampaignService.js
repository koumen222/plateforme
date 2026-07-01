import cron from 'node-cron';
import FormationLead from '../models/FormationLead.js';

// Séquence de messages — J1 à J14
// {{name}} est remplacé par le prénom du prospect
export const SEQUENCE = [
  {
    day: 1,
    text: (name) => `Bienvenue ${name} ! 🎉\n\nOn est super contents de t'accueillir dans la formation gratuite !\n\nBon courage pour la suite, tu vas apprendre énormément 💪🚀\n\nRejoins tout de suite le groupe WhatsApp de la communauté pour échanger avec les autres membres 👇\n\nhttps://chat.whatsapp.com/ELrkH1Fbv7WEcqg1laF36Y?mode=gi_t\n\nÀ très vite dans le groupe ! 🙌`,
  },
  {
    day: 2,
    text: (name) => `${name}, beaucoup de gens font cette erreur fatale sur Facebook Ads ❌\n\nIls lancent des pubs sans avoir testé leur audience. Résultat : 0 ventes, budget gaspillé.\n\nLa méthode Andromeda corrige exactement ça.\n\nTu veux voir comment ? Réponds OUI et je t'envoie la vidéo 🎯`,
  },
  {
    day: 4,
    text: (name) => `${name} 👀\n\nTu savais qu'on peut générer des ventes avec un budget de seulement 5000 FCFA/jour ?\n\nC'est ce qu'on appelle la structure "micro-budget haute conversion".\n\nJe t'explique tout dans la formation. Clique ici pour accéder à la vidéo gratuite 👇\n\n🔗 ${process.env.FRONTEND_URL || 'https://andromeda.safitech.shop'}/formation-video`,
  },
  {
    day: 7,
    text: (name) => `${name}, 7 jours déjà ! ⏰\n\nCeux qui ont appliqué la méthode cette semaine ont déjà vu leurs premières ventes.\n\nSi tu n'as pas encore regardé la formation, c'est le bon moment.\n\nLa vidéo est toujours disponible gratuitement ici 👇\n🔗 ${process.env.FRONTEND_URL || 'https://andromeda.safitech.shop'}/formation-video\n\nDes questions ? Réponds directement à ce message 🙂`,
  },
  {
    day: 14,
    text: (name) => `${name}, dernière chance 🔥\n\nLa session de coaching personnalisée offerte avec la formation ferme bientôt.\n\nSi tu veux qu'on analyse ensemble ta stratégie Facebook Ads et qu'on construise une campagne qui convertit — c'est maintenant.\n\nRéserve ta place ici 👇\n🔗 ${process.env.FRONTEND_URL || 'https://andromeda.safitech.shop'}/coaching\n\nÀ très vite ! 🚀`,
  },
];

export async function scalorSend(phone, text) {
  const apiKey = process.env.SCALOR_API_KEY;
  const instanceId = process.env.SCALOR_INSTANCE_ID;
  if (!apiKey || !instanceId) throw new Error('Scalor non configuré');

  const res = await fetch('https://api.scalor.net/api/v1/message/send', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ instanceId, number: phone.replace(/[^0-9]/g, ''), text }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || data.message || 'Erreur Scalor');
  return data;
}

export async function runCampaignCron() {
  const now = new Date();

  // Récupérer tous les leads actifs
  const leads = await FormationLead.find({ 'campaign.active': true });
  if (!leads.length) return;

  let sent = 0;
  let failed = 0;

  for (const lead of leads) {
    const enrolledAt = lead.createdAt;
    const daysSince = Math.floor((now - enrolledAt) / (1000 * 60 * 60 * 24));

    for (const step of SEQUENCE) {
      // Ce message doit partir aujourd'hui (J calculé depuis l'inscription)
      if (step.day - 1 !== daysSince) continue;

      // Vérifier qu'il n'a pas déjà été envoyé
      const alreadySent = lead.campaign.messagesSent.some((m) => m.day === step.day);
      if (alreadySent) continue;

      try {
        const text = step.text(lead.name);
        await scalorSend(lead.phone, text);
        lead.campaign.messagesSent.push({ day: step.day, sentAt: now, status: 'sent' });
        console.log(`✅ Campagne J${step.day} envoyée → ${lead.name} (${lead.phone})`);
        sent++;
      } catch (err) {
        lead.campaign.messagesSent.push({ day: step.day, sentAt: now, status: 'failed' });
        console.error(`❌ Campagne J${step.day} échouée → ${lead.name}: ${err.message}`);
        failed++;
      }

      await lead.save();

      // Désactiver la campagne après le dernier message
      const lastDay = SEQUENCE[SEQUENCE.length - 1].day;
      if (step.day === lastDay) {
        lead.campaign.active = false;
        await lead.save();
      }
    }
  }

  if (sent + failed > 0) {
    console.log(`📊 Campagne formation — envoyés: ${sent}, échoués: ${failed}`);
  }
}

export function startFormationCampaignCron() {
  // Chaque jour à 9h00 (heure Douala = UTC+1)
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Cron campagne formation démarré...');
    try {
      await runCampaignCron();
    } catch (err) {
      console.error('❌ Erreur cron campagne formation:', err.message);
    }
  }, { timezone: 'Africa/Douala' });

  console.log('✅ Cron campagne formation démarré (9h00 Douala chaque jour)');
}
