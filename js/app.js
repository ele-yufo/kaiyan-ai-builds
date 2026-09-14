/**
 * 开眼 · AI Builds — static SPA
 * Hash routes: #/  #/build/:id  #/pattern/:id  #/week/:id
 */
(function () {
  "use strict";

  const CAT_LABEL = {
    portfolio: "作品集",
    business: "商业",
    workflow: "工作流",
  };

  const PATTERN_ICONS = {
    "room-context": "⌂",
    "write-gate": "⌘",
    "capability-catalog": "☰",
  };

  const state = {
    weeksIndex: null,
    week: null,
    weekId: null,
    filter: "all",
    patternFilter: null,
    activeBuildId: null,
  };

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  async function fetchJSON(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
    return res.json();
  }

  function resolveContentBase() {
    // Relative to index.html — works for file:// via note, and http servers
    const base = document.querySelector('base')?.href;
    if (base) return new URL("content/", base).href;
    // Derive from script / page location
    const loc = window.location.href.replace(/[#?].*$/, "");
    const dir = loc.endsWith("/") ? loc : loc.replace(/\/[^/]*$/, "/");
    return dir + "content/";
  }

  const CONTENT = resolveContentBase();

  async function loadWeeksIndex() {
    state.weeksIndex = await fetchJSON(CONTENT + "weeks/index.json");
    return state.weeksIndex;
  }

  async function loadWeek(id) {
    state.week = await fetchJSON(CONTENT + `weeks/${id}.json`);
    state.weekId = id;
    return state.week;
  }

  function parseHash() {
    const raw = (location.hash || "#/").replace(/^#/, "") || "/";
    const parts = raw.split("/").filter(Boolean);
    // ["build", "switch"] | ["pattern", "write-gate"] | ["week", "2026-09-13"] | []
    return {
      type: parts[0] || "home",
      id: parts[1] || null,
    };
  }

  function setHash(path) {
    const next = path.startsWith("#") ? path : "#" + path;
    if (location.hash !== next) location.hash = next;
    else onRoute();
  }

  function findBuild(id) {
    return state.week?.builds?.find((b) => b.id === id);
  }

  function findPattern(id) {
    return state.week?.patterns?.find((p) => p.id === id);
  }

  function patternName(id) {
    return findPattern(id)?.name || id;
  }

  /* —— Render —— */
  function renderWeekSwitcher() {
    const sel = $("#week-select");
    if (!sel || !state.weeksIndex) return;
    sel.innerHTML = state.weeksIndex.weeks
      .map(
        (w) =>
          `<option value="${w.id}" ${w.id === state.weekId ? "selected" : ""}>${escapeHtml(w.label)}</option>`
      )
      .join("");
  }

  function renderHero() {
    const w = state.week;
    if (!w) return;
    $("#hero-eyebrow").textContent = w.label;
    $("#hero-title").textContent = w.themeShort;
    $("#hero-theme").textContent = w.theme;
    $("#hero-meta").innerHTML = `
      <span><strong>日期</strong> ${escapeHtml(w.dateRange)}</span>
      <span><strong>收录</strong> ${w.builds.length} 个 builds</span>
      <span><strong>约束模式</strong> ${w.patterns.length} 种</span>
    `;
  }

  function renderFilters() {
    const builds = state.week?.builds || [];
    const counts = { all: builds.length, portfolio: 0, business: 0, workflow: 0 };
    builds.forEach((b) => {
      if (counts[b.category] !== undefined) counts[b.category]++;
    });

    const wrap = $("#filters");
    const cats = [
      { id: "all", label: "全部" },
      { id: "portfolio", label: "作品集" },
      { id: "business", label: "商业" },
      { id: "workflow", label: "工作流" },
    ];
    wrap.innerHTML =
      `<span class="filter-label">分类</span>` +
      cats
        .map(
          (c) => `
      <button type="button" class="chip ${state.filter === c.id ? "active" : ""}" data-filter="${c.id}">
        ${c.label}<span class="count">${counts[c.id]}</span>
      </button>`
        )
        .join("");

    $$(".chip", wrap).forEach((btn) => {
      btn.addEventListener("click", () => {
        state.filter = btn.dataset.filter;
        state.patternFilter = null;
        updatePatternBanner();
        renderFilters();
        renderCards();
      });
    });
  }

  function updatePatternBanner() {
    const banner = $("#pattern-banner");
    if (!banner) return;
    if (state.patternFilter) {
      const p = findPattern(state.patternFilter);
      banner.classList.add("visible");
      banner.innerHTML = `
        <span>正在查看约束模式：<strong>${escapeHtml(p?.name || "")}</strong></span>
        <button type="button" id="clear-pattern">清除筛选</button>
      `;
      $("#clear-pattern")?.addEventListener("click", () => {
        state.patternFilter = null;
        updatePatternBanner();
        renderCards();
        setHash("#/");
      });
    } else {
      banner.classList.remove("visible");
      banner.innerHTML = "";
    }
  }

  function renderCards() {
    const grid = $("#card-grid");
    let builds = state.week?.builds || [];

    if (state.filter !== "all") {
      builds = builds.filter((b) => b.category === state.filter);
    }

    if (!builds.length) {
      grid.innerHTML = `<div class="empty">本分类暂无 builds</div>`;
      return;
    }

    grid.innerHTML = builds
      .map((b) => {
        const dimmed =
          state.patternFilter && b.pattern !== state.patternFilter ? "dimmed" : "";
        const highlight =
          state.patternFilter && b.pattern === state.patternFilter
            ? "pattern-highlight"
            : "";
        return `
      <article class="card ${dimmed} ${highlight}" data-category="${b.category}" data-id="${b.id}" tabindex="0" role="button" aria-label="查看 ${escapeHtml(b.name)}">
        <div class="card-top">
          <div>
            <div class="card-name">${escapeHtml(b.name)}</div>
            <div class="card-org">${escapeHtml(b.org)}</div>
          </div>
          <span class="cat-badge ${b.category}">${CAT_LABEL[b.category] || b.category}</span>
        </div>
        <div class="card-tagline">${escapeHtml(b.tagline)}</div>
        <p class="card-one">${escapeHtml(b.oneLiner)}</p>
        <div class="card-footer">
          <span class="pattern-mini">${escapeHtml(patternName(b.pattern))}</span>
          <span class="card-cta">详解 →</span>
        </div>
      </article>`;
      })
      .join("");

    $$(".card", grid).forEach((card) => {
      const open = () => setHash(`#/build/${card.dataset.id}`);
      card.addEventListener("click", open);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });
  }

  function renderPatterns() {
    const grid = $("#patterns-grid");
    const patterns = state.week?.patterns || [];
    const buildsById = Object.fromEntries(
      (state.week?.builds || []).map((b) => [b.id, b])
    );

    grid.innerHTML = patterns
      .map((p) => {
        const names = (p.builds || [])
          .map((id) => buildsById[id]?.name || id)
          .map((n) => `<span>${escapeHtml(n)}</span>`)
          .join("");
        return `
      <button type="button" class="pattern-card" data-pattern="${p.id}">
        <div class="pattern-icon" aria-hidden="true">${PATTERN_ICONS[p.id] || "◆"}</div>
        <h3>${escapeHtml(p.name)}</h3>
        <p>${escapeHtml(p.summary)}</p>
        <div class="pattern-builds">${names}</div>
      </button>`;
      })
      .join("");

    $$(".pattern-card", grid).forEach((btn) => {
      btn.addEventListener("click", () => {
        setHash(`#/pattern/${btn.dataset.pattern}`);
      });
    });
  }

  function renderFlow(flow) {
    if (!flow?.length) return "";
    const parts = [];
    flow.forEach((step, i) => {
      parts.push(`
        <div class="flow-step">
          <div class="flow-step-num">${i + 1}</div>
          <div class="flow-step-label">${escapeHtml(step.label)}</div>
          <div class="flow-step-desc">${escapeHtml(step.desc)}</div>
        </div>`);
      if (i < flow.length - 1) {
        parts.push(`<div class="flow-arrow" aria-hidden="true">→</div>`);
      }
    });
    return `<div class="flow-diagram" role="img" aria-label="工作流程">${parts.join("")}</div>`;
  }

  function openModal(build) {
    const overlay = $("#modal-overlay");
    const body = $("#modal-body");
    if (!overlay || !body || !build) return;

    state.activeBuildId = build.id;

    const variants = (build.variants || [])
      .map((v) => `<li>${escapeHtml(v)}</li>`)
      .join("");

    body.innerHTML = `
      <div class="modal-header">
        <span class="cat-badge ${build.category}">${CAT_LABEL[build.category] || build.category}</span>
        <h2 id="modal-title">${escapeHtml(build.name)}</h2>
        <div class="modal-org">${escapeHtml(build.org)}</div>
        <div class="modal-tagline">${escapeHtml(build.tagline)}</div>
      </div>

      <div class="detail-section">
        <h3>人话解释</h3>
        <p>${escapeHtml(build.plainExplain)}</p>
      </div>

      <div class="detail-section">
        <h3>痛点</h3>
        <p>${escapeHtml(build.painPoint)}</p>
      </div>

      <div class="detail-section">
        <h3>它怎么工作</h3>
        ${renderFlow(build.flow)}
      </div>

      <div class="detail-section">
        <h3>为什么炫</h3>
        <p>${escapeHtml(build.whyCool)}</p>
      </div>

      ${build.geniusLeap ? `<div class="detail-section"><h3>天才跳跃</h3><p>${escapeHtml(build.geniusLeap)}</p></div>` : ""}

      <div class="detail-section">
        <h3>出处（可核验）</h3>
        <p class="provenance">
          ${build.publishedDate ? `<span>发布：${escapeHtml(build.publishedDate)}</span><br/>` : ""}
          ${build.sourceType ? `<span>类型：${escapeHtml(build.sourceType)}</span><br/>` : ""}
          ${build.sourceLabel ? `<span>来源：${escapeHtml(build.sourceLabel)}</span><br/>` : ""}
          ${build.dateEvidence ? `<span>日期依据：${escapeHtml(build.dateEvidence)}</span><br/>` : ""}
          ${build.sourceUrl ? `<a href="${escapeAttr(build.sourceUrl)}" target="_blank" rel="noopener noreferrer">打开证据页 ↗</a>` : ""}
        </p>
      </div>

      <div class="detail-section">
        <h3>约束模式</h3>
        <button type="button" class="pattern-badge" data-pattern="${build.pattern}">
          ${PATTERN_ICONS[build.pattern] || "◆"} ${escapeHtml(patternName(build.pattern))}
        </button>
      </div>

      <div class="detail-section">
        <h3>可变体</h3>
        <ul>${variants}</ul>
      </div>

      <div class="modal-actions">
        <a class="btn btn-primary" href="${escapeAttr(build.url)}" target="_blank" rel="noopener noreferrer">
          打开官网 ↗
        </a>
        <button type="button" class="btn btn-ghost" id="modal-back">关闭</button>
      </div>
    `;

    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    $("#modal-close")?.focus();

    $("#modal-back")?.addEventListener("click", closeModal);
    body.querySelector(".pattern-badge")?.addEventListener("click", () => {
      closeModal();
      setHash(`#/pattern/${build.pattern}`);
    });
  }

  function closeModal() {
    const overlay = $("#modal-overlay");
    overlay?.classList.remove("open");
    overlay?.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    state.activeBuildId = null;
    const route = parseHash();
    if (route.type === "build") {
      history.replaceState(null, "", "#/");
    }
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, "&#39;");
  }

  /* —— Routing —— */
  async function onRoute() {
    if (!state.week) return;
    const route = parseHash();

    if (route.type === "week" && route.id && route.id !== state.weekId) {
      await switchWeek(route.id);
      return;
    }

    if (route.type === "build" && route.id) {
      const b = findBuild(route.id);
      if (b) openModal(b);
      else {
        closeModal();
        setHash("#/");
      }
      return;
    }

    if (route.type === "pattern" && route.id) {
      closeModal();
      state.patternFilter = route.id;
      state.filter = "all";
      updatePatternBanner();
      renderFilters();
      renderCards();
      $("#patterns")?.scrollIntoView({ behavior: "smooth", block: "start" });
      // Also scroll to cards after brief delay
      setTimeout(() => {
        $("#builds")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 400);
      return;
    }

    closeModal();
    if (!state.patternFilter) {
      updatePatternBanner();
      renderCards();
    }
  }

  async function switchWeek(id) {
    try {
      await loadWeek(id);
      state.filter = "all";
      state.patternFilter = null;
      renderWeekSwitcher();
      renderHero();
      renderFilters();
      updatePatternBanner();
      renderCards();
      renderPatterns();
      setHash("#/");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      console.error(e);
      alert("无法加载该周内容：" + id);
    }
  }

  function bindGlobal() {
    $("#week-select")?.addEventListener("change", (e) => {
      switchWeek(e.target.value);
    });

    $("#modal-close")?.addEventListener("click", () => {
      closeModal();
      setHash("#/");
    });

    $("#modal-overlay")?.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) {
        closeModal();
        setHash("#/");
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && state.activeBuildId) {
        closeModal();
        setHash("#/");
      }
    });

    window.addEventListener("hashchange", onRoute);

    $("#nav-patterns")?.addEventListener("click", (e) => {
      e.preventDefault();
      $("#patterns")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  async function init() {
    const loading = $("#loading");
    try {
      await loadWeeksIndex();
      const defaultId =
        state.weeksIndex.defaultWeek || state.weeksIndex.weeks[0]?.id;
      const route = parseHash();
      const weekId =
        route.type === "week" && route.id ? route.id : defaultId;
      await loadWeek(weekId);

      renderWeekSwitcher();
      renderHero();
      renderFilters();
      updatePatternBanner();
      renderCards();
      renderPatterns();
      bindGlobal();

      loading?.remove();
      $("#app")?.removeAttribute("hidden");

      await onRoute();
    } catch (err) {
      console.error(err);
      if (loading) {
        loading.innerHTML = `
          <p>内容加载失败。</p>
          <p style="font-size:0.85rem;margin-top:0.75rem">
            请用本地服务器打开本站（不要直接双击 file://），例如：<br>
            <code style="color:var(--accent)">npx serve .</code> 或
            <code style="color:var(--accent)">python3 -m http.server 8080</code>
          </p>
          <p style="font-size:0.8rem;margin-top:0.5rem;opacity:0.7">${escapeHtml(err.message)}</p>
        `;
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
