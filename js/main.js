// Gabby's Dollhouse — homepage interactions (no dependencies)
(() => {
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
    const featureImg = section.querySelector('[data-feature-img]');
    const featureName = section.querySelector('[data-feature-name]');
    const featureBio = section.querySelector('[data-feature-bio]');
    const featureText = section.querySelector('[data-feature-text]');
    const list = section.querySelector('[data-cast-list]');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let current = 0;
    let busy = false;

    // preload so swaps are instant
    CHARACTERS.forEach((c) => { const i = new Image(); i.src = c.image; });

    const renderCast = () => {
      // the cast row shows everyone except the featured character, in rotation order
      const others = CHARACTERS.map((_, k) => (current + 1 + k) % CHARACTERS.length).slice(0, -1);
      list.innerHTML = others.map((k) => {
        const c = CHARACTERS[k];
        return `<li class="cast__item"><button type="button" data-index="${k}" aria-label="Show ${c.name}">
          <img src="${c.image}" width="174" height="174" alt=""><span class="t-label c-inverse">${c.name.toUpperCase()}</span>
        </button></li>`;
      }).join('');
    };

    const show = async (index) => {
      if (busy || index === current) return;
      busy = true;
      const c = CHARACTERS[index];
      const animate = !reduce.matches && featureImg.animate;
      if (animate) {
        await Promise.all([
          featureImg.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.85) translateY(20px)' }], { duration: 180, easing: 'ease-in', fill: 'forwards' }).finished,
          featureText.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' }).finished,
        ]);
      }
      current = index;
      featureImg.src = c.image;
      featureImg.alt = c.alt;
      featureName.textContent = c.name;
      featureBio.textContent = c.bio;
      renderCast();
      if (animate) {
        featureImg.animate([{ opacity: 0, transform: 'scale(0.85) translateY(20px)' }, { opacity: 1, transform: 'scale(1.04)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1.2)', fill: 'forwards' });
        featureText.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, fill: 'forwards' });
      }
      busy = false;
    };

    const step = (dir) => show((current + dir + CHARACTERS.length) % CHARACTERS.length);
    section.querySelector('[data-cast-next]').addEventListener('click', () => step(1));
    section.querySelector('[data-cast-prev]').addEventListener('click', () => step(-1));
    list.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-index]');
      if (btn) show(Number(btn.dataset.index));
    });

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

    renderCast();
  }
})();
