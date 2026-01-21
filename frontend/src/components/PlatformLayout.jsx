import Header from './Header'
import Footer from './Footer'
import Chatbot from './Chatbot'

export default function PlatformLayout({
  children,
  showHeader = true,
  showFooter = true,
  showChatbot = true
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      {showHeader && <Header />}
      <main className="flex-1 w-full">
        {children}
      </main>
      {showFooter && <Footer className="hidden md:block" />}
      {showChatbot && <Chatbot />}
    </div>
  )
}

