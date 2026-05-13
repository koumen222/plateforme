export const MODULES = {
  cours: {
    key: 'cours',
    label: 'Cours',
    description: 'Accès aux formations et cours vidéo',
    icon: '📚',
    routes: ['/cours', '/course']
  },
  ressources_pdf: {
    key: 'ressources_pdf',
    label: 'Ressources PDF',
    description: 'Accès aux ressources et documents PDF',
    icon: '📄',
    routes: ['/ressources-pdf']
  },
  ebooks: {
    key: 'ebooks',
    label: 'Ebooks',
    description: 'Accès à la bibliothèque d\'ebooks',
    icon: '📖',
    routes: ['/ebook']
  },
  fichiers: {
    key: 'fichiers',
    label: 'Fichiers',
    description: 'Accès au gestionnaire de fichiers',
    icon: '📁',
    routes: ['/mes-fichiers']
  },
  commentaires: {
    key: 'commentaires',
    label: 'Commentaires',
    description: 'Accès à la section commentaires',
    icon: '💬',
    routes: ['/commentaires']
  },
  partenaires: {
    key: 'partenaires',
    label: 'Partenaires',
    description: 'Accès à l\'annuaire des partenaires',
    icon: '🤝',
    routes: ['/partenaires']
  },
  facebook_ads: {
    key: 'facebook_ads',
    label: 'Facebook Ads',
    description: 'Accès à l\'outil Facebook Ads',
    icon: '📊',
    routes: ['/connect-facebook', '/analyseur-ads', '/analyseur-ia']
  },
  coaching: {
    key: 'coaching',
    label: 'Coaching',
    description: 'Accès aux sessions de coaching',
    icon: '🎯',
    routes: ['/coaching-application', '/coaching-scale-7']
  },
  ecommerce: {
    key: 'ecommerce',
    label: 'E-commerce',
    description: 'Accès au module e-commerce',
    icon: '🛒',
    routes: ['/ecom']
  },
  communaute: {
    key: 'communaute',
    label: 'Communauté',
    description: 'Accès à la communauté',
    icon: '👥',
    routes: ['/communaute']
  },
  replays: {
    key: 'replays',
    label: 'Replays Lives',
    description: 'Accès aux replays des lives',
    icon: '🎬',
    routes: ['/replays-lives']
  },
  produits_gagnants: {
    key: 'produits_gagnants',
    label: 'Produits Gagnants',
    description: 'Accès à la liste des produits gagnants',
    icon: '🏆',
    routes: ['/produits-gagnants']
  }
}

export const ALL_MODULE_KEYS = Object.keys(MODULES)

export function hasModuleAccess(user, moduleKey) {
  if (!user) return false
  if (user.role === 'superadmin') return true
  if (!user.allowedModules || user.allowedModules.length === 0) return false
  return user.allowedModules.includes(moduleKey)
}

export function getModuleForRoute(pathname) {
  for (const mod of Object.values(MODULES)) {
    if (mod.routes.some(r => pathname.startsWith(r))) {
      return mod.key
    }
  }
  return null
}
