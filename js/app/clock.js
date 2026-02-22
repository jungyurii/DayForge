export function initClock() {
  const clock = document.querySelector("#clock");
  const clockDate = document.querySelector("#clock-date");
  if (!clock) return;

  function tick() {
    const now = new Date();

    // Time
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    clock.textContent = `${hh}:${mm}:${ss}`;

    // Date
    if (clockDate) {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      clockDate.textContent = `${y}-${m}-${d}`;
    }
  }

  tick();
  setInterval(tick, 1000);
}