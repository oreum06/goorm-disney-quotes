/*
  app.js — 상태 관리 + 이벤트 바인딩.
  data.js 의 QUOTES, background.js 의 배경 사진 로직, render.js 의 그리는 함수들을
  묶어서 실제 사용자 입력(탭/스와이프/버튼 클릭)에 반응하게 만듭니다.
*/

// ---------------------------------------------------------------
// 1. 상태(state)
// ---------------------------------------------------------------
const LIKES_STORAGE_KEY = "likedQuoteIds";
const CATEGORIES = ["전체", "인생", "동기부여", "인간관계"];

const state = {
  activeCategory: "전체",
  filteredQuotes: QUOTES,
  currentIndex: 0,
  currentView: "home",
  likes: loadLikes(),
};

function loadLikes() {
  try {
    const raw = localStorage.getItem(LIKES_STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch (err) {
    return new Set();
  }
}

function saveLikes() {
  try {
    localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify([...state.likes]));
  } catch (err) {
    // 시크릿 모드 등 localStorage 저장이 막힌 환경에서도 화면상의 좋아요 동작은 계속되게 한다.
  }
}

function getCurrentQuote() {
  return state.filteredQuotes[state.currentIndex];
}

// ---------------------------------------------------------------
// 2. DOM 참조
// ---------------------------------------------------------------
const els = {
  splash: document.getElementById("splash"),
  views: document.querySelectorAll(".view"),
  navBtns: document.querySelectorAll(".nav-btn"),
  chips: document.getElementById("category-chips"),
  cardFrame: document.getElementById("card-frame"),
  cardMount: document.getElementById("card-mount"),
  cardStage: document.querySelector(".card-stage"),
  progressDots: document.getElementById("progress-dots"),
  btnPrev: document.getElementById("btn-prev"),
  btnNext: document.getElementById("btn-next"),
  btnLike: document.getElementById("btn-like"),
  btnCopy: document.getElementById("btn-copy"),
  btnDownload: document.getElementById("btn-download"),
  collectionMount: document.getElementById("collection-mount"),
  collectionCount: document.getElementById("collection-count"),
  collectionEmpty: document.getElementById("collection-empty"),
};

// 정적 아이콘 버튼들에 SVG를 채워 넣는다.
function initStaticIcons() {
  els.btnPrev.innerHTML = ICONS.chevronLeft;
  els.btnNext.innerHTML = ICONS.chevronRight;
  els.btnCopy.innerHTML = ICONS.copy;
  els.btnDownload.innerHTML = ICONS.download;
  els.navBtns.forEach((btn) => {
    btn.insertAdjacentHTML("afterbegin", ICONS[btn.dataset.icon] || "");
  });
}

// ---------------------------------------------------------------
// 3. 화면 전환 (홈 / 내 보관함)
// ---------------------------------------------------------------
function switchView(target) {
  state.currentView = target;

  els.views.forEach((view) => {
    view.hidden = view.dataset.view !== target;
  });
  els.navBtns.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.target === target);
  });

  if (target === "home") return renderHome();
  if (target === "collection") renderCollectionView();
}

els.navBtns.forEach((btn) => {
  btn.addEventListener("click", () => switchView(btn.dataset.target));
});

// ---------------------------------------------------------------
// 4. 카테고리 필터
// ---------------------------------------------------------------
function applyCategory(category) {
  state.activeCategory = category;
  state.filteredQuotes = category === "전체" ? QUOTES : QUOTES.filter((q) => q.category === category);
  state.currentIndex = 0;
  renderCategoryChips(els.chips, CATEGORIES, state.activeCategory);
  renderHome();
}

els.chips.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  applyCategory(chip.dataset.category);
});

// ---------------------------------------------------------------
// 5. 홈 화면: 카드 렌더 + 좌우 전환 + 배경 사진 갱신
// ---------------------------------------------------------------
function renderHome(direction) {
  const quote = getCurrentQuote();

  els.cardMount.innerHTML = "";
  const card = createQuoteCard(quote);
  if (direction === "next") card.classList.add("enter-right");
  if (direction === "prev") card.classList.add("enter-left");
  els.cardMount.appendChild(card);

  renderProgressDots(els.progressDots, state.filteredQuotes.length, state.currentIndex);
  setHeartButtonState(els.btnLike, state.likes.has(quote.id), false);

  // 배경 사진 교체는 카드 전환과 별개로 비동기 진행 — 완료를 기다리지 않고 promise를 돌려준다(초기 로딩에서만 사용).
  return updateBackgroundForQuote(quote);
}

function goToCard(delta) {
  const total = state.filteredQuotes.length;
  state.currentIndex = (state.currentIndex + delta + total) % total;
  renderHome(delta > 0 ? "next" : "prev");
}

els.btnPrev.addEventListener("click", () => goToCard(-1));
els.btnNext.addEventListener("click", () => goToCard(1));

document.addEventListener("keydown", (e) => {
  if (state.currentView !== "home") return;
  if (e.key === "ArrowLeft") goToCard(-1);
  if (e.key === "ArrowRight") goToCard(1);
});

// 스와이프(터치) 지원
let touchStartX = null;
els.cardStage.addEventListener(
  "touchstart",
  (e) => {
    touchStartX = e.touches[0].clientX;
  },
  { passive: true }
);

els.cardStage.addEventListener("touchend", (e) => {
  if (touchStartX === null) return;
  const deltaX = e.changedTouches[0].clientX - touchStartX;
  const SWIPE_THRESHOLD = 40;
  if (deltaX > SWIPE_THRESHOLD) goToCard(-1);
  else if (deltaX < -SWIPE_THRESHOLD) goToCard(1);
  touchStartX = null;
});

// ---------------------------------------------------------------
// 6. 좋아요 (하트) + 내 보관함
// ---------------------------------------------------------------
function toggleLike(id, { forceLike = false, animateBtn = null } = {}) {
  const alreadyLiked = state.likes.has(id);
  if (forceLike && alreadyLiked) return; // 인스타그램처럼 더블탭은 이미 좋아요면 그대로 둔다(취소하지 않음).

  const isNowLiked = forceLike ? true : !alreadyLiked;
  if (isNowLiked) state.likes.add(id);
  else state.likes.delete(id);
  saveLikes();

  if (animateBtn) setHeartButtonState(animateBtn, isNowLiked, true);
  showToast(isNowLiked ? "보관함에 저장했어요" : "보관함에서 제거했어요");

  if (state.currentView === "collection") renderCollectionView();
}

els.btnLike.addEventListener("click", () => {
  toggleLike(getCurrentQuote().id, { animateBtn: els.btnLike });
});

// 카드를 더블클릭(더블탭)하면 인스타그램처럼 큰 하트가 터지면서 좋아요가 저장된다.
els.cardFrame.addEventListener("dblclick", () => {
  const quote = getCurrentQuote();
  toggleLike(quote.id, { forceLike: true, animateBtn: els.btnLike });
  playHeartBurst(els.cardFrame);
});

function renderCollectionView() {
  const likedQuotes = QUOTES.filter((q) => state.likes.has(q.id));
  renderCollectionGrid(els.collectionMount, likedQuotes);
  els.collectionCount.textContent = likedQuotes.length ? `${likedQuotes.length}개` : "";
  els.collectionEmpty.hidden = likedQuotes.length > 0;
}

// 보관함 타일을 탭하면 홈으로 이동해서 그 명언을 바로 보여준다.
els.collectionMount.addEventListener("click", (e) => {
  const tile = e.target.closest(".collection-tile");
  if (!tile) return;
  const quote = QUOTES.find((q) => q.id === tile.dataset.id);
  if (!quote) return;

  state.activeCategory = "전체";
  state.filteredQuotes = QUOTES;
  state.currentIndex = QUOTES.indexOf(quote);
  renderCategoryChips(els.chips, CATEGORIES, state.activeCategory);
  switchView("home");
});

// ---------------------------------------------------------------
// 7. 텍스트 복사
// ---------------------------------------------------------------
async function copyCurrentQuote() {
  const quote = getCurrentQuote();
  const text = `"${quote.quote}"\n${quote.translation}\n— ${quote.source} (${quote.year})`;
  try {
    await navigator.clipboard.writeText(text);
    showToast("텍스트를 복사했어요");
  } catch (err) {
    showToast("복사를 지원하지 않는 브라우저예요");
  }
}

els.btnCopy.addEventListener("click", copyCurrentQuote);

// ---------------------------------------------------------------
// 8. 이미지로 저장하기 (html2canvas로 DOM -> PNG)
// ---------------------------------------------------------------
function waitForImageLoad(imgEl) {
  return new Promise((resolve, reject) => {
    if (imgEl.complete && imgEl.naturalWidth > 0) return resolve();
    imgEl.onload = () => resolve();
    imgEl.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."));
  });
}

async function downloadCurrentAsImage() {
  const quote = getCurrentQuote();
  showToast("이미지를 만들고 있어요…");

  try {
    const photoUrl = await getBackgroundUrlForQuote(quote); // 이미 캐시돼 있으면 즉시 반환된다.
    fillExportTemplate(quote, photoUrl);
    await waitForImageLoad(document.getElementById("export-bg"));

    const canvas = await html2canvas(document.getElementById("export-template"), {
      useCORS: true,
      backgroundColor: null,
    });

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `twilight-quote-${quote.id}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    showToast("이미지를 저장했어요");
  } catch (err) {
    console.error("이미지 저장 실패:", err);
    showToast("이미지 저장에 실패했어요. 다시 시도해 주세요.");
  }
}

els.btnDownload.addEventListener("click", downloadCurrentAsImage);

// ---------------------------------------------------------------
// 9. 초기 실행
// ---------------------------------------------------------------
(async function init() {
  initStaticIcons();
  renderCategoryChips(els.chips, CATEGORIES, state.activeCategory);

  // 첫 배경 사진이 실제로 도착할 때까지 기다렸다가 스플래시를 걷어낸다(최소 500ms는 보여준다).
  const [firstBackground] = await Promise.all([switchView("home"), new Promise((r) => setTimeout(r, 500))]);
  void firstBackground;

  els.splash.classList.add("is-hidden");
})();
