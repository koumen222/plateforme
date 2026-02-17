import { useState } from 'react'
import { CONFIG } from '../config/config'

const domaineOptions = [
  { value: 'livreur', label: 'Livreur' },
  { value: 'agence_livraison', label: 'Agence de livraison' },
  { value: 'transitaire', label: 'Transitaire' },
  { value: 'closeur', label: 'Closeur' },
  { value: 'fournisseur', label: 'Fournisseur' },
  { value: 'autre', label: 'Autre' }
]

const typeOptions = [
  { value: 'agence_livraison', label: 'Agence de livraison' },
  { value: 'closeur', label: 'Closeur' },
  { value: 'transitaire', label: 'Transitaire' },
  { value: 'autre', label: 'Autre' }
]

export default function RecrutementPage() {
  const [formData, setFormData] = useState({
    nom: '',
    type_partenaire: 'autre',
    domaines_activite: ['autre'],
    pays: '',
    ville: '',
    description_courte: '',
    telephone: '',
    whatsapp: '',
    email: '',
    lien_contact: '',
    autorisation_affichage: false,
    annees_experience: '',
    zones_couvertes: '',
    delais_moyens: '',
    methodes_paiement: '',
    langues_parlees: '',
    logo_url: ''
  })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (type === 'select-multiple') {
      const selected = Array.from(e.target.selectedOptions).map((option) => option.value)
      setFormData((prev) => ({ ...prev, [name]: selected }))
      return
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (
      !formData.nom.trim() ||
      !formData.type_partenaire ||
      !formData.domaines_activite.length ||
      !formData.pays.trim() ||
      !formData.ville.trim() ||
      !formData.description_courte.trim() ||
      !formData.telephone.trim() ||
      !formData.whatsapp.trim() ||
      !formData.email.trim()
    ) {
      setMessage({
        type: 'error',
        text: '❌ Merci de remplir tous les champs obligatoires.'
      })
      return
    }

    setSubmitting(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/partenaires`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi')
      }

      setMessage({ type: 'success', text: '✅ Merci, votre profil sera visible après validation.' })
      setFormData({
        nom: '',
        type_partenaire: 'autre',
        domaines_activite: ['autre'],
        pays: '',
        ville: '',
        description_courte: '',
        telephone: '',
        whatsapp: '',
        email: '',
        lien_contact: '',
        autorisation_affichage: false,
        annees_experience: '',
        zones_couvertes: '',
        delais_moyens: '',
        methodes_paiement: '',
        langues_parlees: '',
        logo_url: ''
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
        <h1 className="text-2xl font-bold">Inscription partenaire</h1>
        <p className="text-secondary mt-2">
          Inscrivez votre activité pour apparaître dans l’annuaire des partenaires fiables.
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
            <label htmlFor="type_partenaire">Type de partenaire *</label>
            <select
              id="type_partenaire"
              name="type_partenaire"
              className="admin-select"
              value={formData.type_partenaire}
              onChange={handleChange}
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-form-group">
            <label htmlFor="domaines_activite">Domaines d’activité (multi) *</label>
            <select
              id="domaines_activite"
              name="domaines_activite"
              className="admin-select"
              multiple
              value={formData.domaines_activite}
              onChange={handleChange}
            >
              {domaineOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="admin-form-group">
              <label htmlFor="pays">Pays *</label>
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
              <label htmlFor="ville">Ville *</label>
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
            <label htmlFor="description_courte">Description courte *</label>
            <textarea
              id="description_courte"
              name="description_courte"
              required
              className="admin-textarea"
              rows="3"
              placeholder="Présentez brièvement votre activité"
              value={formData.description_courte}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="admin-form-group">
              <label htmlFor="telephone">Téléphone *</label>
              <input
                type="text"
                id="telephone"
                name="telephone"
                required
                className="admin-input"
                placeholder="+225 01 23 45 67 89"
                value={formData.telephone}
                onChange={handleChange}
              />
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
          </div>

          <div className="admin-form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="admin-input"
              placeholder="exemple@email.com"
              value={formData.email}
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

          <div className="summary-card-lesson border border-theme">
            <h3 className="text-base font-semibold mb-3">Informations avancées (optionnel)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="admin-form-group">
                <label htmlFor="annees_experience">Années d’expérience</label>
                <input
                  type="number"
                  id="annees_experience"
                  name="annees_experience"
                  className="admin-input"
                  placeholder="Ex: 5"
                  value={formData.annees_experience}
                  onChange={handleChange}
                />
              </div>
              <div className="admin-form-group">
                <label htmlFor="delais_moyens">Délais moyens</label>
                <input
                  type="text"
                  id="delais_moyens"
                  name="delais_moyens"
                  className="admin-input"
                  placeholder="Ex: 24-48h"
                  value={formData.delais_moyens}
                  onChange={handleChange}
                />
              </div>
              <div className="admin-form-group">
                <label htmlFor="zones_couvertes">Zones couvertes (séparées par virgule)</label>
                <input
                  type="text"
                  id="zones_couvertes"
                  name="zones_couvertes"
                  className="admin-input"
                  placeholder="Ex: Abidjan, Bouaké"
                  value={formData.zones_couvertes}
                  onChange={handleChange}
                />
              </div>
              <div className="admin-form-group">
                <label htmlFor="methodes_paiement">Méthodes de paiement</label>
                <input
                  type="text"
                  id="methodes_paiement"
                  name="methodes_paiement"
                  className="admin-input"
                  placeholder="Ex: Mobile Money, Cash"
                  value={formData.methodes_paiement}
                  onChange={handleChange}
                />
              </div>
              <div className="admin-form-group">
                <label htmlFor="langues_parlees">Langues parlées</label>
                <input
                  type="text"
                  id="langues_parlees"
                  name="langues_parlees"
                  className="admin-input"
                  placeholder="Ex: Français, Anglais"
                  value={formData.langues_parlees}
                  onChange={handleChange}
                />
              </div>
              <div className="admin-form-group">
                <label htmlFor="logo_url">Logo / photo (URL)</label>
                <input
                  type="url"
                  id="logo_url"
                  name="logo_url"
                  className="admin-input"
                  placeholder="https://"
                  value={formData.logo_url}
                  onChange={handleChange}
                />
              </div>
            </div>
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
