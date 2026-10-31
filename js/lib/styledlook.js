// StyledLook resource (type 0x71BDB8A2), version 12 — layout verified against
// all 873 EA looks in ClientDeltaBuild0 and a Sims 4 Studio–made look.
(function (SLS) {
  const { Reader, Writer } = SLS.bin;

  const TYPE = 0x71bdb8a2;
  const VERSION = 12;
  // Client_CASThumbnailCamera "auFeaturedLook_Default" — same in every EA look.
  const THUMB_CAMERA = 0xba3ce8d6fc6dd282n;
  const ASM_KEY = 0xd8d5c1186ba97fdcn;
  const ASM_NAME = 'FeaturedLook_HighEnd';
  const STATE_KEY = 0x92fd3d571bd80a40n;

  const POSES = {
    female: ['FeaturedLook_F_CoverGirl', 'FeaturedLook_F_Emo', 'FeaturedLook_F_FrouFrou', 'FeaturedLook_F_HighFashion',
      'FeaturedLook_F_HighFashion_Back', 'FeaturedLook_F_HighFashion_Back_Gown', 'FeaturedLook_F_HighFashion_Gown',
      'FeaturedLook_F_Indie', 'FeaturedLook_F_LHandHip', 'FeaturedLook_F_LeftSide', 'FeaturedLook_F_LegForward',
      'FeaturedLook_F_RHandHip', 'FeaturedLook_F_Sophisticated'],
    male: ['FeaturedLook_M_Candid', 'FeaturedLook_M_Confident', 'FeaturedLook_M_Dorky', 'FeaturedLook_M_Emo',
      'FeaturedLook_M_Generic', 'FeaturedLook_M_HandsOnHips', 'FeaturedLook_M_HoldingArms', 'FeaturedLook_M_Preppy'],
  };

  // Age/gender flags.
  const AGE = { infant: 0x80, toddler: 0x02, child: 0x04, teen: 0x08, youngAdult: 0x10, adult: 0x20, elder: 0x40 };
  const GENDER = { male: 0x1000, female: 0x2000 };

  // Tag categories and values (from the game's tag.Tag / tag.TagCategory enums).
  const TAG_CAT = { ageAppropriate: 68, outfitCategory: 70, occult: 109, genderAppropriate: 111 };
  const TAGS = {
    gender: { male: 1529, female: 1530 },
    outfit: { everyday: 77, formal: 78, athletic: 80, sleep: 81, party: 83, swimwear: 1229, hotWeather: 2053, coldWeather: 2054 },
    occult: { human: 1310, alien: 3005, vampire: 1677, mermaid: 2208, witch: 2279, werewolf: 2779, fairy: 3305 },
  };

  function parse(bytes) {
    const r = new Reader(bytes);
    const o = {};
    o.version = r.u32(); o.ageGender = r.u32(); o.prototypeId = r.u64();
    o.primary = r.u8(); o.unknown1 = r.u8(); o.simInfo = r.u64();
    o.background = r.u64(); o.thumbCamera = r.u64();
    o.nameHash = r.u32(); o.descHash = r.u32();
    o.reserved = Array.from(r.bytesN(12)); o.sortOrder = r.f32(); o.unknown3 = r.u16();
    o.asmKey = r.u64(); o.asmName = r.ascii(r.u32());
    o.stateKey = r.u64(); o.pose = r.ascii(r.u32());
    o.colors = []; for (let n = r.u8(), i = 0; i < n; i++) o.colors.push(r.u32());
    o.tags = []; for (let n = r.u32(), i = 0; i < n; i++) o.tags.push({ category: r.u16(), value: r.u32() });
    o.unknown4 = r.u8();
    return o;
  }

  function write(o) {
    const w = new Writer(256);
    w.u32(VERSION).u32(o.ageGender).u64(o.prototypeId);
    w.u8(o.primary ? 1 : 0).u8(1).u64(o.simInfo);
    w.u64(o.background ?? 0n).u64(THUMB_CAMERA); // background: DDS (0x00B2D882) instance
    w.u32(o.nameHash).u32(o.descHash ?? 0);
    w.bytes(new Uint8Array(12)).f32(o.sortOrder ?? 0).u16(o.unknown3 ?? 0);
    w.u64(ASM_KEY).u32(ASM_NAME.length).ascii(ASM_NAME);
    w.u64(STATE_KEY).u32(o.pose.length).ascii(o.pose);
    w.u8(o.colors.length); for (const c of o.colors) w.u32(c);
    w.u32(o.tags.length); for (const t of o.tags) w.u16(t.category).u32(t.value);
    w.u8(o.unknown4 ?? 0);
    return w.toBytes();
  }

  SLS.styledlook = { TYPE, POSES, AGE, GENDER, TAG_CAT, TAGS, parse, write };
})(globalThis.SLS = globalThis.SLS || {});
