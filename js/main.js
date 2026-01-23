const yearSpan = document.getElementById("year");
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

/* =========================
   COSMOS-STYLE INTRO LOADER
   ========================= */
(function initPageLoader(){
  const loader = document.getElementById("page-loader");
  if (!loader) return;

  // block scroll while intro is visible
  document.body.classList.add("page-loading");

  const started = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
  const MIN_SHOW_MS = 900; // minimum time to feel intentional (avoid flash)

  window.addEventListener(
    "load",
    () => {
      const now = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
      const elapsed = now - started;
      const wait = Math.max(0, MIN_SHOW_MS - elapsed);

      setTimeout(() => {
document.body.classList.remove("page-loading");
document.body.classList.add("page-loaded"); // najpierw pokaż stronę pod spodem

// teraz zrób "prześwit" od środka
loader.classList.add("reveal");
loader.setAttribute("aria-hidden", "true");

// po animacji usuń loader
setTimeout(() => loader.remove(), 1100);

      }, wait);
    },
    { once: true, passive: true }
  );
})();


function updateAnchorOffset() {
  const inner = document.querySelector(".site-header-inner");
  const header = document.querySelector(".site-header");
  if (!inner && !header) return;

  // Najpewniejsze: ile pikseli od TOP do dolnej krawędzi "piguły"
  const bottom = inner ? inner.getBoundingClientRect().bottom
                       : header.getBoundingClientRect().bottom;

  // +10px to “oddech”, żeby tytuł sekcji nie kleił się do headera
  document.documentElement.style.setProperty("--anchor-offset", `${Math.ceil(bottom + 10)}px`);
}


window.addEventListener("load", updateAnchorOffset, { passive: true });
window.addEventListener("resize", updateAnchorOffset, { passive: true });

// i na wypadek późnego przeliczenia layoutu na iOS (fonty, paski itp.)
setTimeout(updateAnchorOffset, 50);
setTimeout(updateAnchorOffset, 250);

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


/* =========================
   PERFECT ANCHOR SCROLL
   ========================= */
function getHeaderOffsetPx() {
  const inner = document.querySelector(".site-header-inner");
  const header = document.querySelector(".site-header");
  const el = inner || header;
  if (!el) return 0;

  const bottom = el.getBoundingClientRect().bottom;
  return Math.ceil(bottom + 12); // regulacja w px
}

function scrollToSection(id) {
  const target = document.getElementById(id);
  if (!target) return;

  // dynamiczny offset: header + safe-area (jeśli masz) + mały margines
  const header = document.querySelector(".site-header");
  const headerH = header ? header.getBoundingClientRect().height : 0;
  const extra = 10; // mały bufor, możesz zmienić np. 6–14
  const offset = headerH + extra;

  const go = () => {
    const y = target.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  go();

  // Korekta po zakończeniu animacji / po layout-shiftach (pierwsze kliknięcie)
  setTimeout(() => {
    const yNow = target.getBoundingClientRect().top;
    // jeśli cel dalej nie jest blisko górnego offsetu, popraw
    if (Math.abs(yNow - offset) > 6) go();
  }, 450);

  // Druga, delikatna korekta (na wypadek doczytania obrazków/fontów)
  setTimeout(() => {
    const yNow = target.getBoundingClientRect().top;
    if (Math.abs(yNow - offset) > 6) go();
  }, 1100);
}



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


function preloadHiddenGalleryImages(){
  const imgs = document.querySelectorAll(
    ".musher-photo.musher-extra img, .fenix-photo.fenix-extra img"
  );

  imgs.forEach((img) => {
    img.loading = "eager";
    img.decoding = "async";

    if (img.dataset.src && !img.src) img.src = img.dataset.src;
    if (img.dataset.srcset && !img.srcset) img.srcset = img.dataset.srcset;

    const pre = new Image();
    pre.src = img.currentSrc || img.src;
    if (img.srcset) pre.srcset = img.srcset;
  });
}

if ("requestIdleCallback" in window) {
  requestIdleCallback(preloadHiddenGalleryImages, { timeout: 1200 });
} else {
  setTimeout(preloadHiddenGalleryImages, 150);
}


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


/* =========================
   ONE ANCHOR HANDLER (MOBILE FIX)
   ========================= */
document.addEventListener(
  "click",
  (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;

    const href = a.getAttribute("href");
    if (!href || href === "#") return;

    // jeśli coś innego już przejęło klik (np. pill/slider), nie wchodzimy
    if (e.defaultPrevented) return;

    const id = href.slice(1);
    const target = document.getElementById(id);
    if (!target) return;

    // zatrzymaj domyślny skok przeglądarki
    e.preventDefault();

    const clickedInsideNav = !!a.closest(".main-nav");

    // 1) najpierw zamknij mobilne menu (zmienia layout!)
    if (clickedInsideNav) {
      try { closeNav(); } catch (_) {}
    }

    // 2) poczekaj aż layout się przeliczy i dopiero scrolluj
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToSection(id);
      });
    });
  },
  { passive: false }
);



// =========================
// MOBILE NAV: SWIPE / DRAG
// =========================
(function initNavSwipe() {
  const nav = document.querySelector(".main-nav");
  const backdrop = document.querySelector(".nav-backdrop");
  const edge = document.querySelector(".nav-edge");
  if (!nav || !backdrop || !edge) return;

  const isMobile = () => window.matchMedia("(max-width: 720px)").matches;

  let dragging = false;
  let startX = 0;
  let startNavX = 1; // 1 closed, 0 open
  let navW = 360;

  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

  const setNavX = (x01) => {
    nav.style.setProperty("--nav-x", String(clamp01(x01)));
    // delikatnie dopasuj opacity tła do stanu
    const op = 1 - clamp01(x01);
    backdrop.style.opacity = String(op);
    backdrop.style.pointerEvents = op > 0.01 ? "auto" : "none";
  };

  const beginDrag = (clientX, fromOpenState) => {
    if (!isMobile()) return;
    dragging = true;
    document.body.classList.add("nav-dragging");

    navW = nav.getBoundingClientRect().width || 360;
    startX = clientX;

    // jeśli startujemy z zamkniętego, to pozycja = 1, jeśli z otwartego = 0
    startNavX = fromOpenState ? 0 : 1;

    // gdy zaczynamy “otwierać” z krawędzi, ustaw stan open,
    // żeby backdrop i blokada scrolla weszły od razu
    if (!fromOpenState && !document.body.classList.contains("nav-open")) {
      openNav();
    }

    setNavX(startNavX);
  };

  const moveDrag = (clientX) => {
    if (!dragging) return;

    const dx = clientX - startX;

    // Zamknięte -> otwieramy: dx w lewo (ujemne)
    // Otwarte -> zamykamy: dx w prawo (dodatnie)
    let x01;
    if (startNavX === 1) {
      // opening: 1 -> 0
      x01 = 1 + dx / navW; // dx ujemny zmniejsza
    } else {
      // closing: 0 -> 1
      x01 = dx / navW; // dx dodatni zwiększa
    }

    setNavX(clamp01(x01));
  };

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    document.body.classList.remove("nav-dragging");

    const x01 = Number(getComputedStyle(nav).getPropertyValue("--nav-x")) || 0;

    // próg: jak bardziej otwarte niż 50% -> zostaw otwarte
    if (x01 > 0.5) {
      closeNav();
      // po closeNav transform wraca z CSS, ale czyścimy inline
      nav.style.removeProperty("--nav-x");
      backdrop.style.removeProperty("opacity");
      backdrop.style.removeProperty("pointerEvents");
    } else {
      openNav();
      nav.style.removeProperty("--nav-x");
      backdrop.style.removeProperty("opacity");
      backdrop.style.removeProperty("pointerEvents");
    }
  };

  // --- SWIPE CLOSE: łap na samym panelu ---
  nav.addEventListener(
    "touchstart",
    (e) => {
      if (!isMobile()) return;
      if (!document.body.classList.contains("nav-open")) return;
      const t = e.touches && e.touches[0];
      if (!t) return;
      // start drag tylko gdy zaczynasz blisko prawej krawędzi panelu (naturalne “domykanie”)
      beginDrag(t.clientX, true);
    },
    { passive: true }
  );

  nav.addEventListener(
    "touchmove",
    (e) => {
      if (!dragging) return;
      const t = e.touches && e.touches[0];
      if (!t) return;
      moveDrag(t.clientX);
    },
    { passive: true }
  );

  nav.addEventListener(
    "touchend",
    () => endDrag(),
    { passive: true }
  );

  // --- SWIPE OPEN: łap na niewidocznej strefie przy prawej krawędzi ---
  edge.addEventListener(
    "touchstart",
    (e) => {
      if (!isMobile()) return;
      if (document.body.classList.contains("nav-open")) return;
      const t = e.touches && e.touches[0];
      if (!t) return;
      beginDrag(t.clientX, false);
    },
    { passive: true }
  );

  edge.addEventListener(
    "touchmove",
    (e) => {
      if (!dragging) return;
      const t = e.touches && e.touches[0];
      if (!t) return;
      moveDrag(t.clientX);
    },
    { passive: true }
  );

  edge.addEventListener(
    "touchend",
    () => endDrag(),
    { passive: true }
  );

  // sanity: po resize na desktop – sprzątnij inline
  window.addEventListener(
    "resize",
    () => {
      if (!isMobile()) {
        nav.style.removeProperty("--nav-x");
        backdrop.style.removeProperty("opacity");
        backdrop.style.removeProperty("pointerEvents");
        document.body.classList.remove("nav-dragging");
      }
    },
    { passive: true }
  );
})();



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

  const isOpen = item.classList.contains("open");

  // zamknij inne dropdowny
  mainNav.querySelectorAll(".nav-has-dropdown.open").forEach((el) => {
    if (el !== item) el.classList.remove("open");
  });

// przełącz aktualny
item.classList.toggle("open");

// iOS: zdejmij focus z linku (inaczej "Pojazdy" zostaje w stanie po kliknięciu)
vehiclesHeader.blur();
document.activeElement?.blur?.();

// czasem Safari iOS odpala focus z opóźnieniem — dobijamy w następnej klatce
requestAnimationFrame(() => {
  vehiclesHeader.blur();
  document.activeElement?.blur?.();
});

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
window.dispatchEvent(new CustomEvent("languageChanged", { detail: { lang: "pl" } }));
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
window.dispatchEvent(new CustomEvent("languageChanged", { detail: { lang: "en" } }));

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

function scrollToAnchorStable(id, duration = 380) {
  const el = document.getElementById(id);
  if (!el) return Promise.resolve();

  const header = document.querySelector(".site-header-inner");
  const offset = (header ? header.offsetHeight : 80) + 18;

  const y = el.getBoundingClientRect().top + window.pageYOffset - offset;
  return animateScrollTop(y, duration);
}

// CTA "Porozmawiajmy" -> zawsze do kontaktu, bez laga
document.querySelectorAll('a[href="#kontakt"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const isMobile = window.matchMedia("(max-width: 720px)").matches;
    if (!isMobile) return; // desktop zostaw natywnie

    e.preventDefault();
    closeNav(); // jeśli menu było otwarte

    // start natychmiast (bez czekania)
    scrollToAnchorStable("kontakt", 380);
  });
});

// iOS/Android: zdejmij focus z CTA po tapnięciu (żeby nie zostawało podświetlone)
document.querySelectorAll('.nav-cta, .nav-cta-mobile, a[href="#kontakt"]').forEach((a) => {
  a.addEventListener("click", () => {
    // Safari lubi trzymać focus — dobijamy w kolejnych klatkach
    a.blur?.();
    document.activeElement?.blur?.();

    requestAnimationFrame(() => {
      a.blur?.();
      document.activeElement?.blur?.();
    });

    setTimeout(() => {
      a.blur?.();
      document.activeElement?.blur?.();
    }, 60);
  }, { passive: true });
});



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

document.querySelectorAll(".model-pill").forEach((pill) => {
  pill.addEventListener("click", (e) => {
    const isMobile = window.matchMedia("(max-width: 720px)").matches;
    if (!isMobile) return; // desktop: nie ruszaj, niech działa normalny anchor

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

  const cards = Array.from(grid.querySelectorAll(".product-card"));
  if (!cards.length) return;

  const cardCenterLeft = (card) =>
    card.offsetLeft + card.offsetWidth / 2;

  const scrollToCardIndex = (idx) => {
    const card = cards[idx];
    if (!card) return;

    const targetCenter = cardCenterLeft(card);
    const targetLeft = Math.round(targetCenter - grid.clientWidth / 2);

    grid.scrollTo({ left: targetLeft, behavior: "smooth" });
  };

  const getCurrentIndex = () => {
    const viewportCenter = grid.scrollLeft + grid.clientWidth / 2;

    let bestIdx = 0;
    let bestDist = Infinity;

    for (let i = 0; i < cards.length; i++) {
      const dist = Math.abs(cardCenterLeft(cards[i]) - viewportCenter);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    return bestIdx;
  };

const update = () => {
  const i = getCurrentIndex();

  // pierwsza karta -> ukryj lewą
  prev.classList.toggle("is-hidden", i <= 0);

  // ostatnia karta -> ukryj prawą
  next.classList.toggle("is-hidden", i >= cards.length - 1);
};



  prev.addEventListener("click", () => {
    const i = getCurrentIndex();
    scrollToCardIndex(Math.max(0, i - 1));
  });

  next.addEventListener("click", () => {
    const i = getCurrentIndex();
    scrollToCardIndex(Math.min(cards.length - 1, i + 1));
  });

  grid.addEventListener("scroll", rafThrottle(update));
  window.addEventListener("resize", rafThrottle(update));
  update();
}

document.addEventListener("DOMContentLoaded", initMobileCardsArrows);


async function loadGoogleReviews() {
  const track = document.getElementById("reviews-track");
  const summary = document.getElementById("reviews-summary");
  const prev = document.querySelector(".reviews-prev");
  const next = document.querySelector(".reviews-next");
  if (!track || !summary) return;

  try {
    const res = await fetch("/api/reviews", { cache: "no-store" });
    if (!res.ok) throw new Error("reviews http " + res.status);
    const data = await res.json();

    // summary
    const rating = (data.rating ?? "").toString();
    const count = (data.user_ratings_total ?? "").toString();
    summary.innerHTML = `
      Google: <strong>${rating || "-"}</strong> / 5 • <strong>${count || "-"}</strong> opinii
      <a class="about-reviews__link"
         href="https://www.google.com/search?hl=pl-PL&num=20&q=Poray+Electric+Vehicles+Opinie&rflfq=1&rldimm=3372214790320219758&stick=H4sIAAAAAAAAAONgkxI2NjY3MjI0Mbc0MDYyMDK0NDe12MDI-IpRLiC_KLFSwTUnNbmkKDNZISw1IzM5J7VYwb8gMy8zdRErAQUA0TyaClwAAAA&tbm=lcl"
         target="_blank" rel="noopener noreferrer">Zobacz w Google →</a>
    `;

    // cards
    track.innerHTML = "";
    const reviews = Array.isArray(data.reviews) ? data.reviews : [];
    if (!reviews.length) {
      track.innerHTML = `<article class="card review-card"><p class="review-text">Brak opinii do wyświetlenia.</p></article>`;
      return;
    }

    for (const r of reviews) {
      const stars = "★★★★★".slice(0, Math.max(0, Math.min(5, r.rating || 0)));
      const date = r.relative_time_description || "";
      const author = r.author_name || "Klient";

      const card = document.createElement("article");
      card.className = "card review-card";
      card.innerHTML = `
        <div class="review-stars" aria-label="${r.rating || 0} na 5">${stars}</div>
        <p class="review-text">${escapeHtml(r.text || "")}</p>
        <div class="review-footer">
          <div>
            <div class="review-author">${escapeHtml(author)}</div>
            <div class="review-date">${escapeHtml(date)}</div>
          </div>
          <div class="review-google" aria-hidden="true"><span>G</span></div>
        </div>
      `;
      track.appendChild(card);
    }

    // arrows scroll (desktop)
    if (prev && next) {
      const scrollByOne = (dir) => {
        const card = track.querySelector(".review-card");
        const step = card ? (card.getBoundingClientRect().width + 16) : 360;
        track.scrollBy({ left: dir * step, behavior: "smooth" });
      };
      prev.onclick = () => scrollByOne(-1);
      next.onclick = () => scrollByOne(1);
    }
  } catch (e) {
    console.warn("reviews: load failed", e);
    summary.textContent = "Nie udało się pobrać opinii z Google.";
  }
}

function escapeHtml(s) {
  return (s ?? "").toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.addEventListener("DOMContentLoaded", loadGoogleReviews);


const langToggle = document.getElementById("langToggle");

if (langToggle) {
  langToggle.addEventListener("click", (e) => {
    const btn = e.target.closest(".lang-option");
    if (!btn) return;

    langToggle.querySelectorAll(".lang-option")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

    const lang = btn.dataset.lang;

    // TU podłączasz swoją logikę językową
    // np. setLanguage(lang);
    console.log("Language:", lang);
  });
}

(function themeToggle(){
  const btn = document.querySelector(".theme-toggle");
  if(!btn) return;

  const root = document.documentElement;

  // load saved
  const saved = localStorage.getItem("theme");
  if(saved === "light"){
    root.classList.add("light");
    btn.textContent = "☀️";
  }

  btn.addEventListener("click", () => {
    const isLight = root.classList.toggle("light");
    localStorage.setItem("theme", isLight ? "light" : "dark");
    btn.textContent = isLight ? "☀️" : "🌙";
  });
})();

/* =========================
   DESKTOP SCROLLSPY (active nav)
   ========================= */
(function initDesktopScrollSpy(){
  const mq = window.matchMedia("(min-width: 721px) and (hover: hover) and (pointer: fine)");
  let observer = null;
  let currentId = null;
  let resizeT = null;

  function clearActive(){
    document.querySelectorAll(".main-nav .is-active").forEach((el) => {
      el.classList.remove("is-active");
    });
  }

function setActive(id){
  if (!id || id === currentId) return;
  currentId = id;

  clearActive();

  // sekcje, które mają podświetlać też "Pojazdy"
  const groupFor = {
    voyager: "pojazdy",
    intruder: "pojazdy",
  };

  // 1) podświetl link tej sekcji (np. w dropdownie)
  document
    .querySelectorAll(`.main-nav a[href="#${CSS.escape(id)}"]`)
    .forEach((a) => a.classList.add("is-active"));

  // 2) jeśli jesteśmy w voyager/intruder -> podświetl też nagłówek "Pojazdy"
  const groupId = groupFor[id];
  if (groupId) {
    document
      .querySelectorAll(`.main-nav a[href="#${CSS.escape(groupId)}"]`)
      .forEach((a) => a.classList.add("is-active"));
  }
}


  function setup(){
    if (observer) { observer.disconnect(); observer = null; }
    clearActive();
    currentId = null;

    if (!mq.matches) return;

    const links = Array.from(document.querySelectorAll('.main-nav a[href^="#"]'))
      .filter(a => (a.getAttribute("href") || "").length > 1);

    const ids = Array.from(new Set(
      links.map(a => decodeURIComponent(a.getAttribute("href").slice(1))).filter(Boolean)
    ));

    const sections = ids.map(id => document.getElementById(id)).filter(Boolean);
    if (!sections.length) return;

    const offset = (typeof getHeaderOffsetPx === "function") ? getHeaderOffsetPx() : 0;

    observer = new IntersectionObserver((entries) => {
      // wybierz najbardziej "widoczną" sekcję
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a,b) => b.intersectionRatio - a.intersectionRatio);

      if (visible[0]) setActive(visible[0].target.id);
    }, {
      threshold: [0.2, 0.35, 0.5, 0.65],
      rootMargin: `-${offset + 12}px 0px -55% 0px`
    });

    sections.forEach(sec => observer.observe(sec));

    // inicjalnie: wybierz sekcję najbliżej topu (po załadowaniu / refresh)
    requestAnimationFrame(() => {
      const y = offset + 18;
      let best = null;
      let bestDist = Infinity;

      sections.forEach(sec => {
        const r = sec.getBoundingClientRect();
        const dist = Math.abs(r.top - y);
        if (r.bottom > y && dist < bestDist) { bestDist = dist; best = sec; }
      });

      if (best) setActive(best.id);
    });
  }

  // reakcja na breakpoint / resize (offset headera się zmienia)
  const onResize = () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(setup, 160);
  };

  if (mq.addEventListener) mq.addEventListener("change", setup);
  else mq.addListener(setup);

  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("load", setup, { passive: true });

  // gdy zmieniasz język, layout menu może się minimalnie przeliczyć
  window.addEventListener("languageChanged", () => setTimeout(setup, 50), { passive: true });

  setup();
})();




/* =========================
   SPEC CARD CONFIGURATOR
   ========================= */
(function initSpecConfigurator(){
  const cards = Array.from(document.querySelectorAll(".spec-card"));
  if (!cards.length) return;

  const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const titleCase = (s) => (s ? (s.charAt(0).toUpperCase() + s.slice(1)) : "");

  // =========================
  // PRICING (Voyager)
  // =========================
  // Base: 28.000 zł (PL) / 6800 euro (EN)
const PLN_PER_EUR = 4.25;

const PRICE = {
  voyager: {
    basePLN: 28000,
    baseEUR: Math.round(28000 / PLN_PER_EUR),
    extrasPLN: {
      // amortyzator przód
      "Marzocchi Bomber 58": 1000,                 // legacy
      "Marzocchi Bomber 58 Red": 1000,
      "Marzocchi Bomber 58 Black": 1000,
      "Rock Shox Boxxer": 2000,

      // oświetlenie
      "Standard 1000 lm": 200,
      "Pro 2200 lm": 400,

      // amortyzator tył
      "Rock Shox Vivid Coil": 1400,

      // kanapa
      "Moto": 650,

      // usb
      "USB-A + USB-C": 150,
    },
  },

  intruder: {
    basePLN: 29800,
    baseEUR: Math.round(29800 / PLN_PER_EUR),
    extrasPLN: {
      // amortyzator przód
      "Marzocchi Bomber 58": 1000,                 // legacy
      "Marzocchi Bomber 58 Red": 1000,
      "Marzocchi Bomber 58 Black": 1000,
      "Rock Shox Boxxer": 2000,

      // oświetlenie
      "Standard 1000 lm": 200,
      "Pro 2200 lm": 400,

      // amortyzator tył
      "Rock Shox Vivid Coil": 1400,

      // kanapa
      "Moto": 650,

      // usb
      "USB-A + USB-C": 150,
    },
  },
};




const fxEUR = 1 / PLN_PER_EUR;



const formatMoney = (amount, lang) => {
  const n = Math.round(Number(amount) || 0);
  const s = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (lang === "en") ? `${s} €` : `${s} PLN`;
};


  const currentLang = () => (window.I18N && window.I18N.current) ? window.I18N.current : (document.documentElement.lang || "pl");

const calcTotalPLN = (fd, model) => {
  const mKey = (model || "voyager").toLowerCase();
  const cfg = PRICE[mKey] || PRICE.voyager;

  const base = cfg.basePLN;
  const keys = ["frontSusp", "lighting", "rearSusp", "usb", "seat"];

  let extra = 0;
  keys.forEach((k) => {
    const v = (fd.get(k) || "").toString();
    extra += cfg.extrasPLN[v] || 0;
  });

  return base + extra;
};


  const updateStartsFrom = () => {
    const lang = currentLang();
    document.querySelectorAll(".spec-startsfrom[data-price-model]").forEach((el) => {
      const model = (el.getAttribute("data-price-model") || "").toLowerCase();
      const cfg = PRICE[model];
      if (!cfg) return;

      const base = lang === "en" ? formatMoney(cfg.baseEUR, "en") : formatMoney(cfg.basePLN, "pl");
      el.textContent = lang === "en" ? `Starts from ${base}` : `Cena od ${base}`;
    });
  };

const updateForkOptionLabels = () => {
  const lang = currentLang();

const applyToSelect = (name) => {
  document.querySelectorAll(`select[name="${name}"] option`).forEach((opt) => {
    const baseText = opt.getAttribute("data-base-text") || opt.textContent;
    if (!opt.hasAttribute("data-base-text")) opt.setAttribute("data-base-text", baseText);

    const value = (opt.value || "").toString();
    const model = ((opt.closest("form") && opt.closest("form").getAttribute("data-model")) || "voyager").toLowerCase();
    const cfg = PRICE[model] || PRICE.voyager;
    const extraPLN = cfg.extrasPLN[value] || 0;

    const label =
      (VALUE_LABELS[name] && VALUE_LABELS[name][lang] && VALUE_LABELS[name][lang][value])
        ? VALUE_LABELS[name][lang][value]
        : baseText;

    if (!extraPLN) {
      opt.textContent = label;
      return;
    }

    const extra = (lang === "en")
      ? formatMoney(extraPLN * fxEUR, "en")
      : formatMoney(extraPLN, "pl");

    opt.textContent = `${label} (+${extra})`;
  });
};


  // selecty z dopłatami
["frontSusp", "lighting", "rearSusp", "usb", "tires"].forEach(applyToSelect);


// kanapa (radio pills)
document.querySelectorAll('input[type="radio"][name="seat"]').forEach((inp) => {
  const label = inp.closest("label");
  const span = label ? label.querySelector("span") : null;
  if (!span) return;

  // zapamiętaj oryginalny (PL) tekst bazowy
  const baseText = span.getAttribute("data-base-text") || span.textContent;
  if (!span.hasAttribute("data-base-text")) span.setAttribute("data-base-text", baseText);

  const value = (inp.value || "").toString();
  const model = ((inp.closest("form") && inp.closest("form").getAttribute("data-model")) || "voyager").toLowerCase();
  const cfg = PRICE[model] || PRICE.voyager;
  const extraPLN = cfg.extrasPLN[value] || 0;

  // tłumaczenie wartości tylko dla EN (UI pills)
  const seatLabel =
    (lang === "en")
      ? (value === "Siodło rowerowe" ? "Bicycle saddle" : baseText)  // Moto zostaje Moto
      : baseText;

  if (!extraPLN) {
    span.textContent = seatLabel;
    return;
  }

  const extra = lang === "en"
    ? formatMoney(extraPLN * fxEUR, "en")
    : formatMoney(extraPLN, "pl");

  span.textContent = `${seatLabel} (+${extra})`;
});

};


const updateSummary = (form) => {
  const totalEl = form.querySelector("[data-total-price]");
  if (!totalEl) return;

  const lang = currentLang();
  const model = ((form.getAttribute("data-model")) || "voyager").toLowerCase();
  const cfg = PRICE[model] || PRICE.voyager;

  const fd = new FormData(form);

  const keys = ["frontSusp", "lighting", "rearSusp", "usb", "seat"];
  let extrasPLN = 0;

  keys.forEach((k) => {
    const v = (fd.get(k) || "").toString();
    extrasPLN += cfg.extrasPLN[v] || 0;
  });

  const totalPLN = cfg.basePLN + extrasPLN;
  const totalEUR = cfg.baseEUR + (extrasPLN * fxEUR);

  totalEl.textContent =
    lang === "en"
      ? `Total: ${formatMoney(totalEUR, "en")}`
      : `Razem: ${formatMoney(totalPLN, "pl")}`;
};



// =========================
// VALUE LABELS (PL/EN) – do podsumowania i wiadomości
// =========================
const VALUE_LABELS = {
  tires: {
    pl: { "Teren": "Teren", "Uniwersalne": "Uniwersalne", "Szosowe": "Szosowe" },
    en: { "Teren": "Off-road", "Uniwersalne": "All-purpose", "Szosowe": "Street" },
  },
  lighting: {
    pl: { "Brak": "Brak", "Standard 1000 lm": "Standard 1000 lumenów", "Pro 2200 lm": "Pro 2200 lumenów" },
    en: { "Brak": "None", "Standard 1000 lm": "Standard 1000 lumens", "Pro 2200 lm": "Pro 2200 lumens" },
  },
  usb: {
    pl: { "Brak": "Brak", "USB-A + USB-C": "USB-A + USB-C" },
    en: { "Brak": "None", "USB-A + USB-C": "USB-A + USB-C" },
  },
  seat: {
    pl: { "Moto": "Moto", "Siodło rowerowe": "Siodło rowerowe" },
    en: { "Moto": "Motorcycle seat", "Siodło rowerowe": "Bike saddle" },
  },
  frontSusp: {
    pl: { "Moto (standard)": "Moto (standard)", "Marzocchi Bomber 58": "Marzocchi Bomber 58", "Rock Shox Boxxer": "Rock Shox Boxxer" },
    en: { "Moto (standard)": "Motorcycle (standard)", "Marzocchi Bomber 58": "Marzocchi Bomber 58", "Rock Shox Boxxer": "Rock Shox Boxxer" },
  },
  rearSusp: {
    pl: { "Moto (standard)": "Moto (standard)", "Rock Shox Vivid Coil": "Rock Shox Vivid Coil" },
    en: { "Moto (standard)": "Motorcycle (standard)", "Rock Shox Vivid Coil": "Rock Shox Vivid Coil" },
  }
};

const SUMMARY_LABELS = {
  pl: {
    titleSuffix: "konfiguracja",
    color: "Kolor",
    tires: "Opony",
    lighting: "Oświetlenie",
    usb: "USB",
    seat: "Kanapa",
    frontSusp: "Amortyzator przód",
    rearSusp: "Amortyzator tył",
    total: "Razem",
  },
  en: {
    titleSuffix: "configuration",
    color: "Color",
    tires: "Tires",
    lighting: "Lighting",
    usb: "USB",
    seat: "Seat",
    frontSusp: "Front suspension",
    rearSusp: "Rear suspension",
    total: "Total",
  }
};

const vLabel = (key, rawValue, lang) => {
  const m = VALUE_LABELS[key] && VALUE_LABELS[key][lang];
  return (m && m[rawValue]) ? m[rawValue] : rawValue;
};

const buildConfigMessage = (form) => {
  const lang = currentLang();
  const model = (form.getAttribute("data-model") || "").toString();
  const modelName = model ? titleCase(model) : "Model";

  const fd = new FormData(form);
  const pick = (name) => (fd.get(name) || "").toString().trim();

  const color = pick("color");
  const colorCode = pick("colorCode");
  const lighting = pick("lighting");
  const tires = pick("tires");
  const usb = pick("usb");
  const seat = pick("seat");
  const frontSusp = pick("frontSusp");
  const rearSusp = pick("rearSusp");

  // cena (na razie tylko voyager ma pricing)
  let priceLine = "";
  if (model.toLowerCase() === "voyager") {
    const totalPLN = calcTotalPLN(fd, model);
    const cfg = PRICE[model] || PRICE.voyager;
    const totalEUR = cfg.baseEUR + ((totalPLN - cfg.basePLN) * fxEUR);

    priceLine = lang === "en"
      ? `Total: ${formatMoney(totalEUR, "en")}`
      : `Razem: ${formatMoney(totalPLN, "pl")}`;
  }

  const L = SUMMARY_LABELS[lang] || SUMMARY_LABELS.pl;

  const lines = [];
  lines.push(`${modelName} - ${L.titleSuffix}`);
  lines.push("");

    // --- Base specs z lewej specyfikacji (spec-list) ---
  const card = form.closest(".spec-card");
  const baseRows = [];

  if (card) {
    card.querySelectorAll(".spec-list div").forEach((row) => {
      const dt = row.querySelector("dt");
      const dd = row.querySelector("dd");
      const k = (dt?.textContent || "").trim();
      const v = (dd?.textContent || "").trim();
      const keyLower = k.toLowerCase();
if (k && v && keyLower !== "lighting" && keyLower !== "oświetlenie") {
  baseRows.push([k, v]);
}

    });
  }

  if (baseRows.length) {
    lines.push(lang === "en" ? "Base specs:" : "Parametry podstawowe:");
    baseRows.forEach(([k, v]) => lines.push(`• ${k}: ${v}`));
    lines.push("");
  }


  
  // kolor
  if (color) {
    const c = colorCode ? `${color} (${colorCode})` : color;
    lines.push(`• ${L.color}: ${c}`);
  }

  if (tires) lines.push(`• ${L.tires}: ${vLabel("tires", tires, lang)}`);
  if (lighting) lines.push(`• ${L.lighting}: ${vLabel("lighting", lighting, lang)}`);
  if (usb && usb !== "Brak") lines.push(`• ${L.usb}: ${vLabel("usb", usb, lang)}`);
  if (seat) lines.push(`• ${L.seat}: ${vLabel("seat", seat, lang)}`);
  if (frontSusp) lines.push(`• ${L.frontSusp}: ${vLabel("frontSusp", frontSusp, lang)}`);
  if (rearSusp) lines.push(`• ${L.rearSusp}: ${vLabel("rearSusp", rearSusp, lang)}`);

  if (priceLine) {
    lines.push("");
    lines.push(priceLine.replace(/^Razem:/, `${L.total}:`).replace(/^Total:/, `${L.total}:`));
  }

  return lines.join("\n").trim() + "\n";
};


// AUTO-GROW textarea, ale z limitem i przewijaniem po przekroczeniu
const autoGrow = (ta, maxPx = 300) => {
  if (!ta) return;

  ta.style.resize = "none";

  // reset height, żeby scrollHeight policzył się poprawnie
  ta.style.height = "auto";

  const next = Math.min(ta.scrollHeight, maxPx);
  ta.style.height = `${next}px`;

  // jeśli przekracza limit — włącz scrollbar
  ta.style.overflowY = ta.scrollHeight > maxPx ? "auto" : "hidden";
};


(function initContactTextareaAutoGrow() {
  const ta = document.querySelector('#contact-form textarea[name="message"]');
  if (!ta) return;

  const MAX = 240; // możesz zmienić np. 200/280/320

  // startowo dopasuj (np. gdy wklejona konfiguracja)
  autoGrow(ta, MAX);

  // na bieżąco podczas pisania
  ta.addEventListener("input", () => autoGrow(ta, MAX));
})();



const updateConfigOutput = (form) => {
  const out = form.querySelector(".config-output");
  if (!out) return;
  out.value = buildConfigMessage(form);

  // auto-grow textarea to fit content (no scroll)
  out.style.height = "auto";
  out.style.height = `${out.scrollHeight}px`;
};


  const closeCard = (card, instant = false) => {
    const btn = card.querySelector(".config-toggle");
    const panel = card.querySelector(".config-panel");
    if (!btn || !panel) return;

    if (!card.classList.contains("is-config-open") && panel.hidden) return;

    card.classList.remove("is-config-open");
    btn.setAttribute("aria-expanded", "false");

    if (instant || prefersReduced) {
      panel.style.height = "0px";
      panel.hidden = true;
      return;
    }

    const startH = panel.scrollHeight;
    panel.style.height = `${startH}px`;
    void panel.offsetHeight;
    panel.style.height = "0px";

    panel.addEventListener("transitionend", (e) => {
      if (e.propertyName !== "height") return;
      if (!card.classList.contains("is-config-open")) panel.hidden = true;
    }, { once: true });
  };

const openCard = (card) => {
  const btn = card.querySelector(".config-toggle");
  const panel = card.querySelector(".config-panel");
  if (!btn || !panel) return;

  card.classList.add("is-config-open");
  btn.setAttribute("aria-expanded", "true");

  panel.hidden = false;

  // <-- DODAJ TO:
  const form = card.querySelector(".config-form");
  if (form) { updateSummary(form); updateConfigOutput(form); }

panel.style.height = "0px";
  void panel.offsetHeight;

  panel.style.height = `${panel.scrollHeight}px`;
};





  const recalcOpenHeights = () => {
    document.querySelectorAll(".spec-card.is-config-open .config-panel").forEach((panel) => {
      panel.style.height = `${panel.scrollHeight}px`;
    });
  };

  cards.forEach((card) => {
    const btn = card.querySelector(".config-toggle");
    const panel = card.querySelector(".config-panel");
    if (!btn || !panel) return;

    panel.style.height = "0px";

    const form = card.querySelector(".config-form");
    if (form) {
      updateSummary(form);
      updateConfigOutput(form);
      form.addEventListener("input", () => { updateSummary(form); updateConfigOutput(form); });
      form.addEventListener("change", () => { updateSummary(form); updateConfigOutput(form); });

      const copyBtn = form.querySelector(".config-copy");
      if (copyBtn) {
        copyBtn.addEventListener("click", async () => {
          const out = form.querySelector(".config-output");
          if (!out) return;

          try {
            await navigator.clipboard.writeText(out.value);
            const prev = copyBtn.textContent;
            copyBtn.textContent = "Skopiowano ✓";
            setTimeout(() => (copyBtn.textContent = prev), 1200);
          } catch (_) {
            out.focus();
            out.select();
          }
        });
      }

      const askBtn = form.querySelector(".config-ask");
      if (askBtn) {
        askBtn.addEventListener("click", () => {
          const message = buildConfigMessage(form);

          const contactSection = document.querySelector("#kontakt");
          if (contactSection) contactSection.scrollIntoView({ behavior: "smooth", block: "start" });

          const contactForm = document.querySelector("#contact-form");
          const msgField = contactForm ? contactForm.querySelector('textarea[name="message"]') : null;
if (msgField) {
  msgField.value = message;
  autoGrow(msgField); // <-- TO DODAJ

  msgField.focus();
  msgField.setSelectionRange(msgField.value.length, msgField.value.length);
}

        });
      }

    }

    btn.addEventListener("click", () => {
      const isOpen = card.classList.contains("is-config-open");
      if (isOpen) {
        closeCard(card);
      } else {
        // czytelnie: jeden otwarty na raz
        cards.forEach((c) => { if (c !== card) closeCard(c, true); });
        openCard(card);
      }
    });
  });

  // initial pricing UI
  updateStartsFrom();
  updateForkOptionLabels();

  let rT = 0;
  window.addEventListener("resize", () => {
    clearTimeout(rT);
    rT = setTimeout(recalcOpenHeights, 120);
  }, { passive: true });

window.addEventListener("languageChanged", () => {
  updateStartsFrom();
  updateForkOptionLabels();
  document.querySelectorAll(".config-form").forEach((f) => { updateSummary(f); updateConfigOutput(f); });
  setTimeout(recalcOpenHeights, 60);
}, { passive: true });

})();



/* =========================
   COLOR PICKER – PREVIEW MODAL
   ========================= */
(function initColorPreviewModal(){
  const modal = document.getElementById("color-modal");
  if (!modal) return;

  const imgsWrap = modal.querySelector(".color-modal__imgs");
  const titleEl = modal.querySelector(".color-modal__title");
  const closeEls = modal.querySelectorAll("[data-color-close]");

  const open = (title, srcs) => {
    if (!imgsWrap) return;

    imgsWrap.innerHTML = "";
    imgsWrap.classList.toggle("is-duo", srcs.length > 1);

    srcs.forEach((src) => {
      const img = document.createElement("img");
      img.src = src;
      img.alt = "";
      img.loading = "lazy";
      imgsWrap.appendChild(img);
    });

    if (titleEl) titleEl.textContent = title || "";

    modal.hidden = false;
    document.body.classList.add("is-modal-open");
  };

  const close = () => {
    modal.hidden = true;
    document.body.classList.remove("is-modal-open");
  };

  closeEls.forEach((el) => el.addEventListener("click", close));

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".color-zoom");
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    const opt = btn.closest(".color-option");
    if (!opt) return;

    const title = (opt.querySelector(".color-name")?.textContent || "").trim();
    const srcs = Array.from(opt.querySelectorAll(".color-swatch__imgs img"))
      .map((img) => img.getAttribute("src"))
      .filter(Boolean);

    if (srcs.length) open(title, srcs);
  });
})();


(function enhanceConfiguratorSelects(){
  const selects = document.querySelectorAll('.config-panel select');
  if (!selects.length) return;

  const makeChevron = () => `
    <svg class="cselect__chev" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  const closeAll = (except=null) => {
    document.querySelectorAll('.cselect[data-open="true"]').forEach(cs => {
      if (cs !== except) cs.dataset.open = "false";
    });
  };

  selects.forEach(sel => {
    // jeśli już przerobiony
    if (sel.closest('.cselect')) return;

    const wrap = document.createElement('div');
    wrap.className = 'cselect';
    wrap.dataset.open = "false";

    // przenieś select do wrappera
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cselect__btn';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');

    const value = document.createElement('span');
    value.className = 'cselect__value';

    const list = document.createElement('div');
    list.className = 'cselect__list';
    list.setAttribute('role', 'listbox');

    const build = () => {
      list.innerHTML = '';
      [...sel.options].forEach((opt, idx) => {
        const o = document.createElement('button');
        o.type = 'button';
        o.className = 'cselect__opt';
        o.setAttribute('role', 'option');
        o.dataset.value = opt.value;
        o.dataset.index = String(idx);
        o.textContent = opt.textContent;

        const selected = sel.selectedIndex === idx;
        o.setAttribute('aria-selected', selected ? 'true' : 'false');

        o.addEventListener('click', () => {
          sel.value = opt.value;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          sync();
          wrap.dataset.open = "false";
          btn.setAttribute('aria-expanded', 'false');
        });

        list.appendChild(o);
      });
    };

    const sync = () => {
      const txt = sel.options[sel.selectedIndex]?.textContent ?? '';
      value.textContent = txt;

      list.querySelectorAll('.cselect__opt').forEach(o => {
        o.setAttribute('aria-selected', (o.dataset.index == sel.selectedIndex) ? 'true' : 'false');
      });
    };

    btn.appendChild(value);
    btn.insertAdjacentHTML('beforeend', makeChevron());

    wrap.appendChild(btn);
    wrap.appendChild(list);

    build();
    sync();

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = wrap.dataset.open !== "true";
      closeAll(wrap);
      wrap.dataset.open = willOpen ? "true" : "false";
      btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });

    // gdy zmiana przychodzi z zewnątrz (np. JS liczący cenę)
    sel.addEventListener('change', () => {
      build();
      sync();
    });
  });

  document.addEventListener('click', () => closeAll(null), { passive: true });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll(null);
  });
})();


/* =========================
   COLOR PICKER – use HEX from label to paint tiles
   ========================= */
(function initColorHexTiles(){
  const options = document.querySelectorAll(".color-option");
  if (!options.length) return;

  const normHex = (h) => {
    if (!h) return null;
    h = h.trim();
    if (!h.startsWith("#") && /^[0-9a-fA-F]{6}$/.test(h)) h = "#" + h; // np. 6c7884
    if (/^#[0-9a-fA-F]{3}$/.test(h) || /^#[0-9a-fA-F]{6}$/.test(h)) return h.toLowerCase();
    return null;
  };

  options.forEach((opt) => {
    const name = opt.querySelector(".color-name")?.textContent || "";
    const swatch = opt.querySelector(".color-swatch");
    if (!swatch) return;

    // wyciągnij hexy: #xxxxxx, #xxx oraz 6-znakowe bez #
    const matches = [
      ...name.matchAll(/#[0-9a-fA-F]{3,6}\b/g),
      ...name.matchAll(/\b[0-9a-fA-F]{6}\b/g)
    ].map(m => m[0]);

    const c1 = normHex(matches[0]);
    const c2 = normHex(matches[1]);

    if (c1) swatch.style.setProperty("--c1", c1);
    if (c2) {
      swatch.style.setProperty("--c2", c2);
      swatch.classList.add("is-duo");
    } else {
      swatch.classList.remove("is-duo");
    }

    // ... po ustawieniu --c1 / --c2

// usuń hexy z nazwy (zostaw opis)
const nameEl = opt.querySelector(".color-name");
if (nameEl) {
  nameEl.textContent = nameEl.textContent
    // usuń #xxxxxx i #xxx
    .replace(/#[0-9a-fA-F]{3,6}\b/g, "")
    // usuń hexy bez #
    .replace(/\b[0-9a-fA-F]{6}\b/g, "")
    // usuń “+” jeśli zostało samo
    .replace(/\s*\+\s*/g, " + ")
    // posprzątaj wielokrotne spacje
    .replace(/\s{2,}/g, " ")
    .trim();

  // jeśli zaczyna się od '+' (po wycięciu) – usuń
  nameEl.textContent = nameEl.textContent.replace(/^\+\s*/, "");
}


  });
})();
