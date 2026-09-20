/* NEXT session planning. All clocks use whole seconds; no estimated round counts. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.NextSession = api;
}(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";
  const copy = value => JSON.parse(JSON.stringify(value));
  const secs = n => Number.isInteger(Number(n)) && Number(n) >= 0 ? Number(n) : NaN;
  const stamp = n => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
  const split = (total, count) => Array.from({ length: count }, (_, i) => Math.floor(total / count) + (i < total % count ? 1 : 0));
  function doseLabel(ex, clock = {}) {
    if (!ex.dose) return { mode: "AFKLAR", text: ex.dosage || "Vælg tid eller gentagelser", seconds: null };
    const d = ex.dose;
    if (d.mode === "time") return { mode: "TID", text: `${d.seconds} sek. arbejde`, seconds: Number(d.seconds) };
    const active = Number(d.reps) * Number(d.tempo), window = Math.max(Number(clock.window || 40), active);
    return { mode: "GENTAGELSER", text: `${d.reps} i alt · ${d.tempo} sek./gent.`, detail: `${active} sek. bevægelse + ${window - active} sek. pause i et ${window}-sek. vindue.`, seconds: window };
  }
  function doseFor(ex, block) {
    const c = block.clock || {}, d = doseLabel(ex, c);
    if (c.kind !== "roles" || !d.seconds) return d;
    const window = Math.max(...block.exercises.map(x => doseLabel(x, c).seconds || 0));
    if (ex.dose.mode === "reps") return doseLabel(ex, { ...c, window });
    return { ...d, seconds: window, detail: window > d.seconds ? `${window - d.seconds} sek. pause frem til fælles skift (${window} sek. i alt).` : "" };
  }
  function transitionFor(ex, block) {
    const c = block.clock || {};
    return c.kind === "roles" ? Math.max(...block.exercises.map(x => secs(x.transitionSeconds ?? c.transition ?? 0))) : secs(ex.transitionSeconds ?? c.transition ?? 0);
  }
  function groupInstructions(kind, count, roundRest) {
    const members = Number(count) === 2 ? "A og B" : "A, B og C";
    if (kind === "together") return `${members} arbejder samtidig med egen belastning. Skift rytmeleder efter hver øvelse. I pausen (${roundRest} sek.) deler alle ét konkret tip om fx knæretning eller rolig ryg. Aftal teknikmålet før start.`;
    if (kind === "roles") return Number(count) === 2
      ? "A udfører styrkeøvelsen; B er teknikmakker og går roligt på stedet. B observerer ét aftalt fokus og giver ét kort cue. Byt ved hvert stationsskift. Begge får lige mange arbejds- og makkerintervaller; instruktøren vælger belastningen."
      : "Start: A på styrke, B på kontrol, C som teknikmakker. C marcherer roligt og giver A ét aftalt teknikcue. Rotér én rolle frem ved hvert skift (1 → 2 → 3 → 1). En runde = alle har prøvet alle tre roller.";
    if (kind === "mirror") return "Følg lederen med god afstand og eget niveau. Skift leder efter hvert interval. Lederen ændrer retning/tempo; resten spejler. Fælles mål: alle kan følge med ved den aftalte intensitet. Giv tommel op/ned i pausen, og tilpas sammen.";
    return "Aftal roller og fælles opgave før start.";
  }
  function analyze(block, participants = 3) {
    const c = block.clock, total = Number(block.duration) * 60, errors = [], steps = [];
    let at = 0;
    const add = (kind, duration, label, extra = {}) => {
      if (!duration) return;
      steps.push({ start: at, end: at + duration, seconds: duration, kind, label, ...extra }); at += duration;
    };
    if (!c || c.version !== 1) return { valid: false, errors: ["Blokken mangler et kontrolleret tidsregnskab."], total, steps, formula: "Vælg 'Beregn blok' eller lav et nyt Small Group-forslag.", rounds: 0 };
    const intro = secs(c.intro || 0), transition = secs(c.transition || 0), pause = secs(c.roundRest || 0);
    if (![intro, transition, pause, total].every(Number.isFinite)) errors.push("Tider skal være hele, positive sekunder.");
    if (c.kind === "briefing") {
      if (block.exercises.length) errors.push("Velkomstblokken indeholder øvelser. Vælg en træningsform for at få dem med i tidsregnskabet.");
      add("briefing", total, "Velkomst, dagsform, mål, roller og klargøring");
      return { valid: !errors.length, errors, total, steps, rounds: 1, formula: `${stamp(total)} velkomst og klargøring = ${stamp(total)}`, cooperation: "Aftal ét fælles teknikmål og et signal for at skrue ned." };
    }
    if (c.kind === "warmup") {
      const phases = block.exercises.map(ex => Number(ex.phaseIndex));
      const effort = block.exercises.map(ex => Number(ex.targetRpe));
      if (![0,1,2,3].every(p => phases.includes(p)) || phases.some((p,i) => i && p < phases[i-1]) || effort.some((r,i) => !Number.isFinite(r) || (i && r < effort[i-1]))) errors.push("Opvarmningen skal bevare de fire faser i stigende rækkefølge og uden fald i planlagt RPE. Lav et nyt forslag eller ret rækkefølgen.");
    }
    if (c.kind === "roles" && (block.exercises.at(-1)?.id || block.exercises.at(-1)?.name) !== "March på stedet") errors.push("Den sidste rolle skal være teknikmakker med aktiv march; vælg Fælles rytme, hvis alle roller skal være styrkeøvelser.");
    const slots = block.exercises.map((ex, i) => {
      const dose = doseFor(ex, block), d = ex.dose;
      if (!d || !["time", "reps"].includes(d.mode)) errors.push(`${ex.name}: vælg tid eller gentagelser.`);
      if (d?.mode === "time" && (!Number.isInteger(d.seconds) || d.seconds < 5 || d.seconds > 600)) errors.push(`${ex.name}: arbejdstid skal være 5–600 sek.`);
      if (d?.mode === "reps" && (!Number.isInteger(d.reps) || d.reps < 1 || d.reps > 60 || !Number.isInteger(d.tempo) || d.tempo < 1 || d.tempo > 10)) errors.push(`${ex.name}: angiv 1–60 gentagelser og 1–10 sek. pr. gentagelse.`);
      return { ex, i, dose, work: dose.seconds || 0, shift: transitionFor(ex, block) };
    });
    if (!slots.length) errors.push("Tilføj mindst én øvelse.");
    if (c.kind === "roles" && slots.length !== Number(participants)) errors.push(`Der er ${slots.length} roller til ${participants} deltagere. Lav nyt forslag eller tilpas antallet af øvelser.`);
    if (slots.some(x => !Number.isFinite(x.shift))) errors.push("Skift skal være hele, positive sekunder.");
    const cycle = slots.reduce((n, x) => n + x.work + x.shift, 0);
    const flow = ["warmup", "cooldown"].includes(c.kind);
    const rounds = flow ? 1 : Math.floor((total - intro + pause) / (cycle + pause));
    const outro = total - intro - rounds * cycle - Math.max(0, rounds - 1) * pause;
    if (!Number.isFinite(rounds) || rounds < 1 || outro < 0) errors.push("Der er ikke plads til én hel runde. Forlæng blokken, forkort intervallerne eller fjern en øvelse.");
    if (errors.length) return { valid: false, errors, total, steps: [], rounds: Math.max(0, rounds || 0), formula: errors.join(" "), cycle };
    add("intro", intro, "Instruktion, demonstration og valg af niveau");
    for (let r = 1; r <= rounds; r++) {
      slots.forEach(x => {
        const label = c.kind === "roles" ? `Rotation ${x.i + 1}: alle arbejder i deres aktuelle rolle i et fælles ${x.work}-sek. vindue` : `${x.ex.name}: ${x.dose.text}${x.dose.detail ? "; " + x.dose.detail : ""}`;
        add("exercise", x.work, label, { exercise: x.i, round: r, phase: x.ex.phase || "", rpe: x.ex.targetRpe || "" });
        add("transition", x.shift, "Skift, klargøring og kort cue", { exercise: x.i, round: r });
      });
      if (r < rounds) add("round-rest", pause, c.kind === "mirror" ? "Fælles pause og intensitetssignal" : "Fælles pause og makkerfeedback", { round: r });
    }
    add("outro", outro, c.kind === "cooldown" ? "Fælles afslutning: én observation fra hver" : "Vand, feedback og klargøring til næste blok");
    const uniform = slots.every(x => x.work === slots[0].work && x.shift === slots[0].shift);
    const cycleText = uniform ? `${slots.length} × (${stamp(slots[0].work)} ${slots.some(x => x.ex.dose.mode === "reps") ? "vindue" : "arbejde"} + ${stamp(slots[0].shift)} skift)` : slots.map(x => `(${stamp(x.work)} + ${stamp(x.shift)})`).join(" + ");
    const parts = [intro ? `${stamp(intro)} instruktion` : "", `${rounds} × [${cycleText}]`, rounds > 1 && pause ? `${rounds - 1} × ${stamp(pause)} fælles pause` : "", outro ? `${stamp(outro)} ${c.kind === "cooldown" ? "afslutning" : "vand/feedback"}` : ""].filter(Boolean);
    return { valid: at === total, errors: at === total ? [] : ["Tidsregnskabet stemmer ikke."], total, steps, rounds, cycle, intro, outro, transition, roundRest: pause, formula: `${parts.join(" + ")} = ${stamp(total)}`, cooperation: groupInstructions(c.kind, participants, pause) };
  }
  function report(program, participants, target) {
    let offset = 0;
    const blocks = program.map(b => { const analysis = analyze(b, participants), start = offset; offset += Number(b.duration) * 60; return { block: b, ...analysis, start, end: offset }; });
    return { valid: blocks.every(b => b.valid) && offset === Number(target) * 60, blocks, seconds: offset, targetSeconds: Number(target) * 60 };
  }
  function generate(S, pools) {
    const total = Math.min(180, Math.max(20, Math.round(S.sessionMinutes))), arrival = total >= 45 ? 2 : 1, cooldown = Math.min(10, Math.max(3, Math.round(total * .12))), warmup = Number(S.warmupMinutes), mainTotal = total - arrival - warmup - cooldown;
    const main = [Math.floor(mainTotal / 3), Math.floor(mainTotal / 3), mainTotal - 2 * Math.floor(mainTotal / 3)];
    const low = S.sessionType === "Low impact" || S.age === "60+" || S.intensity <= 4;
    const all = Object.values(pools).flat();
    const get = name => copy(all.find(ex => ex.name === name));
    const choose = (pool, shift = 0, omit = []) => {
      let choices = pools[pool].filter(x => ["Kropsvægt", "Måtte", S.equipment].includes(x.equipment) && (!low || x.lowImpact) && x.name !== "Step-up" && !omit.includes(x.name));
      if (!choices.length) choices = pools[pool].filter(x => ["Kropsvægt", "Måtte", S.equipment].includes(x.equipment) && !omit.includes(x.name));
      if (!choices.length) choices = pools[pool].filter(x => ["Kropsvægt", "Måtte", S.equipment].includes(x.equipment));
      return copy(choices[(Number(S.version || 0) + shift) % choices.length]);
    };
    const base = (id, title, duration, kind, exercises, pool) => ({ id, number: "", title, eyebrow: kind === "warmup" ? "Almen → dynamisk → specifik" : kind === "cooldown" ? "Sænk intensiteten sammen" : "Small Group · fælles opgave", duration, pool, exercises, clock: { version: 1, kind, intro: 0, transition: 0, roundRest: 0, window: 40 }, protocol: "" });
    const coreFocus = S.sessionType === "Core & glutes";
    const a = [choose("lower"), choose(coreFocus ? "core" : "upper"), choose("core", 2)];
    const b = [choose(coreFocus ? "lower" : "upper", 1, a.map(x => x.name))];
    if (Number(S.assignment.participantCount) === 3) b.push(choose(coreFocus ? "core" : "lower", 2, a.map(x => x.name)));
    const coach = get("March på stedet"); coach.clientName = "Teknikmakker · aktiv march"; coach.clientCue = "Gå roligt. Se ét aftalt teknikpunkt hos deltageren på styrkestationen og giv ét kort cue."; coach.targetRpe = "2–3"; b.push(coach);
    const c = coreFocus ? [choose("core", 1), choose("core", 3), choose("lower", 2)] : [get("Shadow boxing"), get("Lateral step + reach"), get("Step jack")];
    const mains = [base("main-0", "Fælles rytme · styrke og kontrol", main[0], "together", a, "lower"), base("main-1", "Byt roller · træner og teknikmakker", main[1], "roles", b, "upper"), base("main-2", coreFocus ? "Følg lederen · fælles kontrol" : "Spejlgruppen · fælles puls", main[2], "mirror", c, coreFocus ? "core" : "pulse")];
    mains.forEach(block => {
      const T = block.duration * 60, n = block.exercises.length;
      const intro = T >= 300 ? 60 : T >= 180 ? 30 : Math.max(5, Math.floor(T * .15));
      const transition = T >= 180 ? 20 : 5;
      const work = Math.min(40, Math.floor((T - intro) / n) - transition);
      Object.assign(block.clock, { intro, transition, roundRest: block.clock.kind === "together" ? 30 : 15, window: work });
      block.exercises.forEach(ex => { ex.dose = { mode: "time", seconds: work }; ex.targetRpe ||= String(Math.min(S.intensity, block.clock.kind === "roles" ? 7 : 9)); });
    });
    const warm = base("warmup", "Opvarmning · stigende intensitet", warmup, "warmup", [], "warmup");
    const warmGroups = [[get("March på stedet"), get("Lateral step + reach")], [get("Squat to reach"), get("Arm circles")], [copy(a[0]), copy(a[1])], [get("Step jack"), get("Shadow boxing")]];
    warmGroups[1][1].clientName = "Armcirkler i aktiv march";
    const peak = Math.max(3, Math.min(6, Number(S.intensity) - 1)), rpes = [Math.max(1, peak - 3), Math.max(2, peak - 2), peak - 1, peak];
    const names = ["Almen: find rytmen", "Dynamisk: større bevægelser", "Specifik: øv hoveddelens teknik", "Saml gruppen: løft tempoet"];
    const cues = ["Start roligt, brug armene og øg gradvist skridtlængden.", "Øg bevægeudslaget kontrolleret. Bliv i bevægelse.", "Brug ingen eller meget let modstand. Øv de næste bevægelsesmønstre.", "Skift leder mellem øvelserne. Øg tempoet, så pulsen stiger uden at miste kontrollen."];
    const phaseTimes = split(warmup * 60, 4);
    warmGroups.forEach((group, phase) => split(phaseTimes[phase], group.length).forEach((slot, i) => {
      const ex = group[i]; ex.dose = { mode: "time", seconds: slot - 10 }; ex.transitionSeconds = 10; ex.phase = names[phase]; ex.phaseIndex = phase; ex.targetRpe = String(rpes[phase]); ex.clientCue = cues[phase]; delete ex.sets; warm.exercises.push(ex);
    }));
    const cool = base("cooldown", "Nedvarmning · fælles afslutning", cooldown, "cooldown", [get("March på stedet"), get("Hip flexor stretch"), get("Hamstring stretch"), get("Chest opener")], "cooldown");
    const coolTotal = cooldown * 60, walk = coolTotal >= 420 ? 120 : coolTotal >= 300 ? 60 : 30, closing = coolTotal >= 300 ? 60 : 30;
    cool.exercises[0].clientName = "Rolig gang og vejrtrækning"; cool.exercises[0].clientCue = "Sænk tempoet gradvist og lad vejrtrækningen falde til ro."; cool.exercises[0].dose = { mode: "time", seconds: walk }; cool.exercises[0].targetRpe = "3 → 2";
    split(coolTotal - walk - closing, 3).forEach((slot, i) => { const ex = cool.exercises[i + 1]; ex.dose = { mode: "time", seconds: slot - 10 }; ex.transitionSeconds = 10; ex.targetRpe = "1–2"; ex.clientCue = i < 2 ? `Skift side halvvejs: ${(slot - 10) / 2} sek. pr. side. Roligt bevægeudslag.` : "Hold bryståbningen roligt, og træk vejret frit."; });
    const program = [base("arrival", "Velkomst · fælles mål", arrival, "briefing", [], null), warm, ...mains, cool];
    program.forEach((block, i) => { block.number = String(i).padStart(2, "0"); syncBlock(block, S.assignment.participantCount); });
    return program;
  }
  function syncBlock(block, participants) {
    if (!block.clock) return;
    block.exercises.forEach(ex => { const d = doseFor(ex, block); ex.dosage = `${d.mode}: ${d.text}${d.detail ? ". " + d.detail : ""}`; });
    const a = analyze(block, participants);
    if (a.valid) block.protocol = a.formula;
  }
  function adopt(block, participants) {
    const T = block.duration * 60, n = Math.max(1, block.exercises.length), intro = T >= 300 ? 60 : Math.min(20, Math.floor(T * .1)), transition = T >= 180 ? 20 : 5, work = Math.min(40, Math.floor((T - intro) / n) - transition);
    if (!block.exercises.length) block.clock = { version: 1, kind: "briefing", intro: 0, transition: 0, roundRest: 0 };
    else { block.clock = { version: 1, kind: "together", intro, transition, roundRest: 30, window: Math.max(5, work) }; block.exercises.forEach(ex => { ex.dose = { mode: "time", seconds: Math.max(5, work) }; delete ex.sets; }); }
    syncBlock(block, participants);
  }
  return { stamp, split, doseLabel, doseFor, transitionFor, analyze, report, generate, syncBlock, adopt, groupInstructions };
}));
