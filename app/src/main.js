// Wires the page: pick panels, load photos, drag to crop, edit the words, and export
// the cover as a PNG at the chosen post size. A `?shot=` query sets up a fixed scene
// for a screenshot instead (./shots.js).
import { drawCover, layoutRects } from './cover.js';
import { runShot } from './shots.js';

export const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const $ = (id) => document.getElementById(id);

// One panel per layout slot; extra panels are ignored when the layout has fewer.
const state = {
  layout: 'split',
  grade: 'sunset',
  title: 'VICE CITY',
  caption: 'Sunset Heist',
  subtitle: 'Leonida • Coming soon',
  halftone: true,
  frame: true,
  badge: true,
  panels: [
    { img: null, zoom: 1.15, ox: 0, oy: 0 },
    { img: null, zoom: 1.15, ox: 0, oy: 0 },
    { img: null, zoom: 1.15, ox: 0, oy: 0 },
    { img: null, zoom: 1.15, ox: 0, oy: 0 },
  ],
};
let selected = 0;

function redraw() {
  drawCover(canvas, state);
}

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Rebuilds the panel picker buttons for the current layout. */
function buildPanelPick() {
  const pick = $('panelPick');
  pick.innerHTML = '';
  const count = layoutRects(state.layout, 100, 100).length;
  for (let i = 0; i < count; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = `Panel ${i + 1}${state.panels[i].img ? ' ✓' : ''}`;
    b.className = i === selected ? 'picked' : '';
    b.addEventListener('click', () => {
      selected = i;
      $('zoom').value = state.panels[i].zoom;
      buildPanelPick();
      redraw();
    });
    pick.appendChild(b);
  }
  if (selected >= count) selected = 0;
}

/** Applies the chosen post size to the preview canvas. */
function applySize() {
  const [w, h] = SIZES[$('size').value] || SIZES['1080x1080'];
  canvas.width = w;
  canvas.height = h;
  redraw();
}

$('photo').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    state.panels[selected].img = await loadImage(URL.createObjectURL(file));
    status.textContent = `Loaded ${file.name} into panel ${selected + 1}.`;
    buildPanelPick();
    redraw();
  } catch {
    status.textContent = 'That file could not be read as an image.';
  }
  e.target.value = '';
});

async function loadSample(name) {
  state.panels[selected].img = await loadImage(`samples/${name}.jpg`);
  status.textContent = `Sample ${name} loaded into panel ${selected + 1}.`;
  buildPanelPick();
  redraw();
}
$('sampleA').addEventListener('click', () => loadSample('pier'));
$('sampleB').addEventListener('click', () => loadSample('boulevard'));

$('zoom').addEventListener('input', (e) => {
  state.panels[selected].zoom = Number(e.target.value);
  redraw();
});
$('layout').addEventListener('change', (e) => {
  state.layout = e.target.value;
  buildPanelPick();
  redraw();
});
$('size').addEventListener('change', applySize);
$('grade').addEventListener('change', (e) => { state.grade = e.target.value; redraw(); });
$('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
$('caption').addEventListener('input', (e) => { state.caption = e.target.value; redraw(); });
$('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
$('halftone').addEventListener('change', (e) => { state.halftone = e.target.checked; redraw(); });
$('frame').addEventListener('change', (e) => { state.frame = e.target.checked; redraw(); });
$('badge').addEventListener('change', (e) => { state.badge = e.target.checked; redraw(); });

// Drag on the preview to pan the photo inside the panel under the pointer.
let drag = null;
function panelAt(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  const x = ((clientX - r.left) / r.width) * canvas.width;
  const y = ((clientY - r.top) / r.height) * canvas.height;
  const rects = layoutRects(state.layout, canvas.width, canvas.height);
  return { rects, hit: rects.findIndex((rc) => x >= rc.x && x <= rc.x + rc.w && y >= rc.y && y <= rc.y + rc.h), x, y };
}
canvas.addEventListener('pointerdown', (e) => {
  const { hit, x, y } = panelAt(e.clientX, e.clientY);
  if (hit < 0) return;
  selected = hit;
  $('zoom').value = state.panels[hit].zoom;
  buildPanelPick();
  drag = { panel: hit, x, y, ox: state.panels[hit].ox, oy: state.panels[hit].oy };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const { rects, x, y } = panelAt(e.clientX, e.clientY);
  const rect = rects[drag.panel];
  const p = state.panels[drag.panel];
  p.ox = drag.ox + (x - drag.x) / rect.w;
  p.oy = drag.oy + (y - drag.y) / rect.h;
  p.ox = Math.max(-0.5, Math.min(0.5, p.ox));
  p.oy = Math.max(-0.5, Math.min(0.5, p.oy));
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });

$('export').addEventListener('click', () => {
  canvas.toBlob((blob) => {
    if (!blob) { status.textContent = 'Export failed — try again.'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${canvas.width}x${canvas.height}.png`;
    a.click();
    status.textContent = `Saved vice-cover-${canvas.width}x${canvas.height}.png`;
  }, 'image/png');
});

// Fixed screenshot scenes, or the live editor with the pier sample in panel 1.
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), {
    setState(next) { Object.assign(state, next); },
    loadSample,
    setPanel(i, img) { state.panels[i].img = img; },
    applySize, buildPanelPick, redraw, loadImage,
  });
} else {
  buildPanelPick();
  loadSample('pier').catch(() => { buildPanelPick(); redraw(); });
}
