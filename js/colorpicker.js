// HSV color wheel popover with brightness slider, hex field and eyedropper.
(function (SLS) {
  const SIZE = 180;

  const hsvToRgb = (h, s, v) => {
    const f = n => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
    return [f(5), f(3), f(1)].map(x => Math.round(x * 255));
  };
  const rgbToHsv = ([r, g, b]) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), d = max - Math.min(r, g, b);
    let h = 0;
    if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [(h * 60 + 360) % 360, max ? d / max : 0, max];
  };
  const hexToRgb = hex => { const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim()); if (!m) return null; const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const rgbToHex = rgb => '#' + rgb.map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();

  let open = null;

  function close() {
    if (!open) return;
    open.el.remove();
    document.removeEventListener('pointerdown', open.outside, true);
    document.removeEventListener('keydown', open.esc);
    open = null;
  }

  // show(anchorEl, { title, color: '#RRGGBB', onApply(hex) })
  function show(anchor, opts) {
    close();
    let [h, s, v] = rgbToHsv(hexToRgb(opts.color) || [139, 77, 255]);
    const el = document.createElement('div');
    el.className = 'popover';
    el.innerHTML = `
      <h4>${opts.title || 'สี'}</h4>
      <canvas class="cp-wheel" width="${SIZE}" height="${SIZE}"></canvas>
      <input class="cp-slider" type="range" min="0" max="100" aria-label="ความสว่าง">
      <div class="cp-row">
        <span class="cp-preview"></span>
        <input class="cp-hex" maxlength="7" aria-label="รหัสสี">
        <button class="cp-drop" title="ดูดสีจากหน้าจอ">${SLS.icons.dropper}</button>
      </div>
      <div class="cp-actions">
        <button class="btn btn-ghost btn-small" data-act="cancel">ยกเลิก</button>
        <button class="btn btn-primary btn-small" data-act="apply">ตกลง</button>
      </div>`;
    document.body.appendChild(el);

    const canvas = el.querySelector('canvas'), ctx = canvas.getContext('2d');
    const slider = el.querySelector('.cp-slider'), hexIn = el.querySelector('.cp-hex'), preview = el.querySelector('.cp-preview');
    const drop = el.querySelector('.cp-drop');
    if (!('EyeDropper' in window)) drop.hidden = true;

    const r = SIZE / 2;
    function drawWheel() {
      const img = ctx.createImageData(SIZE, SIZE);
      for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
        const dx = x - r, dy = y - r, dist = Math.hypot(dx, dy), i = (y * SIZE + x) * 4;
        if (dist > r) continue;
        const [R, G, B] = hsvToRgb((Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360, dist / r, v);
        img.data[i] = R; img.data[i + 1] = G; img.data[i + 2] = B; img.data[i + 3] = dist > r - 1 ? 128 : 255;
      }
      ctx.putImageData(img, 0, 0);
      const a = h * Math.PI / 180, px = r + Math.cos(a) * s * r, py = r + Math.sin(a) * s * r;
      ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.stroke();
    }
    const current = () => rgbToHex(hsvToRgb(h, s, v));
    function sync(fromHex) {
      slider.value = Math.round(v * 100);
      if (!fromHex) hexIn.value = current();
      preview.style.background = current();
      drawWheel();
    }

    const pick = e => {
      const b = canvas.getBoundingClientRect();
      const dx = e.clientX - b.left - r, dy = e.clientY - b.top - r;
      h = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360; s = Math.min(1, Math.hypot(dx, dy) / r);
      if (v < 0.05) v = 1;
      sync();
    };
    canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); pick(e); });
    canvas.addEventListener('pointermove', e => { if (e.buttons) pick(e); });
    slider.addEventListener('input', () => { v = slider.value / 100; sync(); });
    hexIn.addEventListener('input', () => { const rgb = hexToRgb(hexIn.value); if (rgb) { [h, s, v] = rgbToHsv(rgb); sync(true); } });
    drop.addEventListener('click', async () => {
      try { const res = await new window.EyeDropper().open(); [h, s, v] = rgbToHsv(hexToRgb(res.sRGBHex)); sync(); } catch { /* cancelled */ }
    });
    el.querySelector('[data-act=cancel]').onclick = close;
    el.querySelector('[data-act=apply]').onclick = () => { const c = current(); close(); opts.onApply(c); };

    // Position next to the anchor, kept inside the viewport.
    const a = anchor.getBoundingClientRect(), w = el.offsetWidth, ht = el.offsetHeight;
    let left = a.right + 10, top = a.top;
    if (left + w > innerWidth - 8) left = Math.max(8, a.left - w - 10);
    if (left < 8) left = Math.max(8, Math.min(innerWidth - w - 8, a.left));
    if (top + ht > innerHeight - 8) top = Math.max(8, innerHeight - ht - 8);
    el.style.left = left + 'px'; el.style.top = top + 'px';

    const outside = e => { if (!el.contains(e.target) && !anchor.contains(e.target)) close(); };
    const esc = e => { if (e.key === 'Escape') close(); };
    setTimeout(() => document.addEventListener('pointerdown', outside, true));
    document.addEventListener('keydown', esc);
    open = { el, outside, esc };
    sync();
  }

  SLS.colorPicker = { show, close, hexToRgb, rgbToHex };
})(globalThis.SLS = globalThis.SLS || {});
