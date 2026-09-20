/* Compact customer handout and live training view share one rendering function. */
(function (root) {
  "use strict";
  function render({ state: S, meta, imageURL, videoURL, h }) {
    const E = root.NextSession, report = E.report(S.program, S.assignment.participantCount, S.sessionMinutes);
    const blockHTML = (b, bi) => {
      const a = report.blocks[bi], span = `${E.stamp(a.start)}–${E.stamp(a.end)}`, kind = b.clock?.kind;
      const heading = `<header class="client-block-heading"><span>${h(span)}</span><h3>${h(b.title)}</h3><strong>${E.stamp(a.total)}</strong></header>`;
      if (kind === "briefing") return `<section class="client-brief">${heading}<p>Aftal dagens niveau, ét fælles teknikmål og signal for at skrue ned. Klargør udstyr.</p></section>`;
      if (kind === "warmup") {
        const groups = [0, 1, 2, 3].map(i => b.exercises.map((ex, index) => ({ ex, index })).filter(x => x.ex.phaseIndex === i)).filter(x => x.length);
        return `<section class="client-block client-warmup">${heading}<p class="client-purpose">Gå fra roligt tempo til større bevægelser, teknikprøve og til sidst højere puls. RPE = din oplevede anstrengelse fra 1 til 10.</p>${groups.length ? groups.map(group => {
          const ex = group[0].ex, first = a.steps.find(s => s.exercise === group[0].index), last = a.steps.filter(s => s.exercise === group[group.length - 1].index).at(-1);
          return `<div class="client-phase"><span>${first ? `${E.stamp(a.start + first.start)}–${E.stamp(a.start + last.end)}` : ""}</span><div><strong>${h(ex.phase)}</strong><p>${group.map(x => { const d = E.doseFor(x.ex, b); return `${h(x.ex.clientName || x.ex.name)} (${h(d.mode)}: ${h(d.text)}${d.detail ? "; " + h(d.detail) : ""} + ${E.transitionFor(x.ex,b)} sek. skift)`; }).join(" + ")}</p><small>${h(ex.clientCue)}</small></div><b>RPE ${h(ex.targetRpe)}</b></div>`;
        }).join("") : `<p>${h(a.formula)}</p>`}</section>`;
      }
      if (kind === "cooldown") return `<section class="client-block client-cooldown">${heading}<p>${b.exercises.map(ex => `${h(ex.clientName || ex.name)}: ${h(E.doseFor(ex,b).text)}${E.doseFor(ex,b).detail ? ` (${h(E.doseFor(ex,b).detail)})` : ""}${E.transitionFor(ex,b) ? ` + ${E.transitionFor(ex,b)} sek. skift` : ""}${ex.clientCue?.includes("pr. side") ? ` (${h(ex.clientCue.match(/[^:]+: [\d.,]+ sek\. pr\. side/)?.[0] || ex.clientCue)})` : ""}`).join(" · ")}</p><p><b>${E.stamp(a.outro || 0)} fælles afslutning:</b> Én observation fra hver: Hvad hjalp makkeren dig med, og hvad justerer du næste gang?</p></section>`;
      const rows = b.exercises.map((ex, i) => {
        const dose = E.doseFor(ex, b), image = imageURL(ex), video = videoURL(ex), role = kind === "roles" ? `Rolle ${i + 1}` : `Øvelse ${i + 1}`;
        return `<article class="client-exercise"><div class="client-thumb">${image ? `<img src="${h(image)}" alt="${h(ex.name)}">` : `<span>${String(i + 1).padStart(2, "0")}</span>`}</div><div class="client-exercise-copy"><h4><small>${role}</small> ${h(ex.clientName || ex.name)}</h4><p>${h(ex.clientCue || ex.cue)}</p><small><b>Lettere:</b> ${h(ex.regression || "Tilpas med instruktøren")} · <b>Sværere:</b> ${h(ex.progression || "Tilpas med instruktøren")}</small>${ex.load ? `<small><b>Belastning:</b> ${h(ex.load)}</small>` : ""}${ex.notes ? `<small class="client-note">${h(ex.notes)}</small>` : ""}${video ? `<a href="${h(video)}" target="_blank" rel="noopener noreferrer">Video ↗</a>` : ""}</div><div class="client-dose"><b>${dose.mode}</b><strong>${h(dose.text)}</strong>${dose.detail ? `<small>${h(dose.detail)}</small>` : ""}<small>${E.transitionFor(ex,b)} sek. skift</small>${ex.targetRpe ? `<small>RPE ${h(ex.targetRpe)}</small>` : ""}</div></article>`;
      }).join("");
      return `<section class="client-block">${heading}<div class="client-block-rule"><b>${a.rounds || "?"} hele runder</b><span>${h(a.cooperation || "Aftal samarbejdet med instruktøren.")}</span></div>${rows}<p class="client-clock ${a.valid ? "" : "client-clock-error"}"><b>${a.valid ? "Tidsregnskab" : "Afklar tiden"}:</b> ${h(a.formula)}</p></section>`;
    };
    // Normal 55-minute program: warm-up and first work block on the front;
    // remaining work blocks and cooldown on the back. Custom programs keep all content.
    const groups = S.program.length <= 6 ? [S.program.slice(0, 3), S.program.slice(3)] : Array.from({ length: Math.ceil(S.program.length / 3) }, (_, i) => S.program.slice(i * 3, i * 3 + 3));
    let index = 0;
    return groups.filter(g => g.length).map((blocks, page) => `<section class="client-sheet"><header class="client-header"><div><span class="client-kicker">NEXT · SMALL GROUP TRAINING</span><h2>${h(meta.title || "Mit træningsprogram")}</h2><p>${h(meta.client || `${S.assignment.participantCount} deltagere`)}${meta.trainer ? ` · ${h(meta.trainer)}` : ""} · ${h(meta.date)}</p></div><strong>${report.seconds / 60}<small>MIN</small></strong></header>${page === 0 ? `<div class="client-key"><span><b>TID</b> Stop ved signalet.</span><span><b>GENTAGELSER</b> Følg antal og tempo; resten af vinduet er pause.</span></div>${meta.goal || meta.notes ? `<p class="client-goal">${meta.goal ? `<b>Mål:</b> ${h(meta.goal)} ` : ""}${meta.notes ? `<b>Hensyn:</b> ${h(meta.notes)}` : ""}</p>` : ""}${!report.valid ? `<p class="client-clock-error">Tiden er ikke godkendt endnu. Ret de markerede blokke før programmet bruges.</p>` : ""}` : ""}<div class="client-sheet-blocks">${blocks.map(b => blockHTML(b, index++)).join("")}</div><footer class="client-footer"><span>Vælg eget niveau. Kvalitet før tempo. Fortæl instruktøren, hvis noget skal tilpasses.</span><b>${page + 1} / ${groups.filter(g => g.length).length}</b></footer></section>`).join("");
  }
  root.NextClient = { render };
}(window));
