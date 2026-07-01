import { useState, useEffect, useCallback } from 'react'
import { CONFIG } from '../../config/config'
import { useAuth } from '../../contexts/AuthContext'
import { FiUsers, FiSearch, FiTrash2, FiDownload, FiPhone, FiUser, FiCalendar, FiRefreshCw, FiMail, FiWifi, FiWifiOff, FiZap, FiSend, FiPause, FiPlay } from 'react-icons/fi'

const CAMPAIGN_DAYS = [1, 2, 4, 7, 14]

// ─── Onglet Instance WhatsApp ────────────────────────────────────────────────
function ScalorInstanceTab({ token }) {
  const [status, setStatus] = useState(null)
  const [qrCode, setQrCode] = useState(null)
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [loadingQr, setLoadingQr] = useState(false)
  const [loadingRestart, setLoadingRestart] = useState(false)
  const [msg, setMsg] = useState(null)

  const notify = (text, type = 'success') => {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 4000)
  }

  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true)
    setQrCode(null)
    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/formation-leads/scalor/status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setStatus(data)
    } catch {
      notify('Erreur lors de la récupération du statut', 'error')
    } finally {
      setLoadingStatus(false)
    }
  }, [token])

  const fetchQrCode = async () => {
    setLoadingQr(true)
    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/formation-leads/scalor/qrcode`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.qrcode || data.qr || data.base64) {
        setQrCode(data.qrcode || data.qr || data.base64)
      } else {
        notify('Impossible de générer le QR code — instance peut-être déjà connectée', 'error')
      }
    } catch {
      notify('Erreur QR code', 'error')
    } finally {
      setLoadingQr(false)
    }
  }

  const handleRestart = async () => {
    setLoadingRestart(true)
    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/formation-leads/scalor/restart`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success || data.status) {
        notify('Instance redémarrée')
        setTimeout(fetchStatus, 3000)
      } else {
        notify(data.message || 'Erreur redémarrage', 'error')
      }
    } catch {
      notify('Erreur redémarrage', 'error')
    } finally {
      setLoadingRestart(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const inst = status?.instance || status
  const isConnected =
    inst?.status === 'connected' ||
    inst?.state === 'open' ||
    inst?.liveStatus?.instance?.state === 'open' ||
    inst?.connectionState === 'open' ||
    inst?.connected === true

  return (
    <div className="space-y-5">
      {msg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium text-white ${msg.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {msg.text}
        </div>
      )}

      {/* Carte statut */}
      <div className="bg-card border border-theme rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-primary flex items-center gap-2">
            <FiWifi className="w-5 h-5 text-accent" />
            Instance WhatsApp (Scalor)
          </h2>
          <button
            onClick={fetchStatus}
            disabled={loadingStatus}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-lg text-xs font-medium text-primary hover:bg-hover transition-colors disabled:opacity-40"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>

        {loadingStatus ? (
          <div className="flex items-center gap-2 text-secondary text-sm py-4">
            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            Chargement du statut...
          </div>
        ) : status ? (
          <div className="space-y-3">
            {/* Badge connexion */}
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
                isConnected
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              }`}>
                {isConnected ? <FiWifi className="w-4 h-4" /> : <FiWifiOff className="w-4 h-4" />}
                {isConnected ? 'Connecté' : 'Déconnecté'}
              </div>
              {(inst?.name || inst?.instanceName) && (
                <span className="text-sm text-secondary">Instance : <span className="text-primary font-medium">{inst?.name || inst?.instanceName}</span></span>
              )}
            </div>

            {/* Détails bruts */}
            <div className="bg-secondary rounded-xl p-4 text-xs font-mono text-secondary space-y-1 overflow-auto max-h-40">
              {Object.entries(status).map(([k, v]) => (
                <div key={k}>
                  <span className="text-accent">{k}</span>: {JSON.stringify(v)}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-secondary">Aucune donnée</p>
        )}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* QR Code */}
        <div className="bg-card border border-theme rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-primary text-sm">Scanner le QR code</h3>
            <p className="text-xs text-secondary mt-0.5">WhatsApp → Appareils connectés → Connecter un appareil</p>
          </div>
          <button
            onClick={fetchQrCode}
            disabled={loadingQr}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {loadingQr ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '📷'}
            {loadingQr ? 'Génération...' : 'Obtenir le QR code'}
          </button>
          {qrCode && (
            <div className="flex flex-col items-center gap-3">
              <img
                src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                alt="QR Code WhatsApp"
                className="w-48 h-48 rounded-xl border border-theme"
              />
              <p className="text-xs text-secondary text-center">Scannez avec WhatsApp</p>
            </div>
          )}
        </div>

        {/* Redémarrage */}
        <div className="bg-card border border-theme rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-primary text-sm">Redémarrer l'instance</h3>
            <p className="text-xs text-secondary mt-0.5">Si l'instance est bloquée ou ne répond plus</p>
          </div>
          <button
            onClick={handleRestart}
            disabled={loadingRestart}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {loadingRestart ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiZap className="w-4 h-4" />}
            {loadingRestart ? 'Redémarrage...' : 'Redémarrer'}
          </button>
          <p className="text-xs text-secondary">
            Après redémarrage, patientez ~10 secondes puis actualisez le statut.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Page principale ─────────────────────────────────────────────────────────
export default function AdminFormationLeadsPage() {
  const { token } = useAuth()
  const [activeTab, setActiveTab] = useState('leads')
  const [leads, setLeads] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [notification, setNotification] = useState(null)
  const LIMIT = 50

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const fetchLeads = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ search, page, limit: LIMIT })
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/formation-leads?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Erreur réseau')
      const data = await res.json()
      setLeads(data.leads || [])
      setTotal(data.total || 0)
      setPages(data.pages || 1)
    } catch {
      showNotification('Erreur lors du chargement', 'error')
    } finally {
      setLoading(false)
    }
  }, [token, search, page])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  useEffect(() => {
    setPage(1)
  }, [search])

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce lead ?')) return
    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/formation-leads/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      setLeads((prev) => prev.filter((l) => l._id !== id))
      setTotal((prev) => prev - 1)
      showNotification('Lead supprimé')
    } catch {
      showNotification('Erreur suppression', 'error')
    }
  }

  const handleLaunchCampaign = async () => {
    if (!confirm('Envoyer le message J1 à tous les leads actifs ? Cette action est irréversible.')) return
    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/formation-leads/campaign/launch`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        showNotification(`✅ Campagne lancée — ${data.sent} envoyés, ${data.failed} échoués, ${data.skipped || 0} ignorés`)
        fetchLeads()
      } else {
        showNotification(data.error || 'Erreur', 'error')
      }
    } catch {
      showNotification('Erreur lancement campagne', 'error')
    }
  }

  const handleRunCron = async () => {
    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/formation-leads/campaign/run`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        showNotification('Cron exécuté — messages envoyés si des leads sont éligibles')
        fetchLeads()
      } else {
        showNotification(data.error || 'Erreur', 'error')
      }
    } catch {
      showNotification('Erreur exécution cron', 'error')
    }
  }

  const [testPhone, setTestPhone] = useState('')
  const [testName, setTestName] = useState('')
  const [sendingTest, setSendingTest] = useState(false)

  const handleSendTest = async () => {
    if (!testPhone.trim()) return showNotification('Numéro de téléphone requis', 'error')
    setSendingTest(true)
    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/formation-leads/campaign/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone.trim(), name: testName.trim() || 'Test' }),
      })
      const data = await res.json()
      if (data.success) {
        showNotification(`✅ Message test envoyé à ${testPhone}`)
        setTestPhone('')
        setTestName('')
      } else {
        showNotification(data.error || 'Erreur envoi test', 'error')
      }
    } catch {
      showNotification('Erreur envoi test', 'error')
    } finally {
      setSendingTest(false)
    }
  }

  const handleToggleCampaign = async (id, active) => {
    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/formation-leads/${id}/campaign`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      })
      if (!res.ok) throw new Error()
      setLeads((prev) => prev.map((l) => l._id === id ? { ...l, campaign: { ...l.campaign, active } } : l))
      showNotification(active ? 'Campagne réactivée' : 'Campagne désactivée')
    } catch {
      showNotification('Erreur', 'error')
    }
  }

  const handleExportCSV = () => {
    const header = 'Prénom,Téléphone,Email,Date inscription\n'
    const rows = leads
      .map((l) => `"${l.name}","${l.phone}","${l.email || ''}","${new Date(l.createdAt).toLocaleString('fr-FR')}"`)
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-formation-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${
          notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        }`}>
          {notification.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <FiUsers className="w-7 h-7 text-accent" />
            Leads Formation Gratuite
          </h1>
          <p className="text-secondary text-sm mt-1">
            Inscrits via <code className="bg-secondary px-1 rounded">/formation-gratuite</code> · notifications WhatsApp via Scalor
          </p>
        </div>
        {activeTab === 'leads' && (
          <div className="flex gap-2">
            <button
              onClick={fetchLeads}
              className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-xl text-sm font-medium text-primary hover:bg-hover transition-colors"
            >
              <FiRefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            <button
              onClick={handleExportCSV}
              disabled={leads.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              <FiDownload className="w-4 h-4" />
              Exporter CSV
            </button>
          </div>
        )}
      </div>

      {/* Onglets */}
      <div className="flex gap-1 bg-secondary p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('leads')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'leads' ? 'bg-card text-primary shadow-sm' : 'text-secondary hover:text-primary'
          }`}
        >
          Prospects ({total})
        </button>
        <button
          onClick={() => setActiveTab('instance')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === 'instance' ? 'bg-card text-primary shadow-sm' : 'text-secondary hover:text-primary'
          }`}
        >
          <FiWifi className="w-3.5 h-3.5" />
          Instance WhatsApp
        </button>
      </div>

      {/* Contenu onglet leads */}
      {activeTab === 'leads' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-theme rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiUsers className="w-6 h-6 text-accent" />
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{total}</div>
                <div className="text-sm text-secondary">Total inscrits</div>
              </div>
            </div>
            <div className="bg-card border border-theme rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiCalendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {leads.filter((l) => new Date(l.createdAt).toDateString() === new Date().toDateString()).length}
                </div>
                <div className="text-sm text-secondary">Aujourd'hui</div>
              </div>
            </div>
            <div className="bg-card border border-theme rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiPhone className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {leads.filter((l) => (new Date() - new Date(l.createdAt)) / (1000 * 60 * 60 * 24) <= 7).length}
                </div>
                <div className="text-sm text-secondary">Cette semaine</div>
              </div>
            </div>
          </div>

          {/* Recherche + boutons campagne */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative max-w-md flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
              <input
                type="text"
                placeholder="Rechercher par prénom ou téléphone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-card border border-theme rounded-xl text-sm text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <button
              onClick={handleLaunchCampaign}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              <FiSend className="w-4 h-4" />
              🚀 Lancer la campagne (J1 à tous)
            </button>
            <button
              onClick={handleRunCron}
              className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-primary rounded-xl text-sm font-medium hover:bg-hover transition-colors whitespace-nowrap"
              title="Exécuter le cron manuellement (envoie les messages J2, J4, J7, J14 aux leads éligibles)"
            >
              <FiRefreshCw className="w-4 h-4" />
              Cron suivis
            </button>
          </div>

          {/* Envoi test */}
          <div className="bg-card border border-theme rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-3">
              <FiZap className="w-4 h-4 text-accent" />
              Envoi test
            </h3>
            <p className="text-xs text-secondary mb-3">
              Envoie le message J1 à un numéro spécifique pour tester avant de lancer la campagne.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Numéro (ex: 237676778377)"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-secondary border border-theme rounded-xl text-sm text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
              <input
                type="text"
                placeholder="Prénom (optionnel)"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="w-40 px-4 py-2.5 bg-secondary border border-theme rounded-xl text-sm text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
              <button
                onClick={handleSendTest}
                disabled={sendingTest || !testPhone.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 whitespace-nowrap"
              >
                {sendingTest ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiSend className="w-4 h-4" />
                )}
                {sendingTest ? 'Envoi...' : 'Envoyer test'}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-card border border-theme rounded-2xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-secondary text-sm gap-2">
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                Chargement...
              </div>
            ) : leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-secondary">
                <FiUsers className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">Aucun lead pour l'instant</p>
                <p className="text-xs mt-1 opacity-60">Les inscrits apparaîtront ici en temps réel</p>
              </div>
            ) : (
              <>
                <div className="hidden lg:grid grid-cols-[1fr_1.1fr_1fr_1.5fr_auto] gap-4 px-6 py-3 border-b border-theme bg-secondary text-xs font-semibold text-secondary uppercase tracking-wide">
                  <span className="flex items-center gap-1"><FiUser className="w-3.5 h-3.5" /> Prospect</span>
                  <span className="flex items-center gap-1"><FiCalendar className="w-3.5 h-3.5" /> Inscription</span>
                  <span>Campagne</span>
                  <span className="flex items-center gap-1"><FiSend className="w-3.5 h-3.5" /> Messages envoyés</span>
                  <span>Actions</span>
                </div>
                <div className="divide-y divide-theme">
                  {leads.map((lead) => {
                    const sentDays = (lead.campaign?.messagesSent || []).filter(m => m.status === 'sent').map(m => m.day)
                    const isActive = lead.campaign?.active !== false
                    const daysSince = Math.floor((new Date() - new Date(lead.createdAt)) / (1000 * 60 * 60 * 24))
                    return (
                      <div
                        key={lead._id}
                        className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr_1fr_1.5fr_auto] gap-3 lg:gap-4 px-6 py-4 hover:bg-hover transition-colors items-center"
                      >
                        {/* Prospect */}
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 text-accent font-bold text-sm">
                            {lead.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-primary text-sm">{lead.name}</div>
                            <a
                              href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-green-600 hover:underline flex items-center gap-1"
                            >
                              <FiPhone className="w-3 h-3" />{lead.phone}
                            </a>
                          </div>
                        </div>

                        {/* Date */}
                        <div className="text-xs text-secondary">
                          <div>{formatDate(lead.createdAt)}</div>
                          <div className="text-accent font-medium mt-0.5">J+{daysSince}</div>
                        </div>

                        {/* Statut campagne */}
                        <div>
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full font-medium">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary text-xs rounded-full font-medium">
                              Terminée
                            </span>
                          )}
                        </div>

                        {/* Messages envoyés — bulles J1 J2 J4 J7 J14 */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {CAMPAIGN_DAYS.map((d) => {
                            const sent = sentDays.includes(d)
                            const failed = (lead.campaign?.messagesSent || []).some(m => m.day === d && m.status === 'failed')
                            return (
                              <span
                                key={d}
                                title={sent ? `J${d} envoyé` : failed ? `J${d} échoué` : `J${d} en attente`}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                                  sent
                                    ? 'bg-green-500 border-green-500 text-white'
                                    : failed
                                    ? 'bg-red-400 border-red-400 text-white'
                                    : 'bg-card border-theme text-secondary'
                                }`}
                              >
                                {d}
                              </span>
                            )
                          })}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleCampaign(lead._id, !isActive)}
                            className={`p-2 rounded-lg transition-colors ${
                              isActive
                                ? 'text-secondary hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                : 'text-secondary hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                            }`}
                            title={isActive ? 'Désactiver campagne' : 'Réactiver campagne'}
                          >
                            {isActive ? <FiPause className="w-4 h-4" /> : <FiPlay className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDelete(lead._id)}
                            className="p-2 text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl bg-secondary text-sm font-medium text-primary disabled:opacity-40 hover:bg-hover transition-colors"
              >
                ← Précédent
              </button>
              <span className="text-sm text-secondary px-2">Page {page} / {pages}</span>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="px-4 py-2 rounded-xl bg-secondary text-sm font-medium text-primary disabled:opacity-40 hover:bg-hover transition-colors"
              >
                Suivant →
              </button>
            </div>
          )}
        </>
      )}

      {/* Contenu onglet instance */}
      {activeTab === 'instance' && <ScalorInstanceTab token={token} />}
    </div>
  )
}
