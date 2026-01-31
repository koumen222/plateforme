import { useState } from 'react'

const CTA_URL = 'https://my.moneyfusion.net/697e827a869cdbb310f2e7e6'

export default function CoachingScale7Page() {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)

  const getYouTubeEmbedUrl = (url) => {
    if (url.includes('youtu.be')) {
      const videoId = url.split('youtu.be/')[1]
      return `https://www.youtube.com/embed/${videoId}`
    }
    if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(new URL(url).search)
      const videoId = urlParams.get('v')
      return `https://www.youtube.com/embed/${videoId}`
    }
    return url
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Hero Section */}
      <div className="relative px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-sm font-medium text-emerald-400">Places limitées</span>
          </div>

          {/* Title */}
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            <span className="bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
              COACHING SCALE 7 JOURS
            </span>
          </h1>

          {/* Objective */}
          <p className="mb-8 text-2xl font-bold text-emerald-400 sm:text-3xl">
            OBJECTIF 100 000 FCFA / JOUR
          </p>

          {/* Description */}
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-300">
            Une structure complète de A à Z pour lancer, optimiser et scaler ta campagne e-commerce en 7 jours chrono.
          </p>

          {/* CTA Button - Top */}
          <a
            href={CTA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative mb-12 inline-flex items-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-4 font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 hover:shadow-emerald-500/40"
          >
            <span className="relative z-10">Réserver ma place</span>
            <span className="relative z-10 rounded-lg bg-white/20 px-3 py-1 text-sm">10 000 FCFA</span>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-emerald-600 to-emerald-700 transition-transform duration-300 group-hover:translate-x-0"></div>
          </a>
        </div>
      </div>

      {/* Video Section */}
      <div className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-black/50">
            {!isVideoLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                <div className="text-center">
                  <div className="mb-4 inline-flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-emerald-500/20">
                    <svg className="h-8 w-8 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 5.84a.5.5 0 01.77-.42l7.15 4.16a.5.5 0 010 .84l-7.15 4.16a.5.5 0 01-.77-.42V5.84z" />
                    </svg>
                  </div>
                  <p className="text-slate-400">Chargement de la vidéo...</p>
                </div>
              </div>
            )}
            <iframe
              src={getYouTubeEmbedUrl('https://youtu.be/YY-X-NPVk6Y')}
              title="Coaching Scale 7 Jours"
              className="h-full w-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              onLoad={() => setIsVideoLoaded(true)}
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-2xl font-bold sm:text-3xl">
            Ce que tu vas apprendre
          </h2>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: '🚀', title: 'Lancement rapide', desc: 'Structure complète pour démarrer en 7 jours' },
              { icon: '📈', title: 'Optimisation', desc: 'Techniques avancées de scaling' },
              { icon: '🎯', title: 'Ciblage', desc: 'Trouver les bons audiences' },
              { icon: '💰', title: '100K/jour', desc: 'Objectif concret et atteignable' },
              { icon: '📱', title: 'E-commerce', desc: 'Focus sur la vente en ligne' },
              { icon: '👥', title: 'Accompagnement', desc: 'Coaching personnalisé' },
            ].map((feature, index) => (
              <div
                key={index}
                className="group rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:border-emerald-500/30 hover:bg-white/10"
              >
                <div className="mb-3 text-3xl">{feature.icon}</div>
                <h3 className="mb-2 font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-slate-900 p-8 text-center">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/20 blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-emerald-500/20 blur-3xl"></div>
            
            <p className="mb-2 text-slate-400">Investissement</p>
            <div className="mb-6 flex items-baseline justify-center gap-2">
              <span className="text-5xl font-bold text-white">10 000</span>
              <span className="text-xl text-slate-400">FCFA</span>
            </div>
            
            <ul className="mb-8 space-y-3 text-left text-slate-300">
              <li className="flex items-center gap-3">
                <svg className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                7 jours de coaching intensif
              </li>
              <li className="flex items-center gap-3">
                <svg className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Structure complète A à Z
              </li>
              <li className="flex items-center gap-3">
                <svg className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Support continu
              </li>
              <li className="flex items-center gap-3">
                <svg className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Accès aux replays
              </li>
            </ul>

            <a
              href={CTA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-xl bg-emerald-500 py-4 font-bold text-white transition hover:bg-emerald-600"
            >
              Réserver ma place maintenant
            </a>
          </div>
        </div>
      </div>

      {/* Urgency Section */}
      <div className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
            <p className="mb-2 font-semibold text-amber-400">⚠️ Attention</p>
            <p className="text-slate-300">
              Les places sont limitées pour garantir la qualité du coaching. 
              Ne manque pas cette opportunité de scaler ton business.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
