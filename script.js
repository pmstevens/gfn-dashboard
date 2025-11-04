// script.js
let updateTimer = null;
if (typeof window.countdownInterval !== 'undefined' && window.countdownInterval) {
  clearInterval(window.countdownInterval);
}
window.countdownInterval = null;

// undo stack state (needed by pushUndoState / undo / setRemainingFromMinutes)
let _undoStack = [];
const _UNDO_LIMIT = 20;
let _suppressUndoPush = false;

function saveToLocalStorage() {
  const totalHours = document.getElementById("totalHours").value;
  const totalMinutes = document.getElementById("totalMinutes").value;
  const remainingHours = document.getElementById("remainingHours").value;
  const remainingMinutes = document.getElementById("remainingMinutes").value;
  const manualReset = document.getElementById("manualResetToggle").checked;
  const resetDay = document.getElementById("resetDay").value;
  const resetDate = document.getElementById("resetDate").value;
  const isDarkMode = document.body.classList.contains("dark-mode");

  localStorage.setItem("totalHours", totalHours);
  localStorage.setItem("totalMinutes", totalMinutes);
  localStorage.setItem("remainingHours", remainingHours);
  localStorage.setItem("remainingMinutes", remainingMinutes);
  localStorage.setItem("manualReset", manualReset);
  localStorage.setItem("resetDay", resetDay);
  localStorage.setItem("resetDate", resetDate);
  localStorage.setItem("darkMode", isDarkMode);
  localStorage.setItem("previousResetDate", resetDate); // Save previous reset date
}

function loadFromLocalStorage() {
  const totalHours = localStorage.getItem("totalHours");
  const totalMinutes = localStorage.getItem("totalMinutes");
  const remainingHours = localStorage.getItem("remainingHours");
  const remainingMinutes = localStorage.getItem("remainingMinutes");
  const manualReset = localStorage.getItem("manualReset") === "true";
  const resetDay = localStorage.getItem("resetDay");
  const resetDate = localStorage.getItem("resetDate");
  const isDarkMode = localStorage.getItem("darkMode") === "true";

  if (totalHours) document.getElementById("totalHours").value = totalHours;
  if (totalMinutes) document.getElementById("totalMinutes").value = totalMinutes;
  if (remainingHours) document.getElementById("remainingHours").value = remainingHours;
  if (remainingMinutes) document.getElementById("remainingMinutes").value = remainingMinutes;
  if (manualReset !== null) document.getElementById("manualResetToggle").checked = manualReset;
  if (resetDay) document.getElementById("resetDay").value = resetDay;
  if (resetDate) document.getElementById("resetDate").value = resetDate;

  if (isDarkMode) {
    document.body.classList.add("dark-mode");
    document.querySelectorAll(".inputs input").forEach(input => {
      input.classList.add("dark-mode");
    });
  }

  // Show advanced settings if previously enabled
  if (manualReset) {
    document.getElementById("advancedSettings").style.display = "block";
    document.getElementById("showAdvanced").textContent = "⚙️ Hide Advanced Settings";
  }
}

function getNextResetDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();
  const resetDay = parseInt(document.getElementById("resetDay").value);

  let resetMonth = month;
  let resetYear = year;

  if (day > resetDay) {
    resetMonth += 1;
    if (resetMonth > 11) {
      resetMonth = 0;
      resetYear += 1;
    }
  }

  const resetDate = new Date(resetYear, resetMonth, resetDay, 23, 59, 59);
  return resetDate;
}

function updateDashboard() {
  // Clear previous error and notification
  document.getElementById("errorMessage").style.display = "none";
  document.getElementById("errorMessage").textContent = "";
  document.getElementById("notification").style.display = "none";
  document.getElementById("notification").textContent = "";

  // Get input values
  const totalHours = parseFloat(document.getElementById("totalHours").value) || 0;
  const totalMinutes = parseFloat(document.getElementById("totalMinutes").value) || 0;
  const remainingHours = parseFloat(document.getElementById("remainingHours").value) || 0;
  const remainingMinutes = parseFloat(document.getElementById("remainingMinutes").value) || 0;
  const manualReset = document.getElementById("manualResetToggle").checked;
  const resetDay = parseInt(document.getElementById("resetDay").value);
  const resetDateInput = document.getElementById("resetDate").value;

  // Validate inputs
  let isValid = true;

  if (totalHours < 0 || totalMinutes < 0 || remainingHours < 0 || remainingMinutes < 0) {
    document.getElementById("errorMessage").textContent = "❌ Error: Cannot enter negative values.";
    document.getElementById("errorMessage").style.display = "block";
    isValid = false;
  }

  const total = totalHours + (totalMinutes / 60);
  const remaining = remainingHours + (remainingMinutes / 60);
  if (remaining > total) {
    document.getElementById("errorMessage").textContent = "❌ Error: Remaining hours cannot exceed total hours.";
    document.getElementById("errorMessage").style.display = "block";
    isValid = false;
  }

  if (manualReset) {
    const resetDate = new Date(resetDateInput);
    if (isNaN(resetDate)) {
      document.getElementById("errorMessage").textContent = "❌ Error: Invalid date format.";
      document.getElementById("errorMessage").style.display = "block";
      isValid = false;
    } else if (resetDate < new Date()) {
      document.getElementById("errorMessage").textContent = "❌ Error: Reset date cannot be in the past.";
      document.getElementById("errorMessage").style.display = "block";
      isValid = false;
    }
  }

  if (!isValid) return;

  // Save current values to localStorage
  saveToLocalStorage();

  // Calculate dynamic reset date
  let resetDate = new Date();
  if (manualReset) {
    resetDate = new Date(resetDateInput);
  } else {
    resetDate = getNextResetDate();
  }

  document.getElementById("resetDateDisplay").textContent = `📅 Reset Date: ${resetDate.toISOString().split('T')[0]}`;

  // Check for reset date change
  const previousResetDate = localStorage.getItem("previousResetDate");
  if (previousResetDate !== resetDate.toISOString().split('T')[0]) {
    document.getElementById("notification").textContent = "⚠️ Reset date changed. Update total and remaining hours for the new period.";
    document.getElementById("notification").style.display = "block";
  }

  // Convert to total hours
  const used = total - remaining;

  // Calculate percentages (guard total==0)
  let usedPercentage = 0;
  if (total > 0) {
    usedPercentage = (used / total) * 100;
  }
  usedPercentage = Number.isFinite(usedPercentage) ? Math.min(100, Math.max(0, usedPercentage)) : 0;
  const remainingPercentage = 100 - usedPercentage;

  const progressBar = document.getElementById("progressBar");
  const progressLabel = document.getElementById("progressLabel");

  // Update progress bar and label
  progressBar.style.width = `${usedPercentage}%`;
  progressLabel.textContent = `${usedPercentage.toFixed(1)}%`;

  // Accessibility attributes
  progressBar.setAttribute("role", "progressbar");
  progressBar.setAttribute("aria-valuemin", "0");
  progressBar.setAttribute("aria-valuemax", "100");
  progressBar.setAttribute("aria-valuenow", usedPercentage.toFixed(1));
  progressBar.setAttribute("aria-valuetext", `${usedPercentage.toFixed(1)} percent used`);

  // Ensure label contrast (use CSS classes and CSS variables instead of inline styles)
  const isDarkMode = document.body.classList.contains("dark-mode");
  // clear any inline styles (we rely on CSS now)
  progressLabel.style.color = "";
  progressLabel.style.textShadow = "";
  // for light theme switch to a white label when the fill is >50%
  if (!isDarkMode && usedPercentage > 50) {
    progressLabel.classList.add("on-fill");
  } else {
    progressLabel.classList.remove("on-fill");
  }

  // --- Add month progress marker (how far we are through the period) ---
  (function() {
    if (!progressBar) return;
    const container = progressBar.parentElement;
    if (!container) return;

    if (getComputedStyle(container).position === "static") {
      container.style.position = "relative";
    }

    // Use current resetDate minus one month as start of period
    const prevReset = new Date(resetDate);
    prevReset.setMonth(prevReset.getMonth() - 1);

    const rangeStart = new Date(prevReset.getFullYear(), prevReset.getMonth(), prevReset.getDate(), 0, 0, 0);
    const rangeEnd = new Date(resetDate.getFullYear(), resetDate.getMonth(), resetDate.getDate(), 0, 0, 0);

    const now = new Date();
    const totalMs = rangeEnd - rangeStart;
    const elapsedMs = now - rangeStart;
    let monthPercent = 0;
    if (totalMs > 0) {
      monthPercent = (elapsedMs / totalMs) * 100;
    }
    monthPercent = Number.isFinite(monthPercent) ? Math.min(100, Math.max(0, monthPercent)) : 0;

    let marker = container.querySelector("#monthMarker");
    if (!marker) {
      marker = document.createElement("div");
      marker.id = "monthMarker";
      marker.className = "month-marker";
      container.appendChild(marker);
    }
    // set left via percent; CSS transition added for smooth movement
    marker.style.left = `${monthPercent}%`;
    marker.title = `Period progress: ${monthPercent.toFixed(1)}%`;
  })();
  // --- end marker code ---

  // Format used time
  const usedHoursInt = Math.floor(used);
  const usedMinutesInt = Math.round((used - usedHoursInt) * 60);
  document.getElementById("usedTime").textContent = `✅ Used: ${usedHoursInt}h ${usedMinutesInt}m`;

  // Format remaining time
  const remainingHoursInt = Math.floor(remaining);
  const remainingMinutesInt = Math.round((remaining - remainingHoursInt) * 60);
  document.getElementById("remainingTime").textContent = `⏳ Remaining: ${remainingHoursInt}h ${remainingMinutesInt}m`;

  // Hours/Day Counter (guard daysLeft <= 0)
  const nowForDays = new Date();
  const timeDiff = resetDate - nowForDays;
  const daysLeft = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  if (daysLeft <= 0) {
    document.getElementById("hoursPerDay").textContent = `⏳ Max Hours/Day: —`;
  } else {
    const hoursPerDay = (remaining / daysLeft);
    const hoursPerDayHours = Math.floor(hoursPerDay);
    const hoursPerDayMinutes = Math.round((hoursPerDay - hoursPerDayHours) * 60);
    document.getElementById("hoursPerDay").textContent = `⏳ Max Hours/Day: ${hoursPerDayHours}h ${hoursPerDayMinutes}m`;
  }

  // Countdown timer (clear previous interval, set single interval)
  function updateCountdown() {
    const now = new Date();
    const timeDiff = resetDate - now;

    if (timeDiff < 0) {
      document.getElementById("countdown").textContent = "📅 Reset has passed!";
      return;
    }

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    document.getElementById("countdown").textContent = `📅 Reset in: ${days}d ${hours}h ${minutes}m ${seconds}s`;

    if (timeDiff < 24 * 60 * 60 * 1000) {
      document.getElementById("notification").textContent = "⚠️ Reset is approaching!";
      document.getElementById("notification").style.display = "block";
    } else {
      document.getElementById("notification").style.display = "none";
    }
  }

  if (window.countdownInterval) {
    clearInterval(window.countdownInterval);
  }
  window.countdownInterval = setInterval(updateCountdown, 1000);
  updateCountdown();

  // Ensure Twemoji parses any newly-updated emoji text for these elements
  if (window.twemoji && window.twemoji.parse) {
    const parseOpts = {
      base: window.twemojiBase || undefined,
      folder: 'svg',
      ext: '.svg',
      attributes: () => ({ width: '1em', height: '1em', class: 'emoji' })
    };
    [
      document.getElementById('resetDateDisplay'),
      document.getElementById('usedTime'),
      document.getElementById('remainingTime'),
      document.getElementById('progressLabel'),
      document.getElementById('countdown'),
      document.getElementById('notification'),
      document.getElementById('hoursPerDay')
    ].forEach(el => { if (el) window.twemoji.parse(el, parseOpts); });
  }
}

// Quick Adjust helpers (compact remaining-hours controls)
function _normalizeRemaining(totalMinutes) {
  if (totalMinutes < 0) totalMinutes = 0;
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: Math.round(totalMinutes % 60)
  };
}

function getCurrentRemainingMinutes() {
  const rh = parseInt(document.getElementById("remainingHours").value) || 0;
  const rm = parseInt(document.getElementById("remainingMinutes").value) || 0;
  return rh * 60 + rm;
}

function updateQuickAdjustDisplay() {
  const mins = getCurrentRemainingMinutes();
  const t = _normalizeRemaining(mins);
  const qa = document.getElementById("qaRemaining");
  if (qa) qa.textContent = `${t.hours}h ${t.minutes}m`;
  const remainingTime = document.getElementById("remainingTime");
  if (remainingTime) remainingTime.textContent = `⏳ Remaining: ${t.hours}h ${t.minutes}m`;
}

// add this function
function pushUndoState() {
  try {
    const current = getCurrentRemainingMinutes();
    // avoid pushing duplicates
    const top = _undoStack.length ? _undoStack[_undoStack.length - 1] : null;
    if (top === current) return;
    _undoStack.push(current);
    if (_undoStack.length > _UNDO_LIMIT) _undoStack.shift();
  } catch (e) { /* ignore */ }
}

function undo() {
  if (!_undoStack.length) return;
  // pop current (top), then pop previous (the value to restore)
  const current = _undoStack.pop();
  const prev = _undoStack.pop();
  if (typeof prev === "number") {
    _suppressUndoPush = true;
    setRemainingFromMinutes(prev);
    _suppressUndoPush = false;
    // after undo, push restored value as a new top so user can redo via manual pushes if needed
    _undoStack.push(prev);
  } else if (typeof current === "number") {
    // fallback: restore current if no previous exists
    _suppressUndoPush = true;
    setRemainingFromMinutes(current);
    _suppressUndoPush = false;
    _undoStack.push(current);
  }
}

// update setRemainingFromMinutes to push undo state before change (unless suppressed)
function setRemainingFromMinutes(totalMinutes) {
  if (!_suppressUndoPush) pushUndoState();
  const t = _normalizeRemaining(totalMinutes);
  document.getElementById("remainingHours").value = t.hours;
  document.getElementById("remainingMinutes").value = t.minutes;
  saveToLocalStorage();
  updateDashboard();
  updateQuickAdjustDisplay();
}

// attach handlers (call this during initialization)
function initQuickAdjust() {
  const plus30 = document.getElementById("qaPlus30");
  const plus60 = document.getElementById("qaPlus60");
  const minus30 = document.getElementById("qaMinus30");
  const minus60 = document.getElementById("qaMinus60");
  const edit = document.getElementById("qaEdit");
  const panel = document.getElementById("qaEditPanel");
  const save = document.getElementById("qaSave");
  const cancel = document.getElementById("qaCancel");
  const qaHours = document.getElementById("qaHours");
  const qaMinutes = document.getElementById("qaMinutes");

  if (plus30) plus30.addEventListener("click", () => setRemainingFromMinutes(getCurrentRemainingMinutes() + 30));
  if (plus60) plus60.addEventListener("click", () => setRemainingFromMinutes(getCurrentRemainingMinutes() + 60));
  if (minus30) minus30.addEventListener("click", () => setRemainingFromMinutes(getCurrentRemainingMinutes() - 30));
  if (minus60) minus60.addEventListener("click", () => setRemainingFromMinutes(getCurrentRemainingMinutes() - 60));

  if (edit) edit.addEventListener("click", () => {
    if (!panel) return;
    panel.hidden = false;
    const mins = getCurrentRemainingMinutes();
    const t = _normalizeRemaining(mins);
    qaHours.value = t.hours;
    qaMinutes.value = t.minutes;
    qaHours.focus();
  });

  if (cancel) cancel.addEventListener("click", () => { if (panel) panel.hidden = true; });

  if (save) save.addEventListener("click", () => {
    const h = Math.max(0, parseInt(qaHours.value) || 0);
    const m = Math.max(0, Math.min(59, parseInt(qaMinutes.value) || 0));
    setRemainingFromMinutes(h * 60 + m);
    if (panel) panel.hidden = true;
  });

  // initial display
  updateQuickAdjustDisplay();

  // Keyboard shortcuts for quick adjust (registered once)
  document.addEventListener("keydown", (e) => {
    // don't trigger while typing in inputs
    const active = document.activeElement;
    if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable)) {
      // allow Ctrl+Z undo even when typing
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      }
      return;
    }

    // Ctrl+Shift+1..4 for quick adjust:
    if (e.ctrlKey && e.shiftKey && !e.altKey) {
      switch (e.key) {
        case "1": // -1h
          e.preventDefault();
          setRemainingFromMinutes(getCurrentRemainingMinutes() - 60);
          return;
        case "2": // -30m
          e.preventDefault();
          setRemainingFromMinutes(getCurrentRemainingMinutes() - 30);
          return;
        case "3": // +30m
          e.preventDefault();
          setRemainingFromMinutes(getCurrentRemainingMinutes() + 30);
          return;
        case "4": // +1h
          e.preventDefault();
          setRemainingFromMinutes(getCurrentRemainingMinutes() + 60);
          return;
        case "e": // open edit panel
        case "E":
          e.preventDefault();
          if (panel) {
            panel.hidden = false;
            const mins = getCurrentRemainingMinutes();
            const t = _normalizeRemaining(mins);
            qaHours.value = t.hours;
            qaMinutes.value = t.minutes;
            qaHours.focus();
          }
          return;
      }
    }

    // Ctrl+Z / Cmd+Z for undo
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "z") {
      e.preventDefault();
      undo();
    }
  });
}

// Attach UI handlers after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const darkModeToggle = document.getElementById("darkModeToggle");
  if (darkModeToggle) {
    darkModeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      document.querySelectorAll(".inputs input").forEach(input => input.classList.toggle("dark-mode"));
    });
  }

  const manualResetToggle = document.getElementById("manualResetToggle");
  if (manualResetToggle) {
    manualResetToggle.addEventListener("change", () => {
      const manualReset = document.getElementById("manualResetToggle").checked;
      const rd = document.getElementById("resetDate");
      const rday = document.getElementById("resetDay");
      if (rd) rd.disabled = !manualReset;
      if (rday) rday.disabled = manualReset;
    });
  }

  const showAdvanced = document.getElementById("showAdvanced");
  if (showAdvanced) {
    showAdvanced.addEventListener("click", () => {
      const advancedSettings = document.getElementById("advancedSettings");
      if (!advancedSettings) return;
      if (advancedSettings.style.display === "none" || !advancedSettings.style.display) {
        advancedSettings.style.display = "block";
        showAdvanced.textContent = "⚙️ Hide Advanced Settings";
      } else {
        advancedSettings.style.display = "none";
        showAdvanced.textContent = "⚙️ Show Advanced Settings";
      }
    });
  }

  const clearAll = document.getElementById("clearAll");
  if (clearAll) {
    clearAll.addEventListener("click", () => {
      const setIf = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
      setIf("totalHours", "100");
      setIf("totalMinutes", "0");
      setIf("remainingHours", "94");
      setIf("remainingMinutes", "25");
      setIf("resetDay", "25");
      setIf("resetDate", "2025-11-25");
      updateDashboard();
      localStorage.clear();
    });
  }
});

// Load saved values on page load
window.onload = function () {
  loadFromLocalStorage();
  updateDashboard();
  if (typeof initQuickAdjust === "function") initQuickAdjust();

  // Register service worker (required for install prompt & offline)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.warn('SW registration failed:', err));
  }
};

// ensure Twemoji parses any newly-updated emoji text (buttons were parsed earlier)
if (window.twemoji && window.twemoji.parse) {
  const parseOpts = {
    base: window.twemojiBase || undefined,
    folder: 'svg',
    ext: '.svg',
    attributes: function () { return { width: '1em', height: '1em', class: 'emoji' }; }
  };
  [
    document.getElementById('resetDateDisplay'),
    document.getElementById('usedTime'),
    document.getElementById('remainingTime'),
    document.getElementById('progressLabel'),
    document.getElementById('countdown'),
    document.getElementById('notification')
  ].forEach(el => { if (el) window.twemoji.parse(el, parseOpts); });
}