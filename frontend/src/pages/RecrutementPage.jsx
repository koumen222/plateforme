import { useState } from 'react'
import { CONFIG } from '../config/config'

const typeOptions = [
  { value: 'livreur', label: 'Livreur' },
  { value: 'societe_livraison', label: 'Société de livraison' },
  { value: 'transitaire', label: 'Transitaire' },
  { value: 'closeur', label: 'Closeur' },
  { value: 'fournisseur', label: 'Fournisseur' },
  { value: 'autre', label: 'Autre' }
]

export default function RecrutementPage() {
  const [formData, setFormData] = useState({
    nom: '',
    type: 'autre',
    pays: '',
    ville: '',
    whatsapp: '',
    lien_contact: '',
    autorisation_affichage: false
  })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.nom.trim() || !formData.whatsapp.trim()) {
      setMessage({ type: 'error', text: '❌ Nom et WhatsApp sont obligatoires.' })
      return
    }

    setSubmitting(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/recrutement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi')
      }

      setMessage({ type: 'success', text: '✅ Merci, vos informations ont été enregistrées.' })
      setFormData({
        nom: '',
        type: 'autre',
        pays: '',
        ville: '',
        whatsapp: '',
        lien_contact: '',
        autorisation_affichage: false
      })
    } catch (error) {
      setMessage({ type: 'error', text: `❌ ${error.message}` })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="summary-card-lesson">
        <h1 className="text-2xl font-bold">Recrutement partenaires</h1>
        <p className="text-secondary mt-2">
          Collecte d’informations pour l’annuaire interne (livreurs, sociétés de livraison,
          transitaires, closeurs, fournisseurs).
        </p>
      </div>

      <div className="summary-card-lesson mt-6">
        <h2 className="text-xl font-bold mb-4">Formulaire</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="admin-form-group">
            <label htmlFor="nom">Nom *</label>
            <input
              type="text"
              id="nom"
              name="nom"
              required
              className="admin-input"
              placeholder="Nom ou entreprise"
              value={formData.nom}
              onChange={handleChange}
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="type">Type</label>
            <select
              id="type"
              name="type"
              className="admin-select"
              value={formData.type}
              onChange={handleChange}
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="admin-form-group">
              <label htmlFor="pays">Pays</label>
              <input
                type="text"
                id="pays"
                name="pays"
                className="admin-input"
                placeholder="Ex: Côte d'Ivoire"
                value={formData.pays}
                onChange={handleChange}
              />
            </div>
            <div className="admin-form-group">
              <label htmlFor="ville">Ville</label>
              <input
                type="text"
                id="ville"
                name="ville"
                className="admin-input"
                placeholder="Ex: Abidjan"
                value={formData.ville}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label htmlFor="whatsapp">WhatsApp *</label>
            <input
              type="text"
              id="whatsapp"
              name="whatsapp"
              required
              className="admin-input"
              placeholder="+225 01 23 45 67 89"
              value={formData.whatsapp}
              onChange={handleChange}
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="lien_contact">Lien de contact (optionnel)</label>
            <input
              type="url"
              id="lien_contact"
              name="lien_contact"
              className="admin-input"
              placeholder="https://"
              value={formData.lien_contact}
              onChange={handleChange}
            />
          </div>

          <div className="admin-form-group flex items-center gap-3">
            <input
              type="checkbox"
              id="autorisation_affichage"
              name="autorisation_affichage"
              checked={formData.autorisation_affichage}
              onChange={handleChange}
              className="admin-checkbox"
            />
            <label htmlFor="autorisation_affichage">
              J’autorise l’affichage de ces informations dans l’annuaire interne
            </label>
          </div>

          <button type="submit" className="admin-btn admin-btn-primary w-full" disabled={submitting}>
            {submitting ? '⏳ Envoi...' : 'Envoyer'}
          </button>
        </form>

        {message.text && (
          <div className={`admin-alert ${message.type === 'error' ? 'admin-alert-error' : 'admin-alert-success'}`}>
            <span className="admin-alert-icon">{message.type === 'error' ? '⚠️' : '✅'}</span>
            <span>{message.text}</span>
          </div>
        )}
      </div>
    </div>
  )
}
