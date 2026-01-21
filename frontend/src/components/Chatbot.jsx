import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { useAuth } from '../contexts/AuthContext'
import { CONFIG } from '../config/config'
import { FiMessageCircle, FiX, FiSend } from 'react-icons/fi'

export default function Chatbot({ className = '' }) {
  const { token, isAuthenticated, user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: 'Bonjour ! 👋\n\nPour toute question concernant la formation Andromeda, n\'hésitez pas à poser vos questions directement à Morgan.\n\nJe suis là pour vous aider avec les informations de la formation, mais pour un accompagnement personnalisé, contactez Morgan ! 💬'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const conversationHistoryRef = useRef([])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const message = input.trim()
    if (!message || loading) return

    // Vérifier que l'utilisateur est connecté et actif
    if (!isAuthenticated || !token) {
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: '⚠️ Vous devez être connecté pour utiliser le chatbot. Veuillez vous connecter ou vous inscrire.' 
      }])
      return
    }

    if (user && user.status !== 'active') {
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: '⚠️ Votre compte doit être actif pour accéder au chatbot. Contactez l\'administrateur pour activer votre compte.' 
      }])
      return
    }

    const userMessage = { role: 'user', content: message }
    setMessages(prev => [...prev, userMessage])
    conversationHistoryRef.current.push(userMessage)
    setInput('')
    setLoading(true)

    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message,
          conversationHistory: conversationHistoryRef.current
        })
      })

      // Gestion des erreurs HTTP spécifiques
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        if (response.status === 401) {
          throw new Error('Votre session a expiré. Veuillez vous reconnecter.')
        } else if (response.status === 403) {
          throw new Error(errorData.error || 'Votre compte doit être actif pour accéder au chatbot.')
        } else if (response.status === 500) {
          throw new Error('Erreur serveur. Veuillez réessayer dans quelques instants.')
        } else {
          throw new Error(errorData.error || 'Erreur lors de la communication avec le serveur.')
        }
      }

      const data = await response.json()
      const botMessage = data.reply || data.choices?.[0]?.message?.content || 'Désolé, je n\'ai pas pu traiter votre demande.'

      setMessages(prev => [...prev, { role: 'bot', content: botMessage }])
      conversationHistoryRef.current.push({ role: 'assistant', content: botMessage })
    } catch (error) {
      // Messages d'erreur spécifiques selon le type d'erreur
      let errorMessage = '❌ Erreur de connexion.'
      
      if (error.message) {
        errorMessage = `❌ ${error.message}`
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        errorMessage = '❌ Impossible de se connecter au serveur. Vérifiez que le backend est démarré et que votre connexion internet fonctionne.'
      } else if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
        errorMessage = '❌ Problème de connexion réseau. Vérifiez votre connexion internet.'
      } else {
        errorMessage = '❌ Erreur lors de la communication avec le serveur. Veuillez réessayer.'
      }
      
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: errorMessage
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className={className}>
      {/* Bouton flottant avec couleurs de la plateforme */}
      <button 
        className="fixed bottom-4 md:bottom-6 right-4 md:right-6 w-14 h-14 md:w-16 md:h-16 bg-accent hover:bg-accent-hover text-white rounded-full flex items-center justify-center text-xl md:text-2xl hover:scale-105 transition-all duration-300 z-50 shadow-lg"
        style={{ boxShadow: '0 4px 12px var(--accent-shadow)' }}
        aria-label="Ouvrir le chat"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FiMessageCircle />
      </button>

      {/* Container du chatbot avec couleurs de la plateforme */}
      <div className={`fixed bottom-20 md:bottom-24 right-2 md:right-6 w-[calc(100vw-1rem)] md:w-96 h-[calc(100vh-8rem)] md:h-[600px] max-h-[600px] flex flex-col transform transition-all duration-300 z-50 shadow-xl rounded-2xl border border-theme ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        {/* Header */}
        <div className="bg-accent text-white p-3 md:p-4 rounded-t-2xl flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
              <FiMessageCircle className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <h3 className="font-bold text-base md:text-lg text-white">Support Formation</h3>
          </div>
          <button 
            className="w-7 h-7 md:w-8 md:h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            aria-label="Fermer le chat"
            onClick={() => setIsOpen(false)}
          >
            <FiX className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </button>
        </div>

        {/* Notification */}
        <div className="bg-accent/10 dark:bg-accent/20 border-b border-accent/20 dark:border-accent/30 p-2 md:p-3 text-xs md:text-md">
          <strong className="text-accent dark:text-accent-light font-semibold">Astuce :</strong>
          <span className="text-primary dark:text-secondary ml-1">Pour des questions personnalisées, contactez directement Morgan !</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 bg-secondary">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-2 md:gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'bot' && (
                <div className="w-8 h-8 md:w-10 md:h-10 bg-accent rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md">
                  <FiMessageCircle className="w-4 h-4 md:w-5 md:h-5" />
                </div>
              )}
              <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-3 md:p-4 ${
                msg.role === 'user' 
                  ? 'bg-accent text-white shadow-md' 
                  : 'bg-card text-primary border border-theme shadow-sm'
              }`}>
                {msg.role === 'bot' ? (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p className="mb-2 last:mb-0 text-sm md:text-md leading-relaxed">{children}</p>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-primary">{children}</strong>
                      ),
                      em: ({ children }) => (
                        <em className="italic text-primary">{children}</em>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-5 space-y-1 text-sm md:text-md leading-relaxed">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-5 space-y-1 text-sm md:text-md leading-relaxed">{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-sm md:text-md leading-relaxed">{children}</li>
                      ),
                      code: ({ inline, children }) => (
                        inline ? (
                          <code className="rounded bg-black/10 dark:bg-white/10 px-1 py-0.5 font-mono text-xs">
                            {children}
                          </code>
                        ) : (
                          <code className="block whitespace-pre-wrap rounded bg-black/10 dark:bg-white/10 p-2 font-mono text-xs">
                            {children}
                          </code>
                        )
                      )
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <div className="whitespace-pre-wrap text-sm md:text-md leading-relaxed">{msg.content}</div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 md:w-10 md:h-10 bg-accent-hover rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md">
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-2 md:gap-3 justify-start">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-accent rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md">
                <FiMessageCircle className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="bg-card rounded-2xl p-3 md:p-4 border border-theme shadow-sm">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-accent-hover rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-accent-light rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 md:p-4 bg-secondary border-t border-theme rounded-b-2xl">
          <div className="flex gap-2">
            <input
              type="text"
              className="input-startup flex-1 text-sm md:text-md placeholder:text-secondary/60"
              placeholder="Tapez votre question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
           <button
  type="button"
  className="btn-primary px-3 md:px-4 h-10 md:h-12 rounded-xl flex items-center justify-center gap-1 md:gap-2
             hover:scale-105 transition-transform
             disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
  onClick={sendMessage}
  disabled={loading}
  aria-label="Envoyer le message"
>
  <FiSend className="w-4 h-4 md:w-5 md:h-5" />
  <span className="hidden sm:inline">Envoyer</span>
</button>


          </div>
        </div>
      </div>
    </div>
  )
}