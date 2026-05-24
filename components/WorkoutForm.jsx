"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, CheckCircle2, ChevronDown, Dumbbell, Award, HelpCircle, Save } from "lucide-react";
import { calculate1RM, recommendOverload, checkNewPR } from "../utils/fitness";
import { triggerPRConfetti } from "../utils/effects";

const COMMON_EXERCISES = [
  "Bench Press",
  "Squat",
  "Deadlift",
  "Overhead Press (OHP)",
  "Barbell Row",
  "Lat Pulldown",
  "Incline Dumbbell Press",
  "Bicep Curl",
  "Tricep Pushdown",
  "Romanian Deadlift",
  "Lateral Raise",
  "Leg Press",
  "Calf Raise",
  "Leg Extension",
  "Lying Leg Curl"
];

export default function WorkoutForm({ history, activeWorkout, setActiveWorkout, onSaveWorkout }) {
  const [exerciseInput, setExerciseInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filter exercise suggestions based on typing
  const suggestions = useMemo(() => {
    if (!exerciseInput.trim()) return [];
    return COMMON_EXERCISES.filter((ex) =>
      ex.toLowerCase().includes(exerciseInput.toLowerCase())
    );
  }, [exerciseInput]);

  // Set default name for active workout based on template or date
  useEffect(() => {
    if (activeWorkout && !activeWorkout.name) {
      const todayStr = new Date().toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
      setActiveWorkout({
        ...activeWorkout,
        name: `ฝึกซ้อมประจำวันที่ ${todayStr}`
      });
    }
  }, [activeWorkout, setActiveWorkout]);

  if (!activeWorkout) return null;

  const handleWorkoutNameChange = (e) => {
    setActiveWorkout({ ...activeWorkout, name: e.target.value });
  };

  const handleDateChange = (e) => {
    setActiveWorkout({ ...activeWorkout, date: e.target.value });
  };

  // Add exercise to active workout
  const handleAddExercise = (exerciseName) => {
    const name = exerciseName.trim();
    if (!name) return;

    // Check if exercise already exists in active workout
    if (activeWorkout.exercises.some((e) => e.name.toLowerCase() === name.toLowerCase())) {
      alert("ท่านี้นำเข้าสู่โปรแกรมการฝึกนี้แล้ว!");
      setExerciseInput("");
      setShowSuggestions(false);
      return;
    }

    // Get Progressive Overload recommendation
    const rec = recommendOverload(history, name);

    const newExercise = {
      id: "ex-" + Date.now(),
      name,
      sets: [
        {
          id: "set-" + Date.now() + "-0",
          weight: rec.targetWeight || "",
          reps: rec.targetReps || "",
          isCompleted: false
        }
      ],
      recommendation: rec
    };

    setActiveWorkout({
      ...activeWorkout,
      exercises: [...activeWorkout.exercises, newExercise]
    });

    setExerciseInput("");
    setShowSuggestions(false);
  };

  // Remove exercise from active workout
  const handleRemoveExercise = (exId) => {
    const updated = activeWorkout.exercises.filter((ex) => ex.id !== exId);
    setActiveWorkout({ ...activeWorkout, exercises: updated });
  };

  // Set management inside exercises
  const handleAddSet = (exId) => {
    const updated = activeWorkout.exercises.map((ex) => {
      if (ex.id === exId) {
        // Carry over previous set's weight and reps as starting points
        const lastSet = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [
            ...ex.sets,
            {
              id: "set-" + Date.now() + "-" + ex.sets.length,
              weight: lastSet ? lastSet.weight : "",
              reps: lastSet ? lastSet.reps : "",
              isCompleted: false
            }
          ]
        };
      }
      return ex;
    });

    setActiveWorkout({ ...activeWorkout, exercises: updated });
  };

  const handleRemoveSet = (exId, setId) => {
    const updated = activeWorkout.exercises.map((ex) => {
      if (ex.id === exId) {
        // Keep at least one set
        const filtered = ex.sets.filter((s) => s.id !== setId);
        return {
          ...ex,
          sets: filtered.length > 0 ? filtered : ex.sets
        };
      }
      return ex;
    });
    setActiveWorkout({ ...activeWorkout, exercises: updated });
  };

  const handleSetChange = (exId, setId, field, value) => {
    const updated = activeWorkout.exercises.map((ex) => {
      if (ex.id === exId) {
        const updatedSets = ex.sets.map((s) => {
          if (s.id === setId) {
            return { ...s, [field]: value };
          }
          return s;
        });
        return { ...ex, sets: updatedSets };
      }
      return ex;
    });
    setActiveWorkout({ ...activeWorkout, exercises: updated });
  };

  const handleToggleComplete = (exId, setId) => {
    const updated = activeWorkout.exercises.map((ex) => {
      if (ex.id === exId) {
        const updatedSets = ex.sets.map((s) => {
          if (s.id === setId) {
            return { ...s, isCompleted: !s.isCompleted };
          }
          return s;
        });
        return { ...ex, sets: updatedSets };
      }
      return ex;
    });
    setActiveWorkout({ ...activeWorkout, exercises: updated });
  };

  // Submit the workout session
  const handleSubmit = (e) => {
    e.preventDefault();

    if (activeWorkout.exercises.length === 0) {
      alert("กรุณาเพิ่มท่าออกกำลังกายอย่างน้อย 1 ท่าก่อนทำการบันทึก!");
      return;
    }

    // Process exercises and sets
    let hasValidSets = false;
    let newPRsDetected = [];

    const finalExercises = activeWorkout.exercises.map((ex) => {
      const validSets = ex.sets
        .filter((s) => s.weight && s.reps)
        .map((s) => {
          hasValidSets = true;
          const weight = parseFloat(s.weight);
          const reps = parseInt(s.reps, 10);

          // Check if this set sets a new PR
          // Pass the CURRENT history to check against
          const prCheck = checkNewPR(history, ex.name, weight, reps);

          if (prCheck.isAnyPR) {
            newPRsDetected.push({
              exercise: ex.name,
              weight,
              reps,
              type: prCheck.isWeightPR && prCheck.is1rmPR 
                ? "น้ำหนักและ 1RM สูงสุดใหม่" 
                : prCheck.isWeightPR 
                ? "น้ำหนักสูงสุดใหม่" 
                : "1RM สูงสุดใหม่"
            });
          }

          return {
            id: s.id,
            weight,
            reps,
            isCompleted: s.isCompleted,
            isWeightPR: prCheck.isWeightPR,
            is1rmPR: prCheck.is1rmPR
          };
        });

      return {
        id: ex.id,
        name: ex.name,
        sets: validSets
      };
    }).filter((ex) => ex.sets.length > 0);

    if (!hasValidSets) {
      alert("กรุณากรอกน้ำหนักและจำนวนครั้งในเซ็ตอย่างน้อย 1 เซ็ต!");
      return;
    }

    const finalWorkout = {
      id: activeWorkout.id || "workout-" + Date.now(),
      date: activeWorkout.date || new Date().toISOString().split("T")[0],
      name: activeWorkout.name.trim() || "กิจกรรมยกน้ำหนัก",
      exercises: finalExercises
    };

    onSaveWorkout(finalWorkout);

    // If new PRs are set, trigger congratulations!
    if (newPRsDetected.length > 0) {
      triggerPRConfetti();
      
      const prMessages = newPRsDetected
        .map(pr => `🎉 ท่า ${pr.exercise}: ยกได้ ${pr.weight} kg x ${pr.reps} ครั้ง (${pr.type}!)`)
        .join("\n");
      
      setTimeout(() => {
        alert(`สุดยอดมากๆ! ยินดีด้วยกับสถิติใหม่ (Personal Record):\n\n${prMessages}`);
      }, 500);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Session Header Card */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              ชื่อเซสชั่นการฝึก
            </label>
            <input
              type="text"
              value={activeWorkout.name}
              onChange={handleWorkoutNameChange}
              placeholder="เช่น อกและไตรเซปประจำสัปดาห์"
              className="w-full text-base font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-emerald-500 focus:outline-none py-1 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              วันที่ทำกิจกรรม
            </label>
            <input
              type="date"
              value={activeWorkout.date}
              onChange={handleDateChange}
              className="w-full text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        </div>
      </div>

      {/* Exercises Section */}
      <div className="space-y-5">
        {activeWorkout.exercises.map((ex, exIndex) => (
          <div
            key={ex.id}
            className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            {/* Exercise Header */}
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">{ex.name}</h3>
                  <span className="text-[10px] font-semibold text-slate-400">
                    ลำดับที่ {exIndex + 1}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveExercise(ex.id)}
                className="text-xs text-slate-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
              >
                ลบท่าออกกำลังกาย
              </button>
            </div>

            {/* Overload Recommendation Banner */}
            {ex.recommendation && (
              <div className="mb-4 bg-emerald-50/40 border border-emerald-50/50 rounded-xl p-3 flex gap-2.5 items-start">
                <Award className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                      {ex.recommendation.badge}
                    </span>
                    <span className="text-xs font-bold text-emerald-800">
                      เป้าหมายแนะนำ: {ex.recommendation.targetWeight} kg x {ex.recommendation.targetReps} reps
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    {ex.recommendation.message}
                  </p>
                </div>
              </div>
            )}

            {/* Sets Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-[10px] font-bold text-slate-400 uppercase py-2 px-1 text-center w-12">
                      เซ็ต
                    </th>
                    <th className="text-[10px] font-bold text-slate-400 uppercase py-2 px-2">
                      น้ำหนัก (kg)
                    </th>
                    <th className="text-[10px] font-bold text-slate-400 uppercase py-2 px-2">
                      จำนวนครั้ง (Reps)
                    </th>
                    <th className="text-[10px] font-bold text-slate-400 uppercase py-2 px-2 hidden sm:table-cell text-center">
                      1RM ประมาณการ
                    </th>
                    <th className="text-[10px] font-bold text-slate-400 uppercase py-2 px-1 text-center w-16">
                      เสร็จสิ้น
                    </th>
                    <th className="py-2 px-1 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {ex.sets.map((set, setIndex) => {
                    const est1RM = calculate1RM(set.weight, set.reps);
                    return (
                      <tr key={set.id} className="group hover:bg-slate-50/30 transition-colors">
                        <td className="text-xs font-bold text-slate-500 py-2.5 text-center">
                          {setIndex + 1}
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            step="any"
                            required
                            placeholder="0"
                            value={set.weight}
                            onChange={(e) =>
                              handleSetChange(ex.id, set.id, "weight", e.target.value)
                            }
                            className="w-20 sm:w-24 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            required
                            placeholder="0"
                            value={set.reps}
                            onChange={(e) =>
                              handleSetChange(ex.id, set.id, "reps", e.target.value)
                            }
                            className="w-16 sm:w-20 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          />
                        </td>
                        <td className="text-xs font-semibold text-slate-500 py-2.5 hidden sm:table-cell text-center">
                          {est1RM > 0 ? `${est1RM} kg` : "-"}
                        </td>
                        <td className="py-2 px-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleComplete(ex.id, set.id)}
                            className={`p-1 rounded-full transition-all ${
                              set.isCompleted
                                ? "text-emerald-500 bg-emerald-50"
                                : "text-slate-200 hover:text-slate-400 hover:bg-slate-50"
                            }`}
                          >
                            <CheckCircle2 className="w-5 h-5 fill-current" />
                          </button>
                        </td>
                        <td className="py-2 px-1 text-center">
                          {ex.sets.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSet(ex.id, set.id)}
                              className="p-1 text-slate-300 hover:text-red-500 rounded hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="ลบเซ็ต"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={() => handleAddSet(ex.id)}
              className="mt-3.5 flex items-center justify-center gap-1.5 w-full py-1.5 border border-dashed border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 rounded-xl text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> เพิ่มเซ็ตถัดไป (Add Set)
            </button>
          </div>
        ))}
      </div>

      {/* Add Exercise Controller */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl p-5 shadow-sm">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          ค้นหาหรือเพิ่มท่าออกกำลังกายใหม่
        </label>
        <div className="relative">
          <div className="flex gap-2">
            <input
              type="text"
              value={exerciseInput}
              onChange={(e) => setExerciseInput(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder="พิมพ์ค้นหา เช่น Bench Press หรือคีย์ท่าของตัวเอง..."
              className="w-full text-sm font-medium px-4 py-2.5 border border-slate-200 focus:border-emerald-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white transition-all"
            />
            <button
              type="button"
              onClick={() => handleAddExercise(exerciseInput)}
              disabled={!exerciseInput.trim()}
              className="flex items-center gap-1 text-xs font-bold px-4 py-2.5 bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> เพิ่มท่า
            </button>
          </div>

          {/* Autocomplete Suggestions Box */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto animate-fadeIn">
              {suggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    handleAddExercise(item);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-emerald-50/50 hover:text-emerald-700 transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
          {showSuggestions && exerciseInput.trim() && suggestions.length === 0 && (
            <div className="absolute z-10 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-center text-xs text-slate-400 animate-fadeIn">
              ไม่พบท่าออกกำลังกายนี้ในฐานข้อมูลสำเร็จรูป กดปุ่ม <b>&quot;เพิ่มท่า&quot;</b> ด้านขวา เพื่อใช้ท่าของคุณเองได้เลย!
            </div>
          )}
          {/* Overlay to close suggestions */}
          {showSuggestions && (
            <div
              className="fixed inset-0 z-0"
              onClick={() => setTimeout(() => setShowSuggestions(false), 200)}
            ></div>
          )}
        </div>
      </div>

      {/* Save Action Controller */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => {
            if (confirm("คุณแน่ใจว่าต้องการยกเลิกการบันทึกครั้งนี้หรือไม่? ข้อมูลที่พิมพ์จะสูญหาย")) {
              setActiveWorkout(null);
            }
          }}
          className="px-5 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
        >
          ยกเลิกเซสชั่นนี้
        </button>
        <button
          type="submit"
          className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          <Save className="w-4 h-4" /> บันทึกการฝึกซ้อมวันนี้
        </button>
      </div>
    </form>
  );
}
