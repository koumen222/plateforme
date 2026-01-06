import Header from './Header'
import Footer from './Footer'
import Chatbot from './Chatbot'
import '../styles/platform-layout.css'

export default function PlatformLayout({ children }) {
  return (
    <div className="platform-layout">
      <Header />
      <main className="platform-main">
        {children}
      </main>
      <Footer />
      <Chatbot />
    </div>
  )
}

