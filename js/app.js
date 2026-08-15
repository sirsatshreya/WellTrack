/* ============================================================
   app.js — MindTrack UI controller
   ============================================================ */

(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const MOOD_EMOJI = { 1: '😞', 2: '🙁', 3: '😐', 4: '🙂', 5: '😄' };
  const MOOD_LABEL = { 1: 'Very Low', 2: 'Low', 3: 'Okay', 4: 'Good', 5: 'Great' };

  let charts = {};          // Chart.js instances
  let analyticsRange = 7;   // days

  /* ================= THEME ================= */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    $('#theme-toggle i').className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    // Re-render charts so colors match theme
    renderDashboard();
    renderAnalytics();
  }

  function chartColors() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      text: dark ? '#98a1b8' : '#64708a',
      grid: dark ? 'rgba(255,255,255,0.07)' : 'rgba(28,35,51,0.07)',
      primary: dark ? '#7b88ff' : '#5b6cff',
      purple: '#9b6cff',
      success: dark ? '#34c98c' : '#1fa971',
      warning: dark ? '#f0ac3c' : '#e8960c',
      danger: dark ? '#f0697a' : '#e04f5f',
      surface2: dark ? '#262a3a' : '#eef1f8'
    };
  }

  /* ================= TOASTS ================= */
  function toast(msg, type = 'info', icon = 'fa-circle-info') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<i class="fa-solid ${icon}"></i><span></span>`;
    el.querySelector('span').textContent = msg;
    $('#toast-container').appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 450); }, 3800);
  }

  /* ================= NAVIGATION ================= */
  function switchView(name) {
    $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === name));
    $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + name));
    if (name === 'dashboard') renderDashboard();
    if (name === 'analytics') renderAnalytics();
    if (name === 'history') renderHistory();
    if (name === 'achievements') renderAchievements();
    if (name === 'checkin') prepareCheckinForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ================= PROFILE / ONBOARDING ================= */
  function checkProfile() {
    const p = Storage.getProfile();
    if (!p) {
      $('#onboarding-overlay').classList.remove('hidden');
    } else {
      $('#onboarding-overlay').classList.add('hidden');
    }
    return p;
  }

  function bindProfile() {
    $('#onboarding-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const profile = {
        name: $('#ob-name').value.trim(),
        course: $('#ob-course').value.trim(),
        year: $('#ob-year').value,
        studyGoal: parseFloat($('#ob-goal').value) || 4,
        createdAt: Date.now()
      };
      Storage.saveProfile(profile);
      $('#onboarding-overlay').classList.add('hidden');
      toast(`Welcome, ${profile.name}! Start with your first check-in.`, 'success', 'fa-circle-check');
      renderAll();
    });

    $('#profile-btn').addEventListener('click', () => {
      const p = Storage.getProfile();
      if (!p) return;
      $('#pf-name').value = p.name;
      $('#pf-course').value = p.course;
      $('#pf-year').value = p.year;
      $('#pf-goal').value = p.studyGoal;
      $('#profile-overlay').classList.remove('hidden');
    });
    $('#profile-close').addEventListener('click', () => $('#profile-overlay').classList.add('hidden'));
    $('#profile-overlay').addEventListener('click', (e) => {
      if (e.target === $('#profile-overlay')) $('#profile-overlay').classList.add('hidden');
    });

    $('#profile-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const p = Storage.getProfile() || {};
      p.name = $('#pf-name').value.trim();
      p.course = $('#pf-course').value.trim();
      p.year = $('#pf-year').value;
      p.studyGoal = parseFloat($('#pf-goal').value) || 4;
      Storage.saveProfile(p);
      $('#profile-overlay').classList.add('hidden');
      toast('Profile updated.', 'success', 'fa-circle-check');
      renderDashboard();
    });

    $('#reset-data-btn').addEventListener('click', () => {
      if (confirm('This will permanently delete ALL your data (profile, check-ins, achievements). Continue?')) {
        Storage.resetAll();
        location.reload();
      }
    });
  }

  /* ================= CHECK-IN ================= */
  function prepareCheckinForm() {
    const today = Storage.todayStr();
    $('#checkin-date-label').textContent = new Date().toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const existing = Storage.getEntryByDate(today);
    $('#already-checked-banner').classList.toggle('hidden', !existing);
    if (existing) {
      // pre-fill
      const radio = document.querySelector(`input[name="mood"][value="${existing.mood}"]`);
      if (radio) { radio.checked = true; highlightMood(); }
      $('#in-stress').value = existing.stress; $('#out-stress').value = existing.stress;
      $('#in-motivation').value = existing.motivation; $('#out-motivation').value = existing.motivation;
      $('#in-sleep').value = existing.sleep;
      $('#in-study').value = existing.study;
      $('#in-notes').value = existing.notes || '';
    }
  }

  function highlightMood() {
    $$('.mood-opt').forEach(opt => {
      opt.classList.toggle('selected', opt.querySelector('input').checked);
    });
  }

  function bindCheckin() {
    $('#mood-row').addEventListener('change', highlightMood);
    $('#in-stress').addEventListener('input', (e) => $('#out-stress').value = e.target.value);
    $('#in-motivation').addEventListener('input', (e) => $('#out-motivation').value = e.target.value);

    $('#checkin-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const moodInput = document.querySelector('input[name="mood"]:checked');
      if (!moodInput) { toast('Please select your mood.', 'warning', 'fa-face-meh'); return; }

      const entry = {
        date: Storage.todayStr(),
        mood: parseInt(moodInput.value, 10),
        stress: parseInt($('#in-stress').value, 10),
        motivation: parseInt($('#in-motivation').value, 10),
        sleep: parseFloat($('#in-sleep').value),
        study: parseFloat($('#in-study').value),
        notes: $('#in-notes').value.trim()
      };
      entry.score = Burnout.computeScore(entry);
      entry.category = Burnout.categorize(entry.score);
      Storage.upsertEntry(entry);

      // Achievements check
      const { newlyEarned } = Achievements.evaluate(Storage.getEntries());
      newlyEarned.forEach(b => toast(`Badge unlocked: ${b.name}!`, 'success', b.icon));

      showCheckinResult(entry);
      toast('Check-in saved!', 'success', 'fa-circle-check');
      if (entry.category === 'High Risk') {
        toast('⚠ High burnout risk detected — see your recommendations.', 'danger', 'fa-triangle-exclamation');
      }
      $('#already-checked-banner').classList.remove('hidden');
      renderDashboard();
    });
  }

  function showCheckinResult(entry) {
    const cls = Burnout.categoryClass(entry.category);
    const box = $('#checkin-result');
    box.classList.remove('hidden');
    box.innerHTML = `
      <h3><i class="fa-solid fa-fire-flame-curved"></i> Today's Burnout Risk</h3>
      <div class="big-score">${entry.score}<span class="muted" style="font-size:1rem;">/100</span></div>
      <span class="category-badge ${cls}">${entry.category}</span>
      <p class="muted small" style="margin-top:12px;">View your dashboard for personalized recommendations.</p>
      <button class="btn btn-primary" data-goto="dashboard" style="margin-top:12px;"><i class="fa-solid fa-gauge-high"></i> Go to Dashboard</button>
    `;
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ================= DASHBOARD ================= */
  function renderDashboard() {
    const profile = Storage.getProfile();
    const entries = Storage.getEntries();
    const latest = entries[0] || null;
    const today = Storage.todayStr();
    const todayEntry = entries.find(e => e.date === today) || null;
    const shown = todayEntry || latest;

    // Greeting
    if (profile) {
      const h = new Date().getHours();
      const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
      $('#greeting-text').textContent = `${part}, ${profile.name.split(' ')[0]}!`;
      $('#greeting-sub').textContent = `${profile.course} · ${profile.year}` + (todayEntry ? ' · Checked in today ✓' : ' · You haven\u2019t checked in today');
    }

    // Risk alert banner
    const alertBox = $('#risk-alert');
    if (shown && shown.category === 'High Risk') {
      alertBox.className = 'risk-alert high';
      alertBox.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> High burnout risk detected. Please review the recommendations below and consider easing your schedule.';
    } else if (shown && shown.category === 'Moderate Risk') {
      alertBox.className = 'risk-alert moderate';
      alertBox.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Moderate burnout risk — a few small changes can keep you in the healthy zone.';
    } else {
      alertBox.className = 'risk-alert hidden';
    }

    // Score + category
    if (shown) {
      $('#burnout-score-value').textContent = shown.score;
      const badge = $('#burnout-category');
      badge.textContent = shown.category;
      badge.className = 'category-badge ' + Burnout.categoryClass(shown.category);
      $('#burnout-explain').textContent = todayEntry
        ? 'Based on today\u2019s check-in.'
        : `Based on your last check-in (${formatDate(shown.date)}).`;
    } else {
      $('#burnout-score-value').textContent = '–';
      const badge = $('#burnout-category');
      badge.textContent = 'No data';
      badge.className = 'category-badge';
    }
    renderGauge(shown ? shown.score : 0);

    // Snapshot
    $('#snap-mood').textContent = shown ? `${MOOD_EMOJI[shown.mood]} ${MOOD_LABEL[shown.mood]}` : '–';
    $('#snap-stress').textContent = shown ? `${shown.stress}/10` : '–';
    $('#snap-sleep').textContent = shown ? `${shown.sleep} h` : '–';
    $('#snap-study').textContent = shown ? `${shown.study} h` : '–';
    $('#snap-motivation').textContent = shown ? `${shown.motivation}/10` : '–';
    $('#snap-total').textContent = entries.length;

    // Recommendations
    const recs = Burnout.recommendations(shown, entries);
    $('#recommendations-list').innerHTML = recs.map(r =>
      `<li class="rec-item ${r.level}"><i class="fa-solid ${r.icon}"></i><span>${escapeHtml(r.text)}</span></li>`
    ).join('');

    // Progress stats
    const cur = Achievements.currentStreak(entries);
    $('#streak-count').textContent = cur;
    $('#p-current-streak').textContent = cur;
    $('#p-longest-streak').textContent = Achievements.longestStreak(entries);
    $('#p-total-checkins').textContent = entries.length;
    $('#p-consistency').textContent = Achievements.consistency(entries, 30) + '%';

    // Week dots (last 7 days)
    const dateSet = new Set(entries.map(e => e.date));
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    let dots = '';
    for (let i = 6; i >= 0; i--) {
      const dStr = Storage.todayStr(-i);
      const d = new Date(dStr + 'T00:00:00');
      const done = dateSet.has(dStr);
      dots += `<span class="wd ${done ? 'done' : ''} ${i === 0 ? 'today' : ''}" title="${dStr}">${done ? '✓' : dayNames[d.getDay()]}</span>`;
    }
    $('#week-dots').innerHTML = dots;

    renderMiniTrend(entries);
  }

  function renderGauge(score) {
    const c = chartColors();
    const color = score < 40 ? c.success : score < 65 ? c.warning : c.danger;
    destroyChart('gauge');
    charts.gauge = new Chart($('#gauge-chart'), {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [score, 100 - score],
          backgroundColor: [color, c.surface2],
          borderWidth: 0,
          borderRadius: 8
        }]
      },
      options: {
        rotation: -90, circumference: 180, cutout: '72%',
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        animation: { duration: 700 }
      }
    });
  }

  function renderMiniTrend(entries) {
    const c = chartColors();
    const days = lastNDays(14);
    const map = Object.fromEntries(entries.map(e => [e.date, e]));
    const data = days.map(d => map[d] ? map[d].score : null);
    destroyChart('mini');
    charts.mini = new Chart($('#mini-trend-chart'), {
      type: 'line',
      data: {
        labels: days.map(shortLabel),
        datasets: [{
          label: 'Burnout score',
          data,
          borderColor: c.primary,
          backgroundColor: hexToRgba(c.primary, 0.12),
          fill: true, tension: 0.35, spanGaps: true,
          pointRadius: 3, pointBackgroundColor: c.primary
        }]
      },
      options: baseLineOptions(c, 0, 100)
    });
  }

  /* ================= ANALYTICS ================= */
  function renderAnalytics() {
    const entries = Storage.getEntries();
    const empty = entries.length === 0;
    $('#analytics-empty').classList.toggle('hidden', !empty);
    $('#analytics-content').classList.toggle('hidden', empty);
    if (empty) return;

    const c = chartColors();
    const days = lastNDays(analyticsRange);
    const map = Object.fromEntries(entries.map(e => [e.date, e]));
    const labels = days.map(shortLabel);
    const val = (d, k) => (map[d] ? map[d][k] : null);

    // Summary cards: current range vs previous equal range
    const inRange = entries.filter(e => days.includes(e.date));
    const prevDays = lastNDays(analyticsRange, analyticsRange);
    const inPrev = entries.filter(e => prevDays.includes(e.date));
    const avgNow = Burnout.averages(inRange);
    const avgPrev = Burnout.averages(inPrev);
    renderSummaryCards(avgNow, avgPrev);

    // Burnout chart with risk zone colors
    destroyChart('burnout');
    charts.burnout = new Chart($('#chart-burnout'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Burnout score',
          data: days.map(d => val(d, 'score')),
          borderColor: c.danger,
          backgroundColor: hexToRgba(c.danger, 0.1),
          fill: true, tension: 0.35, spanGaps: true, pointRadius: 3,
          pointBackgroundColor: days.map(d => {
            const s = val(d, 'score');
            return s == null ? c.text : (s < 40 ? c.success : s < 65 ? c.warning : c.danger);
          })
        }]
      },
      options: baseLineOptions(c, 0, 100)
    });

    // Mood & motivation
    destroyChart('mood');
    charts.mood = new Chart($('#chart-mood'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Mood (1–5)', data: days.map(d => val(d, 'mood')), borderColor: c.primary, tension: 0.35, spanGaps: true, pointRadius: 3, yAxisID: 'y' },
          { label: 'Motivation (1–10)', data: days.map(d => val(d, 'motivation')), borderColor: c.purple, tension: 0.35, spanGaps: true, pointRadius: 3, yAxisID: 'y1' }
        ]
      },
      options: {
        ...baseLineOptions(c, 0, 5, true),
        scales: {
          x: axisX(c),
          y: { min: 0, max: 5, ticks: { color: c.text }, grid: { color: c.grid }, position: 'left' },
          y1: { min: 0, max: 10, ticks: { color: c.text }, grid: { display: false }, position: 'right' }
        }
      }
    });

    // Sleep vs study (bar)
    destroyChart('sleepStudy');
    charts.sleepStudy = new Chart($('#chart-sleep-study'), {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Sleep (h)', data: days.map(d => val(d, 'sleep')), backgroundColor: hexToRgba(c.primary, 0.75), borderRadius: 5 },
          { label: 'Study (h)', data: days.map(d => val(d, 'study')), backgroundColor: hexToRgba(c.warning, 0.75), borderRadius: 5 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: c.text } } },
        scales: { x: axisX(c), y: { beginAtZero: true, ticks: { color: c.text }, grid: { color: c.grid } } }
      }
    });

    // Stress
    destroyChart('stress');
    charts.stress = new Chart($('#chart-stress'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Stress (1–10)',
          data: days.map(d => val(d, 'stress')),
          borderColor: c.warning, backgroundColor: hexToRgba(c.warning, 0.12),
          fill: true, tension: 0.35, spanGaps: true, pointRadius: 3
        }]
      },
      options: baseLineOptions(c, 0, 10)
    });

    renderPeriodTables(entries);
    renderBehaviorChanges(avgNow, avgPrev);
  }

  function renderSummaryCards(now, prev) {
    const metrics = [
      { key: 'score', label: 'Avg Burnout', unit: '', lowerIsBetter: true },
      { key: 'stress', label: 'Avg Stress', unit: '/10', lowerIsBetter: true },
      { key: 'sleep', label: 'Avg Sleep', unit: ' h', lowerIsBetter: false },
      { key: 'study', label: 'Avg Study', unit: ' h', lowerIsBetter: null },
      { key: 'mood', label: 'Avg Mood', unit: '/5', lowerIsBetter: false },
      { key: 'motivation', label: 'Avg Motivation', unit: '/10', lowerIsBetter: false }
    ];
    $('#summary-cards').innerHTML = metrics.map(m => {
      const v = now ? now[m.key] : null;
      let deltaHtml = '<span class="sc-delta flat">no previous data</span>';
      if (now && prev) {
        const diff = +(now[m.key] - prev[m.key]).toFixed(1);
        if (diff === 0) deltaHtml = '<span class="sc-delta flat">— unchanged</span>';
        else {
          const arrow = diff > 0 ? '▲' : '▼';
          let cls = diff > 0 ? 'up' : 'down';
          if (m.lowerIsBetter === true) cls += diff > 0 ? '' : ' good';   // up=red default
          else if (m.lowerIsBetter === false) cls = diff > 0 ? 'up good' : 'down bad';
          else cls = 'flat';
          deltaHtml = `<span class="sc-delta ${cls}">${arrow} ${Math.abs(diff)} vs prev.</span>`;
        }
      }
      return `<div class="sum-card"><div class="sc-label">${m.label}</div><div class="sc-value">${v != null ? v + m.unit : '–'}</div>${deltaHtml}</div>`;
    }).join('');
  }

  function renderPeriodTables(entries) {
    const build = (curEntries, prevEntries, curLabel, prevLabel) => {
      const a = Burnout.averages(curEntries), b = Burnout.averages(prevEntries);
      const rows = [
        ['Check-ins', a ? a.n : 0, b ? b.n : 0, false],
        ['Avg burnout', a ? a.score : '–', b ? b.score : '–', true],
        ['Avg stress', a ? a.stress : '–', b ? b.stress : '–', true],
        ['Avg sleep (h)', a ? a.sleep : '–', b ? b.sleep : '–', false],
        ['Avg study (h)', a ? a.study : '–', b ? b.study : '–', null],
        ['Avg motivation', a ? a.motivation : '–', b ? b.motivation : '–', false]
      ];
      let html = `<tr><th>Metric</th><th>${curLabel}</th><th>${prevLabel}</th></tr>`;
      rows.forEach(([label, cur, prev, lowerBetter]) => {
        let cls = '';
        if (typeof cur === 'number' && typeof prev === 'number' && lowerBetter !== null && label !== 'Check-ins') {
          if (cur < prev) cls = lowerBetter ? 'delta-good' : 'delta-bad';
          else if (cur > prev) cls = lowerBetter ? 'delta-bad' : 'delta-good';
        }
        html += `<tr><td>${label}</td><td class="${cls}">${cur}</td><td>${prev}</td></tr>`;
      });
      return html;
    };

    const weekCur = entriesBetween(entries, 6, 0);
    const weekPrev = entriesBetween(entries, 13, 7);
    $('#weekly-table').innerHTML = build(weekCur, weekPrev, 'This week', 'Last week');

    const monCur = entriesBetween(entries, 29, 0);
    const monPrev = entriesBetween(entries, 59, 30);
    $('#monthly-table').innerHTML = build(monCur, monPrev, 'This month', 'Last month');
  }

  function renderBehaviorChanges(now, prev) {
    const box = $('#behavior-changes');
    if (!now || !prev) {
      box.innerHTML = '<div class="bc-item neutral"><i class="fa-solid fa-circle-info"></i> Keep checking in — behavior-change insights appear once you have data across two periods.</div>';
      return;
    }
    const items = [];
    const d = (k) => +(now[k] - prev[k]).toFixed(1);
    if (d('score') >= 8) items.push({ cls: 'bad', icon: 'fa-arrow-trend-up', text: `Burnout risk rose by ${d('score')} points versus the previous period — an early warning sign.` });
    if (d('score') <= -8) items.push({ cls: 'good', icon: 'fa-arrow-trend-down', text: `Burnout risk dropped by ${Math.abs(d('score'))} points — your habits are improving.` });
    if (d('sleep') <= -0.8) items.push({ cls: 'bad', icon: 'fa-bed', text: `You are sleeping ${Math.abs(d('sleep'))}h less on average than before.` });
    if (d('sleep') >= 0.8) items.push({ cls: 'good', icon: 'fa-bed', text: `Sleep improved by ${d('sleep')}h on average. Great recovery habit!` });
    if (d('stress') >= 1) items.push({ cls: 'bad', icon: 'fa-bolt', text: `Average stress increased by ${d('stress')} points.` });
    if (d('stress') <= -1) items.push({ cls: 'good', icon: 'fa-spa', text: `Average stress decreased by ${Math.abs(d('stress'))} points.` });
    if (d('study') >= 1.5) items.push({ cls: 'neutral', icon: 'fa-book-open', text: `Study time is up ${d('study')}h/day — make sure rest keeps pace.` });
    if (d('motivation') <= -1.5) items.push({ cls: 'bad', icon: 'fa-battery-quarter', text: `Motivation fell by ${Math.abs(d('motivation'))} points — a common precursor of burnout.` });
    if (d('motivation') >= 1.5) items.push({ cls: 'good', icon: 'fa-rocket', text: `Motivation is up ${d('motivation')} points!` });
    if (!items.length) items.push({ cls: 'neutral', icon: 'fa-equals', text: 'Your behavior has been stable compared with the previous period.' });
    box.innerHTML = items.map(i => `<div class="bc-item ${i.cls}"><i class="fa-solid ${i.icon}"></i> ${i.text}</div>`).join('');
  }

  function bindAnalytics() {
    $$('.range-btn').forEach(btn => btn.addEventListener('click', () => {
      $$('.range-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      analyticsRange = parseInt(btn.dataset.range, 10);
      renderAnalytics();
    }));
  }

  /* ================= HISTORY ================= */
  function renderHistory() {
    const q = $('#history-search').value.trim().toLowerCase();
    const riskF = $('#history-filter-risk').value;
    const moodF = $('#history-filter-mood').value;

    let list = Storage.getEntries();
    if (q) {
      list = list.filter(e =>
        (e.notes || '').toLowerCase().includes(q) ||
        e.date.includes(q) ||
        formatDate(e.date).toLowerCase().includes(q)
      );
    }
    if (riskF) list = list.filter(e => e.category === riskF);
    if (moodF) list = list.filter(e => String(e.mood) === moodF);

    $('#history-empty').classList.toggle('hidden', list.length > 0);
    $('#history-list').innerHTML = list.map(e => {
      const d = new Date(e.date + 'T00:00:00');
      const riskCls = e.category === 'Healthy' ? 'risk-healthy' : e.category === 'Moderate Risk' ? 'risk-moderate' : 'risk-high';
      return `
      <div class="h-entry" data-id="${e.id}">
        <div class="h-date">
          <div class="hd-day">${d.getDate()}</div>
          <div class="hd-mon">${d.toLocaleDateString(undefined, { month: 'short' })} ${d.getFullYear()}</div>
        </div>
        <div class="h-body">
          <div class="h-meta">
            <span class="h-chip ${riskCls}">${e.category} · ${e.score}</span>
            <span class="h-chip">${MOOD_EMOJI[e.mood]} ${MOOD_LABEL[e.mood]}</span>
            <span class="h-chip"><i class="fa-solid fa-bolt"></i> Stress ${e.stress}/10</span>
            <span class="h-chip"><i class="fa-solid fa-bed"></i> ${e.sleep}h</span>
            <span class="h-chip"><i class="fa-solid fa-book-open"></i> ${e.study}h</span>
            <span class="h-chip"><i class="fa-solid fa-fire"></i> Motiv. ${e.motivation}/10</span>
          </div>
          ${e.notes ? `<p class="h-notes">"${escapeHtml(e.notes)}"</p>` : ''}
        </div>
        <button class="h-del" title="Delete this record" aria-label="Delete record"><i class="fa-solid fa-trash"></i></button>
      </div>`;
    }).join('');
  }

  function bindHistory() {
    $('#history-search').addEventListener('input', renderHistory);
    $('#history-filter-risk').addEventListener('change', renderHistory);
    $('#history-filter-mood').addEventListener('change', renderHistory);

    $('#history-list').addEventListener('click', (e) => {
      const btn = e.target.closest('.h-del');
      if (!btn) return;
      const id = btn.closest('.h-entry').dataset.id;
      if (confirm('Delete this check-in record permanently?')) {
        Storage.deleteEntry(id);
        renderHistory();
        renderDashboard();
        toast('Record deleted.', 'warning', 'fa-trash');
      }
    });

    $('#export-json').addEventListener('click', () => exportData('json'));
    $('#export-csv').addEventListener('click', () => exportData('csv'));
  }

  /* ================= EXPORT ================= */
  function exportData(format) {
    const entries = Storage.getEntries();
    if (!entries.length) { toast('No records to export yet.', 'warning', 'fa-circle-exclamation'); return; }
    const profile = Storage.getProfile();
    let blob, filename;

    if (format === 'json') {
      const payload = { exportedAt: new Date().toISOString(), profile, entries };
      blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      filename = `mindtrack-export-${Storage.todayStr()}.json`;
    } else {
      const headers = ['date', 'mood', 'mood_label', 'stress', 'sleep_hours', 'study_hours', 'motivation', 'burnout_score', 'category', 'notes'];
      const csvEscape = (v) => {
        const s = String(v == null ? '' : v);
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      };
      const rows = entries.map(e => [
        e.date, e.mood, MOOD_LABEL[e.mood], e.stress, e.sleep, e.study, e.motivation, e.score, e.category, e.notes || ''
      ].map(csvEscape).join(','));
      blob = new Blob([headers.join(',') + '\n' + rows.join('\n')], { type: 'text/csv' });
      filename = `mindtrack-export-${Storage.todayStr()}.csv`;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast(`Exported ${entries.length} records as ${format.toUpperCase()}.`, 'success', 'fa-download');
  }

  /* ================= ACHIEVEMENTS ================= */
  function renderAchievements() {
    const entries = Storage.getEntries();
    const { badges } = Achievements.evaluate(entries);
    const earnedCount = badges.filter(b => b.earned).length;
    $('#ach-progress-fill').style.width = Math.round((earnedCount / badges.length) * 100) + '%';
    $('#ach-progress-text').textContent = `${earnedCount} of ${badges.length} badges earned`;
    $('#badges-grid').innerHTML = badges.map(b => `
      <div class="badge-card ${b.earned ? '' : 'locked'}">
        <div class="b-icon"><i class="fa-solid ${b.icon}"></i></div>
        <h4>${b.name}</h4>
        <p>${b.desc}</p>
        ${b.earned ? `<span class="b-earned"><i class="fa-solid fa-check"></i> Earned ${new Date(b.earnedAt).toLocaleDateString()}</span>` : '<span class="b-earned" style="color:var(--text-muted);"><i class="fa-solid fa-lock"></i> Locked</span>'}
      </div>`).join('');
  }

  /* ================= HELPERS ================= */
  function destroyChart(key) {
    if (charts[key]) { charts[key].destroy(); charts[key] = null; }
  }

  function baseLineOptions(c, min, max, hideLegend = false) {
    return {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: hideLegend ? { display: false } : { labels: { color: c.text } } },
      scales: {
        x: axisX(c),
        y: { min, max, ticks: { color: c.text }, grid: { color: c.grid } }
      }
    };
  }

  function axisX(c) {
    return { ticks: { color: c.text, maxTicksLimit: 10, maxRotation: 0 }, grid: { display: false } };
  }

  function lastNDays(n, offset = 0) {
    const out = [];
    for (let i = n - 1 + offset; i >= offset; i--) out.push(Storage.todayStr(-i));
    return out;
  }

  function entriesBetween(entries, fromDaysAgo, toDaysAgo) {
    const from = Storage.todayStr(-fromDaysAgo);
    const to = Storage.todayStr(-toDaysAgo);
    return entries.filter(e => e.date >= from && e.date <= to);
  }

  function shortLabel(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function formatDate(dateStr) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function hexToRgba(hex, alpha) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function renderAll() {
    renderDashboard();
    renderAnalytics();
    renderHistory();
    renderAchievements();
    prepareCheckinForm();
  }

  /* ================= INIT ================= */
  document.addEventListener('DOMContentLoaded', () => {
    // Theme
    const theme = Storage.getTheme();
    document.documentElement.setAttribute('data-theme', theme);
    $('#theme-toggle i').className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    $('#theme-toggle').addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      Storage.saveTheme(next);
      applyTheme(next);
    });

    // Tabs + any [data-goto] buttons
    $$('.tab').forEach(t => t.addEventListener('click', () => switchView(t.dataset.view)));
    document.body.addEventListener('click', (e) => {
      const go = e.target.closest('[data-goto]');
      if (go) switchView(go.dataset.goto);
    });

    bindProfile();
    bindCheckin();
    bindAnalytics();
    bindHistory();

    checkProfile();
    renderAll();
  });
})();