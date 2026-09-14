/**
 * Split folded 【…】 blocks in 人话解释 into 人话 / 打个比方 / 以前 vs 现在 / 举个例子走一遍.
 * Load AFTER js/app.js.
 */
(function () {
  const ORDER = [
    { marker: "【打个比方】", title: "打个比方", cls: "detail-analogy" },
    { marker: "【以前 vs 现在】", title: "以前 vs 现在", cls: "detail-before-after" },
    { marker: "【举个例子走一遍】", title: "举个例子走一遍", cls: "detail-walkthrough" },
  ];

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function paras(text) {
    return String(text || "")
      .trim()
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => "<p>" + esc(p).replace(/\n/g, "<br/>") + "</p>")
      .join("");
  }

  function splitFolded(raw) {
    const hits = ORDER.map((o) => ({ ...o, idx: raw.indexOf(o.marker) }))
      .filter((o) => o.idx >= 0)
      .sort((a, b) => a.idx - b.idx);
    if (!hits.length) return null;
    const main = raw.slice(0, hits[0].idx).trim();
    const blocks = [];
    for (let i = 0; i < hits.length; i++) {
      const start = hits[i].idx + hits[i].marker.length;
      const end = i + 1 < hits.length ? hits[i + 1].idx : raw.length;
      blocks.push({
        title: hits[i].title,
        cls: hits[i].cls,
        text: raw.slice(start, end).trim(),
      });
    }
    return { main, blocks };
  }

  function enhance(body) {
    if (!body || body.dataset.eli5Done === "1") return;
    if (!body.querySelector(".modal-header")) return;
    let target = null;
    body.querySelectorAll(".detail-section").forEach((sec) => {
      const h = sec.querySelector("h3");
      if (h && /人话/.test(h.textContent || "")) target = sec;
    });
    if (!target || target.classList.contains("detail-eli5")) return;
    const p = target.querySelector("p");
    if (!p) return;
    const raw = p.innerText || "";
    const split = splitFolded(raw);
    if (!split) return;

    body.dataset.eli5Done = "1";
    target.classList.add("detail-eli5");
    const h = target.querySelector("h3");
    if (h) h.textContent = "人话";
    target.querySelectorAll("p").forEach((el) => el.remove());
    target.insertAdjacentHTML("beforeend", paras(split.main));

    let anchor = target;
    split.blocks.forEach((b) => {
      const div = document.createElement("div");
      div.className = "detail-section " + b.cls;
      div.innerHTML = "<h3>" + esc(b.title) + "</h3>" + paras(b.text);
      anchor.after(div);
      anchor = div;
    });
  }

  function boot() {
    const body = document.getElementById("modal-body");
    if (!body) return;
    new MutationObserver(() => {
      if (!body.querySelector(".modal-header")) {
        delete body.dataset.eli5Done;
        return;
      }
      enhance(body);
    }).observe(body, { childList: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
