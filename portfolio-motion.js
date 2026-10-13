'use strict';
window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const graphic = document.querySelector('.hero-graphic');
const toggle = document.querySelector('.motion-toggle');
let paused = reducedMotion.matches;
function syncMotion() {
  graphic.classList.toggle('motion-paused', paused);
  toggle.textContent = paused ? 'Play motion' : 'Pause motion';
  toggle.setAttribute('aria-pressed', String(paused));
  if (paused) {
    graphic.style.setProperty('--tilt-x', '0deg');
    graphic.style.setProperty('--tilt-y', '0deg');
    graphic.style.setProperty('--scroll-turn', '0deg');
  }
}
toggle.addEventListener('click', () => { paused = !paused; syncMotion(); });
reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; syncMotion(); });
syncMotion();
graphic.addEventListener('pointermove', event => {
  if (paused || reducedMotion.matches || event.pointerType === 'touch') return;
  const rect = graphic.getBoundingClientRect();
  graphic.style.setProperty('--tilt-x', `${-(event.clientY - rect.top - rect.height / 2) / rect.height * 20}deg`);
  graphic.style.setProperty('--tilt-y', `${(event.clientX - rect.left - rect.width / 2) / rect.width * 20}deg`);
});
graphic.addEventListener('pointerleave', () => {
  graphic.style.setProperty('--tilt-x', '0deg');
  graphic.style.setProperty('--tilt-y', '0deg');
});
for (const node of document.querySelectorAll('.signal-node')) {
  let drag = null;
  function place(x, y) {
    const rect = graphic.getBoundingClientRect();
    node.style.left = `${Math.max(6, Math.min(x, rect.width - node.offsetWidth - 6))}px`;
    node.style.top = `${Math.max(45, Math.min(y, rect.height - node.offsetHeight - 56))}px`;
    node.classList.add('moved');
  }
  node.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    const rect = node.getBoundingClientRect();
    drag = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    node.setPointerCapture(event.pointerId);
    node.classList.add('dragging');
  });
  node.addEventListener('pointermove', event => {
    if (!drag) return;
    const rect = graphic.getBoundingClientRect();
    place(event.clientX - rect.left - drag.x, event.clientY - rect.top - drag.y);
  });
  const stop = () => { drag = null; node.classList.remove('dragging'); };
  node.addEventListener('pointerup', stop);
  node.addEventListener('pointercancel', stop);
  node.addEventListener('lostpointercapture', stop);
  node.addEventListener('keydown', event => {
    const delta = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] }[event.key];
    if (!delta) return;
    event.preventDefault();
    place(node.offsetLeft + delta[0], node.offsetTop + delta[1]);
  });
}
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: .08 });
  document.querySelectorAll('.project, .section-head, .timeline article, .about-grid, .contact-grid').forEach(element => {
    element.classList.add('scroll-reveal');
    observer.observe(element);
  });
}
const progress = document.createElement('div');
progress.className = 'scroll-progress';
progress.setAttribute('aria-hidden', 'true');
document.body.append(progress);
let framePending = false;
function updateScroll() {
  framePending = false;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
  if (!paused && !reducedMotion.matches) graphic.style.setProperty('--scroll-turn', `${Math.min(window.scrollY * .045, 35)}deg`);
}
window.addEventListener('scroll', () => {
  if (!framePending) { framePending = true; requestAnimationFrame(updateScroll); }
}, { passive: true });
window.addEventListener('resize', updateScroll);
updateScroll();

// Lightweight live signal field; only animate while the scene is visible.
const field = document.querySelector('.signal-field');
const ctx = field.getContext('2d');
if (ctx) graphic.classList.add('canvas-orbits');
const core = graphic.querySelector('.core');
let sceneVisible = true;
let turn = 0;
let spinDrag = null;
let lastTime = 0;
let sceneFrame = 0;
let points = [];
function sizeField() {
  const width = graphic.clientWidth;
  const height = graphic.clientHeight;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  field.width = width * ratio;
  field.height = height * ratio;
  if (ctx) ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  points = Array.from({ length: 22 }, (_, i) => ({ x: (i * 83 % 997) / 997 * width, y: (i * 137 % 991) / 991 * height, phase: i * 1.7 }));
  // Keep dragged signals within the scene after a viewport change.
  graphic.querySelectorAll('.signal-node.moved').forEach(node => {
    node.style.left = `${Math.min(node.offsetLeft, width - node.offsetWidth - 6)}px`;
    node.style.top = `${Math.min(node.offsetTop, height - node.offsetHeight - 56)}px`;
  });
}
function paintField(time) {
  if (!ctx) return;
  const width = graphic.clientWidth, height = graphic.clientHeight;
  ctx.clearRect(0, 0, width, height);
  const moving = !paused && !reducedMotion.matches;
  const t = moving ? time * .00025 : 0;
  const center = { x: width / 2, y: height * .49 };
  // Draw rotating ellipses directly, avoiding browser-specific CSS interpolation.
  const radius = Math.min(width * .32, width < 360 ? 105 : 122.5);
  for (let index = 0; index < 3; index++) {
    const angle = ((index === 1 ? -turn : turn) + [-35, 35, 90][index]) * Math.PI / 180;
    ctx.save(); ctx.translate(center.x, center.y); ctx.rotate(angle);
    ctx.strokeStyle = index === 2 ? '#a7b7d0' : '#7d9deb'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, 0, radius, radius * .65, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = index === 2 ? '#7891b9' : '#235be8';
    ctx.beginPath(); ctx.arc(radius * .7, -radius * .65 * Math.sqrt(1 - .49), 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  ctx.lineWidth = .6;
  for (const point of points) {
    const x = point.x + Math.sin(t + point.phase) * 9;
    const y = point.y + Math.cos(t + point.phase) * 8;
    ctx.fillStyle = '#235be850';
    ctx.beginPath(); ctx.arc(x, y, 1.7, 0, Math.PI * 2); ctx.fill();
    if (Math.hypot(x - center.x, y - center.y) < 155) {
      ctx.strokeStyle = '#235be815'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(center.x, center.y); ctx.stroke();
    }
  }
  ctx.strokeStyle = '#235be840';
  graphic.querySelectorAll('.signal-node').forEach(node => {
    ctx.beginPath(); ctx.moveTo(center.x, center.y); ctx.lineTo(node.offsetLeft + node.offsetWidth / 2, node.offsetTop + node.offsetHeight / 2); ctx.stroke();
  });
}
function sceneTick(time) {
  sceneFrame = 0;
  if (!sceneVisible || document.hidden) { lastTime = 0; return; }
  const delta = lastTime ? Math.min(time - lastTime, 40) : 0;
  lastTime = time;
  if (!paused && !reducedMotion.matches && !spinDrag) turn += delta * .018;
  graphic.style.setProperty('--turn', `${turn}deg`);
  paintField(time);
  if (!paused && !reducedMotion.matches) sceneFrame = requestAnimationFrame(sceneTick);
}
function startScene() {
  if (!sceneFrame && sceneVisible && !document.hidden) sceneFrame = requestAnimationFrame(sceneTick);
}
core.addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  spinDrag = { x: event.clientX, y: event.clientY, turn };
  core.setPointerCapture(event.pointerId);
});
core.addEventListener('pointermove', event => {
  if (!spinDrag) return;
  turn = spinDrag.turn + (event.clientX - spinDrag.x) * .7;
  graphic.style.setProperty('--turn', `${turn}deg`);
  graphic.style.setProperty('--pan-x', `${Math.max(-24, Math.min(24, (event.clientX - spinDrag.x) * .15))}px`);
  graphic.style.setProperty('--pan-y', `${Math.max(-18, Math.min(18, (event.clientY - spinDrag.y) * .15))}px`);
  paintField(0);
});
function releaseScene() {
  spinDrag = null;
  graphic.style.setProperty('--pan-x', '0px');
  graphic.style.setProperty('--pan-y', '0px');
  startScene();
}
core.addEventListener('pointerup', releaseScene);
core.addEventListener('pointercancel', releaseScene);
core.addEventListener('lostpointercapture', releaseScene);
core.addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault(); turn += event.key === 'ArrowRight' ? 15 : -15;
  graphic.style.setProperty('--turn', `${turn}deg`);
});
toggle.addEventListener('click', startScene);
reducedMotion.addEventListener('change', startScene);
document.addEventListener('visibilitychange', startScene);
if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
  sceneVisible = entries[0].isIntersecting;
  if (sceneVisible) startScene();
}, { threshold: 0 }).observe(graphic);
if ('ResizeObserver' in window) new ResizeObserver(() => { sizeField(); startScene(); }).observe(graphic);
else window.addEventListener('resize', () => { sizeField(); startScene(); });
sizeField(); startScene();
graphic.querySelectorAll('.signal-node').forEach(node => {
  node.addEventListener('pointermove', () => { if (paused) paintField(0); });
  node.addEventListener('keydown', () => { if (paused) paintField(0); });
});
for (const art of document.querySelectorAll('.project-art')) {
  art.addEventListener('pointermove', event => {
    if (paused || reducedMotion.matches || event.pointerType === 'touch') return;
    const rect = art.getBoundingClientRect();
    art.style.setProperty('--art-x', `${-(event.clientY - rect.top - rect.height / 2) / rect.height * 16}deg`);
    art.style.setProperty('--art-y', `${(event.clientX - rect.left - rect.width / 2) / rect.width * 16}deg`);
  });
  art.addEventListener('pointerleave', () => { art.style.setProperty('--art-x', '0deg'); art.style.setProperty('--art-y', '0deg'); });
}
for (const button of document.querySelectorAll('.demo-control')) {
  button.addEventListener('click', async () => {
    if (button.disabled) return;
    const art = button.closest('.project-art');
    const type = button.dataset.demo;
    button.disabled = true;
    if (type === 'agent') {
      const steps = [...art.querySelectorAll('.flow span')];
      for (const step of steps) {
        step.classList.add('step-active');
        if (!reducedMotion.matches) await new Promise(resolve => setTimeout(resolve, 420));
      }
      button.textContent = 'Workflow complete ✓';
      await new Promise(resolve => setTimeout(resolve, 1200));
      steps.forEach(step => step.classList.remove('step-active'));
      button.textContent = 'Run workflow ↗';
    } else if (type === 'chain') {
      art.classList.toggle('verified');
      button.textContent = art.classList.contains('verified') ? 'Verified ✓ · Reset' : 'Verify invoice ↗';
    } else {
      const vision = art.querySelector('.vision');
      vision.classList.remove('scanned'); vision.classList.add('scanning');
      button.textContent = 'Scanning…';
      if (!reducedMotion.matches) await new Promise(resolve => setTimeout(resolve, 1600));
      vision.classList.remove('scanning'); vision.classList.add('scanned');
      button.textContent = '3 ingredients found · Rescan';
    }
    button.disabled = false;
  });
}

// Signal modes reveal the three disciplines behind the portfolio.
const signalModes = [
  { label: 'DATA', copy: 'DATA · TURNING RAW SIGNALS INTO DECISIONS', color: '#235be8' },
  { label: 'AI', copy: 'INTELLIGENCE · RETRIEVAL, MODELS & AGENTS', color: '#286b62' },
  { label: 'BUILD', copy: 'PRODUCT · APIS, INTERFACES & WORKFLOWS', color: '#936039' }
];
graphic.querySelectorAll('.signal-node').forEach((node, index) => {
  let down = null;
  node.addEventListener('pointerdown', event => { down = [event.clientX, event.clientY]; });
  node.addEventListener('click', event => {
    if (down && event.detail && Math.hypot(event.clientX - down[0], event.clientY - down[1]) > 8) return;
    const mode = signalModes[index];
    core.innerHTML = `<span class="mode-label">${mode.label}</span><i>+</i>`;
    graphic.dataset.mode = ['data', 'ai', 'product'][index];
    graphic.querySelector('.interaction-hint').textContent = mode.copy;
    graphic.querySelectorAll('.signal-node').forEach(signal => signal.setAttribute('aria-pressed', String(signal === node)));
    turn += 45;
    graphic.style.setProperty('--turn', `${turn}deg`);
    paintField(0);
  });
});
const capabilities = {
  data: { copy: 'From raw events to useful decisions: forecasting pipelines, data quality, purchase funnels, and retention analysis.', name: 'Product Analytics Warehouse', repo: 'product-analytics-warehouse', group: 2 },
  ai: { copy: 'From documents to grounded answers: hybrid retrieval, reranking, voice interfaces, and evidence-linked agent workflows.', name: 'Voice-Based Agentic RAG', repo: 'Rag-System', group: 2 },
  product: { copy: 'From a model to an application: structured APIs, responsive interfaces, authentication, and persistent data.', name: 'InvoChain', repo: 'InvoChain', group: 1 }
};
for (const button of document.querySelectorAll('[data-skill]')) {
  button.addEventListener('click', () => {
    const capability = capabilities[button.dataset.skill];
    document.querySelectorAll('[data-skill]').forEach(tab => tab.setAttribute('aria-pressed', String(tab === button)));
    document.querySelector('.skill-description').textContent = capability.copy;
    const link = document.querySelector('.skill-project');
    link.textContent = `Explore ${capability.name} ↗`;
    link.href = `https://github.com/sudo8phoenix/${capability.repo}`;
    document.querySelectorAll('.toolkit > div:not(.skill-explorer)').forEach((group, index) => group.classList.toggle('skill-highlight', index === capability.group));
  });
}
