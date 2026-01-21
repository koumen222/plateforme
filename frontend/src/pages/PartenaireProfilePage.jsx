import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FiCalendar, FiCheckCircle, FiClock, FiCompass, FiGlobe, FiMail, FiMapPin, FiMessageCircle, FiPhone } from 'react-icons/fi'
import { CONFIG } from '../config/config'
import { getImageUrl } from '../utils/imageUtils'

const domaineLabel = (value) => {
  const labels = {
    livreur: 'Livreur',
    livreur_personnel: 'Livreur personnel',
    agence_livraison: 'Agence de livraison',
    transitaire: 'Transitaire',
    closeur: 'Closeur',
    fournisseur: 'Fournisseur',
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

const getStatusBadge = (value) => {
  if (value === 'disponible') {
    return { label: 'Disponible', className: 'bg-secondary text-accent border-accent' }
  }
  return { label: 'Occupé', className: 'bg-secondary text-secondary border-theme' }
}

const getProfileBadge = (value) => {
  const labels = {
    livreur: 'Livreur',
    livreur_personnel: 'Livreur personnel',
    agence_livraison: 'Agence de livraison',
    transitaire: 'Transitaire',
    closeur: 'Closeur',
    fournisseur: 'Fournisseur',
    autre: 'Autre'
  }
  return labels[value] || value || '—'
}

export default function PartenaireProfilePage() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [partenaire, setPartenaire] = useState(null)
  const [avis, setAvis] = useState([])
  const [error, setError] = useState('')
  const [isMessageOpen, setIsMessageOpen] = useState(false)
  const [messageText, setMessageText] = useState('Bonjour, je souhaite collaborer avec vous.')
  const [contactForm, setContactForm] = useState({
    nom: '',
    telephone: '',
    pays: '',
    ville: ''
  })
  const [reviewForm, setReviewForm] = useState({
    auteur_nom: '',
    auteur_email: '',
    note: '5',
    commentaire: ''
  })
  const [reviewSending, setReviewSending] = useState(false)
  const [reviewMessage, setReviewMessage] = useState('')

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

  const buildWhatsappLink = (record, message) => {
    const base = getContactLink(record)
    if (!base) return ''
    const encoded = encodeURIComponent(message || '')
    return base.includes('?') ? `${base}&text=${encoded}` : `${base}?text=${encoded}`
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

  const handleOpenMessage = () => {
    setMessageText('Bonjour, je souhaite collaborer avec vous.')
    setContactForm({ nom: '', telephone: '', pays: '', ville: '' })
    setIsMessageOpen(true)
  }

  const handleSendWhatsapp = async () => {
    const cleaned = messageText.trim()
    if (!cleaned) return
    const details = [
      contactForm.nom && `Nom: ${contactForm.nom}`,
      contactForm.telephone && `Téléphone: ${contactForm.telephone}`
    ]
      .filter(Boolean)
      .join('\n')
    const fullMessage = details ? `${cleaned}\n\n${details}` : cleaned
    const link = buildWhatsappLink(partenaire, fullMessage)
    if (!link) {
      alert('⚠️ Numéro WhatsApp indisponible.')
      return
    }
    await trackContact('whatsapp', fullMessage)
    window.open(link, '_blank')
    setIsMessageOpen(false)
  }

  const handleReviewSubmit = async (event) => {
    event.preventDefault()
    if (reviewSending) return
    setReviewSending(true)
    setReviewMessage('')
    try {
      const payload = {
        note: Number(reviewForm.note),
        commentaire: reviewForm.commentaire.trim(),
        auteur_nom: reviewForm.auteur_nom.trim(),
        auteur_email: reviewForm.auteur_email.trim()
      }
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/partenaires/${id}/avis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l’envoi de l’avis.')
      }
      if (data.avis) {
        setAvis((prev) => [data.avis, ...prev])
      }
      setReviewForm({
        auteur_nom: '',
        auteur_email: '',
        note: '5',
        commentaire: ''
      })
      setReviewMessage('✅ Merci ! Votre avis est maintenant publié.')
    } catch (err) {
      setReviewMessage(err.message || 'Erreur lors de l’envoi de l’avis.')
    } finally {
      setReviewSending(false)
    }
  }

  const sortedAvis = useMemo(() => {
    return [...avis].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [avis])

  if (loading) {
    return (
      <div className="bg-secondary min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-28 rounded-3xl bg-secondary" />
            <div className="h-24 rounded-2xl bg-secondary" />
            <div className="h-40 rounded-2xl bg-secondary" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !partenaire) {
    return (
      <div className="bg-secondary min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="rounded-3xl border border-theme bg-card p-10 text-center">
            <div className="text-3xl mb-2">⚠️</div>
            <h3 className="text-lg font-semibold text-primary">Impossible de charger le profil</h3>
            <p className="text-sm text-secondary mt-2">{error || 'Partenaire introuvable.'}</p>
            <Link to="/partenaires" className="btn-primary mt-4 inline-flex text-sm px-4 py-2">
              Retour aux partenaires
            </Link>
          </div>
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
  const status = getStatusBadge(partenaire.disponibilite)
  const ratingAvg = partenaire.stats?.rating_avg || 0
  const ratingCount = partenaire.stats?.rating_count || 0
  const deliveryCount = partenaire.stats?.deliveries_count || partenaire.stats?.deliveries || '—'
  const satisfactionRate = ratingAvg ? `${Math.round(ratingAvg * 20)}%` : '—'
  const galeriePhotos = partenaire.galerie_photos || []
  const categorie = partenaire.domaine || partenaire.type_partenaire || 'autre'
  const profileBadge = getProfileBadge(categorie)

  const isLivreur = ['livreur', 'livreur_personnel', 'agence_livraison'].includes(categorie)
  const isTransitaire = categorie === 'transitaire'
  const isCloseur = categorie === 'closeur'
  const isFournisseur = categorie === 'fournisseur'

  const baseInfoItems = [
    { label: 'Pays', value: partenaire.pays || '—', icon: FiGlobe },
    { label: 'Ville', value: partenaire.ville || '—', icon: FiMapPin },
    { label: 'Téléphone', value: partenaire.telephone || '—', icon: FiPhone },
    { label: 'WhatsApp', value: partenaire.whatsapp || '—', icon: FiMessageCircle },
    { label: 'Email', value: partenaire.email || '—', icon: FiMail },
    { label: 'Disponibilité', value: partenaire.disponibilite || '—', icon: FiClock },
    { label: 'Validé le', value: formatDate(partenaire.approved_at), icon: FiCalendar }
  ]

  const infoItems = [
    ...baseInfoItems,
    ...(isLivreur || isTransitaire || isFournisseur
      ? [
          {
            label: 'Zones',
            value: (partenaire.zones_couvertes || []).join(', ') || '—',
            icon: FiCompass,
            hidden: !(partenaire.zones_couvertes || []).length
          }
        ]
      : [])
  ].filter((item) => !item.hidden)

  const highlightItems = [
    { label: 'Spécialité', value: profileBadge },
    ...(isLivreur || isTransitaire
      ? [
          {
            label: 'Zones desservies',
            value: (partenaire.zones_couvertes || []).join(', '),
            hidden: !(partenaire.zones_couvertes || []).length
          },
          {
            label: 'Délai moyen',
            value: partenaire.delais_moyens || '',
            hidden: !partenaire.delais_moyens
          }
        ]
      : []),
    ...(isCloseur
      ? [
          {
            label: 'Langues parlées',
            value: (partenaire.langues_parlees || []).join(', '),
            hidden: !(partenaire.langues_parlees || []).length
          }
        ]
      : []),
    ...(isLivreur || isTransitaire || isFournisseur
      ? [
          {
            label: 'Méthodes de paiement',
            value: (partenaire.methodes_paiement || []).join(', '),
            hidden: !(partenaire.methodes_paiement || []).length
          },
          {
            label: 'Langues parlées',
            value: (partenaire.langues_parlees || []).join(', '),
            hidden: !(partenaire.langues_parlees || []).length
          }
        ]
      : [])
  ].filter((item) => !item.hidden)

  return (
    <div className="bg-secondary min-h-screen pb-20 md:pb-10">
      <header className="bg-card border-b border-theme sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-4">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              {partenaire.logo_url ? (
                <img
                  src={getImageUrl(partenaire.logo_url)}
                  alt={partenaire.nom}
                  className="h-16 w-16 sm:h-12 sm:w-12 rounded-2xl object-cover border border-theme bg-card"
                />
              ) : (
                <div className="h-16 w-16 sm:h-12 sm:w-12 rounded-2xl bg-secondary flex items-center justify-center text-lg sm:text-sm font-semibold text-primary">
                  {(partenaire.nom || '?').slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-2xl sm:text-lg font-semibold text-primary truncate">{partenaire.nom}</span>
                  {badges.includes('verifie') && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-accent bg-secondary px-2 py-0.5 text-[11px] text-accent">
                      <FiCheckCircle className="h-3 w-3" />
                      Vérifié
                    </span>
                  )}
                </div>
                <div className="text-xs text-secondary">
                  {profileBadge} • ⭐ {ratingAvg.toFixed(1)} • 📍 {partenaire.ville || '—'}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-5 text-sm text-secondary">
              <a href="#presentation" className="hover:text-primary">Présentation</a>
              <a href="#services" className="hover:text-primary">Services</a>
              <a href="#avis" className="hover:text-primary">Avis</a>
              <a href="#photos" className="hover:text-primary">Photos</a>
              <a href="#infos" className="hover:text-primary">Infos</a>
              <button
                type="button"
                className="btn-primary text-sm px-5 py-2"
                onClick={handleOpenMessage}
              >
                Collaborer
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Livraisons effectuées', value: deliveryCount },
            { label: 'Délai moyen', value: partenaire.delais_moyens || '—' },
            { label: 'Taux de satisfaction', value: satisfactionRate },
            { label: 'Années d’expérience', value: partenaire.annees_experience ?? '—' }
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-theme bg-card p-4">
              <div className="text-xs text-secondary">{item.label}</div>
              <div className="text-lg font-semibold text-primary mt-2">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="space-y-6">
            <section id="presentation" className="rounded-3xl border border-theme bg-card p-6">
              <h2 className="text-lg font-semibold text-primary">Présentation</h2>
              <p className="text-sm text-secondary mt-3">
                {partenaire.description_courte || 'Présentation à venir.'}
              </p>
            </section>

            <section id="services" className="rounded-3xl border border-theme bg-card p-6">
              <h2 className="text-lg font-semibold text-primary">Services</h2>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-secondary">
                <div className="rounded-2xl border border-theme bg-secondary px-3 py-2">
                  Spécialité : <span className="text-primary font-medium">{profileBadge}</span>
                </div>
                {domaines && (
                  <div className="rounded-2xl border border-theme bg-secondary px-3 py-2">
                    Domaines : <span className="text-primary font-medium">{domaines}</span>
                  </div>
                )}
                {(partenaire.zones_couvertes || []).length > 0 && (
                  <div className="rounded-2xl border border-theme bg-secondary px-3 py-2">
                    Zones : <span className="text-primary font-medium">{partenaire.zones_couvertes.join(', ')}</span>
                  </div>
                )}
                {partenaire.delais_moyens && (
                  <div className="rounded-2xl border border-theme bg-secondary px-3 py-2">
                    Délai moyen : <span className="text-primary font-medium">{partenaire.delais_moyens}</span>
                  </div>
                )}
                {(partenaire.methodes_paiement || []).length > 0 && (
                  <div className="rounded-2xl border border-theme bg-secondary px-3 py-2">
                    Paiements : <span className="text-primary font-medium">{partenaire.methodes_paiement.join(', ')}</span>
                  </div>
                )}
                {(partenaire.langues_parlees || []).length > 0 && (
                  <div className="rounded-2xl border border-theme bg-secondary px-3 py-2">
                    Langues : <span className="text-primary font-medium">{partenaire.langues_parlees.join(', ')}</span>
                  </div>
                )}
              </div>
            </section>

            <section id="avis" className="rounded-3xl border border-theme bg-card p-6">
              <h2 className="text-lg font-semibold text-primary">Avis clients</h2>
              <form onSubmit={handleReviewSubmit} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  className="admin-input"
                  placeholder="Votre nom"
                  value={reviewForm.auteur_nom}
                  onChange={(e) => setReviewForm((prev) => ({ ...prev, auteur_nom: e.target.value }))}
                />
                <input
                  type="email"
                  className="admin-input"
                  placeholder="Votre email (optionnel)"
                  value={reviewForm.auteur_email}
                  onChange={(e) => setReviewForm((prev) => ({ ...prev, auteur_email: e.target.value }))}
                />
                <select
                  className="admin-select"
                  value={reviewForm.note}
                  onChange={(e) => setReviewForm((prev) => ({ ...prev, note: e.target.value }))}
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {value} ⭐
                    </option>
                  ))}
                </select>
                <div className="md:col-span-2">
                  <textarea
                    className="admin-textarea"
                    rows="3"
                    placeholder="Votre avis (optionnel)"
                    value={reviewForm.commentaire}
                    onChange={(e) => setReviewForm((prev) => ({ ...prev, commentaire: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2 flex items-center gap-3">
                  <button type="submit" className="btn-primary text-sm px-4 py-2" disabled={reviewSending}>
                    {reviewSending ? 'Envoi...' : 'Laisser un avis'}
                  </button>
                  {reviewMessage && <span className="text-sm text-secondary">{reviewMessage}</span>}
                </div>
              </form>
              {sortedAvis.length === 0 ? (
                <div className="text-sm text-secondary mt-3">Aucun avis pour le moment.</div>
              ) : (
                <div className="mt-4 space-y-3">
                  {sortedAvis.map((item) => (
                    <div key={item._id} className="rounded-2xl border border-theme p-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="font-semibold text-primary">
                          {item.auteur_nom || 'Client'}
                        </div>
                        <span className="text-secondary">{formatDate(item.created_at)}</span>
                      </div>
                      <div className="text-sm text-secondary mt-2">⭐ {item.note}</div>
                      {item.commentaire && (
                        <p className="text-sm text-secondary mt-2">{item.commentaire}</p>
                      )}
                      <div className="mt-2">
                        <span className="inline-flex rounded-full border border-theme bg-secondary px-2 py-0.5 text-[11px] text-secondary">
                          Client vérifié
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {galeriePhotos.length > 0 && (
              <section id="photos" className="space-y-4">
                {galeriePhotos.map((photo, idx) => (
                  <img
                    key={`${photo}-${idx}`}
                    src={getImageUrl(photo)}
                    alt={`Photo ${idx + 1}`}
                    className="w-full aspect-square rounded-2xl object-cover border border-theme"
                  />
                ))}
              </section>
            )}
          </div>

          <aside className="rounded-3xl border border-theme bg-card p-6 h-fit space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-primary">Profil</h2>
              <div className="mt-4 space-y-2 text-sm text-secondary">
                {highlightItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3">
                    <span className="text-secondary">{item.label}</span>
                    <span className="text-primary font-medium text-right">{item.value || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
            <section id="infos">
              <h2 className="text-lg font-semibold text-primary">Informations clés</h2>
            <div className="mt-4 space-y-2 text-sm text-secondary">
              {infoItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 text-accent" />
                  <span>
                    {item.label} : {item.value || '—'}
                  </span>
                </div>
              ))}
            </div>
            </section>
            <div className="mt-6 space-y-2">
              {contactLink && (
                <a
                  href={contactLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary block text-sm px-4 py-2 text-center"
                  onClick={() => trackContact('whatsapp')}
                >
                  Contacter via WhatsApp
                </a>
              )}
              <button
                type="button"
                className="btn-primary block w-full text-sm px-4 py-2"
                onClick={handleOpenMessage}
              >
                Collaborer avec ce partenaire
              </button>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-theme bg-card p-3 md:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-primary flex-1 text-sm px-4 py-2"
            onClick={handleOpenMessage}
          >
            Collaborer avec ce partenaire
          </button>
          {contactLink && (
            <a
              href={contactLink}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-sm px-3 py-2"
              onClick={() => trackContact('whatsapp')}
            >
              WhatsApp
            </a>
          )}
        </div>
      </div>

      {isMessageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-theme bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-primary">Contacter le partenaire</h3>
            <p className="text-sm text-secondary mt-1">
              Le message sera envoyé via WhatsApp.
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                className="admin-input"
                placeholder="Votre nom"
                value={contactForm.nom}
                onChange={(e) => setContactForm((prev) => ({ ...prev, nom: e.target.value }))}
              />
              <input
                type="text"
                className="admin-input"
                placeholder="Votre numéro de téléphone"
                value={contactForm.telephone}
                onChange={(e) => setContactForm((prev) => ({ ...prev, telephone: e.target.value }))}
              />
              <input
                type="text"
                className="admin-input"
                placeholder="Pays"
                value={contactForm.pays}
                onChange={(e) => setContactForm((prev) => ({ ...prev, pays: e.target.value }))}
              />
              <input
                type="text"
                className="admin-input"
                placeholder="Ville"
                value={contactForm.ville}
                onChange={(e) => setContactForm((prev) => ({ ...prev, ville: e.target.value }))}
              />
            </div>
            <textarea
              className="admin-textarea mt-4"
              rows="4"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="btn-secondary text-sm px-4 py-2"
                onClick={() => setIsMessageOpen(false)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn-primary text-sm px-4 py-2"
                onClick={handleSendWhatsapp}
              >
                Envoyer sur WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
