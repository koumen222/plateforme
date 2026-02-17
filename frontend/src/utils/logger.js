/**
 * Utilitaire de logging qui désactive les logs en production
 * Utilisez ce module au lieu de console.log directement
 */

const isDev = import.meta.env.DEV

export const logger = {
  log: (...args) => {
    if (isDev) {
      console.log(...args)
    }
  },
  error: (...args) => {
    // Les erreurs sont toujours loggées, même en production
    console.error(...args)
  },
  warn: (...args) => {
    if (isDev) {
      console.warn(...args)
    }
  },
  info: (...args) => {
    if (isDev) {
      console.info(...args)
    }
  }
}

