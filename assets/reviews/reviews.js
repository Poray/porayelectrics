(function initTrustindexLikeReviews(){
  const track = document.getElementById("tiTrack");
  if (!track) return;

  const prevBtn = document.querySelector(".ti__prev");
  const nextBtn = document.querySelector(".ti__next");

  const elRating = document.getElementById("tiRating");
  const elStars  = document.getElementById("tiStars");
  const elHead   = document.getElementById("tiHeadline");
  const elBadge  = document.getElementById("tiBadge");
  const elPlace  = document.getElementById("tiPlaceLink");

  // ---------- LANG ----------
  function getLang(){
    const saved = (localStorage.getItem("lang") || "").toLowerCase();
    if (saved === "en") return "en";
    const htmlLang = (document.documentElement.lang || "").toLowerCase();
    if (htmlLang.startsWith("en")) return "en";
    return "pl";
  }

  function dataUrlFor(lang){
    return (String(lang).toLowerCase() === "en")
      ? "/assets/reviews/reviews.en.json"
      : "/assets/reviews/reviews.pl.json";
  }

  function t(lang){
    const L = (String(lang).toLowerCase() === "en") ? "en" : "pl";
    return {
      readMore:   L === "en" ? "Read more" : "Czytaj więcej",
      showLess:  L === "en" ? "Show less" : "Zwiń",
      verified:  L === "en" ? "Verified review" : "Zweryfikowana opinia",
      seeOrig:   L === "en" ? "see original" : "zobacz oryginał",
      empty:     L === "en" ? "No reviews to display." : "Brak opinii do wyświetlenia."
    };
  }

  // ---------- HELPERS ----------
  const esc = (s="") => String(s)
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");

  const starHTML = (n) => {
    const full = Math.max(0, Math.min(5, Number(n || 0)));
    let out = "";
    for (let i=0;i<5;i++){
      out += `<span class="ti__star">${i < full ? "★" : "☆"}</span>`;
    }
    return out;
  };

  function cardTemplate(r, lang){
    const tr = t(lang);

    const author = esc(r.author || (lang === "en" ? "Customer" : "Klient"));
    const initials = esc(r.initials || author.trim().slice(0,2).toUpperCase());
    const rating = Number(r.rating || 5);
    const verified = !!r.verified;

    // UWAGA: text do data-full musi być "raw", a do HTML escaped
    const rawText = (r.text || "").toString();
    const safeText = esc(rawText);

    const originalHint = esc(r.originalHint || "");
    const originalUrl = esc(r.originalUrl || "");

    const hasThumb = !!(r.photoThumb && String(r.photoThumb).trim());
    const thumb = hasThumb ? esc(r.photoThumb) : "";

    const needsMore = rawText.length > 130;

    return `
      <article class="tiCard" tabindex="0">
        <div class="tiCard__head">
          <div class="tiCard__who">
            <div class="tiAvatar">${initials}</div>
            <div>
              <div class="tiName">${author}</div>
            </div>
          </div>

          <div class="tiGIcon tiGIcon--img" aria-hidden="true">
            <img src="/img/Google_Favicon.png" alt="Google" loading="lazy">
          </div>
        </div>

        <div class="tiCard__stars">
          <div class="ti__stars" aria-label="${rating}/5">${starHTML(rating)}</div>
          ${verified ? `
            <span class="tiCheck" title="${tr.verified}">
              <img src="/img/google-verified.svg" alt="${tr.verified}">
            </span>
          ` : ``}
        </div>

        <div class="tiCard__body">
          <div class="tiCard__textWrap" style="flex:1 1 auto; min-width:0;">
            <p class="tiText" data-full="${esc(rawText)}">${safeText}</p>

            ${originalHint ? `
              <div class="tiTranslate">
                ${originalHint}
                ${originalUrl ? ` <a href="${originalUrl}" target="_blank" rel="noopener noreferrer" style="color:rgba(255,255,255,.9)">${tr.seeOrig}</a>` : ``}
              </div>
            ` : ``}

            ${needsMore ? `<a href="#" class="tiMore" data-more>${tr.readMore}</a>` : ``}
          </div>

          ${hasThumb ? `<div class="tiThumb"><img src="${thumb}" alt="" loading="lazy"></div>` : ``}
        </div>
      </article>
    `;
  }

  function shortenTextNodes(){
    track.querySelectorAll(".tiText").forEach(p => {
      const full = p.getAttribute("data-full") || "";
      if (full.length > 150) p.textContent = full.slice(0, 150).trim() + "...";
    });
  }

  function scrollByOne(dir){
    const card = track.querySelector(".tiCard");
    const w = card ? card.getBoundingClientRect().width : 520;
    track.scrollBy({ left: dir * (w + 18), behavior: "smooth" });
  }

  // ---------- AUTOPLAY / PAUSE ----------
  let timer = null;
  let paused = false;
  let io = null;

  function stopAuto(){
    if (timer) clearInterval(timer);
    timer = null;
  }

  function startAuto(){
    stopAuto();
    timer = setInterval(() => {
      if (paused) return;

      const nearEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 20;
      if (nearEnd) track.scrollTo({ left: 0, behavior: "smooth" });
      else scrollByOne(1);
    }, 2200); // szybciej
  }

  function setPaused(v){
    paused = !!v;
  }

  function cleanup(){
    stopAuto();
    if (io) { try { io.disconnect(); } catch(_){} }
    io = null;
    track.innerHTML = "";
    track.scrollLeft = 0;
  }

  function bindStaticEvents(){
    // hover/focus pause
    track.addEventListener("mouseenter", () => setPaused(true));
    track.addEventListener("mouseleave", () => setPaused(false));
    track.addEventListener("focusin", () => setPaused(true));
    track.addEventListener("focusout", () => setPaused(false));

    prevBtn?.addEventListener("click", () => { setPaused(true); scrollByOne(-1); });
    nextBtn?.addEventListener("click", () => { setPaused(true); scrollByOne(1); });

    // Read more toggle
    track.addEventListener("click", (e) => {
      const a = e.target.closest("[data-more]");
      if (!a) return;
      e.preventDefault();

      const lang = getLang();
      const tr = t(lang);

      const card = a.closest(".tiCard");
      const p = card?.querySelector(".tiText");
      if (!p) return;

      const full = p.getAttribute("data-full") || p.textContent || "";
      const expanded = a.getAttribute("data-expanded") === "1";

      if (!expanded){
        p.textContent = full;
        a.textContent = tr.showLess;
        a.setAttribute("data-expanded","1");
      } else {
        const short = full.length > 150 ? full.slice(0, 150).trim() + "..." : full;
        p.textContent = short;
        a.textContent = tr.readMore;
        a.setAttribute("data-expanded","0");
      }
    });
  }

  let bound = false;
  if (!bound){
    bindStaticEvents();
    bound = true;
  }

  // ---------- LOAD & RENDER ----------
  async function loadForLang(lang){
    cleanup();

    const url = dataUrlFor(lang);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("reviews json http " + res.status);

    const data = await res.json();

    // header (jeśli masz te elementy w HTML)
    const rating = Number(data.rating ?? 5).toFixed(1);
    if (elRating) elRating.textContent = rating;
    if (elStars)  elStars.innerHTML = starHTML(Math.round(Number(data.rating ?? 5)));
    if (elHead)   elHead.textContent = data.headline || (lang === "en" ? "Top Rated Service" : "Top Rated Service");

    const placeUrl = data.placeUrl || "#";
    if (elPlace) elPlace.href = placeUrl;

    // badge jeśli istnieje (u Ciebie podobno usuwany – więc bezpiecznie)
    if (elBadge){
      elBadge.href = placeUrl;
      const txt = elBadge.querySelector(".ti__badgeText");
      if (txt) txt.textContent = data.badgeText || "";
    }

    const reviews = Array.isArray(data.reviews) ? data.reviews : [];
    if (!reviews.length){
      track.innerHTML = `<article class="tiCard"><p class="tiText">${t(lang).empty}</p></article>`;
      return;
    }

    track.innerHTML = reviews.map(r => cardTemplate(r, lang)).join("");
    shortenTextNodes();

    // pause gdy poza ekranem
    io = new IntersectionObserver((entries) => {
      const on = entries.some(e => e.isIntersecting);
      setPaused(!on);
    }, { threshold: 0.25 });
    io.observe(track);

    startAuto();
  }

  // start
  loadForLang(getLang()).catch(() => cleanup());

  // language switch
  window.addEventListener("languageChanged", (e) => {
    const lang = (e.detail?.lang || localStorage.getItem("lang") || "pl").toLowerCase();
    loadForLang(lang).catch(() => cleanup());
  });

})();
