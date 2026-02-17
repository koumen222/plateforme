import { Link } from 'react-router-dom'
import { CONFIG } from '../config/config'

export default function Footer({ className = '' }) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={`bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <img src="/img/logo.svg" alt="Ecom Starter" className="h-8 w-auto" />
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Plateforme de formation en ligne pour maîtriser Facebook Ads, TikTok Ads et le e-commerce.
            </p>
            <div className="flex items-center gap-3">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-accent hover:text-white transition-all duration-200"
                aria-label="Facebook"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-pink-600 hover:text-white dark:hover:bg-pink-600 transition-all duration-200"
                aria-label="Instagram"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-accent hover:text-white transition-all duration-200"
                aria-label="Twitter"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Navigation Column */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">Navigation</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-accent transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/cours" className="text-sm text-gray-600 dark:text-gray-400 hover:text-brand dark:hover:text-brand-400 transition-colors">
                  Cours
                </Link>
              </li>
              <li>
                <Link to="/produits-gagnants" className="text-sm text-gray-600 dark:text-gray-400 hover:text-brand dark:hover:text-brand-400 transition-colors">
                  Produits Gagnants
                </Link>
              </li>
              <li>
                <Link to="/generateur-pub" className="text-sm text-gray-600 dark:text-gray-400 hover:text-brand dark:hover:text-brand-400 transition-colors">
                  Générateur de Pub
                </Link>
              </li>
              <li>
                <Link to="/communaute" className="text-sm text-gray-600 dark:text-gray-400 hover:text-brand dark:hover:text-brand-400 transition-colors">
                  Communauté
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">Support</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/profil" className="text-sm text-gray-600 dark:text-gray-400 hover:text-brand dark:hover:text-brand-400 transition-colors">
                  Mon profil
                </Link>
              </li>
              <li>
                <Link to="/commentaires" className="text-sm text-gray-600 dark:text-gray-400 hover:text-brand dark:hover:text-brand-400 transition-colors">
                  Mes commentaires
                </Link>
              </li>
              <li>
                <a href={`https://wa.me/${CONFIG.MORGAN_PHONE}`} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                  Contact WhatsApp
                </a>
              </li>
              <li>
                <a href="mailto:support@ecomstarter.com" className="text-sm text-gray-600 dark:text-gray-400 hover:text-brand dark:hover:text-brand-400 transition-colors">
                  Email
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">Légal</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/conditions" className="text-sm text-gray-600 dark:text-gray-400 hover:text-brand dark:hover:text-brand-400 transition-colors">
                  Conditions d'utilisation
                </Link>
              </li>
              <li>
                <Link to="/confidentialite" className="text-sm text-gray-600 dark:text-gray-400 hover:text-brand dark:hover:text-brand-400 transition-colors">
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link to="/mentions-legales" className="text-sm text-gray-600 dark:text-gray-400 hover:text-brand dark:hover:text-brand-400 transition-colors">
                  Mentions légales
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8 mt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {currentYear} Ecom Starter. Tous droits réservés.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Plateforme de formation professionnelle
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
