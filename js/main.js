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

  // Character cast carousel: arrows rotate the list so it loops at any width
  document.querySelectorAll('[data-cast]').forEach((cast) => {
    const list = cast.querySelector('[data-cast-list]');
    cast.querySelector('[data-cast-next]').addEventListener('click', () => list.append(list.firstElementChild));
    cast.querySelector('[data-cast-prev]').addEventListener('click', () => list.prepend(list.lastElementChild));
  });
})();
