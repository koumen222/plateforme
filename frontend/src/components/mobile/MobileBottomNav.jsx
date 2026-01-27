import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { FiCpu, FiFileText, FiHome, FiBook, FiTrendingUp, FiZap, FiUsers } from 'react-icons/fi'
import BottomNav from './BottomNav'
import { useAuth } from '../../contexts/AuthContext'

const isPathMatch = (pathname, target) => {
  if (!target) return false
  return pathname === target || pathname.startsWith(`${target}/`)
}

export default function MobileBottomNav() {
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const badges = { notifications: 0, messages: 0 }

  const navItems = useMemo(
    () => [
      { id: 'home', label: 'Accueil', icon: FiHome, badge: 0, href: '/', match: ['/', '/home'] },
      { id: 'cours', label: 'Cours', icon: FiBook, badge: 0, href: '/cours', match: ['/cours', '/course'] },
      { id: 'ressources', label: 'Ressources PDF', icon: FiFileText, badge: 0, href: '/ressources-pdf' },
      { id: 'produits', label: 'Produits Gagnants', icon: FiTrendingUp, badge: 0, href: '/produits-gagnants' },
      { id: 'communaute', label: 'Communauté', icon: FiUsers, badge: badges.messages, href: '/communaute' }
    ],
    [badges]
  )

  const activeId = useMemo(() => {
    const pathname = location.pathname
    const match = navItems.find((item) =>
      (item.match || [item.href]).some((target) => isPathMatch(pathname, target))
    )
    return match?.id || 'home'
  }, [location.pathname, navItems])

  if (!isAuthenticated) {
    return null
  }

  return <BottomNav items={navItems} activeId={activeId} />
}
