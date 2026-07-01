import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CONFIG } from '../config/config'
import { countries } from '../data/countries'
import './FormationGratuitePage.css'

const MODULES = [
  {
    num: 'Vidéo 1',
    title: 'La vérité sur l\'ecom en Afrique',
    desc: 'Pourquoi le dropshipping américain ne marche pas tel quel et ce que tu dois faire différemment.',
  },
  {
    num: 'Vidéo 2',
    title: 'Trouver un produit gagnant',
    desc: 'Les 5 critères d\'un bon produit pour le marché africain. Analyse en direct à l\'écran.',
  },
  {
    num: 'Vidéo 3',
    title: 'Fournisseurs et achats en chine',
    desc: 'Comment trouver un fournisseur fiable en Chine et expédier tes produits en Afrique en toute sécurité.',
  },
  {
    num: 'Vidéo 4',
    title: 'Créer une boutique sur Scalor',
    desc: 'Comment configurer rapidement ta boutique en ligne sur Scalor pour commencer à recevoir des commandes.',
  },
  {
    num: 'Vidéo 5',
    title: 'Lancer une campagne Facebook Ads',
    desc: 'La structure pas-à-pas pour lancer ta première campagne publicitaire et cibler les bons acheteurs.',
  },
  {
    num: 'Vidéo 6',
    title: 'Facebook Ads sans gaspiller',
    desc: 'Lancer une vraie campagne avec 10€. Lire les chiffres. Savoir quand couper ou scaler.',
  },
  {
    num: 'Vidéo 7',
    title: 'Le système complet',
    desc: 'Tout assembler en un vrai business. Closing WhatsApp, rentabilité, scaling et la suite.',
  },
]

const TESTIMONIALS = [
  {
    initials: 'KA',
    name: 'Kofi A.',
    country: 'Ghana · E-commerce débutant',
    text: '"J\'avais déjà essayé les pubs Facebook et perdu de l\'argent. Après la formation, j\'ai compris pourquoi. Mes premières commandes sont arrivées la semaine suivante."',
  },
  {
    initials: 'MN',
    name: 'Marie N.',
    country: 'Cameroun · Vendeuse WhatsApp',
    text: '"Ce qui m\'a le plus aidé c\'est le module sur la rentabilité. Je vendais mais je perdais de l\'argent sans le savoir. Maintenant je calcule tout avant de lancer."',
  },
  {
    initials: 'DB',
    name: 'David B.',
    country: 'Côte d\'Ivoire · Entrepreneur',
    text: '"J\'ai lancé ma boutique en moins d\'un mois après avoir suivi la formation. La méthode est concrète, pas du tout théorique comme ce qu\'on voit ailleurs."',
  },
]

function FormModal({ onClose, onSuccess }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(countries.find(c => c.code === 'CM') || null)
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const [nameError, setNameError] = useState(false)
  const [phoneError, setPhoneError] = useState(false)
  const [emailError, setEmailError] = useState(false)
  const [countryError, setCountryError] = useState(false)
  const [loading, setLoading] = useState(false)
  const phoneRef = useRef(null)
  const emailRef = useRef(null)
  const firstInputRef = useRef(null)
  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)

  // Focus premier champ à l'ouverture
  useEffect(() => {
    firstInputRef.current?.focus()
  }, [])

  // Fermer avec Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (countryDropdownOpen) {
          setCountryDropdownOpen(false)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, countryDropdownOpen])

  // Bloquer le scroll du body
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Fermer dropdown au clic extérieur
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setCountryDropdownOpen(false)
        setCountrySearch('')
      }
    }
    if (countryDropdownOpen) {
      document.addEventListener('mousedown', handler)
    }
    return () => document.removeEventListener('mousedown', handler)
  }, [countryDropdownOpen])

  // Focus sur le champ de recherche quand le dropdown s'ouvre
  useEffect(() => {
    if (countryDropdownOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
  }, [countryDropdownOpen])

  const filteredCountries = countries.filter((c) => {
    const q = countrySearch.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.dialCode.includes(q)
  })

  function selectCountry(country) {
    setSelectedCountry(country)
    setCountryDropdownOpen(false)
    setCountrySearch('')
    setCountryError(false)
    // Focus sur le champ téléphone après sélection
    setTimeout(() => phoneRef.current?.focus(), 50)
  }

  async function handleSubmit() {
    let valid = true
    if (!name.trim()) { setNameError(true); setTimeout(() => setNameError(false), 2000); valid = false }
    if (!selectedCountry) { setCountryError(true); setTimeout(() => setCountryError(false), 2000); valid = false }
    if (!phone.trim()) { setPhoneError(true); setTimeout(() => setPhoneError(false), 2000); valid = false }
    if (!email.trim()) { setEmailError(true); setTimeout(() => setEmailError(false), 2000); valid = false }
    if (!valid) return

    const fullPhone = selectedCountry.dialCode + phone.trim().replace(/^0+/, '')

    setLoading(true)
    try {
      await fetch(`${CONFIG.BACKEND_URL}/api/formation-leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: fullPhone, email: email.trim() }),
      })
    } catch (_) {}
    setLoading(false)
    onSuccess(name.trim())
  }

  return (
    <div className="fg-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fg-modal">
        {/* Barre top dégradée */}
        <div className="fg-modal-topbar" />

        {/* Bouton fermer */}
        <button className="fg-modal-close" onClick={onClose} aria-label="Fermer">✕</button>

        <div className="fg-modal-title">Accède à la formation</div>
        <div className="fg-modal-sub">
          Entre tes informations pour démarrer.{' '}
          <span>Vidéo 1 disponible immédiatement.</span>
        </div>

        <div className="fg-form-group">
          <label htmlFor="fg-name">Ton prénom</label>
          <input
            id="fg-name"
            ref={firstInputRef}
            type="text"
            placeholder="Ex : Didier"
            autoComplete="given-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={nameError ? 'error' : ''}
            onKeyDown={(e) => e.key === 'Enter' && setCountryDropdownOpen(true)}
          />
        </div>

        <div className="fg-form-group">
          <label>Ton numéro WhatsApp <span className="fg-required">*</span></label>
          <div className="fg-phone-row" ref={dropdownRef}>
            {/* Sélecteur indicatif */}
            <button
              type="button"
              className={`fg-country-selector ${countryError ? 'error' : ''} ${countryDropdownOpen ? 'open' : ''}`}
              onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
            >
              {selectedCountry ? (
                <>
                  <span className="fg-country-flag">{selectedCountry.flag}</span>
                  <span className="fg-country-dial">{selectedCountry.dialCode}</span>
                </>
              ) : (
                <span className="fg-country-placeholder">🌍 Indicatif</span>
              )}
              <span className="fg-country-chevron">{countryDropdownOpen ? '▲' : '▼'}</span>
            </button>

            {/* Dropdown list */}
            {countryDropdownOpen && (
              <div className="fg-country-dropdown">
                <div className="fg-country-search-wrap">
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="fg-country-search"
                    placeholder="Rechercher un pays..."
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && filteredCountries.length > 0) {
                        selectCountry(filteredCountries[0])
                      }
                    }}
                  />
                </div>
                <div className="fg-country-list">
                  {filteredCountries.length === 0 ? (
                    <div className="fg-country-empty">Aucun pays trouvé</div>
                  ) : (
                    filteredCountries.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        className={`fg-country-option ${selectedCountry?.code === c.code ? 'selected' : ''}`}
                        onClick={() => selectCountry(c)}
                      >
                        <span className="fg-country-flag">{c.flag}</span>
                        <span className="fg-country-name">{c.name}</span>
                        <span className="fg-country-code">{c.dialCode}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Champ numéro */}
            <input
              id="fg-phone"
              ref={phoneRef}
              type="tel"
              placeholder="6XX XXX XXX"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`fg-phone-input ${phoneError ? 'error' : ''}`}
              onKeyDown={(e) => e.key === 'Enter' && emailRef.current?.focus()}
            />
          </div>
        </div>

        <div className="fg-form-group">
          <label htmlFor="fg-email">Ton adresse email</label>
          <input
            id="fg-email"
            ref={emailRef}
            type="email"
            placeholder="Ex : didier@gmail.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={emailError ? 'error' : ''}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        <button className="fg-btn-main" onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <span className="fg-spinner" />
          ) : (
            <>
              Accéder à la formation gratuite
              <span className="fg-btn-arrow">→</span>
            </>
          )}
        </button>

        <p className="fg-form-note">
          <span>🔒</span>
          Tes informations sont confidentielles. Zéro spam.
        </p>
      </div>
    </div>
  )
}

export default function FormationGratuitePage() {
  const [modalOpen, setModalOpen] = useState(false)
  const navigate = useNavigate()

  function handleSuccess(name) {
    setModalOpen(false)
    navigate(`/formation-video?name=${encodeURIComponent(name)}`)
  }

  return (
    <div className="fg-root">
      {/* TOP BAR */}
      <div className="fg-topbar">
        Formation gratuite · <span>100% terrain · Méthode ECOM 360 Afrique</span> · Accès immédiat
      </div>

      {/* HERO */}
      <div className="fg-hero-wrapper">
      <section className="fg-hero">
        <div className="fg-badge">
          <span className="fg-badge-dot" />
          🇨🇲 🇨🇮 🇸🇳 🇬🇳 🇧🇯 🇹🇬 🇲🇱 🇧🇫 &nbsp;+500 personnes ont déjà rejoint cette formation
        </div>

        <h1 className="fg-h1">
          Apprends à lancer<br />
          un business<br />
          e-commerce<br />
          <em>rentable en Afrique</em>
        </h1>

        {/* Vidéo bloquée — clique pour ouvrir le modal */}
        <div className="fg-locked-video" onClick={() => setModalOpen(true)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setModalOpen(true)}>
          <div className="fg-locked-thumb">
            <div className="fg-locked-overlay" />
            <div className="fg-play-big">▶</div>
          </div>
        </div>

        {/* CTA principal */}
        <button className="fg-btn-cta" onClick={() => setModalOpen(true)}>
          Accéder à la formation gratuite
          <span className="fg-btn-arrow">→</span>
        </button>
        <p className="fg-cta-note">100% gratuit · Accès immédiat · Zéro spam</p>
      </section>
      </div>

      {/* CE QUE TU VAS APPRENDRE */}
      <section className="fg-what-section">
        <div className="fg-section-label">Au programme</div>
        <div className="fg-section-title">
          Les 7 clés que tu vas<br />maîtriser gratuitement
        </div>
        <div className="fg-modules-grid">
          {MODULES.map((m) => (
            <div key={m.num} className="fg-module-card">
              <div className="fg-module-num">{m.num}</div>
              <div className="fg-module-title">{m.title}</div>
              <div className="fg-module-desc">{m.desc}</div>
            </div>
          ))}
        </div>

        {/* CTA intermédiaire */}
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <button className="fg-btn-cta" onClick={() => setModalOpen(true)}>
            Je veux accéder gratuitement
            <span className="fg-btn-arrow">→</span>
          </button>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="fg-testi-section">
        <div className="fg-testi-inner">
          <div className="fg-section-label">Résultats de la communauté</div>
          <div className="fg-section-title">
            Ils ont appliqué.<br />Voilà ce qui s'est passé.
          </div>
          <div className="fg-testi-grid">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="fg-testi-card">
                <div className="fg-testi-stars">★★★★★</div>
                <div className="fg-testi-text">{t.text}</div>
                <div className="fg-testi-author">
                  <div className="fg-testi-avatar">{t.initials}</div>
                  <div>
                    <div className="fg-testi-name">{t.name}</div>
                    <div className="fg-testi-country">{t.country}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA final */}
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <button className="fg-btn-cta" onClick={() => setModalOpen(true)}>
              Commencer maintenant — c'est gratuit
              <span className="fg-btn-arrow">→</span>
            </button>
          </div>
        </div>
      </section>

      <footer className="fg-footer">
        © 2024 Ecom Starter · Méthode ECOM 360 Afrique · Tous droits réservés
      </footer>

      {/* MODAL */}
      {modalOpen && (
        <FormModal onClose={() => setModalOpen(false)} onSuccess={handleSuccess} />
      )}
    </div>
  )
}
