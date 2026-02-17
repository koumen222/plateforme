import { useState } from 'react'
import Sidebar from './Sidebar'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

export default function Layout({ children }) {
  const [sidebarVisible, setSidebarVisible] = useState(true)

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden relative">
      {/* Sidebar - masquée sur mobile, visible sur desktop avec transition */}
      <div 
        className={`hidden md:block transition-all duration-300 ease-in-out overflow-hidden ${
          sidebarVisible ? 'w-[420px] opacity-100' : 'w-0 opacity-0'
        }`}
      >
        <Sidebar />
      </div>

      {/* Bouton toggle sidebar */}
      <button
        onClick={() => setSidebarVisible(!sidebarVisible)}
        className="hidden md:flex fixed z-40 w-10 h-12 bg-accent hover:bg-accent-hover text-white rounded-r-xl shadow-lg items-center justify-center transition-all duration-300 hover:scale-105"
        style={{
          left: sidebarVisible ? '420px' : '0',
          top: 'calc(4rem + 4rem)',
          transition: 'left 0.3s ease'
        }}
        aria-label={sidebarVisible ? 'Masquer le menu' : 'Afficher le menu'}
      >
        {sidebarVisible ? (
          <FiChevronLeft className="w-5 h-5" />
        ) : (
          <FiChevronRight className="w-5 h-5" />
        )}
      </button>

      {/* Contenu principal */}
      <main className="flex-1 min-w-0 overflow-y-auto w-full md:w-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 xl:px-20 py-6 sm:py-8">
        {children}
        </div>
      </main>
    </div>
  )
}
