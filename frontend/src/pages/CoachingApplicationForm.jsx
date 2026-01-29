import { useState } from 'react'
import { CONFIG } from '../config/config'

export default function CoachingApplicationForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    whatsapp: '',
    hasProduct: '',
    hasShopify: '',
    hasStock: '',
    budget: '',
    available7Days: '',
    adExperience: '',
    motivation: ''
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [rejected, setRejected] = useState(false)

  const validate = () => {
    const newErrors = {}
    if (!formData.fullName.trim()) newErrors.fullName = 'Nom et prénom requis'
    if (!formData.whatsapp.trim()) newErrors.whatsapp = 'Numéro WhatsApp requis'
    if (!formData.hasProduct) newErrors.hasProduct = 'Réponse requise'
    if (!formData.hasShopify) newErrors.hasShopify = 'Réponse requise'
    if (!formData.hasStock) newErrors.hasStock = 'Réponse requise'
    if (!formData.budget) newErrors.budget = 'Budget requis'
    if (!formData.available7Days) newErrors.available7Days = 'Réponse requise'
    if (!formData.adExperience) newErrors.adExperience = 'Expérience requise'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const canSubmit = () => {
    return formData.hasProduct === 'Oui' &&
           formData.hasShopify === 'Oui' &&
           formData.hasStock === 'Oui' &&
           formData.available7Days === 'Oui'
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    if (!canSubmit()) {
      alert('Votre candidature ne répond pas aux critères minimaux requis.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/coaching-applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()
      if (response.ok) {
        if (result.application?.status === 'Refusé') {
          setRejected(true)
        } else {
          setSuccess(true)
        }
      } else {
        alert(result.error || 'Erreur lors de l\'envoi')
      }
    } catch (error) {
      alert('Erreur de connexion')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-green-800 mb-4">✅ Candidature enregistrée !</h2>
          <p className="text-green-700">Votre candidature a été enregistrée avec succès. Nous vous contacterons prochainement.</p>
        </div>
      </div>
    )
  }

  if (rejected) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-red-800 mb-4">❌ Candidature non éligible</h2>
          <p className="text-red-700 mb-4">Votre candidature ne répond pas aux critères minimaux requis.</p>
          <p className="text-red-700 font-semibold mb-2">Critères requis :</p>
          <ul className="list-disc list-inside text-red-700 space-y-1">
            <li>Produit déjà existant</li>
            <li>Produit en ligne sur Shopify</li>
            <li>Stock disponible</li>
            <li>Disponibilité 7 jours consécutifs</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2 text-center">Inscription au Coaching E-commerce 7 Jours</h1>
        <p className="text-gray-600 text-center mb-8">Remplissez le formulaire ci-dessous pour candidater</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Nom et prénom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={`w-full px-4 py-2 border-2 rounded-lg ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`}
              required
            />
            {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Numéro WhatsApp <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="whatsapp"
              value={formData.whatsapp}
              onChange={handleChange}
              className={`w-full px-4 py-2 border-2 rounded-lg ${errors.whatsapp ? 'border-red-500' : 'border-gray-300'}`}
              required
            />
            {errors.whatsapp && <p className="text-red-500 text-sm mt-1">{errors.whatsapp}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Produit déjà existant ? <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="hasProduct"
                  value="Oui"
                  checked={formData.hasProduct === 'Oui'}
                  onChange={handleChange}
                  className="mr-2"
                />
                Oui
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="hasProduct"
                  value="Non"
                  checked={formData.hasProduct === 'Non'}
                  onChange={handleChange}
                  className="mr-2"
                />
                Non
              </label>
            </div>
            {errors.hasProduct && <p className="text-red-500 text-sm mt-1">{errors.hasProduct}</p>}
            {formData.hasProduct === 'Non' && (
              <p className="text-red-500 text-sm mt-1">⚠️ Ce critère est obligatoire</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Produit déjà en ligne sur Shopify ? <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="hasShopify"
                  value="Oui"
                  checked={formData.hasShopify === 'Oui'}
                  onChange={handleChange}
                  className="mr-2"
                />
                Oui
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="hasShopify"
                  value="Non"
                  checked={formData.hasShopify === 'Non'}
                  onChange={handleChange}
                  className="mr-2"
                />
                Non
              </label>
            </div>
            {errors.hasShopify && <p className="text-red-500 text-sm mt-1">{errors.hasShopify}</p>}
            {formData.hasShopify === 'Non' && (
              <p className="text-red-500 text-sm mt-1">⚠️ Ce critère est obligatoire</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Stock disponible ? <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="hasStock"
                  value="Oui"
                  checked={formData.hasStock === 'Oui'}
                  onChange={handleChange}
                  className="mr-2"
                />
                Oui
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="hasStock"
                  value="Non"
                  checked={formData.hasStock === 'Non'}
                  onChange={handleChange}
                  className="mr-2"
                />
                Non
              </label>
            </div>
            {errors.hasStock && <p className="text-red-500 text-sm mt-1">{errors.hasStock}</p>}
            {formData.hasStock === 'Non' && (
              <p className="text-red-500 text-sm mt-1">⚠️ Ce critère est obligatoire</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Budget publicitaire <span className="text-red-500">*</span>
            </label>
            <select
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              className={`w-full px-4 py-2 border-2 rounded-lg ${errors.budget ? 'border-red-500' : 'border-gray-300'}`}
              required
            >
              <option value="">Sélectionnez un budget</option>
              <option value="< 50 000 FCFA">&lt; 50 000 FCFA</option>
              <option value="50 000 – 100 000 FCFA">50 000 – 100 000 FCFA</option>
              <option value="> 100 000 FCFA">&gt; 100 000 FCFA</option>
            </select>
            {errors.budget && <p className="text-red-500 text-sm mt-1">{errors.budget}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Disponible 7 jours consécutifs à l'heure fixée ? <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="available7Days"
                  value="Oui"
                  checked={formData.available7Days === 'Oui'}
                  onChange={handleChange}
                  className="mr-2"
                />
                Oui
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="available7Days"
                  value="Non"
                  checked={formData.available7Days === 'Non'}
                  onChange={handleChange}
                  className="mr-2"
                />
                Non
              </label>
            </div>
            {errors.available7Days && <p className="text-red-500 text-sm mt-1">{errors.available7Days}</p>}
            {formData.available7Days === 'Non' && (
              <p className="text-red-500 text-sm mt-1">⚠️ Ce critère est obligatoire</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Expérience publicitaire du produit <span className="text-red-500">*</span>
            </label>
            <select
              name="adExperience"
              value={formData.adExperience}
              onChange={handleChange}
              className={`w-full px-4 py-2 border-2 rounded-lg ${errors.adExperience ? 'border-red-500' : 'border-gray-300'}`}
              required
            >
              <option value="">Sélectionnez une option</option>
              <option value="Déjà lancé">Déjà lancé</option>
              <option value="Lancé mais pas rentable">Lancé mais pas rentable</option>
              <option value="Jamais lancé">Jamais lancé</option>
            </select>
            {errors.adExperience && <p className="text-red-500 text-sm mt-1">{errors.adExperience}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Motivation (optionnel)</label>
            <textarea
              name="motivation"
              value={formData.motivation}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
              placeholder="Expliquez brièvement votre motivation..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !canSubmit()}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white ${
              canSubmit()
                ? 'bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900'
                : 'bg-gray-400 cursor-not-allowed'
            } transition-all`}
          >
            {isSubmitting ? 'Envoi en cours...' : 'Envoyer ma candidature'}
          </button>

          {!canSubmit() && formData.hasProduct && formData.hasShopify && formData.hasStock && formData.available7Days && (
            <p className="text-red-500 text-sm text-center">
              ⚠️ Vous devez répondre "Oui" à tous les critères obligatoires pour pouvoir soumettre votre candidature.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
