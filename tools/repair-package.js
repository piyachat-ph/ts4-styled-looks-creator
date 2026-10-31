// Repair an already-exported look: store each SimInfo model as a young adult and drop growth parts.
// usage: node repair-package.js <in.package> <out.package>
const S = require('./load.js');
const fs = require('fs');
const [src, out] = process.argv.slice(2);
const resources = S.readPackage(src).map(e => {
  let data = e.data;
  if (e.type === S.siminfo.TYPE) {
    const si = S.siminfo.parse(data);
    if (si.age >= 0x08 && si.age <= 0x40) si.age = 0x10;
    si.growthParts = [];
    for (const k of si.links) if (k.type === 0x034aeecb && k.instance > 0xffffffffn) k.group = 0x80000000;
    data = S.siminfo.write(si);
  }
  return { type: e.type, group: e.group, instance: e.instance, data: Uint8Array.from(data) };
});
fs.writeFileSync(out, S.dbpf.writePackage(resources));
console.log('wrote', out);
