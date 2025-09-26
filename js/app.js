import { LocalDB } from "./storage/local.js";
name: els.instrName.value,
email: els.instrEmail.value,
office: els.instrOffice.value,
phone: els.instrPhone.value,
};
doc.canvas = { url: els.canvasUrl.value, notes: els.canvasNotes.value };
doc.campusRequirements = els.campusReq.value;
doc.updatedAt = now();
}


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