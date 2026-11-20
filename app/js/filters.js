import { isEarned } from "./store.js";

export const KIND_FILTERS = [
  { key: "all", label: "All 55" },
  { key: "story", label: "Story 12" },
  { key: "missable", label: "Missable 9" },
  { key: "collectibles", label: "Collectibles 7" },
  { key: "activities", label: "Activities 27" },
  { key: "hidden", label: "PSN-hidden 28" },
  { key: "disputed", label: "Disputed 21" },
  { key: "unearned", label: "Not earned" }
];

export function spoilerHidden(trophy, state) {
  return state.spoiler && trophy.hidden && !isEarned(state, trophy.id);
}

export function displayName(trophy, state) {
  if (spoilerHidden(trophy, state)) return "Hidden trophy — earn it to reveal";
  return trophy.name;
}

export function displayDescription(trophy, state) {
  if (spoilerHidden(trophy, state)) return "Hidden on PlayStation until earned.";
  return trophy.description;
}

export function applyFilters(trophies, state) {
  const query = (state.query || "").trim().toLowerCase();
  let list = trophies.filter((trophy) => {
    if (state.kind === "story" && trophy.kind !== "story") return false;
    if (state.kind === "missable" && trophy.kind !== "missable") return false;
    if (state.kind === "collectibles" && trophy.kind !== "collectibles") return false;
    if (state.kind === "activities" && trophy.kind !== "activities") return false;
    if (state.kind === "hidden" && !trophy.hidden) return false;
    if (state.kind === "disputed" && !trophy.dispute) return false;
    if (state.kind === "unearned" && isEarned(state, trophy.id)) return false;
    if (state.grade && trophy.grade !== state.grade) return false;
    if (query) {
      const haystack = [
        trophy.name,
        trophy.description,
        trophy.mission,
        trophy.guide,
        (trophy.steps || []).map((s) => s.text).join(" ")
      ].join(" ").toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
  const gradeRank = { Platinum: 0, Gold: 1, Silver: 2, Bronze: 3 };
  if (state.sort === "name") {
    list = list.slice().sort((a, b) => a.name.localeCompare(b.name));
  } else if (state.sort === "difficulty") {
    list = list.slice().sort((a, b) => b.difficulty - a.difficulty || a.stage - b.stage);
  } else if (state.sort === "grade") {
    list = list.slice().sort((a, b) => gradeRank[a.grade] - gradeRank[b.grade] || a.stage - b.stage);
  } else {
    list = list.slice().sort((a, b) => a.stage - b.stage || a.id.localeCompare(b.id));
  }
  return list;
}

export function nextUpList(trophies, state, limit) {
  const unearned = trophies.filter((t) => !isEarned(state, t.id));
  const rank = (t) => {
    if (t.missable === "possible") return 0;
    if (t.missable === "watch") return 1;
    return 2;
  };
  return unearned
    .slice()
    .sort((a, b) => rank(a) - rank(b) || a.stage - b.stage || a.id.localeCompare(b.id))
    .slice(0, limit || 5);
}
