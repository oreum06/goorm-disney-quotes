/*
  render.js — 데이터(quote 객체)를 실제 화면(DOM)으로 그려주는 함수 모음.
  이 파일은 "무엇을 그릴지"만 담당하고, "언제 그릴지 / 클릭하면 뭘 할지"는
  app.js 에서 결정합니다. (관심사 분리)
*/

// 인라인 SVG 아이콘 세트. currentColor를 써서 버튼의 color 값을 그대로 물려받는다.
const ICONS = {
  heartOutline:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.2c-.3 0-.6-.1-.8-.3C7 16.6 3.6 13.6 3.6 9.9 3.6 7.2 5.7 5 8.4 5c1.5 0 2.9.7 3.6 1.9C12.7 5.7 14.1 5 15.6 5c2.7 0 4.8 2.2 4.8 4.9 0 3.7-3.4 6.7-7.6 10-.2.2-.5.3-.8.3Z"/></svg>',
  heartFilled:
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20.2c-.3 0-.6-.1-.8-.3C7 16.6 3.6 13.6 3.6 9.9 3.6 7.2 5.7 5 8.4 5c1.5 0 2.9.7 3.6 1.9C12.7 5.7 14.1 5 15.6 5c2.7 0 4.8 2.2 4.8 4.9 0 3.7-3.4 6.7-7.6 10-.2.2-.5.3-.8.3Z"/></svg>',
  copy:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>',
  download:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11"/><path d="m7 11 5 5 5-5"/><path d="M5 19.5h14"/></svg>',
  chevronLeft:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  chevronRight:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  home:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/></svg>',
  bookmark:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h12v16l-6-4-6 4Z"/></svg>',
  close:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
};

// 명언 1개를 글래스모피즘 카드 DOM으로 만든다.
function createQuoteCard(quote) {
  const article = document.createElement("article");
  article.className = "quote-card";
  article.dataset.id = quote.id;
  article.tabIndex = 0;
  article.setAttribute("role", "button");
  article.setAttribute("aria-label", `${quote.quote} 상세보기, 더블탭하면 좋아요`);

  article.innerHTML = `
    <span class="quote-card-category">${quote.category}</span>
    <p class="quote-card-quote">&ldquo;${quote.quote}&rdquo;</p>
    <p class="quote-card-translation">${quote.translation}</p>
    <div class="quote-card-meta">
      <span class="quote-card-source">${quote.source} · ${quote.year}</span>
      <div class="quote-card-tags">${quote.keywords.map((k) => `<span class="tag">#${k}</span>`).join("")}</div>
    </div>
  `;
  return article;
}

// 홈 화면 하단의 점(progress dot) 인디케이터를 그린다.
function renderProgressDots(mountEl, total, activeIndex) {
  mountEl.innerHTML = "";
  for (let i = 0; i < total; i++) {
    const dot = document.createElement("span");
    dot.className = "dot-item" + (i === activeIndex ? " is-active" : "");
    mountEl.appendChild(dot);
  }
}

// 상단 카테고리 필터 칩(전체/인생/동기부여/인간관계)을 그린다.
function renderCategoryChips(mountEl, categories, activeCategory) {
  mountEl.innerHTML = "";
  categories.forEach((category) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip" + (category === activeCategory ? " is-active" : "");
    chip.textContent = category;
    chip.dataset.category = category;
    mountEl.appendChild(chip);
  });
}

// "내 보관함" 그리드 타일 하나. picsum 시드 이미지를 배경으로 깐 인스타그램 프로필 그리드 느낌.
function createCollectionTile(quote) {
  const tile = document.createElement("button");
  tile.type = "button";
  tile.className = "collection-tile";
  tile.dataset.id = quote.id;
  tile.setAttribute("aria-label", `${quote.quote} 보관함에서 열기`);
  tile.innerHTML = `
    <img src="${getCachedOrFallbackPhotoUrl(quote)}" alt="" loading="lazy" />
    <div class="collection-tile-scrim"></div>
    <p class="collection-tile-quote">&ldquo;${quote.quote}&rdquo;</p>
    <span class="collection-tile-heart">${ICONS.heartFilled}</span>
  `;
  return tile;
}

function renderCollectionGrid(mountEl, quotes) {
  mountEl.innerHTML = "";
  quotes.forEach((quote) => mountEl.appendChild(createCollectionTile(quote)));
}

// "이미지로 저장하기"용 오프스크린 템플릿(1080x1350, 인스타그램 세로 카드 비율)을 채운다.
// 화면에 보이는 카드를 그대로 캡처하면 배경(backdrop-filter) 흐림 효과가 캡처되지 않아 뭉개지므로,
// 저장 전용으로 미리 스타일을 맞춰둔 별도 DOM에 내용을 채워 넣고 그 DOM만 캡처한다.
function fillExportTemplate(quote, photoUrl) {
  const bg = document.getElementById("export-bg");
  bg.crossOrigin = "anonymous";
  bg.src = photoUrl;
  document.getElementById("export-quote").textContent = `“${quote.quote}”`;
  document.getElementById("export-translation").textContent = quote.translation;
  document.getElementById("export-source").textContent = `${quote.source} · ${quote.year}`;
}

// 좋아요 버튼(하트) 아이콘/상태를 갱신한다. justAnimate가 true면 통통 튀는 팝 애니메이션을 재생한다.
function setHeartButtonState(btn, isLiked, justAnimate) {
  btn.classList.toggle("is-liked", isLiked);
  btn.setAttribute("aria-pressed", String(isLiked));
  btn.innerHTML = isLiked ? ICONS.heartFilled : ICONS.heartOutline;
  if (justAnimate) {
    btn.classList.remove("just-liked");
    void btn.offsetWidth; // 리플로우를 강제로 발생시켜 애니메이션을 재시작한다.
    btn.classList.add("just-liked");
  }
}

// 카드를 더블탭했을 때 화면 중앙에 잠깐 나타났다 사라지는 인스타그램식 큰 하트 애니메이션.
function playHeartBurst(container) {
  const burst = document.createElement("div");
  burst.className = "heart-burst";
  burst.innerHTML = ICONS.heartFilled;
  container.appendChild(burst);
  burst.addEventListener("animationend", () => burst.remove());
}

// 토스트 메시지를 잠깐 보여준다.
let toastTimer = null;
function showToast(message) {
  const toastEl = document.getElementById("toast");
  toastEl.textContent = message;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.hidden = true;
  }, 1800);
}
