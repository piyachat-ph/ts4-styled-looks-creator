// Research: version histogram of SimInfo / StyledLook resources in a game package,
// and parse test of SimInfo v0x26 entries. usage: node probe-game.js <package> [dumpStyledLooksTo.json]
const S = require('./load.js');
const res = S.readBigPackage(process.argv[2]);
const hist = {};
let ok = 0, bad = 0;
const looks = [];
for (const e of res) {
  if (e.type !== S.siminfo.TYPE && e.type !== 0x71bdb8a2) continue;
  const b = e.data;
  const v = new DataView(b.buffer, b.byteOffset).getUint32(0, true);
  const k = (e.type === S.siminfo.TYPE ? 'SimInfo' : 'StyledLook') + ' v0x' + v.toString(16);
  hist[k] = (hist[k] || 0) + 1;
  if (e.type === S.siminfo.TYPE && v === 0x26) {
    try {
      const si = S.siminfo.parse(b), out = S.siminfo.write(si);
      if (si.tail.length === 0 && out.length === b.length && out.every((x, i) => x === b[i])) ok++; else bad++;
    } catch { bad++; }
  }
  if (e.type === 0x71bdb8a2) looks.push({ instance: e.instance.toString(16), hex: S.hexs(b) });
}
console.log(hist, 'siminfo v26 roundtrip ok', ok, 'bad', bad);
if (process.argv[3]) require('fs').writeFileSync(process.argv[3], JSON.stringify(looks));
