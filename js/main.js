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
      const open = btn.getAttribute('aria-expanded') === 'true';
      closeAll(btn);
      btn.setAttribute('aria-expanded', String(!open));
      menu.hidden = open;
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
