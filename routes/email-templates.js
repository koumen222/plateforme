import express from 'express';
import EmailTemplate from '../models/EmailTemplate.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = {};
    
    if (category) {
      filter.category = category;
    }
    
    const templates = await EmailTemplate.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Erreur récupération templates:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id)
      .populate('createdBy', 'name email')
      .lean();
    
    if (!template) {
      return res.status(404).json({ error: 'Template non trouvé' });
    }
    
    res.json({ success: true, template });
  } catch (error) {
    console.error('Erreur récupération template:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      name,
      subject,
      content,
      category = 'newsletter',
      variables = [],
      isDefault = false
    } = req.body;
    
    if (!name || !subject || !content?.html) {
      return res.status(400).json({ error: 'Nom, sujet et contenu HTML requis' });
    }
    
    if (isDefault) {
      await EmailTemplate.updateMany({ isDefault: true }, { isDefault: false });
    }
    
    const template = new EmailTemplate({
      name,
      subject,
      content,
      category,
      variables: Array.isArray(variables) ? variables : [],
      isDefault,
      createdBy: req.user._id
    });
    
    await template.save();
    
    res.status(201).json({
      success: true,
      template: template.toObject()
    });
  } catch (error) {
    console.error('Erreur création template:', error);
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      subject,
      content,
      category,
      variables,
      isDefault
    } = req.body;
    
    const template = await EmailTemplate.findById(id);
    if (!template) {
      return res.status(404).json({ error: 'Template non trouvé' });
    }
    
    if (name) template.name = name;
    if (subject) template.subject = subject;
    if (content) template.content = content;
    if (category) template.category = category;
    if (variables !== undefined) template.variables = Array.isArray(variables) ? variables : [];
    
    if (isDefault !== undefined) {
      if (isDefault) {
        await EmailTemplate.updateMany({ isDefault: true }, { isDefault: false });
      }
      template.isDefault = isDefault;
    }
    
    await template.save();
    
    res.json({
      success: true,
      template: template.toObject()
    });
  } catch (error) {
    console.error('Erreur mise à jour template:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await EmailTemplate.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Template supprimé' });
  } catch (error) {
    console.error('Erreur suppression template:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

export default router;
