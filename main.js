const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    const el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  });
});

// Active nav
const pills = Array.from(document.querySelectorAll(".pill"));
const targets = pills
  .map(p => document.querySelector(p.getAttribute("href")))
  .filter(Boolean);

function setActiveNav() {
  const y = window.scrollY + 140;
  let idx = 0;
  for (let i = 0; i < targets.length; i++) {
    if (targets[i].offsetTop <= y) idx = i;
  }
  pills.forEach(p => p.classList.remove("active"));
  if (pills[idx]) pills[idx].classList.add("active");
}
window.addEventListener("scroll", setActiveNav, { passive: true });
setActiveNav();

// Reveal
const revealEls = document.querySelectorAll(".reveal");
const io = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if (en.isIntersecting) en.target.classList.add("in");
  });
}, { threshold: 0.12 });
revealEls.forEach(el => io.observe(el));

// Theme toggle (default dark)
const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle");

function applyTheme(t) {
  root.setAttribute("data-theme", t);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", t === "dark" ? "#0b1020" : "#f7f7fb");
}

const savedTheme = localStorage.getItem("vp_theme");
if (savedTheme === "light" || savedTheme === "dark") applyTheme(savedTheme);
else applyTheme("light");

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const cur = root.getAttribute("data-theme") || "light";
    const next = cur === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem("vp_theme", next);
  });
}

// Carousel
const track = document.getElementById("track");
const slides = track ? Array.from(track.children) : [];
const dotsWrap = document.getElementById("dots");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

let index = 0;

slides.forEach(slide => {
  const bg = slide.getAttribute("data-bg");
  if (bg) slide.style.backgroundImage = `url("${bg}")`;
});

const dots = slides.map((_, i) => {
  const d = document.createElement("button");
  d.className = "dot" + (i === 0 ? " active" : "");
  d.type = "button";
  d.setAttribute("aria-label", `Go to slide ${i + 1}`);
  d.addEventListener("click", () => goTo(i));
  dotsWrap && dotsWrap.appendChild(d);
  return d;
});

function goTo(i) {
  if (!track || slides.length === 0) return;
  index = (i + slides.length) % slides.length;
  track.style.transform = `translateX(${-index * 100}%)`;
  dots.forEach(d => d.classList.remove("active"));
  if (dots[index]) dots[index].classList.add("active");
}

if (prevBtn) prevBtn.addEventListener("click", () => goTo(index - 1));
if (nextBtn) nextBtn.addEventListener("click", () => goTo(index + 1));

let timer = null;
const carousel = document.querySelector(".carousel");

function startAuto() {
  if (reduceMotion || slides.length <= 1) return;
  stopAuto();
  timer = setInterval(() => goTo(index + 1), 5200);
}
function stopAuto() {
  if (timer) clearInterval(timer);
  timer = null;
}

if (carousel) {
  carousel.addEventListener("mouseenter", stopAuto);
  carousel.addEventListener("mouseleave", startAuto);

  let startX = 0, dx = 0, down = false;

  carousel.addEventListener("pointerdown", (e) => {
    down = true;
    startX = e.clientX;
    dx = 0;
    stopAuto();
    carousel.setPointerCapture(e.pointerId);
  });

  carousel.addEventListener("pointermove", (e) => {
    if (!down) return;
    dx = e.clientX - startX;
  });

  carousel.addEventListener("pointerup", () => {
    if (!down) return;
    down = false;
    if (Math.abs(dx) > 40) goTo(index + (dx < 0 ? 1 : -1));
    startAuto();
  });
}

startAuto();

// Copy citation line
const citeBtn = document.getElementById("copyCiteBtn");
if (citeBtn) {
  citeBtn.addEventListener("click", async () => {
    const text = `Pallagani, V. (2026). Generalized Planning Using Language Models and its Applications. PhD Dissertation Proposal, University of South Carolina.`;
    try {
      await navigator.clipboard.writeText(text);
      citeBtn.textContent = "Copied ✓";
      setTimeout(() => (citeBtn.textContent = "Copy citation line"), 1300);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      citeBtn.textContent = "Copied ✓";
      setTimeout(() => (citeBtn.textContent = "Copy citation line"), 1300);
    }
  });
}

// Footer year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();
