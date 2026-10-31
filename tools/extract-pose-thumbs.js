// Research/asset step: for each thumbnail pose, export one EA StyledLook thumbnail (type 0xCD9DE247)
// rendered in that pose. Writes <outDir>/<pose>.jpg (JPEG with embedded ALFA mask) + <pose>.alpha.png.
// usage: node extract-pose-thumbs.js <thumbnails.package> <looks.json> <outDir>
const S = require('./load.js');
const fs = require('fs');
const path = require('path');
const [pkg, looksFile, outDir] = process.argv.slice(2);
const looks = JSON.parse(fs.readFileSync(looksFile, 'utf8'));
const poseOf = new Map(looks.map(l => [BigInt('0x' + l.instance), S.styledlook.parse(Uint8Array.from(Buffer.from(l.hex, 'hex'))).pose]));
fs.mkdirSync(outDir, { recursive: true });
const done = new Set();
for (const e of S.readBigPackage(pkg)) {
  if (e.type !== 0xcd9de247) continue;
  const pose = poseOf.get(e.instance);
  if (!pose || done.has(pose)) continue;
  const d = e.data;
  if (!done.size) console.log('header', S.hexs(d.subarray(0, 24)));
  const jpeg = d[0] === 0xff && d[1] === 0xd8 ? d : null;
  if (!jpeg) { console.log('not a jpeg', pose); continue; }
  fs.writeFileSync(path.join(outDir, pose + '.jpg'), jpeg);
  const alpha = S.tray.extractAlpha(jpeg);
  if (alpha) fs.writeFileSync(path.join(outDir, pose + '.alpha.png'), alpha);
  done.add(pose);
}
console.log('exported', done.size, 'poses:', [...done].join(', '));
