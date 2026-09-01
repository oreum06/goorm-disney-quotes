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
  sun:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
  moon:
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.2 15.2A8.4 8.4 0 0 1 8.8 3.8 8.9 8.9 0 1 0 20.2 15.2Z"/></svg>',
  language:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h9M9 3v2M11 5c-.8 4.1-3.2 7-6.5 8.8M5.5 8.5c1.1 2 2.9 3.8 5.5 5"/><path d="M13 21l4-9 4 9M14.3 18h5.4"/></svg>',
};

function getQuoteText(quote, lang) {
  return lang === "ko" ? quote.quoteKo : quote.quoteEn;
}

function getSecondaryQuoteText(quote, lang) {
  return lang === "ko" ? quote.quoteEn : quote.quoteKo;
}

function getSourceText(quote, lang) {
  return lang === "ko" ? quote.sourceKo : quote.sourceEn;
}

function getKeywords(quote, lang) {
  return lang === "ko" ? quote.keywordsKo : quote.keywordsEn;
}

function createQuoteCard(quote, lang) {
  const article = document.createElement("article");
  article.className = "quote-card";
  article.dataset.id = quote.id;
  article.tabIndex = 0;
  article.setAttribute("role", "button");
  article.setAttribute("aria-label", `${getQuoteText(quote, lang)} 상세보기`);

  article.innerHTML = `
    <span class="quote-card-category">${CATEGORY_LABELS[quote.category][lang]}</span>
    <p class="quote-card-quote">&ldquo;${getQuoteText(quote, lang)}&rdquo;</p>
    <p class="quote-card-translation">${getSecondaryQuoteText(quote, lang)}</p>
    <div class="quote-card-meta">
      <span class="quote-card-source">${getSourceText(quote, lang)} · ${quote.year}</span>
      <div class="quote-card-tags">${getKeywords(quote, lang).map((k) => `<span class="tag">#${k}</span>`).join("")}</div>
    </div>
  `;
  return article;
}

function renderProgressDots(mountEl, total, activeIndex) {
  mountEl.innerHTML = "";
  for (let i = 0; i < total; i += 1) {
    const dot = document.createElement("span");
    dot.className = "dot-item" + (i === activeIndex ? " is-active" : "");
    mountEl.appendChild(dot);
  }
}

function renderCategoryChips(mountEl, categories, activeCategory, lang) {
  mountEl.innerHTML = "";
  categories.forEach((category) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip" + (category === activeCategory ? " is-active" : "");
    chip.textContent = CATEGORY_LABELS[category][lang];
    chip.dataset.category = category;
    mountEl.appendChild(chip);
  });
}

function createCollectionTile(quote, lang) {
  const tile = document.createElement("button");
  tile.type = "button";
  tile.className = "collection-tile";
  tile.dataset.id = quote.id;
  tile.setAttribute("aria-label", `${getQuoteText(quote, lang)} 열기`);
  tile.innerHTML = `
    <img src="${getCachedOrFallbackPhotoUrl(quote)}" alt="" loading="lazy" />
    <div class="collection-tile-scrim"></div>
    <p class="collection-tile-quote">&ldquo;${getQuoteText(quote, lang)}&rdquo;</p>
    <span class="collection-tile-heart">${ICONS.heartFilled}</span>
  `;
  return tile;
}

function renderCollectionGrid(mountEl, quotes, lang) {
  mountEl.innerHTML = "";
  quotes.forEach((quote) => mountEl.appendChild(createCollectionTile(quote, lang)));
}

function fillExportTemplate(quote, photoUrl, lang) {
  const bg = document.getElementById("export-bg");
  bg.crossOrigin = "anonymous";
  bg.src = photoUrl;
  document.getElementById("export-quote").textContent = `“${getQuoteText(quote, lang)}”`;
  document.getElementById("export-translation").textContent = getSecondaryQuoteText(quote, lang);
  document.getElementById("export-source").textContent = `${getSourceText(quote, lang)} · ${quote.year}`;
}

function setHeartButtonState(btn, isLiked, justAnimate) {
  btn.classList.toggle("is-liked", isLiked);
  btn.setAttribute("aria-pressed", String(isLiked));
  btn.innerHTML = isLiked ? ICONS.heartFilled : ICONS.heartOutline;
  if (justAnimate) {
    btn.classList.remove("just-liked");
    void btn.offsetWidth;
    btn.classList.add("just-liked");
  }
}

function playHeartBurst(container) {
  const burst = document.createElement("div");
  burst.className = "heart-burst";
  burst.innerHTML = ICONS.heartFilled;
  container.appendChild(burst);
  burst.addEventListener("animationend", () => burst.remove());
}

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
