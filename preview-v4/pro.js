(function () {
  "use strict";
  const A = window.NEXTPlanner;
  const S = A.state;
  const E = window.NextSession;
  let clientView = true;
  const h = A.escapeHtml;
  const clone = value => JSON.parse(JSON.stringify(value));
  const $ = id => document.getElementById(id);
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const uid = () => window.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
  const categories = { warmup: "Opvarmning", lower: "Underkrop", upper: "Overkrop", core: "Core", pulse: "Puls", cooldown: "Bevægelighed" };
  const defaults = { title: "Mit træningsprogram", client: "", trainer: "", organization: "NEXT · Fitness", date: today(), goal: "", notes: "" };
  const pdfDefaults = { layout: "client", perPage: 2, fontSize: "normal", images: true, anatomy: true, cues: true, variations: true, videos: true, qr: true, music: true, assignment: true, practical: true };
  let meta = { ...defaults }, pdf = { ...pdfDefaults }, custom = [], favorites = [], libraryOverrides = {}, saved = [], undo = [], redo = [];
  let saveTimer, searchTimer, replaceTarget = null, activeSnapshotId = null, booting = true;
  let layoutPerPage = null, printing = false;
  const qrCache = new Map();
  const builtins = [];
  Object.entries(A.exercisePools).forEach(([category, exercises]) => exercises.forEach(exercise => {
    let old = builtins.find(item => item.name === exercise.name);
    if (old) { if (!old.categories.includes(category)) old.categories.push(category); }
    else builtins.push({ ...clone(exercise), id: exercise.name, categories: [category], category });
  }));
  const safeURL = value => {
    try { const u = new URL(String(value)); return /^(https?):$/.test(u.protocol) && !u.username && !u.password ? u.href : ""; } catch (_) { return ""; }
  };
  const imageURL = ex => /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(ex.image || "") ? ex.image : A.exerciseImages[ex.id || ex.name] ? "assets/images/exercises/" + A.exerciseImages[ex.id || ex.name] : "";
  const videoURL = ex => safeURL(ex.video || libraryOverrides[ex.id || ex.name]?.video || "");
  const catalog = () => [...builtins.map(ex => ({ ...ex, ...libraryOverrides[ex.id] })), ...custom];
  const total = () => S.program.reduce((sum, b) => sum + b.duration, 0);
  const input = (label, key, value, type = "text", extra = "") => `<label><span>${h(label)}</span><input type="${type}" name="${h(key)}" value="${h(value ?? "")}" ${extra}></label>`;
  const textarea = (label, key, value, rows = 2) => `<label class="wide"><span>${h(label)}</span><textarea name="${h(key)}" rows="${rows}" maxlength="3000">${h(value || "")}</textarea></label>`;
  const select = (label, key, value, options) => `<label><span>${h(label)}</span><select name="${h(key)}">${Object.entries(options).map(([v, t]) => `<option value="${h(v)}" ${String(v) === String(value) ? "selected" : ""}>${h(t)}</option>`).join("")}</select></label>`;
  function notify(message, error = false) { $("pro-status").textContent = message; $("pro-status").classList.toggle("error", error); }
  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (_) { return fallback; } }
  function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { notify("Browseren kunne ikke gemme. Download en programfil som sikkerhedskopi.", true); return false; } }
  function snapshot() { return { format: "NEXT-training", version: 4, savedAt: new Date().toISOString(), settings: clone(S), meta: clone(meta), pdf: clone(pdf), custom: clone(custom), libraryOverrides: clone(libraryOverrides), favorites: [...favorites] }; }
  function remember() { undo.push(snapshot()); if (undo.length > 20) undo.shift(); redo = []; }
  function refresh() { S.program.forEach((b, i) => { b.number = String(i).padStart(2, "0"); E.syncBlock(b, S.assignment.participantCount); }); A.syncControls(); A.syncAssignmentForm(); A.render(false); syncMeta(); syncPdf(); syncTargets(); renderSaved(); updateSummary(); A.markUnsaved(); }
  function restore(value) {
    const clean = validateSnapshot(value);
    Object.assign(S, clean.settings); meta = clean.meta; pdf = clean.pdf;
    custom = clean.custom; libraryOverrides = clean.libraryOverrides; favorites = clean.favorites;
    persistLibrary(); refresh(); renderLibrary();
  }
  function persistLibrary() { write("next-pro-library", { custom, favorites, libraryOverrides }); }
  function updateSummary() {
    if (!$("pro-status")) return;
    const count = S.program.reduce((n, b) => n + b.exercises.length, 0);
    $("workbench-count").textContent = `${count} øvelser · ${total()} min`;
    $("duration-check").textContent = total() === S.sessionMinutes ? `Minutplanen summerer til ${total()} min.` : `Programmet er ${total()} min. Dit nye mål er ${S.sessionMinutes} min.`;
    $("fit-time").textContent = `Fordel tiden til ${S.sessionMinutes} min`;
    $("fit-time").hidden = total() === S.sessionMinutes;
    $("undo-program").disabled = !undo.length; $("redo-program").disabled = !redo.length;
    $("program-title").textContent = meta.title || S.sessionType;
    const check = E.report(S.program, S.assignment.participantCount, S.sessionMinutes);
    $("clock-status").textContent = check.valid ? `Alle blokke er kontrolleret: ${E.stamp(check.seconds)} i alt, inklusive instruktion, pauser og skift.` : `Tiden skal afklares i ${check.blocks.filter(b => !b.valid).length} blokke${check.seconds !== check.targetSeconds ? "; samlet tid matcher ikke dit tidsmål" : ""}. Brug Redigér program eller lav et nyt kontrolleret forslag.`;
    $("clock-status").classList.toggle("clock-error", !check.valid);
    $("group-size").value = S.assignment.participantCount;
    renderClientView();
  }
  function syncMeta() { document.querySelectorAll("[data-meta]").forEach(el => el.value = meta[el.dataset.meta] || ""); }
  function syncPdf() {
    document.querySelectorAll("[data-pdf]").forEach(el => { if (el.type === "checkbox") el.checked = !!pdf[el.dataset.pdf]; else el.value = pdf[el.dataset.pdf]; });
    $("pdf-preset").value = pdf.layout;
    document.querySelectorAll("[data-detail-pdf]").forEach(el => el.hidden = pdf.layout === "client");
  }
  function clientHTML() { return window.NextClient.render({ state: S, meta, imageURL, videoURL, h }); }
  function renderClientView() {
    const target = $("client-program-view"); if (!target) return;
    target.innerHTML = clientHTML(); target.hidden = !clientView;
    $("program-timeline").hidden = clientView;
    $("view-client").setAttribute("aria-pressed", String(clientView)); $("view-editor").setAttribute("aria-pressed", String(!clientView));
  }
  function syncTargets() {
    const field = $("library-target"), selected = field.value;
    field.innerHTML = S.program.map((b, i) => `<option value="${i}">${h(b.title)}</option>`).join("");
    field.value = S.program[Number(selected)] ? selected : String(Math.min(2, S.program.length - 1));
  }
  function dialog(title, body, submitLabel, onSubmit, className = "") {
    const d = $("pro-dialog"); if (d.open) d.close();
    d.className = className;
    d.innerHTML = `<form id="pro-dialog-form"><header><div><span class="pro-kicker">NEXT · Træningsplan</span><h2 id="dialog-title">${h(title)}</h2></div><button type="button" class="icon-button" data-close aria-label="Luk vindue">×</button></header><div class="dialog-body">${body}</div><p id="dialog-error" class="form-error" role="alert"></p><footer><button type="button" class="secondary-button" data-close>Annuller</button>${submitLabel ? `<button class="save-button" type="submit">${h(submitLabel)}</button>` : ""}</footer></form>`;
    d.querySelectorAll("[data-close]").forEach(b => b.onclick = () => d.close());
    d.querySelector("form").onsubmit = async event => {
      event.preventDefault();
      try { const result = await onSubmit(new FormData(event.target), event.target); if (result !== false) d.close(); }
      catch (error) { $("dialog-error").textContent = error.message || "Oplysningerne kunne ikke gemmes."; }
    };
    d.showModal();
  }
  function checkNumber(value, min, max, label) { const n = Number(value); if (!Number.isFinite(n) || n < min || n > max) throw Error(`${label} skal være mellem ${min} og ${max}.`); return Math.round(n); }
  function fitTime() {
    remember(); const target = S.sessionMinutes, n = S.program.length;
    let weights = S.program.map(b => b.duration), sum = weights.reduce((a, b) => a + b, 0);
    let values = weights.map(w => Math.max(1, Math.floor(w / sum * target)));
    let diff = target - values.reduce((a, b) => a + b, 0), i = 0;
    while (diff !== 0 && i < 2000) { const k = i++ % n; if (diff > 0) { values[k]++; diff--; } else if (values[k] > 1) { values[k]--; diff++; } }
    S.program.forEach((b, i) => { b.duration = values[i]; if (b.id === "warmup") b.protocol = `${b.exercises.length} øvelser fordelt over ${b.duration} minutter. Tilpas arbejde, pauser og skift.`; });
    refresh(); notify(`Minutplanen er fordelt til præcis ${target} minutter. Kontrollér dosering og pauser.`);
  }
  function editBlock(index) {
    const b = S.program[index], c = b.clock || { kind: "together", intro: 60, transition: 20, roundRest: 30, window: 40 };
    dialog("Redigér blok og tidsregnskab", `<div class="pro-form-grid">${input("Blokkens navn", "title", b.title, "text", 'required maxlength="100"')}${input("Varighed i minutter", "duration", b.duration, "number", 'required min="1" max="180"')}${select("Samarbejdsform", "kind", c.kind, { together: "Fælles rytme og makkerfeedback", roles: "Skift mellem træner og teknikmakker", mirror: "Følg lederen / spejlgruppen", warmup: "Opvarmning i faser", cooldown: "Nedvarmning", briefing: "Velkomst / instruktion" })}${input("Instruktion før første runde (sek.)", "intro", c.intro, "number", 'required min="0" max="600"')}${input("Skift efter hver øvelse (sek.)", "transition", c.transition, "number", 'required min="0" max="600"')}${input("Fælles pause mellem runder (sek.)", "roundRest", c.roundRest, "number", 'required min="0" max="600"')}${input("Tidsvindue ved gentagelser (sek.)", "window", c.window || 40, "number", 'required min="5" max="600"')}</div><p class="form-help">Hele runder beregnes ud fra øvelsernes dosering. Resttiden afsættes til vand, feedback og klargøring. Ved gentagelser er bevægelsestiden antal × sekunder pr. gentagelse; den øvrige tid i vinduet er pause. ${b.clock ? "" : "En gammel blok uden tidsmodel sættes til tidsstyring, når du gemmer."}</p>`, "Gem beregnet blok", data => {
      const changed = clone(b), duration = checkNumber(data.get("duration"), 1, 180, "Varigheden"), nextTotal = total() - b.duration + duration;
      if (nextTotal < 20 || nextTotal > 180) throw Error("Det samlede program skal være 20–180 minutter.");
      if (!changed.clock) E.adopt(changed, S.assignment.participantCount);
      changed.title = data.get("title").trim(); changed.duration = duration;
      changed.clock = { version: 1, kind: data.get("kind"), intro: checkNumber(data.get("intro"), 0, 600, "Instruktion"), transition: checkNumber(data.get("transition"), 0, 600, "Skift"), roundRest: checkNumber(data.get("roundRest"), 0, 600, "Fælles pause"), window: checkNumber(data.get("window"), 5, 600, "Gentagelsesvindue") };
      const checked = E.analyze(changed, S.assignment.participantCount); if (!checked.valid) throw Error(checked.errors.join(" "));
      remember(); S.program[index] = changed; S.sessionMinutes = nextTotal; refresh(); notify("Blokken er genberegnet. Alle sekunder er fordelt.");
    });
  }
  function addBlock() {
    if (S.program.length >= 20) return notify("Et program kan indeholde højst 20 blokke.", true);
    if (total() >= 180) return notify("Programmet er allerede 180 minutter. Forkort en blok først.", true);
    remember(); const duration = Math.min(5, 180 - total());
    S.program.splice(Math.max(1, S.program.length - 1), 0, { id: uid(), number: String(S.program.length), title: "Ny træningsblok", eyebrow: "Egen blok", duration, protocol: "", pool: "core", exercises: [] });
    S.sessionMinutes = total(); refresh(); notify("Ny blok tilføjet. Vælg øvelser fra biblioteket.");
  }
  function blockTools(b) {
    const a = E.analyze(S.program[b], S.assignment.participantCount);
    return `<div class="block-tools"><button type="button" data-pro="edit-block" data-b="${b}">Redigér blok</button><button type="button" data-pro="add-to-block" data-b="${b}">+ Tilføj øvelse</button><button type="button" data-pro="remove-block" data-b="${b}">Fjern blok</button></div><div class="block-clock ${a.valid ? "" : "clock-error"}"><p><b>${a.valid ? "Tiden er kontrolleret" : "Tiden skal afklares"}</b> · ${a.valid ? `${a.rounds} hele runder` : h(a.errors.join(" "))}</p>${a.valid ? `<p>${h(a.cooperation || "")}</p><details><summary>Se tidslinjen i sekunder</summary><ol>${a.steps.map(x => `<li><time>${E.stamp(x.start)}–${E.stamp(x.end)}</time><span>${h(x.label)}</span></li>`).join("")}</ol></details>` : ""}</div>`;
  }
  function prescription(ex) {
    const parts = [];
    if (ex.sets) parts.push(`${ex.sets} sæt`);
    if (ex.rest) parts.push(`Pause: ${ex.rest}`);
    if (ex.load) parts.push(`Belastning: ${ex.load}`);
    if (ex.tempo) parts.push(`Tempo: ${ex.tempo}`);
    if (ex.rpe) parts.push(`RPE ${ex.rpe}/10`);
    return parts.join(" · ");
  }
  function exerciseHTML(ex, b, e) {
    return `<div class="exercise-row" data-b="${b}" data-e="${e}"><button class="exercise-main" type="button" aria-expanded="false"><span class="exercise-index">${String(e + 1).padStart(2, "0")}</span><span><strong>${h(ex.name)}</strong><small>${h(ex.focus)} · ${h(ex.equipment)}</small></span><span class="details-toggle">+</span></button><div class="exercise-tools"><button type="button" data-pro="edit-exercise" data-b="${b}" data-e="${e}">Redigér</button><button type="button" data-pro="replace" data-b="${b}" data-e="${e}">Udskift</button><button type="button" data-pro="up" data-b="${b}" data-e="${e}" ${e === 0 ? "disabled" : ""} aria-label="Flyt ${h(ex.name)} op">↑</button><button type="button" data-pro="down" data-b="${b}" data-e="${e}" ${e === S.program[b].exercises.length - 1 ? "disabled" : ""} aria-label="Flyt ${h(ex.name)} ned">↓</button><button type="button" data-pro="remove-exercise" data-b="${b}" data-e="${e}" aria-label="Fjern ${h(ex.name)}">Fjern</button></div><div class="exercise-details" hidden><label class="exercise-dose-field"><span>Gentagelser / arbejdstid</span><input class="exercise-dose-input" readonly title="Brug Redigér til at vælge tid eller gentagelser" type="text" maxlength="180" value="${h(ex.dosage || A.dosageFor(S.program[b].pool))}" data-block="${b}" data-exercise="${e}"></label>${prescription(ex) ? `<p class="prescription">${h(prescription(ex))}</p>` : ""}<div class="coaching-grid"><div><span>Cue</span><p>${h(ex.cue)}</p></div><div><span>Regression</span><p>${h(ex.regression)}</p></div><div><span>Progression</span><p>${h(ex.progression)}</p></div></div>${ex.notes ? `<p class="exercise-note">${h(ex.notes)}</p>` : ""}${visualHTML(ex)}${videoURL(ex) ? `<a class="video-link" href="${h(videoURL(ex))}" target="_blank" rel="noopener noreferrer">Åbn instruktionsvideo ↗</a>` : ""}</div></div>`;
  }
  function visualHTML(ex) {
    const g = ex.guide || { start: "", finish: "", muscles: [], roles: [] }, image = imageURL(ex);
    const keys = (g.muscles || []).filter(k => A.muscleGroups[k]);
    return `<section class="exercise-learning" aria-label="Udførelse og muskelgrupper for ${h(ex.name)}"><div class="exercise-learning-grid"><div class="movement-panel">${image ? `<div class="movement-visual"><img src="${h(image)}" alt="${h(ex.name)} – udførelse"></div>` : `<div class="no-exercise-image">Tilføj dit eget billede via Redigér.</div>`}<div class="movement-steps"><div><span>01</span><p>${h(g.start)}</p></div><div><span>02</span><p>${h(g.finish)}</p></div></div></div>${keys.length ? `<aside class="muscle-panel"><div><span>MUSKELGRUPPER</span><h4>Aktive muskler</h4></div>${A.anatomySvg(keys)}<ul>${keys.map((key, i) => `<li><i aria-hidden="true"></i><div><strong>${h(A.muscleGroups[key].latin)}</strong><small>${h((g.roles?.[i] ? g.roles[i] + " · " : "") + A.muscleGroups[key].danish)}</small></div></li>`).join("")}</ul></aside>` : ""}</div></section>`;
  }
  function qrSVG(url) {
    if (qrCache.has(url)) return qrCache.get(url);
    try {
      const q = new window.NextQR(-1, 1); q.addData(unescape(encodeURIComponent(url))); q.make();
      const n = q.getModuleCount(), size = n + 8, path = [];
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) path.push(`M${x + 4},${y + 4}h1v1h-1z`);
      const svg = `<svg class="video-qr" viewBox="0 0 ${size} ${size}" role="img" aria-label="QR-kode til instruktionsvideo" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="white"/><path d="${path.join("")}" fill="black"/></svg>`;
      qrCache.set(url, svg); return svg;
    } catch (_) { return ""; }
  }
  function renderPrint() {
    if (printing && document.body.classList.contains("printing-full-program")) return;
    if (pdf.layout === "client") { $("print-exercise-pages").innerHTML = clientHTML(); return; }
    const entries = S.program.flatMap((b, bi) => b.exercises.map(ex => ({ ex, b, bi })));
    const size = layoutPerPage || Number(pdf.perPage), pages = [];
    for (let i = 0; i < entries.length; i += size) {
      const chunk = entries.slice(i, i + size);
      pages.push(`<section class="pro-print-page count-${size}"><header class="pro-page-header"><span>${h(meta.organization)}</span><strong>${h(meta.title)}</strong><span>${h(meta.client)}</span></header><div class="pro-print-cards">${chunk.map(({ ex, b }, j) => {
        const image = imageURL(ex), g = ex.guide || {}, muscles = (g.muscles || []).filter(k => A.muscleGroups[k]), url = videoURL(ex);
        return `<article class="pro-print-card"><div class="pro-print-title"><b>${String(i + j + 1).padStart(2, "0")}</b><div><small>${h(b.title)}</small><h3>${h(ex.name)}</h3><p>${h(ex.equipment)}</p></div></div><div class="pro-print-dose"><strong>GENTAGELSER / ARBEJDSTID</strong><span>${h(ex.dosage || A.dosageFor(b.pool))}</span></div>${prescription(ex) ? `<p class="pro-print-prescription">${h(prescription(ex))}</p>` : ""}<div class="pro-print-visuals">${pdf.images && image ? `<img class="pro-print-movement" src="${h(image)}" alt="${h(ex.name)}">` : ""}${pdf.anatomy && muscles.length ? `<div class="pro-print-anatomy">${A.anatomySvg(muscles)}<p>${muscles.map((k, n) => `${h(A.muscleGroups[k].danish)}${g.roles?.[n] ? ` (${h(g.roles[n])})` : ""}`).join(" · ")}</p></div>` : ""}</div>${pdf.cues ? `<div class="pro-print-instructions">${g.start ? `<p><b>Start:</b> ${h(g.start)}</p>` : ""}${g.finish ? `<p><b>Bevægelse:</b> ${h(g.finish)}</p>` : ""}${ex.cue ? `<p><b>Fokus:</b> ${h(ex.cue)}</p>` : ""}</div>` : ""}${pdf.variations ? `<div class="pro-print-variations"><p><b>Lettere:</b> ${h(ex.regression)}</p><p><b>Sværere:</b> ${h(ex.progression)}</p></div>` : ""}${ex.notes ? `<p class="pro-print-notes">${h(ex.notes)}</p>` : ""}${pdf.videos && url ? `<div class="pro-print-video"><a href="${h(url)}" target="_blank" rel="noopener noreferrer">${pdf.qr ? qrSVG(url) : ""}<span>Åbn instruktionsvideo ↗</span></a></div>` : ""}</article>`;
      }).join("")}</div><footer class="pro-page-footer"><span>${h(meta.trainer || meta.organization)}${meta.date ? " · " + h(meta.date) : ""}</span><span>Øvelsesark ${Math.floor(i / size) + 1} / ${Math.ceil(entries.length / size)}</span></footer></section>`);
    }
    $("print-exercise-pages").innerHTML = pages.join("");
    $("print-exercise-pages").dataset.font = pdf.fontSize;
  }
  function programText() {
    let minute = 0;
    return [meta.title, `${meta.organization} · ${meta.date}`, meta.client && `Klient / hold: ${meta.client}`, meta.trainer && `Instruktør: ${meta.trainer}`, `${total()} minutter · ${S.sessionType}`, meta.goal && `Mål: ${meta.goal}`, meta.notes && `Fokus og hensyn: ${meta.notes}`, ...S.program.map(b => {
      const start = minute; minute += b.duration;
      return `\n${start}–${minute} min · ${b.title}\n${b.protocol}\n` + b.exercises.map((ex, i) => [ `${i + 1}. ${ex.name}`, `Gentagelser / arbejdstid: ${ex.dosage || A.dosageFor(b.pool)}`, prescription(ex), ex.guide?.start && `Start: ${ex.guide.start}`, ex.guide?.finish && `Bevægelse: ${ex.guide.finish}`, ex.cue && `Fokus: ${ex.cue}`, ex.regression && `Lettere: ${ex.regression}`, ex.progression && `Sværere: ${ex.progression}`, ex.notes, videoURL(ex) ].filter(Boolean).join("\n")).join("\n\n");
    })].filter(Boolean).join("\n");
  }
  function printDocumentHTML() {
    const ids = pdf.layout === "client" ? ["print-exercise-pages"] : ["pro-print-summary", ...(pdf.assignment ? ["assignment-print-summary"] : []), ...(pdf.music ? ["print-music-sheet"] : []), "print-exercise-pages", ...(pdf.practical ? ["print-practical-sheet"] : [])];
    const content = ids.map(id => { const el = $(id).cloneNode(true); el.removeAttribute("aria-hidden"); return el.outerHTML; }).join("");
    return `<!doctype html><html lang="da"><head><meta charset="utf-8"><base href="${h(new URL(".", document.baseURI).href)}"><title>${h(meta.title)}</title><link rel="stylesheet" href="css/style.css?v=4.1"><link rel="stylesheet" href="css/pro.css?v=4.1"><link rel="stylesheet" href="css/print.css?v=4.1"><link rel="stylesheet" href="css/client.css?v=4.1"></head><body class="pdf-document-preview ${pdf.layout === "client" ? "client-output" : ""}">${content}</body></html>`;
  }
  async function readyFrame(frame) {
    await frame.contentDocument.fonts.ready;
    await Promise.all(Array.from(frame.contentDocument.images).map(img => img.decode ? img.decode().catch(() => {}) : Promise.resolve()));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }
  async function prepareLayout(frame) {
    layoutPerPage = Number(pdf.perPage);
    A.preparePrint();
    const html = printDocumentHTML();
    A.restoreAfterPrint();
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error("Forhåndsvisningen kunne ikke indlæses. Prøv igen.")), 15000);
      frame.onload = () => { clearTimeout(timer); resolve(); };
      frame.srcdoc = html;
    });
    await readyFrame(frame);
    if (pdf.layout === "client") {
      const target = frame.contentDocument.getElementById("print-exercise-pages"), pages = Array.from(target.querySelectorAll(".client-sheet"));
      const large = pages.filter(page => page.scrollHeight > page.clientHeight + 2);
      large.forEach(page => page.classList.add("client-flow"));
      $("print-exercise-pages").innerHTML = target.innerHTML;
      return large.length ? "Lange tekster eller mange øvelser fortsætter på ekstra sider. Alt indhold bevares; kontrollér sideskiftene i udskriftsvinduet." : `Kundeprogram: ${pages.length} A4-sider. Vælg A4, 100 % og slå browserens egne sidehoveder fra.`;
    }
    const sizes = [6, 4, 2, 1].filter(n => n <= Number(pdf.perPage));
    let longPages = 0;
    for (const size of sizes) {
      layoutPerPage = size; renderPrint();
      const target = frame.contentDocument.getElementById("print-exercise-pages");
      target.innerHTML = $("print-exercise-pages").innerHTML;
      await readyFrame(frame);
      const overflow = Array.from(target.querySelectorAll(".pro-print-card")).filter(card => card.scrollHeight > card.clientHeight + 2);
      if (!overflow.length) break;
      if (size === 1) {
        overflow.forEach(card => card.closest(".pro-print-page").classList.add("flow-page"));
        longPages = overflow.length;
        $("print-exercise-pages").innerHTML = target.innerHTML;
      }
    }
    return `${layoutPerPage === Number(pdf.perPage) ? `Op til ${layoutPerPage} øvelser pr. side.` : `Layoutet er tilpasset til ${layoutPerPage} øvelser pr. side, så indholdet kan være der.`}${longPages ? " Lange øvelsestekster fortsætter på flere sider." : ""} Den endelige sideskiftning vises i browserens udskriftsvindue.`;
  }
  async function previewPdf() {
    dialog("Forhåndsvis PDF", `<p class="pdf-preview-note" id="pdf-preview-note" role="status">Forbereder forhåndsvisningen …</p><div class="pdf-preview-scroll"><iframe id="pdf-preview-frame" title="Forhåndsvisning af træningsprogram" sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe></div>`, "Print / gem PDF", () => { printProgram(); return false; }, "pdf-preview-dialog");
    try { $("pdf-preview-note").textContent = await prepareLayout($("pdf-preview-frame")); }
    catch (error) { $("pdf-preview-note").textContent = error.message; }
  }
  async function printProgram(event) {
    if (printing) return;
    const check = E.report(S.program, S.assignment.participantCount, S.sessionMinutes);
    if (!check.valid) return notify("Ret tidsregnskabet i de markerede blokke, før du udskriver. Du kan se dem under Redigér program.", true);
    printing = true;
    const button = event?.currentTarget, label = button?.textContent;
    if (button) { button.disabled = true; button.textContent = "Forbereder PDF …"; }
    const frame = document.createElement("iframe"); frame.className = "pdf-measure-frame"; frame.title = "Forbereder dokument"; frame.setAttribute("aria-hidden", "true"); frame.setAttribute("sandbox", "allow-same-origin"); document.body.appendChild(frame);
    try {
      const message = await prepareLayout(frame);
      // Keep the measured pages, including flow pages for unusually long text.
      const measured = $("print-exercise-pages").innerHTML;
      A.preparePrint(); $("print-exercise-pages").innerHTML = measured;
      await document.fonts.ready;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      window.print(); notify(message);
    } catch (error) { notify(error.message || "PDF'en kunne ikke klargøres.", true); }
    finally { frame.remove(); A.restoreAfterPrint(); printing = false; if (button) { button.disabled = false; button.textContent = label; } }
  }
  function preparePrint() {
    document.body.classList.toggle("client-output", pdf.layout === "client");
    ["music", "assignment", "practical"].forEach(key => document.body.classList.toggle("pro-no-" + key, !pdf[key]));
    let minute = 0;
    $("pro-print-summary").innerHTML = `<header><img src="assets/images/next-logo.png" alt="NEXT"><span>${h(meta.organization)}</span></header><p class="pro-kicker">TRÆNINGSPROGRAM · ${h(meta.date)}</p><h1>${h(meta.title || "Træningsprogram")}</h1><div class="print-client-row"><div><small>UDARBEJDET TIL</small><strong>${h(meta.client || "Hold / individuel træning")}</strong></div><div><small>INSTRUKTØR</small><strong>${h(meta.trainer || "Ikke angivet")}</strong></div><div><small>VARIGHED</small><strong>${total()} min</strong></div></div>${meta.goal ? `<h2>Mål</h2><p>${h(meta.goal)}</p>` : ""}${meta.notes ? `<h2>Fokus og hensyn</h2><p>${h(meta.notes)}</p>` : ""}<h2>Minutplan</h2><table><thead><tr><th>Tid</th><th>Blok</th><th>Instruktion</th></tr></thead><tbody>${S.program.map(b => { let start = minute; minute += b.duration; return `<tr><td>${start}–${minute} min</td><td>${h(b.title)}</td><td>${h(b.protocol)}</td></tr>`; }).join("")}</tbody></table><p class="print-profile">${h(S.age)} år · ${h(S.level)} · ${h(S.sessionType)} · Intensitet ${S.intensity}/10</p>`;
  }
  function renderLibrary() {
    const search = $("library-search").value.toLocaleLowerCase("da"), category = $("library-category").value, equipment = $("library-equipment").value, muscle = $("library-muscle").value;
    const items = catalog().filter(ex => (!category || (ex.categories || [ex.category]).includes(category)) && (!equipment || ex.equipment === equipment) && (!muscle || ex.guide?.muscles?.includes(muscle)) && (!$("library-low-impact").checked || ex.lowImpact) && (!$("library-favorites").checked || favorites.includes(ex.id || ex.name)) && `${ex.name} ${ex.focus} ${ex.equipment} ${(ex.guide?.muscles || []).map(k => A.muscleGroups[k]?.danish + " " + A.muscleGroups[k]?.latin).join(" ")}`.toLocaleLowerCase("da").includes(search));
    $("library-count").textContent = `${items.length} af ${catalog().length} øvelser`;
    $("library-grid").innerHTML = items.length ? items.map(ex => `<article class="library-card"><button type="button" class="favorite-button" data-pro="favorite" data-id="${h(ex.id || ex.name)}" aria-label="Favorit: ${h(ex.name)}" aria-pressed="${favorites.includes(ex.id || ex.name)}">${favorites.includes(ex.id || ex.name) ? "★" : "☆"}</button><button type="button" class="library-preview" aria-label="Se ${h(ex.name)}" data-pro="preview" data-id="${h(ex.id || ex.name)}">${imageURL(ex) ? `<img src="${h(imageURL(ex))}" alt="" loading="lazy">` : `<span class="custom-exercise-placeholder">Egen øvelse</span>`}</button><div class="library-card-content"><p class="pro-kicker">${h((ex.categories || [ex.category]).map(k => categories[k]).filter(Boolean).join(" · "))}</p><h3>${h(ex.name)}</h3><p>${h(ex.equipment)}${ex.lowImpact ? " · uden hop" : ""}</p><div><button class="secondary-button" type="button" data-pro="preview" data-id="${h(ex.id || ex.name)}">Se øvelse</button><button class="save-button" type="button" data-pro="add-exercise" data-id="${h(ex.id || ex.name)}">${replaceTarget ? "Vælg" : "+ Tilføj"}</button></div></div></article>`).join("") : `<div class="library-empty"><h3>Ingen øvelser matcher</h3><p>Prøv et andet søgeord eller fjern et filter.</p><button class="secondary-button" type="button" data-pro="reset-filters">Nulstil filtre</button></div>`;
  }
  function openLibrary(b, e = null) {
    replaceTarget = e === null ? null : { b, e }; syncTargets(); $("library-target").value = b;
    $("library-mode").hidden = !replaceTarget;
    $("library-mode-text").textContent = replaceTarget ? `Vælg en erstatning for ${S.program[b].exercises[e].name}.` : "";
    renderLibrary(); $("exercise-library").scrollIntoView({ behavior: "smooth" }); $("library-search").focus({ preventScroll: true });
  }
  function addExercise(id) {
    const source = catalog().find(ex => (ex.id || ex.name) === id); if (!source) return;
    const b = replaceTarget ? replaceTarget.b : Number($("library-target").value);
    if (!S.program[b]) return;
    if (S.program.flatMap(b => b.exercises).length >= 100) return notify("Et program kan indeholde op til 100 øvelser.", true);
    remember(); const ex = clone(source);
    if (replaceTarget) { const before = S.program[b].exercises[replaceTarget.e]; ["dose", "transitionSeconds", "phase", "phaseIndex", "targetRpe"].forEach(k => { if (before[k] !== undefined) ex[k] = clone(before[k]); }); }
    ex.dose ||= { mode: "time", seconds: S.program[b].clock?.window || 40 }; ex.dosage = E.doseLabel(ex, S.program[b].clock).text;
    if (replaceTarget) S.program[b].exercises[replaceTarget.e] = ex; else S.program[b].exercises.push(ex);
    replaceTarget = null; $("library-mode").hidden = true; refresh(); renderLibrary(); notify(`${ex.name} er tilføjet til ${S.program[b].title}.`);
  }
  function previewExercise(id) {
    const ex = catalog().find(item => (item.id || item.name) === id); if (!ex) return;
    dialog(ex.name, `${visualHTML(ex)}<p>${h(ex.cue)}</p><div class="preview-actions"><button type="button" class="secondary-button" id="edit-library-exercise">${ex.custom ? "Redigér egen øvelse" : "Tilføj videolink"}</button>${ex.custom ? '<button type="button" class="secondary-button" id="delete-library-exercise">Slet fra bibliotek</button>' : ""}</div>`, "Tilføj til program", () => addExercise(id), "wide-dialog");
    $("edit-library-exercise").onclick = () => ex.custom ? editExercise(null, null, ex) : editLibraryVideo(ex);
    if (ex.custom) $("delete-library-exercise").onclick = () => { custom = custom.filter(item => item.id !== ex.id); persistLibrary(); $("pro-dialog").close(); renderLibrary(); notify("Øvelsen er fjernet fra biblioteket. Kopier i programmer er bevaret."); };
  }
  function editLibraryVideo(ex) {
    dialog("Instruktionsvideo: " + ex.name, `<div class="pro-form-grid">${input("Link til video", "video", videoURL(ex), "url", 'maxlength="1000" placeholder="https://…"')}</div><p class="form-help">Brug et link til en video, du har valgt. QR-koden genereres på PDF'en, når der er et videolink.</p>`, "Gem videolink", data => {
      const value = data.get("video").trim(); if (value && !safeURL(value)) throw Error("Brug et gyldigt http- eller https-link.");
      libraryOverrides[ex.id] = { video: safeURL(value) }; persistLibrary(); renderPrint(); notify("Videolinket er gemt i dit lokale øvelsesbibliotek.");
    });
  }
  async function loadImage(file) {
    if (!file?.size) return null;
    if (file.size > 2 * 1024 * 1024 || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw Error("Vælg PNG, JPG eller WebP på højst 2 MB.");
    return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = () => reject(Error("Billedet kunne ikke læses.")); r.readAsDataURL(file); });
  }
  function editExercise(b, e, libraryExercise = null) {
    const isNew = b === null && !libraryExercise, isLibrary = b === null;
    const ex = isNew ? { id: uid(), custom: true, name: "", equipment: "Kropsvægt", category: "lower", lowImpact: true, guide: { muscles: [], roles: [] } } : libraryExercise || S.program[b].exercises[e];
    const g = ex.guide || { muscles: [] };
    const blocks = Object.fromEntries(S.program.map((item, i) => [i, item.title]));
    dialog(isNew ? "Opret egen øvelse" : "Redigér " + ex.name, `<div class="pro-form-grid">${input("Øvelsens navn", "name", ex.name, "text", 'required maxlength="100"')}${select("Udstyr", "equipment", ex.equipment, { "Kropsvægt": "Kropsvægt", "Måtte": "Måtte", "Håndvægte": "Håndvægte", "Elastik": "Elastik", "Andet": "Andet" })}${select("Doseringstype", "doseMode", ex.dose?.mode || "time", { time: "TID – arbejde til signalet", reps: "GENTAGELSER – antal i et fast tidsvindue" })}<div data-dose-time>${input("Arbejdstid (sekunder)", "workSeconds", ex.dose?.seconds || 40, "number", 'min="5" max="600"')}</div><div data-dose-reps>${input("Gentagelser i alt", "reps", ex.dose?.reps || 8, "number", 'min="1" max="60"')}</div><div data-dose-reps>${input("Sekunder pr. gentagelse", "repTempo", ex.dose?.tempo || 4, "number", 'min="1" max="10"')}</div><p class="form-help wide">Runder, skift og fælles pauser beregnes i blokken. Ved øvelser på to sider er antal gentagelser det samlede antal; fordel dem ligeligt mellem siderne.</p>${input("Belastning", "load", ex.load, "text", 'maxlength="100" placeholder="Fx 2 × 10 kg"')}${input("Intensitet (RPE 1–10)", "rpe", ex.rpe || (/^\d+$/.test(ex.targetRpe || "") ? ex.targetRpe : ""), "number", 'min="1" max="10"')}${isLibrary ? select("Kategori", "category", ex.category || "lower", categories) : select("Placér i blok", "target", b, blocks)}${input("Link til instruktionsvideo", "video", videoURL(ex), "url", 'maxlength="1000" placeholder="https://…"')}${textarea("Startposition", "start", g.start)}${textarea("Bevægelse", "finish", g.finish)}${textarea("Instruktørens cue", "cue", ex.cue)}${input("Kundenavn på øvelsen (valgfrit)", "clientName", ex.clientName, "text", 'maxlength="180"')}${textarea("Kort instruktion til kunden (valgfrit)", "clientCue", ex.clientCue)}${textarea("Lettere variation", "regression", ex.regression)}${textarea("Sværere variation", "progression", ex.progression)}${textarea("Noter til øvelsen", "notes", ex.notes)}<label class="wide"><span>Eget billede (PNG, JPG, WebP · maks. 2 MB)</span><input type="file" name="image" accept="image/png,image/jpeg,image/webp"></label>${ex.image ? '<label class="pro-check"><input type="checkbox" name="removeImage"> Fjern eget billede</label>' : ""}<label class="pro-check"><input type="checkbox" name="lowImpact" ${ex.lowImpact ? "checked" : ""}> Uden hop</label><fieldset class="muscle-picker wide"><legend>Muskelgrupper</legend>${Object.entries(A.muscleGroups).map(([k, v]) => `<label class="pro-check"><input type="checkbox" name="muscles" value="${k}" ${(g.muscles || []).includes(k) ? "checked" : ""}>${h(v.danish)}</label>`).join("")}</fieldset></div>`, isNew ? "Opret i bibliotek" : "Gem ændringer", async data => {
      const url = data.get("video").trim(); if (url && !safeURL(url)) throw Error("Videolinket skal begynde med http:// eller https://.");
      const image = await loadImage(data.get("image"));
      const muscles = data.getAll("muscles").filter(k => A.muscleGroups[k]);
      const changed = { ...clone(ex), id: ex.id || ex.name, name: data.get("name").trim(), equipment: data.get("equipment"), lowImpact: data.has("lowImpact"), video: safeURL(url), guide: { start: data.get("start"), finish: data.get("finish"), muscles, roles: muscles.map(k => g.roles?.[(g.muscles || []).indexOf(k)] || "") } };
      if (!changed.name) throw Error("Giv øvelsen et navn.");
      ["load", "rpe", "cue", "clientName", "clientCue", "regression", "progression", "notes"].forEach(k => changed[k] = data.get(k) || "");
      changed.dose = data.get("doseMode") === "reps" ? { mode: "reps", reps: checkNumber(data.get("reps"), 1, 60, "Gentagelser"), tempo: checkNumber(data.get("repTempo"), 1, 10, "Tempo") } : { mode: "time", seconds: checkNumber(data.get("workSeconds"), 5, 600, "Arbejdstid") };
      delete changed.sets; delete changed.rest; delete changed.tempo;
      if (changed.rpe) changed.targetRpe = changed.rpe;
      changed.dosage = E.doseLabel(changed, !isLibrary ? S.program[Number(data.get("target"))].clock : {}).text;
      if (!isLibrary) { const target = Number(data.get("target")), trial = clone(S.program[target]); if (target === b) trial.exercises[e] = changed; else trial.exercises.push(changed); if (trial.clock) { const result = E.analyze(trial, S.assignment.participantCount); if (!result.valid) throw Error(result.errors.join(" ")); } }
      changed.focus = muscles.map(k => A.muscleGroups[k].danish).slice(0, 3).join(" · ") || "Egen øvelse";
      if (image) changed.image = image; else if (data.has("removeImage")) delete changed.image;
      remember();
      if (isLibrary) { changed.category = data.get("category"); changed.categories = [changed.category]; changed.custom = true; const pos = custom.findIndex(item => item.id === changed.id); if (pos >= 0) custom[pos] = changed; else custom.push(changed); persistLibrary(); }
      else { const target = Number(data.get("target")); if (target !== b) { S.program[b].exercises.splice(e, 1); S.program[target].exercises.push(changed); } else S.program[b].exercises[e] = changed; }
      refresh(); renderLibrary(); notify(isLibrary ? "Øvelsen er gemt i dit bibliotek." : "Øvelsen er opdateret.");
    }, "wide-dialog");
    const mode = $("pro-dialog").querySelector('[name="doseMode"]');
    const syncDoseFields = () => { $("pro-dialog").querySelectorAll("[data-dose-time]").forEach(el => el.hidden = mode.value !== "time"); $("pro-dialog").querySelectorAll("[data-dose-reps]").forEach(el => el.hidden = mode.value !== "reps"); };
    mode.onchange = syncDoseFields; syncDoseFields();
  }
  function validateSnapshot(raw) {
    if (!raw || raw.format !== "NEXT-training" || ![3, 4].includes(raw.version) || !raw.settings || !Array.isArray(raw.settings.program)) throw Error("Filen er ikke en NEXT-programfil (version 3 eller 4).");
    const text = (x, n = 3000) => String(x ?? "").slice(0, n);
    const enumValue = (x, values, fallback) => values.includes(x) ? x : fallback;
    const cleanExercise = ex => {
      if (!ex || typeof ex !== "object") throw Error("Filen indeholder en ugyldig øvelse.");
      const out = {}; ["id", "name", "focus", "equipment", "dosage", "sets", "rest", "load", "tempo", "rpe", "cue", "regression", "progression", "notes"].forEach(k => out[k] = text(ex[k], ["notes", "cue", "regression", "progression"].includes(k) ? 3000 : 180));
      ["clientName", "clientCue", "phase", "targetRpe"].forEach(k => out[k] = text(ex[k], k === "clientCue" ? 3000 : 180));
      if (ex.phaseIndex !== undefined) out.phaseIndex = checkNumber(ex.phaseIndex, 0, 3, "Opvarmningsfase");
      if (ex.transitionSeconds !== undefined) out.transitionSeconds = checkNumber(ex.transitionSeconds, 0, 600, "Skift");
      if (ex.dose?.mode === "time") out.dose = { mode: "time", seconds: checkNumber(ex.dose.seconds, 5, 600, "Arbejdstid") };
      if (ex.dose?.mode === "reps") out.dose = { mode: "reps", reps: checkNumber(ex.dose.reps, 1, 60, "Gentagelser"), tempo: checkNumber(ex.dose.tempo, 1, 10, "Tempo") };
      if (!out.name) throw Error("En øvelse mangler et navn.");
      out.video = safeURL(text(ex.video, 1000)); out.lowImpact = !!ex.lowImpact; out.custom = !!ex.custom;
      out.category = enumValue(ex.category, Object.keys(categories), "lower"); out.categories = [out.category];
      out.guide = { start: text(ex.guide?.start), finish: text(ex.guide?.finish), muscles: (Array.isArray(ex.guide?.muscles) ? ex.guide.muscles : []).filter(k => A.muscleGroups[k]).slice(0, 21), roles: (Array.isArray(ex.guide?.roles) ? ex.guide.roles : []).map(v => text(v, 100)).slice(0, 21) };
      if (ex.image && ex.image.length <= 3000000 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(ex.image)) out.image = ex.image;
      return out;
    };
    const settings = clone(S), src = raw.settings;
    settings.age = enumValue(src.age, ["18–29", "30–44", "45–59", "60+"], "30–44");
    settings.level = enumValue(src.level, ["Begynder", "Let øvet", "Øvet"], "Let øvet");
    settings.sessionType = enumValue(src.sessionType, ["Hele kroppen", "Styrke & puls", "Core & glutes", "Low impact"], "Hele kroppen");
    settings.music = enumValue(src.music, ["Pop", "Elektronisk", "Hip-hop / R&B", "Rock", "80'er & 90'er", "Danske hits"], "Pop");
    settings.equipment = enumValue(src.equipment, ["Kropsvægt", "Måtte", "Håndvægte", "Elastik"], "Håndvægte");
    settings.sessionMinutes = checkNumber(src.sessionMinutes, 20, 180, "Sessionstid"); settings.warmupMinutes = checkNumber(src.warmupMinutes, 5, 10, "Opvarmning"); settings.intensity = checkNumber(src.intensity, 3, 9, "Intensitet"); settings.version = Number(src.version) || 0;
    if (!src.program.length || src.program.length > 20) throw Error("Programmet skal indeholde 1–20 blokke.");
    let count = 0;
    const cleanClock = c => c?.version === 1 ? { version: 1, kind: enumValue(c.kind, ["briefing", "warmup", "cooldown", "together", "roles", "mirror"], "together"), intro: checkNumber(c.intro || 0, 0, 600, "Instruktion"), transition: checkNumber(c.transition || 0, 0, 600, "Skift"), roundRest: checkNumber(c.roundRest || 0, 0, 600, "Fælles pause"), window: checkNumber(c.window || 40, 5, 600, "Gentagelsesvindue") } : undefined;
    settings.program = src.program.map((b, i) => { if (!Array.isArray(b.exercises)) throw Error("Ugyldig træningsblok."); count += b.exercises.length; return { id: text(b.id, 100), number: String(i).padStart(2, "0"), title: text(b.title, 100), eyebrow: text(b.eyebrow, 100), duration: checkNumber(b.duration, 1, 180, "Bloktid"), protocol: text(b.protocol), clock: cleanClock(b.clock), pool: enumValue(b.pool, Object.keys(categories), "core"), exercises: b.exercises.map(cleanExercise) }; });
    const sum = settings.program.reduce((n, b) => n + b.duration, 0);
    if (sum < 20 || sum > 180 || count > 100) throw Error("Programmet skal være 20–180 minutter og højst 100 øvelser.");
    Object.keys(settings.assignment).filter(k => k !== "participants").forEach(k => settings.assignment[k] = text(src.assignment?.[k], k === "participantCount" ? 1 : 5000));
    settings.assignment.participantCount = enumValue(settings.assignment.participantCount, ["2", "3"], "3");
    settings.assignment.participants = [0, 1, 2].map(i => Object.fromEntries(["name", "profile", "needs"].map(k => [k, text(src.assignment?.participants?.[i]?.[k])])));
    const cleanMeta = Object.fromEntries(Object.keys(defaults).map(k => [k, text(raw.meta?.[k] ?? defaults[k], ["title", "client", "trainer", "organization", "date"].includes(k) ? 180 : 3000)]));
    const cleanPdf = { ...pdfDefaults }; Object.keys(cleanPdf).forEach(k => { if (typeof pdfDefaults[k] === "boolean") cleanPdf[k] = typeof raw.pdf?.[k] === "boolean" ? raw.pdf[k] : pdfDefaults[k]; });
    cleanPdf.layout = enumValue(raw.pdf?.layout, ["client", "detail"], "client");
    cleanPdf.perPage = enumValue(Number(raw.pdf?.perPage), [1, 2, 4, 6], 2); cleanPdf.fontSize = enumValue(raw.pdf?.fontSize, ["normal", "large"], "normal");
    const customs = (Array.isArray(raw.custom) ? raw.custom : []).slice(0, 100).map(cleanExercise).map(ex => ({ ...ex, custom: true }));
    const overrides = {}; Object.entries(raw.libraryOverrides || {}).slice(0, 100).forEach(([k, v]) => { if (builtins.some(ex => ex.id === k)) overrides[k] = { video: safeURL(v?.video) }; });
    return { settings, meta: cleanMeta, pdf: cleanPdf, custom: customs, libraryOverrides: overrides, favorites: (Array.isArray(raw.favorites) ? raw.favorites : []).map(x => text(x, 180)).slice(0, 200) };
  }
  function downloadProgram() {
    const blob = new Blob([JSON.stringify(snapshot(), null, 2)], { type: "application/json" }), url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = (meta.title || "NEXT-program").replace(/[^a-zæøå0-9_-]/gi, "-").slice(0, 80) + ".next.json"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notify("Programfilen er downloadet med indstillinger og egne øvelser.");
  }
  function saveNamed() {
    dialog("Gem program eller skabelon", `<div class="pro-form-grid">${input("Navn", "title", meta.title, "text", 'required maxlength="100"')}${select("Gem som", "kind", "program", { program: "Program med klientoplysninger", template: "Skabelon (klientfelter tømmes)" })}</div>`, "Gem i mine programmer", data => {
      meta.title = data.get("title").trim(); const value = snapshot(), kind = data.get("kind");
      if (kind === "template") { value.meta.client = ""; value.meta.notes = ""; value.settings.assignment.participants.forEach(p => { p.name = ""; p.profile = ""; p.needs = ""; }); value.settings.assignment.practicalNotes = ""; value.settings.program.forEach(b => b.exercises.forEach(ex => ex.notes = "")); }
      const item = { id: uid(), title: meta.title, kind, savedAt: value.savedAt, value };
      const next = [item, ...saved].slice(0, 30);
      if (!write("next-pro-saved", next)) throw Error("Programmet kunne ikke gemmes. Download en programfil i stedet.");
      saved = next; activeSnapshotId = item.id; refresh(); notify("Programmet er gemt på denne enhed.");
    });
  }
  function renderSaved() {
    $("saved-programs").innerHTML = saved.length ? saved.map(item => `<article class="saved-program"><div><span class="pro-kicker">${item.kind === "template" ? "Skabelon" : "Program"}</span><h3>${h(item.title)}</h3><p>${h(item.value?.meta?.client || "Ingen klient angivet")} · ${h(new Date(item.savedAt).toLocaleDateString("da-DK"))}</p></div><div><button class="secondary-button" type="button" data-pro="load-saved" data-id="${h(item.id)}">Åbn</button><button class="text-button" type="button" data-pro="delete-saved" data-id="${h(item.id)}">Slet</button></div></article>`).join("") : `<p class="form-help">Gem dine programmer her, og genbrug dem som udgangspunkt for næste klient eller hold.</p>`;
  }
  function bindActions() {
    document.addEventListener("click", event => {
      const button = event.target.closest("[data-pro]"); if (!button) return;
      const action = button.dataset.pro, b = Number(button.dataset.b), e = Number(button.dataset.e), id = button.dataset.id;
      if (action === "edit-block") editBlock(b);
      else if (action === "add-to-block") openLibrary(b);
      else if (action === "edit-exercise") editExercise(b, e);
      else if (action === "replace") openLibrary(b, e);
      else if (action === "add-exercise") addExercise(id);
      else if (action === "preview") previewExercise(id);
      else if (action === "favorite") { favorites = favorites.includes(id) ? favorites.filter(k => k !== id) : [...favorites, id]; persistLibrary(); renderLibrary(); }
      else if (["up", "down", "remove-exercise"].includes(action)) { remember(); const items = S.program[b].exercises; if (action === "remove-exercise") items.splice(e, 1); else { const other = e + (action === "up" ? -1 : 1); if (!items[other]) return; [items[e], items[other]] = [items[other], items[e]]; } refresh(); notify("Programmet er opdateret. Du kan fortryde ændringen."); }
      else if (action === "remove-block") {
        if (S.program.length <= 1 || total() - S.program[b].duration < 20) return notify("Programmet skal fortsat være mindst 20 minutter.", true);
        remember(); S.program.splice(b, 1); S.sessionMinutes = total(); refresh(); notify("Blokken er fjernet. Du kan fortryde ændringen.");
      }
      else if (action === "reset-filters") { ["library-search", "library-category", "library-equipment", "library-muscle"].forEach(k => $(k).value = ""); ["library-low-impact", "library-favorites"].forEach(k => $(k).checked = false); renderLibrary(); }
      else if (action === "load-saved") { const item = saved.find(x => x.id === id); if (!item) return; try { remember(); restore(item.value); activeSnapshotId = id; notify("Det gemte program er åbnet."); $("program").scrollIntoView({ behavior: "smooth" }); } catch (error) { notify(error.message, true); } }
      else if (action === "delete-saved") { const item = saved.find(x => x.id === id); if (!item) return; dialog("Slet gemt program?", `<p>${h(item.title)} fjernes fra listen på denne enhed. Dit åbne program bevares.</p>`, "Slet program", () => { const next = saved.filter(x => x.id !== id); if (!write("next-pro-saved", next)) return false; saved = next; renderSaved(); }); }
    });
    $("view-client").onclick = () => { clientView = true; renderClientView(); };
    $("view-editor").onclick = () => { clientView = false; renderClientView(); };
    $("new-small-group").onclick = () => { remember(); S.sessionMinutes = 55; S.warmupMinutes = 8; S.version = 0; S.program = E.generate(S, A.exercisePools); pdf.layout = "client"; clientView = true; refresh(); notify("Et nyt 55-minutters Small Group-forslag er klar. Du kan fortryde for at hente dit tidligere program."); };
    $("group-size").onchange = event => { S.assignment.participantCount = event.target.value; A.syncAssignmentForm(); A.renderAssignment(); updateSummary(); A.markUnsaved(); };
    $("new-block").onclick = addBlock; $("fit-time").onclick = fitTime;
    $("open-library").onclick = () => openLibrary(Math.min(2, S.program.length - 1));
    $("new-exercise").onclick = () => editExercise(null, null);
    $("cancel-replace").onclick = () => { replaceTarget = null; $("library-mode").hidden = true; renderLibrary(); };
    $("save-named").onclick = saveNamed; $("download-program").onclick = downloadProgram;
    $("import-program").onclick = () => $("program-file").click();
    $("program-file").onchange = async event => {
      const file = event.target.files[0]; if (!file) return;
      try { if (file.size > 15 * 1024 * 1024) throw Error("Filen må højst være 15 MB."); const value = JSON.parse(await file.text()); validateSnapshot(value); remember(); restore(value); notify("Programfilen er indlæst."); }
      catch (error) { notify(error.message || "Filen kunne ikke indlæses.", true); } finally { event.target.value = ""; }
    };
    $("undo-program").onclick = () => { if (!undo.length) return; redo.push(snapshot()); restore(undo.pop()); notify("Ændringen er fortrudt."); };
    $("redo-program").onclick = () => { if (!redo.length) return; undo.push(snapshot()); restore(redo.pop()); notify("Ændringen er gendannet."); };
    $("generate").addEventListener("click", remember, true);
    $("apply-small-group").addEventListener("click", remember, true);
    document.querySelectorAll("[data-meta]").forEach(el => el.addEventListener("input", () => { meta[el.dataset.meta] = el.value; updateSummary(); A.markUnsaved(); }));
    document.querySelectorAll("[data-pdf]").forEach(el => el.addEventListener("change", () => { pdf[el.dataset.pdf] = el.type === "checkbox" ? el.checked : el.dataset.pdf === "perPage" ? Number(el.value) : el.value; renderPrint(); A.markUnsaved(); }));
    $("pdf-preset").onchange = event => { pdf.layout = event.target.value; syncPdf(); renderPrint(); A.markUnsaved(); };
    $("pro-print-button").onclick = printProgram;
    $("pro-preview-button").onclick = previewPdf;
    $("library-search").oninput = () => { clearTimeout(searchTimer); searchTimer = setTimeout(renderLibrary, 120); };
    ["library-category", "library-equipment", "library-muscle", "library-low-impact", "library-favorites"].forEach(id => $(id).onchange = renderLibrary);
    document.addEventListener("next:change", () => {
      if (booting) return; layoutPerPage = null; updateSummary(); syncTargets(); clearTimeout(saveTimer);
      saveTimer = setTimeout(() => { if (write("next-pro-draft", snapshot())) $("autosave-status").textContent = "Kladde gemt på denne enhed"; }, 600);
    });
  }
  function initialize() {
    const library = read("next-pro-library", {}); custom = Array.isArray(library.custom) ? library.custom : []; favorites = Array.isArray(library.favorites) ? library.favorites : []; libraryOverrides = library.libraryOverrides || {}; saved = read("next-pro-saved", []); if (!Array.isArray(saved)) saved = [];
    mount(); bindActions(); window.NextPro = { blockTools, exerciseHTML, visualHTML, renderPrint, preparePrint, snapshot, validateSnapshot, printProgram, programText };
    const draft = read("next-pro-draft", null);
    if (draft) { try { const clean = validateSnapshot(draft); Object.assign(S, clean.settings); meta = clean.meta; pdf = clean.pdf; } catch (_) { notify("Den tidligere kladde kunne ikke indlæses. Dit oprindelige program er bevaret.", true); } }
    booting = false; refresh(); renderLibrary();
  }
  function mount() {
    $("program").insertAdjacentHTML("afterbegin", `<div class="pro-workbench"><div class="workbench-top"><span class="pro-kicker">PROGRAMVÆRKSTED</span><strong id="workbench-count"></strong></div><div class="pro-toolbar"><button class="save-button" id="new-small-group" type="button">Nyt Small Group-program · 55 min</button><button class="secondary-button" id="open-library" type="button">+ Tilføj øvelse</button><button class="secondary-button" id="new-block" type="button">Ny blok</button><button class="icon-button" id="undo-program" type="button" aria-label="Fortryd" title="Fortryd">↶</button><button class="icon-button" id="redo-program" type="button" aria-label="Gendan" title="Gendan">↷</button></div><label class="group-count"><span>Deltagere i Small Group</span><select id="group-size"><option value="2">2 deltagere</option><option value="3">3 deltagere</option></select></label><p class="form-help" id="duration-check"></p><p id="clock-status" class="clock-status" role="status"></p><button class="text-button" id="fit-time" type="button" hidden></button><details class="pro-settings"><summary>Programoplysninger <span>Klient, instruktør og mål</span></summary><div class="pro-form-grid">${Object.entries({ title: "Programtitel", client: "Klient / hold", trainer: "Instruktør", organization: "Organisation", date: "Dato" }).map(([k, label]) => `<label><span>${label}</span><input type="${k === "date" ? "date" : "text"}" data-meta="${k}" maxlength="180"></label>`).join("")}${["goal", "notes"].map(k => `<label class="wide"><span>${k === "goal" ? "Mål med forløbet" : "Fokus og hensyn"}</span><textarea rows="2" data-meta="${k}" maxlength="3000"></textarea></label>`).join("")}</div></details><details class="pro-settings" id="pdf-settings"><summary>PDF og udskrift <span>Layout og indhold</span></summary><div class="pro-form-grid"><label><span>Dokumenttype</span><select id="pdf-preset"><option value="client">Kundeprogram – kompakt, normalt 2 sider</option><option value="detail">Instruktør / NEXT-opgave – med bilag</option></select></label><label data-detail-pdf><span>Maks. øvelser pr. A4-side</span><select data-pdf="perPage"><option value="1">1 – stort format</option><option value="2">2 – detaljeret</option><option value="4">4 – kompakt</option><option value="6">6 – oversigt</option></select></label><label data-detail-pdf><span>Skriftstørrelse</span><select data-pdf="fontSize"><option value="normal">Normal</option><option value="large">Større</option></select></label></div><div class="pdf-checkboxes" data-detail-pdf>${Object.entries({ images: "Øvelsesbilleder", anatomy: "Anatomifigurer", cues: "Udførelse og cues", variations: "Lettere / sværere", videos: "Videolinks", qr: "QR-koder til video", music: "Spotify og musik", assignment: "Opgavebesvarelse", practical: "Praktisk afprøvning til sidst" }).map(([k, label]) => `<label class="pro-check"><input type="checkbox" data-pdf="${k}">${label}</label>`).join("")}</div><p class="form-help">Kundeprogrammet samler øvelserne i blokke med tydelig dosering og samarbejde. Instruktørudgaven bevarer anatomifigurer og opgavebilag. Vælg »Gem som PDF« i browserens udskriftsvindue for at bevare links. QR-koder vises for øvelser med et videolink. Om nødvendigt reduceres antallet af øvelser pr. side for at give plads til teksten.</p><button class="secondary-button" id="pro-preview-button" type="button">Forhåndsvis PDF</button><button class="save-button" id="pro-print-button" type="button">Print / gem PDF</button></details><details class="pro-settings"><summary>Mine programmer <span>Gem, genbrug og flyt</span></summary><div class="pro-toolbar"><button class="save-button" type="button" id="save-named">Gem program / skabelon</button><button class="secondary-button" type="button" id="download-program">Download programfil</button><button class="secondary-button" type="button" id="import-program">Åbn programfil</button><input id="program-file" type="file" accept=".json,application/json" hidden></div><p class="form-help">Programmer og klientoplysninger gemmes i denne browser. En programfil kan åbnes på en anden enhed. Brug initialer, hvis du deler en fil.</p><div id="saved-programs"></div></details><div class="autosave-line"><span id="autosave-status">Automatisk kladde på denne enhed</span></div><p id="pro-status" role="status" aria-live="polite"></p></div><section id="pro-print-summary"></section>`);
    $("program-timeline").insertAdjacentHTML("beforebegin", `<div class="program-view-toggle"><button id="view-client" type="button" aria-pressed="true">Kundevisning</button><button id="view-editor" type="button" aria-pressed="false">Redigér program</button></div><div id="client-program-view"></div>`);
    $("assignment").insertAdjacentHTML("beforebegin", `<section class="exercise-library" id="exercise-library" aria-labelledby="library-title"><header class="library-header"><div><span class="pro-kicker">DIT ØVELSESBIBLIOTEK</span><h2 id="library-title">Find den rigtige øvelse.</h2><p>38 illustrerede øvelser – og plads til dine egne.</p></div><button class="save-button" id="new-exercise" type="button">+ Opret egen øvelse</button></header><div class="library-controls"><label class="library-search-label"><span>Søg i øvelser og muskler</span><input type="search" id="library-search" placeholder="Fx balder, squat eller skulder…"></label><label><span>Kategori</span><select id="library-category"><option value="">Alle kategorier</option>${Object.entries(categories).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></label><label><span>Udstyr</span><select id="library-equipment"><option value="">Alt udstyr</option>${["Kropsvægt", "Måtte", "Håndvægte", "Elastik", "Andet"].map(k => `<option>${k}</option>`).join("")}</select></label><label><span>Muskelgruppe</span><select id="library-muscle"><option value="">Alle muskler</option>${Object.entries(A.muscleGroups).map(([k, v]) => `<option value="${k}">${h(v.danish)}</option>`).join("")}</select></label></div><div class="library-options"><div><label class="pro-check"><input type="checkbox" id="library-low-impact">Uden hop</label><label class="pro-check"><input type="checkbox" id="library-favorites">Kun favoritter</label></div><label class="library-target"><span>Tilføj til</span><select id="library-target"></select></label></div><div id="library-mode" class="library-mode" hidden><span id="library-mode-text"></span><button type="button" id="cancel-replace">Annuller udskiftning</button></div><p id="library-count" class="form-help" role="status"></p><div class="library-grid" id="library-grid"></div></section>`);
    document.body.insertAdjacentHTML("beforeend", `<dialog id="pro-dialog" aria-labelledby="dialog-title"></dialog>`);
  }
  document.addEventListener("DOMContentLoaded", initialize);
}());
