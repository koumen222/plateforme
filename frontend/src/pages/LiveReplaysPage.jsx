import { useState } from 'react'

const LIVE_REPLAY = {
  id: 'live-1',
  title: 'Live — Facebook Ads',
  date: '27 Jan 2026',
  description: 'Replay complet du live Facebook Ads.',
  videoUrl: 'https://pub-8a740a15f8bd4446ba14d887e5b360cb.r2.dev/video/fb%20ads.mp4'
}

export default function LiveReplaysPage() {
  const [activeId] = useState(LIVE_REPLAY.id)

  const activeReplay = LIVE_REPLAY

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 pb-24 text-white md:pb-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 flex flex-col gap-2 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
            Live replays
          </span>
          <h1 className="text-2xl font-semibold uppercase tracking-wide text-white sm:text-3xl">
            Replays des lives
          </h1>
          <p className="text-sm text-white/70">
            Résumé du live Facebook Ads
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl shadow-black/60 md:max-w-3xl">
            <div className="aspect-video w-full">
              <video
                title={activeReplay.title}
                src={activeReplay.videoUrl}
                className="h-full w-full"
                controls
                controlsList="nodownload"
                playsInline
                preload="metadata"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
