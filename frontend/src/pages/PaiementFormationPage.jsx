import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './PaiementFormationPage.css'

const FEATURES = [
  { icon: '📣', text: 'Facebook Ads & TikTok Ads' },
  { icon: '🎙️', text: 'Accès aux lives et masterclass' },
  { icon: '🧰', text: 'Outils, stratégies et accompagnement' },
  { icon: '📦', text: 'Fournisseurs fiables + catalogue produits' },
  { icon: '💬', text: 'Communauté privée WhatsApp' },
  { icon: '🔄', text: 'Mises à jour gratuites à vie' },
]

const FAQ_DATA = [
  {
    q: "Quand est-ce que j'accède à la formation ?",
    a: "Tu reçois ton accès immédiatement après le paiement. Tu peux commencer à te former dans les minutes qui suivent.",
  },
  {
    q: "Comment se passe le paiement ?",
    a: "Le paiement se fait via Mobile Money (Orange Money, MTN MoMo) ou par virement. Tu reçois un lien sécurisé après avoir cliqué sur le bouton.",
  },
  {
    q: "Est-ce que l'abonnement mensuel est sans engagement ?",
    a: "Oui, tu peux annuler ton abonnement mensuel à tout moment. Aucun engagement, aucune pénalité.",
  },
  {
    q: "C'est quoi la différence entre mensuel et à vie ?",
    a: "L'option à vie te donne un accès permanent à toutes les formations, mises à jour et nouvelles ressources. L'abonnement mensuel te donne accès tant que tu payes.",
  },
]

export default function PaiementFormationPage() {
  const navigate = useNavigate()
  const [openFaq, setOpenFaq] = useState(null)

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx)
  }

  return (
    <div className="pf-root">
      {/* TOP BAR */}
      <div className="pf-topbar">
        Ecom Starter 3.0 · <span>Formation complète E-commerce Afrique</span> · Accès immédiat
      </div>

      {/* HERO */}
      <div className="pf-hero">
        <div className="pf-hero-inner">
          <div className="pf-badge">
            <span className="pf-badge-dot" />
            Offre spéciale en cours
          </div>
          <h1>
            Rejoins <em>Ecom Starter 3.0</em><br />
            et lance ton business
          </h1>
          <p className="pf-hero-sub">
            La formation <strong>e-commerce la plus complète</strong> adaptée aux réalités africaines.
            Choisis l'option qui te convient le mieux.
          </p>
        </div>
      </div>

      {/* PRICING CARDS */}
      <section className="pf-pricing-section">
        <div className="pf-pricing-grid">
          {/* CARD MENSUEL */}
          <div className="pf-card">
            <div className="pf-card-icon">🗓️</div>
            <div className="pf-card-label">Option mensuelle</div>
            <div className="pf-card-title">Abonnement Mensuel</div>

            <div className="pf-price-block">
              <div className="pf-price-main">
                <span className="pf-price-amount">10 000</span>
                <span className="pf-price-currency">FCFA</span>
                <span className="pf-price-period">/ mois</span>
              </div>
            </div>

            <p className="pf-card-desc">
              Rejoins la formation sans payer tout d'un coup. Accès complet tant que tu es abonné.
            </p>

            <ul className="pf-features">
              {FEATURES.map((f, i) => (
                <li key={i}>
                  <span className="pf-check">✓</span>
                  {f.text}
                </li>
              ))}
            </ul>

            <a
              className="pf-btn-cta outline"
              href="https://wa.me/237676778377?text=Bonjour%2C+je+souhaite+m%27inscrire+à+Ecom+Starter+3.0+%28abonnement+mensuel+10+000+FCFA%2Fmois%29"
              target="_blank"
              rel="noreferrer"
              id="btn-paiement-mensuel"
            >
              Choisir le mensuel
              <span className="pf-btn-arrow">→</span>
            </a>
          </div>

          {/* CARD À VIE (RECOMMANDÉ) */}
          <div className="pf-card recommended">
            <div className="pf-popular-tag">⭐ Meilleure offre</div>
            <div className="pf-card-icon">🚀</div>
            <div className="pf-card-label">Offre promotionnelle</div>
            <div className="pf-card-title">Accès à vie</div>

            <div className="pf-price-block">
              <div className="pf-price-main">
                <span className="pf-price-amount">45 000</span>
                <span className="pf-price-currency">FCFA</span>
              </div>
              <div className="pf-price-old">65 000 FCFA</div>
              <div className="pf-price-save">🔥 Économise 20 000 FCFA</div>
            </div>

            <p className="pf-card-desc">
              Profite de l'offre pour rejoindre la formation e-commerce complète. Accès permanent, mises à jour incluses.
            </p>

            <ul className="pf-features">
              {FEATURES.map((f, i) => (
                <li key={i}>
                  <span className="pf-check">✓</span>
                  {f.text}
                </li>
              ))}
            </ul>

            <a
              className="pf-btn-cta"
              href="https://wa.me/237676778377?text=Bonjour%2C+je+souhaite+m%27inscrire+à+Ecom+Starter+3.0+%28accès+à+vie+45+000+FCFA%29"
              target="_blank"
              rel="noreferrer"
              id="btn-paiement-vie"
            >
              Rejoindre Ecom Starter 3.0
              <span className="pf-btn-arrow">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* TRUST SECTION */}
      <section className="pf-trust-section">
        <div className="pf-trust-grid">
          <div className="pf-trust-item">
            <div className="pf-trust-icon">🔒</div>
            <div className="pf-trust-title">Paiement sécurisé</div>
            <div className="pf-trust-desc">Orange Money, MTN MoMo, virement bancaire</div>
          </div>
          <div className="pf-trust-item">
            <div className="pf-trust-icon">⚡</div>
            <div className="pf-trust-title">Accès immédiat</div>
            <div className="pf-trust-desc">Commence ta formation en quelques minutes</div>
          </div>
          <div className="pf-trust-item">
            <div className="pf-trust-icon">💬</div>
            <div className="pf-trust-title">Support WhatsApp</div>
            <div className="pf-trust-desc">Une équipe disponible pour t'accompagner</div>
          </div>
          <div className="pf-trust-item">
            <div className="pf-trust-icon">🔄</div>
            <div className="pf-trust-title">Mises à jour gratuites</div>
            <div className="pf-trust-desc">Nouvelles vidéos et ressources régulières</div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pf-faq-section">
        <h2 className="pf-faq-title">Questions fréquentes</h2>
        {FAQ_DATA.map((item, idx) => (
          <div
            key={idx}
            className={`pf-faq-item${openFaq === idx ? ' open' : ''}`}
          >
            <div className="pf-faq-q" onClick={() => toggleFaq(idx)}>
              <span>{item.q}</span>
              <span className="pf-faq-arrow">▾</span>
            </div>
            <div className="pf-faq-a">
              <p>{item.a}</p>
            </div>
          </div>
        ))}
      </section>

      {/* RETOUR */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <button
          onClick={() => navigate('/formation-video')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--gray)',
            fontSize: 13,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          ← Retour aux vidéos
        </button>
      </div>

      <footer className="pf-footer">
        © 2024 Ecom Starter 3.0 · Méthode ECOM 360 Afrique · Tous droits réservés
      </footer>
    </div>
  )
}
