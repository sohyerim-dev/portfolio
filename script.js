(function () {
  // DOM 순서: [contact(0), projects(1), about(2), intro(3)]
  const cards = Array.from(document.querySelectorAll('.card'));
  let current = cards.length - 1;
  let busy = false;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function getPushedTransform(depth) {
    if (window.innerWidth <= 600) {
      // 모바일: 오른쪽 아래 대각선 + 기울임
      const peek = Math.max(44, 80 - (depth - 1) * 18);
      const angle = 4 + (depth - 1) * 1.5;
      return `translate(8%, calc(100% - ${peek}px)) rotate(${angle}deg)`;
    }
    const peek = Math.max(20, 44 - (depth - 1) * 12);
    const yOffset = -6 - (depth - 1) * 3;
    const angle = 2 + (depth - 1);
    return `translate(calc(100% - ${peek}px), ${yOffset}%) rotate(${angle}deg)`;
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
          card.querySelector('.idx-tab')?.classList.remove('tab-pulse');
        } else {
          card.classList.remove('behind', 'pushed-deep');
        }
      } else {
        const depth = i - current;
        card.style.zIndex = 20 - depth;
        card.style.transform = reducedMotion ? 'translateX(110%)' : getPushedTransform(depth);
        card.classList.remove('behind');
        card.classList.toggle('pushed-deep', depth > 1);
        card.querySelector('.idx-tab')?.classList.remove('tab-pulse');
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
        setTimeout(() => { busy = false; hintContactTab(); }, 450);
      }
    }
    doNext();
  }

  // contact가 현재 카드일 때 탭 힌트
  function hintContactTab() {
    if (current !== 0 || reducedMotion) return;
    const tab = cards[0].querySelector('.idx-tab');
    if (!tab) return;
    tab.classList.remove('tab-pulse');
    void tab.offsetWidth; // 애니메이션 재시작용 reflow
    tab.classList.add('tab-pulse');
    tab.addEventListener('animationend', () => tab.classList.remove('tab-pulse'), { once: true });
  }

  // 카드바디 클릭 → 한 장 앞으로 / LIFO 복귀 (데스크톱만)
  cards.forEach((card, i) => {
    card.querySelector('.card-body').addEventListener('click', e => {
      if (e.target.closest('a, button')) return;
      if (busy) return;
      if (window.innerWidth <= 600) return; // 모바일: 카드바디 클릭 비활성 (스크롤 허용)

      if (i === current && current >= 0) {
        busy = true;
        current--;
        render(true);
        setTimeout(() => { busy = false; hintContactTab(); }, 450);

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

  // 탭 클릭 → 앞으로(cascade sweep) 또는 LIFO 복귀
  // .card가 pointer-events:none이므로 탭 뒤에 있는 카드들 탭까지 클릭 통과됨
  document.querySelectorAll('.idx-tab').forEach(tab => {
    tab.addEventListener('click', e => {
      e.stopPropagation();
      if (busy) return;
      const targetIdx = cards.findIndex(c => c.dataset.page === tab.dataset.target);
      if (targetIdx < 0) return;

      if (targetIdx < current) {
        // 앞으로: 해당 카드까지 cascade sweep
        sweepTo(targetIdx);
      } else if (targetIdx === current && current >= 0) {
        // 현재 카드 탭 클릭 → 현재 카드 치우기 (CONTACT 탭에서 포스트잇 진입 포함)
        busy = true;
        current--;
        render(true);
        setTimeout(() => { busy = false; hintContactTab(); }, 450);
      } else if (targetIdx === current + 1) {
        // LIFO 복귀: 가장 위 pushed 카드 탭 클릭
        busy = true;
        const returningCard = cards[targetIdx];
        current++;
        render(true);
        returningCard.style.zIndex = 25;
        setTimeout(() => { returningCard.style.zIndex = 10; busy = false; }, 450);
      }
    });
  });

  render(false);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    cards.forEach(c => { c.style.transition = ''; });
  }));

  // 모바일 탭 힌트 (로드 후 1.5초 뒤, 2회 통통)
  if (window.innerWidth <= 600 && !reducedMotion) {
    setTimeout(() => {
      cards.forEach((card, i) => {
        if (i === current) return; // 현재 카드(intro) 탭 제외
        const tab = card.querySelector('.idx-tab');
        if (!tab) return;
        tab.style.animationDelay = `${(cards.length - 1 - i) * 80}ms`;
        tab.classList.add('tab-pulse');
        tab.addEventListener('animationend', () => {
          tab.style.animationDelay = '';
          tab.classList.remove('tab-pulse');
        }, { once: true });
      });
    }, 1500);
  }

  // 인트로 타이핑 효과
  const nameEl = document.querySelector('.intro-name');
  if (nameEl) {
    const text = nameEl.textContent.trim();
    nameEl.textContent = '';

    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.textContent = '|';
    nameEl.appendChild(cursor);

    if (reducedMotion) {
      nameEl.insertBefore(document.createTextNode(text), cursor);
    } else {
      let i = 0;
      setTimeout(() => {
        const timer = setInterval(() => {
          nameEl.insertBefore(document.createTextNode(text[i]), cursor);
          i++;
          if (i >= text.length) {
            clearInterval(timer);
            cursor.style.animation = 'none';
            cursor.style.opacity = '1';
          }
        }, 320);
      }, 600);
    }
  }
})();
