/* ============================================================
   achievements.js — Streaks, consistency & badge system
   ============================================================ */

const Achievements = (() => {

  /* ---------- Streak calculations ---------- */

  /** Current streak: consecutive days ending today or yesterday. */
  function currentStreak(entries) {
    if (!entries.length) return 0;
    const dates = new Set(entries.map(e => e.date));
    let streak = 0;
    // streak may end today or yesterday (yesterday keeps streak "alive")
    let cursor = Storage.todayStr();
    if (!dates.has(cursor)) {
      cursor = Storage.todayStr(-1);
      if (!dates.has(cursor)) return 0;
    }
    let offset = cursor === Storage.todayStr() ? 0 : -1;
    while (dates.has(Storage.todayStr(offset))) {
      streak++;
      offset--;
    }
    return streak;
  }

  /** Longest streak ever. */
  function longestStreak(entries) {
    if (!entries.length) return 0;
    const dates = entries.map(e => e.date).sort();
    let longest = 1, run = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1] + 'T00:00:00');
      const cur = new Date(dates[i] + 'T00:00:00');
      const diff = Math.round((cur - prev) / 86400000);
      if (diff === 1) { run++; longest = Math.max(longest, run); }
      else if (diff > 1) { run = 1; }
    }
    return Math.max(longest, run);
  }

  /** % of days with a check-in over the last `days` days. */
  function consistency(entries, days = 30) {
    const dates = new Set(entries.map(e => e.date));
    let done = 0;
    for (let i = 0; i < days; i++) {
      if (dates.has(Storage.todayStr(-i))) done++;
    }
    return Math.round((done / days) * 100);
  }

  /* ---------- Badge definitions ---------- */
  const BADGES = [
    { id: 'first_checkin', name: 'First Step', icon: 'fa-shoe-prints', desc: 'Complete your first daily check-in.', test: (s) => s.total >= 1 },
    { id: 'five_checkins', name: 'Getting Started', icon: 'fa-seedling', desc: 'Complete 5 check-ins.', test: (s) => s.total >= 5 },
    { id: 'twenty_checkins', name: 'Committed', icon: 'fa-dumbbell', desc: 'Complete 20 check-ins.', test: (s) => s.total >= 20 },
    { id: 'fifty_checkins', name: 'Half Century', icon: 'fa-star', desc: 'Complete 50 check-ins.', test: (s) => s.total >= 50 },
    { id: 'streak_3', name: 'On a Roll', icon: 'fa-fire', desc: 'Reach a 3-day check-in streak.', test: (s) => s.longest >= 3 },
    { id: 'streak_7', name: 'Week Warrior', icon: 'fa-calendar-week', desc: 'Reach a 7-day check-in streak.', test: (s) => s.longest >= 7 },
    { id: 'streak_14', name: 'Fortnight Force', icon: 'fa-bolt', desc: 'Reach a 14-day check-in streak.', test: (s) => s.longest >= 14 },
    { id: 'streak_30', name: 'Habit Master', icon: 'fa-crown', desc: 'Reach a 30-day check-in streak.', test: (s) => s.longest >= 30 },
    { id: 'sleep_champ', name: 'Sleep Champion', icon: 'fa-bed', desc: 'Log 7+ hours of sleep on 5 different days.', test: (s) => s.goodSleepDays >= 5 },
    { id: 'zen_mode', name: 'Zen Mode', icon: 'fa-spa', desc: 'Log stress ≤ 3 on 5 different days.', test: (s) => s.calmDays >= 5 },
    { id: 'balanced_week', name: 'Balanced Week', icon: 'fa-scale-balanced', desc: 'Stay in the Healthy zone for 7 consecutive entries.', test: (s) => s.healthyRun >= 7 },
    { id: 'comeback', name: 'Comeback Kid', icon: 'fa-arrow-trend-down', desc: 'Drop from High Risk back to Healthy.', test: (s) => s.comeback },
    { id: 'motivated', name: 'Fired Up', icon: 'fa-rocket', desc: 'Log motivation 8+ on 5 different days.', test: (s) => s.motivatedDays >= 5 },
    { id: 'journaler', name: 'Reflective Mind', icon: 'fa-pen-nib', desc: 'Write notes in 10 check-ins.', test: (s) => s.notesDays >= 10 }
  ];

  function computeStats(entries) {
    const chrono = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    let healthyRun = 0, bestHealthyRun = 0, comeback = false, seenHigh = false;
    chrono.forEach(e => {
      if (e.category === 'Healthy') {
        healthyRun++;
        bestHealthyRun = Math.max(bestHealthyRun, healthyRun);
        if (seenHigh) comeback = true;
      } else {
        healthyRun = 0;
        if (e.category === 'High Risk') seenHigh = true;
      }
    });
    return {
      total: entries.length,
      longest: longestStreak(entries),
      goodSleepDays: entries.filter(e => e.sleep >= 7).length,
      calmDays: entries.filter(e => e.stress <= 3).length,
      motivatedDays: entries.filter(e => e.motivation >= 8).length,
      notesDays: entries.filter(e => e.notes && e.notes.trim().length > 0).length,
      healthyRun: bestHealthyRun,
      comeback
    };
  }

  /**
   * Re-evaluate badges. Persists newly earned ones.
   * Returns { badges: [{...def, earned, earnedAt}], newlyEarned: [def] }
   */
  function evaluate(entries) {
    const earned = Storage.getAchievements();
    const stats = computeStats(entries);
    const newlyEarned = [];

    BADGES.forEach(b => {
      if (!earned[b.id] && b.test(stats)) {
        earned[b.id] = Date.now();
        newlyEarned.push(b);
      }
    });
    if (newlyEarned.length) Storage.saveAchievements(earned);

    const badges = BADGES.map(b => ({
      ...b,
      earned: !!earned[b.id],
      earnedAt: earned[b.id] || null
    }));
    return { badges, newlyEarned };
  }

  return { currentStreak, longestStreak, consistency, evaluate, BADGES };
})();