import { useEffect, useState } from 'react'
import Header from './Header'
import Footer from './Footer'
import Chatbot from './Chatbot'
import { useAuth } from '../contexts/AuthContext'

export default function PlatformLayout({
  children,
  showHeader = true,
  showFooter = true,
  showChatbot = true
}) {
  const { isAuthenticated, user, loading } = useAuth()
  const [showPromo, setShowPromo] = useState(false)

  useEffect(() => {
    if (loading) return
    const isPending = user?.status === 'pending' || user?.accountStatus === 'pending'
    const shouldShow = !isAuthenticated || isPending
    if (!shouldShow) return

    const timer = setTimeout(() => {
      setShowPromo(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [isAuthenticated, user, loading])

  useEffect(() => {
    if (showPromo) {
      const scrollY = window.scrollY || window.pageYOffset || 0
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      return () => {
        const top = document.body.style.top
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.left = ''
        document.body.style.right = ''
        const restoreY = top ? Math.abs(parseInt(top, 10)) : 0
        window.scrollTo(0, restoreY || 0)
      }
    }
    return undefined
  }, [showPromo])

  const handleClosePromo = () => {
    setShowPromo(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <div className={showPromo ? 'pointer-events-none select-none' : ''}>
        {showHeader && <Header />}
        <main className="flex-1 w-full">
          {children}
        </main>
        {showFooter && <Footer className="hidden md:block" />}
        {showChatbot && <Chatbot />}
      </div>

      {showPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-4 shadow-xl dark:bg-gray-900">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
                <span className="text-red-600">Attention</span> : voici comment obtenir un accès gratuit pendant 30 jours sur la plateforme
              </h3>
              <button
                type="button"
                onClick={handleClosePromo}
                className="rounded-full px-3 py-1 text-sm font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Fermer ✕
              </button>
            </div>
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
              <iframe
                title="Comment avoir un compte gratuit"
                src="https://player.vimeo.com/video/1157043180"
                className="h-full w-full"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="mt-4 flex justify-end">
              <a
                href="/profil"
                className="btn-profile-primary"
                onClick={handleClosePromo}
              >
                Obtenir mon accès
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

