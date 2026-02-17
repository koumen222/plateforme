import express from 'express';
import CoachingReservation from '../models/CoachingReservation.js';

const router = express.Router();

/**
 * POST /api/coaching-reservations
 * Créer une réservation de coaching
 */
router.post('/', async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      date,
      time,
      durationMinutes,
      message,
      courseSlug
    } = req.body || {};

    if (!fullName || !email || !date || !time || !durationMinutes) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const reservation = new CoachingReservation({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone?.trim() || '',
      date,
      time,
      durationMinutes: Number(durationMinutes),
      message: message?.trim() || '',
      courseSlug: courseSlug?.trim() || ''
    });

    await reservation.save();

    res.status(201).json({
      success: true,
      message: 'Réservation enregistrée',
      reservation: reservation.toObject()
    });
  } catch (error) {
    console.error('Erreur création réservation coaching:', error);
    res.status(500).json({ error: 'Erreur lors de la réservation' });
  }
});

export default router;
