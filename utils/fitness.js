/**
 * Calculates the Estimated 1-Rep Max (1RM) using the Epley formula:
 * 1RM = weight * (1 + reps / 30)
 * For 1 rep, the 1RM is simply the weight.
 * 
 * @param {number} weight - Weight lifted
 * @param {number} reps - Number of repetitions
 * @returns {number} Estimated 1RM rounded to 1 decimal place
 */
export function calculate1RM(weight, reps) {
  if (!weight || !reps) return 0;
  const w = parseFloat(weight);
  const r = parseInt(reps, 10);
  if (isNaN(w) || isNaN(r) || w <= 0 || r <= 0) return 0;
  
  if (r === 1) return w;
  const oneRM = w * (1 + r / 30);
  return Math.round(oneRM * 10) / 10;
}

/**
 * Checks if the current set is a new Personal Record (PR) for this exercise.
 * A set is a PR if it exceeds all previous sets in:
 * 1. Absolute weight lifted OR
 * 2. Estimated 1RM
 * 
 * @param {Array} history - Array of all workout logs
 * @param {string} exerciseName - Name of the exercise
 * @param {number} weight - Current weight
 * @param {number} reps - Current reps
 * @returns {Object} { isWeightPR: boolean, is1rmPR: boolean, isAnyPR: boolean }
 */
export function checkNewPR(history, exerciseName, weight, reps) {
  if (!history || !Array.isArray(history) || history.length === 0) {
    // If no history, this first entry is a PR!
    return { isWeightPR: true, is1rmPR: true, isAnyPR: true };
  }

  const normalizedName = exerciseName.trim().toLowerCase();
  const pastSets = [];

  // Extract all past sets for this exercise (excluding the current one, assuming it's not yet in history)
  history.forEach(log => {
    if (log.exercises && Array.isArray(log.exercises)) {
      log.exercises.forEach(ex => {
        if (ex.name && ex.name.trim().toLowerCase() === normalizedName && ex.sets) {
          ex.sets.forEach(set => {
            pastSets.push({
              weight: parseFloat(set.weight) || 0,
              reps: parseInt(set.reps, 10) || 0,
              oneRM: calculate1RM(set.weight, set.reps)
            });
          });
        }
      });
    }
  });

  if (pastSets.length === 0) {
    return { isWeightPR: true, is1rmPR: true, isAnyPR: true };
  }

  const currentWeight = parseFloat(weight) || 0;
  const current1RM = calculate1RM(weight, reps);

  const maxPastWeight = Math.max(...pastSets.map(s => s.weight), 0);
  const maxPast1RM = Math.max(...pastSets.map(s => s.oneRM), 0);

  const isWeightPR = currentWeight > maxPastWeight;
  const is1rmPR = current1RM > maxPast1RM;

  return {
    isWeightPR,
    is1rmPR,
    isAnyPR: isWeightPR || is1rmPR
  };
}

/**
 * Generates progressive overload recommendations based on the history of an exercise.
 * 
 * @param {Array} history - Array of all workout logs
 * @param {string} exerciseName - Name of the exercise
 * @returns {Object} Recommendation containing target weight, reps, and explanation
 */
export function recommendOverload(history, exerciseName) {
  const defaultRec = {
    targetWeight: 20,
    targetReps: 10,
    message: "เริ่มต้นด้วยน้ำหนักเบาเพื่อวอร์มอัพและฝึกฟอร์มการยกให้ถูกต้อง (เช่น บาร์เปล่า 20 กก.)",
    badge: "เริ่มต้นฝึก"
  };

  if (!history || !Array.isArray(history) || history.length === 0 || !exerciseName) {
    return defaultRec;
  }

  const normalizedName = exerciseName.trim().toLowerCase();
  const matches = [];
  
  // Find all workout sessions that contain this exercise
  history.forEach(log => {
    if (log.exercises && Array.isArray(log.exercises)) {
      const ex = log.exercises.find(
        e => e.name && e.name.trim().toLowerCase() === normalizedName
      );
      if (ex && ex.sets && ex.sets.length > 0) {
        matches.push({
          date: log.date,
          sets: ex.sets
        });
      }
    }
  });

  if (matches.length === 0) {
    return defaultRec;
  }

  // Sort by date descending (most recent first)
  matches.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Get the most recent session's sets
  const lastSession = matches[0];
  const lastSets = lastSession.sets || [];
  
  if (lastSets.length === 0) {
    return defaultRec;
  }

  // Extract average weight, max weight, and average reps
  const weights = lastSets.map(s => parseFloat(s.weight) || 0);
  const reps = lastSets.map(s => parseInt(s.reps, 10) || 0);
  
  const maxWeight = Math.max(...weights);
  // Find the reps done at that max weight
  const repsAtMaxWeight = lastSets.find(s => parseFloat(s.weight) === maxWeight)?.reps || 8;

  let targetWeight = maxWeight;
  let targetReps = repsAtMaxWeight;
  let message = "";
  let badge = "";

  // Progressive Overload Logic:
  // If reps are high (>= 12), we increase the weight by 2.5% - 5% (rounded to nearest 2.5kg or 5lb) and drop reps to 8-10.
  // If reps are moderate (8-11), we keep the weight and recommend increasing reps by 1-2 to build capacity.
  // If reps are low (< 8), we keep the weight and recommend mastering the weight by focusing on form and getting to 8-10 reps.
  if (repsAtMaxWeight >= 12) {
    const increase = maxWeight * 0.05;
    // Round to nearest 2.5kg
    const roundedIncrease = Math.max(2.5, Math.round(increase / 2.5) * 2.5);
    targetWeight = maxWeight + roundedIncrease;
    targetReps = 8;
    message = `ในครั้งก่อนคุณยกน้ำหนัก ${maxWeight} kg ได้ถึง ${repsAtMaxWeight} ครั้ง! ครั้งนี้แนะนำให้เพิ่มน้ำหนักขึ้น ${roundedIncrease} kg และทำเป้าหมาย 8 ครั้ง เพื่อพัฒนาความแข็งแกร่ง`;
    badge = "เพิ่มน้ำหนัก (+Weight)";
  } else if (repsAtMaxWeight >= 8) {
    targetWeight = maxWeight;
    targetReps = repsAtMaxWeight + 1;
    message = `รักษาพิกัดน้ำหนักเดิมที่ ${maxWeight} kg แต่พยายามท้าทายตนเองโดยการเพิ่มจำนวนครั้งเป็น ${targetReps} ครั้ง ในเซ็ตแรก`;
    badge = "เพิ่มจำนวนครั้ง (+Reps)";
  } else {
    targetWeight = maxWeight;
    targetReps = 8;
    message = `พยายามฝึกซ้อมที่น้ำหนักเดิม ${maxWeight} kg เพื่อให้ได้ขั้นต่ำ 8 ครั้งอย่างมั่นคงและปลอดภัย ก่อนที่จะขยับน้ำหนักขึ้น`;
    badge = "รักษาความสม่ำเสมอ (Form Focus)";
  }

  return {
    targetWeight,
    targetReps,
    message,
    badge
  };
}

/**
 * Returns summary stats from the workout history:
 * - Active Streak (consecutive weeks or active training days)
 * - Total Workouts logged
 * - Total Sets completed
 * - PR count
 * 
 * @param {Array} history 
 * @returns {Object} Stats object
 */
export function getStatsSummary(history) {
  if (!history || !Array.isArray(history)) {
    return { streak: 0, totalWorkouts: 0, totalSets: 0, prCount: 0 };
  }

  const totalWorkouts = history.length;
  let totalSets = 0;
  let prCount = 0;

  // Track unique workout days to calculate streak
  const uniqueDates = new Set();

  history.forEach(log => {
    if (log.date) {
      uniqueDates.add(log.date.split('T')[0]);
    }
    if (log.exercises && Array.isArray(log.exercises)) {
      log.exercises.forEach(ex => {
        if (ex.sets && Array.isArray(ex.sets)) {
          totalSets += ex.sets.length;
          ex.sets.forEach(set => {
            if (set.isWeightPR || set.is1rmPR) {
              prCount++;
            }
          });
        }
      });
    }
  });

  // Calculate workout streak (consecutive days of workout)
  const sortedDates = Array.from(uniqueDates).sort((a, b) => new Date(b) - new Date(a));
  let streak = 0;
  if (sortedDates.length > 0) {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // If the last workout was today or yesterday, start counting streak
    if (sortedDates[0] === todayStr || sortedDates[0] === yesterdayStr) {
      streak = 1;
      let prevDate = new Date(sortedDates[0]);
      for (let i = 1; i < sortedDates.length; i++) {
        const currentDate = new Date(sortedDates[i]);
        const diffTime = Math.abs(prevDate - currentDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          streak++;
          prevDate = currentDate;
        } else if (diffDays > 1) {
          break;
        }
      }
    }
  }

  return {
    streak,
    totalWorkouts,
    totalSets,
    prCount
  };
}
