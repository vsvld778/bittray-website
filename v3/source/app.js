(() => {
  'use strict';

  const toggle = document.querySelector('[data-menu-toggle]');
  const nav = document.getElementById('main-nav');
  const setMenu = (open) => {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Меню: закрыть' : 'Меню: открыть');
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
    document.addEventListener('focusin', (event) => {
      if (!nav.contains(event.target) && !toggle.contains(event.target)) setMenu(false);
    });
    document.documentElement.classList.add('nav-ready');
    setMenu(false);
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
  document.querySelectorAll('.comparison-table').forEach(region => {
    region.addEventListener('keydown', event => {
      if (event.target !== region || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      region.scrollBy({ left: event.key === 'ArrowRight' ? 120 : -120, behavior: 'auto' });
    });
  });
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
    const required = ['name', 'email', 'task'].map(name => form.elements.namedItem(name));
    const errors = new Map();
    const status = document.createElement('p');
    status.className = 'form-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    form.append(status);
    for (const field of required) {
      const error = document.createElement('span');
      error.id = field.id + '-error';
      error.className = 'field-error';
      error.hidden = true;
      field.closest('.field').append(error);
      const describedBy = field.getAttribute('aria-describedby') || '';
      field.setAttribute('aria-describedby', (describedBy + ' ' + error.id).trim());
      errors.set(field, error);
      field.addEventListener('input', () => {
        field.setCustomValidity('');
        field.removeAttribute('aria-invalid');
        error.hidden = true;
        error.textContent = '';
      });
    }
    const clearPreview = () => {
      if (!preview || preview.hidden) return;
      preview.hidden = true;
      brief = '';
      status.textContent = 'Данные изменены. Подготовьте обращение заново, чтобы включить правки.';
    };
    form.addEventListener('input', clearPreview);
    form.addEventListener('change', clearPreview);
    const validate = () => {
      let firstInvalid = null;
      for (const field of required) {
        field.setCustomValidity('');
        let message = '';
        if (field.name === 'name' && !field.value.trim()) message = 'Укажите ваше имя.';
        if (field.name === 'email' && (!field.value.trim() || field.validity.typeMismatch)) message = 'Укажите электронную почту в формате name@company.ru.';
        if (field.name === 'task' && field.value.trim().length < 15) message = 'Опишите задачу: не менее 15 символов без пробелов в начале и конце.';
        field.setCustomValidity(message);
        const error = errors.get(field);
        error.textContent = message;
        error.hidden = !message;
        if (message) { field.setAttribute('aria-invalid', 'true'); firstInvalid ||= field; }
        else field.removeAttribute('aria-invalid');
      }
      if (firstInvalid) {
        status.textContent = 'Проверьте отмеченные поля. Подсказка указана под каждым полем.';
        firstInvalid.focus();
        return false;
      }
      return true;
    };
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!validate() || !preview || !text) return;
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
      status.textContent = 'Текст обращения подготовлен. Он ещё не отправлен.';
      if (mail) mail.href = `mailto:bittray.dv@yandex.ru?subject=${encodeURIComponent('Обсуждение проекта — ' + directionLabel)}&body=${encodeURIComponent(brief)}`;
      preview.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      preview.setAttribute('tabindex', '-1');
      preview.focus({ preventScroll: true });
    });
    const submit = form.querySelector('[type="submit"]');
    if (submit && preview && text) { form.noValidate = true; submit.disabled = false; }
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
