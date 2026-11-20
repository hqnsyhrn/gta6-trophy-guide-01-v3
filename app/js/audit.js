export function computeAudit(trophies, sources) {
  const audit = {
    total: trophies.length,
    grades: { Platinum: 0, Gold: 0, Silver: 0, Bronze: 0 },
    hidden: 0,
    steps: 0,
    cited: 0,
    backedTwoPlus: 0,
    disputes: 0,
    unconfirmed: 0,
    possiblyMissable: 0,
    atRisk: 0,
    counters: 0,
    sourcesTotal: sources.length,
    sitesTotal: new Set(sources.map((s) => s.site)).size,
    sourcesCited: 0,
    kinds: {},
    stages: {}
  };
  const usedSourceIds = new Set();
  const perSource = {};
  for (const source of sources) {
    perSource[source.id] = { trophies: 0, steps: 0 };
  }
  for (const trophy of trophies) {
    if (audit.grades[trophy.grade] !== undefined) audit.grades[trophy.grade] += 1;
    if (trophy.hidden) audit.hidden += 1;
    if (trophy.dispute) audit.disputes += 1;
    if (trophy.unconfirmed) audit.unconfirmed += 1;
    if (trophy.missable === "possible") audit.possiblyMissable += 1;
    if (trophy.missable === "watch") audit.atRisk += 1;
    if (trophy.counter) audit.counters += 1;
    audit.kinds[trophy.kind] = (audit.kinds[trophy.kind] || 0) + 1;
    audit.stages[trophy.stage] = (audit.stages[trophy.stage] || 0) + 1;
    const trophySources = new Set();
    for (const step of trophy.steps || []) {
      audit.steps += 1;
      const citedIds = step.sources || [];
      if (citedIds.length >= 1) audit.cited += 1;
      if (citedIds.length >= 2) audit.backedTwoPlus += 1;
      for (const id of citedIds) {
        usedSourceIds.add(id);
        trophySources.add(id);
        if (perSource[id]) perSource[id].steps += 1;
      }
    }
    for (const id of trophySources) {
      if (perSource[id]) perSource[id].trophies += 1;
    }
  }
  audit.sourcesCited = usedSourceIds.size;
  audit.perSource = perSource;
  return audit;
}

export function auditStripText(audit) {
  return (
    audit.total + "/" + audit.total + " official \u00b7 " +
    audit.grades.Platinum + "P " + audit.grades.Gold + "G " +
    audit.grades.Silver + "S " + audit.grades.Bronze + "B \u00b7 " +
    audit.hidden + " hidden \u00b7 " +
    audit.cited + "/" + audit.steps + " claims cited \u00b7 " +
    audit.backedTwoPlus + " backed by 2+ sources \u00b7 " +
    audit.sourcesCited + " sources \u00b7 " + audit.sitesTotal + " sites, read 20 Nov 2026 \u00b7 " +
    audit.possiblyMissable + " possibly missable \u00b7 " +
    audit.atRisk + " at risk \u00b7 " +
    audit.unconfirmed + " unconfirmed \u00b7 " +
    audit.disputes + " disputes shown both ways"
  );
}

export function sourceClaimCounts(trophy) {
  const counts = {};
  for (const step of trophy.steps || []) {
    for (const id of step.sources || []) {
      counts[id] = (counts[id] || 0) + 1;
    }
  }
  return counts;
}
