"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Dumbbell, Play, Save, Sparkles } from "lucide-react";

const DEFAULT_TEMPLATES = [
  {
    id: "temp-push",
    name: "Push Day (อก สามหัว ไหล่)",
    exercises: ["Bench Press", "Overhead Press (OHP)", "Incline Dumbbell Press", "Tricep Pushdown"]
  },
  {
    id: "temp-pull",
    name: "Pull Day (หลัง หน้าแขน)",
    exercises: ["Deadlift", "Lat Pulldown", "Barbell Row", "Bicep Curl"]
  },
  {
    id: "temp-legs",
    name: "Leg Day (ขา ท้อง)",
    exercises: ["Squat", "Romanian Deadlift", "Leg Press", "Calf Raise"]
  }
];

export default function TemplateManager({ onLoadTemplate, templates, setTemplates }) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [tempExercises, setTempExercises] = useState([""]);

  // Initialize templates with defaults if not present
  useEffect(() => {
    const saved = localStorage.getItem("workout_templates");
    if (saved) {
      try {
        setTemplates(JSON.parse(saved));
      } catch (e) {
        setTemplates(DEFAULT_TEMPLATES);
      }
    } else {
      setTemplates(DEFAULT_TEMPLATES);
      localStorage.setItem("workout_templates", JSON.stringify(DEFAULT_TEMPLATES));
    }
  }, [setTemplates]);

  const handleSaveTemplates = (newTemplates) => {
    setTemplates(newTemplates);
    localStorage.setItem("workout_templates", JSON.stringify(newTemplates));
  };

  const handleAddTempExercise = () => {
    setTempExercises([...tempExercises, ""]);
  };

  const handleExerciseChange = (index, value) => {
    const updated = [...tempExercises];
    updated[index] = value;
    setTempExercises(updated);
  };

  const handleRemoveTempExercise = (index) => {
    const updated = tempExercises.filter((_, i) => i !== index);
    setTempExercises(updated.length > 0 ? updated : [""]);
  };

  const handleCreateTemplate = (e) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    const filteredExercises = tempExercises
      .map((ex) => ex.trim())
      .filter((ex) => ex.length > 0);

    if (filteredExercises.length === 0) return;

    const newTemplate = {
      id: "temp-" + Date.now(),
      name: newTemplateName.trim(),
      exercises: filteredExercises
    };

    const updatedTemplates = [...templates, newTemplate];
    handleSaveTemplates(updatedTemplates);

    // Reset Form
    setNewTemplateName("");
    setTempExercises([""]);
    setIsCreating(false);
  };

  const handleDeleteTemplate = (id, e) => {
    e.stopPropagation(); // Prevent loading template when clicking delete
    const updated = templates.filter((t) => t.id !== id);
    handleSaveTemplates(updated);
  };

  return (
    <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-bold text-slate-800">โปรแกรมการฝึก (Templates)</h2>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> สร้างโปรแกรม
          </button>
        )}
      </div>

      {isCreating ? (
        <form onSubmit={handleCreateTemplate} className="space-y-4 border border-emerald-100 bg-emerald-50/20 p-4 rounded-xl animate-fadeIn">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-500" /> สร้างโปรแกรมการฝึกใหม่
          </h3>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">ชื่อโปรแกรม</label>
            <input
              type="text"
              required
              placeholder="เช่น Chest & Triceps, Full Body"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-500">รายชื่อท่าออกกำลังกาย</label>
            {tempExercises.map((ex, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  type="text"
                  required
                  placeholder={`ท่าที่ ${index + 1} (เช่น Bench Press)`}
                  value={ex}
                  onChange={(e) => handleExerciseChange(index, e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveTempExercise(index)}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddTempExercise}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 font-semibold mt-1"
            >
              <Plus className="w-4 h-4" /> เพิ่มท่าออกกำลังกาย
            </button>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setTempExercises([""]);
                setNewTemplateName("");
              }}
              className="text-xs px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex items-center gap-1 text-xs px-3 py-2 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" /> บันทึกโปรแกรม
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
          {templates.map((template) => (
            <div
              key={template.id}
              onClick={() => onLoadTemplate(template)}
              className="group flex items-center justify-between p-3 border border-slate-100 hover:border-emerald-100 rounded-xl bg-white hover:bg-emerald-50/10 cursor-pointer shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div>
                <h3 className="text-sm font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">
                  {template.name}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                  {template.exercises.join(", ")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md opacity-90 group-hover:opacity-100">
                  <Play className="w-3 h-3 fill-emerald-600" /> เริ่มซ้อม
                </span>
                <button
                  onClick={(e) => handleDeleteTemplate(template.id, e)}
                  className="p-1.5 text-slate-300 hover:text-red-500 rounded-md hover:bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="ลบโปรแกรม"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6">ยังไม่มีโปรแกรมการฝึก สร้างขึ้นมาใหม่ได้เลย!</p>
          )}
        </div>
      )}
    </div>
  );
}
