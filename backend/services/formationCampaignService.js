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
    text: (name) => `${name}, beaucoup de personnes veulent se lancer en e-commerce, mais elles commencent dans le désordre.\n\nElles choisissent un produit au hasard, lancent une boutique rapidement, mettent un peu de publicité… puis abandonnent quand les ventes ne viennent pas.\n\nLe problème, ce n'est pas toujours le produit.\n\nSouvent, c'est la méthode.\n\nC'est pour ça que j'ai créé *Ecom Starter 3.0* : une formation pour t'aider à comprendre comment lancer ton business e-commerce avec une vraie structure.\n\nTu peux regarder la vidéo ici 👇\n\n🔗 ${process.env.FRONTEND_URL || 'https://andromeda.safitech.shop'}/formation-video`,
  },
  {
    day: 4,
    text: (name) => `${name}, réussir en e-commerce ne se limite pas à créer une boutique.\n\nTu dois comprendre :\n\n– comment choisir un bon produit\n– comment construire une offre qui donne envie d'acheter\n– comment créer une page produit convaincante\n– comment lancer tes publicités\n– comment gérer les commandes, les clients et la livraison\n\nC'est exactement ce que je t'explique dans *Ecom Starter 3.0*.\n\nL'objectif est simple : t'aider à partir avec une méthode claire au lieu d'avancer au hasard.\n\nRegarde la vidéo ici 👇\n\n🔗 ${process.env.FRONTEND_URL || 'https://andromeda.safitech.shop'}/formation-video`,
  },
  {
    day: 7,
    text: (name) => `${name}, ça fait déjà quelques jours que tu as accès à la vidéo.\n\nSi tu veux vraiment te lancer en e-commerce ou mieux structurer ce que tu fais déjà, prends le temps de regarder la formation.\n\n*Ecom Starter 3.0* a été pensé pour les personnes qui veulent comprendre les bases importantes : produit, boutique, offre, publicité, gestion client et livraison.\n\nMême si tu débutes, tu vas voir plus clairement quoi faire et dans quel ordre avancer.\n\nLa vidéo est toujours disponible ici 👇\n\n🔗 ${process.env.FRONTEND_URL || 'https://andromeda.safitech.shop'}/formation-video\n\nEt si tu as une question, tu peux répondre directement à ce message.`,
  },
  {
    day: 14,
    text: (name) => `${name}, je te relance une dernière fois concernant *Ecom Starter 3.0*.\n\nSi tu veux te lancer sérieusement en e-commerce, le plus important n'est pas de faire comme tout le monde.\n\nLe plus important, c'est d'avoir une méthode claire, de comprendre comment choisir ton produit, structurer ton offre, créer ta boutique et lancer tes premières campagnes correctement.\n\nC'est ce que je t'accompagne à faire dans *Ecom Starter 3.0*.\n\nTu peux accéder à la formation ici 👇\n\n🔗 ${process.env.FRONTEND_URL || 'https://andromeda.safitech.shop'}/formation-video\n\nÀ très vite 👋`,
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
