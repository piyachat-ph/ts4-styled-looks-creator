// Minimal schema-less protobuf decoder.
// decode(bytes) -> Map<fieldNumber, Array<{ wire, value }>>
// wire 0: value BigInt varint, 1: Uint8Array(8), 2: Uint8Array, 5: Uint8Array(4)
(function (SLS) {
  function varint(b, p) {
    let r = 0n, s = 0n;
    for (;;) {
      if (p.i >= b.length) throw new Error('truncated varint');
      const c = b[p.i++];
      r |= BigInt(c & 0x7f) << s;
      if (!(c & 0x80)) return r;
      s += 7n;
    }
  }

  function decode(b) {
    const out = new Map();
    const p = { i: 0 };
    while (p.i < b.length) {
      const key = Number(varint(b, p));
      const field = key >>> 3, wire = key & 7;
      let value;
      if (wire === 0) value = varint(b, p);
      else if (wire === 1) { value = b.subarray(p.i, p.i + 8); p.i += 8; }
      else if (wire === 2) { const n = Number(varint(b, p)); value = b.subarray(p.i, p.i + n); p.i += n; }
      else if (wire === 5) { value = b.subarray(p.i, p.i + 4); p.i += 4; }
      else throw new Error('unsupported wire type ' + wire);
      if (p.i > b.length || field === 0) throw new Error('bad protobuf');
      if (!out.has(field)) out.set(field, []);
      out.get(field).push({ wire, value });
    }
    return out;
  }

  // Typed accessors over a decoded message.
  class Msg {
    constructor(bytes) { this.f = bytes ? decode(bytes) : new Map(); }
    has(n) { return this.f.has(n); }
    all(n) { return this.f.get(n) || []; }
    first(n) { const a = this.f.get(n); return a ? a[0] : undefined; }
    u64(n, d = 0n) {
      const e = this.first(n); if (!e) return d;
      if (e.wire === 0) return e.value;
      if (e.wire === 1) return new DataView(e.value.buffer, e.value.byteOffset, 8).getBigUint64(0, true);
      return d;
    }
    u32(n, d = 0) { return this.has(n) ? Number(BigInt.asUintN(32, this.u64(n))) : d; }
    bool(n, d = false) { return this.has(n) ? this.u64(n) !== 0n : d; }
    f32(n, d = 0) {
      const e = this.first(n);
      return e && e.wire === 5 ? new DataView(e.value.buffer, e.value.byteOffset, 4).getFloat32(0, true) : d;
    }
    bytes(n) { const e = this.first(n); return e && e.wire === 2 ? e.value : undefined; }
    str(n, d = '') { const b = this.bytes(n); return b ? new TextDecoder().decode(b) : d; }
    msg(n) { const b = this.bytes(n); return b ? new Msg(b) : undefined; }
    msgs(n) { return this.all(n).filter(e => e.wire === 2).map(e => new Msg(e.value)); }
    // Repeated scalar varints, packed or not.
    varints(n) {
      const r = [];
      for (const e of this.all(n)) {
        if (e.wire === 0) r.push(e.value);
        else if (e.wire === 2) { const p = { i: 0 }; while (p.i < e.value.length) r.push(varint(e.value, p)); }
      }
      return r;
    }
  }

  SLS.pb = { decode, Msg };
})(globalThis.SLS = globalThis.SLS || {});
