const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const siteHeader = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const navLinks = Array.from(document.querySelectorAll(".site-nav a"));
const heroSection = document.getElementById("hero-section");
const overviewSection = document.getElementById("overview");
const heroScrollCue = document.querySelector(".hero-scroll-cue");
const sections = Array.from(document.querySelectorAll("main section[id]"));
const revealTargets = Array.from(document.querySelectorAll(".reveal, .rq-card"));
const getHeaderOffset = () => siteHeader?.offsetHeight ?? 0;
const syncHeaderHeight = () => {
  document.documentElement.style.setProperty("--site-header-height", `${getHeaderOffset()}px`);
};
let heroSnapLock = 0;

/* ===== Hero planning-graph animated background ===== */
(() => {
  const canvas = document.getElementById("hero-mesh");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let W, H, dpr;

  /* ---- color palette ---- */
  const TEAL      = [13, 148, 136];   // #0d9488
  const NAVY      = [22, 50, 79];     // #16324f
  const AMBER     = [245, 158, 11];   // #f59e0b

  /* ---- floating graph nodes ---- */
  const NODE_COUNT = 40;
  const CONNECT_DIST = 220;
  let nodes = [];

  /* ---- tiny particles ---- */
  const PARTICLE_COUNT = 55;
  let particles = [];

  /* ---- grid settings ---- */
  const GRID_SPACING = 42;
  let gridOffset = 0;

  const rand = (a, b) => a + Math.random() * (b - a);

  const initNodes = () => {
    nodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      const isAccent = i < 6;
      const col = isAccent ? AMBER : (i % 3 === 0 ? TEAL : NAVY);
      nodes.push({
        x: rand(0, W), y: rand(0, H),
        vx: rand(-0.3, 0.3), vy: rand(-0.3, 0.3),
        r: isAccent ? rand(3.5, 5.5) : rand(2.2, 4),
        col,
        alpha: isAccent ? 0.62 : rand(0.2, 0.42),
        pulse: rand(0, Math.PI * 2),
      });
    }
  };

  const initParticles = () => {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: rand(0, W), y: rand(0, H),
        vy: rand(-0.3, -0.8),
        r: rand(1, 2),
        alpha: rand(0.07, 0.16),
        blur: rand(6, 12),
        life: rand(0, 1),
      });
    }
  };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.parentElement.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initNodes();
    initParticles();
  };

  /* ---- draw loop ---- */
  const draw = (t) => {
    ctx.clearRect(0, 0, W, H);

    /* 1) animated dot grid */
    gridOffset = (t * 0.008) % GRID_SPACING;
    ctx.fillStyle = `rgba(${NAVY[0]},${NAVY[1]},${NAVY[2]}, 0.055)`;
    for (let x = -GRID_SPACING + gridOffset; x < W + GRID_SPACING; x += GRID_SPACING) {
      for (let y = -GRID_SPACING + gridOffset * 0.6; y < H + GRID_SPACING; y += GRID_SPACING) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    /* 2) move & wrap nodes */
    nodes.forEach(n => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < -20) n.x = W + 20;
      if (n.x > W + 20) n.x = -20;
      if (n.y < -20) n.y = H + 20;
      if (n.y > H + 20) n.y = -20;
      n.pulse += 0.012;
    });

    /* 3) draw connecting lines between nearby nodes */
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT_DIST) {
          const alpha = (1 - dist / CONNECT_DIST) * 0.18;
          ctx.strokeStyle = `rgba(${TEAL[0]},${TEAL[1]},${TEAL[2]}, ${alpha.toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    /* 4) draw nodes */
    nodes.forEach(n => {
      const pulseFactor = 1 + Math.sin(n.pulse) * 0.25;
      const r = n.r * pulseFactor;
      const a = n.alpha * (0.8 + Math.sin(n.pulse) * 0.2);

      // glow
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 4);
      grad.addColorStop(0, `rgba(${n.col[0]},${n.col[1]},${n.col[2]}, ${(a * 0.3).toFixed(3)})`);
      grad.addColorStop(1, `rgba(${n.col[0]},${n.col[1]},${n.col[2]}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r * 4, 0, Math.PI * 2);
      ctx.fill();

      // core dot
      ctx.fillStyle = `rgba(${n.col[0]},${n.col[1]},${n.col[2]}, ${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fill();
    });

    /* 5) draw rising particles */
    particles.forEach(p => {
      p.y += p.vy;
      p.life += 0.003;
      if (p.y < -10 || p.life > 1) {
        p.x = rand(0, W);
        p.y = H + 10;
        p.life = 0;
      }
      const fadeAlpha = p.alpha * Math.sin(p.life * Math.PI);
      ctx.shadowColor = `rgba(${TEAL[0]},${TEAL[1]},${TEAL[2]}, ${(fadeAlpha * 1.1).toFixed(3)})`;
      ctx.shadowBlur = p.blur;
      ctx.fillStyle = `rgba(${TEAL[0]},${TEAL[1]},${TEAL[2]}, ${(fadeAlpha * 0.72).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    if (!prefersReducedMotion) requestAnimationFrame(draw);
  };

  resize();
  window.addEventListener("resize", resize);

  if (prefersReducedMotion) {
    draw(0);
  } else {
    requestAnimationFrame(draw);
  }
})();

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    syncHeaderHeight();
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      syncHeaderHeight();
    });
  });
}

const setActiveSection = () => {
  let activeId = sections[0]?.id ?? "";
  const activationOffset = getHeaderOffset() + 48;

  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= activationOffset) {
      activeId = section.id;
    }
  });

  navLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${activeId}`;
    link.classList.toggle("is-active", isActive);
  });
};

const updateViewportEffects = () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? scrollTop / scrollableHeight : 0;

  document.documentElement.style.setProperty("--scroll-progress", progress.toFixed(4));
  siteHeader?.classList.toggle("is-scrolled", scrollTop > 18);
};

const handleScroll = () => {
  setActiveSection();
  updateViewportEffects();
};

const canSnapFromHero = () => {
  if (!heroSection || !overviewSection) return false;

  const heroRect = heroSection.getBoundingClientRect();
  const overviewRect = overviewSection.getBoundingClientRect();
  const headerOffset = getHeaderOffset();

  return (
    overviewRect.top > headerOffset + 24 &&
    heroRect.top <= headerOffset + 24 &&
    heroRect.bottom > window.innerHeight * 0.45
  );
};

const snapToOverview = () => {
  if (!overviewSection || heroSnapLock) return false;
  if (!canSnapFromHero()) return false;

  heroSnapLock = window.setTimeout(() => {
    heroSnapLock = 0;
  }, prefersReducedMotion ? 50 : 950);

  overviewSection.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "start",
  });

  return true;
};

syncHeaderHeight();
handleScroll();
window.addEventListener("resize", () => {
  syncHeaderHeight();
  handleScroll();
}, { passive: true });
window.addEventListener("scroll", handleScroll, { passive: true });

if ("ResizeObserver" in window && siteHeader) {
  const headerObserver = new ResizeObserver(() => {
    syncHeaderHeight();
    setActiveSection();
    updateViewportEffects();
  });

  headerObserver.observe(siteHeader);
}

if (heroScrollCue) {
  heroScrollCue.addEventListener("click", () => {
    snapToOverview();
  });
}

window.addEventListener("wheel", (event) => {
  if (event.deltaY <= 12) return;
  if (!canSnapFromHero()) return;

  event.preventDefault();
  snapToOverview();
}, { passive: false });

if (prefersReducedMotion || !("IntersectionObserver" in window)) {
  revealTargets.forEach((element) => element.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
  );

  revealTargets.forEach((element) => revealObserver.observe(element));
}
