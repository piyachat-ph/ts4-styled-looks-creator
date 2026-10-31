// SimInfo resource (type 0x025ED6F4), version 0x26 as exported by Sims 4 Studio.
// Layout follows TS4SimRipper's SIMInfo.cs (v0x20) plus the v0x26 additions
// found by comparing against real exported files (outfit "unknown" u32, second
// flags u64, and 9 extra bytes per CAS part entry).
(function (SLS) {
  const { Reader, Writer } = SLS.bin;

  const TYPE = 0x025ed6f4;
  const T_CASP = 0x034aeecb, T_SCULPT = 0x9d1ab874, T_SMOD = 0xc5f6763e;

  function parse(bytes) {
    const r = new Reader(bytes);
    const si = {};
    si.version = r.u32();
    const tgiOffset = r.u32();
    const tgiPos = r.pos + tgiOffset;
    const save = r.pos; r.pos = tgiPos;
    const links = [];
    for (let n = r.u8(), i = 0; i < n; i++) links.push({ instance: r.u64(), group: r.u32(), type: r.u32() });
    r.pos = save;
    const link = i => links[i];
    const mods = () => { const a = []; for (let n = r.u8(), i = 0; i < n; i++) a.push({ key: link(r.u8()), weight: r.f32() }); return a; };

    si.physique = Array.from({ length: 8 }, () => r.f32());
    si.age = r.u32(); si.gender = r.u32(); si.species = r.u32(); si.unknown1 = r.u32();
    si.pronouns = [];
    for (let n = r.u32(), i = 0; i < n; i++) { const c = r.u32(); si.pronouns.push({ case: c, text: c ? readString(r) : '' }); }
    si.skintone = r.u64(); si.skintoneShift = r.f32();
    si.pelts = []; for (let n = r.u8(), i = 0; i < n; i++) si.pelts.push({ id: r.u64(), color: r.u32() });
    si.sculpts = []; for (let n = r.u8(), i = 0; i < n; i++) si.sculpts.push(link(r.u8()));
    si.faceMods = mods(); si.bodyMods = mods();
    si.extraModsA = mods(); si.extraModsB = mods();
    si.voiceActor = r.u32(); si.voicePitch = r.f32(); si.voiceEffect = r.u64();
    si.unknown2 = r.u32(); si.unknown3 = r.u32();
    si.outfits = [];
    for (let n = r.u32(), i = 0; i < n; i++) {
      const cat = { category: r.u8(), unknown: r.u32(), outfits: [] };
      for (let m = r.u32(), j = 0; j < m; j++) {
        const o = { id: r.u64(), unknown: r.u32(), flags: r.u64(), flags2: r.u64(), created: r.u64(), matchHair: r.u8(), parts: [] };
        for (let k = r.u32(), q = 0; q < k; q++) o.parts.push({ key: link(r.u8()), bodyType: r.u32(), colorShift: r.u64(), extra: Array.from(r.bytesN(9)) });
        cat.outfits.push(o);
      }
      si.outfits.push(cat);
    }
    si.geneticSculpts = []; for (let n = r.u8(), i = 0; i < n; i++) si.geneticSculpts.push(link(r.u8()));
    si.geneticFaceMods = mods(); si.geneticBodyMods = mods();
    si.geneticPhysique = Array.from({ length: 4 }, () => r.f32());
    si.geneticParts = [];
    for (let n = r.u8(), i = 0; i < n; i++) si.geneticParts.push({ key: link(r.u8()), bodyType: r.u32(), extra: Array.from(r.bytesN(9)) });
    si.growthParts = [];
    for (let n = r.u8(), i = 0; i < n; i++) si.growthParts.push({ key: link(r.u8()), bodyType: r.u32() });
    si.voiceActorGenetic = r.u32(); si.voicePitchGenetic = r.f32();
    si.flags = r.u8();
    si.unknown4 = Array.from(r.bytesN(3));
    si.aspiration = r.u64();
    si.traits = []; for (let n = r.u8(), i = 0; i < n; i++) si.traits.push(r.u64());
    si.tail = Array.from(r.bytesN(tgiPos - r.pos));
    si.links = links;
    return si;
  }

  // 7-bit length-prefixed UTF-16? .NET BinaryWriter strings are 7-bit length + UTF-8.
  function readString(r) {
    let len = 0, s = 0, b;
    do { b = r.u8(); len |= (b & 0x7f) << s; s += 7; } while (b & 0x80);
    return new TextDecoder().decode(r.bytesN(len));
  }
  function writeString(w, str) {
    const b = new TextEncoder().encode(str);
    let n = b.length;
    do { let c = n & 0x7f; n >>>= 7; if (n) c |= 0x80; w.u8(c); } while (n);
    w.bytes(b);
  }

  function write(si) {
    const w = new Writer(8192);
    const links = [];
    const keyOf = k => `${k.type}:${k.group}:${k.instance}`;
    const index = new Map();
    const linkIdx = k => {
      const id = keyOf(k);
      if (!index.has(id)) { index.set(id, links.length); links.push(k); }
      return index.get(id);
    };
    const mods = a => { w.u8(a.length); for (const m of a) w.u8(linkIdx(m.key)).f32(m.weight); };

    w.u32(si.version ?? 0x26);
    const offPos = w.pos; w.u32(0);
    si.physique.forEach(v => w.f32(v));
    w.u32(si.age).u32(si.gender).u32(si.species ?? 1).u32(si.unknown1 ?? 1);
    w.u32(si.pronouns.length);
    for (const p of si.pronouns) { w.u32(p.case); if (p.case) writeString(w, p.text); }
    w.u64(si.skintone).f32(si.skintoneShift);
    w.u8(si.pelts.length); for (const p of si.pelts) w.u64(p.id).u32(p.color);
    w.u8(si.sculpts.length); for (const s of si.sculpts) w.u8(linkIdx(s));
    mods(si.faceMods); mods(si.bodyMods); mods(si.extraModsA); mods(si.extraModsB);
    w.u32(si.voiceActor).f32(si.voicePitch).u64(si.voiceEffect);
    w.u32(si.unknown2).u32(si.unknown3);
    w.u32(si.outfits.length);
    for (const cat of si.outfits) {
      w.u8(cat.category).u32(cat.unknown).u32(cat.outfits.length);
      for (const o of cat.outfits) {
        w.u64(o.id).u32(o.unknown).u64(o.flags).u64(o.flags2).u64(o.created).u8(o.matchHair).u32(o.parts.length);
        for (const p of o.parts) {
          w.u8(linkIdx(p.key)).u32(p.bodyType).u64(p.colorShift);
          w.bytes(Uint8Array.from(p.extra || new Array(9).fill(0)));
        }
      }
    }
    w.u8(si.geneticSculpts.length); for (const s of si.geneticSculpts) w.u8(linkIdx(s));
    mods(si.geneticFaceMods); mods(si.geneticBodyMods);
    si.geneticPhysique.forEach(v => w.f32(v));
    w.u8(si.geneticParts.length);
    for (const p of si.geneticParts) w.u8(linkIdx(p.key)).u32(p.bodyType).bytes(Uint8Array.from(p.extra || new Array(9).fill(0)));
    w.u8(si.growthParts.length);
    for (const p of si.growthParts) w.u8(linkIdx(p.key)).u32(p.bodyType);
    w.u32(si.voiceActorGenetic).f32(si.voicePitchGenetic);
    w.u8(si.flags).bytes(Uint8Array.from(si.unknown4 || [0, 0, 0])).u64(si.aspiration);
    w.u8(si.traits.length); for (const t of si.traits) w.u64(t);
    if (si.tail) w.bytes(Uint8Array.from(si.tail));
    const tgiPos = w.pos;
    w.view.setUint32(offPos, tgiPos - offPos - 4, true);
    w.u8(links.length);
    for (const k of links) w.u64(k.instance).u32(k.group).u32(k.type);
    return w.toBytes();
  }

  SLS.siminfo = { TYPE, T_CASP, T_SCULPT, T_SMOD, parse, write };
})(globalThis.SLS = globalThis.SLS || {});
