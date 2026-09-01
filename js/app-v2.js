const LIKES_STORAGE_KEY = "likedQuoteIds";
const THEME_STORAGE_KEY = "twilightTheme";
const LANGUAGE_STORAGE_KEY = "twilightLanguage";

const state = {
  activeCategory: "all",
  filteredQuotes: QUOTES,
  currentIndex: 0,
  currentView: "home",
  likes: loadLikes(),
  theme: loadTheme(),
  language: loadLanguage(),
};

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
  btnTheme: document.getElementById("btn-theme"),
  btnLanguage: document.getElementById("btn-language"),
  btnHomeTitle: document.getElementById("btn-home-title"),
  collectionMount: document.getElementById("collection-mount"),
  collectionCount: document.getElementById("collection-count"),
  collectionEmpty: document.getElementById("collection-empty"),
  i18nTargets: document.querySelectorAll("[data-i18n]"),
};

function t(key) {
  return I18N[state.language][key] || I18N.ko[key] || key;
}

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
    // LocalStorage can be unavailable in private browsing modes.
  }
}

function loadTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch (err) {
    // Keep the app usable if storage is blocked.
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function saveTheme() {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, state.theme);
  } catch (err) {
    // Non-critical preference.
  }
}

function loadLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === "ko" || saved === "en") return saved;
  } catch (err) {
    // Non-critical preference.
  }
  return "ko";
}

function saveLanguage() {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, state.language);
  } catch (err) {
    // Non-critical preference.
  }
}

function getCurrentQuote() {
  return state.filteredQuotes[state.currentIndex];
}

function applyTheme({ announce = false } = {}) {
  document.body.classList.toggle("theme-light", state.theme === "light");
  document.body.classList.toggle("theme-dark", state.theme === "dark");
  els.btnTheme.innerHTML = state.theme === "dark" ? ICONS.sun : ICONS.moon;
  els.btnTheme.setAttribute("aria-label", state.theme === "dark" ? t("themeLight") : t("themeDark"));
  els.btnTheme.setAttribute("title", state.theme === "dark" ? t("themeLight") : t("themeDark"));
  if (announce) showToast(state.theme === "light" ? t("themeChangedLight") : t("themeChangedDark"));
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  saveTheme();
  applyTheme({ announce: true });
}

function applyLanguage({ announce = false } = {}) {
  document.documentElement.lang = state.language;
  els.i18nTargets.forEach((el) => {
    el.innerHTML = t(el.dataset.i18n);
  });
  document.querySelector(".top-controls")?.setAttribute("aria-label", t("appSettings"));
  els.btnLanguage.innerHTML = `<span>${state.language === "ko" ? "EN" : "KO"}</span>${ICONS.language}`;
  els.btnLanguage.setAttribute("aria-label", t("switchLanguage"));
  els.btnLanguage.setAttribute("title", t("switchLanguage"));
  els.btnPrev.setAttribute("aria-label", t("prevQuote"));
  els.btnNext.setAttribute("aria-label", t("nextQuote"));
  els.btnLike.setAttribute("aria-label", t("like"));
  els.btnCopy.setAttribute("aria-label", t("copy"));
  els.btnDownload.setAttribute("aria-label", t("download"));
  applyTheme();
  renderCategoryChips(els.chips, CATEGORIES, state.activeCategory, state.language);
  renderHome();
  if (state.currentView === "collection") renderCollectionView();
  if (announce) showToast(t("languageChanged"));
}

function toggleLanguage() {
  state.language = state.language === "ko" ? "en" : "ko";
  saveLanguage();
  applyLanguage({ announce: true });
}

function initStaticIcons() {
  els.btnPrev.innerHTML = ICONS.chevronLeft;
  els.btnNext.innerHTML = ICONS.chevronRight;
  els.btnCopy.innerHTML = ICONS.copy;
  els.btnDownload.innerHTML = ICONS.download;
  els.navBtns.forEach((btn) => {
    btn.insertAdjacentHTML("afterbegin", ICONS[btn.dataset.icon] || "");
  });
}

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
  return undefined;
}

function applyCategory(category) {
  state.activeCategory = category;
  state.filteredQuotes = category === "all" ? QUOTES : QUOTES.filter((q) => q.category === category);
  state.currentIndex = 0;
  renderCategoryChips(els.chips, CATEGORIES, state.activeCategory, state.language);
  renderHome();
}

function renderHome(direction) {
  const quote = getCurrentQuote();
  if (!quote) return undefined;

  els.cardMount.innerHTML = "";
  const card = createQuoteCard(quote, state.language);
  if (direction === "next") card.classList.add("enter-right");
  if (direction === "prev") card.classList.add("enter-left");
  els.cardMount.appendChild(card);

  renderProgressDots(els.progressDots, state.filteredQuotes.length, state.currentIndex);
  setHeartButtonState(els.btnLike, state.likes.has(quote.id), false);
  return updateBackgroundForQuote(quote);
}

function goToCard(delta) {
  const total = state.filteredQuotes.length;
  state.currentIndex = (state.currentIndex + delta + total) % total;
  renderHome(delta > 0 ? "next" : "prev");
}

function toggleLike(id, { forceLike = false, animateBtn = null } = {}) {
  const alreadyLiked = state.likes.has(id);
  if (forceLike && alreadyLiked) return;

  const isNowLiked = forceLike ? true : !alreadyLiked;
  if (isNowLiked) state.likes.add(id);
  else state.likes.delete(id);
  saveLikes();

  if (animateBtn) setHeartButtonState(animateBtn, isNowLiked, true);
  showToast(isNowLiked ? t("saved") : t("removed"));

  if (state.currentView === "collection") renderCollectionView();
}

function renderCollectionView() {
  const likedQuotes = QUOTES.filter((q) => state.likes.has(q.id));
  renderCollectionGrid(els.collectionMount, likedQuotes, state.language);
  els.collectionCount.textContent = likedQuotes.length ? `${likedQuotes.length}` : "";
  els.collectionEmpty.innerHTML = t("emptySaved");
  els.collectionEmpty.hidden = likedQuotes.length > 0;
}

async function copyCurrentQuote() {
  const quote = getCurrentQuote();
  const text = `"${getQuoteText(quote, state.language)}"\n${getSecondaryQuoteText(quote, state.language)}\n- ${getSourceText(quote, state.language)} (${quote.year})`;
  try {
    await navigator.clipboard.writeText(text);
    showToast(t("copied"));
  } catch (err) {
    showToast(t("copyFailed"));
  }
}

function waitForImageLoad(imgEl) {
  return new Promise((resolve, reject) => {
    if (imgEl.complete && imgEl.naturalWidth > 0) return resolve();
    imgEl.onload = () => resolve();
    imgEl.onerror = () => reject(new Error("Image load failed"));
  });
}

async function downloadCurrentAsImage() {
  const quote = getCurrentQuote();
  showToast(t("downloading"));

  try {
    const photoUrl = await getBackgroundUrlForQuote(quote);
    fillExportTemplate(quote, photoUrl, state.language);
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

    showToast(t("downloadDone"));
  } catch (err) {
    console.error("Image export failed:", err);
    showToast(t("downloadFailed"));
  }
}

els.navBtns.forEach((btn) => {
  btn.addEventListener("click", () => switchView(btn.dataset.target));
});

els.chips.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  applyCategory(chip.dataset.category);
});

els.btnPrev.addEventListener("click", () => goToCard(-1));
els.btnNext.addEventListener("click", () => goToCard(1));
els.btnLike.addEventListener("click", () => {
  toggleLike(getCurrentQuote().id, { animateBtn: els.btnLike });
});
els.btnCopy.addEventListener("click", copyCurrentQuote);
els.btnDownload.addEventListener("click", downloadCurrentAsImage);
els.btnTheme.addEventListener("click", toggleTheme);
els.btnLanguage.addEventListener("click", toggleLanguage);
els.btnHomeTitle.addEventListener("click", () => switchView("home"));

document.addEventListener("keydown", (e) => {
  if (state.currentView !== "home") return;
  if (e.key === "ArrowLeft") goToCard(-1);
  if (e.key === "ArrowRight") goToCard(1);
});

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
  const swipeThreshold = 40;
  if (deltaX > swipeThreshold) goToCard(-1);
  else if (deltaX < -swipeThreshold) goToCard(1);
  touchStartX = null;
});

els.cardFrame.addEventListener("dblclick", () => {
  const quote = getCurrentQuote();
  toggleLike(quote.id, { forceLike: true, animateBtn: els.btnLike });
  playHeartBurst(els.cardFrame);
});

els.collectionMount.addEventListener("click", (e) => {
  const tile = e.target.closest(".collection-tile");
  if (!tile) return;
  const quote = QUOTES.find((q) => q.id === tile.dataset.id);
  if (!quote) return;

  state.activeCategory = "all";
  state.filteredQuotes = QUOTES;
  state.currentIndex = QUOTES.indexOf(quote);
  renderCategoryChips(els.chips, CATEGORIES, state.activeCategory, state.language);
  switchView("home");
});

(async function init() {
  initStaticIcons();
  applyTheme();
  applyLanguage();

  const [firstBackground] = await Promise.all([switchView("home"), new Promise((r) => setTimeout(r, 500))]);
  void firstBackground;

  els.splash.classList.add("is-hidden");
})();
