import { Link } from 'react-router-dom'

export default function BottomNav({ items, activeId, onChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
      <div className="flex items-center gap-2 overflow-x-auto px-3 pb-2 pt-2.5">
        {items.map((item) => {
          const isActive = item.id === activeId
          const Icon = item.icon
          const content = (
            <>
              <span
                className={`relative grid h-7 w-7 place-items-center rounded-xl ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.badge > 0 && (
                  <span className="absolute -right-1 -top-1 rounded-full border-2 border-white bg-red-500 px-1 py-0 text-[7px] font-semibold text-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </span>
              <span className="w-full max-w-[72px] truncate text-center">{item.label}</span>
            </>
          )

          if (item.href) {
            return (
              <Link
                key={item.id}
                to={item.href}
                onClick={() => onChange?.(item.id)}
                className={`flex min-w-[72px] flex-col items-center gap-1 rounded-2xl px-2 py-1 text-[11px] font-medium transition ${
                  isActive ? 'text-blue-600' : 'text-slate-500'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {content}
              </Link>
            )
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange?.(item.id)}
              className={`flex min-w-[72px] flex-col items-center gap-1 rounded-2xl px-2 py-1 text-[11px] font-medium transition ${
                isActive ? 'text-blue-600' : 'text-slate-500'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {content}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
