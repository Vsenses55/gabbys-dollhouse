// Gabby's Dollhouse — homepage interactions (no dependencies)
(() => {
  // ---------------------------------------------------------------------------
  // Scroll reveal: sections fade/slide up as they enter the viewport (once each)
  // ---------------------------------------------------------------------------
  const revealEls = document.querySelectorAll('[data-reveal]');
  document.querySelectorAll('[data-reveal-stagger]').forEach((group) =>
    [...group.children].forEach((child, i) => child.style.setProperty('--i', i)));
  if ('IntersectionObserver' in window) {
    const revealIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        revealIO.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => revealIO.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-revealed'));
  }

  const header = document.getElementById('site-header');
  const toggle = header.querySelector('.nav__toggle');

  // Mobile menu toggle
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    header.classList.toggle('is-open', !open);
  });

  // Dropdowns (disclosure pattern)
  const triggers = header.querySelectorAll('button.nav-link[aria-controls]');
  const closeAll = (except) => triggers.forEach((btn) => {
    if (btn === except) return;
    btn.setAttribute('aria-expanded', 'false');
    document.getElementById(btn.getAttribute('aria-controls')).hidden = true;
  });
  triggers.forEach((btn) => {
    const menu = document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', () => {
      // If hover just opened it, a click shouldn't immediately close it
      if (btn.dataset.hoverOpened) { delete btn.dataset.hoverOpened; return; }
      const open = btn.getAttribute('aria-expanded') === 'true';
      closeAll(btn);
      btn.setAttribute('aria-expanded', String(!open));
      menu.hidden = open;
    });
  });
  // Desktop: open on hover too (menu bar visible, precise pointer)
  const desktop = window.matchMedia('(min-width: 1240px) and (hover: hover) and (pointer: fine)');
  triggers.forEach((btn) => {
    const item = btn.parentElement;
    const menu = document.getElementById(btn.getAttribute('aria-controls'));
    let timer;
    item.addEventListener('mouseenter', () => {
      if (!desktop.matches) return;
      clearTimeout(timer);
      closeAll(btn);
      if (btn.getAttribute('aria-expanded') !== 'true') btn.dataset.hoverOpened = '1';
      btn.setAttribute('aria-expanded', 'true');
      menu.hidden = false;
    });
    item.addEventListener('mouseleave', () => {
      if (!desktop.matches) return;
      delete btn.dataset.hoverOpened;
      timer = setTimeout(() => { btn.setAttribute('aria-expanded', 'false'); menu.hidden = true; }, 150);
    });
  });

  document.addEventListener('click', (e) => { if (!header.contains(e.target)) closeAll(); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const openBtn = [...triggers].find((b) => b.getAttribute('aria-expanded') === 'true');
    closeAll();
    if (openBtn) openBtn.focus();
  });

  // ---------------------------------------------------------------------------
  // Character carousel — data-driven: add a character here and it appears in the
  // spotlight rotation and the cast row automatically.
  // ---------------------------------------------------------------------------
  const CHARACTERS = [
    {
      id: 'cakey-cake',
      name: 'Cakey Cake',
      image: 'assets/img/characters/cakey-cake.webp',
      alt: 'Cakey Cat, a smiling kitty cupcake with rainbow sprinkles',
      bio: 'Half kitty, half cupcake, Cakey Cat is the easily-excitable cupcake in the kitchen! Spunky yet sensitive, Cakey can go from super happy to really worried in the blink of an eye. Keep an eye out for his sprinkles, because they’ll let you know exactly what he’s feeling.',
    },
    {
      id: 'mercat',
      name: 'MerCat',
      image: 'assets/img/characters/mercat.webp',
      alt: 'MerCat, a mint-green mermaid kitty with a sparkly scaled tail',
      bio: 'MerCat believes there’s nothing more important than feeling good, looking good, and doing good. As the resident scientist, she can always be found in the bathroom and in the middle of a “spa science” experiment trying to find a cure or solution.',
    },
    {
      id: 'pandy-paws',
      name: 'Pandy Paws',
      image: 'assets/img/characters/pandy-paws.webp',
      alt: 'Pandy Paws, a white and black panda-cat with a striped bag',
      bio: 'Pandy Paws (part panda, part cat of course), is Gabby’s best stuffed animal friend. Always up for adventures, hugs, or snacks, he’s the perfect cat to get into all sorts of mischief with! But watch out...he may just surprise you with a HUG ATTACK! He makes a pretty good snuggle buddy, so don’t worry too much.',
    },
    {
      id: 'baby-box',
      name: 'Baby Box',
      image: 'assets/img/characters/baby-box.webp',
      alt: 'Baby Box, a cardboard box kitty in a yellow heart dress',
      bio: 'Baby Box is inventive, hardworking, and creative. Whenever there’s a problem, this resourceful cat can always be counted on to create or invent just the thing to save the day!',
    },
  ];

  const section = document.getElementById('characters');
  if (section) {
    const stage = section.querySelector('[data-feature]');
    const featureImg = section.querySelector('[data-feature-img]');
    const featureName = section.querySelector('[data-feature-name]');
    const featureBio = section.querySelector('[data-feature-bio]');
    const featureText = section.querySelector('[data-feature-text]');
    // only the words move; the teal panel stays put
    const fadeText = (frames, opts) => Promise.all([featureName, featureBio].map((el) => el.animate(frames, opts).finished));
    const setTextOpacity = (v) => { featureName.style.opacity = v; featureBio.style.opacity = v; };
    const list = section.querySelector('[data-cast-list]');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let current = 0;
    let busy = false;

    // Motion settings
    const TRAVEL = () => Math.min(window.innerWidth * 0.6, 640); // how far characters slide
    const SMALL = 0.35;          // scale while off to the side
    const DRAG_THRESHOLD = 80;   // px of drag needed to switch

    // preload so swaps are instant
    CHARACTERS.forEach((c) => { const i = new Image(); i.src = c.image; });
    featureImg.draggable = false;

    const renderCast = () => {
      // the cast row shows everyone except the featured character, in rotation order
      const others = CHARACTERS.map((_, k) => (current + 1 + k) % CHARACTERS.length).slice(0, -1);
      list.innerHTML = others.map((k) => {
        const c = CHARACTERS[k];
        return `<li class="cast__item"><button type="button" data-index="${k}" aria-label="Show ${c.name}">
          <img src="${c.image}" width="174" height="174" alt="" draggable="false"><span class="t-label c-inverse">${c.name.toUpperCase()}</span>
        </button></li>`;
      }).join('');
    };

    const setContent = (c) => {
      featureImg.src = c.image;
      featureImg.alt = c.alt;
      featureName.textContent = c.name;
      featureBio.textContent = c.bio;
    };

    // Transform for a given horizontal offset: the further from centre, the smaller
    const pose = (x) => {
      const t = Math.min(Math.abs(x) / TRAVEL(), 1);
      const scale = 1 - (1 - SMALL) * t;
      return { transform: `translateX(${x}px) scale(${scale}) rotate(${x / 40}deg)`, opacity: 1 - t * 0.9 };
    };

    // dir = 1: new character enters from the right, old one leaves to the left. dir = -1: the reverse.
    const go = async (index, dir, fromX = 0) => {
      if (busy || index === current) return;
      busy = true;
      const c = CHARACTERS[index];

      if (reduce.matches || !featureImg.animate) {
        current = index; setContent(c); renderCast();
        featureImg.style.transform = ''; setTextOpacity('');
        busy = false;
        return;
      }

      const out = -dir * TRAVEL();
      // From a click the character starts at rest, so ease in. After a drag it's already
      // moving, so keep that momentum (ease out) and only travel the remaining distance.
      const fromDrag = fromX !== 0;
      const remaining = Math.abs(out - fromX) / TRAVEL();
      await Promise.all([
        featureImg.animate([pose(fromX), pose(out)], fromDrag
          ? { duration: Math.max(140, 260 * remaining), easing: 'cubic-bezier(.25,.6,.45,1)', fill: 'forwards' }
          : { duration: 280, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }).finished,
        fadeText(
          [{ opacity: featureName.style.opacity || 1, transform: 'translateX(0)' }, { opacity: 0, transform: `translateX(${-dir * 40}px)` }],
          { duration: 220, easing: 'ease-in', fill: 'forwards' }),
      ]);
      featureImg.style.transform = ''; featureImg.style.opacity = ''; setTextOpacity('');

      current = index;
      setContent(c);
      renderCast();

      const enter = dir * TRAVEL();
      featureImg.animate([pose(enter), pose(0)], { duration: 560, easing: 'cubic-bezier(.22,1.2,.36,1)', fill: 'forwards' });
      await fadeText(
        [{ opacity: 0, transform: `translateX(${dir * 40}px)` }, { opacity: 1, transform: 'translateX(0)' }],
        { duration: 380, delay: 120, easing: 'ease-out', fill: 'forwards' });
      busy = false;
    };

    const step = (dir) => go((current + dir + CHARACTERS.length) % CHARACTERS.length, dir);
    section.querySelector('[data-cast-next]').addEventListener('click', () => step(1));
    section.querySelector('[data-cast-prev]').addEventListener('click', () => step(-1));
    list.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-index]');
      if (btn) go(Number(btn.dataset.index), 1);
    });
    section.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    });

    // ---- Drag / swipe the featured character ----
    let startX = 0, dx = 0, dragging = false;
    stage.addEventListener('pointerdown', (e) => {
      if (busy || e.button !== 0) return;
      dragging = true; startX = e.clientX; dx = 0;
      featureImg.getAnimations().forEach((a) => a.cancel());
      [featureName, featureBio].forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
      stage.setPointerCapture(e.pointerId);
      stage.classList.add('is-dragging');
    });
    stage.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      dx = e.clientX - startX;
      const p = pose(dx * 0.9);
      featureImg.style.transform = p.transform;
      featureImg.style.opacity = p.opacity;
      setTextOpacity(String(Math.max(1 - Math.abs(dx) / 300, 0.2)));
    });
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove('is-dragging');
      const fromX = dx * 0.9;
      // inline transform/opacity stay in place until the next animation takes over (no flash)
      if (Math.abs(dx) > DRAG_THRESHOLD) {
        const dir = dx < 0 ? 1 : -1; // drag left → next character comes from the right
        go((current + dir + CHARACTERS.length) % CHARACTERS.length, dir, fromX);
      } else {
        featureImg.animate([pose(fromX), pose(0)], { duration: 300, easing: 'cubic-bezier(.22,1.2,.36,1)' });
        featureImg.style.transform = '';
        featureImg.style.opacity = '';
        setTextOpacity('');
      }
    };
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);

    // Keep the profile panel at the height of the longest bio so the page doesn't jump
    const lockHeight = () => {
      featureText.style.minHeight = '';
      const original = [featureName.textContent, featureBio.textContent];
      let max = 0;
      CHARACTERS.forEach((c) => {
        featureName.textContent = c.name;
        featureBio.textContent = c.bio;
        max = Math.max(max, featureText.offsetHeight);
      });
      [featureName.textContent, featureBio.textContent] = original;
      featureText.style.minHeight = `${max}px`;
    };
    lockHeight();
    document.fonts?.ready.then(lockHeight);
    window.addEventListener('resize', lockHeight);

    // ---- Auto-cycle: next character every 5s. Pauses while hovered, focused, dragged,
    // off-screen or when the tab is hidden; a manual change restarts the timer. ----
    const AUTO_MS = 5000;
    let autoTimer = 0, inView = false, hovering = false, focused = false;
    const canAuto = () => inView && !hovering && !focused && !dragging && !document.hidden && !reduce.matches;
    const schedule = () => {
      clearTimeout(autoTimer);
      if (canAuto()) autoTimer = setTimeout(() => { if (canAuto() && !busy) step(1); schedule(); }, AUTO_MS);
    };
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; schedule(); }, { threshold: 0.4 }).observe(stage);
    [stage, section.querySelector('[data-cast]')].forEach((el) => {
      el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { hovering = true; schedule(); } });
      el.addEventListener('pointerleave', () => { hovering = false; schedule(); });
    });
    section.addEventListener('focusin', () => { focused = true; schedule(); });
    section.addEventListener('focusout', () => { focused = false; schedule(); });
    section.addEventListener('click', schedule);
    stage.addEventListener('pointerup', schedule);
    document.addEventListener('visibilitychange', schedule);

    renderCast();
  }
})();
