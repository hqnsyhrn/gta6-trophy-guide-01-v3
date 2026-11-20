import { isEarned, getCount } from "./store.js";
import { displayName, displayDescription, spoilerHidden } from "./filters.js";
import { sourceClaimCounts } from "./audit.js";

export function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sourceById(sources) {
  const map = {};
  for (const source of sources) map[source.id] = source;
  return map;
}

function gradeBadge(grade) {
  return '<span class="grade ' + escapeHtml(grade) + '">' + escapeHtml(grade) + "</span>";
}

function kindLabel(kind) {
  if (kind === "story") return "Story";
  if (kind === "missable") return "Missable";
  if (kind === "collectibles") return "Collectibles";
  return "Activities";
}

function tagHtml(trophy) {
  let html = gradeBadge(trophy.grade);
  html += '<span class="tag">' + kindLabel(trophy.kind) + "</span>";
  if (trophy.hidden) html += '<span class="tag hidden-tag">PSN-hidden</span>';
  if (trophy.missable === "possible") html += '<span class="tag miss">Possibly missable</span>';
  if (trophy.missable === "watch") html += '<span class="tag watch">Watch — at risk</span>';
  if (trophy.dispute) html += '<span class="tag disputed">Disputed</span>';
  if (trophy.unconfirmed) html += '<span class="tag unconf">Unconfirmed</span>';
  return html;
}

export function renderList(trophies, state) {
  if (trophies.length === 0) {
    return '<div class="empty">No trophies match this filter. Clear the search or pick another kind.</div>';
  }
  return trophies.map((trophy) => {
    const earned = isEarned(state, trophy.id);
    const counter = trophy.counter
      ? '<div class="t-mini">Counter: ' + getCount(state, trophy.id) + "/" + trophy.counter.target + " " + escapeHtml(trophy.counter.label) + "</div>"
      : "";
    const mini = spoilerHidden(trophy, state)
      ? '<div class="t-mini">Mission hidden until earned &middot; Stage ' + trophy.stage + "</div>"
      : '<div class="t-mini">' + escapeHtml(trophy.mission) + " &middot; Stage " + trophy.stage +
        " &middot; Difficulty " + trophy.difficulty + "/10 &middot; " + escapeHtml(trophy.time) + "</div>";
    return (
      '<li class="trophy-item' + (earned ? " earned" : "") + (state.selected === trophy.id ? " selected" : "") + '" data-id="' + trophy.id + '">' +
      '<div class="trophy-head">' +
      '<input type="checkbox" class="trophy-check" data-action="toggle-earned" data-id="' + trophy.id + '"' + (earned ? " checked" : "") + ' aria-label="Mark earned">' +
      '<div><div class="t-name">' + escapeHtml(displayName(trophy, state)) + "</div>" +
      '<div class="t-desc">' + escapeHtml(displayDescription(trophy, state)) + "</div>" +
      '<div class="t-meta">' + tagHtml(trophy) + "</div>" +
      mini +
      counter + "</div></div></li>"
    );
  }).join("");
}

export function renderDetail(trophy, state, sourcesMap) {
  if (!trophy) return '<div class="empty">Pick a trophy from the list to read its guide.</div>';
  const earned = isEarned(state, trophy.id);
  if (spoilerHidden(trophy, state)) {
    return '<article class="detail"><h2>Hidden trophy — earn it to reveal</h2>' +
      '<p class="official">Hidden on PlayStation until earned.</p>' +
      '<p class="guide-text">The spoiler shield is on and this story trophy is still unearned. ' +
      "Switch the shield off at the top of the page, or earn the trophy, to read its guide.</p>" +
      '<div class="facts">' + gradeBadge(trophy.grade) + "<span>" + kindLabel(trophy.kind) + "</span><span>PSN-hidden</span></div>" +
      "</article>";
  }
  const claims = sourceClaimCounts(trophy);
  let html = '<article class="detail">';
  html += "<h2>" + escapeHtml(displayName(trophy, state)) + "</h2>";
  html += '<p class="official">Official: &ldquo;' + escapeHtml(trophy.description) + "&rdquo;</p>";
  html += '<div class="facts">' + gradeBadge(trophy.grade);
  html += "<span>" + kindLabel(trophy.kind) + "</span>";
  if (trophy.hidden) html += "<span>PSN-hidden</span>";
  html += "<span>Stage " + trophy.stage + "</span>";
  html += "<span>Mission: " + escapeHtml(trophy.mission) + "</span>";
  html += "<span>Difficulty " + trophy.difficulty + "/10</span>";
  html += "<span>Time: " + escapeHtml(trophy.time) + "</span>";
  if (trophy.count) html += "<span>PSN count: " + trophy.count + " " + escapeHtml(trophy.countLabel || "") + "</span>";
  html += "</div>";
  if (trophy.missable === "possible") {
    html += '<div class="warn-box"><h3>Possibly missable</h3><p>Last chance: <strong>' + escapeHtml(trophy.lastChance || "") + "</strong>. Do the step below before that point or this trophy may be locked for the whole playthrough.</p></div>";
  } else if (trophy.missable === "watch") {
    html += '<div class="warn-box watch"><h3>Watch — at risk</h3><p>Last chance: <strong>' + escapeHtml(trophy.lastChance || "") + "</strong>. Start this chain as soon as it unlocks; quest givers go quiet for stretches of the story.</p></div>";
  }
  if (trophy.unconfirmed) {
    html += '<div class="warn-box"><h3>Unconfirmed</h3><p>The unlock below is not confirmed by two sources yet. This guide says so instead of inventing a method — check the Sources tab for what each guide actually reports.</p></div>';
  }
  html += '<p class="guide-text">' + escapeHtml(trophy.guide) + "</p>";
  html += "<h3>Steps</h3><ol class=\"steps\">";
  for (const step of trophy.steps || []) {
    const cites = (step.sources || []).map((id) => "[" + id + "]").join(" ");
    html += "<li>" + escapeHtml(step.text) + ' <span class="cite">' + escapeHtml(cites) + "</span></li>";
  }
  html += "</ol>";
  if (trophy.dispute) {
    html += '<div class="dispute-box"><h3>Sources differ — both versions shown</h3>' +
      "<p><strong>Version A:</strong> " + escapeHtml(trophy.dispute.versionA) + "</p>" +
      "<p><strong>Version B:</strong> " + escapeHtml(trophy.dispute.versionB) + "</p>" +
      "<p><strong>Our call:</strong> " + escapeHtml(trophy.dispute.call) + "</p></div>";
  }
  if (trophy.counter) {
    const current = getCount(state, trophy.id);
    html += '<div class="counter-box"><span>Your count</span>' +
      '<button type="button" data-action="count-down" data-id="' + trophy.id + '" aria-label="Decrease count">&minus;</button>' +
      '<span class="count-num">' + current + " / " + trophy.counter.target + " " + escapeHtml(trophy.counter.label) + "</span>" +
      '<button type="button" data-action="count-up" data-id="' + trophy.id + '" aria-label="Increase count">+</button></div>';
  }
  html += '<button type="button" class="earn-btn' + (earned ? " earned" : "") + '" data-action="toggle-earned" data-id="' + trophy.id + '">' +
    (earned ? "✓ Earned — click to unmark" : "Mark as earned") + "</button>";
  html += "</article>";
  return html;
}

export function renderRail(trophy, sourcesMap) {
  if (!trophy) return "";
  const claims = sourceClaimCounts(trophy);
  const ids = Object.keys(claims).map((id) => parseInt(id, 10)).sort((a, b) => claims[b] - claims[a]);
  let html = '<div class="rail"><h2>Sources for this guide &middot; ' + ids.length + "</h2><ul>";
  for (const id of ids) {
    const source = sourcesMap[id];
    if (!source) continue;
    html += "<li><div class=\"src-site\">[" + id + "] " + escapeHtml(source.site) + "</div>" +
      '<div><a href="' + escapeHtml(source.url) + '" target="_blank" rel="noopener">' + escapeHtml(source.title) + "</a></div>" +
      '<div class="src-count">' + claims[id] + " claim" + (claims[id] === 1 ? "" : "s") + " &middot; " + escapeHtml(source.topic) + "</div></li>";
  }
  html += "</ul></div>";
  return html;
}

export function renderNextUp(items, state) {
  if (items.length === 0) {
    return '<div class="nextup"><h2>Next up</h2><p>All 55 trophies earned — Leonida Legend.</p></div>';
  }
  let html = '<div class="nextup"><h2>Next up — missable first</h2><ol>';
  for (const trophy of items) {
    const flag = trophy.missable === "possible" ? "Possibly missable — " : trophy.missable === "watch" ? "Watch — " : "";
    html += '<li><a href="#" data-action="select" data-id="' + trophy.id + '">' + escapeHtml(displayName(trophy, state)) + "</a> <span>(" + flag + "Stage " + trophy.stage + ")</span></li>";
  }
  html += "</ol></div>";
  return html;
}

export function renderRoadmap(roadmap, trophies, state) {
  let html = '<div class="page-intro"><h2>Roadmap to the Platinum</h2>' +
    "<p><strong>" + escapeHtml(roadmap.platinum.difficulty) + " difficulty &middot; " + escapeHtml(roadmap.platinum.time) +
    " &middot; " + roadmap.platinum.playthroughs + " playthrough &middot; " + roadmap.platinum.online + " online.</strong> " +
    escapeHtml(roadmap.platinum.cheats) + " " + escapeHtml(roadmap.platinum.saves) + "</p></div>";
  for (const stage of roadmap.stages) {
    const stageTrophies = trophies.filter((t) => t.stage === stage.n);
    const done = stageTrophies.filter((t) => isEarned(state, t.id)).length;
    html += '<section class="stage"><h2>Stage ' + stage.n + " — " + escapeHtml(stage.title) + "</h2>" +
      '<p class="stage-meta">' + done + "/" + stageTrophies.length + " earned &middot; " + escapeHtml(stage.hours) + " &middot; " + stage.trophies + " trophies</p><ol>";
    for (const step of stage.steps) html += "<li>" + escapeHtml(step) + "</li>";
    html += '</ol><div class="stage-trophies">';
    for (const trophy of stageTrophies) {
      html += '<span class="' + (isEarned(state, trophy.id) ? "done" : "") + '">' + escapeHtml(displayName(trophy, state)) + "</span>";
    }
    html += "</div></section>";
  }
  return html;
}

export function renderMissables(trophies, state) {
  const possible = trophies.filter((t) => t.missable === "possible");
  const watch = trophies.filter((t) => t.missable === "watch");
  let html = '<div class="page-intro"><h2>Missables &amp; watch list</h2>' +
    "<p>One trophy is possibly missable. Eight more sit on the watch list: their quest chains have story windows, so start them early and mind the last-chance chapter.</p></div>";
  for (const trophy of possible) {
    html += missableCard(trophy, state, "possible");
  }
  for (const trophy of watch) {
    html += missableCard(trophy, state, "watch");
  }
  return html;
}

function missableCard(trophy, state, kind) {
  const earned = isEarned(state, trophy.id);
  const body = spoilerHidden(trophy, state)
    ? "Hidden on PlayStation until earned — the guide stays behind the spoiler shield until you earn it or switch the shield off."
    : trophy.guide;
  let html = '<section class="miss-card ' + kind + '"><h2>' + escapeHtml(displayName(trophy, state)) + "</h2>" +
    '<p class="last-chance">Last chance: ' + escapeHtml(trophy.lastChance || "") + "</p>" +
    "<p>" + escapeHtml(body) + "</p>" +
    '<p><a href="#" data-action="select" data-id="' + trophy.id + '">Read the full guide &rarr;</a></p>' +
    '<button type="button" class="earn-btn' + (earned ? " earned" : "") + '" data-action="toggle-earned" data-id="' + trophy.id + '">' +
    (earned ? "✓ Earned" : "Mark as earned") + "</button></section>";
  return html;
}

export function renderSources(sources, audit) {
  let html = '<div class="page-intro"><h2>Sources</h2>' +
    "<p>" + audit.sourcesTotal + " sources from " + audit.sitesTotal + " sites, read 20 Nov 2026. Every step in this guide cites its sources by number; the table below shows how much each source backs. Nothing here is copied — each guide is written in our own words.</p></div>";
  html += '<table class="src-table"><thead><tr><th>#</th><th>Site</th><th>Page</th><th>Topic</th><th>Guides citing it</th><th>Steps citing it</th></tr></thead><tbody>';
  for (const source of sources) {
    const stats = audit.perSource[source.id] || { trophies: 0, steps: 0 };
    html += "<tr><td>" + source.id + "</td><td>" + escapeHtml(source.site) + "</td>" +
      '<td><a href="' + escapeHtml(source.url) + '" target="_blank" rel="noopener">' + escapeHtml(source.title) + "</a></td>" +
      "<td>" + escapeHtml(source.topic) + "</td><td>" + stats.trophies + " of 55</td><td>" + stats.steps + "</td></tr>";
  }
  html += "</tbody></table>";
  html += '<p class="matrix-note">Source matrix: the official list comes from Exophase and PSNProfiles (names, descriptions, grades, hidden flags and PSN counts); the roadmap, difficulty and time come from PowerPyx and KeenGamer; the 100% checklist numbers come from Press Start, eGamers and CryptoGames; meditation spots come from PowerPyx, Beebom and HowToVideoGame. Where sources disagree, the trophy detail shows both versions and our call.</p>';
  return html;
}
