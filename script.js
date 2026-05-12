(function () {
  // DOM 순서: [contact(0), projects(1), about(2), intro(3)]
  const cards = Array.from(document.querySelectorAll('.card'));
  let current = cards.length - 1;
  let busy = false;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function getPushedTransform(depth) {
    if (window.innerWidth <= 600) {
      // 모바일: 작게만 보이게 (클릭 가능한 정도)
      const peek = Math.max(28, 48 - (depth - 1) * 10);
      return `translateX(calc(100% - ${peek}px))`;
    }
    const peek = Math.max(44, 96 - (depth - 1) * 24);
    const yOffset = -6 - (depth - 1) * 3;
    return `translate(calc(100% - ${peek}px), ${yOffset}%)`;
  }

  function render(animate) {
    cards.forEach((card, i) => {
      card.style.transition = animate ? '' : 'none';

      if (i <= current) {
        card.style.zIndex = i < current ? i + 1 : 10;
        card.style.transform = '';
        // 뒤에 깔린 카드: 바디 클릭 비활성
        if (i < current) {
          card.classList.add('behind');
          card.classList.remove('pushed-deep');
        } else {
          card.classList.remove('behind', 'pushed-deep');
        }
      } else {
        const depth = i - current;
        card.style.zIndex = 20 - depth;
        card.style.transform = reducedMotion ? 'translateX(110%)' : getPushedTransform(depth);
        card.classList.remove('behind');
        // depth > 1이면 클릭 비활성 (LIFO: 가장 최근 것만 복귀 가능)
        card.classList.toggle('pushed-deep', depth > 1);
      }
    });
  }

  // 탭 클릭 시 targetIdx까지 cascade로 치움
  function sweepTo(targetIdx) {
    const total = current - targetIdx;
    if (total <= 0 || busy) return;
    busy = true;
    const STAGGER = 110;
    let swept = 0;

    function doNext() {
      current--;
      render(true);
      swept++;
      if (swept < total) {
        setTimeout(doNext, STAGGER);
      } else {
        setTimeout(() => { busy = false; }, 450);
      }
    }
    doNext();
  }

  // 카드바디 클릭 → 한 장 앞으로 / LIFO 복귀
  cards.forEach((card, i) => {
    card.querySelector('.card-body').addEventListener('click', e => {
      if (e.target.closest('a, button')) return;
      if (busy) return;

      if (i === current && current >= 0) {
        busy = true;
        current--;
        render(true);
        setTimeout(() => { busy = false; }, 450);

      } else if (i === current + 1) {
        busy = true;
        const returningCard = card;
        current++;
        render(true);
        returningCard.style.zIndex = 25;
        setTimeout(() => {
          returningCard.style.zIndex = 10;
          busy = false;
        }, 450);
      }
    });
  });

  // 탭 클릭 → 해당 카드까지 cascade sweep
  // .card가 pointer-events:none이므로 탭 뒤에 있는 카드들 탭까지 클릭 통과됨
  document.querySelectorAll('.idx-tab').forEach(tab => {
    tab.addEventListener('click', e => {
      e.stopPropagation();
      if (busy) return;
      const targetIdx = cards.findIndex(c => c.dataset.page === tab.dataset.target);
      if (targetIdx < 0 || targetIdx >= current) return;
      sweepTo(targetIdx);
    });
  });

  render(false);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    cards.forEach(c => { c.style.transition = ''; });
  }));
})();
