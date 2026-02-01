import { useState } from 'react'

const CTA_URL = 'https://my.moneyfusion.net/697e827a869cdbb310f2e7e6'

export default function CoachingScale7Page() {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)

  const getYouTubeEmbedUrl = (url) => {
    if (url.includes('youtu.be')) {
      const videoId = url.split('youtu.be/')[1]
      return `https://www.youtube.com/embed/${videoId}`
    }
    return url
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      {/* Title */}
      <div className="px-4 pt-12 text-center sm:px-6">
        <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
          COACHING SCALE 7 JOURS
        </h1>
      </div>

      {/* Video */}
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-black shadow-2xl shadow-emerald-500/30 ring-1 ring-emerald-500/20">
            {!isVideoLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-12 w-12 animate-pulse rounded-full bg-emerald-500/20" />
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

      {/* Urgency + CTA */}
      <div className="px-4 pb-12 text-center sm:px-6">
        <div className="mb-4 flex items-center justify-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
          </span>
          <span className="font-semibold text-red-400">Il reste 3 places</span>
        </div>
        <a
          href={CTA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-4 font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:scale-105"
        >
          <span>Réserver ma place</span>
          <span className="rounded-lg bg-white/20 px-3 py-1 text-sm">30 000 FCFA</span>
        </a>
      </div>
    </div>
  )
}
