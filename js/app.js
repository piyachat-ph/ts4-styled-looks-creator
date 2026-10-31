// UI: Tray folder → processing → pick outfit → editor → export.
(function (SLS) {
  const { icons } = SLS;
  const SL = SLS.styledlook;
  const view = document.getElementById('view');
  const PAGE = 40;
  const DEFAULT_COLORS = ['#3B82F6', '#9333EA', '#EF4444', '#10B981', '#F59E0B'];

  const AGE_OPTIONS = [
    ['infant', 'ทารก'], ['toddler', 'เด็กวัยหัดเดิน'], ['child', 'เด็ก'], ['teen', 'วัยรุ่น'],
    ['youngAdult', 'ผู้ใหญ่ตอนต้น'], ['adult', 'ผู้ใหญ่'], ['elder', 'ผู้สูงอายุ'],
  ];
  const CATEGORY_OPTIONS = [
    ['everyday', 'ชุดประจำวัน'], ['formal', 'ชุดทางการ'], ['athletic', 'ชุดกีฬา'], ['sleep', 'ชุดนอน'],
    ['party', 'ชุดปาร์ตี้'], ['swimwear', 'ชุดว่ายน้ำ'], ['hotWeather', 'ชุดอากาศร้อน'], ['coldWeather', 'ชุดอากาศหนาว'],
  ];
  // All seven occult tags the game has, in the game's order.
  const OCCULT_OPTIONS = [
    ['human', 'มนุษย์'], ['alien', 'เอเลี่ยน'], ['vampire', 'แวมไพร์'], ['mermaid', 'เงือก'],
    ['witch', 'ผู้ใช้เวทมนตร์'], ['werewolf', 'มนุษย์หมาป่า'], ['fairy', 'นางฟ้า'],
  ];
  // New looks allow every occult by default.
  const DEFAULT_OCCULTS = OCCULT_OPTIONS.map(([k]) => k);

  const state = {
    screen: 'tray', sims: [], error: '', shown: PAGE, multi: false, ccOnly: false, selected: new Set(), query: '',
    progress: [0, 0], look: null,
  };

  const store = {
    get(k, d) { try { const v = localStorage.getItem('slc.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('slc.' + k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };
  state.multi = store.get('multi', false);
  state.ccOnly = store.get('ccOnly', false);

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const fmtDate = ms => new Date(ms).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

  function toast(msg, ms = 4200) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast.timer); toast.timer = setTimeout(() => t.classList.remove('show'), ms);
  }

  // Thumbnail object URLs (transparent PNGs when the alpha mask is present), cached per sim.
  const thumbCache = new Map();
  async function decodeThumb(jpeg) {
    const jpegBlob = new Blob([jpeg], { type: 'image/jpeg' });
    const alpha = SLS.tray.extractAlpha(jpeg);
    if (!alpha || !window.createImageBitmap) return URL.createObjectURL(jpegBlob);
    const [img, mask] = await Promise.all([createImageBitmap(jpegBlob), createImageBitmap(new Blob([alpha], { type: 'image/png' }))]);
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(mask, 0, 0, c.width, c.height);
    const m = ctx.getImageData(0, 0, c.width, c.height).data;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0);
    const px = ctx.getImageData(0, 0, c.width, c.height);
    for (let i = 0; i < m.length; i += 4) px.data[i + 3] = m[i];
    ctx.putImageData(px, 0, 0);
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    return URL.createObjectURL(blob);
  }
  function thumbUrl(sim) {
    if (!sim.thumbnail) return Promise.resolve(null);
    if (!thumbCache.has(sim.key)) thumbCache.set(sim.key, sim.thumbnail().then(decodeThumb).catch(() => null));
    return thumbCache.get(sim.key);
  }
  function fillThumbs(root) {
    root.querySelectorAll('img[data-sim]').forEach(img => {
      const sim = state.sims.find(s => s.key === img.dataset.sim);
      if (sim) thumbUrl(sim).then(u => { if (u) img.src = u; else img.remove(); });
    });
  }

  function go(screen) {
    state.screen = screen;
    SLS.colorPicker.close();
    document.querySelector('.pose-pop')?.remove();
    render();
    window.scrollTo(0, 0);
  }

  function render() {
    const back = document.getElementById('btn-back');
    back.hidden = !(state.screen === 'pick' || state.screen === 'editor');
    ({ tray: renderTray, processing: renderProcessing, pick: renderPick, editor: renderEditor })[state.screen]();
  }

  // ---- Tray folder ----
  function renderTray() {
    view.innerHTML = `
      <section class="center-card">
        <h1>โฟลเดอร์ Tray ของคุณ</h1>
        <p>โปรแกรมต้องอ่านโฟลเดอร์ Tray ซึ่งเป็นที่เก็บซิมและชุดที่คุณบันทึกไว้
           กดปุ่มด้านล่าง แล้วเลือกโฟลเดอร์ Tray</p>
        <div class="divider"></div>
        <p>โฟลเดอร์ Tray อยู่ในโฟลเดอร์ <b>The Sims 4</b> ใน Documents:<br>
           <code>Documents\\Electronic Arts\\The Sims 4\\Tray</code></p>
        ${state.error ? `<p class="error-text">${esc(state.error)}</p>` : ''}
        <button class="btn btn-primary" id="browse">${icons.folder} เลือกโฟลเดอร์ Tray</button>
      </section>`;
    view.querySelector('#browse').onclick = () => document.getElementById('tray-input').click();
  }

  async function loadTray(fileList) {
    const files = [...fileList].map(f => ({ name: f.name, lastModified: f.lastModified, read: () => f.arrayBuffer().then(b => new Uint8Array(b)) }));
    if (!files.some(f => /\.trayitem$/i.test(f.name))) {
      state.error = 'โฟลเดอร์นี้ไม่มีซิมที่บันทึกไว้ กรุณาเลือกโฟลเดอร์ "Tray" ที่อยู่ในโฟลเดอร์ The Sims 4';
      return go('tray');
    }
    state.error = ''; state.progress = [0, 0];
    go('processing');
    try {
      const started = Date.now();
      const sims = await SLS.tray.load(files, (d, t) => { state.progress = [d, t]; updateProgress(); });
      const wait = 700 - (Date.now() - started);
      if (wait > 0) await new Promise(r => setTimeout(r, wait));
      thumbCache.forEach(p => p.then(u => u && URL.revokeObjectURL(u)));
      thumbCache.clear();
      state.sims = sims; state.shown = PAGE; state.selected.clear(); state.query = '';
      if (!sims.length) { state.error = 'ไม่พบซิมที่มีชุดประจำวัน กรุณาบันทึกซิมลงแกลเลอรี่ในเกมก่อน แล้วลองใหม่อีกครั้ง'; return go('tray'); }
      go('pick');
    } catch (err) {
      console.error(err);
      state.error = 'เกิดข้อผิดพลาดระหว่างอ่านโฟลเดอร์ Tray: ' + err.message;
      go('tray');
    }
  }

  // ---- Processing ----
  function renderProcessing() {
    view.innerHTML = `
      <section class="processing">
        <div class="stack"><span></span><span></span><span></span></div>
        <p>กำลังอ่านไฟล์ใน Tray</p>
        <small id="progress"></small>
      </section>`;
    updateProgress();
  }
  function updateProgress() {
    const el = document.getElementById('progress');
    if (el && state.progress[1]) el.textContent = `${state.progress[0]} / ${state.progress[1]} ครอบครัวที่บันทึกไว้`;
  }

  // ---- Pick outfit ----
  function filteredSims() {
    const q = state.query.trim().toLowerCase();
    return state.sims.filter(s => (!state.ccOnly || s.ccParts > 0) &&
      (!q || `${s.firstName} ${s.lastName} ${s.household}`.toLowerCase().includes(q)));
  }

  function renderPick() {
    const list = filteredSims();
    const cards = list.slice(0, state.shown).map(s => {
      const sel = state.selected.has(s.key);
      return `
        <button class="sim-card ${sel ? 'selected' : ''}" data-key="${esc(s.key)}" title="${esc(s.household)}">
          <div class="thumb"><img data-sim="${esc(s.key)}" alt=""></div>
          ${s.everyday.length > 1 ? `<span class="badge">${s.everyday.length} ชุด</span>` : ''}
          ${s.ccParts ? `<span class="badge cc" title="ชุดนี้มีของ CC ${s.ccParts} ชิ้น">CC</span>` : ''}
          ${sel ? `<span class="tick">${icons.check}</span>` : ''}
          <div class="meta"><b>${esc(`${s.firstName} ${s.lastName}`.trim() || 'ซิมไม่มีชื่อ')}</b>${fmtDate(s.date)}</div>
        </button>`;
    }).join('');
    view.innerHTML = `
      <section class="picker">
        <div class="picker-head">
          <h2>เลือกชุดของคุณ</h2>
          <div class="picker-tools">
            <input class="search" id="search" type="search" placeholder="ค้นหาซิม…" value="${esc(state.query)}">
            <label class="check-pill"><input type="checkbox" id="cc-only" ${state.ccOnly ? 'checked' : ''}> เฉพาะชุด CC</label>
            <label class="check-pill"><input type="checkbox" id="multi" ${state.multi ? 'checked' : ''}> เลือกหลายตัว</label>
          </div>
        </div>
        ${list.length ? `<div class="grid">${cards}</div>` : '<p class="empty">ไม่พบซิมที่ตรงกับคำค้นหา</p>'}
        <div class="picker-foot">
          ${state.shown < list.length ? '<button class="btn btn-ghost btn-small" id="more">โหลดเพิ่ม…</button>' : ''}
          ${state.multi ? `<button class="btn btn-primary btn-small" id="continue" ${state.selected.size ? '' : 'disabled'}>ต่อไป (เลือกแล้ว ${state.selected.size} ตัว)</button>` : ''}
        </div>
      </section>`;
    fillThumbs(view);

    view.querySelectorAll('.sim-card').forEach(card => card.onclick = () => {
      const key = card.dataset.key;
      if (!state.multi) return openEditor([key]);
      state.selected.has(key) ? state.selected.delete(key) : state.selected.add(key);
      renderPick();
    });
    const search = view.querySelector('#search');
    search.oninput = () => {
      state.query = search.value; state.shown = PAGE;
      const pos = search.selectionStart;
      renderPick();
      const s2 = view.querySelector('#search'); s2.focus(); s2.setSelectionRange(pos, pos);
    };
    view.querySelector('#cc-only').onchange = e => { state.ccOnly = e.target.checked; store.set('ccOnly', state.ccOnly); state.shown = PAGE; renderPick(); };
    view.querySelector('#multi').onchange =e => { state.multi = e.target.checked; store.set('multi', state.multi); if (!state.multi) state.selected.clear(); renderPick(); };
    const more = view.querySelector('#more');
    if (more) more.onclick = () => { state.shown += PAGE; renderPick(); };
    const cont = view.querySelector('#continue');
    if (cont) cont.onclick = () => openEditor([...state.selected]);
  }

  // ---- Editor ----
  function defaultAges(age) {
    if (age >= SL.AGE.teen && age <= SL.AGE.elder) return ['teen', 'youngAdult', 'adult', 'elder'];
    return AGE_OPTIONS.filter(([k]) => SL.AGE[k] === age).map(([k]) => k);
  }

  function openEditor(keys) {
    const sims = keys.map(k => state.sims.find(s => s.key === k)).filter(Boolean);
    const first = sims[0];
    const genders = [...new Set(sims.map(s => (s.gender === SL.GENDER.female ? 'female' : 'male')))];
    const swatches = sims.flatMap(sim => sim.everyday.map(outfit => ({ sim, outfit })))
      .map((sw, i) => ({ ...sw, color: DEFAULT_COLORS[i % DEFAULT_COLORS.length] }));
    state.look = {
      name: 'ชุด 001',
      creator: store.get('creator', first.creator || ''),
      bg: store.get('bg', '#52C4D2'),
      genders, hair: false, makeup: false,
      ages: defaultAges(first.age),
      outfitCategories: ['everyday'],
      occults: [...DEFAULT_OCCULTS],
      pose: genders[0] === 'female' ? 'FeaturedLook_F_CoverGirl' : 'FeaturedLook_M_Confident',
      swatches, active: 0,
    };
    go('editor');
  }

  const chip = (group, key, label, on, tipTitle, disabled) =>
    `<button class="chip ${on ? 'on' : ''}" data-group="${group}" data-key="${key}" aria-pressed="${on}" aria-label="${esc(label)}" ${disabled ? 'disabled' : ''}
      ${tipTitle ? `data-tip-title="${esc(tipTitle)}"` : ''} data-tip="${esc(label)}">${icons[key]}</button>`;

  const info = text => ` <span class="info" tabindex="0" data-tip="${esc(text)}">ⓘ</span>`;

  // Ages whose body type the source Sims share; an adult outfit can't go on a child, etc.
  function allowedAges(look) {
    const groups = new Set(look.swatches.map(s => (s.sim.age >= SL.AGE.teen && s.sim.age <= SL.AGE.elder ? 'adultish' : s.sim.age)));
    return AGE_OPTIONS.map(([k]) => k).filter(k => {
      const a = SL.AGE[k];
      return groups.has(a >= SL.AGE.teen && a <= SL.AGE.elder ? 'adultish' : a);
    });
  }

  function posesFor(look) {
    return look.genders.length === 1 && look.genders[0] === 'male' ? SL.POSES.male
      : look.genders.length === 1 ? SL.POSES.female : [...SL.POSES.female, ...SL.POSES.male];
  }
  const poseLabel = p => p.replace(/^FeaturedLook_[FM]_/, '').replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');

  // Matches the exported background image: the color fades in from left to right over white.
  const BG_STOPS = [[0, 0], [10, .067], [19, .157], [32, .306], [48, .514], [64, .72], [80, .894], [100, 1]];
  function stageBg(hex) {
    const n = parseInt(hex.slice(1), 16), rgb = `${n >> 16}, ${(n >> 8) & 255}, ${n & 255}`;
    return `linear-gradient(90deg, ${BG_STOPS.map(([p, a]) => `rgba(${rgb}, ${a}) ${p}%`).join(', ')}), #fff`;
  }

  function lookCardHTML(look, interactive) {
    const sw = look.swatches[look.active] || look.swatches[0];
    return `
      <div class="look-card">
        <div class="name-row">
          <div class="field-label">ชื่อลุค</div>
          <input class="inline-input" id="look-name" value="${esc(look.name)}" placeholder="ตั้งชื่อลุคของคุณ" maxlength="60" ${interactive ? '' : 'tabindex="-1"'}>
        </div>
        <div class="stage" style="background:${stageBg(look.bg)}">
          ${sw && interactive ? `<img class="model" data-sim="${esc(sw.sim.key)}" alt="">` : '<div class="placeholder"></div>'}
          <button class="bg-btn" id="bg-btn" title="สีพื้นหลัง">${icons.palette}</button>
          ${look.swatches.length > 1 ? `<span class="outfit-tag"><i style="background:${sw.color}"></i>ชุดที่ ${look.active + 1}/${look.swatches.length}</span>` : ''}
          <button class="inset" id="pose-inset" title="เลือกท่าโพส: ${esc(poseLabel(look.pose))}" style="background:${stageBg(look.bg)}">
            <img src="assets/poses/${look.pose}.png" alt="">
          </button>
        </div>
        <div class="creator-row">
          <div class="field-label">ชื่อผู้สร้าง</div>
          <input class="inline-input" id="creator" value="${esc(look.creator)}" placeholder="ชื่อของคุณ" maxlength="40" ${interactive ? '' : 'tabindex="-1"'}>
        </div>
      </div>
      <button class="btn btn-primary export-btn" id="export">${icons.download} Export ลุคนี้</button>`;
  }

  function optionsHTML(look) {
    return `
      <div class="options">
        <div class="opt-row">
          <div class="opt-group"><h3>สไตล์การแต่งกาย${info('คลิกไอคอนเพื่อเลือกว่าชุดนี้ใช้กับเพศไหนได้ ถ้าเลือกทั้งสองไอคอน ชุดนี้จะใช้ได้ทั้งชายและหญิง')}</h3><div class="chips">
            ${chip('genders', 'female', 'แบบผู้หญิง', look.genders.includes('female'))}
            ${chip('genders', 'male', 'แบบผู้ชาย', look.genders.includes('male'))}
          </div></div>
          <div class="vsep"></div>
          <div class="opt-group"><h3>รายละเอียด</h3><div class="chips">
            ${chip('hair', 'hair', 'ถ้าเปิดไว้ ทรงผมของซิมต้นแบบจะถูกใส่ไปพร้อมกับชุดด้วย', look.hair, 'ใส่ทรงผมด้วย')}
            ${chip('makeup', 'makeup', 'ถ้าเปิดไว้ เมคอัพ (ลิปสติก อายแชโดว์ อายไลเนอร์ บลัช มาสคาร่า) และเล็บของซิมต้นแบบจะถูกใส่ไปด้วย ถ้าปิดไว้ จะใส่ให้เฉพาะเสื้อผ้า', look.makeup, 'ใส่เมคอัพด้วย')}
          </div></div>
        </div>
        <div class="opt-group"><h3>ช่วงวัยที่ใส่ได้${info('ซิมจะใส่ชุดนี้ได้ตามช่วงวัยที่เลือก ช่วงวัยที่จางคือใช้ไม่ได้ เพราะรูปร่างไม่ตรงกับซิมต้นแบบ')}</h3><div class="chips">
          ${AGE_OPTIONS.map(([k, l]) => (k === 'teen' ? '<span class="sep"></span>' : '') + chip('ages', k, l, look.ages.includes(k), null, look.swatches[0]?.sim.age != null && !allowedAges(look).includes(k))).join('')}
        </div></div>
        <div class="opt-group"><h3>สีของชุด <small>(${look.swatches.length})</small></h3>
          <div class="swatches">
            ${look.swatches.map((s, i) => `<button class="swatch ${i === look.active ? 'active' : ''}" data-i="${i}" style="background:${s.color}" title="สีที่ ${i + 1} — ${esc(s.sim.firstName)}"></button>`).join('')}
          </div>
          <div class="swatch-hint">แต่ละวงคือ 1 ชุด คลิกเพื่อเลือกชุดและเปลี่ยนสี<br>รูปจะเปลี่ยนเฉพาะเมื่อเป็นชุดของซิมคนละตัว (เกมเก็บรูปไว้ซิมละ 1 รูป)</div>
        </div>
        <div class="opt-group"><h3>ประเภทชุด${info('ลุคนี้จะใช้ได้กับประเภทชุดที่เลือก เช่น เลือกชุดประจำวันกับชุดอากาศร้อน ลุคจะขึ้นในทั้งสองหมวด')}</h3><div class="chips">
          ${CATEGORY_OPTIONS.map(([k, l]) => chip('outfitCategories', k, l, look.outfitCategories.includes(k))).join('')}
        </div></div>
        <div class="opt-group"><h3>เผ่าพันธุ์ที่ใส่ได้${info('ลุคนี้จะใช้ได้กับเผ่าพันธุ์ที่เลือก มีครบ 7 แบบตามเกม: มนุษย์ เอเลี่ยน แวมไพร์ เงือก ผู้ใช้เวทมนตร์ มนุษย์หมาป่า นางฟ้า')}</h3><div class="chips">
          ${OCCULT_OPTIONS.map(([k, l]) => chip('occults', k, l, look.occults.includes(k))).join('')}
        </div></div>
      </div>`;
  }

  function renderEditor() {
    const look = state.look;
    view.innerHTML = `<section class="editor"><div>${lookCardHTML(look, true)}</div>${optionsHTML(look)}</section>`;
    fillThumbs(view);
    const $ = s => view.querySelector(s);

    $('#look-name').oninput = e => { look.name = e.target.value; };
    $('#creator').oninput = e => { look.creator = e.target.value; store.set('creator', look.creator); };
    // Live preview while dragging on the wheel; Cancel restores the saved color.
    const paintBg = hex => view.querySelectorAll('.stage, .inset').forEach(el => { el.style.background = stageBg(hex); });
    $('#bg-btn').onclick = e => SLS.colorPicker.show(e.currentTarget, {
      title: 'สีพื้นหลัง', color: look.bg,
      onChange: paintBg,
      onCancel: () => paintBg(look.bg),
      onApply: c => { look.bg = c; store.set('bg', c); renderEditor(); },
    });
    $('#pose-inset').onclick = e => openPosePicker(e.currentTarget);

    view.querySelectorAll('.chip').forEach(c => c.onclick = () => {
      const { group, key } = c.dataset;
      if (group === 'hair') look.hair = !look.hair;
      else if (group === 'makeup') look.makeup = !look.makeup;
      else {
        const list = look[group];
        const i = list.indexOf(key);
        if (i >= 0) list.splice(i, 1); else list.push(key);
        if (group === 'genders' && !posesFor(look).includes(look.pose)) look.pose = posesFor(look)[0];
      }
      renderEditor();
    });
    // One click selects the outfit and opens its color picker.
    view.querySelectorAll('.swatch').forEach(el => el.onclick = () => {
      const i = +el.dataset.i;
      if (i !== look.active) { look.active = i; renderEditor(); }
      const b = view.querySelector(`.swatch[data-i="${i}"]`);
      SLS.colorPicker.show(b, {
        title: `สีที่ ${i + 1}`, color: look.swatches[i].color,
        onChange: c => { b.style.background = c; const dot = view.querySelector('.outfit-tag i'); if (dot) dot.style.background = c; },
        onCancel: () => { b.style.background = look.swatches[i].color; const dot = view.querySelector('.outfit-tag i'); if (dot) dot.style.background = look.swatches[i].color; },
        onApply: c => { look.swatches[i].color = c; renderEditor(); },
      });
    });
    $('#export').onclick = exportLook;
  }

  // Grid of thumbnail poses, shown next to the inset preview.
  function openPosePicker(anchor) {
    const look = state.look;
    SLS.colorPicker.close();
    const old = document.querySelector('.pose-pop');
    if (old) { old.remove(); return; }
    const el = document.createElement('div');
    el.className = 'popover pose-pop';
    el.innerHTML = `
      <h4>เลือกท่าโพส</h4>
      <div class="pose-grid">
        ${posesFor(look).map(p => `
          <button class="pose-cell ${p === look.pose ? 'on' : ''}" data-pose="${p}" title="${esc(poseLabel(p))}" style="background:${stageBg(look.bg)}">
            <img src="assets/poses/${p}.png" alt="${esc(poseLabel(p))}">
          </button>`).join('')}
      </div>`;
    document.body.appendChild(el);
    const close = () => { el.remove(); document.removeEventListener('pointerdown', outside, true); document.removeEventListener('keydown', onKey); };
    const outside = ev => { if (!el.contains(ev.target) && !anchor.contains(ev.target)) close(); };
    const onKey = ev => { if (ev.key === 'Escape') close(); };
    el.querySelectorAll('.pose-cell').forEach(b => b.onclick = () => { look.pose = b.dataset.pose; close(); renderEditor(); });
    const a = anchor.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight;
    let left = a.right + 12, top = a.bottom - h;
    if (left + w > innerWidth - 8) left = Math.max(8, a.left - w - 12);
    top = Math.min(Math.max(8, top), innerHeight - h - 8);
    el.style.left = left + 'px'; el.style.top = top + 'px';
    setTimeout(() => document.addEventListener('pointerdown', outside, true));
    document.addEventListener('keydown', onKey);
  }

  function exportLook() {
    const look = state.look;
    const problems = [];
    if (!look.name.trim()) problems.push('ใส่ชื่อลุค');
    if (!look.creator.trim()) problems.push('ใส่ชื่อผู้สร้าง');
    if (!look.genders.length) problems.push('เลือกสไตล์การแต่งกาย');
    look.ages = look.ages.filter(a => allowedAges(look).includes(a));
    if (!look.ages.length) problems.push('เลือกช่วงวัยอย่างน้อย 1 ช่วง');
    if (!look.outfitCategories.length) problems.push('เลือกประเภทชุดอย่างน้อย 1 ประเภท');
    if (problems.length) return toast('กรุณา' + problems.join(', '));

    const pkg = SLS.build.buildPackage([{
      name: look.name.trim(), creator: look.creator.trim(), background: parseInt(look.bg.slice(1), 16), ages: look.ages, genders: look.genders, hair: look.hair, makeup: look.makeup,
      outfitCategories: look.outfitCategories, occults: look.occults, pose: look.pose,
      swatches: look.swatches.map(s => ({ sim: s.sim, outfit: s.outfit, color: (0xff000000 | parseInt(s.color.slice(1), 16)) >>> 0 })),
    }]);
    const fileName = `${SLS.build.slug(look.creator)}_StyledLook_${SLS.build.slug(look.name)}.package`;
    const url = URL.createObjectURL(new Blob([pkg], { type: 'application/octet-stream' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: fileName });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    toast(`บันทึก ${fileName} แล้ว — ย้ายไฟล์ไปไว้ใน Documents\\Electronic Arts\\The Sims 4\\Mods`, 7000);
  }

  // Static mockup of the editor for the tutorial's last step.
  function miniEditorHTML() {
    const look = {
      name: 'ชุดสบายๆ ไปเที่ยว', creator: 'คุณ', bg: '#52C4D2', genders: ['female'], hair: false, makeup: false,
      ages: ['teen', 'youngAdult', 'adult', 'elder'], outfitCategories: ['everyday'], occults: ['human', 'fairy', 'vampire', 'witch'],
      pose: 'FeaturedLook_F_CoverGirl', active: 0,
      swatches: DEFAULT_COLORS.slice(0, 3).map(color => ({ color, sim: { firstName: '', key: '' } })),
    };
    return `<div class="editor" style="margin:0">${'<div>' + lookCardHTML(look, false) + '</div>' + optionsHTML(look)}</div>`;
  }

  // ---- Boot ----
  document.getElementById('btn-help').innerHTML = icons.help;
  document.getElementById('btn-back').innerHTML = icons.back;
  document.getElementById('btn-help').onclick = () => SLS.tutorial.open();
  document.getElementById('btn-back').onclick = () => go(state.screen === 'editor' ? 'pick' : 'tray');
  document.getElementById('tray-input').onchange = e => { if (e.target.files.length) loadTray(e.target.files); e.target.value = ''; };

  SLS.app = { miniEditorHTML, loadTray };
  render();
  if (!SLS.tutorial.seen()) SLS.tutorial.open();
})(globalThis.SLS = globalThis.SLS || {});
