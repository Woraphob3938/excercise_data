"use client";

import React, { useRef, useState } from "react";
import { Download, Upload, Info, AlertTriangle, CheckCircle } from "lucide-react";

export default function BackupRestore({ history, templates, onImportSuccess }) {
  const fileInputRef = useRef(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [pendingImport, setPendingImport] = useState(null);

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

      // Show non-blocking success confirmation
      setStatusMessage({
        text: "สำรองข้อมูลสำเร็จ! ดาวน์โหลดไฟล์สำรองข้อมูลเรียบร้อยแล้ว",
        type: "success"
      });

      // Clear toast after 4 seconds
      setTimeout(() => {
        setStatusMessage(null);
      }, 4000);

    } catch (err) {
      setStatusMessage({
        text: "เกิดข้อผิดพลาดในการสำรองข้อมูล: " + err.message,
        type: "error"
      });
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
        
        // Validation
        if (!data || typeof data !== "object") {
          throw new Error("โครงสร้างไฟล์ไม่ถูกต้อง");
        }
        
        const importedHistory = Array.isArray(data.history) ? data.history : [];
        const importedTemplates = Array.isArray(data.templates) ? data.templates : [];

        if (importedHistory.length === 0 && importedTemplates.length === 0) {
          throw new Error("ไม่พบข้อมูลประวัติการฝึกหรือโปรแกรมการฝึกในไฟล์");
        }

        // Set pending import data to trigger React custom non-blocking modal
        setPendingImport({
          history: importedHistory,
          templates: importedTemplates
        });
      } catch (err) {
        setStatusMessage({
          text: "การนำเข้าข้อมูลล้มเหลว: " + err.message,
          type: "error"
        });
        setTimeout(() => setStatusMessage(null), 4000);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    
    onImportSuccess(pendingImport.history, pendingImport.templates);
    setPendingImport(null);

    setStatusMessage({
      text: "นำเข้าข้อมูลและอัปเดตระบบเสร็จสมบูรณ์เรียบร้อยแล้ว!",
      type: "success"
    });

    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  const cancelImport = () => {
    setPendingImport(null);
  };

  return (
    <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl p-6 shadow-sm relative">
      <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
        <Info className="w-5 h-5 text-indigo-500" />
        การจัดการข้อมูล (Backup & Restore)
      </h2>
      <p className="text-xs text-slate-400 mb-4 leading-relaxed">
        เนื่องจากข้อมูลของคุณถูกจัดเก็บไว้ในเครื่องคอมพิวเตอร์เครื่องนี้เท่านั้น (Local Storage) หากต้องการย้ายเครื่องหรือล้างเบราว์เซอร์ แนะนำให้สำรองข้อมูลเก็บไว้
      </p>
      
      {/* Toast Notification Banner */}
      {statusMessage && (
        <div 
          id="backup-status-banner"
          className={`mb-4 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn transition-all ${
            statusMessage.type === "success" 
              ? "bg-emerald-50 border border-emerald-100 text-emerald-800" 
              : "bg-red-50 border border-red-100 text-red-800"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-bold border border-indigo-100 text-indigo-600 bg-indigo-50/20 hover:bg-indigo-50 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <Download className="w-4 h-4" /> สำรองข้อมูล (Export)
        </button>

        <button
          onClick={handleImportClick}
          className="flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-bold border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 rounded-xl transition-all shadow-sm cursor-pointer"
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

      {/* Custom React Non-blocking Import Confirmation Modal Overlay */}
      {pendingImport && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-md rounded-2xl p-5 flex flex-col justify-center items-center text-center animate-fadeIn z-20 border border-slate-100">
          <AlertTriangle className="w-9 h-9 text-amber-500 mb-2" />
          <h3 className="text-sm font-bold text-slate-800">ต้องการนำเข้าข้อมูลหรือไม่?</h3>
          <p className="text-[11px] text-slate-500 mt-1 max-w-[280px] leading-relaxed">
            ประวัติการซ้อม {pendingImport.history.length} รายการ และโปรแกรมฝึก {pendingImport.templates.length} รายการ จะถูกนำเข้าเขียนทับข้อมูลเดิมทั้งหมด!
          </p>
          <div className="flex gap-2 mt-4 w-full max-w-[260px]">
            <button
              onClick={cancelImport}
              className="flex-1 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              onClick={confirmImport}
              className="flex-1 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              ยืนยันการนำเข้า
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
