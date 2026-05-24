"use client";

import React, { useRef } from "react";
import { Download, Upload, Info } from "lucide-react";

export default function BackupRestore({ history, templates, onImportSuccess }) {
  const fileInputRef = useRef(null);

  const handleExport = () => {
    try {
      const backupData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        history: history || [],
        templates: templates || []
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = `workout_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการสำรองข้อมูล: " + err.message);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        // Simple validation
        if (!data || typeof data !== "object") {
          throw new Error("โครงสร้างไฟล์ไม่ถูกต้อง");
        }
        
        const importedHistory = Array.isArray(data.history) ? data.history : [];
        const importedTemplates = Array.isArray(data.templates) ? data.templates : [];

        if (importedHistory.length === 0 && importedTemplates.length === 0) {
          throw new Error("ไม่พบข้อมูลประวัติการฝึกหรือโปรแกรมการฝึกในไฟล์");
        }

        if (confirm(`คุณต้องการนำเข้าข้อมูลประวัติ ${importedHistory.length} รายการ และโปรแกรมการฝึก ${importedTemplates.length} รายการหรือไม่? (ข้อมูลเดิมจะถูกเขียนทับ)`)) {
          onImportSuccess(importedHistory, importedTemplates);
          alert("นำเข้าข้อมูลเรียบร้อยแล้ว!");
        }
      } catch (err) {
        alert("การนำเข้าข้อมูลล้มเหลว: " + err.message);
      } finally {
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
        <Info className="w-5 h-5 text-indigo-500" />
        การจัดการข้อมูล (Backup & Restore)
      </h2>
      <p className="text-xs text-slate-400 mb-4 leading-relaxed">
        เนื่องจากข้อมูลของคุณถูกจัดเก็บไว้ในเครื่องคอมพิวเตอร์เครื่องนี้เท่านั้น (Local Storage) หากต้องการย้ายเครื่องหรือล้างเบราว์เซอร์ แนะนำให้สำรองข้อมูลเก็บไว้
      </p>
      
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-semibold border border-indigo-100 text-indigo-600 bg-indigo-50/20 hover:bg-indigo-50 rounded-xl transition-all shadow-sm"
        >
          <Download className="w-4 h-4" /> สำรองข้อมูล (Export)
        </button>

        <button
          onClick={handleImportClick}
          className="flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-semibold border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
        >
          <Upload className="w-4 h-4" /> นำเข้าข้อมูล (Import)
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImport}
        accept=".json"
        className="hidden"
      />
    </div>
  );
}
