const cacheName = "v1.0";

const cacheAssets = []; // for pre-caching resources

// installation
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installed");
  event.waitUntil(async () => {
    const cacheStore = await caches.open(cacheName);
    await cacheStore.addAll(cacheAssets);
    console.log("Service Worker: Pre-Caching Files");
    self.skipWaiting();
  });
});

// activation
self.addEventListener("activate", () => {
  console.log("Service Worker: Activated");
});

// fetch
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.open(cacheName).then(async (cache) => {
      // Go to the cache first
      const cachedResponse = await cache.match(event.request.url);
      // Return a cached response if we have one
      if (cachedResponse) {
        return cachedResponse;
      }
      const fetchedResponse = await fetch(event.request);
      // Add the network response to the cache for later visits
      cache.put(event.request, fetchedResponse.clone());
      return fetchedResponse;
    })
  );
});
