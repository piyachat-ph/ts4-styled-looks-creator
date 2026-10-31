# Styled Look Creator

เว็บแอปสำหรับแปลงชุดที่แต่งใน CAS ของ The Sims 4 ให้เป็น Styled Look (ไฟล์ `.package`)
ทำงานในเบราว์เซอร์ทั้งหมด ไม่ส่งไฟล์ออกไปไหน

- เว็บออนไลน์: https://piyachat-ph.github.io/ts4-styled-looks-creator/
- push ขึ้น `main` แล้ว GitHub Pages จะอัปเดตเว็บเองใน 1–2 นาที
- บันทึกการค้นคว้ารูปแบบไฟล์อยู่ใน [notes/research.md](notes/research.md)

## วิธีใช้

1. เปิดเว็บข้างบน หรือดับเบิลคลิก `index.html` (Chrome หรือ Edge)
2. กด **เลือกโฟลเดอร์ Tray** แล้วเลือก `Documents\Electronic Arts\The Sims 4\Tray`
3. เลือกซิม (เปิด "เลือกหลายตัว" เพื่อรวมหลายซิม) — ชุดประจำวันแต่ละชุดจะกลายเป็น 1 สี
4. ตั้งชื่อ ผู้สร้าง สีพื้นหลัง ท่าโพส (กดรูปเล็กมุมขวาล่าง) และตัวเลือกด้านขวา แล้วกด **Export ลุคนี้**
5. ย้ายไฟล์ `.package` ที่ได้ไปไว้ใน `Documents\Electronic Arts\The Sims 4\Mods`

## โครงสร้างโปรแกรม

- `js/lib/` — อ่าน/เขียนไฟล์เกม: DBPF package, SimInfo v0x26, StyledLook v12, String Table, Tray
- `js/app.js` — หน้าจอและการทำงานของ UI
- `assets/poses/` — รูปตัวอย่างท่าโพส 21 ท่า ดึงจากรูปลุคของ EA ใน `thumbnails.package` ของเกม
  (เป็นรูปของ EA — ถ้าแจกสาธารณะควรพิจารณาเรื่องนี้)

## เครื่องมือ (`tools/`, ต้องมี Node.js)

สำหรับนักพัฒนา ไม่จำเป็นต่อการใช้งานเว็บ — รันจากโฟลเดอร์ชั้นนอกสุดของ repo

| คำสั่ง | ใช้ทำอะไร |
|---|---|
| `node tools/serve.js` | เปิดพรีวิวที่ http://localhost:5180 |
| `node tools/test-build.js <Tray> <out.package>` | ทดสอบตั้งแต่อ่าน Tray จนได้ package |
| `node tools/make-look.js <Tray> <out.package> <ชื่อซิม> <ชื่อลุค> <#สีพื้นหลัง>` | สร้างลุคทดสอบจากซิมใน Tray |
| `node tools/inspect-package.js <file.package>` | ดูข้อมูลข้างในไฟล์ลุค |
| `node tools/check-refs.js <file.package> <Mods>` | เช็คว่า CC ที่ลุคใช้มีอยู่ใน Mods ไหม |
| `node tools/casp-agegender.js <file.package> <Mods>` | ดู group และวัย/เพศของชิ้นส่วนชุด |
| `node tools/repair-package.js <in> <out>` | ซ่อมลุคที่ Export จากเวอร์ชันเก่า (วัยรุ่น, group ของ CC) |
| `node tools/probe-game.js <ClientDeltaBuild0.package> <looks.json>` | ดึงลุคของ EA มาไว้ทดสอบ |
| `node tools/test-roundtrip.js - <looks.json>` | ตรวจว่าตัวเขียนไฟล์ได้ผลตรงกับลุคของ EA ทุกไบต์ |
| `node tools/extract-pose-thumbs.js <thumbnails.package> <looks.json> <outDir>` | ดึงรูปท่าโพสจากเกมใหม่ |

## ข้อจำกัดที่ทราบ

- ลุคที่ใช้ของจาก DLC หรือ CC จะไม่ระบุว่าต้องใช้แพ็คไหน ถ้าผู้เล่นไม่มีของชิ้นนั้น เกมจะสุ่มของอื่นมาแทน
- CC ส่วนน้อย (~0.2%) ที่ใช้ group 0 แทน 0x80000000 อาจทำให้ลุคไม่ขึ้นรูป
