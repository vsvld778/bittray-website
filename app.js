(() => {
  'use strict';

  const toggle = document.querySelector('[data-menu-toggle]');
  const nav = document.getElementById('main-nav');
  const setMenu = (open) => {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    nav.classList.toggle('is-open', open);
    toggle.classList.toggle('is-open', open);
  };
  if (toggle && nav) {
    toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        toggle.focus();
      }
    });
    document.addEventListener('click', (event) => {
      if (!nav.contains(event.target) && !toggle.contains(event.target)) setMenu(false);
    });
    window.matchMedia('(min-width: 1001px)').addEventListener('change', (event) => {
      if (event.matches) setMenu(false);
    });
    document.documentElement.classList.add('nav-ready');
  }

  const search = document.getElementById('solution-search');
  const cards = Array.from(document.querySelectorAll('[data-solution]'));
  if (search && cards.length) {
    const count = document.getElementById('search-count');
    const empty = document.getElementById('no-results');
    const normalize = (value) => value.toLocaleLowerCase('ru').replace(/ё/g, 'е').trim();
    const filter = () => {
      const terms = normalize(search.value).split(/\s+/).filter(Boolean);
      let visible = 0;
      for (const card of cards) {
        const text = normalize(`${card.dataset.search || ''} ${card.textContent}`);
        const matches = terms.every(term => text.includes(term));
        card.hidden = !matches;
        if (matches) visible += 1;
      }
      if (count) count.textContent = `Найдено направлений: ${visible} из ${cards.length}`;
      if (empty) empty.hidden = visible !== 0;
    };
    search.addEventListener('input', filter);
    search.addEventListener('search', filter);
    filter();
  }

  const form = document.getElementById('brief-form');
  if (form) {
    const preview = document.getElementById('brief-preview');
    const text = document.getElementById('brief-text');
    const mail = document.getElementById('email-brief');
    const download = document.getElementById('download-brief');
    const direction = form.elements.namedItem('direction');
    const selected = new URLSearchParams(window.location.search).get('direction');
    if (direction && selected && Array.from(direction.options).some(option => option.value === selected)) {
      direction.value = selected;
    }
    let brief = '';
    for (const name of ['name', 'task']) {
      const field = form.elements.namedItem(name);
      field?.addEventListener('input', () => field.setCustomValidity(''));
    }
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const nameField = form.elements.namedItem('name');
      const taskField = form.elements.namedItem('task');
      nameField?.setCustomValidity(nameField.value.trim() ? '' : 'Укажите ваше имя.');
      taskField?.setCustomValidity(taskField.value.trim().length >= 15 ? '' : 'Опишите задачу: не менее 15 символов без пробелов в начале и конце.');
      if (!form.reportValidity() || !preview || !text) return;
      const data = new FormData(form);
      const get = key => String(data.get(key) || '').trim();
      const directionLabel = direction?.selectedOptions?.[0]?.textContent || get('direction');
      brief = [
        'Обращение в БитТрай',
        '',
        `Имя: ${get('name')}`,
        `Email: ${get('email')}`,
        `Компания: ${get('company') || 'Не указана'}`,
        `Направление: ${directionLabel}`,
        '',
        'Задача:',
        get('task'),
      ].join('\n');
      text.textContent = brief;
      preview.hidden = false;
      if (mail) mail.href = `mailto:bittray.dv@yandex.ru?subject=${encodeURIComponent('Обсуждение проекта — ' + directionLabel)}&body=${encodeURIComponent(brief)}`;
      preview.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      preview.setAttribute('tabindex', '-1');
      preview.focus({ preventScroll: true });
    });
    const submit = form.querySelector('[type="submit"]');
    if (submit && preview && text) submit.disabled = false;
    if (download) download.addEventListener('click', () => {
      if (!brief) return;
      const url = URL.createObjectURL(new Blob(['\uFEFF', brief], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Bittray-project-brief.txt';
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }
})();
