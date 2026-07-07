document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.nav');
  const indicator = document.querySelector('.indicator');
  const links = Array.from(document.querySelectorAll('.nav-link'));
  const sections = links
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  // --- Sliding pill (desktop) ---
  function moveIndicatorTo(link) {
    if (!link || !indicator) return;
    const navRect = nav.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    indicator.style.width = `${linkRect.width}px`;
    indicator.style.left = `${linkRect.left - navRect.left}px`;
  }

  function setActive(link) {
    links.forEach((l) => l.classList.remove('active'));
    link.classList.add('active');
    moveIndicatorTo(link);
  }

  // Shared navigation used by both the desktop pill links and the mobile fan links
  function goToSection(href) {
    const target = document.querySelector(href);
    const match = links.find((l) => l.getAttribute('href') === href);
    if (match) setActive(match);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      goToSection(link.getAttribute('href'));
    });
  });

  // --- Scroll: highlight whichever section is currently in view ---
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = `#${entry.target.id}`;
          const match = links.find((l) => l.getAttribute('href') === id);
          if (match) setActive(match);
        }
      });
    },
    { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
  );
  sections.forEach((s) => observer.observe(s));

  window.addEventListener('resize', () => {
    const current = links.find((l) => l.classList.contains('active')) || links[0];
    moveIndicatorTo(current);
  });

  // Initial placement (wait a tick for fonts/layout to settle)
  requestAnimationFrame(() => moveIndicatorTo(links[0]));

  // --- Animate skill bars once they scroll into view ---
  const skillFills = document.querySelectorAll('.skill-fill');
  const skillObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.width = `${entry.target.dataset.pct}%`;
          skillObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );
  skillFills.forEach((el) => skillObserver.observe(el));

  // --- Generic scroll-reveal for elements marked .reveal ---
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

  // --- Lightbox: click a project image to pop it up full-size ---
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');

  function openLightbox(src, alt) {
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.demo-image img').forEach((img) => {
    img.addEventListener('click', () => openLightbox(img.src, img.alt));
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  // ================= DRAGGABLE FAN NAV (mobile only) =================
  const fanRoot   = document.getElementById('fanRoot');
  const fanToggle = document.getElementById('fanToggle');
  const fanScrim  = document.getElementById('fanScrim');
  const fanMenu   = document.getElementById('fanMenu');
  const fanItems  = fanMenu.querySelectorAll('a');

  const MARGIN = 12;
  let dragging = false;
  let moved = false;
  let startX = 0, startY = 0, startLeft = 0, startTop = 0;

  function setFanOpen(isOpen) {
    fanRoot.classList.toggle('open', isOpen);
    fanToggle.setAttribute('aria-expanded', String(isOpen));
  }

  function setTogglePosition(left, top) {
    const w = fanToggle.offsetWidth || 58;
    const h = fanToggle.offsetHeight || 58;
    left = Math.min(Math.max(MARGIN, left), window.innerWidth - w - MARGIN);
    top  = Math.min(Math.max(MARGIN, top), window.innerHeight - h - MARGIN);
    [fanToggle, fanMenu].forEach((el) => {
      el.style.left = left + 'px';
      el.style.top = top + 'px';
      el.style.right = 'auto';
      el.style.bottom = 'auto';
    });
  }

  function initFanPosition() {
    const w = fanToggle.offsetWidth || 58;
    const h = fanToggle.offsetHeight || 58;
    setTogglePosition(window.innerWidth - w - 24, window.innerHeight - h - 24);
  }

  // Works out which quadrant has room, then spreads the links across that
  // 90° quadrant — works for any number of fan items, not just 4.
  function applyFanLayout() {
    const rect = fanToggle.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const vertical   = cy > window.innerHeight / 2 ? 'up' : 'down';
    const horizontal = cx > window.innerWidth  / 2 ? 'left' : 'right';

    let start, end;
    if (vertical === 'up'   && horizontal === 'left')  { start = 180; end = 90; }
    if (vertical === 'up'   && horizontal === 'right') { start = 0;   end = 90; }
    if (vertical === 'down' && horizontal === 'left')  { start = 180; end = 270; }
    if (vertical === 'down' && horizontal === 'right') { start = 270; end = 360; }

    const zeroAngle = vertical === 'up' ? 90 : 270;
    const tiltSign  = horizontal === 'left' ? -1 : 1;
    const radius = 140;
    const originX = horizontal === 'left' ? 'right' : 'left';
    const n = fanItems.length;

    fanItems.forEach((a, i) => {
      const angle = n === 1 ? start : start + (i * (end - start)) / (n - 1);
      const rad = angle * Math.PI / 180;
      const x = radius * Math.cos(rad);
      const y = -radius * Math.sin(rad);
      const rot = (angle - zeroAngle) * tiltSign * (22 / 90);
      a.style.setProperty('--tx', x.toFixed(1) + 'px');
      a.style.setProperty('--ty', y.toFixed(1) + 'px');
      a.style.setProperty('--rot', rot.toFixed(1) + 'deg');
      a.style.transformOrigin = originX + ' center';
    });
  }

  function beginDrag(clientX, clientY) {
    dragging = true;
    moved = false;
    const rect = fanToggle.getBoundingClientRect();
    startX = clientX; startY = clientY;
    startLeft = rect.left; startTop = rect.top;
    fanRoot.classList.add('dragging');
  }

  function duringDrag(clientX, clientY) {
    if (!dragging) return;
    const dx = clientX - startX, dy = clientY - startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
    setTogglePosition(startLeft + dx, startTop + dy);
  }

  function endDrag() {
    dragging = false;
    fanRoot.classList.remove('dragging');
  }

  fanToggle.addEventListener('pointerdown', (e) => {
    fanToggle.setPointerCapture(e.pointerId);
    if (fanRoot.classList.contains('open')) {
      dragging = false;
      moved = false;
    } else {
      beginDrag(e.clientX, e.clientY);
    }
  });

  fanToggle.addEventListener('pointermove', (e) => {
    duringDrag(e.clientX, e.clientY);
  });

  fanToggle.addEventListener('pointerup', () => {
    if (dragging) {
      endDrag();
      if (!moved) {
        applyFanLayout();
        setFanOpen(true);
      }
    } else if (fanRoot.classList.contains('open')) {
      setFanOpen(false);
    }
  });

  fanScrim.addEventListener('click', () => setFanOpen(false));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setFanOpen(false);
  });

  fanItems.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      goToSection(link.getAttribute('href'));
      setFanOpen(false);
    });
  });

  window.addEventListener('resize', () => {
    const rect = fanToggle.getBoundingClientRect();
    setTogglePosition(rect.left, rect.top);
  });

  window.addEventListener('load', initFanPosition);
  initFanPosition();
});

document.getElementById('copyEmailBtn').addEventListener('click', async () => {
  const btn = document.getElementById('copyEmailBtn');
  try {
    await navigator.clipboard.writeText('ajgupit24@gmail.com');
    const original = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => (btn.textContent = original), 1800);
  } catch (err) {
    alert('ajgupit24@gmail.com');
  }
});