/* ============================================================
   WellTrack — Burnout Risk Scoring & Recommendation Engine
   ============================================================

   Burnout Score: 0–100
   Higher score = higher burnout risk

   Factors:
     • Stress       → 0–30 pts
     • Mood         → 0–20 pts
     • Motivation   → 0–20 pts
     • Sleep        → 0–20 pts
     • Study Load   → 0–10 pts

   Categories:
     0–39   → Healthy
     40–64  → Moderate Risk
     65–100 → High Risk

   Profile information is NOT used here.
   Profile:
     Name + Email + Course + Class

   Daily check-in data is used here:
     Mood + Stress + Sleep + Study + Motivation
   ============================================================ */


const Burnout = (() => {

  /* ==========================================================
     HELPER
     ========================================================== */

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }


  /* ==========================================================
     BURNOUT SCORE
     ========================================================== */

  function computeScore(entry) {

    const stress = clamp(
      Number(entry.stress) || 0,
      1,
      10
    );

    const mood = clamp(
      Number(entry.mood) || 3,
      1,
      5
    );

    const motivation = clamp(
      Number(entry.motivation) || 5,
      1,
      10
    );

    const sleep = clamp(
      Number(entry.sleep) || 0,
      0,
      16
    );

    const study = clamp(
      Number(entry.study) || 0,
      0,
      18
    );


    /* --------------------------------------------------------
       1. STRESS
       1/10  → 0 points
       10/10 → 30 points
       -------------------------------------------------------- */

    const stressPoints =
      ((stress - 1) / 9) * 30;


    /* --------------------------------------------------------
       2. MOOD
       5/5 → 0 points
       1/5 → 20 points
       -------------------------------------------------------- */

    const moodPoints =
      ((5 - mood) / 4) * 20;


    /* --------------------------------------------------------
       3. MOTIVATION
       10/10 → 0 points
       1/10  → 20 points
       -------------------------------------------------------- */

    const motivationPoints =
      ((10 - motivation) / 9) * 20;


    /* --------------------------------------------------------
       4. SLEEP
       Healthy range = 7–9 hours

       Every hour outside the healthy range
       adds approximately 5 points.
       Maximum = 20 points.
       -------------------------------------------------------- */

    let sleepDeviation = 0;

    if (sleep < 7) {
      sleepDeviation = 7 - sleep;
    }
    else if (sleep > 9) {
      sleepDeviation = sleep - 9;
    }

    const sleepPoints = clamp(
      sleepDeviation * 5,
      0,
      20
    );


    /* --------------------------------------------------------
       5. STUDY LOAD
       0–8 hours → 0 points
       >8 hours  → increasing risk
       Maximum = 10 points
       -------------------------------------------------------- */

    const studyPoints = clamp(
      (study - 8) * 2.5,
      0,
      10
    );


    /* --------------------------------------------------------
       FINAL SCORE
       -------------------------------------------------------- */

    const score = Math.round(
      stressPoints +
      moodPoints +
      motivationPoints +
      sleepPoints +
      studyPoints
    );

    return clamp(score, 0, 100);
  }


  /* ==========================================================
     CATEGORY
     ========================================================== */

  function categorize(score) {

    if (score < 40) {
      return 'Healthy';
    }

    if (score < 65) {
      return 'Moderate Risk';
    }

    return 'High Risk';
  }


  /* ==========================================================
     CATEGORY CSS CLASS
     ========================================================== */

  function categoryClass(category) {

    if (category === 'Healthy') {
      return 'healthy';
    }

    if (category === 'Moderate Risk') {
      return 'moderate';
    }

    return 'high';
  }


  /* ==========================================================
     PERSONALIZED RECOMMENDATIONS
     ========================================================== */

  function recommendations(
    entry,
    recentEntries = []
  ) {

    const recommendationsList = [];


    /* --------------------------------------------------------
       No check-in yet
       -------------------------------------------------------- */

    if (!entry) {

      return [
        {
          level: 'info',
          icon: 'fa-circle-info',
          text:
            'Complete your first daily check-in to receive personalized well-being recommendations.'
        }
      ];
    }


    const score = Number(entry.score) || 0;
    const category = entry.category;


    /* ========================================================
       RISK LEVEL
       ======================================================== */

    if (category === 'High Risk') {

      recommendationsList.push({
        level: 'danger',
        icon: 'fa-triangle-exclamation',
        text:
          'Your burnout risk is high today. Consider reducing your workload, taking a proper break, and talking to someone you trust if the pressure continues.'
      });

    }

    else if (category === 'Moderate Risk') {

      recommendationsList.push({
        level: 'warning',
        icon: 'fa-circle-exclamation',
        text:
          'You are showing moderate signs of strain. Improving sleep, taking regular breaks, and balancing study with recovery can help prevent your stress from increasing.'
      });

    }

    else {

      recommendationsList.push({
        level: 'success',
        icon: 'fa-circle-check',
        text:
          'You are currently in a healthy range. Keep maintaining a balanced routine of study, rest, sleep, and recovery.'
      });
    }


    /* ========================================================
       STRESS
       ======================================================== */

    if (Number(entry.stress) >= 8) {

      recommendationsList.push({
        level: 'danger',
        icon: 'fa-bolt',
        text:
          `Your stress level is very high (${entry.stress}/10). Take a short break, try slow breathing, go for a 10–15 minute walk, or write down the specific things causing pressure.`
      });

    }

    else if (Number(entry.stress) >= 6) {

      recommendationsList.push({
        level: 'warning',
        icon: 'fa-bolt',
        text:
          'Your stress is elevated. Try taking short breaks every 45–60 minutes and avoid multitasking while studying.'
      });
    }


    /* ========================================================
       SLEEP
       ======================================================== */

    if (Number(entry.sleep) < 6) {

      recommendationsList.push({
        level: 'danger',
        icon: 'fa-bed',
        text:
          `You slept only ${entry.sleep} hours. Consistently getting too little sleep can negatively affect concentration, recovery, and stress levels. Aim for 7–9 hours.`
      });

    }

    else if (Number(entry.sleep) < 7) {

      recommendationsList.push({
        level: 'warning',
        icon: 'fa-bed',
        text:
          'Your sleep is slightly below the recommended 7–9 hour range. Try going to bed a little earlier tonight.'
      });

    }

    else if (Number(entry.sleep) > 10) {

      recommendationsList.push({
        level: 'warning',
        icon: 'fa-bed',
        text:
          `You slept ${entry.sleep} hours. If unusually long sleep happens repeatedly, pay attention to your overall energy and routine.`
      });
    }


    /* ========================================================
       STUDY LOAD
       ======================================================== */

    if (Number(entry.study) > 10) {

      recommendationsList.push({
        level: 'danger',
        icon: 'fa-book-open',
        text:
          `${entry.study} hours is a very heavy study day. Use shorter focused sessions, spaced revision, and adequate recovery instead of repeatedly studying for long stretches.`
      });

    }

    else if (Number(entry.study) > 8) {

      recommendationsList.push({
        level: 'warning',
        icon: 'fa-book-open',
        text:
          `You studied for ${entry.study} hours today. Make sure you include proper breaks and recovery instead of maintaining this workload every day.`
      });

    }

    else if (
      Number(entry.study) < 1 &&
      Number(entry.motivation) <= 4
    ) {

      recommendationsList.push({
        level: 'info',
        icon: 'fa-seedling',
        text:
          'You had very little study time and low motivation today. Start with one small 10-minute task rather than trying to complete everything at once.'
      });
    }


    /* ========================================================
       MOTIVATION
       ======================================================== */

    if (Number(entry.motivation) <= 3) {

      recommendationsList.push({
        level: 'warning',
        icon: 'fa-fire',
        text:
          'Your motivation is very low today. Break your work into small tasks and focus on completing one task at a time.'
      });
    }


    /* ========================================================
       MOOD
       ======================================================== */

    if (Number(entry.mood) <= 2) {

      recommendationsList.push({
        level: 'warning',
        icon: 'fa-face-frown',
        text:
          'Your mood is low today. Consider taking some time away from study, getting some movement or daylight, and talking to someone you trust.'
      });
    }


    /* ========================================================
       TREND ANALYSIS
       ======================================================== */

    if (recentEntries.length >= 3) {

      const lastThree =
        recentEntries.slice(0, 3);


      /* ------------------------------------------------------
         Recent average
         ------------------------------------------------------ */

      const recentScores =
        lastThree.map(
          entry => Number(entry.score) || 0
        );

      const recentAverage =
        recentScores.reduce(
          (total, value) => total + value,
          0
        ) / recentScores.length;


      /* ------------------------------------------------------
         Older average
         ------------------------------------------------------ */

      const olderEntries =
        recentEntries.slice(3, 6);


      if (olderEntries.length >= 2) {

        const olderScores =
          olderEntries.map(
            entry => Number(entry.score) || 0
          );

        const olderAverage =
          olderScores.reduce(
            (total, value) => total + value,
            0
          ) / olderScores.length;


        /* Risk increasing */

        if (
          recentAverage - olderAverage >= 10
        ) {

          recommendationsList.push({
            level: 'danger',
            icon: 'fa-arrow-trend-up',
            text:
              'Your burnout risk has been increasing recently. Treat this as an early warning and schedule some genuine recovery time.'
          });
        }


        /* Risk decreasing */

        else if (
          olderAverage - recentAverage >= 10
        ) {

          recommendationsList.push({
            level: 'success',
            icon: 'fa-arrow-trend-down',
            text:
              'Your burnout risk has been improving recently. Continue the habits that appear to be helping you.'
          });
        }
      }


      /* ------------------------------------------------------
         Repeated low sleep
         ------------------------------------------------------ */

      const lowSleepDays =
        lastThree.filter(
          entry => Number(entry.sleep) < 6.5
        ).length;


      if (lowSleepDays >= 3) {

        recommendationsList.push({
          level: 'danger',
          icon: 'fa-moon',
          text:
            'You have recorded short sleep on several recent days. Prioritize a full night of rest and avoid repeatedly sacrificing sleep for study.'
        });
      }


      /* ------------------------------------------------------
         Repeated high stress
         ------------------------------------------------------ */

      const highStressDays =
        lastThree.filter(
          entry => Number(entry.stress) >= 7
        ).length;


      if (highStressDays >= 3) {

        recommendationsList.push({
          level: 'warning',
          icon: 'fa-heart-pulse',
          text:
            'Your stress has remained high for several days. Consider reducing unnecessary workload and creating at least one genuinely stress-free period in your day.'
        });
      }
    }


    /* ========================================================
       RETURN MAXIMUM 6 RECOMMENDATIONS
       ======================================================== */

    return recommendationsList.slice(0, 6);
  }


  /* ==========================================================
     AVERAGES
     Used by Analytics
     ========================================================== */

  function averages(entries) {

    if (
      !Array.isArray(entries) ||
      entries.length === 0
    ) {
      return null;
    }


    const totals = {

      score: 0,
      mood: 0,
      stress: 0,
      sleep: 0,
      study: 0,
      motivation: 0

    };


    entries.forEach(entry => {

      totals.score +=
        Number(entry.score) || 0;

      totals.mood +=
        Number(entry.mood) || 0;

      totals.stress +=
        Number(entry.stress) || 0;

      totals.sleep +=
        Number(entry.sleep) || 0;

      totals.study +=
        Number(entry.study) || 0;

      totals.motivation +=
        Number(entry.motivation) || 0;

    });


    const count = entries.length;


    return {

      n: count,

      score: +(
        totals.score / count
      ).toFixed(1),

      mood: +(
        totals.mood / count
      ).toFixed(1),

      stress: +(
        totals.stress / count
      ).toFixed(1),

      sleep: +(
        totals.sleep / count
      ).toFixed(1),

      study: +(
        totals.study / count
      ).toFixed(1),

      motivation: +(
        totals.motivation / count
      ).toFixed(1)

    };
  }


  /* ==========================================================
     PUBLIC API
     ========================================================== */

  return {

    computeScore,
    categorize,
    categoryClass,
    recommendations,
    averages

  };

})();
