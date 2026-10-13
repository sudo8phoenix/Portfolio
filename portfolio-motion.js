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
