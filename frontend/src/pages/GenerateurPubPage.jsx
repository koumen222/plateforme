import { useState } from 'react'
import '../styles/generateur-pub.css'

export default function GenerateurPubPage() {
  const [formData, setFormData] = useState({
    productName: '',
    productDescription: '',
    targetAudience: '',
    tone: 'professionnel',
    platform: 'facebook'
  })
  const [generatedAd, setGeneratedAd] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulation de génération (à remplacer par une vraie API)
    setTimeout(() => {
      const ad = `🎯 ${formData.productName}

${formData.productDescription}

👥 Parfait pour : ${formData.targetAudience}

✨ Offre limitée ! Cliquez maintenant pour en profiter.

#${formData.platform} #marketing #ecommerce`
      
      setGeneratedAd(ad)
      setLoading(false)
    }, 1500)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedAd)
    alert('✅ Texte copié dans le presse-papier !')
  }

  return (
    <div className="generateur-page">
      <div className="generateur-container">
        <div className="generateur-header">
          <h1>✨ Générateur de Publicité</h1>
          <p>Créez des publicités percutantes en quelques clics</p>
        </div>

        <div className="generateur-content">
          <div className="generateur-form-section">
            <form onSubmit={handleSubmit} className="generateur-form">
              <div className="form-group">
                <label htmlFor="productName">Nom du produit *</label>
                <input
                  type="text"
                  id="productName"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  placeholder="Ex: Montre connectée premium"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="productDescription">Description du produit *</label>
                <textarea
                  id="productDescription"
                  value={formData.productDescription}
                  onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                  placeholder="Décrivez les avantages et caractéristiques principales..."
                  rows="4"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="targetAudience">Audience cible *</label>
                <input
                  type="text"
                  id="targetAudience"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  placeholder="Ex: Entrepreneurs 25-45 ans"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="tone">Ton de la publicité</label>
                  <select
                    id="tone"
                    value={formData.tone}
                    onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                  >
                    <option value="professionnel">Professionnel</option>
                    <option value="amical">Amical</option>
                    <option value="urgent">Urgent</option>
                    <option value="luxe">Luxe</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="platform">Plateforme</label>
                  <select
                    id="platform"
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  >
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="google">Google Ads</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="generate-btn"
                disabled={loading}
              >
                {loading ? '⏳ Génération en cours...' : '✨ Générer la publicité'}
              </button>
            </form>
          </div>

          <div className="generateur-result-section">
            <div className="result-header">
              <h3>📝 Résultat</h3>
              {generatedAd && (
                <button onClick={copyToClipboard} className="copy-btn">
                  📋 Copier
                </button>
              )}
            </div>
            
            {generatedAd ? (
              <div className="result-content">
                <pre>{generatedAd}</pre>
              </div>
            ) : (
              <div className="result-placeholder">
                <div className="placeholder-icon">✨</div>
                <p>Remplissez le formulaire et cliquez sur "Générer" pour créer votre publicité</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

