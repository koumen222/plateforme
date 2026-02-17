import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { useAuth } from '../contexts/AuthContext'
import { CONFIG } from '../config/config'
import { FiMessageCircle, FiX, FiSend } from 'react-icons/fi'

export default function Chatbot({ className = '', displayMode = 'floating' }) {
  const { token, isAuthenticated, user } = useAuth()
  const isPageMode = displayMode === 'page'
  const [isOpen, setIsOpen] = useState(isPageMode)
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: 'Bonjour ! 👋\n\nPosez ici vos questions et je vous répondrai.\n\nPour un accompagnement personnalisé, contactez Morgan. 💬'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const conversationHistoryRef = useRef([])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isPageMode) {
      setIsOpen(true)
      return undefined
    }
    if (isOpen && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
    return undefined
  }, [isOpen, isPageMode])

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
      {!isPageMode && (
        <button 
          className="fixed bottom-4 right-4 md:bottom-6 md:right-6 w-14 h-14 md:w-16 md:h-16 bg-accent hover:bg-accent-hover text-white rounded-full flex items-center justify-center text-xl md:text-2xl hover:scale-105 transition-all duration-300 z-50 shadow-lg"
          style={{ boxShadow: '0 4px 12px var(--accent-shadow)' }}
          aria-label="Ouvrir le chat"
          onClick={() => setIsOpen(!isOpen)}
        >
          <FiMessageCircle />
        </button>
      )}

      {/* Container du chatbot avec couleurs de la plateforme */}
      <div className={`${
        isPageMode
          ? 'relative w-full h-full flex flex-col'
          : 'fixed top-auto bottom-20 left-4 right-4 md:bottom-24 md:right-6 md:left-auto md:w-[420px] lg:w-[480px] h-[70vh] max-h-[70vh] md:h-[640px]'
      } flex flex-col transform transition-all duration-300 z-50 ${isPageMode || isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        {/* Mobile backdrop */}
        {!isPageMode && (
          <div
            className="absolute inset-0 bg-black/40 md:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Panel */}
        <div className={`relative flex flex-col w-full h-full ${isPageMode ? 'max-w-5xl mx-auto' : 'md:h-[640px]'} bg-secondary md:bg-secondary rounded-2xl md:rounded-3xl md:border md:border-theme md:shadow-2xl md:ring-1 md:ring-black/5`}>
          <div className="sticky top-0 z-10">
            {/* Header */}
            <div className="bg-accent text-white px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.5rem)] md:px-4 md:py-4 md:rounded-t-2xl flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
                  <FiMessageCircle className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div className="flex flex-col leading-tight">
                  <h3 className="font-semibold text-base md:text-lg text-white">Assistant</h3>
                  <span className="text-xs md:text-sm text-white/80">Ecom Starter 3.0</span>
                </div>
              </div>
              {!isPageMode && (
                <button 
                  className="w-9 h-9 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center transition-colors"
                  aria-label="Fermer le chat"
                  onClick={() => setIsOpen(false)}
                >
                  <FiX className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </button>
              )}
            </div>

            {/* Notification */}
            <div className="bg-accent/10 dark:bg-accent/20 border-b border-accent/20 dark:border-accent/30 px-4 py-2 text-xs md:text-sm">
              <span className="text-primary dark:text-secondary">Astuce : Pour des questions personnalisées, contactez Morgan.</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-secondary">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'bot' && (
                  <div className="w-9 h-9 bg-accent rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md">
                    <FiMessageCircle className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                )}
                <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user' 
                    ? 'bg-accent text-white shadow-md' 
                    : 'bg-card text-primary border border-theme shadow-sm'
                }`}>
                  {msg.role === 'bot' ? (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <p className="mb-2 last:mb-0 text-sm md:text-base leading-relaxed">{children}</p>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-primary">{children}</strong>
                        ),
                        em: ({ children }) => (
                          <em className="italic text-primary">{children}</em>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc pl-5 space-y-1 text-sm md:text-base leading-relaxed">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal pl-5 space-y-1 text-sm md:text-base leading-relaxed">{children}</ol>
                        ),
                        li: ({ children }) => (
                          <li className="text-sm md:text-base leading-relaxed">{children}</li>
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
                    <div className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">{msg.content}</div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-9 h-9 bg-accent-hover rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md">
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
          <div className="px-4 pb-4 pt-2 bg-secondary border-t border-theme md:rounded-b-2xl">
            <div className="flex gap-2 items-center bg-card border border-theme rounded-2xl px-3 py-2 shadow-sm">
              <input
                type="text"
                className="flex-1 bg-transparent text-sm md:text-base placeholder:text-secondary/60 focus:outline-none"
                placeholder="Écris un message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
              <button
                type="button"
                className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={sendMessage}
                disabled={loading}
                aria-label="Envoyer le message"
              >
                <FiSend className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
            <p className="mt-2 text-[11px] text-secondary/70 text-center">Réponses générées par l’IA.</p>
          </div>
        </div>
      </div>
    </div>
  )
}