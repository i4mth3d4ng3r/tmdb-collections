const { lruCache, cacheWrapMovieDetails, cacheWrapCatalog, clearCache } = require("../lib/cache");
const { KeyvCacheableMemory } = require("cacheable");
const { Keyv } = require("keyv");

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testRefreshThreshold() {
  console.log("\n=== Testing Refresh Threshold ===");
  await clearCache();

  const testTTL = 10000; // 10 seconds
  const refreshThreshold = 5000; // 5 seconds
  let callCount = 0;
  let lastCallTime = 0;

  const testMethod = () => {
    callCount++;
    lastCallTime = Date.now();
    console.log(`Method called at ${new Date().toISOString()} (call #${callCount})`);
    return `Value from call ${callCount}`;
  };

  // Initial cache set
  console.log("\nInitial cache set (TTL: 10s, Refresh Threshold: 5s)");
  const initial = await cacheWrapCatalog("refresh-test", testMethod, {
    ttl: testTTL,
    refreshThreshold: refreshThreshold,
  });
  console.log("Initial value:", initial);
  console.log("Call count:", callCount, "Last call time:", new Date(lastCallTime).toISOString());

  // Wait until we're in refresh threshold window
  console.log("\nWaiting 6 seconds (entering refresh window at 5s)...");
  await sleep(6000);

  // This should:
  // 1. Return the cached value (still valid for 4 more seconds)
  // 2. Trigger a background refresh (because we're past refresh threshold)
  console.log("\nGetting value at 6s (should trigger background refresh)");
  const valueAtSixSeconds = await cacheWrapCatalog("refresh-test", testMethod, {
    ttl: testTTL,
    refreshThreshold: refreshThreshold,
  });
  console.log("Returned cached value:", valueAtSixSeconds);
  console.log("Call count:", callCount, "Last call time:", new Date(lastCallTime).toISOString());

  // Wait for background refresh to complete
  console.log("\nWaiting 2 seconds for background refresh to complete...");
  await sleep(2000);

  // Should now get the refreshed value
  const refreshedValue = await cacheWrapCatalog("refresh-test", testMethod, {
    ttl: testTTL,
    refreshThreshold: refreshThreshold,
  });
  console.log("Value after waiting:", refreshedValue);
  console.log("Final call count:", callCount, "Last call time:", new Date(lastCallTime).toISOString());
}

async function testMovieDetailsCache() {
  console.log("\n=== Testing Movie Details Cache with LRU ===\n");

  async function verifyCache(inCache, evicted, message, expectedValues = {}) {
    console.log(message);
    console.log("Current cache state:");

    console.log("Checking items that should be in cache:");
    for (const key of inCache) {
      const movieKey = `movie:${key}`;
      const value = await lruCache.get(movieKey);
      const expected = expectedValues[key] || `Movie ${key} details`;

      if (value === expected) {
        console.log(`✅ PASS: Movie ${key} is in cache with value: ${value}`);
      } else {
        console.log(`❌ FAIL: Movie ${key} should be in cache with value ${expected} but got: ${value}`);
      }
    }

    if (evicted && evicted.length > 0) {
      console.log("\nChecking items that should be evicted:");
      for (const key of evicted) {
        const movieKey = `movie:${key}`;
        const value = await lruCache.get(movieKey);

        if (value === null) {
          console.log(`✅ PASS: Movie ${key} was correctly evicted`);
        } else {
          console.log(`❌ FAIL: Movie ${key} should be evicted but got value: ${value}`);
        }
      }
    }

    console.log("\n---\n");
  }

  // Test 1: Basic Set Operations
  console.log("Test 1: Basic Set Operations");
  console.log("Setting movies A, B, C...\n");

  await Promise.all([
    cacheWrapMovieDetails("A", () => "Movie A details"),
    cacheWrapMovieDetails("B", () => "Movie B details"),
    cacheWrapMovieDetails("C", () => "Movie C details"),
  ]);

  await verifyCache(["A", "B", "C"], [], "\nAfter setting A, B, C");

  // Test 2: LRU Eviction
  console.log("Test 2: LRU Eviction");
  console.log("Setting movie D (should evict A)...\n");

  await cacheWrapMovieDetails("D", () => "Movie D details");
  await verifyCache(["B", "C", "D"], ["A"], "\nAfter adding D (should evict A)");

  // Test 3: Access Order Updates
  console.log("Test 3: Access Order Updates");
  console.log("Accessing B and setting E...\n");

  await lruCache.get("movie:B");
  await cacheWrapMovieDetails("E", () => "Movie E details");

  await verifyCache(["B", "D", "E"], ["A", "C"], "\nAfter accessing B and adding E");

  // Test 4: Multiple Access Order Updates
  console.log("Test 4: Multiple Access Order Updates");
  console.log("Accessing D, B and setting F...\n");

  await lruCache.get("movie:D");
  await lruCache.get("movie:B");
  await cacheWrapMovieDetails("F", () => "Movie F details");

  await verifyCache(["D", "B", "F"], ["A", "C", "E"], "\nAfter accessing D, B and adding F");

  // Test 5: Update Existing Key
  console.log("Test 5: Update Existing Key");
  console.log("Updating movie D...\n");

  await lruCache.set("movie:D", "Updated Movie D details");
  await verifyCache(["D", "B", "F"], ["A", "C", "E"], "\nAfter updating D", {
    D: "Updated Movie D details", // Override expected value for D
  });

  // Test 6: Rapid Sequential Updates
  console.log("Test 6: Rapid Sequential Updates");
  console.log("Setting movies X, Y, Z in parallel...\n");

  await Promise.all([
    cacheWrapMovieDetails("X", () => "Movie X details"),
    cacheWrapMovieDetails("Y", () => "Movie Y details"),
    cacheWrapMovieDetails("Z", () => "Movie Z details"),
  ]);

  await verifyCache(["X", "Y", "Z"], ["D", "B", "F"], "\nAfter rapid sequential updates");

  // Test 7: TTL Operations
  console.log("Test 7: TTL Operations");
  console.log("Setting movies with TTL...\n");

  await lruCache.set("movie:TTL1", "Movie TTL1 details", { ttl: 1000 }); // 1 second TTL
  await lruCache.set("movie:TTL2", "Movie TTL2 details", { ttl: 3000 }); // 3 seconds TTL
  await lruCache.set("movie:TTL3", "Movie TTL3 details");

  await verifyCache(["TTL1", "TTL2", "TTL3"], [], "\nAfter setting TTL items");

  console.log("\nWaiting 1.5 seconds for TTL1 to expire...");
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const ttl1Value = await lruCache.get("movie:TTL1");
  const ttl2Value = await lruCache.get("movie:TTL2");

  console.log(`TTL1 value after 1.5s: ${ttl1Value}`);
  console.log(`TTL2 value after 1.5s: ${ttl2Value}`);

  if (ttl1Value === null) {
    console.log("✅ PASS: TTL1 correctly expired");
  } else {
    console.log("❌ FAIL: TTL1 should have expired");
  }

  if (ttl2Value === "Movie TTL2 details") {
    console.log("✅ PASS: TTL2 still valid");
  } else {
    console.log("❌ FAIL: TTL2 should still be valid");
  }

  console.log("\nAll movie details cache tests completed!");
}

async function runTests() {
  try {
    // await testRefreshThreshold();
    await testMovieDetailsCache();
  } catch (error) {
    console.error("Test error:", error);
  }
}

runTests();
