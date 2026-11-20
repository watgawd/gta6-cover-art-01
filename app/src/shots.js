// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos;
// ?shot=cover shows the cover alone. `photo` picks the first sample
// (samples/<photo>.jpg), `photo2` the second panel's, `caption` the words,
// `layout`, `size` and `grade` pick the cover's settings.
// window.__shotReady is set once painted.
export async function runShot(shot, query, api) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const layout = query.get('layout') ?? 'split';
  const size = query.get('size') ?? '1080x1080';
  const grade = query.get('grade') ?? 'sunset';
  const caption = query.get('caption') ?? 'Sunset Heist';
  const title = query.get('title') ?? 'VICE CITY';
  const subtitle = query.get('subtitle') ?? 'Leonida • Coming soon';
  const photo = query.get('photo') ?? 'pier';
  const photo2 = query.get('photo2') ?? 'boulevard';

  api.setState({ layout, grade, title, caption, subtitle });
  document.getElementById('layout').value = layout;
  document.getElementById('size').value = size;
  document.getElementById('grade').value = grade;
  document.getElementById('title').value = title;
  document.getElementById('caption').value = caption;
  document.getElementById('subtitle').value = subtitle;
  api.applySize();
  // Fill the panels: first sample in panel 1, second in panel 2, then repeat.
  const first = await api.loadImage(`samples/${photo}.jpg`);
  const second = await api.loadImage(`samples/${photo2}.jpg`);
  const count = { hero: 1, split: 2, triptych: 3, quad: 4, diagonal: 2, strip: 4 }[layout] ?? 2;
  for (let i = 0; i < count; i++) api.setPanel(i, i % 2 === 0 ? first : second);
  api.buildPanelPick();
  api.redraw();
  if (shot === 'cover') {
    // Fit the canvas to the window without stretching, whatever the post size.
    const cv = document.getElementById('cover');
    const scale = Math.min(window.innerWidth / cv.width, window.innerHeight / cv.height);
    cv.style.width = `${Math.round(cv.width * scale)}px`;
    cv.style.height = `${Math.round(cv.height * scale)}px`;
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
