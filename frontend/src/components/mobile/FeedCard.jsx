export default function FeedCard({ author, time, location, content, stats }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-slate-200" aria-hidden="true" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900">{author}</p>
          <p className="text-xs text-slate-500">
            {time} • {location}
          </p>
        </div>
        <button type="button" className="text-sm text-slate-400">
          •••
        </button>
      </header>
      <p className="mt-3 text-sm text-slate-700">{content}</p>
      <div className="mt-3 h-40 rounded-2xl bg-gradient-to-br from-blue-100 via-blue-50 to-rose-100" />
      <footer className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>👍 {stats.likes}</span>
        <span>💬 {stats.comments}</span>
        <span>↗ {stats.shares}</span>
      </footer>
    </article>
  )
}
