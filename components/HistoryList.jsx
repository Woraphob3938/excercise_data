"use client";

import React, { useState } from "react";
import { Calendar, Trash2, ChevronDown, ChevronUp, Award, Search, Dumbbell, Star } from "lucide-react";
import { calculate1RM } from "../utils/fitness";

export default function HistoryList({ history, onDeleteWorkout }) {
  const [expandedIds, setExpandedIds] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  const toggleExpand = (id) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleDelete = (id, dateStr, e) => {
    e.stopPropagation(); // Prevent card toggling
    if (confirm(`คุณแน่ใจว่าต้องการลบบันทึกการซ้อมของวันที่ ${dateStr} หรือไม่? ข้อมูลจะถูกลบถาวร`)) {
      onDeleteWorkout(id);
    }
  };

  // Filter history based on search term (checks workout name, or exercise names)
  const filteredHistory = history.filter((log) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchesName = log.name.toLowerCase().includes(term);
    const matchesExercise = log.exercises.some((ex) =>
      ex.name.toLowerCase().includes(term)
    );
    return matchesName || matchesExercise;
  });

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("th-TH", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-500" />
            ประวัติการฝึกซ้อม (Workout History)
          </h2>
          <p className="text-xs text-slate-400">รายการบันทึกย้อนหลังทั้งหมดของคุณ</p>
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="ค้นหาชื่อท่า หรือชื่อเซสชั่น..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs px-3 py-2 pl-9 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-100 rounded-xl bg-slate-50/30">
          <Dumbbell className="w-8 h-8 text-slate-300 mx-auto mb-2.5" />
          <p className="text-xs font-medium text-slate-400">
            {searchTerm.trim() ? "ไม่พบบันทึกการฝึกซ้อมที่ค้นหา" : "ยังไม่มีประวัติการฝึกซ้อม บันทึกการฝึกแรกของคุณเลย!"}
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
          {filteredHistory.map((workout) => {
            const isExpanded = !!expandedIds[workout.id];
            
            // Check if this workout contains any PRs
            const hasPR = workout.exercises.some((ex) =>
              ex.sets.some((s) => s.isWeightPR || s.is1rmPR)
            );

            // Calculate total volume for this workout
            let totalVolume = 0;
            workout.exercises.forEach((ex) => {
              ex.sets.forEach((s) => {
                totalVolume += (parseFloat(s.weight) || 0) * (parseInt(s.reps, 10) || 0);
              });
            });

            return (
              <div
                key={workout.id}
                className="border border-slate-100 rounded-xl overflow-hidden shadow-sm hover:border-slate-200 transition-all bg-white"
              >
                {/* Header Collapsible Trigger */}
                <div
                  onClick={() => toggleExpand(workout.id)}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-700">{workout.name}</h3>
                      {hasPR && (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          <Star className="w-2.5 h-2.5 fill-amber-700 text-amber-700" /> New PR!
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-slate-400 font-semibold">
                      <span>{formatDate(workout.date)}</span>
                      <span>•</span>
                      <span>ท่าฝึก {workout.exercises.length} ท่า</span>
                      <span>•</span>
                      <span>ปริมาตรรวม {totalVolume.toLocaleString()} kg</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => handleDelete(workout.id, workout.date, e)}
                      className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-slate-50 transition-colors"
                      title="ลบประวัติยกน้ำหนักชิ้นนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Collapsible Content */}
                {isExpanded && (
                  <div className="border-t border-slate-50 bg-slate-50/10 p-4 space-y-4 animate-slideDown">
                    {workout.exercises.map((ex, idx) => (
                      <div key={ex.id || idx} className="space-y-1.5">
                        <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Dumbbell className="w-3.5 h-3.5 text-slate-400" />
                          {ex.name}
                        </h4>
                        
                        <div className="bg-white border border-slate-100/70 rounded-xl overflow-hidden">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50/50 border-b border-slate-100 text-[9px] font-bold text-slate-400 uppercase">
                                <th className="py-1 px-3 text-center w-12">เซ็ต</th>
                                <th className="py-1 px-3">น้ำหนัก</th>
                                <th className="py-1 px-3">จำนวนครั้ง</th>
                                <th className="py-1 px-3 text-right">1RM ประมาณการ</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-[11px] text-slate-600 font-medium">
                              {ex.sets.map((set, sIdx) => {
                                const est1RM = calculate1RM(set.weight, set.reps);
                                const isPRSet = set.isWeightPR || set.is1rmPR;
                                return (
                                  <tr key={set.id || sIdx} className="hover:bg-slate-50/20">
                                    <td className="py-2 px-3 text-center font-bold text-slate-400">
                                      {sIdx + 1}
                                    </td>
                                    <td className="py-2 px-3 flex items-center gap-1">
                                      <span>{set.weight} kg</span>
                                      {isPRSet && (
                                        <span
                                          className="text-[9px] font-bold text-amber-600 flex items-center gap-0.5"
                                          title={set.isWeightPR && set.is1rmPR ? "สถิติน้ำหนัก & 1RM สูงสุด" : set.isWeightPR ? "สถิติน้ำหนักสูงสุด" : "สถิติ 1RM สูงสุด"}
                                        >
                                          <Award className="w-3 h-3 text-amber-500 fill-amber-50" />
                                          PR
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2 px-3">{set.reps} ครั้ง</td>
                                    <td className="py-2 px-3 text-right text-slate-400">
                                      {est1RM > 0 ? `${est1RM} kg` : "-"}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
