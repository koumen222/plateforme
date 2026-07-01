import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import FormationLead from '../models/FormationLead.js';

const router = express.Router();

async function notifyNewLead(lead) {
  const apiKey = process.env.SCALOR_API_KEY;
  const instanceId = process.env.SCALOR_INSTANCE_ID;
  const notifyNumber = process.env.SCALOR_NOTIFY_NUMBER;

  if (!apiKey || !instanceId || !notifyNumber) {
    console.warn('⚠️ Scalor non configuré (SCALOR_API_KEY / SCALOR_INSTANCE_ID / SCALOR_NOTIFY_NUMBER manquants)');
    return;
  }

  const text = `🔔 Nouveau prospect formation !\n\n👤 Nom : ${lead.name}\n📞 Téléphone : ${lead.phone}${lead.email ? `\n📧 Email : ${lead.email}` : ''}\n🕐 ${new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Douala' })}`;

  try {
    const res = await fetch('https://api.scalor.net/api/v1/message/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ instanceId, number: notifyNumber, text }),
    });
    const data = await res.json();
    if (data.success) {
      console.log(`✅ Notification WhatsApp envoyée pour lead: ${lead.name}`);
    } else {
      console.error('❌ Scalor erreur:', data.error || data.message);
    }
  } catch (err) {
    console.error('❌ Scalor fetch error:', err.message);
  }
}

// Envoyer automatiquement le 1er message WhatsApp (J1) au nouveau prospect
async function sendFirstMessage(lead) {
  try {
    const { SEQUENCE, scalorSend } = await import('../services/formationCampaignService.js');
    const firstStep = SEQUENCE[0];
    const text = firstStep.text(lead.name);

    await scalorSend(lead.phone, text);

    // Marquer le message J1 comme envoyé pour éviter un doublon via le cron
    lead.campaign = lead.campaign || { active: true, messagesSent: [] };
    lead.campaign.messagesSent.push({ day: firstStep.day, sentAt: new Date(), status: 'sent' });
    await lead.save();

    console.log(`✅ Message de bienvenue J1 envoyé automatiquement → ${lead.name} (${lead.phone})`);
  } catch (err) {
    console.error(`❌ Échec envoi message bienvenue J1 → ${lead.name} (${lead.phone}): ${err.message}`);
  }
}

// POST /api/formation-leads — inscription publique depuis la landing
router.post('/', async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Prénom et numéro requis' });
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || '';

    const lead = await FormationLead.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || '',
      ipAddress: ip,
    });

    console.log('🎯 ========== NOUVEAU PROSPECT FORMATION ==========');
    console.log(`👤 Nom     : ${lead.name}`);
    console.log(`📞 Tél     : ${lead.phone}`);
    console.log(`📧 Email   : ${lead.email || '—'}`);
    console.log(`🌐 IP      : ${ip}`);
    console.log(`🕐 Date    : ${new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Douala' })}`);
    console.log('==================================================');

    // Notifier l'admin du nouveau lead
    notifyNewLead(lead).catch(() => {});

    // Envoyer automatiquement le premier message WhatsApp (J1) au prospect
    sendFirstMessage(lead).catch(() => {});

    return res.status(201).json({ success: true, id: lead._id });
  } catch (err) {
    console.error('❌ formation-leads POST:', err.message);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/formation-leads/scalor/status — statut instance
router.get('/scalor/status', authenticate, requireAdmin, async (req, res) => {
  const apiKey = process.env.SCALOR_API_KEY;
  const instanceId = process.env.SCALOR_INSTANCE_ID;
  if (!apiKey || !instanceId) return res.status(400).json({ error: 'Scalor non configuré' });
  try {
    const r = await fetch(`https://api.scalor.net/api/v1/instance/${instanceId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await r.json();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/formation-leads/scalor/qrcode — QR code
router.get('/scalor/qrcode', authenticate, requireAdmin, async (req, res) => {
  const apiKey = process.env.SCALOR_API_KEY;
  const instanceId = process.env.SCALOR_INSTANCE_ID;
  if (!apiKey || !instanceId) return res.status(400).json({ error: 'Scalor non configuré' });
  try {
    const r = await fetch(`https://api.scalor.net/api/v1/instance/${instanceId}/qrcode`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await r.json();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/formation-leads/scalor/restart — redémarrer l'instance
router.post('/scalor/restart', authenticate, requireAdmin, async (req, res) => {
  const apiKey = process.env.SCALOR_API_KEY;
  const instanceId = process.env.SCALOR_INSTANCE_ID;
  if (!apiKey || !instanceId) return res.status(400).json({ error: 'Scalor non configuré' });
  try {
    const r = await fetch(`https://api.scalor.net/api/v1/instance/${instanceId}/restart`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await r.json();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/formation-leads/campaign/run — forcer le cron maintenant (test)
router.post('/campaign/run', authenticate, requireAdmin, async (req, res) => {
  try {
    const { runCampaignCron } = await import('../services/formationCampaignService.js');
    await runCampaignCron();
    return res.json({ success: true, message: 'Cron campagne exécuté' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/formation-leads/campaign/launch — Envoyer le message J1 à TOUS les leads actifs
router.post('/campaign/launch', authenticate, requireAdmin, async (req, res) => {
  try {
    const { SEQUENCE, scalorSend } = await import('../services/formationCampaignService.js');
    const leads = await FormationLead.find({ 'campaign.active': true });
    if (!leads.length) return res.json({ success: true, sent: 0, failed: 0, message: 'Aucun lead actif' });

    const firstStep = SEQUENCE[0]; // J1
    let sent = 0;
    let failed = 0;
    const details = [];

    for (const lead of leads) {
      // Vérifier que J1 n'a pas déjà été envoyé
      const alreadySent = (lead.campaign?.messagesSent || []).some(m => m.day === firstStep.day && m.status === 'sent');
      if (alreadySent) {
        details.push({ name: lead.name, phone: lead.phone, status: 'skipped', reason: 'Déjà envoyé' });
        continue;
      }

      try {
        const text = firstStep.text(lead.name);
        await scalorSend(lead.phone, text);
        if (!lead.campaign) lead.campaign = { active: true, messagesSent: [] };
        lead.campaign.messagesSent.push({ day: firstStep.day, sentAt: new Date(), status: 'sent' });
        await lead.save();
        sent++;
        details.push({ name: lead.name, phone: lead.phone, status: 'sent' });
        console.log(`✅ Campagne J1 lancée → ${lead.name} (${lead.phone})`);
      } catch (err) {
        if (!lead.campaign) lead.campaign = { active: true, messagesSent: [] };
        lead.campaign.messagesSent.push({ day: firstStep.day, sentAt: new Date(), status: 'failed' });
        await lead.save();
        failed++;
        details.push({ name: lead.name, phone: lead.phone, status: 'failed', error: err.message });
        console.error(`❌ Campagne J1 échouée → ${lead.name}: ${err.message}`);
      }
    }

    console.log(`📊 Lancement campagne — envoyés: ${sent}, échoués: ${failed}, ignorés: ${details.filter(d => d.status === 'skipped').length}`);
    return res.json({ success: true, sent, failed, skipped: details.filter(d => d.status === 'skipped').length, details });
  } catch (err) {
    console.error('❌ campaign/launch error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/formation-leads/campaign/test — Envoi test à un numéro spécifique
router.post('/campaign/test', authenticate, requireAdmin, async (req, res) => {
  try {
    const { phone, name } = req.body;
    if (!phone) return res.status(400).json({ error: 'Numéro de téléphone requis' });

    const { SEQUENCE, scalorSend } = await import('../services/formationCampaignService.js');
    const testName = name || 'Test';
    const text = SEQUENCE[0].text(testName);

    await scalorSend(phone, text);
    console.log(`✅ Message test envoyé → ${testName} (${phone})`);
    return res.json({ success: true, message: `Message test envoyé à ${phone}` });
  } catch (err) {
    console.error('❌ campaign/test error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/formation-leads/:id/campaign — activer/désactiver campagne
router.patch('/:id/campaign', authenticate, requireAdmin, async (req, res) => {
  try {
    const { active } = req.body;
    const lead = await FormationLead.findByIdAndUpdate(
      req.params.id,
      { 'campaign.active': active },
      { new: true }
    );
    if (!lead) return res.status(404).json({ error: 'Lead introuvable' });
    return res.json({ success: true, campaign: lead.campaign });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/formation-leads — liste pour l'admin
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { search = '', page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const [leads, total] = await Promise.all([
      FormationLead.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      FormationLead.countDocuments(query),
    ]);

    return res.json({ leads, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    console.error('❌ formation-leads GET:', err.message);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/formation-leads/:id
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await FormationLead.findByIdAndDelete(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
