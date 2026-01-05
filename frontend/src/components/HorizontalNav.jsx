import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { lessons } from '../data/lessons'
import '../styles/horizontal-nav.css'

export default function HorizontalNav() {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  const navItems = [
    {
      path: '/',
      label: 'Formation',
      icon: '📚',
      badge: null
    },
    ...(isAuthenticated && user?.status === 'active' 
      ? [
          {
            path: '/commentaires',
            label: 'Commentaires',
            icon: '💬',
            badge: null
          }
        ]
      : []
    )
  ]

  return (
    <nav className="horizontal-nav">
      <div className="horizontal-nav-container">
        <ul className="horizontal-nav-list">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path === '/' && location.pathname.startsWith('/jour-'))
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`horizontal-nav-link ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  {item.badge && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}

