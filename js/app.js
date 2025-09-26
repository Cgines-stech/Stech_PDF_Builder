import { LocalDB } from "./storage/local.js";
import { exportPDF } from "./../js/export-pdf.js";
import { YEARS } from "./data/years.js";
import { PROGRAMS } from "./data/programs.js";
import { COURSES } from "./data/courses.js";
import { DEFAULT_DESCRIPTION } from "./data/course_description.js";
import { DEFAULT_OUTLINE } from "./data/course_outline.js";
import { DEFAULT_TEXTBOOKS } from "./data/textbooks.js";
import { DEFAULT_ASSIGNMENTS } from "./data/assignments.js";
import { DEFAULT_HOURS } from "./data/hours.js";
import { DEFAULT_INSTRUCTOR } from "./data/instructor.js";
import { DEFAULT_CANVAS } from "./data/canvas_info.js";
import { POLICY_PRESETS } from "./data/policies.js";
import { DEFAULT_CAMPUS_REQ } from "./data/campus_requirements.js";

const uid = ()=> Math.random().toString(36).slice(2,10);
const now = ()=> Date.now();

const els = {
year: document.getElementById("year"),
program: document.getElementById("program"),
course: document.getElementById("course"),
title: document.getElementById("title"),
description: document.getElementById("description"),
outline: document.getElementById("outline"),
textbooks: document.getElementById("textbooks"),
assignments: document.getElementById("assignments"),
hours: document.getElementById("hours"),
instrName: document.getElementById("instrName"),
instrEmail: document.getElementById("instrEmail"),
instrOffice: document.getElementById("instrOffice"),
instrPhone: document.getElementById("instrPhone"),
canvasUrl: document.getElementById("canvasUrl"),
canvasNotes: document.getElementById("canvasNotes"),
policies: document.getElementById("policies"),
addPolicyBtn: document.getElementById("addPolicyBtn"),
campusReq: document.getElementById("campusReq"),
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

let doc = startNew();
initOptions();
render();

els.newBtn.addEventListener("click", ()=>{ doc = startNew(); render(); });
els.saveBtn.addEventListener("click", async()=>{ await LocalDB.upsert(doc); alert("Saved."); });
[els.exportBtn, els.exportBtnTop].forEach(b=> b.addEventListener("click", ()=> exportPDF(doc.title||doc.course)));
// Inputs → state
for(const [key, el] of Object.entries(els)){
if(["year","program","course","title","description","outline","textbooks","assignments","hours","instrName","instrEmail","instrOffice","instrPhone","canvasUrl","canvasNotes","campusReq"].includes(key)){
el.addEventListener("input", ()=>{
updateFromInputs();
render();
})
}
}

els.addPolicyBtn.addEventListener("click", ()=>{
doc.policies.push({ id: uid(), title: "", body: "" });
renderPoliciesEditor();
renderPoliciesPreview();
});

function startNew(){
return {
id: uid(),
year: YEARS[0]||"",
program: PROGRAMS[0]||"",
course: (COURSES[PROGRAMS[0]]||[])[0]||"",
title: "",
description: DEFAULT_DESCRIPTION,
outline: DEFAULT_OUTLINE,
textbooks: DEFAULT_TEXTBOOKS,
assignments: DEFAULT_ASSIGNMENTS,
hours: DEFAULT_HOURS,
instructor: { ...DEFAULT_INSTRUCTOR },
canvas: { ...DEFAULT_CANVAS },
policies: [],
campusRequirements: DEFAULT_CAMPUS_REQ,
updatedAt: now(),
}
}

function initOptions(){
fillSelect(els.year, YEARS);
fillSelect(els.program, PROGRAMS);
fillCourseOptions();
}

function fillSelect(select, options){
select.innerHTML = options.map(v=>`<option value="${v}">${v}</option>`).join("");
select.value = options[0]||"";
}

els.program.addEventListener("change", ()=>{
fillCourseOptions();
updateFromInputs();
render();
});

function render(){
// editors
els.year.value = doc.year; els.program.value = doc.program; fillCourseOptions(); els.course.value = doc.course;
els.title.value = doc.title||"";
els.description.value = doc.description||"";
els.outline.value = doc.outline||"";
els.textbooks.value = doc.textbooks||"";
els.assignments.value = doc.assignments||"";
els.hours.value = doc.hours||"";
els.instrName.value = doc.instructor.name||"";
els.instrEmail.value = doc.instructor.email||"";
els.instrOffice.value = doc.instructor.office||"";
els.instrPhone.value = doc.instructor.phone||"";
els.canvasUrl.value = doc.canvas.url||"";
els.canvasNotes.value = doc.canvas.notes||"";
els.campusReq.value = doc.campusRequirements||"";
renderPoliciesEditor();


// preview
const title = doc.title || doc.course || "Course Title";
els.pvTitle.textContent = title;
els.pvSubhead.textContent = `${doc.program||"Program"} • ${doc.year||"Year"}`;
setBodyOrPlaceholder(els.pvDesc, doc.description, "Add a short description…");
setBodyOrPlaceholder(els.pvOutline, doc.outline, "Week-by-week outline…");
setBodyOrPlaceholder(els.pvTextbooks, doc.textbooks, "Primary texts, ISBNs…");
setBodyOrPlaceholder(els.pvAssign, doc.assignments, "Breakdown & weights…");
setBodyOrPlaceholder(els.pvHours, doc.hours, "Meeting times, credits…");
els.pvInstr.innerHTML = [doc.instructor.name, doc.instructor.email, doc.instructor.office, doc.instructor.phone].filter(Boolean).map(x=>`<div>${escapeHtml(x)}</div>`).join("");
els.pvCanvas.innerHTML = [doc.canvas.url, doc.canvas.notes].filter(Boolean).map(x=>`<div>${escapeHtml(x)}</div>`).join("");
renderPoliciesPreview();
setBodyOrPlaceholder(els.pvCampus, doc.campusRequirements, "Institutional statements…");
}


function renderPoliciesEditor(){
els.policies.innerHTML = "";
doc.policies.forEach((p)=>{
const wrap = document.createElement("div");
wrap.className = "policyEdit";
wrap.innerHTML = `
<input class="polTitle" placeholder="Policy title" value="${escapeAttr(p.title)}" />
<textarea class="polBody" rows="3" placeholder="Policy details">${escapeHtml(p.body)}</textarea>
<button class="delete secondary">Delete</button>
`;
const t = wrap.querySelector(".polTitle");
const b = wrap.querySelector(".polBody");
const d = wrap.querySelector(".delete");
t.addEventListener("input", ()=>{ p.title = t.value; renderPoliciesPreview(); });
b.addEventListener("input", ()=>{ p.body = b.value; renderPoliciesPreview(); });
d.addEventListener("click", ()=>{ doc.policies = doc.policies.filter(x=>x!==p); render(); });
els.policies.appendChild(wrap);
});
}


function renderPoliciesPreview(){
els.pvPolicies.innerHTML = doc.policies.length? "" : '<div class="placeholder">Add policy sections like Attendance, Late Work…</div>';
doc.policies.forEach((p)=>{
const div = document.createElement("div");
div.innerHTML = `<div class="b">${escapeHtml(p.title||"Policy")}</div><div>${newlineToBr(escapeHtml(p.body||""))}</div>`;
els.pvPolicies.appendChild(div);
});
}


function setBodyOrPlaceholder(el, text, ph){
el.classList.toggle("placeholder", !text);
el.innerHTML = text ? newlineToBr(escapeHtml(text)) : ph;
}


function escapeHtml(str=""){ return str.replace(/[&<>"']/g, s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s])); }
function escapeAttr(str=""){ return str.replace(/"/g,'&quot;'); }
function newlineToBr(str=""){ return str.replace(/\n/g,"<br>"); }