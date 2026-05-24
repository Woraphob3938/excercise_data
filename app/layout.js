import "./globals.css";

export const metadata = {
  title: "FitLog - แอปพลิเคชันบันทึกสถิติการฝึกยกน้ำหนักและ Progressive Overload",
  description: "บันทึกข้อมูลการยกน้ำหนัก คำนวณ 1RM ออกแบบโปรแกรมการฝึก และวิเคราะห์สถิติเพื่อพัฒนาความแข็งแกร่งด้วย Progressive Overload แบบไม่มีวันลืมข้อมูลด้วยระบบสำรองข้อมูล",
  keywords: "ยกน้ำหนัก, เพาะกาย, บันทึกการซ้อม, สถิติยกน้ำหนัก, Progressive Overload, คำนวณ 1RM, เวทเทรนนิ่ง, ฟิตเนส",
  authors: [{ name: "FitLog Team" }],
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
