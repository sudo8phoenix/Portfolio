'use strict';
const fluidMotion = matchMedia('(prefers-reduced-motion: reduce)');
// A critically damped spring. Retargeting preserves current velocity and never locks input.
function springValue(paint, initial = 1) {
  let value = initial, velocity = 0, target = initial, frame = 0, previous = 0;
  function tick(now) {
    const dt = Math.min((now - previous) / 1000 || 1 / 60, .032); previous = now;
    for (let i = 0; i < 4; i++) {
      velocity += (484 * (target - value) - 44 * velocity) * dt / 4;
      value += velocity * dt / 4;
    }
    paint(value);
    if (Math.abs(target - value) + Math.abs(velocity) < .001) { value = target; paint(value); frame = 0; }
    else frame = requestAnimationFrame(tick);
  }
  const retarget = (next, immediate = false, releaseVelocity) => {
    target = next;
    if (Number.isFinite(releaseVelocity)) velocity = releaseVelocity;
    if (immediate) { cancelAnimationFrame(frame); frame = 0; value = target; velocity = 0; paint(value); return; }
    if (fluidMotion.matches) { cancelAnimationFrame(frame); frame = 0; value = target; velocity = 0; paint(value); return; }
    if (!frame) { previous = performance.now(); frame = requestAnimationFrame(tick); }
  };
  retarget.read = () => value;
  return retarget;
}
const pressSprings = new WeakMap();
let pressedControl;
function releaseControl() { if (pressedControl) { pressSprings.get(pressedControl)?.(1); pressedControl = null; } }
document.addEventListener('pointerdown', event => {
  const control = event.target.closest('button,a.button,summary');
  if (!control || control.disabled || event.button !== 0) return;
  releaseControl();
  if (!pressSprings.has(control)) pressSprings.set(control, springValue(value => { control.style.scale = value; }));
  pressedControl = control;
  // Apply tactile feedback in this input event; spring back on release.
  pressSprings.get(control)(.98, true);
});
document.addEventListener('pointerup', releaseControl);
document.addEventListener('pointercancel', releaseControl);
window.addEventListener('blur', releaseControl);

const marquee = document.querySelector('.tool-viewport');
if (marquee) {
  const track = marquee.querySelector('.tool-track');
  const group = track.querySelector('.tool-group');
  const section = marquee.closest('.tool-strip');
  const detail = section.querySelector('.tool-detail');
  const tools = [
    ['Python', 'Data processing, retrieval, and model services.', 'projects/time-agent.html'],
    ['LangGraph', 'Evidence extraction and human review in Time Agent.', 'projects/time-agent.html'],
    ['React', 'The interfaces around invoices and computer vision.', 'projects/fridge-vision.html'],
    ['FastAPI', 'APIs connecting application workflows to AI services.', 'projects/time-agent.html'],
    ['PostgreSQL', 'Persistent jobs, checkpoints, and reviewed progress.', 'projects/time-agent.html'],
    ['PyTorch', 'Model development and fine-tuning.', 'projects/review-tag-generator.html'],
    ['BigQuery', 'Event models and product analytics.', 'projects/product-analytics-warehouse.html'],
    ['Docker', 'Reproducible service environments.', 'projects/time-agent.html']
  ];
  group.querySelectorAll('button').forEach((button, i) => { button.dataset.tool = String(i); button.setAttribute('aria-pressed', 'false'); });
  let width = 1, x = 0, velocity = fluidMotion.matches ? 0 : -32, frame = 0, previous = 0;
  let visible = true, dragging = false, pointer = null;
  let hovering = false;
  marquee.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovering = true; stop(); } });
  marquee.addEventListener('pointerleave', () => { hovering = false; wake(); });
  marquee.addEventListener('focusin', stop);
  marquee.addEventListener('focusout', () => requestAnimationFrame(wake));
  let gesture = null, dragged = false;
  const normalize = value => -(((-value % width) + width) % width);
  function paint() { x = normalize(x); marquee.scrollLeft = 0; track.style.transform = `translate3d(${x}px,0,0)`; }
  function measure() {
    const measured = group.getBoundingClientRect().width;
    if (!measured) return;
    const phase = width > 1 ? x / width : 0;
    width = measured; x = phase * width;
    track.querySelectorAll('[data-copy]').forEach(copy => copy.remove());
    const count = Math.ceil(marquee.clientWidth / width) + 1;
    for (let i = 0; i < count; i++) {
      const copy = group.cloneNode(true); copy.dataset.copy = ''; copy.setAttribute('aria-hidden', 'true');
      copy.querySelectorAll('button').forEach(b => b.tabIndex = -1); track.append(copy);
    }
    paint();
  }
  function autoVelocity() { return fluidMotion.matches || hovering || marquee.contains(document.activeElement) ? 0 : -32; }
  function animate(now) {
    frame = 0;
    const dt = Math.min((now - previous) / 1000 || 1 / 60, .032); previous = now;
    if (!dragging) {
      const target = autoVelocity();
      velocity = target + (velocity - target) * Math.exp(-5 * dt);
      x += velocity * dt; paint();
    }
    if (visible && !document.hidden && !dragging && (Math.abs(velocity) > .1 || autoVelocity() !== 0)) frame = requestAnimationFrame(animate);
  }
  function wake() { if (!frame && visible && !document.hidden && !dragging) { previous = performance.now(); frame = requestAnimationFrame(animate); } }
  function stop() { cancelAnimationFrame(frame); frame = 0; velocity = 0; }
  marquee.addEventListener('focusin', event => {

    if (event.target.matches('.tool-chip:focus-visible') && !event.target.closest('[data-copy]')) {
      x = -Math.max(0, event.target.offsetLeft - group.offsetLeft - 24); paint(); marquee.scrollLeft = 0; wake();
    }
  });
  marquee.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    stop(); dragging = true; dragged = false; pointer = event.pointerId;
    gesture = {x:event.clientX,y:event.clientY,origin:x,history:[{x:event.clientX,t:event.timeStamp}]};
  });
  marquee.addEventListener('pointermove', event => {
    if (!dragging || !gesture || event.pointerId !== pointer) return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    if (!dragged) {
      if (Math.max(Math.abs(dx),Math.abs(dy)) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) { dragging = false; gesture = null; pointer = null; wake(); return; }
      dragged = true; marquee.setPointerCapture(pointer); marquee.classList.add('is-dragging');
    }
    event.preventDefault(); x = gesture.origin + dx; paint();
    gesture.history.push({x:event.clientX,t:event.timeStamp});
    gesture.history = gesture.history.filter(sample => event.timeStamp-sample.t < 90);
  });
  function end(event) {
    if (!dragging || event.pointerId !== pointer) return;
    const history = gesture.history, first = history[0], last = history[history.length-1];
    velocity = dragged && last.t > first.t && event.timeStamp-last.t < 100 ? Math.max(-1400,Math.min(1400,(last.x-first.x)/(last.t-first.t)*1000)) : 0;
    dragging = false; gesture = null; marquee.classList.remove('is-dragging');
    const captured = pointer; pointer = null;
    if (marquee.hasPointerCapture(captured)) marquee.releasePointerCapture(captured);
    if (fluidMotion.matches || event.type === 'pointercancel') velocity = 0;
    wake();
  }
  window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
  marquee.addEventListener('lostpointercapture', event => { if (dragging && event.pointerId === pointer) end(event); });
  marquee.addEventListener('click', event => {
    if (dragged) { event.preventDefault(); dragged = false; return; }
    const button = event.target.closest('[data-tool]'); if (!button) return;
    const [name, description, href] = tools[Number(button.dataset.tool)];
    track.querySelectorAll('[data-tool]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tool === button.dataset.tool)));
    detail.replaceChildren(); const link = document.createElement('a'); link.href = (document.body.classList.contains('case-page') ? '../' : '') + href; link.textContent = 'Explore project →';
    detail.append(`${name} — ${description} `, link);
  });
  marquee.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) return;
    event.preventDefault(); stop(); x = event.key === 'Home' ? 0 : x + (event.key === 'ArrowLeft' ? 160 : -160); paint(); wake();
  });
  fluidMotion.addEventListener('change', () => { stop(); wake(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else wake(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) wake(); else stop(); }).observe(marquee);
  marquee.classList.add('enhanced'); measure();
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(marquee);
  document.fonts?.ready.then(measure); wake();
}

// A stage can be dragged directly; release velocity chooses the next resting stage.
for (const workflow of document.querySelectorAll('[data-workflow]')) {
  const panels = [...workflow.querySelectorAll('.workflow-panel')];
  const steps = [...workflow.querySelectorAll('[data-step]')];
  const viewport = workflow.querySelector('.workflow-panels');
  if (!viewport || !panels.length) continue;
  workflow.classList.add('swipe-workflow');
  let panel = panels.find(p => !p.hidden) || panels[0], index = panels.indexOf(panel);
  const axis = springValue(value => { panel.style.translate = `${value}px 0`; }, 0);
  let drag = null, swiping = false;
  viewport.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.target.closest('button,a,input,select,label')) return;
    const origin = axis.read(); axis(origin, true);
    drag = {id:event.pointerId, x:event.clientX, y:event.clientY, origin, history:[{x:event.clientX,t:event.timeStamp}], offset:origin};
  });
  viewport.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!swiping) {
      if (Math.max(Math.abs(dx),Math.abs(dy)) < 10) return;
      if (Math.abs(dy) > Math.abs(dx)) { drag = null; axis(0); return; }
      swiping = true; viewport.setPointerCapture(event.pointerId); viewport.classList.add('is-swiping');
    }
    event.preventDefault();
    const outward = (index === 0 && dx > 0) || (index === panels.length - 1 && dx < 0);
    const width = viewport.clientWidth || 300;
    drag.offset = drag.origin + (outward ? dx * width * .55 / (width + .55 * Math.abs(dx)) : dx);
    axis(drag.offset,true);
    drag.history.push({x:event.clientX,t:event.timeStamp});
    drag.history = drag.history.filter(p => event.timeStamp - p.t < 90);
  });
  function release(event) {
    if (!drag || drag.id !== event.pointerId) return;
    const history = drag.history, first = history[0], last = history[history.length-1];
    const velocity = last.t > first.t && event.timeStamp-last.t < 100 ? (last.x-first.x)/(last.t-first.t)*1000 : 0;
    const width = viewport.clientWidth || 300, projected = drag.offset + velocity * .18;
    const target = event.type !== 'pointercancel' && swiping && Math.abs(projected) > width*.24 ? Math.max(0,Math.min(index+(projected < 0 ? 1 : -1),panels.length-1)) : index;
    const offset = drag.offset; drag = null; swiping = false; viewport.classList.remove('is-swiping');
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    if (target !== index && !fluidMotion.matches) {
      const direction = target > index ? 1 : -1;
      axis(0,true); steps[target].click(); panel = panels[target]; index = target;
      axis(direction * width + offset,true); axis(0,false,velocity);
    } else if (target !== index) { axis(0,true); steps[target].click(); }
    else axis(0,false,event.type === 'pointercancel' ? 0 : velocity);
  }
  window.addEventListener('pointerup',release); window.addEventListener('pointercancel',release);
  workflow.addEventListener('click', event => {
    if (!event.target.closest('[data-step],.workflow-prev,.workflow-next')) return;
    const next = panels.find(p=>!p.hidden); if (next === panel) return;
    const old = index; axis(0,true); panel = next; index = panels.indexOf(next);
    axis((index > old ? 1 : -1)*18,true); axis(0);
  });
}

// Navigation follows the current section; its indicator retargets from its live position.
const primaryNav = document.querySelector('.header > nav');
if (primaryNav) {
  const links = [...primaryNav.querySelectorAll('a')];
  const marker = document.createElement('span'); marker.className = 'nav-marker'; marker.setAttribute('aria-hidden','true'); primaryNav.prepend(marker);
  let active;
  const move = springValue(value => { marker.style.translate = `${value}px 0`; },0);
  const resize = springValue(value => { marker.style.width = `${Math.max(0,value)}px`; },0);
  function select(link) {
    if (!link || !link.getClientRects().length) { marker.hidden = true; return; }
    marker.hidden = false; active = link;
    const bounds = link.getBoundingClientRect(), parent = primaryNav.getBoundingClientRect();
    move(bounds.left-parent.left); resize(bounds.width);
    links.forEach(a => a === link ? a.setAttribute('aria-current','location') : a.removeAttribute('aria-current'));
  }
  const header = primaryNav.closest('.header');
  const destinations = links.map(link => ({link, section: link.getAttribute('href').startsWith('#') ? document.getElementById(link.hash.slice(1)) : null})).filter(item => item.section);
  let pending = null, scrollFrame = 0;
  function updateNavigation() {
    scrollFrame = 0;
    const headerBottom = header.getBoundingClientRect().bottom;
    const line = headerBottom + 24;
    if (pending) {
      if (Math.abs(pending.section.getBoundingClientRect().top - line) < 3 || performance.now() > pending.until) pending = null;
      else return;
    }
    const activationLine = line + Math.min(96, window.innerHeight * .12);
    const current = destinations.filter(item => item.section.getBoundingClientRect().top <= activationLine).at(-1);
    const next = current?.link;
    if (next) { if (next !== active) select(next); }
    else if (destinations.length) {
      marker.hidden = true; active = null;
      links.forEach(link => link.removeAttribute('aria-current'));
    }
  }
  function scheduleNavigation() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateNavigation);
  }
  function measureHeader() {
    const top = parseFloat(getComputedStyle(header).top) || 0;
    document.documentElement.style.scrollPaddingTop = `${header.offsetHeight + top + 24}px`;
    if (active) select(active);
    scheduleNavigation();
  }
  // Keep the chosen destination active while smooth scrolling passes other sections.
  document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const destination = destinations.find(item => item.link.hash === link.hash);
    if (!destination) return;
    event.preventDefault();
    pending = {...destination, until: performance.now() + 1800};
    select(destination.link);
    if (location.hash !== link.hash) history.pushState(null, '', link.hash);
    const top = window.scrollY + destination.section.getBoundingClientRect().top - header.getBoundingClientRect().bottom - 24;
    window.scrollTo({top: Math.max(0, top), behavior: fluidMotion.matches ? 'instant' : 'smooth'});
  }));
  const interrupt = () => { pending = null; scheduleNavigation(); };
  window.addEventListener('wheel', interrupt, {passive:true});
  window.addEventListener('touchstart', interrupt, {passive:true});
  window.addEventListener('keydown', event => { if (['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key)) interrupt(); });
  window.addEventListener('scroll', scheduleNavigation, {passive:true});
  window.addEventListener('scrollend', () => { pending = null; scheduleNavigation(); });
  window.addEventListener('hashchange', scheduleNavigation);
  const current = links.find(a=>a.getAttribute('href').endsWith('projects.html') && (location.pathname.endsWith('projects.html') || location.pathname.includes('/projects/')));
  if (current) select(current); else marker.hidden = true;
  window.addEventListener('resize', measureHeader);
  if ('ResizeObserver' in window) new ResizeObserver(measureHeader).observe(header);
  document.fonts?.ready.then(measureHeader);
  measureHeader();

}

// Generated workflow symbols use the same outlines as navigation and sound controls.
for (const workflow of document.querySelectorAll('[data-workflow]')) {
  workflow.querySelectorAll('.workflow-panel').forEach((panel,index)=>{
    const node=panel.querySelector('.progress-node');if(node)node.innerHTML=window.portfolioIcon(['upload','search','check','arrow-up-right'][index%4]);
    const orb=panel.querySelector('.voice-orb');if(orb)orb.innerHTML=window.portfolioIcon(['upload','music','search','quote'][index%4]);
    const arrow=panel.querySelector('.invoice-sheet b');if(arrow)arrow.innerHTML=window.portfolioIcon('arrow-up-right');
  });
  const previous=workflow.querySelector('.workflow-prev');if(previous)previous.innerHTML=window.portfolioIcon('arrow-left');
}
