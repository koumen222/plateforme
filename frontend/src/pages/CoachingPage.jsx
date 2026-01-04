import { useState, useEffect } from 'react'

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

  useEffect(() => {
    // Définir la date minimale à aujourd'hui
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

  const handleSubmit = (e) => {
    e.preventDefault()

    const { nom, email, telephone, date, heure, duree, message: msg } = formData

    if (!nom || !email || !date || !heure || !duree) {
      setMessage({ type: 'error', text: '❌ Veuillez remplir tous les champs obligatoires.' })
      return
    }

    // Formater la date en français
    const dateObj = new Date(date)
    const options = { year: 'numeric', month: 'long', day: 'numeric' }
    const dateFormatee = dateObj.toLocaleDateString('fr-FR', options)

    // Construire le message WhatsApp personnalisé
    let whatsappMessage = `Bonjour ! Je souhaite réserver une session de coaching.\n\n`
    whatsappMessage += `👤 Nom : ${nom}\n`
    whatsappMessage += `📧 Email : ${email}\n`
    if (telephone) {
      whatsappMessage += `📱 Téléphone : ${telephone}\n`
    }
    whatsappMessage += `📅 Date souhaitée : ${dateFormatee}\n`
    whatsappMessage += `🕐 Heure souhaitée : ${heure}\n`
    whatsappMessage += `⏱️ Durée : ${duree} minutes\n`
    if (msg) {
      whatsappMessage += `\n💬 Message : ${msg}`
    }

    const encodedMessage = encodeURIComponent(whatsappMessage)
    const numeroWhatsApp = '237676778377' // Numéro Cameroun
    const whatsappUrl = `https://wa.me/${numeroWhatsApp}?text=${encodedMessage}`

    window.open(whatsappUrl, '_blank')
    setMessage({ type: 'success', text: '✅ Redirection vers WhatsApp... Votre message de réservation est prêt à être envoyé !' })

    // Réinitialiser le formulaire après un court délai
    setTimeout(() => {
      setFormData({
        nom: '',
        email: '',
        telephone: '',
        date: '',
        heure: '',
        duree: '60',
        message: ''
      })
      setMessage({ type: '', text: '' })
    }, 2000)
  }

  return (
    <>
      <header className="page-header">
        <h2>{lesson.title}</h2>
        <div className="lesson-meta">
          <span className="lesson-badge">{lesson.badge}</span>
          <span>{lesson.meta}</span>
        </div>
      </header>

      <div className="summary-card">
        <h3>🎓 Réservez votre session de coaching</h3>
        <p>
          Félicitations ! Vous avez terminé la formation Andromeda. Il est maintenant temps de 
          réserver votre session de coaching personnalisée pour optimiser vos résultats et prendre 
          les meilleures décisions stratégiques pour votre campagne.
        </p>
      </div>

      <div className="summary-card" style={{ marginTop: '2rem' }}>
        <h3>Formulaire de réservation</h3>
        <form onSubmit={handleSubmit} className="coaching-form">
          <div className="form-group">
            <label htmlFor="nom">Nom complet *</label>
            <input
              type="text"
              id="nom"
              name="nom"
              required
              placeholder="Votre nom complet"
              value={formData.nom}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              placeholder="votre@email.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="telephone">Téléphone</label>
            <input
              type="tel"
              id="telephone"
              name="telephone"
              placeholder="+237 6 76 77 83 77"
              value={formData.telephone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="date">Date souhaitée *</label>
            <input
              type="date"
              id="date"
              name="date"
              required
              value={formData.date}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="heure">Heure souhaitée *</label>
            <select
              id="heure"
              name="heure"
              required
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

          <div className="form-group">
            <label htmlFor="duree">Durée de la session *</label>
            <select
              id="duree"
              name="duree"
              required
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

          <div className="form-group">
            <label htmlFor="message">Message (optionnel)</label>
            <textarea
              id="message"
              name="message"
              rows="4"
              placeholder="Décrivez brièvement vos objectifs ou questions spécifiques..."
              value={formData.message}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="coaching-submit-btn" style={{ width: '100%', marginTop: '1rem' }}>
            📱 Réserver via WhatsApp
          </button>
        </form>

        {message.text && (
          <div id="formMessage" className={message.type} style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '8px', display: 'block' }}>
            {message.text}
          </div>
        )}
      </div>
    </>
  )
}

