/* ============================================================
   app.js — WellTrack UI controller
   ============================================================ */

(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const MOOD_EMOJI = {
    1: '😞',
    2: '🙁',
    3: '😐',
    4: '🙂',
    5: '😄'
  };

  const MOOD_LABEL = {
    1: 'Very Low',
    2: 'Low',
    3: 'Okay',
    4: 'Good',
    5: 'Great'
  };

  let charts = {};
  let analyticsRange = 7;


  /* ============================================================
     THEME
  ============================================================ */

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);

    const themeIcon = $('#theme-toggle i');

    if (themeIcon) {
      themeIcon.className =
        theme === 'dark'
          ? 'fa-solid fa-sun'
          : 'fa-solid fa-moon';
    }

    renderDashboard();
    renderAnalytics();
  }


  function chartColors() {
    const dark =
      document.documentElement.getAttribute('data-theme') === 'dark';

    return {
      text: dark ? '#98a1b8' : '#64708a',
      grid: dark
        ? 'rgba(255,255,255,0.07)'
        : 'rgba(28,35,51,0.07)',
      primary: dark ? '#7b88ff' : '#5b6cff',
      purple: '#9b6cff',
      success: dark ? '#34c98c' : '#1fa971',
      warning: dark ? '#f0ac3c' : '#e8960c',
      danger: dark ? '#f0697a' : '#e04f5f',
      surface2: dark ? '#262a3a' : '#eef1f8'
    };
  }


  /* ============================================================
     TOASTS
  ============================================================ */

  function toast(
    msg,
    type = 'info',
    icon = 'fa-circle-info'
  ) {
    const container = $('#toast-container');

    if (!container) return;

    const el = document.createElement('div');

    el.className = `toast ${type}`;

    el.innerHTML = `
      <i class="fa-solid ${icon}"></i>
      <span></span>
    `;

    el.querySelector('span').textContent = msg;

    container.appendChild(el);

    setTimeout(() => {
      el.classList.add('out');

      setTimeout(() => {
        el.remove();
      }, 450);
    }, 3800);
  }


  /* ============================================================
     NAVIGATION
  ============================================================ */

  function switchView(name) {
    $$('.tab').forEach((tab) => {
      tab.classList.toggle(
        'active',
        tab.dataset.view === name
      );
    });

    $$('.view').forEach((view) => {
      view.classList.toggle(
        'active',
        view.id === `view-${name}`
      );
    });

    if (name === 'dashboard') {
      renderDashboard();
    }

    if (name === 'analytics') {
      renderAnalytics();
    }

    if (name === 'history') {
      renderHistory();
    }

    if (name === 'achievements') {
      renderAchievements();
    }

    if (name === 'checkin') {
      prepareCheckinForm();
    }

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }


  /* ============================================================
     PROFILE
  ============================================================ */

  function getOrCreateProfile() {
    let profile = Storage.getProfile();

    /*
      Migration support:
      If an older WellTrack/MindTrack profile exists,
      preserve the useful information and remove dependence
      on the old course/studyGoal fields.
    */

    if (profile) {
      const migratedProfile = {
        name: profile.name || '',
        email: profile.email || '',
        year: profile.year || '2nd Year',
        createdAt: profile.createdAt || Date.now()
      };

      /*
        Save the migrated structure only if necessary.
      */
      if (
        profile.course !== undefined ||
        profile.studyGoal !== undefined ||
        profile.email === undefined
      ) {
        Storage.saveProfile(migratedProfile);
        profile = migratedProfile;
      }

      return profile;
    }

    /*
      No profile exists yet.

      We create an empty local profile so the app can still
      function without an onboarding screen.
    */

    profile = {
      name: '',
      email: '',
      year: '2nd Year',
      createdAt: Date.now()
    };

    Storage.saveProfile(profile);

    return profile;
  }


  function openProfile() {
    const profile = getOrCreateProfile();

    const nameInput = $('#pf-name');
    const emailInput = $('#pf-email');
    const yearInput = $('#pf-year');

    if (nameInput) {
      nameInput.value = profile.name || '';
    }

    if (emailInput) {
      emailInput.value = profile.email || '';
    }

    if (yearInput) {
      yearInput.value = profile.year || '2nd Year';
    }

    const overlay = $('#profile-overlay');

    if (overlay) {
      overlay.classList.remove('hidden');
      overlay.setAttribute('aria-hidden', 'false');

      setTimeout(() => {
        if (nameInput) {
          nameInput.focus();
        }
      }, 100);
    }
  }


  function closeProfile() {
    const overlay = $('#profile-overlay');

    if (!overlay) return;

    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
  }


  function bindProfile() {
    const profileButton = $('#profile-btn');
    const profileClose = $('#profile-close');
    const profileOverlay = $('#profile-overlay');
    const profileForm = $('#profile-form');
    const logoutButton = $('#logout-btn');

    /*
      Open profile
    */

    if (profileButton) {
      profileButton.addEventListener(
        'click',
        openProfile
      );
    }


    /*
      Close profile
    */

    if (profileClose) {
      profileClose.addEventListener(
        'click',
        closeProfile
      );
    }


    /*
      Close when clicking outside modal
    */

    if (profileOverlay) {
      profileOverlay.addEventListener('click', (event) => {
        if (event.target === profileOverlay) {
          closeProfile();
        }
      });
    }


    /*
      Save profile
    */

    if (profileForm) {
      profileForm.addEventListener(
        'submit',
        (event) => {
          event.preventDefault();

          const name =
            $('#pf-name')?.value.trim() || '';

          const email =
            $('#pf-email')?.value.trim() || '';

          const year =
            $('#pf-year')?.value || '2nd Year';

          if (!name) {
            toast(
              'Please enter your full name.',
              'warning',
              'fa-user'
            );
            return;
          }

          if (!email) {
            toast(
              'Please enter your email.',
              'warning',
              'fa-envelope'
            );
            return;
          }

          const oldProfile =
            Storage.getProfile() || {};

          const profile = {
            name,
            email,
            year,
            createdAt:
              oldProfile.createdAt || Date.now()
          };

          Storage.saveProfile(profile);

          closeProfile();

          toast(
            'Profile updated successfully.',
            'success',
            'fa-circle-check'
          );

          renderAll();
        }
      );
    }


    /*
      Logout

      Since WellTrack is currently a client-side LocalStorage
      application and has no real authentication backend,
      logout cannot be a real account logout.

      This action removes the local profile only while
      preserving check-in history.
    */

    if (logoutButton) {
      logoutButton.addEventListener(
        'click',
        () => {
          const confirmed = confirm(
            'Log out of WellTrack? Your check-in history will remain saved on this device.'
          );

          if (!confirmed) return;

          Storage.saveProfile({
            name: '',
            email: '',
            year: '2nd Year',
            createdAt: Date.now()
          });

          closeProfile();

          toast(
            'You have been logged out.',
            'success',
            'fa-right-from-bracket'
          );

          setTimeout(() => {
            location.reload();
          }, 700);
        }
      );
    }
  }


  /* ============================================================
     CHECK-IN
  ============================================================ */

  function prepareCheckinForm() {
    const dateLabel = $('#checkin-date-label');

    if (dateLabel) {
      dateLabel.textContent =
        new Date().toLocaleDateString(
          undefined,
          {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }
        );
    }

    const today = Storage.todayStr();
    const existing = Storage.getEntryByDate(today);

    const banner = $('#already-checked-banner');

    if (banner) {
      banner.classList.toggle(
        'hidden',
        !existing
      );
    }

    if (!existing) {
      return;
    }

    const radio = document.querySelector(
      `input[name="mood"][value="${existing.mood}"]`
    );

    if (radio) {
      radio.checked = true;
      highlightMood();
    }

    const stress = $('#in-stress');
    const stressOutput = $('#out-stress');

    if (stress) {
      stress.value = existing.stress;
    }

    if (stressOutput) {
      stressOutput.value = existing.stress;
    }


    const motivation = $('#in-motivation');
    const motivationOutput = $('#out-motivation');

    if (motivation) {
      motivation.value = existing.motivation;
    }

    if (motivationOutput) {
      motivationOutput.value =
        existing.motivation;
    }


    const sleep = $('#in-sleep');

    if (sleep) {
      sleep.value = existing.sleep;
    }


    const study = $('#in-study');

    if (study) {
      study.value = existing.study;
    }


    const notes = $('#in-notes');

    if (notes) {
      notes.value = existing.notes || '';
    }
  }


  function highlightMood() {
    $$('.mood-opt').forEach((option) => {
      const input =
        option.querySelector('input');

      option.classList.toggle(
        'selected',
        input ? input.checked : false
      );
    });
  }


  function bindCheckin() {
    const moodRow = $('#mood-row');

    if (moodRow) {
      moodRow.addEventListener(
        'change',
        highlightMood
      );
    }


    const stress = $('#in-stress');

    if (stress) {
      stress.addEventListener(
        'input',
        (event) => {
          const output = $('#out-stress');

          if (output) {
            output.value =
              event.target.value;
          }
        }
      );
    }


    const motivation =
      $('#in-motivation');

    if (motivation) {
      motivation.addEventListener(
        'input',
        (event) => {
          const output =
            $('#out-motivation');

          if (output) {
            output.value =
              event.target.value;
          }
        }
      );
    }


    const form = $('#checkin-form');

    if (!form) return;

    form.addEventListener(
      'submit',
      (event) => {
        event.preventDefault();

        const moodInput =
          document.querySelector(
            'input[name="mood"]:checked'
          );

        if (!moodInput) {
          toast(
            'Please select your mood.',
            'warning',
            'fa-face-meh'
          );
          return;
        }


        const entry = {
          date: Storage.todayStr(),

          mood: parseInt(
            moodInput.value,
            10
          ),

          stress: parseInt(
            $('#in-stress').value,
            10
          ),

          motivation: parseInt(
            $('#in-motivation').value,
            10
          ),

          sleep: parseFloat(
            $('#in-sleep').value
          ),

          study: parseFloat(
            $('#in-study').value
          ),

          notes:
            $('#in-notes').value.trim()
        };


        entry.score =
          Burnout.computeScore(entry);

        entry.category =
          Burnout.categorize(entry.score);

        Storage.upsertEntry(entry);


        /*
          Achievement check
        */

        const {
          newlyEarned
        } = Achievements.evaluate(
          Storage.getEntries()
        );

        newlyEarned.forEach((badge) => {
          toast(
            `Badge unlocked: ${badge.name}!`,
            'success',
            badge.icon
          );
        });


        showCheckinResult(entry);


        toast(
          'Check-in saved!',
          'success',
          'fa-circle-check'
        );


        if (entry.category === 'High Risk') {
          toast(
            'High burnout risk detected — see your recommendations.',
            'danger',
            'fa-triangle-exclamation'
          );
        }


        const banner =
          $('#already-checked-banner');

        if (banner) {
          banner.classList.remove('hidden');
        }


        renderDashboard();
      }
    );
  }


  function showCheckinResult(entry) {
    const box = $('#checkin-result');

    if (!box) return;

    const cls =
      Burnout.categoryClass(
        entry.category
      );

    box.classList.remove('hidden');

    box.innerHTML = `
      <h3>
        <i class="fa-solid fa-fire-flame-curved"></i>
        Today's Burnout Risk
      </h3>

      <div class="big-score">
        ${entry.score}
        <span
          class="muted"
          style="font-size:1rem;"
        >
          /100
        </span>
      </div>

      <span class="category-badge ${cls}">
        ${entry.category}
      </span>

      <p
        class="muted small"
        style="margin-top:12px;"
      >
        View your dashboard for personalized recommendations.
      </p>

      <button
        class="btn btn-primary"
        data-goto="dashboard"
        style="margin-top:12px;"
      >
        <i class="fa-solid fa-gauge-high"></i>
        Go to Dashboard
      </button>
    `;

    box.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }


  /* ============================================================
     DASHBOARD
  ============================================================ */

  function renderDashboard() {
    const profile =
      Storage.getProfile();

    const entries =
      Storage.getEntries();

    const latest =
      entries[0] || null;

    const today =
      Storage.todayStr();

    const todayEntry =
      entries.find(
        (entry) => entry.date === today
      ) || null;

    const shown =
      todayEntry || latest;


    /*
      Greeting
    */

    const greeting =
      $('#greeting-text');

    const greetingSub =
      $('#greeting-sub');

    if (profile && profile.name) {
      const hour =
        new Date().getHours();

      const part =
        hour < 12
          ? 'Good morning'
          : hour < 17
            ? 'Good afternoon'
            : 'Good evening';

      if (greeting) {
        greeting.textContent =
          `${part}, ${profile.name.split(' ')[0]}!`;
      }

      if (greetingSub) {
        const academicLevel =
          profile.year || 'Student';

        greetingSub.textContent =
          `${academicLevel} · ${
            todayEntry
              ? 'Checked in today ✓'
              : 'You haven’t checked in today'
          }`;
      }
    } else {
      if (greeting) {
        greeting.textContent =
          'Welcome to WellTrack!';
      }

      if (greetingSub) {
        greetingSub.textContent =
          'Complete your profile to personalize your experience.';
      }
    }


    /*
      Risk alert
    */

    const alertBox =
      $('#risk-alert');

    if (alertBox) {
      if (
        shown &&
        shown.category === 'High Risk'
      ) {
        alertBox.className =
          'risk-alert high';

        alertBox.innerHTML = `
          <i class="fa-solid fa-triangle-exclamation"></i>
          High burnout risk detected. Please review the recommendations below and consider easing your schedule.
        `;
      }

      else if (
        shown &&
        shown.category === 'Moderate Risk'
      ) {
        alertBox.className =
          'risk-alert moderate';

        alertBox.innerHTML = `
          <i class="fa-solid fa-circle-exclamation"></i>
          Moderate burnout risk — a few small changes can keep you in the healthy zone.
        `;
      }

      else {
        alertBox.className =
          'risk-alert hidden';
      }
    }


    /*
      Score + category
    */

    if (shown) {
      const score =
        $('#burnout-score-value');

      if (score) {
        score.textContent =
          shown.score;
      }

      const badge =
        $('#burnout-category');

      if (badge) {
        badge.textContent =
          shown.category;

        badge.className =
          'category-badge ' +
          Burnout.categoryClass(
            shown.category
          );
      }

      const explanation =
        $('#burnout-explain');

      if (explanation) {
        explanation.textContent =
          todayEntry
            ? 'Based on today’s check-in.'
            : `Based on your last check-in (${formatDate(shown.date)}).`;
      }
    }

    else {
      const score =
        $('#burnout-score-value');

      if (score) {
        score.textContent = '–';
      }

      const badge =
        $('#burnout-category');

      if (badge) {
        badge.textContent =
          'No data';

        badge.className =
          'category-badge';
      }

      const explanation =
        $('#burnout-explain');

      if (explanation) {
        explanation.textContent =
          'Complete a daily check-in to compute your burnout risk.';
      }
    }


    renderGauge(
      shown ? shown.score : 0
    );


    /*
      Today's snapshot
    */

    const snapMood =
      $('#snap-mood');

    if (snapMood) {
      snapMood.textContent =
        shown
          ? `${MOOD_EMOJI[shown.mood]} ${MOOD_LABEL[shown.mood]}`
          : '–';
    }


    const snapStress =
      $('#snap-stress');

    if (snapStress) {
      snapStress.textContent =
        shown
          ? `${shown.stress}/10`
          : '–';
    }


    const snapSleep =
      $('#snap-sleep');

    if (snapSleep) {
      snapSleep.textContent =
        shown
          ? `${shown.sleep} h`
          : '–';
    }


    const snapStudy =
      $('#snap-study');

    if (snapStudy) {
      snapStudy.textContent =
        shown
          ? `${shown.study} h`
          : '–';
    }


    const snapMotivation =
      $('#snap-motivation');

    if (snapMotivation) {
      snapMotivation.textContent =
        shown
          ? `${shown.motivation}/10`
          : '–';
    }


    const snapTotal =
      $('#snap-total');

    if (snapTotal) {
      snapTotal.textContent =
        entries.length;
    }


    /*
      Recommendations
    */

    const recommendations =
      Burnout.recommendations(
        shown,
        entries
      );

    const recommendationsList =
      $('#recommendations-list');

    if (recommendationsList) {
      recommendationsList.innerHTML =
        recommendations
          .map(
            (recommendation) => `
              <li class="rec-item ${recommendation.level}">
                <i class="fa-solid ${recommendation.icon}"></i>
                <span>
                  ${escapeHtml(
                    recommendation.text
                  )}
                </span>
              </li>
            `
          )
          .join('');
    }


    /*
      Progress
    */

    const currentStreak =
      Achievements.currentStreak(
        entries
      );

    const streakCount =
      $('#streak-count');

    if (streakCount) {
      streakCount.textContent =
        currentStreak;
    }


    const currentStreakDisplay =
      $('#p-current-streak');

    if (currentStreakDisplay) {
      currentStreakDisplay.textContent =
        currentStreak;
    }


    const longestStreak =
      $('#p-longest-streak');

    if (longestStreak) {
      longestStreak.textContent =
        Achievements.longestStreak(
          entries
        );
    }


    const totalCheckins =
      $('#p-total-checkins');

    if (totalCheckins) {
      totalCheckins.textContent =
        entries.length;
    }


    const consistency =
      $('#p-consistency');

    if (consistency) {
      consistency.textContent =
        Achievements.consistency(
          entries,
          30
        ) + '%';
    }


    /*
      Last 7 days
    */

    const dateSet =
      new Set(
        entries.map(
          (entry) => entry.date
        )
      );

    const dayNames = [
      'Su',
      'Mo',
      'Tu',
      'We',
      'Th',
      'Fr',
      'Sa'
    ];

    let dots = '';

    for (let i = 6; i >= 0; i--) {
      const dateStr =
        Storage.todayStr(-i);

      const date =
        new Date(
          `${dateStr}T00:00:00`
        );

      const done =
        dateSet.has(dateStr);

      dots += `
        <span
          class="wd ${done ? 'done' : ''} ${
            i === 0 ? 'today' : ''
          }"
          title="${dateStr}"
        >
          ${done ? '✓' : dayNames[date.getDay()]}
        </span>
      `;
    }

    const weekDots =
      $('#week-dots');

    if (weekDots) {
      weekDots.innerHTML =
        dots;
    }


    renderMiniTrend(entries);
  }


  /* ============================================================
     GAUGE
  ============================================================ */

  function renderGauge(score) {
    const canvas =
      $('#gauge-chart');

    if (!canvas) return;

    const c =
      chartColors();

    const color =
      score < 40
        ? c.success
        : score < 65
          ? c.warning
          : c.danger;

    destroyChart('gauge');

    charts.gauge =
      new Chart(canvas, {
        type: 'doughnut',

        data: {
          datasets: [
            {
              data: [
                score,
                100 - score
              ],

              backgroundColor: [
                color,
                c.surface2
              ],

              borderWidth: 0,

              borderRadius: 8
            }
          ]
        },

        options: {
          rotation: -90,
          circumference: 180,
          cutout: '72%',

          responsive: true,
          maintainAspectRatio: false,

          plugins: {
            legend: {
              display: false
            },

            tooltip: {
              enabled: false
            }
          },

          animation: {
            duration: 700
          }
        }
      });
  }


  /* ============================================================
     MINI TREND
  ============================================================ */

  function renderMiniTrend(entries) {
    const canvas =
      $('#mini-trend-chart');

    if (!canvas) return;

    const c =
      chartColors();

    const days =
      lastNDays(14);

    const map =
      Object.fromEntries(
        entries.map(
          (entry) => [
            entry.date,
            entry
          ]
        )
      );

    const data =
      days.map(
        (day) =>
          map[day]
            ? map[day].score
            : null
      );

    destroyChart('mini');

    charts.mini =
      new Chart(canvas, {
        type: 'line',

        data: {
          labels:
            days.map(shortLabel),

          datasets: [
            {
              label: 'Burnout score',

              data,

              borderColor:
                c.primary,

              backgroundColor:
                hexToRgba(
                  c.primary,
                  0.12
                ),

              fill: true,

              tension: 0.35,

              spanGaps: true,

              pointRadius: 3,

              pointBackgroundColor:
                c.primary
            }
          ]
        },

        options:
          baseLineOptions(
            c,
            0,
            100
          )
      });
  }


  /* ============================================================
     ANALYTICS
  ============================================================ */

  function renderAnalytics() {
    const entries =
      Storage.getEntries();

    const empty =
      entries.length === 0;

    const emptyBox =
      $('#analytics-empty');

    const content =
      $('#analytics-content');

    if (emptyBox) {
      emptyBox.classList.toggle(
        'hidden',
        !empty
      );
    }

    if (content) {
      content.classList.toggle(
        'hidden',
        empty
      );
    }

    if (empty) return;


    const c =
      chartColors();

    const days =
      lastNDays(
        analyticsRange
      );

    const map =
      Object.fromEntries(
        entries.map(
          (entry) => [
            entry.date,
            entry
          ]
        )
      );

    const labels =
      days.map(shortLabel);

    const val =
      (day, key) =>
        map[day]
          ? map[day][key]
          : null;


    /*
      Summary
    */

    const inRange =
      entries.filter(
        (entry) =>
          days.includes(
            entry.date
          )
      );

    const previousDays =
      lastNDays(
        analyticsRange,
        analyticsRange
      );

    const inPrevious =
      entries.filter(
        (entry) =>
          previousDays.includes(
            entry.date
          )
      );

    const avgNow =
      Burnout.averages(
        inRange
      );

    const avgPrevious =
      Burnout.averages(
        inPrevious
      );

    renderSummaryCards(
      avgNow,
      avgPrevious
    );


    /*
      Burnout chart
    */

    const burnoutCanvas =
      $('#chart-burnout');

    if (burnoutCanvas) {
      destroyChart('burnout');

      charts.burnout =
        new Chart(
          burnoutCanvas,
          {
            type: 'line',

            data: {
              labels,

              datasets: [
                {
                  label:
                    'Burnout score',

                  data:
                    days.map(
                      (day) =>
                        val(
                          day,
                          'score'
                        )
                    ),

                  borderColor:
                    c.danger,

                  backgroundColor:
                    hexToRgba(
                      c.danger,
                      0.1
                    ),

                  fill: true,

                  tension: 0.35,

                  spanGaps: true,

                  pointRadius: 3,

                  pointBackgroundColor:
                    days.map(
                      (day) => {
                        const score =
                          val(
                            day,
                            'score'
                          );

                        if (
                          score == null
                        ) {
                          return c.text;
                        }

                        return score < 40
                          ? c.success
                          : score < 65
                            ? c.warning
                            : c.danger;
                      }
                    )
                }
              ]
            },

            options:
              baseLineOptions(
                c,
                0,
                100
              )
          }
        );
    }


    /*
      Mood + Motivation
    */

    const moodCanvas =
      $('#chart-mood');

    if (moodCanvas) {
      destroyChart('mood');

      charts.mood =
        new Chart(
          moodCanvas,
          {
            type: 'line',

            data: {
              labels,

              datasets: [
                {
                  label:
                    'Mood (1–5)',

                  data:
                    days.map(
                      (day) =>
                        val(
                          day,
                          'mood'
                        )
                    ),

                  borderColor:
                    c.primary,

                  tension: 0.35,

                  spanGaps: true,

                  pointRadius: 3,

                  yAxisID: 'y'
                },

                {
                  label:
                    'Motivation (1–10)',

                  data:
                    days.map(
                      (day) =>
                        val(
                          day,
                          'motivation'
                        )
                    ),

                  borderColor:
                    c.purple,

                  tension: 0.35,

                  spanGaps: true,

                  pointRadius: 3,

                  yAxisID: 'y1'
                }
              ]
            },

            options: {
              ...baseLineOptions(
                c,
                0,
                5,
                true
              ),

              scales: {
                x: axisX(c),

                y: {
                  min: 0,
                  max: 5,

                  ticks: {
                    color: c.text
                  },

                  grid: {
                    color: c.grid
                  },

                  position: 'left'
                },

                y1: {
                  min: 0,
                  max: 10,

                  ticks: {
                    color: c.text
                  },

                  grid: {
                    display: false
                  },

                  position: 'right'
                }
              }
            }
          }
        );
    }


    /*
      Sleep vs Study
    */

    const sleepStudyCanvas =
      $('#chart-sleep-study');

    if (sleepStudyCanvas) {
      destroyChart('sleepStudy');

      charts.sleepStudy =
        new Chart(
          sleepStudyCanvas,
          {
            type: 'bar',

            data: {
              labels,

              datasets: [
                {
                  label:
                    'Sleep (h)',

                  data:
                    days.map(
                      (day) =>
                        val(
                          day,
                          'sleep'
                        )
                    ),

                  backgroundColor:
                    hexToRgba(
                      c.primary,
                      0.75
                    ),

                  borderRadius: 5
                },

                {
                  label:
                    'Study (h)',

                  data:
                    days.map(
                      (day) =>
                        val(
                          day,
                          'study'
                        )
                    ),

                  backgroundColor:
                    hexToRgba(
                      c.warning,
                      0.75
                    ),

                  borderRadius: 5
                }
              ]
            },

            options: {
              responsive: true,

              maintainAspectRatio:
                false,

              plugins: {
                legend: {
                  labels: {
                    color: c.text
                  }
                }
              },

              scales: {
                x: axisX(c),

                y: {
                  beginAtZero: true,

                  ticks: {
                    color: c.text
                  },

                  grid: {
                    color: c.grid
                  }
                }
              }
            }
          }
        );
    }


    /*
      Stress
    */

    const stressCanvas =
      $('#chart-stress');

    if (stressCanvas) {
      destroyChart('stress');

      charts.stress =
        new Chart(
          stressCanvas,
          {
            type: 'line',

            data: {
              labels,

              datasets: [
                {
                  label:
                    'Stress (1–10)',

                  data:
                    days.map(
                      (day) =>
                        val(
                          day,
                          'stress'
                        )
                    ),

                  borderColor:
                    c.warning,

                  backgroundColor:
                    hexToRgba(
                      c.warning,
                      0.12
                    ),

                  fill: true,

                  tension: 0.35,

                  spanGaps: true,

                  pointRadius: 3
                }
              ]
            },

            options:
              baseLineOptions(
                c,
                0,
                10
              )
          }
        );
    }


    renderPeriodTables(
      entries
    );

    renderBehaviorChanges(
      avgNow,
      avgPrevious
    );
  }


  function renderSummaryCards(
    now,
    previous
  ) {
    const metrics = [
      {
        key: 'score',
        label: 'Avg Burnout',
        unit: '',
        lowerIsBetter: true
      },

      {
        key: 'stress',
        label: 'Avg Stress',
        unit: '/10',
        lowerIsBetter: true
      },

      {
        key: 'sleep',
        label: 'Avg Sleep',
        unit: ' h',
        lowerIsBetter: false
      },

      {
        key: 'study',
        label: 'Avg Study',
        unit: ' h',
        lowerIsBetter: null
      },

      {
        key: 'mood',
        label: 'Avg Mood',
        unit: '/5',
        lowerIsBetter: false
      },

      {
        key: 'motivation',
        label: 'Avg Motivation',
        unit: '/10',
        lowerIsBetter: false
      }
    ];


    const container =
      $('#summary-cards');

    if (!container) return;


    container.innerHTML =
      metrics
        .map((metric) => {
          const value =
            now
              ? now[metric.key]
              : null;

          let deltaHtml =
            '<span class="sc-delta flat">no previous data</span>';

          if (now && previous) {
            const diff =
              +(
                now[metric.key] -
                previous[metric.key]
              ).toFixed(1);

            if (diff === 0) {
              deltaHtml =
                '<span class="sc-delta flat">— unchanged</span>';
            }

            else {
              const arrow =
                diff > 0
                  ? '▲'
                  : '▼';

              let cls =
                diff > 0
                  ? 'up'
                  : 'down';

              if (
                metric.lowerIsBetter === true
              ) {
                cls +=
                  diff > 0
                    ? ''
                    : ' good';
              }

              else if (
                metric.lowerIsBetter === false
              ) {
                cls =
                  diff > 0
                    ? 'up good'
                    : 'down bad';
              }

              else {
                cls =
                  'flat';
              }

              deltaHtml = `
                <span class="sc-delta ${cls}">
                  ${arrow}
                  ${Math.abs(diff)}
                  vs prev.
                </span>
              `;
            }
          }

          return `
            <div class="sum-card">

              <div class="sc-label">
                ${metric.label}
              </div>

              <div class="sc-value">
                ${
                  value != null
                    ? value + metric.unit
                    : '–'
                }
              </div>

              ${deltaHtml}

            </div>
          `;
        })
        .join('');
  }


  function renderPeriodTables(entries) {
    const build = (
      currentEntries,
      previousEntries,
      currentLabel,
      previousLabel
    ) => {
      const current =
        Burnout.averages(
          currentEntries
        );

      const previous =
        Burnout.averages(
          previousEntries
        );

      const rows = [
        [
          'Check-ins',
          current
            ? current.n
            : 0,
          previous
            ? previous.n
            : 0,
          false
        ],

        [
          'Avg burnout',
          current
            ? current.score
            : '–',
          previous
            ? previous.score
            : '–',
          true
        ],

        [
          'Avg stress',
          current
            ? current.stress
            : '–',
          previous
            ? previous.stress
            : '–',
          true
        ],

        [
          'Avg sleep (h)',
          current
            ? current.sleep
            : '–',
          previous
            ? previous.sleep
            : '–',
          false
        ],

        [
          'Avg study (h)',
          current
            ? current.study
            : '–',
          previous
            ? previous.study
            : '–',
          null
        ],

        [
          'Avg motivation',
          current
            ? current.motivation
            : '–',
          previous
            ? previous.motivation
            : '–',
          false
        ]
      ];


      let html = `
        <tr>
          <th>Metric</th>
          <th>${currentLabel}</th>
          <th>${previousLabel}</th>
        </tr>
      `;


      rows.forEach(
        ([
          label,
          currentValue,
          previousValue,
          lowerBetter
        ]) => {
          let cls = '';

          if (
            typeof currentValue === 'number' &&
            typeof previousValue === 'number' &&
            lowerBetter !== null &&
            label !== 'Check-ins'
          ) {
            if (
              currentValue <
              previousValue
            ) {
              cls =
                lowerBetter
                  ? 'delta-good'
                  : 'delta-bad';
            }

            else if (
              currentValue >
              previousValue
            ) {
              cls =
                lowerBetter
                  ? 'delta-bad'
                  : 'delta-good';
            }
          }

          html += `
            <tr>
              <td>${label}</td>
              <td class="${cls}">
                ${currentValue}
              </td>
              <td>
                ${previousValue}
              </td>
            </tr>
          `;
        }
      );

      return html;
    };


    const weekCurrent =
      entriesBetween(
        entries,
        6,
        0
      );

    const weekPrevious =
      entriesBetween(
        entries,
        13,
        7
      );


    const weeklyTable =
      $('#weekly-table');

    if (weeklyTable) {
      weeklyTable.innerHTML =
        build(
          weekCurrent,
          weekPrevious,
          'This week',
          'Last week'
        );
    }


    const monthCurrent =
      entriesBetween(
        entries,
        29,
        0
      );

    const monthPrevious =
      entriesBetween(
        entries,
        59,
        30
      );


    const monthlyTable =
      $('#monthly-table');

    if (monthlyTable) {
      monthlyTable.innerHTML =
        build(
          monthCurrent,
          monthPrevious,
          'This month',
          'Last month'
        );
    }
  }


  function renderBehaviorChanges(
    now,
    previous
  ) {
    const box =
      $('#behavior-changes');

    if (!box) return;


    if (!now || !previous) {
      box.innerHTML = `
        <div class="bc-item neutral">
          <i class="fa-solid fa-circle-info"></i>
          Keep checking in — behavior-change insights appear once you have data across two periods.
        </div>
      `;

      return;
    }


    const items = [];


    const difference =
      (key) =>
        +(
          now[key] -
          previous[key]
        ).toFixed(1);


    if (difference('score') >= 8) {
      items.push({
        cls: 'bad',
        icon: 'fa-arrow-trend-up',
        text:
          `Burnout risk rose by ${difference('score')} points versus the previous period — an early warning sign.`
      });
    }


    if (difference('score') <= -8) {
      items.push({
        cls: 'good',
        icon: 'fa-arrow-trend-down',
        text:
          `Burnout risk dropped by ${Math.abs(difference('score'))} points — your habits are improving.`
      });
    }


    if (difference('sleep') <= -0.8) {
      items.push({
        cls: 'bad',
        icon: 'fa-bed',
        text:
          `You are sleeping ${Math.abs(difference('sleep'))}h less on average than before.`
      });
    }


    if (difference('sleep') >= 0.8) {
      items.push({
        cls: 'good',
        icon: 'fa-bed',
        text:
          `Sleep improved by ${difference('sleep')}h on average. Great recovery habit!`
      });
    }


    if (difference('stress') >= 1) {
      items.push({
        cls: 'bad',
        icon: 'fa-bolt',
        text:
          `Average stress increased by ${difference('stress')} points.`
      });
    }


    if (difference('stress') <= -1) {
      items.push({
        cls: 'good',
        icon: 'fa-spa',
        text:
          `Average stress decreased by ${Math.abs(difference('stress'))} points.`
      });
    }


    if (difference('study') >= 1.5) {
      items.push({
        cls: 'neutral',
        icon: 'fa-book-open',
        text:
          `Study time is up ${difference('study')}h/day — make sure rest keeps pace.`
      });
    }


    if (difference('motivation') <= -1.5) {
      items.push({
        cls: 'bad',
        icon: 'fa-battery-quarter',
        text:
          `Motivation fell by ${Math.abs(difference('motivation'))} points — a common precursor of burnout.`
      });
    }


    if (difference('motivation') >= 1.5) {
      items.push({
        cls: 'good',
        icon: 'fa-rocket',
        text:
          `Motivation is up ${difference('motivation')} points!`
      });
    }


    if (!items.length) {
      items.push({
        cls: 'neutral',
        icon: 'fa-equals',
        text:
          'Your behavior has been stable compared with the previous period.'
      });
    }


    box.innerHTML =
      items
        .map(
          (item) => `
            <div class="bc-item ${item.cls}">
              <i class="fa-solid ${item.icon}"></i>
              ${escapeHtml(item.text)}
            </div>
          `
        )
        .join('');
  }


  function bindAnalytics() {
    $$('.range-btn').forEach(
      (button) => {
        button.addEventListener(
          'click',
          () => {
            $$('.range-btn').forEach(
              (btn) =>
                btn.classList.remove(
                  'active'
                )
            );

            button.classList.add(
              'active'
            );

            analyticsRange =
              parseInt(
                button.dataset.range,
                10
              );

            renderAnalytics();
          }
        );
      }
    );
  }


  /* ============================================================
     HISTORY
  ============================================================ */

  function renderHistory() {
    const searchInput =
      $('#history-search');

    const riskFilter =
      $('#history-filter-risk');

    const moodFilter =
      $('#history-filter-mood');

    const query =
      searchInput
        ? searchInput.value
            .trim()
            .toLowerCase()
        : '';

    const risk =
      riskFilter
        ? riskFilter.value
        : '';

    const mood =
      moodFilter
        ? moodFilter.value
        : '';


    let list =
      Storage.getEntries();


    if (query) {
      list =
        list.filter(
          (entry) =>
            (entry.notes || '')
              .toLowerCase()
              .includes(query) ||

            entry.date.includes(
              query
            ) ||

            formatDate(entry.date)
              .toLowerCase()
              .includes(query)
        );
    }


    if (risk) {
      list =
        list.filter(
          (entry) =>
            entry.category === risk
        );
    }


    if (mood) {
      list =
        list.filter(
          (entry) =>
            String(entry.mood) ===
            mood
        );
    }


    const empty =
      $('#history-empty');

    if (empty) {
      empty.classList.toggle(
        'hidden',
        list.length > 0
      );
    }


    const historyList =
      $('#history-list');

    if (!historyList) return;


    historyList.innerHTML =
      list
        .map((entry) => {
          const date =
            new Date(
              `${entry.date}T00:00:00`
            );

          const riskClass =
            entry.category === 'Healthy'
              ? 'risk-healthy'
              : entry.category === 'Moderate Risk'
                ? 'risk-moderate'
                : 'risk-high';


          return `
            <div
              class="h-entry"
              data-id="${entry.id}"
            >

              <div class="h-date">

                <div class="hd-day">
                  ${date.getDate()}
                </div>

                <div class="hd-mon">
                  ${date.toLocaleDateString(
                    undefined,
                    {
                      month: 'short'
                    }
                  )}
                  ${date.getFullYear()}
                </div>

              </div>


              <div class="h-body">

                <div class="h-meta">

                  <span
                    class="h-chip ${riskClass}"
                  >
                    ${entry.category} · ${entry.score}
                  </span>

                  <span class="h-chip">
                    ${MOOD_EMOJI[entry.mood]}
                    ${MOOD_LABEL[entry.mood]}
                  </span>

                  <span class="h-chip">
                    <i class="fa-solid fa-bolt"></i>
                    Stress ${entry.stress}/10
                  </span>

                  <span class="h-chip">
                    <i class="fa-solid fa-bed"></i>
                    ${entry.sleep}h
                  </span>

                  <span class="h-chip">
                    <i class="fa-solid fa-book-open"></i>
                    ${entry.study}h
                  </span>

                  <span class="h-chip">
                    <i class="fa-solid fa-fire"></i>
                    Motiv. ${entry.motivation}/10
                  </span>

                </div>


                ${
                  entry.notes
                    ? `
                      <p class="h-notes">
                        "${escapeHtml(
                          entry.notes
                        )}"
                      </p>
                    `
                    : ''
                }

              </div>


              <button
                class="h-del"
                title="Delete this record"
                aria-label="Delete record"
              >
                <i class="fa-solid fa-trash"></i>
              </button>

            </div>
          `;
        })
        .join('');
  }


  function bindHistory() {
    const search =
      $('#history-search');

    if (search) {
      search.addEventListener(
        'input',
        renderHistory
      );
    }


    const risk =
      $('#history-filter-risk');

    if (risk) {
      risk.addEventListener(
        'change',
        renderHistory
      );
    }


    const mood =
      $('#history-filter-mood');

    if (mood) {
      mood.addEventListener(
        'change',
        renderHistory
      );
    }


    const historyList =
      $('#history-list');

    if (historyList) {
      historyList.addEventListener(
        'click',
        (event) => {
          const button =
            event.target.closest(
              '.h-del'
            );

          if (!button) return;

          const entry =
            button.closest(
              '.h-entry'
            );

          if (!entry) return;

          const id =
            entry.dataset.id;


          if (
            confirm(
              'Delete this check-in record permanently?'
            )
          ) {
            Storage.deleteEntry(id);

            renderHistory();
            renderDashboard();

            toast(
              'Record deleted.',
              'warning',
              'fa-trash'
            );
          }
        }
      );
    }


    const exportJson =
      $('#export-json');

    if (exportJson) {
      exportJson.addEventListener(
        'click',
        () => exportData('json')
      );
    }


    const exportCsv =
      $('#export-csv');

    if (exportCsv) {
      exportCsv.addEventListener(
        'click',
        () => exportData('csv')
      );
    }
  }


  /* ============================================================
     EXPORT
  ============================================================ */

  function exportData(format) {
    const entries =
      Storage.getEntries();

    if (!entries.length) {
      toast(
        'No records to export yet.',
        'warning',
        'fa-circle-exclamation'
      );

      return;
    }


    const profile =
      Storage.getProfile();

    let blob;
    let filename;


    if (format === 'json') {
      const payload = {
        exportedAt:
          new Date().toISOString(),

        profile,

        entries
      };

      blob =
        new Blob(
          [
            JSON.stringify(
              payload,
              null,
              2
            )
          ],
          {
            type:
              'application/json'
          }
        );

      filename =
        `welltrack-export-${Storage.todayStr()}.json`;
    }


    else {
      const headers = [
        'date',
        'mood',
        'mood_label',
        'stress',
        'sleep_hours',
        'study_hours',
        'motivation',
        'burnout_score',
        'category',
        'notes'
      ];


      const csvEscape =
        (value) => {
          const text =
            String(
              value == null
                ? ''
                : value
            );

          return /[",\n]/.test(
            text
          )
            ? `"${text.replace(
                /"/g,
                '""'
              )}"`
            : text;
        };


      const rows =
        entries.map(
          (entry) =>
            [
              entry.date,
              entry.mood,
              MOOD_LABEL[
                entry.mood
              ],
              entry.stress,
              entry.sleep,
              entry.study,
              entry.motivation,
              entry.score,
              entry.category,
              entry.notes || ''
            ]
              .map(csvEscape)
              .join(',')
        );


      blob =
        new Blob(
          [
            headers.join(',') +
            '\n' +
            rows.join('\n')
          ],
          {
            type: 'text/csv'
          }
        );

      filename =
        `welltrack-export-${Storage.todayStr()}.csv`;
    }


    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement('a');

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);


    toast(
      `Exported ${entries.length} records as ${format.toUpperCase()}.`,
      'success',
      'fa-download'
    );
  }


  /* ============================================================
     ACHIEVEMENTS
  ============================================================ */

  function renderAchievements() {
    const entries =
      Storage.getEntries();

    const result =
      Achievements.evaluate(
        entries
      );

    const badges =
      result.badges || [];

    const earnedCount =
      badges.filter(
        (badge) => badge.earned
      ).length;


    const progressFill =
      $('#ach-progress-fill');

    if (progressFill) {
      progressFill.style.width =
        badges.length
          ? Math.round(
              (earnedCount /
                badges.length) *
                100
            ) + '%'
          : '0%';
    }


    const progressText =
      $('#ach-progress-text');

    if (progressText) {
      progressText.textContent =
        `${earnedCount} of ${badges.length} badges earned`;
    }


    const grid =
      $('#badges-grid');

    if (!grid) return;


    grid.innerHTML =
      badges
        .map(
          (badge) => `
            <div
              class="badge-card ${
                badge.earned
                  ? ''
                  : 'locked'
              }"
            >

              <div class="b-icon">
                <i
                  class="fa-solid ${badge.icon}"
                ></i>
              </div>

              <h4>
                ${escapeHtml(
                  badge.name
                )}
              </h4>

              <p>
                ${escapeHtml(
                  badge.desc
                )}
              </p>

              ${
                badge.earned
                  ? `
                    <span class="b-earned">
                      <i class="fa-solid fa-check"></i>
                      Earned
                      ${new Date(
                        badge.earnedAt
                      ).toLocaleDateString()}
                    </span>
                  `
                  : `
                    <span
                      class="b-earned"
                      style="color:var(--text-muted);"
                    >
                      <i class="fa-solid fa-lock"></i>
                      Locked
                    </span>
                  `
              }

            </div>
          `
        )
        .join('');
  }


  /* ============================================================
     HELPERS
  ============================================================ */

  function destroyChart(key) {
    if (charts[key]) {
      charts[key].destroy();
      charts[key] = null;
    }
  }


  function baseLineOptions(
    c,
    min,
    max,
    hideLegend = false
  ) {
    return {
      responsive: true,

      maintainAspectRatio:
        false,

      plugins: {
        legend:
          hideLegend
            ? {
                display: false
              }
            : {
                labels: {
                  color: c.text
                }
              }
      },

      scales: {
        x: axisX(c),

        y: {
          min,
          max,

          ticks: {
            color: c.text
          },

          grid: {
            color: c.grid
          }
        }
      }
    };
  }


  function axisX(c) {
    return {
      ticks: {
        color: c.text,
        maxTicksLimit: 10,
        maxRotation: 0
      },

      grid: {
        display: false
      }
    };
  }


  function lastNDays(
    numberOfDays,
    offset = 0
  ) {
    const output = [];

    for (
      let i =
        numberOfDays -
        1 +
        offset;

      i >= offset;

      i--
    ) {
      output.push(
        Storage.todayStr(-i)
      );
    }

    return output;
  }


  function entriesBetween(
    entries,
    fromDaysAgo,
    toDaysAgo
  ) {
    const from =
      Storage.todayStr(
        -fromDaysAgo
      );

    const to =
      Storage.todayStr(
        -toDaysAgo
      );

    return entries.filter(
      (entry) =>
        entry.date >= from &&
        entry.date <= to
    );
  }


  function shortLabel(dateStr) {
    const date =
      new Date(
        `${dateStr}T00:00:00`
      );

    return date.toLocaleDateString(
      undefined,
      {
        month: 'short',
        day: 'numeric'
      }
    );
  }


  function formatDate(dateStr) {
    return new Date(
      `${dateStr}T00:00:00`
    ).toLocaleDateString(
      undefined,
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }
    );
  }


  function escapeHtml(value) {
    return String(value).replace(
      /[&<>"']/g,
      (match) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[match])
    );
  }


  function hexToRgba(
    hex,
    alpha
  ) {
    const cleanHex =
      hex.replace(
        '#',
        ''
      );

    const r =
      parseInt(
        cleanHex.substring(0, 2),
        16
      );

    const g =
      parseInt(
        cleanHex.substring(2, 4),
        16
      );

    const b =
      parseInt(
        cleanHex.substring(4, 6),
        16
      );

    return `rgba(${r},${g},${b},${alpha})`;
  }


  /* ============================================================
     RENDER EVERYTHING
  ============================================================ */

  function renderAll() {
    renderDashboard();
    renderAnalytics();
    renderHistory();
    renderAchievements();
    prepareCheckinForm();
  }


  /* ============================================================
     INITIALIZATION
  ============================================================ */

  document.addEventListener(
    'DOMContentLoaded',
    () => {

      /*
        Theme
      */

      const theme =
        Storage.getTheme();

      document.documentElement
        .setAttribute(
          'data-theme',
          theme
        );

      const themeIcon =
        $('#theme-toggle i');

      if (themeIcon) {
        themeIcon.className =
          theme === 'dark'
            ? 'fa-solid fa-sun'
            : 'fa-solid fa-moon';
      }


      const themeButton =
        $('#theme-toggle');

      if (themeButton) {
        themeButton.addEventListener(
          'click',
          () => {
            const current =
              document.documentElement
                .getAttribute(
                  'data-theme'
                );

            const next =
              current === 'dark'
                ? 'light'
                : 'dark';

            Storage.saveTheme(next);

            applyTheme(next);
          }
        );
      }


      /*
        Navigation
      */

      $$('.tab').forEach(
        (tab) => {
          tab.addEventListener(
            'click',
            () =>
              switchView(
                tab.dataset.view
              )
          );
        }
      );


      /*
        Buttons using data-goto
      */

      document.body.addEventListener(
        'click',
        (event) => {
          const button =
            event.target.closest(
              '[data-goto]'
            );

          if (!button) return;

          switchView(
            button.dataset.goto
          );
        }
      );


      /*
        Bind functionality
      */

      bindProfile();
      bindCheckin();
      bindAnalytics();
      bindHistory();


      /*
        Create/migrate profile
      */

      getOrCreateProfile();


      /*
        Initial render
      */

      renderAll();
    }
  );

})();
