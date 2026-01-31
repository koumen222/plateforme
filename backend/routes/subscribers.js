import express from 'express';
import Subscriber from '../models/Subscriber.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = express.Router();

router.post('/subscribe', async (req, res) => {
  try {
    const { email, name, source = 'website', tags = [] } = req.body;
    
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Email invalide' });
    }
    
    const existingSubscriber = await Subscriber.findOne({ email: email.toLowerCase() });
    
    if (existingSubscriber) {
      if (existingSubscriber.status === 'unsubscribed') {
        existingSubscriber.status = 'active';
        existingSubscriber.unsubscribedAt = null;
        existingSubscriber.subscribedAt = new Date();
        if (name) existingSubscriber.name = name;
        if (tags.length) existingSubscriber.tags = [...new Set([...existingSubscriber.tags, ...tags])];
        await existingSubscriber.save();
        return res.json({ success: true, message: 'Réabonnement réussi', subscriber: existingSubscriber });
      }
      return res.status(400).json({ error: 'Email déjà abonné' });
    }
    
    const subscriber = new Subscriber({
      email: email.toLowerCase(),
      name: name || '',
      source,
      tags: Array.isArray(tags) ? tags : [],
      status: 'active'
    });
    
    await subscriber.save();
    
    res.status(201).json({
      success: true,
      message: 'Abonnement réussi',
      subscriber: subscriber.toObject()
    });
  } catch (error) {
    console.error('Erreur abonnement:', error);
    res.status(500).json({ error: 'Erreur lors de l\'abonnement' });
  }
});

router.get('/unsubscribe/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }
    
    const subscriber = await Subscriber.findOne({ email: email.toLowerCase() });
    if (!subscriber) {
      return res.status(404).json({ error: 'Abonné non trouvé' });
    }
    
    subscriber.status = 'unsubscribed';
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();
    
    res.send(`
      <html>
        <head><title>Désabonnement réussi</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>✅ Désabonnement réussi</h1>
          <p>Vous avez été désabonné de notre newsletter.</p>
          <p>Vous ne recevrez plus d'emails de notre part.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Erreur désabonnement:', error);
    res.status(500).send('Erreur lors du désabonnement');
  }
});

router.use(authenticate);
router.use(requireAdmin);

router.get('/', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 1000 } = req.query;
    const filter = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const subscribers = await Subscriber.find(filter)
      .sort({ subscribedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    // Récupérer les statuts et numéros de téléphone des utilisateurs correspondants
    const User = (await import('../models/User.js')).default;
    const emails = subscribers.map(s => s.email);
    const users = await User.find({ email: { $in: emails } })
      .select('email status accountStatus phone phoneNumber')
      .lean();
    
    const userStatusMap = {};
    users.forEach(user => {
      const phone = (user.phoneNumber && user.phoneNumber.trim()) || (user.phone && user.phone.trim()) || null;
      userStatusMap[user.email.toLowerCase()] = {
        status: user.status || user.accountStatus || 'pending',
        accountStatus: user.accountStatus || user.status || 'pending',
        phone: phone
      };
    });
    
    // Enrichir les abonnés avec le statut et le numéro de téléphone de l'utilisateur
    const enrichedSubscribers = subscribers.map(subscriber => {
      const userStatus = userStatusMap[subscriber.email.toLowerCase()];
      return {
        ...subscriber,
        userStatus: userStatus?.status || null,
        userAccountStatus: userStatus?.accountStatus || null,
        userPhone: userStatus?.phone || null
      };
    });
    
    const total = await Subscriber.countDocuments(filter);
    
    res.json({
      success: true,
      subscribers: enrichedSubscribers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur récupération abonnés:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des abonnés' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    
    const [total, active, unsubscribed, bounced] = await Promise.all([
      Subscriber.countDocuments(),
      Subscriber.countDocuments({ status: 'active' }),
      Subscriber.countDocuments({ status: 'unsubscribed' }),
      Subscriber.countDocuments({ status: 'bounced' })
    ]);
    
    // Compter par statut utilisateur
    const allSubscribers = await Subscriber.find({ status: 'active' }).select('email').lean();
    const emails = allSubscribers.map(s => s.email.toLowerCase());
    const users = await User.find({ email: { $in: emails } })
      .select('email status accountStatus')
      .lean();
    
    const pendingCount = users.filter(u => (u.status || u.accountStatus) === 'pending').length;
    const activeCount = users.filter(u => (u.status || u.accountStatus) === 'active').length;
    const blockedCount = users.filter(u => (u.status || u.accountStatus) === 'blocked').length;
    
    // Compter les utilisateurs avec un numéro de téléphone pour WhatsApp
    const usersWithPhone = await User.countDocuments({
      $or: [
        { phone: { $exists: true, $ne: '' } },
        { phoneNumber: { $exists: true, $ne: '' } }
      ],
      role: { $ne: 'admin' }
    });
    
    res.json({
      success: true,
      stats: {
        total,
        active,
        unsubscribed,
        bounced,
        usersWithPhone,
        byUserStatus: {
          pending: pendingCount,
          active: activeCount,
          blocked: blockedCount
        },
        growth: {
          today: await Subscriber.countDocuments({
            subscribedAt: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }),
          week: await Subscriber.countDocuments({
            subscribedAt: {
              $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }),
          month: await Subscriber.countDocuments({
            subscribedAt: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          })
        }
      }
    });
  } catch (error) {
    console.error('Erreur stats abonnés:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des stats' });
  }
});

router.post('/import', async (req, res) => {
  try {
    const { emails } = req.body;
    
    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'Liste d\'emails requise' });
    }
    
    const results = { success: 0, failed: 0, skipped: 0 };
    const errors = [];
    
    for (const emailData of emails) {
      const email = typeof emailData === 'string' ? emailData : emailData.email;
      const name = typeof emailData === 'object' ? emailData.name : '';
      
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        results.failed++;
        errors.push({ email, error: 'Email invalide' });
        continue;
      }
      
      try {
        const existing = await Subscriber.findOne({ email: email.toLowerCase() });
        if (existing) {
          results.skipped++;
          continue;
        }
        
        const subscriber = new Subscriber({
          email: email.toLowerCase(),
          name: name || '',
          source: 'import',
          status: 'active'
        });
        
        await subscriber.save();
        results.success++;
      } catch (error) {
        results.failed++;
        errors.push({ email, error: error.message });
      }
    }
    
    res.json({
      success: true,
      results,
      errors: errors.slice(0, 10)
    });
  } catch (error) {
    console.error('Erreur import abonnés:', error);
    res.status(500).json({ error: 'Erreur lors de l\'import' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status, tags } = req.body;
    
    const subscriber = await Subscriber.findById(id);
    if (!subscriber) {
      return res.status(404).json({ error: 'Abonné non trouvé' });
    }
    
    if (name !== undefined) subscriber.name = name;
    if (status !== undefined) subscriber.status = status;
    if (tags !== undefined) subscriber.tags = Array.isArray(tags) ? tags : [];
    
    if (status === 'unsubscribed' && !subscriber.unsubscribedAt) {
      subscriber.unsubscribedAt = new Date();
    }
    
    await subscriber.save();
    
    res.json({
      success: true,
      subscriber: subscriber.toObject()
    });
  } catch (error) {
    console.error('Erreur mise à jour abonné:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Subscriber.findByIdAndDelete(id);
    res.json({ success: true, message: 'Abonné supprimé' });
  } catch (error) {
    console.error('Erreur suppression abonné:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

router.post('/sync-all-users', async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    
    // Récupérer TOUS les utilisateurs avec email (sauf admins)
    // Inclure tous les statuts : pending, active, blocked
    const allUsers = await User.find({ 
      email: { $exists: true, $ne: '' }
    }).select('name email role status accountStatus').lean();
    
    // Filtrer pour exclure les admins (superadmin et admin)
    // Inclure tous les statuts (pending, active, blocked)
    const users = allUsers.filter(user => {
      const role = user.role;
      return role !== 'superadmin' && role !== 'admin';
    });
    
    console.log(`📊 Synchronisation:`);
    console.log(`   - ${allUsers.length} utilisateurs totaux avec email`);
    console.log(`   - ${users.length} utilisateurs à synchroniser (hors admins)`);
    
    if (users.length === 0) {
      return res.json({
        success: true,
        message: 'Aucun utilisateur à synchroniser',
        results: {
          created: 0,
          updated: 0,
          skipped: 0,
          total: 0
        },
        emails: {
          created: [],
          updated: [],
          skipped: []
        },
        errors: []
      });
    }
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const createdEmails = [];
    const updatedEmails = [];
    const skippedEmails = [];
    const errors = [];
    
    let processed = 0;
    for (const user of users) {
      try {
        processed++;
        const emailRaw = user.email || '';
        const emailLower = emailRaw.toLowerCase().trim();
        const userName = (user.name || '').trim();
        
        // Validation email
        if (!emailLower || emailLower === '' || !/^\S+@\S+\.\S+$/.test(emailLower)) {
          skipped++;
          skippedEmails.push({ email: emailRaw || 'N/A', reason: 'Email invalide ou vide' });
          continue;
        }
        
        const existingSubscriber = await Subscriber.findOne({ email: emailLower });
        
        // Déterminer le statut de l'abonné basé sur le statut utilisateur
        // Si utilisateur bloqué, on peut désabonner automatiquement
        // Sinon, on garde actif même si l'utilisateur est en pending
        const userStatus = user.status || user.accountStatus || 'pending';
        const shouldBeActive = userStatus !== 'blocked';
        
        if (existingSubscriber) {
          let hasChanges = false;
          
          // Mettre à jour le statut si nécessaire
          if (existingSubscriber.status === 'unsubscribed' && shouldBeActive) {
            existingSubscriber.status = 'active';
            existingSubscriber.unsubscribedAt = null;
            hasChanges = true;
          } else if (existingSubscriber.status === 'active' && !shouldBeActive) {
            existingSubscriber.status = 'unsubscribed';
            existingSubscriber.unsubscribedAt = new Date();
            hasChanges = true;
          }
          
          // Mettre à jour le nom si différent
          if (userName && existingSubscriber.name !== userName) {
            existingSubscriber.name = userName;
            hasChanges = true;
          }
          
          if (hasChanges) {
            await existingSubscriber.save();
            updated++;
            updatedEmails.push({ email: emailLower, name: userName, userStatus });
          } else {
            skipped++;
            skippedEmails.push({ email: emailLower, reason: 'Déjà à jour' });
          }
        } else {
          // Créer un nouvel abonné avec les infos de l'utilisateur
          // Le statut de l'abonné reste 'active' même si l'utilisateur est en pending
          // car on veut pouvoir leur envoyer des emails même s'ils sont en attente
          const subscriber = new Subscriber({
            email: emailLower,
            name: userName,
            source: 'sync',
            status: shouldBeActive ? 'active' : 'unsubscribed',
            subscribedAt: new Date(),
            unsubscribedAt: shouldBeActive ? null : new Date()
          });
          await subscriber.save();
          created++;
          createdEmails.push({ email: emailLower, name: userName, userStatus });
        }
        
        // Log tous les 50 utilisateurs
        if (processed % 50 === 0) {
          console.log(`   Traité ${processed}/${users.length} utilisateurs...`);
        }
      } catch (error) {
        console.error(`Erreur traitement utilisateur ${user.email}:`, error);
        errors.push({ 
          email: user.email || 'N/A', 
          name: user.name || 'N/A',
          error: error.message 
        });
      }
    }
    
    console.log(`   Traitement terminé: ${processed} utilisateurs traités`);
    
    console.log(`📊 Synchronisation terminée:`);
    console.log(`   - ${created} créés`);
    console.log(`   - ${updated} mis à jour`);
    console.log(`   - ${skipped} ignorés`);
    console.log(`   - Total: ${users.length} utilisateurs`);
    
    res.json({
      success: true,
      message: 'Synchronisation terminée',
      results: {
        created,
        updated,
        skipped,
        total: users.length
      },
      emails: {
        created: createdEmails,
        updated: updatedEmails,
        skipped: skippedEmails
      },
      errors: errors.slice(0, 10)
    });
  } catch (error) {
    console.error('Erreur synchronisation:', error);
    res.status(500).json({ error: 'Erreur lors de la synchronisation', details: error.message });
  }
});

export default router;
