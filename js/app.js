/* app.js */
import { LocalDB } from "./storage/local.js";
import { exportPDF } from "./../js/export-pdf.js";
import { PROGRAMS } from "./data/programs.js";
import { COURSES } from "./data/courses.js";
import { INSTRUCTORS } from "./data/instructors.js";
import { CANVAS_OPTIONS } from "./data/canvas_options.js";
import { POLICY_PRESETS } from "./data/policy_presets.js";
import { CAMPUS_REQUIREMENTS } from "./data/campus_requirements.js";
import { COURSE_CONTENT } from "./data/course_content.js"; // <-- make sure this file exists

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => Date.now();

const els = {
  // selectors
  program: document.getElementById("program"),
  course: document.getElementById("course"),

  // (we're not using year/title anymore but they may still exist in HTML)
  year: document.getElementById("year"),
  title: document.getElementById("title"),

  // instructor & canvas
  instructorSelect: document.getElementById("instructorSelect"),
  canvasSelect: document.getElementById("canvasSelect"),

  // policies
  policyPicker: document.getElementById("policyPicker"),
  policies: document.getElementById("policies"),

  // campus req
  campusReqSelect: document.getElementById("campusReqSelect"),

  // buttons
  newBtn: document.getElementById("newBtn"),
  saveBtn: document.getElementById("saveBtn"),
  exportBtn: document.getElementById("exportBtn"),
  exportBtnTop: document.getElementById("exportBtnTop"),

  //toggles
    toggleTextbooks: document.getElementById("toggleTextbooks"),
    toggleAssignments: document.getElementById("toggleAssignments"),
    toggleHours: document.getElementById("toggleHours"),

  // preview
  pvTitle: document.getElementById("pvTitle"),
  pvSubhead: document.getElementById("pvSubhead"),
  pvDesc: document.getElementById("pvDesc"),
  pvOutline: document.getElementById("pvOutline"),
  pvTextbooks: document.getElementById("pvTextbooks"),
  pvAssign: document.getElementById("pvAssign"),
  pvHours: document.getElementById("pvHours"),
  pvInstr: document.getElementById("pvInstr"),
  pvCanvas: document.getElementById("pvCanvas"),
  pvPolicies: document.getElementById("pvPolicies"),
  pvCampus: document.getElementById("pvCampus"),
};

let doc = startNew();
initOptions();
render();

/* ---------- Event wiring ---------- */
els.newBtn.addEventListener("click", () => {
  doc = startNew();
  render();
});

els.saveBtn.addEventListener("click", async () => {
  await LocalDB.upsert(doc);
  alert("Saved.");
});

// Export: filename should be just the course CODE (e.g., "ENG 1010.pdf")
[els.exportBtn, els.exportBtnTop].forEach((b) =>
  b.addEventListener("click", () => exportPDF(doc.course))
);

// Changes → update & render
["program", "course", "instructorSelect", "canvasSelect", "campusReqSelect"].forEach((id) => {
  const el = els[id];
  if (el) el.addEventListener("change", () => { updateFromInputs(); render(); });
});

// Policies add
document.getElementById("addPolicyBtn").addEventListener("click", () => {
  const id = els.policyPicker.value;
  if (!id) return;
  const preset = POLICY_PRESETS.find((p) => p.id === id);
  if (!preset) return;
  if (!doc.policies.some((p) => p.id === preset.id)) {
    doc.policies.push(structuredClone(preset));
  }
  renderPoliciesEditor();
  renderPoliciesPreview();
});


/* ---------- Functions ---------- */

// Single, definitive startNew (no duplicates!)
function startNew() {
  const firstProgram = PROGRAMS[0] || "";
  const firstCourse = (COURSES[firstProgram] || [])[0] || "";
  const cc = COURSE_CONTENT[firstCourse] || {};

  return {
    id: uid(),
    program: firstProgram,
    course: firstCourse,

    // Derived content from course map
    description: cc.description || "",
    outline: cc.outline || "",
    textbooks: cc.textbooks || "",
    assignments: cc.assignments || "",
    hours: cc.hours || "",
    campusRequirements: cc.campusRequirements || "",

    // Selections
    instructors: [], // multiple
    canvas: { url: "", notes: "" },
    policies: [],

    // NEW: defaults for section toggles
    includeTextbooks: true,
    includeAssignments: true,
    includeHours: true,

    updatedAt: now(),
  };
}


function initOptions() {
  // Make instructor multi-select
  if (els.instructorSelect) els.instructorSelect.multiple = true;

  fillSelect(els.program, PROGRAMS.map((v) => ({ value: v, label: v })));
  fillCourseOptions();

  // Instructors, canvas, policies, campus req
  fillSelect(els.instructorSelect, INSTRUCTORS.map((o) => ({ value: o.id, label: o.label })), true);
  fillSelect(els.canvasSelect, CANVAS_OPTIONS.map((o) => ({ value: o.id, label: o.label })), true);
  fillSelect(els.policyPicker, POLICY_PRESETS.map((o) => ({ value: o.id, label: o.title })), true);
  fillSelect(els.campusReqSelect, CAMPUS_REQUIREMENTS.map((o) => ({ value: o.id, label: o.label })), true);

  // Default picks
  if (els.canvasSelect && els.canvasSelect.options.length) {
    els.canvasSelect.value = els.canvasSelect.options[0].value;
  }
  if (els.campusReqSelect && els.campusReqSelect.options.length) {
    els.campusReqSelect.value = els.campusReqSelect.options[0].value;
  }

  // Program change should reset course then re-derive content
  els.program.addEventListener("change", () => {
    fillCourseOptions();
    els.course.value = els.course.options[0]?.value || "";
    updateFromInputs();
    render();
  });
  [els.toggleTextbooks, els.toggleAssignments, els.toggleHours].forEach(cb => {
  if (!cb) return;
  cb.addEventListener("change", () => {
    doc.includeTextbooks = !!els.toggleTextbooks?.checked;
    doc.includeAssignments = !!els.toggleAssignments?.checked;
    doc.includeHours = !!els.toggleHours?.checked;
    render();
  });
});

}

function fillSelect(select, options, includeEmpty = false) {
  if (!select) return;
  select.innerHTML =
    (includeEmpty ? `<option value="">Select…</option>` : "") +
    options.map((o) => `<option value="${o.value}">${o.label}</option>`).join("");
  if (!includeEmpty && options[0]) select.value = options[0].value;
}

function fillCourseOptions() {
  const list = COURSES[els.program.value] || [];
  fillSelect(els.course, list.map((v) => ({ value: v, label: v })));
}

function updateFromInputs() {
  doc.program = els.program.value;
  doc.course = els.course.value;

  // Populate content from course map
  const cc = COURSE_CONTENT[doc.course] || {};
  doc.description = cc.description || "";
  doc.outline = cc.outline || "";
  doc.textbooks = cc.textbooks || "";
  doc.assignments = cc.assignments || "";
  doc.hours = cc.hours || "";
  doc.campusRequirements = cc.campusRequirements || "";

  // Multiple instructors
  const selectedIds = Array.from(els.instructorSelect?.selectedOptions || []).map((o) => o.value);
  doc.instructors = INSTRUCTORS.filter((i) => selectedIds.includes(i.id));

  // Canvas (single)
  const cv = CANVAS_OPTIONS.find((c) => c.id === els.canvasSelect?.value);
  doc.canvas = cv ? { url: cv.url, notes: cv.notes || "" } : { url: "", notes: "" };

  // Campus Requirements override if user explicitly picked a preset from the dropdown
  const cr = CAMPUS_REQUIREMENTS.find((c) => c.id === els.campusReqSelect?.value);
  if (cr && cr.body) {
    // Respect your “HTML allowed for campus req”
    doc.campusRequirements = cr.body;
  }

  doc.updatedAt = now();
}

function render() {
// Pill title: CODE - Name (# Credits)
const code = doc.course || "COURSE";
const cc = COURSE_CONTENT[doc.course] || {};
const name = cc.name || "";
const creditsText = (cc.credits != null && cc.credits !== "")
  ? `(${cc.credits} Credits)`  // e.g., (3 Credits)
  : "";

const pill = [code, name && `- ${name}`, creditsText]  // hyphen w/ spaces
  .filter(Boolean)
  .join(" ");

els.pvTitle.textContent = pill;


  // Subhead (Program only; Year removed)
  els.pvSubhead.textContent = `${doc.program || "Program"}`;

  // Body sections (plain text, escaped)
setBodyOrPlaceholder(els.pvDesc, doc.description, "Auto-filled from course…");
setBodyOrPlaceholder(els.pvOutline, doc.outline, "Auto-filled from course…");

  setBodyOrPlaceholder(els.pvTextbooks, doc.textbooks, "Select a set…");
  setBodyOrPlaceholder(els.pvAssign, doc.assignments, "Select a set…");
  setBodyOrPlaceholder(els.pvHours, doc.hours, "Select from list…");

  // Instructors list
  els.pvInstr.innerHTML = (doc.instructors.length ? doc.instructors : [])
    .map((inst) => `
      <div><strong>${escapeHtml(inst.name)}</strong></div>
      <div>${escapeHtml(inst.email)}</div>
      <div>${escapeHtml(inst.office)}</div>
      ${inst.phone ? `<div>${escapeHtml(inst.phone)}</div>` : ""}
      <div style="height:8px"></div>
    `).join("");

  // Canvas preview (plain escaped text)
  els.pvCanvas.innerHTML = [doc.canvas.url, doc.canvas.notes]
    .filter(Boolean)
    .map((x) => `<div>${escapeHtml(x)}</div>`)
    .join("");

  // Policies UI/preview
  renderPoliciesEditor();
  renderPoliciesPreview();

  // Campus Requirements — allow HTML (links, formatting)
  els.pvCampus.classList.toggle("placeholder", !doc.campusRequirements);
  els.pvCampus.innerHTML = doc.campusRequirements || "Select from list…";

  if (els.toggleTextbooks) els.toggleTextbooks.checked = !!doc.includeTextbooks;
if (els.toggleAssignments) els.toggleAssignments.checked = !!doc.includeAssignments;
if (els.toggleHours) els.toggleHours.checked = !!doc.includeHours;

const secTextbooks = els.pvTextbooks?.closest(".section");
const secAssign     = els.pvAssign?.closest(".section");
const secHours      = els.pvHours?.closest(".section");

if (secTextbooks) secTextbooks.style.display = doc.includeTextbooks ? "" : "none";
if (secAssign)    secAssign.style.display    = doc.includeAssignments ? "" : "none";
if (secHours)     secHours.style.display     = doc.includeHours ? "" : "none";

}

/* ----- Policies: editable list with reorder ----- */
function renderPoliciesEditor() {
  els.policies.innerHTML = "";
  doc.policies.forEach((p, idx) => {
    const li = document.createElement("li");
    li.draggable = true; li.className = "drag";
    li.innerHTML = `
      <div class="title">${escapeHtml(p.title)}</div>
      <div class="muted">${escapeHtml(p.body.slice(0,80))}${p.body.length>80?"…":""}</div>
      <div style="margin-left:auto;display:flex;gap:6px;">
        <button class="iconBtn up" title="Move up">▲</button>
        <button class="iconBtn down" title="Move down">▼</button>
        <button class="iconBtn del" title="Remove">✕</button>
      </div>`;

    li.querySelector(".del").addEventListener("click", () => {
      doc.policies.splice(idx, 1);
      renderPoliciesEditor();
      renderPoliciesPreview();
    });
    li.querySelector(".up").addEventListener("click", () => {
      if (idx > 0) {
        const t = doc.policies[idx - 1];
        doc.policies[idx - 1] = doc.policies[idx];
        doc.policies[idx] = t;
        renderPoliciesEditor();
        renderPoliciesPreview();
      }
    });
    li.querySelector(".down").addEventListener("click", () => {
      if (idx < doc.policies.length - 1) {
        const t = doc.policies[idx + 1];
        doc.policies[idx + 1] = doc.policies[idx];
        doc.policies[idx] = t;
        renderPoliciesEditor();
        renderPoliciesPreview();
      }
    });
    li.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/plain", idx); });
    li.addEventListener("dragover", (e) => { e.preventDefault(); });
    li.addEventListener("drop", (e) => {
      e.preventDefault();
      const from = +e.dataTransfer.getData("text/plain");
      const to = idx;
      if (from === to) return;
      const item = doc.policies.splice(from, 1)[0];
      doc.policies.splice(to, 0, item);
      renderPoliciesEditor();
      renderPoliciesPreview();
    });

    els.policies.appendChild(li);
  });
}

function renderPoliciesPreview() {
  els.pvPolicies.innerHTML = doc.policies.length
    ? ""
    : '<div class="placeholder">Add policy sections from the list…</div>';
  doc.policies.forEach((p) => {
    const div = document.createElement("div");
    div.innerHTML = `<div class="b">${escapeHtml(p.title || "Policy")}</div><div>${newlineToBr(escapeHtml(p.body || ""))}</div>`;
    els.pvPolicies.appendChild(div);
  });
}

/* ----- Helpers ----- */
function setBodyOrPlaceholder(el, text, ph) {
  el.classList.toggle("placeholder", !text);
  el.innerHTML = text ? newlineToBr(escapeHtml(text)) : ph;
}
function escapeHtml(str = "") {
  return str.replace(/[&<>\"']/g, (s) => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[s]));
}
function newlineToBr(str = "") {
  return str.replace(/\n/g, "<br>");
}

