import Sidebar from './Sidebar'

export default function Layout({ children }) {
  return (
    <div className="container">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}

