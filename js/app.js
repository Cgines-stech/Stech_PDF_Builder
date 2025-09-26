import { LocalDB } from "./storage/local.js";
import { exportPDF } from "./../js/export-pdf.js";
import { PROGRAMS } from "./data/programs.js";
import { COURSES } from "./data/courses.js";
import { INSTRUCTORS } from "./data/instructors.js";
import { CANVAS_OPTIONS } from "./data/canvas_options.js";
import { POLICY_PRESETS } from "./data/policy_presets.js";
import { CAMPUS_REQUIREMENTS } from "./data/campus_requirements.js";

const uid = ()=> Math.random().toString(36).slice(2,10);
const now = ()=> Date.now();

const els = {
year: document.getElementById("year"),
program: document.getElementById("program"),
course: document.getElementById("course"),
title: document.getElementById("title"),
// selects replacing text areas/inputs
descriptionSelect: document.getElementById("descriptionSelect"),
outlineSelect: document.getElementById("outlineSelect"),
textbooksSelect: document.getElementById("textbooksSelect"),
assignmentsSelect: document.getElementById("assignmentsSelect"),
hoursSelect: document.getElementById("hoursSelect"),
instructorSelect: document.getElementById("instructorSelect"),
canvasSelect: document.getElementById("canvasSelect"),
policyPicker: document.getElementById("policyPicker"),
policies: document.getElementById("policies"),
campusReqSelect: document.getElementById("campusReqSelect"),
// readonly fields populated by instructor
instrName: document.getElementById("instrName"),
instrEmail: document.getElementById("instrEmail"),
instrOffice: document.getElementById("instrOffice"),
instrPhone: document.getElementById("instrPhone"),
// buttons
newBtn: document.getElementById("newBtn"),
saveBtn: document.getElementById("saveBtn"),
exportBtn: document.getElementById("exportBtn"),
exportBtnTop: document.getElementById("exportBtnTop"),
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

function startNew(){
  const firstProgram = PROGRAMS[0] || "";
  const firstCourse = (COURSES[firstProgram] || [])[0] || "";
  const cc = COURSE_CONTENT[firstCourse] || {};

  return {
    id: uid(),
    program: firstProgram,
    course: firstCourse,
    title: "",                             // we don't show it any more
    description: cc.description || "",
    outline: cc.outline || "",
    textbooks: cc.textbooks || "",
    assignments: cc.assignments || "",
    hours: cc.hours || "",
    instructors: [],                       // <-- array of instructor objects
    canvas: { url: "", notes: "" },
    policies: [],                          // array of {id,title,body}
    campusRequirements: cc.campusRequirements || "",
    updatedAt: now(),
  };
}


els.newBtn.addEventListener("click", ()=>{ doc = startNew(); render(); });
els.saveBtn.addEventListener("click", async()=>{ await LocalDB.upsert(doc); alert("Saved."); });
[els.exportBtn, els.exportBtnTop].forEach(b=> b.addEventListener("click", ()=> exportPDF(doc.title||doc.course)));

// Select handlers
["year","program","course","descriptionSelect","outlineSelect","textbooksSelect","assignmentsSelect","hoursSelect","instructorSelect","canvasSelect","campusReqSelect"].forEach(id=>{
els[id].addEventListener("change", ()=>{ updateFromInputs(); render(); });
});

els.policyPicker.addEventListener("change", ()=>{/* noop */});

document.getElementById("addPolicyBtn").addEventListener("click", ()=>{
const id = els.policyPicker.value; if(!id) return;
const preset = POLICY_PRESETS.find(p=>p.id===id); if(!preset) return;
// avoid duplicates by id; allow multiple different ones
if(!doc.policies.some(p=>p.id===preset.id)) doc.policies.push(structuredClone(preset));
renderPoliciesEditor();
renderPoliciesPreview();
});

function startNew(){
const firstProgram = PROGRAMS[0]||"";
return {
id: uid(),
year: YEARS[0]||"",
program: firstProgram,
course: (COURSES[firstProgram]||[])[0]||"",
title: "",
description: "",
outline: "",
textbooks: "",
assignments: "",
hours: "",
instructor: { name:"", email:"", office:"", phone:"" },
canvas: { url:"", notes:"" },
policies: [], // array of {id,title,body}
campusRequirements: "",
updatedAt: now(),
}
}

function initOptions(){
fillSelect(els.year, YEARS.map(v=>({value:v,label:v})));
fillSelect(els.program, PROGRAMS.map(v=>({value:v,label:v})));
fillCourseOptions();
fillSelect(els.descriptionSelect, DESCRIPTION_OPTIONS.map(o=>({value:o.id,label:o.label})));
fillSelect(els.outlineSelect, OUTLINE_OPTIONS.map(o=>({value:o.id,label:o.label})));
fillSelect(els.textbooksSelect, TEXTBOOK_SETS.map(o=>({value:o.id,label:o.label})));
fillSelect(els.assignmentsSelect, ASSIGNMENT_SETS.map(o=>({value:o.id,label:o.label})));
fillSelect(els.hoursSelect, HOURS_SETS.map(o=>({value:o.id,label:o.label})));
fillSelect(els.instructorSelect, INSTRUCTORS.map(o=>({value:o.id,label:o.label})));
fillSelect(els.canvasSelect, CANVAS_OPTIONS.map(o=>({value:o.id,label:o.label})));
fillSelect(els.policyPicker, POLICY_PRESETS.map(o=>({value:o.id,label:o.title})), true);
fillSelect(els.campusReqSelect, CAMPUS_REQUIREMENTS.map(o=>({value:o.id,label:o.label})));
// default selections
[els.descriptionSelect,els.outlineSelect,els.textbooksSelect,els.assignmentsSelect,els.hoursSelect,els.instructorSelect,els.canvasSelect,els.campusReqSelect].forEach(sel=>{ if(sel.options.length) sel.value = sel.options[0].value; });
}

function fillSelect(select, options, includeEmpty=false){
select.innerHTML = (includeEmpty? `<option value="">Select…</option>` : "") + options.map(o=>`<option value="${o.value}">${o.label}</option>`).join("");
if(!includeEmpty && options[0]) select.value = options[0].value;
}

els.program.addEventListener("change", () => {
  fillCourseOptions();
  // pick first course in that program
  els.course.value = els.course.options[0]?.value || "";
  updateFromInputs();
  render();
});

function fillCourseOptions(){ const list = COURSES[els.program.value]||[]; fillSelect(els.course, list.map(v=>({value:v,label:v}))); }

function updateFromInputs(){
  doc.program = els.program.value;
  doc.course = els.course.value;

  // Populate content from COURSE_CONTENT
  const cc = COURSE_CONTENT[doc.course] || {};
  doc.description = cc.description || "";
  doc.outline = cc.outline || "";
  doc.textbooks = cc.textbooks || "";
  doc.assignments = cc.assignments || "";
  doc.hours = cc.hours || "";
  doc.campusRequirements = cc.campusRequirements || "";

  // Multiple instructors
  const selectedIds = Array.from(els.instructorSelect.selectedOptions).map(o => o.value);
  doc.instructors = INSTRUCTORS.filter(i => selectedIds.includes(i.id));

  // Canvas (still from list, single)
  const cv = CANVAS_OPTIONS.find(c => c.id === els.canvasSelect.value);
  doc.canvas = cv ? { url: cv.url, notes: cv.notes || "" } : { url: "", notes: "" };

  doc.updatedAt = now();
}

function render(){
// header block
const title = doc.title || doc.course || "Course Title";
els.pvTitle.textContent = title;
// Subhead: Program only
els.pvSubhead.textContent = `${doc.program || "Program"}`;

// Instructors list (name/email/office/phone per instructor)
els.pvInstr.innerHTML = (doc.instructors.length ? doc.instructors : [])
  .map(inst => `
    <div><strong>${escapeHtml(inst.name)}</strong></div>
    <div>${escapeHtml(inst.email)}</div>
    <div>${escapeHtml(inst.office)}</div>
    ${inst.phone ? `<div>${escapeHtml(inst.phone)}</div>` : ""}
    <div style="height:8px"></div>
  `).join("");

setBodyOrPlaceholder(els.pvDesc, doc.description, "Select a description…");
setBodyOrPlaceholder(els.pvOutline, doc.outline, "Select an outline…");
setBodyOrPlaceholder(els.pvTextbooks, doc.textbooks, "Select a set…");
setBodyOrPlaceholder(els.pvAssign, doc.assignments, "Select a set…");
// Campus Requirements — allow HTML (links, formatting)
els.pvCampus.classList.toggle("placeholder", !doc.campusRequirements);
els.pvCampus.innerHTML = doc.campusRequirements || "Select from list…";

// instructor preview
els.instrName.value = doc.instructor.name||""; els.instrEmail.value = doc.instructor.email||""; els.instrOffice.value = doc.instructor.office||""; els.instrPhone.value = doc.instructor.phone||"";
els.pvInstr.innerHTML = [doc.instructor.name, doc.instructor.email, doc.instructor.office, doc.instructor.phone].filter(Boolean).map(x=>`<div>${escapeHtml(x)}</div>`).join("");
// canvas preview
els.pvCanvas.innerHTML = [doc.canvas.url, doc.canvas.notes].filter(Boolean).map(x=>`<div>${escapeHtml(x)}</div>`).join("");
// policies UI/preview
renderPoliciesEditor();
renderPoliciesPreview();
// campus requirements
setBodyOrPlaceholder(els.pvCampus, doc.campusRequirements, "Select from list…");
}

function initOptions(){
  // ...your existing fills...
  // make instructor multi-select
  els.instructorSelect.multiple = true;
}

// Policy edit list with reorder (drag + up/down)
function renderPoliciesEditor(){
els.policies.innerHTML = "";
doc.policies.forEach((p, idx)=>{
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
// click handlers
li.querySelector('.del').addEventListener('click', ()=>{ doc.policies.splice(idx,1); renderPoliciesEditor(); renderPoliciesPreview(); });
li.querySelector('.up').addEventListener('click', ()=>{ if(idx>0){ const t=doc.policies[idx-1]; doc.policies[idx-1]=doc.policies[idx]; doc.policies[idx]=t; renderPoliciesEditor(); renderPoliciesPreview(); }});
li.querySelector('.down').addEventListener('click', ()=>{ if(idx<doc.policies.length-1){ const t=doc.policies[idx+1]; doc.policies[idx+1]=doc.policies[idx]; doc.policies[idx]=t; renderPoliciesEditor(); renderPoliciesPreview(); }});
// drag events
li.addEventListener('dragstart', e=>{ e.dataTransfer.setData('text/plain', idx); });
li.addEventListener('dragover', e=>{ e.preventDefault(); });
li.addEventListener('drop', e=>{ e.preventDefault(); const from = +e.dataTransfer.getData('text/plain'); const to = idx; if(from===to) return; const item = doc.policies.splice(from,1)[0]; doc.policies.splice(to,0,item); renderPoliciesEditor(); renderPoliciesPreview(); });
els.policies.appendChild(li);
});
}

function renderPoliciesPreview(){
els.pvPolicies.innerHTML = doc.policies.length? "" : '<div class="placeholder">Add policy sections from the list…</div>';
doc.policies.forEach((p)=>{
const div = document.createElement("div");
div.innerHTML = `<div class="b">${escapeHtml(p.title||"Policy")}</div><div>${newlineToBr(escapeHtml(p.body||""))}</div>`;
els.pvPolicies.appendChild(div);
});
}

function setBodyOrPlaceholder(el, text, ph){ el.classList.toggle("placeholder", !text); el.innerHTML = text ? newlineToBr(escapeHtml(text)) : ph; }
function escapeHtml(str=""){ return str.replace(/[&<>"']/g, s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s])); }
function newlineToBr(str=""){ return str.replace(/\n/g,"<br>"); }