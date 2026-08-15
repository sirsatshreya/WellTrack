# WellTrack — Student Burnout Detection & Well-Being Monitoring System

A fully client-side web application that helps students track their daily mental and academic well-being, detect early signs of burnout, and build healthier study routines. **All data is stored privately in the browser via LocalStorage — nothing is uploaded to any server.**

## 🎯 Project Goals

* Help students understand their current mental and emotional well-being
* Detect rising stress levels and burnout risk *early*
* Monitor sleep, study habits, and motivation trends over time
* Provide actionable, personalized recommendations
* Encourage consistency through streaks and achievements

## ✅ Currently Completed Features

### 1. User Profile Management

* First-visit onboarding modal with name, course/program, academic year, and daily study goal
* Editable profile through the top-bar user button
* "Reset All Data" option with confirmation

### 2. Daily Well-Being Check-In

* Mood with a 5-point emoji scale
* Stress with a 1–10 slider
* Motivation with a 1–10 slider
* Sleep hours
* Study hours
* Optional free-text notes
* One entry per calendar day
* Re-submitting updates today's entry and pre-fills the existing data

### 3. Burnout Risk Assessment (0–100 Score)

The weighted burnout score is calculated instantly when a check-in is saved:

| Factor         | Max Points | Logic                                            |
| -------------- | ---------: | ------------------------------------------------ |
| Stress         |         30 | Linear from stress 1→10                          |
| Mood           |         20 | Lower mood = more points                         |
| Motivation     |         20 | Lower motivation = more points                   |
| Sleep          |         20 | Deviation from healthy 7–9 hour band, 5 pts/hour |
| Study Overload |         10 | 2.5 pts per hour above 8 hours/day               |

**Risk Categories:**

* **Healthy:** 0–39
* **Moderate Risk:** 40–64
* **High Risk:** 65–100

### 4. Dashboard

* Semi-circular burnout gauge displaying score and category
* High/Moderate risk alert banner
* Today's snapshot showing mood, stress, sleep, study, motivation, and total check-ins
* Personalized recommendations based on rules and trends, with up to 6 recommendations
* 14-day burnout mini trend chart
* Progress card showing:

  * Current streak
  * Longest streak
  * Total check-ins
  * 30-day consistency
  * Last 7 days of check-in activity

### 5. Analytics & Trend Monitoring

* Selectable analysis range: 7 / 30 / 90 days
* Summary cards with changes compared with the previous equal period
* Color-coded positive/negative changes
* Four Chart.js visualizations:

  * Burnout trend with risk-colored points
  * Mood & motivation dual-axis chart
  * Sleep vs. study bar chart
  * Stress trend line
* Weekly comparison: this week vs. last week
* Monthly comparison: this month vs. last month
* Automatic behavior-change insights such as "sleeping 1.2h less than before"

### 6. Recommendations & Notifications

The recommendation system includes rules for:

* High stress
* Sleep deprivation or excessive sleep
* Study overload
* Low motivation
* Low mood
* Rising or falling burnout
* Three or more consecutive short-sleep days
* Sustained high stress

A toast notification appears whenever a saved check-in reaches the **High Risk** category.

### 7. History Management

* Complete record history with date cards and metric chips
* Free-text search across notes and dates
* Filter by risk category
* Filter by mood
* Individual record deletion with confirmation

### 8. Progress Tracking

* Current streak
* Longest streak
* 30-day consistency percentage
* Streak tracking that survives until a full missed day

### 9. Achievement System — 14 Badges

WellTrack includes 14 achievement badges:

* First Step
* Getting Started — 5 check-ins
* Committed — 20 check-ins
* Half Century — 50 check-ins
* 3-Day Streak
* 7-Day Streak
* 14-Day Streak
* 30-Day Streak
* Sleep Champion
* Zen Mode
* Balanced Week
* Comeback Kid
* Fired Up
* Reflective Mind

Each achievement includes an unlock notification and earned date.

### 10. Data Export

Users can export their WellTrack data directly from the browser in:

* **JSON** — includes profile, all entries, and export timestamp
* **CSV** — includes properly quoted and escaped records

Both formats are downloaded completely client-side.

## ✨ Extras

* Light/Dark theme toggle with persistent preference
* Fully responsive design
* Mobile verified
* Accessible semantics using ARIA roles and labels
* Privacy note
* Non-diagnostic disclaimer in the footer

## 🔗 Functional Entry Points

| Path                      | Description                                |
| ------------------------- | ------------------------------------------ |
| `index.html`              | Main single-page application               |
| `index.html#dashboard`    | Dashboard view                             |
| `index.html#checkin`      | Daily check-in form                        |
| `index.html#analytics`    | Trends and summaries                       |
| `index.html#history`      | Search, filter, delete, and export records |
| `index.html#achievements` | Badges and progress                        |

**No server endpoints are used — WellTrack is 100% static and client-side.**

## 🗄️ Data Model — LocalStorage

| Key                      | Content                                                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `welltrack_profile`      | `{name, course, year, studyGoal, createdAt}`                                                                                                         |
| `welltrack_entries`      | Array of `{id, date (YYYY-MM-DD), mood (1–5), stress (1–10), sleep, study, motivation (1–10), notes, score (0–100), category, createdAt, updatedAt}` |
| `welltrack_achievements` | `{badgeId: earnedTimestamp}`                                                                                                                         |
| `welltrack_theme`        | `"light"` | `"dark"`                                                                                                                                 |

## 📁 Project Structure

```text
index.html              — App shell, all views, and modals
css/style.css           — Light/dark themes and responsive layout
js/storage.js           — LocalStorage data layer and date helpers
js/burnout.js           — Scoring model, categories, and recommendation engine
js/achievements.js      — Streaks, consistency, and badge evaluation
js/app.js               — UI controller, Chart.js rendering, history, and export
```

## 📚 Libraries

The project uses the following libraries through CDN:

* **Chart.js 4** — Data visualization and charts
* **Font Awesome 6** — Icons
* **Google Fonts Inter** — Typography

## 🚧 Features Not Yet Implemented

* Browser push reminders for daily check-ins
* Multi-profile support on one device
* Data import for restoring JSON exports
* PDF report generation

## 💡 Recommended Next Steps

1. Add JSON **import** functionality to complement data export and enable backup/restore
2. Add optional daily reminders using the Notifications API
3. Add correlation insights, such as sleep vs. next-day mood
4. Add a PWA manifest and service worker for offline installation on mobile devices

## 🚀 Deployment

WellTrack can be published as a static website using the **Publish** tab and deployed with one click.

> ⚠️ **Disclaimer:** WellTrack is a self-monitoring and educational tool, **not a medical diagnostic instrument**. Students experiencing persistent distress should consider contacting a counselor or qualified mental-health professional.
