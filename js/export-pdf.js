export async function exportPDF(title){
const node = document.getElementById("preview");
if(!node) return;
const canvas = await html2canvas(node,{scale:2,useCORS:true});
const img = canvas.toDataURL("image/png");
const { jsPDF } = window.jspdf;
const pdf = new jsPDF({orientation:"p",unit:"pt",format:"letter"});
const pw = pdf.internal.pageSize.getWidth();
const ph = pdf.internal.pageSize.getHeight();
const iw = pw, ih = canvas.height * (iw/canvas.width);
let y=0, remaining=ih;
while(remaining>0){
pdf.addImage(img,"PNG",0,y?0:0,iw,ih);
remaining -= ph;
if(remaining>0) pdf.addPage();
y += ph;
}
pdf.save(`${title||"Syllabus"}.pdf`);
}