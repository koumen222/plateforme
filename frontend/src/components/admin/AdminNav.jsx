import { Link, useLocation } from 'react-router-dom'

export default function AdminNav() {
  const location = useLocation()

  const navItems = [
    { path: '/admin', label: 'Tableau de bord', icon: '📊' }
  ]

  return (
    <nav className="admin-nav">
      <ul className="admin-nav-list">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={`admin-nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

