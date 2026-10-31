// String table (STBL, type 0x220557DA), version 5.
(function (SLS) {
  const { Writer } = SLS.bin;

  const TYPE = 0x220557da;
  const GROUP = 0x80000000;
  // Language codes in the instance's top byte (same set Sims 4 Studio's
  // "Copy string tables to all languages" produces).
  const LANGUAGES = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x11, 0x12, 0x13, 0x15];

  // entries: [{ key: uint32, text: string }]
  function write(entries) {
    const enc = new TextEncoder();
    const strs = entries.map(e => enc.encode(e.text));
    const w = new Writer(64);
    w.ascii('STBL').u16(5).u8(0).u64(entries.length).u16(0);
    w.u32(strs.reduce((n, s) => n + s.length + 1, 0));
    entries.forEach((e, i) => { w.u32(e.key).u8(0).u16(strs[i].length).bytes(strs[i]); });
    return w.toBytes();
  }

  // Low 56 bits of a 64-bit hash, with the language in the top byte.
  const instanceFor = (hash64, lang) => (BigInt(lang) << 56n) | (hash64 & 0x00ffffffffffffffn);

  SLS.stbl = { TYPE, GROUP, LANGUAGES, write, instanceFor };
})(globalThis.SLS = globalThis.SLS || {});
