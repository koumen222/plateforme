import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
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
  const location = useLocation()
  const [showPromo, setShowPromo] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const isPending = user?.status === 'pending'
  const isHome = location.pathname === '/' || location.pathname === '/home'
  const showWelcomeNotice = isAuthenticated && isHome
  const showStatusNotice = isAuthenticated && isPending && isHome
  const noticeCount = (showWelcomeNotice ? 1 : 0) + (showStatusNotice ? 1 : 0)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)')
    const update = () => setIsDesktop(mediaQuery.matches)
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (loading) return
    if (!isDesktop) return
    const dismissed = localStorage.getItem('promo_video_dismissed') === '1'
    if (dismissed) return
    const isPending = user?.status === 'pending'
    const shouldShow = !isAuthenticated || isPending
    if (!shouldShow) return

    const timer = setTimeout(() => {
      setShowPromo(true)
    }, 5000)

    return () => clearTimeout(timer)
  }, [isAuthenticated, user, loading, isDesktop])

  useEffect(() => {
    if (!isDesktop) {
      if (showPromo) {
        setShowPromo(false)
      }
      return undefined
    }
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
  }, [showPromo, isDesktop])

  const handleClosePromo = () => {
    localStorage.setItem('promo_video_dismissed', '1')
    setShowPromo(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <div className={showPromo ? 'pointer-events-none select-none' : ''}>
        {showHeader && <Header />}
        {noticeCount > 0 && (
          <div className="md:hidden px-4 pt-2">
            <div className="space-y-2">
              {showStatusNotice && (
                <Link
                  to="/profil"
                  className="block rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900 shadow-sm line-clamp-2 leading-snug"
                >
                  Statut: en attente. Cliquez pour déverrouiller les accès.
                </Link>
              )}
              {showStatusNotice && (
                <div className="overflow-hidden rounded-xl border border-amber-100 bg-white shadow-sm">
                  <div className="px-3 py-2 text-sm font-semibold text-slate-700">
                    Comment obtenir un accès gratuit sur la plateforme
                  </div>
                  <div className="aspect-video w-full overflow-hidden bg-black">
                    <iframe
                      title="Comment avoir un compte gratuit"
                      src="https://player.vimeo.com/video/1157043180"
                      className="h-full w-full"
                      frameBorder="0"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
              {showWelcomeNotice && (
                <div className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                  Bienvenue {user?.name ? `, ${user.name}` : 'sur la plateforme'}.
                </div>
              )}
            </div>
          </div>
        )}
        <main className="flex-1 w-full pb-24 md:pb-0 pt-2 md:pt-0">
          {children}
        </main>
        {showFooter && <Footer className="hidden md:block" />}
        {showChatbot && <Chatbot />}
      </div>

      {showPromo && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pb-6 pt-20 sm:items-center sm:pt-6">
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

