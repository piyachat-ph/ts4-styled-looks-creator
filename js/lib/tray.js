// Reads saved households from the game's Tray folder.
// Files are named "0x<type>!0x<instance>.<ext>":
//   .trayitem        8-byte header + protobuf metadata (names, creator)
//   .householdbinary 16-byte header + protobuf household with full SimData
//   .sgi             per-sim thumbnail: 24-byte header + XOR-obfuscated JPEG
(function (SLS) {
  const { Msg } = SLS.pb;
  const LOW56 = 0x00ffffffffffffffn;
  const THUMB_KEY = [0x41, 0x25, 0xe6, 0xcd, 0x47, 0xba, 0xb2, 0x1a];

  function parseName(name) {
    const m = /^0x([0-9a-f]{8})!0x([0-9a-f]{16})\.(\w+)$/i.exec(name);
    return m ? { type: parseInt(m[1], 16), instance: BigInt('0x' + m[2]), ext: m[3].toLowerCase() } : null;
  }

  function decodeThumbnail(bytes) {
    const data = bytes.subarray(24);
    const out = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) out[i] = data[i] ^ THUMB_KEY[i & 7];
    return out;
  }

  // The game stores the thumbnail's transparency as a grayscale PNG inside an
  // APP0 segment tagged "ALFA" ([FF E0][len]["ALFA"][u32 BE size][PNG]).
  function extractAlpha(jpeg) {
    for (let p = 2; p + 4 < jpeg.length && jpeg[p] === 0xff;) {
      const marker = jpeg[p + 1], len = (jpeg[p + 2] << 8) | jpeg[p + 3];
      if (marker === 0xe0 && jpeg[p + 4] === 0x41 && jpeg[p + 5] === 0x4c && jpeg[p + 6] === 0x46 && jpeg[p + 7] === 0x41) {
        const size = ((jpeg[p + 8] << 24) | (jpeg[p + 9] << 16) | (jpeg[p + 10] << 8) | jpeg[p + 11]) >>> 0;
        return jpeg.subarray(p + 12, p + 12 + size);
      }
      if (marker === 0xda) break;
      p += 2 + len;
    }
    return null;
  }

  // Every EA CAS part id (all 228k across base game and packs) fits in 32 bits, while
  // CC tools assign 64-bit hashes, so a larger id means the part is custom content.
  const isCustomContent = id => id > 0xffffffffn;

  // Packed repeated fixed64 (IdList.ids).
  function fixed64s(msg, n) {
    const r = [];
    for (const e of msg ? msg.all(n) : []) {
      const dv = new DataView(e.value.buffer, e.value.byteOffset, e.value.length);
      if (e.wire === 1) r.push(dv.getBigUint64(0, true));
      else if (e.wire === 2) for (let i = 0; i + 8 <= e.value.length; i += 8) r.push(dv.getBigUint64(i, true));
    }
    return r;
  }

  const floats = (s, n) => {
    const a = (s || '').split(',').filter(x => x.trim() !== '').map(Number);
    return Array.from({ length: n }, (_, i) => (Number.isFinite(a[i]) ? a[i] : 0));
  };

  function parseFacial(bytes) {
    const m = new Msg(bytes || new Uint8Array());
    const mods = n => m.msgs(n).map(x => ({ key: x.u64(1), weight: x.f32(2) }));
    return { sculpts: m.varints(1), face: mods(2), body: mods(3), extraA: mods(4), extraB: mods(5) };
  }

  function parseOutfit(o) {
    const ids = fixed64s(o.msg(5), 1);
    const bodyTypes = o.msg(7) ? o.msg(7).varints(1).map(Number) : [];
    const shifts = o.msg(12) ? o.msg(12).varints(1) : [];
    return {
      id: o.u64(1), category: o.u32(2), created: o.u64(6),
      parts: ids.map((id, i) => ({ id, bodyType: bodyTypes[i] ?? 0, colorShift: shifts[i] ?? 0x4000000000000000n })),
    };
  }

  function parseSim(s) {
    const genetic = s.msg(28);
    const outfits = (s.msg(21) ? s.msg(21).msgs(1) : []).map(parseOutfit);
    return {
      id: s.u64(1), firstName: s.str(5), lastName: s.str(6),
      gender: s.u32(7), age: s.u32(8), species: s.u32(60, 1) || 1,
      voicePitch: s.f32(9), skintone: s.u64(10), voiceActor: s.u32(11), voiceEffect: s.u64(54),
      skintoneShift: s.f32(67), flags: s.u32(29) & 0xff, aspiration: s.u64(34),
      physique: floats(s.str(12), 8),
      facial: parseFacial(s.bytes(18)),
      pelts: (s.msg(63) ? s.msg(63).msgs(1) : []).map(p => ({ id: p.u64(1), color: p.u32(2) })),
      genetic: genetic ? {
        facial: parseFacial(genetic.bytes(1)),
        physique: floats(genetic.str(2), 4),
        voicePitch: genetic.f32(3), voiceActor: genetic.u32(4),
        parts: (genetic.msg(5) ? genetic.msg(5).msgs(1) : []).map(p => ({ id: p.u64(1), bodyType: p.u32(2) })),
        growth: (genetic.msg(6) ? genetic.msg(6).msgs(1) : []).map(p => ({ id: p.u64(1), bodyType: p.u32(2) })),
      } : null,
      outfits,
    };
  }

  function parseHousehold(bytes) {
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const len = Math.min(dv.getUint32(12, true), bytes.length - 16);
    const hh = new Msg(bytes.subarray(16, 16 + len)).msg(1);
    return hh ? hh.msgs(6).filter(s => s.has(21)).map(parseSim) : [];
  }

  function parseTrayItem(bytes) {
    const m = new Msg(bytes.subarray(8));
    return { kind: m.u32(2), name: m.str(4), description: m.str(5), creator: m.str(7) };
  }

  // files: [{ name, lastModified, read: () => Promise<Uint8Array> }]
  // onProgress(done, total) optional. Returns sims that have Everyday outfits.
  async function load(files, onProgress) {
    const byName = new Map();
    for (const f of files) { const p = parseName(f.name); if (p) byName.set(f, p); }
    const households = [...byName].filter(([, p]) => p.ext === 'householdbinary');
    const thumbs = new Map();
    // A sim's .sgi carries the sim id as its instance; older saves are matched by position.
    for (const [f, p] of byName) if (p.ext === 'sgi') { thumbs.set(p.instance, f); thumbs.set(p.instance & LOW56, f); }
    const items = new Map();
    for (const [f, p] of byName) if (p.ext === 'trayitem') items.set(p.instance, f);

    const sims = [];
    let done = 0;
    for (const [file, p] of households) {
      try {
        const meta = items.has(p.instance) ? parseTrayItem(await items.get(p.instance).read()) : { name: '', creator: '' };
        const list = parseHousehold(await file.read());
        for (let i = 0; i < list.length; i++) {
          const sim = list[i];
          const thumbFile = thumbs.get(sim.id) || thumbs.get(((p.instance & LOW56) + BigInt(i + 1)) & LOW56);
          sims.push({
            ...sim,
            key: `${p.instance.toString(16)}:${i}`,
            household: meta.name, creator: meta.creator,
            date: file.lastModified,
            thumbnail: thumbFile ? async () => decodeThumbnail(await thumbFile.read()) : null,
            everyday: sim.outfits.filter(o => o.category === 0 && o.parts.length),
          });
          const s = sims[sims.length - 1];
          s.ccParts = s.everyday.reduce((n, o) => n + o.parts.filter(p => isCustomContent(p.id)).length, 0);
        }
      } catch (err) {
        console.warn('Skipping tray household', file.name, err);
      }
      if (onProgress) onProgress(++done, households.length);
    }
    // Humans only: pets use a different body and age system.
    return sims.filter(s => s.species === 1 && s.everyday.length).sort((a, b) => b.date - a.date);
  }

  SLS.tray = { load, isCustomContent, parseName, parseHousehold, parseTrayItem, decodeThumbnail, extractAlpha };
})(globalThis.SLS = globalThis.SLS || {});
