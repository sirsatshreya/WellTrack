/* ============================================================
   burnout.js — Burnout risk scoring & recommendation engine
   ------------------------------------------------------------
   Score 0–100 (higher = more burnout risk), built from:
     • Stress (0–30 pts)       stress 1–10
     • Mood (0–20 pts)         mood 1–5 (low mood = risk)
     • Motivation (0–20 pts)   motivation 1–10 (low = risk)
     • Sleep (0–20 pts)        deviation from 7–9 h healthy band
     • Study load (0–10 pts)   overwork > 8 h/day escalates risk
   Categories:
     0–39   Healthy
     40–64  Moderate Risk
     65–100 High Risk
   ============================================================ */

const Burnout = (() => {

  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  function computeScore(entry) {
    const stress = clamp(Number(entry.stress) || 0, 1, 10);
    const mood = clamp(Number(entry.mood) || 3, 1, 5);
    const motivation = clamp(Number(entry.motivation) || 5, 1, 10);
    const sleep = clamp(Number(entry.sleep) || 0, 0, 16);
    const study = clamp(Number(entry.study) || 0, 0, 18);

    // Stress: 1 -> 0 pts, 10 -> 30 pts
    const stressPts = ((stress - 1) / 9) * 30;

    // Mood: 5 -> 0 pts, 1 -> 20 pts
    const moodPts = ((5 - mood) / 4) * 20;

    // Motivation: 10 -> 0 pts, 1 -> 20 pts
    const motivPts = ((10 - motivation) / 9) * 20;

    // Sleep: 7–9 h ideal band -> 0 pts; each hour outside adds ~5 pts (max 20)
    let sleepDev = 0;
    if (sleep < 7) sleepDev = 7 - sleep;
    else if (sleep > 9) sleepDev = sleep - 9;
    const sleepPts = clamp(sleepDev * 5, 0, 20);

    // Study overload: >8 h adds 2.5 pts/hour (max 10)
    const studyPts = clamp((study - 8) * 2.5, 0, 10);

    const score = Math.round(stressPts + moodPts + motivPts + sleepPts + studyPts);
    return clamp(score, 0, 100);
  }

  function categorize(score) {
    if (score < 40) return 'Healthy';
    if (score < 65) return 'Moderate Risk';
    return 'High Risk';
  }

  function categoryClass(category) {
    if (category === 'Healthy') return 'healthy';
    if (category === 'Moderate Risk') return 'moderate';
    return 'high';
  }

  /* ------------------------------------------------------------
     Recommendations based on the latest entry + recent trend
     Returns array of {level: danger|warning|success|info, icon, text}
     ------------------------------------------------------------ */
  function recommendations(entry, recentEntries = []) {
    const recs = [];
    if (!entry) {
      return [{ level: 'info', icon: 'fa-circle-info', text: 'Start your first check-in to get personalized advice.' }];
    }

    const score = entry.score;
    const cat = entry.category;

    // --- Risk level headline ---
    if (cat === 'High Risk') {
      recs.push({ level: 'danger', icon: 'fa-triangle-exclamation', text: 'Your burnout risk is HIGH today. Consider taking a proper break, talking to a friend, mentor, or campus counselor, and reducing your workload for a day or two.' });
    } else if (cat === 'Moderate Risk') {
      recs.push({ level: 'warning', icon: 'fa-circle-exclamation', text: 'You are showing moderate signs of strain. Small adjustments now — better sleep, short breaks, lighter evenings — can prevent escalation.' });
    } else {
      recs.push({ level: 'success', icon: 'fa-circle-check', text: 'You are in a healthy zone. Keep up your current balance of study, rest, and recovery!' });
    }

    // --- Stress ---
    if (entry.stress >= 8) {
      recs.push({ level: 'danger', icon: 'fa-bolt', text: 'Stress is very high (' + entry.stress + '/10). Try the 4-7-8 breathing technique, a 15-minute walk, or writing down what is worrying you to make it concrete.' });
    } else if (entry.stress >= 6) {
      recs.push({ level: 'warning', icon: 'fa-bolt', text: 'Stress is elevated. Schedule short breaks every 45–60 minutes of study (Pomodoro technique) and avoid multitasking.' });
    }

    // --- Sleep ---
    if (entry.sleep < 6) {
      recs.push({ level: 'danger', icon: 'fa-bed', text: 'Only ' + entry.sleep + 'h of sleep — this strongly amplifies stress and hurts memory consolidation. Aim for 7–9 hours; try a fixed wind-down time tonight with no screens 30 min before bed.' });
    } else if (entry.sleep < 7) {
      recs.push({ level: 'warning', icon: 'fa-bed', text: 'Sleep is slightly below the healthy 7–9 hour range. Going to bed 30–45 minutes earlier can noticeably improve focus tomorrow.' });
    } else if (entry.sleep > 10) {
      recs.push({ level: 'warning', icon: 'fa-bed', text: 'Oversleeping (' + entry.sleep + 'h) can be a sign of exhaustion or low mood. Try a consistent wake-up time and morning daylight exposure.' });
    }

    // --- Study load ---
    if (entry.study > 10) {
      recs.push({ level: 'danger', icon: 'fa-book-open', text: entry.study + ' hours of study is unsustainable. Long-term retention drops sharply after ~8 focused hours. Plan spaced revision instead of marathon sessions.' });
    } else if (entry.study > 8) {
      recs.push({ level: 'warning', icon: 'fa-book-open', text: 'Heavy study day (' + entry.study + 'h). Make sure tomorrow includes lighter blocks and real rest to recover.' });
    } else if (entry.study < 1 && entry.motivation <= 4) {
      recs.push({ level: 'info', icon: 'fa-seedling', text: 'Low study time with low motivation — start with just one tiny 10-minute task. Momentum usually follows action, not the other way round.' });
    }

    // --- Motivation ---
    if (entry.motivation <= 3) {
      recs.push({ level: 'warning', icon: 'fa-fire', text: 'Motivation is very low. Reconnect with your "why", break work into micro-goals, and reward yourself after each one. A day off can also legitimately recharge you.' });
    }

    // --- Mood ---
    if (entry.mood <= 2) {
      recs.push({ level: 'warning', icon: 'fa-face-frown', text: 'Your mood is low today. Physical activity, sunlight, and talking to someone you trust are proven fast mood-lifters. Be kind to yourself.' });
    }

    // --- Trend-based insights (needs >= 3 recent entries) ---
    if (recentEntries.length >= 3) {
      const last3 = recentEntries.slice(0, 3);
      const avgRecentScore = last3.reduce((s, e) => s + e.score, 0) / 3;
      const older = recentEntries.slice(3, 6);
      if (older.length >= 2) {
        const avgOlder = older.reduce((s, e) => s + e.score, 0) / older.length;
        if (avgRecentScore - avgOlder >= 10) {
          recs.push({ level: 'danger', icon: 'fa-arrow-trend-up', text: 'Your burnout risk has been rising over recent days. Treat this as an early warning: plan one genuinely restful day this week.' });
        } else if (avgOlder - avgRecentScore >= 10) {
          recs.push({ level: 'success', icon: 'fa-arrow-trend-down', text: 'Great progress — your burnout risk has been dropping over recent days. Whatever you changed, keep doing it!' });
        }
      }
      const lowSleepDays = last3.filter(e => e.sleep < 6.5).length;
      if (lowSleepDays >= 3) {
        recs.push({ level: 'danger', icon: 'fa-moon', text: 'Three or more consecutive short-sleep days detected. Sleep debt compounds — prioritize a full night of rest tonight.' });
      }
      const highStressDays = last3.filter(e => e.stress >= 7).length;
      if (highStressDays >= 3) {
        recs.push({ level: 'warning', icon: 'fa-heart-pulse', text: 'Sustained high stress for several days. Consider blocking a stress-free evening and reviewing whether any deadline can be renegotiated.' });
      }
    }

    return recs.slice(0, 6);
  }

  /* Average helper for summaries */
  function averages(entries) {
    if (!entries.length) return null;
    const sum = { score: 0, mood: 0, stress: 0, sleep: 0, study: 0, motivation: 0 };
    entries.forEach(e => {
      sum.score += e.score; sum.mood += e.mood; sum.stress += e.stress;
      sum.sleep += e.sleep; sum.study += e.study; sum.motivation += e.motivation;
    });
    const n = entries.length;
    return {
      n,
      score: +(sum.score / n).toFixed(1),
      mood: +(sum.mood / n).toFixed(1),
      stress: +(sum.stress / n).toFixed(1),
      sleep: +(sum.sleep / n).toFixed(1),
      study: +(sum.study / n).toFixed(1),
      motivation: +(sum.motivation / n).toFixed(1)
    };
  }

  return { computeScore, categorize, categoryClass, recommendations, averages };
})();