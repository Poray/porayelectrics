const yearSpan = document.getElementById("year");
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

const rafThrottle = (fn) => {
  let scheduled = false;
  let lastArgs = null;

  return (...args) => {
    lastArgs = args;
    if (scheduled) return;
    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;
      fn(...lastArgs);
    });
  };
};

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

const revealEls = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window && revealEls.length) {
  const revealObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealEls.forEach((el) => revealObserver.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("visible"));
}

let sidePhotos = [];

function assignSideDirections() {
  sidePhotos = Array.from(
    document.querySelectorAll(".musher-photo, .fenix-photo")
  );

  sidePhotos.forEach((el) => {
    if (el.offsetParent === null) return;
    el.classList.remove("photo-from-left", "photo-from-right");
  });

  document
    .querySelectorAll(".musher-stack, .fenix-stack")
    .forEach((stack) => {
      const photos = Array.from(
        stack.querySelectorAll(".musher-photo, .fenix-photo")
      );
      photos.forEach((el, index) => {
        const fromRight = index % 2 === 1;
        el.classList.add(fromRight ? "photo-from-right" : "photo-from-left");
      });
    });
}

assignSideDirections();

function updateSidePhotos() {
  if (!sidePhotos.length) return;

  const vh = window.innerHeight;

  sidePhotos.forEach((el) => {
    if (el.offsetParent === null) return;

    const rect = el.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;

    const midTop = vh * 0.10;
    const midBottom = vh * 1.12;
    const bottomZone = vh * 1.22;

    const shouldBeIn = centerY > midTop && centerY < midBottom;

    if (shouldBeIn) {
      el.classList.add("side-in");
    } else if (centerY > bottomZone) {
      el.classList.remove("side-in");
    }
  });
}

const updateSidePhotosRaf = rafThrottle(updateSidePhotos);

window.addEventListener("scroll", updateSidePhotosRaf, { passive: true });
window.addEventListener("resize", updateSidePhotosRaf, { passive: true });
updateSidePhotosRaf();

function bindShowMoreButtons() {
  document
    .querySelectorAll(".show-more-photos, .show-more-btn")
    .forEach((btn) => {
      if (btn.dataset.bound === "1") return;
      btn.dataset.bound = "1";

      btn.addEventListener("click", () => {
        const section = btn.closest(".product-section");
        if (!section) return;

        section.classList.add("show-all");
        btn.remove();

        assignSideDirections();
        sidePhotos = Array.from(
          document.querySelectorAll(".musher-photo, .fenix-photo")
        );

        bindLightboxToPhotos();
        updateSidePhotos();
      });
    });
}
bindShowMoreButtons();

let lightboxOverlay = null;
let lightboxImage = null;

function createLightbox() {
  lightboxOverlay = document.createElement("div");
  lightboxOverlay.className = "lightbox-overlay";

  const wrapper = document.createElement("div");
  wrapper.className = "lightbox-wrapper";

  lightboxImage = document.createElement("img");
  lightboxImage.className = "lightbox-image";

  wrapper.appendChild(lightboxImage);
  lightboxOverlay.appendChild(wrapper);
  document.body.appendChild(lightboxOverlay);

  lightboxOverlay.addEventListener("click", () => {
    lightboxOverlay.classList.remove("open");
    document.body.classList.remove("lightbox-open");
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightboxOverlay.classList.contains("open")) {
      lightboxOverlay.classList.remove("open");
      document.body.classList.remove("lightbox-open");
    }
  });
}

function openLightbox(src, alt) {
  if (!lightboxOverlay || !lightboxImage) createLightbox();
  lightboxImage.src = src;
  lightboxImage.alt = alt || "";
  lightboxOverlay.classList.add("open");
  document.body.classList.add("lightbox-open");
}

function bindLightboxToPhotos() {
  const photos = document.querySelectorAll(".musher-photo, .fenix-photo");
  photos.forEach((photo) => {
    if (photo.dataset.lbBound === "1") return;

    const img = photo.querySelector("img");
    if (!img) return;

    photo.dataset.lbBound = "1";
    photo.style.cursor = "zoom-in";
    photo.addEventListener("click", () => openLightbox(img.src, img.alt));
  });
}
bindLightboxToPhotos();

const navToggle = document.querySelector(".nav-toggle");
const mainNav = document.querySelector(".main-nav");
const navBackdrop = document.querySelector(".nav-backdrop");

function setNavState(isOpen) {
  document.body.classList.toggle("nav-open", !!isOpen);
  mainNav?.classList.toggle("open", !!isOpen);
  navBackdrop?.classList.toggle("open", !!isOpen);

  document.documentElement.classList.toggle("no-scroll", !!isOpen);
  document.body.classList.toggle("no-scroll", !!isOpen);

  navToggle?.setAttribute("aria-expanded", isOpen ? "true" : "false");

  // reset dropdownów po zamknięciu menu mobilnego
  if (!isOpen) {
    mainNav?.querySelectorAll(".nav-has-dropdown.open")
      .forEach((el) => el.classList.remove("open"));
  }
}


function openNav(){ setNavState(true); }
function closeNav(){ setNavState(false); }

if (navToggle && mainNav) {
  navToggle.addEventListener("click", () => {
    document.body.classList.contains("nav-open") ? closeNav() : openNav();
  });
}

navBackdrop?.addEventListener("click", closeNav);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeNav();
});

mainNav?.addEventListener("click", (e) => {
  const isMobile = window.matchMedia("(max-width: 720px)").matches;
  if (!isMobile) return;

  const vehiclesHeader = e.target.closest(".nav-has-dropdown > .nav-link");
  if (vehiclesHeader) {
    e.preventDefault();

    const item = vehiclesHeader.closest(".nav-has-dropdown");
    if (!item) return;

    // zamknij inne dropdowny
    mainNav.querySelectorAll(".nav-has-dropdown.open").forEach((el) => {
      if (el !== item) el.classList.remove("open");
    });

    // przełącz aktualny
    item.classList.toggle("open");
    return;
  }


  // klik w dowolny link sekcji/pojazdu zamyka menu
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;

  closeNav();
});




window.addEventListener("resize", () => {
  if (window.matchMedia("(min-width: 721px)").matches) closeNav();
}, { passive: true });


if (window.matchMedia("(pointer: fine)").matches) {
  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  document.body.appendChild(dot);

  let dotX = window.innerWidth / 2;
  let dotY = window.innerHeight / 2;
  let targetX = dotX;
  let targetY = dotY;

  window.addEventListener("mousemove", (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
  });

  function animateDot() {
    dotX += (targetX - dotX) * 0.15;
    dotY += (targetY - dotY) * 0.15;
    dot.style.transform = `translate(${dotX}px, ${dotY}px)`;
    requestAnimationFrame(animateDot);
  }
  animateDot();
}

if (window.matchMedia("(pointer: fine)").matches) {
  const modelPills = document.querySelectorAll(".model-pill");
  const navLinks = document.querySelectorAll(".nav-link");
  const headerInner = document.querySelector(".site-header-inner");

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;

  const onMove = rafThrottle(() => {
    const mx = mouseX;
    const my = mouseY;

    const maxDistP = 260;
    const maxDistP2 = maxDistP * maxDistP;

    modelPills.forEach((pill) => {
      const rect = pill.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = mx - cx;
      const dy = my - cy;
      const d2 = dx * dx + dy * dy;

      const raw = d2 >= maxDistP2 ? 0 : 1 - d2 / maxDistP2;
      const intensity = raw * 0.6;

      const maxTranslate = 2;
      const tx = (dx / maxDistP) * maxTranslate;
      const ty = (dy / maxDistP) * maxTranslate;

      pill.style.setProperty("--mx", `${tx}px`);
      pill.style.setProperty("--my", `${ty}px`);
      pill.style.setProperty("--ms", `${1 + intensity * 0.01}`);
      pill.style.setProperty("--mint", intensity.toFixed(3));

      const localX = mx - rect.left;
      const localY = my - rect.top;
      pill.style.setProperty("--gx", `${localX}px`);
      pill.style.setProperty("--gy", `${localY}px`);
    });

    const maxDistN = 220;
    const maxDistN2 = maxDistN * maxDistN;

    navLinks.forEach((link) => {
      const rect = link.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = mx - cx;
      const dy = my - cy;
      const d2 = dx * dx + dy * dy;

      const intensity = d2 >= maxDistN2 ? 0 : 1 - d2 / maxDistN2;

      const localX = mx - rect.left;
      const localY = my - rect.top;

      link.style.setProperty("--hx", `${localX}px`);
      link.style.setProperty("--hy", `${localY}px`);
      link.style.setProperty("--hint", intensity.toFixed(3));
    });

    if (headerInner) {
      const rect = headerInner.getBoundingClientRect();
      const localX = mx - rect.left;
      const localY = my - rect.top;

      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const dx = localX - cx;
      const dy = localY - cy;

      const maxDist = Math.max(cx, cy) * 1.1;
      const maxDist2 = maxDist * maxDist;
      const d2 = dx * dx + dy * dy;

      const inside =
        mx >= rect.left - 80 &&
        mx <= rect.right + 80 &&
        my >= rect.top - 80 &&
        my <= rect.bottom + 80;

      const intensity = inside ? clamp01(1 - d2 / maxDist2) : 0;

      headerInner.style.setProperty("--haloX", `${localX}px`);
      headerInner.style.setProperty("--haloY", `${localY}px`);
      headerInner.style.setProperty(
        "--haloOpacity",
        (intensity * 0.45).toFixed(3)
      );
    }
  });

  window.addEventListener(
    "mousemove",
    (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      onMove();
    },
    { passive: true }
  );
}

const modelPills = document.querySelectorAll(".model-pill");
const vehicleCards = document.querySelectorAll("#pojazdy .product-card");

function highlightVehicleCard(modelKey) {
  if (!modelKey) return;

  vehicleCards.forEach((card) => {
    if (card.dataset.model === modelKey) {
      card.classList.add("product-card-highlighted");
      setTimeout(() => {
        card.classList.remove("product-card-highlighted");
      }, 3000);
    }
  });
}

modelPills.forEach((pill) => {
  const modelKey = pill.dataset.model;
  pill.addEventListener("click", () => {
    setTimeout(() => {
      highlightVehicleCard(modelKey);
    }, 400);
  });
});

if (window.matchMedia("(pointer: fine)").matches) {
  const voyager = document.getElementById("voyager");
  if (voyager) {
    let tx = 0,
      ty = 0;
    let x = 0,
      y = 0;

    function loop() {
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;

      voyager.style.setProperty("--mx", x.toFixed(3));
      voyager.style.setProperty("--my", y.toFixed(3));

      requestAnimationFrame(loop);
    }
    loop();

    voyager.addEventListener("mousemove", (e) => {
      const r = voyager.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width;
      const ny = (e.clientY - r.top) / r.height;
      tx = nx - 0.5;
      ty = ny - 0.5;
    });

    voyager.addEventListener("mouseleave", () => {
      tx = 0;
      ty = 0;
    });
  }
}

function ensureSparks(containerSelector, sparkClass, count) {
  const host = document.querySelector(containerSelector);
  if (!host) return null;

  if (host.querySelector("." + sparkClass)) return host;

  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const s = document.createElement("i");
    s.className = sparkClass;
    frag.appendChild(s);
  }
  host.appendChild(frag);
  return host;
}

function initIntruderSectionSparks() {
  const host = ensureSparks("#intruder .intruder-sparks", "intruder-spark", 46);
  if (!host) return;

  host.querySelectorAll(".intruder-spark").forEach((s) => {
    const x = Math.random() * 100;

    const dur = 10 + Math.random() * 10;
    const delay = -(Math.random() * dur);

    let dx = Math.random() * 260 - 130;
    if (Math.abs(dx) < 60) dx = dx < 0 ? -80 : 80;

    const dy = -(120 + Math.random() * 60);
    const rot = -12 - Math.random() * 22;
    const scale = 0.75 + Math.random() * 1.35;

    s.style.setProperty("--x", x + "%");
    s.style.setProperty("--dur", dur.toFixed(2) + "s");
    s.style.setProperty("--delay", delay.toFixed(2) + "s");
    s.style.setProperty("--dx", dx.toFixed(1) + "px");
    s.style.setProperty("--dy", dy.toFixed(0) + "vh");
    s.style.setProperty("--rot", rot.toFixed(1) + "deg");
    s.style.setProperty("--scale", scale.toFixed(2));
  });
}

function initVoyagerSectionSparks() {
  const host = ensureSparks("#voyager .voyager-sparks", "voyager-spark", 70);
  if (!host) return;

  host.querySelectorAll(".voyager-spark").forEach((s) => {
    const left = Math.random() * 100;
    const dur = 7 + Math.random() * 8;
    const delay = Math.random() * 8;
    const drift = (Math.random() * 80 - 40).toFixed(1) + "px";
    const scale = (0.9 + Math.random() * 1.2).toFixed(2);

    s.style.left = left + "%";
    s.style.animationDuration = dur + "s";
    s.style.animationDelay = "-" + delay + "s";
    s.style.setProperty("--drift-x", drift);
    s.style.setProperty("--scale", scale);

    s.style.setProperty("--p", (0.7 + Math.random() * 0.8).toFixed(2));
  });
}

function initVoyagerCardSparks() {
  document
    .querySelectorAll(
      ".product-card--voyager .voyager-spark, #voyager .voyager-sparks .voyager-spark"
    )
    .forEach((s) => {
      const left = Math.random() * 100;
      const dur = 7 + Math.random() * 8;
      const delay = Math.random() * 8;
      const drift = (Math.random() * 80 - 40).toFixed(1) + "px";
      const scale = (0.9 + Math.random() * 1.2).toFixed(2);

      s.style.left = left + "%";
      s.style.animationDuration = dur + "s";
      s.style.animationDelay = "-" + delay + "s";
      s.style.setProperty("--drift-x", drift);
      s.style.setProperty("--scale", scale);
      s.style.setProperty("--p", (0.7 + Math.random() * 0.8).toFixed(2));
    });
}

function initIntruderCardSparks() {
  const sparks = Array.from(
    document.querySelectorAll(".product-card--intruder .intruder-spark")
  );
  const n = Math.max(1, sparks.length);

  sparks.forEach((s, i) => {
    const x = Math.random() * 100;

    const dur = 9 + Math.random() * 10;
    const base = (dur / n) * i;
    const jitter = Math.random() * (dur / n);
    const delay = -(base + jitter);

    let dx = Math.random() * 240 - 120;
    if (Math.abs(dx) < 55) dx = dx < 0 ? -75 : 75;

    const dy = -(110 + Math.random() * 70);
    const rot = -10 - Math.random() * 24;
    const scale = 0.7 + Math.random() * 1.1;

    s.style.setProperty("--x", x + "%");
    s.style.setProperty("--dur", dur.toFixed(2) + "s");
    s.style.setProperty("--delay", delay.toFixed(2) + "s");
    s.style.setProperty("--dx", dx.toFixed(1) + "px");
    s.style.setProperty("--dy", dy.toFixed(0) + "vh");
    s.style.setProperty("--rot", rot.toFixed(1) + "deg");
    s.style.setProperty("--scale", scale.toFixed(2));
  });
}

initVoyagerSectionSparks();
initVoyagerCardSparks();
initIntruderSectionSparks();
initIntruderCardSparks();

const I18N = {
  current: "pl",
  dict: {},
};

function getByPath(obj, path) {
  if (!obj || !path) return null;

  return path.split(".").reduce((acc, key) => {
    if (acc === undefined || acc === null) return null;

    if (Array.isArray(acc)) {
      const idx = Number(key);
      return Number.isInteger(idx) ? acc[idx] ?? null : null;
    }

    return acc[key] != null ? acc[key] : null;
  }, obj);
}

async function loadLanguage(lang) {
  const target = (lang || "pl").toLowerCase() === "en" ? "en" : "pl";
  I18N.current = target;

  setLangUI(target);
  document.documentElement.lang = target;
  localStorage.setItem("lang", target);

  if (target === "pl") {
    I18N.dict = {};
    applyTranslations(null);
    return;
  }

  let res = null;
  try {
    res = await fetch("js/i18n/en.json", { cache: "no-store" });
  } catch (e) {
    console.warn("i18n: fetch error for js/i18n/en.json", e);
  }

  if (!res || !res.ok) {
    console.warn("i18n: cannot load js/i18n/en.json", res && res.status);

    setLangUI("pl");
    document.documentElement.lang = "pl";
    localStorage.setItem("lang", "pl");
    I18N.dict = {};
    applyTranslations(null);
    return;
  }

  I18N.dict = await res.json();
  applyTranslations(I18N.dict);
}

function applyTranslations(dict) {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!key) return;

    const attr = el.getAttribute("data-i18n-attr");
    const isAttr = !!attr;

    if (!el.hasAttribute("data-i18n-base")) {
      const base = isAttr ? el.getAttribute(attr) : el.textContent;
      el.setAttribute("data-i18n-base", (base ?? "").toString());
    }

    if (!dict) {
      const base = el.getAttribute("data-i18n-base") ?? "";
      if (isAttr) el.setAttribute(attr, base);
      else el.textContent = base;
      return;
    }

    const value = getByPath(dict, key);
    if (value == null) return;

    if (isAttr) el.setAttribute(attr, value);
    else el.textContent = value;
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (!key) return;

    if (!el.hasAttribute("data-i18n-placeholder-base")) {
      el.setAttribute(
        "data-i18n-placeholder-base",
        (el.getAttribute("placeholder") ?? "").toString()
      );
    }

    if (!dict) {
      el.setAttribute(
        "placeholder",
        el.getAttribute("data-i18n-placeholder-base") ?? ""
      );
      return;
    }

    const value = getByPath(dict, key);
    if (value == null) return;

    el.setAttribute("placeholder", value);
  });

  document
    .querySelectorAll(".show-more-photos, .show-more-btn")
    .forEach((btn) => {
      if (!btn.hasAttribute("data-i18n-base")) {
        btn.setAttribute("data-i18n-base", btn.textContent.trim());
      }
      btn.textContent = dict
        ? getByPath(dict, "cards.more") || "Show more"
        : btn.getAttribute("data-i18n-base");
    });

  document.querySelectorAll(".card-cta").forEach((a) => {
    const current = a.textContent.trim();
    if (!a.hasAttribute("data-i18n-base"))
      a.setAttribute("data-i18n-base", current);

    if (!dict) {
      a.textContent = a.getAttribute("data-i18n-base");
      return;
    }

    const base = a.getAttribute("data-i18n-base") || current;
    if (base.toLowerCase().startsWith("zobacz")) {
      const model = base.replace(/zobacz/i, "").replace("↓", "").trim();
      a.textContent = `${getByPath(dict, "cards.see") || "See"} ${model} ↓`;
    }
  });

  document.querySelectorAll(".nav-label-inner").forEach((wrap) => {
    const main = wrap.querySelector(".nav-label-line");
    const alt = wrap.querySelector(".nav-label-line-alt");
    if (main && alt) alt.textContent = main.textContent;
  });
}

function setLangUI(lang) {
  document
    .querySelectorAll(".lang-btn")
    .forEach((b) => b.classList.toggle("lang-active", b.dataset.lang === lang));
}

function initLangSwitch() {
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    if (btn.dataset.i18nBound === "1") return;
    btn.dataset.i18nBound = "1";

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      loadLanguage(btn.dataset.lang || "pl");
    });
  });

  const saved = localStorage.getItem("lang");
  loadLanguage(saved === "en" ? "en" : "pl");
}

document.addEventListener("DOMContentLoaded", initLangSwitch);

// === CONTACT FORM (Formspree) ===
const form = document.getElementById("contact-form");
let status = document.getElementById("form-status");

if (form) {
  if (!status) {
    status = document.createElement("p");
    status.id = "form-status";
    status.className = "form-note";
    status.setAttribute("aria-live", "polite");
    form.appendChild(status);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    status.textContent = "Wysyłanie…";
    const data = new FormData(form);

    try {
      const res = await fetch(form.action, {
        method: form.method,
        body: data,
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        status.textContent = "Wiadomość została wysłana. Odezwiemy się wkrótce.";
        form.reset();
      } else {
        let result = null;
        try {
          result = await res.json();
        } catch {}
        status.textContent =
          result?.error || "Coś poszło nie tak. Spróbuj ponownie.";
      }
    } catch {
      status.textContent = "Błąd sieci. Sprawdź połączenie.";
    }
  });
}




// optional: swipe to close nav (mobile)
(function () {
  const backdrop = document.querySelector(".nav-backdrop");
  if (!backdrop) return;

  let x0 = null;

  backdrop.addEventListener("touchstart", (e) => {
    x0 = e.touches?.[0]?.clientX ?? null;
  }, { passive: true });

  backdrop.addEventListener("touchend", (e) => {
    const x1 = e.changedTouches?.[0]?.clientX ?? null;
    if (x0 == null || x1 == null) return;
    if (Math.abs(x1 - x0) > 40) {
      document.body.classList.remove("nav-open");
      document.documentElement.classList.remove("no-scroll");
      document.body.classList.remove("no-scroll");
      document.querySelector(".main-nav")?.classList.remove("open");
      backdrop.classList.remove("open");
      document.querySelector(".nav-toggle")?.setAttribute("aria-expanded", "false");
    }
    x0 = null;
  }, { passive: true });
})();

// ===== SMOOTH SCROLL + VEHICLES CAROUSEL CONTROL (mobile) =====

let isAutoScrolling = false;

// podczepiamy się pod Twoją funkcję updateSidePhotos (żeby nie klatkowała podczas auto-scroll)
const _updateSidePhotosOriginal = updateSidePhotos;
updateSidePhotos = function () {
  if (isAutoScrolling) return;
  return _updateSidePhotosOriginal();
};

function animateScrollTop(to, duration = 560) {
  const start = window.pageYOffset;
  const change = to - start;
  const startTime = performance.now();

  const ease = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  isAutoScrolling = true;

  return new Promise((resolve) => {
    function step(now) {
      const t = Math.min(1, (now - startTime) / duration);
      window.scrollTo(0, start + change * ease(t));

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        requestAnimationFrame(() => {
          isAutoScrolling = false;
          resolve();
        });
      }
    }
    requestAnimationFrame(step);
  });
}

function scrollToAnchorStable(id) {
  const el = document.getElementById(id);
  if (!el) return Promise.resolve();

  const header = document.querySelector(".site-header-inner");
  const offset = (header ? header.offsetHeight : 80) + 18;

  const y = el.getBoundingClientRect().top + window.pageYOffset - offset;
  return animateScrollTop(y, 560);
}

function scrollVehicleCardsTo(modelKey) {
  if (!modelKey) return;

  const cardsGrid = document.querySelector("#pojazdy .cards-grid");
  if (!cardsGrid) return;

  const card = cardsGrid.querySelector(`[data-model="${modelKey}"]`);
  if (!card) return;

  // przewijanie poziome kontenera (bardziej przewidywalne na iOS niż scrollIntoView)
  const left =
    card.offsetLeft - (cardsGrid.clientWidth - card.clientWidth) / 2;

  cardsGrid.scrollTo({
    left: Math.max(0, left),
    behavior: "smooth",
  });
}

// Klik w duże przyciski (Musher/Voyager/Intruder) => scroll do sekcji + przewinięcie w bok
document.querySelectorAll(".model-pill").forEach((pill) => {
  pill.addEventListener("click", (e) => {
    e.preventDefault();

    const modelKey = pill.dataset.model;
    scrollToAnchorStable("pojazdy").then(() => {
      scrollVehicleCardsTo(modelKey);
      highlightVehicleCard(modelKey);
    });
  });
});


function syncMobileHeaderOffset() {
  if (window.innerWidth > 720) return;

  const header = document.querySelector(".site-header-inner");
  if (!header) return;

  const h = Math.ceil(header.getBoundingClientRect().height);
  document.documentElement.style.setProperty(
    "--header-offset-mobile",
    `${h + 8}px`
  );
}

window.addEventListener("load", syncMobileHeaderOffset);
window.addEventListener("resize", syncMobileHeaderOffset);

/* =========================
   MUSHER – SOFT RAIN INIT (full width, starts under spec-card)
   ========================= */

(function initMusherRain(){
  const section = document.getElementById("musher");
  const rainHost = section?.querySelector(".musher-rain");
  const specCard = section?.querySelector(".spec-card");

  if (!section || !rainHost || !specCard) return;

  // delikatniej: mniej kropli
  const DROP_COUNT = 55;

  function spawnRain(){
    rainHost.innerHTML = "";

    const sectionRect = section.getBoundingClientRect();
    const specRect = specCard.getBoundingClientRect();

    // START pod kontenerem (spec-card)
    const startY = Math.max(0, (specRect.bottom - sectionRect.top));

    // Ustawiamy rain overlay tak, by zaczynał się dopiero od startY
    rainHost.style.top = `${startY}px`;

    // pełna szerokość sekcji
    const w = sectionRect.width;

    for(let i = 0; i < DROP_COUNT; i++){
      const drop = document.createElement("i");
      drop.className = "musher-drop";

      // pełna szerokość
      const x = Math.random() * w;

      // łagodniej: wolniej + różne długości
      const dur = 1.6 + Math.random() * 1.8; // 1.6–3.4s
      const delay = Math.random() * -dur;

      // lekki "wiatr" minimalny
      const dx = (Math.random() * 10 - 5).toFixed(1) + "px";

      // delikatniejsza widoczność
      const op = (0.18 + Math.random() * 0.18).toFixed(2); // 0.18–0.36
      const h = (45 + Math.random() * 55).toFixed(0) + "px"; // 45–100px

      drop.style.left = x + "px";
      drop.style.height = h;
      drop.style.animationDuration = dur + "s";
      drop.style.animationDelay = delay + "s";
      drop.style.setProperty("--dx", dx);
      drop.style.setProperty("--op", op);

      rainHost.appendChild(drop);
    }
  }

  spawnRain();
  window.addEventListener("resize", spawnRain, { passive: true });
})();




function initMobileCardsArrows() {
  const grid = document.querySelector("#pojazdy .cards-grid");
  const prev = document.querySelector("#pojazdy .cards-prev");
  const next = document.querySelector("#pojazdy .cards-next");
  if (!grid || !prev || !next) return;

  const update = () => {
    const maxScroll = grid.scrollWidth - grid.clientWidth;
    const x = grid.scrollLeft;

    prev.classList.toggle("is-hidden", x <= 4);
    next.classList.toggle("is-hidden", x >= maxScroll - 4);
  };

  prev.addEventListener("click", () => {
    grid.scrollBy({ left: -grid.clientWidth * 0.9, behavior: "smooth" });
  });

  next.addEventListener("click", () => {
    grid.scrollBy({ left: grid.clientWidth * 0.9, behavior: "smooth" });
  });

  grid.addEventListener("scroll", rafThrottle(update));
  window.addEventListener("resize", rafThrottle(update));

  update();
}

document.addEventListener("DOMContentLoaded", initMobileCardsArrows);
