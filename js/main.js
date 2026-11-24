// Theme toggle + post filtering/sorting. No dependencies.
(function () {
  "use strict";

  /* ---------- Theme ---------- */
  var root = document.documentElement;
  var media = window.matchMedia("(prefers-color-scheme: dark)");

  function currentTheme() {
    return root.dataset.theme || (media.matches ? "dark" : "light");
  }

  var toggle = document.querySelector(".theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  /* ---------- Post filter + sort (only on /posts/) ---------- */
  var list = document.getElementById("post-list");
  var controls = document.getElementById("post-controls");
  if (!list || !controls) return;

  controls.hidden = false; // controls only show when JS works; otherwise the plain list still works

  var items = Array.prototype.slice.call(list.querySelectorAll(".post-item"));
  var q = document.getElementById("q");
  var sortSel = document.getElementById("sort");
  var chips = Array.prototype.slice.call(controls.querySelectorAll(".chip"));
  var countEl = document.getElementById("result-count");

  var params = new URLSearchParams(location.search);
  var state = {
    tag: params.get("tag") || "",
    q: params.get("q") || "",
    sort: params.get("sort") || "new"
  };
  if (!chips.some(function (c) { return c.dataset.tag === state.tag; })) state.tag = "";
  if (!sortSel.querySelector('option[value="' + state.sort + '"]')) state.sort = "new";
  q.value = state.q;
  sortSel.value = state.sort;

  var sorters = {
    "new": function (a, b) { return b.dataset.date.localeCompare(a.dataset.date); },
    "old": function (a, b) { return a.dataset.date.localeCompare(b.dataset.date); },
    "az":  function (a, b) { return a.dataset.title.localeCompare(b.dataset.title); },
    "za":  function (a, b) { return b.dataset.title.localeCompare(a.dataset.title); }
  };

  function render() {
    var term = state.q.trim().toLowerCase();
    var shown = 0;

    items.sort(sorters[state.sort]);
    var frag = document.createDocumentFragment();
    items.forEach(function (li) {
      var tags = li.dataset.tags ? li.dataset.tags.split(" ") : [];
      var ok = (!state.tag || tags.indexOf(state.tag) !== -1) &&
               (!term || li.dataset.title.indexOf(term) !== -1);
      li.hidden = !ok;
      if (ok) shown++;
      frag.appendChild(li);
    });
    list.appendChild(frag);

    chips.forEach(function (c) {
      c.setAttribute("aria-pressed", String(c.dataset.tag === state.tag));
    });
    countEl.textContent = shown === items.length
      ? items.length + (items.length === 1 ? " post" : " posts")
      : shown + " of " + items.length + " posts";

    // Keep the URL shareable, e.g. /posts/?tag=bgp&sort=old
    var p = new URLSearchParams();
    if (state.tag) p.set("tag", state.tag);
    if (state.q) p.set("q", state.q);
    if (state.sort !== "new") p.set("sort", state.sort);
    var qs = p.toString();
    // Some embedded/sandboxed views (in-app previews, iframes) block URL changes; filtering still works.
    try {
      history.replaceState(null, "", location.pathname + (qs ? "?" + qs : ""));
    } catch (e) {}
  }

  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      state.tag = (state.tag === c.dataset.tag) ? "" : c.dataset.tag;
      render();
    });
  });
  q.addEventListener("input", function () { state.q = q.value; render(); });
  sortSel.addEventListener("change", function () { state.sort = sortSel.value; render(); });

  render();
})();
