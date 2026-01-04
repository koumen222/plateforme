import { Link, useLocation } from 'react-router-dom'
import { lessons } from '../data/lessons'
import { useState } from 'react'

export default function Sidebar() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)

  return (
    <>
      <button 
        className="mobile-menu-toggle" 
        aria-label="Menu"
        onClick={toggleMenu}
      >
        ☰
      </button>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1>📚 Formation FB Ads</h1>
          <p>Maîtrisez la publicité Facebook</p>
        </div>
        <nav>
          <ul className="sidebar-nav">
            {lessons.map((lesson) => (
              <li key={lesson.id}>
                <Link
                  to={lesson.path}
                  className={location.pathname === lesson.path ? 'active' : ''}
                  onClick={() => setIsOpen(false)}
                >
                  <span className="lesson-number">{lesson.id}</span>
                  {lesson.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  )
}

