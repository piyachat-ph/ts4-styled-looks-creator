// Research: summarize every resource in a styled look package (SimInfo, StyledLook, STBL, images).
const S = require('./load.js');
const hex = v => '0x' + BigInt(v).toString(16).toUpperCase();
for (const e of S.readPackage(process.argv[2])) {
  const d = e.data;
  const head = `${e.type.toString(16).padStart(8, '0')}:${e.group.toString(16)}:${e.instance.toString(16).padStart(16, '0')} comp=${e.comp.toString(16)} size=${d.length}`;
  if (e.type === S.styledlook.TYPE) {
    const l = S.styledlook.parse(d);
    console.log(head, '\n  LOOK', JSON.stringify({ ver: l.version, ag: hex(l.ageGender), proto: hex(l.prototypeId), primary: l.primary, u1: l.unknown1, sim: hex(l.simInfo), bg: hex(l.background), cam: hex(l.thumbCamera), name: hex(l.nameHash), desc: hex(l.descHash), reserved: l.reserved.join(','), sort: l.sortOrder, u3: l.unknown3, pose: l.pose, colors: l.colors.map(hex), tags: l.tags.map(t => t.category + ':' + t.value), u4: l.unknown4 }));
  } else if (e.type === S.siminfo.TYPE) {
    const si = S.siminfo.parse(d);
    let rt = [];
    try { rt = S.siminfo.write(si); } catch (err) { console.log('  write failed:', err.message, 'version', hex(si.version), 'links', si.links.length); console.log('  ', S.hexs(d.subarray(0, 160))); }
    console.log(head, '\n  SIM', `v=${hex(si.version)} age=${hex(si.age)} gender=${hex(si.gender)} pron=${si.pronouns.length} sculpts=${si.sculpts.length} face=${si.faceMods.length} body=${si.bodyMods.length} exA=${si.extraModsA.length} exB=${si.extraModsB.length} u2=${hex(si.unknown2)} u3=${hex(si.unknown3)} gParts=${si.geneticParts.length} growth=${si.growthParts.length} flags=${si.flags} u4=${si.unknown4} asp=${hex(si.aspiration)} traits=${si.traits.length} tail=${si.tail.length} roundtrip=${rt.length === d.length && rt.every((v, i) => v === d[i])}`);
    for (const c of si.outfits) for (const o of c.outfits) console.log(`    cat${c.category} cu=${c.unknown} id=${hex(o.id)} u=${o.unknown} f=${hex(o.flags)} f2=${hex(o.flags2)} created=${hex(o.created)} hair=${o.matchHair} parts=${o.parts.length} extras=${o.parts.some(p => p.extra.some(x => x))}`);
  } else if (e.type === S.stbl.TYPE) {
    console.log(head, '\n  STBL', Buffer.from(d).toString('latin1').replace(/[^\x20-\x7e]/g, '.'));
  } else {
    console.log(head, '\n  ', S.hexs(d.subarray(0, 48)));
  }
}
