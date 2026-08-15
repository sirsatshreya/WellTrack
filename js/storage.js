/* ============================================================
   storage.js — LocalStorage data layer for WellTrack
   Profile:
     { name, email, course, className, createdAt }

   Entries:
     {
       id,
       date,
       mood,
       stress,
       sleep,
       study,
       motivation,
       notes,
       score,
       category,
       createdAt,
       updatedAt
     }

   Other:
     welltrack_achievements -> { badgeId: earnedTimestamp }
     welltrack_theme        -> "light" | "dark"
   ============================================================ */

const Storage = (() => {

  const KEYS = {
    profile: 'welltrack_profile',
    entries: 'welltrack_entries',
    achievements: 'welltrack_achievements',
    theme: 'welltrack_theme'
  };

  /* ==========================================================
     GENERIC STORAGE HELPERS
     ========================================================== */

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn('Storage read failed for:', key, e);
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage write failed for:', key, e);
      return false;
    }
  }

  /* ==========================================================
     PROFILE
     
     Profile structure:
     {
       name: "Shreya",
       email: "example@gmail.com",
       course: "B.Tech IT",
       className: "2nd Year",
       createdAt: timestamp
     }
     ========================================================== */

  function getProfile() {
    return read(KEYS.profile, null);
  }

  function saveProfile(profile) {
    const existingProfile = getProfile();

    const data = {
      name: profile.name || '',
      email: profile.email || '',
      course: profile.course || '',
      className: profile.className || '',
      createdAt:
        existingProfile?.createdAt ||
        profile.createdAt ||
        Date.now()
    };

    return write(KEYS.profile, data);
  }

  /* ==========================================================
     THEME
     ========================================================== */

  function getTheme() {
    return read(KEYS.theme, 'dark');
  }

  function saveTheme(theme) {
    return write(KEYS.theme, theme);
  }

  /* ==========================================================
     ENTRIES
     ========================================================== */

  function getEntries() {
    const list = read(KEYS.entries, []);

    if (!Array.isArray(list)) {
      return [];
    }

    // Always return newest entries first
    return list.sort((a, b) => {
      return String(b.date).localeCompare(String(a.date));
    });
  }

  function getEntryByDate(dateStr) {
    return getEntries().find(entry => entry.date === dateStr) || null;
  }

  /*
    Insert or update one check-in per calendar day.
  */

  function upsertEntry(entry) {

    const list = read(KEYS.entries, []);

    if (!Array.isArray(list)) {
      return null;
    }

    const index = list.findIndex(
      existingEntry => existingEntry.date === entry.date
    );

    const now = Date.now();

    if (index >= 0) {

      // Preserve original ID and creation time
      entry.id = list[index].id;
      entry.createdAt = list[index].createdAt;
      entry.updatedAt = now;

      list[index] = entry;

    } else {

      entry.id =
        'e_' +
        now +
        '_' +
        Math.random().toString(36).slice(2, 8);

      entry.createdAt = now;
      entry.updatedAt = now;

      list.push(entry);
    }

    write(KEYS.entries, list);

    return entry;
  }

  /* ==========================================================
     DELETE ENTRY
     ========================================================== */

  function deleteEntry(id) {

    const list = read(KEYS.entries, []);

    if (!Array.isArray(list)) {
      return false;
    }

    const filtered = list.filter(
      entry => entry.id !== id
    );

    return write(KEYS.entries, filtered);
  }

  /* ==========================================================
     ACHIEVEMENTS
     ========================================================== */

  function getAchievements() {
    return read(KEYS.achievements, {});
  }

  function saveAchievements(achievements) {
    return write(KEYS.achievements, achievements);
  }

  /* ==========================================================
     RESET ALL DATA
     ========================================================== */

  function resetAll() {

    Object.values(KEYS).forEach(key => {
      localStorage.removeItem(key);
    });

    return true;
  }

  /* ==========================================================
     DATE HELPERS
     ========================================================== */

  function todayStr(offsetDays = 0) {

    const date = new Date();

    date.setDate(
      date.getDate() + offsetDays
    );

    return toDateStr(date);
  }

  function toDateStr(date) {

    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      date.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /* ==========================================================
     PUBLIC API
     ========================================================== */

  return {

    // Profile
    getProfile,
    saveProfile,

    // Theme
    getTheme,
    saveTheme,

    // Check-ins
    getEntries,
    getEntryByDate,
    upsertEntry,
    deleteEntry,

    // Achievements
    getAchievements,
    saveAchievements,

    // Reset
    resetAll,

    // Dates
    todayStr,
    toDateStr

  };

})();
