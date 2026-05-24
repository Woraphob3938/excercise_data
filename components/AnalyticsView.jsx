"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { TrendingUp, Award, Dumbbell, BarChart3, HelpCircle } from "lucide-react";
import { calculate1RM, recommendOverload } from "../utils/fitness";

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AnalyticsView({ history }) {
  const [selectedExercise, setSelectedExercise] = useState("");

  // Get all unique exercises from history to populate dropdown
  const uniqueExercises = useMemo(() => {
    const exercisesSet = new Set();
    history.forEach((workout) => {
      workout.exercises.forEach((ex) => {
        if (ex.name) {
          exercisesSet.add(ex.name.trim());
        }
      });
    });
    return Array.from(exercisesSet).sort();
  }, [history]);

  // Auto-select first exercise if current selection is empty and list has items
  useEffect(() => {
    if (uniqueExercises.length > 0 && !selectedExercise) {
      setTimeout(() => setSelectedExercise(uniqueExercises[0]), 0);
    }
  }, [uniqueExercises, selectedExercise]);

  // Extract trend data for the selected exercise
  const trendData = useMemo(() => {
    if (!selectedExercise || history.length === 0) return null;

    const exerciseHistory = [];

    // Filter workouts and extract the specific exercise details
    // Sort chronological (oldest first) for graphs
    const sortedHistory = [...history].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    sortedHistory.forEach((workout) => {
      const match = workout.exercises.find(
        (ex) => ex.name.trim().toLowerCase() === selectedExercise.trim().toLowerCase()
      );

      if (match && match.sets && match.sets.length > 0) {
        const weights = match.sets.map((s) => parseFloat(s.weight) || 0);
        const reps = match.sets.map((s) => parseInt(s.reps, 10) || 0);

        const maxWeight = Math.max(...weights);
        const maxWeightReps = match.sets.find((s) => parseFloat(s.weight) === maxWeight)?.reps || 1;
        const max1RM = Math.max(...match.sets.map((s) => calculate1RM(s.weight, s.reps)));

        // Calculate session volume for this exercise
        const volume = match.sets.reduce(
          (acc, set) => acc + (parseFloat(set.weight) || 0) * (parseInt(set.reps, 10) || 0),
          0
        );

        const dateFormatted = new Date(workout.date).toLocaleDateString("th-TH", {
          month: "short",
          day: "numeric"
        });

        exerciseHistory.push({
          date: dateFormatted,
          maxWeight,
          max1RM,
          volume,
          setsCount: match.sets.length,
          rawDate: workout.date
        });
      }
    });

    return exerciseHistory;
  }, [history, selectedExercise]);

  // Calculate high-level achievements for the selected exercise
  const achievements = useMemo(() => {
    if (!trendData || trendData.length === 0) return null;

    let absoluteMaxWeight = 0;
    let absoluteMaxWeightDate = "";
    let absoluteMax1RM = 0;
    let absoluteMax1RMDate = "";
    let totalSets = 0;

    trendData.forEach((session) => {
      totalSets += session.setsCount;
      if (session.maxWeight > absoluteMaxWeight) {
        absoluteMaxWeight = session.maxWeight;
        absoluteMaxWeightDate = session.rawDate;
      }
      if (session.max1RM > absoluteMax1RM) {
        absoluteMax1RM = session.max1RM;
        absoluteMax1RMDate = session.rawDate;
      }
    });

    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      return new Date(dateStr).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    };

    return {
      maxWeight: absoluteMaxWeight,
      maxWeightDate: formatDate(absoluteMaxWeightDate),
      max1RM: absoluteMax1RM,
      max1RMDate: formatDate(absoluteMax1RMDate),
      totalSessions: trendData.length,
      totalSets
    };
  }, [trendData]);

  // Calculate Progressive Overload next-session recommendation
  const recommendation = useMemo(() => {
    if (!selectedExercise || history.length === 0) return null;
    return recommendOverload(history, selectedExercise);
  }, [history, selectedExercise]);

  // Chart configuration for 1RM / Max Weight Trend
  const strengthChartData = useMemo(() => {
    if (!trendData || trendData.length === 0) return null;

    const labels = trendData.map((d) => d.date);
    const maxWeights = trendData.map((d) => d.maxWeight);
    const max1RMs = trendData.map((d) => d.max1RM);

    return {
      labels,
      datasets: [
        {
          label: "1-Rep Max โดยประมาณ (kg)",
          data: max1RMs,
          borderColor: "rgba(16, 185, 129, 1)", // Emerald
          backgroundColor: "rgba(16, 185, 129, 0.05)",
          borderWidth: 2,
          pointBackgroundColor: "rgba(16, 185, 129, 1)",
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.25,
          fill: true
        },
        {
          label: "น้ำหนักที่ยกสูงสุด (kg)",
          data: maxWeights,
          borderColor: "rgba(59, 130, 246, 1)", // Blue
          backgroundColor: "rgba(59, 130, 246, 0.05)",
          borderWidth: 2,
          pointBackgroundColor: "rgba(59, 130, 246, 1)",
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.25,
          fill: true
        }
      ]
    };
  }, [trendData]);

  // Chart configuration for Training Volume Trend
  const volumeChartData = useMemo(() => {
    if (!trendData || trendData.length === 0) return null;

    const labels = trendData.map((d) => d.date);
    const volumes = trendData.map((d) => d.volume);

    return {
      labels,
      datasets: [
        {
          label: "ปริมาตรสะสม Volume (kg x reps)",
          data: volumes,
          backgroundColor: "rgba(139, 92, 246, 0.15)", // Violet
          borderColor: "rgba(139, 92, 246, 1)",
          borderWidth: 1.5,
          borderRadius: 6,
          hoverBackgroundColor: "rgba(139, 92, 246, 0.3)"
        }
      ]
    };
  }, [trendData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          boxWidth: 12,
          font: { size: 10, weight: "bold" },
          color: "#475569" // slate-600
        }
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        titleColor: "#1e293b", // slate-800
        bodyColor: "#475569", // slate-600
        borderColor: "#f1f5f9", // slate-100
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          label: function (context) {
            return ` ${context.dataset.label}: ${context.raw} kg`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 9 }, color: "#64748b" } // slate-500
      },
      y: {
        grid: { color: "#f1f5f9" },
        ticks: { font: { size: 9 }, color: "#64748b" }
      }
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            กราฟและสถิติ (Workout Analytics)
          </h2>
          <p className="text-xs text-slate-400">ติดตามพัฒนาการและความแข็งแกร่งของกล้ามเนื้อ</p>
        </div>

        {/* Exercise Selector */}
        {uniqueExercises.length > 0 && (
          <div className="relative w-full sm:w-60">
            <select
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white text-slate-700 cursor-pointer"
            >
              {uniqueExercises.map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16">
          <TrendingUp className="w-9 h-9 text-slate-300 mx-auto mb-2.5" />
          <p className="text-xs font-semibold text-slate-400">ยังไม่มีข้อมูลสำหรับการประเมินสถิติ</p>
          <p className="text-[10px] text-slate-400 mt-1">เริ่มบันทึกประวัติเพื่อสร้างกราฟแนวโน้มความแข็งแรงของคุณ</p>
        </div>
      ) : uniqueExercises.length === 0 ? (
        <div className="text-center py-16">
          <HelpCircle className="w-9 h-9 text-slate-300 mx-auto mb-2.5" />
          <p className="text-xs font-semibold text-slate-400">ยังไม่พบคู่น้ำหนัก/จำนวนครั้งในประวัติ</p>
          <p className="text-[10px] text-slate-400 mt-1">บันทึกข้อมูลท่าฝึกและเซ็ตในการซ้อมก่อน</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Progressive Overload Recommendation Card */}
          {recommendation && (
            <div className="bg-emerald-50/30 border border-emerald-100/50 rounded-2xl p-4 flex gap-3 items-start animate-fadeIn">
              <Award className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                  คำแนะนำสำหรับการฝึกครั้งถัดไป (Next-Session Recommendation)
                </h3>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {recommendation.badge}
                  </span>
                  <span className="text-sm font-black text-slate-800">
                    เป้าหมายแนะนำ: {recommendation.targetWeight} kg x {recommendation.targetReps} ครั้ง
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {recommendation.message}
                </p>
              </div>
            </div>
          )}

          {/* PR Summary Cards */}
          {achievements && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-emerald-50/20 border border-emerald-50 rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                    น้ำหนักสูงสุด (PR)
                  </span>
                  <Award className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-lg font-black text-slate-800 mt-1.5">
                  {achievements.maxWeight} <span className="text-xs font-semibold text-slate-500">kg</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-1">
                  เมื่อ {achievements.maxWeightDate}
                </div>
              </div>

              <div className="bg-indigo-50/20 border border-indigo-50/50 rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">
                    1RM สูงสุดคาดการณ์
                  </span>
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-lg font-black text-slate-800 mt-1.5">
                  {achievements.max1RM} <span className="text-xs font-semibold text-slate-500">kg</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-1">
                  เมื่อ {achievements.max1RMDate}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    จำนวนเซสชั่นที่ฝึก
                  </span>
                  <Dumbbell className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-lg font-black text-slate-800 mt-1.5">
                  {achievements.totalSessions} <span className="text-xs font-semibold text-slate-500">ครั้ง</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-1">
                  สะสมตั้งแต่เริ่มบันทึก
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    เซ็ตรวมที่ฝึกสำเร็จ
                  </span>
                  <BarChart3 className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-lg font-black text-slate-800 mt-1.5">
                  {achievements.totalSets} <span className="text-xs font-semibold text-slate-500">เซ็ต</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-1">
                  สำหรับท่า {selectedExercise}
                </div>
              </div>
            </div>
          )}

          {/* Trend Charts */}
          {trendData && trendData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Strength Development Chart */}
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">
                  พัฒนาการด้านความแข็งแกร่ง (Strength Trend)
                </h3>
                <div className="h-64 relative">
                  {strengthChartData && (
                    <Line data={strengthChartData} options={chartOptions} />
                  )}
                </div>
              </div>

              {/* Volume Chart */}
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">
                  ความหนักรวมสะสม (Total Volume Trend)
                </h3>
                <div className="h-64 relative">
                  {volumeChartData && (
                    <Bar data={volumeChartData} options={chartOptions} />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">
              กำลังรวบรวมข้อมูลสถิติของ {selectedExercise} ในระยะยาว...
            </div>
          )}

          {trendData && trendData.length < 2 && (
            <p className="text-[10px] text-center text-slate-400 italic">
              * กราฟแนวโน้มพัฒนาการจะสวยงามและเห็นการเติบโตเมื่อคุณบันทึกท่าฝึกนี้ตั้งแต่ 2 ครั้งขึ้นไป
            </p>
          )}
        </div>
      )}
    </div>
  );
}
