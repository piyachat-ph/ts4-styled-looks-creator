// Little-endian binary reader/writer helpers.
(function (SLS) {
  class Reader {
    constructor(bytes, pos = 0) {
      this.bytes = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
      this.view = new DataView(this.bytes.buffer, this.bytes.byteOffset, this.bytes.byteLength);
      this.pos = pos;
    }
    get eof() { return this.pos >= this.bytes.length; }
    u8() { return this.view.getUint8(this.pos++); }
    u16() { const v = this.view.getUint16(this.pos, true); this.pos += 2; return v; }
    u32() { const v = this.view.getUint32(this.pos, true); this.pos += 4; return v; }
    i32() { const v = this.view.getInt32(this.pos, true); this.pos += 4; return v; }
    u64() { const v = this.view.getBigUint64(this.pos, true); this.pos += 8; return v; }
    f32() { const v = this.view.getFloat32(this.pos, true); this.pos += 4; return v; }
    bytesN(n) { const v = this.bytes.subarray(this.pos, this.pos + n); this.pos += n; return v; }
    ascii(n) { return new TextDecoder('latin1').decode(this.bytesN(n)); }
  }

  class Writer {
    constructor(size = 1024) { this.buf = new Uint8Array(size); this.pos = 0; }
    ensure(n) {
      if (this.pos + n <= this.buf.length) return;
      let s = this.buf.length * 2;
      while (s < this.pos + n) s *= 2;
      const nb = new Uint8Array(s); nb.set(this.buf); this.buf = nb;
    }
    get view() { return new DataView(this.buf.buffer); }
    u8(v) { this.ensure(1); this.buf[this.pos++] = v & 0xff; return this; }
    u16(v) { this.ensure(2); this.view.setUint16(this.pos, v, true); this.pos += 2; return this; }
    u32(v) { this.ensure(4); this.view.setUint32(this.pos, v >>> 0, true); this.pos += 4; return this; }
    i32(v) { this.ensure(4); this.view.setInt32(this.pos, v, true); this.pos += 4; return this; }
    u64(v) { this.ensure(8); this.view.setBigUint64(this.pos, BigInt.asUintN(64, BigInt(v)), true); this.pos += 8; return this; }
    f32(v) { this.ensure(4); this.view.setFloat32(this.pos, v, true); this.pos += 4; return this; }
    bytes(b) { this.ensure(b.length); this.buf.set(b, this.pos); this.pos += b.length; return this; }
    ascii(s) { for (let i = 0; i < s.length; i++) this.u8(s.charCodeAt(i)); return this; }
    toBytes() { return this.buf.slice(0, this.pos); }
  }

  const hex = (v, w) => v.toString(16).toUpperCase().padStart(w, '0');

  SLS.bin = { Reader, Writer, hex };
})(globalThis.SLS = globalThis.SLS || {});
