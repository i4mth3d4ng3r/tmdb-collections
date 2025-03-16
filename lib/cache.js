const { createCache } = require("cache-manager");
const { Keyv } = require("keyv");
const { KeyvCacheableMemory } = require("cacheable");
const { KeyvSqlite } = require("@keyv/sqlite");
const fs = require("fs");
const path = require("path");

// Create a temp directory for the database if it doesn't exist
const tmpDir = path.join(__dirname, "../tmp");
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

// Generate a unique database path for this server instance
// Use absolute path to avoid resolution issues during cleanup
const tempDbPath = path.resolve(tmpDir, `cache.sqlite`);

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

let lruCache = null;
const lruCacheSize = 500; //max number of keys in lru cache
let ttlCache = null;
let sqliteStore = null;

// Cache metrics
const metrics = {
  hits: 0,
  misses: 0,
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

  // LRU cache for movies (keep in memory)
  const lruStore = new KeyvCacheableMemory({
    ttl: MOVIE_TTL,
    lruSize: lruCacheSize,
    checkInterval: MOVIE_TTL / 2, //MOVIE_TTL + 1 day
  });
  lruCache = createCache({
    stores: [new Keyv({ store: lruStore })],
  });

  // TTL-only cache for other data (use SQLite for disk-based caching)
  try {
    console.log(`Creating SQLite cache at: ${tempDbPath}`);
    sqliteStore = new KeyvSqlite(`sqlite://${tempDbPath}`, {
      table: "keyv_cache",
      // busyTimeout: 2000, // Helps prevent 'database is locked' errors
    });

    ttlCache = createCache({
      stores: [new Keyv({ store: sqliteStore, ttl: COLLECTION_TTL })],
    });

    console.log("SQLite cache initialized successfully");
  } catch (error) {
    console.error("Failed to initialize SQLite cache:", error);
    // Fallback to memory cache if SQLite fails
    console.log("Falling back to memory cache");
    const ttlStore = new KeyvCacheableMemory({
      ttl: COLLECTION_TTL,
    });
    ttlCache = createCache({
      stores: [new Keyv({ store: ttlStore })],
      ttl: COLLECTION_TTL,
    });
  }

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

  // Update size metrics if it's a cache miss or refresh (new value being added)
  if ((!isHit || isRefresh) && value !== undefined) {
    const size = calculateSize(value);
    if (size > 0) {
      metrics.sizes.total += size;
      if (metrics.sizes[prefix] !== undefined) {
        metrics.sizes[prefix] += size;
      }
      if (DEBUG_CACHE) {
        console.log(`Added ${formatSize(size)} to ${prefix} cache (total: ${formatSize(metrics.sizes.total)})`);
      }
    }
  }

  // Track last logged size threshold to avoid duplicate logs
  if (!metrics.lastLoggedSizeThreshold) {
    metrics.lastLoggedSizeThreshold = 0;
  }

  // Check if we've crossed a new size threshold (100/200/300 MB)
  const totalSizeMB = metrics.sizes.total / (1024 * 1024);
  const thresholds = [30, 40, 50, 60, 70, 80, 90, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900, 1000];

  // Check if size decreased below previous threshold
  if (totalSizeMB < metrics.lastLoggedSizeThreshold) {
    // Find the highest threshold that's still below current size
    const newThreshold = thresholds.filter((t) => t <= totalSizeMB).pop() || 0;
    metrics.lastLoggedSizeThreshold = newThreshold;
  }
  // Check if size increased above new threshold
  else {
    for (const threshold of thresholds) {
      if (totalSizeMB >= threshold && metrics.lastLoggedSizeThreshold < threshold) {
        console.log(`[${new Date().toISOString()}] Cache size exceeded ${threshold}MB threshold: ${formatSize(metrics.sizes.total)}`);
        metrics.lastLoggedSizeThreshold = threshold;
        break;
      }
    }
  }

  // Periodically reconcile the total with the sum of components
  // Do this roughly every 100 cache operations
  if (Math.random() < 0.01) {
    synchronizeSizes();
  }
}

// Function to synchronize the total size with sum of components
function synchronizeSizes() {
  // Calculate sum of all component sizes
  let sum = 0;
  Object.entries(metrics.sizes).forEach(([key, size]) => {
    if (key !== "total" && typeof size === "number" && size > 0) {
      sum += size;
    } else if (key !== "total" && size < 0) {
      // Fix any negative component sizes
      console.log(`[${new Date().toISOString()}] Fixing negative size for ${key}: ${formatSize(size)}`);
      metrics.sizes[key] = 0;
    }
  });

  // If there's a significant discrepancy, update the total
  if (Math.abs(metrics.sizes.total - sum) > 1024) {
    // 1KB threshold to avoid minor floating point issues
    console.log(`[${new Date().toISOString()}] Synchronizing cache size metrics. 
      Current total: ${formatSize(metrics.sizes.total)}, 
      Sum of components: ${formatSize(sum)}, 
      Difference: ${formatSize(metrics.sizes.total - sum)}`);

    metrics.sizes.total = sum;
  }
}

// Cache monitoring functions
async function getCachePerformance() {
  // Synchronize sizes before reporting
  synchronizeSizes();

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

async function clearCache(target) {
  if (!lruCache || !ttlCache) return { cleared: false, reason: "Cache not initialized" };

  if (target) {
    // Without key tracking, we can only clear specific prefixes directly from caches
    if (lru_key_prefixes.includes(target)) {
      await lruCache.clear();
      console.log(`Cleared all keys with prefix ${target} from LRU cache`);
    } else {
      await ttlCache.clear();
      console.log(`Cleared all keys with prefix ${target} from TTL cache`);
    }

    // Reset size for the specific type
    if (metrics.sizes[target] !== undefined) {
      metrics.sizes.total -= metrics.sizes[target];
      metrics.sizes[target] = 0;
    }

    // Synchronize metrics after clearing
    synchronizeSizes();

    return { cleared: true, prefix: target };
  } else {
    // Clear all
    await lruCache.clear();
    await ttlCache.clear();
    resetMetrics();
    return { cleared: true, type: "all" };
  }
}

module.exports = {
  cacheWrapCollectionDetails,
  cacheWrapSearch,
  cacheWrapMovieDetails,
  cacheWrapOthers,
  getCachePerformance,
  clearCache,
  lruCache, // for testing
  tempDbPath, // Export path for debugging
};
