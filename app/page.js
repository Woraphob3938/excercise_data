"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Dumbbell, Award, Flame, Calendar, PlusCircle, CheckCircle, Info, Sparkles } from "lucide-react";
import { getStatsSummary, recommendOverload } from "../utils/fitness";
import WorkoutForm from "../components/WorkoutForm";
import HistoryList from "../components/HistoryList";
import TemplateManager from "../components/TemplateManager";
import AnalyticsView from "../components/AnalyticsView";
import BackupRestore from "../components/BackupRestore";

// Helper to generate dates relative to today
const getRelativeDateString = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split("T")[0];
};

const MOCK_HISTORY = [
  {
    id: "mock-1",
    date: getRelativeDateString(10),
    name: "โปรแกรมฝึกอกและไตรเซป (Demo)",
    exercises: [
      {
        id: "mock-ex-1",
        name: "Bench Press",
        sets: [
          { id: "mock-s-1", weight: 50, reps: 10, isCompleted: true, isWeightPR: true, is1rmPR: true },
          { id: "mock-s-2", weight: 50, reps: 8, isCompleted: true, isWeightPR: true, is1rmPR: false },
          { id: "mock-s-3", weight: 45, reps: 10, isCompleted: true, isWeightPR: false, is1rmPR: false }
        ]
      },
      {
        id: "mock-ex-2",
        name: "Tricep Pushdown",
        sets: [
          { id: "mock-s-4", weight: 15, reps: 12, isCompleted: true, isWeightPR: true, is1rmPR: true },
          { id: "mock-s-5", weight: 15, reps: 10, isCompleted: true, isWeightPR: true, is1rmPR: false }
        ]
      }
    ]
  },
  {
    id: "mock-2",
    date: getRelativeDateString(7),
    name: "โปรแกรมฝึกขาเบาๆ (Demo)",
    exercises: [
      {
        id: "mock-ex-3",
        name: "Squat",
        sets: [
          { id: "mock-s-6", weight: 70, reps: 10, isCompleted: true, isWeightPR: true, is1rmPR: true },
          { id: "mock-s-7", weight: 70, reps: 8, isCompleted: true, isWeightPR: true, is1rmPR: false },
          { id: "mock-s-8", weight: 65, reps: 10, isCompleted: true, isWeightPR: false, is1rmPR: false }
        ]
      },
      {
        id: "mock-ex-4",
        name: "Calf Raise",
        sets: [
          { id: "mock-s-9", weight: 30, reps: 15, isCompleted: true, isWeightPR: true, is1rmPR: true }
        ]
      }
    ]
  },
  {
    id: "mock-3",
    date: getRelativeDateString(3),
    name: "สถิติใหม่ Bench Press (Demo)",
    exercises: [
      {
        id: "mock-ex-5",
        name: "Bench Press",
        sets: [
          { id: "mock-s-10", weight: 52.5, reps: 10, isCompleted: true, isWeightPR: true, is1rmPR: true }, // 1RM increases from 66.7 to 70
          { id: "mock-s-11", weight: 52.5, reps: 9, isCompleted: true, isWeightPR: true, is1rmPR: false },
          { id: "mock-s-12", weight: 50, reps: 10, isCompleted: true, isWeightPR: false, is1rmPR: false }
        ]
      },
      {
        id: "mock-ex-6",
        name: "Lat Pulldown",
        sets: [
          { id: "mock-s-13", weight: 40, reps: 12, isCompleted: true, isWeightPR: true, is1rmPR: true },
          { id: "mock-s-14", weight: 45, reps: 10, isCompleted: true, isWeightPR: true, is1rmPR: true }
        ]
      },
      {
        id: "mock-ex-7",
        name: "Tricep Pushdown",
        sets: [
          { id: "mock-s-15", weight: 17.5, reps: 10, isCompleted: true, isWeightPR: true, is1rmPR: true },
          { id: "mock-s-16", weight: 15, reps: 12, isCompleted: true, isWeightPR: false, is1rmPR: false }
        ]
      }
    ]
  }
];

export default function Home() {
  const [history, setHistory] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [showDemoAlert, setShowDemoAlert] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem("workout_history");
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setTimeout(() => setHistory(parsed), 0);
      } catch (e) {
        setTimeout(() => {
          setHistory(MOCK_HISTORY);
          setShowDemoAlert(true);
        }, 0);
        localStorage.setItem("workout_history", JSON.stringify(MOCK_HISTORY));
      }
    } else {
      // First time use, set mock history
      setTimeout(() => {
        setHistory(MOCK_HISTORY);
        setShowDemoAlert(true);
      }, 0);
      localStorage.setItem("workout_history", JSON.stringify(MOCK_HISTORY));
    }
  }, []);

  // Calculate dynamic dashboard stats
  const stats = useMemo(() => {
    return getStatsSummary(history);
  }, [history]);

  // Handle template loading into active workout
  const handleLoadTemplate = (template) => {
    // Generate empty sets and default recommendations for template exercises
    const exercisesWithSets = template.exercises.map((exName, idx) => {
      // Fetch recommendations based on workout history
      const rec = recommendOverload(history, exName);
      return {
        id: `ex-${Date.now()}-${idx}`,
        name: exName,
        sets: [
          {
            id: `set-${Date.now()}-${idx}-0`,
            weight: rec.targetWeight || "",
            reps: rec.targetReps || "",
            isCompleted: false
          }
        ],
        recommendation: rec
      };
    });

    const todayStr = new Date().toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });

    setActiveWorkout({
      id: "workout-" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      name: `${template.name} - ${todayStr}`,
      exercises: exercisesWithSets
    });

    // Scroll to active workout form on mobile/desktop
    setTimeout(() => {
      document.getElementById("active-workout-section")?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  const handleStartBlankWorkout = () => {
    const todayStr = new Date().toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });

    setActiveWorkout({
      id: "workout-" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      name: `ฝึกซ้อมประจำวันที่ ${todayStr}`,
      exercises: []
    });

    setTimeout(() => {
      document.getElementById("active-workout-section")?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  const handleSaveWorkout = (finalWorkout) => {
    const updatedHistory = [finalWorkout, ...history];
    setHistory(updatedHistory);
    localStorage.setItem("workout_history", JSON.stringify(updatedHistory));
    setActiveWorkout(null);
  };

  const handleDeleteWorkout = (workoutId) => {
    const updatedHistory = history.filter((w) => w.id !== workoutId);
    setHistory(updatedHistory);
    localStorage.setItem("workout_history", JSON.stringify(updatedHistory));
  };

  const handleImportSuccess = (importedHistory, importedTemplates) => {
    setHistory(importedHistory);
    localStorage.setItem("workout_history", JSON.stringify(importedHistory));
    setTemplates(importedTemplates);
    localStorage.setItem("workout_templates", JSON.stringify(importedTemplates));
    setShowDemoAlert(false); // Disable demo notification if they imported backup
  };

  const handleClearDemoData = () => {
    if (confirm("คุณแน่ใจว่าต้องการล้างข้อมูลตัวอย่างทั้งหมดใช่ไหม? เพื่อเริ่มต้นหน้าใหม่ที่ว่างเปล่า")) {
      setHistory([]);
      localStorage.setItem("workout_history", JSON.stringify([]));
      setShowDemoAlert(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
      {/* App Header Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 text-white p-3 rounded-2xl shadow-md shadow-emerald-500/10">
            <Dumbbell className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-heading text-slate-800 tracking-tight flex items-center gap-2">
              FitLog <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">Light Minimalist</span>
            </h1>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              ระบบบันทึกความก้าวหน้าเวทเทรนนิ่ง วิเคราะห์ 1RM และ Progressive Overload
            </p>
          </div>
        </div>

        {/* Dynamic Highlight Stats Banner */}
        <div className="flex gap-4 items-center w-full md:w-auto overflow-x-auto py-1">
          <div className="flex items-center gap-2 bg-white/70 border border-slate-100/80 px-4 py-2 rounded-2xl shadow-sm min-w-[110px]">
            <Flame className="w-5 h-5 text-orange-500 fill-orange-50" />
            <div>
              <div className="text-xs font-bold text-slate-400">Workout Streak</div>
              <div className="text-base font-black text-slate-700">{stats.streak} วันต่อเนื่อง</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/70 border border-slate-100/80 px-4 py-2 rounded-2xl shadow-sm min-w-[110px]">
            <Calendar className="w-5 h-5 text-blue-500" />
            <div>
              <div className="text-xs font-bold text-slate-400">การยกทั้งหมด</div>
              <div className="text-base font-black text-slate-700">{stats.totalWorkouts} ครั้งซ้อม</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/70 border border-slate-100/80 px-4 py-2 rounded-2xl shadow-sm min-w-[110px]">
            <Award className="w-5 h-5 text-amber-500 fill-amber-50" />
            <div>
              <div className="text-xs font-bold text-slate-400">สถิติสูงสุด PR</div>
              <div className="text-base font-black text-slate-700">{stats.prCount} รายการ</div>
            </div>
          </div>
        </div>
      </header>

      {/* Demo Notification Alert */}
      {showDemoAlert && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-start gap-2.5">
            <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-xs">ข้อมูลจำลองการฝึกซ้อม:</span>
              <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                ระบบได้เตรียมประวัติการฝึกซ้อมตัวอย่าง 3 รายการล่าสุดเพื่อทดสอบกราฟวิเคราะห์ 1RM และแสดงการแจ้งเตือนสถิติใหม่ (PR) ให้คุณได้ลองเล่นทันที! คุณสามารถเริ่มเซสชั่นใหม่หรือล้างข้อมูลสาธิตออกได้เลย
              </p>
            </div>
          </div>
          <button
            onClick={handleClearDemoData}
            className="text-[10px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            ล้างข้อมูลตัวอย่างออก
          </button>
        </div>
      )}

      {/* Main Grid Layout Dashboard */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left main columns - Log Form and History */}
        <section className="lg:col-span-7 space-y-8">
          
          {/* Active Workout Area */}
          <div id="active-workout-section" className="scroll-mt-6">
            {activeWorkout ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-emerald-50/30 border border-emerald-100 p-4 rounded-2xl">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" /> กำลังซ้อมอยู่: {activeWorkout.name}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm("คุณต้องการละทิ้งการซ้อมในรอบนี้หรือไม่?")) {
                        setActiveWorkout(null);
                      }
                    }}
                    className="text-[10px] text-red-500 hover:text-red-600 font-bold border border-red-200 bg-white hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    ยกเลิกการซ้อม
                  </button>
                </div>
                <WorkoutForm
                  history={history}
                  activeWorkout={activeWorkout}
                  setActiveWorkout={setActiveWorkout}
                  onSaveWorkout={handleSaveWorkout}
                />
              </div>
            ) : (
              /* Start workout call-to-action */
              <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl p-6 shadow-sm text-center py-10 space-y-5">
                <div className="bg-emerald-50 text-emerald-600 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <PlusCircle className="w-8 h-8" />
                </div>
                <div className="space-y-1.5 max-w-sm mx-auto">
                  <h2 className="text-lg font-bold text-slate-800">ได้เวลาออกกำลังกายแล้ว!</h2>
                  <p className="text-xs text-slate-400">
                    เลือกกดเริ่มต้นโปรแกรมการฝึกซ้อมที่เตรียมไว้ในเครื่อง หรือกดสร้างโปรแกรมการซ้อมเปล่าเพื่อคีย์ท่าฝึกได้ทันที
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto pt-2">
                  <button
                    onClick={handleStartBlankWorkout}
                    className="flex-1 py-3 px-5 text-sm font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-md"
                  >
                    เริ่มเซสชั่นเปล่า (Start Blank)
                  </button>
                  
                  <div className="flex-1 flex flex-col justify-center text-xs text-slate-400 font-bold border border-dashed border-slate-200 rounded-xl py-2 px-3 hover:border-emerald-200 hover:bg-emerald-50/10 cursor-pointer"
                       onClick={() => {
                         // Find the first template
                         if (templates.length > 0) {
                           handleLoadTemplate(templates[0]);
                         } else {
                           handleStartBlankWorkout();
                         }
                       }}>
                    <span className="text-[10px] text-slate-400">คีย์ด่วนจากโปรแกรมล่าสด</span>
                    <span className="text-emerald-600 text-xs mt-0.5">
                      {templates[0] ? templates[0].name : "เริ่มสร้างโปรแกรม"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* History Feed */}
          <HistoryList
            history={history}
            onDeleteWorkout={handleDeleteWorkout}
          />
        </section>

        {/* Right side columns - Templates, Charts, Backups */}
        <section className="lg:col-span-5 space-y-8">
          
          {/* Charts panel */}
          <AnalyticsView history={history} />

          {/* Routine Templates manager */}
          <TemplateManager
            onLoadTemplate={handleLoadTemplate}
            templates={templates}
            setTemplates={setTemplates}
          />

          {/* Export/Import local DB backup */}
          <BackupRestore
            history={history}
            templates={templates}
            onImportSuccess={handleImportSuccess}
          />
        </section>

      </main>

      <footer className="text-center text-[10px] font-semibold text-slate-400 border-t border-slate-100 pt-6 mt-12 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p>© {new Date().getFullYear()} FitLog. บันทึกข้อมูลด้วย Local Storage ปลอดภัย เป็นส่วนตัว 100%</p>
        <p>สร้างด้วย Next.js, Tailwind CSS, HTML และ JavaScript</p>
      </footer>
    </div>
  );
}
