// Draws a GTA-style multi-panel cover: photos in angled panels with a sunset or neon
// colour grade, halftone print dots, and bold poster lettering. All original artwork —
// no Rockstar logo, artwork or font is used anywhere in this app.
//
// A cover state looks like:
//   { layout, grade, title, caption, subtitle, halftone, frame, badge,
//     panels: [{ img, zoom, ox, oy }] }   // ox/oy: pan offset as a fraction of panel size

export const GRADES = {
  sunset: { filter: 'saturate(1.45) contrast(1.18) brightness(1.04)', top: 'rgba(255,176,66,0.28)', bottom: 'rgba(214,32,120,0.55)', accent: '#ff9e2c' },
  neon: { filter: 'saturate(1.6) contrast(1.2) brightness(1.0)', top: 'rgba(0,229,255,0.25)', bottom: 'rgba(255,0,128,0.55)', accent: '#00e5ff' },
  palm: { filter: 'saturate(1.3) contrast(1.15) brightness(1.03)', top: 'rgba(0,180,160,0.22)', bottom: 'rgba(255,176,32,0.5)', accent: '#ffc233' },
  mono: { filter: 'grayscale(1) contrast(1.35) brightness(1.05)', top: 'rgba(255,255,255,0.08)', bottom: 'rgba(0,0,0,0.45)', accent: '#ffffff' },
};

/** Panel rectangles for a layout, as fractions of the cover (x, y, w, h). */
export function layoutRects(layout, w, h) {
  const gap = 0.012; // panel gutter, as a fraction of the short side
  const g = Math.min(w, h) * gap;
  const full = { x: 0, y: 0, w, h };
  switch (layout) {
    case 'hero': return [full];
    case 'split': return [
      { x: 0, y: 0, w: w / 2 - g / 2, h },
      { x: w / 2 + g / 2, y: 0, w: w / 2 - g / 2, h },
    ];
    case 'triptych': return [
      { x: 0, y: 0, w: w * 0.34 - g, h },
      { x: w * 0.34, y: 0, w: w * 0.32, h },
      { x: w * 0.66 + g, y: 0, w: w * 0.34 - g, h },
    ];
    case 'quad': return [
      { x: 0, y: 0, w: w / 2 - g / 2, h: h / 2 - g / 2 },
      { x: w / 2 + g / 2, y: 0, w: w / 2 - g / 2, h: h / 2 - g / 2 },
      { x: 0, y: h / 2 + g / 2, w: w / 2 - g / 2, h: h / 2 - g / 2 },
      { x: w / 2 + g / 2, y: h / 2 + g / 2, w: w / 2 - g / 2, h: h / 2 - g / 2 },
    ];
    case 'diagonal': return [
      { x: 0, y: 0, w: w * 0.62, h },
      { x: w * 0.38, y: 0, w: w * 0.62, h },
    ];
    case 'strip': return [
      { x: 0, y: 0, w, h: h * 0.62 - g / 2 },
      { x: 0, y: h * 0.62 + g / 2, w: w / 3 - g / 2, h: h * 0.38 - g / 2 },
      { x: w / 3 + g / 2, y: h * 0.62 + g / 2, w: w / 3 - g, h: h * 0.38 - g / 2 },
      { x: (w * 2) / 3 + g / 2, y: h * 0.62 + g / 2, w: w / 3 - g / 2, h: h * 0.38 - g / 2 },
    ];
    default: return [full];
  }
}

/** Draws one photo into a panel rect, cover-fit, with the panel's zoom and pan. */
export function drawPanelPhoto(ctx, img, rect, panel, grade) {
  if (!img) return;
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const scale = base * (panel.zoom || 1);
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const cx = rect.x + rect.w / 2 + (panel.ox || 0) * rect.w;
  const cy = rect.y + rect.h / 2 + (panel.oy || 0) * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.filter = grade.filter;
  ctx.drawImage(img, cx - pw / 2, cy - ph / 2, pw, ph);
  ctx.filter = 'none';
  // Sunset / neon wash, stronger toward the bottom of the panel.
  const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(1, grade.bottom);
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  // Thick comic-book panel border.
  ctx.strokeStyle = '#111016';
  ctx.lineWidth = Math.max(3, Math.min(rect.w, rect.h) * 0.012);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
}

/** Prints a halftone dot screen over the whole cover (cheap, drawn as dots). */
export function drawHalftone(ctx, w, h) {
  const step = Math.max(9, Math.round(Math.min(w, h) / 110));
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  for (let y = step / 2; y < h; y += step) {
    for (let x = step / 2; x < w; x += step) {
      const r = step * 0.11 * (0.6 + 0.4 * Math.sin((x + y) * 0.02));
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Fits `text` in bold capitals to at most `maxWidth`, returning the font size used. */
export function fitText(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
  while (ctx.measureText(text).width > maxWidth && size > 10) {
    size -= 2;
    ctx.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
  }
  return size;
}

/** Draws the poster's title, caption and sub-caption over the panels. */
export function drawLettering(ctx, w, h, state, grade) {
  const title = (state.title || '').trim().toUpperCase();
  const caption = (state.caption || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();
  // Bottom caption band: dark slab with an accent rule.
  const bandH = h * 0.17;
  const bandY = h - bandH;
  if (caption || subtitle) {
    ctx.fillStyle = 'rgba(12,10,18,0.88)';
    ctx.fillRect(0, bandY, w, bandH);
    ctx.fillStyle = grade.accent;
    ctx.fillRect(0, bandY, w, Math.max(4, h * 0.008));
  }
  if (caption) {
    const size = fitText(ctx, caption, w * 0.88, h * 0.075);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = size * 0.18;
    ctx.fillText(caption, w / 2, bandY + bandH * 0.52);
    ctx.shadowBlur = 0;
    if (subtitle) {
      ctx.font = `600 ${Math.round(h * 0.024)}px Arial, sans-serif`;
      ctx.fillStyle = grade.accent;
      ctx.fillText(subtitle.toUpperCase(), w / 2, bandY + bandH * 0.85);
    }
  }
  if (title) {
    // Title across the top, white with a hard black outline and accent shadow.
    // Kept clear of the corner badge on the right.
    const size = fitText(ctx, title, w * 0.82, h * 0.11);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const ty = h * 0.035;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#111016';
    ctx.lineWidth = size * 0.16;
    ctx.strokeText(title, w / 2 + size * 0.03, ty + size * 0.03);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, w / 2, ty);
    ctx.fillStyle = grade.accent;
    ctx.fillRect(w / 2 - w * 0.16, ty + size * 1.08, w * 0.32, Math.max(4, h * 0.006));
  }
}

/** Draws the whole cover onto `canvas` from a cover state. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[state.grade] || GRADES.sunset;
  ctx.fillStyle = '#1b1426';
  ctx.fillRect(0, 0, w, h);
  const rects = layoutRects(state.layout || 'split', w, h);
  rects.forEach((rect, i) => {
    const panel = (state.panels && state.panels[i]) || {};
    if (panel.img) {
      if (state.layout === 'diagonal') {
        // Angled split: clip the panel to a parallelogram, then draw it.
        ctx.save();
        ctx.beginPath();
        const slant = w * 0.06;
        if (i === 0) {
          ctx.moveTo(rect.x, rect.y); ctx.lineTo(rect.x + rect.w, rect.y);
          ctx.lineTo(rect.x + rect.w - slant, rect.y + rect.h); ctx.lineTo(rect.x, rect.y + rect.h);
        } else {
          ctx.moveTo(rect.x + slant, rect.y); ctx.lineTo(rect.x + rect.w, rect.y);
          ctx.lineTo(rect.x + rect.w, rect.y + rect.h); ctx.lineTo(rect.x, rect.y + rect.h);
        }
        ctx.closePath(); ctx.clip();
        drawPanelPhoto(ctx, panel.img, rect, panel, grade);
        ctx.restore();
      } else {
        drawPanelPhoto(ctx, panel.img, rect, panel, grade);
      }
    } else {
      // Empty panel: a graded placeholder so the layout still reads as a poster.
      const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
      g.addColorStop(0, '#3a2350'); g.addColorStop(1, '#120e1c');
      ctx.fillStyle = g; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 2; ctx.setLineDash([10, 8]);
      ctx.strokeRect(rect.x + 14, rect.y + 14, rect.w - 28, rect.h - 28);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = `600 ${Math.round(Math.min(w, h) * 0.028)}px Arial, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`PANEL ${i + 1} — LOAD A PHOTO`, rect.x + rect.w / 2, rect.y + rect.h / 2);
    }
  });
  if (state.halftone) drawHalftone(ctx, w, h);
  drawLettering(ctx, w, h, state, grade);
  if (state.badge) {
    // Small "VI" corner badge — an original mark, not a Rockstar logo.
    // Rotated about its own centre so it never drifts off the canvas.
    const s = Math.min(w, h) * 0.085;
    const cx = w - s * 0.75, cy = h * 0.035 + s / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.06);
    ctx.fillStyle = grade.accent;
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.strokeStyle = '#111016'; ctx.lineWidth = Math.max(3, s * 0.06);
    ctx.strokeRect(-s / 2, -s / 2, s, s);
    ctx.fillStyle = '#111016';
    ctx.font = `900 ${Math.round(s * 0.52)}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('VI', 0, s * 0.03);
    ctx.restore();
  }
  if (state.frame) {
    ctx.strokeStyle = '#111016';
    ctx.lineWidth = Math.max(6, Math.min(w, h) * 0.014);
    ctx.strokeRect(0, 0, w, h);
  }
}
