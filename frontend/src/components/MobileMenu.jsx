import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { FiX } from 'react-icons/fi'

export default function MobileMenu({ isOpen, onClose }) {
  const { isAuthenticated, user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    onClose()
  }

  return (
    <>
      {/* Overlay backdrop */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer menu */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 w-72 bg-white dark:bg-gray-900 shadow-xl z-[70] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header du menu */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Fermer le menu"
            >
              <FiX className="w-6 h-6 text-gray-900 dark:text-white" />
            </button>
          </div>

          {/* Contenu scrollable */}
          <div className="flex-1 overflow-y-auto">
            {/* Navigation principale */}
            <nav className="p-4 space-y-2">
              <Link
                to="/"
                className="block px-4 py-3 rounded-lg text-black dark:text-black hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
                onClick={onClose}
              >
                Accueil
              </Link>
              <Link
                to="/cours"
                className="block px-4 py-3 rounded-lg text-black dark:text-black hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
                onClick={onClose}
              >
                Cours
              </Link>
              <Link
                to="/ressources-pdf"
                className="block px-4 py-3 rounded-lg text-black dark:text-black hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
                onClick={onClose}
              >
                Ressources PDF
              </Link>
              <Link
                to="/produits-gagnants"
                className="block px-4 py-3 rounded-lg text-black dark:text-black hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
                onClick={onClose}
              >
                Produits Gagnants
              </Link>
              <Link
                to="/replays-lives"
                className="block px-4 py-3 rounded-lg text-black dark:text-black hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
                onClick={onClose}
              >
                Replays Lives
              </Link>
              <Link
                to="/communaute"
                className="block px-4 py-3 rounded-lg text-black dark:text-black hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
                onClick={onClose}
              >
                Communauté
              </Link>
            </nav>

            {/* Section utilisateur */}
            {isAuthenticated ? (
              <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                <div className="px-4 mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-semibold text-sm">
                      {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="font-semibold text-black dark:text-black">{user?.name || 'Utilisateur'}</div>
                      <div className="text-sm text-black dark:text-black">{user?.email}</div>
                    </div>
                  </div>
                  <div
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      user?.status === 'active'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                    }`}
                  >
                    {user?.status === 'active' ? 'Actif' : 'En attente'}
                  </div>
                </div>
                <Link
                  to="/profil"
                  className="block px-4 py-3 rounded-lg text-black dark:text-black hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
                  onClick={onClose}
                >
                  Mon profil
                </Link>
                <Link
                  to="/commentaires"
                  className="block px-4 py-3 rounded-lg text-black dark:text-black hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
                  onClick={onClose}
                >
                  Mes commentaires
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors font-medium mt-2"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                <Link
                  to="/login"
                  className="block w-full text-center px-4 py-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-colors"
                  onClick={onClose}
                >
                  Se connecter
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

