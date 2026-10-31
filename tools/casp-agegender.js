// Research: for every CAS part a look's first SimInfo outfit uses, find the CASP in Mods (CC) or report EA,
// and read its age/gender flags (found as the u32 right after bodyType [+ bodySubType]).
// usage: node casp-agegender.js <look.package> <ModsDir>
const S = require('./load.js');
const fs = require('fs');
const path = require('path');
const [pkg, mods] = process.argv.slice(2);
const look = S.readPackage(pkg);
const si = S.siminfo.parse(look.find(e => e.type === S.siminfo.TYPE).data);
const parts = si.outfits[0].outfits[0].parts.concat(si.geneticParts.map(p => ({ ...p, genetic: true })));
const want = new Map(parts.map(p => [p.key.instance, p]));

const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.package$/i.test(e.name)) files.push(p); } })(mods);
const found = new Map();
for (const f of files) {
  let entries; try { entries = S.readBigPackage(f); } catch { continue; }
  for (const e of entries) if (e.type === 0x034aeecb && want.has(e.instance)) found.set(e.instance, { f, e });
}
const ageName = a => ['baby', 'toddler', 'child', 'teen', 'YA', 'adult', 'elder', 'infant'].filter((_, i) => a & (1 << i)).join('+');
for (const p of parts) {
  const hit = found.get(p.key.instance);
  let flags = '';
  if (hit) {
    const d = Buffer.from(hit.e.data);
    for (let i = 8; i + 12 <= Math.min(d.length, 600); i++) {
      if (d.readUInt32LE(i) !== p.bodyType) continue;
      for (const off of [4, 8]) {
        const ag = d.readUInt32LE(i + off);
        if ((ag & 0xffffcf00) === 0 && (ag & 0x3000) && (ag & 0xff)) { flags = `ag=0x${ag.toString(16)} (${ageName(ag)} ${ag & 0x1000 ? 'M' : ''}${ag & 0x2000 ? 'F' : ''})`; break; }
      }
      if (flags) break;
    }
  }
  console.log(`${p.genetic ? 'genetic' : 'outfit '} bt${String(p.bodyType).padEnd(3)} ${p.key.instance.toString(16).padStart(16, '0')} ${hit ? 'CC group=0x' + hit.e.group.toString(16) + ' ' + flags + ' ' + path.basename(hit.f) : (p.key.instance > 0xffffffffn ? 'NOT FOUND' : 'EA')}`);
}
