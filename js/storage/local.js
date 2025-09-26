export const LocalDB = {
key: "syllabus_builder_v2",
async list(){
const raw = localStorage.getItem(this.key); return raw? JSON.parse(raw): [];
},
async get(id){ const all = await this.list(); return all.find(x=>x.id===id)||null; },
async upsert(doc){
const all = await this.list();
const i = all.findIndex(x=>x.id===doc.id);
if(i>=0) all[i]=doc; else all.push(doc);
localStorage.setItem(this.key, JSON.stringify(all));
return doc;
},
async remove(id){
const all = await this.list();
localStorage.setItem(this.key, JSON.stringify(all.filter(x=>x.id!==id)));
}
}