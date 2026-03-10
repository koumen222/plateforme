import mongoose from 'mongoose';

const coachingReservationSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Nom requis'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email requis'],
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  date: {
    type: String,
    required: [true, 'Date requise']
  },
  time: {
    type: String,
    required: [true, 'Heure requise']
  },
  durationMinutes: {
    type: Number,
    required: [true, 'Durée requise']
  },
  message: {
    type: String,
    trim: true,
    default: ''
  },
  courseSlug: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

export default mongoose.model('CoachingReservation', coachingReservationSchema);
