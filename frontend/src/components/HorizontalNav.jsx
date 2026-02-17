import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { lessons } from '../data/lessons'
import { FiBook, FiMessageSquare } from 'react-icons/fi'

export default function HorizontalNav() {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  const navItems = [
    {
      path: '/',
      label: 'Formation',
      icon: FiBook,
      badge: null
    },
    ...(isAuthenticated && user?.status === 'active' 
      ? [
          {
            path: '/commentaires',
            label: 'Commentaires',
            icon: FiMessageSquare,
            badge: null
          }
        ]
      : []
    )
  ]

  return (
    <nav className="sticky top-16 lg:top-20 z-[999] bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ul className="flex items-center gap-2 list-none m-0 p-0 overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path === '/' && location.pathname.startsWith('/jour-'))
            
            return (
              <li key={item.path} className="flex-shrink-0">
                <Link
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-3 sm:px-4 sm:py-4 rounded-xl text-sm sm:text-base font-medium transition-all duration-200 whitespace-nowrap relative ${
                    isActive
                      ? 'text-accent bg-accent/10 font-semibold'
                      : 'text-primary hover:text-accent hover:bg-hover'
                  }`}
                >
                  <span className="text-base sm:text-lg leading-none flex items-center justify-center"><item.icon /></span>
                  <span className="hidden sm:inline leading-tight">{item.label}</span>
                  {item.badge && (
                    <span className="ml-1 text-sm animate-pulse">{item.badge}</span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/5 h-0.5 bg-accent rounded-t-full"></span>
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

