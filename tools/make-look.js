// Build a look package from a Tray sim with a given background color (for in-game testing).
// usage: node make-look.js <TrayFolder> <out.package> <simName> <lookName> <#RRGGBB background>
const S = require('./load.js');
const fs = require('fs');
const path = require('path');

(async () => {
  const [dir, out, filter, name, bg] = process.argv.slice(2);
  const files = fs.readdirSync(dir).map(n => {
    const full = path.join(dir, n);
    return { name: n, lastModified: fs.statSync(full).mtimeMs, read: async () => new Uint8Array(fs.readFileSync(full)) };
  });
  const sim = (await S.tray.load(files)).find(s => `${s.firstName} ${s.lastName}`.includes(filter));
  const female = sim.gender === 0x2000;
  const colors = [0xff3b82f6, 0xff9333ea, 0xffef4444, 0xff10b981, 0xfff59e0b];
  const pkg = S.build.buildPackage([{
    name, creator: 'Tester', background: parseInt(bg.replace('#', ''), 16),
    ages: ['teen', 'youngAdult', 'adult', 'elder'], genders: [female ? 'female' : 'male'], hair: false,
    outfitCategories: ['everyday'], occults: ['human', 'fairy', 'vampire', 'witch'],
    pose: female ? 'FeaturedLook_F_CoverGirl' : 'FeaturedLook_M_Confident',
    swatches: sim.everyday.map((outfit, i) => ({ sim, outfit, color: colors[i % 5] })),
  }]);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, pkg);
  console.log('wrote', out, pkg.length, 'bytes for', sim.firstName, sim.lastName);
})();
