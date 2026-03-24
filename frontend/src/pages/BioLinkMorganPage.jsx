import { useEffect, useRef } from 'react'

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  .bio-root *, .bio-root *::before, .bio-root *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .bio-root {
    --green: #ad46fc;
    --green-dark: #6a28a0;
    --green-glow: rgba(132, 53, 194, 0.25);
    --black: #0A0A0A;
    --gray-900: #111111;
    --gray-800: #1A1A1A;
    --gray-700: #262626;
    --gray-400: #888888;
    --gray-200: #CCCCCC;
    --white: #FFFFFF;
    --radius: 16px;
    --radius-sm: 10px;

    font-family: 'Inter', sans-serif;
    background-color: var(--black);
    color: var(--white);
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 0 0 60px;
    -webkit-font-smoothing: antialiased;
    position: relative;
    overflow-x: hidden;
  }

  .bio-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(132, 53, 194, 0.12) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  .bio-page {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 480px;
    padding: 0 20px;
  }

  /* HEADER */
  .bio-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 48px 0 32px;
    text-align: center;
  }

  .bio-avatar-wrapper {
    position: relative;
    width: 96px;
    height: 96px;
    margin-bottom: 16px;
  }

  .bio-avatar-ring {
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    background: conic-gradient(#8435c2, #6a28a0, #8435c2);
    animation: bio-spin 4s linear infinite;
  }

  @keyframes bio-spin {
    to { transform: rotate(360deg); }
  }

  .bio-avatar-inner {
    position: absolute;
    inset: 3px;
    border-radius: 50%;
    background: #1A1A1A;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .bio-avatar-inner img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }

  .bio-avatar-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #262626, #1A1A1A);
    font-size: 36px;
    font-weight: 800;
    color: #8435c2;
    letter-spacing: -1px;
    border-radius: 50%;
  }

  .bio-badge-live {
    position: absolute;
    bottom: 2px;
    right: 2px;
    background: #8435c2;
    color: #FFFFFF;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 20px;
    border: 2px solid #0A0A0A;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .bio-name {
    font-size: 26px;
    font-weight: 900;
    letter-spacing: -0.5px;
    color: #FFFFFF;
    margin-bottom: 8px;
  }

  .bio-name span { color: #8435c2; }

  .bio-tagline {
    font-size: 14px;
    font-weight: 500;
    color: #CCCCCC;
    line-height: 1.6;
    max-width: 300px;
  }

  /* URGENCY */
  .bio-urgency {
    background: linear-gradient(135deg, rgba(132,53,194,0.15), rgba(132,53,194,0.05));
    border: 1px solid rgba(132,53,194,0.3);
    border-radius: 10px;
    padding: 10px 16px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #8435c2;
  }

  .bio-urgency-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #8435c2;
    flex-shrink: 0;
    animation: bio-pulse 1.5s infinite;
  }

  @keyframes bio-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  /* CTA */
  .bio-cta-primary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 18px 24px;
    background: linear-gradient(135deg, #8435c2, #6a28a0);
    color: #FFFFFF;
    font-weight: 800;
    font-size: 16px;
    border-radius: 16px;
    text-decoration: none;
    margin-bottom: 12px;
    box-shadow: 0 0 30px rgba(132,53,194,0.35), 0 4px 20px rgba(0,0,0,0.4);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    letter-spacing: -0.2px;
    position: relative;
    overflow: hidden;
    border: none;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
  }

  .bio-cta-primary::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgba(255,255,255,0.15) 0%, transparent 50%);
    pointer-events: none;
  }

  .bio-cta-primary:active { transform: scale(0.98); }

  .bio-cta-sub {
    text-align: center;
    font-size: 12px;
    color: #888888;
    margin-bottom: 36px;
  }

  .bio-cta-sub strong { color: #8435c2; }

  /* SECTION LABEL */
  .bio-section-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #888888;
    margin-bottom: 16px;
  }

  .bio-section-label::before, .bio-section-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #262626;
  }

  /* OFFERS */
  .bio-offers {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 36px;
  }

  .bio-offer-card {
    display: flex;
    align-items: center;
    gap: 16px;
    background: #1A1A1A;
    border: 1px solid #262626;
    border-radius: 16px;
    padding: 16px 18px;
    text-decoration: none;
    color: #FFFFFF;
    transition: border-color 0.2s ease, transform 0.15s ease, background 0.2s ease;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .bio-offer-card:hover {
    border-color: #8435c2;
    background: #262626;
    transform: translateY(-2px);
  }

  .bio-offer-card:active { transform: scale(0.99); }

  .bio-offer-icon {
    font-size: 26px;
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #262626;
    border-radius: 10px;
  }

  .bio-offer-card.bio-featured .bio-offer-icon {
    background: rgba(132,53,194,0.15);
  }

  .bio-offer-info { flex: 1; min-width: 0; }

  .bio-offer-badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    background: rgba(132,53,194,0.15);
    color: #8435c2;
    border: 1px solid rgba(132,53,194,0.3);
    border-radius: 4px;
    padding: 2px 7px;
    margin-bottom: 5px;
  }

  .bio-offer-title {
    font-size: 15px;
    font-weight: 700;
    color: #FFFFFF;
    margin-bottom: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bio-offer-desc {
    font-size: 12px;
    color: #888888;
    line-height: 1.4;
  }

  .bio-offer-arrow {
    color: #888888;
    flex-shrink: 0;
    font-size: 20px;
    font-weight: 300;
    transition: color 0.2s, transform 0.2s;
  }

  .bio-offer-card:hover .bio-offer-arrow {
    color: #8435c2;
    transform: translateX(3px);
  }

  /* PROOF */
  .bio-proof {
    background: #1A1A1A;
    border: 1px solid #262626;
    border-radius: 16px;
    padding: 24px 20px;
    margin-bottom: 36px;
    position: relative;
    overflow: hidden;
  }

  .bio-proof::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #8435c2, transparent);
  }

  .bio-proof-headline {
    font-size: 22px;
    font-weight: 900;
    color: #FFFFFF;
    letter-spacing: -0.5px;
    margin-bottom: 6px;
    line-height: 1.2;
  }

  .bio-proof-headline .bio-hl { color: #8435c2; }

  .bio-proof-sub {
    font-size: 13px;
    color: #888888;
    margin-bottom: 20px;
    line-height: 1.5;
  }

  .bio-proof-stats {
    display: flex;
    gap: 12px;
  }

  .bio-proof-stat {
    flex: 1;
    background: #262626;
    border-radius: 10px;
    padding: 12px;
    text-align: center;
  }

  .bio-proof-stat-number {
    font-size: 20px;
    font-weight: 900;
    color: #8435c2;
    display: block;
    letter-spacing: -0.5px;
  }

  .bio-proof-stat-label {
    font-size: 11px;
    color: #888888;
    font-weight: 500;
    line-height: 1.3;
  }

  .bio-testimonial {
    margin-top: 20px;
    background: #262626;
    border-radius: 10px;
    padding: 14px 16px;
    border-left: 3px solid #8435c2;
  }

  .bio-testimonial-text {
    font-size: 13px;
    color: #CCCCCC;
    line-height: 1.6;
    font-style: italic;
    margin-bottom: 8px;
  }

  .bio-testimonial-author {
    font-size: 12px;
    color: #8435c2;
    font-weight: 600;
  }

  /* TRANSFORMATION */
  .bio-transformation {
    display: grid;
    grid-template-columns: 1fr 24px 1fr;
    gap: 0;
    align-items: center;
    margin-bottom: 36px;
  }

  .bio-transform-card {
    background: #1A1A1A;
    border: 1px solid #262626;
    border-radius: 16px;
    padding: 16px 14px;
    text-align: center;
  }

  .bio-transform-card.bio-after {
    border-color: rgba(132,53,194,0.4);
    background: rgba(132,53,194,0.05);
  }

  .bio-transform-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 8px;
    color: #888888;
  }

  .bio-transform-card.bio-after .bio-transform-label { color: #8435c2; }

  .bio-transform-emoji {
    font-size: 24px;
    display: block;
    margin-bottom: 6px;
  }

  .bio-transform-text {
    font-size: 12px;
    color: #CCCCCC;
    line-height: 1.5;
  }

  .bio-transform-arrow {
    text-align: center;
    font-size: 18px;
    color: #8435c2;
  }

  /* SOCIAL */
  .bio-social-links {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 40px;
  }

  .bio-social-link {
    display: flex;
    align-items: center;
    gap: 14px;
    background: #1A1A1A;
    border: 1px solid #262626;
    border-radius: 16px;
    padding: 14px 18px;
    text-decoration: none;
    color: #FFFFFF;
    font-weight: 600;
    font-size: 14px;
    transition: border-color 0.2s ease, background 0.2s ease, transform 0.15s ease;
    position: relative;
    overflow: hidden;
  }

  .bio-social-link:hover {
    border-color: #888888;
    background: #262626;
    transform: translateY(-1px);
  }

  .bio-social-link:active { transform: scale(0.99); }

  .bio-social-link.bio-wa { border-color: rgba(132, 53, 194, 0.35); }
  .bio-social-link.bio-wa:hover { border-color: #8435c2; background: rgba(132, 53, 194, 0.08); }

  .bio-social-icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 20px;
  }

  .bio-social-icon.bio-icon-wa  { background: rgba(37, 211, 102, 0.15); }
  .bio-social-icon.bio-icon-yt  { background: rgba(255, 0, 0, 0.12); }
  .bio-social-icon.bio-icon-tt  { background: rgba(255, 255, 255, 0.08); }

  .bio-social-info { flex: 1; }
  .bio-social-name { font-size: 14px; font-weight: 700; }
  .bio-social-handle { font-size: 12px; color: #888888; font-weight: 400; }
  .bio-social-chevron { color: #888888; font-size: 18px; }

  /* FOOTER */
  .bio-footer {
    text-align: center;
    font-size: 12px;
    color: #888888;
    padding-top: 8px;
  }

  .bio-footer a { color: #8435c2; text-decoration: none; font-weight: 600; }

  /* RIPPLE */
  .bio-ripple {
    position: absolute;
    border-radius: 50%;
    transform: scale(0);
    animation: bio-ripple-anim 0.5s linear;
    background-color: rgba(255,255,255,0.18);
    pointer-events: none;
  }

  @keyframes bio-ripple-anim {
    to { transform: scale(4); opacity: 0; }
  }
`

export default function BioLinkScalorPage() {
  const rootRef = useRef(null)

  useEffect(() => {
    // Ripple on click
    const targets = rootRef.current?.querySelectorAll('[data-ripple]') ?? []
    const handlers = []
    targets.forEach(el => {
      const handler = (e) => {
        const rect = el.getBoundingClientRect()
        const size = Math.max(rect.width, rect.height)
        const x = e.clientX - rect.left - size / 2
        const y = e.clientY - rect.top - size / 2
        const ripple = document.createElement('span')
        ripple.className = 'bio-ripple'
        ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`
        el.appendChild(ripple)
        setTimeout(() => ripple.remove(), 600)
      }
      el.addEventListener('click', handler)
      handlers.push({ el, handler })
    })

    // Counter animation
    const counters = rootRef.current?.querySelectorAll('[data-counter]') ?? []
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        const el = entry.target
        const raw = el.textContent
        const match = raw.match(/^(\d+)/)
        if (!match) return
        const end = parseInt(match[1], 10)
        const suffix = raw.replace(match[1], '')
        let current = 0
        const step = Math.ceil(end / 50)
        const timer = setInterval(() => {
          current = Math.min(current + step, end)
          el.textContent = current + suffix
          if (current >= end) clearInterval(timer)
        }, 30)
        observer.unobserve(el)
      })
    }, { threshold: 0.5 })
    counters.forEach(c => observer.observe(c))

    return () => {
      handlers.forEach(({ el, handler }) => el.removeEventListener('click', handler))
      observer.disconnect()
    }
  }, [])

  return (
    <>
      <style>{styles}</style>
      <div className="bio-root" ref={rootRef}>
        <div className="bio-page">

          {/* HEADER */}
          <header className="bio-header">
            <div className="bio-avatar-wrapper">
              <div className="bio-avatar-ring" />
              <div className="bio-avatar-inner">
                <img src="/morgan-photo.jpg" alt="Koumen Morgan" />
              </div>
              <span className="bio-badge-live">actif</span>
            </div>
            <h1 className="bio-name">Koumen Morgan <span>💼</span></h1>
            <p className="bio-tagline">J'aide les débutants en Afrique à lancer un business e-commerce rentable via <strong style={{color:'#8435c2'}}>Scalor</strong></p>
          </header>

          {/* URGENCY */}
          <div className="bio-urgency">
            <span className="bio-urgency-dot" />
            Offre limitée — Formation gratuite disponible maintenant
          </div>

          {/* MAIN CTA */}
          <a href="https://safitech.shop/course/se-lancer-en-e-commerce-en-afrique-en-2026---formation-gratuite" className="bio-cta-primary" data-ripple="true" target="_blank" rel="noreferrer">
            🎁 Accéder à la formation gratuite
          </a>
          <p className="bio-cta-sub">✅ 100% gratuit &nbsp;·&nbsp; <strong>Accès immédiat</strong> &nbsp;·&nbsp; Sans engagement</p>

          {/* OFFERS */}
          <p className="bio-section-label">Formations & ressources</p>
          <div className="bio-offers">
            <a href="https://www.safitech.shop/course/ecom-starter-30-la-formation-complte-en-e-commerce-en-afrique" className="bio-offer-card bio-featured" data-ripple="true" target="_blank" rel="noreferrer">
              <div className="bio-offer-icon">🚀</div>
              <div className="bio-offer-info">
                <span className="bio-offer-badge">Best-seller</span>
                <div className="bio-offer-title">Ecom Starter 3.0</div>
                <div className="bio-offer-desc">Formation complète e-commerce — de zéro à tes premières ventes</div>
              </div>
              <span className="bio-offer-arrow">›</span>
            </a>

            <a href="scalor.net" className="bio-offer-card" data-ripple="true" target="_blank" rel="noreferrer">
              <div className="bio-offer-icon">💼</div>
              <div className="bio-offer-info">
                <span className="bio-offer-badge">Solution business</span>
                <div className="bio-offer-title">Tester Scalor gratuitement</div>
                <div className="bio-offer-desc">La solution clé en main pour automatiser et scaler ton business</div>
              </div>
              <span className="bio-offer-arrow">›</span>
            </a>

            <a href="https://www.safitech.shop/ressources-pdf" className="bio-offer-card" data-ripple="true" target="_blank" rel="noreferrer">
              <div className="bio-offer-icon">📘</div>
              <div className="bio-offer-info">
                <span className="bio-offer-badge">Ebook</span>
                <div className="bio-offer-title">Réussir en e-commerce en Afrique</div>
                <div className="bio-offer-desc">Le guide pratique pour démarrer et rentabiliser rapidement</div>
              </div>
              <span className="bio-offer-arrow">›</span>
            </a>
          </div>

          {/* TRANSFORMATION */}
          <p className="bio-section-label">Avant / Après</p>
          <div className="bio-transformation">
            <div className="bio-transform-card">
              <div className="bio-transform-label">Avant</div>
              <span className="bio-transform-emoji">😓</span>
              <p className="bio-transform-text">Pas de business, pas de revenus, pas de méthode</p>
            </div>
            <div className="bio-transform-arrow">→</div>
            <div className="bio-transform-card bio-after">
              <div className="bio-transform-label">Après</div>
              <span className="bio-transform-emoji">💰</span>
              <p className="bio-transform-text">Business lancé, premières ventes, revenus qui scalent</p>
            </div>
          </div>

          {/* SOCIAL PROOF */}
          <p className="bio-section-label">Résultats concrets</p>
          <div className="bio-proof">
            <p className="bio-proof-headline">+1 000 000 <span className="bio-hl">FCFA</span> générés via Scalor</p>
            <p className="bio-proof-sub">Des e-commerçants débutants ont appliqué les stratégies Scalor et obtenu des résultats réels.</p>
            <div className="bio-proof-stats">
              <div className="bio-proof-stat">
                <span className="bio-proof-stat-number" data-counter="true">500+</span>
                <span className="bio-proof-stat-label">Élèves formés</span>
              </div>
              <div className="bio-proof-stat">
                <span className="bio-proof-stat-number" data-counter="true">1M+</span>
                <span className="bio-proof-stat-label">FCFA générés</span>
              </div>
              <div className="bio-proof-stat">
                <span className="bio-proof-stat-number" data-counter="true">98%</span>
                <span className="bio-proof-stat-label">Satisfaits</span>
              </div>
            </div>
            <div className="bio-testimonial">
              <p className="bio-testimonial-text">
                "Avant Koumen Morgan, je cherchais encore ma voie. 3 semaines après la formation,
                j'avais mes premières ventes. Aujourd'hui je génère plus de 400 000 FCFA par mois."
              </p>
              <span className="bio-testimonial-author">— Kouamé A., Côte d'Ivoire ✅</span>
            </div>
          </div>

          {/* CONTACT / SOCIAL */}
          <p className="bio-section-label">Me rejoindre</p>
          <div className="bio-social-links">
            <a href="https://wa.me/237676778377" className="bio-social-link bio-wa" data-ripple="true" target="_blank" rel="noreferrer">
              <div className="bio-social-icon bio-icon-wa">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div className="bio-social-info">
                <div className="bio-social-name">WhatsApp Direct</div>
                <div className="bio-social-handle">+237 676 778 377 — Réponse rapide</div>
              </div>
              <span className="bio-social-chevron">›</span>
            </a>

            <a href="https://chat.whatsapp.com/ELrkH1Fbv7WEcqg1laF36Y?mode=gi_t" className="bio-social-link bio-wa" data-ripple="true" target="_blank" rel="noreferrer">
              <div className="bio-social-icon bio-icon-wa">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div className="bio-social-info">
                <div className="bio-social-name">Groupe WhatsApp</div>
                <div className="bio-social-handle">Rejoindre la communauté e-commerce</div>
              </div>
              <span className="bio-social-chevron">›</span>
            </a>

            <a href="https://www.youtube.com/@koumenmorgan" className="bio-social-link" data-ripple="true" target="_blank" rel="noreferrer">
              <div className="bio-social-icon bio-icon-yt">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#FF0000">
                  <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
                </svg>
              </div>
              <div className="bio-social-info">
                <div className="bio-social-name">YouTube — @koumenmorgan</div>
                <div className="bio-social-handle">Conseils e-commerce gratuits</div>
              </div>
              <span className="bio-social-chevron">›</span>
            </a>

            <a href="https://tiktok.com/@[COMPTE]" className="bio-social-link" data-ripple="true">
              <div className="bio-social-icon bio-icon-tt">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z"/>
                </svg>
              </div>
              <div className="bio-social-info">
                <div className="bio-social-name">TikTok</div>
                <div className="bio-social-handle">Contenus business & motivation</div>
              </div>
              <span className="bio-social-chevron">›</span>
            </a>
          </div>

          {/* BOTTOM CTA */}
          <a href="https://safitech.shop/course/se-lancer-en-e-commerce-en-afrique-en-2026---formation-gratuite" className="bio-cta-primary" data-ripple="true" target="_blank" rel="noreferrer" style={{ marginBottom: 32 }}>
            🎯 Démarrer maintenant — C'est gratuit
          </a>

          {/* FOOTER */}
          <footer className="bio-footer">
            <p>© 2026 Koumen Morgan × Scalor &nbsp;·&nbsp; <a href="#">Mentions légales</a></p>
          </footer>

        </div>
      </div>
    </>
  )
}
