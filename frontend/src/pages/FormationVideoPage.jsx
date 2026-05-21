import { useSearchParams, useNavigate } from 'react-router-dom'
import './FormationGratuitePage.css'

const VIDEOS = [
  { num: 'Vidéo 1', title: 'La vérité sur l\'ecom en Afrique', active: true },
  { num: 'Vidéo 2', title: 'Trouver un produit gagnant', locked: true },
  { num: 'Vidéo 3', title: 'Créer une offre irrésistible', locked: true },
  { num: 'Vidéo 4', title: 'Facebook Ads sans gaspiller', locked: true },
  { num: 'Vidéo 5', title: 'Le système complet', locked: true },
]

export default function FormationVideoPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const name = params.get('name') || 'ami'

  return (
    <div className="fg-root">
      {/* TOP BAR */}
      <div className="fg-topbar">
        Formation gratuite · <span>100% terrain · Méthode ECOM 360 Afrique</span> · Accès immédiat
      </div>

      <section className="fg-video-section" style={{ marginTop: 48 }}>
        {/* INTRO */}
        <div className="fg-video-intro">
          <div className="fg-welcome">
            Bienvenue, <span>{name}</span> 👋
          </div>
          <p>
            Voici ta première vidéo. Regarde-la jusqu'au bout —<br />
            la suite arrive dans 2 jours sur WhatsApp.
          </p>
        </div>

        {/* PROGRESSION */}
        <div className="fg-video-progress">
          {VIDEOS.map((v) => (
            <div
              key={v.num}
              className={`fg-vp-item${v.active ? ' active' : ''}${v.locked ? ' locked' : ''}`}
            >
              <div className="fg-vp-num">{v.num}</div>
              <div className="fg-vp-title">{v.title}</div>
            </div>
          ))}
        </div>

        {/* VIDÉO */}
        <div className="fg-video-wrapper">
          {/* Remplace le bloc ci-dessous par :
              <iframe src="https://www.youtube.com/embed/TON_ID_VIDEO" allowFullScreen />
          */}
          <div className="fg-video-placeholder">
            <div className="fg-play-btn">▶</div>
            <div className="fg-video-label">Vidéo 1 — Insère ton lien YouTube ici</div>
          </div>
        </div>

        {/* CTA WHATSAPP */}
        <div className="fg-after-video">
          <h3>Tu veux aller plus loin ?</h3>
          <p>
            La vidéo 2 arrive dans 2 jours sur WhatsApp.<br />
            Des questions ? Envoie-moi un message maintenant.
          </p>
          <a
            className="fg-btn-wa"
            href="https://wa.me/TONNUM?text=Bonjour%2C+j%27ai+regardé+la+vidéo+1+de+la+mini-formation+!"
            target="_blank"
            rel="noreferrer"
          >
            ✉ Envoyer un message WhatsApp
          </a>
        </div>

        {/* RETOUR */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button
            onClick={() => navigate('/formation-gratuite')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--gray)',
              fontSize: 13,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            ← Retour à la page de présentation
          </button>
        </div>
      </section>

      <footer className="fg-footer">
        © 2024 Ecom Starter · Méthode ECOM 360 Afrique · Tous droits réservés
      </footer>
    </div>
  )
}
