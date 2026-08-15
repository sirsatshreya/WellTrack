/* ============================================================
   storage.js — LocalStorage data layer for MindTrack
   Keys:
     mindtrack_profile      -> {name, course, year, studyGoal, createdAt}
     mindtrack_entries      -> [ {id, date(YYYY-MM-DD), mood, stress, sleep,
                                  study, motivation, notes, score, category,
                                  createdAt, updatedAt} ]
     mindtrack_achievements -> { badgeId: earnedTimestamp }
     mindtrack_theme        -> "light" | "dark"
   ============================================================ */

const Storage = (() => {
  const KEYS = {
    profile: 'mindtrack_profile',
    entries: 'mindtrack_entries',
    achievements: 'mindtrack_achievements',
    theme: 'mindtrack_theme'
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn('Storage read failed for', key, e);
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage write failed for', key, e);
      return false;
    }
  }

  /* ---------- Profile ---------- */
  const getProfile = () => read(KEYS.profile, null);
  const saveProfile = (p) => write(KEYS.profile, p);

  /* ---------- Theme ---------- */
  const getTheme = () => read(KEYS.theme, 'light');
  const saveTheme = (t) => write(KEYS.theme, t);

  /* ---------- Entries ---------- */
  function getEntries() {
    const list = read(KEYS.entries, []);
    // always sorted newest first
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }

  function getEntryByDate(dateStr) {
    return getEntries().find(e => e.date === dateStr) || null;
  }

  /** Insert or update (one entry per calendar day). Returns the saved entry. */
  function upsertEntry(entry) {
    const list = read(KEYS.entries, []);
    const idx = list.findIndex(e => e.date === entry.date);
    const now = Date.now();
    if (idx >= 0) {
      entry.id = list[idx].id;
      entry.createdAt = list[idx].createdAt;
      entry.updatedAt = now;
      list[idx] = entry;
    } else {
      entry.id = 'e_' + now + '_' + Math.random().toString(36).slice(2, 8);
      entry.createdAt = now;
      entry.updatedAt = now;
      list.push(entry);
    }
    write(KEYS.entries, list);
    return entry;
  }

  function deleteEntry(id) {
    const list = read(KEYS.entries, []).filter(e => e.id !== id);
    write(KEYS.entries, list);
  }

  /* ---------- Achievements ---------- */
  const getAchievements = () => read(KEYS.achievements, {});
  const saveAchievements = (a) => write(KEYS.achievements, a);

  /* ---------- Reset ---------- */
  function resetAll() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  }

  /* ---------- Date helpers ---------- */
  function todayStr(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return toDateStr(d);
  }

  function toDateStr(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  return {
    getProfile, saveProfile,
    getTheme, saveTheme,
    getEntries, getEntryByDate, upsertEntry, deleteEntry,
    getAchievements, saveAchievements,
    resetAll, todayStr, toDateStr
  };
})();