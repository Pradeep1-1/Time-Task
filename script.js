"use strict";

// Calendar labels are kept in arrays so the IST date parts can be rendered by index.
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const clockLabels = ["hours", "minutes", "seconds", "day", "date", "week", "period"];
const timeZone = "Asia/Kolkata";

// Build the display map from labels with map() and Object.fromEntries().
const display = Object.fromEntries(clockLabels.map((label) => [label, document.getElementById(label)]));
display.progress = document.getElementById("seconds-progress");

// Intl gives calendar and clock values in IST even when the computer uses another zone.
const istFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/** Convert Intl's ordered parts into a convenient named object. */
const getIstParts = (instant) => Object.fromEntries(
  istFormatter.formatToParts(instant)
    .filter(({ type }) => type !== "literal")
    .map(({ type, value }) => [type, value]),
);

/** Return the ISO-8601 week number for a Gregorian calendar date. */
const getIsoWeekNumber = (year, month, day) => {
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay() || 7; // ISO weeks start on Monday; Sunday is day 7.
  date.setUTCDate(date.getUTCDate() + 4 - weekday); // Thursday determines the ISO week-year.
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
};

/** Update only values that changed, keeping the one-second UI refresh light. */
const updateClock = () => {
  const parts = getIstParts(new Date());
  const { year, month, day, hour, minute, second } = parts;
  const numericHour = Number(hour);
  const monthIndex = Number(month) - 1;

  const calendar = {
    dayName: dayNames[new Date(Date.UTC(Number(year), monthIndex, Number(day))).getUTCDay()],
    monthName: monthNames[monthIndex],
    isoWeek: getIsoWeekNumber(Number(year), Number(month), Number(day)),
    period: numericHour >= 12 ? "PM" : "AM",
    displayHour: String((numericHour % 12) || 12).padStart(2, "0"),
  };

  const values = {
    hours: calendar.displayHour,
    minutes: minute,
    seconds: second,
    day: calendar.dayName,
    date: `${calendar.monthName} ${Number(day)}, ${year}`,
    week: String(calendar.isoWeek).padStart(2, "0"),
    period: calendar.period,
  };

  // find() locates the one live counter; forEach() applies changed values consistently.
  const liveSecond = Object.entries(values).find(([key]) => key === "seconds");
  if (liveSecond) display.seconds.dataset.current = liveSecond[1];
  Object.entries(values).forEach(([key, value]) => {
    if (display[key].textContent !== value) display[key].textContent = value;
  });
  display.progress.style.width = `${((Number(second) + 1) / 60) * 100}%`;
};

// Start immediately and keep a single timer alive for the page.
updateClock();
const clockTimer = window.setInterval(updateClock, 1000);
window.addEventListener("pagehide", () => window.clearInterval(clockTimer), { once: true });
