const canvas = document.getElementById("pattern");
const ctx = canvas.getContext("2d");

const settings = {
  preset: "petals",
  palette: "sunrise",
  speed: 1,
  density: 16,
  size: 1,
  trails: 0.12,
};

const palettes = {
  sunrise: ["#ff6b6b", "#ffd166", "#f7fff7", "#4ecdc4"],
  ocean: ["#114b5f", "#1a936f", "#88d498", "#c6dabf"],
  neon: ["#fb5607", "#ff006e", "#8338ec", "#3a86ff"],
  candy: ["#ff99c8", "#fcf6bd", "#d0f4de", "#a9def9"],
};

const presets = {
  petals: {
    label: "花びら",
    palette: "sunrise",
    speed: 1,
    density: 16,
    size: 1,
    trails: 0.12,
    draw: drawPetals,
  },
  orbit: {
    label: "軌道",
    palette: "neon",
    speed: 1.3,
    density: 12,
    size: 0.9,
    trails: 0.09,
    draw: drawOrbit,
  },
  lattice: {
    label: "格子波",
    palette: "ocean",
    speed: 0.7,
    density: 18,
    size: 1.2,
    trails: 0.17,
    draw: drawLattice,
  },
  confetti: {
    label: "紙ふぶき",
    palette: "candy",
    speed: 1.4,
    density: 20,
    size: 0.8,
    trails: 0.08,
    draw: drawConfetti,
  },
};

const controls = {
  preset: document.getElementById("preset"),
  palette: document.getElementById("palette"),
  speed: document.getElementById("speed"),
  density: document.getElementById("density"),
  size: document.getElementById("size"),
  trails: document.getElementById("trails"),
};

const panel = document.querySelector(".panel");
const randomizeButton = document.getElementById("randomize");
const togglePanelButton = document.getElementById("toggle-panel");

let animationId = 0;
let startTime = 0;

setupOptions();
applyPreset(settings.preset);
resizeCanvas();
window.addEventListener("resize", resizeCanvas);
window.addEventListener("keydown", handleKeydown);
randomizeButton.addEventListener("click", randomizeSettings);
togglePanelButton.addEventListener("click", togglePanel);
controls.preset.addEventListener("input", () => applyPreset(controls.preset.value));
controls.palette.addEventListener("input", () => {
  settings.palette = controls.palette.value;
});
controls.speed.addEventListener("input", () => {
  settings.speed = Number(controls.speed.value);
});
controls.density.addEventListener("input", () => {
  settings.density = Number(controls.density.value);
});
controls.size.addEventListener("input", () => {
  settings.size = Number(controls.size.value);
});
controls.trails.addEventListener("input", () => {
  settings.trails = Number(controls.trails.value);
});

startTime = performance.now();
animationId = requestAnimationFrame(render);

function setupOptions() {
  for (const [key, preset] of Object.entries(presets)) {
    controls.preset.add(new Option(preset.label, key));
  }

  for (const key of Object.keys(palettes)) {
    controls.palette.add(new Option(key, key));
  }
}

function applyPreset(name) {
  const preset = presets[name];
  if (!preset) {
    return;
  }

  settings.preset = name;
  settings.palette = preset.palette;
  settings.speed = preset.speed;
  settings.density = preset.density;
  settings.size = preset.size;
  settings.trails = preset.trails;
  syncControls();
}

function syncControls() {
  for (const [key, input] of Object.entries(controls)) {
    input.value = settings[key];
  }
}

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * ratio);
  canvas.height = Math.floor(window.innerHeight * ratio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function handleKeydown(event) {
  if (event.key.toLowerCase() === "h") {
    togglePanel();
  }

  if (event.key.toLowerCase() === "f") {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }
}

function togglePanel() {
  panel.classList.toggle("is-hidden");
  togglePanelButton.textContent = panel.classList.contains("is-hidden")
    ? "パネルを表示"
    : "パネルを隠す";
}

function randomizeSettings() {
  const presetNames = Object.keys(presets);
  const paletteNames = Object.keys(palettes);

  settings.preset = presetNames[Math.floor(Math.random() * presetNames.length)];
  settings.palette = paletteNames[Math.floor(Math.random() * paletteNames.length)];
  settings.speed = randomBetween(0.5, 2.1, 1);
  settings.density = Math.floor(randomBetween(8, 24));
  settings.size = randomBetween(0.6, 1.6, 1);
  settings.trails = randomBetween(0.05, 0.2, 2);
  syncControls();
}

function render(now) {
  const seconds = (now - startTime) / 1000;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const colors = palettes[settings.palette];

  paintBackdrop(width, height, settings.trails, colors);
  presets[settings.preset].draw({
    seconds,
    width,
    height,
    colors,
    density: settings.density,
    size: settings.size,
    speed: settings.speed,
  });

  animationId = requestAnimationFrame(render);
}

function paintBackdrop(width, height, alpha, colors) {
  ctx.save();
  ctx.fillStyle = `rgba(2, 6, 12, ${alpha})`;
  ctx.fillRect(0, 0, width, height);

  const gradient = ctx.createRadialGradient(
    width * 0.5,
    height * 0.5,
    width * 0.08,
    width * 0.5,
    height * 0.5,
    width * 0.65,
  );
  gradient.addColorStop(0, `${colors[0]}40`);
  gradient.addColorStop(0.45, `${colors[1]}18`);
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawPetals({ seconds, width, height, colors, density, size, speed }) {
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.min(width, height) * 0.42 * size;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalCompositeOperation = "screen";

  for (let ring = 0; ring < density; ring += 1) {
    const base = ring / density;
    const petals = 6 + (ring % 6);
    const radius = maxRadius * base;
    const pulse = 0.8 + 0.25 * Math.sin(seconds * speed * 1.7 + ring);
    const petalLength = (36 + ring * 4) * size * pulse;

    for (let i = 0; i < petals; i += 1) {
      const angle = (Math.PI * 2 * i) / petals + seconds * speed * 0.18;
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(radius, 0, petalLength, petalLength * 0.34, 0, 0, Math.PI * 2);
      ctx.fillStyle = `${colors[(i + ring) % colors.length]}88`;
      ctx.shadowBlur = 24;
      ctx.shadowColor = colors[(i + ring + 1) % colors.length];
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();
}

function drawOrbit({ seconds, width, height, colors, density, size, speed }) {
  const cx = width / 2;
  const cy = height / 2;
  const orbitRadius = Math.min(width, height) * 0.35 * size;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalCompositeOperation = "lighter";

  for (let ring = 0; ring < density; ring += 1) {
    const orbit = orbitRadius * (0.24 + ring / density);
    const points = 5 + ring;
    const wobble = 0.4 + ring * 0.05;

    for (let i = 0; i < points; i += 1) {
      const angle = seconds * speed * (0.6 + ring * 0.04) + (Math.PI * 2 * i) / points;
      const x = Math.cos(angle * (1 + wobble * 0.2)) * orbit;
      const y = Math.sin(angle * (1.5 + wobble * 0.1)) * orbit;
      const radius = (8 + ring * 1.6) * size;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `${colors[(i + ring) % colors.length]}bb`;
      ctx.shadowBlur = 28;
      ctx.shadowColor = colors[(i + 1) % colors.length];
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawLattice({ seconds, width, height, colors, density, size, speed }) {
  const columns = density;
  const rows = Math.floor((density * height) / width) + 4;
  const cell = Math.max(width / columns, height / rows);

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(seconds * speed * 0.08);
  ctx.translate(-width / 2, -height / 2);
  ctx.globalCompositeOperation = "screen";

  for (let y = -2; y < rows + 2; y += 1) {
    for (let x = -2; x < columns + 2; x += 1) {
      const px = x * cell;
      const py = y * cell;
      const wave = Math.sin(seconds * speed * 2 + x * 0.8 + y * 0.4);
      const radius = cell * 0.18 * size * (1 + wave * 0.6);

      ctx.beginPath();
      ctx.moveTo(px + cell / 2, py + radius);
      ctx.lineTo(px + cell - radius, py + cell / 2);
      ctx.lineTo(px + cell / 2, py + cell - radius);
      ctx.lineTo(px + radius, py + cell / 2);
      ctx.closePath();
      ctx.fillStyle = `${colors[(x + y + colors.length * 20) % colors.length]}88`;
      ctx.shadowBlur = 18;
      ctx.shadowColor = colors[(x + y + 1 + colors.length * 20) % colors.length];
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawConfetti({ seconds, width, height, colors, density, size, speed }) {
  const total = density * 10;
  const scale = Math.min(width, height) * 0.012 * size;

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.globalCompositeOperation = "lighter";

  for (let i = 0; i < total; i += 1) {
    const angle = i * 0.6 + seconds * speed;
    const spiral = 20 + i * scale;
    const x = Math.cos(angle * 0.9) * spiral + Math.sin(angle * 2.1) * 60;
    const y = Math.sin(angle * 1.2) * spiral + Math.cos(angle * 1.3) * 60;
    const w = (8 + (i % 8) * 2) * size;
    const h = (18 + (i % 5) * 4) * size;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle * 1.4);
    ctx.fillStyle = `${colors[i % colors.length]}aa`;
    ctx.shadowBlur = 22;
    ctx.shadowColor = colors[(i + 1) % colors.length];
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore();
  }

  ctx.restore();
}

function randomBetween(min, max, digits = 0) {
  const value = min + Math.random() * (max - min);
  return Number(value.toFixed(digits));
}
