import Sidebar from './Sidebar'
import Chatbot from './Chatbot'

export default function Layout({ children }) {
  return (
    <div className="container">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
      <Chatbot />
    </div>
  )
}

