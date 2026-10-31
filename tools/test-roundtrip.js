// Test: StyledLook and STBL writers reproduce reference files byte-for-byte.
const S = require('./load.js');
const fs = require('fs');
const eq = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
let ok = 0, bad = 0;
const check = (name, a, b) => { if (eq(a, b)) ok++; else { bad++; if (bad < 5) console.log('MISMATCH', name, '\n ', S.hexs(a), '\n ', S.hexs(b)); } };

const sample = process.argv[2] && process.argv[2] !== '-' ? S.readPackage(process.argv[2]) : []; // '-' = EA looks only
for (const e of sample) {
  if (e.type === S.styledlook.TYPE) check('pawpy look ' + e.instance.toString(16), S.styledlook.write(S.styledlook.parse(e.data)), e.data);
  if (e.type === S.stbl.TYPE && e.instance >> 56n === 0n) check('pawpy stbl', S.stbl.write([{ key: 0xb5bd57f8, text: 'Casual Academia' }]), e.data);
}
if (process.argv[3]) for (const l of JSON.parse(fs.readFileSync(process.argv[3], 'utf8'))) {
  const b = Uint8Array.from(Buffer.from(l.hex, 'hex'));
  check('ea look ' + l.instance, S.styledlook.write(S.styledlook.parse(b)), b);
}
console.log('ok', ok, 'bad', bad);
