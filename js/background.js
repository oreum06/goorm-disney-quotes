/*
  background.js — 명언이 바뀔 때마다 화면 전체 배경 사진을 Unsplash에서 가져와
  부드럽게 페이드 전환(crossfade)하는 기능을 담당합니다.

  ─────────────────────────────────────────────────────────────────
  Unsplash API를 쓰려면 "Access Key"가 필요합니다 (무료).
    1) https://unsplash.com/developers 에서 회원가입 후 "New Application" 생성
    2) 발급받은 Access Key를 아래 UNSPLASH_ACCESS_KEY 에 붙여넣기

  Access Key를 넣지 않아도 앱은 정상적으로 동작합니다 — 이 경우 카테고리별로 미리 골라둔
  Unsplash 사진 목록(FALLBACK_PHOTOS_BY_CATEGORY) 중 하나를 대신 사용해 배경을 채웁니다.
  ─────────────────────────────────────────────────────────────────
*/
const UNSPLASH_ACCESS_KEY = ""; // 여기에 본인의 Unsplash Access Key를 넣으면 실제 Unsplash API를 사용합니다.

// 카테고리별로 어떤 느낌의 사진을 찾을지 정의한 검색어(영문 키워드일수록 결과가 풍부합니다).
const CATEGORY_QUERY = {
  인생: "life,journey,serene landscape",
  동기부여: "motivation,mountain,sunrise adventure",
  인간관계: "friendship,togetherness,warm light",
};

// Access Key 없이도 바로 예쁘게 보이도록, 카테고리별로 미리 골라둔 Unsplash 사진 목록(직접 링크).
// images.unsplash.com은 CORS를 허용하는 CDN이라 API 키 없이 사진을 "보는 것"은 자유롭다 —
// 다만 "검색/랜덤 추천"처럼 메타데이터를 요청하는 API 호출에는 Access Key가 필요하다.
const FALLBACK_PHOTOS_BY_CATEGORY = {
  인생: [
    "1471958680802-1345a694ba6d",
    "1531129915305-9e84bb5a4b15",
    "1523975864490-174dd4d9a41e",
    "1617361194384-1852022fe186",
    "1429743305873-d4065c15f93e",
  ],
  동기부여: [
    "1494548162494-384bba4ab999",
    "1500964757637-c85e8a162699",
    "1490682143684-14369e18dce8",
    "1519414442781-fbd745c5b497",
    "1542159919831-40fb0656b45a",
  ],
  인간관계: [
    "1506869640319-fe1a24fd76dc",
    "1511632765486-a01980e01a18",
    "1529156069898-49953e39b3ac",
    "1530047139082-5435ca3c4614",
    "1588696191779-61dde1b83475",
  ],
};

// 문자열(명언 id)을 숫자로 바꾸는 아주 단순한 해시. "이 명언은 항상 이 사진"처럼
// 같은 명언이면 항상 같은 대체 사진을 고르게 해서, 홈 화면과 보관함 썸네일이 서로 어긋나지 않게 한다.
function hashStringToIndex(str, length) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash % length;
}

// 같은 명언을 다시 볼 때 매번 새로 요청하지 않도록, 한 번 받아온 배경 사진 URL을 저장해 둔다.
const backgroundUrlCache = new Map();

// Unsplash API로 카테고리에 어울리는 랜덤 사진 1장의 URL을 요청한다.
async function fetchFromUnsplash(category) {
  const query = encodeURIComponent(CATEGORY_QUERY[category] || "nature");
  const endpoint = `https://api.unsplash.com/photos/random?query=${query}&orientation=portrait&content_filter=high`;
  const response = await fetch(endpoint, {
    headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
  });
  if (!response.ok) throw new Error(`Unsplash API 응답 오류: ${response.status}`);
  const photo = await response.json();
  return photo.urls?.regular || photo.urls?.full;
}

// Access Key가 없거나 Unsplash API 요청이 실패했을 때 쓰는 대체 경로.
function fallbackPhotoUrl(quote) {
  const pool = FALLBACK_PHOTOS_BY_CATEGORY[quote.category] || FALLBACK_PHOTOS_BY_CATEGORY["인생"];
  const photoId = pool[hashStringToIndex(quote.id, pool.length)];
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1080&q=80`;
}

// 이미 홈 화면에서 한 번 불러온 사진이 있으면(캐시) 그것을, 없으면 대체 이미지를 즉시 반환한다.
// 보관함 그리드 썸네일처럼 여러 장을 한꺼번에 그릴 때는 네트워크 요청 없이 동기적으로 쓰기 위한 함수다.
function getCachedOrFallbackPhotoUrl(quote) {
  return backgroundUrlCache.get(quote.id) || fallbackPhotoUrl(quote);
}

// 명언 하나에 어울리는 배경 사진 URL을 구한다 (캐시 → Unsplash API → 대체 이미지 순으로 시도).
async function getBackgroundUrlForQuote(quote) {
  if (backgroundUrlCache.has(quote.id)) {
    return backgroundUrlCache.get(quote.id);
  }

  let url;
  if (UNSPLASH_ACCESS_KEY) {
    try {
      url = await fetchFromUnsplash(quote.category);
    } catch (err) {
      console.warn("Unsplash API 요청 실패, 대체 이미지로 전환합니다:", err.message);
    }
  }
  if (!url) url = fallbackPhotoUrl(quote);

  backgroundUrlCache.set(quote.id, url);
  return url;
}

// 화면 전체 배경은 <img> 두 장을 겹쳐두고(back/front) opacity를 교차시키는 방식으로 크로스페이드한다.
const bgLayers = {
  els: [document.getElementById("bg-photo-a"), document.getElementById("bg-photo-b")],
  frontIndex: 0,
};

// 다음 배경 사진으로 부드럽게 전환한다. 화면에 보이지 않는 뒤쪽 레이어에 미리 로드한 뒤 앞으로 꺼내온다.
function crossfadeBackgroundTo(url) {
  return new Promise((resolve) => {
    const nextIndex = 1 - bgLayers.frontIndex;
    const nextEl = bgLayers.els[nextIndex];
    const prevEl = bgLayers.els[bgLayers.frontIndex];

    const preload = new Image();
    preload.crossOrigin = "anonymous"; // 나중에 "이미지로 저장하기"에서 canvas로 그리려면 CORS 허용이 필요하다.
    preload.onload = () => {
      nextEl.src = url;
      nextEl.classList.add("is-visible");
      prevEl.classList.remove("is-visible");
      bgLayers.frontIndex = nextIndex;
      resolve();
    };
    preload.onerror = () => {
      console.warn("배경 사진을 불러오지 못했습니다:", url);
      resolve();
    };
    preload.src = url;
  });
}

// 명언에 맞는 배경을 구해서 교체까지 한 번에 처리하는 헬퍼.
async function updateBackgroundForQuote(quote) {
  const url = await getBackgroundUrlForQuote(quote);
  await crossfadeBackgroundTo(url);
  return url;
}
