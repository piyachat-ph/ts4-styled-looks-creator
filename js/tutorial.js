// Built-in step-by-step tutorial shown on first visit and from the help button.
(function (SLS) {
  const STORAGE_KEY = 'slc.tutorialSeen';

  const steps = [
    {
      title: 'ยินดีต้อนรับ',
      figure: `<div class="fig-gallery"><div class="card"><i></i><div><b>ชุดของคุณ</b><br><small>แต่งใน CAS</small></div></div><div style="font-size:22px;color:var(--accent)">↓</div><div class="card"><i style="background:linear-gradient(160deg,#a7f3d0,#10b981)"></i><div><b>Styled Look</b><br><small>คลิกเดียวใน CAS</small></div></div></div>`,
      text: 'เปลี่ยนชุดที่คุณแต่งใน CAS ให้เป็น Styled Look ของคุณเอง แต่งชุดในเกม นำเข้ามาในโปรแกรม ปรับรายละเอียด แล้ว Export เป็นไฟล์ package สำหรับโฟลเดอร์ Mods',
    },
    {
      title: 'แต่งชุดใน CAS',
      figure: `<div class="fig-cas"><div class="slot on">1</div><div class="slot on">2</div><div class="slot on">3</div><div class="slot">4</div><div class="slot">5</div><div class="plus">+</div></div>`,
      text: 'แต่งชุดประจำวันให้ซิม ชุดประจำวันแต่ละชุด (สูงสุด 5 ชุด) จะกลายเป็น 1 สีของลุค ชุดประเภทอื่นให้ปล่อยว่างไว้ ไม่ให้มีอะไรปนมา ใช้ของจากเกมพื้นฐานกับแพ็คเดียวจะดีที่สุด',
    },
    {
      title: 'บันทึกซิมลงแกลเลอรี่',
      figure: `<div class="fig-gallery"><div class="card"><i></i><div><b>บันทึกลงคลังของฉัน</b><br><small>ไม่ต้องแชร์ให้คนอื่นเห็น</small></div></div></div>`,
      text: 'บันทึกซิมลงคลังในแกลเลอรี่ แค่บันทึกไว้ก็พอ ไม่ต้องอัปโหลดให้คนอื่นเห็น จากนั้นปิดเกมได้เลย',
    },
    {
      title: 'เลือกโฟลเดอร์ Tray',
      figure: `<div class="fig-path">Documents<br>└ Electronic Arts<br>&nbsp;&nbsp;&nbsp;└ The Sims 4<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ <b>Tray</b> &nbsp;← เลือกโฟลเดอร์นี้</div>`,
      text: 'โปรแกรมจะอ่านซิมที่บันทึกไว้จากโฟลเดอร์ Tray เบราว์เซอร์จะถามว่าจะอัปโหลดโฟลเดอร์ไหม ไม่ต้องกังวล ไฟล์ถูกอ่านในเครื่องนี้เท่านั้น ไม่ถูกส่งออกไปไหน',
    },
    {
      title: 'ทำต่อในโปรแกรม',
      figure: '<div class="fig-mini" data-mini></div>',
      text: 'เท่านี้เอง! เลือกชุด ตั้งแท็ก เลือกท่าโพส แล้วปรับรายละเอียดตามชอบ เสร็จแล้วกด Export แล้วนำไฟล์ .package ไปใส่ในโฟลเดอร์ Mods',
    },
  ];

  function open() {
    const root = document.getElementById('modal-root');
    let i = 0;
    root.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="tut-title">
          <button class="icon-btn close" title="ปิด">${SLS.icons.close}</button>
          <h2 class="tut-title" id="tut-title"></h2>
          <div class="tut-figure"></div>
          <p class="tut-text"></p>
          <div class="tut-nav">
            <button class="btn btn-ghost btn-small" data-prev>${SLS.icons.chevronLeft} ย้อนกลับ</button>
            <div class="dots">${steps.map(() => '<span></span>').join('')}</div>
            <button class="btn btn-primary btn-small" data-next></button>
          </div>
        </div>
      </div>`;
    const $ = s => root.querySelector(s);
    const done = () => { try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* storage unavailable */ } root.innerHTML = ''; document.removeEventListener('keydown', onKey); };
    const render = () => {
      const st = steps[i];
      $('.tut-title').textContent = st.title;
      $('.tut-figure').innerHTML = st.figure;
      const mini = $('[data-mini]');
      if (mini) mini.innerHTML = SLS.app.miniEditorHTML();
      $('.tut-text').textContent = st.text;
      $('[data-prev]').style.visibility = i ? 'visible' : 'hidden';
      $('[data-next]').innerHTML = i === steps.length - 1 ? `เริ่มเลย ${SLS.icons.chevronRight}` : `ถัดไป ${SLS.icons.chevronRight}`;
      root.querySelectorAll('.dots span').forEach((d, k) => d.classList.toggle('on', k === i));
    };
    const onKey = e => {
      if (e.key === 'Escape') done();
      if (e.key === 'ArrowRight' && i < steps.length - 1) { i++; render(); }
      if (e.key === 'ArrowLeft' && i > 0) { i--; render(); }
    };
    $('.close').onclick = done;
    $('[data-prev]').onclick = () => { if (i > 0) { i--; render(); } };
    $('[data-next]').onclick = () => { if (i < steps.length - 1) { i++; render(); } else done(); };
    document.addEventListener('keydown', onKey);
    render();
  }

  function seen() { try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; } }

  SLS.tutorial = { open, seen };
})(globalThis.SLS = globalThis.SLS || {});
