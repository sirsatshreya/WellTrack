/* ============================================================
   achievements.js — WellTrack
   Streaks, consistency & badge system
   ============================================================ */

const Achievements = (() => {

  /* ==========================================================
     CURRENT STREAK
     Consecutive check-in days ending today or yesterday.
     ========================================================== */

  function currentStreak(entries) {

    if (!Array.isArray(entries) || !entries.length) {
      return 0;
    }

    const dates = new Set(
      entries.map(entry => entry.date)
    );

    let streak = 0;

    /*
      If there is no check-in today, allow yesterday
      to keep the streak alive.
    */

    let offset = 0;

    if (!dates.has(Storage.todayStr(0))) {

      if (!dates.has(Storage.todayStr(-1))) {
        return 0;
      }

      offset = -1;
    }

    while (
      dates.has(
        Storage.todayStr(offset)
      )
    ) {

      streak++;
      offset--;

    }

    return streak;
  }


  /* ==========================================================
     LONGEST STREAK
     Longest consecutive check-in streak ever.
     ========================================================== */

  function longestStreak(entries) {

    if (!Array.isArray(entries) || !entries.length) {
      return 0;
    }

    /*
      Remove duplicate dates before calculating streaks.
    */

    const uniqueDates = [
      ...new Set(
        entries.map(entry => entry.date)
      )
    ].sort();


    if (uniqueDates.length === 0) {
      return 0;
    }


    let longest = 1;
    let current = 1;


    for (let i = 1; i < uniqueDates.length; i++) {

      const previous =
        new Date(
          uniqueDates[i - 1] + 'T00:00:00'
        );

      const currentDate =
        new Date(
          uniqueDates[i] + 'T00:00:00'
        );


      const difference = Math.round(
        (currentDate - previous) /
        86400000
      );


      if (difference === 1) {

        current++;

        longest = Math.max(
          longest,
          current
        );

      }

      else if (difference > 1) {

        current = 1;

      }

    }


    return longest;
  }


  /* ==========================================================
     CONSISTENCY
     Percentage of days with a check-in over the
     requested number of previous days.
     ========================================================== */

  function consistency(
    entries,
    days = 30
  ) {

    if (
      !Array.isArray(entries) ||
      days <= 0
    ) {
      return 0;
    }


    const dates = new Set(
      entries.map(entry => entry.date)
    );


    let completedDays = 0;


    for (
      let offset = 0;
      offset < days;
      offset++
    ) {

      if (
        dates.has(
          Storage.todayStr(-offset)
        )
      ) {
        completedDays++;
      }

    }


    return Math.round(
      (completedDays / days) * 100
    );
  }


  /* ==========================================================
     BADGE DEFINITIONS
     ========================================================== */

  const BADGES = [

    {
      id: 'first_checkin',
      name: 'First Step',
      icon: 'fa-shoe-prints',
      desc: 'Complete your first daily check-in.',
      test: stats =>
        stats.total >= 1
    },

    {
      id: 'five_checkins',
      name: 'Getting Started',
      icon: 'fa-seedling',
      desc: 'Complete 5 check-ins.',
      test: stats =>
        stats.total >= 5
    },

    {
      id: 'twenty_checkins',
      name: 'Committed',
      icon: 'fa-dumbbell',
      desc: 'Complete 20 check-ins.',
      test: stats =>
        stats.total >= 20
    },

    {
      id: 'fifty_checkins',
      name: 'Half Century',
      icon: 'fa-star',
      desc: 'Complete 50 check-ins.',
      test: stats =>
        stats.total >= 50
    },

    {
      id: 'streak_3',
      name: 'On a Roll',
      icon: 'fa-fire',
      desc: 'Reach a 3-day check-in streak.',
      test: stats =>
        stats.longest >= 3
    },

    {
      id: 'streak_7',
      name: 'Week Warrior',
      icon: 'fa-calendar-week',
      desc: 'Reach a 7-day check-in streak.',
      test: stats =>
        stats.longest >= 7
    },

    {
      id: 'streak_14',
      name: 'Fortnight Force',
      icon: 'fa-bolt',
      desc: 'Reach a 14-day check-in streak.',
      test: stats =>
        stats.longest >= 14
    },

    {
      id: 'streak_30',
      name: 'Habit Master',
      icon: 'fa-crown',
      desc: 'Reach a 30-day check-in streak.',
      test: stats =>
        stats.longest >= 30
    },

    {
      id: 'sleep_champ',
      name: 'Sleep Champion',
      icon: 'fa-bed',
      desc: 'Log 7+ hours of sleep on 5 different days.',
      test: stats =>
        stats.goodSleepDays >= 5
    },

    {
      id: 'zen_mode',
      name: 'Zen Mode',
      icon: 'fa-spa',
      desc: 'Log stress ≤ 3 on 5 different days.',
      test: stats =>
        stats.calmDays >= 5
    },

    {
      id: 'balanced_week',
      name: 'Balanced Week',
      icon: 'fa-scale-balanced',
      desc: 'Stay in the Healthy zone for 7 consecutive entries.',
      test: stats =>
        stats.healthyRun >= 7
    },

    {
      id: 'comeback',
      name: 'Comeback Kid',
      icon: 'fa-arrow-trend-down',
      desc: 'Drop from High Risk back to Healthy.',
      test: stats =>
        stats.comeback
    },

    {
      id: 'motivated',
      name: 'Fired Up',
      icon: 'fa-rocket',
      desc: 'Log motivation 8+ on 5 different days.',
      test: stats =>
        stats.motivatedDays >= 5
    },

    {
      id: 'journaler',
      name: 'Reflective Mind',
      icon: 'fa-pen-nib',
      desc: 'Write notes in 10 check-ins.',
      test: stats =>
        stats.notesDays >= 10
    }

  ];


  /* ==========================================================
     COMPUTE ACHIEVEMENT STATISTICS
     ========================================================== */

  function computeStats(entries) {

    if (!Array.isArray(entries)) {
      entries = [];
    }


    /*
      Chronological order:
      oldest → newest
    */

    const chronological = [
      ...entries
    ].sort(
      (a, b) =>
        a.date.localeCompare(b.date)
    );


    let healthyRun = 0;
    let bestHealthyRun = 0;

    let comeback = false;
    let previouslyHighRisk = false;


    chronological.forEach(entry => {

      /* ------------------------------------------------------
         Healthy streak
         ------------------------------------------------------ */

      if (entry.category === 'Healthy') {

        healthyRun++;

        bestHealthyRun =
          Math.max(
            bestHealthyRun,
            healthyRun
          );


        /*
          If a High Risk entry occurred previously and
          the user later returned to Healthy, it's a comeback.
        */

        if (previouslyHighRisk) {
          comeback = true;
        }

      }

      else {

        healthyRun = 0;

      }


      /* ------------------------------------------------------
         High Risk detection
         ------------------------------------------------------ */

      if (
        entry.category === 'High Risk'
      ) {

        previouslyHighRisk = true;

      }

    });


    return {

      total: entries.length,

      longest:
        longestStreak(entries),

      goodSleepDays:
        entries.filter(
          entry =>
            Number(entry.sleep) >= 7
        ).length,

      calmDays:
        entries.filter(
          entry =>
            Number(entry.stress) <= 3
        ).length,

      motivatedDays:
        entries.filter(
          entry =>
            Number(entry.motivation) >= 8
        ).length,

      notesDays:
        entries.filter(
          entry =>
            entry.notes &&
            String(entry.notes).trim().length > 0
        ).length,

      healthyRun:
        bestHealthyRun,

      comeback

    };
  }


  /* ==========================================================
     EVALUATE BADGES
     Checks which badges have been earned and stores them.
     ========================================================== */

  function evaluate(entries) {

    const earned =
      Storage.getAchievements() || {};


    const stats =
      computeStats(entries);


    const newlyEarned = [];


    BADGES.forEach(badge => {

      /*
        Only award a badge once.
      */

      if (
        !earned[badge.id] &&
        badge.test(stats)
      ) {

        earned[badge.id] = Date.now();

        newlyEarned.push(badge);

      }

    });


    /*
      Save only when something new was earned.
    */

    if (newlyEarned.length > 0) {

      Storage.saveAchievements(
        earned
      );

    }


    /*
      Return complete badge information
      for the Achievements page.
    */

    const badges =
      BADGES.map(badge => ({

        ...badge,

        earned:
          Boolean(
            earned[badge.id]
          ),

        earnedAt:
          earned[badge.id] || null

      }));


    return {

      badges,

      newlyEarned

    };
  }


  /* ==========================================================
     PUBLIC API
     ========================================================== */

  return {

    currentStreak,

    longestStreak,

    consistency,

    evaluate,

    BADGES

  };

})();
