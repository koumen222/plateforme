import { useState } from 'react'

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            ✨ Générateur de Publicité
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Créez des publicités percutantes en quelques clics
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="productName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  id="productName"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  placeholder="Ex: Montre connectée premium"
                  className="input-startup"
                  required
                />
              </div>

              <div>
                <label htmlFor="productDescription" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Description du produit *
                </label>
                <textarea
                  id="productDescription"
                  value={formData.productDescription}
                  onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                  placeholder="Décrivez les avantages et caractéristiques principales..."
                  rows="4"
                  className="input-startup resize-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="targetAudience" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Audience cible *
                </label>
                <input
                  type="text"
                  id="targetAudience"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  placeholder="Ex: Entrepreneurs 25-45 ans"
                  className="input-startup"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tone" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Ton de la publicité
                  </label>
                  <select
                    id="tone"
                    value={formData.tone}
                    onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                    className="input-startup"
                  >
                    <option value="professionnel">Professionnel</option>
                    <option value="amical">Amical</option>
                    <option value="urgent">Urgent</option>
                    <option value="luxe">Luxe</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="platform" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Plateforme
                  </label>
                  <select
                    id="platform"
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    className="input-startup"
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
                className="w-full btn-primary"
                disabled={loading}
              >
                {loading ? '⏳ Génération en cours...' : '✨ Générer la publicité'}
              </button>
            </form>
          </div>

          {/* Result Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">📝 Résultat</h3>
              {generatedAd && (
                <button 
                  onClick={copyToClipboard} 
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  📋 Copier
                </button>
              )}
            </div>
            
            {generatedAd ? (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-mono">
                  {generatedAd}
                </pre>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                <div className="text-6xl mb-4">✨</div>
                <p className="text-gray-600 dark:text-gray-400">
                  Remplissez le formulaire et cliquez sur "Générer" pour créer votre publicité
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

