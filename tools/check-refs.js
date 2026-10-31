// Research: list every resource a look's SimInfos reference (links) and whether 64-bit (CC) ones
// exist in the Mods folder. usage: node check-refs.js <look.package> <ModsDir>
const S = require('./load.js');
const fs = require('fs');
const path = require('path');
const [pkg, mods] = process.argv.slice(2);
const TYPES = { 0x034aeecb: 'CASP', 0x9d1ab874: 'Sculpt', 0xc5f6763e: 'SMOD' };

const links = new Map();
for (const e of S.readPackage(pkg)) {
  if (e.type !== S.siminfo.TYPE) continue;
  const si = S.siminfo.parse(e.data);
  const where = new Map();
  const tag = (k, w) => where.set(`${k.type}:${k.instance}`, w);
  si.sculpts.forEach(k => tag(k, 'sculpt'));
  si.faceMods.forEach(m => tag(m.key, 'faceMod'));
  si.bodyMods.forEach(m => tag(m.key, 'bodyMod'));
  si.outfits.forEach(c => c.outfits.forEach(o => o.parts.forEach(p => tag(p.key, 'outfit bt' + p.bodyType))));
  si.geneticParts.forEach(p => tag(p.key, 'genetic bt' + p.bodyType));
  for (const k of si.links) links.set(`${k.type}:${k.instance}`, { ...k, use: where.get(`${k.type}:${k.instance}`) || '?' });
  console.log('skintone', si.skintone.toString(16), 'pelts', si.pelts.length);
}
const cc = [...links.values()].filter(k => k.instance > 0xffffffffn);
console.log('links', links.size, 'CC (64-bit)', cc.length);

const found = new Map();
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.package$/i.test(e.name)) files.push(p); } })(mods);
const want = new Set(cc.map(k => `${k.type}:${k.instance}`));
for (const f of files) {
  let entries; try { entries = S.readBigPackage(f); } catch { continue; }
  for (const e of entries) { const id = `${e.type}:${e.instance}`; if (want.has(id)) found.set(id, path.relative(mods, f)); }
}
for (const k of cc) {
  const id = `${k.type}:${k.instance}`;
  console.log((found.has(id) ? 'OK     ' : 'MISSING'), (TYPES[k.type] || k.type.toString(16)).padEnd(6), k.instance.toString(16).padStart(16, '0'), k.use.padEnd(14), found.get(id) || '');
}
