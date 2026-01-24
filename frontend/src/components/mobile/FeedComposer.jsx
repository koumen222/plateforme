export default function FeedComposer() {
  return (
    <section className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="h-11 w-11 rounded-full bg-slate-200" aria-hidden="true" />
      <input
        type="text"
        placeholder="Exprimez-vous..."
        className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 placeholder:text-slate-400"
      />
    </section>
  )
}
