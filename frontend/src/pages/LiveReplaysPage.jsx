import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const LIVE_REPLAYS = [
  {
    id: 'live-1',
    title: 'Nouvelle méthode Facebook Ads',
    date: '27 Jan 2026',
    description: 'Découvre la nouvelle méthode pour scaler tes campagnes Facebook Ads.',
    videoUrl: 'https://pub-8a740a15f8bd4446ba14d887e5b360cb.r2.dev/video/fb%20ads.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&h=400&fit=crop'
  },
  {
    id: 'live-2',
    title: 'Optimisation sur Shopify',
    date: '31 Jan 2026',
    description: 'Techniques avancées pour optimiser ta boutique Shopify.',
    videoUrl: 'https://youtu.be/rUdqmbfXutQ',
    thumbnail: 'https://images.unsplash.com/photo-1611162616305-c40b24ebe594?w=600&h=400&fit=crop'
  }
]

export default function LiveReplaysPage() {
  const [activeId, setActiveId] = useState(LIVE_REPLAYS[0].id)
  const [isPlaying, setIsPlaying] = useState(false)
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const activeReplay = LIVE_REPLAYS.find(replay => replay.id === activeId)

  const handleRequireLogin = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/replays-lives' } } })
    }
  }

  const handlePlayClick = () => {
    if (!isAuthenticated) {
      handleRequireLogin()
    } else {
      setIsPlaying(true)
    }
  }

  const getYouTubeEmbedUrl = (url) => {
    if (url.includes('youtu.be')) {
      const videoId = url.split('youtu.be/')[1]
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`
    }
    return url
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header with Info - No Background Image */}
      <div className="px-8 pt-8 md:px-16">
        <div className="mb-6 max-w-2xl">
          <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-wider text-white/60">
            {activeReplay.date}
          </span>
          <h1 className="mb-3 text-3xl font-bold md:text-5xl">
            {activeReplay.title}
          </h1>
          <p className="mb-4 text-base text-white/80">
            {activeReplay.description}
          </p>
          <div className="flex items-center gap-4">
            {!isPlaying ? (
              <button
                onClick={handlePlayClick}
                className="flex items-center gap-2 rounded bg-white px-8 py-3 font-semibold text-black transition hover:bg-white/90"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 5.84a.5.5 0 01.77-.42l7.15 4.16a.5.5 0 010 .84l-7.15 4.16a.5.5 0 01-.77-.42V5.84z" />
                </svg>
                <span>Lecture</span>
              </button>
            ) : (
              <button
                onClick={() => setIsPlaying(false)}
                className="flex items-center gap-2 rounded bg-white/20 px-8 py-3 font-semibold text-white transition hover:bg-white/30"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                <span>Détails</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Video Player Section - Top */}
      {isPlaying && isAuthenticated && (
        <div className="px-8 md:px-16">
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black shadow-2xl">
            {activeReplay.videoUrl.includes('youtu.be') || activeReplay.videoUrl.includes('youtube.com') ? (
              <iframe
                title={activeReplay.title}
                src={getYouTubeEmbedUrl(activeReplay.videoUrl)}
                className="h-full w-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : (
              <video
                title={activeReplay.title}
                src={activeReplay.videoUrl}
                className="h-full w-full"
                controls
                controlsList="nodownload"
                playsInline
                autoPlay
              />
            )}
          </div>
        </div>
      )}

      {/* Login Overlay */}
      {!isAuthenticated && isPlaying && (
        <div className="px-8 md:px-16">
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black/90 shadow-2xl">
            <button
              onClick={handleRequireLogin}
              className="flex h-full w-full flex-col items-center justify-center gap-4"
            >
              <svg className="h-16 w-16 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-lg font-semibold">Connecte-toi pour regarder le replay</span>
              <span className="btn-primary px-6 py-2 text-sm font-semibold uppercase tracking-wide">
                Se connecter
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Replay Carousel - Netflix Style */}
      <div className="px-8 pb-16 pt-12 md:px-16">
        <h2 className="mb-6 text-xl font-semibold md:text-2xl">Tous les replays</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {LIVE_REPLAYS.map((replay) => (
            <div
              key={replay.id}
              onClick={() => {
                setActiveId(replay.id)
                setIsPlaying(false)
              }}
              className="group relative cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10"
            >
              {/* Card */}
              <div className={`relative aspect-video overflow-hidden rounded-md transition-all duration-300 ${
                activeId === replay.id ? 'ring-2 ring-white' : ''
              }`}>
                <img
                  src={replay.thumbnail}
                  alt={replay.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="flex h-full flex-col items-center justify-center gap-2 p-2 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                      <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 5.84a.5.5 0 01.77-.42l7.15 4.16a.5.5 0 010 .84l-7.15 4.16a.5.5 0 01-.77-.42V5.84z" />
                      </svg>
                    </div>
                    <p className="text-xs font-medium line-clamp-2">{replay.title}</p>
                    <p className="text-[10px] text-white/60">{replay.date}</p>
                  </div>
                </div>
                {/* Selected Indicator */}
                {activeId === replay.id && (
                  <div className="absolute inset-0 ring-2 ring-white ring-inset" />
                )}
              </div>
              {/* Title below card */}
              <p className={`mt-2 text-sm font-medium line-clamp-1 transition-colors ${
                activeId === replay.id ? 'text-white' : 'text-white/70 group-hover:text-white'
              }`}>
                {replay.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
