import { useState, useEffect, useMemo } from 'react'
import { CONFIG } from '../config/config'

export default function CoachingPage({ lesson }) {
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    date: '',
    heure: '',
    duree: '60',
    message: ''
  })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const dateInput = document.getElementById('date')
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0]
      dateInput.setAttribute('min', today)
    }
  }, [])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const { nom, email, telephone, date, heure, duree, message: msg } = formData

    if (!nom || !email || !date || !heure || !duree) {
      setMessage({ type: 'error', text: '❌ Veuillez remplir tous les champs obligatoires.' })
      return
    }

    setSubmitting(true)
    setMessage({ type: '', text: '' })

    try {
      const courseSlug = window.location.pathname.split('/')[2] || ''

      const response = await fetch(`${CONFIG.BACKEND_URL}/api/coaching-reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: nom,
          email,
          phone: telephone,
          date,
          time: heure,
          durationMinutes: Number(duree),
          message: msg,
          courseSlug
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la réservation')
      }

      setMessage({ type: 'success', text: '✅ Réservation enregistrée avec succès !' })
      setFormData({
        nom: '',
        email: '',
        telephone: '',
        date: '',
        heure: '',
        duree: '60',
        message: ''
      })
    } catch (error) {
      setMessage({ type: 'error', text: `❌ ${error.message}` })
    } finally {
      setSubmitting(false)
    }
  }

  const formattedDate = useMemo(() => {
    if (!formData.date) return '—'
    const dateObj = new Date(formData.date)
    return dateObj.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
  }, [formData.date])

  const courseName = useMemo(() => {
    if (lesson?.meta && lesson.meta.trim() && lesson.meta.toLowerCase() !== 'formation') {
      return lesson.meta.trim()
    }
    const slug = window.location.pathname.split('/')[2] || ''
    if (!slug) return 'cette formation'
    return slug
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }, [lesson])

  return (
    <>
      <header className="page-header">
        <h2>{lesson.title}</h2>
        <div className="lesson-meta">
          <span className="lesson-badge">{lesson.badge}</span>
          <span>{lesson.meta}</span>
        </div>
      </header>

      <div className="summary-card-lesson">
        <h3>🎓 Réservez votre session de coaching</h3>
        <p>
          Félicitations ! Vous avez terminé la formation {courseName}. Il est maintenant temps de
          réserver votre session de coaching personnalisée pour optimiser vos résultats et prendre
          les meilleures décisions stratégiques pour votre campagne.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="summary-card-lesson lg:col-span-2">
          <h3 className="text-xl font-bold mb-4">Formulaire de réservation</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="admin-form-group">
                <label htmlFor="nom">Nom complet *</label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  required
                  className="admin-input"
                  placeholder="Votre nom complet"
                  value={formData.nom}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="admin-input"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="admin-form-group">
                <label htmlFor="telephone">Téléphone</label>
                <input
                  type="tel"
                  id="telephone"
                  name="telephone"
                  className="admin-input"
                  placeholder="+237 6 76 77 83 77"
                  value={formData.telephone}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="date">Date souhaitée *</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  className="admin-input"
                  value={formData.date}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="admin-form-group">
                <label htmlFor="heure">Heure souhaitée *</label>
                <select
                  id="heure"
                  name="heure"
                  required
                  className="admin-select"
                  value={formData.heure}
                  onChange={handleChange}
                >
                  <option value="">Sélectionnez une heure</option>
                  <option value="09:00">09:00</option>
                  <option value="10:00">10:00</option>
                  <option value="11:00">11:00</option>
                  <option value="14:00">14:00</option>
                  <option value="15:00">15:00</option>
                  <option value="16:00">16:00</option>
                  <option value="17:00">17:00</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label htmlFor="duree">Durée de la session *</label>
                <select
                  id="duree"
                  name="duree"
                  required
                  className="admin-select"
                  value={formData.duree}
                  onChange={handleChange}
                >
                  <option value="">Sélectionnez une durée</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 heure</option>
                  <option value="90">1h30</option>
                  <option value="120">2 heures</option>
                </select>
              </div>
            </div>

            <div className="admin-form-group">
              <label htmlFor="message">Message (optionnel)</label>
              <textarea
                id="message"
                name="message"
                rows="4"
                className="admin-textarea"
                placeholder="Décrivez brièvement vos objectifs ou questions spécifiques..."
                value={formData.message}
                onChange={handleChange}
              />
            </div>

            <button type="submit" className="admin-btn admin-btn-primary w-full" disabled={submitting}>
              {submitting ? '⏳ Réservation...' : '✅ Réserver'}
            </button>
          </form>

          {message.text && (
            <div className={`admin-alert ${message.type === 'error' ? 'admin-alert-error' : 'admin-alert-success'}`}>
              <span className="admin-alert-icon">
                {message.type === 'error' ? '⚠️' : '✅'}
              </span>
              <span>{message.text}</span>
            </div>
          )}
        </div>

        <div className="summary-card-lesson">
          <h3 className="text-xl font-bold mb-4">Résumé dynamique</h3>
          <div className="space-y-3 text-sm text-secondary">
            <p><strong>Nom :</strong> {formData.nom || '—'}</p>
            <p><strong>Email :</strong> {formData.email || '—'}</p>
            <p><strong>Téléphone :</strong> {formData.telephone || '—'}</p>
            <p><strong>Date :</strong> {formattedDate}</p>
            <p><strong>Heure :</strong> {formData.heure || '—'}</p>
            <p><strong>Durée :</strong> {formData.duree ? `${formData.duree} min` : '—'}</p>
            <p><strong>Message :</strong> {formData.message || '—'}</p>
          </div>
        </div>
      </div>
    </>
  )
}

