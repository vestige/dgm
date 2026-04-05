type PaletteName = "sunrise" | "ocean" | "neon" | "candy";
type PatternName = "petals" | "orbit" | "lattice" | "confetti";
type ViewMode = "full" | "scope";

interface Settings {
  preset: PatternName;
  palette: PaletteName;
  speed: number;
  density: number;
  size: number;
  trails: number;
  viewMode: ViewMode;
  lensSize: number;
  distance: number;
}

interface PatternDrawState {
  ctx: CanvasRenderingContext2D;
  seconds: number;
  width: number;
  height: number;
  colors: string[];
  density: number;
  size: number;
  speed: number;
}

interface Preset {
  label: string;
  palette: PaletteName;
  speed: number;
  density: number;
  size: number;
  trails: number;
  draw: (state: PatternDrawState) => void;
}

function getById<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLElement)) {
    throw new Error(`Element not found: ${id}`);
  }
  return element as T;
}

function getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("2D context is not available.");
  }
  return context;
}

function getPanelElement(): HTMLElement {
  const element = document.querySelector(".panel");
  if (!(element instanceof HTMLElement)) {
    throw new Error("Panel element not found.");
  }
  return element;
}

const displayCanvas = getById<HTMLCanvasElement>("pattern");
const displayCtx = getContext(displayCanvas);
const sceneCanvas = document.createElement("canvas");
const sceneCtx = getContext(sceneCanvas);

const settings: Settings = {
  preset: "petals",
  palette: "sunrise",
  speed: 1,
  density: 16,
  size: 1,
  trails: 0.12,
  viewMode: "scope",
  lensSize: 0.68,
  distance: 0.12,
};

const palettes: Record<PaletteName, string[]> = {
  sunrise: ["#ff6b6b", "#ffd166", "#f7fff7", "#4ecdc4"],
  ocean: ["#114b5f", "#1a936f", "#88d498", "#c6dabf"],
  neon: ["#fb5607", "#ff006e", "#8338ec", "#3a86ff"],
  candy: ["#ff99c8", "#fcf6bd", "#d0f4de", "#a9def9"],
};

const presets: Record<PatternName, Preset> = {
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
  preset: getById<HTMLSelectElement>("preset"),
  palette: getById<HTMLSelectElement>("palette"),
  speed: getById<HTMLInputElement>("speed"),
  density: getById<HTMLInputElement>("density"),
  size: getById<HTMLInputElement>("size"),
  trails: getById<HTMLInputElement>("trails"),
  viewMode: getById<HTMLSelectElement>("view-mode"),
  lensSize: getById<HTMLInputElement>("lens-size"),
  distance: getById<HTMLInputElement>("distance"),
};

const panel = getPanelElement();
const randomizeButton = getById<HTMLButtonElement>("randomize");
const togglePanelButton = getById<HTMLButtonElement>("toggle-panel");

let startTime = 0;

setupOptions();
applyPreset(settings.preset);
resizeCanvases();

window.addEventListener("resize", resizeCanvases);
window.addEventListener("keydown", handleKeydown);
randomizeButton.addEventListener("click", randomizeSettings);
togglePanelButton.addEventListener("click", togglePanel);

controls.preset.addEventListener("input", () => {
  applyPreset(controls.preset.value as PatternName);
});
controls.palette.addEventListener("input", () => {
  settings.palette = controls.palette.value as PaletteName;
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
controls.viewMode.addEventListener("input", () => {
  settings.viewMode = controls.viewMode.value as ViewMode;
});
controls.lensSize.addEventListener("input", () => {
  settings.lensSize = Number(controls.lensSize.value);
});
controls.distance.addEventListener("input", () => {
  settings.distance = Number(controls.distance.value);
});

startTime = performance.now();
requestAnimationFrame(render);

function setupOptions(): void {
  for (const [key, preset] of Object.entries(presets) as [PatternName, Preset][]) {
    controls.preset.add(new Option(preset.label, key));
  }

  for (const key of Object.keys(palettes) as PaletteName[]) {
    controls.palette.add(new Option(key, key));
  }
}

function applyPreset(name: PatternName): void {
  const preset = presets[name];
  settings.preset = name;
  settings.palette = preset.palette;
  settings.speed = preset.speed;
  settings.density = preset.density;
  settings.size = preset.size;
  settings.trails = preset.trails;
  syncControls();
}

function syncControls(): void {
  controls.preset.value = settings.preset;
  controls.palette.value = settings.palette;
  controls.speed.value = String(settings.speed);
  controls.density.value = String(settings.density);
  controls.size.value = String(settings.size);
  controls.trails.value = String(settings.trails);
  controls.viewMode.value = settings.viewMode;
  controls.lensSize.value = String(settings.lensSize);
  controls.distance.value = String(settings.distance);
}

function resizeCanvases(): void {
  const ratio = window.devicePixelRatio || 1;
  const width = Math.floor(window.innerWidth * ratio);
  const height = Math.floor(window.innerHeight * ratio);

  displayCanvas.width = width;
  displayCanvas.height = height;
  displayCanvas.style.width = `${window.innerWidth}px`;
  displayCanvas.style.height = `${window.innerHeight}px`;
  displayCtx.setTransform(ratio, 0, 0, ratio, 0, 0);

  sceneCanvas.width = width;
  sceneCanvas.height = height;
  sceneCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key.toLowerCase() === "h") {
    togglePanel();
  }

  if (event.key.toLowerCase() === "f") {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen().catch(() => {});
    } else {
      void document.exitFullscreen().catch(() => {});
    }
  }
}

function togglePanel(): void {
  panel.classList.toggle("is-hidden");
  togglePanelButton.textContent = panel.classList.contains("is-hidden")
    ? "パネルを表示"
    : "パネルを隠す";
}

function randomizeSettings(): void {
  const presetNames = Object.keys(presets) as PatternName[];
  const paletteNames = Object.keys(palettes) as PaletteName[];

  settings.preset = presetNames[Math.floor(Math.random() * presetNames.length)];
  settings.palette = paletteNames[Math.floor(Math.random() * paletteNames.length)];
  settings.speed = randomBetween(0.5, 2.1, 1);
  settings.density = Math.floor(randomBetween(8, 24));
  settings.size = randomBetween(0.6, 1.6, 1);
  settings.trails = randomBetween(0.05, 0.2, 2);
  settings.viewMode = Math.random() > 0.3 ? "scope" : "full";
  settings.lensSize = randomBetween(0.52, 0.86, 2);
  settings.distance = randomBetween(0.02, 0.48, 2);
  syncControls();
}

function render(now: number): void {
  const seconds = (now - startTime) / 1000;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const colors = palettes[settings.palette];

  paintBackdrop(sceneCtx, width, height, settings.trails, colors);
  presets[settings.preset].draw({
    ctx: sceneCtx,
    seconds,
    width,
    height,
    colors,
    density: settings.density,
    size: settings.size,
    speed: settings.speed,
  });

  composeDisplay(width, height);
  requestAnimationFrame(render);
}

function composeDisplay(width: number, height: number): void {
  displayCtx.clearRect(0, 0, width, height);
  displayCtx.drawImage(sceneCanvas, 0, 0, width, height);

  if (settings.viewMode === "full") {
    return;
  }

  const radius = Math.min(width, height) * settings.lensSize * 0.5;
  const blurAmount = settings.distance * 18;
  const cx = width / 2;
  const cy = height / 2;

  if (blurAmount > 0.05) {
    displayCtx.save();
    displayCtx.beginPath();
    displayCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    displayCtx.clip();
    displayCtx.filter = `blur(${blurAmount}px)`;
    displayCtx.drawImage(sceneCanvas, 0, 0, width, height);
    displayCtx.restore();
  }

  const fade = displayCtx.createRadialGradient(cx, cy, radius * 0.82, cx, cy, radius * 1.16);
  fade.addColorStop(0, "rgba(0, 0, 0, 0)");
  fade.addColorStop(0.72, "rgba(0, 0, 0, 0)");
  fade.addColorStop(1, `rgba(2, 6, 12, ${0.82 + settings.distance * 0.12})`);
  displayCtx.fillStyle = fade;
  displayCtx.fillRect(0, 0, width, height);

  displayCtx.save();
  displayCtx.fillStyle = `rgba(2, 6, 12, ${0.8 + settings.distance * 0.1})`;
  displayCtx.beginPath();
  displayCtx.rect(0, 0, width, height);
  displayCtx.arc(cx, cy, radius, 0, Math.PI * 2, true);
  displayCtx.fill("evenodd");
  displayCtx.restore();

  displayCtx.save();
  displayCtx.beginPath();
  displayCtx.arc(cx, cy, radius, 0, Math.PI * 2);
  displayCtx.strokeStyle = `rgba(255, 255, 255, ${0.34 + settings.distance * 0.14})`;
  displayCtx.lineWidth = 3 + settings.distance * 10;
  displayCtx.shadowBlur = 24;
  displayCtx.shadowColor = "rgba(255, 214, 122, 0.5)";
  displayCtx.stroke();
  displayCtx.restore();

  displayCtx.save();
  displayCtx.beginPath();
  displayCtx.arc(cx, cy, radius * 0.08, 0, Math.PI * 2);
  displayCtx.fillStyle = "rgba(255, 255, 255, 0.08)";
  displayCtx.fill();
  displayCtx.restore();
}

function paintBackdrop(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  alpha: number,
  colors: string[],
): void {
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

function drawPetals({ ctx, seconds, width, height, colors, density, size, speed }: PatternDrawState): void {
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

    for (let index = 0; index < petals; index += 1) {
      const angle = (Math.PI * 2 * index) / petals + seconds * speed * 0.18;
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(radius, 0, petalLength, petalLength * 0.34, 0, 0, Math.PI * 2);
      ctx.fillStyle = `${colors[(index + ring) % colors.length]}88`;
      ctx.shadowBlur = 24;
      ctx.shadowColor = colors[(index + ring + 1) % colors.length];
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();
}

function drawOrbit({ ctx, seconds, width, height, colors, density, size, speed }: PatternDrawState): void {
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

    for (let index = 0; index < points; index += 1) {
      const angle = seconds * speed * (0.6 + ring * 0.04) + (Math.PI * 2 * index) / points;
      const x = Math.cos(angle * (1 + wobble * 0.2)) * orbit;
      const y = Math.sin(angle * (1.5 + wobble * 0.1)) * orbit;
      const radius = (8 + ring * 1.6) * size;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `${colors[(index + ring) % colors.length]}bb`;
      ctx.shadowBlur = 28;
      ctx.shadowColor = colors[(index + 1) % colors.length];
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawLattice({ ctx, seconds, width, height, colors, density, size, speed }: PatternDrawState): void {
  const columns = density;
  const rows = Math.floor((density * height) / width) + 4;
  const cell = Math.max(width / columns, height / rows);

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(seconds * speed * 0.08);
  ctx.translate(-width / 2, -height / 2);
  ctx.globalCompositeOperation = "screen";

  for (let row = -2; row < rows + 2; row += 1) {
    for (let column = -2; column < columns + 2; column += 1) {
      const px = column * cell;
      const py = row * cell;
      const wave = Math.sin(seconds * speed * 2 + column * 0.8 + row * 0.4);
      const radius = cell * 0.18 * size * (1 + wave * 0.6);

      ctx.beginPath();
      ctx.moveTo(px + cell / 2, py + radius);
      ctx.lineTo(px + cell - radius, py + cell / 2);
      ctx.lineTo(px + cell / 2, py + cell - radius);
      ctx.lineTo(px + radius, py + cell / 2);
      ctx.closePath();
      ctx.fillStyle = `${colors[(column + row + colors.length * 20) % colors.length]}88`;
      ctx.shadowBlur = 18;
      ctx.shadowColor = colors[(column + row + 1 + colors.length * 20) % colors.length];
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawConfetti({ ctx, seconds, width, height, colors, density, size, speed }: PatternDrawState): void {
  const total = density * 10;
  const scale = Math.min(width, height) * 0.012 * size;

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.globalCompositeOperation = "lighter";

  for (let index = 0; index < total; index += 1) {
    const angle = index * 0.6 + seconds * speed;
    const spiral = 20 + index * scale;
    const x = Math.cos(angle * 0.9) * spiral + Math.sin(angle * 2.1) * 60;
    const y = Math.sin(angle * 1.2) * spiral + Math.cos(angle * 1.3) * 60;
    const w = (8 + (index % 8) * 2) * size;
    const h = (18 + (index % 5) * 4) * size;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle * 1.4);
    ctx.fillStyle = `${colors[index % colors.length]}aa`;
    ctx.shadowBlur = 22;
    ctx.shadowColor = colors[(index + 1) % colors.length];
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore();
  }

  ctx.restore();
}

function randomBetween(min: number, max: number, digits = 0): number {
  const value = min + Math.random() * (max - min);
  return Number(value.toFixed(digits));
}
