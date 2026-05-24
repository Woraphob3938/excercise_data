<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# FitLog - Developer Agent Guidelines

คู่มือฉบับนี้จัดทำขึ้นเพื่อให้ Agent AI หรือนักพัฒนาในอนาคตเข้าใจโครงสร้าง ข้อจำกัด และมาตรฐานการเขียนโค้ดของแอปพลิเคชัน **FitLog** เพื่อให้สามารถปรับปรุงและพัฒนาต่อได้อย่างถูกต้องและมีประสิทธิภาพ

---

## 1. โครงสร้างโฟลเดอร์และการแบ่งโมดูล (Project Structure)
- **`app/`**: โครงสร้างหน้าเว็บหลักของ Next.js 16 (App Router)
  - `layout.js`: กำหนดฟอนต์หลัก (Inter, Outfit) และรายละเอียด SEO
  - `page.js`: จุดประสานงานกลาง (Main Client Core) คุม State ทั้งหมด และประสานฟังก์ชันบันทึก
  - `globals.css`: โครงสร้างดีไซน์ระบบ นำเข้าฟอนต์ และประกาศธีม Tailwind v4 + เอฟเฟกต์ Glassmorphism
- **`components/`**: ส่วนประกอบ UI แยกชิ้น
  - `WorkoutForm.jsx`: ส่วนทำหน้าที่บันทึกน้ำหนัก จำนวนครั้ง เสนอแนะ Overload
  - `AnalyticsView.jsx`: ส่วนวาดกราฟสถิติพัฒนาการ (1RM, Max Weight, Volume) และ PR Summary
  - `TemplateManager.jsx`: ส่วนจัดเก็บและเรียกใช้งานเทมเพลตโปรแกรมการฝึก
  - `HistoryList.jsx`: ส่วนค้นหา กรอง และแจกแจงรายการการยกย้อนหลังแยกตามวัน
  - `BackupRestore.jsx`: ส่วนจัดการดาวน์โหลด/อัปโหลดไฟล์ JSON ข้อมูลดิบ
- **`utils/`**: คลังฟังก์ชันลอจิกและเอฟเฟกต์เชิงลึก
  - `fitness.js`: สูตรคำนวณทางฟิตเนส เช่น 1RM, Progressive Overload และการตรวจสอบ PR
  - `effects.js`: เอฟเฟกต์ confetti เฉลิมฉลองเมื่อตรวจเจอสถิติใหม่ (PR) ปลอดภัยต่อการทำ SSR

---

## 2. กฎการจัดการ State และ Data Management
1. **Single Source of Truth**: หน้าหลัก `app/page.js` จะเป็นผู้ถือครอง State ประวัติซ้อม (`history`) และเทมเพลต (`templates`) เพื่อความสอดคล้องกันของข้อมูล โดยส่งต่อผ่าน Props ให้คอมโพเนนต์อื่น
2. **การจัดเก็บ (Storage)**: บันทึกข้อมูลแบบไร้เซิร์ฟเวอร์โดยเขียนลงบน `localStorage` ผ่านคีย์:
   - `workout_history` สำหรับประวัติการยกทั้งหมด
   - `workout_templates` สำหรับบันทึกเทมเพลตโปรแกรมการฝึก
3. **การหลีกเลี่ยง Hydration Mismatch**: Next.js ฝั่งเซิร์ฟเวอร์จะไม่มีออบเจ็กต์ `window` หรือ `localStorage` ดังนั้น ห้ามทำการอ่านค่าและอัปเดต State โดยตรงขณะ Render แรก ให้เรียกใช้งานใน `useEffect` และทำการดึงประวัติภายหลัง
4. **กฎการห้ามเกิด Cascading Render (ESLint)**:
   - ห้ามเรียก `setState` แบบซิงโครนัสใน Effect ทันทีที่เรนเดอร์เสร็จ หากจำเป็นต้องมี ให้ดีเฟอร์ด้วย `setTimeout(() => setState(...), 0)`
   - ห้ามทำ `setState` ใน `useMemo` โดยเด็ดขาด ให้ใช้ `useMemo` คำนวณค่าส่งออกเท่านั้น

---

## 3. สูตรคำนวณและลอจิกทางฟิตเนส (Fitness Core Rules)
1. **สูตรคำนวณ 1RM (Epley Formula)**:
   - $1RM = Weight \times (1 + Reps / 30)$ (ถ้าจำนวนครั้ง = 1, ค่า 1RM = Weight นั้นๆ)
2. **กฎ Progressive Overload (คำแนะนำการยกครั้งต่อไป)**:
   - หากจำนวนครั้งยกในน้ำหนักสูงสุดเซสชั่นก่อนหน้า **$\ge 12$**: แนะนำให้ **เพิ่มน้ำหนัก** 2.5% - 5% (ปัดให้ลงท้ายด้วย 2.5 kg) และแนะนำเป้าหมาย 8 ครั้ง
   - หากจำนวนครั้งอยู่ระหว่าง **$8 - 11$**: แนะนำให้ **เพิ่มจำนวนครั้ง** ขึ้น 1 ครั้ง เพื่อสั่งสมแรงกระตุ้น (Reps +1)
   - หากจำนวนครั้ง **$< 8$**: แนะนำให้ **เน้นฟอร์มและคุมน้ำหนักเดิม** เพื่อพิชิตเป้าหมายอย่างน้อย 8 ครั้งก่อนขยับน้ำหนัก
3. **การตรวจจับ Personal Record (PR)**:
   - จะเป็น PR ก็ต่อเมื่อ เซ็ตที่บันทึกมีน้ำหนักสูงกว่าสถิติเดิม หรือมีค่าประมาณการ 1RM สูงกว่าสถิติเดิม

---

## 4. มาตรฐานดีไซน์และเขียนหน้ากากผู้ใช้ (UX/UI & Code Standards)
- **Theme**: Minimalist Light Mode
  - ใช้สีสไตล์โมเดิร์นคลีน (Slate Background, Emerald Green สำหรับความสำเร็จ/ปุ่มหลัก, Indigo Blue สำหรับปุ่มสำรองข้อมูล, Amber สำหรับสัญลักษณ์ PR)
  - ความนุ่มนวล: ปุ่มและแผงต่างๆ จะต้องมีคลาส `.hover-scale` เพื่อสร้าง micro-animation เวลาผู้ใช้นำเมาส์ไปชี้
- **Escaping Text**: อักขระพิเศษอย่าง `"`, `'`, `<` หรือ `>` ใน JSX ต้องถูกแปลงให้อยู่ในรูป HTML Entities เสมอ (เช่น `&quot;` หรือ `&apos;`) เพื่อป้องกันการฟ้อง Error ของตัวตรวจโค้ด
- **Chart.js Registration**: ใน Analytics ทุกครั้งที่มีการใช้งาน Chart.js หรือนำไปประกอบหน้าใหม่ ต้องเรียกลงทะเบียนปลั๊กอิน (Register) Scale, Element, Tooltip, Legend และ Filler ทุกครั้ง
