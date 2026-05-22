const revealItems = document.querySelectorAll(".reveal");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (prefersReducedMotion) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

const canvas = document.querySelector("#signal-canvas");
const context = canvas ? canvas.getContext("2d") : null;
let width = 0;
let height = 0;
let animationFrame = 0;
let pointerX = 0.72;
let pointerY = 0.34;

const nodes = Array.from({ length: 42 }, (_, index) => ({
  x: (index * 97) % 100,
  y: (index * 53) % 100,
  speed: 0.18 + (index % 7) * 0.035,
  phase: index * 0.75,
}));

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = canvas.clientWidth;
  height = canvas.clientHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawSignal(time) {
  context.clearRect(0, 0, width, height);
  context.lineWidth = 1;

  nodes.forEach((node, index) => {
    const driftX = Math.sin(time * node.speed + node.phase) * 42;
    const driftY = Math.cos(time * node.speed * 0.8 + node.phase) * 32;
    const x = (node.x / 100) * width + driftX + (pointerX - 0.5) * 36;
    const y = (node.y / 100) * height + driftY + (pointerY - 0.5) * 28;

    context.fillStyle = index % 5 === 0 ? "#c8ff3d" : index % 3 === 0 ? "#ff5f48" : "#f7f4ec";
    context.fillRect(x, y, index % 5 === 0 ? 7 : 4, index % 5 === 0 ? 7 : 4);

    if (index > 0) {
      const previous = nodes[index - 1];
      const px = (previous.x / 100) * width + Math.sin(time * previous.speed + previous.phase) * 42;
      const py = (previous.y / 100) * height + Math.cos(time * previous.speed * 0.8 + previous.phase) * 32;
      const distance = Math.hypot(x - px, y - py);

      if (distance < 260) {
        context.strokeStyle = `rgba(247, 244, 236, ${Math.max(0.06, 0.28 - distance / 900)})`;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(px, py);
        context.stroke();
      }
    }
  });

  context.strokeStyle = "rgba(31, 84, 255, 0.78)";
  context.lineWidth = 2;
  for (let row = 0; row < 4; row += 1) {
    context.beginPath();
    for (let x = 0; x <= width; x += 18) {
      const y = height * (0.18 + row * 0.18) + Math.sin(x * 0.012 + time * 1.4 + row) * 18;
      if (x === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();
  }

  animationFrame = requestAnimationFrame((nextTime) => drawSignal(nextTime / 1000));
}

function startCanvas() {
  resizeCanvas();
  if (!prefersReducedMotion) {
    animationFrame = requestAnimationFrame((time) => drawSignal(time / 1000));
  } else {
    drawSignal(0);
    cancelAnimationFrame(animationFrame);
  }
}

if (context) {
  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("pointermove", (event) => {
    pointerX = event.clientX / Math.max(window.innerWidth, 1);
    pointerY = event.clientY / Math.max(window.innerHeight, 1);
  });

  startCanvas();
}
