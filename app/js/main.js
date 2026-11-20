import {
  loadState, saveState, isEarned, toggleEarned, earnedIds,
  getCount, setCount, exportState, importState,
  shareUrl, readHash, writeHash
} from "./store.js";
import { computeAudit, auditStripText } from "./audit.js";
import { KIND_FILTERS, applyFilters, nextUpList } from "./filters.js";
import {
  sourceById, renderList, renderDetail, renderRail, renderNextUp,
  renderRoadmap, renderMissables, renderSources
} from "./views.js";

const state = loadState();
let trophies = [];
let sources = [];
let roadmap = null;
let audit = null;
let sourcesMap = {};

const $ = (id) => document.getElementById(id);

async function loadData() {
  const [trophyData, sourceData, roadmapData] = await Promise.all([
    fetch("data/trophies.json").then((r) => r.json()),
    fetch("data/sources.json").then((r) => r.json()),
    fetch("data/roadmap.json").then((r) => r.json())
  ]);
  trophies = trophyData.trophies || [];
  sources = sourceData.sources || [];
  roadmap = roadmapData;
  audit = computeAudit(trophies, sources);
  sourcesMap = sourceById(sources);
}

function renderHeader() {
  const earned = earnedIds(state).length;
  $("earnedCount").textContent = earned + "/" + trophies.length;
  $("earnedBar").style.width = (trophies.length ? (earned / trophies.length) * 100 : 0) + "%";
  const counts = { Platinum: [0, 0], Gold: [0, 0], Silver: [0, 0], Bronze: [0, 0] };
  for (const trophy of trophies) {
    counts[trophy.grade][1] += 1;
    if (isEarned(state, trophy.id)) counts[trophy.grade][0] += 1;
  }
  $("gradeCounts").textContent =
    "P " + counts.Platinum[0] + "/" + counts.Platinum[1] +
    " · G " + counts.Gold[0] + "/" + counts.Gold[1] +
    " · S " + counts.Silver[0] + "/" + counts.Silver[1] +
    " · B " + counts.Bronze[0] + "/" + counts.Bronze[1];
  $("auditStrip").innerHTML = "<b>AUDIT</b> — " + auditStripText(audit);
  $("spoilerToggle").checked = state.spoiler;
}

function renderKindChips() {
  $("kindChips").innerHTML = KIND_FILTERS.map((filter) =>
    '<button type="button" class="chip' + (state.kind === filter.key ? " active" : "") +
    '" data-action="kind" data-kind="' + filter.key + '">' + filter.label + "</button>"
  ).join("");
}

function selectedTrophy() {
  return trophies.find((t) => t.id === state.selected) || trophies[0] || null;
}

function renderAll() {
  renderHeader();
  renderKindChips();
  const showTracker = state.view === "tracker";
  $("toolbar").style.display = showTracker ? "" : "none";
  document.querySelector(".layout").style.display = showTracker ? "" : "none";
  $("pageCol").hidden = showTracker;
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.view === state.view);
  });
  if (showTracker) {
    const filtered = applyFilters(trophies, state);
    $("trophyList").innerHTML = renderList(filtered, state);
    $("nextUp").innerHTML = renderNextUp(nextUpList(trophies, state, 5), state);
    const selected = selectedTrophy();
    $("detailCol").innerHTML = renderDetail(selected, state, sourcesMap);
    $("railCol").innerHTML = renderRail(selected, sourcesMap);
  } else if (state.view === "roadmap") {
    $("pageCol").innerHTML = renderRoadmap(roadmap, trophies, state);
  } else if (state.view === "missables") {
    $("pageCol").innerHTML = renderMissables(trophies, state);
  } else if (state.view === "sources") {
    $("pageCol").innerHTML = renderSources(sources, audit);
  }
  writeHash(state);
}

function setView(view) {
  state.view = view;
  renderAll();
}

function selectTrophy(id) {
  state.selected = id;
  state.view = "tracker";
  renderAll();
  const detail = $("detailCol");
  if (detail) detail.scrollIntoView({ block: "start" });
}

function download(filename, text) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function bindEvents() {
  $("searchInput").addEventListener("input", (event) => {
    state.query = event.target.value;
    renderAll();
  });
  $("gradeSelect").addEventListener("change", (event) => {
    state.grade = event.target.value;
    renderAll();
  });
  $("sortSelect").addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderAll();
  });
  $("spoilerToggle").addEventListener("change", (event) => {
    state.spoiler = event.target.checked;
    saveState(state);
    renderAll();
  });
  $("exportBtn").addEventListener("click", () => {
    download("leonida-platinum-progress.json", exportState(state));
  });
  $("importBtn").addEventListener("click", () => $("importFile").click());
  $("importFile").addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = importState(text);
      state.earned = imported.earned;
      state.counts = imported.counts;
      state.spoiler = imported.spoiler;
      saveState(state);
      renderAll();
      $("savedNote").textContent = "✓ Imported";
    } catch (err) {
      $("savedNote").textContent = "Import failed — not a valid progress file";
    }
    event.target.value = "";
  });
  $("shareBtn").addEventListener("click", async () => {
    const url = shareUrl(state);
    try {
      await navigator.clipboard.writeText(url);
      $("savedNote").textContent = "✓ Share link copied";
    } catch (err) {
      window.prompt("Copy your share link:", url);
    }
  });
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => setView(tab.dataset.view));
  });
  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    const id = target.dataset.id;
    if (action === "toggle-earned" && id) {
      event.preventDefault();
      toggleEarned(state, id);
      renderAll();
    } else if (action === "count-up" && id) {
      const trophy = trophies.find((t) => t.id === id);
      if (trophy && trophy.counter) {
        setCount(state, id, Math.min(trophy.counter.target, getCount(state, id) + trophy.counter.step));
        renderAll();
      }
    } else if (action === "count-down" && id) {
      const trophy = trophies.find((t) => t.id === id);
      if (trophy && trophy.counter) {
        setCount(state, id, getCount(state, id) - trophy.counter.step);
        renderAll();
      }
    } else if (action === "kind") {
      state.kind = target.dataset.kind;
      renderAll();
    } else if (action === "select" && id) {
      event.preventDefault();
      selectTrophy(id);
    }
  });
  $("trophyList").addEventListener("click", (event) => {
    const item = event.target.closest(".trophy-item");
    if (!item) return;
    if (event.target.closest("[data-action]")) return;
    selectTrophy(item.dataset.id);
  });
  window.addEventListener("hashchange", () => {
    const hash = readHash();
    if (hash.view) state.view = hash.view;
    if (hash.selected) state.selected = hash.selected;
    if (hash.filter) state.kind = hash.filter;
    renderAll();
  });
}

function applyInitialHash() {
  const hash = readHash();
  if (hash.view) state.view = hash.view;
  if (hash.selected) state.selected = hash.selected;
  if (hash.filter) state.kind = hash.filter;
  if (hash.earned.length > 0) {
    for (const id of hash.earned) state.earned[id] = true;
  }
  for (const [id, value] of Object.entries(hash.counts)) {
    state.counts[id] = value;
  }
  if (hash.earned.length > 0 || Object.keys(hash.counts).length > 0) saveState(state);
}

async function boot() {
  await loadData();
  applyInitialHash();
  bindEvents();
  renderAll();
}

boot();
