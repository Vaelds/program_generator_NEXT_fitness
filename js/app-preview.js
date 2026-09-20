(function () {
  "use strict";

  const state = {
    age: "30–44",
    level: "Let øvet",
    sessionType: "Hele kroppen",
    music: "Pop",
    sessionMinutes: 55,
    warmupMinutes: 8,
    intensity: 7,
    equipment: "Håndvægte",
    version: 0,
    program: [],
    assignment: {
      title: "Small Group Training",
      participantCount: "3",
      participants: [
        { name: "", profile: "", needs: "" },
        { name: "", profile: "", needs: "" },
        { name: "", profile: "", needs: "" }
      ],
      purpose: "At forbedre deltagernes helkropsstyrke og kondition gennem en overskuelig træning, hvor alle kan arbejde på deres eget niveau.",
      formRationale: "Stationstræning er valgt, fordi tre deltagere kan være aktive samtidig, mens instruktøren kan observere, coache og tilpasse belastningen individuelt.",
      warmupRationale: "Intensiteten øges gradvist fra rolige, store bevægelser til øvelser, der ligner hoveddelens bevægelsesmønstre. Tempo og bevægeudslag øges trinvis.",
      warmupConnection: "Opvarmningen forbereder hofter, knæ, skuldre og core til squat-, pres-, træk- og stabilitetsøvelserne i hoveddelen.",
      cooldownRationale: "Tempoet sænkes gradvist, hvorefter deltagerne arbejder med rolig vejrtrækning og bevægelighed. Timen afsluttes med kort fælles feedback.",
      smallGroupRationale: "Deltagerne arbejder som en gruppe med fælles tidsstyring, makkerfeedback og rotation mellem stationer. Instruktøren følger hver deltager og giver individuelle regressioner og progressioner.",
      organization: "Tre stationer placeres i en trekant med god afstand. Udstyret klargøres før start, og hver deltager begynder ved sin egen station.",
      workRest: "Der arbejdes 40 sekunder og skiftes i 20 sekunder. Efter en hel runde gives en kort fælles pause og ny instruktion før næste runde.",
      activeParticipants: "Alle har en fast station eller en aktiv makkerrolle. Ingen venter på udstyr, og pauser bruges til let bevægelse, feedback eller klargøring.",
      intensityControl: "Intensiteten styres med RPE, taletesten og observation af teknik. Belastning, tempo, bevægeudslag, arbejdstid eller pause ændres ved behov.",
      instruction: "Hver øvelse forklares kort, demonstreres fra en synlig position og følges af ét tydeligt cue. Der gives konkret, anerkendende feedback undervejs.",
      logistics: "Tid til demonstration, stationsskift, justering af udstyr og vand er indregnet i blokkenes varighed og minutplanen.",
      practicalNotes: ""
    }
  };

  const muscleGroups = {
    quads: { latin: "M. quadriceps femoris", danish: "Forside lår" },
    hamstrings: { latin: "Mm. ischiocrurales", danish: "Baglår" },
    glutes: { latin: "M. gluteus maximus", danish: "Store ballemuskel" },
    gluteMedius: { latin: "M. gluteus medius", danish: "Mellemste ballemuskel" },
    calves: { latin: "M. gastrocnemius", danish: "Lægmuskel" },
    hipFlexors: { latin: "M. iliopsoas", danish: "Hoftebøjer" },
    adductors: { latin: "Mm. adductores", danish: "Inderlår" },
    chest: { latin: "M. pectoralis major", danish: "Store brystmuskel" },
    lats: { latin: "M. latissimus dorsi", danish: "Brede rygmuskel" },
    upperBack: { latin: "M. trapezius", danish: "Kappemusklen" },
    delts: { latin: "M. deltoideus", danish: "Skuldermuskel" },
    frontDelts: { latin: "M. deltoideus (pars clavicularis)", danish: "Forreste skulder" },
    rearDelts: { latin: "M. deltoideus (pars spinalis)", danish: "Bagerste skulder" },
    rhomboids: { latin: "Mm. rhomboidei", danish: "Rombemusklerne" },
    biceps: { latin: "M. biceps brachii", danish: "Forside overarm" },
    triceps: { latin: "M. triceps brachii", danish: "Bagside overarm" },
    abs: { latin: "M. rectus abdominis", danish: "Lige mavemuskel" },
    obliques: { latin: "M. obliquus externus abdominis", danish: "Ydre skrå mavemuskel" },
    erectors: { latin: "M. erector spinae", danish: "Rygstrækkerne" },
    deepCore: { latin: "M. transversus abdominis", danish: "Tværgående mavemuskel" },
    spinalMobility: { latin: "Mm. multifidi", danish: "Dybe rygmuskler" }
  };

  const exerciseGuides = {
    "March på stedet": guide("march", "Stå højt med vægten jævnt fordelt.", "Løft modsatte knæ og arm kontrolleret.", ["hipFlexors", "quads", "calves", "deepCore"]),
    "Cat–cow": guide("catcow", "Stå stabilt på alle fire med neutral ryg.", "Skift roligt mellem svaj og runding af ryggen.", ["erectors", "abs", "spinalMobility"]),
    "Squat to reach": guide("squatReach", "Sæt hoften tilbage i en kontrolleret squat.", "Rejs dig og stræk begge arme over hovedet.", ["quads", "glutes", "hamstrings", "delts"]),
    "Arm circles": guide("pull", "Stå højt med armene ud til siden.", "Før armene i rolige, gradvist større cirkler.", ["delts", "upperBack", "chest"]),
    "World's greatest stretch": guide("lungeReach", "Træd frem i en lang lunge med hånden i gulvet.", "Rotér brystkassen og stræk armen mod loftet.", ["hipFlexors", "hamstrings", "glutes", "obliques"]),
    "Step jack": guide("jack", "Stå med samlede fødder og armene nede.", "Træd ud til siden, mens armene føres op.", ["gluteMedius", "calves", "delts", "deepCore"]),
    "Walkout": guide("walkout", "Stå højt og fold frem fra hoften.", "Gå med hænderne ud til en stabil planke.", ["hamstrings", "abs", "frontDelts", "chest"]),
    "Boxing punches": guide("punch", "Stå i gardering med bløde knæ.", "Rotér fra hoften og stræk slagarmen frem.", ["frontDelts", "chest", "triceps", "obliques"]),
    "Lateral step + reach": guide("lateral", "Stå højt med armene afslappet.", "Træd bredt til siden og ræk diagonalt.", ["gluteMedius", "adductors", "quads", "obliques"]),
    "Glute bridge": guide("bridge", "Lig på ryggen med bøjede knæ og fødder i gulvet.", "Pres gennem hælene og løft hoften uden at overstrække.", ["glutes", "hamstrings", "deepCore"], ["Primær", "Medvirkende", "Stabiliserende"]),
    "Goblet squat": guide("squat", "Stå med vægten tæt ved brystet.", "Sæt hoften ned og tilbage med knæ over tæer.", ["quads", "glutes", "hamstrings", "deepCore"]),
    "Reverse lunge": guide("lunge", "Stå højt med parallelle fødder.", "Træd tilbage og sænk det bagerste knæ kontrolleret.", ["quads", "glutes", "hamstrings", "calves"]),
    "Romanian deadlift": guide("hinge", "Stå med vægtene tæt foran lårene.", "Skub hoften tilbage med lang ryg og let bøjede knæ.", ["hamstrings", "glutes", "erectors", "lats"]),
    "Lateral band walk": guide("lateral", "Stå let bøjet med spænding i elastikken.", "Træd sidelæns uden at lade knæene falde ind.", ["gluteMedius", "glutes", "quads"]),
    "Step-up": guide("step", "Placér hele foden på trinnet.", "Pres gennem standbenet og stræk hoften i toppen.", ["quads", "glutes", "hamstrings", "calves"]),
    "Bent-over row": guide("hingePull", "Hæng fra hoften med lang ryg og strakte arme.", "Træk albuerne tilbage og saml skulderbladene.", ["lats", "upperBack", "biceps", "erectors"]),
    "Shoulder press": guide("press", "Hold vægtene ved skuldrene og spænd maven.", "Pres lodret op uden at svaje i lænden.", ["delts", "triceps", "upperBack", "deepCore"]),
    "Incline push-up": guide("pushup", "Placér hænderne på en stabil forhøjning.", "Bøj albuerne og sænk brystet som én samlet enhed.", ["chest", "triceps", "frontDelts", "abs"]),
    "Band pull-apart": guide("pull", "Hold elastikken foran brystet med strakte arme.", "Før armene ud og saml skulderbladene.", ["rearDelts", "rhomboids", "upperBack"]),
    "Chest press": guide("floorPress", "Lig stabilt med albuerne bøjet og vægtene over albuerne.", "Pres vægtene op over brystet uden at løfte skuldrene.", ["chest", "triceps", "frontDelts"]),
    "Half-kneeling halo": guide("halo", "Stå i halvt knælende position med vægten foran brystet.", "Før vægten roligt rundt om hovedet med stabil torso.", ["delts", "upperBack", "obliques", "deepCore"]),
    "Dead bug": guide("deadbug", "Lig på ryggen med hofter og knæ i 90 grader.", "Stræk modsat arm og ben uden at lænden løfter sig.", ["deepCore", "abs", "hipFlexors"]),
    "Bird dog": guide("quadruped", "Stå på alle fire med neutral ryg.", "Stræk modsat arm og ben, mens bækkenet holdes roligt.", ["erectors", "glutes", "frontDelts", "deepCore"]),
    "Plank": guide("plank", "Placér albuer under skuldre og knæ i gulvet.", "Stræk benene og hold kroppen i en lang linje.", ["deepCore", "abs", "frontDelts", "glutes"]),
    "Russian twist": guide("seatedTwist", "Sid højt med let bøjede knæ og lang ryg.", "Rotér brystkassen samlet fra side til side.", ["obliques", "abs", "hipFlexors"]),
    "Bear hold": guide("bear", "Stå på alle fire med knæ under hofter.", "Løft knæene få centimeter og hold ryggen stille.", ["deepCore", "quads", "frontDelts", "hipFlexors"]),
    "Side plank": guide("sidePlank", "Lig på siden med albuen under skulderen.", "Pres hoften op og skab en lang linje gennem kroppen.", ["obliques", "gluteMedius", "delts", "deepCore"]),
    "Skater step": guide("skater", "Stå med bløde knæ og vægten midt på foden.", "Træd eller hop sidelæns og land kontrolleret.", ["gluteMedius", "quads", "glutes", "calves"]),
    "Mountain climber": guide("mountain", "Start i høj planke med skuldrene over hænderne.", "Før ét knæ frem uden at løfte eller rotere hoften.", ["abs", "hipFlexors", "frontDelts", "triceps"]),
    "Fast feet": guide("fastFeet", "Stå let forover med bløde knæ.", "Tag korte, hurtige skridt og bevar en rolig overkrop.", ["calves", "quads", "hipFlexors", "deepCore"]),
    "Squat + knee drive": guide("squatKnee", "Sæt hoften tilbage i en stabil squat.", "Rejs dig og før ét knæ mod modsatte albue.", ["quads", "glutes", "hipFlexors", "obliques"]),
    "Low-impact burpee": guide("burpee", "Stå foran måtten med bløde knæ.", "Sæt hænderne ned og træd tilbage til en stabil planke.", ["quads", "glutes", "frontDelts", "abs"]),
    "Shadow boxing": guide("punch", "Stå i gardering med hænderne ved hagen.", "Slå kontrolleret frem og før hånden hurtigt tilbage.", ["frontDelts", "chest", "triceps", "obliques"]),
    "Knee to chest": guide("kneeChest", "Lig på ryggen med begge ben lange.", "Træk ét knæ roligt mod brystet uden at løfte hovedet.", ["glutes", "erectors"]),
    "Supine spinal twist": guide("spinalTwist", "Lig på ryggen med knæene bøjet.", "Før knæene til siden, mens skuldrene bliver i gulvet.", ["obliques", "erectors", "glutes"]),
    "Hip flexor stretch": guide("lungeReach", "Stå i en lang, stabil splitposition.", "Sænk hoften frem med let bagudkip af bækkenet.", ["hipFlexors", "quads", "glutes"]),
    "Hamstring stretch": guide("hamStretch", "Stå med det ene ben let foran.", "Skub hoften tilbage og fold frem med lang ryg.", ["hamstrings", "calves", "erectors"]),
    "Chest opener": guide("pull", "Stå højt med hænderne samlet bag kroppen.", "Før armene let bagud og løft brystbenet.", ["chest", "frontDelts", "biceps"])
  };

  const exerciseImages = {
    "March på stedet": "march.png",
    "Cat–cow": "cat-cow.png",
    "Squat to reach": "squat-to-reach.png",
    "Arm circles": "arm-circles.png",
    "World's greatest stretch": "worlds-greatest-stretch.png",
    "Step jack": "step-jack.png",
    "Walkout": "walkout.png",
    "Boxing punches": "boxing-punches.png",
    "Lateral step + reach": "lateral-step-reach.png",
    "Glute bridge": "glute-bridge.png",
    "Goblet squat": "goblet-squat.png",
    "Reverse lunge": "reverse-lunge.png",
    "Romanian deadlift": "romanian-deadlift.png",
    "Lateral band walk": "lateral-band-walk.png",
    "Step-up": "step-up.png",
    "Bent-over row": "bent-over-row.png",
    "Shoulder press": "shoulder-press.png",
    "Incline push-up": "incline-push-up.png",
    "Band pull-apart": "band-pull-apart.png",
    "Chest press": "chest-press.png",
    "Half-kneeling halo": "half-kneeling-halo.png",
    "Dead bug": "dead-bug.png",
    "Bird dog": "bird-dog.png",
    "Plank": "plank.png",
    "Russian twist": "russian-twist.png",
    "Bear hold": "bear-hold.png",
    "Side plank": "side-plank.png",
    "Skater step": "skater-step.png",
    "Mountain climber": "mountain-climber.png",
    "Fast feet": "fast-feet.png",
    "Squat + knee drive": "squat-knee-drive.png",
    "Low-impact burpee": "low-impact-burpee.png",
    "Shadow boxing": "shadow-boxing.png",
    "Knee to chest": "knee-to-chest.png",
    "Supine spinal twist": "supine-spinal-twist.png",
    "Hip flexor stretch": "hip-flexor-stretch.png",
    "Hamstring stretch": "hamstring-stretch.png",
    "Chest opener": "chest-opener.png"
  };

  function guide(visual, start, finish, muscles, roles = []) {
    return { visual, start, finish, muscles, roles };
  }

  const exercisePools = {
    warmup: [
      ex("March på stedet", "Puls · hele kroppen", "Find rytmen og lad armene arbejde med.", "Roligere tempo", "Høje knæløft", "Kropsvægt", true),
      ex("Cat–cow", "Rygsøjle · mobilitet", "Bevæg ét led ad gangen og følg åndedrættet.", "Mindre bevægeudslag", "Længere yderstillinger", "Måtte", true),
      ex("Squat to reach", "Hofte · knæ · skulder", "Sæt hoften tilbage, rejs dig og stræk armene op.", "Halv squat", "Tilføj hælløft", "Kropsvægt", true),
      ex("Arm circles", "Skuldre · bryst", "Start småt og gør cirklerne gradvist større.", "Små cirkler", "Øg tempoet", "Kropsvægt", true),
      ex("World's greatest stretch", "Hofte · baglår · rotation", "Lang ryg og rolig rotation mod det forreste ben.", "Hånd på lår", "Albue mod gulv", "Måtte", true),
      ex("Step jack", "Puls · koordination", "Træd skiftevis ud og før armene over hovedet.", "Kun ben", "Jumping jack", "Kropsvægt", true),
      ex("Walkout", "Core · skuldre · bagkæde", "Gå ud med hænderne og hold kroppen lang.", "Kortere walkout", "Tilføj push-up", "Måtte", true),
      ex("Boxing punches", "Puls · rotation", "Drej fra hoften og hold skuldrene nede.", "Uden rotation", "Let bounce", "Kropsvægt", true),
      ex("Lateral step + reach", "Sidekæde · puls", "Træd bredt, hold knæ og tæer i samme retning.", "Mindre skridt", "Skater step", "Kropsvægt", true),
      ex("Glute bridge", "Balder · bagkæde", "Pres gennem hælene og afslut med spændte balder.", "Kortere løft", "March i toppen", "Måtte", true)
    ],
    lower: [
      ex("Goblet squat", "Quadriceps · glutes", "Brystet op, knæ følger tæerne.", "Bodyweight squat til bænk", "Pause i bunden", "Håndvægte", true),
      ex("Reverse lunge", "Ben · balance", "Træd tilbage og pres gennem forreste fod.", "Støt ved væg", "Knæløft på vej op", "Kropsvægt", true),
      ex("Romanian deadlift", "Baglår · glutes", "Skub hoften bagud og hold vægten tæt på benene.", "Kort bevægeudslag", "Langsom excentrisk fase", "Håndvægte", true),
      ex("Glute bridge", "Glutes · core", "Ribben ned og pres hoften op gennem hælene.", "Kortere bevægelse", "Ét ben ad gangen", "Måtte", true),
      ex("Lateral band walk", "Gluteus medius", "Hold knæene let bøjede og bækkenet roligt.", "Uden elastik", "Dybere position", "Elastik", true),
      ex("Step-up", "Ben · balance", "Hele foden på trinnet og kontrolleret ned.", "Lavere trin", "Knæløft i toppen", "Kropsvægt", true)
    ],
    upper: [
      ex("Bent-over row", "Øvre ryg · biceps", "Lang ryg og træk albuerne mod baglommerne.", "Én arm med støtte", "Pause i toppen", "Håndvægte", true),
      ex("Shoulder press", "Skulder · triceps", "Spænd maven og pres lodret over hovedet.", "Én arm ad gangen", "Squat to press", "Håndvægte", true),
      ex("Incline push-up", "Bryst · triceps · core", "Kroppen i én linje og albuer let tilbage.", "Højere støtte", "Push-up på gulv", "Kropsvægt", true),
      ex("Band pull-apart", "Bagskulder · øvre ryg", "Træk elastikken fra hinanden uden at løfte skuldrene.", "Let elastik", "Langsom retur", "Elastik", true),
      ex("Chest press", "Bryst · triceps", "Skulderblade i gulvet og håndled over albuer.", "Lettere vægt", "Ensidig press", "Håndvægte", true),
      ex("Half-kneeling halo", "Skulder · core", "Hold ribbenene nede, mens vægten føres omkring hovedet.", "Uden vægt", "Stående smal position", "Håndvægte", true)
    ],
    core: [
      ex("Dead bug", "Core-kontrol", "Hold lænden rolig og bevæg modsatte arm og ben.", "Kun ben", "Strakte ben", "Måtte", true),
      ex("Bird dog", "Core · ryg · balance", "Hold bækkenet stille og gør kroppen lang.", "Kun arm eller ben", "Albue mod knæ", "Måtte", true),
      ex("Plank", "Core-stabilitet", "Pres gulvet væk og hold en lang linje.", "Knæ i gulvet", "Shoulder taps", "Måtte", true),
      ex("Russian twist", "Rotation · obliques", "Drej brystkassen, ikke kun armene.", "Fødder i gulvet", "Tilføj vægt", "Måtte", true),
      ex("Bear hold", "Core · skulder", "Løft knæene få centimeter og hold ryggen rolig.", "Knæ i gulvet", "Bear crawl", "Måtte", true),
      ex("Side plank", "Sidecore · skulder", "Pres hoften frem og skab længde i kroppen.", "Nederste knæ i gulvet", "Topben løftes", "Måtte", true)
    ],
    pulse: [
      ex("Skater step", "Puls · lateral styrke", "Land blødt og hold knæet stabilt.", "Træd uden hop", "Skater jump", "Kropsvægt", false),
      ex("Mountain climber", "Puls · core", "Skuldre over hænder og hofterne i ro.", "Hænder på bænk", "Øg tempo", "Måtte", false),
      ex("Fast feet", "Puls · fodarbejde", "Små hurtige skridt og afslappede skuldre.", "March", "Retningsskift", "Kropsvægt", false),
      ex("Squat + knee drive", "Puls · ben · core", "Stabilt standben og rolig landing.", "Squat uden knæløft", "Tilføj hop", "Kropsvægt", false),
      ex("Low-impact burpee", "Hele kroppen · puls", "Træd tilbage én fod ad gangen og hold spænding i core.", "Hænder på bænk", "Burpee med hop", "Måtte", true),
      ex("Shadow boxing", "Puls · koordination", "Lette fødder, hænderne tilbage til hagen.", "Stå stille", "Tilføj duck", "Kropsvægt", true)
    ],
    cooldown: [
      ex("Knee to chest", "Glutes · lænd", "Træk roligt ind og hold skuldrene afslappede.", "Ét knæ bøjet", "Længere hold", "Måtte", true),
      ex("Supine spinal twist", "Ryg · rotation", "Begge skuldre bliver i gulvet.", "Mindre rotation", "Stræk øverste ben", "Måtte", true),
      ex("Hip flexor stretch", "Hoftebøjer", "Vip bækkenet let bagud og hold kroppen høj.", "Stående split stance", "Arm over hovedet", "Måtte", true),
      ex("Hamstring stretch", "Baglår", "Lang ryg og bevæg fra hoften.", "Bøjet knæ", "Strakt ben", "Måtte", true),
      ex("Chest opener", "Bryst · skulder", "Skuldrene ned og roligt åndedræt.", "Hænder på hofter", "Flet fingrene", "Kropsvægt", true)
    ]
  };

  const templates = {
    "Hele kroppen": [
      { title: "Styrke · underkrop", eyebrow: "Store muskelgrupper", pool: "lower" },
      { title: "Styrke · overkrop", eyebrow: "Pres og træk", pool: "upper" },
      { title: "Puls & core", eyebrow: "Kontrol under tempo", pool: "pulse" }
    ],
    "Styrke & puls": [
      { title: "Benstyrke", eyebrow: "Fundament", pool: "lower" },
      { title: "Overkropsstyrke", eyebrow: "Pres og træk", pool: "upper" },
      { title: "Konditionsfinisher", eyebrow: "Gradvis intensitet", pool: "pulse" }
    ],
    "Core & glutes": [
      { title: "Gluteaktivering", eyebrow: "Hofte og stabilitet", pool: "lower" },
      { title: "Core-kontrol", eyebrow: "Anti-extension og rotation", pool: "core" },
      { title: "Core & glute-flow", eyebrow: "Sammenhængende arbejde", pool: "core" }
    ],
    "Low impact": [
      { title: "Funktionel benstyrke", eyebrow: "Kontrol og balance", pool: "lower" },
      { title: "Holdning & overkrop", eyebrow: "Roligt pres og træk", pool: "upper" },
      { title: "Puls uden hop", eyebrow: "Ledvenligt tempo", pool: "pulse" }
    ]
  };

  const musicProfiles = {
    "Pop": profile("lyst, genkendeligt og energisk", ["Feel-good pop warm-up", "Pop fitness med tydelig 4/4-takt"], ["Pop workout hits", "Cardio pop med stabilt beat", "Power workout pop"], ["Rolig pop cooldown", "Acoustic pop recovery"], "pop workout steady beat"),
    "Elektronisk": profile("jævnt drive og tydelige energiskift", ["Melodic house warm-up", "Electronic fitness steady beat"], ["Dance workout", "House cardio steady beat", "EDM strength training"], ["Chill house cooldown", "Ambient electronic recovery"], "electronic workout house steady beat"),
    "Hip-hop / R&B": profile("tung groove og rolig selvtillid", ["R&B warm-up groove", "Old school hip-hop fitness"], ["Hip-hop workout clean", "Rap training motivation", "R&B strength session"], ["Slow R&B cooldown", "Neo soul recovery"], "hip hop rnb workout clean steady beat"),
    "Rock": profile("guitarenergi og markante omkvæd", ["Classic rock warm-up", "Indie rock movement"], ["Rock workout anthems", "Alternative rock training", "Power rock gym"], ["Acoustic rock cooldown", "Soft rock recovery"], "rock workout anthems steady beat"),
    "80'er & 90'er": profile("nostalgi, fællesskab og sikre hooks", ["80s feel-good warm-up", "90s dance warm-up"], ["80s workout classics", "90s dance fitness", "Retro cardio hits"], ["80s power ballads", "90s acoustic cooldown"], "80s 90s workout classics steady beat"),
    "Danske hits": profile("genkendelig dansk energi og fællessang", ["Danske feel-good hits", "Dansk pop warm-up"], ["Danske træningshits", "Dansk pop energi", "Dansk dance workout"], ["Dansk akustisk", "Danske rolige hits"], "danske træningshits workout tydelig takt")
  };

  function ex(name, focus, cue, regression, progression, equipment, lowImpact) {
    return { name, focus, cue, regression, progression, equipment, lowImpact, guide: exerciseGuides[name] };
  }

  function profile(descriptor, warm, work, cool, query) {
    return { descriptor, warm, work, cool, query };
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function answerHtml(value, emptyText = "Ikke udfyldt endnu") {
    const text = String(value ?? "").trim();
    return escapeHtml(text || emptyText).replaceAll("\n", "<br>");
  }

  function dosageFor(pool) {
    if (pool === "warmup") return "45 sek. arbejde + 15 sek. skift";
    if (pool === "conditioning" || pool === "pulse") return "40 sek. arbejde + 20 sek. skift";
    if (pool === "core") return "30-40 sek. kontrolleret arbejde";
    if (pool === "cooldown") return "30-45 sek. pr. side eller position";
    return "10-12 kontrollerede gentagelser";
  }

  function addDosage(exercises, pool) {
    return exercises.map(exercise => ({ ...exercise, dosage: exercise.dosage || dosageFor(pool) }));
  }

  function rotate(items, shift) {
    const offset = ((shift % items.length) + items.length) % items.length;
    return items.slice(offset).concat(items.slice(0, offset));
  }

  function eligible(pool) {
    const lowImpact = state.sessionType === "Low impact" || state.age === "60+" || state.intensity <= 4;
    const allowed = ["Kropsvægt", "Måtte", state.equipment];
    const equipped = pool.filter(item => allowed.includes(item.equipment));
    const impact = lowImpact ? equipped.filter(item => item.lowImpact) : equipped;
    return impact.length ? impact : equipped;
  }

  function sessionDurations() {
    const total = Math.min(180, Math.max(20, Math.round(state.sessionMinutes)));
    const arrival = total >= 45 ? 2 : 1;
    const cooldown = Math.min(10, Math.max(3, Math.round(total * 0.12)));
    const mainTotal = total - arrival - state.warmupMinutes - cooldown;
    const base = Math.floor(mainTotal / 3);
    const remainder = mainTotal % 3;
    const main = [base, base, base];
    if (remainder >= 1) main[2] += 1;
    if (remainder >= 2) main[0] += 1;
    return { total, arrival, warmup: state.warmupMinutes, main, mainTotal, cooldown };
  }

  function mainProtocol(duration) {
    const rounds = Math.max(1, Math.round(duration / 5));
    return `40 sek. arbejde / 20 sek. skift · ca. ${rounds} ${rounds === 1 ? "runde" : "runder"}`;
  }

  function createProgram() {
    const ageShift = state.age === "60+" ? 0 : state.age === "45–59" ? 2 : state.age === "30–44" ? 4 : 6;
    const timing = sessionDurations();
    const warmup = addDosage(rotate(eligible(exercisePools.warmup), state.version + ageShift).slice(0, state.warmupMinutes), "warmup");
    const result = [
      block("arrival", "00", "Velkomst & briefing", "Skab tryghed og retning", timing.arrival, "Præsentér mål, udstyr, dagens intensitet og alternativer.", [], null),
      block("warmup", "01", "Gradvis opvarmning", "Almen → specifik", timing.warmup, `${warmup.length} øvelser fordelt over ${state.warmupMinutes} min. Intensitet 3 → ${Math.min(state.intensity, 7)} / 10.`, warmup, "warmup")
    ];

    templates[state.sessionType].forEach((item, index) => {
      const duration = timing.main[index];
      const exerciseCount = duration <= 4 ? 2 : duration <= 8 ? 3 : 4;
      const exercises = addDosage(rotate(eligible(exercisePools[item.pool]), state.version + index * 2 + ageShift).slice(0, exerciseCount), item.pool);
      result.push(block(`main-${index}`, `0${index + 2}`, item.title, item.eyebrow, duration, mainProtocol(duration), exercises, item.pool));
    });

    const cooldownExercises = timing.cooldown <= 4 ? 3 : timing.cooldown <= 6 ? 4 : 5;
    result.push(block("cooldown", "05", "Nedvarmning & afrunding", "Ro, vejrtrækning og feedback", timing.cooldown, "Gradvis lavere puls, rolige stræk og kort fælles evaluering.", addDosage(rotate(exercisePools.cooldown, state.version).slice(0, cooldownExercises), "cooldown"), "cooldown"));
    return result;
  }

  function block(id, number, title, eyebrow, duration, protocol, exercises, pool) {
    return { id, number, title, eyebrow, duration, protocol, exercises, pool };
  }

  function ageNote() {
    if (state.age === "60+") return "Kontrollerede overgange, balance og alternativer uden hop prioriteres.";
    if (state.age === "45–59") return "Mobilitet og gradvis belastning er vægtet højt uden at sænke ambitionsniveauet.";
    if (state.age === "18–29") return "Tempo og atletiske variationer foreslås, men kan altid skaleres ned.";
    return "En balanceret kombination af styrke, puls og bevægelighed prioriteres.";
  }

  function spotifySearch(query) {
    return `https://open.spotify.com/search/${encodeURIComponent(query)}`;
  }

  const posePairs = {
    march: ["stand", "march"], catcow: ["allFours", "catRound"], squatReach: ["squat", "reach"],
    pull: ["armsFront", "armsWide"], lungeReach: ["lunge", "lungeReach"], jack: ["stand", "jack"],
    walkout: ["hinge", "plank"], punch: ["guard", "punch"], lateral: ["stand", "lateral"],
    bridge: ["bridgeLow", "bridgeHigh"], squat: ["stand", "squat"], lunge: ["stand", "lunge"],
    hinge: ["stand", "hinge"], step: ["stand", "step"], hingePull: ["hinge", "row"],
    press: ["pressStart", "pressEnd"], pushup: ["plank", "pushLow"], floorPress: ["floorPressStart", "floorPressEnd"],
    halo: ["halfKneel", "halo"], deadbug: ["deadbugStart", "deadbugEnd"], quadruped: ["allFours", "birdDog"],
    plank: ["plankKnees", "plank"], seatedTwist: ["seated", "twist"], bear: ["allFours", "bear"],
    sidePlank: ["sideLow", "sideHigh"], skater: ["stand", "skater"], mountain: ["plank", "mountain"],
    fastFeet: ["stand", "fastFeet"], squatKnee: ["squat", "march"], burpee: ["stand", "plank"],
    kneeChest: ["supine", "kneeChest"], spinalTwist: ["supineKnees", "spinalTwist"], hamStretch: ["stand", "hinge"]
  };

  const posePresets = {
    stand: pose(80, 24, ["M80 43 L80 101", "M80 56 L56 88", "M80 56 L104 88", "M80 101 L66 139 L62 168", "M80 101 L94 139 L98 168"]),
    march: pose(80, 24, ["M80 43 L80 101", "M80 56 L55 78 L68 58", "M80 56 L103 78 L94 96", "M80 101 L58 119 L48 96", "M80 101 L94 139 L98 168"], "M43 132 Q36 115 44 99"),
    squat: pose(80, 43, ["M80 61 L80 108", "M80 73 L56 82 L46 72", "M80 73 L104 82 L114 72", "M80 108 L55 126 L43 159", "M80 108 L105 126 L117 159"], "M127 91 Q139 109 126 126"),
    reach: pose(80, 24, ["M80 43 L80 101", "M80 56 L61 33 L55 10", "M80 56 L99 33 L105 10", "M80 101 L67 140 L63 168", "M80 101 L93 140 L97 168"], "M122 83 Q137 62 122 42"),
    armsFront: pose(80, 24, ["M80 43 L80 101", "M80 58 L55 65 L42 65", "M80 58 L105 65 L118 65", "M80 101 L67 140 L63 168", "M80 101 L93 140 L97 168"]),
    armsWide: pose(80, 24, ["M80 43 L80 101", "M80 58 L48 58 L20 58", "M80 58 L112 58 L140 58", "M80 101 L67 140 L63 168", "M80 101 L93 140 L97 168"], "M48 40 Q80 21 112 40"),
    lunge: pose(70, 27, ["M70 46 L73 96", "M72 58 L52 84", "M72 58 L94 82", "M73 96 L104 123 L105 164", "M73 96 L45 128 L29 157"], "M119 130 Q126 143 118 157"),
    lungeReach: pose(70, 27, ["M70 46 L73 96", "M72 58 L49 87", "M72 58 L87 32 L91 8", "M73 96 L104 123 L105 164", "M73 96 L45 128 L29 157"], "M106 38 Q118 58 106 78"),
    hinge: pose(108, 54, ["M96 66 L64 101", "M84 80 L106 111", "M84 80 L91 116", "M64 101 L54 137 L50 168", "M64 101 L82 137 L91 168"], "M43 78 Q52 61 72 56"),
    plank: pose(125, 76, ["M108 84 L66 106", "M101 89 L116 122 L134 126", "M99 91 L105 127 L122 130", "M66 106 L35 127 L14 142", "M66 106 L39 136 L20 151"]),
    guard: pose(80, 28, ["M80 47 L80 102", "M80 60 L57 72 L70 48", "M80 60 L102 71 L91 48", "M80 102 L63 140 L55 168", "M80 102 L101 137 L111 164"]),
    punch: pose(72, 30, ["M72 49 L78 102", "M76 61 L52 73 L65 51", "M76 61 L108 59 L141 58", "M78 102 L60 140 L51 168", "M78 102 L101 136 L114 163"], "M113 42 L143 42 M135 34 L145 42 L135 50"),
    jack: pose(80, 24, ["M80 43 L80 99", "M80 55 L57 31 L51 8", "M80 55 L103 31 L109 8", "M80 99 L51 134 L30 163", "M80 99 L109 134 L130 163"], "M21 87 Q14 67 23 48 M139 87 Q146 67 137 48"),
    lateral: pose(78, 39, ["M78 58 L79 108", "M78 70 L49 87 L30 70", "M78 70 L105 89 L127 70", "M79 108 L53 128 L41 161", "M79 108 L116 128 L139 156"], "M119 104 L147 104 M139 96 L149 104 L139 112"),
    bridgeLow: pose(29, 115, ["M44 122 L90 132", "M54 124 L28 142", "M90 132 L118 116 L143 145", "M90 132 L122 130 L148 154"], "", "M12 160 L152 160"),
    bridgeHigh: pose(29, 115, ["M44 122 L86 94", "M54 119 L28 142", "M86 94 L118 116 L143 145", "M86 94 L122 130 L148 154"], "M78 72 L88 61 L98 72", "M12 160 L152 160"),
    step: pose(75, 22, ["M75 41 L75 96", "M75 54 L53 84", "M75 54 L98 84", "M75 96 L104 121 L105 158", "M75 96 L53 132 L45 166"], "M115 116 Q127 99 118 80", "M90 160 L150 160 L150 132 L105 132"),
    row: pose(108, 54, ["M96 66 L64 101", "M85 80 L70 104 L91 98", "M86 80 L91 105 L111 101", "M64 101 L54 137 L50 168", "M64 101 L82 137 L91 168"], "M107 88 L122 88 M117 82 L124 88 L117 94"),
    pressStart: pose(80, 24, ["M80 43 L80 101", "M80 56 L55 67 L60 45", "M80 56 L105 67 L100 45", "M80 101 L67 140 L63 168", "M80 101 L93 140 L97 168"]),
    pressEnd: pose(80, 24, ["M80 43 L80 101", "M80 56 L62 33 L61 8", "M80 56 L98 33 L99 8", "M80 101 L67 140 L63 168", "M80 101 L93 140 L97 168"], "M118 67 Q132 47 119 28"),
    pushLow: pose(128, 94, ["M111 101 L68 119", "M105 104 L117 129 L138 132", "M101 106 L109 137 L127 139", "M68 119 L35 137 L14 150", "M68 119 L40 147 L20 158"]),
    floorPressStart: pose(28, 132, ["M43 136 L91 136", "M66 136 L55 105 L74 92", "M77 136 L91 105 L72 92", "M91 136 L122 137 L146 157"], "", "M10 163 L152 163"),
    floorPressEnd: pose(28, 132, ["M43 136 L91 136", "M66 136 L65 103 L64 72", "M77 136 L89 103 L91 72", "M91 136 L122 137 L146 157"], "M108 113 Q122 95 111 78", "M10 163 L152 163"),
    halfKneel: pose(80, 29, ["M80 48 L80 102", "M80 61 L58 81", "M80 61 L102 81", "M80 102 L105 126 L105 163", "M80 102 L56 132 L35 151"], "", "M20 164 L128 164"),
    halo: pose(80, 29, ["M80 48 L80 102", "M80 61 L56 48 L65 27", "M80 61 L104 48 L95 27", "M80 102 L105 126 L105 163", "M80 102 L56 132 L35 151"], "M52 23 Q80 3 108 23", "M20 164 L128 164"),
    deadbugStart: pose(31, 133, ["M46 137 L88 137", "M62 137 L52 101 L48 76", "M74 137 L88 101 L94 76", "M88 137 L111 111 L111 83", "M88 137 L128 118 L145 134"], "", "M10 163 L153 163"),
    deadbugEnd: pose(31, 133, ["M46 137 L88 137", "M62 137 L39 107 L23 80", "M74 137 L96 105 L101 77", "M88 137 L122 144 L151 154", "M88 137 L112 112 L113 84"], "M124 93 L146 72 M138 72 L147 71 L146 80", "M10 163 L153 163"),
    allFours: pose(113, 68, ["M99 77 L65 101", "M94 82 L108 117 L123 135", "M86 88 L92 124 L105 142", "M65 101 L49 126 L47 154", "M65 101 L75 132 L77 158"], "", "M28 160 L140 160"),
    catRound: pose(111, 78, ["M97 86 Q79 66 59 98", "M92 91 L108 123 L123 140", "M83 88 L91 127 L105 144", "M59 98 L47 130 L47 157", "M59 98 L72 134 L76 158"], "M59 67 Q78 52 97 67", "M28 160 L140 160"),
    birdDog: pose(111, 68, ["M98 77 L64 101", "M91 84 L117 62 L143 47", "M84 87 L91 124 L104 143", "M64 101 L35 82 L13 68", "M64 101 L76 134 L78 158"], "M121 31 L146 26 M139 20 L148 26 L140 33", "M28 160 L140 160"),
    plankKnees: pose(122, 77, ["M105 85 L65 108", "M99 90 L113 125 L132 130", "M92 95 L100 129 L119 134", "M65 108 L44 133 L56 157", "M65 108 L75 137 L88 158"], "", "M28 160 L145 160"),
    seated: pose(80, 50, ["M80 69 L80 113", "M80 80 L58 100", "M80 80 L102 100", "M80 113 L111 128 L137 151", "M80 113 L51 130 L27 151"], "", "M18 160 L145 160"),
    twist: pose(86, 50, ["M86 69 L75 113", "M82 79 L55 91 L37 79", "M82 79 L110 90 L128 78", "M75 113 L108 128 L135 151", "M75 113 L48 131 L24 151"], "M43 56 Q80 30 119 54", "M18 160 L145 160"),
    bear: pose(113, 68, ["M99 77 L65 101", "M94 82 L108 117 L123 135", "M86 88 L92 124 L105 142", "M65 101 L48 126 L47 146", "M65 101 L75 130 L78 146"], "M43 154 Q61 145 81 154", "M28 160 L140 160"),
    sideLow: pose(124, 107, ["M108 113 L65 126", "M101 116 L112 143 L132 148", "M65 126 L35 139 L14 148", "M76 123 L79 151"], "", "M10 160 L145 160"),
    sideHigh: pose(124, 76, ["M108 84 L65 107", "M101 88 L115 116 L136 125", "M65 107 L34 127 L13 141", "M78 100 L79 145"], "M53 85 Q65 72 78 83", "M10 160 L145 160"),
    skater: pose(77, 39, ["M77 58 L72 106", "M76 70 L45 83 L27 72", "M76 70 L105 86 L129 75", "M72 106 L48 132 L34 160", "M72 106 L105 127 L133 142"], "M113 112 L145 112 M137 104 L147 112 L137 120"),
    mountain: pose(125, 76, ["M108 84 L66 106", "M101 89 L116 122 L134 126", "M66 106 L35 127 L14 142", "M66 106 L91 127 L78 151"], "M75 137 Q91 126 103 137"),
    fastFeet: pose(80, 31, ["M80 50 L77 102", "M79 62 L57 82", "M79 62 L101 82", "M77 102 L61 137 L48 163", "M77 102 L98 134 L114 157"], "M34 146 L16 146 M124 146 L147 146"),
    supine: pose(27, 132, ["M42 136 L91 136", "M58 136 L32 149", "M91 136 L121 138 L149 153"], "", "M10 163 L153 163"),
    kneeChest: pose(27, 132, ["M42 136 L88 136", "M57 136 L36 150", "M88 136 L110 111 L91 93", "M88 136 L124 139 L150 153"], "M82 82 Q104 70 118 88", "M10 163 L153 163"),
    supineKnees: pose(27, 132, ["M42 136 L88 136", "M58 136 L34 151", "M88 136 L111 111 L132 136", "M88 136 L116 116 L143 140"], "", "M10 163 L153 163"),
    spinalTwist: pose(27, 132, ["M42 136 L88 136", "M58 136 L34 151", "M88 136 L109 145 L133 130", "M88 136 L111 154 L142 151"], "M107 112 Q129 106 140 122", "M10 163 L153 163")
  };

  function pose(headX, headY, paths, motion = "", extra = "") {
    return { headX, headY, paths, motion, extra };
  }

  function poseSvg(visual, phase, title) {
    const names = posePairs[visual] || ["stand", "march"];
    const item = posePresets[names[phase]] || posePresets.stand;
    return `<svg class="pose-svg" viewBox="0 0 160 180" role="img" aria-label="${title}">
      <path class="pose-ground" d="M12 169 H148"/>
      ${item.extra ? `<path class="pose-equipment" d="${item.extra}"/>` : ""}
      <g class="pose-person"><circle cx="${item.headX}" cy="${item.headY}" r="12"/>${item.paths.map(path => `<path d="${path}"/>`).join("")}</g>
      ${item.motion ? `<path class="pose-motion" d="${item.motion}"/>` : ""}
    </svg>`;
  }

  const muscleHighlights = {
    quads: '<ellipse cx="405" cy="680" rx="58" ry="122"/><ellipse cx="548" cy="680" rx="58" ry="122"/>',
    hamstrings: '<ellipse cx="998" cy="680" rx="54" ry="122"/><ellipse cx="1138" cy="680" rx="54" ry="122"/>',
    glutes: '<ellipse cx="1003" cy="550" rx="76" ry="64"/><ellipse cx="1130" cy="550" rx="76" ry="64"/>',
    gluteMedius: '<ellipse cx="976" cy="514" rx="56" ry="39"/><ellipse cx="1156" cy="514" rx="56" ry="39"/>',
    calves: '<ellipse cx="1000" cy="850" rx="39" ry="91"/><ellipse cx="1138" cy="850" rx="39" ry="91"/>',
    hipFlexors: '<ellipse cx="430" cy="530" rx="31" ry="63"/><ellipse cx="520" cy="530" rx="31" ry="63"/>',
    adductors: '<ellipse cx="449" cy="679" rx="30" ry="120"/><ellipse cx="504" cy="679" rx="30" ry="120"/>',
    chest: '<ellipse cx="476" cy="311" rx="151" ry="92"/>',
    lats: '<path d="M907 325 Q1064 260 1222 325 L1174 516 Q1064 468 956 516 Z"/>',
    upperBack: '<path d="M910 250 Q1064 188 1218 250 L1150 403 Q1064 358 978 403 Z"/>',
    delts: '<ellipse cx="320" cy="286" rx="54" ry="69"/><ellipse cx="633" cy="286" rx="54" ry="69"/><ellipse cx="902" cy="286" rx="54" ry="69"/><ellipse cx="1227" cy="286" rx="54" ry="69"/>',
    frontDelts: '<ellipse cx="320" cy="286" rx="54" ry="69"/><ellipse cx="633" cy="286" rx="54" ry="69"/>',
    rearDelts: '<ellipse cx="902" cy="286" rx="54" ry="69"/><ellipse cx="1227" cy="286" rx="54" ry="69"/>',
    rhomboids: '<path d="M1000 300 L1053 326 L1027 430 L972 388 Z"/><path d="M1128 300 L1075 326 L1101 430 L1156 388 Z"/>',
    biceps: '<ellipse cx="283" cy="418" rx="39" ry="87"/><ellipse cx="670" cy="418" rx="39" ry="87"/>',
    triceps: '<ellipse cx="847" cy="422" rx="39" ry="91"/><ellipse cx="1281" cy="422" rx="39" ry="91"/>',
    abs: '<rect x="419" y="384" width="114" height="206" rx="48"/>',
    obliques: '<path d="M361 373 Q415 400 420 520 L395 596 Q343 525 349 420 Z"/><path d="M592 373 Q538 400 533 520 L558 596 Q610 525 604 420 Z"/>',
    erectors: '<rect x="1024" y="332" width="31" height="272" rx="15"/><rect x="1072" y="332" width="31" height="272" rx="15"/>',
    deepCore: '<path d="M382 447 Q476 421 570 447 L557 542 Q476 565 395 542 Z"/>',
    spinalMobility: '<rect x="1030" y="350" width="18" height="252" rx="9"/><rect x="1080" y="350" width="18" height="252" rx="9"/>'
  };

  let anatomyMaskSequence = 0;

  function anatomySvg(keys) {
    const highlights = keys.map(key => muscleHighlights[key] || "").join("");
    const maskId = `anatomy-body-mask-${++anatomyMaskSequence}`;
    return `<div class="anatomy-visual">
      <div class="anatomy-figure">
        <img src="assets/images/anatomy-base.png" alt="Anatomisk illustration af kroppens muskulatur set forfra og bagfra">
        <svg class="anatomy-svg" viewBox="0 0 1536 1024" role="img" aria-label="De primære muskelgrupper er fremhævet med orange">
          <defs><mask id="${maskId}" maskUnits="userSpaceOnUse" x="0" y="0" width="1536" height="1024"><image href="assets/images/anatomy-base.png" x="0" y="0" width="1536" height="1024" preserveAspectRatio="xMidYMid meet" /></mask></defs>
          <g class="anatomy-highlight" mask="url(#${maskId})">${highlights}</g>
        </svg>
      </div>
    </div>`;
  }

  function exerciseVisualHtml(exercise) {
    if (window.NextPro) return window.NextPro.visualHTML(exercise);
    const item = exercise.guide || guide("march", "Start i en stabil position.", "Udfør bevægelsen kontrolleret.", ["deepCore"]);
    const image = exerciseImages[exercise.name] || "march.png";
    return `<section class="exercise-learning" aria-label="Udførelse og muskelgrupper for ${exercise.name}">
      <div class="exercise-learning-grid">
        <div class="movement-panel">
          <div class="movement-visual"><img src="assets/images/exercises/${image}" alt="${exercise.name} vist i start- og slutposition"><span class="start-label">01 · START</span><span class="finish-label">02 · BEVÆGELSE</span></div>
          <div class="movement-steps"><div><span>01</span><p>${item.start}</p></div><div><span>02</span><p>${item.finish}</p></div></div>
        </div>
        <aside class="muscle-panel">
          <div><span>PRIMÆRE MUSKELGRUPPER</span><h4>Aktive muskler</h4></div>
          ${anatomySvg(item.muscles)}
          <ul>${item.muscles.map((key, index) => `<li><i aria-hidden="true"></i><div><strong>${muscleGroups[key].latin}</strong><small>${item.roles[index] ? `${item.roles[index]} · ` : ""}${muscleGroups[key].danish}</small></div></li>`).join("")}</ul>
        </aside>
      </div>
      <p class="illustration-note">Illustrationerne er vejledende. Tilpas altid bevægeudslag og belastning til deltageren.</p>
    </section>`;
  }

  function render(regenerate = true) {
    if (regenerate || !state.program.length) state.program = createProgram();
    const totalMinutes = state.program.reduce((sum, item) => sum + item.duration, 0);
    document.getElementById("program-title").textContent = state.sessionType;
    document.getElementById("program-meta").textContent = `${state.age} år · ${state.level} · ${totalMinutes} min · intensitet ${state.intensity}/10 · ${state.equipment}`;
    document.getElementById("total-time").textContent = totalMinutes;
    document.getElementById("hero-duration").textContent = totalMinutes;
    document.getElementById("hero-duration-text").textContent = `${totalMinutes} minutters holdtræning`;
    document.getElementById("age-note").innerHTML = `<strong>Tilpasning til ${state.age} år:</strong> ${ageNote()}`;
    renderProgram();
    renderMusic();
    renderAssignment();
  }

  function renderProgram() {
    const timeline = document.getElementById("program-timeline");
    timeline.innerHTML = state.program.map((item, blockIndex) => `
      <article class="program-block">
        <div class="block-number">${item.number}</div>
        <div class="block-content">
          <header><div><p>${escapeHtml(item.eyebrow)}</p><h3>${escapeHtml(item.title)}</h3></div><div class="block-duration">${item.duration}<span>MIN</span></div></header>
          <p class="protocol">${escapeHtml(item.protocol)}</p>
          ${window.NextPro?.blockTools(blockIndex) || ""}
          ${item.exercises.length ? `<div class="exercise-list">${item.exercises.map((exercise, exerciseIndex) => exerciseHtml(exercise, blockIndex, exerciseIndex)).join("")}</div>` : ""}
        </div>
      </article>`).join("");

    timeline.querySelectorAll(".exercise-main").forEach(button => {
      button.addEventListener("click", () => {
        const row = button.closest(".exercise-row");
        const details = row.querySelector(".exercise-details");
        const open = details.hidden;
        timeline.querySelectorAll(".exercise-details").forEach(item => item.hidden = true);
        timeline.querySelectorAll(".exercise-main").forEach(item => item.setAttribute("aria-expanded", "false"));
        timeline.querySelectorAll(".details-toggle").forEach(item => item.textContent = "+");
        details.hidden = !open;
        button.setAttribute("aria-expanded", String(open));
        button.querySelector(".details-toggle").textContent = open ? "−" : "+";
      });
    });

    timeline.querySelectorAll(".swap-button").forEach(button => {
      button.addEventListener("click", () => swapExercise(Number(button.dataset.block), Number(button.dataset.exercise)));
    });

    timeline.querySelectorAll(".exercise-dose-input").forEach(input => {
      input.addEventListener("input", () => {
        const exercise = state.program[Number(input.dataset.block)].exercises[Number(input.dataset.exercise)];
        exercise.dosage = input.value;
        const doseSummary = input.closest(".exercise-row").querySelector(".exercise-dose-summary");
        if (doseSummary) doseSummary.textContent = input.value;
        renderPrintExercisePages();
        renderAssignment();
        markUnsaved();
      });
    });

    renderPrintExercisePages();
  }

  function renderPrintExercisePages() {
    if (window.NextPro) return window.NextPro.renderPrint();
    const printContainer = document.getElementById("print-exercise-pages");
    const exercises = state.program.flatMap((block, blockIndex) =>
      block.exercises.map((exercise, exerciseIndex) => ({ blockIndex, exercise, exerciseIndex }))
    );
    const pages = [];

    for (let index = 0; index < exercises.length; index += 2) {
      const pair = exercises.slice(index, index + 2);
      pages.push(`<section class="print-exercise-page" aria-label="Øvelser ${index + 1}-${index + pair.length}">
        ${pair.map(({ blockIndex, exercise, exerciseIndex }) => exerciseHtml(exercise, blockIndex, exerciseIndex)).join("")}
      </section>`);
    }

    printContainer.innerHTML = pages.join("");
  }

  function exerciseHtml(exercise, blockIndex, exerciseIndex) {
    if (window.NextPro) return window.NextPro.exerciseHTML(exercise, blockIndex, exerciseIndex);
    return `<div class="exercise-row">
      <button class="exercise-main" type="button" aria-expanded="false">
        <span class="exercise-index">${String(exerciseIndex + 1).padStart(2, "0")}</span>
        <span><strong>${exercise.name}</strong><small>${exercise.focus} · ${exercise.equipment}</small><small class="exercise-dose-summary">${escapeHtml(exercise.dosage || dosageFor(state.program[blockIndex].pool))}</small></span>
        <span class="details-toggle">+</span>
      </button>
      <button class="swap-button" type="button" data-block="${blockIndex}" data-exercise="${exerciseIndex}" aria-label="Skift ${exercise.name}" title="Skift øvelse">↻ <span>Skift</span></button>
      <div class="exercise-details" hidden>
        <label class="exercise-dose-field"><span>Gentagelser / arbejdstid</span><input class="exercise-dose-input" type="text" value="${escapeHtml(exercise.dosage || dosageFor(state.program[blockIndex].pool))}" data-block="${blockIndex}" data-exercise="${exerciseIndex}"></label>
        <div class="coaching-grid">
          <div><span>Cue</span><p>${exercise.cue}</p></div>
          <div><span>Regression</span><p>${exercise.regression}</p></div>
          <div><span>Progression</span><p>${exercise.progression}</p></div>
        </div>
        ${exerciseVisualHtml(exercise)}
      </div>
    </div>`;
  }

  function swapExercise(blockIndex, exerciseIndex) {
    const item = state.program[blockIndex];
    if (!item.pool) return;
    const pool = eligible(exercisePools[item.pool]);
    const current = item.exercises[exerciseIndex];
    const start = Math.max(0, pool.findIndex(exercise => exercise.name === current.name));
    const used = item.exercises.map(exercise => exercise.name);
    const replacement = rotate(pool, start + 1).find(exercise => !used.includes(exercise.name)) || pool[(start + 1) % pool.length];
    item.exercises[exerciseIndex] = { ...replacement, dosage: dosageFor(item.pool) };
    renderProgram();
    renderAssignment();
    markUnsaved();
  }

  function renderMusic() {
    const music = musicProfiles[state.music];
    const bpm = musicTempo();
    const warmupMinutes = state.program.find(item => item.id === "warmup")?.duration ?? 0;
    const workMinutes = state.program.filter(item => !["arrival", "warmup", "cooldown"].includes(item.id)).reduce((sum, item) => sum + item.duration, 0);
    const cooldownMinutes = state.program.find(item => item.id === "cooldown")?.duration ?? 0;
    document.getElementById("spotify-main").href = spotifySearch(music.query);
    const phases = [
      { number: "01", title: "Opvarmning", time: `${warmupMinutes} min`, tracks: music.warm, energy: `Tydelig 4/4 · ${bpm.warm}` },
      { number: "02", title: "Hoveddel", time: `${workMinutes} min`, tracks: music.work, energy: `Tydelig 4/4 · ${bpm.work}` },
      { number: "03", title: "Nedvarmning", time: `${cooldownMinutes} min`, tracks: music.cool, energy: `Rolig puls · ${bpm.cool}` }
    ];
    document.getElementById("music-plan").innerHTML = `
      <div class="music-summary"><span>Valgt Spotify-profil</span><strong>${state.music}</strong><p>${music.descriptor}. Forslagene prioriterer en tydelig, stabil takt, som er nem at orientere sig efter. BPM er musiktempo – ikke et krav om øvelsestempo.</p></div>
      ${phases.map(phase => `<article class="music-phase"><div class="phase-head"><span>${phase.number}</span><div><p>${phase.energy}</p><h3>${phase.title}</h3></div><strong>${phase.time}</strong></div><ul>${phase.tracks.map(track => `<li><span>${track}</span><a href="${spotifySearch(track)}" target="_blank" rel="noreferrer" aria-label="Åbn Spotify-søgning efter ${track}">Åbn på Spotify ↗</a></li>`).join("")}</ul></article>`).join("")}`;

    const printMusic = document.getElementById("print-music-sheet");
    printMusic.innerHTML = `
      <header class="print-music-header">
        <div><span>03 · MUSIKVALG TIL HOLDTIMEN</span><h3>${state.music}</h3><p>${music.descriptor}. Tydelig 4/4-takt og en gradvis energikurve. Links er indstillet til en ny fane. Hvis PDF-læseren tilsidesætter det, brug Ctrl + klik.</p></div>
        <a href="${spotifySearch(music.query)}" target="_blank" rel="noopener noreferrer">Åbn Spotify ↗</a>
      </header>
      <div class="print-music-grid">
        ${phases.map(phase => `<article class="print-music-card"><div><span>${phase.number}</span><strong>${phase.title}</strong><small>${phase.time} · ${phase.energy}</small></div><ul>${phase.tracks.map(track => `<li><a href="${spotifySearch(track)}" target="_blank" rel="noopener noreferrer">${track} - Åbn på Spotify ↗</a></li>`).join("")}</ul></article>`).join("")}
      </div>`;
  }

  const assignmentLabels = {
    purpose: "Formål med træningen",
    formRationale: "Valg af træningsform og begrundelse",
    warmupRationale: "Opvarmning og gradvis intensitet",
    warmupConnection: "Bevægelser og muskelgrupper der forberedes",
    cooldownRationale: "Nedvarmning og samlet afslutning",
    smallGroupRationale: "Hvorfor programmet er Small Group Training",
    organization: "Organisering, stationer og udstyr",
    workRest: "Arbejdstid, pauser, sæt og skift",
    activeParticipants: "Sådan holdes alle deltagere aktive",
    intensityControl: "Intensitetsstyring og løbende tilpasning",
    instruction: "Instruktion, demonstration og motivation",
    logistics: "Praktiske skift, vand og justering af udstyr",
    practicalNotes: "Observationer fra den praktiske afprøvning"
  };

  function minutePlanEntries() {
    let start = 0;
    return state.program.map(item => {
      const entry = { start, end: start + item.duration, title: item.title, detail: item.protocol };
      start = entry.end;
      return entry;
    });
  }

  function minutePlanHtml() {
    return `<div class="minute-plan-table">${minutePlanEntries().map(entry => `<div><span>${entry.start}-${entry.end} min</span><p><strong>${escapeHtml(entry.title)}</strong><small>${escapeHtml(entry.detail)}</small></p></div>`).join("")}</div>`;
  }

  function assignmentRules() {
    const assignment = state.assignment;
    const participants = assignment.participants.slice(0, Number(assignment.participantCount));
    const participantProfilesReady = participants.every(person => person.name.trim() && person.profile.trim() && person.needs.trim());
    const has = (...keys) => keys.every(key => String(assignment[key] || "").trim().length >= 12);
    return [
      { label: "2-3 deltagerprofiler er beskrevet", done: participantProfilesReady },
      { label: "Programmet giver præcis 55 minutter", done: state.program.reduce((sum, item) => sum + item.duration, 0) === 55 },
      { label: "Formål og træningsform er begrundet", done: has("purpose", "formRationale") },
      { label: "Opvarmning og nedvarmning hænger sammen med timen", done: has("warmupRationale", "warmupConnection", "cooldownRationale") },
      { label: "Organisering, arbejdstid, pauser og skift er beskrevet", done: has("organization", "workRest", "logistics") },
      { label: "Aktivitet, intensitet og instruktion er planlagt", done: has("activeParticipants", "intensityControl", "instruction") },
      { label: "Small Group-formatet er fagligt forklaret", done: has("smallGroupRationale") },
      { label: "Praktisk afprøvning er evalueret", done: has("practicalNotes") }
    ];
  }

  function printAnswerItem(key) {
    return `<article><h4>${assignmentLabels[key]}</h4><p>${answerHtml(state.assignment[key])}</p></article>`;
  }

  function renderPracticalPrintSheet() {
    const total = state.program.reduce((sum, item) => sum + item.duration, 0);
    const notes = String(state.assignment.practicalNotes || "").trim();
    document.getElementById("print-practical-sheet").innerHTML = `
      <header class="print-practical-header">
        <div><span>SIDSTE SIDE · PRAKTISK AFPRØVNING</span><h2>Kommentarer efter gennemførelsen</h2><p>Notér teknik, intensitet, individuelle tilpasninger og de ændringer, I foretog undervejs.</p></div>
        <strong>${total}<small>MIN</small></strong>
      </header>
      <div class="print-practical-meta"><span>${answerHtml(state.assignment.title, "Small Group Training")}</span><span>${state.assignment.participantCount} deltagere</span><span>${escapeHtml(state.sessionType)}</span></div>
      <section class="print-practical-writing-area" aria-label="Plads til håndskrevne kommentarer">${notes ? `<p>${escapeHtml(notes)}</p>` : ""}</section>`;
  }

  function renderAssignmentPrintSummary() {
    const assignment = state.assignment;
    const total = state.program.reduce((sum, item) => sum + item.duration, 0);
    const participants = assignment.participants.slice(0, Number(assignment.participantCount));
    const exerciseRows = state.program.flatMap(block => block.exercises.map(exercise => `<tr><td>${escapeHtml(block.title)}</td><td>${escapeHtml(exercise.name)}</td><td>${escapeHtml(exercise.dosage || dosageFor(block.pool))}</td><td>${escapeHtml(exercise.regression)}</td><td>${escapeHtml(exercise.progression)}</td></tr>`)).join("");
    document.getElementById("assignment-print-summary").innerHTML = `
      <header class="assignment-print-header"><div><span>OPGAVEBESVARELSE</span><h2>${answerHtml(assignment.title, "Small Group Training")}</h2><p>${assignment.participantCount} deltagere · ${total} minutter · ${escapeHtml(state.sessionType)}</p></div><strong>${total}<small>MIN</small></strong></header>
      <section class="assignment-print-section"><h3>Deltagerprofiler</h3><div class="assignment-print-participants">${participants.map((person, index) => `<article><span>0${index + 1}</span><h4>${answerHtml(person.name, `Deltager ${index + 1}`)}</h4><p><strong>Profil:</strong> ${answerHtml(person.profile)}</p><p><strong>Mål og hensyn:</strong> ${answerHtml(person.needs)}</p></article>`).join("")}</div></section>
      <section class="assignment-print-section"><h3>Faglige valg</h3><div class="assignment-print-answers">${["purpose", "formRationale", "warmupRationale", "warmupConnection", "cooldownRationale", "smallGroupRationale"].map(printAnswerItem).join("")}</div></section>
      <section class="assignment-print-section"><h3>Gennemførelse og styring</h3><div class="assignment-print-answers">${["organization", "workRest", "activeParticipants", "intensityControl", "instruction", "logistics"].map(printAnswerItem).join("")}</div></section>
      <section class="assignment-print-section"><h3>Minut-for-minut-plan</h3>${minutePlanHtml()}</section>
      <section class="assignment-print-section exercise-overview"><h3>Øvelser, dosering og niveauer</h3><table><thead><tr><th>Blok</th><th>Øvelse</th><th>Gentagelser / tid</th><th>Regression</th><th>Progression</th></tr></thead><tbody>${exerciseRows}</tbody></table></section>`;
    renderPracticalPrintSheet();
  }

  function renderAssignment() {
    const total = state.program.reduce((sum, item) => sum + item.duration, 0);
    document.getElementById("assignment-total").textContent = total;
    document.getElementById("assignment-minute-plan").innerHTML = minutePlanHtml();
    document.querySelectorAll("[data-participant-card]").forEach(card => {
      card.hidden = Number(card.dataset.participantCard) >= Number(state.assignment.participantCount);
    });
    const rules = assignmentRules();
    const completed = rules.filter(rule => rule.done).length;
    document.getElementById("assignment-progress").textContent = `${completed} / ${rules.length}`;
    document.getElementById("assignment-progress-text").textContent = completed === rules.length ? "Besvarelsen opfylder alle opgavepunkter." : "De åbne punkter skal udfyldes før aflevering.";
    document.getElementById("assignment-checklist").innerHTML = rules.map(rule => `<li class="${rule.done ? "done" : ""}"><span>${rule.done ? "✓" : "○"}</span>${escapeHtml(rule.label)}</li>`).join("");
    renderAssignmentPrintSummary();
  }

  function syncAssignmentForm() {
    document.querySelectorAll("[data-assignment-key]").forEach(field => {
      field.value = state.assignment[field.dataset.assignmentKey] ?? "";
    });
    document.querySelectorAll("[data-participant-index]").forEach(field => {
      const person = state.assignment.participants[Number(field.dataset.participantIndex)];
      field.value = person?.[field.dataset.participantField] ?? "";
    });
  }

  function assignmentText() {
    const assignment = state.assignment;
    const participants = assignment.participants.slice(0, Number(assignment.participantCount));
    const answers = Object.keys(assignmentLabels).map(key => `${assignmentLabels[key]}\n${assignment[key] || "Ikke udfyldt endnu"}`).join("\n\n");
    const minutePlan = minutePlanEntries().map(entry => `${entry.start}-${entry.end} min: ${entry.title} - ${entry.detail}`).join("\n");
    const exercises = state.program.flatMap(block => block.exercises.map(exercise => `${block.title}: ${exercise.name} | ${exercise.dosage || dosageFor(block.pool)} | Regression: ${exercise.regression} | Progression: ${exercise.progression}`)).join("\n");
    return `${assignment.title}\n${assignment.participantCount} deltagere · ${state.program.reduce((sum, item) => sum + item.duration, 0)} minutter\n\nDELTAGERE\n${participants.map((person, index) => `${index + 1}. ${person.name || `Deltager ${index + 1}`} | ${person.profile || "Profil ikke udfyldt"} | ${person.needs || "Mål og hensyn ikke udfyldt"}`).join("\n")}\n\n${answers}\n\nMINUT-FOR-MINUT-PLAN\n${minutePlan}\n\nØVELSER\n${exercises}`;
  }

  function musicTempo() {
    const ageAdjustment = state.age === "60+" ? -8 : state.age === "45–59" ? -4 : state.age === "18–29" ? 3 : 0;
    const intensityAdjustment = (state.intensity - 6) * 2;
    const warmLow = Math.max(92, 104 + ageAdjustment + Math.round(intensityAdjustment / 2));
    const workLow = Math.max(105, 118 + ageAdjustment + intensityAdjustment);
    const coolLow = Math.max(78, 88 + Math.round(ageAdjustment / 2));
    return {
      warm: `${warmLow}–${warmLow + 10} BPM`,
      work: `${workLow}–${workLow + 10} BPM`,
      cool: `${coolLow}–${coolLow + 10} BPM`
    };
  }

  function markUnsaved() {
    const button = document.getElementById("save-program");
    button.classList.remove("saved");
    button.textContent = "Gem opgave";
    document.dispatchEvent(new Event("next:change"));
  }

  function copyProgram() {
    copyText(window.NextPro?.programText() || assignmentText(), document.getElementById("copy-program"));
  }

  function copyAssignment() {
    copyText(assignmentText(), document.getElementById("copy-assignment"));
  }

  function copyText(text, button) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => showCopied(button)).catch(() => fallbackCopy(text, button));
    } else {
      fallbackCopy(text, button);
    }
  }

  function fallbackCopy(text, button) {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    showCopied(button);
  }

  function showCopied(button) {
    const original = button.textContent;
    button.textContent = "Kopieret ✓";
    window.setTimeout(() => button.textContent = original, 1600);
  }

  function requestPrint(event) {
    if (window.NextPro?.printProgram) return window.NextPro.printProgram(event);
    const button = event?.currentTarget;
    const originalLabel = button?.textContent || "";
    if (button) {
      button.disabled = true;
      button.textContent = "Forbereder PDF …";
    }
    preparePrint();
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      window.print();
      if (button) {
        button.disabled = false;
        button.textContent = originalLabel;
      }
    }));
  }

  function syncControls() {
    document.getElementById("session-type").value = state.sessionType;
    document.getElementById("equipment").value = state.equipment;
    document.getElementById("music").value = state.music;
    document.getElementById("session-duration").value = state.sessionMinutes;
    document.getElementById("warmup").value = state.warmupMinutes;
    document.getElementById("warmup-output").textContent = `${state.warmupMinutes} min`;
    document.getElementById("intensity").value = state.intensity;
    document.getElementById("intensity-output").textContent = `${state.intensity} / 10`;
    document.querySelectorAll("#age-options button").forEach(button => button.classList.toggle("active", button.dataset.value === state.age));
    document.querySelectorAll("#level-options button").forEach(button => button.classList.toggle("active", button.dataset.value === state.level));
  }

  function restoreSavedState() {
    try {
      const saved = JSON.parse(localStorage.getItem("next-training-program") || "null");
      if (!saved?.settings) return;
      const savedAssignment = saved.settings.assignment || {};
      const savedParticipants = Array.isArray(savedAssignment.participants) ? savedAssignment.participants : [];
      const defaults = state.assignment;
      Object.assign(state, saved.settings, {
        assignment: {
          ...defaults,
          ...savedAssignment,
          participants: defaults.participants.map((person, index) => ({ ...person, ...(savedParticipants[index] || {}) }))
        }
      });
      state.sessionMinutes = Math.min(180, Math.max(20, Math.round(Number(state.sessionMinutes) || 55)));
    } catch (error) {
      // En beskadiget lokal gemning ignoreres, så siden stadig kan åbnes.
    }
  }

  let printDetailState = [];
  let documentTitleBeforePrint = "";

  function preparePrint() {
    renderMusic();
    renderPrintExercisePages();
    renderPracticalPrintSheet();
    if (window.NextPro) window.NextPro.preparePrint();
    if (document.body.classList.contains("printing-full-program")) return;
    documentTitleBeforePrint = document.title;
    const date = new Date().toISOString().slice(0, 10);
    document.title = `NEXT-traeningsplan-${date}`;
    const details = Array.from(document.querySelectorAll(".exercise-details"));
    printDetailState = details.map(item => item.hidden);
    details.forEach(item => item.hidden = false);
    document.body.classList.add("printing-full-program");
  }

  function restoreAfterPrint() {
    if (!document.body.classList.contains("printing-full-program")) return;
    const details = Array.from(document.querySelectorAll(".exercise-details"));
    details.forEach((item, index) => item.hidden = printDetailState[index] !== false);
    document.body.classList.remove("printing-full-program");
    printDetailState = [];
    if (documentTitleBeforePrint) document.title = documentTitleBeforePrint;
    documentTitleBeforePrint = "";
  }

  function bindSegmented(id, key) {
    const container = document.getElementById(id);
    container.addEventListener("click", event => {
      const button = event.target.closest("button");
      if (!button) return;
      container.querySelectorAll("button").forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      state[key] = button.dataset.value;
      markUnsaved();
    });
  }

  function updateSessionMinutes(rawValue, normalizeInput = false) {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) return;
    const minutes = Math.min(180, Math.max(20, Math.round(parsed)));
    state.sessionMinutes = minutes;
    if (normalizeInput) document.getElementById("session-duration").value = minutes;
    document.getElementById("hero-duration").textContent = minutes;
    document.getElementById("hero-duration-text").textContent = `${minutes} minutters holdtræning`;
    markUnsaved();
  }

  function bindAssignmentForm() {
    const form = document.getElementById("assignment-form");
    form.querySelectorAll(".answer-section").forEach(section => {
      section.addEventListener("toggle", () => {
        if (!section.open) return;
        form.querySelectorAll(".answer-section").forEach(other => {
          if (other !== section) other.open = false;
        });
      });
    });
    const update = event => {
      const field = event.target;
      if (field.dataset.assignmentKey) {
        state.assignment[field.dataset.assignmentKey] = field.value;
      }
      if (field.dataset.participantIndex !== undefined) {
        const person = state.assignment.participants[Number(field.dataset.participantIndex)];
        person[field.dataset.participantField] = field.value;
      }
      renderAssignment();
      markUnsaved();
    };
    form.addEventListener("input", update);
    form.addEventListener("change", update);
  }

  function applySmallGroupBrief() {
    state.sessionMinutes = 55;
    state.assignment.participantCount = "3";
    state.version += 1;
    syncControls();
    syncAssignmentForm();
    render();
    markUnsaved();
    document.getElementById("program").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function initialize() {
    restoreSavedState();
    syncControls();
    syncAssignmentForm();
    bindSegmented("age-options", "age");
    bindSegmented("level-options", "level");
    bindAssignmentForm();



    document.getElementById("session-type").addEventListener("change", event => { state.sessionType = event.target.value; markUnsaved(); });
    document.getElementById("equipment").addEventListener("change", event => { state.equipment = event.target.value; markUnsaved(); });
    document.getElementById("session-duration").addEventListener("input", event => updateSessionMinutes(event.target.value));
    document.getElementById("session-duration").addEventListener("change", event => updateSessionMinutes(event.target.value, true));
    document.getElementById("music").addEventListener("change", event => { state.music = event.target.value; renderMusic(); markUnsaved(); });
    document.getElementById("warmup").addEventListener("input", event => { state.warmupMinutes = Number(event.target.value); document.getElementById("warmup-output").textContent = `${state.warmupMinutes} min`; markUnsaved(); });
    document.getElementById("intensity").addEventListener("input", event => { state.intensity = Number(event.target.value); document.getElementById("intensity-output").textContent = `${state.intensity} / 10`; markUnsaved(); });

    document.getElementById("generate").addEventListener("click", () => { state.version += 1; render(); markUnsaved(); document.getElementById("program").scrollIntoView({ behavior: "smooth", block: "start" }); });
    document.getElementById("copy-program").addEventListener("click", copyProgram);
    document.getElementById("copy-assignment").addEventListener("click", copyAssignment);
    document.getElementById("print-program").addEventListener("click", requestPrint);
    document.getElementById("print-assignment").addEventListener("click", requestPrint);
    document.getElementById("apply-small-group").addEventListener("click", applySmallGroupBrief);
    window.addEventListener("beforeprint", preparePrint);
    window.addEventListener("afterprint", restoreAfterPrint);
    document.getElementById("save-program").addEventListener("click", () => {
      try {
        localStorage.setItem("next-training-program", JSON.stringify({ settings: state, program: state.program, savedAt: new Date().toISOString() }));
        const button = document.getElementById("save-program");
        button.classList.add("saved");
        button.textContent = "Opgave gemt ✓";
      } catch (error) {
        window.alert("Browseren kunne ikke gemme programmet lokalt. Brug i stedet 'Kopiér program' eller 'Print / gem PDF'.");
      }
    });

    render(false);
  }

  window.NEXTPlanner = { state, exercisePools, exerciseImages, muscleGroups, exerciseGuides, escapeHtml, anatomySvg, dosageFor, render, renderProgram, renderAssignment, renderMusic, syncControls, syncAssignmentForm, markUnsaved, preparePrint, restoreAfterPrint, requestPrint };
  document.addEventListener("DOMContentLoaded", initialize);
}());

