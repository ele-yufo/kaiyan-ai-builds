/**
 * Show week.note under the hero theme. Load AFTER js/app.js.
 */
(function () {
  async function apply() {
    const noteEl = document.getElementById("hero-note");
    if (!noteEl) return;
    try {
      const sel = document.getElementById("week-select");
      const id = sel && sel.value;
      if (!id) return;
      const base = (function () {
        const loc = window.location.href.replace(/[#?].*$/, "");
        const dir = loc.endsWith("/") ? loc : loc.replace(/\/[^/]*$/, "/");
        return dir + "content/weeks/";
      })();
      const week = await fetch(base + id + ".json").then((r) => r.json());
      if (week && week.note) {
        noteEl.textContent = week.note;
        noteEl.hidden = false;
      } else {
        noteEl.textContent = "";
        noteEl.hidden = true;
      }
    } catch (e) {
      console.warn("hero-note", e);
    }
  }
  function boot() {
    const sel = document.getElementById("week-select");
    if (sel) sel.addEventListener("change", () => setTimeout(apply, 200));
    const tick = setInterval(() => {
      if (document.getElementById("hero-theme")?.textContent) {
        clearInterval(tick);
        apply();
      }
    }, 100);
    setTimeout(() => clearInterval(tick), 8000);
    window.addEventListener("hashchange", () => setTimeout(apply, 150));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
