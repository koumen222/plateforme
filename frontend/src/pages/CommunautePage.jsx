import { useState } from 'react'

export default function CommunautePage() {
  const [activeTab, setActiveTab] = useState('discussions')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            👥 Communauté Ecom Starter
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Échangez avec d'autres entrepreneurs et partagez vos succès
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          <button
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              activeTab === 'discussions'
                ? 'bg-brand text-white shadow-lg transform scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-brand dark:hover:border-brand'
            }`}
            onClick={() => setActiveTab('discussions')}
          >
            Discussions
          </button>
          <button
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              activeTab === 'success'
                ? 'bg-brand text-white shadow-lg transform scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-brand dark:hover:border-brand'
            }`}
            onClick={() => setActiveTab('success')}
          >
            🏆 Success Stories
          </button>
          <button
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              activeTab === 'resources'
                ? 'bg-brand text-white shadow-lg transform scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-brand dark:hover:border-brand'
            }`}
            onClick={() => setActiveTab('resources')}
          >
            Ressources
          </button>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {activeTab === 'discussions' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Forum de discussion</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Bientôt disponible ! Vous pourrez échanger avec la communauté, poser vos questions et partager vos expériences.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-brand-50 dark:bg-brand-900/20 rounded-xl border border-brand-200 dark:border-brand-800">
                  <span className="text-brand-700 dark:text-brand-400 font-medium">Discussions par catégorie</span>
                </div>
                <div className="p-4 bg-brand-50 dark:bg-brand-900/20 rounded-xl border border-brand-200 dark:border-brand-800">
                  <span className="text-brand-700 dark:text-brand-400 font-medium">Système de votes</span>
                </div>
                <div className="p-4 bg-brand-50 dark:bg-brand-900/20 rounded-xl border border-brand-200 dark:border-brand-800">
                  <span className="text-brand-700 dark:text-brand-400 font-medium">Notifications en temps réel</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'success' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Success Stories</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Découvrez les témoignages inspirants des membres de la communauté qui ont réussi grâce aux formations Ecom Starter.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <span className="text-green-700 dark:text-green-400 font-medium">Témoignages vidéo</span>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <span className="text-green-700 dark:text-green-400 font-medium">Résultats chiffrés</span>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <span className="text-green-700 dark:text-green-400 font-medium">Stratégies gagnantes</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Bibliothèque de ressources</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Accédez à une collection de templates, guides et outils partagés par la communauté.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                  <span className="text-purple-700 dark:text-purple-400 font-medium">Templates de publicités</span>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                  <span className="text-purple-700 dark:text-purple-400 font-medium">Guides PDF téléchargeables</span>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                  <span className="text-purple-700 dark:text-purple-400 font-medium">Outils recommandés</span>
                </div>
              </div>
            </div>
          )}

          {/* WhatsApp Card */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-8 shadow-xl text-white">
            <h3 className="text-2xl font-bold mb-3">Rejoignez-nous sur WhatsApp</h3>
            <p className="text-green-50 mb-6">
              En attendant le forum, rejoignez notre groupe WhatsApp pour échanger avec la communauté !
            </p>
            <a
              href="https://wa.me/237XXXXXXXXX"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Rejoindre le groupe
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}


