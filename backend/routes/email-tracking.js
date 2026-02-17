import express from 'express';
import { trackEmailOpen, trackEmailClick } from '../services/emailService.js';

const router = express.Router();

router.get('/track/open/:token', async (req, res) => {
  try {
    const { token } = req.params;
    await trackEmailOpen(token);
    
    // Retourner une image transparente 1x1
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(pixel);
  } catch (error) {
    console.error('Erreur tracking open:', error);
    res.status(500).end();
  }
});

router.get('/track/click/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL requise' });
    }
    
    const finalUrl = await trackEmailClick(token, decodeURIComponent(url));
    res.redirect(finalUrl);
  } catch (error) {
    console.error('Erreur tracking click:', error);
    res.status(500).json({ error: 'Erreur lors du tracking' });
  }
});

export default router;
