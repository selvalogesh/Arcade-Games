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
    cacheFirst({
      request: event.request,
      fallbackUrl: "/gallery/myLittleVader.jpg",
    })
  );
});

// caching startergies
async function cacheFirst({ request, fallbackUrl }) {
  // Go to the cache first
  const cachedResponse = await caches.match(request.url);
  const fetchedResponse = fetchCacheUpdateAndFallback(request, fallbackUrl); // not awaiting response
  return cachedResponse || fetchedResponse;
}

async function fetchCacheUpdateAndFallback(request, fallbackUrl) {
  try {
    const [fetchedResponse, cache] = await Promise.all([
      fetch(request),
      caches.open(cacheName),
    ]);
    cache.put(request, fetchedResponse.clone()); // not awaiting done status
    return fetchedResponse;
  } catch (error) {
    const fallbackResponse = await caches.match(fallbackUrl);
    if (fallbackResponse) {
      return fallbackResponse;
    }
    // when even the fallback response is not available, always return a Response object
    return new Response("Network error happened", {
      status: 408,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
