import Sidebar from './Sidebar'

export default function Layout({ children }) {
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden relative">
      {/* Sidebar - masquée sur mobile, visible sur desktop */}
      <Sidebar />

      {/* Contenu principal */}
      <main className="flex-1 min-w-0 overflow-y-auto w-full md:w-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {children}
        </div>
      </main>
    </div>
  )
}
