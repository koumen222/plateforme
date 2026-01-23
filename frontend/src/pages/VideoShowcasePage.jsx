import { useState } from 'react'

const VIDEOS = [
  {
    id: '1099904938',
    title: 'Google Sheet setup livraisons'
  },
  {
    id: '1099902491',
    title: 'Base client',
    ctaLink: 'https://docs.google.com/spreadsheets/d/1wFGMoIXq729GLH-q7UwSOckklJ4rXCQeTx0GCEjqIY8/edit?usp=sharing'
  },
  {
    id: '1099907376',
    title: 'Calcul de rentabilité',
    ctaLink: 'https://docs.google.com/spreadsheets/d/16NFlzyRR9eVmczqAKSpHwXTI748FMIJ2kWV_LB1i-F0/edit?usp=sharing'
  },
  {
    id: '1099908552',
    title: 'Envoies des commandes'
  },
  {
    id: '1099907685',
    title: 'Taux de livraison'
  }
]

export default function VideoShowcasePage() {
  const [activeId, setActiveId] = useState(VIDEOS[0].id)

  const activeVideo = VIDEOS.find((video) => video.id === activeId) || VIDEOS[0]

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
            Video Library
          </span>
          <h1 className="text-2xl font-semibold uppercase tracking-wide text-white sm:text-3xl">
            Configuration des commandes
          </h1>
          <p className="text-sm text-white/60">
            Sélectionnez une vidéo pour l’afficher en grand format.
          </p>
        </div>
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 sm:snap-none">
          {VIDEOS.map((video, index) => {
            const isActive = video.id === activeId
            return (
              <button
                key={video.id}
                type="button"
                onClick={() => setActiveId(video.id)}
                className="group flex min-w-[190px] snap-start flex-col gap-2 text-left sm:snap-none"
              >
                <div
                  className={`relative aspect-video overflow-hidden rounded-xl border transition ${
                    isActive
                      ? 'border-emerald-400/70 shadow-lg shadow-emerald-500/20'
                      : 'border-white/15 group-hover:border-white/50'
                  }`}
                >
                  <iframe
                    title={`preview-${video.title}`}
                    src={`https://player.vimeo.com/video/${video.id}`}
                    className="h-full w-full scale-105 blur-sm opacity-80"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                      Video {index + 1}
                    </span>
                  </div>
                </div>
                <span className={`text-xs font-semibold uppercase tracking-wide ${
                  isActive ? 'text-emerald-200' : 'text-white/70'
                }`}>
                  {video.title}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl shadow-black/60">
          <div className="aspect-video w-full">
            <iframe
              title={activeVideo.title}
              src={`https://player.vimeo.com/video/${activeVideo.id}`}
              className="h-full w-full"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {activeVideo?.ctaLink && (
          <div className="mt-8 flex justify-center">
            <a
              href={activeVideo.ctaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-black shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400"
            >
              Télécharger le document
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
