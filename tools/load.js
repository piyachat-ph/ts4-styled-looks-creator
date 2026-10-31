// Loads the browser library files into Node for research and tests.
const path = require('path');
const zlib = require('zlib');
const APP_DIR = process.env.APP_DIR || path.join(__dirname, '..');
const lib = path.join(APP_DIR, 'js', 'lib');
for (const f of ['binary.js', 'fnv.js', 'dbpf.js', 'protobuf.js', 'tray.js', 'siminfo.js', 'styledlook.js', 'stbl.js', 'build.js']) {
  try { require(path.join(lib, f)); } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') throw e; }
}
const SLS = globalThis.SLS;
SLS.inflate = b => new Uint8Array(zlib.inflateSync(b));
SLS.readPackage = file => {
  const bytes = new Uint8Array(require('fs').readFileSync(file));
  return SLS.dbpf.readIndex(bytes).map(e => ({ ...e, get data() { return SLS.dbpf.readEntry(bytes, e, SLS.inflate); } }));
};
// For multi-GB game packages: read the index and entries via file handle.
SLS.readBigPackage = file => {
  const fs = require('fs');
  const fd = fs.openSync(file, 'r');
  const read = (pos, n) => { const b = Buffer.alloc(n); fs.readSync(fd, b, 0, n, pos); return new Uint8Array(b); };
  const hdr = read(0, 96);
  const dv = new DataView(hdr.buffer);
  const indexPos = dv.getUint32(64, true), indexSize = dv.getUint32(44, true);
  // Build a fake buffer containing header + index at its offset, so readIndex works unchanged.
  const fake = new Uint8Array(indexPos + indexSize);
  fake.set(hdr); fake.set(read(indexPos, indexSize), indexPos);
  return SLS.dbpf.readIndex(fake).map(e => ({ ...e, get data() {
    const raw = read(e.offset, e.fileSize);
    return SLS.dbpf.readEntry(raw, { ...e, offset: 0 }, SLS.inflate);
  } }));
};
SLS.hexs = b => Buffer.from(b).toString('hex').toUpperCase();
module.exports = SLS;
