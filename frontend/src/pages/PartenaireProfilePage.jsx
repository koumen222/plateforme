import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CONFIG } from '../config/config'

const domaineLabel = (value) => {
  const labels = {
    livreur: 'Livreur',
    agence_livraison: 'Agence de livraison',
    transitaire: 'Transitaire',
    closeur: 'Closeur',
    fournisseur: 'Fournisseur',
    autre: 'Autre'
  }
  return labels[value] || value || '—'
}

const typeLabel = (value) => {
  const labels = {
    agence_livraison: 'Agence de livraison',
    closeur: 'Closeur',
    transitaire: 'Transitaire',
    autre: 'Autre'
  }
  return labels[value] || value || '—'
}

const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('fr-FR', { dateStyle: 'medium' })
}

export default function PartenaireProfilePage() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [partenaire, setPartenaire] = useState(null)
  const [avis, setAvis] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`${CONFIG.BACKEND_URL}/api/partenaires/${id}`)
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Erreur de chargement')
        }
        setPartenaire(data.partenaire)
        setAvis(data.avis || [])
      } catch (err) {
        setError(err.message || 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const getContactLink = (record) => {
    if (record?.lien_contact) return record.lien_contact
    if (!record?.whatsapp) return ''
    const digits = record.whatsapp.replace(/[^\d+]/g, '')
    return `https://wa.me/${digits.replace('+', '')}`
  }

  const getPhoneLink = (record) => {
    const phone = record?.telephone || record?.whatsapp
    if (!phone) return ''
    const digits = phone.replace(/[^\d+]/g, '')
    return `tel:${digits}`
  }

  const trackContact = async (type, message) => {
    try {
      await fetch(`${CONFIG.BACKEND_URL}/api/partenaires/${id}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message })
      })
    } catch (error) {
      // silencieux
    }
  }

  const handlePlatformContact = async () => {
    const message = window.prompt(`Message pour ${partenaire?.nom || 'ce partenaire'} :`)
    if (!message || !message.trim()) return
    await trackContact('plateforme', message.trim())
    alert('✅ Message envoyé. Le partenaire vous recontactera.')
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="admin-loading">Chargement...</div>
      </div>
    )
  }

  if (error || !partenaire) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="admin-empty">
          <div className="admin-empty-icon">⚠️</div>
          <h3>Impossible de charger le profil</h3>
          <p>{error || 'Partenaire introuvable.'}</p>
          <Link to="/partenaires" className="admin-btn admin-btn-primary mt-4">
            Retour aux partenaires
          </Link>
        </div>
      </div>
    )
  }

  const domaines = (partenaire.domaines_activite || [partenaire.domaine])
    .filter(Boolean)
    .map(domaineLabel)
    .join(', ')
  const badges = partenaire.badges || []
  const contactLink = getContactLink(partenaire)
  const phoneLink = getPhoneLink(partenaire)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="summary-card-lesson">
        <Link to="/partenaires" className="text-sm text-accent hover:underline">
          ← Retour aux partenaires
        </Link>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{partenaire.nom}</h1>
            <p className="text-secondary mt-2">{typeLabel(partenaire.type_partenaire)}</p>
            <p className="text-sm text-secondary mt-1">{domaines || '—'}</p>
          </div>
          <div className="text-sm text-secondary">
            ⭐ {partenaire.stats?.rating_avg || 0} ({partenaire.stats?.rating_count || 0} avis)
          </div>
        </div>
        {badges.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-secondary">
            {badges.includes('verifie') && <span className="px-2 py-1 rounded-lg bg-secondary">✅ Vérifié</span>}
            {badges.includes('top') && <span className="px-2 py-1 rounded-lg bg-secondary">⭐ Top</span>}
            {badges.includes('actif_mois') && <span className="px-2 py-1 rounded-lg bg-secondary">🕒 Actif</span>}
            {badges.includes('reactif') && <span className="px-2 py-1 rounded-lg bg-secondary">🚀 Réactif</span>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <div className="summary-card-lesson">
            <h2 className="text-lg font-semibold">Présentation</h2>
            <p className="text-secondary mt-2">{partenaire.description_courte || '—'}</p>
          </div>

          <div className="summary-card-lesson">
            <h2 className="text-lg font-semibold">Informations clés</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-sm text-secondary">
              <div>🌍 Pays : {partenaire.pays || '—'}</div>
              <div>📍 Ville : {partenaire.ville || '—'}</div>
              <div>📞 Téléphone : {partenaire.telephone || '—'}</div>
              <div>💬 WhatsApp : {partenaire.whatsapp || '—'}</div>
              <div>✉️ Email : {partenaire.email || '—'}</div>
              <div>🕒 Disponibilité : {partenaire.disponibilite || '—'}</div>
              <div>🧭 Zones : {(partenaire.zones_couvertes || []).join(', ') || '—'}</div>
              <div>⏱️ Délais : {partenaire.delais_moyens || '—'}</div>
              <div>🗣️ Langues : {(partenaire.langues_parlees || []).join(', ') || '—'}</div>
              <div>💳 Paiements : {(partenaire.methodes_paiement || []).join(', ') || '—'}</div>
              <div>⭐ Expérience : {partenaire.annees_experience ?? '—'} ans</div>
              <div>📅 Validé le : {formatDate(partenaire.approved_at)}</div>
            </div>
          </div>

          <div className="summary-card-lesson">
            <h2 className="text-lg font-semibold">Avis</h2>
            {avis.length === 0 ? (
              <div className="text-sm text-secondary mt-2">Aucun avis pour le moment.</div>
            ) : (
              <div className="mt-3 space-y-3">
                {avis.map((item) => (
                  <div key={item._id} className="border border-theme rounded-xl p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">⭐ {item.note}</span>
                      <span className="text-secondary">{formatDate(item.created_at)}</span>
                    </div>
                    {item.commentaire && (
                      <p className="text-sm text-secondary mt-2">{item.commentaire}</p>
                    )}
                    {item.recommande && (
                      <div className="text-xs text-secondary mt-2">✅ Recommandé</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="summary-card-lesson h-fit">
          <h2 className="text-lg font-semibold">Contacter</h2>
          <div className="mt-4 space-y-2">
            {contactLink && (
              <a
                href={contactLink}
                target="_blank"
                rel="noreferrer"
                className="admin-btn admin-btn-primary w-full"
                onClick={() => trackContact('whatsapp')}
              >
                WhatsApp
              </a>
            )}
            {phoneLink && (
              <a
                href={phoneLink}
                className="admin-btn admin-btn-secondary w-full"
                onClick={() => trackContact('appel')}
              >
                Appeler
              </a>
            )}
            <button className="admin-btn admin-btn-secondary w-full" onClick={handlePlatformContact}>
              Contacter via la plateforme
            </button>
            {partenaire.lien_contact && (
              <a
                href={partenaire.lien_contact}
                target="_blank"
                rel="noreferrer"
                className="admin-btn admin-btn-secondary w-full"
              >
                Site / lien externe
              </a>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
