// Import Redis avec gestion d'erreur si non disponible
let createClient = null;
let redisAvailable = false;

// Essayer d'importer redis de manière synchrone
try {
  // Utiliser import() dynamique dans une fonction async
  // Pour l'instant, on va gérer l'erreur dans les fonctions
  redisAvailable = true;
} catch (error) {
  console.warn('⚠️ Module redis non disponible:', error.message);
  console.warn('   Les tokens Meta utiliseront le fallback en mémoire');
}

// Configuration Redis
const REDIS_URL = process.env.REDIS_URL || process.env.REDISCLOUD_URL || 'redis://localhost:6379';

let redisClient = null;
let redisModule = null;

/**
 * Initialise le module Redis de manière asynchrone
 */
async function initRedis() {
  if (redisModule) {
    return redisModule;
  }

  try {
    redisModule = await import('redis');
    createClient = redisModule.createClient;
    redisAvailable = true;
    return redisModule;
  } catch (error) {
    console.warn('⚠️ Module redis non disponible:', error.message);
    console.warn('   Les tokens Meta utiliseront le fallback en mémoire');
    redisAvailable = false;
    return null;
  }
}

/**
 * Initialise et retourne le client Redis
 * @returns {Promise<RedisClient>}
 */
export async function getRedisClient() {
  // Initialiser Redis si pas encore fait
  if (!redisModule && redisAvailable) {
    await initRedis();
  }

  if (!createClient) {
    return null;
  }

  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  try {
    redisClient = createClient({
      url: REDIS_URL
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis Client Connected');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error(' Erreur connexion Redis:', error);
    // Retourner null si Redis n'est pas disponible (fallback en mémoire)
    return null;
  }
}

/**
 * Stocke une valeur dans Redis avec TTL
 * @param {string} key - Clé Redis
 * @param {string} value - Valeur à stocker
 * @param {number} ttlSeconds - TTL en secondes (défaut: 1800 = 30 min)
 * @returns {Promise<boolean>}
 */
export async function setRedisValue(key, value, ttlSeconds = 1800) {
  try {
    const client = await getRedisClient();
    if (!client) {
      return false;
    }

    await client.setEx(key, ttlSeconds, value);
    return true;
  } catch (error) {
    console.error('❌ Erreur setRedisValue:', error);
    return false;
  }
}

/**
 * Récupère une valeur depuis Redis
 * @param {string} key - Clé Redis
 * @returns {Promise<string|null>}
 */
export async function getRedisValue(key) {
  try {
    const client = await getRedisClient();
    if (!client) {
      return null;
    }

    const value = await client.get(key);
    return value;
  } catch (error) {
    console.error('❌ Erreur getRedisValue:', error);
    return null;
  }
}

/**
 * Supprime une clé de Redis
 * @param {string} key - Clé Redis
 * @returns {Promise<boolean>}
 */
export async function deleteRedisKey(key) {
  try {
    const client = await getRedisClient();
    if (!client) {
      return false;
    }

    await client.del(key);
    return true;
  } catch (error) {
    console.error('❌ Erreur deleteRedisKey:', error);
    return false;
  }
}

/**
 * Ferme la connexion Redis
 */
export async function closeRedisConnection() {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.quit();
      redisClient = null;
    }
  } catch (error) {
    console.error('❌ Erreur fermeture Redis:', error);
  }
}

export default {
  getRedisClient,
  setRedisValue,
  getRedisValue,
  deleteRedisKey,
  closeRedisConnection
};
