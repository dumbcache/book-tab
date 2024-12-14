export const CACHE_DATA = "pocket-data";

/**
 *
 * @param {Request} req
 * @param {Boolean} [refresh]
 * @returns {Promise<Response>}
 */
export async function fetchLocal(req, refresh) {
    const cache = await caches.open(CACHE_DATA);
    if (refresh) await cache.delete(req);
    const cacheData = await cache.match(req);
    if (cacheData) {
        return cacheData;
    } else {
        const response = await fetch(req);
        const url = new URL(req.url);
        if (url.searchParams.has("pageToken")) return response;
        if (response.status === 200) {
            cache.put(req, response.clone());
        }
        return response;
    }
}

export async function clearCache() {
    const cache = await caches.open(CACHE_DATA);
    const keys = await cache.keys();
    for (const req of keys) {
        await cache.delete(req);
    }
}
