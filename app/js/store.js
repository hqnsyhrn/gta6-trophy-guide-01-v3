const STORAGE_KEY = "leonida-platinum-v3";

export function defaultState() {
  return {
    earned: {},
    counts: {},
    spoiler: true,
    kind: "all",
    grade: "",
    sort: "roadmap",
    query: "",
    view: "tracker",
    selected: "t28"
  };
}

export function loadState() {
  const state = defaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return state;
    const saved = JSON.parse(raw);
    if (saved && typeof saved === "object") {
      if (saved.earned && typeof saved.earned === "object") state.earned = saved.earned;
      if (saved.counts && typeof saved.counts === "object") state.counts = saved.counts;
      if (typeof saved.spoiler === "boolean") state.spoiler = saved.spoiler;
    }
  } catch (err) {
    // A corrupt save must never break the guide; start fresh.
  }
  return state;
}

export function saveState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      earned: state.earned,
      counts: state.counts,
      spoiler: state.spoiler
    }));
  } catch (err) {
    // Storage full or blocked: the guide still works in memory.
  }
}

export function isEarned(state, id) {
  return Boolean(state.earned[id]);
}

export function toggleEarned(state, id) {
  if (state.earned[id]) delete state.earned[id];
  else state.earned[id] = true;
  saveState(state);
}

export function earnedIds(state) {
  return Object.keys(state.earned).filter((id) => state.earned[id]);
}

export function getCount(state, id) {
  const value = state.counts[id];
  return typeof value === "number" && value > 0 ? value : 0;
}

export function setCount(state, id, value) {
  const clamped = Math.max(0, Math.floor(value));
  if (clamped === 0) delete state.counts[id];
  else state.counts[id] = clamped;
  saveState(state);
}

export function exportState(state) {
  return JSON.stringify({
    app: "Leonida Platinum Guide v3",
    exported: new Date().toISOString(),
    earned: earnedIds(state),
    counts: state.counts,
    spoiler: state.spoiler
  }, null, 2);
}

export function importState(text) {
  const data = JSON.parse(text);
  if (!data || typeof data !== "object") throw new Error("not an object");
  const next = defaultState();
  const earnedList = Array.isArray(data.earned) ? data.earned : [];
  for (const id of earnedList) {
    if (typeof id === "string" && /^t\d{2}$/.test(id)) next.earned[id] = true;
  }
  if (data.counts && typeof data.counts === "object") {
    for (const [id, value] of Object.entries(data.counts)) {
      if (/^t\d{2}$/.test(id) && typeof value === "number" && value > 0) {
        next.counts[id] = Math.floor(value);
      }
    }
  }
  if (typeof data.spoiler === "boolean") next.spoiler = data.spoiler;
  return next;
}

export function shareUrl(state) {
  const url = new URL(window.location.href);
  const earned = earnedIds(state);
  const hash = new URLSearchParams();
  hash.set("view", state.view || "tracker");
  if (state.selected) hash.set("t", state.selected);
  if (earned.length > 0) hash.set("earned", earned.join(","));
  const countEntries = Object.entries(state.counts)
    .filter(([, value]) => value > 0)
    .map(([id, value]) => id + ":" + value);
  if (countEntries.length > 0) hash.set("counts", countEntries.join(","));
  url.hash = hash.toString();
  return url.toString();
}

export function readHash() {
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const out = { view: null, selected: null, earned: [], counts: {} };
  const view = hash.get("view");
  if (view === "tracker" || view === "roadmap" || view === "missables" || view === "sources") {
    out.view = view;
  }
  const selected = hash.get("t");
  if (selected && /^t\d{2}$/.test(selected)) out.selected = selected;
  const filter = hash.get("filter");
  if (filter) out.filter = filter;
  const earned = hash.get("earned");
  if (earned) {
    out.earned = earned.split(",").filter((id) => /^t\d{2}$/.test(id));
  }
  const counts = hash.get("counts");
  if (counts) {
    for (const part of counts.split(",")) {
      const [id, value] = part.split(":");
      const n = parseInt(value, 10);
      if (/^t\d{2}$/.test(id) && Number.isFinite(n) && n > 0) out.counts[id] = n;
    }
  }
  return out;
}

export function writeHash(state) {
  const hash = new URLSearchParams();
  hash.set("view", state.view || "tracker");
  if (state.selected) hash.set("t", state.selected);
  if (state.kind && state.kind !== "all") hash.set("filter", state.kind);
  const earned = earnedIds(state);
  if (earned.length > 0) hash.set("earned", earned.join(","));
  const countEntries = Object.entries(state.counts)
    .filter(([, value]) => value > 0)
    .map(([id, value]) => id + ":" + value);
  if (countEntries.length > 0) hash.set("counts", countEntries.join(","));
  const next = "#" + hash.toString();
  if (window.location.hash !== next) {
    window.history.replaceState(null, "", next);
  }
}
