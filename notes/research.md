# Styled Looks — สรุปจาก 2 คลิป

## คลิป 1 — Ji-U: รีวิวม็อด "Styled Looks Studio" (SimMattically)
https://www.youtube.com/watch?v=FxySRGeAzsY (8:10)

เป็นเว็บแอป (เข้าผ่าน Patreon ของ SimMattically) ที่แปลงลุคจาก Gallery → ไฟล์ `.package` ให้อัตโนมัติ

ขั้นตอนผู้ใช้:
1. ในเกม (CAS) แต่งซิม 1 ตัว ใส่ชุด Everyday 5 ชุด (ปุ่ม + เพิ่มชุด) → **บันทึกลง Gallery** (ไม่ต้องแชร์สาธารณะ)
2. เปิดเว็บ → "Create Styled Look" → อัปโหลดโฟลเดอร์ `Documents\Electronic Arts\The Sims 4\Tray`
3. เว็บอ่าน Tray แล้วแสดงซิมที่บันทึกไว้ → เลือกซิม → ตั้งค่า:
   - ชื่อลุค, พื้นหลัง (background)
   - เพศ
   - Details: รวมทรงผมหรือไม่ (ถ้ารวม คิ้วติดมาด้วย)
   - ช่วงวัย (age)
   - สี swatch 5 สี (เลือกอะไรก็ได้ แค่ต้องครบ 5)
   - ประเภทชุด (Everyday / Formal / …) — ในเกมทำได้แค่ Everyday แต่เว็บกำหนดได้
   - เผ่าพันธุ์ (occult) ที่ใส่ได้
   - Creator Name
4. กด **Export Styled Look** → ได้ไฟล์ `.package`
5. วางใน `Documents\Electronic Arts\The Sims 4\Mods` (ไม่ใช่ Tray)
6. แนะนำลงคู่ "Styled Look Hider" (ซ่อนลุคดั้งเดิมของ EA)
- รองรับทั้งของ EA และ CC

## คลิป 2 — PawpyPlumbob: ทำ Styled Look เองด้วย Sims 4 Studio (แบบ manual)
https://www.youtube.com/watch?v=Ciab4ZPLLBI (23:37) — อ้างอิงไกด์ของ Mizore Yuki:
https://www.patreon.com/posts/how-to-make-s4s-52754475

นี่คือ "สิ่งที่โปรแกรมในคลิป 1 ทำเบื้องหลัง" แบบทีละขั้น

### เตรียมในเกม
- **1 swatch = 1 ซิม** บันทึกแยกกัน (เช่น ชื่อ + สี: `Comfy Green`) — ใช้ชุด Everyday ชุดเดียว
- ชุดอื่น (Formal ฯลฯ) ให้ว่าง/เปลือย ไม่งั้นบั๊ก
- อย่าผสมหลายแพ็คในลุคเดียว (Base Game + 1 แพ็คพอ)

### ใน Sims 4 Studio (3.2.6.3)
1. Tools → Create Empty Package (ชื่อ เช่น `Creator_StyledLooks_ComfyRunout`)
2. Content Management → My Library → เลือกซิมแต่ละตัว → **Export SimInfo**
   (ตั้งชื่อ `<hash>.<สี>.siminfo`)
3. Batch Import SimInfo ทั้งหมดเข้า package
4. Tools → Game File Cruiser → filter **StyledLook** → เลือก Styled Look ของ EA ที่สีใกล้เคียง (เป็น swatch) → Add to current package ทีละสี (Tray Importer ช่วยดูสี — optional)
5. จับคู่: copy **Instance ของ SimInfo** → วางในช่อง **SimInfo Instance** ของ StyledLook สีนั้น
6. Hash Generator:
   - `Creator:StyledLook_<Name>0` → FNV64 → วางใน **Prototype ID** ของ *ทุก* StyledLook (ผูกเป็นกลุ่มเดียวกัน)
   - `...<Name>1`, `2`, `3`… → FNV64 → ใช้เป็น **Instance** ของ StyledLook แต่ละตัว (ให้ unique)
7. **Flags**: อายุ/เพศ ที่ใส่ได้ (ทุก StyledLook)
8. **Tags**: Edit Items → ลบ/เพิ่ม tag (outfit category, occult ฯลฯ)
9. ชื่อลุค (String Table):
   - Hash ข้อความ `Creator:StyledLook_<Name>` → FNV64 → ตัด 2 ตัวอักษรแรก, เติม `08` ข้างหน้า → Instance ของ STBL (high byte = ภาษา, 0x00 = English)
   - Add → String Table → Entries → Add: Key = **FNV32** ของข้อความ, Value = ชื่อที่จะแสดง
   - วาง FNV32 ใน **Name Hash** ของทุก StyledLook; **Description Hash = 0**
10. ท่าโพส: **Thumbnail Animation State Machine Key** = ชื่อท่า เช่น
    `FeaturedLook_F_CoverGirl`, `FeaturedLook_F_HighFashion`, `FeaturedLook_M_Confident` …
    (หญิง 13 ท่า / ชาย 8 ท่า — ดู description คลิป)
11. ไม่ให้ทับผม/เมคอัพ: ใน SimInfo → Outfits → หมวดที่ใช้ (Everyday/Athletic) → แก้ flag:
    - ไม่ transfer ผม: `00000433EFFFFFE2`
    - ไม่ transfer ผม + เล็บ + เมคอัพ: `000004100FFFFDE2`
12. Tools → Modding → **Copy String Tables to All Languages** (กันขึ้น debug ในภาษาอื่น)
13. Save → ย้าย `.package` ไป Mods

## ข้อสังเกตสำหรับทำโปรแกรมเอง
Pipeline ที่ต้องทำอัตโนมัติ (แบบ Styled Looks Studio):
- อ่าน Tray (`.trayitem`, `.hhi`/`.sgi` ฯลฯ) → ดึง SimInfo ของแต่ละ outfit
- สร้าง DBPF package ที่มี: SimInfo × N, StyledLook tuning/resource × N (โคลนจาก EA), STBL × ทุกภาษา
- คำนวณ FNV64/FNV32, ตั้ง Prototype ID ร่วม, Instance เฉพาะตัว, Name Hash, flags อายุ/เพศ, tags, pose key, swatch color, outfit transfer flags
