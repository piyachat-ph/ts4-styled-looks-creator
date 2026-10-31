// Builds a Styled Look .package from Tray sims and the editor settings.
(function (SLS) {
  const { fnv32, fnv64 } = SLS.fnv;
  const { T_CASP, T_SCULPT, T_SMOD } = SLS.siminfo;
  const SL = SLS.styledlook;

  // Body-type bit 2 (hair) in the outfit transfer mask. EA looks ship without it.
  const FLAGS_NO_HAIR = 0x433efffffe2n;
  const FLAGS_WITH_HAIR = FLAGS_NO_HAIR | 0x4n;

  // CAS thumbnail background: uncompressed 32-bit DDS, 315x596, one color whose
  // alpha fades in from left to right. The alpha row is copied from EA's own backgrounds.
  const T_DDS = 0x00b2d882;
  const BG_W = 315, BG_H = 596;
  const BG_ALPHA = Uint8Array.from(atob('AAEBAgIDAwQEBQUGBgcHCAkJCgoLDAwNDQ4PDxARERITExQVFhYXGBgZGhsbHB0eHx8gISIjIyQlJicoKCkqKywtLi8vMDEyMzQ1Njc4OTo7PDw9Pj9AQUJDREVGR0hJSktMTU5PUFFSU1RVVldZWltcXV5fYGFiY2RlZmdoaWpsbW5vcHFyc3R1dnd4ent8fX5/gIGCg4SFh4iJiouMjY6PkJGSk5WWl5iZmpucnZ6foKGio6Slpqipqqusra6vsLGys7S1tre4ubq7vL2+v8DBwsPDxMXGx8jJysvMzc7P0NDR0tPU1dbX19jZ2tvc3N3e3+Dg4eLj5OTl5ufn6Onp6uvs7O3u7u/w8PHy8vPz9PX19vb3+Pj5+fr6+/v8/P39/v7/////////////////////////////'), c => c.charCodeAt(0));

  function backgroundDds(rgb) {
    const w = new SLS.bin.Writer(128 + BG_W * BG_H * 4);
    w.ascii('DDS ').u32(124).u32(0x100f).u32(BG_H).u32(BG_W).u32(BG_W * 4).u32(1).u32(1);
    for (let i = 0; i < 11; i++) w.u32(0);
    w.u32(32).u32(0x41).u32(0).u32(32).u32(0xff0000).u32(0xff00).u32(0xff).u32(0xff000000);
    w.u32(0x1000).u32(0).u32(0).u32(0).u32(0);
    const row = new Uint8Array(BG_W * 4);
    for (let x = 0; x < BG_W; x++) row.set([rgb & 0xff, (rgb >> 8) & 0xff, (rgb >> 16) & 0xff, BG_ALPHA[x]], x * 4);
    for (let y = 0; y < BG_H; y++) w.bytes(row);
    return w.toBytes();
  }

  // CC CAS parts live in group 0x80000000 (99.8% of a large Mods folder, and what the original
  // tool writes); with group 0 the game can't find them and the look renders blank.
  const key = (type, instance) => {
    instance = BigInt(instance);
    const group = type === T_CASP && SLS.tray.isCustomContent(instance) ? 0x80000000 : 0;
    return { type, group, instance };
  };
  const mods = list => list.map(m => ({ key: key(T_SMOD, m.key), weight: m.weight }));

  // EA and the original tool always store the model as a young adult for teen–elder looks;
  // a teen or elder model leaves the CAS thumbnail blank.
  const modelAge = age => (age >= SL.AGE.teen && age <= SL.AGE.elder ? SL.AGE.youngAdult : age);

  function simInfoFor(sim, outfit, hair) {
    const g = sim.genetic;
    return {
      version: 0x26,
      physique: sim.physique, age: modelAge(sim.age), gender: sim.gender, species: sim.species, unknown1: 1,
      pronouns: Array.from({ length: 5 }, () => ({ case: 0, text: '' })),
      skintone: sim.skintone, skintoneShift: sim.skintoneShift, pelts: sim.pelts,
      sculpts: sim.facial.sculpts.map(id => key(T_SCULPT, id)),
      faceMods: mods(sim.facial.face), bodyMods: mods(sim.facial.body),
      extraModsA: mods(sim.facial.extraA), extraModsB: mods(sim.facial.extraB),
      voiceActor: sim.voiceActor, voicePitch: sim.voicePitch, voiceEffect: sim.voiceEffect,
      unknown2: 0, unknown3: 0,
      outfits: [{
        category: 0, unknown: 0,
        outfits: [{
          id: 0n, unknown: 3, flags: hair ? FLAGS_WITH_HAIR : FLAGS_NO_HAIR, flags2: 0n, created: 0n, matchHair: 1,
          parts: outfit.parts.map(p => ({ key: key(T_CASP, p.id), bodyType: p.bodyType, colorShift: p.colorShift })),
        }],
      }],
      geneticSculpts: g ? g.facial.sculpts.map(id => key(T_SCULPT, id)) : [],
      geneticFaceMods: g ? mods(g.facial.face) : [], geneticBodyMods: g ? mods(g.facial.body) : [],
      geneticPhysique: g ? g.physique : [0, 0, 0, 0],
      geneticParts: g ? g.parts.map(p => ({ key: key(T_CASP, p.id), bodyType: p.bodyType })) : [],
      growthParts: [], // EA's look models never carry these
      voiceActorGenetic: g ? g.voiceActor : sim.voiceActor, voicePitchGenetic: g ? g.voicePitch : sim.voicePitch,
      flags: sim.flags, unknown4: [0, 0, 0], aspiration: 0n, traits: [],
    };
  }

  // ASCII-only id for hashes and file names. Names with non-Latin letters (e.g. Thai)
  // get a hash suffix so different names never share resource ids.
  const slug = s => {
    const ascii = (s || '').replace(/[^A-Za-z0-9]+/g, '');
    return /[^\x00-\x7f]/.test(s || '') || !ascii ? (ascii || 'Look') + fnv32((s || '').trim()).toString(16).toUpperCase() : ascii;
  };

  // look: { name, creator, background: 0xRRGGBB, ages: [..AGE keys], genders: ['male'|'female'], hair: bool,
  //         outfitCategories: [..TAGS.outfit keys], occults: [..TAGS.occult keys], pose,
  //         swatches: [{ sim, outfit, color: 0xAARRGGBB }] }
  function buildLook(look) {
    const base = `${slug(look.creator)}:StyledLook_${slug(look.name)}`;
    const prototypeId = fnv64(base + '0');
    const nameKey = fnv32(base);
    const ageGender = look.ages.reduce((f, a) => f | SL.AGE[a], 0) | look.genders.reduce((f, g) => f | SL.GENDER[g], 0);
    const tags = [
      ...look.genders.map(g => ({ category: SL.TAG_CAT.genderAppropriate, value: SL.TAGS.gender[g] })),
      ...look.occults.map(o => ({ category: SL.TAG_CAT.occult, value: SL.TAGS.occult[o] })),
      ...look.outfitCategories.map(c => ({ category: SL.TAG_CAT.outfitCategory, value: SL.TAGS.outfit[c] })),
    ];
    const resources = [];
    // The look's background image key; without a matching image the game uses its default.
    const backgroundId = fnv64(base + '_Background');
    if (look.background != null) resources.push({ type: T_DDS, group: 0, instance: backgroundId, data: backgroundDds(look.background) });
    look.swatches.forEach((sw, i) => {
      const simInstance = fnv64(`${base}_SimInfo${i + 1}`);
      resources.push({ type: SLS.siminfo.TYPE, group: 0, instance: simInstance, data: SLS.siminfo.write(simInfoFor(sw.sim, sw.outfit, look.hair)) });
      resources.push({
        type: SL.TYPE, group: 0, instance: fnv64(base + (i + 1)),
        data: SL.write({
          ageGender, prototypeId, primary: i === 0, simInfo: simInstance, background: backgroundId,
          nameHash: nameKey, descHash: 0, pose: look.pose, colors: [sw.color >>> 0], tags,
        }),
      });
    });
    const stblHash = fnv64(base + '_STBL');
    const stbl = SLS.stbl.write([{ key: nameKey, text: look.name || 'Styled Look' }]);
    for (const lang of SLS.stbl.LANGUAGES)
      resources.push({ type: SLS.stbl.TYPE, group: SLS.stbl.GROUP, instance: SLS.stbl.instanceFor(stblHash, lang), data: stbl });
    return resources;
  }

  function buildPackage(looks) {
    return SLS.dbpf.writePackage(looks.flatMap(buildLook));
  }

  SLS.build = { buildLook, buildPackage, simInfoFor, slug };
})(globalThis.SLS = globalThis.SLS || {});
