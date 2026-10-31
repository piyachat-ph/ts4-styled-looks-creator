// End-to-end test: load the real Tray folder, build a package for one sim, re-read and validate it.
// usage: node test-build.js <TrayFolder> <out.package> [simNameFilter]
const S = require('./load.js');
const fs = require('fs');
const path = require('path');

(async () => {
  const [dir, out, filter] = process.argv.slice(2);
  const files = fs.readdirSync(dir).map(name => {
    const full = path.join(dir, name);
    return { name, lastModified: fs.statSync(full).mtimeMs, read: async () => new Uint8Array(fs.readFileSync(full)) };
  });
  const t0 = Date.now();
  const sims = await S.tray.load(files);
  console.log(`tray: ${sims.length} sims with Everyday outfits (${Date.now() - t0} ms)`);
  sims.slice(0, 8).forEach(s => console.log(' ', s.firstName, s.lastName, 'age', s.age, 'gender', s.gender, 'everyday', s.everyday.length, 'household', JSON.stringify(s.household), 'thumb', !!s.thumbnail));
  const sim = sims.find(s => !filter || `${s.firstName} ${s.lastName}`.includes(filter)) || sims[0];
  const female = sim.gender === 0x2000;
  const look = {
    name: 'Test Look', creator: 'Tester', ages: ['teen', 'youngAdult', 'adult', 'elder'], genders: [female ? 'female' : 'male'], hair: false,
    outfitCategories: ['everyday'], occults: ['human'], pose: female ? 'FeaturedLook_F_CoverGirl' : 'FeaturedLook_M_Confident',
    swatches: sim.everyday.map((outfit, i) => ({ sim, outfit, color: [0xff3b82f6, 0xff8b5cf6, 0xffef4444, 0xff10b981, 0xfff59e0b][i % 5] })),
  };
  const pkg = S.build.buildPackage([look]);
  fs.writeFileSync(out, pkg);
  console.log(`built ${out} (${pkg.length} bytes) from ${sim.firstName} ${sim.lastName} with ${look.swatches.length} swatches`);

  // Validate by re-reading every resource.
  for (const e of S.readPackage(out)) {
    const d = e.data;
    if (e.type === S.siminfo.TYPE) {
      const si = S.siminfo.parse(d);
      const rt = S.siminfo.write(si);
      console.log('  SimInfo', e.instance.toString(16), 'parts', si.outfits[0].outfits[0].parts.length, 'links', si.links.length, 'roundtrip', rt.length === d.length && rt.every((v, i) => v === d[i]));
    } else if (e.type === S.styledlook.TYPE) {
      const l = S.styledlook.parse(d);
      console.log('  StyledLook', e.instance.toString(16), 'proto', l.prototypeId.toString(16), 'sim', l.simInfo.toString(16), 'ag', l.ageGender.toString(16), 'pose', l.pose, 'color', l.colors[0].toString(16), 'tags', l.tags.map(t => t.category + ':' + t.value).join(','));
    }
  }
  // Save the thumbnail for a visual check.
  if (sim.thumbnail) fs.writeFileSync(out.replace(/\.package$/, '.jpg'), await sim.thumbnail());
})();
