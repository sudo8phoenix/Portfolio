'use strict';

// Keep the existing theme persistence and system preference handling.
const appearanceSelect = document.querySelector('[name="appearance"]');
if (appearanceSelect) {
  const picker = document.createElement('details');
  picker.className = 'appearance-picker';
  picker.innerHTML = `<summary aria-label="Choose appearance" title="Choose appearance"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 0 0 16Z" fill="currentColor" stroke="none"/></svg></summary><div class="appearance-options" aria-label="Appearance"><span>Appearance</span>${['Light', 'Dark', 'System'].map(label => `<button type="button" data-appearance="${label.toLowerCase()}" aria-pressed="false"><span>${label}</span><span class="appearance-check" aria-hidden="true">✓</span></button>`).join('')}</div>`;
  appearanceSelect.parentElement.after(picker);
  appearanceSelect.parentElement.hidden = true;
  const summary = picker.querySelector('summary');
  const sync = () => {
    picker.querySelectorAll('[data-appearance]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.appearance === appearanceSelect.value)));
    summary.setAttribute('aria-label', `Choose appearance, currently ${appearanceSelect.value}`);
  };
  picker.querySelectorAll('[data-appearance]').forEach(button => button.addEventListener('click', () => {
    appearanceSelect.value = button.dataset.appearance;
    appearanceSelect.dispatchEvent(new Event('change', {bubbles:true}));
    sync(); picker.open = false; summary.focus();
  }));
  appearanceSelect.addEventListener('change', sync);
  picker.addEventListener('toggle', () => { if (picker.open) document.querySelectorAll('.mobile-menu[open]').forEach(menu => { menu.open = false; }); });
  document.querySelectorAll('.mobile-menu').forEach(menu => menu.addEventListener('toggle', () => { if (menu.open) picker.open = false; }));
  document.addEventListener('click', event => { if (!picker.contains(event.target)) picker.open = false; });
  picker.addEventListener('keydown', event => { if (event.key === 'Escape') { picker.open = false; summary.focus(); } });
  sync();
}

const skills = document.querySelector('.skills-layout');
if (skills) {
  const projects = [...document.querySelectorAll('.project-copy')].map(copy => ({
    name: copy.querySelector('h3')?.textContent,
    stack: copy.querySelector('.tech')?.textContent.toLowerCase() || '',
    href: copy.querySelector('.case-study-link')?.getAttribute('href')
  })).filter(project => project.name && project.href);
  const insight = document.createElement('div'); insight.className = 'skill-insight';
  insight.setAttribute('role', 'status');
  insight.textContent = 'Select a highlighted skill to explore the projects behind it.';
  const buttons = [];
  skills.querySelectorAll('.skill-tags li').forEach(item => {
    const name = item.textContent;
    const matches = projects.filter(project => project.stack.includes(name.toLowerCase()));
    if (!matches.length) return;
    const button = document.createElement('button'); button.type = 'button';
    button.textContent = name; button.setAttribute('aria-pressed', 'false');
    item.classList.add('explorable-skill'); item.replaceChildren(button); buttons.push(button);
    button.addEventListener('click', () => {
      buttons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      const label = document.createElement('p'); label.textContent = `${name} in practice`;
      const links = matches.map(project => { const link = document.createElement('a'); link.href = project.href; link.textContent = `${project.name} ↗`; return link; });
      insight.replaceChildren(label, ...links);
    });
  });
  if (buttons.length) skills.append(insight);
}

const library = document.querySelector('.library-page .project-library');
if (library) {
  const rows = [...library.querySelectorAll('.library-row')];
  const searchableText = new Map(rows.map(row => [row, row.textContent.toLowerCase()]));
  const filters = document.createElement('form');
  filters.className = 'project-filters'; filters.setAttribute('role', 'search');
  filters.innerHTML = '<label for="project-search">Find a project</label><div class="project-search-line"><input type="search" id="project-search" placeholder="Try Python, agents, or analytics…" autocomplete="off"><button type="reset">Clear</button></div><div class="project-filter-options" aria-label="Project categories">'+['All', 'AI & ML', 'Data', 'Applications'].map((label, i) => `<button type="button" data-category="${i}" aria-pressed="${i===0}">${label}</button>`).join('')+'</div><p class="filter-results" role="status"></p>';
  library.querySelector('.section-head').after(filters);
  const empty = document.createElement('p'); empty.className = 'filter-empty'; empty.hidden = true; empty.textContent = 'No matching projects. Try another term or clear the filters.'; library.append(empty);
  const categoryMatches = [() => true, text => /sentiment|recommendation|vision|tensorflow/i.test(text), text => /analytics|recommendation|historical/i.test(text), text => /agent|product engineering|iot/i.test(text)];
  let category = 0;
  const field = filters.querySelector('input');
  function render() {
    const query = field.value.trim().toLowerCase(); let count = 0;
    rows.forEach(row => { const text = searchableText.get(row); row.hidden = !(text.includes(query) && categoryMatches[category](text)); if (!row.hidden) count++; });
    filters.querySelector('.filter-results').textContent = `${count} of ${rows.length} projects`;
    empty.hidden = count !== 0;
    const url = new URL(location.href);
    query ? url.searchParams.set('q', field.value.trim()) : url.searchParams.delete('q');
    category ? url.searchParams.set('category', String(category)) : url.searchParams.delete('category');
    history.replaceState(null, '', url);
    filters.querySelectorAll('[data-category]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.category) === category)));
  }
  field.addEventListener('input', render);
  filters.addEventListener('submit', event => event.preventDefault());
  filters.addEventListener('reset', event => { event.preventDefault(); field.value = ''; category = 0; render(); field.focus(); });
  filters.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => { category = Number(button.dataset.category); render(); }));
  function restore() {
    const params = new URLSearchParams(location.search); field.value = params.get('q') || '';
    const value = Number(params.get('category')); category = Number.isInteger(value) && value >= 0 && value <= 3 ? value : 0; render();
  }
  window.addEventListener('popstate', restore); restore();
}

const portrait = document.querySelector('[data-portrait]');
if (portrait) {
  const interests = [
    ['Applied AI', 'Models are a starting point. I build the systems around them.', 'Explore Time Agent ↗', '#project-time-agent'],
    ['Software', 'From APIs to interfaces, I like connecting the whole workflow.', 'Explore InvoChain ↗', '#project-invochain'],
    ['Data', 'Useful predictions start with reliable data and thoughtful pipelines.', 'See my experience ↗', '#experience']
  ];
  portrait.querySelectorAll('[data-interest]').forEach(button => button.addEventListener('click', () => {
    const [label, copy, link, href] = interests[Number(button.dataset.interest)];
    portrait.querySelector('[data-portrait-label]').textContent = label;
    portrait.querySelector('[data-portrait-copy]').textContent = copy;
    const anchor = portrait.querySelector('[data-portrait-link]'); anchor.textContent = link; anchor.href = href;
    portrait.querySelectorAll('[data-interest]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  }));

}

// Topic shortcuts prepare an email in the visitor's own mail app.
const contactEmail = document.querySelector('.contact a.email');
if (contactEmail) {
  const topics = document.createElement('div');
  topics.className = 'contact-topics';
  const label = document.createElement('p'); label.textContent = 'What would you like to discuss?';
  const choices = document.createElement('div'); choices.setAttribute('role', 'group'); choices.setAttribute('aria-label', 'Conversation topic');
  const status = document.createElement('p'); status.className = 'contact-topic-status'; status.setAttribute('role', 'status');
  status.textContent = 'Choose a topic to prepare your email.';
  const base = contactEmail.getAttribute('href');
  ['Internship', 'Collaboration', 'A project idea'].forEach(topic => {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = topic; button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => {
      const selected = button.getAttribute('aria-pressed') !== 'true';
      choices.querySelectorAll('button').forEach(other => other.setAttribute('aria-pressed', String(selected && other === button)));
      contactEmail.href = selected ? `${base}?subject=${encodeURIComponent(topic + ' — Let’s connect')}` : base;
      status.textContent = selected ? `${topic} selected. Open the email link below to write your message.` : 'Choose a topic to prepare your email.';
    });
    choices.append(button);
  });
  topics.append(label, choices, status); contactEmail.before(topics);
}

// One motion coordinator owns entrances and feedback. Static HTML remains visible
// if JavaScript is unavailable; no hidden classes or scroll-position restoration.
const portfolioMotionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const portfolioAnimations = new Map();
const portfolioEase = 'cubic-bezier(.16,1,.3,1)';
function animatePortfolioContent(element, {distance = 22, duration = 680, delay = 0, scale = 1} = {}) {
  if (!element?.animate || portfolioMotionPreference.matches || document.hidden) return;
  portfolioAnimations.get(element)?.cancel();
  const animation = element.animate([
    {opacity: .15, translate: `0 ${distance}px`, scale},
    {opacity: 1, translate: '0 0', scale: 1}
  ], {duration, delay, easing: portfolioEase, fill: 'backwards'});
  portfolioAnimations.set(element, animation);
  const cleanup = () => {
    if (portfolioAnimations.get(element) === animation) portfolioAnimations.delete(element);
  };
  animation.addEventListener('finish', cleanup, {once: true});
  animation.addEventListener('cancel', cleanup, {once: true});
}

function initializePortfolioMotion() {
  const revealed = new WeakSet();
  const heroTargets = [...document.querySelectorAll('.hero-top, .hero-copy > *, .hero-portrait, .hero-footer, .case-hero > *, .library-heading > *')];
  const targets = [...document.querySelectorAll('.proof > div, .section-head, .project-preview, .project-copy, .library-invite, .tool-heading, .experience-grid > div:first-child, .timeline > article, .background-bio, .skill-group, .qualification-strip > *, .contact > .wrap > .eyebrow, .contact-grid > *, .library-row, .case-nav, .case-section > div:first-child, .case-section > .section-body, .next-project')];
  let observer;
  function isNavigationTarget(element) {
    const anchor = document.getElementById(location.hash.slice(1));
    return element.contains(document.activeElement) || (anchor && (anchor === element || anchor.contains(element)) && Math.abs(anchor.getBoundingClientRect().top) < 200);
  }
  function configure() {
    observer?.disconnect();
    portfolioAnimations.forEach(animation => animation.cancel());
    portfolioAnimations.clear();
    if (portfolioMotionPreference.matches) return;
    // Skip initial choreography for restored scroll positions and deep links.
    if (window.scrollY < 40 && !location.hash) {
      heroTargets.forEach((element, index) => {
        if (revealed.has(element)) return;
        revealed.add(element);
        animatePortfolioContent(element, {distance: element.matches('.hero-portrait') ? 30 : 20, duration: 850, delay: Math.min(index * 65, 390)});
      });
    }
    if (!('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver(entries => {
      let order = 0;
      entries.forEach(entry => {
        if (!entry.isIntersecting || !entry.target.getClientRects().length) return;
        observer.unobserve(entry.target);
        if (revealed.has(entry.target)) return;
        revealed.add(entry.target);
        if (isNavigationTarget(entry.target)) return;
        animatePortfolioContent(entry.target, {delay: Math.min(order++ * 65, 195)});
      });
    }, {threshold: 0, rootMargin: '0px 0px -24px 0px'});
    targets.forEach(element => { if (!revealed.has(element)) observer.observe(element); });
  }
  portfolioMotionPreference.addEventListener('change', configure);
  configure();

  document.addEventListener('focusin', event => {
    // Keyboard focus is immediate, even halfway through an entrance.
    portfolioAnimations.forEach((animation, element) => {
      if (element.contains(event.target)) animation.cancel();
    });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) portfolioAnimations.forEach(animation => animation.cancel());
  });

  // A live progress cue uses one paint per scroll frame, with no polling loop.
  const progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);
  let progressFrame = 0;
  function paintProgress() {
    progressFrame = 0;
    const range = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${range > 0 ? Math.max(0, Math.min(1, window.scrollY / range)) : 0})`;
  }
  function scheduleProgress() {
    if (!progressFrame) progressFrame = requestAnimationFrame(paintProgress);
  }
  window.addEventListener('scroll', scheduleProgress, {passive: true});
  window.addEventListener('resize', scheduleProgress);
  if ('ResizeObserver' in window) new ResizeObserver(scheduleProgress).observe(document.body);
  paintProgress();

  document.addEventListener('click', event => {
    const control = event.target.closest('button, summary');
    if (!control || portfolioMotionPreference.matches) return;
    let content;
    if (control.matches('[data-interest]')) {
      content = document.querySelector('.portrait-insight');
      animatePortfolioContent(document.querySelector('.portrait-specialty'), {distance: -7, duration: 420, scale: .94});
    } else if (control.closest('.project-preview')) {
      content = control.closest('.project-preview').querySelector('.invoice-detail, .rag-answer, .preview-feedback');
    } else if (control.closest('.project-lab')) {
      content = control.closest('.project-lab').querySelector('.lab-visual');
    } else if (control.closest('.skills-layout')) {
      content = document.querySelector('.skill-insight');
    } else if (control.closest('.contact-topics')) {
      content = document.querySelector('.contact-topic-status');
    } else if (control.matches('.experience-workflow > summary')) {
      if (control.parentElement.open) return;
      requestAnimationFrame(() => {
        control.parentElement.querySelectorAll('li').forEach((item, index) => {
          animatePortfolioContent(item, {distance: 10, duration: 440, delay: index * 55});
        });
      });
    }
    if (content) animatePortfolioContent(content, {distance: 8, duration: 380});
    const preview = control.closest('.project-preview[data-decision="approve"]');
    if (preview) preview.querySelectorAll('.frame-grid i').forEach((frame, index) => {
      animatePortfolioContent(frame, {distance: 5, duration: 380, delay: index * 22, scale: .7});
    });
    if (control.closest('.project-filter-options') || control.matches('.project-search-line > button')) animateFilteredRows();
  });
  function animateFilteredRows() {
    document.querySelectorAll('.library-row:not([hidden])').forEach((row, index) => {
      revealed.add(row);
      observer?.unobserve(row);
      animatePortfolioContent(row, {distance: 12, duration: 450, delay: index * 35});
    });
    scheduleProgress();
  }
  document.querySelector('#project-search')?.addEventListener('input', animateFilteredRows);
}
// All deferred enhancement scripts have built their previews before selecting targets.
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializePortfolioMotion, {once: true});
else initializePortfolioMotion();
