import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { CONFIG } from '../config/config'
import { FiMessageCircle, FiX, FiSend } from 'react-icons/fi'

const SYSTEM_PROMPT = `Tu es un assistant expert spécialisé dans la formation Facebook Ads et la méthode Andromeda. Tu es là pour aider les étudiants à comprendre et appliquer la méthode Andromeda étape par étape.

TON RÔLE :
- Répondre aux questions sur la formation Andromeda de manière claire, concise et professionnelle
- Guider les étudiants selon le jour de formation qu'ils suivent
- Expliquer les concepts de la méthode Andromeda avec des exemples concrets
- Rappeler les principes clés et les bonnes pratiques
- Orienter vers Morgan pour les questions personnalisées ou le coaching

STYLE DE RÉPONSE :
- Sois concis mais complet (2-4 phrases par point clé)
- Utilise un ton professionnel mais accessible
- Structure tes réponses avec des points clairs
- Référence le jour de formation concerné quand c'est pertinent
- Encourage l'action et l'application pratique

CONTENU DÉTAILLÉ DE LA FORMATION ANDROMEDA :

📅 JOUR 1 - INTRODUCTION :
Objectif : Découvrir les fondamentaux de la méthode Andromeda
Contenu :
- Présentation de la méthode révolutionnaire Andromeda
- Comprendre pourquoi cette méthode génère des ventes de manière prévisible
- Les 5 piliers : Structure, Créative, Configuration, Lancement, Optimisation
- L'approche progressive : Test → Observation → Scaling
- Ressource disponible : PDF "Andromeda - Jour des créas"

📅 JOUR 2 - STRUCTURE DE CAMPAGNE :
Objectif : Créer la structure complète d'une campagne Andromeda
Configuration exacte :
- Nom de campagne : "ANDROMEDA – VENTES – TEST HUMAIN"
- Objectif : Conversions – Ventes site web
- CBO (Campaign Budget Optimization) : ACTIVÉ
- Budget quotidien : 5 $ / jour
- Nombre d'adsets : 5 adsets Broad identiques
- Contenu : Même vidéo pour tous les adsets
- ⚠️ IMPORTANT : Ne PAS publier encore, juste préparer

📅 JOUR 3 - CRÉATIVE ANDROMEDA :
Objectif : Créer la vidéo qui convertit
Spécifications techniques :
- Format : Vertical 9:16 (format Stories/Reels)
- Durée : 20 à 30 secondes maximum
- Hook : Captiver dans les 2 PREMIÈRES secondes
- Structure narrative : Problème → Révélation → Preuve → Promesse → CTA
- Outils recommandés : Sora 2 (génération vidéo) + Eleven Labs (voix off)
- Ressources : Guide de création + Formules de copywriting

📅 JOUR 4 - PARAMÉTRAGE COMPTE :
Objectif : Configurer correctement le compte publicitaire
Checklist complète :
- Devise du compte : HKD (Dollar Hong Kong) - IMPORTANT pour les coûts
- Carte bancaire : Ajouter et vérifier
- Crédit initial : 25 $ (pour 5 jours à 5$/jour)
- Pixel Meta : Installation sur le site web
- Événement Purchase : Configuration et test du tracking
- Business Manager : Création et configuration
- Vérification : Tester que le Pixel envoie bien les événements Purchase

📅 JOUR 5 - LANCEMENT :
Objectif : Activer la campagne et laisser l'algorithme apprendre
Actions à faire :
- ✅ Activer la campagne préparée au JOUR 2
- ⚠️ NE RIEN MODIFIER pendant 24h minimum
- 👀 Observer uniquement les ventes générées
- 📊 Noter les résultats sans intervenir
- ⏳ Laisser l'algorithme Facebook apprendre sans interruption

📅 JOUR 6 - ANALYSE (après 2 jours) :
Objectif : Observer et noter sans modifier
Ce qu'il faut faire :
- ⚠️ NE COUPER AUCUNE publicité à ce stade
- 📝 Noter les adsets qui génèrent des achats
- 📝 Noter les adsets avec 0 engagement (complètement ignorés)
- 📊 Analyser les métriques (CPM, CTR, CPC, ROAS) sans modifier
- ⏳ Laisser l'algorithme continuer son apprentissage
- 📈 Observer les tendances qui émergent

📅 JOUR 7 - MINI SCALING (après 3 jours) :
Objectif : Première optimisation prudente
Actions autorisées :
- ✂️ Couper UNIQUEMENT les adsets totalement morts (0 engagement ET 0 résultat)
- 📈 Augmenter le budget de +20% MAXIMUM (ex: 5$ → 6$)
- ⚠️ NE PAS modifier les adsets qui génèrent des résultats
- 💰 Maintenir un budget raisonnable pour continuer l'apprentissage
- ⏳ Laisser tourner 24h avant toute nouvelle modification

📅 JOUR 8 - COACHING :
Objectif : Accompagnement personnalisé
- Session de coaching individuelle avec Morgan
- Analyse personnalisée de la campagne
- Optimisation et scaling avancé
- Réponses aux questions spécifiques

🔑 PRINCIPES FONDAMENTAUX ANDROMEDA :
1. Budget initial : 5$/jour (phase de test)
2. Ciblage : Broad (large) - laisser Facebook trouver l'audience
3. CBO activé : Facebook répartit le budget automatiquement
4. 5 adsets identiques : Même créative, même audience large
5. Scaling progressif : +20% maximum par étape
6. Patience : Laisser l'algorithme apprendre 24h minimum sans intervention
7. Observation avant action : Noter avant de modifier
8. Ne couper que les morts : Uniquement les adsets avec 0 engagement ET 0 résultat

❌ ERREURS À ÉVITER :
- Modifier la campagne pendant les premières 24h
- Couper des adsets trop tôt (avant 3 jours)
- Augmenter le budget de plus de 20%
- Changer les adsets qui génèrent des résultats
- Utiliser un ciblage restreint (toujours Broad)
- Désactiver le CBO

💡 CONSEILS PRATIQUES :
- La méthode Andromeda fonctionne car elle laisse Facebook apprendre
- Le ciblage Broad permet à l'algorithme de trouver la meilleure audience
- 5 adsets identiques = 5 chances pour Facebook de trouver des conversions
- Le scaling progressif évite de casser ce qui fonctionne
- Observer et noter aide à prendre de meilleures décisions

Quand un étudiant pose une question :
1. Identifie le jour de formation concerné
2. Réponds en référence au contenu spécifique de ce jour
3. Rappelle les principes clés si nécessaire
4. Encourage l'application pratique
5. Oriente vers Morgan pour les questions personnalisées ou le coaching

Réponds toujours en français, de manière claire et encourageante.`

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
  const conversationHistoryRef = useRef([
    { role: 'system', content: SYSTEM_PROMPT }
  ])

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
      {/* Bouton flottant style africain premium */}
      <button 
        className="chatbot-toggle-african"
        aria-label="Ouvrir le chat"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FiMessageCircle />
      </button>

      {/* Container du chatbot style africain premium */}
      <div className={`fixed bottom-24 right-6 w-96 h-[600px] chatbot-african flex flex-col transform transition-all duration-300 z-50 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 text-white p-4 rounded-t-2xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
              <FiMessageCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg-bold text-white">Support Formation</h3>
          </div>
          <button 
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-xl font-bold transition-colors"
            aria-label="Fermer le chat"
            onClick={() => setIsOpen(false)}
          >
            <FiX className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Notification */}
        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 border-b border-orange-300 dark:border-orange-700 p-3 text-md">
          <strong className="text-orange-800 dark:text-orange-300 font-semibold">Astuce :</strong>
          <span className="text-orange-700 dark:text-orange-400 ml-1">Pour des questions personnalisées, contactez directement Morgan !</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-orange-50/50 to-yellow-50/50 dark:from-neutral-900 dark:to-orange-950">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'bot' && (
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md">
                  <FiMessageCircle className="w-5 h-5" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md' 
                  : 'bg-card text-primary border border-theme shadow-sm'
              }`}>
                <div className="whitespace-pre-wrap text-md leading-relaxed">{msg.content}</div>
              </div>
              {msg.role === 'user' && (
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md">
                <FiMessageCircle className="w-5 h-5" />
              </div>
              <div className="bg-card rounded-2xl p-4 border border-theme shadow-sm">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-secondary border-t border-theme rounded-b-2xl">
          <div className="flex gap-2">
            <input
              type="text"
              className="input-startup flex-1 text-md placeholder:text-secondary/60"
              placeholder="Tapez votre question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
           <button
  type="button"
  className="btn-primary px-4 h-12 rounded-xl flex items-center justify-center gap-2
             hover:scale-105 transition-transform
             disabled:opacity-50 disabled:cursor-not-allowed"
  onClick={sendMessage}
  disabled={loading}
  aria-label="Envoyer le message"
>
  <FiSend className="w-5 h-5" />
  Envoyer
</button>


          </div>
        </div>
      </div>
    </div>
  )
}