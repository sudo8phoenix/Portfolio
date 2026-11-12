'use strict';
// Theme and workflow interactions enhance otherwise complete static documents.
const appearance = document.querySelector('[name="appearance"]');
const allowedThemes = new Set(['dark', 'light', 'system']);
function applyTheme(value) {
  document.documentElement.dataset.theme = value;
  if (appearance) appearance.value = value;
  const light = value === 'light' || (value === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', light ? '#f7f7f4' : '#111214');
  document.dispatchEvent(new Event('portfolio-theme-change'));
}
// Fluid paint reveal, built on Magic UI's native View Transition approach:
// https://magicui.design/docs/components/animated-theme-toggler
// One continuous contour is browser-interpolated, without separate box cutouts.
let activeThemeTransition;
let themeTransitionVersion = 0;
function transitionTheme(value) {
  const root = document.documentElement;
  const version = ++themeTransitionVersion;
  const isLight = mode => mode === 'light' || (mode === 'system' && matchMedia('(prefers-color-scheme: light)').matches);
  activeThemeTransition?.skipTransition();
  if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)').matches || isLight(value) === isLight(root.dataset.theme)) {
    delete root.dataset.themeTransition;
    applyTheme(value);
    return;
  }
  const bounds = (document.querySelector('.appearance-toggle') || appearance)?.getBoundingClientRect();
  const x = bounds ? bounds.left + bounds.width / 2 : innerWidth / 2;
  const y = bounds ? bounds.top + bounds.height / 2 : 40;
  const reach = Math.ceil(Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))) * 1.025;
  const amplitude = Math.min(110, reach * .13);
  const directions = Array.from({length: 64}, (_, i) => {
    const angle = i / 64 * Math.PI * 2;
    return {angle, dx: Math.cos(angle), dy: Math.sin(angle)};
  });
  // Prepare the flowing edge before capture; no JavaScript runs on animation frames.
  const frames = Array.from({length: 51}, (_, frame) => {
    const progress = frame / 50;
    const swell = Math.sin(Math.PI * progress);
    const points = directions.map(({angle, dx, dy}) => {
      const flow = Math.sin(angle * 3 + progress * 2.4) * .62
        + Math.sin(angle * 5 - progress * 3.2 + 1.3) * .28
        + Math.sin(angle * 9 + progress * 4.1) * .1;
      const radius = Math.max(0, reach * progress + amplitude * swell * flow);
      return `${(x + dx * radius).toFixed(2)}px ${(y + dy * radius).toFixed(2)}px`;
    });
    return {clipPath: `polygon(${points.join(',')})`};
  });
  root.dataset.themeTransition = 'active';
  const transition = document.startViewTransition(() => {
    if (version === themeTransitionVersion) applyTheme(value);
  });
  activeThemeTransition = transition;
  transition.ready.then(() => {
    if (version !== themeTransitionVersion) return;
    return root.animate(frames, {
      duration: 1700,
      easing: 'linear',
      fill: 'both',
      pseudoElement: '::view-transition-new(root)'
    }).finished;
  }).catch(() => { /* A newer choice can supersede this reveal. */ });
  transition.finished.finally(() => {
    if (activeThemeTransition === transition) activeThemeTransition = null;
    if (version === themeTransitionVersion) delete root.dataset.themeTransition;
  });
}
let theme = 'system';
try { const saved = localStorage.getItem('portfolio-appearance'); if (allowedThemes.has(saved)) theme = saved; } catch { /* Storage is optional. */ }
applyTheme(theme);
appearance?.addEventListener('change', () => {
  theme = allowedThemes.has(appearance.value) ? appearance.value : 'dark';
  transitionTheme(theme);
  try { localStorage.setItem('portfolio-appearance', theme); } catch { /* Storage is optional. */ }
});
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => applyTheme(theme));
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

for (const workflow of document.querySelectorAll('[data-workflow]')) {
  const steps = [...workflow.querySelectorAll('[data-step]')];
  const panels = [...workflow.querySelectorAll('.workflow-panel')];
  const status = workflow.querySelector('.workflow-status');
  const previous = workflow.querySelector('.workflow-prev');
  const next = workflow.querySelector('.workflow-next');
  let current = 0;
  function show(index) {
    current = Math.max(0, Math.min(index, steps.length - 1));
    steps.forEach((step, i) => {
      if (i === current) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
      panels[i].hidden = i !== current;
    });
    status.textContent = `Step ${current + 1} of ${steps.length} · ${panels[current].getAttribute('aria-label')}`;
    previous.disabled = current === 0;
    next.textContent = current === steps.length - 1 ? 'Replay ↺' : 'Next step →';
    const name = workflow.querySelector('.workflow-name').textContent;
    next.setAttribute('aria-label', current === steps.length - 1 ? `Replay ${name} workflow` : `Next step in ${name}`);
  }
  steps.forEach((step, i) => step.addEventListener('click', () => show(i)));
  previous.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => {
    if (current === steps.length - 1) workflow.dispatchEvent(new Event('workflow-reset'));
    show(current === steps.length - 1 ? 0 : current + 1);
  });
  workflow.classList.add('enhanced');
  workflow.querySelector('.workflow-bottom').hidden = false;
  show(0);
}
for (const menu of document.querySelectorAll('.mobile-menu')) {
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape') { menu.open = false; menu.querySelector('summary').focus(); }
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { menu.open = false; }));
  document.addEventListener('click', event => { if (!menu.contains(event.target)) menu.open = false; });
}

for (const workflow of document.querySelectorAll('[data-workflow]')) {
  const name = workflow.querySelector('.workflow-name').textContent;
  workflow.dataset.project = name.toLowerCase().replace(/[^a-z]+/g, '-');
  workflow.querySelectorAll('.workflow-panel').forEach((panel, index) => {
    const visual = document.createElement('div');
    visual.className = 'stage-visual';
    visual.setAttribute('aria-hidden', 'true');
    if (/Fridge/i.test(name)) {
      visual.classList.add('food-visual');
      visual.innerHTML = index === 3 ? '<span class="meal-symbol">◉</span><span class="visual-caption">Ready to make something good.</span>' : '<span class="food tomato">●<small>Tomato</small></span><span class="food egg">⬭<small>Egg</small></span><span class="food cheese">◭<small>Cheese</small></span><span class="scan-line"></span>';
    } else if (/Invo/i.test(name)) {
      visual.innerHTML = '<div class="invoice-sheet"><span>INVOCHAIN <b>↗</b></span><strong>' + ['Your wallet. Verified.', 'An invoice, on-chain.', 'A document you can trace.', 'Payment. Recorded.'][index % 4] + '</strong><i></i><em>' + ['Identity → Signed nonce', 'Invoice #001 → 0.05 ETH', 'Document → IPFS', 'Payment → Ethereum'][index % 4] + '</em><span class="visual-stamp">' + ['✓ VERIFIED', 'INVOICE CREATED', 'CONTENT LINKED', '✓ RECORDED'][index % 4] + '</span></div>';
    } else if (/Voice|RAG/i.test(name)) {
      visual.innerHTML = '<div class="voice-orb">' + ['↥', '♪', '⌕', '❞'][index % 4] + '</div><div class="waveform">' + Array.from({length:23}, (_,i) => '<i style="--bar:' + (15 + ((i * 37 + index * 19) % 65)) + '%"></i>').join('') + '</div><span class="visual-caption">' + ['A document becomes knowledge', 'A question starts a conversation', 'Evidence before an answer', 'An answer with a source'][index % 4] + '</span>';
    } else if (/Time Agent/i.test(name)) {
      visual.innerHTML = '<div class="report-sheet"><span>SITE REPORT <b>LEVEL 2</b></span><strong>12 <small>window frames</small></strong><div class="report-lines"><i></i><i></i><i></i></div><span class="visual-stamp">' + ['REPORT RECEIVED', 'SOURCE ATTACHED', 'AWAITING HUMAN REVIEW', '✓ APPROVED EXAMPLE'][index % 4] + '</span></div><span class="progress-node">' + ['↥', '⌕', '✓', '↗'][index % 4] + '</span>';
    }
    if (visual.childNodes.length) panel.prepend(visual);
  });
}
