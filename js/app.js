/* ============================================================
   WellTrack — app.js
   Black + Purple Luxury UI Controller
   HTML-compatible version
   ============================================================ */

(() => {
  'use strict';

  /* ==========================================================
     DOM HELPERS
     ========================================================== */

  const $ = (selector) => document.querySelector(selector);

  const $$ = (selector) =>
    Array.from(document.querySelectorAll(selector));


  /* ==========================================================
     CONSTANTS
     ========================================================== */

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


  /* ==========================================================
     APP STATE
     ========================================================== */

  let charts = {};

  let analyticsRange = 7;


  /* ==========================================================
     WELLTRACK THEME
     ========================================================== */

  function applyWellTrackTheme() {

    document.documentElement.setAttribute(
      'data-theme',
      'dark'
    );

    const themeIcon = $('#theme-toggle i');

    if (themeIcon) {
      themeIcon.className = 'fa-solid fa-moon';
    }

    renderDashboard();
    renderAnalytics();
  }


  /* ==========================================================
     CHART COLORS
     ========================================================== */

  function chartColors() {

    return {
      primary: '#9b5cff',
      purple: '#c084fc',
      purpleDark: '#6d28d9',
      lavender: '#d8b4fe',
      success: '#a78bfa',
      warning: '#c084fc',
      danger: '#f472b6',

      text: '#aaa3b8',
      textBright: '#f5f3f7',

      grid: 'rgba(168, 85, 247, 0.10)',

      surface: '#111116',
      surface2: '#1a1720',
      surface3: '#241d2d',

      border: 'rgba(168, 85, 247, 0.20)'
    };
  }


  /* ==========================================================
     TOASTS
     ========================================================== */

  function toast(
    message,
    type = 'info',
    icon = 'fa-circle-info'
  ) {

    const container = $('#toast-container');

    if (!container) return;

    const element = document.createElement('div');

    element.className = `toast ${type}`;

    element.innerHTML = `
      <i class="fa-solid ${icon}"></i>
      <span></span>
    `;

    const textElement = element.querySelector('span');

    if (textElement) {
      textElement.textContent = message;
    }

    container.appendChild(element);

    setTimeout(() => {

      element.classList.add('out');

      setTimeout(() => {
        element.remove();
      }, 450);

    }, 3800);
  }


  /* ==========================================================
     NAVIGATION
     ========================================================== */

  function switchView(name) {

    $$('.tab').forEach(tab => {

      tab.classList.toggle(
        'active',
        tab.dataset.view === name
      );

    });

    $$('.view').forEach(view => {

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


  /* ==========================================================
     PROFILE / ONBOARDING
     
     IMPORTANT:
     HTML contains:
       ob-name
       ob-email
       ob-course
       ob-year

     There is NO:
       ob-goal

     Therefore we do NOT access ob-goal.
     ========================================================== */

  function checkProfile() {

    const profile = Storage.getProfile();

    const overlay = $('#onboarding-overlay');

    if (!overlay) {
      return profile;
    }

    if (!profile) {
      overlay.classList.remove('hidden');
      overlay.setAttribute('aria-hidden', 'false');
    } else {
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
    }

    return profile;
  }


  function bindProfile() {

    /* ========================================================
       ONBOARDING FORM
       ======================================================== */

    const onboardingForm = $('#onboarding-form');

    if (onboardingForm) {

      onboardingForm.addEventListener(
        'submit',
        event => {

          event.preventDefault();


          const nameInput = $('#ob-name');
          const emailInput = $('#ob-email');
          const courseInput = $('#ob-course');
          const yearInput = $('#ob-year');


          /* Safety check */
          if (
            !nameInput ||
            !emailInput ||
            !courseInput ||
            !yearInput
          ) {

            console.error(
              'WellTrack: onboarding HTML fields are missing.'
            );

            toast(
              'Profile form is missing required fields.',
              'danger',
              'fa-triangle-exclamation'
            );

            return;
          }


          const profile = {

            name:
              nameInput.value.trim(),

            email:
              emailInput.value.trim(),

            course:
              courseInput.value.trim(),

            year:
              yearInput.value,

            createdAt:
              Date.now()
          };


          /* Basic validation */

          if (!profile.name) {

            toast(
              'Please enter your name.',
              'warning',
              'fa-user'
            );

            nameInput.focus();

            return;
          }


          if (!profile.email) {

            toast(
              'Please enter your email address.',
              'warning',
              'fa-envelope'
            );

            emailInput.focus();

            return;
          }


          if (!profile.course) {

            toast(
              'Please enter your course or program.',
              'warning',
              'fa-graduation-cap'
            );

            courseInput.focus();

            return;
          }


          if (!profile.year) {

            toast(
              'Please select your academic year.',
              'warning',
              'fa-school'
            );

            yearInput.focus();

            return;
          }


          Storage.saveProfile(profile);


          $('#onboarding-overlay')
            ?.classList.add('hidden');

          $('#onboarding-overlay')
            ?.setAttribute('aria-hidden', 'true');


          toast(
            `Welcome to WellTrack, ${profile.name}!`,
            'success',
            'fa-circle-check'
          );


          renderAll();
        }
      );
    }


    /* ========================================================
       PROFILE BUTTON
       ======================================================== */

    const profileButton = $('#profile-btn');

    if (profileButton) {

      profileButton.addEventListener(
        'click',
        () => {

          const profile = Storage.getProfile();

          if (!profile) return;


          const nameInput = $('#pf-name');
          const emailInput = $('#pf-email');
          const courseInput = $('#pf-course');
          const yearInput = $('#pf-year');


          if (nameInput) {
            nameInput.value =
              profile.name || '';
          }


          if (emailInput) {
            emailInput.value =
              profile.email || '';
          }


          if (courseInput) {
            courseInput.value =
              profile.course || '';
          }


          if (yearInput) {
            yearInput.value =
              profile.year || '';
          }


          const overlay = $('#profile-overlay');

          if (overlay) {

            overlay.classList.remove('hidden');

            overlay.setAttribute(
              'aria-hidden',
              'false'
            );
          }
        }
      );
    }


    /* ========================================================
       CLOSE PROFILE
       ======================================================== */

    const profileClose = $('#profile-close');

    if (profileClose) {

      profileClose.addEventListener(
        'click',
        () => {

          const overlay = $('#profile-overlay');

          if (!overlay) return;

          overlay.classList.add('hidden');

          overlay.setAttribute(
            'aria-hidden',
            'true'
          );
        }
      );
    }


    /* ========================================================
       CLOSE PROFILE WHEN CLICKING OUTSIDE
       ======================================================== */

    const profileOverlay = $('#profile-overlay');

    if (profileOverlay) {

      profileOverlay.addEventListener(
        'click',
        event => {

          if (event.target === profileOverlay) {

            profileOverlay.classList.add('hidden');

            profileOverlay.setAttribute(
              'aria-hidden',
              'true'
            );
          }
        }
      );
    }


    /* ========================================================
       UPDATE PROFILE
       ======================================================== */

    const profileForm = $('#profile-form');

    if (profileForm) {

      profileForm.addEventListener(
        'submit',
        event => {

          event.preventDefault();


          const profile =
            Storage.getProfile() || {};


          const nameInput = $('#pf-name');
          const emailInput = $('#pf-email');
          const courseInput = $('#pf-course');
          const yearInput = $('#pf-year');


          if (
            !nameInput ||
            !emailInput ||
            !courseInput ||
            !yearInput
          ) {

            console.error(
              'WellTrack: profile HTML fields are missing.'
            );

            toast(
              'Profile form is missing required fields.',
              'danger',
              'fa-triangle-exclamation'
            );

            return;
          }


          profile.name =
            nameInput.value.trim();


          profile.email =
            emailInput.value.trim();


          profile.course =
            courseInput.value.trim();


          profile.year =
            yearInput.value;


          if (!profile.name) {

            toast(
              'Name cannot be empty.',
              'warning',
              'fa-user'
            );

            nameInput.focus();

            return;
          }


          if (!profile.email) {

            toast(
              'Email cannot be empty.',
              'warning',
              'fa-envelope'
            );

            emailInput.focus();

            return;
          }


          if (!profile.course) {

            toast(
              'Course cannot be empty.',
              'warning',
              'fa-graduation-cap'
            );

            courseInput.focus();

            return;
          }


          if (!profile.year) {

            toast(
              'Please select your academic year.',
              'warning',
              'fa-school'
            );

            yearInput.focus();

            return;
          }


          Storage.saveProfile(profile);


          const overlay = $('#profile-overlay');

          if (overlay) {

            overlay.classList.add('hidden');

            overlay.setAttribute(
              'aria-hidden',
              'true'
            );
          }


          toast(
            'Profile updated successfully.',
            'success',
            'fa-circle-check'
          );


          renderDashboard();
        }
      );
    }


    /* ========================================================
       RESET DATA
       ======================================================== */

    const resetButton = $('#reset-data-btn');

    if (resetButton) {

      resetButton.addEventListener(
        'click',
        () => {

          const confirmed =
            confirm(
              'This will permanently delete all WellTrack data. Continue?'
            );


          if (!confirmed) return;


          Storage.resetAll();

          location.reload();
        }
      );
    }
  }


  /* ==========================================================
     CHECK-IN
     ========================================================== */

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

    const existing =
      Storage.getEntryByDate(today);


    const banner = $('#already-checked-banner');

    if (banner) {

      banner.classList.toggle(
        'hidden',
        !existing
      );
    }


    if (!existing) {

      /*
       * No existing check-in.
       * Leave the default HTML values alone.
       */

      highlightMood();

      return;
    }


    /* ========================================================
       MOOD
       ======================================================== */

    const moodRadio =
      document.querySelector(
        `input[name="mood"][value="${existing.mood}"]`
      );


    if (moodRadio) {

      moodRadio.checked = true;

      highlightMood();
    }


    /* ========================================================
       STRESS
       ======================================================== */

    const stress = $('#in-stress');

    const stressOutput = $('#out-stress');


    if (stress) {

      stress.value =
        existing.stress;
    }


    if (stressOutput) {

      stressOutput.textContent =
        existing.stress;
    }


    /* ========================================================
       MOTIVATION
       ======================================================== */

    const motivation =
      $('#in-motivation');

    const motivationOutput =
      $('#out-motivation');


    if (motivation) {

      motivation.value =
        existing.motivation;
    }


    if (motivationOutput) {

      motivationOutput.textContent =
        existing.motivation;
    }


    /* ========================================================
       SLEEP
       ======================================================== */

    const sleep = $('#in-sleep');

    if (sleep) {

      sleep.value =
        existing.sleep;
    }


    /* ========================================================
       STUDY
       ======================================================== */

    const study = $('#in-study');

    if (study) {

      study.value =
        existing.study;
    }


    /* ========================================================
       NOTES
       ======================================================== */

    const notes = $('#in-notes');

    if (notes) {

      notes.value =
        existing.notes || '';
    }
  }


  function highlightMood() {

    $$('.mood-opt').forEach(option => {

      const input =
        option.querySelector('input');

      option.classList.toggle(
        'selected',
        !!(input && input.checked)
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

    const stressOutput = $('#out-stress');


    if (stress && stressOutput) {

      stress.addEventListener(
        'input',
        event => {

          stressOutput.textContent =
            event.target.value;
        }
      );
    }


    const motivation =
      $('#in-motivation');

    const motivationOutput =
      $('#out-motivation');


    if (
      motivation &&
      motivationOutput
    ) {

      motivation.addEventListener(
        'input',
        event => {

          motivationOutput.textContent =
            event.target.value;
        }
      );
    }


    const form = $('#checkin-form');

    if (!form) return;


    form.addEventListener(
      'submit',
      event => {

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


        const stressInput =
          $('#in-stress');

        const motivationInput =
          $('#in-motivation');

        const sleepInput =
          $('#in-sleep');

        const studyInput =
          $('#in-study');

        const notesInput =
          $('#in-notes');


        if (
          !stressInput ||
          !motivationInput ||
          !sleepInput ||
          !studyInput ||
          !notesInput
        ) {

          console.error(
            'WellTrack: one or more check-in fields are missing.'
          );

          toast(
            'Some check-in fields are missing from the HTML.',
            'danger',
            'fa-triangle-exclamation'
          );

          return;
        }


        const entry = {

          date:
            Storage.todayStr(),

          mood:
            parseInt(
              moodInput.value,
              10
            ),

          stress:
            parseInt(
              stressInput.value,
              10
            ),

          motivation:
            parseInt(
              motivationInput.value,
              10
            ),

          sleep:
            parseFloat(
              sleepInput.value
            ),

          study:
            parseFloat(
              studyInput.value
            ),

          notes:
            notesInput.value.trim()
        };


        /* ====================================================
           BURNOUT
           ==================================================== */

        entry.score =
          Burnout.computeScore(entry);


        entry.category =
          Burnout.categorize(
            entry.score
          );


        /* ====================================================
           SAVE
           ==================================================== */

        Storage.upsertEntry(entry);


        /* ====================================================
           ACHIEVEMENTS
           ==================================================== */

        const result =
          Achievements.evaluate(
            Storage.getEntries()
          );


        if (
          result &&
          Array.isArray(result.newlyEarned)
        ) {

          result.newlyEarned
            .forEach(badge => {

              toast(
                `Badge unlocked: ${badge.name}!`,
                'success',
                badge.icon
              );

            });
        }


        /* ====================================================
           RESULT
           ==================================================== */

        showCheckinResult(entry);


        toast(
          'Check-in saved successfully.',
          'success',
          'fa-circle-check'
        );


        if (
          entry.category ===
          'High Risk'
        ) {

          toast(
            'High burnout risk detected — review your recommendations.',
            'danger',
            'fa-triangle-exclamation'
          );
        }


        const banner =
          $('#already-checked-banner');


        if (banner) {

          banner.classList.remove(
            'hidden'
          );
        }


        renderDashboard();
      }
    );
  }


  /* ==========================================================
     CHECK-IN RESULT
     ========================================================== */

  function showCheckinResult(entry) {

    const box = $('#checkin-result');

    if (!box) return;


    const categoryClass =
      Burnout.categoryClass(
        entry.category
      );


    box.classList.remove('hidden');


    box.innerHTML = `

      <h3>
        <i class="fa-solid fa-chart-line"></i>
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

      <span class="category-badge ${categoryClass}">
        ${escapeHtml(entry.category)}
      </span>

      <p
        class="muted small"
        style="margin-top:12px;"
      >
        Your WellTrack dashboard contains
        personalized insights and recommendations.
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


  /* ==========================================================
     DASHBOARD
     ========================================================== */

  function renderDashboard() {

    if (
      typeof Storage === 'undefined' ||
      typeof Burnout === 'undefined' ||
      typeof Achievements === 'undefined'
    ) {
      return;
    }


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
        entry => entry.date === today
      ) || null;


    const shown =
      todayEntry || latest;


    /* ========================================================
       GREETING
       ======================================================== */

    if (profile) {

      const hour =
        new Date().getHours();


      const greeting =
        hour < 12
          ? 'Good morning'
          : hour < 17
            ? 'Good afternoon'
            : 'Good evening';


      const firstName =
        (profile.name || 'there')
          .split(' ')[0];


      const greetingElement =
        $('#greeting-text');


      if (greetingElement) {

        greetingElement.textContent =
          `${greeting}, ${firstName}!`;
      }


      const subtitle =
        $('#greeting-sub');


      if (subtitle) {

        subtitle.textContent =
          `${profile.course || 'Student'} · ${profile.year || ''}` +
          (
            todayEntry
              ? ' · Checked in today ✓'
              : ' · You haven’t checked in today'
          );
      }
    }


    /* ========================================================
       RISK ALERT
       ======================================================== */

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
          High burnout risk detected.
          Review your recommendations and consider easing your schedule.
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
          Moderate burnout risk detected.
          A few changes can help you return to the healthy zone.
        `;
      }

      else {

        alertBox.className =
          'risk-alert hidden';

        alertBox.innerHTML = '';
      }
    }


    /* ========================================================
       SCORE
       ======================================================== */

    const scoreElement =
      $('#burnout-score-value');

    const categoryElement =
      $('#burnout-category');

    const explainElement =
      $('#burnout-explain');


    if (shown) {

      if (scoreElement) {

        scoreElement.textContent =
          shown.score;
      }


      if (categoryElement) {

        categoryElement.textContent =
          shown.category;


        categoryElement.className =
          'category-badge ' +
          Burnout.categoryClass(
            shown.category
          );
      }


      if (explainElement) {

        explainElement.textContent =
          todayEntry
            ? 'Based on today’s check-in.'
            : `Based on your last check-in (${formatDate(shown.date)}).`;
      }

    } else {

      if (scoreElement) {

        scoreElement.textContent =
          '–';
      }


      if (categoryElement) {

        categoryElement.textContent =
          'No data';

        categoryElement.className =
          'category-badge';
      }


      if (explainElement) {

        explainElement.textContent =
          'Complete your first check-in to see your burnout risk.';
      }
    }


    renderGauge(
      shown ? shown.score : 0
    );


    /* ========================================================
       SNAPSHOT
       ======================================================== */

    setText(
      '#snap-mood',
      shown
        ? `${MOOD_EMOJI[shown.mood]} ${MOOD_LABEL[shown.mood]}`
        : '–'
    );


    setText(
      '#snap-stress',
      shown
        ? `${shown.stress}/10`
        : '–'
    );


    setText(
      '#snap-sleep',
      shown
        ? `${shown.sleep} h`
        : '–'
    );


    setText(
      '#snap-study',
      shown
        ? `${shown.study} h`
        : '–'
    );


    setText(
      '#snap-motivation',
      shown
        ? `${shown.motivation}/10`
        : '–'
    );


    setText(
      '#snap-total',
      entries.length
    );


    /* ========================================================
       RECOMMENDATIONS
       ======================================================== */

    const recommendationList =
      $('#recommendations-list');


    if (recommendationList) {

      const recommendations =
        Burnout.recommendations(
          shown,
          entries
        );


      if (
        Array.isArray(recommendations) &&
        recommendations.length
      ) {

        recommendationList.innerHTML =
          recommendations
            .map(item => `
              <li class="rec-item ${escapeHtml(item.level || 'info')}">
                <i class="fa-solid ${escapeHtml(item.icon || 'fa-circle-info')}"></i>
                <span>${escapeHtml(item.text)}</span>
              </li>
            `)
            .join('');

      } else {

        recommendationList.innerHTML = `
          <li class="rec-item info">
            <i class="fa-solid fa-circle-info"></i>
            <span>Start your first check-in to get personalized advice.</span>
          </li>
        `;
      }
    }


    /* ========================================================
       STREAK
       ======================================================== */

    const currentStreak =
      Achievements.currentStreak(
        entries
      );


    setText(
      '#streak-count',
      currentStreak
    );


    setText(
      '#p-current-streak',
      currentStreak
    );


    setText(
      '#p-longest-streak',
      Achievements.longestStreak(entries)
    );


    setText(
      '#p-total-checkins',
      entries.length
    );


    setText(
      '#p-consistency',
      Achievements.consistency(
        entries,
        30
      ) + '%'
    );


    /* ========================================================
       WEEK
       ======================================================== */

    renderWeekDots(entries);


    /* ========================================================
       MINI TREND
       ======================================================== */

    renderMiniTrend(entries);
  }


  function renderWeekDots(entries) {

    const container =
      $('#week-dots');


    if (!container) return;


    const dates =
      new Set(
        entries.map(
          entry => entry.date
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


    let html = '';


    for (
      let i = 6;
      i >= 0;
      i--
    ) {

      const date =
        Storage.todayStr(-i);


      const dateObject =
        new Date(
          date + 'T00:00:00'
        );


      const completed =
        dates.has(date);


      html += `
        <span
          class="wd
            ${completed ? 'done' : ''}
            ${i === 0 ? 'today' : ''}"
          title="${escapeHtml(date)}"
        >
          ${
            completed
              ? '✓'
              : dayNames[
                  dateObject.getDay()
                ]
          }
        </span>
      `;
    }


    container.innerHTML =
      html;
  }


  /* ==========================================================
     GAUGE
     ========================================================== */

  function renderGauge(score) {

    const canvas =
      $('#gauge-chart');


    if (!canvas) return;


    if (typeof Chart === 'undefined') {

      console.warn(
        'WellTrack: Chart.js is not loaded.'
      );

      return;
    }


    const colors =
      chartColors();


    let color =
      colors.primary;


    if (score < 40) {

      color =
        colors.success;

    }

    else if (score < 65) {

      color =
        colors.warning;

    }

    else {

      color =
        colors.danger;
    }


    destroyChart('gauge');


    charts.gauge =
      new Chart(
        canvas,
        {

          type: 'doughnut',

          data: {

            datasets: [{

              data: [
                score,
                Math.max(0, 100 - score)
              ],

              backgroundColor: [
                color,
                'rgba(255,255,255,0.06)'
              ],

              borderWidth: 0,

              borderRadius: 8
            }]
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
        }
      );
  }


  /* ==========================================================
     MINI TREND
     ========================================================== */

  function renderMiniTrend(entries) {

    const canvas =
      $('#mini-trend-chart');


    if (!canvas) return;


    if (typeof Chart === 'undefined') return;


    const colors =
      chartColors();


    const days =
      lastNDays(14);


    const map =
      Object.fromEntries(
        entries.map(
          entry => [
            entry.date,
            entry
          ]
        )
      );


    const data =
      days.map(
        date =>
          map[date]
            ? map[date].score
            : null
      );


    destroyChart('mini');


    charts.mini =
      new Chart(
        canvas,
        {

          type: 'line',

          data: {

            labels:
              days.map(shortLabel),

            datasets: [{

              label:
                'Burnout score',

              data,

              borderColor:
                colors.primary,

              backgroundColor:
                hexToRgba(
                  colors.primary,
                  0.14
                ),

              fill: true,

              tension: 0.35,

              spanGaps: true,

              pointRadius: 3,

              pointBackgroundColor:
                colors.primary,

              pointBorderWidth: 0
            }]
          },


          options:
            baseLineOptions(
              colors,
              0,
              100
            )
        }
      );
  }


  /* ==========================================================
     ANALYTICS
     ========================================================== */

  function renderAnalytics() {

    if (
      typeof Storage === 'undefined' ||
      typeof Burnout === 'undefined'
    ) {
      return;
    }


    const entries =
      Storage.getEntries();


    const empty =
      entries.length === 0;


    const emptyElement =
      $('#analytics-empty');


    const contentElement =
      $('#analytics-content');


    if (emptyElement) {

      emptyElement.classList.toggle(
        'hidden',
        !empty
      );
    }


    if (contentElement) {

      contentElement.classList.toggle(
        'hidden',
        empty
      );
    }


    if (empty) {

      Object.keys(charts).forEach(
        destroyChart
      );

      return;
    }


    if (typeof Chart === 'undefined') {

      console.warn(
        'WellTrack: Chart.js is not loaded.'
      );

      return;
    }


    const colors =
      chartColors();


    const days =
      lastNDays(
        analyticsRange
      );


    const map =
      Object.fromEntries(
        entries.map(
          entry => [
            entry.date,
            entry
          ]
        )
      );


    const labels =
      days.map(shortLabel);


    const value =
      (date, key) =>
        map[date]
          ? map[date][key]
          : null;


    /* ========================================================
       SUMMARY
       ======================================================== */

    const current =
      entries.filter(
        entry =>
          days.includes(entry.date)
      );


    const previousDays =
      lastNDays(
        analyticsRange,
        analyticsRange
      );


    const previous =
      entries.filter(
        entry =>
          previousDays.includes(
            entry.date
          )
      );


    const currentAverage =
      Burnout.averages(current);


    const previousAverage =
      Burnout.averages(previous);


    renderSummaryCards(
      currentAverage,
      previousAverage
    );


    /* ========================================================
       BURNOUT CHART
       ======================================================== */

    destroyChart('burnout');


    const burnoutCanvas =
      $('#chart-burnout');


    if (burnoutCanvas) {

      charts.burnout =
        new Chart(
          burnoutCanvas,
          {

            type: 'line',

            data: {

              labels,

              datasets: [{

                label:
                  'Burnout score',

                data:
                  days.map(
                    date =>
                      value(
                        date,
                        'score'
                      )
                  ),

                borderColor:
                  colors.primary,

                backgroundColor:
                  hexToRgba(
                    colors.primary,
                    0.12
                  ),

                fill: true,

                tension: 0.35,

                spanGaps: true,

                pointRadius: 4,

                pointBackgroundColor:
                  days.map(date => {

                    const score =
                      value(
                        date,
                        'score'
                      );


                    if (score == null) {
                      return colors.text;
                    }


                    if (score < 40) {
                      return colors.success;
                    }


                    if (score < 65) {
                      return colors.warning;
                    }


                    return colors.danger;
                  }),

                pointBorderWidth: 0
              }]
            },


            options:
              baseLineOptions(
                colors,
                0,
                100
              )
          }
        );
    }


    /* ========================================================
       MOOD + MOTIVATION
       ======================================================== */

    destroyChart('mood');


    const moodCanvas =
      $('#chart-mood');


    if (moodCanvas) {

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
                      date =>
                        value(
                          date,
                          'mood'
                        )
                    ),

                  borderColor:
                    colors.primary,

                  tension: 0.35,

                  spanGaps: true,

                  pointRadius: 3,

                  pointBackgroundColor:
                    colors.primary,

                  yAxisID: 'y'
                },


                {

                  label:
                    'Motivation (1–10)',

                  data:
                    days.map(
                      date =>
                        value(
                          date,
                          'motivation'
                        )
                    ),

                  borderColor:
                    colors.purple,

                  tension: 0.35,

                  spanGaps: true,

                  pointRadius: 3,

                  pointBackgroundColor:
                    colors.purple,

                  yAxisID: 'y1'
                }
              ]
            },


            options: {

              ...baseLineOptions(
                colors,
                0,
                5,
                false
              ),

              scales: {

                x:
                  axisX(colors),

                y: {

                  min: 0,

                  max: 5,

                  ticks: {
                    color: colors.text
                  },

                  grid: {
                    color: colors.grid
                  }
                },

                y1: {

                  min: 0,

                  max: 10,

                  position: 'right',

                  ticks: {
                    color: colors.text
                  },

                  grid: {
                    display: false
                  }
                }
              }
            }
          }
        );
    }


    /* ========================================================
       SLEEP + STUDY
       ======================================================== */

    destroyChart('sleepStudy');


    const sleepStudyCanvas =
      $('#chart-sleep-study');


    if (sleepStudyCanvas) {

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
                      date =>
                        value(
                          date,
                          'sleep'
                        )
                    ),

                  backgroundColor:
                    hexToRgba(
                      colors.primary,
                      0.75
                    ),

                  borderRadius: 6
                },


                {

                  label:
                    'Study (h)',

                  data:
                    days.map(
                      date =>
                        value(
                          date,
                          'study'
                        )
                    ),

                  backgroundColor:
                    hexToRgba(
                      colors.purple,
                      0.65
                    ),

                  borderRadius: 6
                }
              ]
            },


            options: {

              responsive: true,

              maintainAspectRatio: false,

              plugins: {

                legend: {

                  labels: {
                    color: colors.text
                  }
                }
              },

              scales: {

                x:
                  axisX(colors),

                y: {

                  beginAtZero: true,

                  ticks: {
                    color: colors.text
                  },

                  grid: {
                    color: colors.grid
                  }
                }
              }
            }
          }
        );
    }


    /* ========================================================
       STRESS
       ======================================================== */

    destroyChart('stress');


    const stressCanvas =
      $('#chart-stress');


    if (stressCanvas) {

      charts.stress =
        new Chart(
          stressCanvas,
          {

            type: 'line',

            data: {

              labels,

              datasets: [{

                label:
                  'Stress (1–10)',

                data:
                  days.map(
                    date =>
                      value(
                        date,
                        'stress'
                      )
                  ),

                borderColor:
                  colors.purple,

                backgroundColor:
                  hexToRgba(
                    colors.purple,
                    0.12
                  ),

                fill: true,

                tension: 0.35,

                spanGaps: true,

                pointRadius: 3,

                pointBackgroundColor:
                  colors.purple
              }]
            },


            options:
              baseLineOptions(
                colors,
                0,
                10
              )
          }
        );
    }


    renderPeriodTables(entries);


    renderBehaviorChanges(
      currentAverage,
      previousAverage
    );
  }


  /* ==========================================================
     SUMMARY CARDS
     ========================================================== */

  function renderSummaryCards(
    current,
    previous
  ) {

    const container =
      $('#summary-cards');


    if (!container) return;


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


    container.innerHTML =
      metrics.map(metric => {

        const value =
          current
            ? current[metric.key]
            : null;


        let deltaHTML =
          '<span class="sc-delta flat">no previous data</span>';


        if (
          current &&
          previous &&
          current[metric.key] != null &&
          previous[metric.key] != null
        ) {

          const difference =
            +(
              current[metric.key] -
              previous[metric.key]
            ).toFixed(1);


          if (difference === 0) {

            deltaHTML =
              '<span class="sc-delta flat">— unchanged</span>';

          } else {

            const arrow =
              difference > 0
                ? '▲'
                : '▼';


            let className =
              difference > 0
                ? 'up'
                : 'down';


            if (
              metric.lowerIsBetter === true
            ) {

              className +=
                difference > 0
                  ? ''
                  : ' good';

            }

            else if (
              metric.lowerIsBetter === false
            ) {

              className =
                difference > 0
                  ? 'up good'
                  : 'down bad';

            }

            else {

              className =
                'flat';
            }


            deltaHTML = `
              <span class="sc-delta ${className}">
                ${arrow}
                ${Math.abs(difference)}
                vs prev.
              </span>
            `;
          }
        }


        return `
          <div class="sum-card">

            <div class="sc-label">
              ${escapeHtml(metric.label)}
            </div>

            <div class="sc-value">
              ${
                value != null
                  ? escapeHtml(
                      String(value) +
                      metric.unit
                    )
                  : '–'
              }
            </div>

            ${deltaHTML}

          </div>
        `;

      }).join('');
  }


  /* ==========================================================
     PERIOD TABLES
     ========================================================== */

  function renderPeriodTables(entries) {

    const build =
      (
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
            <th>${escapeHtml(currentLabel)}</th>
            <th>${escapeHtml(previousLabel)}</th>
          </tr>
        `;


        rows.forEach(
          ([
            label,
            currentValue,
            previousValue,
            lowerBetter
          ]) => {

            let className = '';


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

                className =
                  lowerBetter
                    ? 'delta-good'
                    : 'delta-bad';

              }

              else if (
                currentValue >
                previousValue
              ) {

                className =
                  lowerBetter
                    ? 'delta-bad'
                    : 'delta-good';
              }
            }


            html += `
              <tr>

                <td>
                  ${escapeHtml(label)}
                </td>

                <td class="${className}">
                  ${escapeHtml(String(currentValue))}
                </td>

                <td>
                  ${escapeHtml(String(previousValue))}
                </td>

              </tr>
            `;
          }
        );


        return html;
      };


    const weeklyCurrent =
      entriesBetween(
        entries,
        6,
        0
      );


    const weeklyPrevious =
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
          weeklyCurrent,
          weeklyPrevious,
          'This week',
          'Last week'
        );
    }


    const monthlyCurrent =
      entriesBetween(
        entries,
        29,
        0
      );


    const monthlyPrevious =
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
          monthlyCurrent,
          monthlyPrevious,
          'This month',
          'Last month'
        );
    }
  }


  /* ==========================================================
     BEHAVIOR CHANGES
     ========================================================== */

  function renderBehaviorChanges(
    current,
    previous
  ) {

    const box =
      $('#behavior-changes');


    if (!box) return;


    if (
      !current ||
      !previous
    ) {

      box.innerHTML = `
        <div class="bc-item neutral">
          <i class="fa-solid fa-circle-info"></i>
          Keep checking in — behavior insights
          appear once you have data across
          two periods.
        </div>
      `;

      return;
    }


    const items = [];


    const difference =
      key =>
        +(
          current[key] -
          previous[key]
        ).toFixed(1);


    if (difference('score') >= 8) {

      items.push({
        cls: 'bad',
        icon: 'fa-arrow-trend-up',
        text:
          `Burnout risk rose by ${difference('score')} points compared with the previous period.`
      });
    }


    if (difference('score') <= -8) {

      items.push({
        cls: 'good',
        icon: 'fa-arrow-trend-down',
        text:
          `Burnout risk dropped by ${Math.abs(difference('score'))} points. Your recent habits are improving.`
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
          `Sleep improved by ${difference('sleep')}h on average.`
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
          `Study time increased by ${difference('study')}h/day. Make sure recovery keeps pace.`
      });
    }


    if (difference('motivation') <= -1.5) {

      items.push({
        cls: 'bad',
        icon: 'fa-battery-quarter',
        text:
          `Motivation fell by ${Math.abs(difference('motivation'))} points.`
      });
    }


    if (difference('motivation') >= 1.5) {

      items.push({
        cls: 'good',
        icon: 'fa-rocket',
        text:
          `Motivation increased by ${difference('motivation')} points.`
      });
    }


    if (!items.length) {

      items.push({
        cls: 'neutral',
        icon: 'fa-equals',
        text:
          'Your behavior has remained relatively stable compared with the previous period.'
      });
    }


    box.innerHTML =
      items
        .map(item => `
          <div class="bc-item ${escapeHtml(item.cls)}">
            <i class="fa-solid ${escapeHtml(item.icon)}"></i>
            ${escapeHtml(item.text)}
          </div>
        `)
        .join('');
  }


  /* ==========================================================
     ANALYTICS RANGE
     ========================================================== */

  function bindAnalytics() {

    $$('.range-btn').forEach(
      button => {

        button.addEventListener(
          'click',
          () => {

            $$('.range-btn')
              .forEach(btn =>
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


  /* ==========================================================
     HISTORY
     ========================================================== */

  function renderHistory() {

    const search =
      $('#history-search');


    const riskFilter =
      $('#history-filter-risk');


    const moodFilter =
      $('#history-filter-mood');


    let query =
      search
        ? search.value.trim().toLowerCase()
        : '';


    const risk =
      riskFilter
        ? riskFilter.value
        : '';


    const mood =
      moodFilter
        ? moodFilter.value
        : '';


    let entries =
      Storage.getEntries();


    if (query) {

      entries =
        entries.filter(entry =>

          (entry.notes || '')
            .toLowerCase()
            .includes(query)

          ||

          entry.date
            .includes(query)

          ||

          formatDate(entry.date)
            .toLowerCase()
            .includes(query)
        );
    }


    if (risk) {

      entries =
        entries.filter(
          entry =>
            entry.category === risk
        );
    }


    if (mood) {

      entries =
        entries.filter(
          entry =>
            String(entry.mood) === mood
        );
    }


    const empty =
      $('#history-empty');


    if (empty) {

      empty.classList.toggle(
        'hidden',
        entries.length > 0
      );
    }


    const list =
      $('#history-list');


    if (!list) return;


    list.innerHTML =
      entries.map(entry => {

        const date =
          new Date(
            entry.date +
            'T00:00:00'
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
            data-id="${escapeHtml(String(entry.id || entry.date))}"
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
                  ${escapeHtml(entry.category)}
                  · ${escapeHtml(String(entry.score))}
                </span>


                <span class="h-chip">
                  ${MOOD_EMOJI[entry.mood] || ''}
                  ${MOOD_LABEL[entry.mood] || ''}
                </span>


                <span class="h-chip">
                  <i class="fa-solid fa-bolt"></i>
                  Stress ${escapeHtml(String(entry.stress))}/10
                </span>


                <span class="h-chip">
                  <i class="fa-solid fa-bed"></i>
                  ${escapeHtml(String(entry.sleep))}h
                </span>


                <span class="h-chip">
                  <i class="fa-solid fa-book-open"></i>
                  ${escapeHtml(String(entry.study))}h
                </span>


                <span class="h-chip">
                  <i class="fa-solid fa-fire"></i>
                  Motiv. ${escapeHtml(String(entry.motivation))}/10
                </span>

              </div>


              ${
                entry.notes
                  ? `
                    <p class="h-notes">
                      "${escapeHtml(entry.notes)}"
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

      }).join('');
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


    const riskFilter =
      $('#history-filter-risk');


    if (riskFilter) {

      riskFilter.addEventListener(
        'change',
        renderHistory
      );
    }


    const moodFilter =
      $('#history-filter-mood');


    if (moodFilter) {

      moodFilter.addEventListener(
        'change',
        renderHistory
      );
    }


    const historyList =
      $('#history-list');


    if (historyList) {

      historyList.addEventListener(
        'click',
        event => {

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


          const confirmed =
            confirm(
              'Delete this check-in record permanently?'
            );


          if (!confirmed) return;


          Storage.deleteEntry(id);


          renderHistory();

          renderDashboard();


          toast(
            'Record deleted.',
            'warning',
            'fa-trash'
          );
        }
      );
    }


    const exportJSON =
      $('#export-json');


    if (exportJSON) {

      exportJSON.addEventListener(
        'click',
        () => exportData('json')
      );
    }


    const exportCSV =
      $('#export-csv');


    if (exportCSV) {

      exportCSV.addEventListener(
        'click',
        () => exportData('csv')
      );
    }
  }


  /* ==========================================================
     EXPORT
     ========================================================== */

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


    /* ========================================================
       JSON
       ======================================================== */

    if (format === 'json') {

      const payload = {

        app:
          'WellTrack',

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


    /* ========================================================
       CSV
       ======================================================== */

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
        value => {

          const string =
            String(
              value == null
                ? ''
                : value
            );


          return /[",\n]/.test(
            string
          )

            ? '"' +
              string.replace(
                /"/g,
                '""'
              ) +
              '"'

            : string;
        };


      const rows =
        entries.map(
          entry => [

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
            type:
              'text/csv'
          }
        );


      filename =
        `welltrack-export-${Storage.todayStr()}.csv`;
    }


    /* ========================================================
       DOWNLOAD
       ======================================================== */

    const url =
      URL.createObjectURL(blob);


    const link =
      document.createElement('a');


    link.href =
      url;


    link.download =
      filename;


    document.body.appendChild(link);


    link.click();


    link.remove();


    setTimeout(() => {

      URL.revokeObjectURL(url);

    }, 100);


    toast(
      `Exported ${entries.length} records as ${format.toUpperCase()}.`,
      'success',
      'fa-download'
    );
  }


  /* ==========================================================
     ACHIEVEMENTS
     ========================================================== */

  function renderAchievements() {

    const entries =
      Storage.getEntries();


    const result =
      Achievements.evaluate(
        entries
      );


    const badges =
      result.badges;


    const earnedCount =
      badges.filter(
        badge => badge.earned
      ).length;


    const percentage =
      badges.length
        ? Math.round(
            (
              earnedCount /
              badges.length
            ) * 100
          )
        : 0;


    const progress =
      $('#ach-progress-fill');


    if (progress) {

      progress.style.width =
        percentage + '%';
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
      badges.map(badge => `

        <div
          class="badge-card
            ${badge.earned ? '' : 'locked'}"
        >

          <div class="b-icon">
            <i class="fa-solid ${escapeHtml(badge.icon)}"></i>
          </div>


          <h4>
            ${escapeHtml(badge.name)}
          </h4>


          <p>
            ${escapeHtml(badge.desc)}
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

      `).join('');
  }


  /* ==========================================================
     CHART HELPERS
     ========================================================== */

  function destroyChart(key) {

    if (charts[key]) {

      try {
        charts[key].destroy();
      } catch (error) {
        console.warn(
          `WellTrack: Could not destroy chart "${key}".`,
          error
        );
      }

      charts[key] = null;
    }
  }


  function baseLineOptions(
    colors,
    min,
    max,
    hideLegend = false
  ) {

    return {

      responsive: true,

      maintainAspectRatio: false,

      plugins: {

        legend:
          hideLegend

            ? {
                display: false
              }

            : {
                labels: {
                  color:
                    colors.text
                }
              }
      },

      scales: {

        x:
          axisX(colors),

        y: {

          min,

          max,

          ticks: {
            color:
              colors.text
          },

          grid: {
            color:
              colors.grid
          }
        }
      }
    };
  }


  function axisX(colors) {

    return {

      ticks: {

        color:
          colors.text,

        maxTicksLimit: 10,

        maxRotation: 0
      },

      grid: {
        display: false
      }
    };
  }


  /* ==========================================================
     DATE HELPERS
     ========================================================== */

  function lastNDays(
    number,
    offset = 0
  ) {

    const dates = [];


    for (
      let i =
        number - 1 + offset;

      i >= offset;

      i--
    ) {

      dates.push(
        Storage.todayStr(-i)
      );
    }


    return dates;
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
      entry =>
        entry.date >= from &&
        entry.date <= to
    );
  }


  function shortLabel(dateString) {

    const date =
      new Date(
        dateString +
        'T00:00:00'
      );


    return date.toLocaleDateString(
      undefined,
      {
        month: 'short',
        day: 'numeric'
      }
    );
  }


  function formatDate(dateString) {

    return new Date(
      dateString +
      'T00:00:00'
    ).toLocaleDateString(
      undefined,
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }
    );
  }


  /* ==========================================================
     SECURITY / TEXT HELPERS
     ========================================================== */

  function escapeHtml(value) {

    return String(value)
      .replace(
        /[&<>"']/g,
        character => ({

          '&': '&amp;',

          '<': '&lt;',

          '>': '&gt;',

          '"': '&quot;',

          "'": '&#39;'

        }[character])
      );
  }


  function hexToRgba(
    hex,
    alpha
  ) {

    const clean =
      hex.replace('#', '');


    const red =
      parseInt(
        clean.substring(0, 2),
        16
      );


    const green =
      parseInt(
        clean.substring(2, 4),
        16
      );


    const blue =
      parseInt(
        clean.substring(4, 6),
        16
      );


    return `
      rgba(
        ${red},
        ${green},
        ${blue},
        ${alpha}
      )
    `;
  }


  function setText(
    selector,
    value
  ) {

    const element =
      $(selector);


    if (element) {

      element.textContent =
        value;
    }
  }


  /* ==========================================================
     RENDER EVERYTHING
     ========================================================== */

  function renderAll() {

    renderDashboard();

    renderAnalytics();

    renderHistory();

    renderAchievements();

    prepareCheckinForm();
  }


  /* ==========================================================
     INITIALIZATION
     ========================================================== */

  document.addEventListener(
    'DOMContentLoaded',
    () => {

      /* ======================================================
         FORCE BLACK + PURPLE THEME
         ====================================================== */

      applyWellTrackTheme();


      /* ======================================================
         THEME BUTTON
         ====================================================== */

      const themeButton =
        $('#theme-toggle');


      if (themeButton) {

        themeButton.addEventListener(
          'click',
          () => {

            toast(
              'WellTrack uses the black + purple theme.',
              'info',
              'fa-palette'
            );
          }
        );
      }


      /* ======================================================
         NAVIGATION
         ====================================================== */

      $$('.tab').forEach(
        tab => {

          tab.addEventListener(
            'click',
            () =>
              switchView(
                tab.dataset.view
              )
          );
        }
      );


      /* ======================================================
         DATA-GOTO BUTTONS
         ====================================================== */

      document.body.addEventListener(
        'click',
        event => {

          const button =
            event.target.closest(
              '[data-goto]'
            );


          if (!button) return;


          const destination =
            button.dataset.goto;


          if (!destination) return;


          switchView(destination);
        }
      );


      /* ======================================================
         BIND FEATURES
         ====================================================== */

      bindProfile();

      bindCheckin();

      bindAnalytics();

      bindHistory();


      /* ======================================================
         PROFILE
         ====================================================== */

      checkProfile();


      /* ======================================================
         INITIAL RENDER
         ====================================================== */

      renderAll();

    }
  );

})();
