// Run with: node tests/tm-costs.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const code=fs.readFileSync(require('node:path').join(__dirname,'../pokemon-sv-tm-costs.js'),'utf8');
const sandbox={window:{}};
vm.runInNewContext(code,sandbox,{filename:'pokemon-sv-tm-costs.js'});
const w=sandbox.window;
assert.equal(w.POKEMON_SV_TM_AUDIT.valid,true,w.POKEMON_SV_TM_AUDIT.errors.join('\n'));
assert.equal(w.POKEMON_SV_TM_AUDIT.total,229);
assert.equal(Object.keys(w.POKEMON_SV_TM_NAMES).length,229);
assert.equal(new Set(Object.values(w.POKEMON_SV_TM_NAMES)).size,229);
for(let n=1;n<=229;n++){
 const [lp,...materials]=w.POKEMON_SV_TM_RECIPES[n];
 assert(Number.isInteger(lp)&&lp>0,'Invalid LP for TM'+n);
 assert(materials.length>=1&&materials.length<=3,'Invalid material count for TM'+n);
 assert(materials.every(x=>/^.+×[1-9]\\d*$/.test(x)),'Invalid material quantity for TM'+n);
}
assert.equal(w.POKEMON_SV_TM_RECIPES[207][0],3000);
assert.deepEqual(Array.from(w.POKEMON_SV_TM_RECIPES[207].slice(1)),['ドンメルのようがん×2','ブビィのけ×3']);
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const guide=fs.readFileSync(require('node:path').join(__dirname,'../pokemon-guide.js'),'utf8');
assert(html.includes('id="guideTmTool"')&&html.includes('pokemon-sv-tm-costs.js'));
assert(guide.includes('function renderTmCosts()')&&guide.includes("tm:'guideTmTool'"));
console.log('TM crafting data: 229/229, no structural errors; TM tab wired.');
