(function () {
  const card      = document.getElementById('card');
  const cardPages = document.getElementById('cardPages');
  const tabs      = document.querySelectorAll('.idx-tab');
  const pages     = document.querySelectorAll('.page');

  const ORDER = ['intro', 'about', 'projects', 'contact'];
  let current = 0;
  let busy = false;

  function updateTabs(name) {
    tabs.forEach(t => {
      const on = t.dataset.target === name;
      t.classList.toggle('active', on);
      t.setAttribute('aria-pressed', String(on));
    });
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
      /* 다음 장은 그대로 아래에 보이고 — 현재 장만 접혀서 걷힘 */
      newPage.classList.remove('hidden');
      newPage.style.zIndex = '1';

      oldPage.style.zIndex = '2';
      oldPage.classList.add('exiting');
      oldPage.addEventListener('animationend', () => {
        updateTabs(targetName);
        card.className = 'card section-' + targetName;
        oldPage.classList.add('hidden');
        oldPage.classList.remove('exiting');
        oldPage.style.zIndex = '';
        newPage.style.zIndex = '';
        busy = false;
      }, { once: true });

    } else {
      /* 뒤로: 새 페이지가 위에서 내려와 덮으므로 색은 애니메이션 시작 전에 바로 변경 */
      updateTabs(targetName);
      card.className = 'card section-' + targetName;

      oldPage.style.zIndex = '1';
      newPage.style.zIndex = '3';
      newPage.classList.remove('hidden');
      newPage.classList.add('entering');
      newPage.addEventListener('animationend', () => {
        newPage.classList.remove('entering');
        newPage.style.zIndex = '';
        oldPage.classList.add('hidden');
        oldPage.style.zIndex = '';
        busy = false;
      }, { once: true });
    }
  }

  cardPages.addEventListener('click', e => {
    if (e.target.closest('a, button')) return;
    if (window.innerWidth <= 600) return;
    switchTab(ORDER[(current + 1) % ORDER.length], 'forward');
  });

  tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.target));
  });
})();
