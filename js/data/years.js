export const YEARS = (()=>{
const y = new Date().getFullYear();
return [y-1, y, y+1, y+2].map(String);
})();