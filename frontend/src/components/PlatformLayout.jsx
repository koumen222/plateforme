import Header from './Header'
import Footer from './Footer'
import Chatbot from './Chatbot'

export default function PlatformLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header />
      <main className="flex-1 w-full">
        {children}
      </main>
      <Footer className="hidden md:block" />
      <Chatbot className="hidden md:block" />
    </div>
  )
}

