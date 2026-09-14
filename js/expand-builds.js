/**
 * Expand week.buildIds -> content/builds/{id}.json before app.js reads the week.
 * Must load BEFORE js/app.js.
 */
(function () {
  const orig = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    const url = typeof input === "string" ? input : input && input.url;
    const res = await orig(input, init);
    if (!url || !/weeks\/[^/?#]+\.json(\?|$)/.test(url)) return res;
    try {
      const data = await res.clone().json();
      const ids = data && data.buildIds;
      if (!Array.isArray(ids) || !ids.length) return res;
      const builds = Array.isArray(data.builds) ? data.builds : [];
      if (builds.length >= ids.length) return res;
      const base = url.replace(/weeks\/[^/?#]+\.json.*$/, "");
      const loaded = await Promise.all(
        ids.map((id) => orig(base + "builds/" + id + ".json").then((r) => {
          if (!r.ok) throw new Error("build " + id + " " + r.status);
          return r.json();
        }))
      );
      data.builds = loaded;
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("expand-builds failed", e);
      return res;
    }
  };
})();
