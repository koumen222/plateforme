export default function MobileShell({ title, children, rightSlot }) {
  return (
    <div className="min-h-screen bg-slate-100 pb-24 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Accueil</p>
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          </div>
          {rightSlot}
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-4">{children}</main>
    </div>
  )
}
