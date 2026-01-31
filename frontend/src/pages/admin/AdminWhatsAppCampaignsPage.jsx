import { useState, useEffect } from 'react'
import { CONFIG } from '../../config/config'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminWhatsAppCampaignsPage() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendingWelcome, setSendingWelcome] = useState(false)
  const [sendingRelance, setSendingRelance] = useState(false)
  const [sendingPartenaires, setSendingPartenaires] = useState(false)
  const [notification, setNotification] = useState(null)
  const [stats, setStats] = useState(null)
  const [sendResults, setSendResults] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  
  const [formData, setFormData] = useState({
    message: '',
    variant1: '',
    variant2: '',
    variant3: '',
    tag: 'active',
    recipientMode: 'tag',
    customPhones: '',
    fromPhone: ''
  })

  // Prévisualisation / sélection des numéros avant envoi
  const [recipientReviewOpen, setRecipientReviewOpen] = useState(false)
  const [recipientReviewLoading, setRecipientReviewLoading] = useState(false)
  const [recipientReviewItems, setRecipientReviewItems] = useState([]) // [{ phone, firstName, valid, selected }]
  const [pendingSendPayload, setPendingSendPayload] = useState(null) // { message, variants, fromPhone }
  
  // Liste des utilisateurs avec numéros pour sélection manuelle
  const [usersWithPhones, setUsersWithPhones] = useState([])
  const [loadingUsersWithPhones, setLoadingUsersWithPhones] = useState(false)
  const [searchUsers, setSearchUsers] = useState('')
  
  const [welcomeCampaign, setWelcomeCampaign] = useState({
    variant1: '[PRENOM], bienvenue sur Ecom Starter 3.0 ! 🎉\n\nNous sommes ravis de vous compter parmi nous. Vous avez maintenant accès à toutes les fonctionnalités de la plateforme : formation e-commerce complète, liste de livreurs et fournisseurs, générateur de produits gagnants, coaching personnalisé et tous les outils essentiels pour créer un business rentable.\n\nExplorez votre espace : https://www.safitech.shop/',
    variant2: 'Salut [PRENOM] ! 👋\n\nBienvenue dans Ecom Starter 3.0 ! Vous avez maintenant accès à toutes nos fonctionnalités premium : formation e-commerce complète, liste de livreurs et fournisseurs, générateur de produits gagnants, accompagnement personnalisé et ressources exclusives.\n\nDécouvrez la plateforme : https://www.safitech.shop/',
    variant3: 'Bonjour [PRENOM] et bienvenue sur Ecom Starter 3.0 ! 🌟\n\nFélicitations pour votre inscription ! Vous pouvez maintenant accéder à toutes les fonctionnalités de la plateforme : formation e-commerce, liste de livreurs et fournisseurs, générateur de produits gagnants, coaching et support dédié.\n\nAccédez à votre espace : https://www.safitech.shop/',
    enabled: false
  })
  
  const [relanceCampaign, setRelanceCampaign] = useState({
    variant1: 'Bonjour [PRENOM] ! 👋\n\nVotre compte Ecom Starter 3.0 est en attente d\'activation.\n\nBonne nouvelle : vous pouvez obtenir un accès gratuit à toutes les fonctionnalités (formation e-commerce, liste de livreurs et fournisseurs, générateur de produits gagnants) en partageant votre lien d\'affiliation !\n\nRécupérez votre lien dans votre profil : https://www.safitech.shop/profil',
    variant2: 'Salut [PRENOM] ! 😊\n\nVotre compte Ecom Starter 3.0 est en attente, mais nous avons une offre spéciale pour vous !\n\nPartagez votre lien d\'affiliation et obtenez un accès gratuit à toutes les fonctionnalités : formation e-commerce, liste de livreurs et fournisseurs, générateur de produits gagnants. C\'est simple et rapide !\n\nRécupérez votre lien dans votre profil : https://www.safitech.shop/profil',
    variant3: 'Hello [PRENOM] ! 🌟\n\nActivez votre compte Ecom Starter 3.0 dès maintenant !\n\nProfitez d\'un accès gratuit à toutes les fonctionnalités (formation e-commerce, liste de livreurs et fournisseurs, générateur de produits gagnants) en partageant votre lien d\'affiliation avec vos proches. Plus vous partagez, plus vous bénéficiez !\n\nRécupérez votre lien dans votre profil : https://www.safitech.shop/profil',
    enabled: false
  })
  
  const [partenairesCampaign, setPartenairesCampaign] = useState({
    variant1: 'Bonjour [PRENOM] ! 👋\n\nDécouvrez notre réseau de partenaires fiables sur Ecom Starter 3.0 !\n\nAccédez à une liste complète de livreurs, fournisseurs et agences vérifiés pour développer votre activité e-commerce.\n\nConsultez les partenaires : https://www.safitech.shop/partenaires',
    variant2: 'Salut [PRENOM] ! 🚀\n\nBesoin de partenaires pour votre e-commerce ?\n\nExplorez notre annuaire de partenaires professionnels : livreurs, fournisseurs, agences de livraison. Tous vérifiés et notés par la communauté.\n\nVoir les partenaires : https://www.safitech.shop/partenaires',
    variant3: 'Hello [PRENOM] ! 💼\n\nTrouvez les meilleurs partenaires pour votre business e-commerce !\n\nNotre plateforme regroupe des centaines de partenaires fiables : livreurs, fournisseurs, agences. Filtrez par catégorie, localisation et note.\n\nDécouvrir les partenaires : https://www.safitech.shop/partenaires',
    enabled: false
  })

  useEffect(() => {
    if (token) {
      fetchStats()
      fetchCampaigns()
      
      // Vérifier s'il y a une campagne en cours de suivi
      const savedCampaignId = localStorage.getItem('trackingWhatsAppCampaignId')
      if (savedCampaignId) {
        setTrackingCampaignId(savedCampaignId)
        startTracking(savedCampaignId)
      }
    }
    
    return () => {
      if (trackingInterval) {
        clearInterval(trackingInterval)
      }
    }
  }, [token])
  
  const startTracking = (campaignId) => {
    if (trackingInterval) {
      clearInterval(trackingInterval)
    }
    
    const fetchCampaignStatus = async () => {
      try {
        const response = await fetch(`${CONFIG.BACKEND_URL}/api/whatsapp-campaigns/${campaignId}/status`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (response.ok) {
          const data = await response.json()
          setCampaignDetails(data)
          
          // Si la campagne est terminée, arrêter le suivi
          if (data.campaign.status === 'sent' || data.campaign.status === 'failed') {
            stopTracking()
            localStorage.removeItem('trackingWhatsAppCampaignId')
          }
        }
      } catch (error) {
        console.error('Erreur suivi campagne:', error)
      }
    }
    
    fetchCampaignStatus() // Appel immédiat
    const interval = setInterval(fetchCampaignStatus, 3000) // Toutes les 3 secondes
    setTrackingInterval(interval)
  }
  
  const stopTracking = () => {
    if (trackingInterval) {
      clearInterval(trackingInterval)
      setTrackingInterval(null)
    }
    setTrackingCampaignId(null)
  }

  useEffect(() => {
    if (formData.recipientMode === 'list' && token) {
      fetchUsersWithPhones()
    }
  }, [formData.recipientMode, token])

  const fetchUsersWithPhones = async () => {
    if (!token) return
    setLoadingUsersWithPhones(true)
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/whatsapp-campaigns/users-with-phones?search=${encodeURIComponent(searchUsers)}&limit=1000`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setUsersWithPhones(data.contacts || [])
      }
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error)
    } finally {
      setLoadingUsersWithPhones(false)
    }
  }

  const fetchStats = async () => {
    if (!token) return
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/subscribers/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Erreur stats:', error)
    }
  }

  const fetchCampaigns = async () => {
    if (!token) return
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/whatsapp-campaigns`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error('Erreur récupération campagnes:', error)
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const parseCustomPhones = (text) => {
    if (!text || !text.trim()) return []
    const parts = text.split(/[\n,;]+/g).map(s => (s || '').toString().trim()).filter(Boolean)
    const digits = parts.map(s => s.replace(/\D/g, '')).filter(Boolean)
    return Array.from(new Set(digits))
  }

  const isValidPreviewPhone = (digits) => {
    if (!digits) return false
    return digits.length >= 8 && digits.length <= 15
  }

  const setAllRecipientsSelected = (selected) => {
    setRecipientReviewItems(prev => prev.map(item => ({ ...item, selected })))
  }

  const prepareWelcomeCampaign = async (variants) => {
    setSendingWelcome(true)
    setRecipientReviewLoading(true)
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/whatsapp-campaigns/recipients-preview?tag=active`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erreur récupération destinataires')
      }

      const data = await response.json()
      const contacts = data.contacts || []
      const items = contacts.map(c => ({
        phone: c.phone,
        firstName: c.firstName || '',
        name: '',
        email: '',
        valid: c.valid !== false,
        selected: c.valid !== false
      }))

      if (!items || items.length === 0) {
        showNotification('Aucun utilisateur actif avec numéro trouvé', 'error')
        return
      }

      setPendingSendPayload({
        message: null,
        variants: variants,
        fromPhone: ''
      })

      setRecipientReviewItems(items)
      setRecipientReviewOpen(true)
    } catch (error) {
      console.error('Erreur préparation campagne de bienvenue:', error)
      showNotification(error.message || 'Erreur lors de la préparation', 'error')
    } finally {
      setSendingWelcome(false)
      setRecipientReviewLoading(false)
    }
  }

  const prepareRelanceCampaign = async (variants) => {
    setSendingRelance(true)
    setRecipientReviewLoading(true)
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/whatsapp-campaigns/recipients-preview?tag=pending`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erreur récupération destinataires')
      }

      const data = await response.json()
      const contacts = data.contacts || []
      const items = contacts.map(c => ({
        phone: c.phone,
        firstName: c.firstName || '',
        name: '',
        email: '',
        valid: c.valid !== false,
        selected: c.valid !== false
      }))

      if (!items || items.length === 0) {
        showNotification('Aucun utilisateur en attente avec numéro trouvé', 'error')
        return
      }

      setPendingSendPayload({
        message: null,
        variants: variants,
        fromPhone: ''
      })

      setRecipientReviewItems(items)
      setRecipientReviewOpen(true)
    } catch (error) {
      console.error('Erreur préparation campagne de relance:', error)
      showNotification(error.message || 'Erreur lors de la préparation', 'error')
    } finally {
      setSendingRelance(false)
      setRecipientReviewLoading(false)
    }
  }

  const preparePartenairesCampaign = async (variants) => {
    setSendingPartenaires(true)
    setRecipientReviewLoading(true)
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/whatsapp-campaigns/recipients-preview?tag=all`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erreur récupération destinataires')
      }

      const data = await response.json()
      const contacts = data.contacts || []
      const items = contacts.map(c => ({
        phone: c.phone,
        firstName: c.firstName || '',
        name: '',
        email: '',
        valid: c.valid !== false,
        selected: c.valid !== false
      }))

      if (!items || items.length === 0) {
        showNotification('Aucun utilisateur avec numéro trouvé', 'error')
        return
      }

      setPendingSendPayload({
        message: null,
        variants: variants,
        fromPhone: ''
      })

      setRecipientReviewItems(items)
      setRecipientReviewOpen(true)
    } catch (error) {
      console.error('Erreur préparation campagne partenaires:', error)
      showNotification(error.message || 'Erreur lors de la préparation', 'error')
    } finally {
      setSendingPartenaires(false)
      setRecipientReviewLoading(false)
    }
  }

  const getTagCount = (tag) => {
    if (!stats) return 0
    if (tag === 'active') return stats.byUserStatus?.active || 0
    if (tag === 'pending') return stats.byUserStatus?.pending || 0
    if (tag === 'blocked') return stats.byUserStatus?.blocked || 0
    if (tag === 'all') {
      // Compter tous les utilisateurs avec un numéro de téléphone
      return stats.usersWithPhone || stats.active || 0
    }
    return 0
  }

  const handleReloadCampaign = async (campaign) => {
    setRecipientReviewLoading(true)
    try {
      // Récupérer les logs de la campagne pour obtenir les numéros
      const verifyResponse = await fetch(`${CONFIG.BACKEND_URL}/api/whatsapp-campaigns/${campaign._id}/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erreur récupération campagne')
      }

      const verifyData = await verifyResponse.json()
      const logs = verifyData.logs || []
      
      // Extraire les numéros uniques depuis les logs
      const phoneSet = new Set()
      logs.forEach(log => {
        if (log.phone) {
          phoneSet.add(log.phone)
        }
      })

      if (phoneSet.size === 0) {
        showNotification('Aucun numéro trouvé pour cette campagne', 'error')
        return
      }

      // Récupérer les détails des utilisateurs depuis l'API
      const phonesArray = Array.from(phoneSet)
      const usersResponse = await fetch(`${CONFIG.BACKEND_URL}/api/whatsapp-campaigns/users-with-phones?limit=10000`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      let usersMap = new Map()
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        const users = usersData.contacts || []
        users.forEach(u => {
          if (u.phone) {
            usersMap.set(u.phone, u)
          }
        })
      }

      // Créer les items avec les informations des utilisateurs
      const items = phonesArray.map(phone => {
        const user = usersMap.get(phone)
        return {
          phone,
          firstName: user?.firstName || '',
          name: user?.name || '',
          email: user?.email || '',
          valid: true,
          selected: true
        }
      })

      // Préparer le payload avec les variantes/message de la campagne originale
      setPendingSendPayload({
        message: campaign.message || null,
        variants: campaign.variants && campaign.variants.length > 0 ? campaign.variants : null,
        fromPhone: campaign.fromPhone || ''
      })

      setRecipientReviewItems(items)
      setRecipientReviewOpen(true)
    } catch (error) {
      console.error('Erreur rechargement campagne:', error)
      showNotification(error.message || 'Erreur lors du rechargement', 'error')
    } finally {
      setRecipientReviewLoading(false)
    }
  }

  const createAndSendCampaign = async ({ message, variants, recipients, fromPhone }) => {
    setSending(true)
    try {
      const campaignResponse = await fetch(`${CONFIG.BACKEND_URL}/api/whatsapp-campaigns`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `Newsletter ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
          message: message ? message.trim() : null,
          variants: variants && Array.isArray(variants) && variants.length > 0 ? variants : null,
          recipients,
          fromPhone: fromPhone || ''
        })
      })

      if (!campaignResponse.ok) {
        const errorData = await campaignResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erreur création campagne')
      }

      const campaignData = await campaignResponse.json()
      const campaignId = campaignData.campaign._id
      
      // Démarrer le suivi de la campagne
      setTrackingCampaignId(campaignId)
      localStorage.setItem('trackingWhatsAppCampaignId', campaignId)
      startTracking(campaignId)

      const sendResponse = await fetch(`${CONFIG.BACKEND_URL}/api/whatsapp-campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!sendResponse.ok) {
        const errorData = await sendResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erreur envoi')
      }

      const sendData = await sendResponse.json()
      const results = sendData.details || sendData.stats || {}

      let phoneNumbers = sendData.details?.sentPhones || results.sentPhones || []
      if (phoneNumbers.length === 0) {
        try {
          const verifyResponse = await fetch(`${CONFIG.BACKEND_URL}/api/whatsapp-campaigns/${campaignId}/verify`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (verifyResponse.ok) {
            const verifyData = await verifyResponse.json()
            const logs = verifyData.logs || []
            phoneNumbers = logs
              .filter(log => log.status === 'sent' || log.status === 'delivered')
              .map(log => log.phone)
              .filter(Boolean)
          }
        } catch (err) {
          console.error('Erreur récupération numéros:', err)
        }
      }

      setSendResults({
        total: results.total || sendData.stats?.total || 0,
        sent: results.sent || 0,
        failed: results.failed || 0,
        skipped: results.skipped || 0,
        confirmed: results.confirmed || 0,
        delivered: results.delivered || 0,
        read: results.read || 0,
        quotaReached: results.quotaReached || false,
        failedPhones: results.failedPhones || [],
        phoneNumbers
      })

      setTimeout(async () => {
        try {
          const verifyResponse = await fetch(`${CONFIG.BACKEND_URL}/api/whatsapp-campaigns/${campaignId}/verify`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (verifyResponse.ok) {
            const verifyData = await verifyResponse.json()
            setSendResults(prev => ({
              ...prev,
              confirmed: verifyData.stats?.confirmed || prev?.confirmed || 0,
              delivered: verifyData.stats?.delivered || 0,
              read: verifyData.stats?.read || 0
            }))
          }
        } catch (err) {
          console.error('Erreur vérification:', err)
        }
      }, 2000)

      const totalSent = results.sent || sendData.stats?.sent || 0
      const totalDest = results.total || sendData.stats?.total || 0
      showNotification(`✅ Message WhatsApp envoyé: ${totalSent}/${totalDest} messages`, 'success')

      setFormData({
        message: '',
        variant1: '',
        variant2: '',
        variant3: '',
        tag: 'active',
        recipientMode: 'tag',
        customPhones: '',
        fromPhone: ''
      })

      fetchStats()
      fetchCampaigns()
    } catch (error) {
      console.error('Erreur envoi message WhatsApp:', error)
      showNotification(error.message || 'Erreur lors de l\'envoi', 'error')
    } finally {
      setSending(false)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()

    const hasMessage = formData.message && formData.message.trim()
    const variants = [
      formData.variant1?.trim(),
      formData.variant2?.trim(),
      formData.variant3?.trim()
    ].filter(v => v && v.length > 0)

    if (!hasMessage && variants.length === 0) {
      showNotification('Au moins un message ou une variante doit être fourni', 'error')
      return
    }

    setRecipientReviewLoading(true)
    try {
      let items = []

      if (formData.recipientMode === 'list') {
        if (usersWithPhones.length === 0) {
          showNotification('Aucun utilisateur avec numéro trouvé. Chargez d\'abord la liste.', 'error')
          return
        }
        items = usersWithPhones
          .filter(u => u.valid !== false)
          .map(u => ({
            phone: u.phone,
            firstName: u.firstName || '',
            name: u.name || '',
            email: u.email || '',
            valid: true,
            selected: true
          }))
      } else {
        const response = await fetch(`${CONFIG.BACKEND_URL}/api/whatsapp-campaigns/recipients-preview?tag=${encodeURIComponent(formData.tag)}`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Erreur récupération destinataires')
        }

        const data = await response.json()
        const contacts = data.contacts || []
        items = contacts.map(c => ({
          phone: c.phone,
          firstName: c.firstName || '',
          name: '',
          email: '',
          valid: c.valid !== false,
          selected: c.valid !== false
        }))
      }

      if (!items || items.length === 0) {
        showNotification('Aucun numéro trouvé pour cette sélection', 'error')
        return
      }

      setPendingSendPayload({
        message: hasMessage ? formData.message.trim() : null,
        variants: variants.length > 0 ? variants : null,
        fromPhone: formData.fromPhone || ''
      })

      setRecipientReviewItems(items)
      setRecipientReviewOpen(true)
    } catch (error) {
      console.error('Erreur préparation destinataires:', error)
      showNotification(error.message || 'Erreur lors de la préparation', 'error')
    } finally {
      setRecipientReviewLoading(false)
    }
  }

  const confirmSendSelectedRecipients = async () => {
    if (!pendingSendPayload) {
      showNotification('Aucune donnée à envoyer', 'error')
      return
    }

    const selectedPhones = (recipientReviewItems || []).filter(i => i.selected).map(i => i.phone)
    if (selectedPhones.length === 0) {
      showNotification('Sélectionnez au moins un numéro avant d\'envoyer', 'error')
      return
    }

    setRecipientReviewOpen(false)
    setRecipientReviewItems([])

    const recipients = { type: 'list', customPhones: selectedPhones }
    await createAndSendCampaign({ ...pendingSendPayload, recipients })
    setPendingSendPayload(null)
    
    // Réinitialiser les états des campagnes prédéfinies
    setSendingWelcome(false)
    setSendingRelance(false)
    setSendingPartenaires(false)
  }

  const tagLabels = {
    active: '✅ Actifs',
    pending: '⏳ En attente',
    blocked: '❌ Inactifs',
    all: '📱 Tous'
  }

  return (
    <div className="admin-comments-page">
      {notification && (
        <div className={`admin-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {recipientReviewOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => {
            if (!sending) {
              setRecipientReviewOpen(false)
              setRecipientReviewItems([])
              setPendingSendPayload(null)
            }
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '760px',
              background: '#fff',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px', borderBottom: '1px solid #eee' }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>✅ Sélection des numéros avant envoi</h2>
              <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#6c757d' }}>
                Sélectionnés : <strong>{recipientReviewItems.filter(i => i.selected).length}</strong> / {recipientReviewItems.length}
              </p>
            </div>

            <div style={{ padding: '12px 16px', display: 'flex', gap: '8px', flexWrap: 'wrap', borderBottom: '1px solid #f1f1f1' }}>
              <button
                type="button"
                className="admin-btn"
                disabled={sending}
                onClick={() => setAllRecipientsSelected(true)}
                style={{ padding: '8px 10px', fontSize: '13px' }}
              >
                Tout sélectionner
              </button>
              <button
                type="button"
                className="admin-btn"
                disabled={sending}
                onClick={() => setAllRecipientsSelected(false)}
                style={{ padding: '8px 10px', fontSize: '13px' }}
              >
                Tout désélectionner
              </button>
            </div>

            <div style={{ padding: '12px 16px', maxHeight: '420px', overflow: 'auto' }}>
              {recipientReviewItems.map((item) => (
                <label
                  key={item.phone}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 8px',
                    borderBottom: '1px solid #f5f5f5',
                    cursor: sending ? 'not-allowed' : 'pointer',
                    opacity: sending ? 0.6 : 1
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!item.selected}
                    disabled={sending}
                    onChange={() => {
                      setRecipientReviewItems(prev =>
                        prev.map(p => (p.phone === item.phone ? { ...p, selected: !p.selected } : p))
                      )
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: '600' }}>{item.phone}</span>
                      {item.name ? (
                        <span style={{ fontSize: '13px', color: '#333', fontWeight: '500' }}>{item.name}</span>
                      ) : item.firstName ? (
                        <span style={{ fontSize: '12px', color: '#6c757d' }}>{item.firstName}</span>
                      ) : null}
                      {item.email && (
                        <span style={{ fontSize: '11px', color: '#999' }}>{item.email}</span>
                      )}
                      {item.valid === false ? (
                        <span style={{ fontSize: '12px', color: '#d9534f', fontWeight: '600' }}>Invalide</span>
                      ) : null}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div style={{ padding: '16px', borderTop: '1px solid #eee', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="admin-btn"
                disabled={sending}
                onClick={() => {
                  setRecipientReviewOpen(false)
                  setRecipientReviewItems([])
                  setPendingSendPayload(null)
                }}
                style={{ padding: '10px 14px', fontSize: '14px' }}
              >
                Annuler
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-success"
                disabled={sending || recipientReviewItems.filter(i => i.selected).length === 0}
                onClick={confirmSendSelectedRecipients}
                style={{ padding: '10px 14px', fontSize: '14px' }}
              >
                {sending ? '⏳ Envoi...' : `📤 Envoyer (${recipientReviewItems.filter(i => i.selected).length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-page-header">
        <div>
          <h1>📱 Campagnes WhatsApp</h1>
          <p>Envoyer des messages WhatsApp automatiques à un tag spécifique</p>
        </div>
        {stats && (
          <div className="admin-comments-stats">
            <div className="admin-stat-mini">
              <span className="admin-stat-mini-label">Total</span>
              <span className="admin-stat-mini-value">{stats.total || 0}</span>
            </div>
            <div className="admin-stat-mini">
              <span className="admin-stat-mini-label">Actifs</span>
              <span className="admin-stat-mini-value">{stats.active || 0}</span>
            </div>
          </div>
        )}
      </div>

      {/* Campagnes automatiques */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Campagne de Bienvenue */}
        <div style={{ padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '2px solid #4caf50' }}>
          <h2 style={{ marginBottom: '16px', fontSize: '18px', color: '#2e7d32', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🎉 Campagne de Bienvenue
          </h2>
          <p style={{ fontSize: '13px', color: '#6c757d', marginBottom: '16px' }}>
            Envoie automatiquement un message de bienvenue à tous les utilisateurs <strong>actifs</strong> lors de l'activation.
          </p>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>Variante 1 *</label>
            <textarea
              value={welcomeCampaign.variant1}
              onChange={(e) => setWelcomeCampaign({ ...welcomeCampaign, variant1: e.target.value })}
              rows="3"
              placeholder="Message de bienvenue variante 1..."
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
            />
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>Variante 2 (optionnel)</label>
            <textarea
              value={welcomeCampaign.variant2}
              onChange={(e) => setWelcomeCampaign({ ...welcomeCampaign, variant2: e.target.value })}
              rows="3"
              placeholder="Message de bienvenue variante 2..."
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>Variante 3 (optionnel)</label>
            <textarea
              value={welcomeCampaign.variant3}
              onChange={(e) => setWelcomeCampaign({ ...welcomeCampaign, variant3: e.target.value })}
              rows="3"
              placeholder="Message de bienvenue variante 3..."
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
            />
          </div>
          
          <button
            onClick={async () => {
              const variants = [
                welcomeCampaign.variant1?.trim(),
                welcomeCampaign.variant2?.trim(),
                welcomeCampaign.variant3?.trim()
              ].filter(v => v && v.length > 0)
              
              if (variants.length === 0) {
                showNotification('Au moins une variante doit être fournie', 'error')
                return
              }
              
              await prepareWelcomeCampaign(variants)
            }}
            disabled={sendingWelcome}
            className="admin-btn admin-btn-success"
            style={{ width: '100%', fontSize: '14px', padding: '10px', backgroundColor: '#4caf50', color: 'white', border: 'none', opacity: sendingWelcome ? 0.6 : 1 }}
          >
            {sendingWelcome ? '⏳ Envoi en cours...' : '📤 Envoyer'}
          </button>
        </div>

        {/* Campagne de Relance */}
        <div style={{ padding: '20px', backgroundColor: '#fff3e0', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '2px solid #ff9800' }}>
          <h2 style={{ marginBottom: '16px', fontSize: '18px', color: '#e65100', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔄 Campagne de Relance
          </h2>
          <p style={{ fontSize: '13px', color: '#6c757d', marginBottom: '16px' }}>
            Envoie un message aux utilisateurs <strong>en attente</strong> leur indiquant qu'ils peuvent avoir un accès gratuit s'ils partagent un lien d'affiliation.
          </p>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>Variante 1 *</label>
            <textarea
              value={relanceCampaign.variant1}
              onChange={(e) => setRelanceCampaign({ ...relanceCampaign, variant1: e.target.value })}
              rows="3"
              placeholder="Message de relance variante 1 (mentionner l'accès gratuit avec lien d'affiliation)..."
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
            />
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>Variante 2 (optionnel)</label>
            <textarea
              value={relanceCampaign.variant2}
              onChange={(e) => setRelanceCampaign({ ...relanceCampaign, variant2: e.target.value })}
              rows="3"
              placeholder="Message de relance variante 2..."
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>Variante 3 (optionnel)</label>
            <textarea
              value={relanceCampaign.variant3}
              onChange={(e) => setRelanceCampaign({ ...relanceCampaign, variant3: e.target.value })}
              rows="3"
              placeholder="Message de relance variante 3..."
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
            />
          </div>
          
          <button
            onClick={async () => {
              const variants = [
                relanceCampaign.variant1?.trim(),
                relanceCampaign.variant2?.trim(),
                relanceCampaign.variant3?.trim()
              ].filter(v => v && v.length > 0)
              
              if (variants.length === 0) {
                showNotification('Au moins une variante doit être fournie', 'error')
                return
              }
              
              await prepareRelanceCampaign(variants)
            }}
            disabled={sendingRelance}
            className="admin-btn"
            style={{ width: '100%', fontSize: '14px', padding: '10px', backgroundColor: '#ff9800', color: 'white', border: 'none', opacity: sendingRelance ? 0.6 : 1 }}
          >
            {sendingRelance || recipientReviewLoading ? '⏳ Préparation...' : '📤 Choisir les numéros'}
          </button>
        </div>

        {/* Campagne Partenaires */}
        <div style={{ padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '2px solid #2196f3' }}>
          <h2 style={{ marginBottom: '16px', fontSize: '18px', color: '#1565c0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🤝 Campagne Partenaires
          </h2>
          <p style={{ fontSize: '13px', color: '#6c757d', marginBottom: '16px' }}>
            Envoie un message à <strong>tous les utilisateurs</strong> pour les inviter à consulter la liste des partenaires disponibles sur la plateforme.
          </p>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>Variante 1 *</label>
            <textarea
              value={partenairesCampaign.variant1}
              onChange={(e) => setPartenairesCampaign({ ...partenairesCampaign, variant1: e.target.value })}
              rows="3"
              placeholder="Message partenaires variante 1..."
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
            />
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>Variante 2 (optionnel)</label>
            <textarea
              value={partenairesCampaign.variant2}
              onChange={(e) => setPartenairesCampaign({ ...partenairesCampaign, variant2: e.target.value })}
              rows="3"
              placeholder="Message partenaires variante 2..."
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>Variante 3 (optionnel)</label>
            <textarea
              value={partenairesCampaign.variant3}
              onChange={(e) => setPartenairesCampaign({ ...partenairesCampaign, variant3: e.target.value })}
              rows="3"
              placeholder="Message partenaires variante 3..."
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
            />
          </div>
          
          <button
            onClick={async () => {
              const variants = [
                partenairesCampaign.variant1?.trim(),
                partenairesCampaign.variant2?.trim(),
                partenairesCampaign.variant3?.trim()
              ].filter(v => v && v.length > 0)
              
              if (variants.length === 0) {
                showNotification('Au moins une variante doit être fournie', 'error')
                return
              }
              
              await preparePartenairesCampaign(variants)
            }}
            disabled={sendingPartenaires || recipientReviewLoading}
            className="admin-btn"
            style={{ width: '100%', fontSize: '14px', padding: '10px', backgroundColor: '#2196f3', color: 'white', border: 'none', opacity: (sendingPartenaires || recipientReviewLoading) ? 0.6 : 1 }}
          >
            {sendingPartenaires || recipientReviewLoading ? '⏳ Préparation...' : '📤 Choisir les numéros'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginBottom: '20px', fontSize: '18px' }}>Nouveau Message WhatsApp</h2>
          <form onSubmit={handleSend}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Destinataires *</label>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="recipientMode"
                    checked={formData.recipientMode === 'tag'}
                    onChange={() => setFormData({ ...formData, recipientMode: 'tag' })}
                  />
                  Par tag
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="recipientMode"
                    checked={formData.recipientMode === 'list'}
                    onChange={() => setFormData({ ...formData, recipientMode: 'list' })}
                  />
                  Par numéros
                </label>
              </div>
              {formData.recipientMode === 'tag' ? (
                <>
                  <select
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  >
                    <option value="active">✅ Actifs</option>
                    <option value="pending">⏳ En attente</option>
                    <option value="blocked">❌ Inactifs</option>
                    <option value="all">📱 Tous les utilisateurs</option>
                  </select>
                  <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                    {getTagCount(formData.tag)} utilisateurs recevront ce message
                  </p>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        value={searchUsers}
                        onChange={(e) => {
                          setSearchUsers(e.target.value)
                          setTimeout(() => fetchUsersWithPhones(), 300)
                        }}
                        placeholder="Rechercher par nom, email ou numéro..."
                        style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                      />
                      <button
                        type="button"
                        onClick={fetchUsersWithPhones}
                        disabled={loadingUsersWithPhones}
                        className="admin-btn"
                        style={{ padding: '8px 12px', fontSize: '13px' }}
                      >
                        {loadingUsersWithPhones ? '⏳' : '🔄'}
                      </button>
                    </div>
                    <p style={{ fontSize: '12px', color: '#6c757d' }}>
                      {loadingUsersWithPhones ? 'Chargement...' : `${usersWithPhones.length} utilisateur(s) avec numéro trouvé(s)`}
                    </p>
                  </div>
                  
                  <div style={{ 
                    maxHeight: '300px', 
                    overflow: 'auto', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px', 
                    padding: '8px',
                    backgroundColor: '#f9f9f9'
                  }}>
                    {usersWithPhones.length === 0 ? (
                      <p style={{ textAlign: 'center', color: '#6c757d', padding: '20px' }}>
                        {loadingUsersWithPhones ? 'Chargement...' : 'Aucun utilisateur avec numéro trouvé'}
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {usersWithPhones.map((user) => (
                          <div
                            key={user.phone}
                            style={{
                              padding: '6px 8px',
                              backgroundColor: '#fff',
                              borderRadius: '4px',
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <span style={{ fontFamily: 'monospace', fontWeight: '600', minWidth: '140px' }}>
                              {user.phone}
                            </span>
                            {user.name && (
                              <span style={{ color: '#6c757d', flex: 1 }}>{user.name}</span>
                            )}
                            {user.email && (
                              <span style={{ color: '#999', fontSize: '12px' }}>{user.email}</span>
                            )}
                            {user.valid === false && (
                              <span style={{ fontSize: '11px', color: '#d9534f', fontWeight: '600' }}>Invalide</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '8px' }}>
                    💡 Cliquez sur "Choisir les numéros" pour sélectionner les destinataires depuis cette liste
                  </p>
                </>
              )}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                Message unique (optionnel si variantes utilisées)
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows="4"
                placeholder="Message unique si vous n'utilisez pas les variantes... Utilisez [PRENOM] pour personnaliser avec le prénom de l'utilisateur."
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
              />
              <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                💡 Utilisez <strong>[PRENOM]</strong> pour inclure automatiquement le prénom de chaque destinataire
              </p>
            </div>

            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f0f7ff', borderRadius: '6px', border: '1px solid #b3d9ff' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#0066cc' }}>
                📝 Variantes de message (recommandé)
              </label>
              <p style={{ fontSize: '12px', color: '#0066cc', marginBottom: '12px' }}>
                Créez 1 à 3 variantes. Chaque contact recevra une variante choisie aléatoirement pour un envoi plus naturel.
              </p>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>Variante 1 *</label>
                <textarea
                  value={formData.variant1}
                  onChange={(e) => setFormData({ ...formData, variant1: e.target.value })}
                  rows="4"
                  placeholder="Première variante du message... Utilisez [PRENOM] pour personnaliser."
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                />
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>Variante 2 (optionnel)</label>
                <textarea
                  value={formData.variant2}
                  onChange={(e) => setFormData({ ...formData, variant2: e.target.value })}
                  rows="4"
                  placeholder="Deuxième variante du message... Utilisez [PRENOM] pour personnaliser."
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                />
              </div>
              
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>Variante 3 (optionnel)</label>
                <textarea
                  value={formData.variant3}
                  onChange={(e) => setFormData({ ...formData, variant3: e.target.value })}
                  rows="4"
                  placeholder="Troisième variante du message... Utilisez [PRENOM] pour personnaliser."
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                />
              </div>
              
              <p style={{ fontSize: '11px', color: '#6c757d', marginTop: '8px' }}>
                💡 Astuce: Utilisez au moins 2 variantes pour un envoi plus naturel et moins détectable comme spam. Utilisez <strong>[PRENOM]</strong> pour personnaliser chaque message avec le prénom du destinataire.
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Numéro expéditeur (optionnel)</label>
              <input
                type="text"
                value={formData.fromPhone}
                onChange={(e) => setFormData({ ...formData, fromPhone: e.target.value })}
                placeholder="Ex: +33123456789"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                Laissé vide pour utiliser le numéro par défaut configuré
              </p>
            </div>

            <button
              type="submit"
              disabled={recipientReviewLoading || sending || (formData.recipientMode === 'list' && usersWithPhones.length === 0)}
              className="admin-btn admin-btn-success"
              style={{ width: '100%', fontSize: '14px', padding: '10px' }}
            >
              {recipientReviewLoading
                ? '⏳ Préparation de la liste...'
                : (sending ? '⏳ Envoi en cours...' : (formData.recipientMode === 'list'
                  ? `📤 Choisir les numéros (${usersWithPhones.length})`
                  : `📤 Choisir les numéros (${tagLabels[formData.tag]})`))}
            </button>
          </form>
        </div>

        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>📋 Tags disponibles</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e9ecef' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600' }}>✅ Actifs</span>
                <span style={{ fontSize: '14px', color: '#6c757d' }}>{stats?.byUserStatus?.active || 0} utilisateurs</span>
              </div>
              <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                Utilisateurs avec statut "active" sur la plateforme
              </p>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e9ecef' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600' }}>⏳ En attente</span>
                <span style={{ fontSize: '14px', color: '#6c757d' }}>{stats?.byUserStatus?.pending || 0} utilisateurs</span>
              </div>
              <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                Utilisateurs avec statut "pending" sur la plateforme
              </p>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e9ecef' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600' }}>❌ Inactifs</span>
                <span style={{ fontSize: '14px', color: '#6c757d' }}>{stats?.byUserStatus?.blocked || 0} utilisateurs</span>
              </div>
              <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                Utilisateurs avec statut "blocked" sur la plateforme
              </p>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e9ecef' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600' }}>📱 Tous</span>
                <span style={{ fontSize: '14px', color: '#6c757d' }}>{stats?.active || 0} utilisateurs</span>
              </div>
              <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                Tous les utilisateurs avec un numéro de téléphone
              </p>
            </div>
          </div>
        </div>
      </div>

      {trackingCampaignId && campaignDetails && (
        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#fff3cd', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '2px solid #ffc107' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⏳ Campagne en cours : {campaignDetails.campaign.name}
            <button 
              onClick={() => {
                stopTracking()
                setCampaignDetails(null)
                localStorage.removeItem('trackingWhatsAppCampaignId')
              }}
              style={{ marginLeft: 'auto', padding: '4px 8px', fontSize: '12px', backgroundColor: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              ✕ Arrêter le suivi
            </button>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #4caf50' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>{campaignDetails.stats.sent || 0}</div>
              <div style={{ fontSize: '12px', color: '#2e7d32' }}>✅ Envoyés</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #f44336' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#c62828' }}>{campaignDetails.stats.failed || 0}</div>
              <div style={{ fontSize: '12px', color: '#c62828' }}>❌ Échecs</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #ff9800' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e65100' }}>{campaignDetails.stats.pending || 0}</div>
              <div style={{ fontSize: '12px', color: '#e65100' }}>⏳ En attente</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #2196f3' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1565c0' }}>{campaignDetails.stats.total || 0}</div>
              <div style={{ fontSize: '12px', color: '#1565c0' }}>📱 Total</div>
            </div>
          </div>
          
          {campaignDetails.sentMessages && campaignDetails.sentMessages.length > 0 && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #4caf50', maxHeight: '400px', overflowY: 'auto' }}>
              <div style={{ fontWeight: '600', marginBottom: '12px', color: '#2e7d32', fontSize: '14px' }}>
                📤 Messages envoyés ({campaignDetails.sentMessages.length}) :
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {campaignDetails.sentMessages.map((msg, idx) => (
                  <div key={idx} style={{ padding: '10px', backgroundColor: '#f1f8e9', borderRadius: '4px', border: '1px solid #c8e6c9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: '600', fontSize: '13px' }}>{msg.phone}</span>
                      {msg.firstName && (
                        <span style={{ fontSize: '12px', color: '#666' }}>({msg.firstName})</span>
                      )}
                      <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#999' }}>
                        {new Date(msg.sentAt).toLocaleTimeString('fr-FR')}
                      </span>
                    </div>
                    {msg.message && (
                      <div style={{ fontSize: '12px', color: '#555', marginTop: '4px', whiteSpace: 'pre-wrap', maxHeight: '60px', overflow: 'hidden' }}>
                        {msg.message.substring(0, 150)}{msg.message.length > 150 ? '...' : ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {campaignDetails.failedMessages && campaignDetails.failedMessages.length > 0 && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #f44336', maxHeight: '200px', overflowY: 'auto' }}>
              <div style={{ fontWeight: '600', marginBottom: '8px', color: '#c62828', fontSize: '14px' }}>
                ❌ Messages en échec ({campaignDetails.failedMessages.length}) :
              </div>
              <div style={{ fontSize: '12px' }}>
                {campaignDetails.failedMessages.map((msg, idx) => (
                  <div key={idx} style={{ padding: '6px 0', borderBottom: '1px solid #ffcdd2' }}>
                    <strong>{msg.phone}</strong>
                    {msg.firstName && <span style={{ color: '#666' }}> ({msg.firstName})</span>}
                    : <span style={{ color: '#c62828' }}>{msg.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {sendResults && !trackingCampaignId && (
        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📊 Résultats d'envoi
            <button 
              onClick={() => setSendResults(null)}
              style={{ marginLeft: 'auto', padding: '4px 8px', fontSize: '12px', backgroundColor: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              ✕ Fermer
            </button>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '12px', backgroundColor: '#e8f5e9', borderRadius: '6px', border: '1px solid #4caf50' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>{sendResults.sent || 0}</div>
              <div style={{ fontSize: '12px', color: '#2e7d32' }}>✅ Envoyés</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#c8e6c9', borderRadius: '6px', border: '1px solid #66bb6a' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1b5e20' }}>{sendResults.confirmed || 0}</div>
              <div style={{ fontSize: '12px', color: '#1b5e20' }}>✓ Confirmés</div>
            </div>
            {sendResults.delivered > 0 && (
              <div style={{ padding: '12px', backgroundColor: '#b2dfdb', borderRadius: '6px', border: '1px solid #26a69a' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#004d40' }}>{sendResults.delivered || 0}</div>
                <div style={{ fontSize: '12px', color: '#004d40' }}>📬 Livrés</div>
              </div>
            )}
            {sendResults.read > 0 && (
              <div style={{ padding: '12px', backgroundColor: '#b3e5fc', borderRadius: '6px', border: '1px solid #29b6f6' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#01579b' }}>{sendResults.read || 0}</div>
                <div style={{ fontSize: '12px', color: '#01579b' }}>👁️ Lus</div>
              </div>
            )}
            <div style={{ padding: '12px', backgroundColor: '#fff3e0', borderRadius: '6px', border: '1px solid #ff9800' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e65100' }}>{sendResults.failed || 0}</div>
              <div style={{ fontSize: '12px', color: '#e65100' }}>❌ Échecs</div>
            </div>
            {sendResults.skipped > 0 && (
              <div style={{ padding: '12px', backgroundColor: '#f3e5f5', borderRadius: '6px', border: '1px solid #9c27b0' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6a1b9a' }}>{sendResults.skipped || 0}</div>
                <div style={{ fontSize: '12px', color: '#6a1b9a' }}>⚠️ Ignorés</div>
              </div>
            )}
            {sendResults.quotaReached && (
              <div style={{ padding: '12px', backgroundColor: '#fff9c4', borderRadius: '6px', border: '1px solid #fbc02d' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f57f17' }}>⏸️ Interrompu</div>
                <div style={{ fontSize: '11px', color: '#f57f17' }}>Quota ou plage horaire</div>
              </div>
            )}
            <div style={{ padding: '12px', backgroundColor: '#e3f2fd', borderRadius: '6px', border: '1px solid #2196f3' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1565c0' }}>{sendResults.total || 0}</div>
              <div style={{ fontSize: '12px', color: '#1565c0' }}>📱 Total</div>
            </div>
          </div>
          {sendResults.phoneNumbers && sendResults.phoneNumbers.length > 0 && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#e8f5e9', borderRadius: '6px', border: '1px solid #4caf50' }}>
              <div style={{ fontWeight: '600', marginBottom: '8px', color: '#2e7d32' }}>📱 Numéros des destinataires ({sendResults.phoneNumbers.length}):</div>
              <div style={{ fontSize: '12px', maxHeight: '200px', overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {sendResults.phoneNumbers.map((phone, idx) => (
                  <div key={idx} style={{ padding: '4px 8px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #c8e6c9' }}>
                    {phone}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {sendResults.failedPhones && sendResults.failedPhones.length > 0 && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#ffebee', borderRadius: '6px', border: '1px solid #f44336' }}>
              <div style={{ fontWeight: '600', marginBottom: '8px', color: '#c62828' }}>Numéros en échec:</div>
              <div style={{ fontSize: '12px', maxHeight: '150px', overflowY: 'auto' }}>
                {sendResults.failedPhones.map((item, idx) => (
                  <div key={idx} style={{ padding: '4px 0', borderBottom: '1px solid #ffcdd2' }}>
                    <strong>{item.phone}</strong>: {item.error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {campaigns.length > 0 && (
        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>📋 Campagnes précédentes</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Nom</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Statut</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Envoyés</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign, idx) => (
                  <tr key={campaign._id} style={{ borderBottom: '1px solid #dee2e6', backgroundColor: idx % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                    <td style={{ padding: '12px' }}>{campaign.name}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px',
                        backgroundColor: campaign.status === 'sent' ? '#d1fae5' : campaign.status === 'failed' ? '#fee2e2' : '#fef3c7',
                        color: campaign.status === 'sent' ? '#065f46' : campaign.status === 'failed' ? '#991b1b' : '#92400e'
                      }}>
                        {campaign.status === 'sent' ? '✅ Envoyé' : campaign.status === 'failed' ? '❌ Échoué' : '⏳ ' + campaign.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{campaign.stats?.sent || 0}</td>
                    <td style={{ padding: '12px', fontSize: '12px', color: '#6c757d' }}>
                      {campaign.sentAt ? new Date(campaign.sentAt).toLocaleDateString('fr-FR') : new Date(campaign.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => handleReloadCampaign(campaign)}
                        disabled={recipientReviewLoading}
                        className="admin-btn"
                        style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: recipientReviewLoading ? 'not-allowed' : 'pointer', opacity: recipientReviewLoading ? 0.6 : 1 }}
                      >
                        {recipientReviewLoading ? '⏳' : '🔄 Relancer'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
