import { useState, useRef, useEffect } from 'react'
import { CONFIG } from '../config/config'

const SYSTEM_PROMPT = `Tu es un assistant expert en formation Facebook Ads et méthode Andromeda. Tu as accès à tout le contenu détaillé de la formation. Réponds de manière concise, professionnelle et en français.

CONTENU DE LA FORMATION ANDROMEDA :

JOUR 1 - INTRODUCTION :
Bienvenue dans la formation Andromeda ! Cette méthode révolutionnaire permet de créer des campagnes Facebook Ads performantes qui génèrent des ventes. Les fondamentaux incluent :
- Découvrir la méthode Andromeda
- Comprendre la structure d'une campagne performante
- Préparer votre stratégie de lancement
- Apprendre les bases du système de test
- Maîtriser l'approche progressive de scaling

JOUR 2 - LA STRUCTURE D'UNE CAMPAGNE QUI NOURRIT ANDROMEDA :
Découvrir la structure complète d'une campagne Andromeda qui génère des ventes de manière prévisible et scalable :
- Comprendre les principes fondamentaux de la méthode Andromeda
- Découvrir la structure d'une campagne qui convertit
- Apprendre comment nourrir l'algorithme Facebook efficacement
- Maîtriser les éléments clés d'une campagne performante
- Préparer votre stratégie de test et d'optimisation
- Structure de campagne : ANDROMEDA – VENTES – TEST HUMAIN
- Objectif : Conversions – Ventes site web
- Activer CBO (Campaign Budget Optimization)
- Budget : 5 $ / jour
- Créer 5 adsets Broad identiques avec la même vidéo
- Ne pas publier encore

JOUR 3 - CRÉER LA CRÉATIVE ANDROMEDA :
Créer la créative Andromeda, le cœur de votre campagne :
- Vidéo verticale 9:16 – Durée : 20 à 30 secondes
- Hook fort dans les 2 premières secondes pour captiver immédiatement
- Structure : Problème → Révélation → Preuve → Promesse → CTA
- Optimiser chaque élément pour maximiser l'engagement
- Créer une vidéo qui convertit efficacement
- Outils utilisés : Sora 2 et Eleven Labs pour la création

JOUR 4 - PARAMÉTRER LE COMPTE PUBLICITAIRE :
Configuration essentielle du compte publicitaire Facebook :
- Devise : HKD – Dollar Hong Kong
- Ajouter la carte bancaire au compte
- Créder 25 $ (budget pour 5 jours à 5$/jour)
- Installer le Pixel Meta sur votre site web
- Configurer l'événement Purchase (achat) dans le Pixel
- Vérifier que le tracking fonctionne correctement
- Créer le Business Manager
- Configurer le Pixel pour le tracking des conversions

JOUR 5 - LANCEMENT :
Activation de la campagne Andromeda :
- Activer la campagne préparée
- Ne rien modifier - Laisser l'algorithme apprendre
- Observer uniquement les ventes générées
- Noter les premiers résultats sans intervenir
- Laisser tourner au moins 24h sans modification

JOUR 6 - ANALYSE ET OPTIMISATION :
Analyse des premiers résultats après 2 jours :
- Ne couper aucune publicité à ce stade
- Noter : Les adsets qui génèrent des achats
- Noter : Les adsets complètement ignorés (0 engagement)
- Analyser les métriques sans modifier
- Laisser l'algorithme continuer son apprentissage
- Observer les tendances émergentes

JOUR 7 - MINI SCALING :
Première optimisation après 3 jours :
- Couper uniquement les adsets totalement morts (0 engagement, 0 résultat)
- Augmenter le budget de la campagne de +20 % maximum
- Ne pas modifier les adsets qui génèrent des résultats
- Maintenir un budget raisonnable pour continuer l'apprentissage
- Observer l'impact de ces modifications sur les performances
- Laisser tourner 24h avant toute nouvelle modification

JOUR 8 - RÉSERVATION COACHING :
Après avoir terminé la formation, les utilisateurs peuvent réserver une session de coaching personnalisée :
- Session de coaching individuelle pour optimiser les résultats
- Accompagnement dans la prise de décisions stratégiques
- Analyse personnalisée de leur campagne Andromeda
- Réponse aux questions spécifiques de chaque utilisateur
- Aide à l'optimisation et au scaling de leur campagne

PRINCIPES CLÉS DE LA MÉTHODE ANDROMEDA :
- Budget initial : 5 $ par jour pour la phase de test
- Ciblage : Broad (large) avec 5 adsets identiques
- CBO : Activé pour répartir automatiquement le budget
- Scaling : Progressif (+20% maximum par étape)
- L'algorithme doit apprendre sans intervention les premières 24h
- Ne couper que les adsets complètement morts
- Observer avant d'intervenir

Utilise ce contenu pour répondre précisément aux questions des utilisateurs sur la formation.`

export default function Chatbot() {
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

    const userMessage = { role: 'user', content: message }
    setMessages(prev => [...prev, userMessage])
    conversationHistoryRef.current.push(userMessage)
    setInput('')
    setLoading(true)

    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationHistory: conversationHistoryRef.current
        })
      })

      if (!response.ok) {
        throw new Error('Erreur API')
      }

      const data = await response.json()
      const botMessage = data.reply || data.choices?.[0]?.message?.content || 'Désolé, je n\'ai pas pu traiter votre demande.'

      setMessages(prev => [...prev, { role: 'bot', content: botMessage }])
      conversationHistoryRef.current.push({ role: 'assistant', content: botMessage })
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: '❌ Erreur de connexion. Vérifiez votre connexion internet et que le backend est démarré.' 
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
    <>
      <button 
        className="chatbot-toggle" 
        aria-label="Ouvrir le chat"
        onClick={() => setIsOpen(!isOpen)}
      >
        💬
      </button>
      <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
        <div className="chatbot-header">
          <h3>💬 Support Formation</h3>
          <button 
            className="chatbot-close" 
            aria-label="Fermer le chat"
            onClick={() => setIsOpen(false)}
          >
            ×
          </button>
        </div>
        <div className="chatbot-notification">
          <strong>💡 Astuce :</strong> Pour des questions personnalisées, contactez directement Morgan !
        </div>
        <div className="chatbot-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chatbot-message ${msg.role}`}>
              <div className="chatbot-avatar">
                {msg.role === 'bot' ? '🤖' : '👤'}
              </div>
              <div className="chatbot-content">{msg.content}</div>
            </div>
          ))}
          {loading && (
            <div className="chatbot-message bot">
              <div className="chatbot-avatar">🤖</div>
              <div className="chatbot-content">En train de réfléchir...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="chatbot-input-container">
          <input
            type="text"
            className="chatbot-input"
            placeholder="Tapez votre question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <button 
            className="chatbot-send" 
            onClick={sendMessage}
            disabled={loading}
          >
            Envoyer
          </button>
        </div>
      </div>
    </>
  )
}

