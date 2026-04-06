"use strict";
const MIRROR_SECTORS = 12;
const VIEW_MOVE_SPEED = 0.58;
const VIEW_EASING = 10;
const VIEW_RANGE = 0.34;
function getById(id) {
    const element = document.getElementById(id);
    if (!(element instanceof HTMLElement)) {
        throw new Error(`Element not found: ${id}`);
    }
    return element;
}
function getContext(canvas) {
    const context = canvas.getContext("2d");
    if (!context) {
        throw new Error("2D context is not available.");
    }
    return context;
}
function getPanelElement() {
    const element = document.querySelector(".panel");
    if (!(element instanceof HTMLElement)) {
        throw new Error("Panel element not found.");
    }
    return element;
}
const displayCanvas = getById("pattern");
const displayCtx = getContext(displayCanvas);
const sceneCanvas = document.createElement("canvas");
const sceneCtx = getContext(sceneCanvas);
const settings = {
    preset: "softKaleido",
    palette: "sunrise",
    speed: 1,
    density: 16,
    size: 1,
    trails: 0.12,
    viewMode: "mirrorSoft",
    lensSize: 0.72,
    distance: 0.14,
};
const viewOffset = {
    homeX: 0,
    homeY: 0,
    currentX: 0,
    currentY: 0,
    targetX: 0,
    targetY: 0,
};
const pressedKeys = new Set();
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
    softKaleido: {
        label: "やわらか万華鏡",
        palette: "sunrise",
        speed: 0.8,
        density: 18,
        size: 1.1,
        trails: 0.16,
        viewMode: "mirrorSoft",
        lensSize: 0.78,
        distance: 0.22,
        draw: drawPetals,
    },
};
const controls = {
    preset: getById("preset"),
    palette: getById("palette"),
    speed: getById("speed"),
    density: getById("density"),
    size: getById("size"),
    trails: getById("trails"),
    viewMode: getById("view-mode"),
    lensSize: getById("lens-size"),
    distance: getById("distance"),
};
const panel = getPanelElement();
const randomizeButton = getById("randomize");
const togglePanelButton = getById("toggle-panel");
const offsetReadout = getById("offset-readout");
let startTime = 0;
let lastFrameTime = 0;
setupOptions();
applyPreset(settings.preset);
resizeCanvases();
updateOffsetReadout();
window.addEventListener("resize", resizeCanvases);
window.addEventListener("keydown", handleKeydown);
window.addEventListener("keyup", handleKeyup);
window.addEventListener("blur", clearMovementKeys);
randomizeButton.addEventListener("click", randomizeSettings);
togglePanelButton.addEventListener("click", togglePanel);
controls.preset.addEventListener("input", () => {
    applyPreset(controls.preset.value);
});
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
controls.viewMode.addEventListener("input", () => {
    settings.viewMode = controls.viewMode.value;
});
controls.lensSize.addEventListener("input", () => {
    settings.lensSize = Number(controls.lensSize.value);
});
controls.distance.addEventListener("input", () => {
    settings.distance = Number(controls.distance.value);
});
startTime = performance.now();
lastFrameTime = startTime;
requestAnimationFrame(render);
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
    settings.preset = name;
    settings.palette = preset.palette;
    settings.speed = preset.speed;
    settings.density = preset.density;
    settings.size = preset.size;
    settings.trails = preset.trails;
    settings.viewMode = preset.viewMode ?? settings.viewMode;
    settings.lensSize = preset.lensSize ?? settings.lensSize;
    settings.distance = preset.distance ?? settings.distance;
    syncControls();
}
function syncControls() {
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
function resizeCanvases() {
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
function handleKeydown(event) {
    const key = event.key;
    if (isArrowKey(key)) {
        pressedKeys.add(key);
        event.preventDefault();
        return;
    }
    if (key.toLowerCase() === "r" || key.toLowerCase() === "c") {
        resetViewOffset();
        return;
    }
    if (key.toLowerCase() === "h") {
        togglePanel();
    }
    if (key.toLowerCase() === "f") {
        if (!document.fullscreenElement) {
            void document.documentElement.requestFullscreen().catch(() => { });
        }
        else {
            void document.exitFullscreen().catch(() => { });
        }
    }
}
function handleKeyup(event) {
    if (isArrowKey(event.key)) {
        pressedKeys.delete(event.key);
    }
}
function clearMovementKeys() {
    pressedKeys.clear();
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
    const viewModes = ["mirrorSoft", "mirror", "scope", "full"];
    settings.preset = presetNames[Math.floor(Math.random() * presetNames.length)];
    settings.palette = paletteNames[Math.floor(Math.random() * paletteNames.length)];
    settings.speed = randomBetween(0.5, 2.1, 1);
    settings.density = Math.floor(randomBetween(8, 24));
    settings.size = randomBetween(0.6, 1.6, 1);
    settings.trails = randomBetween(0.05, 0.2, 2);
    settings.viewMode = viewModes[Math.floor(Math.random() * viewModes.length)];
    settings.lensSize = randomBetween(0.52, 0.86, 2);
    settings.distance = randomBetween(0.02, 0.48, 2);
    syncControls();
}
function render(now) {
    const seconds = (now - startTime) / 1000;
    const deltaSeconds = (now - lastFrameTime) / 1000;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const colors = palettes[settings.palette];
    lastFrameTime = now;
    updateViewOffset(deltaSeconds, width, height);
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
    composeDisplay(width, height, seconds);
    requestAnimationFrame(render);
}
function updateViewOffset(deltaSeconds, width, height) {
    const moveAmount = Math.min(width, height) * VIEW_MOVE_SPEED * deltaSeconds;
    const maxX = width * VIEW_RANGE;
    const maxY = height * VIEW_RANGE;
    if (pressedKeys.has("ArrowLeft")) {
        viewOffset.targetX -= moveAmount;
    }
    if (pressedKeys.has("ArrowRight")) {
        viewOffset.targetX += moveAmount;
    }
    if (pressedKeys.has("ArrowUp")) {
        viewOffset.targetY -= moveAmount;
    }
    if (pressedKeys.has("ArrowDown")) {
        viewOffset.targetY += moveAmount;
    }
    viewOffset.targetX = clamp(viewOffset.targetX, -maxX, maxX);
    viewOffset.targetY = clamp(viewOffset.targetY, -maxY, maxY);
    const easing = Math.min(1, deltaSeconds * VIEW_EASING);
    viewOffset.currentX += (viewOffset.targetX - viewOffset.currentX) * easing;
    viewOffset.currentY += (viewOffset.targetY - viewOffset.currentY) * easing;
    updateOffsetReadout();
}
function updateOffsetReadout() {
    offsetReadout.textContent = `x ${Math.round(viewOffset.targetX)}, y ${Math.round(viewOffset.targetY)}`;
}
function resetViewOffset() {
    viewOffset.currentX = viewOffset.homeX;
    viewOffset.currentY = viewOffset.homeY;
    viewOffset.targetX = viewOffset.homeX;
    viewOffset.targetY = viewOffset.homeY;
    updateOffsetReadout();
}
function composeDisplay(width, height, seconds) {
    displayCtx.clearRect(0, 0, width, height);
    if (settings.viewMode === "full") {
        displayCtx.drawImage(sceneCanvas, 0, 0, width, height);
        return;
    }
    if (settings.viewMode === "scope") {
        composeScopeDisplay(width, height);
        return;
    }
    if (settings.viewMode === "mirrorSoft") {
        composeMirrorSoftDisplay(width, height, seconds);
        return;
    }
    composeMirrorDisplay(width, height, seconds);
}
function composeScopeDisplay(width, height) {
    const radius = Math.min(width, height) * settings.lensSize * 0.5;
    const distanceRatio = clamp(settings.distance / 0.8, 0, 1);
    const blurAmount = Math.pow(distanceRatio, 1.7) * (16 + radius * 0.08);
    const cx = width / 2;
    const cy = height / 2;
    displayCtx.drawImage(sceneCanvas, 0, 0, width, height);
    if (blurAmount > 0.05) {
        displayCtx.save();
        displayCtx.beginPath();
        displayCtx.arc(cx, cy, radius, 0, Math.PI * 2);
        displayCtx.clip();
        displayCtx.filter = `blur(${blurAmount}px)`;
        displayCtx.drawImage(sceneCanvas, 0, 0, width, height);
        displayCtx.restore();
    }
    paintOuterMatte(width, height, radius, cx, cy, 0.8 + distanceRatio * 0.12);
    paintCircularRim(radius, cx, cy, 3 + distanceRatio * 10, 0.34 + distanceRatio * 0.18);
    displayCtx.save();
    displayCtx.beginPath();
    displayCtx.arc(cx, cy, radius * 0.08, 0, Math.PI * 2);
    displayCtx.fillStyle = "rgba(255, 255, 255, 0.08)";
    displayCtx.fill();
    displayCtx.restore();
}
function composeMirrorDisplay(width, height, seconds) {
    const radius = Math.min(width, height) * settings.lensSize * 0.5;
    const distanceRatio = clamp(settings.distance / 0.8, 0, 1);
    const blurAmount = Math.pow(distanceRatio, 1.5) * (10 + radius * 0.05);
    const sourceScaleBase = 0.82 + distanceRatio * 0.2;
    const cx = width / 2;
    const cy = height / 2;
    const sectorAngle = (Math.PI * 2) / MIRROR_SECTORS;
    const halfSectorAngle = sectorAngle / 2;
    const baseAngle = -Math.PI / 2 + seconds * settings.speed * 0.05;
    const ringCount = Math.max(6, Math.round(settings.density * 0.45));
    const ringStep = radius / ringCount;
    displayCtx.save();
    displayCtx.fillStyle = "rgba(2, 6, 12, 0.98)";
    displayCtx.fillRect(0, 0, width, height);
    displayCtx.restore();
    displayCtx.save();
    displayCtx.beginPath();
    displayCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    displayCtx.clip();
    const well = displayCtx.createRadialGradient(cx, cy, radius * 0.18, cx, cy, radius * 1.05);
    well.addColorStop(0, "rgba(255, 255, 255, 0.05)");
    well.addColorStop(0.65, "rgba(20, 36, 56, 0.14)");
    well.addColorStop(1, "rgba(0, 0, 0, 0.3)");
    displayCtx.fillStyle = well;
    displayCtx.fillRect(0, 0, width, height);
    for (let ring = 0; ring < ringCount; ring += 1) {
        const ringRatio = ring / Math.max(1, ringCount - 1);
        const innerRadius = ring * ringStep;
        const outerRadius = Math.min(radius, innerRadius + ringStep * 1.22);
        const ringBlur = blurAmount * (0.18 + ringRatio * 0.92);
        const ringScale = sourceScaleBase + ringRatio * 0.72;
        const ringTwist = baseAngle + ringRatio * 0.5 + Math.sin(seconds * 0.4 + ring * 0.7) * 0.08;
        const radialShift = (seconds * settings.speed * (26 + ring * 4) + ring * ringStep * 1.8) % (radius * 0.95) - radius * 0.48;
        const tangentialShift = Math.sin(seconds * 0.9 + ring * 0.8) * radius * 0.08;
        const offsetScale = 0.45 + ringRatio * 1.05;
        for (let sector = 0; sector < MIRROR_SECTORS; sector += 1) {
            displayCtx.save();
            displayCtx.translate(cx, cy);
            displayCtx.rotate(ringTwist + sector * sectorAngle);
            clipRingSector(displayCtx, innerRadius, outerRadius, halfSectorAngle);
            if (sector % 2 === 1) {
                displayCtx.scale(-1, 1);
            }
            const breathing = 1 + Math.sin(seconds * 0.7 + ring * 0.9 + sector * 0.18) * 0.045;
            displayCtx.translate(tangentialShift + ringRatio * radius * 0.05, 0);
            displayCtx.scale(ringScale * breathing, ringScale * breathing);
            displayCtx.rotate(Math.sin(seconds * 0.3 + ring * 0.35) * 0.05);
            displayCtx.globalAlpha = 0.95 - ringRatio * 0.18;
            if (ringBlur > 0.05) {
                displayCtx.filter =
                    `blur(${ringBlur}px) saturate(${1.08 - ringRatio * 0.16}) brightness(${1.04 - distanceRatio * 0.1})`;
            }
            displayCtx.drawImage(sceneCanvas, -width / 2 - viewOffset.currentX * offsetScale, -height / 2 - viewOffset.currentY * offsetScale - radialShift, width, height);
            displayCtx.restore();
        }
    }
    displayCtx.restore();
    paintOuterMatte(width, height, radius, cx, cy, 0.86 + distanceRatio * 0.1);
    paintMirrorRings(radius, cx, cy, ringCount);
    paintMirrorSeams(radius, cx, cy, baseAngle, sectorAngle);
    paintCircularRim(radius, cx, cy, 5 + distanceRatio * 10, 0.42 + distanceRatio * 0.2);
    displayCtx.save();
    displayCtx.beginPath();
    displayCtx.arc(cx, cy, radius * 0.93, -2.35, -1.2);
    displayCtx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    displayCtx.lineWidth = Math.max(4, radius * 0.03);
    displayCtx.stroke();
    displayCtx.restore();
}
function composeMirrorSoftDisplay(width, height, seconds) {
    const radius = Math.min(width, height) * settings.lensSize * 0.5;
    const distanceRatio = clamp(settings.distance / 0.8, 0, 1);
    const cx = width / 2;
    const cy = height / 2;
    const sectorAngle = (Math.PI * 2) / MIRROR_SECTORS;
    const halfSectorAngle = sectorAngle / 2;
    const baseAngle = -Math.PI / 2 + Math.sin(seconds * 0.18) * 0.06;
    const layerCount = 5;
    const driftRadius = radius * (0.05 + settings.size * 0.014);
    const blurBase = 0.8 + Math.pow(distanceRatio, 1.65) * (7 + radius * 0.032);
    const scaleBase = 1.01 + distanceRatio * 0.08;
    displayCtx.save();
    displayCtx.fillStyle = "rgba(2, 6, 12, 0.98)";
    displayCtx.fillRect(0, 0, width, height);
    displayCtx.restore();
    displayCtx.save();
    displayCtx.beginPath();
    displayCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    displayCtx.clip();
    const well = displayCtx.createRadialGradient(cx, cy, radius * 0.08, cx, cy, radius * 1.08);
    well.addColorStop(0, "rgba(255, 255, 255, 0.07)");
    well.addColorStop(0.42, "rgba(70, 110, 160, 0.08)");
    well.addColorStop(1, "rgba(0, 0, 0, 0.32)");
    displayCtx.fillStyle = well;
    displayCtx.fillRect(0, 0, width, height);
    for (let layer = 0; layer < layerCount; layer += 1) {
        const layerRatio = layer / Math.max(1, layerCount - 1);
        const driftX = (Math.sin(seconds * (0.24 + layer * 0.04) + layer * 1.1) +
            Math.sin(seconds * (0.52 + layer * 0.02) + 0.9)) *
            driftRadius *
            (0.2 + layerRatio * 0.3);
        const driftY = (Math.cos(seconds * (0.2 + layer * 0.05) + layer * 1.4) +
            Math.sin(seconds * (0.41 + layer * 0.03) + 1.7)) *
            driftRadius *
            (0.18 + layerRatio * 0.26);
        const layerRotation = Math.sin(seconds * (0.13 + layer * 0.02) + layer * 0.7) * 0.04 +
            Math.cos(seconds * 0.16 + layer) * 0.018;
        const layerScale = scaleBase + layerRatio * 0.1 + Math.sin(seconds * 0.38 + layer * 0.6) * 0.015;
        const layerBlur = blurBase * (0.55 + layerRatio * 0.55);
        const layerAlpha = 0.34 - layerRatio * 0.05;
        const layerBreath = 1 + Math.sin(seconds * 0.34 + layer * 0.85) * 0.03;
        const offsetScale = 0.7 + layerRatio * 0.4;
        displayCtx.globalCompositeOperation = layer === 0 ? "source-over" : "screen";
        for (let sector = 0; sector < MIRROR_SECTORS; sector += 1) {
            displayCtx.save();
            displayCtx.translate(cx, cy);
            displayCtx.rotate(baseAngle + sector * sectorAngle + layerRotation);
            clipSector(displayCtx, radius, halfSectorAngle);
            if (sector % 2 === 1) {
                displayCtx.scale(-1, 1);
            }
            displayCtx.scale(layerScale * layerBreath, layerScale * layerBreath);
            displayCtx.globalAlpha = layerAlpha;
            if (layerBlur > 0.05) {
                displayCtx.filter =
                    `blur(${layerBlur}px) saturate(${1.06 - distanceRatio * 0.08}) brightness(${1.02 - layerRatio * 0.08})`;
            }
            displayCtx.drawImage(sceneCanvas, -width / 2 - (viewOffset.currentX + driftX) * offsetScale, -height / 2 - (viewOffset.currentY + driftY) * offsetScale, width, height);
            displayCtx.restore();
        }
    }
    const haze = displayCtx.createRadialGradient(cx, cy, radius * 0.12, cx, cy, radius * 0.96);
    haze.addColorStop(0, "rgba(255, 255, 255, 0.09)");
    haze.addColorStop(0.35, "rgba(255, 255, 255, 0.03)");
    haze.addColorStop(1, "rgba(255, 255, 255, 0)");
    displayCtx.fillStyle = haze;
    displayCtx.fillRect(0, 0, width, height);
    displayCtx.restore();
    paintOuterMatte(width, height, radius, cx, cy, 0.86 + distanceRatio * 0.08);
    paintMirrorSeams(radius, cx, cy, baseAngle, sectorAngle, 0.45, 0.8);
    paintCircularRim(radius, cx, cy, 4 + distanceRatio * 8, 0.34 + distanceRatio * 0.16);
    displayCtx.save();
    displayCtx.beginPath();
    displayCtx.arc(cx, cy, radius * 0.88, -2.45, -1.4);
    displayCtx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    displayCtx.lineWidth = Math.max(3, radius * 0.022);
    displayCtx.stroke();
    displayCtx.restore();
}
function clipRingSector(ctx, innerRadius, outerRadius, halfSectorAngle) {
    if (innerRadius < 0.5) {
        clipSector(ctx, outerRadius, halfSectorAngle);
        return;
    }
    ctx.beginPath();
    ctx.moveTo(Math.cos(-halfSectorAngle) * innerRadius, Math.sin(-halfSectorAngle) * innerRadius);
    ctx.arc(0, 0, outerRadius, -halfSectorAngle, halfSectorAngle);
    ctx.arc(0, 0, innerRadius, halfSectorAngle, -halfSectorAngle, true);
    ctx.closePath();
    ctx.clip();
}
function clipSector(ctx, radius, halfSectorAngle) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, -halfSectorAngle, halfSectorAngle);
    ctx.closePath();
    ctx.clip();
}
function paintOuterMatte(width, height, radius, cx, cy, alpha) {
    const fade = displayCtx.createRadialGradient(cx, cy, radius * 0.82, cx, cy, radius * 1.16);
    fade.addColorStop(0, "rgba(0, 0, 0, 0)");
    fade.addColorStop(0.72, "rgba(0, 0, 0, 0)");
    fade.addColorStop(1, `rgba(2, 6, 12, ${alpha})`);
    displayCtx.fillStyle = fade;
    displayCtx.fillRect(0, 0, width, height);
    displayCtx.save();
    displayCtx.fillStyle = `rgba(2, 6, 12, ${alpha})`;
    displayCtx.beginPath();
    displayCtx.rect(0, 0, width, height);
    displayCtx.arc(cx, cy, radius, 0, Math.PI * 2, true);
    displayCtx.fill("evenodd");
    displayCtx.restore();
}
function paintMirrorSeams(radius, cx, cy, baseAngle, sectorAngle, opacity = 1, widthScale = 1) {
    displayCtx.save();
    displayCtx.translate(cx, cy);
    displayCtx.strokeStyle = `rgba(255, 255, 255, ${(0.12 + settings.distance * 0.08) * opacity})`;
    displayCtx.lineWidth = (1 + settings.distance * 2) * widthScale;
    displayCtx.shadowBlur = 12 * opacity;
    displayCtx.shadowColor = `rgba(255, 255, 255, ${0.18 * opacity})`;
    for (let sector = 0; sector < MIRROR_SECTORS; sector += 1) {
        const angle = baseAngle + sector * sectorAngle;
        displayCtx.save();
        displayCtx.rotate(angle);
        displayCtx.beginPath();
        displayCtx.moveTo(0, 0);
        displayCtx.lineTo(radius, 0);
        displayCtx.stroke();
        displayCtx.restore();
    }
    displayCtx.restore();
}
function paintMirrorRings(radius, cx, cy, ringCount) {
    displayCtx.save();
    displayCtx.translate(cx, cy);
    displayCtx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    displayCtx.lineWidth = 1.2;
    for (let ring = 1; ring < ringCount; ring += 2) {
        const ringRadius = (radius / ringCount) * ring;
        displayCtx.beginPath();
        displayCtx.arc(0, 0, ringRadius, 0, Math.PI * 2);
        displayCtx.stroke();
    }
    displayCtx.restore();
}
function paintCircularRim(radius, cx, cy, lineWidth, alpha) {
    const rim = displayCtx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
    rim.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    rim.addColorStop(0.35, "rgba(184, 218, 255, 0.12)");
    rim.addColorStop(0.68, "rgba(255, 214, 122, 0.22)");
    rim.addColorStop(1, `rgba(255, 255, 255, ${alpha * 0.82})`);
    displayCtx.save();
    displayCtx.beginPath();
    displayCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    displayCtx.strokeStyle = rim;
    displayCtx.lineWidth = lineWidth;
    displayCtx.shadowBlur = 24;
    displayCtx.shadowColor = "rgba(255, 214, 122, 0.45)";
    displayCtx.stroke();
    displayCtx.restore();
}
function paintBackdrop(ctx, width, height, alpha, colors) {
    ctx.save();
    ctx.fillStyle = `rgba(2, 6, 12, ${alpha})`;
    ctx.fillRect(0, 0, width, height);
    const gradient = ctx.createRadialGradient(width * 0.5, height * 0.5, width * 0.08, width * 0.5, height * 0.5, width * 0.65);
    gradient.addColorStop(0, `${colors[0]}40`);
    gradient.addColorStop(0.45, `${colors[1]}18`);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
}
function drawPetals({ ctx, seconds, width, height, colors, density, size, speed }) {
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
function drawOrbit({ ctx, seconds, width, height, colors, density, size, speed }) {
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
function drawLattice({ ctx, seconds, width, height, colors, density, size, speed }) {
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
function drawConfetti({ ctx, seconds, width, height, colors, density, size, speed }) {
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
function isArrowKey(key) {
    return key === "ArrowLeft" || key === "ArrowRight" || key === "ArrowUp" || key === "ArrowDown";
}
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
function randomBetween(min, max, digits = 0) {
    const value = min + Math.random() * (max - min);
    return Number(value.toFixed(digits));
}
