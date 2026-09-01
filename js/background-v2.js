const FALLBACK_PHOTOS_BY_CATEGORY = {
  life: [
    "1471958680802-1345a694ba6d",
    "1531129915305-9e84bb5a4b15",
    "1523975864490-174dd4d9a41e",
    "1617361194384-1852022fe186",
  ],
  courage: [
    "1494548162494-384bba4ab999",
    "1500964757637-c85e8a162699",
    "1490682143684-14369e18dce8",
    "1519414442781-fbd745c5b497",
  ],
  growth: [
    "1542159919831-40fb0656b45a",
    "1519681393784-d120267933ba",
    "1500530855697-b586d89ba3ee",
    "1482192596544-9eb780fc7f66",
  ],
  relationship: [
    "1506869640319-fe1a24fd76dc",
    "1511632765486-a01980e01a18",
    "1529156069898-49953e39b3ac",
    "1530047139082-5435ca3c4614",
  ],
};

function hashStringToIndex(str, length) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash % length;
}

const backgroundUrlCache = new Map();

function fallbackPhotoUrl(quote) {
  const pool = FALLBACK_PHOTOS_BY_CATEGORY[quote.category] || FALLBACK_PHOTOS_BY_CATEGORY.life;
  const photoId = pool[hashStringToIndex(quote.id, pool.length)];
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1080&q=80`;
}

function getCachedOrFallbackPhotoUrl(quote) {
  return backgroundUrlCache.get(quote.id) || fallbackPhotoUrl(quote);
}

async function getBackgroundUrlForQuote(quote) {
  if (!backgroundUrlCache.has(quote.id)) {
    backgroundUrlCache.set(quote.id, fallbackPhotoUrl(quote));
  }
  return backgroundUrlCache.get(quote.id);
}

const bgLayers = {
  els: [document.getElementById("bg-photo-a"), document.getElementById("bg-photo-b")],
  frontIndex: 0,
};

function crossfadeBackgroundTo(url) {
  return new Promise((resolve) => {
    const nextIndex = 1 - bgLayers.frontIndex;
    const nextEl = bgLayers.els[nextIndex];
    const prevEl = bgLayers.els[bgLayers.frontIndex];
    const preload = new Image();

    preload.crossOrigin = "anonymous";
    preload.onload = () => {
      nextEl.src = url;
      nextEl.classList.add("is-visible");
      prevEl.classList.remove("is-visible");
      bgLayers.frontIndex = nextIndex;
      resolve();
    };
    preload.onerror = () => resolve();
    preload.src = url;
  });
}

async function updateBackgroundForQuote(quote) {
  const url = await getBackgroundUrlForQuote(quote);
  await crossfadeBackgroundTo(url);
  return url;
}
