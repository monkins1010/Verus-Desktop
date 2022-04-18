var blake2b = require('blake2b');
const LFUCache = require('../utils/cache');

const BYTES_PER_MB = 1000000

module.exports = (api) => {
  api.derive_cache_key = (cache, query) => {
    var hash = blake2b(64)
  
    for (const type of cache.split('.')) {
      hash.update(type)
    }

    hash.update(query)

    return hash.digest('hex')
  }

  api.initMainCache = () => {
    api.internal_cache = new LFUCache(
      !isNaN(api.appConfig.general.main.cacheMbLimit)
        ? api.appConfig.general.main.cacheMbLimit * BYTES_PER_MB
        : 10000000
    )

    api.main_cache = {
      del: (cache, query) =>
        api.internal_cache.del(api.derive_cache_key(cache, query)),
      set: (cache, query, value) => {
        try {
          return api.internal_cache.set(api.derive_cache_key(cache, query), value)
        } catch(e) {
          api.log(
            "Failed to set cache value for the following cache, query, and value, recived the following error.",
            "main_cache"
          );
          api.log(cache, "main_cache")
          api.log(query, "main_cache")
          api.log(value, "main_cache")
          api.log(e, "main_cache")
  
          return false
        }
      },
      get: (cache, query) =>
        api.internal_cache.get(api.derive_cache_key(cache, query)),
      has: (cache, query) =>
        api.internal_cache.has(api.derive_cache_key(cache, query)),
      getStats: () => api.internal_cache.getStats(),
    };
  
    Object.freeze(api.main_cache);
  }

  api.create_sub_cache = (id) => {
    return {
      del: (query) => api.main_cache.del(id, query),
      set: (query, value) => api.main_cache.set(id, query, value),
      get: (query) => api.main_cache.get(id, query),
      has: (query) => api.main_cache.has(id, query),
    }
  }

  return api;
};