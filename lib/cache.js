const { createCache } = require("cache-manager");
const { Keyv } = require("keyv");
const { KeyvCacheableMemory } = require("cacheable");

// Cache configuration
const NO_CACHE = 0;
const DEBUG_CACHE = 0;
const SIMPLE_DEBUG_CACHE = DEBUG_CACHE === 1 || 0;
const COLLECTION_KEY_PREFIX = "collection";
const MOVIE_KEY_PREFIX = "movie";
const SEARCH_KEY_PREFIX = "search";
const lru_key_prefixes = [MOVIE_KEY_PREFIX];
const OTHER_KEY_PREFIX = "other";
const OTHER_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const COLLECTION_TTL = 2.4 * 24 * 60 * 60 * 1000; // 2.4 days - with 1.5 days refresh threshold it will be cached for 0.9 of the day (buffering cron runs every 1 full day, so catalogs will be refreshed every day)
const COLLECTION_REFRESH_THRESHOLD = 1.5 * 24 * 60 * 60 * 1000; // 1.5 days windows in which some catalog call (e. g. buffering cron) executes refresh
const SEARCH_TTL = 2 * 24 * 60 * 60 * 1000; // 2 days
const MOVIE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days - some big number to treat possible issues with lru cache
const MAX_KEYS_TO_TRACK = 50000; // Limit number of keys we track for non-lru keys in performance metrics

let lruCache = null;
const lruCacheSize = 1000; //max number of keys in lru cache
let ttlCache = null;

// Cache metrics
const metrics = {
  hits: 0,
  misses: 0,
  keys: new Set(),
  lastAccessed: {},
  sizes: {
    total: 0,
    [COLLECTION_KEY_PREFIX]: 0,
    [MOVIE_KEY_PREFIX]: 0,
    [SEARCH_KEY_PREFIX]: 0,
  },
  typeStats: {
    [COLLECTION_KEY_PREFIX]: { hits: 0, misses: 0 },
    [MOVIE_KEY_PREFIX]: { hits: 0, misses: 0 },
    [SEARCH_KEY_PREFIX]: { hits: 0, misses: 0 },
  },
};

// Initialize caches
function initCache() {
  console.log("cache has been initialized");
  // LRU cache for movies
  const lruStore = new KeyvCacheableMemory({
    ttl: MOVIE_TTL,
    lruSize: lruCacheSize,
    checkInterval: MOVIE_TTL / 2, //MOVIE_TTL + 1 day
  });
  lruCache = createCache({
    stores: [new Keyv({ store: lruStore })],
  });

  // TTL-only cache for other data
  const ttlStore = new KeyvCacheableMemory({
    ttl: COLLECTION_TTL,
  });
  ttlCache = createCache({
    stores: [new Keyv({ store: ttlStore })],
    ttl: COLLECTION_TTL,
  });

  // Reset metrics when cache is initialized
  resetMetrics();

  return { lruCache, ttlCache };
}

// Initialize caches immediately
initCache();

// Get prefix from key
function getKeyPrefix(key) {
  return key.split(":")[0];
}

// collection-specific cache wrapper with refresh threshold
async function cacheWrapCollectionDetails(id, method, options = {}) {
  const { ttl, refreshThreshold, cache } = options;
  return cacheWrap(`${COLLECTION_KEY_PREFIX}:${id}`, method, {
    ttl: ttl || COLLECTION_TTL,
    refreshThreshold: refreshThreshold || COLLECTION_REFRESH_THRESHOLD,
    cache: cache || ttlCache,
  });
}

// Movie-specific cache wrapper with LRU
async function cacheWrapMovieDetails(id, method, options = {}) {
  const { ttl, cache } = options;
  return cacheWrap(`${MOVIE_KEY_PREFIX}:${id}`, method, {
    ttl: ttl || MOVIE_TTL,
    cache: cache || lruCache,
  });
}

// Movie-specific cache wrapper with LRU
async function cacheWrapOthers(id, method, options = {}) {
  const { ttl, cache } = options;
  return cacheWrap(`${OTHER_KEY_PREFIX}:${id}`, method, {
    ttl: ttl || OTHER_TTL,
    cache: cache || ttlCache,
  });
}

// Search-specific cache wrapper
async function cacheWrapSearch(query, method, options = {}) {
  const { ttl, cache } = options;
  return cacheWrap(`${SEARCH_KEY_PREFIX}:${query}`, method, {
    ttl: ttl || SEARCH_TTL,
    cache: cache || ttlCache,
  });
}

// Generic cache wrapper
async function cacheWrap(key, method, options = {}) {
  if (NO_CACHE) {
    return method();
  }

  // Get the appropriate cache instance from options
  const cache = options.cache;
  if (!cache) {
    console.error("No cache instance provided for key:", key);
    return method();
  }

  try {
    // For metrics tracking, check if value exists before wrap
    const cachedValue = await cache.get(key);
    const isHit = cachedValue !== undefined && cachedValue !== null;
    const expiresAt = await cache.ttl(key); //epoch time in ms
    // console.log("expiresAt", expiresAt);

    if (isHit) {
      updateMetrics(key, cachedValue, true);
      if (SIMPLE_DEBUG_CACHE) {
        // Calculate remaining TTL
        const remainingTTL = expiresAt ? expiresAt - Date.now() : null;
        const ttlDisplay = remainingTTL !== null ? remainingTTL : options.ttl || "infinite";
        console.log(`Cache HIT for key: ${key} (TTL: ${ttlDisplay}ms)`);
      }
    } else if (SIMPLE_DEBUG_CACHE) {
      console.log(`Cache MISS for key: ${key} (will cache with TTL: ${options.ttl || "infinite"}ms`);
    }

    // Use cache.wrap which handles refreshing automatically
    const value = await cache.wrap(key, method, options.ttl, options.refreshThreshold);

    // Only update metrics for misses since hits were handled above
    if (!isHit && value !== undefined && value !== null) {
      updateMetrics(key, value, false);
      if (DEBUG_CACHE) {
        console.log(`Cached new value for key: ${key}`);
      }
    }

    return value;
  } catch (error) {
    if (!error.message.includes("404")) {
      console.error(`Cache error for key: ${key}`, error);
    }
    // On error, execute method directly
    return method();
  }
}

// --------------------------------------------- cache metrics --------------------------------------------

// Reset metrics
function resetMetrics() {
  metrics.hits = 0;
  metrics.misses = 0;
  metrics.keys.clear();
  metrics.lastAccessed = {};
  metrics.sizes.total = 0;
  Object.keys(metrics.sizes).forEach((key) => {
    if (key !== "total") metrics.sizes[key] = 0;
  });
  Object.keys(metrics.typeStats).forEach((prefix) => {
    metrics.typeStats[prefix] = { hits: 0, misses: 0 };
  });
}

// Calculate size of value in bytes
function calculateSize(value) {
  try {
    const size = Buffer.byteLength(JSON.stringify(value), "utf8");
    return size;
  } catch (error) {
    console.error("Error calculating size:", error.message);
    return 0;
  }
}

// Format size to human readable
function formatSize(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// Update metrics
function updateMetrics(key, value, isHit, isRefresh = false) {
  const prefix = getKeyPrefix(key);
  const isLruKey = lru_key_prefixes.includes(prefix);

  // Update hit/miss counts - don't count refreshes as misses
  if (!isRefresh) {
    if (isHit) {
      metrics.hits++;
      if (metrics.typeStats[prefix]) {
        metrics.typeStats[prefix].hits++;
      }
    } else {
      metrics.misses++;
      if (metrics.typeStats[prefix]) {
        metrics.typeStats[prefix].misses++;
      }
    }
  }

  // Get current counts
  const lruKeys = Array.from(metrics.keys).filter((k) => lru_key_prefixes.includes(getKeyPrefix(k)));
  const nonLruKeys = Array.from(metrics.keys).filter((k) => !lru_key_prefixes.includes(getKeyPrefix(k)));

  // For LRU keys
  if (isLruKey) {
    // If we're over the LRU limit, remove oldest LRU key
    if (lruKeys.length >= lruCacheSize) {
      // lruSize from config
      const oldestLruKey = lruKeys.reduce((oldest, current) => {
        return metrics.lastAccessed[oldest] < metrics.lastAccessed[current] ? oldest : current;
      });
      metrics.keys.delete(oldestLruKey);
      delete metrics.lastAccessed[oldestLruKey];

      // Also update size metrics
      const oldPrefix = getKeyPrefix(oldestLruKey);
      const oldSize = calculateSize(value);
      if (oldSize > 0) {
        metrics.sizes.total -= oldSize;
        if (metrics.sizes[oldPrefix] !== undefined) {
          metrics.sizes[oldPrefix] -= oldSize;
        }
      }
    }
    // Always add LRU keys
    metrics.keys.add(key);
    metrics.lastAccessed[key] = Date.now();
  } else {
    // For non-LRU keys
    const remainingSpace = MAX_KEYS_TO_TRACK - lruKeys.length;

    // Only track non-LRU keys if we have space after reserving for LRU
    if (nonLruKeys.length >= remainingSpace) {
      // Remove oldest non-LRU key
      const oldestNonLruKey = nonLruKeys.reduce((oldest, current) => {
        return metrics.lastAccessed[oldest] < metrics.lastAccessed[current] ? oldest : current;
      });
      metrics.keys.delete(oldestNonLruKey);
      delete metrics.lastAccessed[oldestNonLruKey];

      // Also update size metrics
      const oldPrefix = getKeyPrefix(oldestNonLruKey);
      const oldSize = calculateSize(value);
      if (oldSize > 0) {
        metrics.sizes.total -= oldSize;
        if (metrics.sizes[oldPrefix] !== undefined) {
          metrics.sizes[oldPrefix] -= oldSize;
        }
      }
    }

    // Add non-LRU key if we have space
    if (nonLruKeys.length < remainingSpace) {
      metrics.keys.add(key);
      metrics.lastAccessed[key] = Date.now();
    } else if (DEBUG_CACHE) {
      console.log(`Skipped tracking non-LRU key ${key} - no space available after LRU reservation`);
    }
  }

  // Update size metrics if it's a cache miss or refresh (new value being added)
  if ((!isHit || isRefresh) && value !== undefined) {
    const size = calculateSize(value);
    if (size > 0) {
      // For refreshes, subtract old size first
      if (isRefresh) {
        const oldSize = calculateSize(value);
        metrics.sizes.total -= oldSize;
        if (metrics.sizes[prefix] !== undefined) {
          metrics.sizes[prefix] -= oldSize;
        }
      }

      // For LRU prefixes, only add size if we haven't hit the limit
      if (isLruKey) {
        // Count number of keys with this prefix
        const prefixKeys = Array.from(metrics.keys).filter((k) => getKeyPrefix(k) === prefix);
        if (prefixKeys.length <= lruCacheSize) {
          // Using lruSize from config
          metrics.sizes.total += size;
          if (metrics.sizes[prefix] !== undefined) {
            metrics.sizes[prefix] += size;
          }
          if (DEBUG_CACHE) {
            console.log(`Added ${formatSize(size)} to ${prefix} cache (total: ${formatSize(metrics.sizes.total)})`);
          }
        } else if (DEBUG_CACHE) {
          console.log(`Skipped adding size for ${prefix} - LRU limit reached`);
        }
      } else {
        // For non-LRU prefixes, add size as normal
        metrics.sizes.total += size;
        if (metrics.sizes[prefix] !== undefined) {
          metrics.sizes[prefix] += size;
        }
        if (DEBUG_CACHE) {
          console.log(`Added ${formatSize(size)} to ${prefix} cache (total: ${formatSize(metrics.sizes.total)})`);
        }
      }
    }
  }
}

// Cache monitoring functions
async function getCachePerformance() {
  const total = metrics.hits + metrics.misses;
  const sizes = {};

  // Format all sizes
  Object.entries(metrics.sizes).forEach(([key, size]) => {
    sizes[key] = formatSize(size);
  });

  return {
    hits: metrics.hits,
    misses: metrics.misses,
    total,
    hitRate: total ? ((metrics.hits / total) * 100).toFixed(2) + "%" : "0%",
    typeStats: metrics.typeStats,
    sizes,
  };
}

async function getCacheIndex() {
  // Count keys per type
  const keyCounts = {
    total: metrics.keys.size,
    [COLLECTION_KEY_PREFIX]: 0,
    [MOVIE_KEY_PREFIX]: 0,
    [SEARCH_KEY_PREFIX]: 0,
  };

  // Count keys for each type
  Array.from(metrics.keys).forEach((key) => {
    const prefix = getKeyPrefix(key);
    if (keyCounts[prefix] !== undefined) {
      keyCounts[prefix]++;
    }
  });

  return {
    keyCounts,
    sizes: Object.fromEntries(Object.entries(metrics.sizes).map(([key, size]) => [key, formatSize(size)])),
    keys: Array.from(metrics.keys),
    lastAccessed: metrics.lastAccessed,
  };
}

async function clearCache(target) {
  if (!lruCache || !ttlCache) return { cleared: false, reason: "Cache not initialized" };

  if (target) {
    // Clear specific prefix
    const keysToDelete = Array.from(metrics.keys).filter((key) => key.startsWith(target));
    await Promise.all(
      keysToDelete.map((key) => {
        if (lru_key_prefixes.some((prefix) => key.startsWith(prefix))) {
          console.log("deleting lru cache key:", key);
          lruCache.del(key);
        } else {
          console.log("deleting ttl cache key:", key);
          ttlCache.del(key);
        }
      })
    );
    keysToDelete.forEach((key) => {
      metrics.keys.delete(key);
      delete metrics.lastAccessed[key];
    });
    // Reset size for the specific type
    if (metrics.sizes[target] !== undefined) {
      metrics.sizes.total -= metrics.sizes[target];
      metrics.sizes[target] = 0;
    }
    return { cleared: true, prefix: target, keysCleared: keysToDelete.length };
  } else {
    // Clear all
    await lruCache.clear();
    await ttlCache.clear();
    metrics.keys.clear();
    metrics.lastAccessed = {};
    metrics.hits = 0;
    metrics.misses = 0;
    // Reset all sizes
    Object.keys(metrics.sizes).forEach((key) => {
      metrics.sizes[key] = 0;
    });
    Object.keys(metrics.typeStats).forEach((prefix) => {
      metrics.typeStats[prefix] = { hits: 0, misses: 0 };
    });
    return { cleared: true, type: "all" };
  }
}

module.exports = {
  cacheWrapCollectionDetails,
  cacheWrapSearch,
  cacheWrapMovieDetails,
  cacheWrapOthers,
  getCachePerformance,
  getCacheIndex,
  clearCache,
  lruCache, // for testing
};
