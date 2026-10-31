// DBPF 2.1 package reader/writer (The Sims 4 .package).
// Writing stores resources uncompressed, which the game accepts.
(function (SLS) {
  const { Reader, Writer } = SLS.bin;

  function readIndex(bytes) {
    const r = new Reader(bytes);
    if (r.ascii(4) !== 'DBPF') throw new Error('Not a DBPF package');
    r.pos = 36; const count = r.u32();
    r.pos = 64; let indexPos = r.u32();
    if (!indexPos) { r.pos = 40; indexPos = r.u32(); }
    r.pos = indexPos;
    const flags = r.u32();
    const cType = flags & 1 ? r.u32() : 0;
    const cGroup = flags & 2 ? r.u32() : 0;
    const cHi = flags & 4 ? r.u32() : 0;
    const entries = [];
    for (let i = 0; i < count; i++) {
      const type = flags & 1 ? cType : r.u32();
      const group = flags & 2 ? cGroup : r.u32();
      const hi = flags & 4 ? cHi : r.u32();
      const lo = r.u32();
      const offset = r.u32();
      const fsRaw = r.u32();
      const memSize = r.u32();
      let comp = 0;
      if (fsRaw & 0x80000000) { comp = r.u16(); r.u16(); }
      entries.push({ type, group, instance: (BigInt(hi) << 32n) | BigInt(lo), offset, fileSize: fsRaw & 0x7fffffff, memSize, comp });
    }
    return entries;
  }

  // inflate: optional function(Uint8Array zlibData) -> Uint8Array, needed for compressed entries.
  function readEntry(bytes, e, inflate) {
    const raw = bytes.subarray(e.offset, e.offset + e.fileSize);
    if (e.comp === 0) return raw;
    if (e.comp === 0x5a42) {
      if (!inflate) throw new Error('zlib entry needs inflate()');
      return inflate(raw);
    }
    if (e.comp === 0xffff) return refpack(raw);
    throw new Error('Unsupported compression 0x' + e.comp.toString(16));
  }

  function refpack(s) {
    let p = 0;
    const f = s[p++]; p++;
    let size;
    if (f & 0x80) { size = (s[p] << 24 | s[p + 1] << 16 | s[p + 2] << 8 | s[p + 3]) >>> 0; p += 4; }
    else { size = s[p] << 16 | s[p + 1] << 8 | s[p + 2]; p += 3; }
    const d = new Uint8Array(size); let q = 0;
    while (p < s.length) {
      const b0 = s[p++]; let plain, copy = 0, off = 0;
      if (b0 < 0x80) { const b1 = s[p++]; plain = b0 & 3; copy = ((b0 & 0x1c) >> 2) + 3; off = ((b0 & 0x60) << 3) + b1 + 1; }
      else if (b0 < 0xc0) { const b1 = s[p++], b2 = s[p++]; plain = (b1 & 0xc0) >> 6; copy = (b0 & 0x3f) + 4; off = ((b1 & 0x3f) << 8) + b2 + 1; }
      else if (b0 < 0xe0) { const b1 = s[p++], b2 = s[p++], b3 = s[p++]; plain = b0 & 3; copy = ((b0 & 0x0c) << 6) + b3 + 5; off = ((b0 & 0x10) << 12) + (b1 << 8) + b2 + 1; }
      else if (b0 < 0xfc) { plain = ((b0 & 0x1f) << 2) + 4; }
      else { plain = b0 & 3; }
      for (let i = 0; i < plain; i++) d[q++] = s[p++];
      for (let i = 0; i < copy; i++) { d[q] = d[q - off]; q++; }
      if (b0 >= 0xfc) break;
    }
    return d;
  }

  // resources: [{ type, group, instance (BigInt), data (Uint8Array) }]
  function writePackage(resources) {
    const w = new Writer(96 + resources.reduce((n, r) => n + r.data.length, 0) + resources.length * 32 + 64);
    w.ascii('DBPF').u32(2).u32(1);
    while (w.pos < 96) w.u8(0);
    const offsets = resources.map(r => { const o = w.pos; w.bytes(r.data); return o; });
    const indexPos = w.pos;
    w.u32(0); // index flags: no constant fields
    resources.forEach((r, i) => {
      w.u32(r.type).u32(r.group)
        .u32(Number(r.instance >> 32n)).u32(Number(r.instance & 0xffffffffn))
        .u32(offsets[i]).u32((r.data.length | 0x80000000) >>> 0).u32(r.data.length)
        .u16(0).u16(1);
    });
    const indexSize = w.pos - indexPos;
    const v = w.view;
    v.setUint32(36, resources.length, true);
    v.setUint32(44, indexSize, true);
    v.setUint32(60, 3, true); // index minor version
    v.setUint32(64, indexPos, true);
    return w.toBytes();
  }

  SLS.dbpf = { readIndex, readEntry, writePackage, refpack };
})(globalThis.SLS = globalThis.SLS || {});
