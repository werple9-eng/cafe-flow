/* Cafe Flow — implementation of "Cafe Flow.dc.html" (Organic design system).
   Plain JS, no build step: full re-render into #app on each state change,
   with delegated events. Data, copy, and styling mirror the design source.
   Extensions over the original design: passcode lock screen (manager 1234,
   staff 5678), staff management, and a weekly Schedule tab that is the single
   place where tasks are added, edited and removed. */
(() => {
  "use strict";

  const CODES = { "1234": "manager", "5678": "staff" };

  /* weekday indices are Mon=0 … Sun=6; the demo "today" is Friday */
  const TODAY = 4;
  const DAYS = { en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], es: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] };
  const DAYS_FULL = {
    en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    es: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
  };
  const EVERY = [0, 1, 2, 3, 4, 5, 6];

  const T = {
    staff: ["Staff", "Equipo"],
    manager: ["Manager", "Gerente"],
    today: ["Friday 7 August · Morning shift", "Viernes 7 de agosto · Turno de mañana"],
    tasksDone: ["tasks done", "tareas hechas"],
    left: ["left before close · you're ahead of yesterday", "pendientes antes del cierre · vas mejor que ayer"],
    allDone: ["Every task is ticked off — enjoy the quiet.", "Todo listo — disfruta la calma."],
    footer: ["Tasks reset at 5:00 AM · Ask Marisol to add anything missing", "Las tareas se reinician a las 5:00 · Pide a Marisol lo que falte"],
    floorToday: ["Today on the floor", "Hoy en el salón"],
    onShift: ["tasks open · 4 staff on shift", "tareas abiertas · 4 personas en turno"],
    teamProgress: ["Team progress", "Progreso del equipo"],
    allTasks: ["Today's tasks", "Tareas de hoy"],
    tapForDetail: ["Tap a task to see its detail and photo proof", "Toca una tarea para ver el detalle y la foto"],
    staffToday: ["Staff today", "Equipo hoy"],
    edit: ["Edit", "Editar"],
    del: ["Delete", "Borrar"],
    taskName: ["Task name", "Nombre de la tarea"],
    taskPlaceholder: ["e.g. Restock oat milk", "p. ej. Reponer leche de avena"],
    section: ["Section", "Sección"],
    assignTo: ["Assign to", "Asignar a"],
    onDays: ["Runs on these days", "Se hace estos días"],
    everyDay: ["Every day", "Cada día"],
    dueBy: ["Due by (optional)", "Hora límite (opcional)"],
    duePlaceholder: ["e.g. 11:00 AM", "p. ej. 11:00"],
    requirePhoto: ["Require a photo", "Pedir una foto"],
    requirePhotoSub: ["Staff must snap a photo to tick this off", "El equipo debe tomar una foto para completarla"],
    cancel: ["Cancel", "Cancelar"],
    addTask: ["Add task", "Añadir tarea"],
    saveChanges: ["Save changes", "Guardar cambios"],
    editTask: ["Edit task", "Editar tarea"],
    description: ["Description (optional)", "Descripción (opcional)"],
    descPlaceholder: ["e.g. Brush out the burrs, wipe the hopper", "p. ej. Cepilla las muelas y limpia la tolva"],
    photoToComplete: ["This task needs a photo before it can be ticked off.", "Esta tarea necesita una foto antes de completarse."],
    takePhoto: ["Take photo", "Tomar foto"],
    markComplete: ["Attach & complete", "Adjuntar y completar"],
    cameraHint: ["Camera preview", "Vista de la cámara"],
    shotHint: ["Photo captured", "Foto capturada"],
    photoProof: ["Photo proof", "Foto de comprobación"],
    photoPending: ["Waiting on a photo from staff", "Esperando la foto del equipo"],
    photoPlaceholder: ["Photo placeholder", "Foto de ejemplo"],
    needsPhoto: ["Photo needed", "Falta foto"],
    photoAdded: ["Photo added", "Foto añadida"],
    remind: ["Send reminder", "Enviar recordatorio"],
    close: ["Close", "Cerrar"],
    done: ["Done", "Hecha"],
    open: ["Open", "Pendiente"],
    unassigned: ["Unassigned", "Sin asignar"],
    anyone: ["Anyone can grab this", "Cualquiera puede tomarla"],
    forWho: ["For", "Para"],
    doneBy: ["Done by", "Hecha por"],
    due: ["due", "para las"],
    completedToday: ["Tasks completed today", "Tareas completadas hoy"],
    photoChecks: ["Photo checks today", "Comprobaciones con foto"],
    reminded: ["Reminder sent to the floor", "Recordatorio enviado al equipo"],
    secOpening: ["Opening", "Apertura"],
    secClosing: ["Closing", "Cierre"],
    secService: ["During service", "Durante el servicio"],
    of: ["of", "de"],
    enterCode: ["Enter your passcode", "Introduce tu código"],
    codeHint: ["Manager 1234 · Staff 5678", "Gerente 1234 · Equipo 5678"],
    wrongCode: ["That code didn't match — try again", "El código no coincide — inténtalo de nuevo"],
    lock: ["Lock", "Bloquear"],
    addStaff: ["Add staff", "Añadir persona"],
    newStaff: ["New staff member", "Nuevo miembro del equipo"],
    editStaff: ["Edit staff member", "Editar miembro del equipo"],
    personName: ["Name", "Nombre"],
    personPlaceholder: ["e.g. Jordan Lee", "p. ej. Jordan Lee"],
    initialsLabel: ["Initials (optional)", "Iniciales (opcional)"],
    initialsPlaceholder: ["e.g. JL", "p. ej. JL"],
    undo: ["Undo", "Deshacer"],
    schedule: ["Schedule", "Horario"],
    scheduleSub: ["Pick a day to see and change what runs on it. Everything is added, edited and removed here.", "Elige un día para ver y cambiar sus tareas. Todo se añade, edita y quita aquí."],
    scheduleCard: ["Weekly schedule", "Horario semanal"],
    scheduleCardSub: ["Add, edit and remove tasks by day", "Añade, edita y quita tareas por día"],
    tasksScheduled: ["tasks scheduled", "tareas programadas"],
    noTasksDay: ["Nothing scheduled for this day yet", "Aún no hay nada programado para este día"],
    todayTag: ["Today", "Hoy"],
    pickADay: ["Pick at least one day", "Elige al menos un día"],
    removedTask: ["removed from the schedule", "quitada del horario"]
  };

  /* One task list drives everything: `days` says which weekdays it runs on,
     and the day's checklist is just the tasks whose days include today. */
  const TASKS = [
    { id: 1, sec: "opening", days: EVERY, en: "Unlock, disarm alarm, lights on", es: "Abrir, desactivar la alarma, luces", due: "6:00 AM", who: "Priya S.", done: true },
    { id: 2, sec: "opening", days: EVERY, en: "Fire up espresso machine, run a flush", es: "Encender la máquina de espresso y purgar", due: "6:05 AM", who: "Priya S.", done: true },
    { id: 3, sec: "opening", days: EVERY, en: "Load the pastry case", es: "Llenar la vitrina de bollería", due: "6:20 AM", who: "Ana R.", done: true, photo: true, shot: true, shotAt: "6:18 AM" },
    { id: 4, sec: "opening", days: EVERY, en: "Brew first batch of filter", es: "Preparar el primer lote de filtrado", due: "6:30 AM", done: false },
    { id: 5, sec: "opening", days: EVERY, en: "Fill water jugs, wipe down tables", es: "Llenar jarras de agua y limpiar mesas", due: "6:45 AM", done: false },
    { id: 6, sec: "opening", days: EVERY, en: "Flip the sign, unlock the front door", es: "Girar el cartel y abrir la puerta", due: "7:00 AM", done: false },
    { id: 7, sec: "closing", days: [1], en: "Deep clean grinder", es: "Limpieza a fondo del molinillo", due: "8:00 PM", photo: true, done: false, descEn: "Strip the hopper, brush out the burrs, wipe everything down with a dry cloth.", descEs: "Desmonta la tolva, cepilla las muelas y sécalo todo con un paño seco." },
    { id: 8, sec: "closing", days: EVERY, en: "Empty knock box, rinse portafilters", es: "Vaciar el cajón de posos y enjuagar portafiltros", done: false },
    { id: 9, sec: "closing", days: EVERY, en: "Cash out the till, drop the safe bag", es: "Cerrar caja y dejar la bolsa en la caja fuerte", due: "8:15 PM", photo: true, done: false, descEn: "Count the drawer twice, bag the surplus, drop it in the safe.", descEs: "Cuenta la caja dos veces, embolsa el excedente y déjalo en la caja fuerte." },
    { id: 10, sec: "closing", days: EVERY, en: "Sweep the floor, stack the chairs", es: "Barrer el suelo y apilar las sillas", due: "8:30 PM", done: false },
    { id: 11, sec: "closing", days: EVERY, en: "Bins out, break down the boxes", es: "Sacar la basura y desmontar las cajas", due: "8:40 PM", done: false },
    { id: 12, sec: "service", days: EVERY, en: "Restock oat milk", es: "Reponer leche de avena", due: "7:00 AM", done: true, who: "Theo B." },
    { id: 13, sec: "service", days: EVERY, en: "Wipe down tables + bus station", es: "Limpiar mesas y estación de servicio", done: true, who: "Ana R." },
    { id: 14, sec: "service", days: EVERY, en: "Photograph the specials board", es: "Fotografiar la pizarra de especiales", photo: true, done: false, descEn: "Snap it straight-on in good light for the socials.", descEs: "Foto de frente y con buena luz para redes." },
    { id: 15, sec: "service", days: [2], en: "Call in the pastry order for Thursday", es: "Encargar la bollería para el jueves", due: "2:00 PM", done: false },
    { id: 16, sec: "closing", days: [0, 3], en: "Descale the espresso machine", es: "Descalcificar la máquina", due: "4:00 PM", done: false },
    { id: 17, sec: "service", days: [4], en: "Rotate & date the syrup bottles", es: "Rotar y fechar los siropes", done: false }
  ];

  const state = {
    role: null,          // null (locked) | "manager" | "staff"
    lockInput: "",
    lockError: false,
    lang: "en",
    view: "staff",       // "staff" | "manager" | "schedule"
    schedDay: TODAY,
    justDone: null,
    dialog: null,        // task dialog: mode "new" | "editTask"
    staffDialog: null,   // staff dialog: mode "new" | "edit"
    detail: null,
    capture: null,
    toast: "",
    tasks: TASKS,
    staff: [
      { id: 1, name: "Priya Shah", initials: "PS", d: 7, tot: 7, tone: 2 },
      { id: 2, name: "Ana Ruiz", initials: "AR", d: 5, tot: 7, tone: 1 },
      { id: 3, name: "Theo Baptiste", initials: "TB", d: 4, tot: 9, tone: 1 },
      { id: 4, name: "Marcus Lin", initials: "ML", d: 2, tot: 6, tone: 2 }
    ]
  };

  const app = document.getElementById("app");
  let actions = [];
  const reg = fn => actions.push(fn) - 1;

  /* hidden file input — opens the phone camera (or a file picker on desktop)
     for photo-required tasks */
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.setAttribute("capture", "environment");
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);
  fileInput.addEventListener("change", () => {
    const f = fileInput.files && fileInput.files[0];
    if (!f || !state.capture) { fileInput.value = ""; return; }
    const rd = new FileReader();
    rd.onload = () => {
      if (state.capture) {
        state.capture = { ...state.capture, taken: true, photoData: rd.result };
        render();
      }
    };
    rd.readAsDataURL(f);
    fileInput.value = "";
  });

  /* one-shot entrance animations: keys added here render their animation once,
     then get cleared so later re-renders don't replay them */
  const anim = new Set();
  let toastTimer = null;

  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const tr = k => {
    const row = T[k];
    if (!row) return k;
    return row[state.lang === "es" ? 1 : 0];
  };
  const nm = o => {
    const es = state.lang === "es";
    return (es ? o.es || o.en || o.name : o.en || o.name || o.es) || "";
  };
  const dsc = x => {
    const es = state.lang === "es";
    return (es ? x.descEs || x.descEn : x.descEn || x.descEs) || "";
  };

  const shortName = p => {
    const parts = p.name.trim().split(/\s+/);
    return parts.length > 1 ? parts[0] + " " + parts[parts.length - 1][0] + "." : parts[0];
  };
  const initialsOf = name => name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const dayNames = () => DAYS[state.lang === "es" ? "es" : "en"];
  const dayNamesFull = () => DAYS_FULL[state.lang === "es" ? "es" : "en"];
  const daysLabel = ds => {
    if (!ds || !ds.length) return tr("pickADay");
    if (ds.length === 7) return tr("everyDay");
    const labels = dayNames();
    return ds.slice().sort((a, b) => a - b).map(i => labels[i]).join(", ");
  };
  const runsToday = x => (x.days || EVERY).indexOf(TODAY) > -1;
  const todaysTasks = () => state.tasks.filter(runsToday);

  const metaOf = x => {
    const bits = [];
    if (x.assignee) bits.push(tr("forWho") + " " + x.assignee);
    if (x.who && x.done) bits.push(tr("doneBy") + " " + x.who);
    return bits.join(" · ") || (x.done ? tr("done") : tr("anyone"));
  };

  const pill = active => active
    ? { bg: "var(--color-accent)", fg: "var(--color-bg)", bc: "var(--color-accent)" }
    : { bg: "transparent", fg: "var(--color-text)", bc: "var(--color-divider)" };

  const camSvg = (size, r) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"></path><circle cx="12" cy="13" r="${r}"></circle></svg>`;
  const lockSvg = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="3"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg>`;
  const backSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path><path d="m18 9-6 6"></path><path d="m12 9 6 6"></path></svg>`;

  function flash(msg) {
    state.toast = msg;
    anim.add("toast");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { state.toast = ""; render(); }, 2400);
    render();
  }

  function complete(id, withShot) {
    const photoData = withShot && state.capture ? state.capture.photoData : null;
    state.justDone = id;
    state.capture = null;
    state.tasks = state.tasks.map(t => (t.id === id ? { ...t, done: true, shot: withShot ? true : t.shot, shotAt: withShot ? "Just now" : t.shotAt, photoData: photoData || t.photoData } : t));
    render();
  }

  function tap(t) {
    if (!t.done && t.photo && !t.shot) {
      state.capture = { id: t.id, taken: false };
      anim.add("capture");
      render();
      return;
    }
    state.justDone = t.done ? null : t.id;
    state.tasks = state.tasks.map(x => (x.id === t.id ? { ...x, done: !x.done } : x));
    render();
  }

  /* update the dots/hint in place — a full re-render on every keypress
     rebuilds the numpad mid-tap, which reads as a flicker on phones */
  function updateLockUI() {
    const dotsBox = document.getElementById("cf-dots");
    const hintEl = document.getElementById("cf-lockhint");
    if (!dotsBox || !hintEl) { render(); return; }
    [...dotsBox.children].forEach((el, i) => {
      el.style.background = i < state.lockInput.length
        ? (state.lockError ? "var(--color-accent-700)" : "var(--color-accent)")
        : "color-mix(in srgb, var(--color-text) 15%, transparent)";
    });
    hintEl.textContent = state.lockError ? tr("wrongCode") : tr("codeHint");
    hintEl.style.color = state.lockError ? "var(--color-accent-700)" : "color-mix(in srgb, var(--color-text) 45%, transparent)";
    if (state.lockError) {
      dotsBox.style.animation = "none";
      void dotsBox.offsetHeight;
      dotsBox.style.animation = "cfShake .4s ease both";
    } else {
      dotsBox.style.animation = "none";
    }
  }

  function pressKey(digit) {
    if (state.lockError) return;
    if (digit === "back") {
      state.lockInput = state.lockInput.slice(0, -1);
      updateLockUI();
      return;
    }
    if (state.lockInput.length >= 4) return;
    state.lockInput += digit;
    updateLockUI();
    if (state.lockInput.length === 4) {
      setTimeout(() => {
        const role = CODES[state.lockInput];
        if (role) {
          state.role = role;
          state.view = role === "manager" ? "manager" : "staff";
          state.lockInput = "";
          state.lockError = false;
          if (role === "staff") anim.add("staff");
          render();
        } else {
          state.lockError = true;
          updateLockUI();
          setTimeout(() => { state.lockInput = ""; state.lockError = false; updateLockUI(); }, 700);
        }
      }, 180);
    }
  }

  function lockApp() {
    state.role = null;
    state.lockInput = "";
    state.lockError = false;
    state.dialog = null;
    state.staffDialog = null;
    state.detail = null;
    state.capture = null;
    render();
  }

  function save() {
    const d = state.dialog;
    if (!d) return;
    const name = (d.name || "").trim();
    if (!name) return;
    if (!d.days || !d.days.length) return;
    const desc = (d.desc || "").trim();
    const days = d.days.slice().sort((a, b) => a - b);
    if (d.mode === "editTask") {
      state.tasks = state.tasks.map(x => (x.id === d.id ? {
        ...x, en: name, es: name, descEn: desc, descEs: desc,
        sec: d.sec, days, due: d.due, photo: !!d.photo,
        assignee: d.assignee === tr("unassigned") ? "" : d.assignee
      } : x));
      state.dialog = null;
      flash("“" + name + "” · " + tr("saveChanges"));
    } else {
      state.tasks = [...state.tasks, {
        id: Date.now(), sec: d.sec, days, en: name, es: name,
        descEn: desc, descEs: desc, due: d.due,
        assignee: d.assignee === tr("unassigned") ? "" : d.assignee,
        done: false, photo: !!d.photo
      }];
      state.dialog = null;
      flash("“" + name + "” · " + tr("addTask"));
    }
  }

  function saveStaff() {
    const d = state.staffDialog;
    if (!d) return;
    const name = (d.name || "").trim();
    if (!name) return;
    const initials = (d.initials || "").trim().toUpperCase() || initialsOf(name);
    if (d.mode === "edit") {
      state.staff = state.staff.map(p => (p.id === d.id ? { ...p, name, initials } : p));
      state.staffDialog = null;
      flash("“" + name + "” · " + tr("saveChanges"));
    } else {
      state.staff = [...state.staff, { id: Date.now(), name, initials, d: 0, tot: 0, tone: (state.staff.length % 2) + 1 }];
      state.staffDialog = null;
      flash("“" + name + "” · " + tr("addStaff"));
    }
  }

  function openNewTask(day) {
    state.dialog = {
      mode: "new", name: "", desc: "", sec: "opening",
      assignee: tr("unassigned"), days: [day], due: "", photo: false
    };
    anim.add("dialog");
    render();
  }

  function openEditTask(t) {
    state.detail = null;
    state.dialog = {
      mode: "editTask", id: t.id, name: nm(t), desc: dsc(t), sec: t.sec,
      assignee: t.assignee || tr("unassigned"), days: (t.days || EVERY).slice(),
      due: t.due || "", photo: !!t.photo
    };
    anim.add("dialog");
    render();
  }

  const SEC_KEYS = [["opening", "secOpening"], ["service", "secService"], ["closing", "secClosing"]];

  function lockScreen() {
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];
    const dots = [0, 1, 2, 3].map(i => `<span style="width:13px;height:13px;border-radius:999px;transition:background .15s ease;background: ${i < state.lockInput.length ? (state.lockError ? "var(--color-accent-700)" : "var(--color-accent)") : "color-mix(in srgb, var(--color-text) 15%, transparent)"}"></span>`).join("");
    const es = state.lang === "es";
    return `
  <div style="min-height:100vh;display:grid;place-items:center;background:var(--color-bg);padding:24px 24px 40px">
    <div style="display:flex;flex-direction:column;align-items:center;gap:10px;animation:cfRise .35s ease both">
      <div style="width:56px;height:56px;border-radius:999px;background:var(--color-accent);display:grid;place-items:center;color:var(--color-bg);font-family:var(--font-heading);font-size:26px;line-height:1">c</div>
      <div style="font-family:var(--font-heading);font-size:30px;line-height:1.1;margin-top:2px">Cafe Flow</div>
      <div style="font-size:13.5px;color:color-mix(in srgb, var(--color-text) 60%, transparent)">${esc(tr("enterCode"))}</div>

      <div style="display:flex;gap:3px;padding:3px;border-radius:999px;background:var(--color-surface);margin-top:6px">
        <button data-a="${reg(() => { state.lang = "en"; render(); })}" style="border:0;cursor:pointer;font-size:11.5px;font-weight:700;letter-spacing:.06em;padding:6px 11px;border-radius:999px;background: ${es ? "transparent" : "var(--color-accent-2-600)"};color: ${es ? "var(--color-text)" : "var(--color-bg)"}">EN</button>
        <button data-a="${reg(() => { state.lang = "es"; render(); })}" style="border:0;cursor:pointer;font-size:11.5px;font-weight:700;letter-spacing:.06em;padding:6px 11px;border-radius:999px;background: ${es ? "var(--color-accent-2-600)" : "transparent"};color: ${es ? "var(--color-bg)" : "var(--color-text)"}">ES</button>
      </div>

      <div id="cf-dots" style="display:flex;gap:14px;margin:18px 0 4px">${dots}</div>
      <div id="cf-lockhint" style="font-size:12px;min-height:18px;color:color-mix(in srgb, var(--color-text) 45%, transparent)">${esc(tr("codeHint"))}</div>

      <div style="display:grid;grid-template-columns:repeat(3, 64px);gap:12px;margin-top:10px">
        ${keys.map(k => k === ""
          ? `<button class="cf-key" data-blank tabindex="-1"></button>`
          : `<button class="cf-key" data-a="${reg(() => pressKey(k))}" aria-label="${k === "back" ? "backspace" : k}">${k === "back" ? backSvg : k}</button>`).join("")}
      </div>
    </div>
  </div>`;
  }

  function header() {
    const s = state, es = s.lang === "es";
    const enBg = es ? "transparent" : "var(--color-accent-2-600)";
    const enFg = es ? "var(--color-text)" : "var(--color-bg)";
    const esBg = es ? "var(--color-accent-2-600)" : "transparent";
    const esFg = es ? "var(--color-bg)" : "var(--color-text)";
    const tabBtn = (view, label) => {
      const on = s.view === view;
      return `<button data-a="${reg(() => { state.view = view; if (view === "staff") anim.add("staff"); render(); })}" style="border:0;cursor:pointer;font-family:var(--font-heading);font-size:13.5px;padding:9px 15px;border-radius:999px;background: ${on ? "var(--color-accent)" : "transparent"};color: ${on ? "var(--color-bg)" : "var(--color-text)"}">${esc(label)}</button>`;
    };
    const tabs = s.role === "manager" ? `
      <div style="display:flex;gap:4px;padding:4px;border-radius:999px;background:var(--color-surface)">
        ${tabBtn("staff", tr("staff"))}${tabBtn("manager", tr("manager"))}${tabBtn("schedule", tr("schedule"))}
      </div>` : "";
    return `
  <div style="position:sticky;top:0;z-index:20;background:var(--color-bg);border-bottom:1px solid color-mix(in srgb, var(--color-text) 8%, transparent)">
    <div class="cf-head">
      <div style="display:flex;align-items:center;gap:10px;margin-right:auto">
        <div style="width:34px;height:34px;border-radius:999px;background:var(--color-accent);display:grid;place-items:center;color:var(--color-bg);font-family:var(--font-heading);font-size:16px;line-height:1">c</div>
        <div>
          <div style="font-family:var(--font-heading);font-size:19px;line-height:1.1">Cafe Flow</div>
          <div style="font-size:11.5px;color:color-mix(in srgb, var(--color-text) 55%, transparent)">${esc(tr("today"))}</div>
        </div>
      </div>

      <div style="display:flex;gap:3px;padding:3px;border-radius:999px;background:var(--color-surface)">
        <button data-a="${reg(() => { state.lang = "en"; render(); })}" style="border:0;cursor:pointer;font-size:12px;font-weight:700;letter-spacing:.06em;padding:8px 13px;border-radius:999px;background: ${enBg};color: ${enFg}">EN</button>
        <button data-a="${reg(() => { state.lang = "es"; render(); })}" style="border:0;cursor:pointer;font-size:12px;font-weight:700;letter-spacing:.06em;padding:8px 13px;border-radius:999px;background: ${esBg};color: ${esFg}">ES</button>
      </div>

      ${tabs}

      <button data-a="${reg(lockApp)}" title="${esc(tr("lock"))}" aria-label="${esc(tr("lock"))}" style="border:0;cursor:pointer;width:38px;height:38px;border-radius:999px;background:var(--color-surface);color:color-mix(in srgb, var(--color-text) 65%, transparent);display:grid;place-items:center">${lockSvg}</button>
    </div>
  </div>`;
  }

  function taskRow(x) {
    const photoLabel = x.shot ? tr("photoAdded") : tr("needsPhoto");
    const photoInk = x.shot ? "var(--color-accent-2-700)" : "var(--color-accent-700)";
    const bg = x.done ? "color-mix(in srgb, var(--color-accent-2-100) 70%, var(--color-bg))" : "var(--color-surface)";
    const shadow = x.done ? "none" : "var(--shadow-sm)";
    const ink = x.done ? "color-mix(in srgb, var(--color-text) 45%, transparent)" : "var(--color-text)";
    const deco = x.done ? "line-through" : "none";
    const checkBg = x.done ? "var(--color-accent-2-600)" : "transparent";
    const checkBorder = x.done ? "var(--color-accent-2-600)" : "color-mix(in srgb, var(--color-text) 28%, transparent)";
    const checkInk = x.done ? "#f5ead8" : "transparent";
    const checkOpacity = x.done ? "1" : "0";
    const checkAnim = state.justDone === x.id ? "cfPop .34s ease both" : "none";
    const dueBg = x.done ? "transparent" : "var(--color-accent-100)";
    const dueInk = x.done ? "color-mix(in srgb, var(--color-text) 40%, transparent)" : "var(--color-accent-800)";
    const d = dsc(x);
    return `
      <div ${x.done ? "" : `data-a="${reg(() => tap(x))}" role="button" tabindex="0"`} style="display:flex;align-items:center;gap:14px;min-height:68px;padding:12px 18px 12px 14px;border-radius:26px;cursor:${x.done ? "default" : "pointer"};user-select:none;background: ${bg};box-shadow: ${shadow};transition:background .25s ease, box-shadow .25s ease">
        <div style="width:32px;height:32px;flex:none;border-radius:999px;display:grid;place-items:center;border:2px solid ${checkBorder};background: ${checkBg};transition:all .2s ease">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="${checkInk}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" style="opacity: ${checkOpacity};animation: ${checkAnim}"><path d="M20 6 9 17l-5-5"></path></svg>
        </div>
        <div style="min-width:0;flex:1">
          <div style="font-size:16px;font-weight:600;line-height:1.3;text-decoration: ${deco};color: ${ink};transition:color .25s ease">${esc(nm(x))}</div>
          ${d && !x.done ? `<div style="font-size:12.5px;line-height:1.35;margin-top:2px;color:color-mix(in srgb, var(--color-text) 55%, transparent)">${esc(d)}</div>` : ""}
          <div class="cf-meta">
            ${x.photo ? `<span class="cf-nowrap" style="display:inline-flex;align-items:center;gap:4px;color: ${photoInk};font-weight:600">${camSvg(13, 3.2)} ${esc(photoLabel)}</span>` : ""}
            <span>${esc(metaOf(x))}</span>
          </div>
        </div>
        ${x.due ? `<span class="tag" style="flex:none;background: ${dueBg};color: ${dueInk}">${esc(x.due)}</span>` : ""}
        ${x.done ? `<button class="btn btn-ghost" data-a="${reg(() => tap(x))}" style="min-height:38px;font-size:12.5px;flex:none;padding-inline:10px">${esc(tr("undo"))}</button>` : ""}
      </div>`;
  }

  function staffView(done, total, pct) {
    const list = todaysTasks();
    const sections = SEC_KEYS.map(([id, key]) => {
      const rows = list.filter(x => x.sec === id);
      if (!rows.length) return "";
      return `
    <div style="margin-top:30px">
      <div style="display:flex;align-items:baseline;gap:10px;padding:0 6px 10px">
        <h4 style="margin:0;font-size:19px">${esc(tr(key))}</h4>
        <span style="font-size:12px;color:color-mix(in srgb, var(--color-text) 50%, transparent);margin-left:auto">${esc(rows.filter(x => x.done).length + " " + tr("of") + " " + rows.length)}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">${rows.map(taskRow).join("")}</div>
    </div>`;
    }).join("");

    const progressLine = done + "/" + total + " " + tr("tasksDone");
    const progressSub = done === total ? tr("allDone") : total - done + " " + tr("left");
    const ringGradient = "conic-gradient(var(--color-accent) " + pct + "%, color-mix(in srgb, var(--color-text) 12%, transparent) 0)";

    return `
  <div style="max-width:620px;margin:0 auto;padding:20px 20px 0">
    <div style="background:var(--color-surface);border-radius:32px;padding:22px;box-shadow:var(--shadow-sm)${anim.has("staff") ? ";animation:cfRise .35s ease both" : ""}">
      <div style="display:flex;align-items:center;gap:18px">
        <div class="cf-progress-ring" style="position:relative;width:76px;height:76px;flex:none">
          <div style="position:absolute;inset:0;border-radius:999px;background: ${ringGradient}"></div>
          <div style="position:absolute;inset:9px;border-radius:999px;background:var(--color-surface);display:grid;place-items:center;font-family:var(--font-heading);font-size:20px;line-height:1">${pct}%</div>
        </div>
        <div style="min-width:0">
          <div class="cf-progress-num" style="font-family:var(--font-heading);font-size:26px;line-height:1.1">${esc(progressLine)}</div>
          <div style="font-size:13.5px;color:color-mix(in srgb, var(--color-text) 60%, transparent);margin-top:4px">${esc(progressSub)}</div>
        </div>
      </div>
    </div>
    ${sections}
    <p style="text-align:center;font-size:12.5px;margin:34px 0 0;color:color-mix(in srgb, var(--color-text) 45%, transparent)">${esc(tr("footer"))}</p>
  </div>`;
  }

  function scheduleView() {
    const day = state.schedDay;
    const labels = dayNames();
    const pills = labels.map((label, i) => {
      const on = i === day;
      return `<button data-a="${reg(() => { state.schedDay = i; render(); })}" style="cursor:pointer;flex:1;min-width:0;padding:11px 2px 9px;border-radius:18px;border:1px solid ${on ? "var(--color-accent)" : "var(--color-divider)"};background: ${on ? "var(--color-accent)" : "transparent"};color: ${on ? "var(--color-bg)" : "var(--color-text)"};font-family:var(--font-heading);font-size:13px;display:flex;flex-direction:column;align-items:center;gap:3px">
        ${esc(label)}
        <span style="width:5px;height:5px;border-radius:999px;background: ${i === TODAY ? (on ? "var(--color-bg)" : "var(--color-accent)") : "transparent"}"></span>
      </button>`;
    }).join("");

    const list = state.tasks.filter(x => (x.days || EVERY).indexOf(day) > -1);
    const sections = SEC_KEYS.map(([id, key]) => {
      const rows = list.filter(x => x.sec === id);
      if (!rows.length) return "";
      return `
    <div style="margin-top:22px">
      <div style="display:flex;align-items:baseline;gap:10px;padding:0 6px 10px">
        <h4 style="margin:0;font-size:18px">${esc(tr(key))}</h4>
        <span style="font-size:12px;color:color-mix(in srgb, var(--color-text) 50%, transparent);margin-left:auto">${rows.length}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:9px">
        ${rows.map(x => `
        <div style="background:var(--color-surface);border-radius:24px;padding:15px 14px 15px 18px;box-shadow:var(--shadow-sm);display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <div style="min-width:0;flex:1 1 160px">
            <div style="font-size:15.5px;font-weight:600;line-height:1.3">${esc(nm(x))}</div>
            <div class="cf-meta" style="margin-top:3px">
              ${x.due ? `<span class="cf-nowrap">${esc(x.due)}</span><span>·</span>` : ""}
              <span class="cf-nowrap">${esc(daysLabel(x.days))}</span>
              ${x.photo ? `<span class="cf-nowrap" style="display:inline-flex;align-items:center;gap:4px;color:var(--color-accent-700);font-weight:600">${camSvg(13, 3.2)} ${esc(tr("needsPhoto"))}</span>` : ""}
            </div>
          </div>
          <div style="display:flex;gap:8px;flex:none">
            <button class="btn btn-secondary" data-a="${reg(() => openEditTask(x))}" style="min-height:44px">${esc(tr("edit"))}</button>
            <button class="btn btn-secondary" data-a="${reg(() => {
              state.tasks = state.tasks.filter(y => y.id !== x.id);
              flash("“" + nm(x) + "” — " + tr("removedTask"));
            })}" style="min-height:44px;color:var(--color-neutral-700)">${esc(tr("del"))}</button>
          </div>
        </div>`).join("")}
      </div>
    </div>`;
    }).join("");

    return `
  <div style="max-width:680px;margin:0 auto;padding:20px 20px 0">
    <h3 style="margin:0 0 6px">${esc(tr("schedule"))}</h3>
    <p style="font-size:13.5px;margin:0 0 16px;color:color-mix(in srgb, var(--color-text) 58%, transparent)">${esc(tr("scheduleSub"))}</p>

    <div style="display:flex;gap:5px;margin-bottom:18px">${pills}</div>

    <div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:14px">
      <h4 style="margin:0;font-size:20px">${esc(dayNamesFull()[day])}</h4>
      ${day === TODAY ? `<span class="tag" style="background:var(--color-accent-100);color:var(--color-accent-800)">${esc(tr("todayTag"))}</span>` : ""}
      <span style="font-size:13px;color:color-mix(in srgb, var(--color-text) 55%, transparent);margin-left:auto">${list.length} ${esc(tr("tasksScheduled"))}</span>
    </div>

    <button class="btn btn-primary" data-a="${reg(() => openNewTask(day))}" style="min-height:48px;width:100%;font-size:15px">+ ${esc(tr("addTask"))}</button>

    ${list.length ? sections : `<div style="border-radius:26px;padding:26px;text-align:center;margin-top:16px;background:var(--color-surface);font-size:14px;color:color-mix(in srgb, var(--color-text) 55%, transparent)">${esc(tr("noTasksDay"))}</div>`}
  </div>`;
  }

  function managerView(done, total, pct) {
    const list = todaysTasks();
    const progressLine = done + "/" + total + " " + tr("tasksDone");

    const stats = [
      { value: done + "/" + total, label: tr("completedToday"), bg: "var(--color-accent-100)" },
      { value: list.filter(x => x.photo && x.shot).length + "/" + list.filter(x => x.photo).length, label: tr("photoChecks"), bg: "var(--color-accent-2-100)" }
    ].map(s => `
            <div style="border-radius:22px;padding:14px 16px;background: ${s.bg}">
              <div style="font-family:var(--font-heading);font-size:26px;line-height:1">${esc(s.value)}</div>
              <div style="font-size:12.5px;color:color-mix(in srgb, var(--color-text) 60%, transparent)">${esc(s.label)}</div>
            </div>`).join("");

    const mgrTasks = list.map(x => {
      const meta = x.done ? tr("done") + (x.who ? " · " + x.who : "") : x.due ? tr("due") + " " + x.due : x.assignee ? tr("forWho") + " " + x.assignee : tr("unassigned");
      const dot = x.done ? "var(--color-accent-2-500)" : x.due ? "var(--color-accent-500)" : "var(--color-neutral-400)";
      const ink = x.done ? "color-mix(in srgb, var(--color-text) 50%, transparent)" : "var(--color-text)";
      const photoLabel = x.shot ? tr("photoAdded") : tr("needsPhoto");
      const photoBg = x.shot ? "var(--color-accent-2-100)" : "var(--color-accent-100)";
      const photoTagInk = x.shot ? "var(--color-accent-2-800)" : "var(--color-accent-800)";
      return `
            <div data-a="${reg(() => { state.detail = x.id; anim.add("detail"); render(); })}" role="button" tabindex="0" style="display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:22px;cursor:pointer;background:var(--color-bg)">
              <span style="width:8px;height:8px;border-radius:999px;flex:none;background: ${dot}"></span>
              <div style="min-width:0;flex:1">
                <div style="font-size:14.5px;font-weight:600;color: ${ink}">${esc(nm(x))}</div>
                <div style="font-size:12px;color:color-mix(in srgb, var(--color-text) 52%, transparent)">${esc(meta)}</div>
              </div>
              ${x.photo ? `<span class="tag cf-nowrap" style="flex:none;background: ${photoBg};color: ${photoTagInk}">${esc(photoLabel)}</span>` : ""}
            </div>`;
    }).join("");

    const staffRows = state.staff.map(p => {
      const bg = p.tone === 1 ? "var(--color-accent-200)" : "var(--color-accent-2-200)";
      const ink = p.tone === 1 ? "var(--color-accent-800)" : "var(--color-accent-2-800)";
      const bar = p.tone === 1 ? "var(--color-accent-500)" : "var(--color-accent-2-500)";
      const pctP = (p.tot ? Math.round((p.d / p.tot) * 100) : 0) + "%";
      return `
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:38px;height:38px;flex:none;border-radius:999px;display:grid;place-items:center;font-family:var(--font-heading);font-size:14px;background: ${bg};color: ${ink}">${esc(p.initials)}</div>
              <div style="min-width:0;flex:1">
                <div style="font-size:14.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.name)}</div>
                <div style="height:6px;margin-top:5px;border-radius:999px;background:color-mix(in srgb, var(--color-text) 10%, transparent);overflow:hidden">
                  <div style="height:100%;border-radius:999px;background: ${bar};width: ${pctP}"></div>
                </div>
              </div>
              <span style="font-size:13px;flex:none;font-variant-numeric:tabular-nums;color:color-mix(in srgb, var(--color-text) 60%, transparent)">${esc(p.d + "/" + p.tot)}</span>
              <button class="btn btn-ghost" data-a="${reg(() => {
                state.staffDialog = { mode: "edit", id: p.id, name: p.name, initials: p.initials };
                anim.add("staffDialog");
                render();
              })}" style="min-height:34px;font-size:13px;flex:none">${esc(tr("edit"))}</button>
              <button class="btn btn-ghost" data-a="${reg(() => {
                state.staff = state.staff.filter(x => x.id !== p.id);
                flash("“" + p.name + "” — " + tr("del").toLowerCase());
              })}" style="min-height:34px;font-size:13px;flex:none;color:var(--color-neutral-700)">${esc(tr("del"))}</button>
            </div>`;
    }).join("");

    return `
  <div style="max-width:1080px;margin:0 auto;padding:20px 20px 0">
    <div style="margin-bottom:18px">
      <h3 style="margin:0">${esc(tr("floorToday"))}</h3>
      <div style="font-size:13.5px;color:color-mix(in srgb, var(--color-text) 58%, transparent)">${esc(total - done + " " + tr("onShift"))}</div>
    </div>

    <div class="cf-grid">
      <div style="display:flex;flex-direction:column;gap:18px">
        <div style="background:var(--color-surface);border-radius:32px;padding:22px;box-shadow:var(--shadow-sm)">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
            <h4 style="margin:0;font-size:18px">${esc(tr("teamProgress"))}</h4>
            <span style="margin-left:auto;font-size:13px;color:color-mix(in srgb, var(--color-text) 55%, transparent)">${esc(progressLine)}</span>
          </div>
          <div style="height:12px;border-radius:999px;background:color-mix(in srgb, var(--color-text) 10%, transparent);overflow:hidden">
            <div style="height:100%;border-radius:999px;background:var(--color-accent);width: ${pct}%;transition:width .4s ease"></div>
          </div>
          <div class="cf-two" style="margin-top:18px">${stats}</div>
        </div>

        <div style="background:var(--color-surface);border-radius:32px;padding:22px;box-shadow:var(--shadow-sm)">
          <h4 style="margin:0;font-size:18px">${esc(tr("allTasks"))}</h4>
          <p style="font-size:12.5px;margin:4px 0 0;color:color-mix(in srgb, var(--color-text) 52%, transparent)">${esc(tr("tapForDetail"))}</p>
          <div style="display:flex;flex-direction:column;gap:8px;margin-top:14px">${mgrTasks}</div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:18px">
        <div data-a="${reg(() => { state.view = "schedule"; render(); })}" role="button" tabindex="0" style="display:flex;align-items:center;gap:14px;background:var(--color-surface);border-radius:32px;padding:20px 22px;box-shadow:var(--shadow-sm);cursor:pointer">
          <div style="width:44px;height:44px;flex:none;border-radius:999px;background:var(--color-accent-100);color:var(--color-accent-700);display:grid;place-items:center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="4"></rect><path d="M8 3v4M16 3v4M3 11h18"></path></svg>
          </div>
          <div style="min-width:0;flex:1">
            <div style="font-family:var(--font-heading);font-size:18px">${esc(tr("scheduleCard"))}</div>
            <div style="font-size:12.5px;color:color-mix(in srgb, var(--color-text) 55%, transparent)">${esc(tr("scheduleCardSub"))}</div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="flex:none;color:color-mix(in srgb, var(--color-text) 40%, transparent)"><path d="m9 18 6-6-6-6"></path></svg>
        </div>

        <div style="background:var(--color-surface);border-radius:32px;padding:22px;box-shadow:var(--shadow-sm)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
            <h4 style="margin:0;font-size:18px">${esc(tr("staffToday"))}</h4>
            <button class="btn btn-ghost" data-a="${reg(() => {
              state.staffDialog = { mode: "new", name: "", initials: "" };
              anim.add("staffDialog");
              render();
            })}" style="margin-left:auto;min-height:38px;font-size:13px">+ ${esc(tr("addStaff"))}</button>
          </div>
          <div style="display:flex;flex-direction:column;gap:12px">${staffRows}</div>
        </div>
      </div>
    </div>
  </div>`;
  }

  function detailDialog() {
    const dt = state.detail ? state.tasks.find(x => x.id === state.detail) : null;
    if (!dt) return "";
    const close = () => { state.detail = null; render(); };
    const statusBg = dt.done ? "var(--color-accent-2-100)" : "var(--color-accent-100)";
    const statusInk = dt.done ? "var(--color-accent-2-800)" : "var(--color-accent-800)";
    const meta = metaOf(dt) + (dt.due ? " · " + dt.due : "");
    const d = dsc(dt);
    let photoBlock = "";
    if (dt.photo) {
      const inner = dt.photoData ? `
          <div style="border-radius:22px;overflow:hidden;background:var(--color-bg)">
            <img src="${dt.photoData}" alt="" style="width:100%;aspect-ratio:4/3;object-fit:cover;display:block">
            <div style="padding:10px 14px;font-size:12.5px;color:color-mix(in srgb, var(--color-text) 60%, transparent)">${esc([dt.who, dt.shotAt].filter(Boolean).join(" · "))}</div>
          </div>` : dt.shot ? `
          <div style="border-radius:22px;overflow:hidden;background:var(--color-bg)">
            <div class="washed" style="aspect-ratio:4/3;background:radial-gradient(circle at 30% 30%, var(--color-accent-300), transparent 55%),radial-gradient(circle at 75% 65%, var(--color-accent-2-300), transparent 55%),var(--color-neutral-300);display:grid;place-items:center">
              <div style="display:flex;flex-direction:column;align-items:center;gap:6px;color:var(--color-neutral-700)">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="9" cy="9" r="1.6"></circle><path d="m21 15-4.5-4.5L7 20"></path></svg>
                <span style="font-size:11.5px">${esc(tr("photoPlaceholder"))}</span>
              </div>
            </div>
            <div style="padding:10px 14px;font-size:12.5px;color:color-mix(in srgb, var(--color-text) 60%, transparent)">${esc((dt.who || "Ana R.") + " · " + (dt.shotAt || ""))}</div>
          </div>` : `
          <div style="border-radius:22px;padding:18px;text-align:center;background:var(--color-bg);border:1.5px dashed color-mix(in srgb, var(--color-text) 22%, transparent);font-size:13px;color:color-mix(in srgb, var(--color-text) 60%, transparent)">${esc(tr("photoPending"))}</div>`;
      photoBlock = `
        <div>
          <div style="font-size:12px;margin-bottom:6px;color:color-mix(in srgb, var(--color-text) 70%, transparent)">${esc(tr("photoProof"))}</div>
          ${inner}
        </div>`;
    }
    return `
    <div class="dialog-backdrop" data-a="${reg(close)}" style="z-index:60">
      <div class="dialog" data-stop style="${anim.has("detail") ? "animation:cfRise .22s ease both;" : ""}max-height:92vh;overflow:auto">
        <div class="dialog-title">${esc(nm(dt))}</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          <span class="tag" style="background: ${statusBg};color: ${statusInk}">${esc(dt.done ? tr("done") : tr("open"))}</span>
          <span class="tag tag-neutral">${esc(meta)}</span>
          <span class="tag tag-neutral">${esc(daysLabel(dt.days))}</span>
        </div>
        ${d ? `<div class="dialog-body" style="margin:0">${esc(d)}</div>` : ""}
        ${photoBlock}
        <div class="dialog-actions">
          ${!dt.done ? `<button class="btn btn-secondary" data-a="${reg(() => { state.detail = null; flash(tr("reminded")); })}" style="min-height:44px">${esc(tr("remind"))}</button>` : ""}
          <button class="btn btn-primary" data-a="${reg(close)}" style="min-height:44px">${esc(tr("close"))}</button>
        </div>
      </div>
    </div>`;
  }

  function captureDialog() {
    const cap = state.capture ? state.tasks.find(x => x.id === state.capture.id) : null;
    if (!cap) return "";
    const taken = state.capture.taken;
    const photoData = state.capture.photoData;
    const close = () => { state.capture = null; render(); };
    const shotBg = taken
      ? "radial-gradient(circle at 30% 30%, var(--color-accent-300), transparent 55%),radial-gradient(circle at 75% 65%, var(--color-accent-2-300), transparent 55%),var(--color-neutral-300)"
      : "var(--color-neutral-200)";
    const action = taken
      ? () => complete(cap.id, true)
      : () => fileInput.click();
    const media = taken && photoData
      ? `<img src="${photoData}" alt="" style="width:100%;aspect-ratio:4/3;object-fit:cover;display:block">`
      : `<div class="washed" style="aspect-ratio:4/3;background: ${shotBg};display:grid;place-items:center">
            <div style="display:flex;flex-direction:column;align-items:center;gap:8px;color:var(--color-neutral-700)">
              ${camSvg(34, 3.4)}
              <span style="font-size:12px">${esc(taken ? tr("shotHint") : tr("cameraHint"))}</span>
            </div>
          </div>`;
    return `
    <div class="dialog-backdrop" data-a="${reg(close)}" style="z-index:60">
      <div class="dialog" data-stop style="${anim.has("capture") ? "animation:cfRise .22s ease both" : ""}">
        <div class="dialog-title">${esc(nm(cap))}</div>
        <div class="dialog-body">${esc(tr("photoToComplete"))}</div>
        <div style="border-radius:22px;overflow:hidden;background:var(--color-bg)">
          ${media}
        </div>
        <div class="dialog-actions">
          <button class="btn btn-secondary" data-a="${reg(close)}" style="min-height:44px">${esc(tr("cancel"))}</button>
          <button class="btn btn-primary" data-a="${reg(action)}" style="min-height:44px">${esc(taken ? tr("markComplete") : tr("takePhoto"))}</button>
        </div>
      </div>
    </div>`;
  }

  function formDialog() {
    const d = state.dialog;
    if (!d) return "";
    const close = () => { state.dialog = null; render(); };
    const optBtn = (label, active, pick, extra) => {
      const p = pill(active);
      return `<button data-a="${reg(pick)}" style="cursor:pointer;${extra}border-radius:999px;border:1px solid ${p.bc};background: ${p.bg};color: ${p.fg}">${esc(label)}</button>`;
    };

    const sectionOpts = SEC_KEYS.map(([id, key]) =>
      optBtn(tr(key), d.sec === id, () => { state.dialog = { ...state.dialog, sec: id }; render(); }, "font-size:13px;padding:9px 15px;")).join("");

    const people = [tr("unassigned"), ...state.staff.map(shortName)];
    const assigneeOpts = people.map(label =>
      optBtn(label, d.assignee === label, () => { state.dialog = { ...state.dialog, assignee: label }; render(); }, "font-size:13px;padding:9px 15px;")).join("");

    const allOn = d.days.length === 7;
    const everyBtn = optBtn(tr("everyDay"), allOn, () => {
      state.dialog = { ...state.dialog, days: allOn ? [] : EVERY.slice() };
      render();
    }, "font-size:13px;padding:9px 15px;");
    const dayOpts = dayNames().map((label, i) => {
      const on = d.days.indexOf(i) > -1;
      return optBtn(label, on, () => {
        state.dialog = { ...state.dialog, days: on ? d.days.filter(y => y !== i) : [...d.days, i] };
        render();
      }, "width:42px;height:42px;font-size:12.5px;");
    }).join("");

    const photoReqBg = d.photo ? "var(--color-accent-2-100)" : "var(--color-bg)";
    const photoReqBorder = d.photo ? "var(--color-accent-2-300)" : "var(--color-divider)";
    const photoReqInk = d.photo ? "var(--color-accent-2-700)" : "color-mix(in srgb, var(--color-text) 45%, transparent)";
    const switchBg = d.photo ? "var(--color-accent-2-600)" : "color-mix(in srgb, var(--color-text) 22%, transparent)";
    const switchKnob = d.photo ? "translateX(18px)" : "translateX(0)";
    const canSave = !!(d.name || "").trim() && d.days.length > 0;

    return `
    <div class="dialog-backdrop" data-a="${reg(close)}" style="z-index:60">
      <div class="dialog" data-stop style="${anim.has("dialog") ? "animation:cfRise .22s ease both;" : ""}max-height:92vh;overflow:auto">
        <div class="dialog-title">${esc(d.mode === "editTask" ? tr("editTask") : tr("addTask"))}</div>

        <div class="field">
          <label>${esc(tr("taskName"))}</label>
          <input class="input" data-input="name" value="${esc(d.name || "")}" placeholder="${esc(tr("taskPlaceholder"))}" style="min-height:44px">
        </div>

        <div class="field">
          <label>${esc(tr("description"))}</label>
          <textarea class="input" data-input="desc" placeholder="${esc(tr("descPlaceholder"))}" style="min-height:64px;border-radius:22px">${esc(d.desc || "")}</textarea>
        </div>

        <div class="field">
          <label>${esc(tr("onDays"))}</label>
          <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">
            ${everyBtn}
            <span style="width:1px;height:26px;background:var(--color-divider);margin:0 2px"></span>
            ${dayOpts}
          </div>
          ${d.days.length ? "" : `<div style="font-size:12px;margin-top:6px;color:var(--color-accent-700)">${esc(tr("pickADay"))}</div>`}
        </div>

        <div class="field">
          <label>${esc(tr("section"))}</label>
          <div style="display:flex;flex-wrap:wrap;gap:7px">${sectionOpts}</div>
        </div>

        <div class="field">
          <label>${esc(tr("assignTo"))}</label>
          <div style="display:flex;flex-wrap:wrap;gap:7px">${assigneeOpts}</div>
        </div>

        <div class="field">
          <label>${esc(tr("dueBy"))}</label>
          <input class="input" data-input="due" value="${esc(d.due || "")}" placeholder="${esc(tr("duePlaceholder"))}" style="min-height:44px">
        </div>

        <div data-a="${reg(() => { state.dialog = { ...state.dialog, photo: !state.dialog.photo }; render(); })}" role="button" tabindex="0" style="display:flex;align-items:center;gap:12px;padding:13px 16px;border-radius:22px;cursor:pointer;background: ${photoReqBg};border:1px solid ${photoReqBorder}">
          <div style="color: ${photoReqInk};display:flex">${camSvg(20, 3.2)}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:14px;font-weight:600">${esc(tr("requirePhoto"))}</div>
            <div style="font-size:12px;color:color-mix(in srgb, var(--color-text) 55%, transparent)">${esc(tr("requirePhotoSub"))}</div>
          </div>
          <div style="width:44px;height:26px;border-radius:999px;flex:none;padding:3px;background: ${switchBg};transition:background .2s ease">
            <div style="width:20px;height:20px;border-radius:999px;background:var(--color-bg);transition:transform .2s ease;transform: ${switchKnob}"></div>
          </div>
        </div>

        <div class="dialog-actions">
          <button class="btn btn-secondary" data-a="${reg(close)}" style="min-height:44px">${esc(tr("cancel"))}</button>
          <button class="btn btn-primary" data-a="${reg(save)}" style="min-height:44px${canSave ? "" : ";opacity:.45"}">${esc(d.mode === "editTask" ? tr("saveChanges") : tr("addTask"))}</button>
        </div>
      </div>
    </div>`;
  }

  function staffFormDialog() {
    const d = state.staffDialog;
    if (!d) return "";
    const close = () => { state.staffDialog = null; render(); };
    return `
    <div class="dialog-backdrop" data-a="${reg(close)}" style="z-index:60">
      <div class="dialog" data-stop style="${anim.has("staffDialog") ? "animation:cfRise .22s ease both;" : ""}max-height:92vh;overflow:auto">
        <div class="dialog-title">${esc(d.mode === "edit" ? tr("editStaff") : tr("newStaff"))}</div>

        <div class="field">
          <label>${esc(tr("personName"))}</label>
          <input class="input" data-input="sname" value="${esc(d.name || "")}" placeholder="${esc(tr("personPlaceholder"))}" style="min-height:44px">
        </div>

        <div class="field">
          <label>${esc(tr("initialsLabel"))}</label>
          <input class="input" data-input="sinitials" value="${esc(d.initials || "")}" placeholder="${esc(tr("initialsPlaceholder"))}" maxlength="2" style="min-height:44px;max-width:120px">
        </div>

        <div class="dialog-actions">
          <button class="btn btn-secondary" data-a="${reg(close)}" style="min-height:44px">${esc(tr("cancel"))}</button>
          <button class="btn btn-primary" data-a="${reg(saveStaff)}" style="min-height:44px">${esc(d.mode === "edit" ? tr("saveChanges") : tr("addStaff"))}</button>
        </div>
      </div>
    </div>`;
  }

  function render() {
    actions = [];

    const toast = state.toast
      ? `<div style="position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:70;padding:12px 20px;border-radius:999px;background:var(--color-neutral-900);color:var(--color-neutral-100);font-size:13.5px;box-shadow:var(--shadow-lg)${anim.has("toast") ? ";animation:cfRise .25s ease both" : ""};max-width:calc(100vw - 48px)">${esc(state.toast)}</div>`
      : "";

    if (!state.role) {
      app.innerHTML = lockScreen() + toast;
    } else {
      const list = todaysTasks();
      const done = list.filter(x => x.done).length;
      const total = list.length;
      const pct = total ? Math.round((done / total) * 100) : 0;

      app.innerHTML = `
<div style="min-height:100vh;background:var(--color-bg);padding:0 0 96px">
  ${header()}
  ${state.view === "staff" ? staffView(done, total, pct) : ""}
  ${state.view === "manager" ? managerView(done, total, pct) : ""}
  ${state.view === "schedule" ? scheduleView() : ""}
  ${detailDialog()}
  ${captureDialog()}
  ${formDialog()}
  ${staffFormDialog()}
  ${toast}
</div>`;
    }

    if (anim.size || state.justDone != null) {
      setTimeout(() => { anim.clear(); state.justDone = null; }, 500);
    }
  }

  /* delegated events — walking up from the target, the first data-a wins;
     hitting a data-stop first emulates the dialog's stopPropagation */
  function dispatch(e) {
    let el = e.target;
    while (el && el !== app) {
      if (el.nodeType === 1) {
        if (el.hasAttribute("data-a")) {
          const fn = actions[+el.getAttribute("data-a")];
          if (fn) fn(e);
          return;
        }
        if (el.hasAttribute("data-stop")) return;
      }
      el = el.parentElement;
    }
  }

  app.addEventListener("click", dispatch);

  app.addEventListener("keydown", e => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const el = e.target;
    if (el.nodeType === 1 && el.hasAttribute("data-a") && el.getAttribute("role") === "button") {
      e.preventDefault();
      const fn = actions[+el.getAttribute("data-a")];
      if (fn) fn(e);
    }
  });

  /* physical keyboard works on the lock screen too */
  document.addEventListener("keydown", e => {
    if (state.role) return;
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("back");
  });

  /* text fields update dialog state silently — nothing else on screen depends
     on them while typing, and skipping the re-render preserves focus/caret */
  app.addEventListener("input", e => {
    const k = e.target.nodeType === 1 && e.target.getAttribute("data-input");
    if (!k) return;
    if ((k === "sname" || k === "sinitials") && state.staffDialog) {
      state.staffDialog[k === "sname" ? "name" : "initials"] = e.target.value;
    } else if (state.dialog) {
      state.dialog[k] = e.target.value;
    }
  });

  render();
})();
