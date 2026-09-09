/* ─────────────────────────────────────────
   LAUREN LAMBOY — script.js
   ───────────────────────────────────────── */

// ─── Page Transition ───

window.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(() => {
    document.body.classList.add('loaded');
  });
});

window.addEventListener('pageshow', (e) => {
  if (e.persisted) document.body.classList.add('loaded');
});

document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href]');
  if (!link) return;

  const href = link.getAttribute('href');
  const isInternal = href &&
    !href.startsWith('#') &&
    !href.startsWith('mailto:') &&
    !href.startsWith('tel:') &&
    !href.startsWith('http') &&
    !href.startsWith('//');

  if (isInternal) {
    e.preventDefault();
    document.body.classList.add('leaving');
    setTimeout(() => { window.location.href = href; }, 420);
  }
}, true);

// ─── Custom Cursor — single ring ───

const ring = document.querySelector('.cursor-ring');

if (ring) {
  let mx = -100, my = -100;
  let rx = -100, ry = -100;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
  }, { passive: true });

  const lerp = () => {
    rx += (mx - rx) * 0.2;
    ry += (my - ry) * 0.2;
    ring.style.transform =
      'translate3d(' + rx + 'px, ' + ry + 'px, 0) translate(-50%, -50%)';
    requestAnimationFrame(lerp);
  };
  lerp();

  const hoverTargets = 'a, button, .masonry-item, .video-item, .work-item, .hero-img';
  document.querySelectorAll(hoverTargets).forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('expand'));
    el.addEventListener('mouseleave', () => ring.classList.remove('expand'));
  });
}

// ─── Nav scroll state ───

const nav = document.querySelector('.nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

// ─── Mobile Menu ───

const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (toggle && navLinks) {
  toggle.addEventListener('click', () => {
    const open = toggle.classList.toggle('open');
    navLinks.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      toggle.classList.remove('open');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

// ─── Scroll Reveal ───

if ('IntersectionObserver' in window) {
  const revealEls = document.querySelectorAll(
    '.masonry-item, .work-item, .section-header, ' +
    '.page-meta, .contact-heading, .contact-details, .marquee'
  );

  if (revealEls.length) {
    revealEls.forEach((el, i) => {
      el.classList.add('reveal');

      // Stagger siblings in the same grid
      const parent = el.parentElement;
      if (parent && (parent.classList.contains('work-grid') ||
                     parent.classList.contains('video-grid') ||
                     parent.classList.contains('masonry'))) {
        const siblings = Array.from(parent.children);
        const idx = siblings.indexOf(el);
        if (idx > 0) el.style.transitionDelay = `${idx * 0.07}s`;
      }
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -30px 0px' });

    revealEls.forEach(el => io.observe(el));
  }
}

// ─── Masonry row-span layout ───

(function () {
  const ROW_UNIT = 10;

  function spanItem(item) {
    const img = item.querySelector('img');
    if (!img || !img.naturalWidth || !img.naturalHeight) return;
    const w = item.getBoundingClientRect().width;
    const h = w * (img.naturalHeight / img.naturalWidth) + 10; // +10 for padding-bottom gap
    item.style.gridRowEnd = 'span ' + Math.ceil(h / ROW_UNIT);
  }

  function initMasonry() {
    const grid = document.querySelector('.masonry');
    if (!grid) return;
    grid.querySelectorAll('.masonry-item').forEach(item => {
      const img = item.querySelector('img');
      if (!img) return;
      if (img.complete && img.naturalHeight) {
        spanItem(item);
      } else {
        img.addEventListener('load', () => spanItem(item), { once: true });
      }
    });
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initMasonry, 100);
  }, { passive: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMasonry);
  } else {
    initMasonry();
  }
})();

// ─── Photo grid — warm lazy images well before they enter view ───
// Keeps loading="lazy" in the markup, but pre-fetches each file ~1000px
// ahead of the viewport so it's cache-ready (no visible pop-in) by the
// time the native lazy loader requests it.

(function () {
  if (!('IntersectionObserver' in window)) return;

  const lazyImgs = document.querySelectorAll('.masonry-item img[loading="lazy"]');
  if (!lazyImgs.length) return;

  const warmIO = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      const url = img.getAttribute('src');
      if (url && !img.complete) {
        const pre = new Image();
        pre.decoding = 'async';
        pre.src = url;
      }
      obs.unobserve(img);
    });
  }, { rootMargin: '1000px 0px 1000px 0px' });

  lazyImgs.forEach(img => warmIO.observe(img));
})();

// ─── Video page — click to play/pause ───

document.querySelectorAll('.video-page .video-thumb').forEach(thumb => {
  const video = thumb.querySelector('video');
  const item  = thumb.closest('.video-item');
  if (!video || !item) return;

  thumb.style.cursor = 'pointer';

  thumb.addEventListener('click', () => {
    if (video.paused) {
      video.play();
      item.classList.add('playing');
    } else {
      video.pause();
      item.classList.remove('playing');
    }
  });

  video.addEventListener('ended', () => item.classList.remove('playing'));
});

// ─── Home video reel — play only while in view ───

const reelVideos = document.querySelectorAll('.video-reel-track video');

if (reelVideos.length && 'IntersectionObserver' in window) {
  const playReelVideo = (v) => {
    const p = v.play();
    if (p && typeof p.then === 'function') {
      p.catch(err => {
        console.error(
          '[video-reel] playback failed:',
          v.getAttribute('src'),
          err && err.name ? err.name + ' — ' + err.message : err
        );
      });
    }
  };

  const reelIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const v = entry.target;
      if (entry.isIntersecting) {
        playReelVideo(v);
      } else {
        v.pause();
      }
    });
  }, {
    // Start playback a bit before the clip is actually on screen so it
    // has time to buffer; fire as soon as any part crosses that margin.
    threshold: 0,
    rootMargin: '300px 0px 300px 0px'
  });

  reelVideos.forEach(v => reelIO.observe(v));
}

// ─── Reduced motion ───

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const track = document.querySelector('.marquee-track');
  if (track) track.style.animationPlayState = 'paused';
}

// ─── Lightbox ───

const masonryItems = document.querySelectorAll('.masonry-item');

if (masonryItems.length) {
  const lb     = document.createElement('div');
  lb.className = 'lightbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.innerHTML = `
    <button class="lightbox-close" aria-label="Close">&#215;</button>
    <button class="lightbox-prev"  aria-label="Previous">&#8592;</button>
    <button class="lightbox-next"  aria-label="Next">&#8594;</button>
    <img class="lightbox-img" src="" alt="">
  `;
  document.body.appendChild(lb);

  const lbImg   = lb.querySelector('.lightbox-img');
  const lbClose = lb.querySelector('.lightbox-close');
  const lbPrev  = lb.querySelector('.lightbox-prev');
  const lbNext  = lb.querySelector('.lightbox-next');

  const imgs = Array.from(masonryItems).map(i => i.querySelector('img'));
  let idx = 0;

  const showImg = (n) => {
    idx = (n + imgs.length) % imgs.length;
    lbImg.style.opacity = '0';
    setTimeout(() => {
      lbImg.src     = imgs[idx].src;
      lbImg.alt     = imgs[idx].alt || '';
      lbImg.style.opacity = '1';
    }, 160);
  };

  const openLb = (n) => {
    idx = n;
    lbImg.src   = imgs[idx].src;
    lbImg.alt   = imgs[idx].alt || '';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeLb = () => {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  };

  masonryItems.forEach((item, i) => {
    item.addEventListener('click', () => openLb(i));
  });

  lbClose.addEventListener('click', (e) => { e.stopPropagation(); closeLb(); });
  lbPrev.addEventListener('click',  (e) => { e.stopPropagation(); showImg(idx - 1); });
  lbNext.addEventListener('click',  (e) => { e.stopPropagation(); showImg(idx + 1); });

  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });

  // Swipe navigation
  let touchStartX = 0;
  lb.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 44) dx < 0 ? showImg(idx + 1) : showImg(idx - 1);
  }, { passive: true });

  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape')     closeLb();
    if (e.key === 'ArrowLeft')  showImg(idx - 1);
    if (e.key === 'ArrowRight') showImg(idx + 1);
  });

  if (ring) {
    [lbClose, lbPrev, lbNext, lbImg].forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('expand'));
      el.addEventListener('mouseleave', () => ring.classList.remove('expand'));
    });
  }
}
