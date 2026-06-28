import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import './FormationGratuitePage.css'

const VIDEOS = [
  { num: 'Vidéo 1', title: 'La vérité sur l\'ecom en Afrique', youtubeId: '-NILGKZvC0s' },
  { num: 'Vidéo 2', title: 'Trouver un produit gagnant', youtubeId: 'cwx35jSW1v8' },
  { num: 'Vidéo 3', title: 'Fournisseurs et achats en chine', youtubeId: 'Qv57Dwrw8wA' },
  { num: 'Vidéo 4', title: 'Créer une boutique sur Scalor', youtubeId: '1H6B0wJ0I3M' },
  { num: 'Vidéo 5', title: 'Lancer une campagne Facebook Ads', youtubeId: 'IJDGrQAzegw' },
  { num: 'Vidéo 6', title: 'Le système complet', youtubeId: 'r2sgLD8TatE' },
]

export default function FormationVideoPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const name = params.get('name') || 'ami'
  const [activeIndex, setActiveIndex] = useState(0)

  const currentVideo = VIDEOS[activeIndex]

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
            Voici ta <strong>{currentVideo.num.toLowerCase()}</strong> : « {currentVideo.title} ».<br />
            {activeIndex === 0 && "Regarde-la jusqu'au bout — la suite arrive dans 2 jours sur WhatsApp."}
            {activeIndex === 1 && "Découvre la méthode pas-à-pas pour dénicher ton premier produit gagnant !"}
            {activeIndex === 2 && "Apprends à trouver des fournisseurs fiables et à acheter en Chine en toute sécurité !"}
            {activeIndex === 3 && "Découvre comment créer et configurer ta boutique e-commerce sur Scalor en quelques minutes !"}
            {activeIndex > 3 && "Regarde cette vidéo pour continuer ton apprentissage."}
          </p>
        </div>

        {/* PROGRESSION */}
        <div className="fg-video-progress">
          {VIDEOS.map((v, idx) => (
            <div
              key={v.num}
              onClick={() => setActiveIndex(idx)}
              className={`fg-vp-item${idx === activeIndex ? ' active' : ''}${!v.youtubeId ? ' locked' : ''}`}
              style={{ cursor: 'pointer' }}
            >
              <div className="fg-vp-num">{v.num}</div>
              <div className="fg-vp-title">{v.title}</div>
            </div>
          ))}
        </div>

        {/* VIDÉO */}
        <div className="fg-video-wrapper">
          {currentVideo.youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${currentVideo.youtubeId}?rel=0&autoplay=1`}
              title={currentVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="fg-video-placeholder">
              <div className="fg-play-btn" style={{ background: '#666', cursor: 'default' }}>🔒</div>
              <div className="fg-video-label">Cette vidéo sera bientôt disponible !</div>
            </div>
          )}
        </div>

        {/* CTA VIDÉO SUIVANTE */}
        <div className="fg-after-video">
          <h3>Tu veux aller plus loin ?</h3>
          <p>
            {activeIndex === 0 && "Super ! Continue maintenant avec la vidéo 2 pour découvrir comment trouver un produit gagnant."}
            {activeIndex === 1 && "Continue avec la vidéo 3 pour apprendre à trouver des fournisseurs fiables et acheter en Chine."}
            {activeIndex === 2 && "Continue avec la vidéo 4 pour découvrir comment créer ta boutique e-commerce sur Scalor."}
            {activeIndex === 3 && "Continue avec la vidéo 5 pour apprendre à lancer ta première campagne Facebook Ads."}
            {activeIndex === 4 && "Continue avec la vidéo 6 pour découvrir le système complet !"}
            {activeIndex === 5 && "Tu as terminé la formation gratuite ! Passe à la formation complète pour aller encore plus loin."}
          </p>
          {activeIndex < VIDEOS.length - 1 && VIDEOS[activeIndex + 1].youtubeId ? (
            <button
              className="fg-btn-wa"
              onClick={() => setActiveIndex(activeIndex + 1)}
            >
              {VIDEOS[activeIndex + 1].num} →
            </button>
          ) : activeIndex < VIDEOS.length - 1 ? (
            <div className="fg-video-label" style={{ marginTop: 12, fontWeight: 600 }}>
              La prochaine vidéo sera bientôt disponible !
            </div>
          ) : (
            <a
              className="fg-btn-wa"
              href={`https://wa.me/237676778377?text=Bonjour%2C+j%27ai+terminé+la+mini-formation+!`}
              target="_blank"
              rel="noreferrer"
            >
              ✉ Envoyer un message WhatsApp
            </a>
          )}

          {/* BOUTON REJOINDRE LA FORMATION COMPLÈTE — uniquement sur la dernière vidéo */}
          {activeIndex === VIDEOS.length - 1 && (
            <div style={{ marginTop: 20 }}>
              <button
                className="fg-btn-wa"
                onClick={() => navigate('/paiement-formation')}
                style={{
                  background: 'linear-gradient(135deg, #6c3fc5 0%, #8b5cf6 100%)',
                  boxShadow: '0 4px 20px rgba(108, 63, 197, 0.35)',
                  fontSize: 16,
                  padding: '16px 32px',
                }}
              >
                🚀 Rejoindre Ecom Starter 3.0
              </button>
              <div style={{ marginTop: 8, fontSize: 12, color: '#a78bcc' }}>
                À partir de 10 000 FCFA/mois · Accès à vie dès 45 000 FCFA
              </div>
            </div>
          )}
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
