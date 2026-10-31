// FNV-1 hashes as used by The Sims 4 (input lower-cased, ASCII/UTF-8 bytes).
(function (SLS) {
  const enc = new TextEncoder();

  function fnv32(str) {
    let h = 0x811c9dc5;
    for (const c of enc.encode(str.toLowerCase())) {
      h = Math.imul(h, 0x01000193) >>> 0;
      h = (h ^ c) >>> 0;
    }
    return h >>> 0;
  }

  function fnv64(str) {
    let h = 0xcbf29ce484222325n;
    const mask = 0xffffffffffffffffn;
    for (const c of enc.encode(str.toLowerCase())) {
      h = (h * 0x100000001b3n) & mask;
      h ^= BigInt(c);
    }
    return h;
  }

  SLS.fnv = { fnv32, fnv64 };
})(globalThis.SLS = globalThis.SLS || {});
