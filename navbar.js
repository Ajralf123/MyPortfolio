document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.nav');
  const indicator = document.querySelector('.indicator');
  const links = Array.from(document.querySelectorAll('.nav-link'));
  const sections = links
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  // Move the sliding pill to sit behind a given link
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

  // Click: smooth scroll + immediate indicator move
  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      setActive(link);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Scroll: highlight whichever section is currently in view
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

  // Keep the pill aligned on resize
  window.addEventListener('resize', () => {
    const current = links.find((l) => l.classList.contains('active')) || links[0];
    moveIndicatorTo(current);
  });

  // Initial placement (wait a tick for fonts/layout to settle)
  requestAnimationFrame(() => moveIndicatorTo(links[0]));

  // Animate skill bars once they scroll into view
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

  // Generic scroll-reveal for elements marked .reveal
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

  // Lightbox: click a project image to pop it up full-size
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
});

document.getElementById('copyEmailBtn').addEventListener('click', async () => {
  const btn = document.getElementById('copyEmailBtn');
  try {
    await navigator.clipboard.writeText('ajgupit24@gmail.com');
    const original = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => (btn.textContent = original), 1800);
  } catch (err) {
    // fallback for older browsers
    alert('ajgupit24@gmail.com');
  }
});