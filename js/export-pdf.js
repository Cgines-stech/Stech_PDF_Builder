export async function exportPDF(title){
const node = document.getElementById("preview");
if(!node) return;
const canvas = await html2canvas(node,{scale:2,useCORS:true,backgroundColor:'#ffffff'});
const img = canvas.toDataURL("image/png");
const { jsPDF } = window.jspdf;
const pdf = new jsPDF({orientation:"p",unit:"pt",format:"letter"});
const pageW = pdf.internal.pageSize.getWidth();
const pageH = pdf.internal.pageSize.getHeight();
const imgW = pageW; const imgH = (canvas.height * imgW) / canvas.width;
const pages = Math.max(1, Math.ceil(imgH / pageH));
for(let i=0;i<pages;i++){
if(i>0) pdf.addPage();
const y = -i * pageH;
pdf.addImage(img, 'PNG', 0, y, imgW, imgH);
}
pdf.save(`${(title||'Syllabus').replace(/\s+/g,'_')}.pdf`);
}