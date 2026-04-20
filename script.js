const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const siteHeader = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const navLinks = Array.from(document.querySelectorAll(".site-nav a"));
const sections = Array.from(document.querySelectorAll("main section[id]"));
const revealTargets = Array.from(document.querySelectorAll(".reveal, .rq-card"));
const getHeaderOffset = () => siteHeader?.offsetHeight ?? 0;
const syncHeaderHeight = () => {
  document.documentElement.style.setProperty("--site-header-height", `${getHeaderOffset()}px`);
};

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
    const href = link.getAttribute("href") ?? "";
    const isActive = href.startsWith("#") && href === `#${activeId}`;
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

document.querySelectorAll("[data-gallery]").forEach((gallery) => {
  const track = gallery.querySelector(".gallery-track");
  const slides = Array.from(gallery.querySelectorAll(".gallery-slide"));
  const dots = Array.from(gallery.querySelectorAll("[data-gallery-dot]"));
  const prevButton = gallery.querySelector("[data-gallery-prev]");
  const nextButton = gallery.querySelector("[data-gallery-next]");
  const counter = gallery.querySelector("[data-gallery-counter]");

  if (!track || slides.length === 0) return;

  let currentIndex = 0;
  let autoplayId = 0;

  const render = (index) => {
    currentIndex = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    slides.forEach((slide, slideIndex) => {
      slide.setAttribute("aria-hidden", String(slideIndex !== currentIndex));
    });

    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === currentIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-pressed", String(isActive));
    });

    if (counter) {
      const currentLabel = String(currentIndex + 1).padStart(2, "0");
      const totalLabel = String(slides.length).padStart(2, "0");
      counter.textContent = `${currentLabel} / ${totalLabel}`;
    }
  };

  const stopAutoplay = () => {
    if (!autoplayId) return;
    window.clearInterval(autoplayId);
    autoplayId = 0;
  };

  const startAutoplay = () => {
    if (prefersReducedMotion || slides.length < 2) return;
    stopAutoplay();
    autoplayId = window.setInterval(() => {
      render(currentIndex + 1);
    }, 5200);
  };

  prevButton?.addEventListener("click", () => {
    render(currentIndex - 1);
    startAutoplay();
  });

  nextButton?.addEventListener("click", () => {
    render(currentIndex + 1);
    startAutoplay();
  });

  dots.forEach((dot, dotIndex) => {
    dot.addEventListener("click", () => {
      render(dotIndex);
      startAutoplay();
    });
  });

  gallery.addEventListener("mouseenter", stopAutoplay);
  gallery.addEventListener("mouseleave", startAutoplay);
  gallery.addEventListener("focusin", stopAutoplay);
  gallery.addEventListener("focusout", (event) => {
    if (event.relatedTarget && gallery.contains(event.relatedTarget)) return;
    startAutoplay();
  });

  render(0);
  startAutoplay();
});
