'use strict';

(() => {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const canvas = hero.querySelector('.hero-ripple');
  const context = canvas.getContext('2d');
  const cell = 42;
  let width = 0, height = 0, frame = 0, waves = [];
  let line, accent;

  function draw(now) {
    frame = 0;
    context.clearRect(0, 0, width, height);
    if (reduced.matches || document.hidden) return;
    waves = waves.filter(wave => now - wave.time < 1600);
    for (let y = 0; y < height; y += cell) {
      for (let x = 0; x < width; x += cell) {
        context.globalAlpha = .16;
        context.strokeStyle = line;
        context.strokeRect(x + .5, y + .5, cell, cell);
        let intensity = 0;
        for (const wave of waves) {
          const age = now - wave.time;
          const distance = Math.hypot(x + cell / 2 - wave.x, y + cell / 2 - wave.y);
          intensity = Math.max(intensity, Math.max(0, 1 - Math.abs(distance - age * .45) / 65) * (1 - age / 1600));
        }
        if (intensity > 0) {
          context.fillStyle = accent;
          context.globalAlpha = intensity * .18;
          context.fillRect(x + 1, y + 1, cell - 1, cell - 1);
          context.strokeStyle = accent;
          context.globalAlpha = intensity * .5;
          context.strokeRect(x + .5, y + .5, cell, cell);
        }
      }
    }
    context.globalAlpha = 1;
    if (waves.length) frame = requestAnimationFrame(draw);
  }
  function refresh() {
    if (!context) return;
    cancelAnimationFrame(frame);
    const bounds = canvas.getBoundingClientRect();
    width = bounds.width; height = bounds.height;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const style = getComputedStyle(hero);
    line = style.getPropertyValue('--line').trim();
    accent = style.getPropertyValue('--accent').trim();
    waves = [];
    draw(performance.now());
  }
  if (context) {
    new ResizeObserver(refresh).observe(hero);
    new MutationObserver(refresh).observe(document.documentElement, {attributes:true, attributeFilter:['data-theme']});
    matchMedia('(prefers-color-scheme: light)').addEventListener('change', refresh);
    reduced.addEventListener('change', refresh);
    document.addEventListener('visibilitychange', refresh);
    hero.addEventListener('click', event => {
      if (reduced.matches || event.target.closest('a, button, input, select, summary') || window.getSelection()?.toString()) return;
      const bounds = canvas.getBoundingClientRect();
      waves.push({x:event.clientX - bounds.left, y:event.clientY - bounds.top, time:performance.now()});
      waves = waves.slice(-3);
      if (!frame) frame = requestAnimationFrame(draw);
    });
    refresh();
  }

  const stage = document.querySelector('.portrait-stage');
  if (!stage) return;
  const depth = stage.querySelector('.portrait-depth');
  function reset() {
    depth.style.removeProperty('--portrait-rx');
    depth.style.removeProperty('--portrait-ry');
    depth.style.removeProperty('--portrait-x');
    depth.style.removeProperty('--portrait-y');
    depth.style.removeProperty('--portrait-rotate');
  }
  stage.addEventListener('pointermove', event => {
    if (reduced.matches || !finePointer.matches || event.pointerType === 'touch') return;
    const bounds = stage.getBoundingClientRect();
    const x = Math.max(-.5, Math.min(.5, (event.clientX - bounds.left) / bounds.width - .5));
    const y = Math.max(-.5, Math.min(.5, (event.clientY - bounds.top) / bounds.height - .5));
    depth.style.setProperty('--portrait-rx', `${-y * 6}deg`);
    depth.style.setProperty('--portrait-ry', `${x * 8}deg`);
    depth.style.setProperty('--portrait-x', `${x * 10}px`);
    depth.style.setProperty('--portrait-y', `${y * 6}px`);
    depth.style.setProperty('--portrait-rotate', `${x * 1.4}deg`);
  });
  stage.addEventListener('pointerleave', reset);
  stage.addEventListener('pointercancel', reset);
  window.addEventListener('blur', reset);
  reduced.addEventListener('change', reset);
  finePointer.addEventListener('change', reset);
})();
