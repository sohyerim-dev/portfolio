(function () {
  const card      = document.getElementById('card');
  const cardPages = document.getElementById('cardPages');
  const tabs      = document.querySelectorAll('.idx-tab');
  const pages     = document.querySelectorAll('.page');

  const ORDER = ['intro', 'about', 'projects', 'contact', 'outro'];
  let current = 0;
  let busy = false;

  function updateTabs(name) {
    const effective = name === 'outro' ? 'contact' : name;
    tabs.forEach(t => {
      const on = t.dataset.target === effective;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', String(on));
    });
  }

  function showPage(page) {
    page.classList.remove('hidden');
    page.removeAttribute('aria-hidden');
    page.setAttribute('tabindex', '0');
  }

  function hidePage(page) {
    page.classList.add('hidden');
    page.setAttribute('aria-hidden', 'true');
    page.setAttribute('tabindex', '-1');
  }

  function switchTab(targetName, forcedDir) {
    const nextIndex = ORDER.indexOf(targetName);
    if (nextIndex === current || busy) return;

    busy = true;
    const dir = forcedDir ?? (nextIndex > current ? 'forward' : 'backward');

    const oldPage = document.querySelector(`.page[data-page="${ORDER[current]}"]`);
    const newPage = document.querySelector(`.page[data-page="${targetName}"]`);

    cardPages.dataset.dir = dir;
    current = nextIndex;

    if (dir === 'forward') {
      showPage(newPage);
      newPage.style.zIndex = '1';

      oldPage.style.zIndex = '2';
      oldPage.classList.add('exiting');
      oldPage.addEventListener('animationend', () => {
        updateTabs(targetName);
        card.className = 'card section-' + targetName;
        hidePage(oldPage);
        oldPage.classList.remove('exiting');
        oldPage.style.zIndex = '';
        newPage.style.zIndex = '';
        busy = false;
      }, { once: true });

    } else {
      updateTabs(targetName);
      card.className = 'card section-' + targetName;

      oldPage.style.zIndex = '1';
      newPage.style.zIndex = '3';
      showPage(newPage);
      newPage.classList.add('entering');
      newPage.addEventListener('animationend', () => {
        newPage.classList.remove('entering');
        newPage.style.zIndex = '';
        hidePage(oldPage);
        oldPage.style.zIndex = '';
        busy = false;
      }, { once: true });
    }
  }

  cardPages.addEventListener('click', e => {
    if (e.target.closest('a, button')) return;
    if (window.innerWidth <= 600) return;
    if (current >= ORDER.length - 1) return;
    switchTab(ORDER[current + 1], 'forward');
  });

  tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.target));
  });

  /* 탭 목록 내 화살표 키 내비게이션 (ARIA tablist 패턴) */
  tabs.forEach((tab, i) => {
    tab.addEventListener('keydown', e => {
      let next = -1;
      if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft')  next = (i - 1 + tabs.length) % tabs.length;
      if (next === -1) return;
      e.preventDefault();
      tabs[next].focus();
      switchTab(tabs[next].dataset.target);
    });
  });
})();
